import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../core/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../services/user_service.dart';

/// Subscription data cached at profile level
final _profileSubProvider = FutureProvider<Map<String, dynamic>?>((ref) async {
  final userService = ref.watch(userServiceProvider);
  return userService.getSubscription();
});

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider).valueOrNull;
    final user = authState?.user;
    final sub = ref.watch(_profileSubProvider);

    final subData = sub.valueOrNull;
    final dataLimit     = _d(subData?['dataLimit'])     ?? 0.0;
    final dataUsed      = _d(subData?['dataUsed'])      ?? 0.0;
    final dataRemaining = _d(subData?['dataRemaining']) ?? 0.0;
    final status        = subData?['status']?.toString() ?? 'ACTIVE';
    final daysLeft      = subData?['daysLeft'] as int?;
    final expireAt      = subData?['expireAt']?.toString();

    final planLabel      = _formatStatus(status);
    final limitLabel     = dataLimit > 0 ? _formatGB(dataLimit) : '—';
    final usedLabel      = '${_formatGB(dataUsed)} utilisés';
    final remainingLabel = '${_formatGB(dataRemaining)} restants';
    final expiryLabel    = expireAt != null
        ? 'Expire le ${_formatDate(expireAt)}'
        : sub.isLoading ? 'Chargement…' : '—';
    final daysLeftLabel  = daysLeft != null ? '$daysLeft jours restants' : null;

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF0B0F1A), Color(0xFF0D1525)],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 80),
            child: Column(
              children: [
                _buildAvatar(context, user?.name ?? 'Utilisateur', user?.email ?? '—')
                    .animate().fadeIn().scale(),
                const SizedBox(height: 28),

                // Subscription card
                _buildSubCard(
                  context,
                  isLoading: sub.isLoading,
                  planLabel: planLabel,
                  limitLabel: limitLabel,
                  expiryLabel: expiryLabel,
                  daysLeftLabel: daysLeftLabel,
                  dataUsed: dataUsed,
                  dataLimit: dataLimit,
                ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.1, end: 0),

                const SizedBox(height: 16),

                // Usage card
                _buildUsageCard(context, usedLabel, remainingLabel, dataUsed, dataLimit,
                  isLoading: sub.isLoading)
                    .animate().fadeIn(delay: 150.ms).slideY(begin: 0.1, end: 0),

                const SizedBox(height: 16),

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
    final initial = name.isNotEmpty ? name[0].toUpperCase() : 'U';
    return Column(children: [
      Container(
        width: 80, height: 80,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF2563EB), Color(0xFF06B6D4)],
          ),
          boxShadow: [BoxShadow(color: const Color(0xFF2563EB).withOpacity(0.4), blurRadius: 20, spreadRadius: 5)],
        ),
        child: Center(child: Text(initial, style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w700))),
      ),
      const SizedBox(height: 14),
      Text(name, style: Theme.of(context).textTheme.headlineMedium),
      const SizedBox(height: 4),
      GestureDetector(
        onTap: () {
          Clipboard.setData(ClipboardData(text: email));
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Copié'), duration: Duration(seconds: 2)),
          );
        },
        child: Text(email, style: Theme.of(context).textTheme.bodySmall),
      ),
    ]);
  }

  Widget _buildSubCard(
    BuildContext context, {
    required bool isLoading,
    required String planLabel,
    required String limitLabel,
    required String expiryLabel,
    required String? daysLeftLabel,
    required double dataUsed,
    required double dataLimit,
  }) {
    final pct = dataLimit > 0 ? (dataUsed / dataLimit).clamp(0.0, 1.0) : 0.0;
    final pctColor = pct > 0.8 ? AppColors.disconnected : pct > 0.5 ? AppColors.warning : AppColors.connected;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.cardBorder),
        gradient: AppColors.gradientCard,
      ),
      child: isLoading
          ? const Center(child: SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2)))
          : Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('Mon abonnement', style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                  ),
                  child: Text(planLabel, style: const TextStyle(color: AppColors.primary, fontSize: 11, fontWeight: FontWeight.w600)),
                ),
              ]),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Quota total', style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                  Text(limitLabel, style: const TextStyle(color: AppColors.textPrimary, fontSize: 18, fontWeight: FontWeight.bold)),
                ])),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Expire', style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                  Text(expiryLabel, style: const TextStyle(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w600)),
                  if (daysLeftLabel != null)
                    Text(daysLeftLabel, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                ])),
              ]),
              if (dataLimit > 0) ...[
                const SizedBox(height: 14),
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  Text('Utilisation', style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                  Text('${(pct * 100).toInt()}%', style: TextStyle(color: pctColor, fontSize: 11, fontWeight: FontWeight.w600)),
                ]),
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: pct,
                    backgroundColor: AppColors.cardBorder,
                    valueColor: AlwaysStoppedAnimation<Color>(pctColor),
                    minHeight: 6,
                  ),
                ),
              ],
            ]),
    );
  }

  Widget _buildUsageCard(
    BuildContext context,
    String usedLabel,
    String remainingLabel,
    double dataUsed,
    double dataLimit, {
    required bool isLoading,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.cardBorder),
        gradient: AppColors.gradientCard,
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Consommation', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
        const SizedBox(height: 14),
        if (isLoading)
          const Center(child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)))
        else
          Row(children: [
            Expanded(child: _usageStat('Utilisé', usedLabel, AppColors.disconnected)),
            const SizedBox(width: 16),
            Expanded(child: _usageStat('Restant', remainingLabel, AppColors.connected)),
          ]),
      ]),
    );
  }

  Widget _usageStat(String label, String value, Color color) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
      const SizedBox(height: 4),
      Text(value, style: TextStyle(color: color, fontSize: 16, fontWeight: FontWeight.bold)),
    ]);
  }

  Widget _buildMenuSection(BuildContext context, WidgetRef ref) {
    final items = [
      _MenuItem(icon: Icons.confirmation_number_outlined, title: 'Activer un voucher',
          onTap: (ctx) => ctx.go('/voucher/redeem')),
      _MenuItem(icon: Icons.bar_chart_rounded, title: 'Statistiques d\'utilisation',
          onTap: (ctx) => ctx.go('/usage')),
      _MenuItem(icon: Icons.history_rounded, title: 'Historique de connexion',
          onTap: (ctx) => ctx.go('/logs')),
      _MenuItem(icon: Icons.info_outline_rounded, title: 'À propos', subtitle: 'SXB VPN v1.0.0'),
    ];

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.cardBorder),
        gradient: AppColors.gradientCard,
      ),
      child: Column(
        children: items.asMap().entries.map((e) {
          final i = e.key;
          final item = e.value;
          final isLast = i == items.length - 1;
          return Column(children: [
            ListTile(
              leading: Icon(item.icon, color: AppColors.primary, size: 20),
              title: Text(item.title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
              subtitle: item.subtitle != null
                  ? Text(item.subtitle!, style: const TextStyle(fontSize: 12, color: AppColors.textMuted))
                  : null,
              trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted, size: 20),
              onTap: item.onTap != null ? () => item.onTap!(context) : null,
            ),
            if (!isLast) const Divider(height: 1, indent: 56),
          ]);
        }).toList().animate(interval: 60.ms).fadeIn().slideX(begin: 0.05, end: 0),
      ),
    );
  }

  Widget _buildLogoutButton(BuildContext context, WidgetRef ref) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        icon: const Icon(Icons.logout_rounded, color: AppColors.disconnected),
        label: const Text('Se déconnecter',
            style: TextStyle(color: AppColors.disconnected, fontWeight: FontWeight.w600)),
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

  String _formatStatus(String s) {
    const m = {'ACTIVE': 'Actif', 'EXPIRED': 'Expiré', 'SUSPENDED': 'Suspendu', 'BANNED': 'Banni'};
    return m[s] ?? s;
  }

  String _formatGB(double gb) {
    if (gb <= 0) return '0 GB';
    if (gb >= 1000) return '${(gb / 1000).toStringAsFixed(1)} TB';
    return '${gb.toStringAsFixed(1)} GB';
  }

  String _formatDate(String s) {
    final dt = DateTime.tryParse(s);
    if (dt == null) return s;
    return DateFormat('dd/MM/yyyy').format(dt);
  }

  static double? _d(dynamic v) {
    if (v == null) return null;
    if (v is double) return v;
    if (v is int) return v.toDouble();
    return double.tryParse(v.toString());
  }
}

class _MenuItem {
  final IconData icon;
  final String title;
  final String? subtitle;
  final void Function(BuildContext)? onTap;
  const _MenuItem({required this.icon, required this.title, this.subtitle, this.onTap});
}
