import 'dart:math';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/vpn_provider.dart';
import '../../models/vpn_config_model.dart';

class VpnConnectPage extends ConsumerStatefulWidget {
  const VpnConnectPage({super.key});

  @override
  ConsumerState<VpnConnectPage> createState() => _VpnConnectPageState();
}

class _VpnConnectPageState extends ConsumerState<VpnConnectPage>
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
    _pulseCtrl = AnimationController(vsync: this, duration: 2000.ms)..repeat(reverse: true);
    _spinCtrl  = AnimationController(vsync: this, duration: 8000.ms)..repeat();
    _ringsCtrl = AnimationController(vsync: this, duration: 1600.ms)..repeat(reverse: true);
    _pulse = Tween<double>(begin: 0.85, end: 1.0).animate(CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut));
    _spin  = Tween<double>(begin: 0,    end: 2 * pi).animate(_spinCtrl);
    _rings = Tween<double>(begin: 0.6,  end: 1.0).animate(CurvedAnimation(parent: _ringsCtrl, curve: Curves.easeInOut));
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
    final vpnState   = ref.watch(vpnProvider);
    final authState  = ref.watch(authStateProvider).valueOrNull;
    final remaining  = authState?.user?.dataRemaining ?? 0;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.gradientDark),
        child: SafeArea(
          child: Stack(
            children: [
              // Background orbs
              _Orb(top: -80, right: -60, size: 280, color: AppColors.primary, opacity: 0.06),
              _Orb(bottom: -40, left: -50, size: 200, color: AppColors.accent, opacity: 0.04),
              // Main content
              Column(
                children: [
                  _buildTopBar(context, vpnState),
                  const Spacer(),
                  _buildCenterButton(context, vpnState),
                  const SizedBox(height: 40),
                  _buildStatusLabel(context, vpnState),
                  const SizedBox(height: 12),
                  _buildTimer(context, vpnState),
                  const Spacer(),
                  if (vpnState.isConnected) _buildSpeedBar(context, vpnState),
                  _buildServerCard(context, ref, vpnState),
                  const SizedBox(height: 16),
                  if (vpnState.isConnected && vpnState.config != null)
                    _buildProtocolChip(context, vpnState.config!),
                  if (!vpnState.isConnected && remaining <= 0 && authState?.user != null)
                    _buildQuotaWarning(context),
                  const SizedBox(height: 24),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTopBar(BuildContext context, VpnState state) {
    final label  = state.isConnected ? 'Protégé' : state.isConnecting ? 'Connexion...' : 'Non protégé';
    final color  = state.isConnected ? AppColors.connected : state.isConnecting ? AppColors.warning : AppColors.textMuted;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Row(
        children: [
          Container(
            width: 8, height: 8,
            decoration: BoxDecoration(shape: BoxShape.circle, color: color,
              boxShadow: [BoxShadow(color: color.withOpacity(0.6), blurRadius: 6)]),
          ),
          const SizedBox(width: 8),
          Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w600, fontSize: 14)),
          const Spacer(),
          GestureDetector(
            onTap: () => context.go('/logs'),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.cardBorder),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(Icons.history_rounded, color: AppColors.textMuted, size: 14),
                SizedBox(width: 5),
                Text('Logs', style: TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.w500)),
              ]),
            ),
          ),
        ],
      ),
    ).animate().fadeIn().slideX(begin: -0.1);
  }

  Widget _buildCenterButton(BuildContext context, VpnState state) {
    final isOn   = state.isConnected;
    final isWait = state.isConnecting;
    final color  = isOn ? AppColors.connected : isWait ? AppColors.warning : AppColors.primary;

    return GestureDetector(
      onTap: () {
        if (!isWait) ref.read(vpnProvider.notifier).toggle();
      },
      child: AnimatedBuilder(
        animation: Listenable.merge([_pulse, _spin, _rings]),
        builder: (context, _) {
          return SizedBox(
            width: 240,
            height: 240,
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Outer ring (animated)
                Transform.scale(
                  scale: _rings.value,
                  child: Container(
                    width: 220,
                    height: 220,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: color.withOpacity(isOn ? 0.15 : 0.08),
                        width: 1.5,
                      ),
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
                        color: color.withOpacity(isOn ? 0.2 : 0.1),
                        width: 1,
                      ),
                    ),
                  ),
                ),
                // Spinning arc (visible when connected or connecting)
                if (isOn || isWait)
                  Transform.rotate(
                    angle: _spin.value,
                    child: CustomPaint(
                      size: const Size(185, 185),
                      painter: _ArcPainter(color: color, opacity: isWait ? 0.6 : 0.3),
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
                          color: color.withOpacity(isOn ? 0.25 : 0.1),
                          blurRadius: 40,
                          spreadRadius: 10,
                        ),
                      ],
                    ),
                  ),
                ),
                // Main button circle
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
                        blurRadius: 20,
                        spreadRadius: 2,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Center(
                    child: isWait
                        ? SizedBox(
                            width: 36,
                            height: 36,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              valueColor: const AlwaysStoppedAnimation(Colors.white),
                            ),
                          )
                        : Icon(
                            isOn ? Icons.pause_rounded : Icons.power_settings_new_rounded,
                            color: Colors.white,
                            size: 52,
                            shadows: [
                              Shadow(
                                color: Colors.white.withOpacity(0.3),
                                blurRadius: 8,
                              ),
                            ],
                          ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    ).animate(key: ValueKey(state.status)).scale(duration: 400.ms, curve: Curves.elasticOut);
  }

  Widget _buildStatusLabel(BuildContext context, VpnState state) {
    final text  = state.isConnected ? 'VPN Actif' : state.isConnecting ? 'Établissement...' : 'VPN Inactif';
    final style = TextStyle(
      color: state.isConnected ? AppColors.connected : state.isConnecting ? AppColors.warning : AppColors.textMuted,
      fontSize: 22, fontWeight: FontWeight.w700, letterSpacing: 0.5,
    );
    return Text(text, style: style)
        .animate(key: ValueKey(state.status))
        .fadeIn(duration: 300.ms)
        .slideY(begin: 0.2, end: 0);
  }

  Widget _buildTimer(BuildContext context, VpnState state) {
    if (!state.isConnected && !state.isConnecting) {
      return Text(
        'Appuyez pour connecter',
        style: TextStyle(color: AppColors.textMuted.withOpacity(0.6), fontSize: 13),
      );
    }
    final d  = state.connectedDuration;
    final hh = d.inHours.toString().padLeft(2, '0');
    final mm = (d.inMinutes % 60).toString().padLeft(2, '0');
    final ss = (d.inSeconds % 60).toString().padLeft(2, '0');
    return Text('$hh:$mm:$ss',
        style: const TextStyle(
          color: AppColors.textMuted,
          fontSize: 28,
          fontWeight: FontWeight.w300,
          letterSpacing: 4,
          fontFeatures: [FontFeature.tabularFigures()],
        )).animate().fadeIn();
  }

  Widget _buildSpeedBar(BuildContext context, VpnState state) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 0, 24, 16),
      child: Row(
        children: [
          Expanded(child: _speedChip(Icons.arrow_downward_rounded, '${state.downloadSpeed.toStringAsFixed(1)} Mbps', 'Téléchargement', AppColors.accent)),
          const SizedBox(width: 12),
          Expanded(child: _speedChip(Icons.arrow_upward_rounded, '${state.uploadSpeed.toStringAsFixed(1)} Mbps', 'Téléversement', AppColors.primary)),
        ],
      ),
    ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.15, end: 0);
  }

  Widget _speedChip(IconData icon, String value, String label, Color color) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Row(children: [
        Icon(icon, color: color, size: 16),
        const SizedBox(width: 8),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(value, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700, fontSize: 13)),
          Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 10)),
        ]),
      ]),
    );
  }

  Widget _buildServerCard(BuildContext context, WidgetRef ref, VpnState state) {
    final config = state.config;
    final label  = config?.remark ?? 'Serveur auto';
    final proto  = config?.protocolLabel ?? '—';
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: AppColors.gradientCard,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: AppColors.cardBorder),
            ),
            child: Row(children: [
              Container(
                width: 44, height: 44,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: AppColors.gradientBrand,
                  boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.3), blurRadius: 12, spreadRadius: 2)],
                ),
                child: const Icon(Icons.shield_rounded, color: Colors.white, size: 22),
              ),
              const SizedBox(width: 14),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(label, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 15)),
                Text(proto, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
              ])),
              GestureDetector(
                onTap: () => context.go('/servers'),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                  decoration: BoxDecoration(
                    border: Border.all(color: AppColors.primary),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text('Changer', style: TextStyle(color: AppColors.primary, fontSize: 12, fontWeight: FontWeight.w600)),
                ),
              ),
            ]),
          ),
        ),
      ),
    ).animate().fadeIn(delay: 100.ms);
  }

  Widget _buildProtocolChip(BuildContext context, VpnConfigModel config) {
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        _chip(config.protocolLabel, Icons.vpn_lock_rounded),
        const SizedBox(width: 8),
        if (config.host.isNotEmpty) _chip('${config.host}:${config.port}', Icons.dns_rounded),
      ]),
    ).animate().fadeIn(delay: 300.ms);
  }

  Widget _chip(String label, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.primary.withOpacity(0.2)),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, color: AppColors.accent, size: 12),
        const SizedBox(width: 5),
        Text(label, style: const TextStyle(color: AppColors.accent, fontSize: 11, fontWeight: FontWeight.w600)),
      ]),
    );
  }

  Widget _buildQuotaWarning(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.disconnected.withOpacity(0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.disconnected.withOpacity(0.25)),
        ),
        child: Row(children: [
          const Icon(Icons.warning_amber_rounded, color: AppColors.disconnected, size: 18),
          const SizedBox(width: 10),
          const Expanded(child: Text('Quota épuisé — activez un voucher pour continuer.',
              style: TextStyle(color: AppColors.disconnected, fontSize: 12))),
          GestureDetector(
            onTap: () => context.go('/voucher/redeem'),
            child: const Text('Activer', style: TextStyle(color: AppColors.accent, fontWeight: FontWeight.w700, fontSize: 12)),
          ),
        ]),
      ),
    ).animate().fadeIn().shake();
  }
}

// ── Background orb helper ────────────────────────────────────────────────────

class _Orb extends StatelessWidget {
  final double? top;
  final double? bottom;
  final double? left;
  final double? right;
  final double size;
  final Color color;
  final double opacity;

  const _Orb({this.top, this.bottom, this.left, this.right,
    required this.size, required this.color, required this.opacity});

  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: top, bottom: bottom, left: left, right: right,
      child: Container(
        width: size, height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(
            colors: [color.withOpacity(opacity), Colors.transparent],
          ),
        ),
      ),
    );
  }
}

// ── Spinning arc painter ─────────────────────────────────────────────────────

class _ArcPainter extends CustomPainter {
  final Color color;
  final double opacity;
  const _ArcPainter({required this.color, required this.opacity});

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2
      ..strokeCap = StrokeCap.round
      ..color = color.withOpacity(opacity);
    canvas.drawArc(rect, -pi / 2, pi * 1.4, false, paint);
  }

  @override
  bool shouldRepaint(_ArcPainter old) => old.color != color || old.opacity != opacity;
}
