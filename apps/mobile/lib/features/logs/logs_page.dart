import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/app_colors.dart';
import '../../providers/logs_provider.dart';
import '../../providers/notification_provider.dart';
import '../../models/notification_model.dart';

class LogsPage extends ConsumerWidget {
  const LogsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final logsAsync = ref.watch(connectionLogsProvider);
    final notifAsync = ref.watch(notificationsNotifierProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.gradientDark),
        child: SafeArea(
          child: Column(children: [
            _buildHeader(context, ref),
            Expanded(
              child: logsAsync.when(
                loading: () => const Center(
                    child: CircularProgressIndicator(color: AppColors.accent)),
                error: (_, __) => _buildError(context, ref),
                data: (logs) {
                  final notifs = notifAsync.valueOrNull ?? [];
                  return _buildCombined(context, ref, logs, notifs);
                },
              ),
            ),
          ]),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
      child: Row(children: [
        const Text('Historique',
            style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: 22,
                fontWeight: FontWeight.w700)),
        const Spacer(),
        IconButton(
          onPressed: () {
            ref.invalidate(connectionLogsProvider);
            ref.invalidate(notificationsNotifierProvider);
          },
          icon: const Icon(Icons.refresh_rounded, color: AppColors.accent),
          tooltip: 'Actualiser',
        ),
      ]),
    );
  }

  Widget _buildError(BuildContext context, WidgetRef ref) {
    return Center(
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: AppColors.error.withValues(alpha: 0.1),
          ),
          child: const Icon(Icons.wifi_off_rounded,
              size: 48, color: AppColors.error),
        ),
        const SizedBox(height: 16),
        const Text('Impossible de charger l\'historique',
            style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        const Text('Vérifiez votre connexion',
            style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
        const SizedBox(height: 24),
        ElevatedButton.icon(
          onPressed: () => ref.invalidate(connectionLogsProvider),
          icon: const Icon(Icons.refresh_rounded),
          label: const Text('Réessayer'),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12)),
          ),
        ),
      ]),
    );
  }

  Widget _buildCombined(BuildContext context, WidgetRef ref,
      List<Map<String, dynamic>> logs, List<NotificationModel> notifs) {
    if (logs.isEmpty && notifs.isEmpty) {
      return Center(
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.primary.withValues(alpha: 0.08),
            ),
            child: const Icon(Icons.history_rounded,
                size: 48, color: AppColors.textMuted),
          ),
          const SizedBox(height: 16),
          const Text('Aucun historique',
              style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 16,
                  fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          const Text('Connectez-vous au VPN pour démarrer',
              style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
        ]).animate().fadeIn(),
      );
    }

    // Build combined items list: connection logs + notifications
    final items = <_HistoryItem>[];

    for (final log in logs) {
      final action = log['action']?.toString() ?? log['event']?.toString() ?? '';
      final isConnect = action == 'VPN_CONNECT' || action == 'CONNECT';
      final createdAt = log['createdAt']?.toString() ?? '';
      final dt = DateTime.tryParse(createdAt)?.toLocal();
      items.add(_HistoryItem(
        type: isConnect ? _HType.connect : _HType.disconnect,
        title: isConnect ? 'Connecté' : 'Déconnecté',
        subtitle: null,
        dt: dt,
      ));
    }

    for (final n in notifs) {
      items.add(_HistoryItem(
        type: _HType.notification,
        title: n.title,
        subtitle: n.message,
        dt: n.createdAt.toLocal(),
        isRead: n.isRead,
        notifId: n.id,
      ));
    }

    // Sort by date descending
    items.sort((a, b) {
      if (a.dt == null && b.dt == null) return 0;
      if (a.dt == null) return 1;
      if (b.dt == null) return -1;
      return b.dt!.compareTo(a.dt!);
    });

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
      itemCount: items.length,
      itemBuilder: (context, i) => _HistoryTile(
        item: items[i],
        index: i,
        onMarkRead: items[i].notifId != null
            ? () => ref
                .read(notificationsNotifierProvider.notifier)
                .markAsRead(items[i].notifId!)
            : null,
      ),
    );
  }
}

enum _HType { connect, disconnect, notification }

class _HistoryItem {
  final _HType type;
  final String title;
  final String? subtitle;
  final DateTime? dt;
  final bool isRead;
  final String? notifId;

  const _HistoryItem({
    required this.type,
    required this.title,
    this.subtitle,
    this.dt,
    this.isRead = true,
    this.notifId,
  });
}

class _HistoryTile extends StatelessWidget {
  final _HistoryItem item;
  final int index;
  final VoidCallback? onMarkRead;
  const _HistoryTile(
      {required this.item, required this.index, this.onMarkRead});

  @override
  Widget build(BuildContext context) {
    final Color color;
    final IconData icon;
    switch (item.type) {
      case _HType.connect:
        color = AppColors.success;
        icon = Icons.link_rounded;
        break;
      case _HType.disconnect:
        color = AppColors.error;
        icon = Icons.link_off_rounded;
        break;
      case _HType.notification:
        color = item.isRead ? AppColors.textMuted : AppColors.accent;
        icon = item.isRead
            ? Icons.notifications_none_rounded
            : Icons.notifications_active_rounded;
        break;
    }

    String timeLabel = '';
    if (item.dt != null) {
      timeLabel = DateFormat('dd/MM  HH:mm').format(item.dt!);
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: item.type == _HType.notification && !item.isRead
            ? AppColors.primary.withValues(alpha: 0.05)
            : AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: item.type == _HType.notification && !item.isRead
              ? AppColors.primary.withValues(alpha: 0.2)
              : AppColors.cardBorder,
        ),
      ),
      child: ListTile(
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        leading: Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: color.withValues(alpha: 0.12),
          ),
          child: Icon(icon, color: color, size: 18),
        ),
        title: Text(item.title,
            style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: 14,
                fontWeight: item.type == _HType.notification && !item.isRead
                    ? FontWeight.w600
                    : FontWeight.w500)),
        subtitle: item.subtitle != null
            ? Text(item.subtitle!,
                style: const TextStyle(
                    color: AppColors.textMuted, fontSize: 12),
                maxLines: 1,
                overflow: TextOverflow.ellipsis)
            : null,
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(timeLabel,
                style: const TextStyle(
                    color: AppColors.textSecondary, fontSize: 11)),
            if (item.type == _HType.notification && !item.isRead &&
                onMarkRead != null) ...[
              const SizedBox(height: 4),
              GestureDetector(
                onTap: onMarkRead,
                child: const Text('Lu',
                    style: TextStyle(
                        color: AppColors.accent,
                        fontSize: 10,
                        fontWeight: FontWeight.w600)),
              ),
            ],
          ],
        ),
      ),
    ).animate(delay: Duration(milliseconds: index * 25)).fadeIn().slideX(
        begin: 0.04, end: 0);
  }
}
