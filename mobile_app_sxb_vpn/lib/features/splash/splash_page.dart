import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/gradient_button.dart';

class SplashPage extends ConsumerStatefulWidget {
  const SplashPage({super.key});

  @override
  ConsumerState<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends ConsumerState<SplashPage>
    with TickerProviderStateMixin {
  late AnimationController _pulseCtrl;
  late AnimationController _particleCtrl;
  late AnimationController _logoEnterCtrl;
  late Animation<double> _pulseAnim;
  late Animation<double> _logoScale;
  late Animation<double> _logoOpacity;
  final List<_Particle> _particles = [];
  final Random _random = Random();
  bool _showLanding = false;
  bool _isCheckingAuth = true;

  @override
  void initState() {
    super.initState();

    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
    _pulseAnim = Tween<double>(begin: 0.6, end: 1.0).animate(
      CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut),
    );

    _particleCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    )..repeat();
    _logoEnterCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..forward();
    _logoScale = Tween<double>(begin: 0.5, end: 1.0).animate(
      CurvedAnimation(parent: _logoEnterCtrl, curve: Curves.elasticOut),
    );
    _logoOpacity = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _logoEnterCtrl, curve: Curves.easeOut),
    );

    _initParticles();
    _checkAuth();
  }

  void _initParticles() {
    for (int i = 0; i < 20; i++) {
      _particles.add(_Particle(
        x: _random.nextDouble(),
        y: _random.nextDouble(),
        size: 1.5 + _random.nextDouble() * 3,
        speed: 0.2 + _random.nextDouble() * 0.4,
        opacity: 0.2 + _random.nextDouble() * 0.5,
      ));
    }
  }

  Future<void> _checkAuth() async {
    await Future.delayed(const Duration(seconds: 2));
    if (!mounted) return;

    final authState = await ref.read(authStateProvider.future);
    if (!mounted) return;

    if (authState.isAuthenticated) {
      context.go('/home');
    } else {
      setState(() {
        _isCheckingAuth = false;
        _showLanding = true;
      });
    }
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    _particleCtrl.dispose();
    _logoEnterCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.gradientDark),
        child: Stack(
          children: [
            // Floating particles
            AnimatedBuilder(
              animation: _particleCtrl,
              builder: (context, _) {
                return CustomPaint(
                  size: Size.infinite,
                  painter: _ParticlePainter(
                    particles: _particles,
                    progress: _particleCtrl.value,
                  ),
                );
              },
            ),
            // Blue glow spots
            Positioned(
              top: -100,
              right: -80,
              child: Container(
                width: 300,
                height: 300,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      AppColors.primary.withOpacity(0.12),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
            Positioned(
              bottom: -60,
              left: -40,
              child: Container(
                width: 200,
                height: 200,
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
            // Center content
            SafeArea(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Spacer(flex: 3),
                  // Animated logo with glow
                  AnimatedBuilder(
                    animation: _logoEnterCtrl,
                    builder: (context, _) {
                      return Opacity(
                        opacity: _logoOpacity.value,
                        child: Transform.scale(
                          scale: _logoScale.value,
                          child: AnimatedBuilder(
                            animation: _pulseAnim,
                            builder: (context, child) {
                              return Container(
                                padding: const EdgeInsets.all(24),
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color: AppColors.primary
                                          .withOpacity(0.15 * _pulseAnim.value),
                                      blurRadius: 60 * _pulseAnim.value,
                                      spreadRadius: 20 * _pulseAnim.value,
                                    ),
                                    BoxShadow(
                                      color: AppColors.accent
                                          .withOpacity(0.08 * _pulseAnim.value),
                                      blurRadius: 100 * _pulseAnim.value,
                                      spreadRadius: 30 * _pulseAnim.value,
                                    ),
                                  ],
                                ),
                                child: child,
                              );
                            },
                            child: Image.asset(
                              'assets/images/logo.png',
                              width: 140,
                              height: 140,
                              fit: BoxFit.contain,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 28),
                  // Brand name
                  ShaderMask(
                    shaderCallback: (bounds) => const LinearGradient(
                      colors: [AppColors.primary, AppColors.accent],
                    ).createShader(bounds),
                    child: Text(
                      'Stuff X Billal VPN',
                      style: Theme.of(context).textTheme.displayLarge?.copyWith(
                        color: Colors.white,
                        letterSpacing: 2,
                        fontWeight: FontWeight.w800,
                        fontSize: 26,
                      ),
                    ),
                  )
                      .animate()
                      .fadeIn(delay: 400.ms, duration: 600.ms)
                      .then()
                      .shimmer(
                        duration: 1500.ms,
                        color: AppColors.accent.withOpacity(0.3),
                      ),
                  const SizedBox(height: 10),
                  // Tagline
                  Text(
                    'Sécurisé  •  Rapide  •  Illimité',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      letterSpacing: 3,
                      color: AppColors.textMuted,
                      fontSize: 13,
                    ),
                  )
                      .animate()
                      .fadeIn(delay: 700.ms, duration: 500.ms)
                      .then()
                      .shimmer(
                        duration: 1500.ms,
                        color: AppColors.primary.withOpacity(0.3),
                      ),

                  const Spacer(flex: 2),

                  if (_isCheckingAuth)
                    SizedBox(
                      width: 28,
                      height: 28,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation(
                          AppColors.accent.withOpacity(0.6),
                        ),
                      ),
                    ).animate().fadeIn(duration: 400.ms),

                  if (_showLanding) ...[
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 40),
                      child: GradientButton(
                        text: 'Commencer',
                        onPressed: () => context.go('/auth/login'),
                      ),
                    ).animate().fadeIn(duration: 600.ms).slideY(begin: 0.2, end: 0),
                    const SizedBox(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                          'Déjà un compte? ',
                          style: TextStyle(color: AppColors.textMuted, fontSize: 14),
                        ),
                        GestureDetector(
                          onTap: () => context.go('/auth/login'),
                          child: const Text(
                            'Se connecter',
                            style: TextStyle(
                              color: AppColors.accent,
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ],
                    ).animate().fadeIn(delay: 200.ms),
                  ],
                  const SizedBox(height: 48),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Particle {
  final double x;
  final double y;
  final double size;
  final double speed;
  final double opacity;

  const _Particle({
    required this.x,
    required this.y,
    required this.size,
    required this.speed,
    required this.opacity,
  });
}

class _ParticlePainter extends CustomPainter {
  final List<_Particle> particles;
  final double progress;

  _ParticlePainter({required this.particles, required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    for (final p in particles) {
      final y = (p.y + progress * p.speed) % 1.0;
      final x = p.x;
      final opacity = p.opacity * (1 - (y - 0.5).abs() * 1.5).clamp(0, 1);
      canvas.drawCircle(
        Offset(x * size.width, y * size.height),
        p.size,
        Paint()
          ..color = AppColors.accent.withOpacity(opacity * 0.3)
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 2),
      );
    }
  }

  @override
  bool shouldRepaint(covariant _ParticlePainter old) => old.progress != progress;
}