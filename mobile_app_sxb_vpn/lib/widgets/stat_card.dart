import 'package:flutter/material.dart';
import '../app/theme.dart';

class StatCard extends StatelessWidget {
  final String label;
  final String value;
  final String? unit;
  final IconData icon;
  final Color? iconColor;

  const StatCard({
    super.key,
    required this.label,
    required this.value,
    this.unit,
    required this.icon,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: AppColors.gradientCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Icon(icon, size: 16, color: iconColor ?? AppColors.accent),
            const SizedBox(width: 6),
            Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
          ]),
          const SizedBox(height: 8),
          RichText(
            text: TextSpan(
              text: value,
              style: const TextStyle(color: AppColors.textPrimary, fontSize: 22, fontWeight: FontWeight.w700),
              children: unit != null
                  ? [TextSpan(text: ' $unit', style: const TextStyle(fontSize: 12, color: AppColors.textMuted, fontWeight: FontWeight.normal))]
                  : null,
            ),
          ),
        ],
      ),
    );
  }
}
