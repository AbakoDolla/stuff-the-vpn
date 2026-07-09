import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'theme.dart';
import 'router.dart';
import '../providers/theme_provider.dart';

class SxbVpnApp extends ConsumerWidget {
  const SxbVpnApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    try {
      // Charge le router avec error handling
      final routerAsync = ref.watch(routerProvider);
      final themeModeAsync = ref.watch(themeProvider);
      
      return MaterialApp.router(
        title: 'SXB VPN',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        darkTheme: AppTheme.dark,
        themeMode: themeModeAsync,
        routerConfig: routerAsync,
      );
    } catch (e, st) {
      // Si ça échoue, affiche une UI d'erreur
      debugPrint('ERROR IN APP BUILD: $e\n$st');
      return MaterialApp(
        home: Scaffold(
          appBar: AppBar(
            title: const Text('Erreur'),
            backgroundColor: Colors.red,
          ),
          body: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error, color: Colors.red, size: 60),
                  const SizedBox(height: 20),
                  const Text(
                    'Erreur lors du démarrage',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 10),
                  SelectableText(
                    '$e',
                    style: const TextStyle(fontSize: 14, color: Colors.grey),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 30),
                  ElevatedButton.icon(
                    icon: const Icon(Icons.refresh),
                    label: const Text('Redémarrer'),
                    onPressed: () {
                      // Force le rebuild
                    },
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }
  }
}
