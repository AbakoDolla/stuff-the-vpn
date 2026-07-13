import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widgets/widgets.dart';
import '../../services/services.dart';
import '../../models/models.dart';
import '../account/account_screen.dart';
import '../history/history_screen.dart';
import '../settings/settings_screen.dart';
import '../notifications/notifications_screen.dart';
import '../import/import_config_screen.dart';

/// SXB VPN Home Screen
/// Main dashboard with VPN connection controls
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen>
    with TickerProviderStateMixin {
  int _currentIndex = 0;
  
  // VPN State
  VpnStatus _vpnStatus = VpnStatus.disconnected;
  DateTime? _connectedAt;
  String _publicIp = '--';
  
  // Data
  User? _user;
  Quota? _quota;
  bool _isSyncing = false;
  DateTime? _lastSync;
  
  // Animation
  late AnimationController _connectionAnimationController;

  final List<Widget> _screens = [];

  @override
  void initState() {
    super.initState();
    _connectionAnimationController = AnimationController(
      duration: const Duration(milliseconds: 2000),
      vsync: this,
    );
    _screens.addAll([
      const _HomeContent(),
      const HistoryScreen(),
      const AccountScreen(),
      const SettingsScreen(),
    ]);
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      // Load cached data first
      final cachedUser = await StorageService.instance.getUser();
      final cachedQuota = await StorageService.instance.getQuota();
      final lastSync = await StorageService.instance.getLastSync();
      
      if (mounted) {
        setState(() {
          _user = cachedUser;
          _quota = cachedQuota;
          _lastSync = lastSync;
        });
      }
      
      // Then sync with server
      await _syncData();
    } catch (e) {
      debugPrint('Error loading data: $e');
    }
  }

  Future<void> _syncData() async {
    if (_isSyncing) return;
    
    setState(() {
      _isSyncing = true;
    });

    try {
      final deviceId = await StorageService.instance.getDeviceId();
      if (deviceId == null) return;

      // Sync device
      await ApiService.instance.syncDevice(deviceId);
      
      // Get fresh data
      final user = await ApiService.instance.getUserProfile();
      final quota = await ApiService.instance.getQuota();
      final ip = await ApiService.instance.getPublicIp();
      final lastSync = DateTime.now();

      // Save to storage
      await StorageService.instance.saveUser(user);
      await StorageService.instance.saveQuota(quota);
      await StorageService.instance.saveLastSync(lastSync);

      if (mounted) {
        setState(() {
          _user = user;
          _quota = quota;
          _publicIp = ip;
          _lastSync = lastSync;
          _isSyncing = false;
        });
      }
    } catch (e) {
      debugPrint('Sync error: $e');
      if (mounted) {
        setState(() {
          _isSyncing = false;
        });
      }
    }
  }

  void _toggleVpnConnection() {
    setState(() {
      if (_vpnStatus == VpnStatus.disconnected || 
          _vpnStatus == VpnStatus.error) {
        _connect();
      } else {
        _disconnect();
      }
    });
  }

  Future<void> _connect() async {
    setState(() {
      _vpnStatus = VpnStatus.connecting;
    });

    // Simulate connection delay
    await Future.delayed(const Duration(seconds: 2));
    
    // In a real app, this would establish the actual VPN connection
    // using platform-specific VPN APIs
    
    setState(() {
      _vpnStatus = VpnStatus.connected;
      _connectedAt = DateTime.now();
    });
  }

  Future<void> _disconnect() async {
    setState(() {
      _vpnStatus = VpnStatus.disconnecting;
    });

    // Simulate disconnection
    await Future.delayed(const Duration(seconds: 1));
    
    setState(() {
      _vpnStatus = VpnStatus.disconnected;
      _connectedAt = null;
    });
  }

  @override
  void dispose() {
    _connectionAnimationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppColors.backgroundGradient,
        ),
        child: IndexedStack(
          index: _currentIndex,
          children: _screens,
        ),
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          border: Border(
            top: BorderSide(
              color: AppColors.border.withOpacity(0.5),
              width: 1,
            ),
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.sm,
              vertical: AppSpacing.sm,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildNavItem(0, Icons.home_outlined, Icons.home, 'Accueil'),
                _buildNavItem(1, Icons.history_outlined, Icons.history, 'Historique'),
                _buildNavItem(2, Icons.person_outline, Icons.person, 'Compte'),
                _buildNavItem(3, Icons.settings_outlined, Icons.settings, 'Paramètres'),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon, IconData activeIcon, String label) {
    final isSelected = _currentIndex == index;
    return GestureDetector(
      onTap: () => setState(() => _currentIndex = index),
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm,
        ),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withOpacity(0.15)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isSelected ? activeIcon : icon,
              color: isSelected ? AppColors.primary : AppColors.textTertiary,
              size: AppSpacing.iconLg,
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              label,
              style: AppTypography.labelSmall.copyWith(
                color: isSelected ? AppColors.primary : AppColors.textTertiary,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Home Content Screen
class _HomeContent extends StatefulWidget {
  const _HomeContent();

  @override
  State<_HomeContent> createState() => _HomeContentState();
}

class _HomeContentState extends State<_HomeContent>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.1).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Access parent state through context
    final parentState = context.findAncestorStateOfType<_HomeScreenState>();
    final vpnStatus = parentState?._vpnStatus ?? VpnStatus.disconnected;
    final connectedAt = parentState?._connectedAt;
    final quota = parentState?._quota;
    final publicIp = parentState?._publicIp ?? '--';
    final isSyncing = parentState?._isSyncing ?? false;
    final lastSync = parentState?._lastSync;

    // Update pulse animation based on VPN status
    if (vpnStatus == VpnStatus.connected) {
      _pulseController.repeat(reverse: true);
    } else {
      _pulseController.stop();
      _pulseController.reset();
    }

    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.screenPaddingHorizontal,
        ),
        child: Column(
          children: [
            const SizedBox(height: AppSpacing.lg),
            
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'SXB VPN',
                      style: AppTypography.headlineMedium.copyWith(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      'Protection active',
                      style: AppTypography.bodySmall.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
                GestureDetector(
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (context) => const NotificationsScreen(),
                      ),
                    );
                  },
                  child: Container(
                    padding: const EdgeInsets.all(AppSpacing.sm),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                      border: Border.all(
                        color: AppColors.border.withOpacity(0.5),
                      ),
                    ),
                    child: const Icon(
                      Icons.notifications_outlined,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: AppSpacing.giant),
            
            // VPN Status Indicator
            GestureDetector(
              onTap: parentState?._toggleVpnConnection,
              child: AnimatedBuilder(
                animation: _pulseAnimation,
                builder: (context, child) {
                  return Transform.scale(
                    scale: vpnStatus == VpnStatus.connected
                        ? _pulseAnimation.value
                        : 1.0,
                    child: child,
                  );
                },
                child: Container(
                  width: 220,
                  height: 220,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        _getStatusColor(vpnStatus).withOpacity(0.2),
                        _getStatusColor(vpnStatus).withOpacity(0.05),
                        Colors.transparent,
                      ],
                      stops: const [0.0, 0.5, 1.0],
                    ),
                  ),
                  child: Center(
                    child: Container(
                      width: 180,
                      height: 180,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.surface,
                        border: Border.all(
                          color: _getStatusColor(vpnStatus).withOpacity(0.4),
                          width: 3,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: _getStatusColor(vpnStatus).withOpacity(0.2),
                            blurRadius: 30,
                            spreadRadius: 5,
                          ),
                        ],
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.shield_outlined,
                            size: 60,
                            color: _getStatusColor(vpnStatus),
                          ),
                          const SizedBox(height: AppSpacing.sm),
                          Text(
                            _getStatusLabel(vpnStatus),
                            style: AppTypography.titleMedium.copyWith(
                              color: _getStatusColor(vpnStatus),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
            
            const SizedBox(height: AppSpacing.lg),
            
            // Connection Duration
            ConnectionDuration(
              connectedAt: connectedAt,
              isConnected: vpnStatus == VpnStatus.connected,
            ),
            
            const SizedBox(height: AppSpacing.sm),
            
            Text(
              'Durée de connexion',
              style: AppTypography.caption.copyWith(
                color: AppColors.textTertiary,
              ),
            ),
            
            const SizedBox(height: AppSpacing.xxl),
            
            // Quick Actions
            Row(
              children: [
                Expanded(
                  child: _buildQuickStat(
                    'Adresse IP',
                    publicIp,
                    Icons.public_outlined,
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: _buildQuickStat(
                    'Quota restant',
                    quota != null
                        ? '${quota.remainingGB.toStringAsFixed(1)} GB'
                        : '--',
                    Icons.data_usage_outlined,
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: AppSpacing.lg),
            
            // Quota Card
            if (quota != null)
              QuotaUsageCard(
                usedGB: quota.usedGB,
                totalGB: quota.totalGB,
                compact: false,
              ),
            
            const SizedBox(height: AppSpacing.lg),
            
            // Import Config Button (if no config imported)
            FutureBuilder<bool>(
              future: StorageService.instance.hasImportedConfig(),
              builder: (context, snapshot) {
                final hasConfig = snapshot.data ?? false;
                if (hasConfig) return const SizedBox.shrink();
                
                return Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(AppSpacing.md),
                      decoration: BoxDecoration(
                        color: AppColors.warning.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                        border: Border.all(
                          color: AppColors.warning.withOpacity(0.3),
                        ),
                      ),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              const Icon(
                                Icons.warning_amber_rounded,
                                color: AppColors.warning,
                                size: 24,
                              ),
                              const SizedBox(width: AppSpacing.sm),
                              Expanded(
                                child: Text(
                                  'Aucune configuration importée',
                                  style: AppTypography.bodyMedium.copyWith(
                                    color: AppColors.warning,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: AppSpacing.sm),
                          Text(
                            'Importez un token SXB pour vous connecter au VPN',
                            style: AppTypography.bodySmall.copyWith(
                              color: AppColors.textSecondary,
                            ),
                          ),
                          const SizedBox(height: AppSpacing.md),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              onPressed: () async {
                                final result = await Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (context) => const ImportConfigScreen(),
                                  ),
                                );
                                if (result == true) {
                                  parentState?._syncData();
                                }
                              },
                              icon: const Icon(Icons.download),
                              label: const Text('Importer une configuration'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(
                                  vertical: AppSpacing.sm,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                  ],
                );
              },
            ),
            
            // Sync Button
            SxbButton(
              text: isSyncing ? 'Synchronisation...' : 'Synchroniser',
              onPressed: isSyncing ? null : parentState?._syncData,
              isLoading: isSyncing,
              isOutlined: true,
              icon: Icons.sync,
            ),
            
            if (lastSync != null) ...[
              const SizedBox(height: AppSpacing.sm),
              Text(
                'Dernière sync: ${_formatLastSync(lastSync)}',
                style: AppTypography.caption.copyWith(
                  color: AppColors.textTertiary,
                ),
              ),
            ],
            
            const SizedBox(height: AppSpacing.giant),
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(VpnStatus status) {
    switch (status) {
      case VpnStatus.connected:
        return AppColors.success;
      case VpnStatus.connecting:
      case VpnStatus.disconnecting:
        return AppColors.warning;
      case VpnStatus.disconnected:
        return AppColors.textTertiary;
      case VpnStatus.error:
        return AppColors.error;
    }
  }

  String _getStatusLabel(VpnStatus status) {
    switch (status) {
      case VpnStatus.connected:
        return 'Connecté';
      case VpnStatus.connecting:
        return 'Connexion...';
      case VpnStatus.disconnecting:
        return 'Déconnexion...';
      case VpnStatus.disconnected:
        return 'Déconnecté';
      case VpnStatus.error:
        return 'Erreur';
    }
  }

  Widget _buildQuickStat(String label, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        border: Border.all(
          color: AppColors.border.withOpacity(0.5),
        ),
      ),
      child: Row(
        children: [
          Icon(
            icon,
            color: AppColors.primary,
            size: AppSpacing.iconLg,
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: AppTypography.caption.copyWith(
                    color: AppColors.textTertiary,
                  ),
                ),
                Text(
                  value,
                  style: AppTypography.bodyMedium.copyWith(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatLastSync(DateTime time) {
    final diff = DateTime.now().difference(time);
    if (diff.inMinutes < 1) return 'À l\'instant';
    if (diff.inMinutes < 60) return 'Il y a ${diff.inMinutes} min';
    if (diff.inHours < 24) return 'Il y a ${diff.inHours}h';
    return 'Il y a ${diff.inDays}j';
  }
}
