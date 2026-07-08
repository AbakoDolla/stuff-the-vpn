import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../models/models.dart';

/// API Service for communicating with the SXB VPN backend
/// Uses /api/mobile/* routes for mobile-specific endpoints
class ApiService {
  // Use environment variable for security - this is obfuscated in release builds
  static String get _baseUrl {
    final url = const String.fromEnvironment(
      'BACKEND_URL',
      defaultValue: 'https://vpnsxb.afrihall.com/api',
    );
    return url.endsWith('/') ? url.substring(0, url.length - 1) : url;
  }

  // Mobile API base URL
  String get _mobileBase => '$_baseUrl/mobile';
  
  String? _authToken;
  static ApiService? _instance;

  ApiService._();

  static ApiService get instance {
    _instance ??= ApiService._();
    return _instance!;
  }

  void setAuthToken(String? token) {
    _authToken = token;
  }

  Map<String, String> get _headers {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (_authToken != null) {
      headers['Authorization'] = 'Bearer $_authToken';
    }
    return headers;
  }

  Future<Map<String, dynamic>> _handleResponse(http.Response response) async {
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return body;
    }
    
    final error = body['message'] ?? body['error'] ?? 'Unknown error';
    throw ApiException(error.toString(), response.statusCode);
  }

  // ============ AUTHENTICATION ============

  /// Activate a device with a token (new cryptographic system)
  Future<Device> activateDevice({
    required String deviceId,
    required String token,
    String? deviceName,
    String? brand,
    String? model,
    String? osVersion,
    String? appVersion,
    String? phone,
    String? email,
  }) async {
    final response = await http.post(
      Uri.parse('$_mobileBase/device/activate'),
      headers: _headers,
      body: jsonEncode({
        'deviceId': deviceId,
        'token': token,
        'deviceName': deviceName,
        'brand': brand,
        'model': model,
        'osVersion': osVersion,
        'appVersion': appVersion,
        'phone': phone,
        'email': email,
      }),
    );
    
    final data = await _handleResponse(response);
    return Device.fromJson(data['data'] ?? data);
  }

  /// Activate with license token (legacy system)
  Future<Device> activateLicense({
    required String token,
    required String deviceId,
    String? deviceName,
    String? phone,
  }) async {
    final response = await http.post(
      Uri.parse('$_mobileBase/activate'),
      headers: _headers,
      body: jsonEncode({
        'token': token,
        'deviceId': deviceId,
        'deviceName': deviceName,
        'phone': phone,
      }),
    );
    
    final data = await _handleResponse(response);
    return Device.fromJson(data['data'] ?? data);
  }

  /// Check if a device is authorized
  Future<Device?> checkDeviceAuthorization(String deviceId) async {
    try {
      final response = await http.get(
        Uri.parse('$_mobileBase/subscription'),
        headers: _headers,
      );
      
      if (response.statusCode == 401 || response.statusCode == 403) {
        return null;
      }
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        return Device.fromJson({
          'id': deviceId,
          'deviceId': deviceId,
          'status': 'ACTIVE',
          'connectionCount': 0,
          'isCompromised': false,
          'createdAt': DateTime.now().toIso8601String(),
          'updatedAt': DateTime.now().toIso8601String(),
        });
      }
      
      return null;
    } catch (e) {
      return null;
    }
  }

  // ============ SYNC & DATA ============

  /// Sync device data with backend
  Future<Map<String, dynamic>> syncDevice(String deviceId) async {
    final response = await http.get(
      Uri.parse('$_mobileBase/sync'),
      headers: _headers,
    );
    
    return await _handleResponse(response);
  }

  /// Get subscription status (combines user + quota info)
  Future<Map<String, dynamic>> getSubscriptionStatus() async {
    final response = await http.get(
      Uri.parse('$_mobileBase/subscription'),
      headers: _headers,
    );
    
    return await _handleResponse(response);
  }

  /// Get user profile
  Future<User> getUserProfile() async {
    final sub = await getSubscriptionStatus();
    return User.fromJson({
      'id': sub['id'] ?? '',
      'status': sub['status'] ?? 'ACTIVE',
      'email': sub['email'],
      'quotaTotalGB': sub['dataLimit'] ?? 0,
      'quotaUsedGB': sub['dataUsed'] ?? 0,
    });
  }

  /// Get user quota information
  Future<Quota> getQuota() async {
    final sub = await getSubscriptionStatus();
    return Quota.fromJson({
      'id': 'quota',
      'totalGB': sub['dataLimit'] ?? 0,
      'usedGB': sub['dataUsed'] ?? 0,
      'status': sub['status'],
    });
  }

  /// Get notifications
  Future<List<AppNotification>> getNotifications({int limit = 50}) async {
    final response = await http.get(
      Uri.parse('$_baseUrl/notifications?limit=$limit'),
      headers: _headers,
    );
    
    final data = await _handleResponse(response);
    final notifications = data['data'] as List<dynamic>?;
    return notifications
        ?.map((n) => AppNotification.fromJson(n as Map<String, dynamic>))
        .toList() ?? [];
  }

  /// Mark notification as read
  Future<void> markNotificationRead(String notificationId) async {
    await http.patch(
      Uri.parse('$_baseUrl/notifications/$notificationId/read'),
      headers: _headers,
    );
  }

  /// Mark all notifications as read
  Future<void> markAllNotificationsRead() async {
    await http.patch(
      Uri.parse('$_baseUrl/notifications/read-all'),
      headers: _headers,
    );
  }

  // ============ VPN CONFIGURATION ============

  /// Get VPN configuration for the device
  Future<VpnConfig?> getVpnConfig() async {
    try {
      final response = await http.get(
        Uri.parse('$_mobileBase/config'),
        headers: _headers,
      );
      
      if (response.statusCode == 404) {
        return null;
      }
      
      final data = await _handleResponse(response);
      final profiles = data['data']?['profiles'] as List<dynamic>?;
      if (profiles != null && profiles.isNotEmpty) {
        final profile = profiles.first as Map<String, dynamic>;
        return VpnConfig.fromJson({
          'id': profile['id'] ?? '',
          'protocol': profile['protocol'],
          'serverAddress': profile['host'],
          'serverPort': profile['port'],
          'config': profile,
          'remark': profile['remark'],
          'isActive': true,
        });
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /// Get public IP address
  Future<String> getPublicIp() async {
    try {
      final response = await http.get(
        Uri.parse('https://api.ipify.org?format=json'),
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        return data['ip'] as String;
      }
    } catch (e) {
      // Fallback
    }
    return 'Unknown';
  }
	
  // ============ CONNECTION HISTORY ============

  /// Get connection history
  Future<List<ConnectionHistory>> getConnectionHistory({int limit = 50}) async {
    final response = await http.get(
      Uri.parse('$_mobileBase/logs?limit=$limit'),
      headers: _headers,
    );
    
    final data = await _handleResponse(response);
    final history = data['data'] as List<dynamic>?;
    return history
        ?.map((h) => ConnectionHistory.fromJson(h as Map<String, dynamic>))
        .toList() ?? [];
  }

  // ============ USAGE REPORTING ============

  /// Report device usage
  Future<void> reportUsage({
    double? uploadMB,
    double? downloadMB,
    int? sessionDuration,
    String? serverIp,
  }) async {
    await http.post(
      Uri.parse('$_mobileBase/usage'),
      headers: _headers,
      body: jsonEncode({
        if (uploadMB != null) 'uploadMB': uploadMB,
        if (downloadMB != null) 'downloadMB': downloadMB,
        if (sessionDuration != null) 'sessionDuration': sessionDuration,
        if (serverIp != null) 'serverIp': serverIp,
      }),
    );
  }

  // ============ APP INFO ============

  /// Get app version info
  Future<Map<String, dynamic>> getAppVersion() async {
    return {
      'version': '1.0.0',
      'buildNumber': 1,
      'minSupportedVersion': '1.0.0',
      'updateAvailable': false,
    };
  }
}

/// Custom API Exception
class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException(this.message, [this.statusCode]);

  @override
  String toString() => message;
}
