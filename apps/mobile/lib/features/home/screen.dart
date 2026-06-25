import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../models/user.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  AppUser? _user;
  VpnStatus? _vpn;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([ApiService.getMe(), ApiService.getVpnStatus()]);
      if (mounted) setState(() { _user = results[0] as AppUser; _vpn = results[1] as VpnStatus; });
    } catch (_) {}
    finally { if (mounted) setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _load,
          child: _loading ? const Center(child: CircularProgressIndicator(color: Color(0xFF0099FF)))
              : ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Text('Bonjour 👋', style: TextStyle(color: Color(0xFF64748B), fontSize: 13)),
                    Text(_user?.username ?? '—', style: const TextStyle(color: Color(0xFFF1F5F9), fontSize: 20, fontWeight: FontWeight.bold)),
                  ]),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: (_vpn?.isConnected ?? false) ? const Color(0xFF10B981).withOpacity(0.15) : const Color(0xFF64748B).withOpacity(0.15),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: (_vpn?.isConnected ?? false) ? const Color(0xFF10B981).withOpacity(0.4) : const Color(0xFF64748B).withOpacity(0.3)),
                    ),
                    child: Row(children: [
                      Container(width: 6, height: 6, decoration: BoxDecoration(shape: BoxShape.circle, color: (_vpn?.isConnected ?? false) ? const Color(0xFF10B981) : const Color(0xFF64748B))),
                      const SizedBox(width: 6),
                      Text((_vpn?.isConnected ?? false) ? 'Connecté' : 'Déconnecté', style: TextStyle(color: (_vpn?.isConnected ?? false) ? const Color(0xFF10B981) : const Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.w500)),
                    ]),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              _quotaCard(),
              const SizedBox(height: 16),
              _infoGrid(),
              const SizedBox(height: 16),
              _statusCard(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _quotaCard() {
    final used = _user?.quotaUsedGB ?? 0;
    final remaining = _user?.quotaRemainingGB ?? 0;
    final total = used + remaining;
    final pct = total > 0 ? (used / total).clamp(0.0, 1.0) : 0.0;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color(0xFF0A1628), Color(0xFF0F1E38)]),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF1E2D45)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Row(children: [Icon(Icons.data_usage, color: Color(0xFF0099FF), size: 18), SizedBox(width: 8), Text('Quota de données', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13))]),
        const SizedBox(height: 12),
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text('${remaining.toStringAsFixed(1)} GB', style: const TextStyle(color: Color(0xFFF1F5F9), fontSize: 28, fontWeight: FontWeight.bold)),
          Text('/ ${total.toStringAsFixed(1)} GB', style: const TextStyle(color: Color(0xFF64748B), fontSize: 15)),
        ]),
        const SizedBox(height: 12),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: pct,
            minHeight: 6,
            backgroundColor: const Color(0xFF1E2D45),
            valueColor: AlwaysStoppedAnimation<Color>(pct > 0.8 ? const Color(0xFFEF4444) : const Color(0xFF0099FF)),
          ),
        ),
        const SizedBox(height: 8),
        Text('${(pct * 100).toStringAsFixed(0)}% utilisé · ${used.toStringAsFixed(1)} GB consommé', style: const TextStyle(color: Color(0xFF64748B), fontSize: 11)),
      ]),
    );
  }

  Widget _infoGrid() {
    final items = [
      {'icon': Icons.calendar_today_outlined, 'label': 'Expiration', 'value': _user?.expireAt != null ? '${_user!.daysLeft}j restants' : '—'},
      {'icon': Icons.devices_outlined, 'label': 'Appareils', 'value': '${_user?.deviceLimit ?? 0} max'},
      {'icon': Icons.security_outlined, 'label': 'Statut', 'value': _user?.status ?? '—'},
      {'icon': Icons.badge_outlined, 'label': 'Rôle', 'value': _user?.role ?? '—'},
    ];
    return GridView.count(
      crossAxisCount: 2,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 1.6,
      children: items.map((item) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: const Color(0xFF0F1629), borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFF1E2D45))),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(item['icon'] as IconData, color: const Color(0xFF0099FF), size: 18),
          const SizedBox(height: 6),
          Text(item['label'] as String, style: const TextStyle(color: Color(0xFF64748B), fontSize: 11)),
          const SizedBox(height: 2),
          Text(item['value'] as String, style: const TextStyle(color: Color(0xFFF1F5F9), fontSize: 14, fontWeight: FontWeight.w600)),
        ]),
      )).toList(),
    );
  }

  Widget _statusCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFF0F1629), borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFF1E2D45))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('État des services', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13, fontWeight: FontWeight.w600)),
        const SizedBox(height: 12),
        _statusRow('API Backend', true),
        const SizedBox(height: 8),
        _statusRow('VPN', _vpn?.isConnected ?? false),
        const SizedBox(height: 8),
        _statusRow('Compte', _user?.status == 'ACTIVE'),
      ]),
    );
  }

  Widget _statusRow(String label, bool ok) {
    return Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Text(label, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13)),
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
        decoration: BoxDecoration(
          color: ok ? const Color(0xFF10B981).withOpacity(0.15) : const Color(0xFFEF4444).withOpacity(0.15),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Text(ok ? 'OK' : 'KO', style: TextStyle(color: ok ? const Color(0xFF10B981) : const Color(0xFFEF4444), fontSize: 11, fontWeight: FontWeight.w600)),
      ),
    ]);
  }
}
