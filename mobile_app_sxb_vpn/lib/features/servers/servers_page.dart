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

class _ServersPageState extends ConsumerState<ServersPage> with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  String _filter = 'Tous';

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 3, vsync: this);
    _tabCtrl.addListener(() => setState(() => _filter = ['Tous', 'V2Ray', 'SSH'][_tabCtrl.index]));
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
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
                  loading: () => const Center(child: CircularProgressIndicator(color: AppColors.accent)),
                  error: (_, __) => _buildServerList(context, ref, demoServers, vpnState),
                  data: (list) => _buildServerList(context, ref, _filterServers(list), vpnState),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  List<ServerModel> _filterServers(List<ServerModel> list) {
    if (_filter == 'Tous') return list;
    return list.where((s) => s.type.toLowerCase() == _filter.toLowerCase()).toList();
  }

  Widget _buildHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
      child: Row(
        children: [
          Text('Serveurs', style: Theme.of(context).textTheme.headlineMedium),
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
        labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
        tabs: const [Tab(text: 'Tous'), Tab(text: 'V2Ray'), Tab(text: 'SSH')],
      ),
    );
  }

  Widget _buildServerList(BuildContext context, WidgetRef ref, List<ServerModel> servers, VpnState vpnState) {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 80),
      itemCount: servers.length,
      itemBuilder: (ctx, i) => _serverTile(context, ref, servers[i], vpnState, i),
    );
  }

  Widget _serverTile(BuildContext context, WidgetRef ref, ServerModel s, VpnState vpnState, int index) {
    final isActive = vpnState.currentServer?.id == s.id && vpnState.isConnected;
    final pingColor = s.ping < 60 ? AppColors.connected : s.ping < 100 ? AppColors.warning : AppColors.disconnected;
    return GestureDetector(
      onTap: () => ref.read(vpnProvider.notifier).connect(server: s),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: isActive ? AppColors.gradientCard : null,
          color: isActive ? null : AppColors.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isActive ? AppColors.primary : AppColors.cardBorder, width: isActive ? 1.5 : 1),
        ),
        child: Row(
          children: [
            Text(s.flag, style: const TextStyle(fontSize: 26)),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(s.country, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 14)),
              Text(s.city, style: Theme.of(context).textTheme.bodySmall),
            ])),
            Text('${s.ping} ms', style: TextStyle(color: pingColor, fontWeight: FontWeight.w700, fontSize: 13)),
            const SizedBox(width: 12),
            if (isActive)
              Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(color: AppColors.connected, shape: BoxShape.circle),
                child: const Icon(Icons.check_rounded, size: 14, color: Colors.white),
              )
            else
              const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted, size: 20),
          ],
        ),
      ).animate().fadeIn(delay: Duration(milliseconds: index * 50)).slideX(begin: 0.1, end: 0),
    );
  }
}
