import 'dart:io';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import '../core/network/api_client.dart';
import '../core/network/endpoints.dart';
import '../core/storage/secure_storage.dart';
import '../models/device_activation_model.dart';

final deviceServiceProvider = Provider<DeviceService>((ref) {
  return DeviceService(
    ref.watch(apiClientProvider),
    ref.watch(secureStorageProvider),
  );
});

class DeviceActivationResponse {
  final bool success;
  final DeviceActivationResult? result;
  final String? error;

  const DeviceActivationResponse({
    required this.success,
    this.result,
    this.error,
  });
}

class DeviceService {
  final ApiClient _api;
  final SecureStorageService _storage;
  final DeviceInfoPlugin _deviceInfo = DeviceInfoPlugin();

  DeviceService(this._api, this._storage);

  /// Returns a stable Device ID persisted in secure storage.
  /// Derived from the real hardware identifier when possible,
  /// otherwise a UUID v4 generated once and stored.
  Future<String> getOrCreateDeviceId() async {
    final stored = await _storage.getDeviceId();
    if (stored != null && stored.isNotEmpty) return stored;

    String id;
    try {
      if (Platform.isAndroid) {
        final info = await _deviceInfo.androidInfo;
        // Prefer the Android ID (stable per device + signing key)
        final androidId = info.id;
        if (androidId.isNotEmpty && androidId != 'unknown') {
          id = androidId;
        } else {
          id = const Uuid().v4();
        }
      } else if (Platform.isIOS) {
        final info = await _deviceInfo.iosInfo;
        id = info.identifierForVendor ?? const Uuid().v4();
      } else {
        id = const Uuid().v4();
      }
    } catch (_) {
      id = const Uuid().v4();
    }

    await _storage.saveDeviceId(id);
    return id;
  }

  /// Collects available device metadata for the activation payload.
  Future<Map<String, String?>> _collectMetadata() async {
    try {
      if (Platform.isAndroid) {
        final info = await _deviceInfo.androidInfo;
        return {
          'deviceName': info.model,
          'brand':      info.brand,
          'model':      info.model,
          'osVersion':  'Android ${info.version.release}',
          'androidId':  info.id,
          'fingerprint': info.fingerprint,
        };
      } else if (Platform.isIOS) {
        final info = await _deviceInfo.iosInfo;
        return {
          'deviceName': info.name,
          'brand':      'Apple',
          'model':      info.utsname.machine,
          'osVersion':  '${info.systemName} ${info.systemVersion}',
        };
      }
    } catch (_) {}
    return {};
  }

  /// Calls POST /mobile/device/activate with deviceId + token + metadata.
  /// Stores the returned JWT and device status on success.
  Future<DeviceActivationResponse> activateDevice({
    required String token,
    String? phone,
    String? email,
    String? name,
    String? appVersion,
  }) async {
    try {
      final deviceId = await getOrCreateDeviceId();
      final meta     = await _collectMetadata();

      final body = <String, dynamic>{
        'deviceId':   deviceId,
        'token':      token,
        if (meta['deviceName']  != null) 'deviceName':  meta['deviceName'],
        if (meta['brand']       != null) 'brand':       meta['brand'],
        if (meta['model']       != null) 'model':       meta['model'],
        if (meta['osVersion']   != null) 'osVersion':   meta['osVersion'],
        if (meta['androidId']   != null) 'androidId':   meta['androidId'],
        if (meta['fingerprint'] != null) 'fingerprint': meta['fingerprint'],
        if (appVersion          != null) 'appVersion':  appVersion,
        // Always include phone for license activation (required by backend)
        'phone': phone ?? '',
        if (email               != null && email.isNotEmpty) 'email': email,
        if (name                != null && name.isNotEmpty) 'name': name,
      };

      final response = await _api.post(ApiEndpoints.deviceActivate, data: body);
      final json     = response.data as Map<String, dynamic>;
      final result   = DeviceActivationResult.fromJson(json);

      if (result.accessToken.isEmpty) {
        return const DeviceActivationResponse(
          success: false,
          error:   'No access token received from server',
        );
      }

      // Persist session
      await _storage.saveToken(result.accessToken);
      await _storage.saveDeviceStatus(result.device.status);
      await _storage.saveActivationToken(token);

      if (result.user != null) {
        await _storage.saveUserId(result.user!.id);
        await _storage.saveUserEmail(result.user!.email);
      }

      return DeviceActivationResponse(success: true, result: result);
    } catch (e) {
      return DeviceActivationResponse(
        success: false,
        error: _parseError(e),
      );
    }
  }

  /// Returns true when a stored JWT + ACTIVE status exist.
  Future<bool> isDeviceActivated() => _storage.isDeviceActivated();

  String _parseError(dynamic e) {
    final msg = e.toString();
    if (msg.contains('DEVICE_NOT_FOUND'))      return 'Appareil non trouvé';
    if (msg.contains('DEVICE_SUSPENDED'))      return 'Appareil suspendu';
    if (msg.contains('DEVICE_LIMIT_REACHED'))  return 'Limite d\'appareils atteinte';
    if (msg.contains('TOKEN_NOT_FOUND'))       return 'Token invalide';
    if (msg.contains('TOKEN_EXPIRED'))         return 'Token expiré';
    if (msg.contains('TOKEN_REVOKED'))         return 'Token révoqué';
    if (msg.contains('LICENSE_NOT_FOUND'))     return 'Licence introuvable';
    if (msg.contains('LICENSE_EXPIRED'))       return 'Licence expirée';
    if (msg.contains('Appareil non autorisé')) return 'Cet appareil n\'est pas autorisé';
    if (msg.contains('Aucun compte associé'))  return 'Aucun compte associé à cette licence';
    if (msg.contains('401'))                   return 'Token incorrect';
    if (msg.contains('403'))                   return 'Accès refusé';
    if (msg.contains('SocketException'))       return 'Pas de connexion internet';
    return 'Une erreur est survenue';
  }
}
