import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/app_colors.dart';
import '../../core/app_form.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/gradient_button.dart';
import '../../widgets/app_logo.dart';

class ForgotPasswordPage extends ConsumerStatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  ConsumerState<ForgotPasswordPage> createState() =>
      _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends ConsumerState<ForgotPasswordPage>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  late AnimationController _fadeCtrl;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;
  bool _sent = false;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _fadeCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    )..forward();
    _fadeAnim = CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeOut);
    _slideAnim = Tween<Offset>(
      begin: const Offset(0, 0.1),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeOutCubic));
  }

  @override
  void dispose() {
    _emailController.dispose();
    _fadeCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_formKey.currentState?.validate() ?? false) {
      setState(() => _loading = true);
      // Simulate sending reset link
      await Future.delayed(const Duration(seconds: 2));
      if (mounted) {
        setState(() {
          _loading = false;
          _sent = true;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.gradientDark),
        child: Stack(
          children: [
            Positioned(
              top: -80,
              right: -60,
              child: Container(
                width: 250,
                height: 250,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      AppColors.primary.withValues(alpha: 0.08),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
            SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: FadeTransition(
                  opacity: _fadeAnim,
                  child: SlideTransition(
                    position: _slideAnim,
                    child: Column(
                      children: [
                        const SizedBox(height: 16),
                        // Back button
                        Align(
                          alignment: Alignment.centerLeft,
                          child: GestureDetector(
                            onTap: () => context.pop(),
                            child: Container(
                              width: 42,
                              height: 42,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color:
                                      AppColors.cardBorder.withValues(alpha: 0.3),
                                ),
                                color:
                                    AppColors.surfaceLight.withValues(alpha: 0.3),
                              ),
                              child: const Icon(
                                Icons.arrow_back_ios_new_rounded,
                                color: AppColors.textPrimary,
                                size: 16,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 40),
                        if (!_sent) ...[
                          // Logo
                          Hero(
                            tag: 'app_logo',
                            child: Container(
                              width: 90,
                              height: 90,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color:
                                        AppColors.primary.withValues(alpha: 0.12),
                                    blurRadius: 24,
                                    spreadRadius: 6,
                                  ),
                                ],
                              ),
                              child: const AppLogo(),
                            ),
                          ),
                          const SizedBox(height: 28),
                          // Icon
                          Container(
                            width: 64,
                            height: 64,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: LinearGradient(
                                colors: [
                                  AppColors.primary.withValues(alpha: 0.15),
                                  AppColors.accent.withValues(alpha: 0.1),
                                ],
                              ),
                              border: Border.all(
                                color: AppColors.primary.withValues(alpha: 0.2),
                                width: 1.5,
                              ),
                            ),
                            child: const Icon(
                              Icons.lock_reset_rounded,
                              color: AppColors.accent,
                              size: 30,
                            ),
                          ),
                          const SizedBox(height: 24),
                          Text(
                            'Mot de passe oublié?',
                            style: Theme.of(context)
                                .textTheme
                                .displayLarge
                                ?.copyWith(
                                  fontSize: 28,
                                  fontWeight: FontWeight.w800,
                                ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Entrez votre email et recevez\nun lien de réinitialisation',
                            textAlign: TextAlign.center,
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(
                                  color: AppColors.textMuted,
                                  fontSize: 14,
                                  height: 1.5,
                                ),
                          ),
                          const SizedBox(height: 36),
                          // Glass card
                          Container(
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(24),
                              border: Border.all(
                                color:
                                    AppColors.cardBorder.withValues(alpha: 0.12),
                              ),
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(23),
                              child: BackdropFilter(
                                filter: ImageFilter.blur(
                                    sigmaX: 20, sigmaY: 20),
                                child: Container(
                                  padding: const EdgeInsets.all(4),
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      begin: Alignment.topLeft,
                                      end: Alignment.bottomRight,
                                      colors: [
                                        AppColors.surfaceLight
                                            .withValues(alpha: 0.5),
                                        AppColors.surface.withValues(alpha: 0.35),
                                      ],
                                    ),
                                    borderRadius: BorderRadius.circular(23),
                                  ),
                                  child: Form(
                                    key: _formKey,
                                    child: Column(
                                      children: [
                                        PremiumTextField(
                                          hint: 'Adresse email',
                                          controller: _emailController,
                                          validator: AppForm.emailValidator,
                                          keyboardType:
                                              TextInputType.emailAddress,
                                          textInputAction:
                                              TextInputAction.done,
                                          prefixIcon:
                                              Icons.email_outlined,
                                        ),
                                        const SizedBox(height: 24),
                                        GradientButton(
                                          text: 'Envoyer le lien',
                                          isLoading: _loading,
                                          onPressed: _loading ? null : _submit,
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ] else ...[
                          // Success animation
                          Container(
                            width: 120,
                            height: 120,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: LinearGradient(
                                colors: [
                                  AppColors.connected.withValues(alpha: 0.2),
                                  AppColors.connected.withValues(alpha: 0.05),
                                ],
                              ),
                              border: Border.all(
                                color: AppColors.connected.withValues(alpha: 0.3),
                                width: 2,
                              ),
                            ),
                            child: const Icon(
                              Icons.check_circle_outline_rounded,
                              color: AppColors.connected,
                              size: 56,
                            ),
                          ).animate().scale(
                              duration: 500.ms,
                              curve: Curves.elasticOut),
                          const SizedBox(height: 28),
                          Text(
                            'Lien envoyé!',
                            style: Theme.of(context)
                                .textTheme
                                .displayLarge
                                ?.copyWith(
                                  fontSize: 28,
                                  fontWeight: FontWeight.w800,
                                ),
                          ).animate().fadeIn(delay: 200.ms).slideY(
                              begin: 0.1, end: 0),
                          const SizedBox(height: 12),
                          Text(
                            'Un email de réinitialisation a été envoyé à\n${_emailController.text}',
                            textAlign: TextAlign.center,
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(
                                  color: AppColors.textMuted,
                                  fontSize: 14,
                                  height: 1.5,
                                ),
                          )
                              .animate()
                              .fadeIn(delay: 400.ms)
                              .slideY(begin: 0.05, end: 0),
                          const SizedBox(height: 36),
                          GradientButton(
                            text: 'Retour à la connexion',
                            onPressed: () => context.go('/auth/login'),
                          ).animate().fadeIn(delay: 600.ms).slideY(
                              begin: 0.1, end: 0),
                          const SizedBox(height: 16),
                          TextButton(
                            onPressed: () => setState(() => _sent = false),
                            child: const Text(
                              'Envoyer à nouveau',
                              style: TextStyle(
                                color: AppColors.accent,
                                fontWeight: FontWeight.w500,
                                fontSize: 14,
                              ),
                            ),
                          ).animate().fadeIn(delay: 800.ms),
                        ],
                        const SizedBox(height: 40),
                      ],
                    ),
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
