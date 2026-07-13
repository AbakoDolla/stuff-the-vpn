/// vpn_link_builder.dart
///
/// Convertit un [VpnConfigModel] (reçu du backend, un par inbound actif)
/// en lien de partage V2Ray/Xray standard (vless://, vmess://, trojan://,
/// ss://) que flutter_v2ray_client sait parser nativement via
/// `V2ray.parseFromURL()`.
///
/// Protocoles gérés nativement par le tunnel VPN réel :
///   VLESS, VLESS_REALITY, VMESS, TROJAN, TROJAN_GO,
///   SHADOWSOCKS, SHADOWSOCKS_R, OPENVPN
///
/// Protocoles NON encore supportés pour une connexion VPN réelle sur
/// mobile (nécessitent un plugin natif dédié différent) :
///   WIREGUARD, SSH*, SLOWDNS
library;

import 'dart:convert';
import '../../models/vpn_config_model.dart';

/// Protocoles pour lesquels une vraie connexion VPN est actuellement possible.
const Set<String> supportedRealVpnProtocols = {
  'VLESS',
  'VLESS_REALITY',
  'VMESS',
  'TROJAN',
  'TROJAN_GO',
  'SHADOWSOCKS',
  'SHADOWSOCKS_R',
  'OPENVPN', // OpenVPN via axevpn_flutter
};

bool isProtocolSupported(String protocol) =>
    supportedRealVpnProtocols.contains(protocol.toUpperCase());

/// Vérifie si le protocole est OpenVPN (nécessite un traitement spécial)
bool isOpenVpnProtocol(String protocol) =>
    protocol.toUpperCase() == 'OPENVPN';

/// Construit le lien de partage adapté au protocole, ou `null` si le
/// protocole n'est pas encore supporté pour une connexion VPN réelle.
String? buildShareLink(VpnConfigModel c) {
  final protocol = c.protocol.toUpperCase();
  switch (protocol) {
    case 'VLESS':
    case 'VLESS_REALITY':
      return _buildVless(c, isReality: protocol == 'VLESS_REALITY');
    case 'VMESS':
      return _buildVmess(c);
    case 'TROJAN':
    case 'TROJAN_GO':
      return _buildTrojan(c);
    case 'SHADOWSOCKS':
    case 'SHADOWSOCKS_R':
      return _buildShadowsocks(c);
    case 'OPENVPN':
      // OpenVPN utilise ovpnConfig directement, pas de share link
      return null;
    default:
      return null; // WIREGUARD / SSH* / SLOWDNS — pas de tunnel réel encore
  }
}

String _buildVless(VpnConfigModel c, {required bool isReality}) {
  final params = <String, String>{
    'type': c.network ?? 'tcp',
    'security': isReality ? 'reality' : (c.tls ? 'tls' : 'none'),
  };
  if (c.path != null && c.path!.isNotEmpty) params['path'] = c.path!;
  if (c.sni != null && c.sni!.isNotEmpty) params['sni'] = c.sni!;
  if (c.fp != null && c.fp!.isNotEmpty) params['fp'] = c.fp!;
  if (isReality) {
    if (c.pbk != null) params['pbk'] = c.pbk!;
    if (c.sid != null) params['sid'] = c.sid!;
  }
  final query = params.entries
      .map((e) => '${Uri.encodeQueryComponent(e.key)}=${Uri.encodeQueryComponent(e.value)}')
      .join('&');
  final remark = Uri.encodeComponent(c.remark);
  return 'vless://${c.uuid}@${c.host}:${c.port}?$query#$remark';
}

String _buildVmess(VpnConfigModel c) {
  final vmessObj = {
    'v': '2',
    'ps': c.remark,
    'add': c.host,
    'port': c.port.toString(),
    'id': c.uuid,
    'aid': '0',
    'scy': 'auto',
    'net': c.network ?? 'tcp',
    'type': 'none',
    'host': c.sni ?? '',
    'path': c.path ?? '',
    'tls': c.tls ? 'tls' : '',
    'sni': c.sni ?? '',
  };
  final b64 = base64.encode(utf8.encode(jsonEncode(vmessObj)));
  return 'vmess://$b64';
}

String _buildTrojan(VpnConfigModel c) {
  final params = <String, String>{};
  if (c.sni != null && c.sni!.isNotEmpty) params['sni'] = c.sni!;
  if (c.path != null && c.path!.isNotEmpty) params['path'] = c.path!;
  if (c.network != null) params['type'] = c.network!;
  final query = params.entries
      .map((e) => '${Uri.encodeQueryComponent(e.key)}=${Uri.encodeQueryComponent(e.value)}')
      .join('&');
  final remark = Uri.encodeComponent(c.remark);
  final qs = query.isNotEmpty ? '?$query' : '';
  return 'trojan://${c.password}@${c.host}:${c.port}$qs#$remark';
}

String _buildShadowsocks(VpnConfigModel c) {
  final method = c.method ?? 'aes-256-gcm';
  final userinfo = base64.encode(utf8.encode('$method:${c.password}'));
  final remark = Uri.encodeComponent(c.remark);
  return 'ss://$userinfo@${c.host}:${c.port}#$remark';
}
