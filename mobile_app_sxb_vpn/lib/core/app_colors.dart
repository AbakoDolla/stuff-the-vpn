import 'package:flutter/material.dart';

class AppColors {
<<<<<<< HEAD
  // Core
  static const Color background = Color(0xFF020817);
=======
  AppColors._();

  static const Color background = Color(0xFF0B0F1A);
>>>>>>> ea0b448fb6e6720505e7b1f4f3bc95731b6590b8
  static const Color surface = Color(0xFF0F1629);
  static const Color surfaceLight = Color(0xFF141C2E);
  static const Color card = Color(0xFF141C2E);
  static const Color cardBorder = Color(0xFF1E2D45);

<<<<<<< HEAD
  // Brand
  static const Color primary = Color(0xFF0099FF);
  static const Color accent = Color(0xFF00D4FF);

  // Text
  static const Color textPrimary = Color(0xFFF1F5F9);
  static const Color textSecondary = Color(0xFF94A3B8);
  static const Color textMuted = Color(0xFF64748B);

  // Status
  static const Color connected = Color(0xFF10B981);
  static const Color disconnected = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);

  // Gradients
  static const LinearGradient gradientDark = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFF020817), Color(0xFF071B3A)],
=======
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
>>>>>>> ea0b448fb6e6720505e7b1f4f3bc95731b6590b8
  );

  static const LinearGradient gradientCard = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF141C2E), Color(0xFF0F1629)],
  );
<<<<<<< HEAD

  static const LinearGradient gradientBrand = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF0099FF), Color(0xFF00D4FF)],
  );

  static const LinearGradient gradientButton = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [Color(0xFF0099FF), Color(0xFF00D4FF)],
  );

  static const List<Color> glowColors = [
    Color(0xFF0099FF),
    Color(0xFF00D4FF),
    Color(0xFF0099FF),
  ];

  static Color withOpacity(Color c, double opacity) =>
      c.withOpacity(opacity);
=======
>>>>>>> ea0b448fb6e6720505e7b1f4f3bc95731b6590b8
}
