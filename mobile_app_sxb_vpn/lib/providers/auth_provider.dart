import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
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
      if (user != null) {
        return AuthState(isAuthenticated: true, user: user);
      }
      await storage.clearAll();
    }
    return const AuthState();
  }

  Future<bool> login(String email, String password) async {
    state = const AsyncValue.loading();
    final authService = ref.read(authServiceProvider);
    final result = await authService.login(email, password);
    if (result.success) {
      state = AsyncValue.data(
          AuthState(isAuthenticated: true, user: result.user));
      return true;
    } else {
      state = AsyncValue.data(AuthState(error: result.error));
      return false;
    }
  }

  Future<bool> register(
      String email, String password, String? username) async {
    state = const AsyncValue.loading();
    final authService = ref.read(authServiceProvider);
    final result = await authService.register(email, password, username);
    if (result.success) {
      state = AsyncValue.data(
          AuthState(isAuthenticated: true, user: result.user));
      return true;
    } else {
      state = AsyncValue.data(AuthState(error: result.error));
      return false;
    }
  }

  Future<bool> loginWithGoogle() async {
    state = const AsyncValue.loading();
    try {
      final supabase = Supabase.instance.client;
      await supabase.auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: 'io.supabase.sxbvpn://login-callback/',
      );
      // After OAuth redirect, sync with backend
      final session = supabase.auth.currentSession;
      if (session == null) {
        state = const AsyncValue.data(
            AuthState(error: 'Google Sign-In annulé'));
        return false;
      }
      final supabaseUser = supabase.auth.currentUser;
      if (supabaseUser == null) {
        state = const AsyncValue.data(
            AuthState(error: 'Utilisateur non trouvé'));
        return false;
      }
      // Sync with backend via email login or auto-create
      final authService = ref.read(authServiceProvider);
      final result = await authService.loginWithSupabaseToken(
          session.accessToken, supabaseUser.email ?? '');
      if (result.success) {
        state = AsyncValue.data(
            AuthState(isAuthenticated: true, user: result.user));
        return true;
      } else {
        state = AsyncValue.data(AuthState(error: result.error));
        return false;
      }
    } catch (e) {
      state = AsyncValue.data(
          AuthState(error: 'Erreur Google Sign-In: ${e.toString()}'));
      return false;
    }
  }

  Future<void> logout() async {
    final authService = ref.read(authServiceProvider);
    await authService.logout();
    try {
      await Supabase.instance.client.auth.signOut();
    } catch (_) {}
    state = const AsyncValue.data(AuthState());
  }

  Future<void> refresh() async {
    final current = state.valueOrNull;
    if (current == null || !current.isAuthenticated) return;
    final authService = ref.read(authServiceProvider);
    final user = await authService.getMe();
    if (user != null) {
      state = AsyncValue.data(
          AuthState(isAuthenticated: true, user: user));
    }
  }
}

final authStateProvider =
    AsyncNotifierProvider<AuthNotifier, AuthState>(() => AuthNotifier());
