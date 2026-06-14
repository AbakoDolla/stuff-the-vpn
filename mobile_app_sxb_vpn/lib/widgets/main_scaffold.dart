import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../app/theme.dart';

class MainScaffold extends StatelessWidget {
  final StatefulNavigationShell shell;
  const MainScaffold({super.key, required this.shell});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: shell,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          border: const Border(top: BorderSide(color: AppColors.cardBorder)),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.3), blurRadius: 20)],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _NavItem(icon: Icons.home_rounded, label: 'Accueil', index: 0, shell: shell),
                _NavItem(icon: Icons.dns_rounded, label: 'Serveurs', index: 1, shell: shell),
                _VpnNavItem(shell: shell),
                _NavItem(icon: Icons.bar_chart_rounded, label: 'Stats', index: 3, shell: shell),
                _NavItem(icon: Icons.person_rounded, label: 'Profil', index: 4, shell: shell),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final int index;
  final StatefulNavigationShell shell;

  const _NavItem({required this.icon, required this.label, required this.index, required this.shell});

  @override
  Widget build(BuildContext context) {
    final isActive = shell.currentIndex == index;
    return GestureDetector(
      onTap: () => shell.goBranch(index),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: isActive ? AppColors.accent : AppColors.textMuted, size: 22),
            const SizedBox(height: 4),
            Text(label,
                style: TextStyle(
                  color: isActive ? AppColors.accent : AppColors.textMuted,
                  fontSize: 10,
                  fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
                )),
          ],
        ),
      ),
    );
  }
}

class _VpnNavItem extends StatelessWidget {
  final StatefulNavigationShell shell;
  const _VpnNavItem({required this.shell});

  @override
  Widget build(BuildContext context) {
    final isActive = shell.currentIndex == 2;
    return GestureDetector(
      onTap: () => shell.goBranch(2),
      child: Container(
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: isActive
              ? AppColors.gradientPrimary
              : const LinearGradient(colors: [AppColors.surfaceLight, AppColors.surfaceLight]),
          boxShadow: isActive
              ? [BoxShadow(color: AppColors.primary.withOpacity(0.4), blurRadius: 12, spreadRadius: 2)]
              : null,
        ),
        child: Icon(Icons.shield_rounded, color: isActive ? Colors.white : AppColors.textMuted, size: 24),
      ),
    );
  }
}
