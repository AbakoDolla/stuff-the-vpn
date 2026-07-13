/// v2ray_engine.dart
///
/// Encapsule flutter_v2ray_client : demande la permission VPN Android,
/// démarre/arrête le vrai tunnel, et diffuse le statut réel (connecté,
/// vitesse, durée) — remplace toute simulation.
library;

import 'dart:async';
import 'package:flutter_v2ray_client/flutter_v2ray.dart';

enum RealVpnState { disconnected, connecting, connected, permissionDenied, error }

class RealVpnStatus {
  final RealVpnState state;
  final int uploadSpeedBps;
  final int downloadSpeedBps;
  final Duration duration;
  final String? errorMessage;

  const RealVpnStatus({
    this.state = RealVpnState.disconnected,
    this.uploadSpeedBps = 0,
    this.downloadSpeedBps = 0,
    this.duration = Duration.zero,
    this.errorMessage,
  });
}

/// Singleton — un seul moteur V2Ray actif pour toute l'app.
class V2RayEngine {
  V2RayEngine._internal() {
    _v2ray = V2ray(onStatusChanged: _onNativeStatus);
  }
  static final V2RayEngine instance = V2RayEngine._internal();

  late final V2ray _v2ray;
  bool _initialized = false;

  final _statusController = StreamController<RealVpnStatus>.broadcast();
  Stream<RealVpnStatus> get statusStream => _statusController.stream;

  Future<void> _ensureInitialized() async {
    if (_initialized) return;
    await _v2ray.initialize(
      notificationIconResourceType: 'mipmap',
      notificationIconResourceName: 'ic_launcher',
    );
    _initialized = true;
  }

  void _onNativeStatus(V2RayStatus status) {
    final stateStr = status.state.toUpperCase();
    RealVpnState mapped;
    if (stateStr.contains('CONNECTED')) {
      mapped = RealVpnState.connected;
    } else if (stateStr.contains('CONNECTING')) {
      mapped = RealVpnState.connecting;
    } else {
      mapped = RealVpnState.disconnected;
    }
    _statusController.add(RealVpnStatus(
      state: mapped,
      uploadSpeedBps: status.uploadSpeed,
      downloadSpeedBps: status.downloadSpeed,
      duration: status.duration,
    ));
  }

  /// Demande la permission VPN système Android (boîte de dialogue native).
  /// Retourne `false` si l'utilisateur refuse.
  Future<bool> requestPermission() async {
    await _ensureInitialized();
    return _v2ray.requestPermission();
  }

  /// Démarre le vrai tunnel VPN à partir d'un lien de partage
  /// (vless://, vmess://, trojan://, ss://).
  /// Lève une [ArgumentError] si le lien est invalide.
  Future<void> connect({
    required String shareLink,
    required String remark,
    List<String>? blockedApps,
  }) async {
    await _ensureInitialized();

    final parsed = V2ray.parseFromURL(shareLink);
    final config = parsed.getFullConfiguration();

    final granted = await _v2ray.requestPermission();
    if (!granted) {
      _statusController.add(const RealVpnStatus(
        state: RealVpnState.permissionDenied,
        errorMessage: 'Permission VPN refusée par l\'utilisateur',
      ));
      return;
    }

    _statusController.add(const RealVpnStatus(state: RealVpnState.connecting));

    try {
      await _v2ray.startV2Ray(
        remark: remark.isNotEmpty ? remark : parsed.remark,
        config: config,
        blockedApps: blockedApps,
        bypassSubnets: null,
        proxyOnly: false,
      );
    } catch (e) {
      _statusController.add(RealVpnStatus(
        state: RealVpnState.error,
        errorMessage: e.toString(),
      ));
    }
  }

  Future<void> disconnect() async {
    await _v2ray.stopV2Ray();
    _statusController.add(const RealVpnStatus(state: RealVpnState.disconnected));
  }

  /// Latence réelle mesurée sur la config donnée (avant connexion).
  Future<int> testDelay(String shareLink) async {
    await _ensureInitialized();
    final parsed = V2ray.parseFromURL(shareLink);
    return _v2ray.getServerDelay(config: parsed.getFullConfiguration());
  }

  /// Latence du serveur actuellement connecté.
  Future<int> connectedDelay() async {
    return _v2ray.getConnectedServerDelay();
  }

  void dispose() {
    _statusController.close();
  }
}
