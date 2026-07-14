import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../models/models.dart';

/// VPN connection status
enum VpnConnectionStatus {
  disconnected,
  connecting,
  connected,
  disconnecting,
  error,
}

/// VPN Service for managing real VPN connections
/// Uses vpn_engine package for native VPN functionality
class VpnService {
  static VpnService? _instance;
  static VpnService get instance {
    _instance ??= VpnService._();
    return _instance!;
  }

  VpnService._();

  VpnConnectionStatus _status = VpnConnectionStatus.disconnected;
  DateTime? _connectedAt;
  Map<String, dynamic>? _currentConfig;
  String? _currentToken;
  String _serverIp = '';
  String _protocol = 'VLESS';

  // Stream controller for status updates
  final _statusController = StreamController<VpnConnectionStatus>.broadcast();
  Stream<VpnConnectionStatus> get statusStream => _statusController.stream;

  VpnConnectionStatus get status => _status;
  DateTime? get connectedAt => _connectedAt;
  String get serverIp => _serverIp;
  String get protocol => _protocol;

  Duration get connectedDuration {
    if (_connectedAt == null) return Duration.zero;
    return DateTime.now().difference(_connectedAt!);
  }

  /// Connect to VPN using imported config
  Future<bool> connect(Map<String, dynamic> config, String token) async {
    if (_status == VpnConnectionStatus.connecting) {
      return false;
    }

    try {
      _updateStatus(VpnConnectionStatus.connecting);
      _currentConfig = config;
      _currentToken = token;

      // Extract config details
      _serverIp = config['server'] ?? '';
      _protocol = config['protocol']?.toString().toUpperCase() ?? 'VLESS';

      // Simulate connection for demo
      // In production, this would use vpn_engine to establish real VPN connection
      await Future.delayed(const Duration(seconds: 2));

      // For Xray/V2Ray VPN, we need to convert config to proper format
      final vpnConfig = _buildVpnConfig(config);
      debugPrint('[VPN] Config prepared: ${jsonEncode(vpnConfig)}');

      // TODO: In production, use vpn_engine:
      // await VpnEngine.startVpn(vpnConfig);
      
      _connectedAt = DateTime.now();
      _updateStatus(VpnConnectionStatus.connected);
      return true;
    } catch (e) {
      debugPrint('[VPN] Connection error: $e');
      _updateStatus(VpnConnectionStatus.error);
      return false;
    }
  }

  /// Disconnect from VPN
  Future<void> disconnect() async {
    if (_status == VpnConnectionStatus.disconnected) {
      return;
    }

    try {
      _updateStatus(VpnConnectionStatus.disconnecting);

      // TODO: In production:
      // await VpnEngine.stopVpn();

      await Future.delayed(const Duration(seconds: 1));

      _connectedAt = null;
      _currentConfig = null;
      _currentToken = null;
      _serverIp = '';
      _updateStatus(VpnConnectionStatus.disconnected);
    } catch (e) {
      debugPrint('[VPN] Disconnect error: $e');
      _updateStatus(VpnConnectionStatus.error);
    }
  }

  /// Build VPN configuration for vpn_engine
  Map<String, dynamic> _buildVpnConfig(Map<String, dynamic> config) {
    final protocol = config['protocol']?.toString().toLowerCase() ?? 'vless';

    if (protocol == 'vless') {
      return {
        'type': 'vless',
        'version': 'xtls',
        'serverAddress': config['server'] ?? '',
        'serverPort': config['port'] ?? 443,
        'uuid': config['uuid'] ?? '',
        'flow': config['flow'] ?? 'xtls-rprx-vision',
        'security': config['security'] ?? 'reality',
        'network': config['network'] ?? 'tcp',
        // Reality settings
        'dest': config['dest'] ?? 'www.microsoft.com:443',
        'serverNames': config['serverNames'] ?? ['www.microsoft.com'],
        'publicKey': config['publicKey'] ?? '',
        'shortId': config['shortId'] ?? '',
      };
    } else if (protocol == 'vmess') {
      return {
        'type': 'vmess',
        'version': 'v2ray',
        'serverAddress': config['server'] ?? '',
        'serverPort': config['port'] ?? 443,
        'uuid': config['uuid'] ?? '',
        'alterId': config['alterId'] ?? 0,
        'security': config['security'] ?? 'auto',
        'network': config['network'] ?? 'tcp',
        // TLS settings
        'tls': config['tls'] ?? true,
      };
    } else if (protocol == 'trojan') {
      return {
        'type': 'trojan',
        'serverAddress': config['server'] ?? '',
        'serverPort': config['port'] ?? 443,
        'password': config['password'] ?? '',
        'sni': config['sni'] ?? '',
      };
    }

    // Default fallback
    return config;
  }

  /// Update connection status
  void _updateStatus(VpnConnectionStatus newStatus) {
    _status = newStatus;
    _statusController.add(newStatus);
  }

  /// Check if VPN permission is granted
  Future<bool> hasPermission() async {
    // TODO: Implement actual permission check using vpn_engine
    return true;
  }

  /// Request VPN permission
  Future<bool> requestPermission() async {
    // TODO: Implement actual permission request using vpn_engine
    return true;
  }

  /// Get connection statistics
  Map<String, dynamic> getStats() {
    return {
      'status': _status.name,
      'connectedAt': _connectedAt?.toIso8601String(),
      'duration': connectedDuration.inSeconds,
      'serverIp': _serverIp,
      'protocol': _protocol,
    };
  }

  /// Dispose resources
  void dispose() {
    _statusController.close();
  }
}

/// Extension to convert status to display string
extension VpnStatusExtension on VpnConnectionStatus {
  String get displayName {
    switch (this) {
      case VpnConnectionStatus.disconnected:
        return 'Déconnecté';
      case VpnConnectionStatus.connecting:
        return 'Connexion...';
      case VpnConnectionStatus.connected:
        return 'Connecté';
      case VpnConnectionStatus.disconnecting:
        return 'Déconnexion...';
      case VpnConnectionStatus.error:
        return 'Erreur';
    }
  }

  bool get isActive => this == VpnConnectionStatus.connected;
  bool get isTransitioning =>
      this == VpnConnectionStatus.connecting ||
      this == VpnConnectionStatus.disconnecting;
}
