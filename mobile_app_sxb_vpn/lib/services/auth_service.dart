import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/network/api_client.dart';
import '../core/network/endpoints.dart';
import '../core/storage/secure_storage.dart';
import '../models/user_model.dart';

final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService(ref.watch(apiClientProvider), ref.watch(secureStorageProvider));
});

class AuthResult {
  final bool success;
  final String? token;
  final UserModel? user;
  final String? error;
  const AuthResult({required this.success, this.token, this.user, this.error});
}

class AuthService {
  final ApiClient _api;
  final SecureStorageService _storage;

  AuthService(this._api, this._storage);

  Future<AuthResult> login(String email, String password) async {
    try {
      final response = await _api.post(ApiEndpoints.login, data: {
        'email': email,
        'password': password,
      });
      final data = response.data as Map<String, dynamic>;
      final token = data['token']?.toString() ?? data['access_token']?.toString();
      if (token == null) return const AuthResult(success: false, error: 'No token received');
      await _storage.saveToken(token);
      UserModel? user;
      if (data['user'] != null) {
        user = UserModel.fromJson(data['user'] as Map<String, dynamic>);
        await _storage.saveUserId(user.id);
        await _storage.saveUserEmail(user.email);
      }
      return AuthResult(success: true, token: token, user: user);
    } catch (e) {
      return AuthResult(success: false, error: _parseError(e));
    }
  }

  Future<AuthResult> register(String email, String password, String? username) async {
    try {
      final response = await _api.post(ApiEndpoints.register, data: {
        'email': email,
        'password': password,
        if (username != null) 'username': username,
      });
      final data = response.data as Map<String, dynamic>;
      final token = data['token']?.toString() ?? data['access_token']?.toString();
      if (token == null) return const AuthResult(success: false, error: 'No token received');
      await _storage.saveToken(token);
      UserModel? user;
      if (data['user'] != null) {
        user = UserModel.fromJson(data['user'] as Map<String, dynamic>);
        await _storage.saveUserId(user.id);
        await _storage.saveUserEmail(user.email);
      }
      return AuthResult(success: true, token: token, user: user);
    } catch (e) {
      return AuthResult(success: false, error: _parseError(e));
    }
  }

  Future<UserModel?> getMe() async {
    try {
      final response = await _api.get(ApiEndpoints.me);
      final data = response.data;
      if (data is Map<String, dynamic>) {
        return UserModel.fromJson(data['user'] as Map<String, dynamic>? ?? data);
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<void> logout() async {
    await _storage.clearAll();
  }

  String _parseError(dynamic e) {
    if (e.toString().contains('401')) return 'Email ou mot de passe incorrect';
    if (e.toString().contains('409')) return 'Email déjà utilisé';
    if (e.toString().contains('SocketException')) return 'Pas de connexion internet';
    return 'Une erreur est survenue';
  }
}
