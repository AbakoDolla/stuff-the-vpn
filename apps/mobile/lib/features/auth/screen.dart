import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../main.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  bool _loading = false;
  String? _error;

  final _emailCtrl = TextEditingController();
  final _pwCtrl = TextEditingController();
  final _licenseCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  bool _showPw = false;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    _emailCtrl.dispose();
    _pwCtrl.dispose();
    _licenseCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  Future<void> _loginEmail() async {
    if (_emailCtrl.text.isEmpty || _pwCtrl.text.isEmpty) return;
    setState(() { _loading = true; _error = null; });
    try {
      final data = await ApiService.loginWithPassword(_emailCtrl.text.trim(), _pwCtrl.text);
      if (!mounted) return;
      context.read<AppState>().login(data['token'] as String, data['user'] as Map<String, dynamic>);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _loginLicense() async {
    if (_licenseCtrl.text.isEmpty || _phoneCtrl.text.isEmpty) return;
    setState(() { _loading = true; _error = null; });
    try {
      final deviceId = 'mobile_${DateTime.now().millisecondsSinceEpoch}';
      final data = await ApiService.loginWithLicense(
        _licenseCtrl.text.trim(),
        _phoneCtrl.text.trim(),
        deviceId,
        deviceName: 'Flutter App',
      );
      if (!mounted) return;
      context.read<AppState>().login(data['token'] as String, data['user'] as Map<String, dynamic>);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: RadialGradient(
            center: Alignment.topCenter,
            radius: 1.2,
            colors: [Color(0xFF071B3A), Color(0xFF020817)],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(20),
                      gradient: const LinearGradient(
                        colors: [Color(0xFF0099FF), Color(0xFF00D4FF)],
                      ),
                      boxShadow: [BoxShadow(color: const Color(0xFF0099FF).withOpacity(0.4), blurRadius: 24, spreadRadius: 4)],
                    ),
                    child: const Icon(Icons.shield_outlined, size: 40, color: Colors.white),
                  ),
                  const SizedBox(height: 16),
                  const Text('Stuff The VPN', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFFF1F5F9))),
                  const SizedBox(height: 4),
                  const Text('Connexion sécurisée', style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                  const SizedBox(height: 32),

                  Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F1629),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFF1E2D45)),
                    ),
                    child: Column(
                      children: [
                        TabBar(
                          controller: _tabs,
                          indicatorColor: const Color(0xFF0099FF),
                          labelColor: const Color(0xFF0099FF),
                          unselectedLabelColor: const Color(0xFF64748B),
                          dividerColor: const Color(0xFF1E2D45),
                          tabs: const [
                            Tab(text: 'Email / Mot de passe'),
                            Tab(text: 'Licence'),
                          ],
                        ),
                        SizedBox(
                          height: 240,
                          child: TabBarView(
                            controller: _tabs,
                            children: [
                              Padding(
                                padding: const EdgeInsets.all(20),
                                child: Column(
                                  children: [
                                    _field('Email', _emailCtrl, TextInputType.emailAddress),
                                    const SizedBox(height: 12),
                                    _pwField(),
                                  ],
                                ),
                              ),
                              Padding(
                                padding: const EdgeInsets.all(20),
                                child: Column(
                                  children: [
                                    _field('Clé de licence (SXB-XXXX-XXXX)', _licenseCtrl),
                                    const SizedBox(height: 12),
                                    _field('Numéro de téléphone', _phoneCtrl, TextInputType.phone),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  if (_error != null) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        color: Colors.red.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Colors.red.withOpacity(0.3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error_outline, color: Colors.red, size: 16),
                          const SizedBox(width: 8),
                          Expanded(child: Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 13))),
                        ],
                      ),
                    ),
                  ],

                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _loading ? null : () {
                        if (_tabs.index == 0) _loginEmail();
                        else _loginLicense();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0099FF),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 0,
                      ),
                      child: _loading
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Text('Se connecter', style: TextStyle(fontWeight: FontWeight.w600)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _field(String label, TextEditingController ctrl, [TextInputType? type]) {
    return TextField(
      controller: ctrl,
      keyboardType: type,
      style: const TextStyle(color: Color(0xFFF1F5F9)),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 13),
        filled: true,
        fillColor: const Color(0xFF141C2E),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF1E2D45))),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF1E2D45))),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF0099FF))),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      ),
    );
  }

  Widget _pwField() {
    return TextField(
      controller: _pwCtrl,
      obscureText: !_showPw,
      style: const TextStyle(color: Color(0xFFF1F5F9)),
      decoration: InputDecoration(
        labelText: 'Mot de passe',
        labelStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 13),
        filled: true,
        fillColor: const Color(0xFF141C2E),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF1E2D45))),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF1E2D45))),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF0099FF))),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        suffixIcon: IconButton(
          icon: Icon(_showPw ? Icons.visibility_off : Icons.visibility, color: const Color(0xFF64748B), size: 18),
          onPressed: () => setState(() => _showPw = !_showPw),
        ),
      ),
    );
  }
}
