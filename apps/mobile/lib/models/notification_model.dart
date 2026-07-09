class NotificationModel {
  final String id;
  final String title;
  final String message;
  final String type;
  final bool isRead;
  final DateTime createdAt;

  const NotificationModel({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.isRead,
    required this.createdAt,
  });

  NotificationModel copyWith({bool? isRead}) {
    return NotificationModel(
      id:        id,
      title:     title,
      message:   message,
      type:      type,
      isRead:    isRead ?? this.isRead,
      createdAt: createdAt,
    );
  }

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id:        json['id']?.toString()      ?? '',
      title:     json['title']?.toString()   ?? '',
      message:   json['message']?.toString() ?? '',
      type:      json['type']?.toString()    ?? 'INFO',
      isRead:    json['isRead'] as bool?     ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id':        id,
    'title':     title,
    'message':   message,
    'type':      type,
    'isRead':    isRead,
    'createdAt': createdAt.toIso8601String(),
  };
}
