/// vpn_link_builder.dart
///
/// Convertit un [VpnConfig] (reçu du backend via /sxb/import ou
/// /mobile/config) en lien de partage V2Ray/Xray standard (vless://,
/// vmess://, trojan://, ss://) que flutter_v2ray_client sait parser
/// nativement.
library;

import 'dart:convert';
import '../../models/quota.dart';

const Set<String> supportedRealVpnProtocols = {
  'VLESS', 'VLESS_REALITY', 'VMESS', 'TROJAN', 'TROJAN_GO',
  'SHADOWSOCKS', 'SHADOWSOCKS_R',
};

bool isProtocolSupported(String? protocol) =>
    protocol != null && supportedRealVpnProtocols.contains(protocol.toUpperCase());

/// Construit le lien de partage adapté au protocole, ou `null` si le
/// protocole n'est pas encore supporté pour une connexion VPN réelle
/// (WireGuard / SSH / OpenVPN nécessitent un moteur natif dédié).
String? buildShareLink(VpnConfig c) {
  final protocol = (c.protocol ?? '').toUpperCase();
  final raw = c.config ?? {};
  final host = c.serverAddress ?? raw['host']?.toString() ?? '';
  final port = c.serverPort ?? int.tryParse(raw['port']?.toString() ?? '') ?? 443;
  final remark = c.remark ?? raw['remark']?.toString() ?? 'SxBVPN';

  switch (protocol) {
    case 'VLESS':
    case 'VLESS_REALITY':
      return _buildVless(raw, host, port, remark, isReality: protocol == 'VLESS_REALITY');
    case 'VMESS':
      return _buildVmess(raw, host, port, remark);
    case 'TROJAN':
    case 'TROJAN_GO':
      return _buildTrojan(raw, host, port, remark);
    case 'SHADOWSOCKS':
    case 'SHADOWSOCKS_R':
      return _buildShadowsocks(raw, host, port, remark);
    default:
      return null;
  }
}

String? _s(Map<String, dynamic> m, String key) => m[key]?.toString();

String _buildVless(Map<String, dynamic> raw, String host, int port, String remark, {required bool isReality}) {
  final uuid = _s(raw, 'uuid') ?? '';
  final params = <String, String>{
    'type': _s(raw, 'network') ?? 'tcp',
    'security': isReality ? 'reality' : ((raw['tls'] == true) ? 'tls' : 'none'),
  };
  final path = _s(raw, 'path');
  final sni = _s(raw, 'sni');
  final fp = _s(raw, 'fp');
  if (path != null && path.isNotEmpty) params['path'] = path;
  if (sni != null && sni.isNotEmpty) params['sni'] = sni;
  if (fp != null && fp.isNotEmpty) params['fp'] = fp;
  if (isReality) {
    final pbk = _s(raw, 'pbk');
    final sid = _s(raw, 'sid');
    if (pbk != null) params['pbk'] = pbk;
    if (sid != null) params['sid'] = sid;
  }
  final query = params.entries
      .map((e) => '${Uri.encodeQueryComponent(e.key)}=${Uri.encodeQueryComponent(e.value)}')
      .join('&');
  return 'vless://$uuid@$host:$port?$query#${Uri.encodeComponent(remark)}';
}

String _buildVmess(Map<String, dynamic> raw, String host, int port, String remark) {
  final vmessObj = {
    'v': '2', 'ps': remark, 'add': host, 'port': port.toString(),
    'id': _s(raw, 'uuid') ?? '', 'aid': '0', 'scy': 'auto',
    'net': _s(raw, 'network') ?? 'tcp', 'type': 'none',
    'host': _s(raw, 'sni') ?? '', 'path': _s(raw, 'path') ?? '',
    'tls': (raw['tls'] == true) ? 'tls' : '', 'sni': _s(raw, 'sni') ?? '',
  };
  final b64 = base64.encode(utf8.encode(jsonEncode(vmessObj)));
  return 'vmess://$b64';
}

String _buildTrojan(Map<String, dynamic> raw, String host, int port, String remark) {
  final password = _s(raw, 'password') ?? '';
  final params = <String, String>{};
  final sni = _s(raw, 'sni');
  final path = _s(raw, 'path');
  final network = _s(raw, 'network');
  if (sni != null && sni.isNotEmpty) params['sni'] = sni;
  if (path != null && path.isNotEmpty) params['path'] = path;
  if (network != null) params['type'] = network;
  final query = params.entries
      .map((e) => '${Uri.encodeQueryComponent(e.key)}=${Uri.encodeQueryComponent(e.value)}')
      .join('&');
  final qs = query.isNotEmpty ? '?$query' : '';
  return 'trojan://$password@$host:$port$qs#${Uri.encodeComponent(remark)}';
}

String _buildShadowsocks(Map<String, dynamic> raw, String host, int port, String remark) {
  final method = _s(raw, 'method') ?? 'aes-256-gcm';
  final password = _s(raw, 'password') ?? '';
  final userinfo = base64.encode(utf8.encode('$method:$password'));
  return 'ss://$userinfo@$host:$port#${Uri.encodeComponent(remark)}';
}
