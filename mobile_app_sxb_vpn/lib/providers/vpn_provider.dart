import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/demo_data.dart';
import '../models/server_model.dart';
import '../models/vpn_config_model.dart';
import '../services/vpn_service.dart';

enum VpnStatus { disconnected, connecting, connected }

class VpnState {
  final VpnStatus status;
  final ServerModel? currentServer;
  final VpnConfigModel? config;
  final Duration connectedDuration;
  final double downloadSpeed;
  final double uploadSpeed;
  final List<VpnConfigModel> availableProfiles;

  const VpnState({
    this.status = VpnStatus.disconnected,
    this.currentServer,
    this.config,
    this.connectedDuration = Duration.zero,
    this.downloadSpeed = 0,
    this.uploadSpeed = 0,
    this.availableProfiles = const [],
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
  }) {
    return VpnState(
      status:            status            ?? this.status,
      currentServer:     currentServer     ?? this.currentServer,
      config:            config            ?? this.config,
      connectedDuration: connectedDuration ?? this.connectedDuration,
      downloadSpeed:     downloadSpeed     ?? this.downloadSpeed,
      uploadSpeed:       uploadSpeed       ?? this.uploadSpeed,
      availableProfiles: availableProfiles ?? this.availableProfiles,
    );
  }
}

class VpnNotifier extends StateNotifier<VpnState> {
  final VpnService _vpnService;
  VpnNotifier(this._vpnService) : super(const VpnState());

  int _generation = 0;
  Timer? _timer;
  DateTime? _connectedAt;
  int? _rxBytesAtConnect;
  int? _txBytesAtConnect;

  // ── Public API ──────────────────────────────────────────────────────────────

  Future<void> loadProfiles() async {
    final result = await _vpnService.getMobileConfig();
    if (result != null) {
      state = state.copyWith(availableProfiles: result.profiles);
    }
  }

  Future<void> connect({ServerModel? server}) async {
    final generation = ++_generation;

    // Fetch config from backend
    state = state.copyWith(status: VpnStatus.connecting, currentServer: server);
    final result = await _vpnService.getMobileConfig();

    if (generation != _generation) return;

    final profile = result?.profiles.firstOrNull;

    // Simulate a 600ms handshake
    await Future<void>.delayed(const Duration(milliseconds: 600));
    if (generation != _generation) return;

    _connectedAt = DateTime.now();
    _startTimer();

    state = state.copyWith(
      status:            VpnStatus.connected,
      currentServer:     server ?? (demoServers.isNotEmpty ? demoServers.first : null),
      config:            profile,
      availableProfiles: result?.profiles ?? state.availableProfiles,
      downloadSpeed:     0,
      uploadSpeed:       0,
    );

    // Log CONNECT event
    _vpnService.postConnectionLog(
      event:    'CONNECT',
      protocol: profile?.protocolLabel,
      server:   profile?.host,
    ).ignore();
  }

  Future<void> disconnect() async {
    final wasConnected = state.isConnected;
    final duration     = _connectedAt != null
        ? DateTime.now().difference(_connectedAt!).inSeconds
        : 0;
    final protocol     = state.config?.protocolLabel;
    final server       = state.config?.host;

    _generation++;
    _stopTimer();
    _connectedAt = null;
    state = const VpnState(status: VpnStatus.disconnected);

    if (wasConnected) {
      _vpnService.postConnectionLog(
        event:    'DISCONNECT',
        protocol: protocol,
        server:   server,
        duration: duration,
      ).ignore();
    }
  }

  Future<void> toggle() async {
    if (state.isConnected || state.isConnecting) {
      await disconnect();
    } else {
      await connect(server: state.currentServer);
    }
  }

  // ── Timer ─────────────────────────────────────────────────────────────────

  void _startTimer() {
    _stopTimer();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      final elapsed = _connectedAt != null
          ? DateTime.now().difference(_connectedAt!)
          : state.connectedDuration + const Duration(seconds: 1);
      state = state.copyWith(connectedDuration: elapsed);
    });
  }

  void _stopTimer() {
    _timer?.cancel();
    _timer = null;
  }

  @override
  void dispose() {
    _stopTimer();
    super.dispose();
  }
}

final vpnProvider = StateNotifierProvider<VpnNotifier, VpnState>((ref) {
  return VpnNotifier(ref.watch(vpnServiceProvider));
});

