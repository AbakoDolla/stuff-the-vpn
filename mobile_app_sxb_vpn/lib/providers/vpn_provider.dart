import 'package:flutter/foundation.dart';
import '../services/api_service.dart';

enum VpnConnectionState { disconnected, connecting, connected, disconnecting, error }

class VpnServer {
  final String id;
  final String name;
  final String? flag;
  final String protocol;
  final bool isPremium;

  VpnServer({
    required this.id,
    required this.name,
    this.flag,
    required this.protocol,
    this.isPremium = false,
  });

  factory VpnServer.fromJson(Map<String, dynamic> json) => VpnServer(
        id: json['id'] as String,
        name: json['name'] as String? ?? json['remark'] as String? ?? 'Server',
        flag: json['flag'] as String?,
        protocol: json['protocol'] as String? ?? 'VLESS',
        isPremium: json['isPremium'] as bool? ?? false,
      );
}

class VpnProvider extends ChangeNotifier {
  final ApiService _api;

  VpnConnectionState state = VpnConnectionState.disconnected;
  List<VpnServer> servers = [];
  VpnServer? selectedServer;
  bool isLoadingServers = false;

  VpnProvider(this._api);

  Future<void> loadServers() async {
    isLoadingServers = true;
    notifyListeners();
    try {
      final raw = await _api.getServers();
      servers = raw
          .map((e) => VpnServer.fromJson(e as Map<String, dynamic>))
          .toList();
      selectedServer ??= servers.isNotEmpty ? servers.first : null;
    } catch (_) {
      servers = [];
    } finally {
      isLoadingServers = false;
      notifyListeners();
    }
  }

  void selectServer(VpnServer server) {
    selectedServer = server;
    notifyListeners();
  }

  Future<void> connect() async {
    if (selectedServer == null) return;
    state = VpnConnectionState.connecting;
    notifyListeners();
    // TODO: intégration flutter_v2ray réelle (Phase mobile suivante)
    await Future<void>.delayed(const Duration(seconds: 1));
    state = VpnConnectionState.connected;
    notifyListeners();
  }

  Future<void> disconnect() async {
    state = VpnConnectionState.disconnecting;
    notifyListeners();
    await Future<void>.delayed(const Duration(milliseconds: 500));
    state = VpnConnectionState.disconnected;
    notifyListeners();
  }
}
