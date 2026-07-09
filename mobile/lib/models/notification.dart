/// Notification model representing app notifications
class AppNotification {
  final String id;
  final String title;
  final String? body;
  final String type;
  final bool isRead;
  final DateTime createdAt;
  final Map<String, dynamic>? metadata;

  AppNotification({
    required this.id,
    required this.title,
    this.body,
    required this.type,
    required this.isRead,
    required this.createdAt,
    this.metadata,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] as String,
      title: json['title'] as String,
      body: json['body'] as String?,
      type: json['type'] as String? ?? 'INFO',
      isRead: json['isRead'] as bool? ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'body': body,
      'type': type,
      'isRead': isRead,
      'createdAt': createdAt.toIso8601String(),
      'metadata': metadata,
    };
  }

  String get timeAgo {
    final diff = DateTime.now().difference(createdAt);
    if (diff.inMinutes < 1) return 'À l\'instant';
    if (diff.inMinutes < 60) return 'Il y a ${diff.inMinutes} min';
    if (diff.inHours < 24) return 'Il y a ${diff.inHours}h';
    if (diff.inDays < 7) return 'Il y a ${diff.inDays}j';
    return '${createdAt.day}/${createdAt.month}/${createdAt.year}';
  }

  bool get isQuotaWarning => type == 'QUOTA_WARNING';
  bool get isQuotaExhausted => type == 'QUOTA_EXHAUSTED';
  bool get isAccountExpiring => type == 'ACCOUNT_EXPIRING';
  bool get isUpdateAvailable => type == 'UPDATE_AVAILABLE';
  bool get isConfigUpdate => type == 'CONFIG_UPDATE';
  bool get isConnectionLost => type == 'CONNECTION_LOST';
}

/// Sync status model
class SyncStatus {
  final DateTime? lastSyncAt;
  final bool isSyncing;
  final String? error;
  final DateTime? nextScheduledSync;

  SyncStatus({
    this.lastSyncAt,
    this.isSyncing = false,
    this.error,
    this.nextScheduledSync,
  });

  factory SyncStatus.fromJson(Map<String, dynamic> json) {
    return SyncStatus(
      lastSyncAt: json['lastSyncAt'] != null
          ? DateTime.parse(json['lastSyncAt'] as String)
          : null,
      isSyncing: json['isSyncing'] as bool? ?? false,
      error: json['error'] as String?,
      nextScheduledSync: json['nextScheduledSync'] != null
          ? DateTime.parse(json['nextScheduledSync'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'lastSyncAt': lastSyncAt?.toIso8601String(),
      'isSyncing': isSyncing,
      'error': error,
      'nextScheduledSync': nextScheduledSync?.toIso8601String(),
    };
  }

  String get lastSyncTimeAgo {
    if (lastSyncAt == null) return 'Jamais synchronisé';
    final diff = DateTime.now().difference(lastSyncAt!);
    if (diff.inMinutes < 1) return 'À l\'instant';
    if (diff.inMinutes < 60) return 'Il y a ${diff.inMinutes} min';
    if (diff.inHours < 24) return 'Il y a ${diff.inHours}h';
    return 'Il y a ${diff.inDays}j';
  }
}

/// Connection history entry
class ConnectionHistory {
  final String id;
  final String type;
  final DateTime timestamp;
  final String? details;
  final bool success;

  ConnectionHistory({
    required this.id,
    required this.type,
    required this.timestamp,
    this.details,
    this.success = true,
  });

  factory ConnectionHistory.fromJson(Map<String, dynamic> json) {
    return ConnectionHistory(
      id: json['id'] as String,
      type: json['type'] as String,
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'] as String)
          : DateTime.now(),
      details: json['details'] as String?,
      success: json['success'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      'timestamp': timestamp.toIso8601String(),
      'details': details,
      'success': success,
    };
  }

  String get typeLabel {
    switch (type) {
      case 'CONNECT':
        return 'Connexion';
      case 'DISCONNECT':
        return 'Déconnexion';
      case 'SYNC':
        return 'Synchronisation';
      case 'QUOTA_UPDATE':
        return 'Mise à jour quota';
      default:
        return type;
    }
  }

  String get timeAgo {
    final diff = DateTime.now().difference(timestamp);
    if (diff.inMinutes < 1) return 'À l\'instant';
    if (diff.inMinutes < 60) return 'Il y a ${diff.inMinutes} min';
    if (diff.inHours < 24) return 'Il y a ${diff.inHours}h';
    if (diff.inDays < 7) return 'Il y a ${diff.inDays}j';
    return '${timestamp.day}/${timestamp.month}/${timestamp.year}';
  }
}
