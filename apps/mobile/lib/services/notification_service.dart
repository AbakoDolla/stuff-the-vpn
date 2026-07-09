import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/network/api_client.dart';
import '../core/network/endpoints.dart';
import '../models/notification_model.dart';

final notificationServiceProvider = Provider<NotificationService>((ref) {
  return NotificationService(ref.watch(apiClientProvider));
});

class NotificationService {
  final ApiClient _api;

  NotificationService(this._api);

  /// GET /notifications — returns all notifications for the authenticated user.
  Future<List<NotificationModel>> getNotifications({int? limit}) async {
    try {
      final response = await _api.get(
        ApiEndpoints.notifications,
        queryParameters: limit != null ? {'limit': limit} : null,
      );
      final json  = response.data as Map<String, dynamic>;
      final raw   = (json['data'] as List?) ??
                    (json['notifications'] as List?) ??
                    (json as Map).values.whereType<List>().firstOrNull ??
                    [];
      return raw
          .whereType<Map<String, dynamic>>()
          .map((e) => NotificationModel.fromJson(e))
          .toList();
    } catch (_) {
      return [];
    }
  }

  /// PATCH /notifications/:id/read — marks a single notification as read.
  Future<bool> markAsRead(String id) async {
    try {
      await _api.patch(ApiEndpoints.notificationRead(id));
      return true;
    } catch (_) {
      return false;
    }
  }

  /// PATCH /notifications/read-all — marks all notifications as read.
  Future<bool> markAllAsRead() async {
    try {
      await _api.patch(ApiEndpoints.notificationsReadAll);
      return true;
    } catch (_) {
      return false;
    }
  }
}
