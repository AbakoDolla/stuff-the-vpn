class ServerModel {
  final String id;
  final String country;
  final String city;
  final String flag;
  final String type;
  final int ping;
  final String file;

  ServerModel({
    required this.id,
    required this.country,
    required this.city,
    required this.flag,
    required this.type,
    required this.ping,
    required this.file,
  });

  factory ServerModel.fromJson(Map<String, dynamic> json) {
    return ServerModel(
      id: json["id"]?.toString() ?? "",
      country: json["country"]?.toString() ?? "",
      city: json["city"]?.toString() ?? "",
      flag: json["flag"]?.toString() ?? "",
      type: json["type"]?.toString() ?? "",
      ping: (json["ping"] as int?) ?? 0,
      file: json["file"]?.toString() ?? "",
    );
  }

  Map<String, dynamic> toJson() => {
    "id": id,
    "country": country,
    "city": city,
    "flag": flag,
    "type": type,
    "ping": ping,
    "file": file,
  };
}
