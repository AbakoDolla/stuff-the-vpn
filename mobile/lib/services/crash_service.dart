import 'dart:async';
import 'package:flutter/foundation.dart';

class CrashService {
  static final CrashService _instance = CrashService._internal();
  
  late List<String> _crashLogs;
  late DateTime _appStartTime;
  
  factory CrashService() {
    return _instance;
  }
  
  CrashService._internal() {
    _crashLogs = [];
    _appStartTime = DateTime.now();
  }
  
  void initialize() {
    // Capture Dart errors
    FlutterError.onError = (details) {
      logError(
        'Flutter Error',
        details.exception,
        details.stack,
      );
      FlutterError.presentError(details);
    };
    
    // Capture zone errors
    runZonedGuarded(
      () {},
      (error, stackTrace) {
        logError('Zone Error', error, stackTrace);
      },
    );
  }
  
  void logError(String tag, dynamic error, StackTrace? stackTrace) {
    final timestamp = DateTime.now().toIso8601String();
    final uptime = DateTime.now().difference(_appStartTime);
    
    final log = '''
[$timestamp] [$tag] Uptime: $uptime
Error: $error
${stackTrace?.toString() ?? 'No stack trace'}
---
''';
    
    _crashLogs.add(log);
    print(log);
    
    // Keep only last 50 logs
    if (_crashLogs.length > 50) {
      _crashLogs.removeAt(0);
    }
  }
  
  void logInfo(String message) {
    final timestamp = DateTime.now().toIso8601String();
    final log = '[$timestamp] [INFO] $message';
    print(log);
  }
  
  List<String> getCrashLogs() => List.from(_crashLogs);
  
  String getAllLogs() => _crashLogs.join('\n');
  
  void clearLogs() {
    _crashLogs.clear();
  }
}
