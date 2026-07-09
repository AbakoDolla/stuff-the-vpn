import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/app_colors.dart';
import '../../providers/notification_provider.dart';
import '../../models/notification_model.dart';

class NotificationsPage extends ConsumerWidget {
  const NotificationsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifAsync = ref.watch(notificationsNotifierProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.gradientDark),
        child: SafeArea(
          child: Column(children: [
            _buildHeader(context, ref, notifAsync),
            Expanded(
              child: notifAsync.when(
                loading: () => const Center(
                    child: CircularProgressIndicator(color: AppColors.accent)),
                error: (_, __) => Center(
                  child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                    const Icon(Icons.notifications_off_outlined,
                        color: AppColors.textMuted, size: 48),
                    const SizedBox(height: 12),
                    const Text('Impossible de charger les notifications',
                        style: TextStyle(color: AppColors.textMuted)),
                    const SizedBox(height: 16),
                    TextButton(
                      onPressed: () =>
                          ref.read(notificationsNotifierProvider.notifier).refresh(),
                      child: const Text('Réessayer',
                          style: TextStyle(color: AppColors.accent)),
                    ),
                  ]),
                ),
                data: (notifs) => notifs.isEmpty
                    ? _buildEmpty()
                    : _buildList(context, ref, notifs),
              ),
            ),
          ]),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, WidgetRef ref,
      AsyncValue<List<NotificationModel>> notifAsync) {
    final unread = notifAsync.valueOrNull?.where((n) => !n.isRead).length ?? 0;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 12, 8),
      child: Row(children: [
        IconButton(
          onPressed: () => Navigator.of(context).pop(),
          icon: const Icon(Icons.arrow_back_rounded,
              color: AppColors.textPrimary),
        ),
        const SizedBox(width: 4),
        const Text('Notifications',
            style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: 22,
                fontWeight: FontWeight.w700)),
        if (unread > 0) ...[
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.2),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text('$unread',
                style: const TextStyle(
                    color: AppColors.accent,
                    fontSize: 12,
                    fontWeight: FontWeight.w700)),
          ),
        ],
        const Spacer(),
        if (unread > 0)
          TextButton(
            onPressed: () =>
                ref.read(notificationsNotifierProvider.notifier).markAllAsRead(),
            child: const Text('Tout lire',
                style: TextStyle(
                    color: AppColors.accent,
                    fontSize: 12,
                    fontWeight: FontWeight.w600)),
          ),
        IconButton(
          onPressed: () =>
              ref.read(notificationsNotifierProvider.notifier).refresh(),
          icon: const Icon(Icons.refresh_rounded, color: AppColors.textMuted),
        ),
      ]),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: AppColors.primary.withOpacity(0.06),
          ),
          child: const Icon(Icons.notifications_none_rounded,
              size: 52, color: AppColors.textMuted),
        ),
        const SizedBox(height: 16),
        const Text('Aucune notification',
            style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        const Text('Vous êtes à jour',
            style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
      ]).animate().fadeIn(),
    );
  }

  Widget _buildList(BuildContext context, WidgetRef ref,
      List<NotificationModel> notifs) {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 40),
      itemCount: notifs.length,
      itemBuilder: (context, i) => _NotifTile(
        notif: notifs[i],
        index: i,
        onMarkRead: notifs[i].isRead
            ? null
            : () => ref
                .read(notificationsNotifierProvider.notifier)
                .markAsRead(notifs[i].id),
      ),
    );
  }
}

class _NotifTile extends StatelessWidget {
  final NotificationModel notif;
  final int index;
  final VoidCallback? onMarkRead;
  const _NotifTile(
      {required this.notif, required this.index, this.onMarkRead});

  @override
  Widget build(BuildContext context) {
    final color = notif.isRead ? AppColors.textMuted : AppColors.accent;
    final timeLabel = DateFormat('dd/MM  HH:mm').format(notif.createdAt.toLocal());

    // Icon by type
    final icon = switch (notif.type.toUpperCase()) {
      'WARNING' => Icons.warning_amber_rounded,
      'ERROR' => Icons.error_outline_rounded,
      'SUCCESS' => Icons.check_circle_outline_rounded,
      _ => Icons.notifications_outlined,
    };
    final iconColor = switch (notif.type.toUpperCase()) {
      'WARNING' => AppColors.warning,
      'ERROR' => AppColors.error,
      'SUCCESS' => AppColors.success,
      _ => notif.isRead ? AppColors.textMuted : AppColors.accent,
    };

    return GestureDetector(
      onTap: onMarkRead,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: !notif.isRead
              ? AppColors.primary.withOpacity(0.05)
              : AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: !notif.isRead
                ? AppColors.primary.withOpacity(0.2)
                : AppColors.cardBorder,
          ),
        ),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: iconColor.withOpacity(0.12),
            ),
            child: Icon(icon, color: iconColor, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
            Row(children: [
              Expanded(
                child: Text(notif.title,
                    style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 14,
                        fontWeight: notif.isRead
                            ? FontWeight.w500
                            : FontWeight.w700)),
              ),
              if (!notif.isRead)
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.accent,
                  ),
                ),
            ]),
            const SizedBox(height: 4),
            Text(notif.message,
                style: const TextStyle(
                    color: AppColors.textMuted, fontSize: 12, height: 1.4),
                maxLines: 2,
                overflow: TextOverflow.ellipsis),
            const SizedBox(height: 6),
            Text(timeLabel,
                style: const TextStyle(
                    color: AppColors.textSecondary, fontSize: 11)),
          ])),
        ]),
      ),
    ).animate(delay: Duration(milliseconds: index * 30)).fadeIn().slideY(
        begin: 0.04, end: 0);
  }
}
