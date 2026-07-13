import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/server_model.dart';
import '../models/vpn_config_model.dart';
import '../services/vpn_service.dart';
import '../core/vpn/v2ray_engine.dart';
import '../core/vpn/openvpn_engine.dart';
import '../core/vpn/vpn_link_builder.dart';

enum VpnStatus {
  disconnected,
  connecting,
  connected,
  permissionDenied,
  unsupportedProtocol,
  noServerAvailable,
  error,
}

class VpnState {
  final VpnStatus status;
  final ServerModel? currentServer;
  final VpnConfigModel? config;
  final Duration connectedDuration;
  final double downloadSpeed; // bytes/sec
  final double uploadSpeed;   // bytes/sec
  final List<VpnConfigModel> availableProfiles;
  final String? errorMessage;

  const VpnState({
    this.status = VpnStatus.disconnected,
    this.currentServer,
    this.config,
    this.connectedDuration = Duration.zero,
    this.downloadSpeed = 0,
    this.uploadSpeed = 0,
    this.availableProfiles = const [],
    this.errorMessage,
  });

  bool get isConnected  => status == VpnStatus.connected;
  bool get isConnecting => status == VpnStatus.connecting;
  ServerModel? get server => currentServer;

  VpnState copyWith({
    VpnStatus? status,
    ServerModel? currentServer,
    VpnConfigModel? config,
    Duration? connectedDuration,
    double? downloadSpeed,
    double? uploadSpeed,
    List<VpnConfigModel>? availableProfiles,
    String? errorMessage,
  }) {
    return VpnState(
      status:            status            ?? this.status,
      currentServer:     currentServer     ?? this.currentServer,
      config:            config            ?? this.config,
      connectedDuration: connectedDuration ?? this.connectedDuration,
      downloadSpeed:     downloadSpeed     ?? this.downloadSpeed,
      uploadSpeed:       uploadSpeed       ?? this.uploadSpeed,
      availableProfiles: availableProfiles ?? this.availableProfiles,
      errorMessage:      errorMessage,
    );
  }
}

/// Enum des types de moteur VPN disponibles
enum VpnEngineType { v2ray, openvpn }

class VpnNotifier extends StateNotifier<VpnState> {
  final VpnService _vpnService;
  final V2RayEngine _v2rayEngine = V2RayEngine.instance;
  final OpenVpnEngine _openvpnEngine = OpenVpnEngine.instance;
  StreamSubscription<RealVpnStatus>? _v2raySub;
  StreamSubscription<RealVpnStatus>? _openvpnSub;
  DateTime? _connectedAt;
  VpnEngineType? _activeEngine;

