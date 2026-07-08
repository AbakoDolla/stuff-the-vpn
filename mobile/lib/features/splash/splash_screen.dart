import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../services/services.dart';
import '../activation/activation_screen.dart';
import '../home/home_screen.dart';

/// SXB VPN Splash Screen
/// Animated splash screen with integrity checks
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late AnimationController _logoController;
  late AnimationController _textController;
  late Animation<double> _logoScaleAnimation;
  late Animation<double> _logoOpacityAnimation;
  late Animation<double> _textOpacityAnimation;
  late Animation<Offset> _textSlideAnimation;

  String _statusText = 'Initialisation...';
  double _progress = 0.0;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _setupAnimations();
    _initialize();
  }

  void _setupAnimations() {
    _logoController = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    );

    _textController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );

    _logoScaleAnimation = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(begin: 0.5, end: 1.1)
            .chain(CurveTween(curve: Curves.easeOut)),
        weight: 60,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.1, end: 1.0)
            .chain(CurveTween(curve: Curves.easeInOut)),
        weight: 40,
      ),
    ]).animate(_logoController);

    _logoOpacityAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _logoController,
        curve: const Interval(0.0, 0.5, curve: Curves.easeIn),
      ),
    );

    _textOpacityAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _textController, curve: Curves.easeIn),
    );

    _textSlideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(parent: _textController, curve: Curves.easeOut),
    );
  }

  Future<void> _initialize() async {
    try {
      // Lock orientation to portrait
      await SystemChrome.setPreferredOrientations([
        DeviceOrientation.portraitUp,
        DeviceOrientation.portraitDown,
      ]);

      // Set status bar style
      SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
      ));

      // Start animations
      _logoController.forward();

      // Simulate initialization steps
      await _checkIntegrity();
      await _checkDevice();
      await _checkSession();
      await _loadData();

      // Show text
      _textController.forward();

      // Navigate to appropriate screen
      await _navigateToNextScreen();
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
        });
      }
    }
  }

  Future<void> _checkIntegrity() async {
    _updateStatus('Vérification de l\'intégrité...', 0.15);
    await Future.delayed(const Duration(milliseconds: 400));
  }

  Future<void> _checkDevice() async {
    _updateStatus('Vérification de l\'appareil...', 0.35);
    await Future.delayed(const Duration(milliseconds: 300));
  }

  Future<void> _checkSession() async {
    _updateStatus('Vérification de la session...', 0.55);

    try {
      // Check if device is already authorized
      final deviceId = await StorageService.instance.getDeviceId();
      final deviceToken = await StorageService.instance.getDeviceToken();

      if (deviceId != null && deviceToken != null) {
        // Device is registered, check authorization
        try {
          final device = await ApiService.instance.checkDeviceAuthorization(deviceId);
          if (device != null && device.isActive) {
            await StorageService.instance.saveDevice(device);
            ApiService.instance.setAuthToken(deviceToken);
          }
        } catch (e) {
          // Continue with stored data
        }
      }
    } catch (e) {
      // Continue without session check
    }
  }

  Future<void> _loadData() async {
    _updateStatus('Chargement des données...', 0.75);
    await Future.delayed(const Duration(milliseconds: 300));

    // Load cached data if available
    try {
      await StorageService.instance.getUser();
      await StorageService.instance.getQuota();
      await StorageService.instance.getVpnConfig();
    } catch (e) {
      // Continue without cached data
    }
  }

  void _updateStatus(String text, double progress) {
    if (mounted) {
      setState(() {
        _statusText = text;
        _progress = progress;
      });
    }
  }

  Future<void> _navigateToNextScreen() async {
    _updateStatus('Prêt!', 1.0);
    await Future.delayed(const Duration(milliseconds: 300));

    if (!mounted) return;

    // Check if device is authorized
    try {
      final deviceId = await StorageService.instance.getDeviceId();
      final deviceToken = await StorageService.instance.getDeviceToken();

      if (deviceId != null && deviceToken != null) {
        final device = await StorageService.instance.getDevice();
        if (device != null && device.isActive) {
          // Device is authorized, go to home
          if (!mounted) return;
          Navigator.of(context).pushReplacement(
            PageRouteBuilder(
              pageBuilder: (context, animation, secondaryAnimation) =>
                  const HomeScreen(),
              transitionsBuilder: (context, animation, secondaryAnimation, child) {
                return FadeTransition(opacity: animation, child: child);
              },
              transitionDuration: const Duration(milliseconds: 500),
            ),
          );
          return;
        }
      }
    } catch (e) {
      // Continue to activation
    }

    // Device not authorized, go to activation
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) =>
            const ActivationScreen(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(opacity: animation, child: child);
        },
        transitionDuration: const Duration(milliseconds: 500),
      ),
    );
  }

  @override
  void dispose() {
    _logoController.dispose();
    _textController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: AppColors.backgroundGradient,
        ),
        child: SafeArea(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(flex: 2),

              // Logo
              AnimatedBuilder(
                animation: _logoController,
                builder: (context, child) {
                  return Transform.scale(
                    scale: _logoScaleAnimation.value,
                    child: Opacity(
                      opacity: _logoOpacityAnimation.value,
                      child: child,
                    ),
                  );
                },
                child: Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withOpacity(0.4),
                        blurRadius: 40,
                        spreadRadius: 10,
                      ),
                    ],
                  ),
                  child: ClipOval(
                    child: Image.asset(
                      'assets/images/logo.png',
                      fit: BoxFit.cover,
                      width: 120,
                      height: 120,
                      errorBuilder: (context, error, stackTrace) {
                        return const Center(
                          child: Icon(
                            Icons.shield_outlined,
                            size: 60,
                            color: AppColors.primary,
                          ),
                        );
                      },
                    ),
                  ),
                ),
              ),

              const SizedBox(height: AppSpacing.xl),

              // App Name
              SlideTransition(
                position: _textSlideAnimation,
                child: FadeTransition(
                  opacity: _textOpacityAnimation,
                  child: Column(
                    children: [
                      Text(
                        'SXB VPN',
                        style: AppTypography.displayMedium.copyWith(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 2,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Text(
                        'Connexion sécurisée',
                        style: AppTypography.bodyMedium.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const Spacer(flex: 2),

              // Progress indicator
              FadeTransition(
                opacity: _textOpacityAnimation,
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.giant,
                  ),
                  child: Column(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
                        child: TweenAnimationBuilder<double>(
                          tween: Tween(begin: 0, end: _progress),
                          duration: const Duration(milliseconds: 300),
                          builder: (context, value, child) {
                            return LinearProgressIndicator(
                              value: value,
                              minHeight: 4,
                              backgroundColor: AppColors.border,
                              valueColor: const AlwaysStoppedAnimation(
                                AppColors.primary,
                              ),
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      Text(
                        _statusText,
                        style: AppTypography.caption.copyWith(
                          color: AppColors.textTertiary,
                        ),
                      ),
                      if (_errorMessage != null) ...[
                        const SizedBox(height: AppSpacing.md),
                        Text(
                          _errorMessage!,
                          style: AppTypography.caption.copyWith(
                            color: AppColors.error,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ],
                  ),
                ),
              ),

              const SizedBox(height: AppSpacing.giant),
            ],
          ),
        ),
      ),
    );
  }
}
