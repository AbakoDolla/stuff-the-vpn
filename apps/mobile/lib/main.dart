import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app/app.dart';

// 🔍 Global error storage
class _ErrorStore {
  static final List<String> errors = [];
  
  static void addError(String message) {
    errors.add('[${DateTime.now().toString()}] $message');
    if (errors.length > 100) errors.removeAt(0);
  }
  
  static void clear() => errors.clear();
  static List<String> getErrors() => List.from(errors);
}

void main() async {
  try {
    WidgetsFlutterBinding.ensureInitialized();
    
    debugPrint('═══ STUFF THE VPN APP START ═══');
    _ErrorStore.addError('✅ WidgetsFlutterBinding initialized');
    
    // Capture les erreurs Flutter
    FlutterError.onError = (FlutterErrorDetails details) {
      final message = 'FLUTTER ERROR: ${details.exception}';
      debugPrint(message);
      _ErrorStore.addError(message);
    };
    
    // Capture les exceptions non gérées
    if (!kIsWeb) {
      PlatformDispatcher.instance.onError = (error, stack) {
        final message = 'UNCAUGHT: $error\n${stack.toString().substring(0, 200)}';
        debugPrint(message);
        _ErrorStore.addError(message);
        return true;
      };
    }
    
    _ErrorStore.addError('✅ Error handlers configured');

    runApp(
      ProviderScope(
        observers: [_ProviderLogger()],
        child: _ErrorOverlay(
          child: const SxbVpnApp(),
        ),
      ),
    );
  } catch (e, st) {
    debugPrint('FATAL ERROR IN MAIN: $e\n$st');
    _ErrorStore.addError('FATAL: $e');
    
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

// Observer Riverpod
class _ProviderLogger extends ProviderObserver {
  @override
  void onError(ProviderBase<dynamic> provider, Object error, StackTrace stackTrace) {
    final message = 'PROVIDER ERROR [${provider.name}]: $error';
    debugPrint(message);
    _ErrorStore.addError(message);
  }

  @override
  void onChange(ProviderBase<dynamic> provider, Object? previousValue, Object? newValue) {
    _ErrorStore.addError('✅ [${provider.name}] updated');
  }
}

/// Overlay pour afficher les erreurs
class _ErrorOverlay extends StatefulWidget {
  final Widget child;
  const _ErrorOverlay({required this.child});

  @override
  State<_ErrorOverlay> createState() => _ErrorOverlayState();
}

class _ErrorOverlayState extends State<_ErrorOverlay> {
  bool _showErrors = false;
  final ScrollController _scrollController = ScrollController();

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Wrap l'app entière dans un error boundary
        _SafeWrapper(child: widget.child),
        
        // Bouton flottant
        Positioned(
          bottom: 20,
          right: 20,
          child: FloatingActionButton(
            backgroundColor: Colors.red,
            onPressed: () {
              setState(() => _showErrors = !_showErrors);
            },
            child: Icon(_showErrors ? Icons.close : Icons.bug_report),
          ),
        ),
        
        // Panneau d'erreurs
        if (_showErrors)
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              height: MediaQuery.of(context).size.height * 0.65,
              decoration: BoxDecoration(
                color: Colors.black87,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(20),
                  topRight: Radius.circular(20),
                ),
                border: Border.all(color: Colors.red, width: 3),
              ),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.red.shade900,
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(20),
                        topRight: Radius.circular(20),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // FIX: Pas de const pour le texte dynamique
                        Text(
                          '🔍 LOGS (${_ErrorStore.errors.length})',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete, color: Colors.white),
                          onPressed: () {
                            _ErrorStore.clear();
                            setState(() {});
                          },
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(12),
                      child: SelectableText(
                        _ErrorStore.getErrors().isEmpty
                            ? '✅ Pas d\'erreurs'
                            : _ErrorStore.getErrors().join('\n\n'),
                        style: const TextStyle(
                          color: Colors.greenAccent,
                          fontSize: 11,
                          fontFamily: 'Courier',
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }
}

/// Wrapper pour capturer les erreurs Widget
class _SafeWrapper extends StatelessWidget {
  final Widget child;
  const _SafeWrapper({required this.child});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: _ErrorBoundary(child: child),
      builder: (context, widget) {
        ErrorWidget.builder = (FlutterErrorDetails errorDetails) {
          _ErrorStore.addError('WIDGET ERROR: ${errorDetails.exception}');
          return Material(
            child: Container(
              color: Colors.black,
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: SelectableText(
                    'UI ERROR:\n\n${errorDetails.exception}',
                    style: const TextStyle(color: Colors.red),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
            ),
          );
        };
        return widget ?? const SizedBox();
      },
    );
  }
}

class _ErrorBoundary extends StatelessWidget {
  final Widget child;
  const _ErrorBoundary({required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
    );
  }
}
