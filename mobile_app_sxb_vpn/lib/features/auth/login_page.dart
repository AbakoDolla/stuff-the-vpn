import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/gradient_button.dart';
import '../../widgets/glass_card.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _obscure = true;
  bool _loading = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    final ok = await ref.read(authStateProvider.notifier).login(
          _emailCtrl.text.trim(),
          _passCtrl.text,
        );
    if (!mounted) return;
    setState(() => _loading = false);
    if (ok) {
      context.go('/home');
    } else {
      final error = ref.read(authStateProvider).valueOrNull?.error ?? 'Erreur de connexion';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error), backgroundColor: AppColors.disconnected),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.gradientDark),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: Column(
              children: [
                _buildHeader().animate().fadeIn().slideY(begin: -0.2, end: 0),
                const SizedBox(height: 48),
                GlassCard(
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Bienvenue', style: Theme.of(context).textTheme.headlineMedium),
                        const SizedBox(height: 4),
                        Text('Connectez-vous à votre compte', style: Theme.of(context).textTheme.bodyMedium),
                        const SizedBox(height: 28),
                        _buildEmailField(),
                        const SizedBox(height: 16),
                        _buildPasswordField(),
                        Align(
                          alignment: Alignment.centerRight,
                          child: TextButton(
                            onPressed: () {},
                            child: Text('Mot de passe oublié ?',
                                style: TextStyle(color: AppColors.accent, fontSize: 12)),
                          ),
                        ),
                        const SizedBox(height: 8),
                        GradientButton(
                          label: 'Se connecter',
                          isLoading: _loading,
                          onPressed: _login,
                        ),
                        const SizedBox(height: 24),
                        _buildDivider(),
                        const SizedBox(height: 20),
                        _buildSocialButtons(),
                        const SizedBox(height: 24),
                        Center(
                          child: GestureDetector(
                            onTap: () => context.go('/auth/register'),
                            child: RichText(
                              text: TextSpan(
                                text: "Pas encore de compte ? ",
                                style: Theme.of(context).textTheme.bodySmall,
                                children: [
                                  TextSpan(
                                    text: "S'inscrire",
                                    style: TextStyle(color: AppColors.accent, fontWeight: FontWeight.w600),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2, end: 0),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(children: [
      Container(
        width: 80, height: 80,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: const LinearGradient(colors: [AppColors.primary, AppColors.accent]),
          boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.4), blurRadius: 20, spreadRadius: 5)],
        ),
        child: const Icon(Icons.shield_rounded, size: 40, color: Colors.white),
      ),
      const SizedBox(height: 12),
      Text('SXB VPN', style: Theme.of(context).textTheme.headlineLarge?.copyWith(letterSpacing: 3)),
      Text('Fast  •  Secure  •  Unlimited',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(letterSpacing: 2)),
    ]);
  }

  Widget _buildEmailField() {
    return TextFormField(
      controller: _emailCtrl,
      keyboardType: TextInputType.emailAddress,
      style: const TextStyle(color: AppColors.textPrimary),
      decoration: const InputDecoration(
        hintText: 'Email ou nom d\'utilisateur',
        prefixIcon: Icon(Icons.email_outlined, color: AppColors.textMuted),
      ),
      validator: (v) => v == null || v.isEmpty ? 'Email requis' : null,
    );
  }

  Widget _buildPasswordField() {
    return TextFormField(
      controller: _passCtrl,
      obscureText: _obscure,
      style: const TextStyle(color: AppColors.textPrimary),
      decoration: InputDecoration(
        hintText: 'Mot de passe',
        prefixIcon: const Icon(Icons.lock_outline, color: AppColors.textMuted),
        suffixIcon: IconButton(
          icon: Icon(_obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined,
              color: AppColors.textMuted),
          onPressed: () => setState(() => _obscure = !_obscure),
        ),
      ),
      validator: (v) => v == null || v.length < 6 ? 'Minimum 6 caractères' : null,
    );
  }

  Widget _buildDivider() {
    return Row(children: [
      const Expanded(child: Divider()),
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Text('ou continuer avec', style: Theme.of(context).textTheme.bodySmall),
      ),
      const Expanded(child: Divider()),
    ]);
  }

  Widget _buildSocialButtons() {
    return Row(children: [
      Expanded(child: _socialBtn('Google', Icons.g_mobiledata_rounded)),
      const SizedBox(width: 12),
      Expanded(child: _socialBtn('Apple', Icons.apple_rounded)),
    ]);
  }

  Widget _socialBtn(String label, IconData icon) {
    return OutlinedButton.icon(
      onPressed: () {},
      icon: Icon(icon, size: 20),
      label: Text(label),
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.textPrimary,
        side: const BorderSide(color: AppColors.cardBorder),
        padding: const EdgeInsets.symmetric(vertical: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}
