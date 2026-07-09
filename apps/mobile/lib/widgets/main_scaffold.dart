import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../core/app_colors.dart';
import '../providers/notification_provider.dart';

class MainScaffold extends ConsumerWidget {
  final Widget body;
  final int selectedIndex;
  final ValueChanged<int> onDestinationSelected;

  const MainScaffold({
    super.key,
    required this.body,
    required this.selectedIndex,
    required this.onDestinationSelected,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      extendBody: true,
      body: body,
      bottomNavigationBar: _BottomNav(
        selectedIndex: selectedIndex,
        onTap: onDestinationSelected,
      ),
    );
  }
}

// 5 tabs: Home, Account, Usage, History, Settings
class _NavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  const _NavItem(
      {required this.icon,
      required this.activeIcon,
      required this.label});
}

const _navItems = [
  _NavItem(
      icon: Icons.home_outlined,
      activeIcon: Icons.home_rounded,
      label: 'Accueil'),
  _NavItem(
      icon: Icons.person_outline_rounded,
      activeIcon: Icons.person_rounded,
      label: 'Compte'),
  _NavItem(
      icon: Icons.data_usage_outlined,
      activeIcon: Icons.data_usage_rounded,
      label: 'Conso'),
  _NavItem(
      icon: Icons.history_rounded,
      activeIcon: Icons.history_rounded,
      label: 'Historique'),
  _NavItem(
      icon: Icons.settings_outlined,
      activeIcon: Icons.settings_rounded,
      label: 'Réglages'),
];

class _BottomNav extends ConsumerWidget {
  final int selectedIndex;
  final ValueChanged<int> onTap;
  const _BottomNav({required this.selectedIndex, required this.onTap});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final unread = ref.watch(unreadNotificationCountProvider);

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: AppColors.cardBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: List.generate(_navItems.length, (i) {
          final showBadge = i == 3 && unread > 0; // History tab badge
          return _NavBtn(
            item: _navItems[i],
            isSelected: selectedIndex == i,
            badge: showBadge ? unread : null,
            onTap: () => onTap(i),
          );
        }),
      ),
    );
  }
}

class _NavBtn extends StatelessWidget {
  final _NavItem item;
  final bool isSelected;
  final int? badge;
  final VoidCallback onTap;
  const _NavBtn(
      {required this.item,
      required this.isSelected,
      this.badge,
      required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOutCubic,
        padding: EdgeInsets.symmetric(
          vertical: 8,
          horizontal: isSelected ? 14 : 10,
        ),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withOpacity(0.12)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Icon(
                  isSelected ? item.activeIcon : item.icon,
                  color: isSelected
                      ? AppColors.accent
                      : AppColors.textMuted,
                  size: 22,
                ),
                if (badge != null && badge! > 0)
                  Positioned(
                    top: -4,
                    right: -4,
                    child: Container(
                      width: 16,
                      height: 16,
                      decoration: const BoxDecoration(
                        color: AppColors.accent,
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(
                          badge! > 9 ? '9+' : '$badge',
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.w700),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            if (isSelected) ...[
              const SizedBox(width: 6),
              Text(
                item.label,
                style: const TextStyle(
                  color: AppColors.accent,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ).animate().fadeIn(duration: 200.ms).scaleXY(begin: 0.8, end: 1),
            ],
          ],
        ),
      ),
    );
  }
}

/// Notifications bell button — can be placed in any AppBar or header.
class NotificationsBellButton extends ConsumerWidget {
  const NotificationsBellButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final unread = ref.watch(unreadNotificationCountProvider);
    return GestureDetector(
      onTap: () => context.go('/notifications'),
      child: Container(
        padding: const EdgeInsets.all(8),
        child: Stack(clipBehavior: Clip.none, children: [
          const Icon(Icons.notifications_outlined,
              color: AppColors.textPrimary, size: 24),
          if (unread > 0)
            Positioned(
              top: -2,
              right: -2,
              child: Container(
                width: 16,
                height: 16,
                decoration: const BoxDecoration(
                    color: AppColors.accent, shape: BoxShape.circle),
                child: Center(
                  child: Text(
                    unread > 9 ? '9+' : '$unread',
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 9,
                        fontWeight: FontWeight.w700),
                  ),
                ),
              ),
            ),
        ]),
      ),
    );
  }
}
