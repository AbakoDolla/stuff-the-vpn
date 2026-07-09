import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../features/auth/login_page.dart';
import '../features/auth/register_page.dart';
import '../features/auth/forgot_password_page.dart';
import '../features/activation/activation_page.dart';
import '../features/home/home_page.dart';
import '../features/profile/profile_page.dart';
import '../features/usage/usage_page.dart';
import '../features/logs/logs_page.dart';
import '../features/notifications/notifications_page.dart';
import '../features/settings/settings_page.dart';
import '../features/about/about_page.dart';
import '../features/splash/splash_page.dart';
import '../features/voucher/redeem_page.dart';
import '../providers/activation_provider.dart';
import '../widgets/main_scaffold.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final activationAsync = ref.watch(activationProvider);
  final GlobalKey<NavigatorState> shellKey = GlobalKey<NavigatorState>();
  final GlobalKey<NavigatorState> rootKey = GlobalKey<NavigatorState>();

  return GoRouter(
    navigatorKey: rootKey,
    initialLocation: '/splash',
    redirect: (context, state) {
      final loc = state.matchedLocation;

      // Splash always passes through
      if (loc == '/splash') return null;

      // Non-shell routes that don't require auth
      if (loc == '/activation') return null;
      if (loc.startsWith('/auth/')) return null;
      if (loc == '/about') return null;
      if (loc == '/notifications') return null;

      // While still checking, don't redirect
      if (activationAsync.isLoading) return null;

      final activation = activationAsync.valueOrNull;
      final isActivated = activation?.isActivated ?? false;

      if (!isActivated) return '/activation';
      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (_, __) => const SplashPage(),
      ),
      GoRoute(
        path: '/activation',
        builder: (_, __) => const ActivationPage(),
      ),
      // Auth routes kept but not in main flow
      GoRoute(path: '/auth/login', builder: (_, __) => const LoginPage()),
      GoRoute(path: '/auth/register', builder: (_, __) => const RegisterPage()),
      GoRoute(path: '/auth/forgot', builder: (_, __) => const ForgotPasswordPage()),
      // Voucher
      GoRoute(path: '/voucher/redeem', builder: (_, __) => const RedeemPage()),
      // Notifications (full-screen, outside shell)
      GoRoute(
        path: '/notifications',
        builder: (_, __) => const NotificationsPage(),
      ),
      // About (full-screen, outside shell)
      GoRoute(
        path: '/about',
        builder: (_, __) => const AboutPage(),
      ),
      // Main shell with 5 tabs
      ShellRoute(
        navigatorKey: shellKey,
        builder: (context, state, child) {
          return MainScaffold(
            body: child,
            selectedIndex: _tabIndex(state.matchedLocation),
            onDestinationSelected: (i) {
              switch (i) {
                case 0:
                  GoRouter.of(context).go('/home');
                  break;
                case 1:
                  GoRouter.of(context).go('/account');
                  break;
                case 2:
                  GoRouter.of(context).go('/usage');
                  break;
                case 3:
                  GoRouter.of(context).go('/history');
                  break;
                case 4:
                  GoRouter.of(context).go('/settings');
                  break;
              }
            },
          );
        },
        routes: [
          GoRoute(path: '/home', builder: (_, __) => const HomePage()),
          GoRoute(path: '/account', builder: (_, __) => const ProfilePage()),
          GoRoute(path: '/usage', builder: (_, __) => const UsagePage()),
          GoRoute(path: '/history', builder: (_, __) => const LogsPage()),
          GoRoute(path: '/settings', builder: (_, __) => const SettingsPage()),
        ],
      ),
    ],
  );
});

int _tabIndex(String location) {
  if (location.startsWith('/home')) return 0;
  if (location.startsWith('/account')) return 1;
  if (location.startsWith('/usage')) return 2;
  if (location.startsWith('/history')) return 3;
  if (location.startsWith('/settings')) return 4;
  return 0;
}
