import 'dart:async';
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
import '../../core/vpn/v2ray_engine.dart';
import '../../core/vpn/vpn_link_builder.dart';

/// SXB VPN Home Screen
/// Main dashboard with VPN connection controls
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen>
    with TickerProviderStateMixin, WidgetsBindingObserver {
  int _currentIndex = 0;

  // VPN State - Use real VPN service
  VpnConnectionStatus vpnStatus = VpnConnectionStatus.disconnected;
  DateTime? connectedAt;
  String publicIp = '--';
  final V2RayEngine _vpnEngine = V2RayEngine.instance;
  StreamSubscription<RealVpnStatus>? _vpnEngineSub;
  String? _vpnError;
  
  String _serverIp = '';
  String _protocol = 'VLESS';

  // Data
  User? _user;
  Quota? quota;
  bool isSyncing = false;
  DateTime? lastSync;
  bool hasConfig = false;

  // Animation
  late AnimationController _connectionAnimationController;

  final List<Widget> _screens = [];
  StreamSubscription<VpnConnectionStatus>? vpnStatusSubscription;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);

    _connectionAnimationController = AnimationController(
      duration: const Duration(milliseconds: 2000),
      vsync: this,
    );

    _screens.addAll([
      _HomeContent(
        onSync: _syncData,
        onImport: _syncData,
        onToggle: onToggle,
        lastSync: lastSync,
        vpnStatus: vpnStatus,
        connectedAt: connectedAt,
        publicIp: publicIp,
        quota: quota,
        isSyncing: isSyncing,
        hasConfig: hasConfig,
      ),
      const HistoryScreen(),
      const AccountScreen(),
      const SettingsScreen(),
    ]);
    _vpnEngineSub = _vpnEngine.statusStream.listen(_onVpnEngineStatus);
    _loadData();
  }

  void _onVpnEngineStatus(RealVpnStatus s) {
    if (!mounted) return;
    setState(() {
      switch (s.state) {
        case RealVpnState.connecting:
          vpnStatus = VpnStatus.connecting;
          _vpnError = null;
          break;
        case RealVpnState.connected:
          vpnStatus = VpnStatus.connected;
          connectedAt ??= DateTime.now();
          _vpnError = null;
          break;
        case RealVpnState.disconnected:
          vpnStatus = VpnStatus.disconnected;
          connectedAt = null;
          break;
        case RealVpnState.permissionDenied:
          vpnStatus = VpnStatus.error;
          connectedAt = null;
          _vpnError = "Permission VPN refusée. Autorisez SxBVPN dans les paramètres Android.";
          break;
        case RealVpnState.error:
          vpnStatus = VpnStatus.error;
          connectedAt = null;
          _vpnError = s.errorMessage ?? "Erreur de connexion VPN";
          break;
      }
    });
    if (_vpnError != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_vpnError!), backgroundColor: Colors.redAccent),
      );

    // Listen to VPN status changes
    vpnStatusSubscription = VpnService.instance.statusStream.listen(_onVpnStatusChanged);

    _loadData();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    vpnStatusSubscription?.cancel();
    _connectionAnimationController.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _loadData();
    }
  }

  void _onVpnStatusChanged(VpnConnectionStatus status) {
    if (mounted) {
      setState(() {
        vpnStatus = status;
        if (status == VpnConnectionStatus.connected) {
          connectedAt = VpnService.instance.connectedAt;
          _serverIp = VpnService.instance.serverIp;
          _protocol = VpnService.instance.protocol;
        } else if (status == VpnConnectionStatus.disconnected) {
          connectedAt = null;
          _serverIp = '';
        }
      });
    }
  }

  Future<void> _loadData() async {
    try {
      // Load cached data first
      final cachedUser = await StorageService.instance.getUser();
      final cachedQuota = await StorageService.instance.getQuota();
      final lastSync = await StorageService.instance.getLastSync();
      final hasConfig = await StorageService.instance.hasImportedConfig();

      if (mounted) {
        setState(() {
          _user = cachedUser;
          quota = cachedQuota;
          lastSync = lastSync;
          hasConfig = hasConfig;
        });
      }

      // Then sync with server
      await _syncData();
    } catch (e) {
      debugPrint('Error loading data: $e');
    }
  }

  Future<void> _syncData() async {
    if (isSyncing) return;

    setState(() {
      isSyncing = true;
    });

    try {
      // Check if we have imported config
      final hasConfig = await StorageService.instance.hasImportedConfig();

      if (mounted) {
        setState(() {
          hasConfig = hasConfig;
        });
      }

      // If we have a token, sync with SXB API
      final token = await StorageService.instance.getImportedToken();
      if (token != null && hasConfig) {
        // Get fresh data from SXB token status
        try {
          final status = await ApiService.instance.checkSxbTokenStatus(token);
          if (status['success'] == true && status['data'] != null) {
            final data = status['data'];
            final quotaRemaining = (data['quotaRemainingMB'] ?? 0) / 1024;
            final quotaUsed = ((data['quotaMB'] ?? 0) - (data['quotaRemainingMB'] ?? 0)) / 1024;
            final quotaTotal = (data['quotaMB'] ?? 0) / 1024;

            final quota = Quota(
              id: 'sxb-quota',
              totalGB: quotaTotal,
              usedGB: quotaUsed,
              remainingGB: quotaRemaining,
              status: data['status'] ?? 'ACTIVE',
            );

            await StorageService.instance.saveQuota(quota);

            if (mounted) {
              setState(() {
                quota = quota;
                lastSync = DateTime.now();
              });
            }
          }
        } catch (e) {
          debugPrint('SXB sync error: $e');
        }
      }

      // Get public IP
      try {
        final ip = await ApiService.instance.getPublicIp();
        if (mounted) {
          setState(() {
            publicIp = ip;
          });
        }
      } catch (e) {
        // Ignore IP fetch errors
      }

      if (mounted) {
        setState(() {
          isSyncing = false;
          lastSync ??= DateTime.now();
        });
      }
    } catch (e) {
      debugPrint('Sync error: $e');
      if (mounted) {
        setState(() {
          isSyncing = false;
        });
      }
    }
  }

  void onToggle() {
    if (vpnStatus == VpnConnectionStatus.connecting ||
        vpnStatus == VpnConnectionStatus.disconnecting) {
      return;
    }

    if (vpnStatus == VpnConnectionStatus.disconnected ||
        vpnStatus == VpnConnectionStatus.error) {
      _connect();
    } else {
      _disconnect();
    }
  }

  Future<void> _connect() async {
    if (!hasConfig) {
      // Navigate to import screen
      final result = await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => const ImportConfigScreen(),
        ),
      );
      if (result == true) {
        setState(() {
          hasConfig = true;
        });
        // Retry connection
        await _connect();
      }
      return;
    }

    setState(() {
      vpnStatus = VpnStatus.connecting;
      _vpnError = null;
    });

    try {
      // Récupère la config VPN stockée localement lors de l'import du
      // token SXB (jamais un appel réseau : le token n'établit pas de
      // session JWT, la config décryptée est stockée une fois pour toutes
      // à l'import).
      final stored = await StorageService.instance.getVpnConfigMap();

      if (stored == null) {
        setState(() {
          vpnStatus = VpnStatus.error;
          _vpnError = 'Aucune configuration VPN importée. Importez votre token SXB.';
        });
        return;
      }

      final protocol = stored['protocol']?.toString();
      if (!isProtocolSupported(protocol)) {
        setState(() {
          vpnStatus = VpnStatus.error;
          _vpnError = 'Protocole ${protocol ?? "inconnu"} non encore supporté sur cette version.';
        });
        return;
      }

      final shareLink = buildShareLink(stored);
      if (shareLink == null) {
        setState(() {
          vpnStatus = VpnStatus.error;
          _vpnError = 'Configuration VPN invalide.';
        });
        return;
      }

      // Déclenche la vraie demande de permission VPN Android, puis le
      // vrai tunnel. Le statut réel arrive ensuite via _onVpnEngineStatus.
      await _vpnEngine.connect(
        shareLink: shareLink,
        remark: stored['remark']?.toString() ?? 'SxBVPN',
      );
    } catch (e) {
      if (mounted) {
        setState(() {
          vpnStatus = VpnStatus.error;
          _vpnError = 'Erreur de connexion: $e';
      vpnStatus = VpnConnectionStatus.connecting;
    });

    try {
      // Get saved config
      final config = await StorageService.instance.getVpnConfigMap();
      final token = await StorageService.instance.getImportedToken();

      if (config == null || token == null) {
        throw Exception('No configuration found');
      }

      // Connect using VPN service
      final success = await VpnService.instance.connect(config, token);

      if (!success && mounted) {
        setState(() {
          vpnStatus = VpnConnectionStatus.error;
        });
      }
    } catch (e) {
      debugPrint('Connection error: $e');
      if (mounted) {
        setState(() {
          vpnStatus = VpnConnectionStatus.error;
        });
      }
    }
  }

  Future<void> _disconnect() async {
    setState(() {
      vpnStatus = VpnConnectionStatus.disconnecting;
    });
    await _vpnEngine.disconnect();
    // L'état final (disconnected) arrive via _onVpnEngineStatus
  }

  @override
  void dispose() {
    _vpnEngineSub?.cancel();
    _connectionAnimationController.dispose();
    super.dispose();

    try {
      await VpnService.instance.disconnect();

      // Report usage to server
      final token = await StorageService.instance.getImportedToken();
      if (token != null) {
        await ApiService.instance.updateSxbUsage(
          token: token,
          uploadMB: 0,
          downloadMB: 0,
        );
      }
    } catch (e) {
      debugPrint('Disconnect error: $e');
      if (mounted) {
        setState(() {
          vpnStatus = VpnConnectionStatus.disconnected;
        });
      }
    }
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
  final VoidCallback onSync;
  final VoidCallback onImport;
  final VoidCallback onToggle;
  final DateTime? lastSync;
  final VpnConnectionStatus vpnStatus;
  final DateTime? connectedAt;
  final String publicIp;
  final Quota? quota;
  final bool isSyncing;
  final bool hasConfig;

  const _HomeContent({
    super.key,
    required this.onSync,
    required this.onImport,
    required this.onToggle,
    required this.lastSync,
    required this.vpnStatus,
    required this.connectedAt,
    required this.publicIp,
    required this.quota,
    required this.isSyncing,
    required this.hasConfig,
  });

  @override
  State<_HomeContent> createState() => _HomeContentState();
}

class _HomeContentState extends State<_HomeContent>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;
  Timer? _durationTimer;
  Duration _connectedDuration = Duration.zero;

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
    _durationTimer?.cancel();
    super.dispose();
  }

  void _startDurationTimer(DateTime? connectedAt) {
    _durationTimer?.cancel();
    if (connectedAt != null) {
      _connectedDuration = DateTime.now().difference(connectedAt);
      _durationTimer = Timer.periodic(const Duration(seconds: 1), (_) {
        if (mounted) {
          setState(() {
            _connectedDuration = DateTime.now().difference(connectedAt);
          });
        }
      });
    }
  }

  String _formatDuration(Duration duration) {
    final hours = duration.inHours.toString().padLeft(2, '0');
    final minutes = (duration.inMinutes % 60).toString().padLeft(2, '0');
    final seconds = (duration.inSeconds % 60).toString().padLeft(2, '0');
    return '$hours:$minutes:$seconds';
  }

  @override
  Widget build(BuildContext context) {
    // Use widget properties directly
    final vpnStatus = widget.vpnStatus;
    final connectedAt = widget.connectedAt;
    final publicIp = widget.publicIp;
    final quota = widget.quota;
    final isSyncing = widget.isSyncing;
    final lastSync = widget.lastSync;
    final hasConfig = widget.hasConfig;

    // Update duration timer when connected
    if (vpnStatus == VpnConnectionStatus.connected && connectedAt != null) {
      _startDurationTimer(connectedAt);
    } else {
      _durationTimer?.cancel();
      _connectedDuration = Duration.zero;
    }

    // Animate based on connection status
    if (vpnStatus == VpnConnectionStatus.connected) {
      _pulseController.repeat(reverse: true);
    } else {
      _pulseController.stop();
      _pulseController.reset();
    }

    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const SizedBox(height: AppSpacing.xl),

            // Logo
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.primary, AppColors.secondary],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withOpacity(0.3),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: const Icon(
                Icons.shield_outlined,
                size: 40,
                color: Colors.white,
              ),
            ),

            const SizedBox(height: AppSpacing.xl),

            // Status text
            Text(
              vpnStatus.displayName,
              style: AppTypography.headlineMedium.copyWith(
                color: _getStatusColor(vpnStatus),
                fontWeight: FontWeight.bold,
              ),
            ),

            // Connected duration
            if (vpnStatus == VpnConnectionStatus.connected) ...[
              const SizedBox(height: AppSpacing.xs),
              Text(
                _formatDuration(_connectedDuration),
                style: AppTypography.bodyLarge.copyWith(
                  color: AppColors.textSecondary,
                  fontFeatures: [const FontFeature.tabularFigures()],
                ),
              ),
            ],

            const SizedBox(height: AppSpacing.giant),

            // Connection Button
            ScaleTransition(
              scale: _pulseAnimation,
              child: GestureDetector(
                onTap: widget.onToggle,
                child: Container(
                  width: 160,
                  height: 160,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      colors: vpnStatus == VpnConnectionStatus.connected
                          ? [AppColors.success, AppColors.success.withOpacity(0.8)]
                          : [AppColors.primary, AppColors.primary.withOpacity(0.8)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: (vpnStatus == VpnConnectionStatus.connected
                                ? AppColors.success
                                : AppColors.primary)
                            .withOpacity(0.4),
                        blurRadius: 30,
                        spreadRadius: 5,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Center(
                    child: vpnStatus == VpnConnectionStatus.connecting ||
                            vpnStatus == VpnConnectionStatus.disconnecting
                        ? const SizedBox(
                            width: 60,
                            height: 60,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 4,
                            ),
                          )
                        : Icon(
                            vpnStatus == VpnConnectionStatus.connected
                                ? Icons.lock_outlined
                                : Icons.lock_open_outlined,
                            size: 60,
                            color: Colors.white,
                          ),
                  ),
                ),
              ),
            ),

            const SizedBox(height: AppSpacing.giant),

            // Quick Stats
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
            if (!hasConfig)
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
                            widget.onSync();
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

            // Sync Button
            SxbButton(
              text: isSyncing ? 'Synchronisation...' : 'Synchroniser',
              onPressed: isSyncing ? null : widget.onSync,
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

  Color _getStatusColor(VpnConnectionStatus status) {
    switch (status) {
      case VpnConnectionStatus.connected:
        return AppColors.success;
      case VpnConnectionStatus.connecting:
      case VpnConnectionStatus.disconnecting:
        return AppColors.warning;
      case VpnConnectionStatus.disconnected:
        return AppColors.textTertiary;
      case VpnConnectionStatus.error:
        return AppColors.error;
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
