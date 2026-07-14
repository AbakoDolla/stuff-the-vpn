import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../core/app_colors.dart';
import '../../providers/activation_provider.dart';
import '../../services/user_service.dart';
import '../../services/device_service.dart';

final _accountSubProvider = FutureProvider.autoDispose<Map<String, dynamic>?>((ref) async {
  return ref.read(userServiceProvider).getSubscription();
});

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activation = ref.watch(activationProvider).valueOrNull;
    final user = activation?.user;
    final sub = ref.watch(_accountSubProvider);
    final subData = sub.valueOrNull;

    final expireAt = subData?['expireAt']?.toString();
    final planName = subData?['plan']?.toString() ?? user?.plan ?? '';
    final status = subData?['status']?.toString() ?? 'ACTIVE';
    final dataLimit = _d(subData?['dataLimit']) ?? 0.0;
    final dataUsed = _d(subData?['dataUsed']) ?? 0.0;
    final usagePct =
        dataLimit > 0 ? (dataUsed / dataLimit).clamp(0.0, 1.0) : 0.0;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.gradientDark),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
            child: Column(children: [
              _buildAvatar(context, user?.name ?? '', user?.email ?? '—')
                  .animate()
                  .fadeIn()
                  .scale(duration: 600.ms, curve: Curves.elasticOut),
              const SizedBox(height: 28),
              _buildSubscriptionCard(
                context,
                isLoading: sub.isLoading,
                planName: planName,
                status: status,
                expireAt: expireAt,
                dataUsed: dataUsed,
                dataLimit: dataLimit,
                usagePct: usagePct,
              ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.08, end: 0),
              const SizedBox(height: 16),
              _DeviceInfoCard()
                  .animate()
                  .fadeIn(delay: 200.ms)
                  .slideY(begin: 0.08, end: 0),
              const SizedBox(height: 16),
              const _AppInfoCard()
                  .animate()
                  .fadeIn(delay: 250.ms)
                  .slideY(begin: 0.08, end: 0),
              const SizedBox(height: 24),
              _buildLogoutButton(context, ref).animate().fadeIn(delay: 350.ms),
            ]),
          ),
        ),
      ),
    );
  }

  Widget _buildAvatar(BuildContext context, String name, String email) {
    final initial = name.isNotEmpty ? name[0].toUpperCase() : 'U';
    return Column(children: [
      Container(
        width: 80,
        height: 80,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: AppColors.gradientBrand,
          boxShadow: [
            BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.4),
                blurRadius: 20,
                spreadRadius: 5)
          ],
        ),
        child: Center(
          child: Text(initial,
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 32,
                  fontWeight: FontWeight.w700)),
        ),
      ),
      const SizedBox(height: 14),
      if (name.isNotEmpty)
        Text(name,
            style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 20,
                fontWeight: FontWeight.w600)),
      const SizedBox(height: 4),
      GestureDetector(
        onTap: () {
          Clipboard.setData(ClipboardData(text: email));
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('Email copié'),
              backgroundColor: AppColors.surface,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
              duration: const Duration(seconds: 2),
            ),
          );
        },
        child: Text(email,
            style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
      ),
    ]);
  }

  Widget _buildSubscriptionCard(
    BuildContext context, {
    required bool isLoading,
    required String planName,
    required String status,
    required String? expireAt,
    required double dataUsed,
    required double dataLimit,
    required double usagePct,
  }) {
    final statusColor = status == 'ACTIVE'
        ? AppColors.success
        : status == 'EXPIRED'
            ? AppColors.error
            : AppColors.warning;
    final statusLabel = status == 'ACTIVE'
        ? 'Actif'
        : status == 'EXPIRED'
            ? 'Expiré'
            : status == 'SUSPENDED'
                ? 'Suspendu'
                : status;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.cardBorder),
        gradient: AppColors.gradientCard,
      ),
      child: isLoading
          ? const Center(
              child: SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: AppColors.accent)))
          : Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                const Text('Mon abonnement',
                    style:
                        TextStyle(color: AppColors.textMuted, fontSize: 12)),
                _StatusBadge(label: statusLabel, color: statusColor),
              ]),
              const SizedBox(height: 14),
              if (planName.isNotEmpty) ...[
                ShaderMask(
                  shaderCallback: (b) => const LinearGradient(
                    colors: [AppColors.primary, AppColors.accent],
                  ).createShader(b),
                  child: Text(planName,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.w700)),
                ),
                const SizedBox(height: 6),
              ],
              if (expireAt != null)
                Row(children: [
                  const Icon(Icons.calendar_today_outlined,
                      color: AppColors.textMuted, size: 12),
                  const SizedBox(width: 4),
                  Text('Expire le ${_formatDate(expireAt)}',
                      style: const TextStyle(
                          color: AppColors.textMuted, fontSize: 12)),
                ]),
              if (dataLimit > 0) ...[
                const SizedBox(height: 16),
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  const Text('Quota utilisé',
                      style:
                          TextStyle(color: AppColors.textMuted, fontSize: 11)),
                  Text(
                      '${_formatGB(dataUsed)} / ${_formatGB(dataLimit)}',
                      style: const TextStyle(
                          color: AppColors.textSecondary, fontSize: 11)),
                ]),
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: usagePct,
                    backgroundColor: AppColors.cardBorder,
                    valueColor: AlwaysStoppedAnimation(
                      usagePct > 0.8
                          ? AppColors.error
                          : usagePct > 0.5
                              ? AppColors.warning
                              : AppColors.accent,
                    ),
                    minHeight: 6,
                  ),
                ),
              ],
            ]),
    );
  }

  Widget _buildLogoutButton(BuildContext context, WidgetRef ref) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        icon: const Icon(Icons.logout_rounded, color: AppColors.error),
        label: const Text('Se déconnecter',
            style: TextStyle(
                color: AppColors.error, fontWeight: FontWeight.w600)),
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: AppColors.error),
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14)),
        ),
        onPressed: () async {
          await ref.read(activationProvider.notifier).deactivate();
          if (context.mounted) context.go('/activation');
        },
      ),
    );
  }

  static String _formatDate(String s) {
    final dt = DateTime.tryParse(s);
    if (dt == null) return s;
    return DateFormat('dd/MM/yyyy').format(dt);
  }

  static String _formatGB(double gb) {
    if (gb <= 0) return '0 GB';
    if (gb >= 1000) return '${(gb / 1000).toStringAsFixed(1)} TB';
    return '${gb.toStringAsFixed(1)} GB';
  }

  static double? _d(dynamic v) {
    if (v == null) return null;
    if (v is double) return v;
    if (v is int) return v.toDouble();
    return double.tryParse(v.toString());
  }
}

