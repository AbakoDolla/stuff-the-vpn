import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app/app.dart';

void main() async {
  try {
    WidgetsFlutterBinding.ensureInitialized();
    
    debugPrint('═══ STUFF THE VPN APP START ═══');
    
    // Capture les erreurs Flutter
    FlutterError.onError = (FlutterErrorDetails details) {
      debugPrint('FLUTTER ERROR: ${details.exception}');
    };
    
    // Capture les exceptions non gérées
    if (!kIsWeb) {
      PlatformDispatcher.instance.onError = (error, stack) {
        debugPrint('UNCAUGHT: $error');
        return true;
      };
    }

    runApp(
      const ProviderScope(
        child: SxbVpnApp(),
      ),
    );
  } catch (e, st) {
    debugPrint('FATAL ERROR IN MAIN: $e\n$st');
    
    // Affiche une UI d'erreur même si tout échoue
    runApp(
      MaterialApp(
        home: Scaffold(
          body: Container(
            color: Colors.black,
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: SelectableText(
                  'FATAL ERROR:\n\n$e\n\n$st',
                  style: const TextStyle(color: Colors.red, fontSize: 12),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

