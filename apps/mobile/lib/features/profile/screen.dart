import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../models/user.dart';
import '../../main.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  AppUser? _user;
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final u = await ApiService.getMe();
      if (mounted) setState(() => _user = u);
    } catch (_) {}
    finally { if (mounted) setState(() => _loading = false); }
  }

  Future<void> _logout() async {
    await context.read<AppState>().logout();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profil'), actions: [
        IconButton(icon: const Icon(Icons.logout, color: Color(0xFFEF4444)), onPressed: () async {
          final ok = await showDialog<bool>(context: context, builder: (_) => AlertDialog(
            backgroundColor: const Color(0xFF0F1629),
            title: const Text('Déconnexion', style: TextStyle(color: Color(0xFFF1F5F9))),
            content: const Text('Voulez-vous vraiment vous déconnecter ?', style: TextStyle(color: Color(0xFF94A3B8))),
            actions: [
              TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Annuler', style: TextStyle(color: Color(0xFF64748B)))),
              TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Déconnecter', style: TextStyle(color: Color(0xFFEF4444)))),
            ],
          ));
          if (ok == true && mounted) _logout();
        }),
      ]),
      body: _loading ? const Center(child: CircularProgressIndicator(color: Color(0xFF0099FF)))
          : ListView(padding: const EdgeInsets.all(20), children: [
        Center(child: Column(children: [
          Container(
            width: 72, height: 72,
            decoration: const BoxDecoration(shape: BoxShape.circle, gradient: LinearGradient(colors: [Color(0xFF0099FF), Color(0xFF00D4FF)])),
            child: Center(child: Text((_user?.username ?? 'U')[0].toUpperCase(), style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold))),
          ),
          const SizedBox(height: 12),
          Text(_user?.username ?? '—', style: const TextStyle(color: Color(0xFFF1F5F9), fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(_user?.email ?? _user?.phone ?? '', style: const TextStyle(color: Color(0xFF64748B), fontSize: 13)),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(color: const Color(0xFF0099FF).withOpacity(0.15), borderRadius: BorderRadius.circular(12)),
            child: Text(_user?.role ?? '', style: const TextStyle(color: Color(0xFF0099FF), fontSize: 12, fontWeight: FontWeight.w600)),
          ),
        ])),
        const SizedBox(height: 32),
        _section('Informations', [
          _tile(Icons.account_circle_outlined, 'Nom d\'utilisateur', _user?.username ?? '—'),
          _tile(Icons.email_outlined, 'Email', _user?.email ?? '—'),
          _tile(Icons.phone_outlined, 'Téléphone', _user?.phone ?? '—'),
          _tile(Icons.verified_user_outlined, 'Statut', _user?.status ?? '—'),
        ]),
        const SizedBox(height: 16),
        _section('Abonnement', [
          _tile(Icons.data_usage, 'Quota restant', '${_user?.quotaRemainingGB.toStringAsFixed(1) ?? 0} GB'),
          _tile(Icons.timer_outlined, 'Expiration', _user?.expireAt != null ? '${_user!.daysLeft} jours restants' : '—'),
          _tile(Icons.devices, 'Limite appareils', '${_user?.deviceLimit ?? 0}'),
        ]),
      ]),
    );
  }

  Widget _section(String title, List<Widget> children) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(title, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 1)),
      const SizedBox(height: 8),
      Container(
        decoration: BoxDecoration(color: const Color(0xFF0F1629), borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFF1E2D45))),
        child: Column(children: children),
      ),
    ]);
  }

  Widget _tile(IconData icon, String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFF1E2D45), width: 0.5))),
      child: Row(children: [
        Icon(icon, color: const Color(0xFF0099FF), size: 18),
        const SizedBox(width: 12),
        Expanded(child: Text(label, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13))),
        Text(value, style: const TextStyle(color: Color(0xFFF1F5F9), fontSize: 13, fontWeight: FontWeight.w500)),
      ]),
    );
  }
}
