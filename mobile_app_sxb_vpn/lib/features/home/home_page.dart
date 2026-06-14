import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../app/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/vpn_provider.dart';
import '../../models/vpn_config_model.dart';
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
              SliverToBoxAdapter(child: _buildHeader(context, ref, user?.username ?? user?.email ?? 'USER')),
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

  Widget _buildHeader(BuildContext context, WidgetRef ref, String username) {
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
          GestureDetector(
            onTap: () => context.go('/voucher/redeem'),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                gradient: AppColors.gradientPrimary,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.confirmation_number_outlined, color: Colors.white, size: 16),
                  SizedBox(width: 6),
                  Text('Voucher', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 12)),
                ],
              ),
            ),
          ),
        ],
      ),
    ).animate().fadeIn().slideX(begin: -0.1, end: 0);
  }

  Widget _buildDataCard(BuildContext context, user) {
    final limit = user?.dataLimit ?? 0.0;
    final used = user?.dataUsed ?? 0.0;
    final remaining = user?.dataRemaining ?? 0.0;
    final percent = limit > 0 ? (used / limit * 100).clamp(0, 100).toInt() : 0;
    final planName = user?.plan ?? 'Aucun forfait';
    final expiry = user?.planExpiry;
    final expiryStr = expiry != null
        ? 'Expire le ${DateFormat('dd/MM/yyyy').format(expiry)}'
        : 'Pas d\'\expiration';

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
                      Text(limit > 0 ? '${limit.toStringAsFixed(0)} GB' : planName,
                          style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                                background: Paint()..shader = const LinearGradient(
                                  colors: [AppColors.primary, AppColors.accent],
                                ).createShader(const Rect.fromLTWH(0, 0, 100, 40)),
                              )),
                      Text(expiryStr, style: Theme.of(context).textTheme.bodySmall),
                    ],
                  ),
                ),
                SizedBox(
                  width: 70, height: 70,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      CircularProgressIndicator(
                        value: limit > 0 ? used / limit : 0,
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
                  Text('${best.country}${best.city.isNotEmpty ? " - ${best.city}" : ""}',
                      style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 13)),
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
                    child: const Text('Connecter',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
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
          Row(children: [
            Text('Serveurs disponibles', style: Theme.of(context).textTheme.labelLarge),
            const Spacer(),
            GestureDetector(
              onTap: () => context.go('/servers'),
              child: Text('Voir tout', style: const TextStyle(color: AppColors.accent, fontSize: 12, fontWeight: FontWeight.w600)),
            ),
          ]),
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
                Text(s.city.isNotEmpty ? s.city : s.type.toUpperCase(),
                    style: Theme.of(context).textTheme.bodySmall),
              ])),
              Text('${s.ping} ms', style: TextStyle(color: pingColor, fontWeight: FontWeight.w600, fontSize: 13)),
            ],
          ),
        ),
      ),
    );
  }
}
