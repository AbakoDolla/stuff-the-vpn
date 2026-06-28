import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/server_model.dart';
import '../services/vpn_service.dart';

final serversProvider = FutureProvider<List<ServerModel>>((ref) async {
  final vpnService = ref.read(vpnServiceProvider);
  final servers = await vpnService.getServers();
  return servers;
});

final recommendedServerProvider = FutureProvider<ServerModel?>((ref) async {
  final vpnService = ref.read(vpnServiceProvider);
  final server = await vpnService.getRecommendedServer();
  return server;
});

final vpnStatusProvider = FutureProvider<Map<String, dynamic>?>((ref) async {
  final vpnService = ref.read(vpnServiceProvider);
  return vpnService.getVpnStatus();
});