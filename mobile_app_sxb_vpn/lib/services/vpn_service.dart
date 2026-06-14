import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/network/api_client.dart';
import '../core/network/endpoints.dart';
import '../models/vpn_config_model.dart';

final vpnServiceProvider = Provider<VpnService>((ref) {
  return VpnService(ref.watch(apiClientProvider));
});

class VpnService {
  final ApiClient _api;
  VpnService(this._api);

  Future<VpnConfigModel?> getMyConfig() async {
    try {
      final response = await _api.get(ApiEndpoints.myConfig);
      final data = response.data;
      if (data is Map<String, dynamic>) {
        return VpnConfigModel.fromJson(data['config'] as Map<String, dynamic>? ?? data);
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<List<ServerModel>> getServers() async {
    try {
      final response = await _api.get(ApiEndpoints.servers);
      final data = response.data;
      if (data is List) {
        return data.map((s) => ServerModel.fromJson(s as Map<String, dynamic>)).toList();
      }
      return demoServers;
    } catch (_) {
      return demoServers;
    }
  }
}
