import 'package:flutter/foundation.dart';

class ApiEndpoints {
  // Development: http://localhost:5000/api
  // Production: https://api.sxbvpn.com/api
  // Change this via environment or build config
  static const String _baseUrlDev = 'http://localhost:5000/api';
  static const String _baseUrlProd = 'https://api.sxbvpn.com/api';

  static String get baseUrl {
    // Use kReleaseMode to switch between dev and prod
    // You can also use --dart-define=BACKEND_URL=http://localhost:5000/api
    const definedUrl = String.fromEnvironment('BACKEND_URL');
    if (definedUrl.isNotEmpty) return definedUrl;
    return kReleaseMode ? _baseUrlProd : _baseUrlDev;
  }

  // Auth
  static const String login = '/auth/login';             // Email/password login
  static const String loginLicense = '/auth/login-license'; // License-based login
  static const String refresh = '/auth/refresh';
  static const String register = '/auth/register';
  static const String me = '/auth/me';
  static const String logout = '/auth/logout';

  // VPN
  static const String myConfig = '/vpn/my-config';
  static const String servers = '/vpn/servers';
  static const String recommendedServer = '/vpn/recommended';
  static const String vpnConfig = '/vpn/config';
  static const String vpnStatus = '/vpn/status';
  static const String vpnConnect = '/vpn/connect';
  static const String vpnDisconnect = '/vpn/disconnect';

  // Users
  static String user(String id) => '/users/$id';
  static const String userProfile = '/user/profile';
  static const String userSubscription = '/user/subscription';
  static const String userStatus = '/user/status';
  static String usage(String userId) => '/usage/$userId';

  // Plans
  static const String activePlans = '/plans/active';

  // Vouchers
  static const String redeemVoucher = '/vouchers/redeem';

  // Licenses
  static const String validateLicense = '/licenses/validate';
  static const String bindDevice = '/licenses/bind-device';
  static const String resetDevice = '/licenses/reset-device';
  static const String revokeLicense = '/licenses/revoke';
  static const String generateLicense = '/licenses/generate';
}