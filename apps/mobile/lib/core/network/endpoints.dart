import 'package:flutter/foundation.dart';

class ApiEndpoints {
  // Production: flutter build apk --dart-define=BACKEND_URL=https://vpnsxb.afrihall.com/api
  // Emulator dev:  http://10.0.2.2:4000/api
  static const String _baseUrlDev  = 'http://10.0.2.2:4000/api';
  static const String _baseUrlProd = 'https://vpnsxb.afrihall.com/api';

  static String get baseUrl {
    const defined = String.fromEnvironment('BACKEND_URL');
    if (defined.isNotEmpty) return defined;
    return kReleaseMode ? _baseUrlProd : _baseUrlDev;
  }

  // ── Auth ─────────────────────────────────────────────────────────────────
  static const String login        = '/auth/login';
  static const String loginLicense = '/mobile/activate'; // legacy
  static const String loginToken   = '/auth/token/login';  // new token login
  static const String deviceActivate = '/mobile/device/activate'; // new system
  static const String refresh      = '/auth/refresh';
  static const String register     = '/auth/register';
  static const String me           = '/auth/me';
  static const String logout       = '/auth/logout';

  // ── Simple Device Activation (NOUVEAU SYSTÈME) ────────────────────────────
  static const String deviceRegister = '/mobile-device/register'; // App s'enregistre
  static String deviceStatus(String deviceId) => '/mobile-device/$deviceId/status'; // Vérifier statut
  static String deviceSync(String deviceId) => '/mobile-device/$deviceId/sync'; // Synchroniser
  static String deviceConnect(String deviceId) => '/mobile-device/$deviceId/connect'; // Notifier connexion
  
  // ── VPN Config Sync (NOUVEAU SYSTÈME) ────────────────────────────────────
  static String deviceVpnConfigs(String deviceId) => '/mobile-device/$deviceId/vpn-configs';
  static String deviceFullSync(String deviceId) => '/mobile-device/$deviceId/full-sync';

  // ── Mobile API ────────────────────────────────────────────────────────────
  static const String mobileConfig       = '/mobile/config';
  static const String mobileSubscription = '/mobile/subscription';
  static const String mobileLogs         = '/mobile/logs';
  static const String mobileSync         = '/mobile/sync';
  static const String mobileUsage        = '/mobile/usage';

  // ── Notifications ─────────────────────────────────────────────────────────
  static const String notifications         = '/notifications';
  static String notificationRead(String id) => '/notifications/$id/read';
  static const String notificationsReadAll  = '/notifications/read-all';

  // ── Legacy VPN ────────────────────────────────────────────────────────────
  static const String myConfig          = '/vpn/my-config';
  static const String servers           = '/vpn/servers';
  static const String recommendedServer = '/vpn/recommended';
  static const String vpnStatus         = '/vpn/status';

  // ── Users ─────────────────────────────────────────────────────────────────
  static String user(String id)        => '/users/$id';
  static const String userProfile      = '/user/profile';
  static const String userSubscription = '/mobile/subscription'; // Use mobile endpoint
  static const String userStatus       = '/user/status';
  static String usage(String userId)   => '/users/$userId/usage';

  // ── Plans & Vouchers ──────────────────────────────────────────────────────
  static const String activePlans   = '/plans/active';
  static const String redeemVoucher = '/vouchers/redeem';

  // ── Licenses ──────────────────────────────────────────────────────────────
  static const String validateLicense = '/licenses/validate';
  static const String bindDevice      = '/licenses/bind-device';
}
