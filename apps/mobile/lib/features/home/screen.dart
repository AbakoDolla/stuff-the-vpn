// features/home/screen.dart
// Écran : Home
//
// Tableau de bord principal de l'utilisateur.
// - Statut de connexion VPN
// - Quota restant, temps de session
//
// TODO (Phase 5): Implémenter l'écran complet.

import 'package:flutter/material.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Home')),
      body: const Center(
        child: Text('TODO: Implémenter Home'),
      ),
    );
  }
}
