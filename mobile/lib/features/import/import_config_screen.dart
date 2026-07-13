import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/widgets.dart';
import '../../services/api_service.dart';
import '../../services/storage_service.dart';

/// SXB VPN Import Configuration Screen
/// Screen for importing VPN configuration using SXB token
class ImportConfigScreen extends StatefulWidget {
  const ImportConfigScreen({super.key});

  @override
  State<ImportConfigScreen> createState() => _ImportConfigScreenState();
}

class _ImportConfigScreenState extends State<ImportConfigScreen> {
  final _tokenController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  
  bool _isLoading = false;
  String? _errorMessage;
  String? _successMessage;

  @override
  void dispose() {
    _tokenController.dispose();
    super.dispose();
  }

  String? _validateToken(String? value) {
    if (value == null || value.isEmpty) {
      return 'Veuillez entrer un token';
    }
    
    // Format: SXB-XXXX-XXXX-XXXX
    final regex = RegExp(r'^SXB-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$', caseSensitive: false);
    if (!regex.hasMatch(value.toUpperCase())) {
      return 'Format invalide. Exemple: SXB-A82F-92KD-73LM';
    }
    
    return null;
  }

  Future<void> _importConfig() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _successMessage = null;
    });

    try {
      final deviceId = await StorageService.instance.getOrCreateDeviceId();
      
      // Get device info
      final deviceInfo = await StorageService.instance.getDeviceInfo();
      
      final response = await ApiService.instance.importSxbToken(
        token: _tokenController.text.toUpperCase().trim(),
        deviceId: deviceId,
        deviceName: deviceInfo['deviceName'],
        deviceBrand: deviceInfo['brand'],
        deviceModel: deviceInfo['model'],
        osVersion: deviceInfo['osVersion'],
      );

      if (response['success'] == true) {
        final configData = response['data'];
        
        // Store the configuration securely
        await StorageService.instance.saveVpnConfig({
          'token': configData['token'],
          'protocol': configData['protocol'],
          'remark': configData['remark'],
          'quotaMB': configData['quotaMB'] ?? 0,
          'quotaUsedMB': configData['quotaUsedMB'] ?? 0,
          'expiresAt': configData['expiresAt']?.toString(),
          'config': configData['config'],
        });

        setState(() {
          _successMessage = 'Configuration importée avec succès!';
        });

        // Wait a moment to show success message
        await Future.delayed(const Duration(seconds: 1));
        
        if (mounted) {
          Navigator.of(context).pop(true);
        }
      } else {
        setState(() {
          _errorMessage = response['message'] ?? 'Erreur lors de l\'import';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = _parseError(e.toString());
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  String _parseError(String error) {
    if (error.contains('404') || error.contains('not found')) {
      return 'Token invalide ou non trouvé';
    }
    if (error.contains('403') || error.contains('forbidden')) {
      return 'Token expiré ou révoqué';
    }
    if (error.contains('429')) {
      return 'Trop de tentatives. Veuillez patienter';
    }
    if (error.contains('network') || error.contains('connection')) {
      return 'Erreur de connexion. Vérifiez votre internet';
    }
    return 'Erreur: ${error.length > 50 ? '${error.substring(0, 50)}...' : error}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppColors.backgroundGradient,
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.all(AppSpacing.lg),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(
                        Icons.arrow_back_ios,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: Text(
                        'Importer Configuration',
                        style: AppTypography.titleLarge.copyWith(
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Icon
                        Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            color: AppColors.primary.withOpacity(0.1),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.vpn_key_outlined,
                            size: 40,
                            color: AppColors.primary,
                          ),
                        ),
                        
                        const SizedBox(height: AppSpacing.xl),
                        
                        // Title
                        Text(
                          'Entrez votre token SXB',
                          style: AppTypography.titleMedium.copyWith(
                            color: AppColors.textPrimary,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        
                        const SizedBox(height: AppSpacing.sm),
                        
                        // Subtitle
                        Text(
                          'Le format doit être: SXB-XXXX-XXXX-XXXX',
                          style: AppTypography.bodySmall.copyWith(
                            color: AppColors.textTertiary,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        
                        const SizedBox(height: AppSpacing.xxl),
                        
                        // Token Input
                        Container(
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                            border: Border.all(
                              color: _errorMessage != null
                                  ? AppColors.error.withOpacity(0.5)
                                  : AppColors.border,
                            ),
                          ),
                          child: TextFormField(
                            controller: _tokenController,
                            validator: _validateToken,
                            textCapitalization: TextCapitalization.characters,
                            style: AppTypography.bodyLarge.copyWith(
                              color: AppColors.textPrimary,
                              letterSpacing: 2,
                              fontFamily: 'monospace',
                            ),
                            decoration: InputDecoration(
                              hintText: 'SXB-XXXX-XXXX-XXXX',
                              hintStyle: AppTypography.bodyLarge.copyWith(
                                color: AppColors.textTertiary.withOpacity(0.5),
                                letterSpacing: 2,
                              ),
                              prefixIcon: const Icon(
                                Icons.vpn_key,
                                color: AppColors.primary,
                              ),
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: AppSpacing.md,
                                vertical: AppSpacing.lg,
                              ),
                            ),
                            inputFormatters: [
                              FilteringTextInputFormatter.allow(RegExp(r'[A-Za-z0-9\-]')),
                              LengthLimitingTextInputFormatter(16),
                              _TokenFormatter(),
                            ],
                          ),
                        ),
                        
                        // Error message
                        if (_errorMessage != null) ...[
                          const SizedBox(height: AppSpacing.md),
                          Container(
                            padding: const EdgeInsets.all(AppSpacing.md),
                            decoration: BoxDecoration(
                              color: AppColors.error.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                              border: Border.all(
                                color: AppColors.error.withOpacity(0.3),
                              ),
                            ),
                            child: Row(
                              children: [
                                const Icon(
                                  Icons.error_outline,
                                  color: AppColors.error,
                                  size: 20,
                                ),
                                const SizedBox(width: AppSpacing.sm),
                                Expanded(
                                  child: Text(
                                    _errorMessage!,
                                    style: AppTypography.bodySmall.copyWith(
                                      color: AppColors.error,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                        
                        // Success message
                        if (_successMessage != null) ...[
                          const SizedBox(height: AppSpacing.md),
                          Container(
                            padding: const EdgeInsets.all(AppSpacing.md),
                            decoration: BoxDecoration(
                              color: AppColors.success.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                              border: Border.all(
                                color: AppColors.success.withOpacity(0.3),
                              ),
                            ),
                            child: Row(
                              children: [
                                const Icon(
                                  Icons.check_circle_outline,
                                  color: AppColors.success,
                                  size: 20,
                                ),
                                const SizedBox(width: AppSpacing.sm),
                                Expanded(
                                  child: Text(
                                    _successMessage!,
                                    style: AppTypography.bodySmall.copyWith(
                                      color: AppColors.success,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                        
                        const SizedBox(height: AppSpacing.xxl),
                        
                        // Import Button
                        SxbButton(
                          text: _isLoading ? 'Importation...' : 'Importer',
                          onPressed: _isLoading ? null : _importConfig,
                          isLoading: _isLoading,
                          icon: Icons.download,
                        ),
                        
                        const SizedBox(height: AppSpacing.xl),
                        
                        // Info Card
                        Container(
                          padding: const EdgeInsets.all(AppSpacing.md),
                          decoration: BoxDecoration(
                            color: AppColors.surface.withOpacity(0.5),
                            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Icon(
                                    Icons.info_outline,
                                    color: AppColors.primary,
                                    size: 20,
                                  ),
                                  const SizedBox(width: AppSpacing.sm),
                                  Text(
                                    'Comment obtenir un token?',
                                    style: AppTypography.bodyMedium.copyWith(
                                      color: AppColors.textPrimary,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: AppSpacing.md),
                              Text(
                                '1. Obtenez un token SXB depuis le site officiel\n'
                                '2. Le format est toujours SXB-XXXX-XXXX-XXXX\n'
                                '3. Chaque token ne peut être utilisé que sur un nombre limité d\'appareils',
                                style: AppTypography.bodySmall.copyWith(
                                  color: AppColors.textSecondary,
                                  height: 1.6,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Custom formatter to auto-add dashes in token format
class _TokenFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final text = newValue.text.toUpperCase().replaceAll(RegExp(r'[^A-Z0-9]'), '');
    
    if (text.length <= 4) {
      return TextEditingValue(
        text: text,
        selection: TextSelection.collapsed(offset: text.length),
      );
    }
    
    if (text.length <= 8) {
      return TextEditingValue(
        text: 'SXB-${text.substring(4)}',
        selection: TextSelection.collapsed(offset: 4 + (text.length - 4)),
      );
    }
    
    if (text.length <= 12) {
      return TextEditingValue(
        text: 'SXB-${text.substring(4, 8)}-${text.substring(8)}',
        selection: TextSelection.collapsed(offset: 9 + (text.length - 8)),
      );
    }
    
    // Limit to 12 characters (SXB-XXXX-XXXX-XXXX = 16 total)
    final limited = text.length > 12 ? text.substring(0, 12) : text;
    return TextEditingValue(
      text: 'SXB-${limited.substring(4, 8)}-${limited.substring(8)}',
      selection: TextSelection.collapsed(offset: 17),
    );
  }
}
