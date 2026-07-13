import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/server_model.dart';
import '../models/vpn_config_model.dart';
import '../services/vpn_service.dart';
import '../core/vpn/v2ray_engine.dart';
import '../core/vpn/vpn_link_builder.dart';

// Unified VPN state enum
enum UnifiedVpnState { disconnected, connecting, connected, permissionDenied, error }

// Unified VPN status model
class UnifiedVpnStatus {
  final UnifiedVpnState state;
  final int uploadSpeedBps;
  final int downloadSpeedBps;
  final Duration duration;
  final String? errorMessage;

  const UnifiedVpnStatus({
    this.state = UnifiedVpnState.disconnected,
    this.uploadSpeedBps = 0,
    this.downloadSpeedBps = 0,
    this.duration = Duration.zero,
    this.errorMessage,
  });
}

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

class VpnNotifier extends StateNotifier<VpnState> {
  final VpnService _vpnService;
  final V2RayEngine _engine = V2RayEngine.instance;
  StreamSubscription<RealVpnStatus>? _engineSub;
  DateTime? _connectedAt;

  VpnNotifier(this._vpnService) : super(const VpnState()) {
    _engineSub = _engine.statusStream.listen(_onEngineStatus);
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  Future<void> loadProfiles() async {
    final result = await _vpnService.getMobileConfig();
    if (result != null) {
      state = state.copyWith(availableProfiles: result.profiles);
    }
  }

  /// Choisit le meilleur profil disponible parmi les inbounds actifs
  VpnConfigModel? _pickProfile(List<VpnConfigModel> profiles, ServerModel? server) {
    final candidates = server != null
        ? profiles.where((p) => 
            p.host.toLowerCase().contains(server.country.toLowerCase()) ||
            p.host.toLowerCase().contains(server.city.toLowerCase())).toList()
        : profiles;
    final pool = candidates.isNotEmpty ? candidates : profiles;

    final supported = pool.where((p) => isProtocolSupported(p.protocol)).toList();
    if (supported.isNotEmpty) return supported.first;
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

    final shareLink = buildShareLink(profile);
    if (shareLink == null) {
      state = state.copyWith(
        status: VpnStatus.unsupportedProtocol,
        config: profile,
        availableProfiles: profiles,
        errorMessage: 'Le protocole ${profile.protocolLabel} n\'est pas encore pris en charge.',
      );
      return;
    }

    state = state.copyWith(config: profile, availableProfiles: profiles);

    await _engine.connect(shareLink: shareLink, remark: profile.remark);
  }

  Future<void> disconnect() async {
    await _engine.disconnect();
  }

  Future<void> toggle() async {
    if (state.isConnected || state.isConnecting) {
      await disconnect();
    } else {
      await connect(server: state.currentServer);
    }
  }

  // ── Status handlers ──────────────────────────────────────────────────────────

  void _onEngineStatus(RealVpnStatus s) {
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
        _vpnService.postConnectionLog(
          event:    'CONNECT',
          protocol: state.config?.protocolLabel,
          server:   state.config?.host,
        ).ignore();
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
  }

  @override
  void dispose() {
    _engineSub?.cancel();
    super.dispose();
  }
}

final vpnProvider = StateNotifierProvider<VpnNotifier, VpnState>((ref) {
  return VpnNotifier(ref.watch(vpnServiceProvider));
});
