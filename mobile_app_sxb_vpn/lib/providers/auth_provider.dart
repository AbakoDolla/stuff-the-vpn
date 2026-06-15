
import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/storage/secure_storage.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';

/// Represents the user's authentication status.
/// It's immutable.
class AuthState {
  final UserModel? user;
  final bool isAuthenticated;

  const AuthState({
    this.user,
  }) : isAuthenticated = user != null;

  AuthState copyWith({
    UserModel? user,
  }) {
    return AuthState(
      user: user,
    );
  }
}

/// Notifier for handling authentication logic.
///
/// This notifier listens to Supabase's authentication state changes and
/// updates the app state accordingly. It provides methods for login,
/// logout, registration, and Google sign-in.
class AuthNotifier extends AsyncNotifier<AuthState> {
  StreamSubscription<dynamic>? _authStateSubscription;

  @override
  Future<AuthState> build() async {
    // Set up a listener for auth state changes (login, logout, token refresh)
    _setupAuthListener();

    // Check for an existing session when the app starts.
    final session = Supabase.instance.client.auth.currentSession;
    if (session != null) {
      final user = await ref.read(authServiceProvider).getMe();
      return AuthState(user: user);
    }

    return const AuthState();
  }

  void _setupAuthListener() {
    // Avoid setting up multiple listeners
    _authStateSubscription?.cancel();
    _authStateSubscription =
        Supabase.instance.client.auth.onAuthStateChange.listen(
      (data) async {
        final session = data.session;
        if (session != null) {
          // User is signed in. Fetch the app-specific user profile.
          state = const AsyncValue.loading();
          final user = await ref.read(authServiceProvider).getMe();
          state = AsyncValue.data(AuthState(user: user));
        } else {
          // User is signed out. Clear local storage and update state.
          await ref.read(secureStorageProvider).clearAll();
          state = const AsyncValue.data(AuthState());
        }
      },
      onError: (error) {
        state = AsyncValue.error(error, StackTrace.current);
      },
    );

    // Cancel the subscription when the provider is disposed.
    ref.onDispose(() {
      _authStateSubscription?.cancel();
    });
  }

  /// Logs in a user with email and password.
  Future<void> login(String email, String password) async {
    state = const AsyncValue.loading();
    try {
      final result = await ref.read(authServiceProvider).login(email, password);
      if (!result.success) {
        throw Exception(result.error ?? 'Login failed');
      }
      // On success, the auth listener will update the state.
    } catch (e, st) {
      // If login fails, revert to the previous state with an error.
      state = AsyncValue.error(e, st);
    }
  }

  /// Registers a new user.
  Future<void> register(String email, String password, String? username) async {
    state = const AsyncValue.loading();
    try {
      final result = await ref.read(authServiceProvider).register(email, password, username);
      if (!result.success) {
        throw Exception(result.error ?? 'Registration failed');
      }
      // On success, the auth listener will update the state.
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  /// Initiates the Google sign-in flow.
  Future<void> loginWithGoogle() async {
    state = const AsyncValue.loading();
    try {
      await Supabase.instance.client.auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: 'io.supabase.sxbvpn://login-callback/',
      );
      // The auth listener will handle the result of the OAuth flow.
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  /// Logs out the current user.
  Future<void> logout() async {
    state = const AsyncValue.loading();
    try {
      // First, call our backend logout if necessary.
      await ref.read(authServiceProvider).logout();
      // Then, sign out from Supabase.
      await Supabase.instance.client.auth.signOut();
      // The auth listener will clear the state.
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
  
    /// Refreshes the user profile data.
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
