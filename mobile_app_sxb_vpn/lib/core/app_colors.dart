import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  static const Color background = Color(0xFF0B0F1A);
  static const Color surface = Color(0xFF0F1629);
  static const Color surfaceLight = Color(0xFF141C2E);
  static const Color card = Color(0xFF141C2E);
  static const Color cardBorder = Color(0xFF1E2D45);

  static const Color primary = Color(0xFF2563EB);
  static const Color accent = Color(0xFF06B6D4);

  static const Color textPrimary = Color(0xFFF1F5F9);
  static const Color textSecondary = Color(0xFFCBD5E1);
  static const Color textMuted = Color(0xFF64748B);

  static const Color connected = Color(0xFF22C55E);
  static const Color disconnected = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);

  static const LinearGradient gradientDark = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFF0B0F1A), Color(0xFF0D1525)],
  );

  static const LinearGradient gradientCard = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF141C2E), Color(0xFF0F1629)],
  );
}
