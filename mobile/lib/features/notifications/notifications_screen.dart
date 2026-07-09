import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/widgets.dart';
import '../../models/models.dart';
import '../../services/services.dart';

/// SXB VPN Notifications Screen
/// App notifications and alerts
class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<AppNotification> _notifications = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final notifications = await ApiService.instance.getNotifications();
      setState(() {
        _notifications = notifications;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Impossible de charger les notifications';
        _isLoading = false;
      });
    }
  }

  Future<void> _markAsRead(AppNotification notification) async {
    if (notification.isRead) return;

    try {
      await ApiService.instance.markNotificationRead(notification.id);
      setState(() {
        final index = _notifications.indexOf(notification);
        if (index != -1) {
          _notifications[index] = AppNotification(
            id: notification.id,
            title: notification.title,
            body: notification.body,
            type: notification.type,
            isRead: true,
            createdAt: notification.createdAt,
            metadata: notification.metadata,
          );
        }
      });
    } catch (e) {
      // Silently fail
    }
  }

  Future<void> _markAllAsRead() async {
    try {
      await ApiService.instance.markAllNotificationsRead();
      setState(() {
        _notifications = _notifications
            .map((n) => AppNotification(
                  id: n.id,
                  title: n.title,
                  body: n.body,
                  type: n.type,
                  isRead: true,
                  createdAt: n.createdAt,
                  metadata: n.metadata,
                ))
            .toList();
      });
    } catch (e) {
      // Silently fail
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Notifications',
          style: AppTypography.titleLarge.copyWith(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w600,
          ),
        ),
        actions: [
          if (_notifications.any((n) => !n.isRead))
            TextButton(
              onPressed: _markAllAsRead,
              child: Text(
                'Tout lu',
                style: AppTypography.buttonMedium.copyWith(
                  color: AppColors.primary,
                ),
              ),
            ),
        ],
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppColors.backgroundGradient,
        ),
        child: _isLoading
            ? const Center(
                child: CircularProgressIndicator(color: AppColors.primary),
              )
            : _error != null
                ? _buildError()
                : _notifications.isEmpty
                    ? _buildEmpty()
                    : _buildNotificationsList(),
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              color: AppColors.error,
              size: AppSpacing.iconXxl,
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              _error!,
              style: AppTypography.bodyMedium.copyWith(
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.lg),
            SxbButton(
              text: 'Réessayer',
              onPressed: _loadNotifications,
              isOutlined: true,
              icon: Icons.refresh,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.notifications_none_outlined,
              color: AppColors.textTertiary,
              size: AppSpacing.iconGiant,
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              'Aucune notification',
              style: AppTypography.titleMedium.copyWith(
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Vous êtes à jour!',
              style: AppTypography.bodySmall.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNotificationsList() {
    return ListView.builder(
      padding: const EdgeInsets.all(AppSpacing.screenPaddingHorizontal),
      itemCount: _notifications.length,
      itemBuilder: (context, index) {
        final notification = _notifications[index];
        return _buildNotificationItem(notification);
      },
    );
  }

  Widget _buildNotificationItem(AppNotification notification) {
    IconData icon;
    Color iconColor;

    switch (notification.type) {
      case 'QUOTA_WARNING':
        icon = Icons.warning_amber_outlined;
        iconColor = AppColors.warning;
        break;
      case 'QUOTA_EXHAUSTED':
        icon = Icons.error_outline;
        iconColor = AppColors.error;
        break;
      case 'ACCOUNT_EXPIRING':
        icon = Icons.schedule_outlined;
        iconColor = AppColors.warning;
        break;
      case 'UPDATE_AVAILABLE':
        icon = Icons.system_update_outlined;
        iconColor = AppColors.primary;
        break;
      case 'CONFIG_UPDATE':
        icon = Icons.sync_outlined;
        iconColor = AppColors.secondary;
        break;
      case 'CONNECTION_LOST':
        icon = Icons.wifi_off_outlined;
        iconColor = AppColors.error;
        break;
      default:
        icon = Icons.info_outline;
        iconColor = AppColors.textSecondary;
    }

    return GestureDetector(
      onTap: () => _markAsRead(notification),
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.md),
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: notification.isRead
              ? AppColors.surface
              : AppColors.primary.withOpacity(0.1),
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          border: Border.all(
            color: notification.isRead
                ? AppColors.border.withOpacity(0.5)
                : AppColors.primary.withOpacity(0.3),
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(AppSpacing.sm),
              decoration: BoxDecoration(
                color: iconColor.withOpacity(0.15),
                borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
              ),
              child: Icon(
                icon,
                color: iconColor,
                size: AppSpacing.iconLg,
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          notification.title,
                          style: AppTypography.bodyMedium.copyWith(
                            color: AppColors.textPrimary,
                            fontWeight: notification.isRead
                                ? FontWeight.w400
                                : FontWeight.w600,
                          ),
                        ),
                      ),
                      if (!notification.isRead)
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppColors.primary,
                          ),
                        ),
                    ],
                  ),
                  if (notification.body != null) ...[
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      notification.body!,
                      style: AppTypography.bodySmall.copyWith(
                        color: AppColors.textSecondary,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    notification.timeAgo,
                    style: AppTypography.caption.copyWith(
                      color: AppColors.textTertiary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
