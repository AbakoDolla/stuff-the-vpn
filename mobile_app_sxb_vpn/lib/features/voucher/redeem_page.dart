import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/voucher_service.dart';
import '../../widgets/gradient_button.dart';
import '../../widgets/glass_card.dart';

class RedeemPage extends ConsumerStatefulWidget {
  const RedeemPage({super.key});

  @override
  ConsumerState<RedeemPage> createState() => _RedeemPageState();
}

class _RedeemPageState extends ConsumerState<RedeemPage> {
  final _codeCtrl = TextEditingController();
  bool _loading = false;
  String? _success;
  String? _error;

  @override
  void dispose() {
    _codeCtrl.dispose();
    super.dispose();
  }

  Future<void> _redeem() async {
    final code = _codeCtrl.text.trim();
    if (code.isEmpty) {
      setState(() => _error = 'Entrez un code voucher');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
      _success = null;
    });

    final service = ref.read(voucherServiceProvider);
    final result = await service.redeem(code);

    if (!mounted) return;
    setState(() => _loading = false);

    if (result.success) {
      setState(() {
        _success = result.message;
        _error = null;
      });
      _codeCtrl.clear();
      await ref.read(authStateProvider.notifier).refresh();
    } else {
      setState(() {
        _error = result.error;
        _success = null;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.gradientDark),
        child: SafeArea(
          child: Padding(
            padding:
                const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  GestureDetector(
                    onTap: () => context.pop(),
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: AppColors.surfaceLight,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.cardBorder),
                      ),
                      child: const Icon(Icons.arrow_back_ios_new_rounded,
                          color: AppColors.textPrimary, size: 16),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Text('Activer un voucher',
                      style: Theme.of(context).textTheme.headlineMedium),
                ]).animate().fadeIn().slideX(begin: -0.1, end: 0),
                const SizedBox(height: 40),
                _buildIllustration()
                    .animate()
                    .scale(
                        delay: 100.ms,
                        duration: 500.ms,
                        curve: Curves.elasticOut),
                const SizedBox(height: 32),
                GlassCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Code voucher',
                          style: Theme.of(context).textTheme.labelLarge),
                      const SizedBox(height: 4),
                      Text('Entrez le code reçu de votre revendeur',
                          style: Theme.of(context).textTheme.bodySmall),
                      const SizedBox(height: 20),
                      TextFormField(
                        controller: _codeCtrl,
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          letterSpacing: 3,
                          fontWeight: FontWeight.w700,
                          fontSize: 18,
                        ),
                        textCapitalization: TextCapitalization.characters,
                        textAlign: TextAlign.center,
                        decoration: InputDecoration(
                          hintText: 'XXXX-XXXX-XXXX',
                          hintStyle: const TextStyle(
                            color: AppColors.textMuted,
                            letterSpacing: 3,
                            fontSize: 16,
                          ),
                          prefixIcon: const Icon(
                              Icons.confirmation_number_outlined,
                              color: AppColors.accent),
                          suffixIcon: _codeCtrl.text.isNotEmpty
                              ? IconButton(
                                  icon: const Icon(Icons.clear_rounded,
                                      color: AppColors.textMuted, size: 18),
                                  onPressed: () =>
                                      setState(() => _codeCtrl.clear()),
                                )
                              : null,
                        ),
                        onChanged: (_) => setState(() {
                          _error = null;
                          _success = null;
                        }),
                      ),
                      if (_error != null) ...[
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color:
                                AppColors.disconnected.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                                color: AppColors.disconnected
                                    .withOpacity(0.3)),
                          ),
                          child: Row(children: [
                            const Icon(Icons.error_outline_rounded,
                                color: AppColors.disconnected, size: 16),
                            const SizedBox(width: 8),
                            Expanded(
                                child: Text(_error!,
                                    style: const TextStyle(
                                        color: AppColors.disconnected,
                                        fontSize: 13))),
                          ]),
                        ).animate().shake().fadeIn(),
                      ],
                      if (_success != null) ...[
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.connected.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                                color:
                                    AppColors.connected.withOpacity(0.3)),
                          ),
                          child: Row(children: [
                            const Icon(
                                Icons.check_circle_outline_rounded,
                                color: AppColors.connected,
                                size: 16),
                            const SizedBox(width: 8),
                            Expanded(
                                child: Text(_success!,
                                    style: const TextStyle(
                                        color: AppColors.connected,
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600))),
                          ]),
                        ).animate().scale(
                            duration: 300.ms, curve: Curves.elasticOut),
                      ],
                      const SizedBox(height: 24),
                      GradientButton(
                        label: 'Activer le voucher',
                        isLoading: _loading,
                        onPressed: _redeem,
                      ),
                      if (_success != null) ...[
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: TextButton(
                            onPressed: () => context.go('/home'),
                            child: const Text("Retour à l'accueil",
                                style: TextStyle(
                                    color: AppColors.accent,
                                    fontWeight: FontWeight.w600)),
                          ),
                        ),
                      ],
                    ],
                  ),
                ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2, end: 0),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildIllustration() {
    return Center(
      child: Container(
        width: 90,
        height: 90,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: LinearGradient(
            colors: [
              AppColors.primary.withOpacity(0.3),
              AppColors.accent.withOpacity(0.3)
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          border: Border.all(
              color: AppColors.primary.withOpacity(0.5), width: 2),
        ),
        child: const Icon(Icons.confirmation_number_rounded,
            color: AppColors.accent, size: 42),
      ),
    );
  }
}
