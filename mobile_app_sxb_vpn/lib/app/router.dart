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
import '../features/voucher/redeem_page.dart';
import '../providers/auth_provider.dart';
import '../widgets/main_scaffold.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);
  final GlobalKey<NavigatorState> _shellNavigatorKey = GlobalKey<NavigatorState>();

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
      GoRoute(
        path: '/voucher/redeem',
        builder: (context, state) => const RedeemPage(),
      ),
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) {
          return MainScaffold(
            body: child,
            selectedIndex: _calculateSelectedIndex(context),
            onDestinationSelected: (index) {
              final router = GoRouter.of(context);
              switch (index) {
                case 0:
                  router.go('/home');
                  break;
                case 1:
                  router.go('/servers');
                  break;
                case 2:
                  router.go('/profile');
                  break;
                case 3:
                  router.go('/usage');
                  break;
              }
            },
          );
        },
        routes: [
          GoRoute(path: '/home', builder: (context, state) => const HomePage()),
          GoRoute(path: '/servers', builder: (context, state) => const ServersPage()),
          GoRoute(path: '/profile', builder: (context, state) => const ProfilePage()),
          GoRoute(path: '/usage', builder: (context, state) => const UsagePage()),
          GoRoute(path: '/vpn', builder: (context, state) => const VpnConnectPage()),
        ],
      ),
    ],
  );
});

int _calculateSelectedIndex(BuildContext context) {
  final location = GoRouter.of(context).routerDelegate.currentConfiguration.fullPath;
  if (location.startsWith('/home')) return 0;
  if (location.startsWith('/servers')) return 1;
  if (location.startsWith('/profile')) return 2;
  if (location.startsWith('/usage')) return 3;
  return 0;
}
