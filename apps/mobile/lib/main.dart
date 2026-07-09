import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app/app.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 🔍 DIAGNOSTIC LOGS - Affiche toutes les erreurs en détail
  // ═══════════════════════════════════════════════════════════════════════════
  
  debugPrint('═══ STUFF THE VPN APP START ═══');
  
  // 2️⃣ Configure les erreurs globales
  FlutterError.onError = (FlutterErrorDetails details) {
    debugPrint('╔═══════════════════════════════════════════════════════════════');
    debugPrint('║ ❌ FLUTTER ERROR CAUGHT');
    debugPrint('╠═══════════════════════════════════════════════════════════════');
    debugPrint('║ Exception: ${details.exception}');
    debugPrint('║ Library: ${details.library}');
    debugPrint('║ Context: ${details.context}');
    debugPrint('╚═══════════════════════════════════════════════════════════════');
    debugPrintStack(stackTrace: details.stack);
  };
  
  // 3️⃣ Affiche les erreurs non catchées
  if (kIsWeb) {
    // Web doesn't support PlatformDispatcher.instance.onError
    debugPrint('ℹ️ Running on Web - skipping PlatformDispatcher setup');
  } else {
    PlatformDispatcher.instance.onError = (error, stack) {
      debugPrint('╔═══════════════════════════════════════════════════════════════');
      debugPrint('║ 🔴 UNCAUGHT EXCEPTION');
      debugPrint('╠═══════════════════════════════════════════════════════════════');
      debugPrint('║ Error: $error');
      debugPrint('╚═══════════════════════════════════════════════════════════════');
      debugPrintStack(stackTrace: stack);
      return true;
    };
  }

  runApp(
    ProviderScope(
      observers: [_ProviderLogger()],
      child: const SxbVpnApp(),
    ),
  );
}

// Observer Riverpod pour tracker les erreurs de providers
class _ProviderLogger extends ProviderObserver {
  @override
  void onError(ProviderBase<dynamic> provider, Object error, StackTrace stackTrace) {
    debugPrint('╔═══════════════════════════════════════════════════════════════');
    debugPrint('║ 🔴 PROVIDER ERROR: ${provider.name ?? provider.runtimeType}');
    debugPrint('╠═══════════════════════════════════════════════════════════════');
    debugPrint('║ Error: $error');
    debugPrint('╚═══════════════════════════════════════════════════════════════');
    debugPrintStack(stackTrace: stackTrace);
  }

  @override
  void onChange(ProviderBase<dynamic> provider, Object? previousValue, Object? newValue) {
    debugPrint('📍 [Provider] ${provider.name ?? provider.runtimeType} = $newValue');
  }
}
