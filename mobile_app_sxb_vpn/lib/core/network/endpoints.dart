import 'package:flutter/foundation.dart';

  class ApiEndpoints {
    // Configure at build time:
    // flutter build apk --dart-define=BACKEND_URL=https://api.sxbvpn.com/api
    static const String _baseUrlDev = 'http://10.0.2.2:5000/api';
    static const String _baseUrlProd = 'https://api.sxbvpn.com/api';

    static String get baseUrl {
      const definedUrl = String.fromEnvironment('BACKEND_URL');
      if (definedUrl.isNotEmpty) return definedUrl;
      return kReleaseMode ? _baseUrlProd : _baseUrlDev;
    }

    // Auth
    static const String login = '/auth/login';
    static const String loginLicense = '/auth/login-license';
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
    static String licenseStatus(String token) => '/licenses/$token/status';
  }
  