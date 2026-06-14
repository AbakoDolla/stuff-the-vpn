import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../app/theme.dart';
import '../../providers/vpn_provider.dart';
import '../../models/vpn_config_model.dart';

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
          .where((s) => ['vless', 'vmess', 'trojan', 'shadowsocks']
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
        decoration: const BoxDecoration(gradient: AppColors.gradientDark),
        child: SafeArea(
          child: Column(
            children: [
              _buildHeader(context),
              _buildTabs(),
              Expanded(
                child: servers.when(
                  loading: () => const Center(
                      child: CircularProgressIndicator(color: AppColors.accent)),
                  error: (_, __) =>
                      _buildServerList(context, ref, demoServers, vpnState),
                  data: (list) {
                    final filtered = _filterServers(list);
                    final display =
                        filtered.isNotEmpty ? filtered : list.isEmpty ? demoServers : <ServerModel>[];
                    return display.isEmpty
                        ? _buildEmptyState(context)
                        : _buildServerList(context, ref, display, vpnState);
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        const Icon(Icons.dns_outlined, color: AppColors.textMuted, size: 48),
        const SizedBox(height: 12),
        Text('Aucun serveur dans cette catégorie',
            style: Theme.of(context).textTheme.bodyMedium),
      ]),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
      child: Row(
        children: [
          Text('Serveurs', style: Theme.of(context).textTheme.headlineMedium),
          const Spacer(),
          Consumer(builder: (_, ref, __) {
            final servers = ref.watch(serversProvider);
            final count = servers.valueOrNull?.length ?? 0;
            return Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.surfaceLight,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.cardBorder),
              ),
              child: Text('$count serveur${count > 1 ? "s" : ""}',
                  style: const TextStyle(
                      color: AppColors.textMuted, fontSize: 12)),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildTabs() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: TabBar(
        controller: _tabCtrl,
        indicator: BoxDecoration(
          gradient: AppColors.gradientPrimary,
          borderRadius: BorderRadius.circular(10),
        ),
        indicatorSize: TabBarIndicatorSize.tab,
        labelColor: Colors.white,
        unselectedLabelColor: AppColors.textMuted,
        labelStyle:
            const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
        tabs: const [Tab(text: 'Tous'), Tab(text: 'V2Ray'), Tab(text: 'SSH')],
      ),
    );
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
    final isActive =
        vpnState.currentServer?.id == s.id && vpnState.isConnected;
    final pingColor = s.ping < 60
        ? AppColors.connected
        : s.ping < 100
            ? AppColors.warning
            : AppColors.disconnected;
    return GestureDetector(
      onTap: () => ref.read(vpnProvider.notifier).connect(server: s),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: isActive ? AppColors.gradientCard : null,
          color: isActive ? null : AppColors.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
              color: isActive ? AppColors.primary : AppColors.cardBorder,
              width: isActive ? 1.5 : 1),
        ),
        child: Row(
          children: [
            Text(s.flag, style: const TextStyle(fontSize: 26)),
            const SizedBox(width: 12),
            Expanded(
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                  Text(s.country,
                      style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w600,
                          fontSize: 14)),
                  Row(children: [
                    if (s.city.isNotEmpty)
                      Text('${s.city} · ',
                          style: Theme.of(context).textTheme.bodySmall),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 1),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceLight,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(s.type.toUpperCase(),
                          style: const TextStyle(
                              color: AppColors.textMuted,
                              fontSize: 9,
                              fontWeight: FontWeight.w600)),
                    ),
                  ]),
                ])),
            Text('${s.ping} ms',
                style: TextStyle(
                    color: pingColor,
                    fontWeight: FontWeight.w700,
                    fontSize: 13)),
            const SizedBox(width: 12),
            if (isActive)
              Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(
                    color: AppColors.connected, shape: BoxShape.circle),
                child: const Icon(Icons.check_rounded,
                    size: 14, color: Colors.white),
              )
            else
              const Icon(Icons.chevron_right_rounded,
                  color: AppColors.textMuted, size: 20),
          ],
        ),
      )
          .animate()
          .fadeIn(delay: Duration(milliseconds: index * 50))
          .slideX(begin: 0.1, end: 0),
    );
  }
}
