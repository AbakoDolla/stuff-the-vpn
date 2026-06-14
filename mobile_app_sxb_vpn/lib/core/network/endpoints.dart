class ApiEndpoints {
  static const String baseUrl = 'https://7c59bcad-53b5-4481-ad9f-04a49c5ad452-00-2z3ymp5ww4daw.kirk.replit.dev/api';

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
