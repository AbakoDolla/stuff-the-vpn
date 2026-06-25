import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/vpn_service.dart';
import '../../services/api_service.dart';

class VpnScreen extends StatefulWidget {
  const VpnScreen({super.key});
  @override
  State<VpnScreen> createState() => _VpnScreenState();
}

class _VpnScreenState extends State<VpnScreen> with SingleTickerProviderStateMixin {
  List<Map<String, dynamic>> _servers = [];
  bool _loadingServers = true;
  late final AnimationController _pulseCtrl;
  late final Animation<double> _pulse;
  Timer? _durationTimer;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(vsync: this, duration: const Duration(seconds: 2))
      ..repeat(reverse: true);
    _pulse = Tween(begin: 0.85, end: 1.0)
        .animate(CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut));

    // Initialize V2Ray engine
    context.read<VpnService>().initialize();
    _loadServers();

    // Timer to refresh duration display every second
    _durationTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (context.read<VpnService>().isConnected) setState(() {});
    });
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    _durationTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadServers() async {
    try {
      final s = await ApiService.getServers();
      if (mounted) setState(() => _servers = s);
    } catch (_) {}
    finally { if (mounted) setState(() => _loadingServers = false); }
  }

  Future<void> _toggle() async {
    final vpn = context.read<VpnService>();
    if (vpn.isConnected) {
      await vpn.disconnect();
    } else {
      await vpn.connect();
      if (vpn.state == VpnState.error && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(vpn.errorMessage ?? 'Erreur de connexion'),
          backgroundColor: const Color(0xFFEF4444),
          behavior: SnackBarBehavior.floating,
        ));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF020817),
      appBar: AppBar(
        title: const Text('VPN', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF020817),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _loadServers,
            color: const Color(0xFF64748B),
          ),
        ],
      ),
      body: Consumer<VpnService>(
        builder: (_, vpn, __) {
          final connected = vpn.isConnected;
          final busy = vpn.isBusy;

          return ListView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            children: [
              const SizedBox(height: 16),

              // ── Big VPN button ────────────────────────────────────────────
              Center(
                child: AnimatedBuilder(
                  animation: _pulse,
                  builder: (_, child) => Transform.scale(
                    scale: connected ? _pulse.value : 1.0,
                    child: child,
                  ),
                  child: GestureDetector(
                    onTap: busy ? null : _toggle,
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        // Outer glow ring
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 500),
                          width: 196,
                          height: 196,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: RadialGradient(
                              colors: connected
                                  ? [const Color(0xFF10B981).withOpacity(0.25), Colors.transparent]
                                  : busy
                                      ? [const Color(0xFF0099FF).withOpacity(0.15), Colors.transparent]
                                      : [const Color(0xFF1E2D45).withOpacity(0.5), Colors.transparent],
                            ),
                          ),
                        ),
                        // Inner circle
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 500),
                          width: 156,
                          height: 156,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: const Color(0xFF0F1629),
                            border: Border.all(
                              color: connected
                                  ? const Color(0xFF10B981)
                                  : busy
                                      ? const Color(0xFF0099FF)
                                      : const Color(0xFF1E2D45),
                              width: 2.5,
                            ),
                            boxShadow: connected
                                ? [BoxShadow(color: const Color(0xFF10B981).withOpacity(0.3), blurRadius: 32, spreadRadius: 4)]
                                : busy
                                    ? [BoxShadow(color: const Color(0xFF0099FF).withOpacity(0.2), blurRadius: 20)]
                                    : [],
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              if (busy)
                                const SizedBox(
                                  width: 40,
                                  height: 40,
                                  child: CircularProgressIndicator(
                                    color: Color(0xFF0099FF),
                                    strokeWidth: 3,
                                  ),
                                )
                              else
                                Icon(
                                  connected ? Icons.shield : Icons.shield_outlined,
                                  size: 52,
                                  color: connected ? const Color(0xFF10B981) : const Color(0xFF64748B),
                                ),
                              const SizedBox(height: 8),
                              AnimatedSwitcher(
                                duration: const Duration(milliseconds: 300),
                                child: Text(
                                  vpn.statusLabel.toUpperCase(),
                                  key: ValueKey(vpn.state),
                                  style: TextStyle(
                                    color: connected
                                        ? const Color(0xFF10B981)
                                        : busy
                                            ? const Color(0xFF0099FF)
                                            : const Color(0xFF64748B),
                                    fontWeight: FontWeight.bold,
                                    fontSize: 11,
                                    letterSpacing: 1.5,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 8),
              Center(
                child: Text(
                  busy ? 'Veuillez patienter…' : (connected ? 'Appuyez pour déconnecter' : 'Appuyez pour vous connecter'),
                  style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
                ),
              ),

              const SizedBox(height: 28),

              // ── Live stats (visible when connected) ───────────────────────
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 400),
                child: connected
                    ? _statsCard(vpn)
                    : const SizedBox.shrink(),
              ),

              if (connected) const SizedBox(height: 16),

              // ── Error banner ──────────────────────────────────────────────
              if (vpn.state == VpnState.error && vpn.errorMessage != null)
                Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEF4444).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFEF4444).withOpacity(0.3)),
                  ),
                  child: Row(children: [
                    const Icon(Icons.error_outline, color: Color(0xFFEF4444), size: 16),
                    const SizedBox(width: 8),
                    Expanded(child: Text(vpn.errorMessage!, style: const TextStyle(color: Color(0xFFEF4444), fontSize: 13))),
                  ]),
                ),

              // ── Server list ───────────────────────────────────────────────
              if (!_loadingServers && _servers.isNotEmpty) ...[
                const Text(
                  'SERVEURS DISPONIBLES',
                  style: TextStyle(color: Color(0xFF64748B), fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 1.5),
                ),
                const SizedBox(height: 10),
                ..._servers.map((s) => _serverTile(s, vpn)),
              ] else if (_loadingServers)
                const Center(child: Padding(
                  padding: EdgeInsets.all(20),
                  child: CircularProgressIndicator(color: Color(0xFF0099FF), strokeWidth: 2),
                )),
            ],
          );
        },
      ),
    );
  }

  Widget _statsCard(VpnService vpn) {
    return Container(
      key: const ValueKey('stats'),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF0F1629),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3)),
      ),
      child: Column(children: [
        // Duration + server
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Row(children: [
            const Icon(Icons.timer_outlined, color: Color(0xFF10B981), size: 14),
            const SizedBox(width: 6),
            Text(vpn.connectedDuration, style: const TextStyle(color: Color(0xFFF1F5F9), fontFamily: 'monospace', fontSize: 15, fontWeight: FontWeight.bold)),
          ]),
          if (vpn.connectedServer != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(vpn.connectedServer!, style: const TextStyle(color: Color(0xFF10B981), fontSize: 11)),
            ),
        ]),
        const SizedBox(height: 14),
        const Divider(color: Color(0xFF1E2D45), height: 1),
        const SizedBox(height: 14),
        // Speed
        Row(children: [
          Expanded(child: _speedTile(
            icon: Icons.arrow_upward_rounded,
            color: const Color(0xFF0099FF),
            label: 'Envoi',
            speed: vpn.uploadSpeedKBs,
            total: vpn.uploadTotalMB,
          )),
          const SizedBox(width: 12),
          Expanded(child: _speedTile(
            icon: Icons.arrow_downward_rounded,
            color: const Color(0xFF10B981),
            label: 'Réception',
            speed: vpn.downloadSpeedKBs,
            total: vpn.downloadTotalMB,
          )),
        ]),
      ]),
    );
  }

  Widget _speedTile({required IconData icon, required Color color, required String label, required double speed, required double total}) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: color.withOpacity(0.06), borderRadius: BorderRadius.circular(10)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(icon, color: color, size: 14),
          const SizedBox(width: 4),
          Text(label, style: TextStyle(color: color.withOpacity(0.8), fontSize: 11)),
        ]),
        const SizedBox(height: 6),
        Text(
          speed >= 1024 ? '${(speed / 1024).toStringAsFixed(1)} MB/s' : '${speed.toStringAsFixed(0)} KB/s',
          style: TextStyle(color: color, fontSize: 16, fontWeight: FontWeight.bold, fontFamily: 'monospace'),
        ),
        Text('${total.toStringAsFixed(2)} MB total', style: const TextStyle(color: Color(0xFF64748B), fontSize: 10)),
      ]),
    );
  }

  Widget _serverTile(Map<String, dynamic> s, VpnService vpn) {
    final isActive = vpn.isConnected && vpn.connectedServer == s['remark'];
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF0F1629),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isActive ? const Color(0xFF10B981) : const Color(0xFF1E2D45)),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
        leading: Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isActive ? const Color(0xFF10B981).withOpacity(0.15) : const Color(0xFF1E2D45),
          ),
          child: Icon(
            Icons.dns_rounded,
            size: 18,
            color: isActive ? const Color(0xFF10B981) : const Color(0xFF64748B),
          ),
        ),
        title: Text(
          s['remark'] as String? ?? 'Serveur',
          style: TextStyle(color: isActive ? const Color(0xFF10B981) : const Color(0xFFF1F5F9), fontSize: 14, fontWeight: FontWeight.w500),
        ),
        subtitle: Text(
          '${s['host']}:${s['port']} · ${s['protocol']}',
          style: const TextStyle(color: Color(0xFF64748B), fontSize: 11),
        ),
        trailing: isActive
            ? const Icon(Icons.check_circle, color: Color(0xFF10B981), size: 18)
            : const Icon(Icons.chevron_right, color: Color(0xFF1E2D45), size: 18),
        onTap: vpn.isBusy ? null : () async {
          if (!vpn.isConnected) {
            await vpn.connect(serverRemark: s['remark'] as String?);
          }
        },
      ),
    );
  }
}
