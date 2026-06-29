import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../core/app_colors.dart';

class MainScaffold extends StatefulWidget {
  final Widget body;
  final int selectedIndex;
  final Function(int) onDestinationSelected;

  const MainScaffold({
    super.key,
    required this.body,
    required this.selectedIndex,
    required this.onDestinationSelected,
  });

  @override
  State<MainScaffold> createState() => _MainScaffoldState();
}

class _MainScaffoldState extends State<MainScaffold>
    with SingleTickerProviderStateMixin {
  late final List<_NavItem> _navItems;

  @override
  void initState() {
    super.initState();
    _navItems = const [
      _NavItem(icon: Icons.home_rounded, activeIcon: Icons.home_rounded, label: 'Accueil'),
      _NavItem(icon: Icons.shield_outlined, activeIcon: Icons.shield_rounded, label: 'VPN'),
      _NavItem(icon: Icons.public_rounded, activeIcon: Icons.public_rounded, label: 'Serveurs'),
      _NavItem(icon: Icons.person_outline_rounded, activeIcon: Icons.person_rounded, label: 'Profil'),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: widget.body,
      extendBody: true,
      bottomNavigationBar: Container(
        margin: const EdgeInsets.only(left: 16, right: 16, bottom: 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withOpacity(0.08),
              blurRadius: 20,
              spreadRadius: 2,
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    AppColors.surface.withOpacity(0.85),
                    AppColors.background.withOpacity(0.75),
                  ],
                ),
                border: Border.all(
                  color: AppColors.cardBorder.withOpacity(0.15),
                  width: 1,
                ),
              ),
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
              child: SafeArea(
                top: false,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: List.generate(_navItems.length, (index) {
                    final isSelected = widget.selectedIndex == index;
                    return _buildNavItem(index, isSelected);
                  }),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, bool isSelected) {
    final item = _navItems[index];
    return Expanded(
      child: GestureDetector(
        onTap: () => widget.onDestinationSelected(index),
        behavior: HitTestBehavior.opaque,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOutCubic,
          padding: EdgeInsets.symmetric(
            vertical: 8,
            horizontal: isSelected ? 16 : 8,
          ),
          decoration: BoxDecoration(
            color: isSelected
                ? AppColors.primary.withOpacity(0.12)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(14),
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
      ),
    );
  }
}

class _NavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;

  const _NavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
  });
}
