class VpnConfigModel {
  final String id;
  final String type;
  final String serverHost;
  final int serverPort;
  final String protocol;
  final String? uuid;
  final String? password;
  final String? country;
  final String? city;
  final String? flag;
  final int? ping;

  const VpnConfigModel({
    required this.id,
    required this.type,
    required this.serverHost,
    required this.serverPort,
    required this.protocol,
    this.uuid,
    this.password,
    this.country,
    this.city,
    this.flag,
    this.ping,
  });

  factory VpnConfigModel.fromJson(Map<String, dynamic> json) {
    return VpnConfigModel(
      id: json['id']?.toString() ?? '',
      type: json['type']?.toString() ?? 'v2ray',
      serverHost: json['serverHost']?.toString() ?? json['host']?.toString() ?? '',
      serverPort: json['serverPort'] as int? ?? json['port'] as int? ?? 443,
      protocol: json['protocol']?.toString() ?? 'vmess',
      uuid: json['uuid']?.toString(),
      password: json['password']?.toString(),
      country: json['country']?.toString(),
      city: json['city']?.toString(),
      flag: json['flag']?.toString(),
      ping: json['ping'] as int?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type,
        'serverHost': serverHost,
        'serverPort': serverPort,
        'protocol': protocol,
        'uuid': uuid,
        'password': password,
        'country': country,
        'city': city,
        'flag': flag,
        'ping': ping,
      };
}

class ServerModel {
  final String id;
  final String country;
  final String city;
  final String flag;
  final int ping;
  final String type;
  final bool recommended;

  const ServerModel({
    required this.id,
    required this.country,
    required this.city,
    required this.flag,
    required this.ping,
    required this.type,
    this.recommended = false,
  });

  factory ServerModel.fromJson(Map<String, dynamic> json) {
    return ServerModel(
      id: json['id']?.toString() ?? '',
      country: json['country']?.toString() ?? '',
      city: json['city']?.toString() ?? '',
      flag: json['flag']?.toString() ?? '🌍',
      ping: json['ping'] as int? ?? 0,
      type: json['type']?.toString() ?? 'v2ray',
      recommended: json['recommended'] as bool? ?? false,
    );
  }
}

// Demo servers for UI
final demoServers = [
  ServerModel(id: '1', country: 'France', city: 'Paris', flag: '🇫🇷', ping: 32, type: 'v2ray', recommended: true),
  ServerModel(id: '2', country: 'Germany', city: 'Frankfurt', flag: '🇩🇪', ping: 48, type: 'v2ray'),
  ServerModel(id: '3', country: 'United States', city: 'New York', flag: '🇺🇸', ping: 102, type: 'ssh'),
  ServerModel(id: '4', country: 'Canada', city: 'Montreal', flag: '🇨🇦', ping: 110, type: 'v2ray'),
  ServerModel(id: '5', country: 'United Kingdom', city: 'London', flag: '🇬🇧', ping: 98, type: 'ssh'),
  ServerModel(id: '6', country: 'Singapore', city: 'Singapore', flag: '🇸🇬', ping: 140, type: 'v2ray'),
];
