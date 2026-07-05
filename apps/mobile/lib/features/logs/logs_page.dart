import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/app_colors.dart';
import '../../providers/logs_provider.dart';

class LogsPage extends ConsumerWidget {
  const LogsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final logsAsync = ref.watch(connectionLogsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.gradientDark),
        child: SafeArea(
          child: Column(
            children: [
              _buildHeader(context, ref),
              Expanded(
                child: logsAsync.when(
                  loading: () => const Center(
                    child: CircularProgressIndicator(color: AppColors.accent),
                  ),
                  error: (e, _) => _buildError(context, ref),
                  data:  (logs) => logs.isEmpty
                      ? _buildEmpty(context)
                      : _buildList(context, logs),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
      child: Row(
        children: [
          const Text(
            'Historique VPN',
            style: TextStyle(
              color: AppColors.textPrimary,
              fontSize: 22,
              fontWeight: FontWeight.w700,
            ),
          ),
          const Spacer(),
          IconButton(
            onPressed: () => ref.invalidate(connectionLogsProvider),
            icon: const Icon(Icons.refresh_rounded, color: AppColors.accent),
            tooltip: 'Actualiser',
          ),
        ],
      ),
    );
  }

  Widget _buildError(BuildContext context, WidgetRef ref) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.disconnected.withOpacity(0.1),
            ),
            child: const Icon(Icons.wifi_off_rounded,
                size: 48, color: AppColors.disconnected),
          ),
          const SizedBox(height: 16),
          const Text('Impossible de charger les logs',
              style: TextStyle(
                  color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          const Text('Vérifiez votre connexion',
              style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () => ref.invalidate(connectionLogsProvider),
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Réessayer'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmpty(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.primary.withOpacity(0.08),
            ),
            child: const Icon(Icons.history_rounded,
                size: 48, color: AppColors.textMuted),
          ),
          const SizedBox(height: 16),
          const Text('Aucun log de connexion',
              style: TextStyle(
                  color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          const Text('Connectez-vous au VPN pour démarrer',
              style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
        ],
      ).animate().fadeIn(),
    );
  }

  Widget _buildList(BuildContext context, List<Map<String, dynamic>> logs) {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
      itemCount: logs.length,
      itemBuilder: (context, i) {
        final log = logs[i];
        return _LogTile(log: log, index: i);
      },
    );
  }
}

class _LogTile extends StatelessWidget {
  final Map<String, dynamic> log;
  final int index;
  const _LogTile({required this.log, required this.index});

  @override
  Widget build(BuildContext context) {
    // Backend stores action (CONNECT/DISCONNECT) and details (protocol/server)
    final action   = log['action']?.toString() ?? log['event']?.toString() ?? '';
    final details  = log['details'] as Map<String, dynamic>? ?? {};
    final event    = action == 'VPN_CONNECT'    ? 'CONNECT'
                   : action == 'VPN_DISCONNECT' ? 'DISCONNECT'
                   : action;
    final protocol = log['protocol']?.toString() ?? details['protocol']?.toString() ?? '';
    final server   = log['server']?.toString()   ?? details['server']?.toString()   ?? '';
    final createdAt = log['createdAt']?.toString() ?? '';
    final dt        = DateTime.tryParse(createdAt)?.toLocal();

    final isConnect = event == 'CONNECT' || event == 'VPN_CONNECT';

    final Color eventColor = isConnect ? AppColors.connected : AppColors.disconnected;
    final IconData eventIcon = isConnect ? Icons.link_rounded : Icons.link_off_rounded;

    String timeLabel = '';
    if (dt != null) {
      final h  = dt.hour.toString().padLeft(2, '0');
      final m  = dt.minute.toString().padLeft(2, '0');
      final d  = dt.day.toString().padLeft(2, '0');
      final mo = dt.month.toString().padLeft(2, '0');
      timeLabel = '$d/$mo  $h:$m';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        leading: Container(
          width: 36, height: 36,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: eventColor.withOpacity(0.12),
          ),
          child: Icon(eventIcon, color: eventColor, size: 18),
        ),
        title: Text(
          isConnect ? 'Connecté' : 'Déconnecté',
          style: const TextStyle(
              color: AppColors.textPrimary,
              fontSize: 14,
              fontWeight: FontWeight.w600),
        ),
        subtitle: protocol.isNotEmpty || server.isNotEmpty
            ? Text(
                [if (protocol.isNotEmpty) protocol, if (server.isNotEmpty) server]
                    .join(' • '),
                style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
              )
            : null,
        trailing: Text(
          timeLabel,
          style: const TextStyle(color: AppColors.textSecondary, fontSize: 11),
        ),
      ),
    ).animate(delay: Duration(milliseconds: index * 30)).fadeIn().slideX(begin: 0.05, end: 0);
  }
}
