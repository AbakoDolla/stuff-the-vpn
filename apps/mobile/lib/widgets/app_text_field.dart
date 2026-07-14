import 'dart:ui';
import 'package:flutter/material.dart';
import '../core/app_colors.dart';

class PremiumTextField extends StatefulWidget {
  final String hint;
  final String? label;
  final TextEditingController controller;
  final String? Function(String?)? validator;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final bool isPassword;
  final IconData? prefixIcon;
  final Widget? suffix;
  final int maxLines;
  final FocusNode? focusNode;
  final ValueChanged<String>? onChanged;
  final bool enabled;

  const PremiumTextField({
    super.key,
    required this.hint,
    this.label,
    required this.controller,
    this.validator,
    this.keyboardType,
    this.textInputAction,
    this.isPassword = false,
    this.prefixIcon,
    this.suffix,
    this.maxLines = 1,
    this.focusNode,
    this.onChanged,
    this.enabled = true,
  });

  @override
  State<PremiumTextField> createState() => _PremiumTextFieldState();
}

class _PremiumTextFieldState extends State<PremiumTextField> {
  bool _obscured = false;
  late FocusNode _focusNode;
  bool _isFocused = false;
  String? _errorText;

  @override
  void initState() {
    super.initState();
    _obscured = widget.isPassword;
    _focusNode = widget.focusNode ?? FocusNode();
    _focusNode.addListener(_onFocusChange);
  }

  @override
  void dispose() {
    if (widget.focusNode == null) _focusNode.dispose();
    _focusNode.removeListener(_onFocusChange);
    super.dispose();
  }

  void _onFocusChange() {
    setState(() => _isFocused = _focusNode.hasFocus);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (widget.label != null) ...[
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 8),
            child: Text(
              widget.label!,
              style: TextStyle(
                color: _isFocused ? AppColors.accent : AppColors.textSecondary,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
        AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOutCubic,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: _errorText != null
                  ? AppColors.disconnected
                  : _isFocused
                      ? AppColors.primary
                      : AppColors.cardBorder.withValues(alpha: 0.5),
              width: _isFocused ? 1.5 : 1,
            ),
            boxShadow: _isFocused
                ? [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.15),
                      blurRadius: 12,
                      spreadRadius: 1,
                    ),
                  ]
                : null,
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(15),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
              child: Container(
                color: AppColors.surfaceLight.withValues(alpha: 0.4),
                child: TextFormField(
                  controller: widget.controller,
                  focusNode: _focusNode,
                  obscureText: _obscured,
                  validator: (v) {
                    final err = widget.validator?.call(v);
                    if (err != _errorText) setState(() => _errorText = err);
                    return err;
                  },
                  keyboardType: widget.keyboardType,
                  textInputAction: widget.textInputAction,
                  maxLines: widget.maxLines,
                  enabled: widget.enabled,
                  onChanged: widget.onChanged,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                  ),
                  decoration: InputDecoration(
                    hintText: widget.hint,
                    hintStyle: TextStyle(
                      color: AppColors.textMuted.withValues(alpha: 0.6),
                      fontSize: 14,
                      fontWeight: FontWeight.w400,
                    ),
                    prefixIcon: widget.prefixIcon != null
                        ? Padding(
                            padding: const EdgeInsets.only(left: 16, right: 12),
                            child: Icon(
                              widget.prefixIcon,
                              color: _isFocused
                                  ? AppColors.accent
                                  : AppColors.textMuted,
                              size: 20,
                            ),
                          )
                        : null,
                    prefixIconConstraints: widget.prefixIcon != null
                        ? const BoxConstraints(minWidth: 48, minHeight: 24)
                        : null,
                    suffixIcon: widget.isPassword
                        ? Padding(
                            padding: const EdgeInsets.only(right: 4),
                            child: IconButton(
                              icon: Icon(
                                _obscured
                                    ? Icons.visibility_off_rounded
                                    : Icons.visibility_rounded,
                                color: _isFocused
                                    ? AppColors.accent
                                    : AppColors.textMuted,
                                size: 20,
                              ),
                              onPressed: () =>
                                  setState(() => _obscured = !_obscured),
                              splashRadius: 20,
                            ),
                          )
                        : widget.suffix != null
                            ? widget.suffix
                            : null,
                    suffixIconConstraints: const BoxConstraints(
                      minWidth: 44,
                      minHeight: 24,
                    ),
                    filled: false,
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    errorBorder: InputBorder.none,
                    focusedErrorBorder: InputBorder.none,
                    disabledBorder: InputBorder.none,
                    contentPadding: EdgeInsets.only(
                      left: widget.prefixIcon != null ? 0 : 20,
                      right: 16,
                      top: 18,
                      bottom: 18,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
        if (_errorText != null)
          Padding(
            padding: const EdgeInsets.only(left: 12, top: 6),
            child: Row(
              children: [
                const Icon(Icons.error_outline_rounded,
                    color: AppColors.disconnected, size: 14),
                const SizedBox(width: 6),
                Text(
                  _errorText!,
                  style: const TextStyle(
                    color: AppColors.disconnected,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ).animate().fadeIn(duration: 200.ms).slideX(begin: -0.05, end: 0),
      ],
    );
  }
}
