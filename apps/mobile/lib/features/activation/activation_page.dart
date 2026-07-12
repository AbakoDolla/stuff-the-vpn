import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/app_colors.dart';
import '../../providers/activation_provider.dart';
import '../../services/device_service.dart';
import '../../widgets/gradient_button.dart';

class ActivationPage extends ConsumerStatefulWidget {
  const ActivationPage({super.key});

  @override
  ConsumerState<ActivationPage> createState() => _ActivationPageState();
}

class _ActivationPageState extends ConsumerState<ActivationPage>
    with TickerProviderStateMixin {
  final _tokenCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  late AnimationController _pulseCtrl;
  late AnimationController _bgCtrl;
  late Animation<double> _pulse;
  String? _deviceId;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _pulseCtrl =
        AnimationController(vsync: this, duration: const Duration(milliseconds: 2000))
          ..repeat(reverse: true);
    _bgCtrl =
        AnimationController(vsync: this, duration: const Duration(seconds: 8))
          ..repeat();
    _pulse = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut),
    );
    _loadDeviceId();
  }

  Future<void> _loadDeviceId() async {
    final deviceService = ref.read(deviceServiceProvider);
    final id = await deviceService.getOrCreateDeviceId();
    if (mounted) setState(() => _deviceId = id);
  }

  @override
  void dispose() {
    _tokenCtrl.dispose();
    _pulseCtrl.dispose();
    _bgCtrl.dispose();
    super.dispose();
  }

  Future<void> _activate() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() => _isLoading = true);
    try {
      await ref.read(activationProvider.notifier).activate(
            token: _tokenCtrl.text.trim(),
          );
      if (!mounted) return;
      final activationState = ref.read(activationProvider).valueOrNull;
      if (activationState?.isActivated == true) {
        context.go('/home');
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final activationAsync = ref.watch(activationProvider);
    final errorMsg = activationAsync.valueOrNull?.error;

    // If just got activated, navigate
    ref.listen(activationProvider, (_, next) {
      final val = next.valueOrNull;
      if (val?.isActivated == true && mounted) {
        context.go('/home');
      }
    });

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.gradientDark),
        child: Stack(
          children: [
            // Background animated orbs
            AnimatedBuilder(
              animation: _bgCtrl,
              builder: (context, _) {
                final t = _bgCtrl.value;
                return Stack(
                  children: [
                    Positioned(
                      top: -100 + sin(t * 2 * pi) * 30,
                      right: -80 + cos(t * 2 * pi) * 20,
                      child: _GlowOrb(
                          size: 300,
                          color: AppColors.primary,
                          opacity: 0.08),
                    ),
                    Positioned(
                      bottom: -60 + cos(t * 2 * pi) * 20,
                      left: -40 + sin(t * 2 * pi) * 15,
                      child: _GlowOrb(
                          size: 200,
                          color: AppColors.accent,
                          opacity: 0.06),
                    ),
                  ],
                );
              },
            ),
            SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 0, 24, 40),
                child: Form(
                  key: _formKey,
                  child: Column(
                    children: [
                      const SizedBox(height: 48),
                      // Logo with pulse glow
                      AnimatedBuilder(
                        animation: _pulse,
                        builder: (context, child) => Container(
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.primary
                                    .withOpacity(0.18 * _pulse.value),
                                blurRadius: 60 * _pulse.value,
                                spreadRadius: 20 * _pulse.value,
                              ),
                              BoxShadow(
                                color: AppColors.accent
                                    .withOpacity(0.08 * _pulse.value),
                                blurRadius: 100 * _pulse.value,
                                spreadRadius: 30 * _pulse.value,
                              ),
                            ],
                          ),
                          child: child,
                        ),
                        child: Image.asset(
                          'assets/images/logo.png',
                          width: 100,
                          height: 100,
                          fit: BoxFit.contain,
                        ),
                      ).animate().fadeIn(duration: 600.ms).scale(
                            begin: const Offset(0.7, 0.7),
                            end: const Offset(1, 1),
                            curve: Curves.elasticOut,
                            duration: 800.ms,
                          ),
                      const SizedBox(height: 20),
                      // Title
                      ShaderMask(
                        shaderCallback: (bounds) =>
                            const LinearGradient(
                          colors: [AppColors.primary, AppColors.accent],
                        ).createShader(bounds),
                        child: const Text(
                          'SxBVPN',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 28,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 2,
                          ),
                        ),
                      ).animate().fadeIn(delay: 200.ms),
                      const SizedBox(height: 8),
                      const Text(
                        'Activation de l\'appareil',
                        style: TextStyle(
                          color: AppColors.textMuted,
                          fontSize: 14,
                          letterSpacing: 0.5,
                        ),
                      ).animate().fadeIn(delay: 300.ms),
                      const SizedBox(height: 48),
                      // Device ID card
                      _DeviceIdCard(deviceId: _deviceId)
                          .animate()
                          .fadeIn(delay: 400.ms)
                          .slideY(begin: 0.1, end: 0),
                      const SizedBox(height: 24),
                      // Token field
                      _TokenField(
                        controller: _tokenCtrl,
                        enabled: !_isLoading,
                      ).animate().fadeIn(delay: 500.ms).slideY(begin: 0.1, end: 0),
                      // Error display
                      if (errorMsg != null && errorMsg.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        _ErrorBanner(message: errorMsg)
                            .animate()
                            .fadeIn()
                            .shake(hz: 3, offset: const Offset(4, 0)),
                      ],
                      const SizedBox(height: 32),
                      // Activate button
                      GradientButton(
                        text: 'Activer l\'appareil',
                        isLoading: _isLoading,
                        onPressed: _isLoading ? null : _activate,
                      ).animate().fadeIn(delay: 600.ms),
                      const SizedBox(height: 32),
                      // Info text
                      const Text(
                        'Votre jeton d\'activation vous a été fourni par\nvotre administrateur SxBVPN.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: AppColors.textMuted,
                          fontSize: 12,
                          height: 1.6,
                        ),
                      ).animate().fadeIn(delay: 700.ms),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DeviceIdCard extends StatelessWidget {
  final String? deviceId;
  const _DeviceIdCard({this.deviceId});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.phone_android_rounded,
                  color: AppColors.accent, size: 16),
              SizedBox(width: 6),
              Text(
                'Identifiant appareil',
                style: TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: deviceId == null
                    ? Container(
                        height: 16,
                        decoration: BoxDecoration(
                          color: AppColors.cardBorder,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ).animate(onPlay: (c) => c.repeat()).shimmer(
                            duration: 1200.ms,
                            color: AppColors.surfaceLight,
                          )
                    : Text(
                        deviceId!,
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 13,
                          fontFamily: 'monospace',
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.5,
                        ),
                      ),
              ),
              if (deviceId != null)
                GestureDetector(
                  onTap: () {
                    Clipboard.setData(ClipboardData(text: deviceId!));
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: const Text('ID copié'),
                        backgroundColor: AppColors.surface,
                        behavior: SnackBarBehavior.floating,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10)),
                        duration: const Duration(seconds: 2),
                      ),
                    );
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                          color: AppColors.primary.withOpacity(0.2)),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.copy_rounded,
                            color: AppColors.accent, size: 12),
                        SizedBox(width: 4),
                        Text(
                          'Copier',
                          style: TextStyle(
                            color: AppColors.accent,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _TokenField extends StatelessWidget {
  final TextEditingController controller;
  final bool enabled;
  const _TokenField({required this.controller, required this.enabled});

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      enabled: enabled,
      style: const TextStyle(
        color: AppColors.textPrimary,
        fontSize: 15,
        letterSpacing: 0.5,
      ),
      decoration: InputDecoration(
        labelText: 'Jeton d\'activation',
        hintText: 'Ex: SXB-XXXX-XXXX-XXXX',
        prefixIcon: const Icon(Icons.key_rounded, color: AppColors.accent, size: 20),
        labelStyle: const TextStyle(color: AppColors.textMuted),
        hintStyle: const TextStyle(color: AppColors.textMuted),
        filled: true,
        fillColor: AppColors.surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.cardBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.cardBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide:
              const BorderSide(color: AppColors.primary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.error),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
      ),
      validator: (v) {
        if (v == null || v.trim().isEmpty) return 'Veuillez entrer un jeton';
        return null;
      },
      textInputAction: TextInputAction.done,
      autocorrect: false,
      enableSuggestions: false,
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  final String message;
  const _ErrorBanner({required this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.error.withOpacity(0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.error.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline_rounded,
              color: AppColors.error, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(
                color: AppColors.error,
                fontSize: 13,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _GlowOrb extends StatelessWidget {
  final double size;
  final Color color;
  final double opacity;
  const _GlowOrb(
      {required this.size, required this.color, required this.opacity});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(
          colors: [color.withOpacity(opacity), Colors.transparent],
        ),
      ),
    );
  }
}
