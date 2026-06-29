import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/vpn_service.dart';

final connectionLogsProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final vpnService = ref.read(vpnServiceProvider);
  return vpnService.getConnectionLogs(limit: 50);
});
