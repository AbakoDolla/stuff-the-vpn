import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/app_colors.dart';
import '../../core/demo_data.dart';
import '../../providers/auth_provider.dart';
import '../../providers/vpn_provider.dart';
import '../../models/server_model.dart';
import '../../models/vpn_config_model.dart';
import '../../widgets/vpn_button.dart';

class VpnConnectPage extends ConsumerWidget {
  const VpnConnectPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vpnState = ref.watch(vpnProvider);
    final authState = ref.watch(authStateProvider).valueOrNull;
    final server = vpnState.currentServer ?? demoServers.first;
    final config = vpnState.config;
    final remaining = authState?.user?.dataRemaining ?? 0;

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.gradientDark),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              children: [
                const SizedBox(height: 16),
                _buildStatusHeader(context, vpnState),
                const SizedBox(height: 48),
                VpnButton(
                  vpnState: vpnState,
                  onTap: () => ref.read(vpnProvider.notifier).toggle(),
                ).animate().scale(duration: 400.ms, curve: Curves.elasticOut),
                const SizedBox(height: 48),
                _buildTimer(context, vpnState),
                const SizedBox(height: 32),
                _buildServerCard(context, ref, server, config, vpnState.isConnected),
                const SizedBox(height: 16),
                if (config != null && vpnState.isConnected) ...[
                  _buildConfigInfo(context, config),
                  const SizedBox(height: 16),
                ],
                if (vpnState.isConnected) _buildSpeedRow(context, vpnState),
                if (!vpnState.isConnected && remaining <= 0 && authState?.user != null)
                  _buildNoQuotaBanner(context),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatusHeader(BuildContext context, VpnState state) {
    final label = state.isConnected
        ? 'Connecté'
        : state.isConnecting
            ? 'Connexion...'
            : 'Déconnecté';
    final color = state.isConnected
        ? AppColors.connected
        : state.isConnecting
            ? AppColors.warning
            : AppColors.textMuted;
    return Text(
      label,
      style: Theme.of(context)
          .textTheme
          .headlineLarge
          ?.copyWith(color: color, fontSize: 28),
    ).animate(key: ValueKey(state.status)).fadeIn().slideY(begin: -0.2, end: 0);
  }

  Widget _buildTimer(BuildContext context, VpnState state) {
    if (!state.isConnected && !state.isConnecting) return const SizedBox.shrink();
    final d = state.connectedDuration;
    final hh = d.inHours.toString().padLeft(2, '0');
    final mm = (d.inMinutes % 60).toString().padLeft(2, '0');
    final ss = (d.inSeconds % 60).toString().padLeft(2, '0');
    return Text(
      '$hh:$mm:$ss',
      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
            color: AppColors.textMuted,
            fontFeatures: [const FontFeature.tabularFigures()],
          ),
    ).animate().fadeIn();
  }

  Widget _buildServerCard(BuildContext context, WidgetRef ref, ServerModel server,
      VpnConfigModel? config, bool isConnected) {
    final host = config?.serverHost ?? server.country;
    final port = config?.serverPort;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: AppColors.gradientCard,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Row(
        children: [
          Text(server.flag, style: const TextStyle(fontSize: 28)),
          const SizedBox(width: 14),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Serveur actuel', style: Theme.of(context).textTheme.bodySmall),
              Text(
                '${server.country}${server.city.isNotEmpty ? " - ${server.city}" : ""}',
                style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w600,
                    fontSize: 15),
              ),
              if (isConnected && config != null)
                Text(
                  '$host${port != null ? ":$port" : ""}',
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                ),
            ]),
          ),
          GestureDetector(
            onTap: () => context.go('/servers'),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.primary),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text('Changer',
                  style: TextStyle(
                      color: AppColors.primary,
                      fontSize: 12,
                      fontWeight: FontWeight.w600)),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 200.ms);
  }

  Widget _buildConfigInfo(BuildContext context, VpnConfigModel config) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _infoChip(context, 'Protocole', config.protocol),
          _vDivider(),
          _infoChip(context, 'Ping', '${config.ping ?? "--"} ms'),
          _vDivider(),
          _infoChip(context, 'Restant',
              '${config.quotaRemainingGB?.toStringAsFixed(1) ?? "--"} GB'),
        ],
      ),
    ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.2, end: 0);
  }

  Widget _infoChip(BuildContext context, String label, String value) {
    return Column(mainAxisSize: MainAxisSize.min, children: [
      Text(label, style: Theme.of(context).textTheme.bodySmall),
      const SizedBox(height: 4),
      Text(value,
          style: const TextStyle(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w700,
              fontSize: 14)),
    ]);
  }

  Widget _vDivider() =>
      Container(width: 1, height: 32, color: AppColors.cardBorder);

  Widget _buildSpeedRow(BuildContext context, VpnState state) {
    return Row(
      children: [
        Expanded(
            child: _speedCard(context, '${state.downloadSpeed.toStringAsFixed(1)} Mbps',
                Icons.arrow_downward_rounded, 'Téléchargement', AppColors.accent)),
        const SizedBox(width: 14),
        Expanded(
            child: _speedCard(context, '${state.uploadSpeed.toStringAsFixed(1)} Mbps',
                Icons.arrow_upward_rounded, 'Téléversement', AppColors.primary)),
      ],
    ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.2, end: 0);
  }

  Widget _speedCard(
      BuildContext context, String value, IconData icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 18),
          const SizedBox(height: 8),
          Text(value,
              style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w700,
                  fontSize: 18)),
          Text(label, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }

  Widget _buildNoQuotaBanner(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.disconnected.withOpacity(0.12),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.disconnected.withOpacity(0.3)),
      ),
      child: Row(children: [
        const Icon(Icons.warning_amber_rounded,
            color: AppColors.disconnected, size: 18),
        const SizedBox(width: 10),
        const Expanded(
            child: Text('Quota épuisé. Activez un voucher pour continuer.',
                style: TextStyle(
                    color: AppColors.disconnected,
                    fontSize: 12,
                    fontWeight: FontWeight.w500))),
        GestureDetector(
          onTap: () => context.go('/voucher/redeem'),
          child: const Text('Activer',
              style: TextStyle(
                  color: AppColors.accent,
                  fontWeight: FontWeight.w700,
                  fontSize: 12)),
        ),
      ]),
    ).animate().fadeIn(delay: 500.ms).shake();
  }
}
