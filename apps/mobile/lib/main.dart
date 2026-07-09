import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app/app.dart';

// 🔍 Global error storage
class _ErrorStore {
  static final List<String> errors = [];
  
  static void addError(String message) {
    errors.add('[${DateTime.now().toString()}] $message');
    if (errors.length > 50) errors.removeAt(0); // Limite à 50 messages
  }
  
  static void clear() => errors.clear();
  static List<String> getErrors() => List.from(errors);
}

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  
  debugPrint('═══ STUFF THE VPN APP START ═══');
  _ErrorStore.addError('App started');
  
  // Capture les erreurs Flutter
  FlutterError.onError = (FlutterErrorDetails details) {
    final message = '''
╔═══════════════════════════════════════════════════════════════
║ ❌ FLUTTER ERROR
╠═══════════════════════════════════════════════════════════════
║ Exception: ${details.exception}
║ Library: ${details.library}
║ Context: ${details.context}
║ Stack: ${details.stack}
╚═══════════════════════════════════════════════════════════════''';
    
    debugPrint(message);
    _ErrorStore.addError(message);
  };
  
  // Capture les exceptions non gérées
  if (!kIsWeb) {
    PlatformDispatcher.instance.onError = (error, stack) {
      final message = '''
╔═══════════════════════════════════════════════════════════════
║ 🔴 UNCAUGHT EXCEPTION
╠═══════════════════════════════════════════════════════════════
║ Error: $error
║ Stack: $stack
╚═══════════════════════════════════════════════════════════════''';
      
      debugPrint(message);
      _ErrorStore.addError(message);
      return true;
    };
  }

  runApp(
    ProviderScope(
      observers: [_ProviderLogger()],
      child: _ErrorOverlay(
        child: const SxbVpnApp(),
      ),
    ),
  );
}

// Observer Riverpod pour tracker les erreurs de providers
class _ProviderLogger extends ProviderObserver {
  @override
  void onError(ProviderBase<dynamic> provider, Object error, StackTrace stackTrace) {
    final message = '🔴 PROVIDER ERROR: ${provider.name ?? provider.runtimeType}\nError: $error\nStack: $stackTrace';
    debugPrint(message);
    _ErrorStore.addError(message);
  }

  @override
  void onChange(ProviderBase<dynamic> provider, Object? previousValue, Object? newValue) {
    final message = '📍 [${provider.name ?? provider.runtimeType}] = $newValue';
    debugPrint(message);
    _ErrorStore.addError(message);
  }
}

/// Overlay pour afficher les erreurs directement sur l'écran
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
        widget.child,
        // 🔴 Bouton flottant rouge pour voir les erreurs
        Positioned(
          bottom: 20,
          right: 20,
          child: FloatingActionButton(
            backgroundColor: Colors.red,
            onPressed: () {
              setState(() => _showErrors = !_showErrors);
              if (_showErrors && _scrollController.hasClients) {
                Future.delayed(const Duration(milliseconds: 100), () {
                  _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
                });
              }
            },
            child: Icon(_showErrors ? Icons.close : Icons.bug_report),
            tooltip: 'Voir les erreurs / Fermer',
          ),
        ),
        // 📋 Panneau des erreurs
        if (_showErrors)
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              height: MediaQuery.of(context).size.height * 0.6,
              decoration: BoxDecoration(
                color: Colors.black87,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(20),
                  topRight: Radius.circular(20),
                ),
                border: Border.all(color: Colors.red, width: 2),
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
                        const Text(
                          '🔍 DIAGNOSTIC LOGS',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Row(
                          children: [
                            IconButton(
                              icon: const Icon(Icons.delete, color: Colors.white),
                              onPressed: () {
                                _ErrorStore.clear();
                                setState(() {});
                              },
                              tooltip: 'Effacer les logs',
                            ),
                            IconButton(
                              icon: const Icon(Icons.copy, color: Colors.white),
                              onPressed: () {
                                final text = _ErrorStore.getErrors().join('\n\n');
                                // Copie dans le presse-papiers (nécessite import)
                                debugPrint('Logs: $text');
                              },
                              tooltip: 'Copier les logs',
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: SingleChildScrollView(
                      controller: _scrollController,
                      padding: const EdgeInsets.all(12),
                      child: SelectableText(
                        _ErrorStore.getErrors().isEmpty
                            ? '✅ Aucune erreur détectée'
                            : _ErrorStore.getErrors().join('\n\n'),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
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
