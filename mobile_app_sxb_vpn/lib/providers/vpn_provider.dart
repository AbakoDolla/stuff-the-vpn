import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/demo_data.dart';
import '../models/server_model.dart';
import '../models/vpn_config_model.dart';

enum VpnStatus { disconnected, connecting, connected }

class VpnState {
  final VpnStatus status;
  final ServerModel? currentServer;
  final VpnConfigModel? config;
  final Duration connectedDuration;
  final double downloadSpeed;
  final double uploadSpeed;

  const VpnState({
    this.status = VpnStatus.disconnected,
    this.currentServer,
    this.config,
    this.connectedDuration = Duration.zero,
    this.downloadSpeed = 0,
    this.uploadSpeed = 0,
  });

  bool get isConnected => status == VpnStatus.connected;
  bool get isConnecting => status == VpnStatus.connecting;

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
  VpnNotifier() : super(const VpnState());

  Future<void> connect({required ServerModel server}) async {
    state = state.copyWith(
      status: VpnStatus.connecting,
      currentServer: server,
    );
    await Future<void>.delayed(const Duration(milliseconds: 600));
    state = state.copyWith(
      status: VpnStatus.connected,
      currentServer: server,
    );
  }

  Future<void> disconnect() async {
    state = const VpnState(status: VpnStatus.disconnected);
  }

  Future<void> toggle() async {
    if (state.isConnected || state.isConnecting) {
      await disconnect();
    } else {
      await connect(server: state.currentServer ?? demoServers.first);
    }
  }
}

final vpnProvider = StateNotifierProvider<VpnNotifier, VpnState>((ref) {
  return VpnNotifier();
});
