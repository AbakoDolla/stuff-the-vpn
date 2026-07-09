import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/app_colors.dart';
import '../../providers/theme_provider.dart';

// Language provider
const _kLangKey = 'app_lang';

class LanguageNotifier extends Notifier<String> {
  @override
  String build() {
    _loadLang();
    return 'fr';
  }

  Future<void> _loadLang() async {
    final prefs = await SharedPreferences.getInstance();
    final stored = prefs.getString(_kLangKey) ?? 'fr';
    state = stored;
  }

  Future<void> setLanguage(String lang) async {
    state = lang;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kLangKey, lang);
  }
}

final languageProvider = NotifierProvider<LanguageNotifier, String>(
  () => LanguageNotifier(),
);

// Notification preference provider
const _kNotifKey = 'notif_enabled';
const _kAutoSyncKey = 'auto_sync_enabled';
const _kAutoStartKey = 'auto_start_enabled';

class BoolPrefNotifier extends Notifier<bool> {
  final String key;
  final bool defaultValue;
  BoolPrefNotifier(this.key, {this.defaultValue = true});

  @override
  bool build() {
    _load();
    return defaultValue;
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    state = prefs.getBool(key) ?? defaultValue;
  }

  Future<void> toggle() async {
    state = !state;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(key, state);
  }
}

final notifPrefProvider = NotifierProvider<BoolPrefNotifier, bool>(
  () => BoolPrefNotifier(_kNotifKey),
);
final autoSyncProvider = NotifierProvider<BoolPrefNotifier, bool>(
  () => BoolPrefNotifier(_kAutoSyncKey),
);
final autoStartProvider = NotifierProvider<BoolPrefNotifier, bool>(
  () => BoolPrefNotifier(_kAutoStartKey, defaultValue: false),
);

class SettingsPage extends ConsumerWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeProvider);
    final lang = ref.watch(languageProvider);
    final notifEnabled = ref.watch(notifPrefProvider);
    final autoSync = ref.watch(autoSyncProvider);
    final autoStart = ref.watch(autoStartProvider);
    final isDark = themeMode == ThemeMode.dark;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.gradientDark),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Paramètres',
                    style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 22,
                        fontWeight: FontWeight.w700))
                    .animate().fadeIn(),
                const SizedBox(height: 24),
                // Appearance
                _SectionLabel(label: lang == 'fr' ? 'Apparence' : 'Appearance'),
                _SettingsCard(children: [
                  _ToggleTile(
                    icon: isDark
                        ? Icons.dark_mode_rounded
                        : Icons.light_mode_rounded,
                    iconColor: AppColors.accent,
                    title: lang == 'fr' ? 'Thème sombre' : 'Dark theme',
                    value: isDark,
                    onChanged: (_) =>
                        ref.read(themeProvider.notifier).toggleTheme(),
                  ),
                  const Divider(height: 1, color: AppColors.cardBorder),
                  _SelectTile(
                    icon: Icons.language_rounded,
                    iconColor: AppColors.primary,
                    title: lang == 'fr' ? 'Langue' : 'Language',
                    value: lang == 'fr' ? 'Français' : 'English',
                    onTap: () => _showLangDialog(context, ref, lang),
                  ),
                ]).animate().fadeIn(delay: 80.ms).slideY(begin: 0.05, end: 0),
                const SizedBox(height: 20),
                // Notifications & sync
                _SectionLabel(
                    label: lang == 'fr' ? 'Comportement' : 'Behavior'),
                _SettingsCard(children: [
                  _ToggleTile(
                    icon: Icons.notifications_outlined,
                    iconColor: AppColors.warning,
                    title: lang == 'fr' ? 'Notifications' : 'Notifications',
                    value: notifEnabled,
                    onChanged: (_) =>
                        ref.read(notifPrefProvider.notifier).toggle(),
                  ),
                  const Divider(height: 1, color: AppColors.cardBorder),
                  _ToggleTile(
                    icon: Icons.sync_rounded,
                    iconColor: AppColors.accent,
                    title: lang == 'fr'
                        ? 'Sync. automatique'
                        : 'Auto sync',
                    value: autoSync,
                    onChanged: (_) =>
                        ref.read(autoSyncProvider.notifier).toggle(),
                  ),
                  const Divider(height: 1, color: AppColors.cardBorder),
                  _ToggleTile(
                    icon: Icons.launch_rounded,
                    iconColor: AppColors.primary,
                    title: lang == 'fr'
                        ? 'Lancement automatique'
                        : 'Auto start',
                    value: autoStart,
                    onChanged: (_) =>
                        ref.read(autoStartProvider.notifier).toggle(),
                  ),
                ]).animate().fadeIn(delay: 160.ms).slideY(begin: 0.05, end: 0),
                const SizedBox(height: 20),
                // Links
                _SectionLabel(
                    label: lang == 'fr' ? 'Informations' : 'Information'),
                _SettingsCard(children: [
                  _LinkTile(
                    icon: Icons.help_outline_rounded,
                    iconColor: AppColors.accent,
                    title: lang == 'fr' ? 'Aide et support' : 'Help & Support',
                    onTap: () => _launch('https://vpnsxb.afrihall.com/support'),
                  ),
                  const Divider(height: 1, color: AppColors.cardBorder),
                  _LinkTile(
                    icon: Icons.privacy_tip_outlined,
                    iconColor: AppColors.primary,
                    title: lang == 'fr'
                        ? 'Politique de confidentialité'
                        : 'Privacy Policy',
                    onTap: () =>
                        _launch('https://vpnsxb.afrihall.com/privacy'),
                  ),
                  const Divider(height: 1, color: AppColors.cardBorder),
                  _LinkTile(
                    icon: Icons.gavel_rounded,
                    iconColor: AppColors.primary,
                    title: lang == 'fr'
                        ? "Conditions d'utilisation"
                        : 'Terms of Use',
                    onTap: () => _launch('https://vpnsxb.afrihall.com/terms'),
                  ),
                  const Divider(height: 1, color: AppColors.cardBorder),
                  _LinkTile(
                    icon: Icons.mail_outline_rounded,
                    iconColor: AppColors.accent,
                    title: lang == 'fr' ? 'Nous contacter' : 'Contact Us',
                    onTap: () =>
                        _launch('mailto:contact@vpnsxb.afrihall.com'),
                  ),
                ]).animate().fadeIn(delay: 240.ms).slideY(begin: 0.05, end: 0),
                const SizedBox(height: 20),
                // About link
                _SettingsCard(children: [
                  _LinkTile(
                    icon: Icons.info_outline_rounded,
                    iconColor: AppColors.textMuted,
                    title: lang == 'fr' ? 'À propos' : 'About',
                    onTap: () => context.go('/about'),
                  ),
                ]).animate().fadeIn(delay: 300.ms).slideY(begin: 0.05, end: 0),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showLangDialog(
      BuildContext context, WidgetRef ref, String current) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(
                  color: AppColors.cardBorder,
                  borderRadius: BorderRadius.circular(2))),
          const Text('Langue / Language',
              style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 16,
                  fontWeight: FontWeight.w600)),
          const SizedBox(height: 16),
          _LangOption(
            label: 'Français',
            selected: current == 'fr',
            onTap: () {
              ref.read(languageProvider.notifier).setLanguage('fr');
              Navigator.pop(context);
            },
          ),
          const SizedBox(height: 8),
          _LangOption(
            label: 'English',
            selected: current == 'en',
            onTap: () {
              ref.read(languageProvider.notifier).setLanguage('en');
              Navigator.pop(context);
            },
          ),
          const SizedBox(height: 20),
        ]),
      ),
    );
  }

  Future<void> _launch(String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null) return;
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }
}

