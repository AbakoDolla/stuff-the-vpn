import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';

import '../../core/app_colors.dart';
import '../../core/app_form.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/gradient_button.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/app_logo.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
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
    _fadeCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_formKey.currentState?.validate() ?? false) {
      await ref.read(authStateProvider.notifier).login(
            _emailController.text,
            _passwordController.text,
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

    final authState = ref.watch(authStateProvider).valueOrNull ?? const AuthState();
    final isLoading = ref.watch(authStateProvider).isLoading;

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.gradientDark),
        child: Stack(
          children: [
            // Ambient glow spots
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
                      AppColors.primary.withOpacity(0.1),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
            Positioned(
              bottom: -40,
              left: -40,
              child: Container(
                width: 180,
                height: 180,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      AppColors.accent.withOpacity(0.07),
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
                          const SizedBox(height: 20),
                          // Logo
                          Hero(
                            tag: 'app_logo',
                            child: Container(
                              width: 100,
                              height: 100,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: AppColors.primary.withOpacity(0.15),
                                    blurRadius: 30,
                                    spreadRadius: 8,
                                  ),
                                ],
                              ),
                              child: const AppLogo(),
                            ),
                          ),
                          const SizedBox(height: 32),
                          // Title
                          Text(
                            'Bienvenue',
                            style: Theme.of(context)
                                .textTheme
                                .displayLarge
                                ?.copyWith(
                                  fontSize: 34,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 1,
                                ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Connectez-vous à votre compte',
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(
                                  color: AppColors.textMuted,
                                  fontSize: 15,
                                ),
                          ),
                          const SizedBox(height: 40),
                          // Glass card for inputs
                          Container(
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(24),
                              border: Border.all(
                                color: AppColors.cardBorder.withOpacity(0.12),
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.primary.withOpacity(0.04),
                                  blurRadius: 40,
                                  spreadRadius: 10,
                                ),
                              ],
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
                                        hint: 'Email',
                                        controller: _emailController,
                                        validator: AppForm.emailValidator,
                                        keyboardType:
                                            TextInputType.emailAddress,
                                        textInputAction: TextInputAction.next,
                                        prefixIcon: Icons.email_outlined,
                                      ),
                                      const SizedBox(height: 20),
                                      PremiumTextField(
                                        hint: 'Mot de passe',
                                        isPassword: true,
                                        controller: _passwordController,
                                        validator: AppForm.passwordValidator,
                                        textInputAction: TextInputAction.done,
                                        prefixIcon: Icons.lock_outline_rounded,
                                        onChanged: (_) => setState(() {}),
                                      ),
                                      // Forgot password
                                      Align(
                                        alignment: Alignment.centerRight,
                                        child: TextButton(
                                          onPressed: () =>
                                              context.go('/auth/forgot'),
                                          style: TextButton.styleFrom(
                                            padding:
                                                const EdgeInsets.symmetric(
                                                    vertical: 8, horizontal: 4),
                                          ),
                                          child: const Text(
                                            'Mot de passe oublié?',
                                            style: TextStyle(
                                              color: AppColors.accent,
                                              fontSize: 13,
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      // Login button
                                      GradientButton(
                                        text: 'Se connecter',
                                        isLoading: isLoading,
                                        onPressed: isLoading
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
                          // Divider
                          Row(
                            children: [
                              const Expanded(
                                child: Divider(
                                  color: AppColors.cardBorder,
                                  thickness: 0.5,
                                ),
                              ),
                              Padding(
                                padding:
                                    const EdgeInsets.symmetric(horizontal: 16),
                                child: Text(
                                  'ou continuer avec',
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodySmall
                                      ?.copyWith(
                                        color: AppColors.textMuted,
                                        fontSize: 12,
                                      ),
                                ),
                              ),
                              const Expanded(
                                child: Divider(
                                  color: AppColors.cardBorder,
                                  thickness: 0.5,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),
                          // Social buttons
                          GlassSocialButton(
                            text: 'Google',
                            icon: SizedBox(
                              width: 22,
                              height: 22,
                              child: SvgPicture.network(
                                'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg',
                              ),
                            ),
                            isLoading: isLoading,
                            onPressed: isLoading
                                ? null
                                : () => ref
                                    .read(authStateProvider.notifier)
                                    .loginWithGoogle(),
                          ),
                          const SizedBox(height: 12),
                          GlassSocialButton(
                            text: 'Apple',
                            icon: const Icon(
                              Icons.apple_rounded,
                              color: Colors.white,
                              size: 22,
                            ),
                            isLoading: isLoading,
                            onPressed: isLoading
                                ? null
                                : () => ref
                                    .read(authStateProvider.notifier)
                                    .loginWithApple(),
                          ),
                          const SizedBox(height: 12),
                          GlassSocialButton(
                            text: 'Facebook',
                            icon: SizedBox(
                              width: 22,
                              height: 22,
                              child: SvgPicture.network(
                                'https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg',
                              ),
                            ),
                            isLoading: isLoading,
                            onPressed: isLoading
                                ? null
                                : () => ref
                                    .read(authStateProvider.notifier)
                                    .loginWithFacebook(),
                          ),
                          const SizedBox(height: 32),
                          // Register link
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                "Pas encore de compte? ",
                                style: Theme.of(context)
                                    .textTheme
                                    .bodyMedium
                                    ?.copyWith(
                                      color: AppColors.textMuted,
                                      fontSize: 14,
                                    ),
                              ),
                              GestureDetector(
                                onTap: () =>
                                    context.go('/auth/register'),
                                child: ShaderMask(
                                  shaderCallback: (bounds) =>
                                      const LinearGradient(
                                    colors: [
                                      AppColors.primary,
                                      AppColors.accent,
                                    ],
                                  ).createShader(bounds),
                                  child: const Text(
                                    "S'inscrire",
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
