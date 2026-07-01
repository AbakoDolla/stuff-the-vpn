import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthProvider extends ChangeNotifier {
  final ApiService _api;
  final SharedPreferences _prefs;

  AuthStatus status = AuthStatus.unknown;
  Map<String, dynamic>? currentUser;
  String? _token;

  static const _tokenKey = 'sxb_token';

  AuthProvider(this._api, this._prefs) {
    _restoreSession();
  }

  Future<void> _restoreSession() async {
    final saved = _prefs.getString(_tokenKey);
    if (saved == null) {
      status = AuthStatus.unauthenticated;
      notifyListeners();
      return;
    }
    _token = saved;
    _api.setToken(saved);
    try {
      currentUser = await _api.me();
      status = AuthStatus.authenticated;
    } catch (_) {
      await logout();
    }
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    try {
      final result = await _api.login(email, password);
      _token = result['token'] as String?;
      if (_token != null) {
        await _prefs.setString(_tokenKey, _token!);
        _api.setToken(_token!);
        currentUser = result['user'] as Map<String, dynamic>?;
        status = AuthStatus.authenticated;
        notifyListeners();
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  Future<void> logout() async {
    await _prefs.remove(_tokenKey);
    _token = null;
    currentUser = null;
    status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  bool get isAuthenticated => status == AuthStatus.authenticated;
}
