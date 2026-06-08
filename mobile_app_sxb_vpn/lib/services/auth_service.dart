import "package:flutter_riverpod/flutter_riverpod.dart";
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
  final Map<String, dynamic>? license;
  final String? error;
  const AuthResult({required this.success, this.token, this.user, this.license, this.error});
}

class AuthService {
  final ApiClient _api;
  final SecureStorageService _storage;

  AuthService(this._api, this._storage);

  /// Login with license token, phone, and device ID
  Future<AuthResult> loginWithLicense({
    required String token,
    required String phone,
    required String deviceId,
    String? deviceName,
  }) async {
    try {
      final response = await _api.post(ApiEndpoints.loginLicense, data: {
        "token": token,
        "phone": phone,
        "deviceId": deviceId,
        "deviceName": deviceName ?? "",
      });
      final json = response.data as Map<String, dynamic>;
      final payload = (json["data"] as Map<String, dynamic>?) ?? json;

      final jwtToken = payload["token"]?.toString();
      if (jwtToken == null) return const AuthResult(success: false, error: "No token received");

      await _storage.saveToken(jwtToken);

      UserModel? user;
      final userJson = payload["user"] as Map<String, dynamic>?;
      if (userJson != null) {
        user = UserModel.fromJson(userJson);
        await _storage.saveUserId(user.id);
        await _storage.saveUserEmail(user.email);
      }

      final licenseData = payload["license"] as Map<String, dynamic>?;

      return AuthResult(
        success: true,
        token: jwtToken,
        user: user,
        license: licenseData,
      );
    } catch (e) {
      return AuthResult(success: false, error: _parseError(e));
    }
  }

  /// Refresh the JWT token
  Future<AuthResult> refreshToken() async {
    try {
      final response = await _api.post(ApiEndpoints.refresh);
      final json = response.data as Map<String, dynamic>;
      final payload = (json["data"] as Map<String, dynamic>?) ?? json;

      final newToken = payload["token"]?.toString();
      if (newToken == null) return const AuthResult(success: false, error: "No token received");

      await _storage.saveToken(newToken);
      return AuthResult(success: true, token: newToken);
    } catch (e) {
      return AuthResult(success: false, error: _parseError(e));
    }
  }

  /// Legacy email/password login
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
    if (msg.contains("LICENSE_NOT_FOUND")) return "Token de licence invalide";
    if (msg.contains("LICENSE_EXPIRED")) return "Licence expirée";
    if (msg.contains("LICENSE_REVOKED")) return "Licence révoquée";
    if (msg.contains("LICENSE_SUSPENDED")) return "Licence suspendue";
    if (msg.contains("LICENSE_PHONE_MISMATCH")) return "Numéro de téléphone non associé à cette licence";
    if (msg.contains("LICENSE_DEVICE_MISMATCH")) return "Appareil non autorisé pour cette licence";
    if (msg.contains("DEVICE_LIMIT_REACHED")) return "Limite d'appareils atteinte";
    if (msg.contains("401")) return "Token ou identifiants incorrects";
    if (msg.contains("409")) return "Conflit - données déjà existantes";
    if (msg.contains("403")) return "Compte suspendu ou banni";
    if (msg.contains("SocketException")) return "Pas de connexion internet";
    return "Une erreur est survenue";
  }
}