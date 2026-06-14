class ApiEndpoints {
  static const String baseUrl = 'https://bfda7366-15a6-4135-b94c-fcf014abd343-00-31cmva7e4robv.picard.replit.dev/api';

  // Auth
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String me = '/auth/me';
  static const String logout = '/auth/logout';

  // VPN
  static const String myConfig = '/vpn/my-config';
  static const String servers = '/vpn/servers';

  // Users
  static String user(String id) => '/users/$id';
  static String usage(String userId) => '/usage/$userId';

  // Plans
  static const String activePlans = '/plans/active';

  // Vouchers
  static const String redeemVoucher = '/vouchers/redeem';
}
