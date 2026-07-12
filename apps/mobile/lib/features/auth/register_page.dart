import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/app_colors.dart';
import '../../core/app_form.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/gradient_button.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/app_logo.dart';

class RegisterPage extends ConsumerStatefulWidget {
  const RegisterPage({super.key});

  @override
  ConsumerState<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends ConsumerState<RegisterPage>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _usernameController = TextEditingController();
  bool _agreeToTerms = false;
  late AnimationController _fadeCtrl;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;

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
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _usernameController.dispose();
    _fadeCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_agreeToTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Veuillez accepter les conditions d\'utilisation'),
          backgroundColor: AppColors.disconnected,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      );
      return;
    }
    if (_formKey.currentState?.validate() ?? false) {
      if (_passwordController.text != _confirmPasswordController.text) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Les mots de passe ne correspondent pas'),
            backgroundColor: AppColors.disconnected,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        );
        return;
      }
      await ref.read(authStateProvider.notifier).register(
            _emailController.text,
            _passwordController.text,
            _usernameController.text,
          );
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<AsyncValue<AuthState>>(authStateProvider, (previous, next) {
      next.when(
        data: (state) {
          if (state.isAuthenticated) context.go('/home');
        },
        error: (error, stack) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(error.toString()),
              backgroundColor: AppColors.disconnected,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          );
        },
        loading: () {},
      );
    });

    final authState = ref.watch(authStateProvider);

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.gradientDark),
        child: Stack(
          children: [
            Positioned(
              top: -80,
              left: -60,
              child: Container(
                width: 250,
                height: 250,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      AppColors.accent.withOpacity(0.08),
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
                    child: Form(
                      key: _formKey,
                      child: Column(
                        children: [
                          const SizedBox(height: 12),
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
                                    color: AppColors.cardBorder.withOpacity(0.3),
                                  ),
                                  color: AppColors.surfaceLight.withOpacity(0.3),
                                ),
                                child: const Icon(
                                  Icons.arrow_back_ios_new_rounded,
                                  color: AppColors.textPrimary,
                                  size: 16,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 20),
                          // Logo
                          Hero(
                            tag: 'app_logo',
                            child: Container(
                              width: 80,
                              height: 80,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: AppColors.primary.withOpacity(0.12),
                                    blurRadius: 24,
                                    spreadRadius: 6,
                                  ),
                                ],
                              ),
                              child: const AppLogo(),
                            ),
                          ),
                          const SizedBox(height: 24),
                          // Title
                          Text(
                            'Créer un compte',
                            style: Theme.of(context)
                                .textTheme
                                .displayLarge
                                ?.copyWith(
                                  fontSize: 30,
                                  fontWeight: FontWeight.w800,
                                ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Rejoignez SxBVPN dès maintenant',
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(
                                  color: AppColors.textMuted,
                                  fontSize: 14,
                                ),
                          ),
                          const SizedBox(height: 32),
                          // Glass card
                          Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(24),
                              border: Border.all(
                                color: AppColors.cardBorder.withOpacity(0.12),
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
                                            .withOpacity(0.5),
                                        AppColors.surface.withOpacity(0.35),
                                      ],
                                    ),
                                    borderRadius: BorderRadius.circular(23),
                                  ),
                                  child: Column(
                                    children: [
                                      PremiumTextField(
                                        hint: 'Nom d\'utilisateur',
                                        controller: _usernameController,
                                        validator: AppForm.usernameValidator,
                                        textInputAction: TextInputAction.next,
                                        prefixIcon: Icons.person_outline_rounded,
                                      ),
                                      const SizedBox(height: 16),
                                      PremiumTextField(
                                        hint: 'Email',
                                        controller: _emailController,
                                        validator: AppForm.emailValidator,
                                        keyboardType:
                                            TextInputType.emailAddress,
                                        textInputAction: TextInputAction.next,
                                        prefixIcon: Icons.email_outlined,
                                      ),
                                      const SizedBox(height: 16),
                                      PremiumTextField(
                                        hint: 'Mot de passe',
                                        isPassword: true,
                                        controller: _passwordController,
                                        validator: AppForm.passwordValidator,
                                        textInputAction: TextInputAction.next,
                                        prefixIcon: Icons.lock_outline_rounded,
                                      ),
                                      const SizedBox(height: 16),
                                      PremiumTextField(
                                        hint: 'Confirmer le mot de passe',
                                        isPassword: true,
                                        controller:
                                            _confirmPasswordController,
                                        validator: (v) {
                                          if (v == null || v.isEmpty) {
                                            return 'Confirmez votre mot de passe';
                                          }
                                          if (v != _passwordController.text) {
                                            return 'Les mots de passe ne correspondent pas';
                                          }
                                          return null;
                                        },
                                        textInputAction: TextInputAction.done,
                                        prefixIcon:
                                            Icons.lock_outline_rounded,
                                      ),
                                      const SizedBox(height: 16),
                                      // Terms checkbox
                                      Row(
                                        children: [
                                          SizedBox(
                                            width: 24,
                                            height: 24,
                                            child: Checkbox(
                                              value: _agreeToTerms,
                                              onChanged: (v) => setState(
                                                  () => _agreeToTerms = v!),
                                              side: const BorderSide(
                                                color: AppColors.cardBorder,
                                              ),
                                              activeColor: AppColors.accent,
                                              checkColor: AppColors.background,
                                              shape: RoundedRectangleBorder(
                                                borderRadius:
                                                    BorderRadius.circular(6),
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 12),
                                          Expanded(
                                            child: RichText(
                                              text: TextSpan(
                                                style: Theme.of(context)
                                                    .textTheme
                                                    .bodySmall
                                                    ?.copyWith(
                                                      color: AppColors
                                                          .textMuted,
                                                      fontSize: 12,
                                                    ),
                                                children: [
                                                  const TextSpan(
                                                    text:
                                                        'J\'accepte les ',
                                                  ),
                                                  TextSpan(
                                                    text:
                                                        'conditions d\'utilisation',
                                                    style: const TextStyle(
                                                      color: AppColors.accent,
                                                      fontWeight:
                                                          FontWeight.w600,
                                                    ),
                                                  ),
                                                  const TextSpan(
                                                    text: ' et la ',
                                                  ),
                                                  TextSpan(
                                                    text:
                                                        'politique de confidentialité',
                                                    style: const TextStyle(
                                                      color: AppColors.accent,
                                                      fontWeight:
                                                          FontWeight.w600,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 20),
                                      GradientButton(
                                        text: 'Créer mon compte',
                                        isLoading: authState.isLoading,
                                        onPressed: authState.isLoading
                                            ? null
                                            : _submit,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                "Déjà un compte? ",
                                style: Theme.of(context)
                                    .textTheme
                                    .bodyMedium
                                    ?.copyWith(
                                      color: AppColors.textMuted,
                                      fontSize: 14,
                                    ),
                              ),
                              GestureDetector(
                                onTap: () => context.pop(),
                                child: ShaderMask(
                                  shaderCallback: (bounds) =>
                                      const LinearGradient(
                                    colors: [
                                      AppColors.primary,
                                      AppColors.accent,
                                    ],
                                  ).createShader(bounds),
                                  child: const Text(
                                    'Se connecter',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 24),
                        ],
                      ),
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
