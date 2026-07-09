/// User model representing a user account
class User {
  final String id;
  final String? email;
  final String? phone;
  final String? name;
  final String status;
  final DateTime? expiresAt;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final int? quotaTotalGB;
  final int? quotaUsedGB;

  User({
    required this.id,
    this.email,
    this.phone,
    this.name,
    required this.status,
    this.expiresAt,
    this.createdAt,
    this.updatedAt,
    this.quotaTotalGB,
    this.quotaUsedGB,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      name: json['name'] as String?,
      status: json['status'] as String? ?? 'ACTIVE',
      expiresAt: json['expiresAt'] != null
          ? DateTime.parse(json['expiresAt'] as String)
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'] as String)
          : null,
      quotaTotalGB: json['quotaTotalGB'] as int?,
      quotaUsedGB: json['quotaUsedGB'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'phone': phone,
      'name': name,
      'status': status,
      'expiresAt': expiresAt?.toIso8601String(),
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
      'quotaTotalGB': quotaTotalGB,
      'quotaUsedGB': quotaUsedGB,
    };
  }

  bool get isActive => status == 'ACTIVE';
  bool get isExpired => expiresAt != null && expiresAt!.isBefore(DateTime.now());
  int get quotaRemainingGB => (quotaTotalGB ?? 0) - (quotaUsedGB ?? 0);
}
