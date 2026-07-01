import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/network/api_client.dart';
import '../core/network/endpoints.dart';
import '../models/vpn_config_model.dart';
import '../models/server_model.dart';

class VpnConfigResult {
  final List<VpnConfigModel> profiles;
  const VpnConfigResult({required this.profiles});
}

final vpnServiceProvider = Provider<VpnService>((ref) {
  return VpnService(ref.watch(apiClientProvider));
});

class VpnService {
  final ApiClient _api;
  VpnService(this._api);

  Future<VpnConfigResult?> getMobileConfig() async {
    try {
      final response = await _api.get(ApiEndpoints.mobileConfig);
      final json = response.data as Map<String, dynamic>;
      final data = (json['data'] as Map<String, dynamic>?) ?? json;
      final raw = (data['profiles'] as List?) ?? [];
      final profiles = raw
          .whereType<Map<String, dynamic>>()
          .map((e) => VpnConfigModel.fromJson(e))
          .toList();
      return VpnConfigResult(profiles: profiles);
    } catch (_) {
      return null;
    }
  }

  Future<List<ServerModel>> getServers() async {
    try {
      final response = await _api.get(ApiEndpoints.servers);
      final json = response.data as Map<String, dynamic>;
      final raw = (json['data'] as List?) ??
          (json['servers'] as List?) ??
          [];
      return raw
          .whereType<Map<String, dynamic>>()
          .map((e) => ServerModel.fromJson(e))
          .toList();
    } catch (_) {
      return [];
    }
  }

  Future<ServerModel?> getRecommendedServer() async {
    try {
      final response = await _api.get(ApiEndpoints.recommendedServer);
      final json = response.data as Map<String, dynamic>;
      final data = (json['data'] as Map<String, dynamic>?) ?? json;
      return ServerModel.fromJson(data);
    } catch (_) {
      return null;
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

  Future<List<Map<String, dynamic>>> getConnectionLogs({int limit = 50}) async {
    try {
      final response = await _api.get('${ApiEndpoints.mobileLogs}?limit=$limit');
      final json = response.data as Map<String, dynamic>;
      final raw = (json['data'] as List?) ?? [];
      return raw.whereType<Map<String, dynamic>>().toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> postConnectionLog({
    required String event,
    String? protocol,
    String? server,
    int? duration,
  }) async {
    try {
      await _api.post(ApiEndpoints.mobileLogs, data: {
        'event': event,
        if (protocol != null) 'protocol': protocol,
        if (server != null) 'server': server,
        if (duration != null) 'duration': duration,
      });
    } catch (_) {}
  }
}
