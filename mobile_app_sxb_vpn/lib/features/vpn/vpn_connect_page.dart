import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme.dart';
import '../../providers/vpn_provider.dart';
import '../../models/vpn_config_model.dart';
import '../../widgets/vpn_button.dart';

class VpnConnectPage extends ConsumerWidget {
  const VpnConnectPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vpnState = ref.watch(vpnProvider);
    final server = vpnState.currentServer ?? demoServers.first;

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
                _buildServerCard(context, ref, server, vpnState.isConnected),
                const SizedBox(height: 24),
                if (vpnState.isConnected) _buildSpeedRow(context, vpnState),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatusHeader(BuildContext context, VpnState state) {
    final label = state.isConnected ? 'Connecté' : state.isConnecting ? 'Connexion...' : 'Déconnecté';
    final color = state.isConnected ? AppColors.connected : state.isConnecting ? AppColors.warning : AppColors.textMuted;
    return Column(children: [
      Text(label,
          style: Theme.of(context).textTheme.headlineLarge?.copyWith(color: color, fontSize: 28))
          .animate(key: ValueKey(state.status)).fadeIn().slideY(begin: -0.2, end: 0),
    ]);
  }

  Widget _buildTimer(BuildContext context, VpnState state) {
    if (!state.isConnected && !state.isConnecting) return const SizedBox.shrink();
    final d = state.connectedDuration;
    final timer = '${d.inHours.toString().padLeft(2, '0')}:${(d.inMinutes % 60).toString().padLeft(2, '0')}:${(d.inSeconds % 60).toString().padLeft(2, '0')}';
    return Text(timer,
        style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              color: AppColors.textMuted,
              fontFeatures: [const FontFeature.tabularFigures()],
            )).animate().fadeIn();
  }

  Widget _buildServerCard(BuildContext context, WidgetRef ref, ServerModel server, bool isConnected) {
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
              Text('${server.country} - ${server.city}',
                  style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 15)),
              if (isConnected)
                Text('IP: 172.217.20.110', style: Theme.of(context).textTheme.bodySmall),
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
              child: const Text('Changer', style: TextStyle(color: AppColors.primary, fontSize: 12, fontWeight: FontWeight.w600)),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 200.ms);
  }

  Widget _buildSpeedRow(BuildContext context, VpnState state) {
    return Row(
      children: [
        Expanded(child: _speedCard(context, '${state.downloadSpeed.toStringAsFixed(1)} Mbps',
            Icons.arrow_downward_rounded, 'Téléchargement', AppColors.accent)),
        const SizedBox(width: 14),
        Expanded(child: _speedCard(context, '${state.uploadSpeed.toStringAsFixed(1)} Mbps',
            Icons.arrow_upward_rounded, 'Téléversement', AppColors.primary)),
      ],
    ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.2, end: 0);
  }

  Widget _speedCard(BuildContext context, String value, IconData icon, String label, Color color) {
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
          Text(value, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700, fontSize: 18)),
          Text(label, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}
