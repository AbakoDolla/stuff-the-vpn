import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../core/network/api_client.dart';
import '../core/network/endpoints.dart';

class VpnConfigData {
  final String id;
  final String configName;
  final String protocol;
  final String serverHost;
  final int serverPort;
  final String serverCountry;
  final String serverFlag;
  final Map<String, dynamic> configData;
  final int configVersion;
  final DateTime syncedAt;

  const VpnConfigData({
    required this.id,
    required this.configName,
    required this.protocol,
    required this.serverHost,
    required this.serverPort,
    required this.serverCountry,
    required this.serverFlag,
    required this.configData,
    required this.configVersion,
    required this.syncedAt,
  });

  factory VpnConfigData.fromJson(Map<String, dynamic> json) {
    return VpnConfigData(
      id: json['id'] ?? '',
      configName: json['configName'] ?? '',
      protocol: json['protocol'] ?? '',
      serverHost: json['serverHost'] ?? '',
      serverPort: json['serverPort'] ?? 443,
      serverCountry: json['serverCountry'] ?? '',
      serverFlag: json['serverFlag'] ?? '🏳️',
      configData: json['configData'] ?? {},
      configVersion: json['configVersion'] ?? 1,
      syncedAt: json['syncedAt'] != null
          ? DateTime.parse(json['syncedAt'])
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'configName': configName,
      'protocol': protocol,
      'serverHost': serverHost,
      'serverPort': serverPort,
      'serverCountry': serverCountry,
      'serverFlag': serverFlag,
      'configData': configData,
      'configVersion': configVersion,
      'syncedAt': syncedAt.toIso8601String(),
    };
  }
}

class SyncResult {
  final List<VpnConfigData> configs;
  final DateTime serverTime;
  final String? error;

  const SyncResult({
    required this.configs,
    required this.serverTime,
    this.error,
  });
}

final configSyncServiceProvider = Provider<ConfigSyncService>((ref) {
  return ConfigSyncService(ref.watch(apiClientProvider));
});

