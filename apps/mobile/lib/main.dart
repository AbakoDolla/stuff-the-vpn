// main.dart
// Point d'entrée de l'application Flutter Stuff The VPN.
//
// TODO (Phase 5):
// - Initialiser les providers (auth, theme, VPN state)
// - Configurer le routeur (go_router)
// - Gérer le deep linking pour l'activation des vouchers

import 'package:flutter/material.dart';

void main() {
  runApp(const StuffTheVpnApp());
}

class StuffTheVpnApp extends StatelessWidget {
  const StuffTheVpnApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Stuff The VPN',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF6C63FF)),
        useMaterial3: true,
      ),
      // TODO (Phase 5): Remplacer par go_router
      home: const SplashScreen(),
    );
  }
}

// ─── Placeholder Screens ─────────────────────────────────────────────────────

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('🔐', style: TextStyle(fontSize: 64)),
            SizedBox(height: 16),
            Text('STUFF THE VPN', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            SizedBox(height: 8),
            Text('Chargement...', style: TextStyle(color: Colors.grey)),
            // TODO (Phase 5): Ajouter animation et navigation automatique
          ],
        ),
      ),
    );
  }
}
