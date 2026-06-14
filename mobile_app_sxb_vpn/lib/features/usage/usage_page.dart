import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../app/theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/user_service.dart';

final usageProvider = FutureProvider<UsageData>((ref) async {
  final authState = ref.watch(authStateProvider).valueOrNull;
  final userService = ref.watch(userServiceProvider);
  final userId = authState?.user?.id;
  if (userId == null || userId.isEmpty) return userService.getUsage('demo');
  return userService.getUsage(userId);
});

class UsagePage extends ConsumerWidget {
  const UsagePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final usage = ref.watch(usageProvider);
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.gradientDark),
        child: SafeArea(
          child: usage.when(
            loading: () =>
                const Center(child: CircularProgressIndicator(color: AppColors.accent)),
            error: (_, __) =>
                const Center(child: Text('Erreur de chargement')),
            data: (data) => _buildContent(context, data),
          ),
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, UsageData data) {
    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(child: _header(context, data)),
        SliverToBoxAdapter(child: _chart(context, data)),
        SliverToBoxAdapter(child: _stats(context, data)),
        const SliverToBoxAdapter(child: SizedBox(height: 80)),
      ],
    );
  }

  String _formatDate(DateTime d) =>
      '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}';

  Widget _header(BuildContext context, UsageData data) {
    final now = DateTime.now();
    final from = now.subtract(const Duration(days: 29));

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Utilisation', style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 4),
          Text('${_formatDate(from)} – ${_formatDate(now)} ${now.year}',
              style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: AppColors.gradientCard,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.cardBorder),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Consommation totale',
                  style: Theme.of(context).textTheme.bodySmall),
              const SizedBox(height: 6),
              Text(
                data.totalGb > 0
                    ? '${data.totalGb.toStringAsFixed(2)} GB'
                    : 'Aucune donnée',
                style: Theme.of(context).textTheme.displayMedium?.copyWith(
                      foreground: Paint()
                        ..shader = const LinearGradient(
                          colors: [AppColors.primary, AppColors.accent],
                        ).createShader(const Rect.fromLTWH(0, 0, 200, 40)),
                    ),
              ),
              if (data.totalGb > 0) ...[
                const SizedBox(height: 12),
                Row(children: [
                  _miniStat(context, Icons.arrow_downward_rounded,
                      AppColors.accent,
                      '${data.downloadGb.toStringAsFixed(2)} GB',
                      'Téléchargé'),
                  const SizedBox(width: 20),
                  _miniStat(context, Icons.arrow_upward_rounded,
                      AppColors.primary,
                      '${data.uploadGb.toStringAsFixed(2)} GB',
                      'Envoyé'),
                ]),
              ],
            ]),
          ),
        ],
      ),
    ).animate().fadeIn().slideY(begin: -0.1, end: 0);
  }

  Widget _miniStat(BuildContext context, IconData icon, Color color,
      String value, String label) {
    return Row(mainAxisSize: MainAxisSize.min, children: [
      Icon(icon, color: color, size: 14),
      const SizedBox(width: 4),
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(value,
            style: TextStyle(
                color: color, fontWeight: FontWeight.w700, fontSize: 13)),
        Text(label,
            style: Theme.of(context)
                .textTheme
                .bodySmall
                ?.copyWith(fontSize: 10)),
      ]),
    ]);
  }

  Widget _chart(BuildContext context, UsageData data) {
    final hasData = data.daily.any((d) => d.gb > 0);

    if (!hasData) {
      return Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
        child: Container(
          height: 140,
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.cardBorder),
          ),
          child: Center(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              const Icon(Icons.bar_chart_rounded,
                  color: AppColors.textMuted, size: 36),
              const SizedBox(height: 8),
              Text('Pas encore de données',
                  style: Theme.of(context).textTheme.bodySmall),
            ]),
          ),
        ),
      );
    }

    final spots = data.daily
        .asMap()
        .entries
        .map((e) => FlSpot(e.key.toDouble(), e.value.gb))
        .toList();

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
      child: Container(
        padding: const EdgeInsets.all(20),
        height: 200,
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.cardBorder),
        ),
        child: LineChart(
          LineChartData(
            gridData: FlGridData(
              show: true,
              drawVerticalLine: false,
              horizontalInterval: 0.2,
              getDrawingHorizontalLine: (_) =>
                  FlLine(color: AppColors.cardBorder, strokeWidth: 1),
            ),
            titlesData: FlTitlesData(
              leftTitles: const AxisTitles(
                  sideTitles: SideTitles(showTitles: false)),
              rightTitles: const AxisTitles(
                  sideTitles: SideTitles(showTitles: false)),
              topTitles: const AxisTitles(
                  sideTitles: SideTitles(showTitles: false)),
              bottomTitles: AxisTitles(
                sideTitles: SideTitles(
                  showTitles: true,
                  interval: 7,
                  getTitlesWidget: (v, _) {
                    final idx = v.toInt();
                    if (idx < 0 || idx >= data.daily.length) {
                      return const SizedBox.shrink();
                    }
                    final d = data.daily[idx].date;
                    return Text(_formatDate(d),
                        style: const TextStyle(
                            color: AppColors.textMuted, fontSize: 10));
                  },
                ),
              ),
            ),
            borderData: FlBorderData(show: false),
            lineBarsData: [
              LineChartBarData(
                spots: spots,
                isCurved: true,
                gradient: const LinearGradient(
                    colors: [AppColors.primary, AppColors.accent]),
                barWidth: 2.5,
                dotData: const FlDotData(show: false),
                belowBarData: BarAreaData(
                  show: true,
                  gradient: LinearGradient(
                    colors: [
                      AppColors.primary.withOpacity(0.3),
                      Colors.transparent
                    ],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    ).animate().fadeIn(delay: 200.ms);
  }

  Widget _stats(BuildContext context, UsageData data) {
    final total = data.downloadGb + data.uploadGb;
    final dlPct = total > 0 ? data.downloadGb / total : 0.5;
    final ulPct = total > 0 ? data.uploadGb / total : 0.5;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.cardBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Répartition', style: Theme.of(context).textTheme.labelLarge),
            const SizedBox(height: 16),
            _barRow(context, Icons.arrow_downward_rounded, AppColors.accent,
                'Téléchargement',
                '${data.downloadGb.toStringAsFixed(2)} GB', dlPct),
            const SizedBox(height: 14),
            _barRow(context, Icons.arrow_upward_rounded, AppColors.primary,
                'Envoi', '${data.uploadGb.toStringAsFixed(2)} GB', ulPct),
          ],
        ),
      ),
    ).animate().fadeIn(delay: 300.ms);
  }

  Widget _barRow(BuildContext context, IconData icon, Color color,
      String label, String value, double pct) {
    return Row(children: [
      Icon(icon, color: color, size: 20),
      const SizedBox(width: 10),
      Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Text(label,
              style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w500,
                  fontSize: 13)),
          const Spacer(),
          Text(value,
              style: const TextStyle(
                  color: AppColors.textSecondary, fontSize: 12)),
        ]),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: pct,
            backgroundColor: AppColors.cardBorder,
            valueColor: AlwaysStoppedAnimation(color),
            minHeight: 4,
          ),
        ),
      ])),
    ]);
  }
}
