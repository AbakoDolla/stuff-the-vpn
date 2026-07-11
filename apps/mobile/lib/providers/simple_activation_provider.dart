import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/network/api_client.dart';
import '../core/storage/secure_storage.dart';
import '../services/device_activation_service.dart';

// ── Providers ──────────────────────────────────────────────────────────

final deviceActivationServiceProvider = Provider<DeviceActivationService>((ref) {
  return DeviceActivationService(ref.watch(apiClientProvider));
});

final simpleActivationProvider = StateNotifierProvider<SimpleActivationNotifier, SimpleActivationState>((ref) {
  return SimpleActivationNotifier(
    ref.watch(deviceActivationServiceProvider),
    ref.watch(secureStorageProvider),
  );
});

// ── States ─────────────────────────────────────────────────────────────

enum SimpleActivationStatus {
  unknown,
  notRegistered,
  pending,
  active,
  expired,
  rejected,
}

class SimpleActivationState {
  final SimpleActivationStatus status;
  final String? deviceId;
  final String? activationCode;
  final String? accessToken;
  final String? tokenExpiresAt;
  final double quotaMB;
  final double quotaUsedMB;
  final double quotaRemainingMB;
  final String? encryptedConfig;
  final int configVersion;
  final bool isLoading;
  final String? error;
  final bool needsSync;

  const SimpleActivationState({
    this.status = SimpleActivationStatus.unknown,
    this.deviceId,
    this.activationCode,
    this.accessToken,
    this.tokenExpiresAt,
    this.quotaMB = 0,
    this.quotaUsedMB = 0,
    this.quotaRemainingMB = 0,
    this.encryptedConfig,
    this.configVersion = 0,
    this.isLoading = false,
    this.error,
    this.needsSync = false,
  });

  bool get hasQuota => quotaMB > 0;
  bool get isActive => status == SimpleActivationStatus.active;
  bool get isPending => status == SimpleActivationStatus.pending;
  bool get hasConfig => encryptedConfig != null && encryptedConfig!.isNotEmpty;

  SimpleActivationState copyWith({
    SimpleActivationStatus? status,
    String? deviceId,
    String? activationCode,
    String? accessToken,
    String? tokenExpiresAt,
    double? quotaMB,
    double? quotaUsedMB,
    double? quotaRemainingMB,
    String? encryptedConfig,
    int? configVersion,
    bool? isLoading,
    String? error,
    bool? needsSync,
  }) {
    return SimpleActivationState(
      status: status ?? this.status,
      deviceId: deviceId ?? this.deviceId,
      activationCode: activationCode ?? this.activationCode,
      accessToken: accessToken ?? this.accessToken,
      tokenExpiresAt: tokenExpiresAt ?? this.tokenExpiresAt,
      quotaMB: quotaMB ?? this.quotaMB,
      quotaUsedMB: quotaUsedMB ?? this.quotaUsedMB,
      quotaRemainingMB: quotaRemainingMB ?? this.quotaRemainingMB,
      encryptedConfig: encryptedConfig ?? this.encryptedConfig,
      configVersion: configVersion ?? this.configVersion,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      needsSync: needsSync ?? this.needsSync,
    );
  }
}

// ── Notifier ────────────────────────────────────────────────────────────

class SimpleActivationNotifier extends StateNotifier<SimpleActivationState> {
  final DeviceActivationService _service;
  final SecureStorageService _storage;

  SimpleActivationNotifier(this._service, this._storage)
      : super(const SimpleActivationState());

  /// Initialise l'appareil et vérifie son statut
  Future<void> initialize() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      // Récupérer ou créer le device ID
      String? deviceId = await _storage.getDeviceId();
      if (deviceId == null || deviceId.isEmpty) {
        // Générer un nouveau device ID
        deviceId = await _generateDeviceId();
        await _storage.saveDeviceId(deviceId);
      }

      // Vérifier le statut
      final status = await _service.getDeviceStatus(deviceId);

