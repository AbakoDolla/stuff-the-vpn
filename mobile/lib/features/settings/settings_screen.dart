import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/widgets.dart';
import '../../services/services.dart';
import '../splash/splash_screen.dart';

/// SXB VPN Settings Screen
/// App settings and preferences
class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  String _language = 'fr';
  String _theme = 'dark';
  bool _notificationsEnabled = true;
  bool _autoSyncEnabled = true;
  bool _autoLaunchEnabled = false;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final storage = StorageService.instance;
    
    final language = await storage.getLanguage();
    final theme = await storage.getTheme();
    final notifications = await storage.getNotificationsEnabled();
    final autoSync = await storage.getAutoSyncEnabled();
    final autoLaunch = await storage.getAutoLaunchEnabled();

    setState(() {
      _language = language;
      _theme = theme;
      _notificationsEnabled = notifications;
      _autoSyncEnabled = autoSync;
      _autoLaunchEnabled = autoLaunch;
      _isLoading = false;
    });
  }

  Future<void> _saveLanguage(String language) async {
    await StorageService.instance.saveLanguage(language);
    setState(() => _language = language);
  }

  Future<void> _saveNotifications(bool enabled) async {
    await StorageService.instance.saveNotificationsEnabled(enabled);
    setState(() => _notificationsEnabled = enabled);
  }

  Future<void> _saveAutoSync(bool enabled) async {
    await StorageService.instance.saveAutoSyncEnabled(enabled);
    setState(() => _autoSyncEnabled = enabled);
  }

  Future<void> _saveAutoLaunch(bool enabled) async {
    await StorageService.instance.saveAutoLaunchEnabled(enabled);
    setState(() => _autoLaunchEnabled = enabled);
  }

  Future<void> _logout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        ),
        title: Text(
          'Déconnexion',
          style: AppTypography.titleLarge.copyWith(
            color: AppColors.textPrimary,
          ),
        ),
        content: Text(
          'Êtes-vous sûr de vouloir vous déconnecter ?',
          style: AppTypography.bodyMedium.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: Text(
              'Annuler',
              style: AppTypography.buttonMedium.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: Text(
              'Déconnexion',
              style: AppTypography.buttonMedium.copyWith(
                color: AppColors.error,
              ),
            ),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await StorageService.instance.clearDeviceData();
      if (mounted) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (context) => const SplashScreen()),
          (route) => false,
        );
      }
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
            
            Text(
              'Paramètres',
              style: AppTypography.headlineMedium.copyWith(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w700,
              ),
            ),
            
            const SizedBox(height: AppSpacing.xxl),
            
            // Language Section
            _buildSectionTitle('Langue'),
            const SizedBox(height: AppSpacing.md),
            SxbCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  _buildLanguageOption('Français', 'fr'),
                  _buildDivider(),
                  _buildLanguageOption('English', 'en'),
                ],
              ),
            ),
            
            const SizedBox(height: AppSpacing.xl),
            
            // Notifications Section
            _buildSectionTitle('Notifications'),
            const SizedBox(height: AppSpacing.md),
            SxbCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  _buildSwitchItem(
                    'Notifications push',
                    'Recevoir des alertes importantes',
                    Icons.notifications_outlined,
                    _notificationsEnabled,
                    _saveNotifications,
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: AppSpacing.xl),
            
            // Sync Section
            _buildSectionTitle('Synchronisation'),
            const SizedBox(height: AppSpacing.md),
            SxbCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  _buildSwitchItem(
                    'Synchronisation automatique',
                    'Synchroniser les données en arrière-plan',
                    Icons.sync_outlined,
                    _autoSyncEnabled,
                    _saveAutoSync,
                  ),
                  _buildDivider(),
                  _buildSwitchItem(
                    'Lancement automatique',
                    'Démarrer avec l\'appareil',
                    Icons.play_circle_outline,
                    _autoLaunchEnabled,
                    _saveAutoLaunch,
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: AppSpacing.xl),
            
            // About Section
            _buildSectionTitle('À propos'),
            const SizedBox(height: AppSpacing.md),
            SxbCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  _buildInfoItem(
                    'Version',
                    '1.0.0',
                    Icons.info_outline,
                  ),
                  _buildDivider(),
                  _buildInfoItem(
                    'Politique de confidentialité',
                    '',
                    Icons.privacy_tip_outlined,
                    onTap: () {},
                  ),
                  _buildDivider(),
                  _buildInfoItem(
                    'Aide',
                    '',
                    Icons.help_outline,
                    onTap: () {},
                  ),
                  _buildDivider(),
                  _buildInfoItem(
                    'Contact',
                    '',
                    Icons.mail_outline,
                    onTap: () {},
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: AppSpacing.xxl),
            
            // Logout Button
            SxbButton(
              text: 'Déconnexion',
              onPressed: _logout,
              isOutlined: true,
              icon: Icons.logout,
              gradient: const LinearGradient(
                colors: [AppColors.error, AppColors.errorDark],
              ),
            ),
            
            const SizedBox(height: AppSpacing.giant),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: AppTypography.titleSmall.copyWith(
        color: AppColors.textSecondary,
      ),
    );
  }

  Widget _buildLanguageOption(String label, String code) {
    final isSelected = _language == code;
    return GestureDetector(
      onTap: () => _saveLanguage(code),
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        child: Row(
          children: [
            Text(
              label,
              style: AppTypography.bodyMedium.copyWith(
                color: AppColors.textPrimary,
              ),
            ),
            const Spacer(),
            if (isSelected)
              const Icon(
                Icons.check_circle,
                color: AppColors.primary,
                size: AppSpacing.iconMd,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildSwitchItem(
    String title,
    String subtitle,
    IconData icon,
    bool value,
    Function(bool) onChanged,
  ) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.sm,
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
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppTypography.bodyMedium.copyWith(
                    color: AppColors.textPrimary,
                  ),
                ),
                Text(
                  subtitle,
                  style: AppTypography.caption.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: AppColors.primary,
          ),
        ],
      ),
    );
  }

  Widget _buildInfoItem(
    String title,
    String value,
    IconData icon, {
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
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
                title,
                style: AppTypography.bodyMedium.copyWith(
                  color: AppColors.textPrimary,
                ),
              ),
            ),
            if (value.isNotEmpty)
              Text(
                value,
                style: AppTypography.bodySmall.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
            if (onTap != null) ...[
              const SizedBox(width: AppSpacing.sm),
              const Icon(
                Icons.chevron_right,
                color: AppColors.textTertiary,
                size: AppSpacing.iconMd,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDivider() {
    return Divider(
      height: 1,
      indent: AppSpacing.lg + AppSpacing.md + AppSpacing.iconMd,
      color: AppColors.divider.withOpacity(0.5),
    );
  }
}
