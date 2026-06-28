class VpnConfigModel {
  final String? serverHost;
  final int? serverPort;
  final String protocol;
  final int? ping;
  final double? quotaRemainingGB;
  final String? config;
  final String? username;
  final String? password;

  VpnConfigModel({
    this.serverHost,
    this.serverPort,
    this.protocol = 'OpenVPN',
    this.ping,
    this.quotaRemainingGB,
    this.config,
    this.username,
    this.password,
  });

  factory VpnConfigModel.fromJson(Map<String, dynamic> json) {
    return VpnConfigModel(
      serverHost: json['serverHost']?.toString() ??
          json['host']?.toString() ??
          json['server']?.toString(),
      serverPort: _toInt(json['serverPort'] ?? json['port']),
      protocol: json['protocol']?.toString() ?? 'OpenVPN',
      ping: _toInt(json['ping']),
      quotaRemainingGB:
          _toDouble(json['quotaRemainingGB'] ?? json['dataRemaining']),
      config: json['config']?.toString() ?? json['ovpn']?.toString(),
      username: json['username']?.toString(),
      password: json['password']?.toString(),
    );
  }

  static int? _toInt(dynamic v) {
    if (v == null) return null;
    if (v is int) return v;
    if (v is double) return v.toInt();
    return int.tryParse(v.toString());
  }

  static double? _toDouble(dynamic v) {
    if (v == null) return null;
    if (v is double) return v;
    if (v is int) return v.toDouble();
    return double.tryParse(v.toString());
  }
}
