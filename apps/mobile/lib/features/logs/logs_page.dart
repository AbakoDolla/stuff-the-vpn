import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/logs_provider.dart';

class LogsPage extends ConsumerWidget {
  const LogsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final logsAsync = ref.watch(connectionLogsProvider);
    final colors = Theme.of(context).colorScheme;
    final text   = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Connection Logs'),
        centerTitle: true,
      ),
      body: logsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.wifi_off_rounded, size: 56, color: colors.error),
              const SizedBox(height: 16),
              Text('Failed to load logs', style: text.titleMedium),
              const SizedBox(height: 12),
              FilledButton.tonal(
                onPressed: () => ref.invalidate(connectionLogsProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (logs) {
          if (logs.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.history_rounded, size: 56, color: colors.outline),
                  const SizedBox(height: 16),
                  Text('No connection logs yet', style: text.titleMedium),
                  const SizedBox(height: 8),
                  Text(
                    'Connect to VPN to start logging',
                    style: text.bodyMedium?.copyWith(color: colors.outline),
                  ),
                ],
              ),
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.symmetric(vertical: 8),
            itemCount: logs.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (context, i) {
              final log       = logs[i];
              final event     = log['event']?.toString()    ?? '';
              final protocol  = log['protocol']?.toString() ?? '';
              final server    = log['server']?.toString()   ?? '';
              final createdAt = log['createdAt']?.toString() ?? '';
              final dt        = DateTime.tryParse(createdAt);
              final timeLabel = dt != null
                  ? '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}'
                  : '';
              final isConnect = event == 'CONNECT';
              return ListTile(
                leading: CircleAvatar(
                  backgroundColor:
                      isConnect ? Colors.green.withOpacity(0.12) : Colors.red.withOpacity(0.12),
                  child: Icon(
                    isConnect ? Icons.link_rounded : Icons.link_off_rounded,
                    color: isConnect ? Colors.green : Colors.red,
                    size: 20,
                  ),
                ),
                title: Text(
                  event,
                  style: text.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                ),
                subtitle: protocol.isNotEmpty || server.isNotEmpty
                    ? Text(
                        [if (protocol.isNotEmpty) protocol, if (server.isNotEmpty) server]
                            .join(' • '),
                        style: text.bodySmall,
                      )
                    : null,
                trailing: Text(
                  timeLabel,
                  style: text.bodySmall?.copyWith(color: colors.outline),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
