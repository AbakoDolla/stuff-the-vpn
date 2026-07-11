import 'package:dio/dio.dart';
import '../core/network/api_client.dart';
import '../core/network/endpoints.dart';

class DeviceActivationService {
  final ApiClient _api;

  DeviceActivationService(this._api);

  /// Enregistre l'appareil et retourne un code d'activation
  Future<DeviceRegistrationResult> registerDevice({
    required String deviceId,
    String? deviceName,
    String? brand,
    String? model,
    String? osVersion,
    String? appVersion,
    String? androidId,
    String? fingerprint,
  }) async {
    try {
      final response = await _api.post(
        ApiEndpoints.deviceRegister,
        data: {
          'deviceId': deviceId,
          if (deviceName != null) 'deviceName': deviceName,
          if (brand != null) 'brand': brand,
          if (model != null) 'model': model,
          if (osVersion != null) 'osVersion': osVersion,
          if (appVersion != null) 'appVersion': appVersion,
          if (androidId != null) 'androidId': androidId,
          if (fingerprint != null) 'fingerprint': fingerprint,
        },
      );

      final data = response.data as Map<String, dynamic>;
      return DeviceRegistrationResult.fromJson(data);
    } on DioException catch (e) {
      throw _parseError(e);
    }
  }

  /// Vérifie le statut d'activation de l'appareil
  Future<DeviceStatusResult> getDeviceStatus(String deviceId) async {
    try {
      final response = await _api.get(
        '${ApiEndpoints.deviceStatus}/$deviceId',
      );

      final data = response.data as Map<String, dynamic>;
      return DeviceStatusResult.fromJson(data);
    } on DioException catch (e) {
      throw _parseError(e);
    }
  }

  /// Synchronise l'appareil (met à jour l'usage et récupère la config)
  Future<SyncResult> syncDevice({
    required String deviceId,
    double? uploadMB,
    double? downloadMB,
  }) async {
    try {
      final response = await _api.post(
        '${ApiEndpoints.deviceSync}/$deviceId',
        data: {
          if (uploadMB != null) 'uploadMB': uploadMB,
          if (downloadMB != null) 'downloadMB': downloadMB,
        },
      );

      final data = response.data as Map<String, dynamic>;
      return SyncResult.fromJson(data);
    } on DioException catch (e) {
      throw _parseError(e);
    }
  }

  /// Notifie une connexion VPN
  Future<void> notifyConnection({
    required String deviceId,
    required String event,
    String? serverIp,
    int? duration,
  }) async {
    try {
      await _api.post(
        '${ApiEndpoints.deviceConnect}/$deviceId',
        data: {
          'event': event,
          if (serverIp != null) 'serverIp': serverIp,
          if (duration != null) 'duration': duration,
        },
      );
    } on DioException catch (e) {
      throw _parseError(e);
    }
  }

  String _parseError(DioException e) {
    final msg = e.response?.data?.toString() ?? e.message ?? '';
    if (msg.contains('401')) return 'Session expirée';
    if (msg.contains('403')) return 'Accès refusé';
    if (msg.contains('404')) return 'Appareil non trouvé';
    if (msg.contains('SocketException')) return 'Pas de connexion internet';
    if (msg.contains('timeout')) return 'Délai dépassé';
    return 'Une erreur est survenue';
  }
}

// ── Models ──────────────────────────────────────────────────────────────

class DeviceRegistrationResult {
  final bool success;
  final String deviceId;
  final String? activationCode;
  final String status;
  final bool needsApproval;
  final String? message;
  final String? accessToken;

  DeviceRegistrationResult({
    required this.success,
    required this.deviceId,
    this.activationCode,
    required this.status,
    required this.needsApproval,
    this.message,
    this.accessToken,
  });

  factory DeviceRegistrationResult.fromJson(Map<String, dynamic> json) {
    return DeviceRegistrationResult(
      success: json['success'] ?? false,
      deviceId: json['data']?['deviceId'] ?? '',
      activationCode: json['data']?['activationCode'],
      status: json['data']?['status'] ?? 'UNKNOWN',
      needsApproval: json['data']?['needsApproval'] ?? true,
      message: json['data']?['message'],
      accessToken: json['data']?['accessToken'],
    );
  }
}

class DeviceStatusResult {
  final bool success;
  final String status;
  final bool needsApproval;
  final String? activationCode;
  final String? accessToken;
  final String? tokenExpiresAt;
  final String? quotaMB;
  final String? quotaUsedMB;
  final String? quotaRemainingMB;
  final String? vpnConfig;
  final int? configVersion;
  final String? message;

  DeviceStatusResult({
    required this.success,
    required this.status,
    required this.needsApproval,
    this.activationCode,
    this.accessToken,
    this.tokenExpiresAt,
    this.quotaMB,
    this.quotaUsedMB,
    this.quotaRemainingMB,
    this.vpnConfig,
    this.configVersion,
    this.message,
  });

  factory DeviceStatusResult.fromJson(Map<String, dynamic> json) {
    final data = json['data'] ?? {};
    return DeviceStatusResult(
      success: json['success'] ?? false,
      status: data['status'] ?? 'UNKNOWN',
      needsApproval: data['needsApproval'] ?? true,
      activationCode: data['activationCode'],
      accessToken: data['accessToken'],
      tokenExpiresAt: data['tokenExpiresAt'],
      quotaMB: data['quotaMB']?.toString(),
      quotaUsedMB: data['quotaUsedMB']?.toString(),
      quotaRemainingMB: data['quotaRemainingMB']?.toString(),
      vpnConfig: data['vpnConfig'],
      configVersion: data['configVersion'],
      message: data['message'],
    );
  }

  double get quotaRemaining => double.tryParse(quotaRemainingMB ?? '0') ?? 0;
  double get quotaUsed => double.tryParse(quotaUsedMB ?? '0') ?? 0;
  double get quotaTotal => double.tryParse(quotaMB ?? '0') ?? 0;
  bool get hasQuota => quotaTotal > 0;
  bool get isActive => status == 'ACTIVE';
  bool get isPending => status == 'PENDING';
  bool get isExpired => status == 'EXPIRED';
}

class SyncResult {
  final bool success;
  final String status;
  final String? quotaMB;
  final String? quotaUsedMB;
  final String? quotaRemainingMB;
  final String? vpnConfig;
  final int? configVersion;
  final String? message;

  SyncResult({
    required this.success,
    required this.status,
    this.quotaMB,
    this.quotaUsedMB,
    this.quotaRemainingMB,
    this.vpnConfig,
    this.configVersion,
    this.message,
  });

  factory SyncResult.fromJson(Map<String, dynamic> json) {
    final data = json['data'] ?? {};
    return SyncResult(
      success: json['success'] ?? false,
      status: data['status'] ?? 'UNKNOWN',
      quotaMB: data['quotaMB']?.toString(),
      quotaUsedMB: data['quotaUsedMB']?.toString(),
      quotaRemainingMB: data['quotaRemainingMB']?.toString(),
      vpnConfig: data['vpnConfig'],
      configVersion: data['configVersion'],
      message: data['message'],
    );
  }
}
