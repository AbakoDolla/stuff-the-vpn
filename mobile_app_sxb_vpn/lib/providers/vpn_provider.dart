import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/demo_data.dart';
import '../models/server_model.dart';
import '../models/vpn_config_model.dart';
import '../services/vpn_service.dart';

enum VpnStatus { disconnected, connecting, connected, disconnecting }

class VpnState {
  final VpnStatus status;
  final ServerModel? currentServer;
  final VpnConfigModel? config;
  final Duration connectedDuration;
  final double downloadSpeed;
  final double uploadSpeed;

  VpnState({
    this.status = VpnStatus.disconnected,
    this.currentServer,
    this.config,
    this.connectedDuration = Duration.zero,
    this.downloadSpeed = 0.0,
    this.uploadSpeed = 0.0,
  });

  bool get isConnected => status == VpnStatus.connected;
  bool get isConnecting => status == VpnStatus.connecting;
  bool get isDisconnected => status == VpnStatus.disconnected;
  ServerModel? get server => currentServer;

  VpnState copyWith({
    VpnStatus? status,
    ServerModel? currentServer,
    VpnConfigModel? config,
    Duration? connectedDuration,
    double? downloadSpeed,
    double? uploadSpeed,
  }) {
    return VpnState(
      status: status ?? this.status,
      currentServer: currentServer ?? this.currentServer,
      config: config ?? this.config,
      connectedDuration: connectedDuration ?? this.connectedDuration,
      downloadSpeed: downloadSpeed ?? this.downloadSpeed,
      uploadSpeed: uploadSpeed ?? this.uploadSpeed,
    );
  }
}

class VpnNotifier extends StateNotifier<VpnState> {
  final VpnService _vpnService;
  Timer? _timer;
  Timer? _speedTimer;

  VpnNotifier(this._vpnService) : super(VpnState()) {
    // Set a default server if none selected
    if (state.currentServer == null && demoServers.isNotEmpty) {
      state = state.copyWith(currentServer: demoServers.first);
    }
  }

  Future<void> toggle() async {
    if (state.isConnected) {
      await disconnect();
    } else {
      await connect();
    }
  }

  Future<void> connect({ServerModel? server}) async {
    if (state.status != VpnStatus.disconnected) return;

    if (server != null) {
      state = state.copyWith(currentServer: server);
    }

    state = state.copyWith(status: VpnStatus.connecting);

    try {
      // Fetch real config from API
      final config = await _vpnService.getMyConfig();

      // Simulate connection delay for UI feel
      await Future.delayed(const Duration(seconds: 2));

      state = state.copyWith(
        status: VpnStatus.connected,
        config: config,
        connectedDuration: Duration.zero,
      );

      _startTimer();
      _startSpeedSimulation();
    } catch (e) {
      state = state.copyWith(status: VpnStatus.disconnected);
    }
  }

  Future<void> disconnect() async {
    if (state.status != VpnStatus.connected) return;

    state = state.copyWith(status: VpnStatus.disconnecting);

    // Simulate disconnection delay
    await Future.delayed(const Duration(milliseconds: 800));

    _timer?.cancel();
    _speedTimer?.cancel();

    state = state.copyWith(
      status: VpnStatus.disconnected,
      connectedDuration: Duration.zero,
      downloadSpeed: 0,
      uploadSpeed: 0,
    );
  }

  void selectServer(ServerModel server) {
    if (state.status == VpnStatus.disconnected) {
      state = state.copyWith(currentServer: server);
    }
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      state = state.copyWith(
        connectedDuration: state.connectedDuration + const Duration(seconds: 1),
      );
    });
  }

  void _startSpeedSimulation() {
    _speedTimer?.cancel();
    _speedTimer = Timer.periodic(const Duration(seconds: 2), (timer) {
      if (!state.isConnected) {
        timer.cancel();
        return;
      }
      // In a real app, this would come from the VPN tunnel stats
      final random = DateTime.now().millisecond;
      state = state.copyWith(
        downloadSpeed: 10 + (random % 50).toDouble(),
        uploadSpeed: 2 + (random % 10).toDouble(),
      );
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _speedTimer?.cancel();
    super.dispose();
  }
}

final vpnProvider = StateNotifierProvider<VpnNotifier, VpnState>((ref) {
  return VpnNotifier(ref.watch(vpnServiceProvider));
});
