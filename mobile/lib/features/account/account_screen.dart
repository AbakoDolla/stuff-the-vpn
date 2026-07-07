import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/widgets.dart';
import '../../services/services.dart';
import '../../models/models.dart';

/// SXB VPN Account Screen
/// User profile and account information
class AccountScreen extends StatefulWidget {
  const AccountScreen({super.key});

  @override
  State<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends State<AccountScreen> {
  User? _user;
  Device? _device;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    
    try {
      final user = await StorageService.instance.getUser();
      final device = await StorageService.instance.getDevice();
      
      setState(() {
        _user = user;
        _device = device;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.screenPaddingHorizontal,
          vertical: AppSpacing.screenPaddingVertical,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: AppSpacing.lg),
            
            // Header
            Text(
              'Mon Compte',
              style: AppTypography.headlineMedium.copyWith(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w700,
              ),
            ),
            
            const SizedBox(height: AppSpacing.xxl),
            
            // Profile Card
            SxbCard(
              child: Column(
                children: [
                  Row(
                    children: [
                      Container(
                        width: 64,
                        height: 64,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: AppColors.primaryGradient,
                        ),
                        child: Center(
                          child: Text(
                            _getInitials(),
                            style: AppTypography.titleLarge.copyWith(
                              color: AppColors.textPrimary,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: AppSpacing.lg),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _user?.name ?? _user?.email ?? 'Utilisateur',
                              style: AppTypography.titleLarge.copyWith(
                                color: AppColors.textPrimary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            if (_user?.email != null) ...[
                              const SizedBox(height: AppSpacing.xs),
                              Text(
                                _user!.email!,
                                style: AppTypography.bodySmall.copyWith(
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                            const SizedBox(height: AppSpacing.sm),
                            StatusBadge(
                              label: _user?.status ?? 'ACTIVE',
                              color: _user?.isActive == true
                                  ? AppColors.success
                                  : AppColors.error,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: AppSpacing.lg),
            
            // Account Details
            Text(
              'Détails du compte',
              style: AppTypography.titleSmall.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
            
            const SizedBox(height: AppSpacing.md),
            
            SxbCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  _buildDetailItem(
                    'Appareil enregistré',
                    _device?.deviceName ?? _device?.model ?? 'Mobile Device',
                    Icons.smartphone_outlined,
                  ),
                  _buildDivider(),
                  _buildDetailItem(
                    'Date d\'expiration',
                    _user?.expiresAt != null
                        ? _formatDate(_user!.expiresAt!)
                        : 'Non défini',
                    Icons.calendar_today_outlined,
                  ),
                  _buildDivider(),
                  _buildDetailItem(
                    'Quota total',
                    _user?.quotaTotalGB != null
                        ? '${_user!.quotaTotalGB} GB'
                        : 'Non défini',
                    Icons.data_usage_outlined,
                  ),
                  _buildDivider(),
                  _buildDetailItem(
                    'Quota utilisé',
                    _user?.quotaUsedGB != null
                        ? '${_user!.quotaUsedGB} GB'
                        : 'Non défini',
                    Icons.download_outlined,
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: AppSpacing.lg),
            
            // Device Info
            Text(
              'Informations appareil',
              style: AppTypography.titleSmall.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
            
            const SizedBox(height: AppSpacing.md),
            
            SxbCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  _buildDetailItem(
                    'Marque',
                    _device?.brand ?? 'Inconnu',
                    Icons.business_outlined,
                  ),
                  _buildDivider(),
                  _buildDetailItem(
                    'Modèle',
                    _device?.model ?? 'Inconnu',
                    Icons.devices_outlined,
                  ),
                  _buildDivider(),
                  _buildDetailItem(
                    'Version OS',
                    _device?.osVersion ?? 'Inconnu',
                    Icons.system_update_outlined,
                  ),
                  _buildDivider(),
                  _buildDetailItem(
                    'Version App',
                    _device?.appVersion ?? '1.0.0',
                    Icons.apps_outlined,
                  ),
                  _buildDivider(),
                  _buildDetailItem(
                    'Connexions',
                    '${_device?.connectionCount ?? 0}',
                    Icons.sync_outlined,
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: AppSpacing.xxl),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailItem(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.md,
      ),
      child: Row(
        children: [
          Icon(
            icon,
            color: AppColors.textTertiary,
            size: AppSpacing.iconMd,
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Text(
              label,
              style: AppTypography.bodyMedium.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ),
          Text(
            value,
            style: AppTypography.bodyMedium.copyWith(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDivider() {
    return Divider(
      height: 1,
      indent: AppSpacing.lg + AppSpacing.md + AppSpacing.iconMd,
      color: AppColors.divider.withValues(alpha: 0.5),
    );
  }

  String _getInitials() {
    final name = _user?.name ?? _user?.email ?? 'U';
    final parts = name.split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
  }
}
