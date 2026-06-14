import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../features/auth/login_page.dart';
import '../features/auth/register_page.dart';
import '../features/home/home_page.dart';
import '../features/vpn/vpn_connect_page.dart';
import '../features/profile/profile_page.dart';
import '../features/servers/servers_page.dart';
import '../features/usage/usage_page.dart';
import '../features/splash/splash_page.dart';
import '../providers/auth_provider.dart';
import '../widgets/main_scaffold.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);
  return GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) {
      final isSplash = state.matchedLocation == '/splash';
      if (isSplash) return null;
      final isLoggedIn = authState.valueOrNull?.isAuthenticated ?? false;
      final isAuthRoute = state.matchedLocation.startsWith('/auth');
      if (!isLoggedIn && !isAuthRoute) return '/auth/login';
      if (isLoggedIn && isAuthRoute) return '/home';
      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashPage(),
      ),
      GoRoute(
        path: '/auth/login',
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: '/auth/register',
        builder: (context, state) => const RegisterPage(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, shell) => MainScaffold(shell: shell),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(path: '/home', builder: (context, state) => const HomePage()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/servers', builder: (context, state) => const ServersPage()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/vpn', builder: (context, state) => const VpnConnectPage()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/usage', builder: (context, state) => const UsagePage()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/profile', builder: (context, state) => const ProfilePage()),
          ]),
        ],
      ),
    ],
  );
});
