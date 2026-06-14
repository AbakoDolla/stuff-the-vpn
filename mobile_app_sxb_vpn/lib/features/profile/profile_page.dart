import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme.dart';
import '../../providers/auth_provider.dart';

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider).valueOrNull;
    final user = authState?.user;

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.gradientDark),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 80),
            child: Column(
              children: [
                _buildAvatar(context, user?.username ?? 'STUFF USER', user?.email ?? '').animate().fadeIn().scale(),
                const SizedBox(height: 28),
                _buildMenuSection(context, ref),
                const SizedBox(height: 20),
                _buildLogoutButton(context, ref),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildAvatar(BuildContext context, String name, String email) {
    return Column(children: [
      Container(
        width: 80, height: 80,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: AppColors.gradientPrimary,
          boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.4), blurRadius: 20, spreadRadius: 5)],
        ),
        child: Center(
          child: Text(name.substring(0, 1).toUpperCase(),
              style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w700)),
        ),
      ),
      const SizedBox(height: 14),
      Text(name, style: Theme.of(context).textTheme.headlineMedium),
      const SizedBox(height: 4),
      Text(email, style: Theme.of(context).textTheme.bodySmall),
    ]);
  }

  Widget _buildMenuSection(BuildContext context, WidgetRef ref) {
    final items = [
      _MenuItem(icon: Icons.card_membership_rounded, title: 'Mon forfait', subtitle: '10 GB - Actif'),
      _MenuItem(icon: Icons.bar_chart_rounded, title: 'Utilisation', subtitle: '3.25 GB utilisés'),
      _MenuItem(icon: Icons.devices_rounded, title: 'Appareils connectés', subtitle: '2/3', badge: '2/3'),
      _MenuItem(icon: Icons.security_rounded, title: 'Sécurité'),
      _MenuItem(icon: Icons.settings_rounded, title: 'Paramètres'),
      _MenuItem(icon: Icons.help_outline_rounded, title: 'Aide & Support'),
    ];

    return Container(
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Column(
        children: items.asMap().entries.map((e) {
          final item = e.value;
          final isLast = e.key == items.length - 1;
          return Column(
            children: [
              ListTile(
                leading: Container(
                  width: 38, height: 38,
                  decoration: BoxDecoration(
                    color: AppColors.surfaceLight,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(item.icon, color: AppColors.accent, size: 20),
                ),
                title: Text(item.title, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w500, fontSize: 14)),
                subtitle: item.subtitle != null
                    ? Text(item.subtitle!, style: const TextStyle(color: AppColors.textMuted, fontSize: 12))
                    : null,
                trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted, size: 20),
                onTap: () {},
              ),
              if (!isLast) const Divider(height: 1, indent: 70),
            ],
          );
        }).toList().animate(interval: 60.ms).fadeIn().slideX(begin: 0.05, end: 0),
      ),
    );
  }

  Widget _buildLogoutButton(BuildContext context, WidgetRef ref) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        icon: const Icon(Icons.logout_rounded, color: AppColors.disconnected),
        label: const Text('Se déconnecter', style: TextStyle(color: AppColors.disconnected, fontWeight: FontWeight.w600)),
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: AppColors.disconnected),
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
        onPressed: () async {
          await ref.read(authStateProvider.notifier).logout();
          if (context.mounted) context.go('/auth/login');
        },
      ),
    ).animate().fadeIn(delay: 400.ms);
  }
}

class _MenuItem {
  final IconData icon;
  final String title;
  final String? subtitle;
  final String? badge;
  const _MenuItem({required this.icon, required this.title, this.subtitle, this.badge});
}
