import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/vpn_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/glass_card.dart';

class ServersScreen extends StatelessWidget {
  const ServersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgPrimary,
      appBar: AppBar(title: const Text('Serveurs')),
      body: Consumer<VpnProvider>(
        builder: (context, vpn, _) {
          if (vpn.isLoadingServers) {
            return const Center(child: CircularProgressIndicator(color: AppColors.accent));
          }
          if (vpn.servers.isEmpty) {
            return const Center(
              child: Text('Aucun serveur disponible', style: TextStyle(color: AppColors.textMuted)),
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: vpn.servers.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (context, i) {
              final s = vpn.servers[i];
              final selected = vpn.selectedServer?.id == s.id;
              return GlassCard(
                onTap: () {
                  vpn.selectServer(s);
                  Navigator.of(context).pop();
                },
                child: Row(
                  children: [
                    Text(s.flag ?? '🌐', style: const TextStyle(fontSize: 22)),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(s.name, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600)),
                          Text(s.protocol, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                        ],
                      ),
                    ),
                    if (s.isPremium)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.warning.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text('Premium', style: TextStyle(color: AppColors.warning, fontSize: 10)),
                      ),
                    if (selected)
                      const Padding(
                        padding: EdgeInsets.only(left: 8),
                        child: Icon(Icons.check_circle, color: AppColors.success, size: 20),
                      ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}
