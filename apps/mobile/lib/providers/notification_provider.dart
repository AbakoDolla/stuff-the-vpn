import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/notification_model.dart';
import '../services/notification_service.dart';

/// Fetches the notification list from the backend.
final notificationsProvider =
    FutureProvider.autoDispose<List<NotificationModel>>((ref) async {
  return ref.read(notificationServiceProvider).getNotifications();
});

/// Counts unread notifications (derived from notificationsNotifierProvider).
final unreadNotificationCountProvider = Provider.autoDispose<int>((ref) {
  final notifications =
      ref.watch(notificationsNotifierProvider).valueOrNull ?? [];
  return notifications.where((n) => !n.isRead).length;
});

class NotificationsNotifier
    extends AsyncNotifier<List<NotificationModel>> {
  @override
  Future<List<NotificationModel>> build() async {
    return ref.read(notificationServiceProvider).getNotifications();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
      () => ref.read(notificationServiceProvider).getNotifications(),
    );
  }

  Future<void> markAsRead(String id) async {
    final ok = await ref.read(notificationServiceProvider).markAsRead(id);
    if (!ok) return;
    state = state.whenData((list) => [
      for (final n in list)
        if (n.id == id) n.copyWith(isRead: true) else n,
    ]);
  }

  Future<void> markAllAsRead() async {
    final ok = await ref.read(notificationServiceProvider).markAllAsRead();
    if (!ok) return;
    state = state.whenData(
      (list) => list.map((n) => n.copyWith(isRead: true)).toList(),
    );
  }
}

final notificationsNotifierProvider =
    AsyncNotifierProvider<NotificationsNotifier, List<NotificationModel>>(
  () => NotificationsNotifier(),
);
