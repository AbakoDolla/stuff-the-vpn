import 'package:flutter/material.dart';
import '../core/app_colors.dart';
import '../providers/vpn_provider.dart';

class VpnButton extends StatelessWidget {
  final VpnState vpnState;
  final VoidCallback? onTap;

  const VpnButton({super.key, required this.vpnState, this.onTap});

  @override
  Widget build(BuildContext context) {
    final isConnected = vpnState.isConnected;
    final isConnecting = vpnState.isConnecting;

    final Color ringColor = isConnected
        ? AppColors.connected
        : isConnecting
            ? AppColors.warning
            : AppColors.primary;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 180,
        height: 180,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: AppColors.gradientCard,
          border: Border.all(color: ringColor, width: 3),
          boxShadow: [
            BoxShadow(
              color: ringColor.withValues(alpha: 0.35),
              blurRadius: 30,
              spreadRadius: 4,
            ),
          ],
        ),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                isConnected ? Icons.power_settings_new : Icons.power_settings_new_outlined,
                color: ringColor,
                size: 56,
              ),
              const SizedBox(height: 8),
              Text(
                isConnected
                    ? 'ON'
                    : isConnecting
                        ? '...'
                        : 'OFF',
                style: TextStyle(
                  color: ringColor,
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.5,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
