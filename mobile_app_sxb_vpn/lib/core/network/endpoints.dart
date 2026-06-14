class ApiEndpoints {
  static const String baseUrl = 'https://YOUR_BACKEND_URL/api';

  // Auth
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String me = '/auth/me';

  // VPN
  static const String myConfig = '/vpn/my-config';

  // Users
  static String user(String id) => '/users/$id';
  static String usage(String userId) => '/usage/$userId';

  // Servers (if available)
  static const String servers = '/servers';
}
