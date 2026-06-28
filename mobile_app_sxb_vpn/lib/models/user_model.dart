class UserModel {
  final String id;
  final String email;
  final String? username;
  final String? plan;
  final double? dataLimit;
  final double? dataUsed;
  final DateTime? planExpiry;
  final int? deviceCount;
  final int? deviceLimit;

  const UserModel({
    required this.id,
    required this.email,
    this.username,
    this.plan,
    this.dataLimit,
    this.dataUsed,
    this.planExpiry,
    this.deviceCount,
    this.deviceLimit,
  });

  String get name =>
      (username != null && username!.isNotEmpty) ? username! : email.split('@').first;

  double get dataRemaining => (dataLimit ?? 0) - (dataUsed ?? 0);
  double get usagePercent => dataLimit != null && dataLimit! > 0
      ? ((dataUsed ?? 0) / dataLimit!) * 100
      : 0;

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final used = _toDouble(json["dataUsed"] ?? json["used"] ?? json["quotaUsedGB"]) ?? 0.0;
    final remaining = _toDouble(json["dataRemaining"] ?? json["quotaRemainingGB"]) ?? 0.0;
    final limit = _toDouble(json["dataLimit"] ?? json["quota"]) ?? (used + remaining);
    return UserModel(
      id: json["id"]?.toString() ?? "",
      email: json["email"]?.toString() ?? "",
      username: json["username"]?.toString(),
      plan: json["plan"]?.toString() ?? json["forfait"]?.toString(),
      dataLimit: limit,
      dataUsed: used,
      planExpiry: json["planExpiry"] != null
          ? DateTime.tryParse(json["planExpiry"].toString())
          : json["expireAt"] != null
              ? DateTime.tryParse(json["expireAt"].toString())
              : null,
      deviceCount: json["deviceCount"] as int?,
      deviceLimit: json["deviceLimit"] as int?,
    );
  }

  static double? _toDouble(dynamic val) {
    if (val == null) return null;
    if (val is double) return val;
    if (val is int) return val.toDouble();
    return double.tryParse(val.toString());
  }

  Map<String, dynamic> toJson() => {
        "id": id,
        "email": email,
        "username": username,
        "plan": plan,
        "dataLimit": dataLimit,
        "dataUsed": dataUsed,
        "planExpiry": planExpiry?.toIso8601String(),
        "deviceCount": deviceCount,
        "deviceLimit": deviceLimit,
      };
}