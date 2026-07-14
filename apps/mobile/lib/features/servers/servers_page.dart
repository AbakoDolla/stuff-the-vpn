import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/server_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/servers_provider.dart';
import '../../providers/vpn_provider.dart';

class ServersPage extends ConsumerStatefulWidget {
  const ServersPage({super.key});

  @override
  ConsumerState<ServersPage> createState() => _ServersPageState();
}

class _ServersPageState extends ConsumerState<ServersPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  int _tabIndex = 0;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 3, vsync: this);
    _tabCtrl.addListener(() {
      if (!_tabCtrl.indexIsChanging) setState(() => _tabIndex = _tabCtrl.index);
    });
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  List<ServerModel> _filterServers(List<ServerModel> list) {
    if (_tabIndex == 0) return list;
    if (_tabIndex == 1) {
      return list
          .where((s) =>
              ['vless', 'vmess', 'trojan', 'shadowsocks']
                  .contains(s.type.toLowerCase()))
          .toList();
    }
    return list.where((s) => s.type.toLowerCase() == 'ssh').toList();
  }

  @override
  Widget build(BuildContext context) {
    final servers = ref.watch(serversProvider);
    final vpnState = ref.watch(vpnProvider);

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
          child: Column(
            children: [
              _buildHeader(context, servers),
              _buildTabs(),
              Expanded(
                child: servers.when(
                  loading: () => _buildLoadingState(context),
                  error: (err, _) => _buildErrorState(context, ref, err),
                  data: (list) {
                    final filtered = _filterServers(list);
                    if (filtered.isEmpty) {
                      return _buildEmptyState(
                        context,
                        _tabIndex == 0
                            ? 'Aucun serveur disponible'
                            : 'Aucun serveur dans cette catégorie',
                      );
                    }
                    return _buildServerList(context, ref, filtered, vpnState);
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLoadingState(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 80),
      itemCount: 6,
      itemBuilder: (_, i) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Container(
          height: 72,
          decoration: BoxDecoration(
            color: const Color(0xFF141C2E),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF1E2D45)),
          ),
        )
            .animate(onPlay: (c) => c.repeat())
            .shimmer(
              duration: 1200.ms,
              delay: Duration(milliseconds: i * 80),
              color: const Color(0xFF1E2D45),
            ),
      ),
    );
  }

  Widget _buildErrorState(BuildContext context, WidgetRef ref, Object err) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off_rounded,
                color: Color(0xFF64748B), size: 56),
            const SizedBox(height: 16),
            Text(
              'Impossible de charger les serveurs',
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(color: const Color(0xFFF1F5F9)),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              err.toString().replaceFirst('Exception: ', ''),
              style: Theme.of(context).textTheme.bodySmall,
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 24),
            GestureDetector(
              onTap: () => ref.invalidate(serversProvider),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF2563EB), Color(0xFF06B6D4)],
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  'Réessayer',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    ).animate().fadeIn();
  }

  Widget _buildEmptyState(BuildContext context, String message) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.dns_outlined, color: Color(0xFF64748B), size: 48),
          const SizedBox(height: 12),
          Text(message, style: Theme.of(context).textTheme.bodyMedium),
        ],
      ),
    ).animate().fadeIn();
  }

  Widget _buildHeader(
      BuildContext context, AsyncValue<List<ServerModel>> servers) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
      child: Row(
        children: [
          Text('Serveurs',
              style: Theme.of(context).textTheme.headlineMedium),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFF0F1629),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFF1E2D45)),
            ),
            child: servers.when(
              loading: () => const SizedBox(
                width: 40,
                height: 14,
                child: LinearProgressIndicator(
                  backgroundColor: Color(0xFF1E2D45),
                  valueColor: AlwaysStoppedAnimation(Color(0xFF06B6D4)),
                ),
              ),
              error: (_, __) => const Text('—',
                  style: TextStyle(color: Color(0xFF64748B), fontSize: 12)),
              data: (list) {
                final count = list.length;
                return Text(
                  '$count serveur${count > 1 ? "s" : ""}',
                  style:
                      const TextStyle(color: Color(0xFF64748B), fontSize: 12),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabs() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF121A2C),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF1E2D45)),
      ),
      child: TabBar(
        controller: _tabCtrl,
        indicator: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF2563EB), Color(0xFF06B6D4)],
          ),
          borderRadius: BorderRadius.circular(10),
        ),
        indicatorSize: TabBarIndicatorSize.tab,
        labelColor: Colors.white,
        unselectedLabelColor: const Color(0xFF64748B),
        labelStyle:
            const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
        tabs: const [Tab(text: 'Tous'), Tab(text: 'V2Ray'), Tab(text: 'SSH')],
      ),
    );
  }

  void _connect(BuildContext context, WidgetRef ref, ServerModel s) {
    final user = ref.read(authStateProvider).valueOrNull?.user;
    if (user != null && user.dataRemaining <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Quota épuisé. Activez un voucher pour vous connecter.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }
    ref.read(vpnProvider.notifier).connect(server: s);
  }

  Widget _buildServerList(BuildContext context, WidgetRef ref,
      List<ServerModel> servers, VpnState vpnState) {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 80),
      itemCount: servers.length,
      itemBuilder: (ctx, i) =>
          _serverTile(context, ref, servers[i], vpnState, i),
    );
  }

  Widget _serverTile(BuildContext context, WidgetRef ref, ServerModel s,
      VpnState vpnState, int index) {
    final isActive = vpnState.server?.id == s.id && vpnState.isConnected;
    final pingColor = s.ping < 60
        ? const Color(0xFF10B981)
        : s.ping < 100
            ? const Color(0xFFF59E0B)
            : const Color(0xFFEF4444);

    return GestureDetector(
      onTap: () => _connect(context, ref, s),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: isActive
              ? const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFF141C2E), Color(0xFF0F1629)],
                )
              : null,
          color: isActive ? null : const Color(0xFF141C2E),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isActive ? const Color(0xFF2563EB) : const Color(0xFF1E2D45),
            width: isActive ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            Text(s.flag, style: const TextStyle(fontSize: 26)),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    s.country,
                    style: const TextStyle(
                      color: Color(0xFFF1F5F9),
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                  Row(children: [
                    if (s.city.isNotEmpty)
                      Text('${s.city} · ',
                          style: Theme.of(context).textTheme.bodySmall),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 1),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0F1629),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        s.type.toUpperCase(),
                        style: const TextStyle(
                          color: Color(0xFF64748B),
                          fontSize: 9,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ]),
                ],
              ),
            ),
            Text(
              '${s.ping} ms',
              style: TextStyle(
                color: pingColor,
                fontWeight: FontWeight.w700,
                fontSize: 13,
              ),
            ),
            const SizedBox(width: 12),
            if (isActive)
              Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(
                  color: Color(0xFF10B981),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check_rounded,
                    size: 14, color: Colors.white),
              )
            else
              const Icon(Icons.chevron_right_rounded,
                  color: Color(0xFF64748B), size: 20),
          ],
        ),
      )
          .animate()
          .fadeIn(delay: Duration(milliseconds: index * 50))
          .slideX(begin: 0.1, end: 0),
    );
  }
}
