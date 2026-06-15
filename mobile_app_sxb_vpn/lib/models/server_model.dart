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
      id: json['id']?.toString() ?? '',
      country: json['country']?.toString() ?? json['name']?.toString() ?? '',
      city: json['city']?.toString() ?? '',
      flag: json['flag']?.toString() ?? '🏳️',
      type: json['type']?.toString() ?? 'Free',
      ping: int.tryParse(json['ping']?.toString() ?? '') ?? 0,
      file: json['file']?.toString() ?? json['config']?.toString() ?? '',
    );
  }
}
