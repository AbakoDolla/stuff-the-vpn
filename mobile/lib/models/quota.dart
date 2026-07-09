/// Quota model representing user data quota
class Quota {
  final String id;
  final String? userId;
  final double totalGB;
  final double usedGB;
  final double? uploadBytes;
  final double? downloadBytes;
  final DateTime? resetAt;
  final DateTime? lastUpdatedAt;
  final String? status;

  Quota({
    required this.id,
    this.userId,
    required this.totalGB,
    required this.usedGB,
    this.uploadBytes,
    this.downloadBytes,
    this.resetAt,
    this.lastUpdatedAt,
    this.status,
  });

  factory Quota.fromJson(Map<String, dynamic> json) {
    return Quota(
      id: json['id'] as String,
      userId: json['userId'] as String?,
      totalGB: (json['totalGB'] as num?)?.toDouble() ?? 0.0,
      usedGB: (json['usedGB'] as num?)?.toDouble() ?? 0.0,
      uploadBytes: (json['uploadBytes'] as num?)?.toDouble(),
      downloadBytes: (json['downloadBytes'] as num?)?.toDouble(),
      resetAt: json['resetAt'] != null
          ? DateTime.parse(json['resetAt'] as String)
          : null,
      lastUpdatedAt: json['lastUpdatedAt'] != null
          ? DateTime.parse(json['lastUpdatedAt'] as String)
          : null,
      status: json['status'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'totalGB': totalGB,
      'usedGB': usedGB,
      'uploadBytes': uploadBytes,
      'downloadBytes': downloadBytes,
      'resetAt': resetAt?.toIso8601String(),
      'lastUpdatedAt': lastUpdatedAt?.toIso8601String(),
      'status': status,
    };
  }

  double get remainingGB => (totalGB - usedGB).clamp(0.0, totalGB);
  double get percentage => totalGB > 0 ? (usedGB / totalGB).clamp(0.0, 1.0) : 0.0;
  bool get isExhausted => remainingGB <= 0;
  bool get isLow => percentage >= 0.8;

  String get statusLabel {
    if (isExhausted) return 'Épuisé';
    if (isLow) return 'Quasi épuisé';
    return 'Actif';
  }
}

/// VPN Configuration received from backend
class VpnConfig {
  final String id;
  final String? inboundId;
  final String? protocol;
  final String? serverAddress;
  final int? serverPort;
  final Map<String, dynamic>? config;
  final String? remark;
  final bool isActive;
  final DateTime? expiresAt;

  VpnConfig({
    required this.id,
    this.inboundId,
    this.protocol,
    this.serverAddress,
    this.serverPort,
    this.config,
    this.remark,
    this.isActive = true,
    this.expiresAt,
  });

  factory VpnConfig.fromJson(Map<String, dynamic> json) {
    return VpnConfig(
      id: json['id'] as String,
      inboundId: json['inboundId'] as String?,
      protocol: json['protocol'] as String?,
      serverAddress: json['serverAddress'] as String?,
      serverPort: json['serverPort'] as int?,
      config: json['config'] as Map<String, dynamic>?,
      remark: json['remark'] as String?,
      isActive: json['isActive'] as bool? ?? true,
      expiresAt: json['expiresAt'] != null
          ? DateTime.parse(json['expiresAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'inboundId': inboundId,
      'protocol': protocol,
      'serverAddress': serverAddress,
      'serverPort': serverPort,
      'config': config,
      'remark': remark,
      'isActive': isActive,
      'expiresAt': expiresAt?.toIso8601String(),
    };
  }

  bool get isExpired => expiresAt != null && expiresAt!.isBefore(DateTime.now());
}
