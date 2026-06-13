// features/settings/screen.dart
// Écran : Settings
//
// Paramètres de l'application.
// - Protocole préféré, DNS, auto-connect
// - Langue, thème, notifications
//
// TODO (Phase 5): Implémenter l'écran complet.

import 'package:flutter/material.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: const Center(
        child: Text('TODO: Implémenter Settings'),
      ),
    );
  }
}
