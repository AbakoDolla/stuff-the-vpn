import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../core/app_colors.dart';

class GradientButton extends StatefulWidget {
  final String text;
  final Widget? icon;
  final VoidCallback? onPressed;
  final bool isLoading;
  final bool isExpanded;
  final double height;
  final double borderRadius;

  const GradientButton({
    super.key,
    required this.text,
    this.icon,
    this.onPressed,
    this.isLoading = false,
    this.isExpanded = true,
    this.height = 56,
    this.borderRadius = 16,
  });

  factory GradientButton.social({
    required String text,
    required Widget icon,
    required VoidCallback? onPressed,
    bool isLoading = false,
  }) {
    return GradientButton(
      text: text,
      icon: icon,
      onPressed: onPressed,
      isLoading: isLoading,
      isExpanded: true,
    );
  }

  @override
  State<GradientButton> createState() => _GradientButtonState();
}

class _GradientButtonState extends State<GradientButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _rippleCtrl;
  late Animation<double> _rippleAnim;
  bool _isPressed = false;

  @override
  void initState() {
    super.initState();
    _rippleCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _rippleAnim = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _rippleCtrl, curve: Curves.easeOut),
    );
  }

  @override
  void dispose() {
    _rippleCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final btn = AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      height: widget.height,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(widget.borderRadius),
        gradient: AppColors.gradientButton,
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.4),
            blurRadius: 20,
            spreadRadius: _isPressed ? 2 : 5,
            offset: const Offset(0, 4),
          ),
          BoxShadow(
            color: AppColors.accent.withOpacity(0.2),
            blurRadius: 40,
            spreadRadius: 2,
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(widget.borderRadius),
        child: InkWell(
          onTap: widget.onPressed != null && !widget.isLoading
              ? () {
                  setState(() => _isPressed = true);
                  _rippleCtrl.forward().then((_) {
                    if (mounted) {
                      _rippleCtrl.reverse();
                      setState(() => _isPressed = false);
                    }
                  });
                  widget.onPressed!();
                }
              : null,
          borderRadius: BorderRadius.circular(widget.borderRadius),
          splashColor: Colors.white.withOpacity(0.15),
          highlightColor: Colors.white.withOpacity(0.05),
          child: Center(
            child: widget.isLoading
                ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      color: Colors.white,
                    ),
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (widget.icon != null) ...[
                        widget.icon!,
                        const SizedBox(width: 10),
                      ],
                      Text(
                        widget.text,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );

    if (!widget.isExpanded) return btn;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 0),
      child: btn,
    );
  }
}

class GlassSocialButton extends StatefulWidget {
  final String text;
  final Widget icon;
  final VoidCallback? onPressed;
  final bool isLoading;

  const GlassSocialButton({
    super.key,
    required this.text,
    required this.icon,
    this.onPressed,
    this.isLoading = false,
  });

  @override
  State<GlassSocialButton> createState() => _GlassSocialButtonState();
}

class _GlassSocialButtonState extends State<GlassSocialButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 150),
      lowerBound: 0.95,
      upperBound: 1.0,
    )..value = 1.0;
    _scale = _ctrl;
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _scale,
      builder: (context, _) => Transform.scale(
        scale: _scale.value,
        child: Container(
          height: 56,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                AppColors.surfaceLight.withOpacity(0.6),
                AppColors.surface.withOpacity(0.3),
              ],
            ),
            border: Border.all(
              color: AppColors.cardBorder.withOpacity(0.3),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.white.withOpacity(0.03),
                blurRadius: 10,
                spreadRadius: 1,
              ),
            ],
          ),
          child: Material(
            color: Colors.transparent,
            borderRadius: BorderRadius.circular(16),
            child: InkWell(
              onTapDown: widget.onPressed != null && !widget.isLoading
                  ? (_) => _ctrl.reverse()
                  : null,
              onTapUp: widget.onPressed != null && !widget.isLoading
                  ? (_) {
                      _ctrl.forward();
                      widget.onPressed!();
                    }
                  : null,
              onTapCancel: () => _ctrl.forward(),
              borderRadius: BorderRadius.circular(16),
              splashColor: Colors.white.withOpacity(0.05),
              highlightColor: Colors.transparent,
              child: Center(
                child: widget.isLoading
                    ? const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.5,
                          color: AppColors.textSecondary,
                        ),
                      )
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          widget.icon,
                          const SizedBox(width: 12),
                          Text(
                            widget.text,
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
