// features/vpn/screen.dart
// Écran : Vpn
//
// Interface de connexion VPN.
// - Sélection du serveur et du protocole (V2Ray/SSH)
// - Bouton connect/disconnect, statut temps réel
//
// TODO (Phase 5): Implémenter l'écran complet.

import 'package:flutter/material.dart';

class VpnScreen extends StatelessWidget {
  const VpnScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Vpn')),
      body: const Center(
        child: Text('TODO: Implémenter Vpn'),
      ),
    );
  }
}
