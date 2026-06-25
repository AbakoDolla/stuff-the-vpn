class AppUser {
  final String id;
  final String username;
  final String? email;
  final String? phone;
  final String role;
  final String status;
  final double quotaUsedGB;
  final double quotaRemainingGB;
  final int deviceLimit;
  final DateTime? expireAt;

  const AppUser({
    required this.id,
    required this.username,
    this.email,
    this.phone,
    required this.role,
    required this.status,
    required this.quotaUsedGB,
    required this.quotaRemainingGB,
    required this.deviceLimit,
    this.expireAt,
  });

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: json['id'] as String,
      username: json['username'] as String,
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      role: json['role'] as String? ?? 'USER',
      status: json['status'] as String? ?? 'ACTIVE',
      quotaUsedGB: (json['quotaUsedGB'] as num?)?.toDouble() ?? 0.0,
      quotaRemainingGB: (json['quotaRemainingGB'] as num?)?.toDouble() ?? 0.0,
      deviceLimit: (json['deviceLimit'] as num?)?.toInt() ?? 1,
      expireAt: json['expireAt'] != null ? DateTime.tryParse(json['expireAt'] as String) : null,
    );
  }

  double get quotaTotalGB => quotaUsedGB + quotaRemainingGB;
  double get quotaPercent => quotaTotalGB == 0 ? 0 : (quotaUsedGB / quotaTotalGB).clamp(0.0, 1.0);
  bool get isExpired => expireAt != null && expireAt!.isBefore(DateTime.now());
  int get daysLeft => expireAt == null ? 0 : expireAt!.difference(DateTime.now()).inDays.clamp(0, 9999);
}

class VpnStatus {
  final bool isConnected;
  final DateTime? connectedSince;
  final String? deviceName;
  final double dataUsed;
  final double dataRemaining;

  const VpnStatus({
    required this.isConnected,
    this.connectedSince,
    this.deviceName,
    required this.dataUsed,
    required this.dataRemaining,
  });

  factory VpnStatus.fromJson(Map<String, dynamic> json) {
    return VpnStatus(
      isConnected: json['isConnected'] as bool? ?? false,
      connectedSince: json['connectedSince'] != null
          ? DateTime.tryParse(json['connectedSince'] as String)
          : null,
      deviceName: json['deviceName'] as String?,
      dataUsed: (json['dataUsed'] as num?)?.toDouble() ?? 0.0,
      dataRemaining: (json['dataRemaining'] as num?)?.toDouble() ?? 0.0,
    );
  }
}
