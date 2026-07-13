/// v2ray_engine.dart — real V2Ray/Xray tunnel via flutter_v2ray_client.
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

  int _tryReadInt(dynamic obj, List<String> fieldNames) {
    for (final fieldName in fieldNames) {
      try {
        final dynamic value = _readDynamicField(obj, fieldName);
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
      state: mapped, uploadSpeedBps: upBps, downloadSpeedBps: downBps, duration: duration,
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

  Future<bool> requestPermission() async {
    await _ensureInitialized();
    return _v2ray.requestPermission();
  }

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
      _statusController.add(RealVpnStatus(state: RealVpnState.error, errorMessage: 'Configuration invalide: $e'));
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
      _statusController.add(RealVpnStatus(state: RealVpnState.error, errorMessage: e.toString()));
    }
  }

  Future<void> disconnect() async {
    await _v2ray.stopV2Ray();
    _connectedAt = null;
    _stopDurationTimer();
    _statusController.add(const RealVpnStatus(state: RealVpnState.disconnected));
  }

  Future<int> testDelay(String shareLink) async {
    await _ensureInitialized();
    final parsed = V2ray.parseFromURL(shareLink);
    return _v2ray.getServerDelay(config: parsed.getFullConfiguration());
  }

  Future<int> connectedDelay() async => _v2ray.getConnectedServerDelay();

  void dispose() {
    _stopDurationTimer();
    _statusController.close();
  }
}
