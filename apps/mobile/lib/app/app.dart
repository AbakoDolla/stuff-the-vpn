import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'theme.dart';
import 'router.dart';
import '../providers/theme_provider.dart';

class SxbVpnApp extends ConsumerWidget {
  const SxbVpnApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final routerAsync = ref.watch(routerProvider);
    final themeModeAsync = ref.watch(themeProvider);
    
    return MaterialApp.router(
      title: 'SXB VPN',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: themeModeAsync,
      routerConfig: routerAsync,
    );
  }
}
