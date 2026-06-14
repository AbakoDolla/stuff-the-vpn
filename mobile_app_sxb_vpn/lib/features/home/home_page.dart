import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/vpn_provider.dart';
import '../../models/vpn_config_model.dart';
import '../../widgets/stat_card.dart';
import '../../widgets/glass_card.dart';

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider).valueOrNull;
    final vpnState = ref.watch(vpnProvider);
    final servers = ref.watch(serversProvider);
    final user = authState?.user;

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.gradientDark),
        child: SafeArea(
          child: CustomScrollView(
            slivers: [
              SliverToBoxAdapter(child: _buildHeader(context, user?.username ?? user?.email ?? 'STUFF USER')),
              SliverToBoxAdapter(child: _buildDataCard(context, user)),
              SliverToBoxAdapter(child: _buildQuickConnect(context, ref, vpnState, servers.valueOrNull)),
              SliverToBoxAdapter(child: _buildServerList(context, ref, servers.valueOrNull ?? [])),
              const SliverToBoxAdapter(child: SizedBox(height: 80)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, String username) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Row(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Bonjour', style: Theme.of(context).textTheme.bodySmall),
              Text(username.toUpperCase(),
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(letterSpacing: 1)),
            ],
          ),
          const Spacer(),
          Container(
            width: 42, height: 42,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.surfaceLight,
              border: Border.all(color: AppColors.cardBorder),
            ),
            child: const Icon(Icons.notifications_none_rounded, color: AppColors.textSecondary, size: 20),
          ),
        ],
      ),
    ).animate().fadeIn().slideX(begin: -0.1, end: 0);
  }

  Widget _buildDataCard(BuildContext context, user) {
    final limit = user?.dataLimit ?? 10.0;
    final used = user?.dataUsed ?? 3.25;
    final remaining = limit - used;
    final percent = (used / limit * 100).clamp(0, 100).toInt();

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: GlassCard(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Forfait actif', style: Theme.of(context).textTheme.bodySmall),
                      const SizedBox(height: 4),
                      Text('${limit.toInt()} GB',
                          style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                                background: Paint()..shader = const LinearGradient(
                                  colors: [AppColors.primary, AppColors.accent],
                                ).createShader(const Rect.fromLTWH(0, 0, 100, 40)),
                              )),
                      Text('Expire le 15/08/2025', style: Theme.of(context).textTheme.bodySmall),
                    ],
                  ),
                ),
                SizedBox(
                  width: 70, height: 70,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      CircularProgressIndicator(
                        value: used / limit,
                        strokeWidth: 6,
                        backgroundColor: AppColors.cardBorder,
                        valueColor: const AlwaysStoppedAnimation(AppColors.accent),
                      ),
                      Text('$percent%', style: const TextStyle(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Utilisé', style: Theme.of(context).textTheme.bodySmall),
                    Text('${used.toStringAsFixed(2)} GB',
                        style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700, fontSize: 18)),
                  ],
                )),
                Container(width: 1, height: 30, color: AppColors.cardBorder),
                Expanded(child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('Restant', style: Theme.of(context).textTheme.bodySmall),
                    Text('${remaining.toStringAsFixed(2)} GB',
                        style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.w700, fontSize: 18)),
                  ],
                )),
              ],
            ),
          ],
        ),
      ),
    ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.1, end: 0);
  }

  Widget _buildQuickConnect(BuildContext context, WidgetRef ref, VpnState vpnState, List<ServerModel>? servers) {
    final best = servers?.firstOrNull ?? demoServers.first;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: AppColors.gradientCard,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.cardBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              const Icon(Icons.bolt_rounded, color: AppColors.accent, size: 18),
              const SizedBox(width: 6),
              Text('Connexion rapide', style: Theme.of(context).textTheme.labelLarge),
            ]),
            const SizedBox(height: 12),
            Row(
              children: [
                Text(best.flag, style: const TextStyle(fontSize: 24)),
                const SizedBox(width: 10),
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Serveur recommandé', style: Theme.of(context).textTheme.bodySmall),
                  Text('Best Performance', style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 13)),
                ]),
                const Spacer(),
                GestureDetector(
                  onTap: () => ref.read(vpnProvider.notifier).connect(server: best),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    decoration: BoxDecoration(
                      gradient: AppColors.gradientPrimary,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text('Connecter',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    ).animate().fadeIn(delay: 200.ms);
  }

  Widget _buildServerList(BuildContext context, WidgetRef ref, List<ServerModel> servers) {
    final list = servers.isNotEmpty ? servers : demoServers;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Autres serveurs', style: Theme.of(context).textTheme.labelLarge),
          const SizedBox(height: 12),
          ...list.take(3).map((s) => _serverRow(context, ref, s)),
        ],
      ),
    ).animate().fadeIn(delay: 300.ms);
  }

  Widget _serverRow(BuildContext context, WidgetRef ref, ServerModel s) {
    final pingColor = s.ping < 60 ? AppColors.connected : s.ping < 100 ? AppColors.warning : AppColors.disconnected;
    return GestureDetector(
      onTap: () => ref.read(vpnProvider.notifier).connect(server: s),
      child: Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.cardBorder),
          ),
          child: Row(
            children: [
              Text(s.flag, style: const TextStyle(fontSize: 22)),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(s.country, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 14)),
                Text(s.city, style: Theme.of(context).textTheme.bodySmall),
              ])),
              Text('${s.ping} ms', style: TextStyle(color: pingColor, fontWeight: FontWeight.w600, fontSize: 13)),
            ],
          ),
        ),
      ),
    );
  }
}
