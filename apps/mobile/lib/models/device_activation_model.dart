import 'user_model.dart';
import 'vpn_config_model.dart';

/// Result of POST /mobile/device/activate
class DeviceActivationResult {
  final String accessToken;
  final DeviceInfo device;
  final UserModel? user;
  final List<VpnConfigModel> profiles;
  final int? configVersion;

  const DeviceActivationResult({
    required this.accessToken,
    required this.device,
    this.user,
    this.profiles = const [],
    this.configVersion,
  });

  factory DeviceActivationResult.fromJson(Map<String, dynamic> json) {
    final payload = (json['data'] as Map<String, dynamic>?) ?? json;

    final deviceJson = payload['device'] as Map<String, dynamic>? ?? {};
    final userJson   = payload['user']   as Map<String, dynamic>?;
    final rawProfiles = (payload['profiles'] as List?) ?? [];

    return DeviceActivationResult(
      accessToken: payload['accessToken']?.toString() ?? '',
      device: DeviceInfo.fromJson(deviceJson),
      user: userJson != null ? UserModel.fromJson(userJson) : null,
      profiles: rawProfiles
          .whereType<Map<String, dynamic>>()
          .map((e) => VpnConfigModel.fromJson(e))
          .toList(),
      configVersion: payload['configVersion'] as int?,
    );
  }
}

class DeviceInfo {
  final String id;
  final String? deviceId;
  final String? deviceName;
  final String status; // ACTIVE | INACTIVE | SUSPENDED

  const DeviceInfo({
    required this.id,
    this.deviceId,
    this.deviceName,
    required this.status,
  });

  factory DeviceInfo.fromJson(Map<String, dynamic> json) {
    return DeviceInfo(
      id:         json['id']?.toString()         ?? '',
      deviceId:   json['deviceId']?.toString(),
      deviceName: json['deviceName']?.toString(),
      status:     json['status']?.toString()     ?? 'INACTIVE',
    );
  }
}
