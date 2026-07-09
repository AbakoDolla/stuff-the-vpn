import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/app_colors.dart';

class AboutPage extends StatelessWidget {
  const AboutPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.gradientDark),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 0, 24, 40),
            child: Column(
              children: [
                const SizedBox(height: 16),
                // Header row
                Row(children: [
                  IconButton(
                    onPressed: () => context.pop(),
                    icon: const Icon(Icons.arrow_back_rounded,
                        color: AppColors.textPrimary),
                  ),
                  const Spacer(),
                ]),
                const SizedBox(height: 24),
                // Logo with glow
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withOpacity(0.2),
                        blurRadius: 60,
                        spreadRadius: 20,
                      ),
                      BoxShadow(
                        color: AppColors.accent.withOpacity(0.1),
                        blurRadius: 100,
                        spreadRadius: 30,
                      ),
                    ],
                  ),
                  child: Image.asset(
                    'assets/images/logo.png',
                    width: 100,
                    height: 100,
                    fit: BoxFit.contain,
                  ),
                ).animate().fadeIn(duration: 600.ms).scale(
                      begin: const Offset(0.8, 0.8),
                      end: const Offset(1, 1),
                      curve: Curves.elasticOut,
                    ),
                const SizedBox(height: 20),
                ShaderMask(
                  shaderCallback: (b) => const LinearGradient(
                    colors: [AppColors.primary, AppColors.accent],
                  ).createShader(b),
                  child: const Text(
                    'SXB VPN',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 2),
                  ),
                ).animate().fadeIn(delay: 200.ms),
                const SizedBox(height: 8),
                const Text(
                  'Sécurisée · Rapide · Fiable',
                  style: TextStyle(
                      color: AppColors.textMuted,
                      fontSize: 13,
                      letterSpacing: 1.5),
                ).animate().fadeIn(delay: 300.ms),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.primary.withOpacity(0.2)),
                  ),
                  child: const Text(
                    'Version 1.0.0',
                    style: TextStyle(
                        color: AppColors.accent,
                        fontSize: 12,
                        fontWeight: FontWeight.w600),
                  ),
                ).animate().fadeIn(delay: 400.ms),
                const SizedBox(height: 40),
                // Info card
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.cardBorder),
                  ),
                  child: Column(children: [
                    _InfoRow(label: 'Application', value: 'SXB VPN'),
                    const Divider(height: 24, color: AppColors.cardBorder),
                    _InfoRow(label: 'Version', value: '1.0.0 (build 1)'),
                    const Divider(height: 24, color: AppColors.cardBorder),
                    _InfoRow(label: 'Plateforme', value: 'Android / iOS'),
                    const Divider(height: 24, color: AppColors.cardBorder),
                    _InfoRow(label: 'Backend', value: 'vpnsxb.afrihall.com'),
                  ]),
                ).animate().fadeIn(delay: 500.ms).slideY(begin: 0.05, end: 0),
                const SizedBox(height: 24),
                // Legal links
                Container(
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.cardBorder),
                  ),
                  child: Column(children: [
                    _LegalTile(
                      icon: Icons.privacy_tip_outlined,
                      label: 'Politique de confidentialité',
                      onTap: () => _launch('https://vpnsxb.afrihall.com/privacy'),
                    ),
                    const Divider(height: 1, color: AppColors.cardBorder),
                    _LegalTile(
                      icon: Icons.gavel_rounded,
                      label: "Conditions d'utilisation",
                      onTap: () => _launch('https://vpnsxb.afrihall.com/terms'),
                    ),
                    const Divider(height: 1, color: AppColors.cardBorder),
                    _LegalTile(
                      icon: Icons.mail_outline_rounded,
                      label: 'Nous contacter',
                      onTap: () => _launch('mailto:contact@vpnsxb.afrihall.com'),
                    ),
                  ]),
                ).animate().fadeIn(delay: 600.ms).slideY(begin: 0.05, end: 0),
                const SizedBox(height: 40),
                const Text(
                  '© 2024 SXB VPN — Afrihall\nTous droits réservés',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      color: AppColors.textMuted, fontSize: 12, height: 1.6),
                ).animate().fadeIn(delay: 700.ms),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _launch(String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null) return;
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  const _InfoRow({required this.label, required this.value});
  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label,
            style: const TextStyle(
                color: AppColors.textMuted, fontSize: 13)),
        Text(value,
            style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 13,
                fontWeight: FontWeight.w600)),
      ],
    );
  }
}

class _LegalTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _LegalTile(
      {required this.icon, required this.label, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: AppColors.accent, size: 18),
      title: Text(label,
          style: const TextStyle(
              color: AppColors.textPrimary, fontSize: 13)),
      trailing: const Icon(Icons.open_in_new_rounded,
          color: AppColors.textMuted, size: 16),
      onTap: onTap,
    );
  }
}
