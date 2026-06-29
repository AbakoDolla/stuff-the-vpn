import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../features/auth/login_page.dart';
import '../features/auth/register_page.dart';
import '../features/auth/forgot_password_page.dart';
import '../features/home/home_page.dart';
import '../features/vpn/vpn_connect_page.dart';
import '../features/profile/profile_page.dart';
import '../features/servers/servers_page.dart';
import '../features/usage/usage_page.dart';
import '../features/splash/splash_page.dart';
import '../features/voucher/redeem_page.dart';
import '../features/logs/logs_page.dart';
import '../providers/auth_provider.dart';
import '../widgets/main_scaffold.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);
  final GlobalKey<NavigatorState> shellKey = GlobalKey<NavigatorState>();

  return GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) {
      final isSplash  = state.matchedLocation == '/splash';
      if (isSplash) return null;
      final isLoggedIn = authState.valueOrNull?.isAuthenticated ?? false;
      final isAuthRoute = state.matchedLocation.startsWith('/auth');
      if (!isLoggedIn && !isAuthRoute) return '/auth/login';
      if ( isLoggedIn &&  isAuthRoute) return '/home';
      return null;
    },
    routes: [
      GoRoute(path: '/splash',       builder: (_, __) => const SplashPage()),
      GoRoute(path: '/auth/login',   builder: (_, __) => const LoginPage()),
      GoRoute(path: '/auth/register',builder: (_, __) => const RegisterPage()),
      GoRoute(path: '/auth/forgot',  builder: (_, __) => const ForgotPasswordPage()),
      GoRoute(path: '/voucher/redeem', builder: (_, __) => const RedeemPage()),
      // Logs page (modal-like, no bottom nav)
      GoRoute(path: '/logs',         builder: (_, __) => const LogsPage()),
      // Main shell with bottom navigation
      ShellRoute(
        navigatorKey: shellKey,
        builder: (context, state, child) {
          return MainScaffold(
            body: child,
            selectedIndex: _tabIndex(state.matchedLocation),
            onDestinationSelected: (i) {
              switch (i) {
                case 0: GoRouter.of(context).go('/home');    break;
                case 1: GoRouter.of(context).go('/vpn');     break;
                case 2: GoRouter.of(context).go('/servers'); break;
                case 3: GoRouter.of(context).go('/profile'); break;
              }
            },
          );
        },
        routes: [
          GoRoute(path: '/home',    builder: (_, __) => const HomePage()),
          GoRoute(path: '/vpn',     builder: (_, __) => const VpnConnectPage()),
          GoRoute(path: '/servers', builder: (_, __) => const ServersPage()),
          GoRoute(path: '/profile', builder: (_, __) => const ProfilePage()),
          GoRoute(path: '/usage',   builder: (_, __) => const UsagePage()),
        ],
      ),
    ],
  );
});

int _tabIndex(String location) {
  if (location.startsWith('/home'))    return 0;
  if (location.startsWith('/vpn'))     return 1;
  if (location.startsWith('/servers')) return 2;
  if (location.startsWith('/profile')) return 3;
  return 0;
}
