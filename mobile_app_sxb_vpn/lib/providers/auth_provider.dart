import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/storage/secure_storage.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';

/// Represents the user's authentication status.
class AuthState {
  final UserModel? user;
  final Map<String, dynamic>? license;
  final bool isAuthenticated;

  const AuthState({
    this.user,
    this.license,
  }) : isAuthenticated = user != null;

  AuthState copyWith({
    UserModel? user,
    Map<String, dynamic>? license,
  }) {
    return AuthState(
      user: user ?? this.user,
      license: license ?? this.license,
    );
  }
}

/// Notifier for handling authentication logic.
class AuthNotifier extends AsyncNotifier<AuthState> {
  @override
  Future<AuthState> build() async {
    // Check for existing session when the app starts.
    final storage = ref.read(secureStorageProvider);
    final token = await storage.getToken();
    if (token != null && token.isNotEmpty) {
      final user = await ref.read(authServiceProvider).getMe();
      if (user != null) {
        return AuthState(user: user);
      }
      // Token invalid/expired, clear it
      await storage.clearAll();
    }
    return const AuthState();
  }

  /// Login with license token (SXB-XXXX), phone, and device ID
  Future<void> loginWithLicense({
    required String token,
    required String phone,
    required String deviceId,
    String? deviceName,
  }) async {
    state = const AsyncValue.loading();
    try {
      final result = await ref.read(authServiceProvider).loginWithLicense(
        token: token,
        phone: phone,
        deviceId: deviceId,
        deviceName: deviceName,
      );
      if (!result.success) {
        throw Exception(result.error ?? 'Login failed');
      }
      state = AsyncValue.data(AuthState(
        user: result.user,
        license: result.license,
      ));
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  /// Register a new account with email, password, and username
  Future<void> register(String email, String password, String username) async {
    state = const AsyncValue.loading();
    try {
      final result = await ref.read(authServiceProvider).register(email, password, username);
      if (!result.success) {
        throw Exception(result.error ?? 'Registration failed');
      }
      state = AsyncValue.data(AuthState(user: result.user));
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  /// Legacy login with email and password
  Future<void> login(String email, String password) async {
    state = const AsyncValue.loading();
    try {
      final result = await ref.read(authServiceProvider).login(email, password);
      if (!result.success) {
        throw Exception(result.error ?? 'Login failed');
      }
      state = AsyncValue.data(AuthState(user: result.user));
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  /// Refresh token
  Future<void> refreshToken() async {
    try {
      final result = await ref.read(authServiceProvider).refreshToken();
      if (!result.success) {
        await ref.read(secureStorageProvider).clearAll();
        state = const AsyncValue.data(AuthState());
      }
    } catch (_) {
      // Silently fail, token will be refreshed on next request
    }
  }

  /// Logout the current user
  Future<void> logout() async {
    state = const AsyncValue.loading();
    try {
      await ref.read(authServiceProvider).logout();
    } catch (_) {}
    state = const AsyncValue.data(AuthState());
  }

  /// Refresh the user profile data
  Future<void> refresh() async {
    final authService = ref.read(authServiceProvider);
    final user = await authService.getMe();
    if (user != null) {
      state = AsyncValue.data(AuthState(user: user));
    }
  }
}

/// The provider for accessing the authentication state and notifier.
final authStateProvider =
    AsyncNotifierProvider<AuthNotifier, AuthState>(() => AuthNotifier());
