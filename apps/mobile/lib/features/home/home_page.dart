import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../core/demo_data.dart';
import '../../providers/auth_provider.dart';
import '../../providers/servers_provider.dart';
import '../../providers/vpn_provider.dart';
import '../../services/user_service.dart';
import '../../models/server_model.dart';
import '../../widgets/glass_card.dart';

/// Provider to fetch subscription data
final subscriptionProvider = FutureProvider<Map<String, dynamic>?>((ref) async {
  final userService = ref.read(userServiceProvider);
  return userService.getSubscription();
});

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider).valueOrNull;
    final vpnState = ref.watch(vpnProvider);
    final servers = ref.watch(serversProvider);
    final subscription = ref.watch(subscriptionProvider);
    final user = authState?.user;

    // Get subscription data or use defaults
    final subData = subscription.valueOrNull;
    final planName = subData?['plan']?.toString() ?? 'Premium';
    final dataLimit = _toDouble(subData?['dataLimit']) ?? 30.0;
    final dataUsed = _toDouble(subData?['dataUsed']) ?? 0.0;
    final dataRemaining = _toDouble(subData?['dataRemaining']) ?? dataLimit;
    final usagePercent = dataLimit > 0 ? dataUsed / dataLimit : 0.0;
    final expiryStr = subData?['expireAt'] != null
        ? 'Expire le ${_formatDate(subData!['expireAt'].toString())}'
        : 'Expire le 20/12/2024';

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
            gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0xFF0B0F1A), Color(0xFF0D1525)])),
        child: SafeArea(
          child: CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                  child: _buildHeader(context, ref, user?.name ?? 'USER')),
              SliverToBoxAdapter(child: _buildDataCard(
                context,
                planName,
                expiryStr,
                dataUsed,
                dataRemaining,
                usagePercent,
              )),
              SliverToBoxAdapter(child: _buildQuickConnect(
                  context, ref, vpnState, servers.valueOrNull)),
              SliverToBoxAdapter(child: _buildServerList(
                  context, ref, servers.valueOrNull ?? [])),
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
                  style: Theme.of(context)
                      .textTheme
                      .headlineMedium
                      ?.copyWith(letterSpacing: 1)),
            ],
          ),
          const Spacer(),
          GestureDetector(
            onTap: () => context.go('/voucher/redeem'),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFF2563EB), Color(0xFF06B6D4)],
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.confirmation_number_outlined,
                      color: Colors.white, size: 16),
                  SizedBox(width: 6),
                  Text('Voucher',
                      style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                          fontSize: 12)),
                ],
              ),
            ),
          ),
        ],
      ),
    ).animate().fadeIn().slideX(begin: -0.1, end: 0);
  }

  Widget _buildDataCard(
    BuildContext context,
    String planName,
    String expiryLabel,
    double dataUsed,
    double dataRemaining,
    double usagePercent,
  ) {
    final usedFormatted = _formatData(dataUsed);
    final remainingFormatted = _formatData(dataRemaining);
    final percent = usagePercent.clamp(0.0, 1.0);

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
                      Text(planName,
                          style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                                background: Paint()
                                  ..shader = const LinearGradient(
                                    colors: [
                                      Color(0xFF2563EB),
                                      Color(0xFF06B6D4)
                                    ],
                                  ).createShader(
                                      const Rect.fromLTWH(0, 0, 100, 40)),
                              )),
                      Text(expiryLabel, style: Theme.of(context).textTheme.bodySmall),
                    ],
                  ),
                ),
                SizedBox(
                  width: 70,
                  height: 70,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      CircularProgressIndicator(
                        value: percent,
                        strokeWidth: 6,
                        backgroundColor: const Color(0xFF1E2D45),
                        valueColor: const AlwaysStoppedAnimation(Color(0xFF06B6D4)),
                      ),
                      Text('${(percent * 100).toInt()}%',
                          style: const TextStyle(
                              color: Color(0xFFF1F5F9), fontSize: 13, fontWeight: FontWeight.w600)),
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
                    Text(usedFormatted,
                        style: const TextStyle(
                            color: Color(0xFFF1F5F9), fontWeight: FontWeight.w700, fontSize: 18)),
                  ],
                )),
                Container(width: 1, height: 30, color: const Color(0xFF1E2D45)),
                Expanded(child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('Restant', style: Theme.of(context).textTheme.bodySmall),
                    Text(remainingFormatted,
                        style: const TextStyle(
                            color: Color(0xFF06B6D4), fontWeight: FontWeight.w700, fontSize: 18)),
                  ],
                )),
              ],
            ),
          ],
        ),
      ),
    ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.1, end: 0);
  }

  Widget _buildQuickConnect(
      BuildContext context, WidgetRef ref, VpnState vpnState, List<ServerModel>? servers) {
    final best = servers?.firstOrNull ?? demoServers.first;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF141C2E), Color(0xFF0F1629)]),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFF1E2D45)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              const Icon(Icons.bolt_rounded, color: Color(0xFF06B6D4), size: 18),
              const SizedBox(width: 6),
              Text('Connexion rapide', style: Theme.of(context).textTheme.labelLarge),
            ]),
            const SizedBox(height: 12),
            Row(
              children: [
                Text(best.flag, style: const TextStyle(fontSize: 24)),
                const SizedBox(width: 10),
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Serveur recommandé',
                      style: Theme.of(context).textTheme.bodySmall),
                  Text(
                      '${best.country}${best.city.isNotEmpty ? " - ${best.city}" : ""}',
                      style: const TextStyle(
                          color: Color(0xFFF1F5F9),
                          fontWeight: FontWeight.w600,
                          fontSize: 13)),
                ]),
                const Spacer(),
                GestureDetector(
                  onTap: () => ref.read(vpnProvider.notifier).connect(server: best),
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [Color(0xFF2563EB), Color(0xFF06B6D4)]),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Text('Connecter',
                        style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                            fontSize: 13)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    ).animate().fadeIn(delay: 200.ms);
  }

  Widget _buildServerList(
      BuildContext context, WidgetRef ref, List<ServerModel> servers) {
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
              child: Text('Voir tout',
                  style: const TextStyle(
                      color: Color(0xFF06B6D4),
                      fontSize: 12,
                      fontWeight: FontWeight.w600)),
            ),
          ]),
          const SizedBox(height: 12),
          ...list.take(3).map((s) => _serverRow(context, ref, s)),
        ],
      ),
    ).animate().fadeIn(delay: 300.ms);
  }

  Widget _serverRow(BuildContext context, WidgetRef ref, ServerModel s) {
    final pingColor = s.ping < 60
        ? const Color(0xFF10B981)
        : s.ping < 100
            ? const Color(0xFFF59E0B)
            : const Color(0xFFEF4444);
    return GestureDetector(
      onTap: () => ref.read(vpnProvider.notifier).connect(server: s),
      child: Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: const Color(0xFF141C2E),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFF1E2D45)),
          ),
          child: Row(
            children: [
              Text(s.flag, style: const TextStyle(fontSize: 22)),
              const SizedBox(width: 12),
              Expanded(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                    Text(s.country,
                        style: const TextStyle(
                            color: Color(0xFFF1F5F9),
                            fontWeight: FontWeight.w600,
                            fontSize: 14)),
                    Text(s.city.isNotEmpty ? s.city : s.type.toUpperCase(),
                        style: Theme.of(context).textTheme.bodySmall),
                  ])),
              Text('${s.ping} ms',
                  style: TextStyle(
                      color: pingColor, fontWeight: FontWeight.w600, fontSize: 13)),
            ],
          ),
        ),
      ),
    );
  }

  static String _formatData(double gb) {
    if (gb >= 1024) {
      return '${(gb / 1024).toStringAsFixed(1)} TB';
    }
    return '${gb.toStringAsFixed(1)} GB';
  }

  static String _formatDate(String dateStr) {
    final dt = DateTime.tryParse(dateStr);
    if (dt == null) return dateStr;
    return DateFormat('dd/MM/yyyy').format(dt);
  }

  static double? _toDouble(dynamic v) {
    if (v == null) return null;
    if (v is double) return v;
    if (v is int) return v.toDouble();
    return double.tryParse(v.toString());
  }
}