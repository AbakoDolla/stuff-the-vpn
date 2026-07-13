/// v2ray_engine.dart
///
/// Encapsule flutter_v2ray_client : demande la permission VPN Android,
/// démarre/arrête le vrai tunnel, et diffuse le statut réel (connecté,
/// vitesse, durée) — remplace toute simulation.
///
/// Note : la lecture des champs de vitesse (upload/download) sur l'objet
/// natif [V2RayStatus] se fait de façon défensive (via `dynamic`), car
/// leur nom exact peut varier selon la version du plugin. Seul
/// `status.state` (bien standardisé : CONNECTED/CONNECTING/DISCONNECTED)
/// est utilisé de façon strictement typée. La durée de connexion est
/// calculée localement (fiable à 100%, ne dépend d'aucun champ externe).
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
  DateTime? _connectedAt;
  Timer? _durationTimer;

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

  /// Lecture défensive d'un champ numérique sur l'objet de statut natif :
  /// essaie plusieurs noms de champ possibles (variables selon version du
  /// plugin) et retourne 0 si aucun n'existe, sans jamais planter.
  int _tryReadInt(dynamic obj, List<String> fieldNames) {
    for (final _ in fieldNames) {
      try {
        // Accès dynamique : si le champ n'existe pas, NoSuchMethodError
        // est levée à l'exécution (et interceptée ici), pas à la
        // compilation — donc aucun risque d'échec de build.
        final dynamic value = _readDynamicField(obj, _);
        if (value is int) return value;
        if (value is double) return value.toInt();
      } catch (_) {
        continue;
      }
    }
    return 0;
  }

  dynamic _readDynamicField(dynamic obj, String field) {
    switch (field) {
      case 'uploadSpeed':   return (obj as dynamic).uploadSpeed;
      case 'downloadSpeed': return (obj as dynamic).downloadSpeed;
      case 'upload':        return (obj as dynamic).upload;
      case 'download':      return (obj as dynamic).download;
      default: throw NoSuchMethodError.withInvocation(
        obj, Invocation.getter(Symbol(field)));
    }
  }

  void _onNativeStatus(V2RayStatus status) {
    final stateStr = status.state.toUpperCase();
    RealVpnState mapped;

    if (stateStr.contains('CONNECTED') && !stateStr.contains('DIS')) {
      mapped = RealVpnState.connected;
      _connectedAt ??= DateTime.now();
      _startDurationTimer();
    } else if (stateStr.contains('CONNECTING')) {
      mapped = RealVpnState.connecting;
    } else {
      mapped = RealVpnState.disconnected;
      _connectedAt = null;
      _stopDurationTimer();
    }

    final upBps = _tryReadInt(status, ['uploadSpeed', 'upload']);
    final downBps = _tryReadInt(status, ['downloadSpeed', 'download']);
    final duration = _connectedAt != null
        ? DateTime.now().difference(_connectedAt!)
        : Duration.zero;

    _statusController.add(RealVpnStatus(
      state: mapped,
      uploadSpeedBps: upBps,
      downloadSpeedBps: downBps,
      duration: duration,
    ));
  }

  void _startDurationTimer() {
    _durationTimer?.cancel();
    _durationTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_connectedAt == null) return;
      _statusController.add(RealVpnStatus(
        state: RealVpnState.connected,
        duration: DateTime.now().difference(_connectedAt!),
      ));
    });
  }

  void _stopDurationTimer() {
    _durationTimer?.cancel();
    _durationTimer = null;
  }

  /// Demande la permission VPN système Android (boîte de dialogue native
  /// "Autoriser SxBVPN à configurer une connexion VPN ?").
  /// Retourne `false` si l'utilisateur refuse.
  Future<bool> requestPermission() async {
    await _ensureInitialized();
    return _v2ray.requestPermission();
  }

  /// Démarre le vrai tunnel VPN à partir d'un lien de partage
  /// (vless://, vmess://, trojan://, ss://).
  Future<void> connect({
    required String shareLink,
    required String remark,
    List<String>? blockedApps,
  }) async {
    await _ensureInitialized();

    late final V2RayURL parsed;
    try {
      parsed = V2ray.parseFromURL(shareLink);
    } catch (e) {
      _statusController.add(RealVpnStatus(
        state: RealVpnState.error,
        errorMessage: 'Configuration invalide: $e',
      ));
      return;
    }

    final granted = await _v2ray.requestPermission();
    if (!granted) {
      _statusController.add(const RealVpnStatus(
        state: RealVpnState.permissionDenied,
        errorMessage: "Permission VPN refusée par l'utilisateur",
      ));
      return;
    }

    _statusController.add(const RealVpnStatus(state: RealVpnState.connecting));

    try {
      await _v2ray.startV2Ray(
        remark: remark.isNotEmpty ? remark : parsed.remark,
        config: parsed.getFullConfiguration(),
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
    _connectedAt = null;
    _stopDurationTimer();
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
    _stopDurationTimer();
    _statusController.close();
  }
}
