import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../core/app_colors.dart';

class MainScaffold extends StatelessWidget {
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
  Widget build(BuildContext context) {
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

class _NavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  const _NavItem({required this.icon, required this.activeIcon, required this.label});
}

// 3 tabs only — no server selection
const _navItems = [
  _NavItem(icon: Icons.home_outlined,       activeIcon: Icons.home_rounded,       label: 'Accueil'),
  _NavItem(icon: Icons.vpn_lock_outlined,   activeIcon: Icons.vpn_lock_rounded,   label: 'VPN'),
  _NavItem(icon: Icons.person_outline,      activeIcon: Icons.person_rounded,      label: 'Profil'),
];

class _BottomNav extends StatelessWidget {
  final int selectedIndex;
  final ValueChanged<int> onTap;
  const _BottomNav({required this.selectedIndex, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 0, 20, 16),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
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
        children: List.generate(_navItems.length, (i) => _NavBtn(
          item: _navItems[i],
          isSelected: selectedIndex == i,
          onTap: () => onTap(i),
        )),
      ),
    );
  }
}

class _NavBtn extends StatelessWidget {
  final _NavItem item;
  final bool isSelected;
  final VoidCallback onTap;
  const _NavBtn({required this.item, required this.isSelected, required this.onTap});

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
          horizontal: isSelected ? 20 : 12,
        ),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary.withOpacity(0.12) : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isSelected ? item.activeIcon : item.icon,
              color: isSelected ? AppColors.accent : AppColors.textMuted,
              size: 22,
            ),
            if (isSelected) ...[
              const SizedBox(width: 6),
              Text(
                item.label,
                style: const TextStyle(
                  color: AppColors.accent,
                  fontSize: 12,
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
