import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';

/// VPN Connection States
enum VpnStatus {
  disconnected,
  connecting,
  connected,
  disconnecting,
  error,
}

/// SXB VPN Design System - VPN Status Indicator
/// Animated indicator showing VPN connection state
class VpnStatusIndicator extends StatefulWidget {
  final VpnStatus status;
  final double size;
  final bool showLabel;

  const VpnStatusIndicator({
    super.key,
    required this.status,
    this.size = 200,
    this.showLabel = true,
  });

  @override
  State<VpnStatusIndicator> createState() => _VpnStatusIndicatorState();
}

class _VpnStatusIndicatorState extends State<VpnStatusIndicator>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late AnimationController _rotationController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    _rotationController = AnimationController(
      duration: const Duration(milliseconds: 2000),
      vsync: this,
    );
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.15).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _updateAnimations();
  }

  @override
  void didUpdateWidget(VpnStatusIndicator oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.status != widget.status) {
      _updateAnimations();
    }
  }

  void _updateAnimations() {
    if (widget.status == VpnStatus.connected) {
      _pulseController.repeat(reverse: true);
    } else if (widget.status == VpnStatus.connecting ||
        widget.status == VpnStatus.disconnecting) {
      _rotationController.repeat();
      _pulseController.stop();
    } else {
      _pulseController.stop();
      _pulseController.reset();
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _rotationController.dispose();
    super.dispose();
  }

  Color get _statusColor {
    switch (widget.status) {
      case VpnStatus.connected:
        return AppColors.success;
      case VpnStatus.connecting:
      case VpnStatus.disconnecting:
        return AppColors.warning;
      case VpnStatus.disconnected:
        return AppColors.textTertiary;
      case VpnStatus.error:
        return AppColors.error;
    }
  }

  String get _statusLabel {
    switch (widget.status) {
      case VpnStatus.connected:
        return 'Connecté';
      case VpnStatus.connecting:
        return 'Connexion...';
      case VpnStatus.disconnecting:
        return 'Déconnexion...';
      case VpnStatus.disconnected:
        return 'Déconnecté';
      case VpnStatus.error:
        return 'Erreur';
    }
  }

  IconData get _statusIcon {
    switch (widget.status) {
      case VpnStatus.connected:
        return Icons.shield_outlined;
      case VpnStatus.connecting:
      case VpnStatus.disconnecting:
        return Icons.sync;
      case VpnStatus.disconnected:
        return Icons.shield_outlined;
      case VpnStatus.error:
        return Icons.shield_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        AnimatedBuilder(
          animation: _pulseAnimation,
          builder: (context, child) {
            return Transform.scale(
              scale: widget.status == VpnStatus.connected
                  ? _pulseAnimation.value
                  : 1.0,
              child: child,
            );
          },
          child: Container(
            width: widget.size,
            height: widget.size,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  _statusColor.withValues(alpha: 0.15),
                  _statusColor.withValues(alpha: 0.05),
                  Colors.transparent,
                ],
                stops: const [0.0, 0.5, 1.0],
              ),
            ),
            child: Center(
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                width: widget.size * 0.75,
                height: widget.size * 0.75,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.surface,
                  border: Border.all(
                    color: _statusColor.withValues(alpha: 0.3),
                    width: 3,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: _statusColor.withValues(alpha: 0.2),
                      blurRadius: 30,
                      spreadRadius: 5,
                    ),
                  ],
                ),
                child: Center(
                  child: widget.status == VpnStatus.connecting ||
                          widget.status == VpnStatus.disconnecting
                      ? RotationTransition(
                          turns: _rotationController,
                          child: Icon(
                            _statusIcon,
                            size: widget.size * 0.35,
                            color: _statusColor,
                          ),
                        )
                      : Icon(
                          _statusIcon,
                          size: widget.size * 0.35,
                          color: _statusColor,
                        ),
                ),
              ),
            ),
          ),
        ),
        if (widget.showLabel) ...[
          const SizedBox(height: AppSpacing.lg),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 200),
            child: Text(
              _statusLabel,
              key: ValueKey(widget.status),
              style: AppTypography.titleLarge.copyWith(
                color: _statusColor,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ],
    );
  }
}

/// SXB VPN Design System - Connection Duration
/// Animated timer showing connection duration
class ConnectionDuration extends StatefulWidget {
  final DateTime? connectedAt;
  final bool isConnected;

  const ConnectionDuration({
    super.key,
    this.connectedAt,
    this.isConnected = false,
  });

  @override
  State<ConnectionDuration> createState() => _ConnectionDurationState();
}

class _ConnectionDurationState extends State<ConnectionDuration> {
  Duration _duration = Duration.zero;

  @override
  void initState() {
    super.initState();
    if (widget.isConnected && widget.connectedAt != null) {
      _updateDuration();
      _startTimer();
    }
  }

  @override
  void didUpdateWidget(ConnectionDuration oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isConnected && widget.connectedAt != null) {
      _updateDuration();
    }
  }

  void _updateDuration() {
    if (widget.connectedAt != null) {
      _duration = DateTime.now().difference(widget.connectedAt!);
    }
  }

  void _startTimer() {
    Future.delayed(const Duration(seconds: 1), () {
      if (mounted && widget.isConnected) {
        setState(() {
          _duration = DateTime.now().difference(widget.connectedAt!);
        });
        _startTimer();
      }
    });
  }

  String _formatDuration(Duration d) {
    final hours = d.inHours.toString().padLeft(2, '0');
    final minutes = (d.inMinutes % 60).toString().padLeft(2, '0');
    final seconds = (d.inSeconds % 60).toString().padLeft(2, '0');
    return '$hours:$minutes:$seconds';
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.isConnected) {
      return Text(
        '--:--:--',
        style: AppTypography.numberMedium.copyWith(
          color: AppColors.textTertiary,
        ),
      );
    }

    return Text(
      _formatDuration(_duration),
      style: AppTypography.numberMedium.copyWith(
        color: AppColors.textPrimary,
        fontFeatures: const [FontFeature.tabularFigures()],
      ),
    );
  }
}

/// SXB VPN Design System - Status Badge
/// Small badge showing status with color coding
class StatusBadge extends StatelessWidget {
  final String label;
  final Color color;
  final IconData? icon;
  final bool isPulsing;

  const StatusBadge({
    super.key,
    required this.label,
    required this.color,
    this.icon,
    this.isPulsing = false,
  });

  factory StatusBadge.connected({String? label}) {
    return StatusBadge(
      label: label ?? 'Connecté',
      color: AppColors.success,
      icon: Icons.check_circle_outline,
    );
  }

  factory StatusBadge.disconnected({String? label}) {
    return StatusBadge(
      label: label ?? 'Déconnecté',
      color: AppColors.textTertiary,
      icon: Icons.cancel_outlined,
    );
  }

  factory StatusBadge.warning({required String label}) {
    return StatusBadge(
      label: label,
      color: AppColors.warning,
      icon: Icons.warning_amber_outlined,
    );
  }

  factory StatusBadge.error({required String label}) {
    return StatusBadge(
      label: label,
      color: AppColors.error,
      icon: Icons.error_outline,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
        border: Border.all(
          color: color.withValues(alpha: 0.3),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(
              icon,
              size: AppSpacing.iconSm,
              color: color,
            ),
            const SizedBox(width: AppSpacing.xs),
          ],
          Text(
            label,
            style: AppTypography.labelSmall.copyWith(
              color: color,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