class _StatusBadge extends StatelessWidget {
  final String label;
  final Color color;
  const _StatusBadge({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(label,
          style: TextStyle(
              color: color, fontSize: 11, fontWeight: FontWeight.w600)),
    );
  }
}

class _DeviceInfoCard extends ConsumerWidget {
  const _DeviceInfoCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final deviceService = ref.read(deviceServiceProvider);
    return FutureBuilder<String>(
      future: deviceService.getOrCreateDeviceId(),
      builder: (context, snap) {
        final deviceId = snap.data ?? '';
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.cardBorder),
            color: AppColors.surface,
          ),
          child: Row(children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.primary.withValues(alpha: 0.12),
              ),
              child: const Icon(Icons.phone_android_rounded,
                  color: AppColors.primary, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                  const Text('Appareil enregistré',
                      style: TextStyle(
                          color: AppColors.textMuted, fontSize: 11)),
                  const SizedBox(height: 2),
                  Text(
                    deviceId.isNotEmpty ? deviceId : '—',
                    style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 12,
                        fontFamily: 'monospace'),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ])),
            if (deviceId.isNotEmpty)
              GestureDetector(
                onTap: () {
                  Clipboard.setData(ClipboardData(text: deviceId));
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: const Text('ID copié'),
                      backgroundColor: AppColors.surface,
                      behavior: SnackBarBehavior.floating,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10)),
                      duration: const Duration(seconds: 2),
                    ),
                  );
                },
                child: const Icon(Icons.copy_outlined,
                    color: AppColors.accent, size: 16),
              ),
          ]),
        );
      },
    );
  }
}

class _AppInfoCard extends StatelessWidget {
  const _AppInfoCard();

  @override
  Widget build(BuildContext context) {
    const version = '1.0.0';
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
        color: AppColors.surface,
      ),
      child: Row(children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: AppColors.accent.withValues(alpha: 0.12),
          ),
          child: const Icon(Icons.info_outline_rounded,
              color: AppColors.accent, size: 20),
        ),
        const SizedBox(width: 12),
        const Expanded(
            child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
              Text("Version de l'application",
                  style:
                      TextStyle(color: AppColors.textMuted, fontSize: 11)),
              SizedBox(height: 2),
              Text('SxBVPN v$version',
                  style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 13,
                      fontWeight: FontWeight.w600)),
            ])),
      ]),
    );
  }
}
