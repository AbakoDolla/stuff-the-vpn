import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/app_colors.dart';
import '../../providers/activation_provider.dart';
import '../../services/user_service.dart';

final usageProvider = FutureProvider.autoDispose<UsageData>((ref) async {
  final activation = ref.watch(activationProvider).valueOrNull;
  final userService = ref.read(userServiceProvider);
  final userId = activation?.user?.id ?? '';
  if (userId.isEmpty) return _emptyUsage();
  return userService.getUsage(userId);
});

UsageData _emptyUsage() {
  final now = DateTime.now();
  return UsageData(
    totalGb: 0,
    daily: List.generate(
        30, (i) => DailyUsage(date: now.subtract(Duration(days: 29 - i)), gb: 0)),
    byApp: {},
  );
}

class UsagePage extends ConsumerWidget {
  const UsagePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final usage = ref.watch(usageProvider);
    final sub = ref.watch(_usageSubProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.gradientDark),
        child: SafeArea(
          child: usage.when(
            loading: () => const Center(
                child: CircularProgressIndicator(color: AppColors.accent)),
            error: (_, __) => Center(
              child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                const Icon(Icons.cloud_off_rounded,
                    color: AppColors.textMuted, size: 48),
                const SizedBox(height: 12),
                const Text('Données non disponibles',
                    style: TextStyle(color: AppColors.textMuted)),
                const SizedBox(height: 16),
                TextButton(
                  onPressed: () => ref.invalidate(usageProvider),
                  child: const Text('Réessayer',
                      style: TextStyle(color: AppColors.accent)),
                ),
              ]),
            ),
            data: (data) => _buildContent(context, ref, data, sub),
          ),
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, WidgetRef ref, UsageData data,
      AsyncValue<Map<String, dynamic>?> sub) {
    final subData = sub.valueOrNull;
    final dataLimit = _d(subData?['dataLimit']) ?? 0.0;
    final dataUsed = _d(subData?['dataUsed']) ?? 0.0;
    final dataRemaining = _d(subData?['dataRemaining']) ?? 0.0;
    final usagePct =
        dataLimit > 0 ? (dataUsed / dataLimit).clamp(0.0, 1.0) : 0.0;

    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(child: _header(context, data)),
        SliverToBoxAdapter(
            child: _quotaCard(context, sub.isLoading, dataUsed,
                dataRemaining, dataLimit, usagePct)),
        SliverToBoxAdapter(child: _chart(context, data)),
        SliverToBoxAdapter(child: _stats(context, data)),
        const SliverToBoxAdapter(child: SizedBox(height: 100)),
      ],
    );
  }

  Widget _header(BuildContext context, UsageData data) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Consommation',
            style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: 22,
                fontWeight: FontWeight.w700)),
        const SizedBox(height: 4),
        Text('30 derniers jours',
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
            const Text('Total consommé',
                style:
                    TextStyle(color: AppColors.textMuted, fontSize: 12)),
            const SizedBox(height: 6),
            ShaderMask(
              shaderCallback: (b) => const LinearGradient(
                      colors: [AppColors.primary, AppColors.accent])
                  .createShader(b),
              child: Text(
                data.totalGb > 0
                    ? '${data.totalGb.toStringAsFixed(2)} GB'
                    : 'Aucune donnée',
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.w700),
              ),
            ),
            if (data.totalGb > 0) ...[
              const SizedBox(height: 12),
              Row(children: [
                _miniStat(Icons.arrow_downward_rounded, AppColors.accent,
                    '${data.downloadGb.toStringAsFixed(2)} GB', 'Téléchargé'),
                const SizedBox(width: 24),
                _miniStat(Icons.arrow_upward_rounded, AppColors.primary,
                    '${data.uploadGb.toStringAsFixed(2)} GB', 'Envoyé'),
              ]),
            ],
          ]),
        ),
      ]),
    ).animate().fadeIn().slideY(begin: -0.05, end: 0);
  }

  Widget _miniStat(
      IconData icon, Color color, String value, String label) {
    return Row(mainAxisSize: MainAxisSize.min, children: [
      Icon(icon, color: color, size: 14),
      const SizedBox(width: 4),
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(value,
            style: TextStyle(
                color: color, fontWeight: FontWeight.w700, fontSize: 13)),
        Text(label,
            style: const TextStyle(
                color: AppColors.textMuted, fontSize: 10)),
      ]),
    ]);
  }

  Widget _quotaCard(
      BuildContext context,
      bool isLoading,
      double dataUsed,
      double dataRemaining,
      double dataLimit,
      double usagePct) {
    if (isLoading) {
      return Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
        child: Container(
          height: 80,
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.cardBorder),
          ),
          child: const Center(
            child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                    strokeWidth: 2, color: AppColors.accent)),
          ),
        ),
      );
    }
    if (dataLimit <= 0) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.cardBorder),
        ),
        child: Column(children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _quotaStat('Utilisé', _fmtGB(dataUsed), AppColors.error),
              _quotaStat('Restant', _fmtGB(dataRemaining), AppColors.accent),
              _quotaStat('Total', _fmtGB(dataLimit), AppColors.textSecondary),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: usagePct,
              backgroundColor: AppColors.cardBorder,
              valueColor: AlwaysStoppedAnimation(
                usagePct > 0.8
                    ? AppColors.error
                    : usagePct > 0.5
                        ? AppColors.warning
                        : AppColors.accent,
              ),
              minHeight: 6,
            ),
          ),
        ]),
      ),
    ).animate().fadeIn(delay: 100.ms);
  }

  Widget _quotaStat(String label, String value, Color color) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label,
          style: const TextStyle(
              color: AppColors.textMuted, fontSize: 11)),
      Text(value,
          style: TextStyle(
              color: color, fontSize: 16, fontWeight: FontWeight.w700)),
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
              const Text('Pas encore de données',
                  style: TextStyle(color: AppColors.textMuted)),
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
                    return Text(
                      '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}',
                      style: const TextStyle(
                          color: AppColors.textMuted, fontSize: 10),
                    );
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
                      Colors.transparent,
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
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Répartition',
              style: TextStyle(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w600,
                  fontSize: 14)),
          const SizedBox(height: 16),
          _barRow(Icons.arrow_downward_rounded, AppColors.accent,
              'Téléchargement',
              '${data.downloadGb.toStringAsFixed(2)} GB', dlPct),
          const SizedBox(height: 14),
          _barRow(Icons.arrow_upward_rounded, AppColors.primary, 'Envoi',
              '${data.uploadGb.toStringAsFixed(2)} GB', ulPct),
        ]),
      ),
    ).animate().fadeIn(delay: 300.ms);
  }

  Widget _barRow(IconData icon, Color color, String label, String value,
      double pct) {
    return Row(children: [
      Icon(icon, color: color, size: 20),
      const SizedBox(width: 10),
      Expanded(
          child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
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

  static String _fmtGB(double gb) {
    if (gb <= 0) return '0 GB';
    if (gb >= 1000) return '${(gb / 1000).toStringAsFixed(1)} TB';
    return '${gb.toStringAsFixed(1)} GB';
  }

  static double? _d(dynamic v) {
    if (v == null) return null;
    if (v is double) return v;
    if (v is int) return v.toDouble();
    return double.tryParse(v.toString());
  }
}

final _usageSubProvider =
    FutureProvider.autoDispose<Map<String, dynamic>?>((ref) async {
  return ref.read(userServiceProvider).getSubscription();
});
