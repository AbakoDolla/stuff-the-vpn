import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';

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

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_formKey.currentState?.validate() ?? false) {
      // TODO: Implement voucher redeem
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
            AppTextField(
              hint: 'Voucher Code',
              controller: _codeController,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter a voucher code';
                }
                return null;
              },
            ),
            const Gap(32),
            AppButton(
              text: 'Redeem',
              onPressed: _submit,
              isExpanded: true,
            ),
          ],
        ),
      ),
    );
  }
}
