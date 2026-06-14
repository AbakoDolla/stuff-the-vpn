import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../app/theme.dart';
import '../../providers/auth_provider.dart';

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider).valueOrNull;
    final user = authState?.user;

    final planLabel = user?.plan ?? 'Aucun forfait';
    final limitLabel = user?.dataLimit != null && user!.dataLimit! > 0
        ? '${user.dataLimit!.toStringAsFixed(0)} GB'
        : '—';
    final expiryLabel = user?.planExpiry != null
        ? 'Expire ${DateFormat('dd/MM/yyyy').format(user!.planExpiry!)}'
        : '—';
    final usedLabel = user?.dataUsed != null
        ? '${user!.dataUsed!.toStringAsFixed(2)} GB utilisés'
        : '0 GB';
    final deviceLabel = user?.deviceLimit != null
        ? 'Limite : ${user!.deviceLimit} appareils'
        : '—';

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.gradientDark),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 80),
            child: Column(
              children: [
                _buildAvatar(context, user?.username ?? 'USER', user?.email ?? '').animate().fadeIn().scale(),
                const SizedBox(height: 28),
                _buildMenuSection(context, ref, planLabel, limitLabel, expiryLabel, usedLabel, deviceLabel),
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
    final initial = name.isNotEmpty ? name.substring(0, 1).toUpperCase() : 'U';
    return Column(children: [
      Container(
        width: 80, height: 80,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: AppColors.gradientPrimary,
          boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.4), blurRadius: 20, spreadRadius: 5)],
        ),
        child: Center(
          child: Text(initial, style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w700)),
        ),
      ),
      const SizedBox(height: 14),
      Text(name, style: Theme.of(context).textTheme.headlineMedium),
      const SizedBox(height: 4),
      GestureDetector(
        onTap: () {
          Clipboard.setData(ClipboardData(text: email));
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Email copié'), duration: Duration(seconds: 2)),
          );
        },
        child: Text(email, style: Theme.of(context).textTheme.bodySmall),
      ),
    ]);
  }

  Widget _buildMenuSection(BuildContext context, WidgetRef ref,
      String planLabel, String limitLabel, String expiryLabel, String usedLabel, String deviceLabel) {
    final items = [
      _MenuItem(
        icon: Icons.card_membership_rounded,
        title: 'Mon forfait',
        subtitle: '$limitLabel — $expiryLabel',
        onTap: null,
      ),
      _MenuItem(
        icon: Icons.bar_chart_rounded,
        title: 'Utilisation',
        subtitle: usedLabel,
        onTap: null,
      ),
      _MenuItem(
        icon: Icons.confirmation_number_outlined,
        title: 'Activer un voucher',
        subtitle: 'Entrez votre code d\'\accès',
        onTap: (ctx) => ctx.go('/voucher/redeem'),
        highlight: true,
      ),
      _MenuItem(
        icon: Icons.devices_rounded,
        title: 'Appareils',
        subtitle: deviceLabel,
        onTap: null,
      ),
      _MenuItem(icon: Icons.security_rounded, title: 'Sécurité', onTap: null),
      _MenuItem(icon: Icons.settings_rounded, title: 'Paramètres', onTap: null),
      _MenuItem(icon: Icons.help_outline_rounded, title: 'Aide & Support', onTap: null),
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
                    color: item.highlight == true ? AppColors.primary.withOpacity(0.2) : AppColors.surfaceLight,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(item.icon, color: item.highlight == true ? AppColors.primary : AppColors.accent, size: 20),
                ),
                title: Text(item.title,
                    style: TextStyle(
                      color: item.highlight == true ? AppColors.primary : AppColors.textPrimary,
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    )),
                subtitle: item.subtitle != null
                    ? Text(item.subtitle!, style: const TextStyle(color: AppColors.textMuted, fontSize: 12))
                    : null,
                trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted, size: 20),
                onTap: item.onTap != null ? () => item.onTap!(context) : null,
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
  final bool? highlight;
  final void Function(BuildContext)? onTap;
  const _MenuItem({required this.icon, required this.title, this.subtitle, this.highlight, this.onTap});
}
