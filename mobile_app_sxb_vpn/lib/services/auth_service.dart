import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:supabase_flutter/supabase_flutter.dart";
import "../core/network/api_client.dart";
import "../core/network/endpoints.dart";
import "../core/storage/secure_storage.dart";
import "../models/user_model.dart";

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
        "email": email,
        "password": password,
      });
      final json = response.data as Map<String, dynamic>;
      final payload = (json["data"] as Map<String, dynamic>?) ?? json;
      final token = payload["token"]?.toString();
      if (token == null) return const AuthResult(success: false, error: "No token received");
      await _storage.saveToken(token);
      UserModel? user;
      final userJson = payload["user"] as Map<String, dynamic>?;
      if (userJson != null) {
        user = UserModel.fromJson(userJson);
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
        "email": email,
        "password": password,
        if (username != null && username.isNotEmpty) "username": username,
      });
      final json = response.data as Map<String, dynamic>;
      final payload = (json["data"] as Map<String, dynamic>?) ?? json;
      final token = payload["token"]?.toString();
      if (token == null) return const AuthResult(success: false, error: "No token received");
      await _storage.saveToken(token);
      UserModel? user;
      final userJson = payload["user"] as Map<String, dynamic>?;
      if (userJson != null) {
        user = UserModel.fromJson(userJson);
        await _storage.saveUserId(user.id);
        await _storage.saveUserEmail(user.email);
      }
      return AuthResult(success: true, token: token, user: user);
    } catch (e) {
      return AuthResult(success: false, error: _parseError(e));
    }
  }

  Future<void> signInWithOAuth(OAuthProvider provider) async {
    await Supabase.instance.client.auth.signInWithOAuth(
      provider,
      redirectTo: 'io.supabase.sxbvpn://login-callback',
    );
  }

  Future<UserModel?> getMe() async {
    try {
      final response = await _api.get(ApiEndpoints.me);
      final json = response.data as Map<String, dynamic>;
      final payload = (json["data"] as Map<String, dynamic>?) ?? json;
      return UserModel.fromJson(payload);
    } catch (_) {
      return null;
    }
  }

  Future<void> logout() async {
    try {
      await _api.post(ApiEndpoints.logout);
    } catch (_) {}
    await _storage.clearAll();
  }

  String _parseError(dynamic e) {
    final msg = e.toString();
    if (msg.contains("401")) return "Email ou mot de passe incorrect";
    if (msg.contains("409")) return "Email déjà utilisé";
    if (msg.contains("403")) return "Compte suspendu ou banni";
    if (msg.contains("SocketException")) return "Pas de connexion internet";
    return "Une erreur est survenue";
  }
}
