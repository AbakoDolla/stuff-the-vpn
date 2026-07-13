/// openvpn_engine.dart
///
/// Encapsule axevpn_flutter (OpenVPN) : demande la permission VPN Android,
/// démarre/arrête un vrai tunnel OpenVPN à partir de la config .ovpn brute
/// stockée côté backend (Inbound.ovpnConfig) — remplace toute simulation.
library;

import 'dart:async';
import 'package:axevpn_flutter/openvpn_flutter.dart';

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

class OpenVpnEngine {
  OpenVpnEngine._internal() {
    _openvpn = OpenVPN(
      onVpnStatusChanged: _onStatus,
      onVpnStageChanged: _onStage,
    );
  }
  static final OpenVpnEngine instance = OpenVpnEngine._internal();

  late final OpenVPN _openvpn;
  bool _initialized = false;
  DateTime? _connectedAt;

  final _statusController = StreamController<RealVpnStatus>.broadcast();
  Stream<RealVpnStatus> get statusStream => _statusController.stream;

  Future<void> _ensureInitialized() async {
    if (_initialized) return;
    await _openvpn.initialize(
      groupIdentifier: 'group.com.stuffthevpn.app',
      providerBundleIdentifier: 'com.stuffthevpn.app.VPNExtension',
      localizedDescription: 'SxBVPN',
    );
    _initialized = true;
  }

  int _bytesToInt(String? s) {
    if (s == null) return 0;
    return int.tryParse(s.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0;
  }

  void _onStatus(VpnStatus? status) {
    if (status == null) return;
    _statusController.add(RealVpnStatus(
      state: _connectedAt != null ? RealVpnState.connected : RealVpnState.disconnected,
      uploadSpeedBps: _bytesToInt(status.byteOut),
      downloadSpeedBps: _bytesToInt(status.byteIn),
      duration: status.connectedOn != null
          ? DateTime.now().difference(status.connectedOn!)
          : Duration.zero,
    ));
  }

  void _onStage(VPNStage stage, String rawStage) {
    final s = rawStage.toUpperCase();
    if (s.contains('CONNECTED') && !s.contains('DIS')) {
      _connectedAt ??= DateTime.now();
      _statusController.add(RealVpnStatus(state: RealVpnState.connected));
    } else if (s.contains('CONNECTING') || s.contains('AUTH') || s.contains('WAIT') || s.contains('PREPARE')) {
      _statusController.add(const RealVpnStatus(state: RealVpnState.connecting));
    } else if (s.contains('ERROR') || s.contains('DENIED')) {
      _connectedAt = null;
      _statusController.add(RealVpnStatus(
        state: s.contains('DENIED') ? RealVpnState.permissionDenied : RealVpnState.error,
        errorMessage: 'Échec OpenVPN: $rawStage',
      ));
    } else {
      _connectedAt = null;
      _statusController.add(const RealVpnStatus(state: RealVpnState.disconnected));
    }
  }

  /// Démarre un vrai tunnel OpenVPN à partir du contenu brut d'un fichier
  /// .ovpn (tel que stocké dans Inbound.ovpnConfig côté backend).
  Future<void> connect({
    required String ovpnConfig,
    required String remark,
    String? username,
    String? password,
  }) async {
    await _ensureInitialized();

    try {
      await _openvpn.connect(
        ovpnConfig,
        remark,
        username: username,
        password: password,
        bypassPackages: [],
        certIsRequired: false,
      );
    } catch (e) {
      _statusController.add(RealVpnStatus(
        state: RealVpnState.error,
        errorMessage: e.toString(),
      ));
    }
  }

  Future<void> disconnect() async {
    _openvpn.disconnect();
    _connectedAt = null;
    _statusController.add(const RealVpnStatus(state: RealVpnState.disconnected));
  }

  void dispose() {
    _statusController.close();
  }
}
