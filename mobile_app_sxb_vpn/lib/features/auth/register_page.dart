import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/gradient_button.dart';
import '../../widgets/glass_card.dart';

class RegisterPage extends ConsumerStatefulWidget {
  const RegisterPage({super.key});

  @override
  ConsumerState<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends ConsumerState<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _usernameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _obscure = true;
  bool _loading = false;

  @override
  void dispose() {
    _usernameCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    final ok = await ref.read(authStateProvider.notifier).register(
          _emailCtrl.text.trim(),
          _passCtrl.text,
          _usernameCtrl.text.trim().isNotEmpty ? _usernameCtrl.text.trim() : null,
        );
    if (!mounted) return;
    setState(() => _loading = false);
    if (ok) {
      context.go('/home');
    } else {
      final error = ref.read(authStateProvider).valueOrNull?.error ?? 'Erreur inscription';
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
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
            child: Column(
              children: [
                Row(children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.textPrimary),
                    onPressed: () => context.go('/auth/login'),
                  ),
                  Text('Créer un compte', style: Theme.of(context).textTheme.headlineMedium),
                ]).animate().fadeIn(),
                const SizedBox(height: 32),
                GlassCard(
                  child: Form(
                    key: _formKey,
                    child: Column(
                      children: [
                        _field(controller: _usernameCtrl, hint: 'Nom d\'utilisateur', icon: Icons.person_outline),
                        const SizedBox(height: 14),
                        _field(controller: _emailCtrl, hint: 'Email', icon: Icons.email_outlined,
                            type: TextInputType.emailAddress,
                            validator: (v) => v == null || !v.contains('@') ? 'Email invalide' : null),
                        const SizedBox(height: 14),
                        _field(
                          controller: _passCtrl,
                          hint: 'Mot de passe',
                          icon: Icons.lock_outline,
                          obscure: _obscure,
                          suffix: IconButton(
                            icon: Icon(_obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                color: AppColors.textMuted),
                            onPressed: () => setState(() => _obscure = !_obscure),
                          ),
                          validator: (v) => v == null || v.length < 6 ? 'Minimum 6 caractères' : null,
                        ),
                        const SizedBox(height: 14),
                        _field(
                          controller: _confirmCtrl,
                          hint: 'Confirmer le mot de passe',
                          icon: Icons.lock_outline,
                          obscure: true,
                          validator: (v) => v != _passCtrl.text ? 'Mots de passe différents' : null,
                        ),
                        const SizedBox(height: 24),
                        GradientButton(label: "S'inscrire", isLoading: _loading, onPressed: _register),
                        const SizedBox(height: 20),
                        GestureDetector(
                          onTap: () => context.go('/auth/login'),
                          child: RichText(
                            text: TextSpan(
                              text: "Déjà un compte ? ",
                              style: Theme.of(context).textTheme.bodySmall,
                              children: [
                                TextSpan(text: "Se connecter",
                                    style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.w600)),
                              ],
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

  Widget _field({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    TextInputType type = TextInputType.text,
    bool obscure = false,
    Widget? suffix,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: type,
      obscureText: obscure,
      style: const TextStyle(color: AppColors.textPrimary),
      decoration: InputDecoration(
        hintText: hint,
        prefixIcon: Icon(icon, color: AppColors.textMuted),
        suffixIcon: suffix,
      ),
      validator: validator ?? (v) => v == null || v.isEmpty ? 'Champ requis' : null,
    );
  }
}
