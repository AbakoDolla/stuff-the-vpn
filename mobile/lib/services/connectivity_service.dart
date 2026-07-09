import 'package:connectivity_plus/connectivity_plus.dart';
import 'dart:async';

class ConnectivityService {
  static final ConnectivityService _instance = ConnectivityService._internal();
  
  final Connectivity _connectivity = Connectivity();
  late StreamSubscription<List<ConnectivityResult>> _subscription;
  
  ConnectivityResult _lastResult = ConnectivityResult.none;
  
  factory ConnectivityService() {
    return _instance;
  }
  
  ConnectivityService._internal();
  
  void initialize() {
    _subscription = _connectivity.onConnectivityChanged.listen((result) {
      _lastResult = result.isNotEmpty ? result.first : ConnectivityResult.none;
      print('[ConnectivityService] Connection changed: $_lastResult');
    });
    
    // Check initial connection status
    _checkConnection();
  }
  
  Future<void> _checkConnection() async {
    try {
      final result = await _connectivity.checkConnectivity();
      _lastResult = result.isNotEmpty ? result.first : ConnectivityResult.none;
    } catch (e) {
      print('[ConnectivityService] Error checking connection: $e');
      _lastResult = ConnectivityResult.none;
    }
  }
  
  bool get isConnected {
    return _lastResult != ConnectivityResult.none;
  }
  
  ConnectivityResult get currentConnection => _lastResult;
  
  Future<bool> waitForConnection({Duration timeout = const Duration(seconds: 30)}) async {
    final startTime = DateTime.now();
    
    while (!isConnected) {
      if (DateTime.now().difference(startTime) > timeout) {
        return false;
      }
      await Future.delayed(const Duration(milliseconds: 500));
    }
    
    return true;
  }
  
  void dispose() {
    _subscription.cancel();
  }
}
