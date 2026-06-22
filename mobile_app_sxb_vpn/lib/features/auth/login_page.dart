import 'dart:ui';

  import 'package:flutter/material.dart';
  import 'package:flutter_animate/flutter_animate.dart';
  import 'package:flutter_riverpod/flutter_riverpod.dart';
  import 'package:gap/gap.dart';
  import 'package:go_router/go_router.dart';
  import 'package:flutter/services.dart';
  import 'package:uuid/uuid.dart';

  import '../../core/app_colors.dart';
  import '../../core/app_form.dart';
  import '../../core/storage/secure_storage.dart';
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
    final _tokenController = TextEditingController();
    final _phoneController = TextEditingController();
    final _deviceIdController = TextEditingController();
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

      _loadPersistentDeviceId();
    }

    /// Load or generate a stable device ID that persists across app restarts.
    /// Uses flutter_secure_storage so the ID survives app reinstalls on most devices.
    Future<void> _loadPersistentDeviceId() async {
      final storage = ref.read(secureStorageProvider);
      var id = await storage.getDeviceId();
      if (id == null || id.isEmpty) {
        id = 'ANDROID_${const Uuid().v4().replaceAll('-', '').toUpperCase()}';
        await storage.saveDeviceId(id);
      }
      if (mounted) {
        setState(() => _deviceIdController.text = id!);
      }
    }

    @override
    void dispose() {
      _tokenController.dispose();
      _phoneController.dispose();
      _deviceIdController.dispose();
      _fadeCtrl.dispose();
      super.dispose();
    }

    Future<void> _submit() async {
      if (_formKey.currentState?.validate() ?? false) {
        await ref.read(authStateProvider.notifier).loginWithLicense(
          token: _tokenController.text.trim(),
          phone: _phoneController.text.trim(),
          deviceId: _deviceIdController.text.trim(),
          deviceName: 'SXB VPN Android',
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
                content: Text(error.toString().replaceFirst('Exception: ', '')),
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

      final isLoading = ref.watch(authStateProvider).isLoading;

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
                            const SizedBox(height: 40),
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
                            Text(
                              'Connexion VPN',
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
                              'Entrez votre token de licence',
                              style: Theme.of(context)
                                  .textTheme
                                  .bodyMedium
                                  ?.copyWith(
                                    color: AppColors.textMuted,
                                    fontSize: 15,
                                  ),
                            ),
                            const SizedBox(height: 40),
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
                                  filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
                                  child: Container(
                                    padding: const EdgeInsets.all(4),
                                    decoration: BoxDecoration(
                                      gradient: LinearGradient(
                                        begin: Alignment.topLeft,
                                        end: Alignment.bottomRight,
                                        colors: [
                                          AppColors.surfaceLight.withOpacity(0.5),
                                          AppColors.surface.withOpacity(0.35),
                                        ],
                                      ),
                                      borderRadius: BorderRadius.circular(23),
                                    ),
                                    child: Column(
                                      children: [
                                        PremiumTextField(
                                          hint: 'Token de licence (SXB-XXXX)',
                                          controller: _tokenController,
                                          validator: (value) {
                                            if (value == null || value.isEmpty) {
                                              return 'Token requis';
                                            }
                                            if (!value.startsWith('SXB-')) {
                                              return 'Le token doit commencer par SXB-';
                                            }
                                            return null;
                                          },
                                          textInputAction: TextInputAction.next,
                                          prefixIcon: Icons.vpn_key_rounded,
                                        ),
                                        const SizedBox(height: 20),
                                        PremiumTextField(
                                          hint: 'Numéro de téléphone',
                                          controller: _phoneController,
                                          validator: (value) {
                                            if (value == null || value.isEmpty) {
                                              return 'Numéro de téléphone requis';
                                            }
                                            return null;
                                          },
                                          keyboardType: TextInputType.phone,
                                          textInputAction: TextInputAction.done,
                                          prefixIcon: Icons.phone_android_rounded,
                                        ),
                                        const SizedBox(height: 20),
                                        PremiumTextField(
                                          hint: 'ID de l\'appareil',
                                          controller: _deviceIdController,
                                          enabled: false,
                                          prefixIcon: Icons.devices_rounded,
                                          suffix: IconButton(
                                            icon: const Icon(Icons.copy_rounded,
                                                color: AppColors.textMuted, size: 18),
                                            onPressed: () {
                                              Clipboard.setData(ClipboardData(
                                                  text: _deviceIdController.text));
                                              ScaffoldMessenger.of(context).showSnackBar(
                                                const SnackBar(
                                                  content: Text('ID copié'),
                                                  duration: Duration(seconds: 1),
                                                ),
                                              );
                                            },
                                          ),
                                        ),
                                        const SizedBox(height: 24),
                                        GradientButton(
                                          text: 'Se connecter',
                                          isLoading: isLoading,
                                          onPressed: isLoading ? null : _submit,
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 32),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  "Vous n\'avez pas de token? ",
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodyMedium
                                      ?.copyWith(
                                        color: AppColors.textMuted,
                                        fontSize: 14,
                                      ),
                                ),
                                GestureDetector(
                                  onTap: () => context.go('/auth/register'),
                                  child: ShaderMask(
                                    shaderCallback: (bounds) =>
                                        const LinearGradient(
                                      colors: [
                                        AppColors.primary,
                                        AppColors.accent,
                                      ],
                                    ).createShader(bounds),
                                    child: const Text(
                                      "Contacter l\'admin",
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
                            const Gap(32),
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
  