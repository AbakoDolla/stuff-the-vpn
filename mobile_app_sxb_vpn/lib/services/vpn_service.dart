import 'package:flutter_riverpod/flutter_riverpod.dart';
  import '../core/demo_data.dart';
  import '../core/network/api_client.dart';
  import '../core/network/endpoints.dart';
  import '../models/server_model.dart';
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
        final json = response.data as Map<String, dynamic>;
        final payload = (json['data'] as Map<String, dynamic>?) ?? json;
        return VpnConfigModel.fromJson(payload);
      } catch (_) {
        return null;
      }
    }

    Future<List<ServerModel>> getServers() async {
      try {
        final response = await _api.get(ApiEndpoints.servers);
        final json = response.data as Map<String, dynamic>;
        final list = json['data'] as List? ?? [];
        if (list.isNotEmpty) {
          return list
              .map((s) => ServerModel.fromJson(s as Map<String, dynamic>))
              .toList();
        }
        return demoServers;
      } catch (_) {
        return demoServers;
      }
    }

    Future<ServerModel?> getRecommendedServer() async {
      try {
        final response = await _api.get(ApiEndpoints.recommendedServer);
        final json = response.data as Map<String, dynamic>;
        final payload = (json['data'] as Map<String, dynamic>?) ?? json;
        return ServerModel.fromJson(payload);
      } catch (_) {
        return demoServers.isNotEmpty ? demoServers.first : null;
      }
    }

    Future<Map<String, dynamic>?> getVpnStatus() async {
      try {
        final response = await _api.get(ApiEndpoints.vpnStatus);
        final json = response.data as Map<String, dynamic>;
        return (json['data'] as Map<String, dynamic>?) ?? json;
      } catch (_) {
        return null;
      }
    }
  }
  