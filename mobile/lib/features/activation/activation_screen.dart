import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/widgets.dart';
import '../../services/services.dart';
import '../home/home_screen.dart';

/// SXB VPN Activation Screen
/// Device activation with token validation
class ActivationScreen extends StatefulWidget {
  const ActivationScreen({super.key});

  @override
  State<ActivationScreen> createState() => _ActivationScreenState();
}

class _ActivationScreenState extends State<ActivationScreen>
    with SingleTickerProviderStateMixin {
  final _tokenController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  
  bool _isLoading = false;
  String? _error;
  String _deviceId = '';
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _generateDeviceId();
    _setupAnimations();
  }

  void _setupAnimations() {
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _fadeAnimation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeIn,
    );
    _animationController.forward();
  }

  Future<void> _generateDeviceId() async {
    // In a real app, this would be a unique device identifier
    // For now, generate a UUID-like string
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final random = timestamp.toRadixString(16).substring(4, 10);
    setState(() {
      _deviceId = 'DEV-${timestamp.toRadixString(16).toUpperCase().substring(0, 8)}-$random';
    });
  }

  Future<void> _activateDevice() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Get device info
      final deviceName = await _getDeviceName();
      
      // Activate device
      final device = await ApiService.instance.activateDevice(
        deviceId: _deviceId,
        token: _tokenController.text.trim(),
        deviceName: deviceName,
      );

      // Save device data
      await StorageService.instance.saveDeviceId(_deviceId);
      await StorageService.instance.saveDeviceToken(_tokenController.text.trim());
      await StorageService.instance.saveDevice(device);
      
      // Set auth token for future requests
      ApiService.instance.setAuthToken(_tokenController.text.trim());

      if (!mounted) return;

      // Navigate to home
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
    } on ApiException catch (e) {
      setState(() {
        _error = e.message;
      });
    } catch (e) {
      setState(() {
        _error = 'Une erreur est survenue. Veuillez réessayer.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<String> _getDeviceName() async {
    // In a real app, get actual device name
    return 'Mobile Device';
  }

  Future<void> _copyDeviceId() async {
    await Clipboard.setData(ClipboardData(text: _deviceId));
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Device ID copié!',
            style: AppTypography.bodyMedium.copyWith(
              color: AppColors.textPrimary,
            ),
          ),
          backgroundColor: AppColors.surface,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          ),
        ),
      );
    }
  }

  @override
  void dispose() {
    _tokenController.dispose();
    _animationController.dispose();
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
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.screenPaddingHorizontal,
              vertical: AppSpacing.screenPaddingVertical,
            ),
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: Column(
                children: [
                  const SizedBox(height: AppSpacing.giant),
                  
                  // Logo
                  Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: AppColors.primaryGradient,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withOpacity(0.3),
                          blurRadius: 30,
                          spreadRadius: 5,
                        ),
                      ],
                    ),
                    child: const Center(
                      child: Icon(
                        Icons.shield_outlined,
                        size: 50,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: AppSpacing.xl),
                  
                  // Title
                  Text(
                    'Activation de l\'appareil',
                    style: AppTypography.headlineMedium.copyWith(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w700,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  
                  const SizedBox(height: AppSpacing.sm),
                  
                  Text(
                    'Entrez le token d\'activation fourni par l\'administrateur',
                    style: AppTypography.bodyMedium.copyWith(
                      color: AppColors.textSecondary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  
                  const SizedBox(height: AppSpacing.giant),
                  
                  // Device ID Card
                  SxbCard(
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(AppSpacing.sm),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(
                                  AppSpacing.radiusSm,
                                ),
                              ),
                              child: const Icon(
                                Icons.smartphone_outlined,
                                color: AppColors.primary,
                                size: AppSpacing.iconLg,
                              ),
                            ),
                            const SizedBox(width: AppSpacing.md),
                            Text(
                              'ID de l\'appareil',
                              style: AppTypography.titleSmall.copyWith(
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: AppSpacing.md),
                        Row(
                          children: [
                            Expanded(
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: AppSpacing.md,
                                  vertical: AppSpacing.sm,
                                ),
                                decoration: BoxDecoration(
                                  color: AppColors.surface,
                                  borderRadius: BorderRadius.circular(
                                    AppSpacing.radiusSm,
                                  ),
                                  border: Border.all(
                                    color: AppColors.border.withOpacity(0.5),
                                  ),
                                ),
                                child: Text(
                                  _deviceId,
                                  style: AppTypography.bodyMedium.copyWith(
                                    color: AppColors.textPrimary,
                                    fontFamily: 'monospace',
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: AppSpacing.sm),
                            GestureDetector(
                              onTap: _copyDeviceId,
                              child: Container(
                                padding: const EdgeInsets.all(AppSpacing.sm),
                                decoration: BoxDecoration(
                                  color: AppColors.surface,
                                  borderRadius: BorderRadius.circular(
                                    AppSpacing.radiusSm,
                                  ),
                                  border: Border.all(
                                    color: AppColors.border.withOpacity(0.5),
                                  ),
                                ),
                                child: const Icon(
                                  Icons.copy_outlined,
                                  color: AppColors.textSecondary,
                                  size: AppSpacing.iconMd,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: AppSpacing.xl),
                  
                  // Activation Form
                  Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        TextFormField(
                          controller: _tokenController,
                          decoration: InputDecoration(
                            labelText: "Token d'activation",
                            hintText: 'Entrez votre token',
                            prefixIcon: Icon(Icons.vpn_key_outlined),
                          ),
                          enabled: !_isLoading,
                          textInputAction: TextInputAction.done,
                          onFieldSubmitted: (_) => _activateDevice(),
                        ),
                        
                        if (_error != null) ...[
                          const SizedBox(height: AppSpacing.md),
                          Container(
                            padding: const EdgeInsets.all(AppSpacing.md),
                            decoration: BoxDecoration(
                              color: AppColors.error.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(
                                AppSpacing.radiusMd,
                              ),
                              border: Border.all(
                                color: AppColors.error.withOpacity(0.3),
                              ),
                            ),
                            child: Row(
                              children: [
                                const Icon(
                                  Icons.error_outline,
                                  color: AppColors.error,
                                  size: AppSpacing.iconMd,
                                ),
                                const SizedBox(width: AppSpacing.sm),
                                Expanded(
                                  child: Text(
                                    _error!,
                                    style: AppTypography.bodySmall.copyWith(
                                      color: AppColors.error,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: AppSpacing.xxl),
                  
                  // Activate Button
                  SxbButton(
                    text: 'Activer l\'appareil',
                    onPressed: _isLoading ? null : _activateDevice,
                    isLoading: _isLoading,
                    icon: Icons.check_circle_outline,
                  ),
                  
                  const SizedBox(height: AppSpacing.xl),
                  
                  // Help Text
                  Text(
                    'Obtenez votre token d\'activation depuis le panneau d\'administration',
                    style: AppTypography.caption.copyWith(
                      color: AppColors.textTertiary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  
                  const SizedBox(height: AppSpacing.giant),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
