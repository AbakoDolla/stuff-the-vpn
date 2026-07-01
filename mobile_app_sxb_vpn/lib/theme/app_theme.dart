import 'package:flutter/material.dart';

/// Palette cohérente avec le dashboard admin (glassmorphism, dark mode)
class AppColors {
  static const bgPrimary   = Color(0xFF020817);
  static const bgCard      = Color(0xCC0F172A);
  static const accent      = Color(0xFF6366F1);
  static const accentGlow  = Color(0x666366F1);
  static const textPrimary = Color(0xFFF1F5F9);
  static const textMuted   = Color(0xFF64748B);
  static const success     = Color(0xFF10B981);
  static const warning     = Color(0xFFF59E0B);
  static const danger      = Color(0xFFEF4444);
  static const border      = Color(0x266366F1);
}

class AppTheme {
  static ThemeData get dark => ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: AppColors.bgPrimary,
        primaryColor: AppColors.accent,
        colorScheme: const ColorScheme.dark(
          primary: AppColors.accent,
          surface: AppColors.bgCard,
          error: AppColors.danger,
        ),
        fontFamily: 'Inter',
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.transparent,
          elevation: 0,
          foregroundColor: AppColors.textPrimary,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.accent,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          ),
        ),
        useMaterial3: true,
      );
}
