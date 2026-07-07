import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';

/// SXB VPN Design System - Premium Button
/// Modern, animated button with gradient support
class SxbButton extends StatefulWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final bool isOutlined;
  final IconData? icon;
  final double height;
  final Gradient? gradient;
  final Color? backgroundColor;
  final Color? textColor;
  final bool expanded;

  const SxbButton({
    super.key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
    this.isOutlined = false,
    this.icon,
    this.height = AppSpacing.buttonHeightMd,
    this.gradient,
    this.backgroundColor,
    this.textColor,
    this.expanded = true,
  });

  @override
  State<SxbButton> createState() => _SxbButtonState();
}

class _SxbButtonState extends State<SxbButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  bool _isPressed = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 100),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.96).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleTapDown(TapDownDetails details) {
    if (widget.onPressed != null && !widget.isLoading) {
      setState(() => _isPressed = true);
      _controller.forward();
    }
  }

  void _handleTapUp(TapUpDetails details) {
    setState(() => _isPressed = false);
    _controller.reverse();
  }

  void _handleTapCancel() {
    setState(() => _isPressed = false);
    _controller.reverse();
  }

  @override
  Widget build(BuildContext context) {
    final isDisabled = widget.onPressed == null || widget.isLoading;

    return GestureDetector(
      onTapDown: _handleTapDown,
      onTapUp: _handleTapUp,
      onTapCancel: _handleTapCancel,
      onTap: widget.isLoading ? null : widget.onPressed,
      child: AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) {
          return Transform.scale(
            scale: _scaleAnimation.value,
            child: child,
          );
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          width: widget.expanded ? double.infinity : null,
          height: widget.height,
          decoration: BoxDecoration(
            gradient: widget.gradient ??
                (widget.isOutlined
                    ? null
                    : (isDisabled
                        ? LinearGradient(
                            colors: [
                              AppColors.textTertiary.withOpacity(0.3),
                              AppColors.textTertiary.withOpacity(0.3),
                            ],
                          )
                        : AppColors.primaryGradient)),
            color: widget.isOutlined
                ? Colors.transparent
                : (widget.backgroundColor != null && !isDisabled
                    ? widget.backgroundColor
                    : null),
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            border: widget.isOutlined
                ? Border.all(
                    color: isDisabled
                        ? AppColors.textTertiary.withOpacity(0.3)
                        : AppColors.border,
                    width: 1.5,
                  )
                : null,
            boxShadow: !isDisabled && !widget.isOutlined
                ? [
                    BoxShadow(
                      color: (_isPressed ? AppColors.primary : AppColors.primary)
                          .withOpacity(_isPressed ? 0.4 : 0.3),
                      blurRadius: _isPressed ? 8 : 16,
                      offset: Offset(0, _isPressed ? 2 : 6),
                    ),
                  ]
                : null,
          ),
          child: Center(
            child: widget.isLoading
                ? SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        widget.isOutlined
                            ? AppColors.primary
                            : AppColors.textPrimary,
                      ),
                    ),
                  )
                : Row(
                    mainAxisSize:
                        widget.expanded ? MainAxisSize.max : MainAxisSize.min,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (widget.icon != null) ...[
                        Icon(
                          widget.icon,
                          color: widget.isOutlined
                              ? (isDisabled
                                  ? AppColors.textTertiary
                                  : AppColors.primary)
                              : (widget.textColor ?? AppColors.textPrimary),
                          size: AppSpacing.iconLg,
                        ),
                        const SizedBox(width: AppSpacing.sm),
                      ],
                      Padding(
                        padding: EdgeInsets.symmetric(
                          horizontal: widget.expanded ? 0 : AppSpacing.lg,
                        ),
                        child: Text(
                          widget.text,
                          style: AppTypography.buttonMedium.copyWith(
                            color: widget.isOutlined
                                ? (isDisabled
                                    ? AppColors.textTertiary
                                    : AppColors.primary)
                                : (widget.textColor ?? AppColors.textPrimary),
                          ),
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}

/// SXB VPN Design System - Icon Button
/// Circular icon button with hover effect
class SxbIconButton extends StatefulWidget {
  final IconData icon;
  final VoidCallback? onPressed;
  final double size;
  final Color? backgroundColor;
  final Color? iconColor;
  final String? tooltip;

  const SxbIconButton({
    super.key,
    required this.icon,
    this.onPressed,
    this.size = 48,
    this.backgroundColor,
    this.iconColor,
    this.tooltip,
  });

  @override
  State<SxbIconButton> createState() => _SxbIconButtonState();
}

class _SxbIconButtonState extends State<SxbIconButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 100),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.9).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    Widget button = GestureDetector(
      onTapDown: (_) => _controller.forward(),
      onTapUp: (_) => _controller.reverse(),
      onTapCancel: () => _controller.reverse(),
      onTap: widget.onPressed,
      child: AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) {
          return Transform.scale(
            scale: _scaleAnimation.value,
            child: child,
          );
        },
        child: Container(
          width: widget.size,
          height: widget.size,
          decoration: BoxDecoration(
            color: widget.backgroundColor ?? AppColors.surface,
            shape: BoxShape.circle,
            border: Border.all(
              color: AppColors.border.withOpacity(0.5),
              width: 1,
            ),
          ),
          child: Icon(
            widget.icon,
            color: widget.iconColor ?? AppColors.textSecondary,
            size: widget.size * 0.5,
          ),
        ),
      ),
    );

    if (widget.tooltip != null) {
      return Tooltip(message: widget.tooltip!, child: button);
    }
    return button;
  }
}
