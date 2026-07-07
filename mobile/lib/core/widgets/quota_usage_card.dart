import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';

/// SXB VPN Design System - Quota Usage Card
/// Shows data quota usage with animated progress bar
class QuotaUsageCard extends StatelessWidget {
  final double usedGB;
  final double totalGB;
  final double? uploadSpeed;
  final double? downloadSpeed;
  final bool showSpeeds;
  final bool compact;

  const QuotaUsageCard({
    super.key,
    required this.usedGB,
    required this.totalGB,
    this.uploadSpeed,
    this.downloadSpeed,
    this.showSpeeds = true,
    this.compact = false,
  });

  double get _percentage => totalGB > 0 ? (usedGB / totalGB).clamp(0.0, 1.0) : 0.0;
  double get _remainingGB => (totalGB - usedGB).clamp(0.0, totalGB);

  Color get _progressColor {
    if (_percentage >= 0.9) return AppColors.error;
    if (_percentage >= 0.75) return AppColors.warning;
    return AppColors.success;
  }

  String _formatBytes(double? bytes) {
    if (bytes == null) return '--';
    if (bytes < 1024) return '${bytes.toStringAsFixed(0)} B/s';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB/s';
    if (bytes < 1024 * 1024 * 1024) {
      return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB/s';
    }
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(2)} GB/s';
  }

  @override
  Widget build(BuildContext context) {
    if (compact) {
      return _buildCompact();
    }
    return _buildFull();
  }

  Widget _buildCompact() {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        border: Border.all(color: AppColors.border.withOpacity(0.5)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Quota',
                  style: AppTypography.caption.copyWith(
                    color: AppColors.textTertiary,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  '${_remainingGB.toStringAsFixed(1)} GB restants',
                  style: AppTypography.bodyMedium.copyWith(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          _buildMiniProgress(),
        ],
      ),
    );
  }

  Widget _buildMiniProgress() {
    return SizedBox(
      width: 60,
      height: 60,
      child: Stack(
        fit: StackFit.expand,
        children: [
          CircularProgressIndicator(
            value: _percentage,
            strokeWidth: 6,
            backgroundColor: AppColors.border,
            valueColor: AlwaysStoppedAnimation(_progressColor),
          ),
          Center(
            child: Text(
              '${(_percentage * 100).toStringAsFixed(0)}%',
              style: AppTypography.labelSmall.copyWith(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFull() {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.cardPadding),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.card,
            AppColors.surface.withOpacity(0.5),
          ],
        ),
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        border: Border.all(color: AppColors.border.withOpacity(0.5)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Consommation de données',
                style: AppTypography.titleSmall.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.sm,
                  vertical: AppSpacing.xs,
                ),
                decoration: BoxDecoration(
                  color: _progressColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
                ),
                child: Text(
                  '${(_percentage * 100).toStringAsFixed(0)}%',
                  style: AppTypography.labelSmall.copyWith(
                    color: _progressColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                usedGB.toStringAsFixed(1),
                style: AppTypography.numberLarge.copyWith(
                  color: AppColors.textPrimary,
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(bottom: 6, left: 4),
                child: Text(
                  'GB utilisés',
                  style: AppTypography.bodySmall.copyWith(
                    color: AppColors.textTertiary,
                  ),
                ),
              ),
              const Spacer(),
              Text(
                '/ ${totalGB.toStringAsFixed(0)} GB',
                style: AppTypography.titleMedium.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          ClipRRect(
            borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
            child: TweenAnimationBuilder<double>(
              tween: Tween(begin: 0, end: _percentage),
              duration: const Duration(milliseconds: 800),
              curve: Curves.easeOutCubic,
              builder: (context, value, child) {
                return LinearProgressIndicator(
                  value: value,
                  minHeight: 8,
                  backgroundColor: AppColors.border,
                  valueColor: AlwaysStoppedAnimation(_progressColor),
                );
              },
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildQuotaStat('Restant', '${_remainingGB.toStringAsFixed(1)} GB', AppColors.textPrimary),
              if (showSpeeds) ...[
                _buildSpeedStat(
                  'Download',
                  _formatBytes(downloadSpeed),
                  Icons.arrow_downward,
                  AppColors.success,
                ),
                _buildSpeedStat(
                  'Upload',
                  _formatBytes(uploadSpeed),
                  Icons.arrow_upward,
                  AppColors.secondary,
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuotaStat(String label, String value, Color valueColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: AppTypography.caption.copyWith(
            color: AppColors.textTertiary,
          ),
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          value,
          style: AppTypography.bodyLarge.copyWith(
            color: valueColor,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _buildSpeedStat(String label, String value, IconData icon, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: AppSpacing.iconSm, color: color),
            const SizedBox(width: 2),
            Text(
              label,
              style: AppTypography.caption.copyWith(
                color: AppColors.textTertiary,
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          value,
          style: AppTypography.bodySmall.copyWith(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}

/// SXB VPN Design System - Speed Indicator
/// Shows upload/download speed with animated arrows
class SpeedIndicator extends StatelessWidget {
  final double? uploadSpeed;
  final double? downloadSpeed;
  final bool compact;

  const SpeedIndicator({
    super.key,
    this.uploadSpeed,
    this.downloadSpeed,
    this.compact = false,
  });

  String _formatBytes(double? bytes) {
    if (bytes == null) return '--';
    if (bytes < 1024) return '${bytes.toStringAsFixed(0)} B/s';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB/s';
    if (bytes < 1024 * 1024 * 1024) {
      return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB/s';
    }
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(2)} GB/s';
  }

  @override
  Widget build(BuildContext context) {
    if (compact) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildCompactSpeed(Icons.arrow_downward, downloadSpeed, AppColors.success),
          const SizedBox(width: AppSpacing.md),
          _buildCompactSpeed(Icons.arrow_upward, uploadSpeed, AppColors.secondary),
        ],
      );
    }

    return Row(
      children: [
        Expanded(child: _buildSpeedCard(Icons.arrow_downward, 'Download', downloadSpeed, AppColors.success)),
        const SizedBox(width: AppSpacing.md),
        Expanded(child: _buildSpeedCard(Icons.arrow_upward, 'Upload', uploadSpeed, AppColors.secondary)),
      ],
    );
  }

  Widget _buildCompactSpeed(IconData icon, double? speed, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: AppSpacing.iconSm, color: color),
        const SizedBox(width: AppSpacing.xs),
        Text(
          _formatBytes(speed),
          style: AppTypography.labelSmall.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildSpeedCard(IconData icon, String label, double? speed, Color color) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        border: Border.all(color: AppColors.border.withOpacity(0.5)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.sm),
            decoration: BoxDecoration(
              color: color.withOpacity(0.15),
              borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
            ),
            child: Icon(icon, size: AppSpacing.iconMd, color: color),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: AppTypography.caption.copyWith(
                    color: AppColors.textTertiary,
                  ),
                ),
                Text(
                  _formatBytes(speed),
                  style: AppTypography.bodyMedium.copyWith(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
