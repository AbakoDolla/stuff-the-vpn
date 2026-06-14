import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../app/theme.dart';
import '../providers/vpn_provider.dart';

class VpnButton extends StatefulWidget {
  final VpnState vpnState;
  final VoidCallback onTap;

  const VpnButton({super.key, required this.vpnState, required this.onTap});

  @override
  State<VpnButton> createState() => _VpnButtonState();
}

class _VpnButtonState extends State<VpnButton> with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late AnimationController _rotateController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(vsync: this, duration: const Duration(milliseconds: 1800))
      ..repeat();
    _rotateController = AnimationController(vsync: this, duration: const Duration(seconds: 4))
      ..repeat();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _rotateController.dispose();
    super.dispose();
  }

  Color get _statusColor {
    if (widget.vpnState.isConnected) return AppColors.connected;
    if (widget.vpnState.isConnecting) return AppColors.warning;
    return AppColors.primary;
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      child: SizedBox(
        width: 200,
        height: 200,
        child: Stack(
          alignment: Alignment.center,
          children: [
            if (widget.vpnState.isConnected) ..._pulseRings(),
            if (widget.vpnState.isConnecting) _rotatingRing(),
            _mainButton(),
          ],
        ),
      ),
    );
  }

  List<Widget> _pulseRings() {
    return [1.0, 0.7, 0.4].asMap().entries.map((e) {
      final delay = e.key * 600;
      return AnimatedBuilder(
        animation: _pulseController,
        builder: (_, __) {
          final progress = (_pulseController.value + e.key * 0.33) % 1.0;
          return Container(
            width: 120 + progress * 80,
            height: 120 + progress * 80,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: AppColors.connected.withOpacity((1 - progress) * 0.4),
                width: 1.5,
              ),
            ),
          );
        },
      );
    }).toList();
  }

  Widget _rotatingRing() {
    return AnimatedBuilder(
      animation: _rotateController,
      builder: (_, child) {
        return Transform.rotate(
          angle: _rotateController.value * 2 * pi,
          child: child,
        );
      },
      child: Container(
        width: 160,
        height: 160,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: SweepGradient(
            colors: [Colors.transparent, AppColors.warning.withOpacity(0.6)],
          ),
        ),
      ),
    );
  }

  Widget _mainButton() {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 500),
      width: 130,
      height: 130,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: widget.vpnState.isConnected
              ? [AppColors.connected, const Color(0xFF059669)]
              : [AppColors.primary, AppColors.accent],
        ),
        boxShadow: [
          BoxShadow(
            color: _statusColor.withOpacity(0.5),
            blurRadius: 30,
            spreadRadius: 10,
          ),
        ],
      ),
      child: widget.vpnState.isConnecting
          ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2)
          : const Icon(Icons.power_settings_new_rounded, size: 56, color: Colors.white),
    );
  }
}
