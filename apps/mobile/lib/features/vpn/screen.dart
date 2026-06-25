import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../models/user.dart';

class VpnScreen extends StatefulWidget {
  const VpnScreen({super.key});
  @override
  State<VpnScreen> createState() => _VpnScreenState();
}

class _VpnScreenState extends State<VpnScreen> with SingleTickerProviderStateMixin {
  VpnStatus? _status;
  List<Map<String, dynamic>> _servers = [];
  bool _loading = true;
  bool _toggling = false;
  late final AnimationController _pulseCtrl;
  late final Animation<double> _pulse;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(vsync: this, duration: const Duration(seconds: 2))..repeat(reverse: true);
    _pulse = Tween(begin: 0.8, end: 1.0).animate(CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut));
    _load();
  }

  @override
  void dispose() { _pulseCtrl.dispose(); super.dispose(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([ApiService.getVpnStatus(), ApiService.getServers()]);
      if (mounted) setState(() {
        _status = results[0] as VpnStatus;
        _servers = results[1] as List<Map<String, dynamic>>;
      });
    } catch (_) {}
    finally { if (mounted) setState(() => _loading = false); }
  }

  Future<void> _getConfig() async {
    try {
      final config = await ApiService.getVpnConfig();
      if (!mounted) return;
      showDialog(context: context, builder: (_) => AlertDialog(
        backgroundColor: const Color(0xFF0F1629),
        title: const Text('Configuration VPN', style: TextStyle(color: Color(0xFFF1F5F9))),
        content: SingleChildScrollView(child: SelectableText(config, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontFamily: 'monospace'))),
        actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Fermer', style: TextStyle(color: Color(0xFF0099FF))))],
      ));
    } catch (e) {
      _showSnack(e.toString(), error: true);
    }
  }

  void _showSnack(String msg, {bool error = false}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: error ? const Color(0xFFEF4444) : const Color(0xFF10B981),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final connected = _status?.isConnected ?? false;
    return Scaffold(
      appBar: AppBar(title: const Text('VPN'), actions: [
        IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
      ]),
      body: _loading ? const Center(child: CircularProgressIndicator(color: Color(0xFF0099FF)))
          : ListView(padding: const EdgeInsets.all(20), children: [
        const SizedBox(height: 20),
        Center(child: AnimatedBuilder(
          animation: _pulse,
          builder: (_, child) => Transform.scale(
            scale: connected ? _pulse.value : 1.0,
            child: child,
          ),
          child: Container(
            width: 160,
            height: 160,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(colors: connected
                  ? [const Color(0xFF10B981).withOpacity(0.3), const Color(0xFF10B981).withOpacity(0.05)]
                  : [const Color(0xFF1E2D45), const Color(0xFF0F1629)]),
              border: Border.all(color: connected ? const Color(0xFF10B981) : const Color(0xFF1E2D45), width: 2),
            ),
            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              Icon(Icons.shield, size: 52, color: connected ? const Color(0xFF10B981) : const Color(0xFF64748B)),
              const SizedBox(height: 8),
              Text(connected ? 'PROTÉGÉ' : 'EXPOSÉ', style: TextStyle(color: connected ? const Color(0xFF10B981) : const Color(0xFF64748B), fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 1.5)),
            ]),
          ),
        )),
        const SizedBox(height: 32),

        if (connected && _status != null) ...[
          _statRow('Données utilisées', '${_status!.dataUsed.toStringAsFixed(2)} GB'),
          _statRow('Données restantes', '${_status!.dataRemaining.toStringAsFixed(2)} GB'),
          if (_status!.connectedSince != null)
            _statRow('Connecté depuis', _formatDuration(_status!.connectedSince!)),
          const SizedBox(height: 20),
        ],

        if (_servers.isNotEmpty) ...[
          const Text('Serveurs disponibles', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 10),
          ..._servers.take(5).map((s) => _serverTile(s)),
          const SizedBox(height: 20),
        ],

        Row(children: [
          Expanded(
            child: ElevatedButton.icon(
              onPressed: _toggling ? null : _getConfig,
              icon: const Icon(Icons.qr_code, size: 16),
              label: const Text('Config VPN'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF1E2D45),
                foregroundColor: const Color(0xFFF1F5F9),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        ]),
      ]),
    );
  }

  Widget _statRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(label, style: const TextStyle(color: Color(0xFF64748B), fontSize: 13)),
        Text(value, style: const TextStyle(color: Color(0xFFF1F5F9), fontSize: 13, fontWeight: FontWeight.w600)),
      ]),
    );
  }

  Widget _serverTile(Map<String, dynamic> s) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: const Color(0xFF0F1629), borderRadius: BorderRadius.circular(10), border: Border.all(color: const Color(0xFF1E2D45))),
      child: Row(children: [
        Container(width: 8, height: 8, decoration: const BoxDecoration(shape: BoxShape.circle, color: Color(0xFF10B981))),
        const SizedBox(width: 10),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(s['remark'] as String? ?? 'Serveur', style: const TextStyle(color: Color(0xFFF1F5F9), fontSize: 13, fontWeight: FontWeight.w500)),
          Text('${s['host']}:${s['port']} · ${s['protocol']}', style: const TextStyle(color: Color(0xFF64748B), fontSize: 11)),
        ])),
        const Icon(Icons.chevron_right, color: Color(0xFF64748B), size: 18),
      ]),
    );
  }

  String _formatDuration(DateTime since) {
    final diff = DateTime.now().difference(since);
    if (diff.inHours > 0) return '${diff.inHours}h ${diff.inMinutes.remainder(60)}min';
    return '${diff.inMinutes}min';
  }
}
