import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'services/api_service.dart';
import 'features/auth/screen.dart';
import 'features/home/screen.dart';
import 'features/vpn/screen.dart';
import 'features/voucher/screen.dart';
import 'features/profile/screen.dart';
import 'features/settings/screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiService.init();
  runApp(
    ChangeNotifierProvider(
      create: (_) => AppState(),
      child: const StuffTheVpnApp(),
    ),
  );
}

class AppState extends ChangeNotifier {
  bool _isLoggedIn = false;
  String? _token;
  Map<String, dynamic>? _user;

  bool get isLoggedIn => _isLoggedIn;
  String? get token => _token;
  Map<String, dynamic>? get user => _user;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('sxb_token');
    final userStr = prefs.getString('sxb_user');
    if (_token != null && userStr != null) {
      _isLoggedIn = true;
    }
    notifyListeners();
  }

  void login(String token, Map<String, dynamic> user) {
    _token = token;
    _user = user;
    _isLoggedIn = true;
    notifyListeners();
  }

  Future<void> logout() async {
    await ApiService.clearAuth();
    _token = null;
    _user = null;
    _isLoggedIn = false;
    notifyListeners();
  }
}

class StuffTheVpnApp extends StatefulWidget {
  const StuffTheVpnApp({super.key});

  @override
  State<StuffTheVpnApp> createState() => _StuffTheVpnAppState();
}

class _StuffTheVpnAppState extends State<StuffTheVpnApp> {
  @override
  void initState() {
    super.initState();
    context.read<AppState>().init();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Stuff The VPN',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.dark(
          primary: const Color(0xFF0099FF),
          secondary: const Color(0xFF00D4FF),
          surface: const Color(0xFF0F1629),
          background: const Color(0xFF020817),
        ),
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFF020817),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF0F1629),
          foregroundColor: Color(0xFFF1F5F9),
          elevation: 0,
        ),
      ),
      home: Consumer<AppState>(
        builder: (_, state, __) {
          if (state.isLoggedIn) return const MainShell();
          return const AuthScreen();
        },
      ),
    );
  }
}

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _idx = 0;

  final _screens = const [
    HomeScreen(),
    VpnScreen(),
    VoucherScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_idx],
      bottomNavigationBar: NavigationBar(
        backgroundColor: const Color(0xFF0F1629),
        indicatorColor: const Color(0xFF0099FF).withOpacity(0.2),
        selectedIndex: _idx,
        onDestinationSelected: (i) => setState(() => _idx = i),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home, color: Color(0xFF0099FF)),
            label: 'Accueil',
          ),
          NavigationDestination(
            icon: Icon(Icons.vpn_key_outlined),
            selectedIcon: Icon(Icons.vpn_key, color: Color(0xFF0099FF)),
            label: 'VPN',
          ),
          NavigationDestination(
            icon: Icon(Icons.confirmation_num_outlined),
            selectedIcon: Icon(Icons.confirmation_num, color: Color(0xFF0099FF)),
            label: 'Voucher',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person, color: Color(0xFF0099FF)),
            label: 'Profil',
          ),
        ],
      ),
    );
  }
}
