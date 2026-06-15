import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/server_model.dart';
import '../models/vpn_config_model.dart';

class VpnState {
  final bool isConnected;
  final bool isConnecting;
  final ServerModel? server;
  final VpnConfigModel? config;
  final String status;
  final Duration connectedDuration;
  final double downloadSpeed;
  final double uploadSpeed;

  const VpnState({
    this.isConnected = false,
    this.isConnecting = false,
    this.server,
    this.config,
    this.status = 'disconnected',
    this.connectedDuration = Duration.zero,
    this.downloadSpeed = 0,
    this.uploadSpeed = 0,
  });

  VpnState copyWith({
    bool? isConnected,
    bool? isConnecting,
    ServerModel? server,
    VpnConfigModel? config,
    String? status,
    Duration? connectedDuration,
    double? downloadSpeed,
    double? uploadSpeed,
  }) {
    return VpnState(
      isConnected: isConnected ?? this.isConnected,
      isConnecting: isConnecting ?? this.isConnecting,
      server: server ?? this.server,
      config: config ?? this.config,
      status: status ?? this.status,
      connectedDuration: connectedDuration ?? this.connectedDuration,
      downloadSpeed: downloadSpeed ?? this.downloadSpeed,
      uploadSpeed: uploadSpeed ?? this.uploadSpeed,
    );
  }

  ServerModel? get currentServer => server;
}

class VpnNotifier extends StateNotifier<VpnState> {
  Timer? _timer;

  VpnNotifier() : super(const VpnState());

  Future<void> connect({required ServerModel server}) async {
    state = state.copyWith(
      isConnecting: true,
      status: 'connecting',
      server: server,
    );

    // Simulate connection
    await Future.delayed(const Duration(seconds: 2));

    state = state.copyWith(
      isConnected: true,
      isConnecting: false,
      status: 'connected',
      connectedDuration: Duration.zero,
      downloadSpeed: 12.5,
      uploadSpeed: 3.2,
    );

    _startTimer();
  }

  Future<void> disconnect() async {
    _timer?.cancel();
    state = state.copyWith(
      isConnected: false,
      isConnecting: false,
      status: 'disconnected',
      server: null,
      connectedDuration: Duration.zero,
      downloadSpeed: 0,
      uploadSpeed: 0,
    );
  }

  Future<void> toggle({ServerModel? server}) async {
    if (state.isConnected || state.isConnecting) {
      await disconnect();
    } else if (server != null) {
      await connect(server: server);
    }
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (state.isConnected) {
        state = state.copyWith(
          connectedDuration: state.connectedDuration + const Duration(seconds: 1),
        );
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}

final vpnProvider = StateNotifierProvider<VpnNotifier, VpnState>((ref) {
  return VpnNotifier();
});
