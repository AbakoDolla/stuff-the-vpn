import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/app_colors.dart' as CoreAppColors;

class AppTheme {
  static ThemeData get dark {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: CoreAppColors.AppColors.background,
      colorScheme: const ColorScheme.dark(
        primary: CoreAppColors.AppColors.primary,
        secondary: CoreAppColors.AppColors.accent,
        surface: CoreAppColors.AppColors.surface,
        onPrimary: Colors.white,
        onSurface: CoreAppColors.AppColors.textPrimary,
      ),
      textTheme: GoogleFonts.poppinsTextTheme(ThemeData.dark().textTheme).copyWith(
        displayLarge: GoogleFonts.poppins(
          color: CoreAppColors.AppColors.textPrimary,
          fontSize: 32,
          fontWeight: FontWeight.w700,
        ),
        displayMedium: GoogleFonts.poppins(
          color: CoreAppColors.AppColors.textPrimary,
          fontSize: 28,
          fontWeight: FontWeight.w600,
        ),
        headlineLarge: GoogleFonts.poppins(
          color: CoreAppColors.AppColors.textPrimary,
          fontSize: 24,
          fontWeight: FontWeight.w700,
        ),
        headlineMedium: GoogleFonts.poppins(
          color: CoreAppColors.AppColors.textPrimary,
          fontSize: 20,
          fontWeight: FontWeight.w600,
        ),
        bodyLarge: GoogleFonts.poppins(
          color: CoreAppColors.AppColors.textPrimary,
          fontSize: 16,
        ),
        bodyMedium: GoogleFonts.poppins(
          color: CoreAppColors.AppColors.textSecondary,
          fontSize: 14,
        ),
        bodySmall: GoogleFonts.poppins(
          color: CoreAppColors.AppColors.textMuted,
          fontSize: 12,
        ),
        labelLarge: GoogleFonts.poppins(
          color: CoreAppColors.AppColors.textPrimary,
          fontSize: 14,
          fontWeight: FontWeight.w600,
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: CoreAppColors.AppColors.background,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: GoogleFonts.poppins(
          color: CoreAppColors.AppColors.textPrimary,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
        iconTheme: const IconThemeData(color: CoreAppColors.AppColors.textPrimary),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: CoreAppColors.AppColors.surface,
        selectedItemColor: CoreAppColors.AppColors.accent,
        unselectedItemColor: CoreAppColors.AppColors.textMuted,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: CoreAppColors.AppColors.surfaceLight,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: CoreAppColors.AppColors.cardBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: CoreAppColors.AppColors.cardBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: CoreAppColors.AppColors.primary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: CoreAppColors.AppColors.disconnected),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        hintStyle: GoogleFonts.poppins(color: CoreAppColors.AppColors.textMuted, fontSize: 14),
        labelStyle: GoogleFonts.poppins(color: CoreAppColors.AppColors.textSecondary, fontSize: 14),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: CoreAppColors.AppColors.primary,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
          textStyle: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w600),
        ),
      ),
      cardTheme: CardTheme(
        color: CoreAppColors.AppColors.card,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: CoreAppColors.AppColors.cardBorder, width: 1),
        ),
      ),
      dividerTheme: const DividerThemeData(color: CoreAppColors.AppColors.cardBorder, thickness: 1),
    );
  }
}
