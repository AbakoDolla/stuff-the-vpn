class VpnConfigModel {
  final String id;
  final String remark;
  final String protocol;
  final String host;
  final int port;

  // V2Ray (VLESS/VMESS)
  final String? uuid;
  final String? network;
  final bool tls;
  final String? sni;
  final String? path;
  final String? pbk;  // REALITY public key
  final String? sid;  // REALITY short ID
  final String? fp;   // fingerprint

  // Trojan
  final String? password;

  // Shadowsocks
  final String? method;

  // WireGuard
  final String? publicKey;
  final String? allowedIps;
  final String? dns;
  final int mtu;

  // SSH / SlowDNS
  final String? username;
  final String? sshPassword;
  final String? sshPayload;
  final String? slowDnsNs;

  // OpenVPN
  final String? ovpnConfig;

  // Meta
  final bool isPremium;
  final int? ping;

  // Legacy fields (kept for backward compat)
  final double? quotaRemainingGB;
  final String? config;

  const VpnConfigModel({
    required this.id,
    required this.remark,
    required this.protocol,
    required this.host,
    required this.port,
    this.uuid,
    this.network,
    this.tls = false,
    this.sni,
    this.path,
    this.pbk,
    this.sid,
    this.fp,
    this.password,
    this.method,
    this.publicKey,
    this.allowedIps,
    this.dns,
    this.mtu = 1420,
    this.username,
    this.sshPassword,
    this.sshPayload,
    this.slowDnsNs,
    this.ovpnConfig,
    this.isPremium = false,
    this.ping,
    this.quotaRemainingGB,
    this.config,
  });

  /// Display-friendly protocol label
  String get protocolLabel {
    switch (protocol.toUpperCase()) {
      case 'VLESS': return 'VLESS';
      case 'VLESS_REALITY': return 'VLESS Reality';
      case 'VMESS': return 'VMess';
      case 'TROJAN':
      case 'TROJAN_GO': return 'Trojan';
      case 'SHADOWSOCKS':
      case 'SHADOWSOCKS_R': return 'Shadowsocks';
      case 'WIREGUARD': return 'WireGuard';
      case 'SSH': return 'SSH';
      case 'SSH_TLS': return 'SSH/TLS';
      case 'SSH_SLOWDNS': return 'SlowDNS';
      case 'OPENVPN': return 'OpenVPN';
      default: return protocol;
    }
  }

  /// Short country/location from remark
  String get serverHost => host;
  int? get serverPort => port;

  factory VpnConfigModel.fromJson(Map<String, dynamic> json) {
    return VpnConfigModel(
      id:               json['id']?.toString()       ?? '',
      remark:           json['remark']?.toString()   ?? json['host']?.toString() ?? '',
      protocol:         json['protocol']?.toString() ?? 'VLESS',
      host:             json['host']?.toString()     ?? '',
      port:             _toInt(json['port'])          ?? 443,
      uuid:             json['uuid']?.toString(),
      network:          json['network']?.toString(),
      tls:              json['tls'] as bool? ?? false,
      sni:              json['sni']?.toString(),
      path:             json['path']?.toString(),
      pbk:              json['pbk']?.toString(),
      sid:              json['sid']?.toString(),
      fp:               json['fp']?.toString(),
      password:         json['password']?.toString(),
      method:           json['method']?.toString(),
      publicKey:        json['publicKey']?.toString(),
      allowedIps:       json['allowedIps']?.toString(),
      dns:              json['dns']?.toString(),
      mtu:              _toInt(json['mtu']) ?? 1420,
      username:         json['username']?.toString(),
      sshPassword:      json['sshPassword']?.toString(),
      sshPayload:       json['sshPayload']?.toString() ?? json['payload']?.toString(),
      slowDnsNs:        json['slowDnsNs']?.toString(),
      ovpnConfig:       json['ovpnConfig']?.toString() ?? json['config']?.toString(),
      isPremium:        json['isPremium'] as bool? ?? false,
      ping:             _toInt(json['ping']),
      quotaRemainingGB: _toDouble(json['quotaRemainingGB'] ?? json['dataRemaining']),
      config:           json['ovpnConfig']?.toString() ?? json['config']?.toString(),
    );
  }

  static int? _toInt(dynamic v) {
    if (v == null) return null;
    if (v is int) return v;
    if (v is double) return v.toInt();
    return int.tryParse(v.toString());
  }

  static double? _toDouble(dynamic v) {
    if (v == null) return null;
    if (v is double) return v;
    if (v is int) return v.toDouble();
    return double.tryParse(v.toString());
  }
}
