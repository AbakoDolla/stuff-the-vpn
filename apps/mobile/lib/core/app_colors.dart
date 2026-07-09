import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // ── Dark palette (primary) ────────────────────────────────────────────────
  static const Color background  = Color(0xFF0B0F1A);
  static const Color surface     = Color(0xFF121826);
  static const Color surfaceLight = Color(0xFF1E293B);
  static const Color card        = Color(0xFF1E293B);
  static const Color cardBorder  = Color(0xFF1E293B);

  // ── Brand ─────────────────────────────────────────────────────────────────
  static const Color primary = Color(0xFF2563EB); // electric blue
  static const Color accent  = Color(0xFF06BED4); // cyan

  // ── Text ──────────────────────────────────────────────────────────────────
  static const Color textPrimary   = Color(0xFFF1F5F9);
  static const Color textSecondary = Color(0xFF94A3B8);
  static const Color textMuted     = Color(0xFF64748B);

  // ── Status ────────────────────────────────────────────────────────────────
  static const Color connected    = Color(0xFF10B981); // success / green
  static const Color success      = Color(0xFF10B981);
  static const Color disconnected = Color(0xFFEF4444); // error / red
  static const Color error        = Color(0xFFEF4444);
  static const Color warning      = Color(0xFFF59E0B); // orange

  // ── Light palette (complementary) ─────────────────────────────────────────
  static const Color backgroundLight  = Color(0xFFF8FAFC);
  static const Color surfaceLight2    = Color(0xFFFFFFFF);
  static const Color surfaceLightCard = Color(0xFFEFF2F7);
  static const Color cardBorderLight  = Color(0xFFCDD5E0);
  static const Color textPrimaryLight = Color(0xFF0F172A);
  static const Color textSecLight     = Color(0xFF475569);
  static const Color textMutedLight   = Color(0xFF94A3B8);

  // ── Gradients ─────────────────────────────────────────────────────────────
  static const LinearGradient gradientDark = LinearGradient(
    begin: Alignment.topCenter,
    end:   Alignment.bottomCenter,
    colors: [Color(0xFF0B0F1A), Color(0xFF0F1E3A)],
  );

  static const LinearGradient gradientCard = LinearGradient(
    begin: Alignment.topLeft,
    end:   Alignment.bottomRight,
    colors: [Color(0xFF1E293B), Color(0xFF121826)],
  );

  static const LinearGradient gradientBrand = LinearGradient(
    begin: Alignment.topLeft,
    end:   Alignment.bottomRight,
    colors: [Color(0xFF2563EB), Color(0xFF06BED4)],
  );

  static const LinearGradient gradientButton = LinearGradient(
    begin: Alignment.centerLeft,
    end:   Alignment.centerRight,
    colors: [Color(0xFF2563EB), Color(0xFF06BED4)],
  );

  static const List<Color> glowColors = [
    Color(0xFF2563EB),
    Color(0xFF06BED4),
    Color(0xFF2563EB),
  ];

  static Color withOpacity(Color c, double opacity) => c.withOpacity(opacity);
}
