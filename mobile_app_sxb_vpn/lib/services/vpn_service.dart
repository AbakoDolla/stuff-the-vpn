import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/network/api_client.dart';
import '../core/network/endpoints.dart';
import '../models/server_model.dart';
import '../models/vpn_config_model.dart';
import '../core/demo_data.dart';

final vpnServiceProvider = Provider<VpnService>((ref) {
  return VpnService(ref.watch(apiClientProvider));
});

class MobileConfigResult {
  final List<VpnConfigModel> profiles;
  final double quotaUsedGB;
  final double quotaRemainingGB;
  final DateTime? expireAt;

  const MobileConfigResult({
    required this.profiles,
    required this.quotaUsedGB,
    required this.quotaRemainingGB,
    this.expireAt,
  });
}

class VpnService {
  final ApiClient _api;
  VpnService(this._api);

  /// Fetch all VPN connection profiles from the mobile API.
  /// Returns real inbound configs for the authenticated user.
  Future<MobileConfigResult?> getMobileConfig() async {
    try {
      final response = await _api.get(ApiEndpoints.mobileConfig);
      final json = response.data as Map<String, dynamic>;
      final payload = (json['data'] as Map<String, dynamic>?) ?? json;

      final profilesRaw = payload['profiles'] as List? ?? [];
      final profiles = profilesRaw
          .map((p) => VpnConfigModel.fromJson(p as Map<String, dynamic>))
          .toList();

      final quota = payload['quota'] as Map<String, dynamic>? ?? {};
      return MobileConfigResult(
        profiles:           profiles,
        quotaUsedGB:        _toDouble(quota['usedGB']) ?? 0.0,
        quotaRemainingGB:   _toDouble(quota['remainingGB']) ?? 0.0,
        expireAt:           quota['expireAt'] != null
            ? DateTime.tryParse(quota['expireAt'].toString())
            : null,
      );
    } catch (_) {
      return null;
    }
  }

  /// Legacy: get single config (vpn/my-config)
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

  /// Post a connection log to the backend
  Future<void> postConnectionLog({
    required String event,
    String? protocol,
    String? server,
    int? duration,
    String? errorMsg,
    int? rxBytes,
    int? txBytes,
    int? ping,
  }) async {
    try {
      await _api.post(ApiEndpoints.mobileLogs, data: {
        'event':    event,
        if (protocol != null) 'protocol': protocol,
        if (server   != null) 'server':   server,
        if (duration != null) 'duration': duration,
        if (errorMsg != null) 'errorMsg': errorMsg,
        if (rxBytes  != null) 'rxBytes':  rxBytes,
        if (txBytes  != null) 'txBytes':  txBytes,
        if (ping     != null) 'ping':     ping,
      });
    } catch (_) {}
  }

  /// Fetch connection logs from backend
  Future<List<Map<String, dynamic>>> getConnectionLogs({int limit = 50}) async {
    try {
      final response = await _api.get(ApiEndpoints.mobileLogs,
          queryParameters: {'limit': limit});
      final json = response.data as Map<String, dynamic>;
      final list = json['data'] as List? ?? [];
      return list.cast<Map<String, dynamic>>();
    } catch (_) {
      return [];
    }
  }

  static double? _toDouble(dynamic v) {
    if (v == null) return null;
    if (v is double) return v;
    if (v is int) return v.toDouble();
    return double.tryParse(v.toString());
  }
}
