import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_v2ray/flutter_v2ray.dart';
import 'api_service.dart';

/// VPN connection states shown in UI and system notification
enum VpnState {
  disconnected,
  connecting,
  connected,
  disconnecting,
  error,
}

class VpnService extends ChangeNotifier {
  static final VpnService _instance = VpnService._internal();
  factory VpnService() => _instance;
  VpnService._internal();

  VpnState _state = VpnState.disconnected;
  String? _errorMessage;
  String? _connectedServer;
  DateTime? _connectedAt;
  double _uploadSpeed = 0;   // KB/s
  double _downloadSpeed = 0; // KB/s
  double _uploadTotal = 0;   // bytes
  double _downloadTotal = 0; // bytes

  Timer? _statsTimer;
  late final FlutterV2ray _v2ray = FlutterV2ray(
    onStatusChanged: _onStatusChanged,
  );
  bool _initialized = false;

  // ── Getters ────────────────────────────────────────────────────────────────
  VpnState get state => _state;
  bool get isConnected => _state == VpnState.connected;
  bool get isBusy => _state == VpnState.connecting || _state == VpnState.disconnecting;
  String? get errorMessage => _errorMessage;
  String? get connectedServer => _connectedServer;
  DateTime? get connectedAt => _connectedAt;
  double get uploadSpeedKBs => _uploadSpeed;
  double get downloadSpeedKBs => _downloadSpeed;
  double get uploadTotalMB => _uploadTotal / 1_048_576;
  double get downloadTotalMB => _downloadTotal / 1_048_576;

  String get statusLabel {
    switch (_state) {
      case VpnState.connecting:    return 'Connexion en cours…';
      case VpnState.connected:     return 'Connecté';
      case VpnState.disconnecting: return 'Déconnexion…';
      case VpnState.error:         return 'Erreur';
      case VpnState.disconnected:  return 'Déconnecté';
    }
  }

  String get connectedDuration {
    if (_connectedAt == null) return '—';
    final diff = DateTime.now().difference(_connectedAt!);
    final h = diff.inHours.toString().padLeft(2, '0');
    final m = (diff.inMinutes % 60).toString().padLeft(2, '0');
    final s = (diff.inSeconds % 60).toString().padLeft(2, '0');
    return '$h:$m:$s';
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  Future<void> initialize() async {
    if (_initialized) return;
    _initialized = true;
    await _v2ray.initializeV2Ray(
      notificationIconResourceType: 'drawable',
      notificationIconResourceName: 'ic_launcher_background',
    );
  }

  // ── Status callback from native ────────────────────────────────────────────
  void _onStatusChanged(V2RayStatus status) {
    switch (status.state) {
      case 'CONNECTED':
        _state = VpnState.connected;
        _connectedAt ??= DateTime.now();
        _startStatsTimer();
      case 'CONNECTING':
        _state = VpnState.connecting;
      case 'DISCONNECTED':
        _state = VpnState.disconnected;
        _connectedAt = null;
        _stopStatsTimer();
        _resetSpeeds();
      case 'DISCONNECTING':
        _state = VpnState.disconnecting;
        _stopStatsTimer();
      default:
        if (status.state.contains('ERROR') || status.state.contains('FAIL')) {
          _state = VpnState.error;
          _errorMessage = status.state;
          _stopStatsTimer();
        }
    }
    notifyListeners();
  }

  // ── Connect ────────────────────────────────────────────────────────────────
  Future<bool> connect({String? serverRemark}) async {
    if (isBusy || _state == VpnState.connected) return false;

    _setState(VpnState.connecting);
    _errorMessage = null;

    try {
      // Ask for VPN permission (Android shows system dialog first time)
      final hasPermission = await FlutterV2ray.requestPermission();
      if (!hasPermission) {
        _setState(VpnState.disconnected);
        _errorMessage = 'Permission VPN refusée';
        return false;
      }

      // Fetch VLESS/VMESS/TROJAN config URI from backend
      final configUri = await ApiService.getVpnConfig();
      if (configUri.isEmpty) {
        throw Exception('Aucune configuration VPN disponible');
      }

      // Parse the first URI in the config string
      final firstUri = configUri.trim().split('\n').first.trim();

      // Let flutter_v2ray parse the URI into a V2Ray JSON config
      final v2rayUrl = FlutterV2ray.parseFromURL(firstUri);

      _connectedServer = serverRemark ?? v2rayUrl.remark;

      // Start the VPN — this shows the key icon + persistent notification
      await _v2ray.startV2Ray(
        remark: _connectedServer ?? 'Stuff The VPN',
        config: v2rayUrl.fullConfiguration,
        blockedApps: null,    // null = route ALL traffic through VPN
        bypassSubnets: null,
        proxyOnly: false,     // true = proxy mode (no key icon), false = full VPN
      );

      return true;
    } catch (e) {
      _setState(VpnState.error);
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      return false;
    }
  }

  // ── Disconnect ────────────────────────────────────────────────────────────
  Future<void> disconnect() async {
    if (_state == VpnState.disconnected) return;
    _setState(VpnState.disconnecting);
    await _v2ray.stopV2Ray();
  }

  // ── Speed stats timer ─────────────────────────────────────────────────────
  void _startStatsTimer() {
    _statsTimer?.cancel();
    _statsTimer = Timer.periodic(const Duration(seconds: 1), (_) async {
      try {
        final stats = await _v2ray.queryStats();
        _downloadSpeed = (stats.download) / 1024;  // bytes/s → KB/s
        _uploadSpeed   = (stats.upload)   / 1024;
        _uploadTotal   += stats.upload;
        _downloadTotal += stats.download;
        notifyListeners();
      } catch (_) {}
    });
  }

  void _stopStatsTimer() {
    _statsTimer?.cancel();
    _statsTimer = null;
  }

  void _resetSpeeds() {
    _uploadSpeed = 0;
    _downloadSpeed = 0;
    notifyListeners();
  }

  void _setState(VpnState s) {
    _state = s;
    notifyListeners();
  }

  @override
  void dispose() {
    _stopStatsTimer();
    super.dispose();
  }
}
