class VpnConfigModel {
  final String id;
  final String type;
  final String serverHost;
  final int serverPort;
  final String protocol;
  final String? uuid;
  final String? password;
  final String? path;
  final String? sni;
  final String? country;
  final String? city;
  final String? flag;
  final int? ping;
  final String? expiry;
  final double? quotaRemainingGB;
  final double? quotaUsedGB;

  const VpnConfigModel({
    required this.id,
    required this.type,
    required this.serverHost,
    required this.serverPort,
    required this.protocol,
    this.uuid,
    this.password,
    this.path,
    this.sni,
    this.country,
    this.city,
    this.flag,
    this.ping,
    this.expiry,
    this.quotaRemainingGB,
    this.quotaUsedGB,
  });

  factory VpnConfigModel.fromJson(Map<String, dynamic> json) {
    return VpnConfigModel(
      id: json["id"]?.toString() ?? "",
      type: json["type"]?.toString() ?? "vless",
      serverHost: json["serverHost"]?.toString() ?? json["host"]?.toString() ?? "",
      serverPort: json["serverPort"] as int? ?? json["port"] as int? ?? 443,
      protocol: json["protocol"]?.toString() ?? "VLESS",
      uuid: json["uuid"]?.toString(),
      password: json["password"]?.toString(),
      path: json["path"]?.toString(),
      sni: json["sni"]?.toString(),
      country: json["country"]?.toString(),
      city: json["city"]?.toString(),
      flag: json["flag"]?.toString(),
      ping: json["ping"] as int?,
      expiry: json["expiry"]?.toString(),
      quotaRemainingGB: _toDouble(json["quotaRemainingGB"]),
      quotaUsedGB: _toDouble(json["quotaUsedGB"]),
    );
  }

  static double? _toDouble(dynamic v) {
    if (v == null) return null;
    if (v is double) return v;
    if (v is int) return v.toDouble();
    return double.tryParse(v.toString());
  }

  Map<String, dynamic> toJson() => {
        "id": id,
        "type": type,
        "serverHost": serverHost,
        "serverPort": serverPort,
        "protocol": protocol,
        "uuid": uuid,
        "password": password,
        "country": country,
        "city": city,
        "flag": flag,
        "ping": ping,
        "expiry": expiry,
        "quotaRemainingGB": quotaRemainingGB,
        "quotaUsedGB": quotaUsedGB,
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
      id: json["id"]?.toString() ?? "",
      country: json["country"]?.toString() ?? json["remark"]?.toString() ?? "Unknown",
      city: json["city"]?.toString() ?? "",
      flag: json["flag"]?.toString() ?? "🌍",
      ping: json["ping"] as int? ?? 50,
      type: json["type"]?.toString() ?? (json["protocol"]?.toString() ?? "vless").toLowerCase(),
      recommended: json["recommended"] as bool? ?? false,
    );
  }
}

final demoServers = [
  const ServerModel(id: "1", country: "France", city: "Paris", flag: "🇫🇷", ping: 32, type: "vless", recommended: true),
  const ServerModel(id: "2", country: "Germany", city: "Frankfurt", flag: "🇩🇪", ping: 48, type: "vless"),
  const ServerModel(id: "3", country: "United States", city: "New York", flag: "🇺🇸", ping: 102, type: "vless"),
  const ServerModel(id: "4", country: "Canada", city: "Montreal", flag: "🇨🇦", ping: 110, type: "vless"),
  const ServerModel(id: "5", country: "United Kingdom", city: "London", flag: "🇬🇧", ping: 98, type: "vless"),
  const ServerModel(id: "6", country: "Singapore", city: "Singapore", flag: "🇸🇬", ping: 140, type: "vless"),
];