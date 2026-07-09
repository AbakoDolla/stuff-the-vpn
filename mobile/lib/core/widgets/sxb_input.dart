import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';

/// SXB VPN Design System - Premium Input Field
/// Modern, animated input field with validation support
class SxbInput extends StatefulWidget {
  final String? label;
  final String? hint;
  final String? errorText;
  final TextEditingController? controller;
  final TextInputType? keyboardType;
  final bool obscureText;
  final bool enabled;
  final int? maxLines;
  final int? maxLength;
  final IconData? prefixIcon;
  final Widget? suffix;
  final ValueChanged<String>? onChanged;
  final VoidCallback? onTap;
  final List<TextInputFormatter>? inputFormatters;
  final bool readOnly;
  final FocusNode? focusNode;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onSubmitted;

  const SxbInput({
    super.key,
    this.label,
    this.hint,
    this.errorText,
    this.controller,
    this.keyboardType,
    this.obscureText = false,
    this.enabled = true,
    this.maxLines = 1,
    this.maxLength,
    this.prefixIcon,
    this.suffix,
    this.onChanged,
    this.onTap,
    this.inputFormatters,
    this.readOnly = false,
    this.focusNode,
    this.textInputAction,
    this.onSubmitted,
  });

  @override
  State<SxbInput> createState() => _SxbInputState();
}

class _SxbInputState extends State<SxbInput> with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _borderAnimation;
  late Animation<Color?> _colorAnimation;
  bool _isFocused = false;
  bool _showPassword = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _borderAnimation = Tween<double>(begin: 1.0, end: 2.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOut),
    );
    _colorAnimation = ColorTween(
      begin: AppColors.border,
      end: AppColors.primary,
    ).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOut),
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _handleFocusChange(bool focused) {
    setState(() => _isFocused = focused);
    if (focused) {
      _animationController.forward();
    } else {
      _animationController.reverse();
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasError = widget.errorText != null && widget.errorText!.isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (widget.label != null) ...[
          Text(
            widget.label!,
            style: AppTypography.labelMedium.copyWith(
              color: hasError ? AppColors.error : AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
        ],
        AnimatedBuilder(
          animation: _colorAnimation,
          builder: (context, child) {
            return Focus(
              onFocusChange: _handleFocusChange,
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                  boxShadow: _isFocused
                      ? [
                          BoxShadow(
                            color: (hasError ? AppColors.error : AppColors.primary)
                                .withOpacity(0.15),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ]
                      : null,
                ),
                child: TextField(
                  controller: widget.controller,
                  focusNode: widget.focusNode,
                  keyboardType: widget.keyboardType,
                  obscureText: widget.obscureText && !_showPassword,
                  enabled: widget.enabled,
                  maxLines: widget.obscureText ? 1 : widget.maxLines,
                  maxLength: widget.maxLength,
                  readOnly: widget.readOnly,
                  onChanged: widget.onChanged,
                  onTap: widget.onTap,
                  inputFormatters: widget.inputFormatters,
                  textInputAction: widget.textInputAction,
                  onSubmitted: widget.onSubmitted,
                  style: AppTypography.bodyLarge.copyWith(
                    color: widget.enabled
                        ? AppColors.textPrimary
                        : AppColors.textDisabled,
                  ),
                  cursorColor: AppColors.primary,
                  decoration: InputDecoration(
                    hintText: widget.hint,
                    hintStyle: AppTypography.bodyMedium.copyWith(
                      color: AppColors.textTertiary,
                    ),
                    filled: true,
                    fillColor: AppColors.surface,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.lg,
                      vertical: AppSpacing.md,
                    ),
                    prefixIcon: widget.prefixIcon != null
                        ? Icon(
                            widget.prefixIcon,
                            color: _isFocused
                                ? AppColors.primary
                                : AppColors.textTertiary,
                            size: AppSpacing.iconLg,
                          )
                        : null,
                    suffix: widget.obscureText
                        ? IconButton(
                            icon: Icon(
                              _showPassword
                                  ? Icons.visibility_off_outlined
                                  : Icons.visibility_outlined,
                              color: AppColors.textTertiary,
                              size: AppSpacing.iconLg,
                            ),
                            onPressed: () {
                              setState(() => _showPassword = !_showPassword);
                            },
                          )
                        : widget.suffix,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                      borderSide: BorderSide(
                        color: hasError ? AppColors.error : AppColors.border,
                      ),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                      borderSide: BorderSide(
                        color: hasError ? AppColors.error : AppColors.border,
                      ),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                      borderSide: BorderSide(
                        color: hasError ? AppColors.error : AppColors.primary,
                        width: 2,
                      ),
                    ),
                    errorBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                      borderSide: const BorderSide(color: AppColors.error),
                    ),
                    disabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                      borderSide: BorderSide(
                        color: AppColors.border.withOpacity(0.5),
                      ),
                    ),
                    counterText: '',
                  ),
                ),
              ),
            );
          },
        ),
        if (hasError) ...[
          const SizedBox(height: AppSpacing.xs),
          Text(
            widget.errorText!,
            style: AppTypography.caption.copyWith(color: AppColors.error),
          ),
        ],
      ],
    );
  }
}

/// SXB VPN Design System - Search Input
/// Input field optimized for search functionality
class SxbSearchInput extends StatelessWidget {
  final TextEditingController? controller;
  final String? hint;
  final ValueChanged<String>? onChanged;
  final VoidCallback? onClear;
  final bool readOnly;

  const SxbSearchInput({
    super.key,
    this.controller,
    this.hint,
    this.onChanged,
    this.onClear,
    this.readOnly = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: AppSpacing.inputHeight,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        border: Border.all(color: AppColors.border.withOpacity(0.5)),
      ),
      child: Row(
        children: [
          const SizedBox(width: AppSpacing.md),
          const Icon(
            Icons.search_outlined,
            color: AppColors.textTertiary,
            size: AppSpacing.iconLg,
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: TextField(
              controller: controller,
              readOnly: readOnly,
              onChanged: onChanged,
              style: AppTypography.bodyMedium.copyWith(
                color: AppColors.textPrimary,
              ),
              decoration: InputDecoration(
                hintText: hint ?? 'Rechercher...',
                hintStyle: AppTypography.bodyMedium.copyWith(
                  color: AppColors.textTertiary,
                ),
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                contentPadding: EdgeInsets.zero,
                isDense: true,
              ),
            ),
          ),
          if (controller?.text.isNotEmpty ?? false)
            IconButton(
              icon: const Icon(
                Icons.close,
                color: AppColors.textTertiary,
                size: AppSpacing.iconMd,
              ),
              onPressed: () {
                controller?.clear();
                onClear?.call();
              },
            ),
          const SizedBox(width: AppSpacing.sm),
        ],
      ),
    );
  }
}
