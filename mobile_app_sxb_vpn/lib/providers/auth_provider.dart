import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/storage/secure_storage.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';

class AuthState {
  final bool isAuthenticated;
  final UserModel? user;
  final bool isLoading;
  final String? error;

  const AuthState({
    this.isAuthenticated = false,
    this.user,
    this.isLoading = false,
    this.error,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    UserModel? user,
    bool? isLoading,
    String? error,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class AuthNotifier extends AsyncNotifier<AuthState> {
  @override
  Future<AuthState> build() async {
    final storage = ref.watch(secureStorageProvider);
    final hasToken = await storage.hasToken();
    if (hasToken) {
      final authService = ref.watch(authServiceProvider);
      final user = await authService.getMe();
      return AuthState(isAuthenticated: user != null, user: user);
    }
    return const AuthState();
  }

  Future<bool> login(String email, String password) async {
    state = const AsyncValue.loading();
    final authService = ref.read(authServiceProvider);
    final result = await authService.login(email, password);
    if (result.success) {
      state = AsyncValue.data(AuthState(isAuthenticated: true, user: result.user));
      return true;
    } else {
      state = AsyncValue.data(AuthState(error: result.error));
      return false;
    }
  }

  Future<bool> register(String email, String password, String? username) async {
    state = const AsyncValue.loading();
    final authService = ref.read(authServiceProvider);
    final result = await authService.register(email, password, username);
    if (result.success) {
      state = AsyncValue.data(AuthState(isAuthenticated: true, user: result.user));
      return true;
    } else {
      state = AsyncValue.data(AuthState(error: result.error));
      return false;
    }
  }

  Future<void> logout() async {
    final authService = ref.read(authServiceProvider);
    await authService.logout();
    state = const AsyncValue.data(AuthState());
  }

  /// Rafraîchit les données utilisateur depuis le serveur (ex: après rachat d'un voucher)
  Future<void> refresh() async {
    final current = state.valueOrNull;
    if (current == null) return;
    final authService = ref.read(authServiceProvider);
    final user = await authService.getMe();
    if (user != null) {
      state = AsyncValue.data(AuthState(isAuthenticated: true, user: user));
    }
  }
}

final authStateProvider = AsyncNotifierProvider<AuthNotifier, AuthState>(() => AuthNotifier());