class ConfigSyncService {
  final ApiClient _api;
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
  );

  static const _configsKey = 'encrypted_vpn_configs';
  static const _deviceSecretKey = 'device_secret';

  ConfigSyncService(this._api);

  /// Récupère la clé de déchiffrement pour l'appareil
  Future<String> _getDecryptionKey() async {
    String? key = await _secureStorage.read(key: _deviceSecretKey);
    if (key == null) {
      // Générer une clé unique pour cet appareil
      key = _generateDeviceSecret();
      await _secureStorage.write(key: _deviceSecretKey, value: key);
    }
    return key;
  }

  String _generateDeviceSecret() {
    final now = DateTime.now().millisecondsSinceEpoch;
    final random = DateTime.now().microsecondsSinceEpoch;
    return 'SXB_${now}_$random'.substring(0, 32);
  }

  /// Déchiffre les données de configuration
  Map<String, dynamic>? _decryptConfig(String encrypted, String iv) {
    try {
      // XOR simple pour le déchiffrement (la clé est stockée localement)
      final key = utf8.encode(_getDecryptionKey().toString());
      final encryptedBytes = base64Decode(encrypted);
      final ivBytes = base64Decode(iv);
      
      final decrypted = Uint8List(encryptedBytes.length);
      for (int i = 0; i < encryptedBytes.length; i++) {
        decrypted[i] = encryptedBytes[i] ^ key[i % key.length] ^ ivBytes[i % ivBytes.length];
      }
      
      return jsonDecode(utf8.decode(decrypted)) as Map<String, dynamic>;
    } catch (e) {
      return null;
    }
  }

  /// Synchronise les configurations VPN depuis le serveur
  Future<SyncResult> syncVpnConfigs(String deviceId) async {
    try {
      // Récupérer les configs depuis le serveur
      final response = await _api.get(ApiEndpoints.deviceVpnConfigs(deviceId));
      final json = response.data as Map<String, dynamic>;
      final data = (json['data'] as Map<String, dynamic>?) ?? json;
      final configsList = (data['configs'] as List?) ?? [];

      if (configsList.isEmpty) {
        return SyncResult(
          configs: [],
          serverTime: DateTime.now(),
        );
      }

      // Traiter chaque config
      final List<VpnConfigData> processedConfigs = [];
      for (final configJson in configsList) {
        final encrypted = configJson['encryptedConfig'] as String?;
        final iv = configJson['configIV'] as String?;
        
        if (encrypted == null || iv == null) continue;
        
        // Les configs sont déjà déchiffrées côté serveur via /full-sync
        // Ici on stocke directement
        processedConfigs.add(VpnConfigData(
          id: configJson['id'] ?? '',
          configName: configJson['configName'] ?? '',
          protocol: configJson['protocol'] ?? '',
          serverHost: configJson['serverHost'] ?? '',
          serverPort: configJson['serverPort'] ?? 443,
          serverCountry: configJson['serverCountry'] ?? '',
          serverFlag: configJson['serverFlag'] ?? '🏳️',
          configData: configJson['configData'] ?? {},
          configVersion: configJson['configVersion'] ?? 1,
          syncedAt: DateTime.now(),
        ));
      }

      // Stocker les configs de façon sécurisée
      await _storeConfigs(processedConfigs);

      return SyncResult(
        configs: processedConfigs,
        serverTime: DateTime.parse(data['serverTime'] ?? DateTime.now().toIso8601String()),
      );
    } catch (e) {
      // En cas d'erreur, essayer de charger les configs stockées
      final stored = await _loadStoredConfigs();
      return SyncResult(
        configs: stored,
        serverTime: DateTime.now(),
        error: e.toString(),
      );
    }
  }

  /// Synchronisation complète (récupère les configs déchiffrées)
  Future<SyncResult> fullSync(String deviceId) async {
    try {
      final response = await _api.post(ApiEndpoints.deviceFullSync(deviceId));
      final json = response.data as Map<String, dynamic>;
      final data = (json['data'] as Map<String, dynamic>?) ?? json;
      final configsList = (data['configs'] as List?) ?? [];

      final List<VpnConfigData> processedConfigs = [];
      for (final configJson in configsList) {
        processedConfigs.add(VpnConfigData.fromJson(configJson));
      }

      // Stocker les configs
      await _storeConfigs(processedConfigs);

      return SyncResult(
        configs: processedConfigs,
        serverTime: DateTime.parse(data['serverTime'] ?? DateTime.now().toIso8601String()),
      );
    } catch (e) {
      final stored = await _loadStoredConfigs();
      return SyncResult(
        configs: stored,
        serverTime: DateTime.now(),
        error: e.toString(),
      );
    }
  }

  /// Stocke les configs de façon sécurisée
  Future<void> _storeConfigs(List<VpnConfigData> configs) async {
    final configsJson = configs.map((c) => c.toJson()).toList();
    final encrypted = _encryptData(jsonEncode(configsJson));
    await _secureStorage.write(key: _configsKey, value: encrypted);
  }

  /// Charge les configs stockées localement
  Future<List<VpnConfigData>> _loadStoredConfigs() async {
    try {
      final stored = await _secureStorage.read(key: _configsKey);
      if (stored == null) return [];
      
      final decrypted = _decryptStoredData(stored);
      if (decrypted == null) return [];
      
      final List<dynamic> configsList = jsonDecode(decrypted);
      return configsList
          .map((json) => VpnConfigData.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      return [];
    }
  }

  /// Chiffre les données pour le stockage local
  String _encryptData(String data) {
    final key = utf8.encode(_getDecryptionKey().toString());
    final dataBytes = utf8.encode(data);
    final iv = List.generate(16, (i) => DateTime.now().microsecondsSinceEpoch % 256);
    
    final encrypted = Uint8List(dataBytes.length);
    for (int i = 0; i < dataBytes.length; i++) {
      encrypted[i] = dataBytes[i] ^ key[i % key.length] ^ iv[i % iv.length];
    }
    
    return '${base64Encode(iv)}:${base64Encode(encrypted)}';
  }

  /// Déchiffre les données stockées
  String? _decryptStoredData(String stored) {
    try {
      final parts = stored.split(':');
      if (parts.length != 2) return null;
      
      final iv = base64Decode(parts[0]);
      final encrypted = base64Decode(parts[1]);
      final key = utf8.encode(_getDecryptionKey().toString());
      
      final decrypted = Uint8List(encrypted.length);
      for (int i = 0; i < encrypted.length; i++) {
        decrypted[i] = encrypted[i] ^ key[i % key.length] ^ iv[i % iv.length];
      }
      
      return utf8.decode(decrypted);
    } catch (e) {
      return null;
    }
  }

  /// Récupère les configs stockées localement
  Future<List<VpnConfigData>> getStoredConfigs() async {
    return _loadStoredConfigs();
  }

  /// Efface les configs stockées
  Future<void> clearConfigs() async {
    await _secureStorage.delete(key: _configsKey);
  }
}
