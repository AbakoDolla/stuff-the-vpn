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
<<<<<<< HEAD
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
=======
      id: json['id']?.toString() ?? '',
      country: json['country']?.toString() ?? json['name']?.toString() ?? '',
      city: json['city']?.toString() ?? '',
      flag: json['flag']?.toString() ?? '🏳️',
      type: json['type']?.toString() ?? 'Free',
      ping: int.tryParse(json['ping']?.toString() ?? '') ?? 0,
      file: json['file']?.toString() ?? json['config']?.toString() ?? '',
    );
  }
>>>>>>> ea0b448fb6e6720505e7b1f4f3bc95731b6590b8
}
