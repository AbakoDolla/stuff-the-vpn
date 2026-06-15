import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/demo_data.dart';
import '../models/server_model.dart';

class VpnState {
  final bool isConnected;
  final ServerModel? server;

  VpnState({this.isConnected = false, this.server});

VpnState copyWith({
    bool? isConnected,
    ServerModel? server,
  }) {
    return VpnState(
      isConnected: isConnected ?? this.isConnected,
      server: server ?? this.server,
    );
  }

  ServerModel? get currentServer => server;
}

class VpnNotifier extends StateNotifier<VpnState> {
  VpnNotifier() : super(VpnState());

  Future<void> connect({required ServerModel server}) async {
    // TODO: Implement VPN connection
    state = state.copyWith(isConnected: true, server: server);
  }

  Future<void> disconnect() async {
    // TODO: Implement VPN disconnection
    state = state.copyWith(isConnected: false, server: null);
  }
}

final vpnProvider = StateNotifierProvider<VpnNotifier, VpnState>((ref) {
  return VpnNotifier();
});