      if (status.success) {
        _updateFromStatus(status);
      } else {
        // S'enregistrer
        await _registerDevice(deviceId);
      }
    } catch (e) {
      state = state.copyWith(
        status: SimpleActivationStatus.notRegistered,
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Enregistre l'appareil
  Future<void> _registerDevice(String deviceId) async {
    try {
      final result = await _service.registerDevice(
        deviceId: deviceId,
      );

      if (result.success) {
        await _storage.saveActivationToken(result.activationCode ?? '');

        state = state.copyWith(
          status: SimpleActivationStatus.pending,
          deviceId: deviceId,
          activationCode: result.activationCode,
          isLoading: false,
          error: null,
        );
      } else {
        state = state.copyWith(
          isLoading: false,
          error: result.message ?? 'Erreur lors de l\'enregistrement',
        );
      }
    } catch (e) {
      state = state.copyWith(
        status: SimpleActivationStatus.notRegistered,
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Vérifie le statut d'activation
  Future<void> checkStatus() async {
    if (state.deviceId == null) return;

    state = state.copyWith(isLoading: true, error: null);

    try {
      final status = await _service.getDeviceStatus(state.deviceId!);
      
      if (status.success) {
        _updateFromStatus(status);
      } else {
        state = state.copyWith(
          isLoading: false,
          error: status.message,
        );
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Synchronise l'appareil avec le serveur
  Future<void> sync({double? uploadMB, double? downloadMB}) async {
    if (state.deviceId == null) return;

    state = state.copyWith(isLoading: true, error: null);

    try {
      final result = await _service.syncDevice(
        deviceId: state.deviceId!,
        uploadMB: uploadMB,
        downloadMB: downloadMB,
      );

      if (result.success) {
        // Sauvegarder le token si présent
        if (result.vpnConfig != null) {
          await _storage.saveVpnConfig(result.vpnConfig);
        }

        state = state.copyWith(
          quotaMB: double.tryParse(result.quotaMB ?? '0') ?? 0,
          quotaUsedMB: double.tryParse(result.quotaUsedMB ?? '0') ?? 0,
          quotaRemainingMB: double.tryParse(result.quotaRemainingMB ?? '0') ?? 0,
          encryptedConfig: result.vpnConfig,
          configVersion: result.configVersion ?? state.configVersion,
          needsSync: false,
          isLoading: false,
        );
      } else {
        state = state.copyWith(
          isLoading: false,
          error: result.message,
        );
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Notifie une connexion VPN
  Future<void> notifyConnection({
    required String event,
    String? serverIp,
    int? duration,
  }) async {
    if (state.deviceId == null || !state.isActive) return;

    try {
      await _service.notifyConnection(
        deviceId: state.deviceId!,
        event: event,
        serverIp: serverIp,
        duration: duration,
      );
    } catch (_) {
      // Ne pas bloquer l'UI pour les erreurs de notification
    }
  }

  /// Met à jour le local storage avec le nouveau token
  Future<void> saveAccessToken(String token) async {
    await _storage.saveToken(token);
    state = state.copyWith(accessToken: token);
  }

  void _updateFromStatus(DeviceStatusResult status) {
    SimpleActivationStatus newStatus;
    switch (status.status) {
      case 'ACTIVE':
        newStatus = SimpleActivationStatus.active;
        break;
      case 'PENDING':
        newStatus = SimpleActivationStatus.pending;
        break;
      case 'EXPIRED':
        newStatus = SimpleActivationStatus.expired;
        break;
      case 'REJECTED':
        newStatus = SimpleActivationStatus.rejected;
        break;
      default:
        newStatus = SimpleActivationStatus.notRegistered;
    }

    // Sauvegarder le token si actif
    if (newStatus == SimpleActivationStatus.active && status.accessToken != null) {
      _storage.saveToken(status.accessToken!);
    }

    state = SimpleActivationState(
      status: newStatus,
      deviceId: state.deviceId,
      activationCode: status.activationCode,
      accessToken: status.accessToken,
      tokenExpiresAt: status.tokenExpiresAt,
      quotaMB: double.tryParse(status.quotaMB ?? '0') ?? 0,
      quotaUsedMB: double.tryParse(status.quotaUsedMB ?? '0') ?? 0,
      quotaRemainingMB: double.tryParse(status.quotaRemainingMB ?? '0') ?? 0,
      encryptedConfig: status.vpnConfig,
      configVersion: status.configVersion ?? 0,
      isLoading: false,
      needsSync: status.needsApproval ?? false,
    );
  }

  Future<String> _generateDeviceId() async {
    // Utiliser l'Android ID si disponible, sinon générer un UUID
    // Cette fonction sera implémentée avec device_info_plus
    return DateTime.now().millisecondsSinceEpoch.toString() +
        '-' +
        (1000 + (DateTime.now().microsecond % 9000)).toString();
  }

  /// Réinitialise l'activation
  Future<void> reset() async {
    await _storage.clearAll();
    state = const SimpleActivationState();
  }
}

// ── SecureStorage additions ─────────────────────────────────────────────

extension SecureStorageExtensions on SecureStorageService {
  static const _vpnConfigKey = 'vpn_config';
  static const _lastSyncKey = 'last_sync';

  Future<void> saveVpnConfig(String config) async {
    // TODO: Implémenter le chiffrement
    await _storage.write(key: _vpnConfigKey, value: config);
  }

  Future<String?> getVpnConfig() async {
    return _storage.read(key: _vpnConfigKey);
  }

  Future<void> clearVpnConfig() async {
    await _storage.delete(key: _vpnConfigKey);
  }

  Future<void> saveLastSync(DateTime time) async {
    await _storage.write(
      key: _lastSyncKey,
      value: time.toIso8601String(),
    );
  }

  Future<DateTime?> getLastSync() async {
    final str = await _storage.read(key: _lastSyncKey);
    if (str == null) return null;
    return DateTime.tryParse(str);
  }
}
