import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';

class SplashPage extends ConsumerStatefulWidget {
  const SplashPage({super.key});

  @override
  ConsumerState<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends ConsumerState<SplashPage>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 1500))
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
        decoration: const BoxDecoration(
            gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0xFF0B0F1A), Color(0xFF0D1525)])),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(),
              _buildLogo(),
              const SizedBox(height: 32),
              Text(
                'SXB VPN',
                style: Theme.of(context).textTheme.displayLarge?.copyWith(
                      letterSpacing: 4,
                      fontWeight: FontWeight.w800,
                    ),
              )
                  .animate()
                  .fadeIn(delay: 400.ms)
                  .slideY(begin: 0.3, end: 0)
                  .then()
                  .shake(hz: 4, duration: 1000.ms),
              const SizedBox(height: 8),
              Text(
                'Fast  •  Secure  •  Unlimited',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      letterSpacing: 2,
                      color: const Color(0xFF64748B),
                    ),
              )
                  .animate()
                  .fadeIn(delay: 600.ms)
                  .then()
                  .shimmer(duration: 1500.ms),
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
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF2563EB)
                    .withOpacity(0.3 + _pulseController.value * 0.3),
                blurRadius: 40 + _pulseController.value * 30,
                spreadRadius: 10 + _pulseController.value * 15,
              ),
            ],
          ),
          child: child,
        );
      },
      child: Image.asset(
        'assets/images/logo.png',
        width: 160,
        height: 160,
        fit: BoxFit.contain,
      ),
    )
        .animate()
        .scale(delay: 200.ms, duration: 700.ms, curve: Curves.elasticOut)
        .then()
        .rotate(begin: -0.1, end: 0.1, duration: 1000.ms, curve: Curves.easeInOutCubic)
        .then()
        .rotate(begin: 0.1, end: -0.1, duration: 1000.ms, curve: Curves.easeInOutCubic);
  }

  Widget _buildLoader() {
    return SizedBox(
      width: 40,
      height: 40,
      child: CircularProgressIndicator(
        strokeWidth: 2,
        color: const Color(0xFF06B6D4).withOpacity(0.6),
      ),
    ).animate().fadeIn(delay: 800.ms);
  }
}