class _SectionLabel extends StatelessWidget {
  final String label;
  const _SectionLabel({required this.label});
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, left: 4),
      child: Text(label.toUpperCase(),
          style: const TextStyle(
              color: AppColors.textMuted,
              fontSize: 11,
              fontWeight: FontWeight.w600,
              letterSpacing: 1)),
    );
  }
}

class _SettingsCard extends StatelessWidget {
  final List<Widget> children;
  const _SettingsCard({required this.children});
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Column(children: children),
    );
  }
}

class _ToggleTile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final bool value;
  final ValueChanged<bool> onChanged;
  const _ToggleTile(
      {required this.icon,
      required this.iconColor,
      required this.title,
      required this.value,
      required this.onChanged});
  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: iconColor, size: 20),
      title: Text(title,
          style: const TextStyle(
              color: AppColors.textPrimary, fontSize: 14)),
      trailing: Switch(
        value: value,
        onChanged: onChanged,
        activeColor: AppColors.accent,
        inactiveThumbColor: AppColors.textMuted,
        inactiveTrackColor: AppColors.cardBorder,
      ),
    );
  }
}

class _SelectTile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String value;
  final VoidCallback onTap;
  const _SelectTile(
      {required this.icon,
      required this.iconColor,
      required this.title,
      required this.value,
      required this.onTap});
  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: iconColor, size: 20),
      title: Text(title,
          style: const TextStyle(
              color: AppColors.textPrimary, fontSize: 14)),
      trailing: Row(mainAxisSize: MainAxisSize.min, children: [
        Text(value,
            style: const TextStyle(
                color: AppColors.textMuted, fontSize: 13)),
        const SizedBox(width: 4),
        const Icon(Icons.chevron_right_rounded,
            color: AppColors.textMuted, size: 18),
      ]),
      onTap: onTap,
    );
  }
}

class _LinkTile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final VoidCallback onTap;
  const _LinkTile(
      {required this.icon,
      required this.iconColor,
      required this.title,
      required this.onTap});
  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: iconColor, size: 20),
      title: Text(title,
          style: const TextStyle(
              color: AppColors.textPrimary, fontSize: 14)),
      trailing: const Icon(Icons.chevron_right_rounded,
          color: AppColors.textMuted, size: 18),
      onTap: onTap,
    );
  }
}

class _LangOption extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _LangOption(
      {required this.label,
      required this.selected,
      required this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: selected
              ? AppColors.primary.withOpacity(0.12)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
              color: selected
                  ? AppColors.primary.withOpacity(0.3)
                  : AppColors.cardBorder),
        ),
        child: Row(children: [
          Text(label,
              style: TextStyle(
                  color: selected
                      ? AppColors.accent
                      : AppColors.textPrimary,
                  fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                  fontSize: 14)),
          const Spacer(),
          if (selected)
            const Icon(Icons.check_rounded,
                color: AppColors.accent, size: 18),
        ]),
      ),
    );
  }
}
