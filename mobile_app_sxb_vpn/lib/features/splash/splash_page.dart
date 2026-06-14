import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme.dart';
import '../../providers/auth_provider.dart';

class SplashPage extends ConsumerStatefulWidget {
  const SplashPage({super.key});

  @override
  ConsumerState<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends ConsumerState<SplashPage> with TickerProviderStateMixin {
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(vsync: this, duration: const Duration(milliseconds: 1500))
      ..repeat(reverse: true);
    _navigate();
  }

  Future<void> _navigate() async {
    await Future.delayed(const Duration(seconds: 3));
    if (!mounted) return;
    final authState = await ref.read(authStateProvider.future);
    if (!mounted) return;
    if (authState.isAuthenticated) {
      context.go('/home');
    } else {
      context.go('/auth/login');
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.gradientDark),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(),
              _buildLogo(),
              const SizedBox(height: 24),
              Text(
                'SXB VPN',
                style: Theme.of(context).textTheme.displayLarge?.copyWith(
                      letterSpacing: 4,
                      fontWeight: FontWeight.w700,
                    ),
              ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.3, end: 0),
              const SizedBox(height: 8),
              Text(
                'Fast  •  Secure  •  Unlimited',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      letterSpacing: 2,
                      color: AppColors.textMuted,
                    ),
              ).animate().fadeIn(delay: 600.ms),
              const Spacer(),
              _buildLoader(),
              const SizedBox(height: 48),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLogo() {
    return AnimatedBuilder(
      animation: _pulseController,
      builder: (context, child) {
        return Container(
          width: 120,
          height: 120,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: const LinearGradient(
              colors: [AppColors.primary, AppColors.accent],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withOpacity(0.3 + _pulseController.value * 0.3),
                blurRadius: 30 + _pulseController.value * 20,
                spreadRadius: 5 + _pulseController.value * 10,
              ),
            ],
          ),
          child: const Icon(Icons.shield_rounded, size: 60, color: Colors.white),
        );
      },
    ).animate().scale(delay: 200.ms, duration: 600.ms, curve: Curves.elasticOut);
  }

  Widget _buildLoader() {
    return SizedBox(
      width: 40,
      height: 40,
      child: CircularProgressIndicator(
        strokeWidth: 2,
        color: AppColors.accent.withOpacity(0.6),
      ),
    ).animate().fadeIn(delay: 800.ms);
  }
}
