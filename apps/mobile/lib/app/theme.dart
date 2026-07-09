import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/app_colors.dart';

class AppTheme {
  // ── Dark ──────────────────────────────────────────────────────────────────
  static ThemeData get dark {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.background,
      colorScheme: const ColorScheme.dark(
        primary:   AppColors.primary,
        secondary: AppColors.accent,
        surface:   AppColors.surface,
        error:     AppColors.error,
        onPrimary: Colors.white,
        onSurface: AppColors.textPrimary,
        onError:   Colors.white,
      ),
      textTheme: _buildTextTheme(ThemeData.dark().textTheme, AppColors.textPrimary,
          AppColors.textSecondary, AppColors.textMuted),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.background,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: GoogleFonts.poppins(
          color: AppColors.textPrimary,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.surface,
        selectedItemColor: AppColors.accent,
        unselectedItemColor: AppColors.textMuted,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),
      inputDecorationTheme: _buildInputDecoration(
        AppColors.surfaceLight,
        AppColors.cardBorder,
        AppColors.primary,
        AppColors.disconnected,
        AppColors.textMuted,
        AppColors.textSecondary,
      ),
      elevatedButtonTheme: _buildElevatedButton(AppColors.primary, Colors.white),
      cardTheme: const CardTheme(
        color: AppColors.card,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(20)),
          side: BorderSide(color: AppColors.cardBorder, width: 1),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: AppColors.cardBorder,
        thickness: 1,
      ),
    );
  }

  // ── Light ─────────────────────────────────────────────────────────────────
  static ThemeData get light {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: AppColors.backgroundLight,
      colorScheme: const ColorScheme.light(
        primary:   AppColors.primary,
        secondary: AppColors.accent,
        surface:   AppColors.surfaceLight2,
        error:     AppColors.error,
        onPrimary: Colors.white,
        onSurface: AppColors.textPrimaryLight,
        onError:   Colors.white,
      ),
      textTheme: _buildTextTheme(ThemeData.light().textTheme, AppColors.textPrimaryLight,
          AppColors.textSecLight, AppColors.textMutedLight),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.surfaceLight2,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: GoogleFonts.poppins(
          color: AppColors.textPrimaryLight,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
        iconTheme: const IconThemeData(color: AppColors.textPrimaryLight),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: AppColors.surfaceLight2,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.textMutedLight,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),
      inputDecorationTheme: _buildInputDecoration(
        AppColors.surfaceLightCard,
        AppColors.cardBorderLight,
        AppColors.primary,
        AppColors.error,
        AppColors.textMutedLight,
        AppColors.textSecLight,
      ),
      elevatedButtonTheme: _buildElevatedButton(AppColors.primary, Colors.white),
      cardTheme: const CardTheme(
        color: AppColors.surfaceLightCard,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(20)),
          side: BorderSide(color: AppColors.cardBorderLight, width: 1),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: AppColors.cardBorderLight,
        thickness: 1,
      ),
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  static TextTheme _buildTextTheme(
    TextTheme base,
    Color primary,
    Color secondary,
    Color muted,
  ) {
    return GoogleFonts.poppinsTextTheme(base).copyWith(
      displayLarge: GoogleFonts.poppins(
          color: primary, fontSize: 32, fontWeight: FontWeight.w700),
      displayMedium: GoogleFonts.poppins(
          color: primary, fontSize: 28, fontWeight: FontWeight.w600),
      headlineLarge: GoogleFonts.poppins(
          color: primary, fontSize: 24, fontWeight: FontWeight.w700),
      headlineMedium: GoogleFonts.poppins(
          color: primary, fontSize: 20, fontWeight: FontWeight.w600),
      bodyLarge:   GoogleFonts.poppins(color: primary,   fontSize: 16),
      bodyMedium:  GoogleFonts.poppins(color: secondary, fontSize: 14),
      bodySmall:   GoogleFonts.poppins(color: muted,     fontSize: 12),
      labelLarge:  GoogleFonts.poppins(
          color: primary, fontSize: 14, fontWeight: FontWeight.w600),
    );
  }

  static InputDecorationTheme _buildInputDecoration(
    Color fill,
    Color border,
    Color focused,
    Color error,
    Color hint,
    Color label,
  ) {
    return InputDecorationTheme(
      filled:   true,
      fillColor: fill.withOpacity(0.5),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: focused, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: error),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
      hintStyle:  GoogleFonts.poppins(color: hint,  fontSize: 14),
      labelStyle: GoogleFonts.poppins(color: label, fontSize: 14),
    );
  }

  static ElevatedButtonThemeData _buildElevatedButton(
      Color background, Color foreground) {
    return ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: background,
        foregroundColor: foreground,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
        textStyle: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w600),
        elevation: 0,
      ),
    );
  }
}
