import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';

const _base = 'http://185.237.15.214/api';
const _timeout = Duration(seconds: 15);

class ApiService {
  static String? _token;

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('sxb_token');
  }

  static Future<void> _saveToken(String token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('sxb_token', token);
  }

  static Future<void> clearAuth() async {
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('sxb_token');
    await prefs.remove('sxb_user');
  }

  static Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  static Future<Map<String, dynamic>> _parse(http.Response res) {
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode >= 200 && res.statusCode < 300) return Future.value(body);
    throw ApiException(body['message'] as String? ?? 'Erreur ${res.statusCode}', res.statusCode);
  }

  static Future<Map<String, dynamic>> loginWithPassword(String email, String password) async {
    final res = await http
        .post(
          Uri.parse('$_base/auth/login'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'email': email, 'password': password}),
        )
        .timeout(_timeout);
    final body = await _parse(res);
    final data = body['data'] as Map<String, dynamic>;
    await _saveToken(data['token'] as String);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('sxb_user', jsonEncode(data['user']));
    return data;
  }

  static Future<Map<String, dynamic>> loginWithLicense(
    String licenseToken,
    String phone,
    String deviceId, {
    String? deviceName,
  }) async {
    final res = await http
        .post(
          Uri.parse('$_base/auth/license'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'token': licenseToken,
            'phone': phone,
            'deviceId': deviceId,
            'deviceName': deviceName ?? 'Mobile App',
          }),
        )
        .timeout(_timeout);
    final body = await _parse(res);
    final data = body['data'] as Map<String, dynamic>;
    await _saveToken(data['token'] as String);
    return data;
  }

  static Future<AppUser> getMe() async {
    final res = await http
        .get(Uri.parse('$_base/auth/me'), headers: _headers)
        .timeout(_timeout);
    final body = await _parse(res);
    return AppUser.fromJson(body['data'] as Map<String, dynamic>);
  }

  static Future<VpnStatus> getVpnStatus() async {
    final res = await http
        .get(Uri.parse('$_base/vpn/status'), headers: _headers)
        .timeout(_timeout);
    final body = await _parse(res);
    return VpnStatus.fromJson(body['data'] as Map<String, dynamic>);
  }

  static Future<String> getVpnConfig() async {
    final res = await http
        .get(Uri.parse('$_base/vpn/my-config'), headers: _headers)
        .timeout(_timeout);
    final body = await _parse(res);
    return (body['data'] as Map<String, dynamic>)['config'] as String? ?? '';
  }

  static Future<void> redeemVoucher(String code) async {
    final me = await getMe();
    final res = await http
        .post(
          Uri.parse('$_base/vouchers/redeem'),
          headers: _headers,
          body: jsonEncode({'code': code, 'userId': me.id}),
        )
        .timeout(_timeout);
    await _parse(res);
  }

  static Future<List<Map<String, dynamic>>> getServers() async {
    final res = await http
        .get(Uri.parse('$_base/vpn/servers'), headers: _headers)
        .timeout(_timeout);
    final body = await _parse(res);
    final data = body['data'];
    if (data is List) return data.cast<Map<String, dynamic>>();
    return [];
  }

  static Future<void> changePassword(String current, String newPw) async {
    final res = await http
        .patch(
          Uri.parse('$_base/user/password'),
          headers: _headers,
          body: jsonEncode({'currentPassword': current, 'newPassword': newPw}),
        )
        .timeout(_timeout);
    await _parse(res);
  }
}

class ApiException implements Exception {
  final String message;
  final int statusCode;
  ApiException(this.message, this.statusCode);

  @override
  String toString() => message;
}