  VpnNotifier(this._vpnService) : super(const VpnState()) {
    _v2raySub = _v2rayEngine.statusStream.listen((s) => _onEngineStatus(s, VpnEngineType.v2ray));
    _openvpnSub = _openvpnEngine.statusStream.listen((s) => _onEngineStatus(s, VpnEngineType.openvpn));
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  Future<void> loadProfiles() async {
    final result = await _vpnService.getMobileConfig();
    if (result != null) {
      state = state.copyWith(availableProfiles: result.profiles);
    }
  }

  /// Choisit le meilleur profil disponible parmi les inbounds actifs
  /// (priorité aux protocoles supportés nativement par le tunnel réel).
  VpnConfigModel? _pickProfile(List<VpnConfigModel> profiles, ServerModel? server) {
    final candidates = server != null
        ? profiles.where((p) => p.host == server.host || p.remark == server.name).toList()
        : profiles;
    final pool = candidates.isNotEmpty ? candidates : profiles;

    // Priorité : protocoles avec tunnel réel disponible
    final supported = pool.where((p) => isProtocolSupported(p.protocol)).toList();
    if (supported.isNotEmpty) return supported.first;

    // Sinon, retourne le premier quand même (pour affichage du message
    // "protocole non supporté" avec le bon nom de protocole)
    return pool.isNotEmpty ? pool.first : null;
  }

  Future<void> connect({ServerModel? server}) async {
    state = state.copyWith(status: VpnStatus.connecting, currentServer: server, errorMessage: null);

    final result = await _vpnService.getMobileConfig();
    final profiles = result?.profiles ?? state.availableProfiles;

    if (profiles.isEmpty) {
      state = state.copyWith(
        status: VpnStatus.noServerAvailable,
        errorMessage: 'Aucun serveur disponible actuellement',
      );
      return;
    }

    final profile = _pickProfile(profiles, server);
    if (profile == null) {
      state = state.copyWith(
        status: VpnStatus.noServerAvailable,
        errorMessage: 'Aucun serveur disponible actuellement',
      );
      return;
    }

    state = state.copyWith(config: profile, availableProfiles: profiles);

    // Détermine le type de protocole et connecte avec le bon moteur
    final protocol = profile.protocol.toUpperCase();
    
    if (protocol == 'OPENVPN') {
      // OpenVPN via OpenVpnEngine
      _activeEngine = VpnEngineType.openvpn;
      if (profile.ovpnConfig != null && profile.ovpnConfig!.isNotEmpty) {
        await _openvpnEngine.connect(
          ovpnConfig: profile.ovpnConfig!,
          remark: profile.remark,
        );
      } else {
        // Génère la config OpenVPN basique
        final ovpnConfig = _generateOpenVpnConfig(profile);
        await _openvpnEngine.connect(
          ovpnConfig: ovpnConfig,
          remark: profile.remark,
        );
      }
    } else if (protocol == 'WIREGUARD') {
      // WireGuard - retourne non supporté pour l'instant
      // (nécessite axevpn_flutter avec config WireGuard spécifique)
      state = state.copyWith(
        status: VpnStatus.unsupportedProtocol,
        errorMessage: 'Le protocole WireGuard sera disponible dans une prochaine mise à jour.',
      );
    } else if (protocol == 'SSH' || protocol == 'SSH_TLS' || protocol == 'SSH_SLOWDNS') {
      // SSH tunnels - retourne non supporté pour l'instant
      state = state.copyWith(
        status: VpnStatus.unsupportedProtocol,
        errorMessage: 'Le protocole SSH sera disponible dans une prochaine mise à jour.',
      );
    } else {
      // VLESS, VMess, Trojan, Shadowsocks via V2Ray
      _activeEngine = VpnEngineType.v2ray;
      final shareLink = buildShareLink(profile);
      if (shareLink == null) {
        state = state.copyWith(
          status: VpnStatus.unsupportedProtocol,
          errorMessage: 'Le protocole ${profile.protocolLabel} n\'est pas encore pris en charge.',
        );
        return;
      }
      await _v2rayEngine.connect(
        shareLink: shareLink,
        remark: profile.remark,
      );
    }
  }

  /// Génère une config OpenVPN basique à partir du profil
  String _generateOpenVpnConfig(VpnConfigModel c) {
    return '''
client
dev tun
proto tcp
remote ${c.host} ${c.port}
resolv-retry infinite
nobind
persist-key
persist-tun
cipher AES-256-GCM
auth SHA256
verb 3
''';
  }

  Future<void> disconnect() async {
    if (_activeEngine == VpnEngineType.openvpn) {
      await _openvpnEngine.disconnect();
    } else {
      await _v2rayEngine.disconnect();
    }
  }

  Future<void> toggle() async {
    if (state.isConnected || state.isConnecting) {
      await disconnect();
    } else {
      await connect(server: state.currentServer);
    }
  }

  // ── Réception du statut réel émis par le moteur natif ────────────────────────

  void _onEngineStatus(RealVpnStatus s, VpnEngineType engine) {
    if (!mounted) return;

    switch (s.state) {
      case RealVpnState.connecting:
        state = state.copyWith(status: VpnStatus.connecting);
        break;

      case RealVpnState.connected:
        _connectedAt ??= DateTime.now();
        state = state.copyWith(
          status: VpnStatus.connected,
          connectedDuration: s.duration,
          uploadSpeed: s.uploadSpeedBps.toDouble(),
          downloadSpeed: s.downloadSpeedBps.toDouble(),
        );
        break;

      case RealVpnState.disconnected:
        final wasConnected = state.isConnected;
        final duration = _connectedAt != null
            ? DateTime.now().difference(_connectedAt!).inSeconds
            : 0;
        _connectedAt = null;
        state = VpnState(
          status: VpnStatus.disconnected,
          availableProfiles: state.availableProfiles,
        );
        if (wasConnected) {
          _vpnService.postConnectionLog(
            event:    'DISCONNECT',
            protocol: state.config?.protocolLabel,
            server:   state.config?.host,
            duration: duration,
          ).ignore();
        }
        break;

      case RealVpnState.permissionDenied:
        state = state.copyWith(
          status: VpnStatus.permissionDenied,
          errorMessage: s.errorMessage ?? 'Permission VPN refusée',
        );
        break;

      case RealVpnState.error:
        state = state.copyWith(
          status: VpnStatus.error,
          errorMessage: s.errorMessage ?? 'Erreur de connexion VPN',
        );
        break;
    }

    if (s.state == RealVpnState.connected) {
      _vpnService.postConnectionLog(
        event:    'CONNECT',
        protocol: state.config?.protocolLabel,
        server:   state.config?.host,
      ).ignore();
    }
  }

  @override
  void dispose() {
    _v2raySub?.cancel();
    _openvpnSub?.cancel();
    super.dispose();
  }
}

final vpnProvider = StateNotifierProvider<VpnNotifier, VpnState>((ref) {
  return VpnNotifier(ref.watch(vpnServiceProvider));
});
