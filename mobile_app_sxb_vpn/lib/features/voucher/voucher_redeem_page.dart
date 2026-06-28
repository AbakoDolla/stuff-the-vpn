import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';

import '../../services/voucher_service.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/page_scaffold.dart';

class VoucherRedeemPage extends ConsumerStatefulWidget {
  const VoucherRedeemPage({super.key});

  @override
  ConsumerState<VoucherRedeemPage> createState() => _VoucherRedeemPageState();
}

class _VoucherRedeemPageState extends ConsumerState<VoucherRedeemPage> {
  final _formKey = GlobalKey<FormState>();
  final _codeController = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    setState(() => _loading = true);

    final service = ref.read(voucherServiceProvider);
    final result = await service.redeem(_codeController.text.trim());

    if (!mounted) return;
    setState(() => _loading = false);

    if (result.success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result.message ?? 'Voucher activé avec succès !'),
          backgroundColor: Colors.green.shade600,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
      // Retour à la home avec rechargement du profil
      if (context.mounted) context.go('/home');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result.error ?? 'Erreur lors de l\'activation'),
          backgroundColor: Colors.red.shade600,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      body: Form(
        key: _formKey,
        child: Column(
          children: [
            const Gap(32),
            PremiumTextField(
              hint: 'Code Voucher',
              controller: _codeController,
              prefixIcon: Icons.confirmation_number_outlined,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Veuillez entrer un code voucher';
                }
                return null;
              },
            ),
            const Gap(32),
            AppButton(
              text: _loading ? 'Activation...' : 'Activer le voucher',
              onPressed: _loading ? null : _submit,
              isExpanded: true,
            ),
          ],
        ),
      ),
    );
  }
}
