import 'package:dio/dio.dart';

class ApiService {
  final Dio _dio;

  ApiService(String baseUrl)
      : _dio = Dio(BaseOptions(baseUrl: baseUrl, connectTimeout: 5000, receiveTimeout: 5000));

  void setToken(String token) {
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await _dio.post('/api/auth/login', data: {"email": email, "password": password});
    return res.data as Map<String, dynamic>;
  }

  Future<List<dynamic>> getServers() async {
    final res = await _dio.get('/api/vpn/servers');
    return (res.data['data'] ?? []) as List<dynamic>;
  }

  Future<Map<String, dynamic>> me() async {
    final res = await _dio.get('/api/auth/me');
    return res.data['data'] as Map<String, dynamic>;
  }
}
