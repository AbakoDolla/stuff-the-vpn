import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'theme/app_theme.dart';
import 'services/api_service.dart';
import 'providers/auth_provider.dart';
import 'providers/vpn_provider.dart';
import 'screens/splash_screen.dart';

const String kApiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'https://api.sxbvpn.com',
);

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
  final apiService = ApiService(kApiBaseUrl);

  runApp(SxbVpnApp(prefs: prefs, apiService: apiService));
}

class SxbVpnApp extends StatelessWidget {
  final SharedPreferences prefs;
  final ApiService apiService;

  const SxbVpnApp({super.key, required this.prefs, required this.apiService});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider(apiService, prefs)),
        ChangeNotifierProvider(create: (_) => VpnProvider(apiService)),
      ],
      child: MaterialApp(
        title: 'SxB VPN',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.dark,
        darkTheme: AppTheme.dark,
        themeMode: ThemeMode.dark,
        home: const SplashScreen(),
      ),
    );
  }
}
