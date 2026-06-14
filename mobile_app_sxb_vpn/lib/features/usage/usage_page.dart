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
  final userId = authState?.user?.id ?? 'demo';
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
            loading: () => const Center(child: CircularProgressIndicator(color: AppColors.accent)),
            error: (_, __) => const Center(child: Text('Erreur de chargement')),
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
        SliverToBoxAdapter(child: _byApp(context, data)),
        const SliverToBoxAdapter(child: SizedBox(height: 80)),
      ],
    );
  }

  Widget _header(BuildContext context, UsageData data) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Utilisation', style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 4),
          Text('1 Mai – 31 Mai 2025', style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: AppColors.gradientCard,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.cardBorder),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Consommation totale', style: Theme.of(context).textTheme.bodySmall),
              const SizedBox(height: 6),
              Text('${data.totalGb.toStringAsFixed(2)} GB',
                  style: Theme.of(context).textTheme.displayMedium?.copyWith(
                        foreground: Paint()..shader = const LinearGradient(
                          colors: [AppColors.primary, AppColors.accent],
                        ).createShader(const Rect.fromLTWH(0, 0, 180, 40)),
                      )),
            ]),
          ),
        ],
      ),
    ).animate().fadeIn().slideY(begin: -0.1, end: 0);
  }

  Widget _chart(BuildContext context, UsageData data) {
    if (data.daily.isEmpty) return const SizedBox.shrink();
    final spots = data.daily.asMap().entries
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
              getDrawingHorizontalLine: (_) => FlLine(color: AppColors.cardBorder, strokeWidth: 1),
            ),
            titlesData: FlTitlesData(
              leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
              rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
              topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
              bottomTitles: AxisTitles(sideTitles: SideTitles(
                showTitles: true,
                interval: 8,
                getTitlesWidget: (v, _) {
                  final labels = ['1 Mai', '8 Mai', '15 Mai', '22 Mai', '31 Mai'];
                  final idx = (v / 8).round();
                  if (idx >= labels.length) return const SizedBox.shrink();
                  return Text(labels[idx], style: const TextStyle(color: AppColors.textMuted, fontSize: 10));
                },
              )),
            ),
            borderData: FlBorderData(show: false),
            lineBarsData: [
              LineChartBarData(
                spots: spots,
                isCurved: true,
                gradient: const LinearGradient(colors: [AppColors.primary, AppColors.accent]),
                barWidth: 2.5,
                dotData: const FlDotData(show: false),
                belowBarData: BarAreaData(
                  show: true,
                  gradient: LinearGradient(
                    colors: [AppColors.primary.withOpacity(0.3), Colors.transparent],
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

  Widget _byApp(BuildContext context, UsageData data) {
    final apps = [
      {'name': 'YouTube', 'icon': Icons.play_circle_rounded, 'color': const Color(0xFFFF0000)},
      {'name': 'Instagram', 'icon': Icons.camera_alt_rounded, 'color': const Color(0xFFE1306C)},
      {'name': 'Chrome', 'icon': Icons.language_rounded, 'color': const Color(0xFF4285F4)},
      {'name': 'Autres', 'icon': Icons.more_horiz_rounded, 'color': AppColors.textMuted},
    ];
    final total = data.byApp.values.fold<double>(0, (a, b) => a + b);
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
            Text('Par application', style: Theme.of(context).textTheme.labelLarge),
            const SizedBox(height: 16),
            ...apps.map((app) {
              final gb = data.byApp[app['name']?.toString()] ?? 0;
              final pct = total > 0 ? gb / total : 0.0;
              return Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: Row(children: [
                  Icon(app['icon'] as IconData, color: app['color'] as Color, size: 22),
                  const SizedBox(width: 12),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      Text(app['name'].toString(), style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w500, fontSize: 13)),
                      const Spacer(),
                      Text('${gb.toStringAsFixed(2)} GB', style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                    ]),
                    const SizedBox(height: 6),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: pct,
                        backgroundColor: AppColors.cardBorder,
                        valueColor: AlwaysStoppedAnimation(app['color'] as Color),
                        minHeight: 4,
                      ),
                    ),
                  ])),
                ]),
              );
            }),
          ],
        ),
      ),
    ).animate().fadeIn(delay: 300.ms);
  }
}
