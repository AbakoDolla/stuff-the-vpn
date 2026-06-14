import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/vpn_config_model.dart';
import '../services/vpn_service.dart';

enum VpnStatus { disconnected, connecting, connected }

class VpnState {
  final VpnStatus status;
  final ServerModel? currentServer;
  final Duration connectedDuration;
  final double downloadSpeed;
  final double uploadSpeed;
  final VpnConfigModel? config;

  const VpnState({
    this.status = VpnStatus.disconnected,
    this.currentServer,
    this.connectedDuration = Duration.zero,
    this.downloadSpeed = 0,
    this.uploadSpeed = 0,
    this.config,
  });

  bool get isConnected => status == VpnStatus.connected;
  bool get isConnecting => status == VpnStatus.connecting;

  VpnState copyWith({
    VpnStatus? status,
    ServerModel? currentServer,
    Duration? connectedDuration,
    double? downloadSpeed,
    double? uploadSpeed,
    VpnConfigModel? config,
  }) {
    return VpnState(
      status: status ?? this.status,
      currentServer: currentServer ?? this.currentServer,
      connectedDuration: connectedDuration ?? this.connectedDuration,
      downloadSpeed: downloadSpeed ?? this.downloadSpeed,
      uploadSpeed: uploadSpeed ?? this.uploadSpeed,
      config: config ?? this.config,
    );
  }
}

class VpnNotifier extends Notifier<VpnState> {
  Timer? _timer;

  @override
  VpnState build() => const VpnState();

  Future<void> toggle() async {
    if (state.isConnected) {
      await disconnect();
    } else {
      await connect();
    }
  }

  Future<void> connect({ServerModel? server}) async {
    state = state.copyWith(status: VpnStatus.connecting, currentServer: server ?? demoServers.first);
    await Future.delayed(const Duration(seconds: 2));
    final vpnService = ref.read(vpnServiceProvider);
    final config = await vpnService.getMyConfig();
    state = state.copyWith(
      status: VpnStatus.connected,
      config: config,
      downloadSpeed: 12.4,
      uploadSpeed: 4.6,
    );
    _startTimer();
    _simulateStats();
  }

  Future<void> disconnect() async {
    _timer?.cancel();
    state = const VpnState();
  }

  void _startTimer() {
    _timer?.cancel();
    var seconds = 0;
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      seconds++;
      state = state.copyWith(connectedDuration: Duration(seconds: seconds));
    });
  }

  void _simulateStats() {
    Timer.periodic(const Duration(seconds: 3), (t) {
      if (!state.isConnected) { t.cancel(); return; }
      state = state.copyWith(
        downloadSpeed: 8 + (DateTime.now().millisecond % 10).toDouble(),
        uploadSpeed: 2 + (DateTime.now().millisecond % 5).toDouble(),
      );
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}

final vpnProvider = NotifierProvider<VpnNotifier, VpnState>(() => VpnNotifier());

final serversProvider = FutureProvider<List<ServerModel>>((ref) async {
  final vpnService = ref.watch(vpnServiceProvider);
  return vpnService.getServers();
});
