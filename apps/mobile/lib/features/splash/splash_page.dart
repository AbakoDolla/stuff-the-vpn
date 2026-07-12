import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/app_colors.dart';
import '../../providers/activation_provider.dart';

class SplashPage extends ConsumerStatefulWidget {
  const SplashPage({super.key});

  @override
  ConsumerState<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends ConsumerState<SplashPage>
    with TickerProviderStateMixin {
  // Phase 0 : intro studio "StuffxBilal"
  bool _showStudioIntro = true;

  late AnimationController _pulseCtrl;
  late AnimationController _particleCtrl;
  late AnimationController _logoEnterCtrl;
  late Animation<double> _pulseAnim;
  late Animation<double> _logoScale;
  late Animation<double> _logoOpacity;
  final List<_Particle> _particles = [];
  final Random _random = Random();
  bool _navigationTriggered = false;
  Timer? _studioTimer;

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
    );
    _logoScale = Tween<double>(begin: 0.5, end: 1.0).animate(
      CurvedAnimation(parent: _logoEnterCtrl, curve: Curves.elasticOut),
    );
    _logoOpacity = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _logoEnterCtrl, curve: Curves.easeOut),
    );

    _initParticles();

    // Intro studio "StuffxBilal" affichée ~1.6s avant de révéler le logo SxBVPN
    _studioTimer = Timer(const Duration(milliseconds: 1600), () {
      if (!mounted) return;
      setState(() => _showStudioIntro = false);
      _logoEnterCtrl.forward();
    });
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

  void _navigate(ActivationState activation) {
    if (_navigationTriggered) return;
    _navigationTriggered = true;
    if (activation.isActivated) {
      context.go('/home');
    } else {
      context.go('/activation');
    }
  }

  @override
  void dispose() {
    _studioTimer?.cancel();
    _pulseCtrl.dispose();
    _particleCtrl.dispose();
    _logoEnterCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Écoute l'état d'activation — une fois vérifié, redirige (seulement
    // après la fin de l'intro studio, pour ne jamais la couper court)
    ref.listen<AsyncValue<ActivationState>>(activationProvider,
        (previous, next) {
      next.whenData((activation) {
        if (!activation.isChecking && mounted) {
          Future.delayed(const Duration(milliseconds: 800), () {
            if (mounted && !_showStudioIntro) _navigate(activation);
          });
        }
      });
    });

    final activationAsync = ref.watch(activationProvider);
    activationAsync.whenData((activation) {
      if (!activation.isChecking && !_navigationTriggered && !_showStudioIntro) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            Future.delayed(const Duration(milliseconds: 800), () {
              if (mounted) _navigate(activation);
            });
          }
        });
      }
    });

    return Scaffold(
      backgroundColor: AppColors.background,
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 500),
        switchInCurve: Curves.easeOut,
        switchOutCurve: Curves.easeIn,
        child: _showStudioIntro ? _buildStudioIntro() : _buildMainSplash(),
      ),
    );
  }

  // ── Phase 0 : intro studio "StuffxBilal" ──────────────────────────────────
  Widget _buildStudioIntro() {
    return Container(
      key: const ValueKey('studio-intro'),
      decoration: const BoxDecoration(gradient: AppColors.gradientDark),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            RichText(
              text: TextSpan(
                style: const TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.5,
                ),
                children: [
                  TextSpan(
                    text: 'Stuff',
                    style: TextStyle(color: AppColors.textPrimary),
                  ),
                  TextSpan(
                    text: 'x',
                    style: TextStyle(
                      color: AppColors.accent,
                      fontWeight: FontWeight.w300,
                    ),
                  ),
                  TextSpan(
                    text: 'Bilal',
                    style: TextStyle(
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
            )
                .animate()
                .fadeIn(duration: 550.ms, curve: Curves.easeOut)
                .scale(
                  begin: const Offset(0.85, 0.85),
                  end: const Offset(1, 1),
                  duration: 550.ms,
                  curve: Curves.easeOutBack,
                )
                .then(delay: 500.ms)
                .fadeOut(duration: 400.ms),
            const SizedBox(height: 10),
            Text(
              'PRÉSENTE',
              style: TextStyle(
                fontSize: 11,
                letterSpacing: 4,
                fontWeight: FontWeight.w500,
                color: AppColors.textMuted,
              ),
            )
                .animate()
                .fadeIn(delay: 200.ms, duration: 450.ms)
                .then(delay: 350.ms)
                .fadeOut(duration: 400.ms),
          ],
        ),
      ),
    );
  }

  // ── Phase 1 : splash principal SxBVPN (logo + particules + halo) ─────────
  Widget _buildMainSplash() {
    return Container(
      key: const ValueKey('main-splash'),
      decoration: const BoxDecoration(gradient: AppColors.gradientDark),
      child: Stack(
        children: [
          AnimatedBuilder(
            animation: _particleCtrl,
            builder: (context, _) => CustomPaint(
              size: Size.infinite,
              painter: _ParticlePainter(
                particles: _particles,
                progress: _particleCtrl.value,
              ),
            ),
          ),
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
          SafeArea(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Spacer(flex: 3),
                AnimatedBuilder(
                  animation: _logoEnterCtrl,
                  builder: (context, _) => Opacity(
                    opacity: _logoOpacity.value,
                    child: Transform.scale(
                      scale: _logoScale.value,
                      child: AnimatedBuilder(
                        animation: _pulseAnim,
                        builder: (context, child) => Container(
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
                        ),
                        child: Image.asset(
                          'assets/images/logo.png',
                          width: 130,
                          height: 130,
                          fit: BoxFit.contain,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 28),
                ShaderMask(
                  shaderCallback: (bounds) => const LinearGradient(
                    colors: [AppColors.primary, AppColors.accent],
                  ).createShader(bounds),
                  child: const Text(
                    'SxBVPN',
                    style: TextStyle(
                      color: Colors.white,
                      letterSpacing: 3,
                      fontWeight: FontWeight.w800,
                      fontSize: 28,
                    ),
                  ),
                )
                    .animate()
                    .fadeIn(delay: 300.ms, duration: 600.ms)
                    .then()
                    .shimmer(
                      duration: 1500.ms,
                      color: AppColors.accent.withOpacity(0.3),
                    ),
                const SizedBox(height: 10),
                const Text(
                  'Sécurisée  ·  Rapide  ·  Fiable',
                  style: TextStyle(
                    letterSpacing: 2,
                    color: AppColors.textMuted,
                    fontSize: 13,
                  ),
                ).animate().fadeIn(delay: 600.ms, duration: 500.ms),
                const Spacer(flex: 2),
                SizedBox(
                  width: 28,
                  height: 28,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation(
                      AppColors.accent.withOpacity(0.6),
                    ),
                  ),
                ).animate().fadeIn(delay: 200.ms, duration: 400.ms),
                const SizedBox(height: 48),
              ],
            ),
          ),
        ],
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
      final opacity = p.opacity * (1 - (y - 0.5).abs() * 1.5).clamp(0.0, 1.0);
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
  bool shouldRepaint(covariant _ParticlePainter old) =>
      old.progress != progress;
}
