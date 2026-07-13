import 'dart:math';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../core/app_colors.dart';
import '../../providers/activation_provider.dart';
import '../../providers/vpn_provider.dart';
import '../../services/user_service.dart';
import '../../services/vpn_service.dart';
import '../../widgets/glass_card.dart';

final _homeSubProvider = FutureProvider.autoDispose<Map<String, dynamic>?>((ref) async {
  final userService = ref.read(userServiceProvider);
  return userService.getSubscription();
});

final _vpnStatusProvider = FutureProvider.autoDispose<Map<String, dynamic>?>((ref) async {
  final vpnService = ref.read(vpnServiceProvider);
  return vpnService.getVpnStatus();
});

class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage>
    with TickerProviderStateMixin {
  late AnimationController _pulseCtrl;
  late AnimationController _spinCtrl;
  late AnimationController _ringsCtrl;
  late Animation<double> _pulse;
  late Animation<double> _spin;
  late Animation<double> _rings;

  @override
  void initState() {
    super.initState();
    _pulseCtrl =
        AnimationController(vsync: this, duration: const Duration(milliseconds: 2000))
          ..repeat(reverse: true);
    _spinCtrl =
        AnimationController(vsync: this, duration: const Duration(milliseconds: 8000))
          ..repeat();
    _ringsCtrl =
        AnimationController(vsync: this, duration: const Duration(milliseconds: 1600))
          ..repeat(reverse: true);
    _pulse = Tween<double>(begin: 0.85, end: 1.0)
        .animate(CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut));
    _spin = Tween<double>(begin: 0, end: 2 * pi).animate(_spinCtrl);
    _rings = Tween<double>(begin: 0.6, end: 1.0)
        .animate(CurvedAnimation(parent: _ringsCtrl, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    _spinCtrl.dispose();
    _ringsCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<VpnState>(vpnProvider, (previous, next) {
      final msg = switch (next.status) {
        VpnStatus.permissionDenied =>
          'Permission VPN refusée. Autorisez SxBVPN dans les paramètres Android pour vous connecter.',
        VpnStatus.unsupportedProtocol => next.errorMessage,
        VpnStatus.noServerAvailable => next.errorMessage ?? 'Aucun serveur disponible actuellement.',
        VpnStatus.error => next.errorMessage ?? 'Erreur de connexion VPN.',
        _ => null,
      };
      if (msg != null && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(msg),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    });

    final vpnState = ref.watch(vpnProvider);
    final activationState = ref.watch(activationProvider).valueOrNull;
    final sub = ref.watch(_homeSubProvider);
    final vpnStatus = ref.watch(_vpnStatusProvider);

    final subData = sub.valueOrNull;
    final dataLimit = _d(subData?['dataLimit']) ?? 0.0;
    final dataUsed = _d(subData?['dataUsed']) ?? 0.0;
    final dataRemaining = _d(subData?['dataRemaining']) ?? 0.0;
    final usagePct =
        dataLimit > 0 ? (dataUsed / dataLimit).clamp(0.0, 1.0) : 0.0;

    final publicIp = vpnStatus.valueOrNull?['publicIp']?.toString()
        ?? vpnStatus.valueOrNull?['ip']?.toString();
    final pingMs = _d(vpnStatus.valueOrNull?['ping']
        ?? vpnStatus.valueOrNull?['latencyMs']);
    final lastSync = vpnStatus.valueOrNull?['lastSync']?.toString()
        ?? vpnStatus.valueOrNull?['updatedAt']?.toString();

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.gradientDark),
        child: Stack(
          children: [
            _GlowOrb(top: -100, right: -60, size: 280, color: AppColors.primary, opacity: 0.06),
            _GlowOrb(bottom: -40, left: -50, size: 200, color: AppColors.accent, opacity: 0.04),
            SafeArea(
              child: CustomScrollView(
                slivers: [
                  SliverToBoxAdapter(child: _buildAppBar(context, activationState)),
                  SliverToBoxAdapter(
                    child: _buildVpnButton(context, vpnState),
                  ),
                  SliverToBoxAdapter(
                    child: _buildStatusRow(context, vpnState, publicIp, pingMs),
                  ),
                  SliverToBoxAdapter(
                    child: _buildQuotaCard(context, sub.isLoading, dataUsed,
                        dataRemaining, dataLimit, usagePct, subData),
                  ),
                  SliverToBoxAdapter(
                    child: _buildInfoCards(context, vpnState, lastSync),
                  ),
                  const SliverToBoxAdapter(child: SizedBox(height: 100)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAppBar(BuildContext context, ActivationState? activation) {
    final name = activation?.user?.name ?? '';
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Row(
        children: [
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Bonjour',
                style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
            if (name.isNotEmpty)
              Text(
                name.toUpperCase(),
                style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1),
              ),
          ]),
          const Spacer(),
          // Shield status indicator
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.cardBorder),
            ),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              const Icon(Icons.shield_outlined,
                  color: AppColors.accent, size: 14),
              const SizedBox(width: 5),
              ShaderMask(
                shaderCallback: (b) => const LinearGradient(
                  colors: [AppColors.primary, AppColors.accent],
                ).createShader(b),
                child: const Text('SxBVPN',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w600)),
              ),
            ]),
          ),
        ],
      ),
    ).animate().fadeIn().slideX(begin: -0.05, end: 0);
  }

  Widget _buildVpnButton(BuildContext context, VpnState vpnState) {
    final isOn = vpnState.isConnected;
    final isWait = vpnState.isConnecting;
    final color = isOn
        ? AppColors.connected
        : isWait
            ? AppColors.warning
            : AppColors.primary;

    return Padding(
      padding: const EdgeInsets.only(top: 32),
      child: Center(
        child: GestureDetector(
          onTap: () {
            if (!isWait) ref.read(vpnProvider.notifier).toggle();
          },
          child: AnimatedBuilder(
            animation: Listenable.merge([_pulse, _spin, _rings]),
            builder: (context, _) => SizedBox(
              width: 230,
              height: 230,
              child: Stack(alignment: Alignment.center, children: [
                // Outer ring
                Transform.scale(
                  scale: _rings.value,
                  child: Container(
                    width: 220,
                    height: 220,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                          color:
                              color.withOpacity(isOn ? 0.15 : 0.07),
                          width: 1.5),
                    ),
                  ),
                ),
                // Second ring
                Transform.scale(
                  scale: _rings.value * 0.88,
                  child: Container(
                    width: 200,
                    height: 200,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                          color: color
                              .withOpacity(isOn ? 0.2 : 0.1),
                          width: 1),
                    ),
                  ),
                ),
                // Spinning arc
                if (isOn || isWait)
                  Transform.rotate(
                    angle: _spin.value,
                    child: CustomPaint(
                      size: const Size(185, 185),
                      painter: _ArcPainter(
                          color: color,
                          opacity: isWait ? 0.7 : 0.3),
                    ),
                  ),
                // Glow
                Transform.scale(
                  scale: _pulse.value,
                  child: Container(
                    width: 165,
                    height: 165,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: color
                              .withOpacity(isOn ? 0.28 : 0.1),
                          blurRadius: 40,
                          spreadRadius: 10,
                        ),
                      ],
                    ),
                  ),
                ),
                // Main circle
                Container(
                  width: 155,
                  height: 155,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: isOn
                          ? [AppColors.connected, const Color(0xFF059669)]
                          : isWait
                              ? [AppColors.warning, const Color(0xFFD97706)]
                              : [AppColors.primary, AppColors.accent],
                    ),
                    boxShadow: [
                      BoxShadow(
                          color: color.withOpacity(0.4),
                          blurRadius: 24,
                          spreadRadius: 2,
                          offset: const Offset(0, 4)),
                    ],
                  ),
                  child: Center(
                    child: isWait
                        ? const SizedBox(
                            width: 36,
                            height: 36,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              valueColor: AlwaysStoppedAnimation(Colors.white),
                            ),
                          )
                        : Icon(
                            isOn
                                ? Icons.pause_rounded
                                : Icons.power_settings_new_rounded,
                            color: Colors.white,
                            size: 52,
                          ),
                  ),
                ),
              ]),
            ),
          ),
        ),
      ),
    ).animate(key: ValueKey(vpnState.status))
        .scale(duration: 400.ms, curve: Curves.elasticOut);
  }

  Widget _buildStatusRow(BuildContext context, VpnState vpnState,
      String? publicIp, double? pingMs) {
    final isOn = vpnState.isConnected;
    final isWait = vpnState.isConnecting;
    final statusText = isOn
        ? 'VPN Actif'
        : isWait
            ? 'Connexion en cours...'
            : 'VPN Inactif';
    final statusColor = isOn
        ? AppColors.connected
        : isWait
            ? AppColors.warning
            : AppColors.textMuted;

    final d = vpnState.connectedDuration;
    final hh = d.inHours.toString().padLeft(2, '0');
    final mm = (d.inMinutes % 60).toString().padLeft(2, '0');
    final ss = (d.inSeconds % 60).toString().padLeft(2, '0');

    // Quality from real ping
    String quality = '';
    Color qualityColor = AppColors.textMuted;
    if (pingMs != null) {
      if (pingMs < 50) {
        quality = 'Excellent';
        qualityColor = AppColors.success;
      } else if (pingMs < 100) {
        quality = 'Bon';
        qualityColor = AppColors.success;
      } else if (pingMs < 200) {
        quality = 'Moyen';
        qualityColor = AppColors.warning;
      } else {
        quality = 'Faible';
        qualityColor = AppColors.error;
      }
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
      child: Column(
        children: [
          // Status label
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: statusColor,
                boxShadow: [
                  BoxShadow(
                      color: statusColor.withOpacity(0.6), blurRadius: 6)
                ],
              ),
            ),
            const SizedBox(width: 8),
            Text(statusText,
                style: TextStyle(
                    color: statusColor,
                    fontSize: 18,
                    fontWeight: FontWeight.w700))
                .animate(key: ValueKey(vpnState.status))
                .fadeIn(duration: 300.ms),
          ]),
          const SizedBox(height: 8),
          // Timer
          if (isOn || isWait)
            Text(
              '$hh:$mm:$ss',
              style: const TextStyle(
                color: AppColors.textMuted,
                fontSize: 26,
                fontWeight: FontWeight.w300,
                letterSpacing: 4,
                fontFeatures: [FontFeature.tabularFigures()],
              ),
            ).animate().fadeIn()
          else
            const Text(
              'Appuyez pour vous connecter',
              style: TextStyle(color: AppColors.textMuted, fontSize: 13),
            ),
          const SizedBox(height: 20),
          // Info chips row
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (publicIp != null)
                _InfoChip(
                    icon: Icons.language_rounded,
                    label: publicIp,
                    color: AppColors.accent),
              if (publicIp != null && (pingMs != null || quality.isNotEmpty))
                const SizedBox(width: 10),
              if (pingMs != null)
                _InfoChip(
                    icon: Icons.network_ping_rounded,
                    label: '${pingMs.toStringAsFixed(0)} ms',
                    color: qualityColor),
              if (pingMs != null && quality.isNotEmpty)
                const SizedBox(width: 10),
              if (quality.isNotEmpty)
                _InfoChip(
                    icon: Icons.signal_cellular_alt_rounded,
                    label: quality,
                    color: qualityColor),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(delay: 100.ms);
  }

  Widget _buildQuotaCard(
      BuildContext context,
      bool isLoading,
      double dataUsed,
      double dataRemaining,
      double dataLimit,
      double usagePct,
      Map<String, dynamic>? subData) {
    final expireAt = subData?['expireAt']?.toString();
    final planName = subData?['plan']?.toString() ?? '';

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
      child: GlassCard(
        padding: const EdgeInsets.all(20),
        child: isLoading
            ? _buildSkeleton()
            : Column(children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Quota de données',
                              style: TextStyle(
                                  color: AppColors.textMuted, fontSize: 11)),
                          const SizedBox(height: 4),
                          if (planName.isNotEmpty)
                            ShaderMask(
                              shaderCallback: (b) =>
                                  const LinearGradient(colors: [
                                AppColors.primary,
                                AppColors.accent
                              ]).createShader(b),
                              child: Text(planName,
                                  style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 18,
                                      fontWeight: FontWeight.w700)),
                            ),
                          if (expireAt != null)
                            Text(
                              'Expire le ${_formatDate(expireAt)}',
                              style: const TextStyle(
                                  color: AppColors.textMuted, fontSize: 11),
                            ),
                        ]),
                    SizedBox(
                      width: 64,
                      height: 64,
                      child: Stack(alignment: Alignment.center, children: [
                        CircularProgressIndicator(
                          value: usagePct,
                          strokeWidth: 5,
                          backgroundColor: AppColors.cardBorder,
                          valueColor: AlwaysStoppedAnimation(
                            usagePct > 0.8
                                ? AppColors.error
                                : usagePct > 0.5
                                    ? AppColors.warning
                                    : AppColors.accent,
                          ),
                        ),
                        Text(
                          '${(usagePct * 100).toInt()}%',
                          style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 12,
                              fontWeight: FontWeight.w700),
                        ),
                      ]),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Divider(color: AppColors.cardBorder),
                const SizedBox(height: 12),
                Row(children: [
                  Expanded(
                      child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                        const Text('Utilisé',
                            style: TextStyle(
                                color: AppColors.textMuted, fontSize: 11)),
                        Text(_formatData(dataUsed),
                            style: const TextStyle(
                                color: AppColors.error,
                                fontSize: 18,
                                fontWeight: FontWeight.w700)),
                      ])),
                  Container(
                      width: 1, height: 30, color: AppColors.cardBorder),
                  Expanded(
                      child: Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                        const Text('Restant',
                            style: TextStyle(
                                color: AppColors.textMuted, fontSize: 11)),
                        Text(_formatData(dataRemaining),
                            style: const TextStyle(
                                color: AppColors.accent,
                                fontSize: 18,
                                fontWeight: FontWeight.w700)),
                      ])),
                ]),
              ]),
      ),
    ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.08, end: 0);
  }

  Widget _buildSkeleton() {
    return Column(children: [
      Row(children: [
        Expanded(
            child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
              _shim(width: 80, height: 10),
              const SizedBox(height: 6),
              _shim(width: 120, height: 20),
              const SizedBox(height: 4),
              _shim(width: 100, height: 10),
            ])),
        _shim(width: 64, height: 64, radius: 32),
      ]),
      const SizedBox(height: 16),
      const Divider(color: AppColors.cardBorder),
      const SizedBox(height: 12),
      Row(children: [
        Expanded(child: _shim(width: double.infinity, height: 40)),
        const SizedBox(width: 16),
        Expanded(child: _shim(width: double.infinity, height: 40)),
      ]),
    ]);
  }

  Widget _shim({required double width, required double height, double radius = 6}) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
          color: AppColors.cardBorder,
          borderRadius: BorderRadius.circular(radius)),
    ).animate(onPlay: (c) => c.repeat()).shimmer(
          duration: 1200.ms, color: AppColors.surfaceLight);
  }

  Widget _buildInfoCards(
      BuildContext context, VpnState vpnState, String? lastSync) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Row(children: [
        // Duration card
        Expanded(
            child: _InfoCard(
          icon: Icons.timer_outlined,
          label: 'Durée session',
          value: vpnState.isConnected
              ? _formatDuration(vpnState.connectedDuration)
              : '—',
          color: AppColors.primary,
        )),
        const SizedBox(width: 12),
        // Last sync card
        Expanded(
            child: _InfoCard(
          icon: Icons.sync_rounded,
          label: 'Dernière synchro',
          value: lastSync != null ? _formatDateShort(lastSync) : '—',
          color: AppColors.accent,
        )),
      ]),
    ).animate().fadeIn(delay: 300.ms);
  }

  static String _formatData(double gb) {
    if (gb <= 0) return '0 GB';
    if (gb >= 1000) return '${(gb / 1000).toStringAsFixed(1)} TB';
    return '${gb.toStringAsFixed(1)} GB';
  }

  static String _formatDate(String s) {
    final dt = DateTime.tryParse(s);
    if (dt == null) return s;
    return DateFormat('dd/MM/yyyy').format(dt);
  }

  static String _formatDateShort(String s) {
    final dt = DateTime.tryParse(s)?.toLocal();
    if (dt == null) return '—';
    return DateFormat('dd/MM HH:mm').format(dt);
  }

  static String _formatDuration(Duration d) {
    final h = d.inHours.toString().padLeft(2, '0');
    final m = (d.inMinutes % 60).toString().padLeft(2, '0');
    final s = (d.inSeconds % 60).toString().padLeft(2, '0');
    return '$h:$m:$s';
  }

  static double? _d(dynamic v) {
    if (v == null) return null;
    if (v is double) return v;
    if (v is int) return v.toDouble();
    return double.tryParse(v.toString());
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  const _InfoChip(
      {required this.icon, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, color: color, size: 13),
        const SizedBox(width: 5),
        Text(label,
            style: TextStyle(
                color: color, fontSize: 12, fontWeight: FontWeight.w600)),
      ]),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;
  const _InfoCard(
      {required this.icon,
      required this.label,
      required this.value,
      required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(icon, color: color, size: 14),
          const SizedBox(width: 5),
          Text(label,
              style: const TextStyle(
                  color: AppColors.textMuted, fontSize: 11)),
        ]),
        const SizedBox(height: 6),
        Text(value,
            style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 14,
                fontWeight: FontWeight.w700)),
      ]),
    );
  }
}

class _GlowOrb extends StatelessWidget {
  final double? top;
  final double? bottom;
  final double? left;
  final double? right;
  final double size;
  final Color color;
  final double opacity;
  const _GlowOrb(
      {this.top,
      this.bottom,
      this.left,
      this.right,
      required this.size,
      required this.color,
      required this.opacity});

  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: top,
      bottom: bottom,
      left: left,
      right: right,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(
              colors: [color.withOpacity(opacity), Colors.transparent]),
        ),
      ),
    );
  }
}

class _ArcPainter extends CustomPainter {
  final Color color;
  final double opacity;
  const _ArcPainter({required this.color, required this.opacity});

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    canvas.drawArc(
      rect,
      -pi / 2,
      pi * 1.4,
      false,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2
        ..strokeCap = StrokeCap.round
        ..color = color.withOpacity(opacity),
    );
  }

  @override
  bool shouldRepaint(_ArcPainter old) =>
      old.color != color || old.opacity != opacity;
}
