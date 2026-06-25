import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'services/api_service.dart';
import 'services/vpn_service.dart';
import 'features/auth/screen.dart';
import 'features/home/screen.dart';
import 'features/vpn/screen.dart';
import 'features/voucher/screen.dart';
import 'features/profile/screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiService.init();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AppState()..init()),
        ChangeNotifierProvider(create: (_) => VpnService()),
      ],
      child: const StuffTheVpnApp(),
    ),
  );
}

class AppState extends ChangeNotifier {
  bool _isLoggedIn = false;

  bool get isLoggedIn => _isLoggedIn;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('sxb_token');
    _isLoggedIn = token != null;
    notifyListeners();
  }

  void login(String token, Map<String, dynamic> user) {
    _isLoggedIn = true;
    notifyListeners();
  }

  Future<void> logout() async {
    await ApiService.clearAuth();
    _isLoggedIn = false;
    notifyListeners();
  }
}

class StuffTheVpnApp extends StatelessWidget {
  const StuffTheVpnApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Stuff The VPN',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF0099FF),
          secondary: Color(0xFF00D4FF),
          surface: Color(0xFF0F1629),
        ),
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFF020817),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF020817),
          foregroundColor: Color(0xFFF1F5F9),
          elevation: 0,
          centerTitle: false,
        ),
        navigationBarTheme: NavigationBarThemeData(
          backgroundColor: const Color(0xFF0F1629),
          indicatorColor: const Color(0xFF0099FF).withOpacity(0.2),
          labelTextStyle: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return const TextStyle(color: Color(0xFF0099FF), fontSize: 11, fontWeight: FontWeight.w600);
            }
            return const TextStyle(color: Color(0xFF64748B), fontSize: 11);
          }),
        ),
      ),
      home: Consumer<AppState>(
        builder: (_, state, __) =>
            state.isLoggedIn ? const MainShell() : const AuthScreen(),
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

  static const _screens = [
    HomeScreen(),
    VpnScreen(),
    VoucherScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    // Show live VPN state in bottom nav badge
    return Consumer<VpnService>(
      builder: (_, vpn, __) => Scaffold(
        body: IndexedStack(index: _idx, children: _screens),
        bottomNavigationBar: NavigationBar(
          selectedIndex: _idx,
          onDestinationSelected: (i) => setState(() => _idx = i),
          destinations: [
            const NavigationDestination(
              icon: Icon(Icons.home_outlined),
              selectedIcon: Icon(Icons.home, color: Color(0xFF0099FF)),
              label: 'Accueil',
            ),
            NavigationDestination(
              icon: Badge(
                isLabelVisible: vpn.isConnected,
                backgroundColor: const Color(0xFF10B981),
                label: const Text('●', style: TextStyle(fontSize: 6)),
                child: const Icon(Icons.vpn_key_outlined),
              ),
              selectedIcon: Badge(
                isLabelVisible: vpn.isConnected,
                backgroundColor: const Color(0xFF10B981),
                label: const Text('●', style: TextStyle(fontSize: 6)),
                child: const Icon(Icons.vpn_key, color: Color(0xFF0099FF)),
              ),
              label: 'VPN',
            ),
            const NavigationDestination(
              icon: Icon(Icons.confirmation_num_outlined),
              selectedIcon: Icon(Icons.confirmation_num, color: Color(0xFF0099FF)),
              label: 'Voucher',
            ),
            const NavigationDestination(
              icon: Icon(Icons.person_outline),
              selectedIcon: Icon(Icons.person, color: Color(0xFF0099FF)),
              label: 'Profil',
            ),
          ],
        ),
      ),
    );
  }
}
