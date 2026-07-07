/// Device model representing a registered device
class Device {
  final String id;
  final String deviceId;
  final String? deviceName;
  final String? brand;
  final String? model;
  final String? osVersion;
  final String? appVersion;
  final String? publicIp;
  final String? country;
  final String status;
  final DateTime? firstActivatedAt;
  final DateTime? lastSyncAt;
  final int connectionCount;
  final bool isCompromised;
  final DateTime? lastSeenAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  Device({
    required this.id,
    required this.deviceId,
    this.deviceName,
    this.brand,
    this.model,
    this.osVersion,
    this.appVersion,
    this.publicIp,
    this.country,
    required this.status,
    this.firstActivatedAt,
    this.lastSyncAt,
    required this.connectionCount,
    required this.isCompromised,
    this.lastSeenAt,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Device.fromJson(Map<String, dynamic> json) {
    return Device(
      id: json['id'] as String,
      deviceId: json['deviceId'] as String,
      deviceName: json['deviceName'] as String?,
      brand: json['brand'] as String?,
      model: json['model'] as String?,
      osVersion: json['osVersion'] as String?,
      appVersion: json['appVersion'] as String?,
      publicIp: json['publicIp'] as String?,
      country: json['country'] as String?,
      status: json['status'] as String? ?? 'ACTIVE',
      firstActivatedAt: json['firstActivatedAt'] != null
          ? DateTime.parse(json['firstActivatedAt'] as String)
          : null,
      lastSyncAt: json['lastSyncAt'] != null
          ? DateTime.parse(json['lastSyncAt'] as String)
          : null,
      connectionCount: json['connectionCount'] as int? ?? 0,
      isCompromised: json['isCompromised'] as bool? ?? false,
      lastSeenAt: json['lastSeenAt'] != null
          ? DateTime.parse(json['lastSeenAt'] as String)
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'deviceId': deviceId,
      'deviceName': deviceName,
      'brand': brand,
      'model': model,
      'osVersion': osVersion,
      'appVersion': appVersion,
      'publicIp': publicIp,
      'country': country,
      'status': status,
      'firstActivatedAt': firstActivatedAt?.toIso8601String(),
      'lastSyncAt': lastSyncAt?.toIso8601String(),
      'connectionCount': connectionCount,
      'isCompromised': isCompromised,
      'lastSeenAt': lastSeenAt?.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  bool get isActive => status == 'ACTIVE';
  bool get isBlocked => status == 'BLOCKED';
  bool get isDisabled => status == 'DISABLED';
}
