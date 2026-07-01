import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/vpn_provider.dart';
import '../providers/auth_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';
import 'servers_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<VpnProvider>().loadServers();
    });
  }

  Color _stateColor(VpnConnectionState s) {
    switch (s) {
      case VpnConnectionState.connected:    return AppColors.success;
      case VpnConnectionState.connecting:
      case VpnConnectionState.disconnecting:return AppColors.warning;
      case VpnConnectionState.error:        return AppColors.danger;
      case VpnConnectionState.disconnected: return AppColors.textMuted;
    }
  }

  String _stateLabel(VpnConnectionState s) {
    switch (s) {
      case VpnConnectionState.connected:     return 'Connecté';
      case VpnConnectionState.connecting:    return 'Connexion...';
      case VpnConnectionState.disconnecting: return 'Déconnexion...';
      case VpnConnectionState.error:         return 'Erreur';
      case VpnConnectionState.disconnected:  return 'Déconnecté';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgPrimary,
      body: SafeArea(
        child: Consumer<VpnProvider>(
          builder: (context, vpn, _) {
            final connected = vpn.state == VpnConnectionState.connected;
            final busy = vpn.state == VpnConnectionState.connecting ||
                vpn.state == VpnConnectionState.disconnecting;

            return Column(
              children: [
                // Top bar
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  child: Row(
                    children: [
                      const Icon(Icons.shield_outlined, color: AppColors.accent),
                      const SizedBox(width: 8),
                      const Text('SxB VPN',
                          style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 18)),
                      const Spacer(),
                      IconButton(
                        icon: const Icon(Icons.logout, color: AppColors.textMuted, size: 20),
                        onPressed: () => context.read<AuthProvider>().logout(),
                      ),
                    ],
                  ),
                ),

                const Spacer(),

                // Bouton de connexion — LE bouton unique
                GestureDetector(
                  onTap: busy ? null : () {
                    connected ? vpn.disconnect() : vpn.connect();
                  },
                  child: Container(
                    width: 180, height: 180,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: connected
                          ? AppColors.success.withValues(alpha: 0.12)
                          : AppColors.accent.withValues(alpha: 0.12),
                      border: Border.all(
                        color: connected ? AppColors.success : AppColors.accent,
                        width: 2,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: (connected ? AppColors.success : AppColors.accent).withValues(alpha: 0.3),
                          blurRadius: 40, spreadRadius: 4,
                        ),
                      ],
                    ),
                    child: Center(
                      child: busy
                          ? const CircularProgressIndicator(color: AppColors.accent)
                          : Icon(
                              connected ? Icons.power_settings_new : Icons.power_settings_new,
                              size: 64,
                              color: connected ? AppColors.success : AppColors.accent,
                            ),
                    ),
                  ),
                ),

                const SizedBox(height: 20),
                Text(_stateLabel(vpn.state),
                    style: TextStyle(color: _stateColor(vpn.state), fontSize: 16, fontWeight: FontWeight.w600)),

                const Spacer(),

                // Serveur sélectionné
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: GlassCard(
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const ServersScreen()),
                    ),
                    child: Row(
                      children: [
                        Text(vpn.selectedServer?.flag ?? '🌐', style: const TextStyle(fontSize: 24)),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(vpn.selectedServer?.name ?? 'Sélectionner un serveur',
                                  style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600)),
                              Text(vpn.selectedServer?.protocol ?? '—',
                                  style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                            ],
                          ),
                        ),
                        const Icon(Icons.chevron_right, color: AppColors.textMuted),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),
              ],
            );
          },
        ),
      ),
    );
  }
}
