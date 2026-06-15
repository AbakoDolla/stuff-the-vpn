import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';

import '../../core/app_colors.dart';
import '../../core/app_ext.dart';
import '../../core/app_form.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_logo.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/page_scaffold.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_formKey.currentState?.validate() ?? false) {
      await ref.read(authStateProvider.notifier).login(
            _emailController.text,
            _passwordController.text,
          );
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<AsyncValue<AuthState>>(authStateProvider, (previous, next) {
      next.when(
        data: (state) {
          if (state.isAuthenticated) {
            context.go('/home');
          }
        },
        error: (error, stack) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(error.toString())),
          );
        },
        loading: () {},
      );
    });

    final authState = ref.watch(authStateProvider);

    return PageScaffold(
      body: Form(
        key: _formKey,
        child: Column(
          children: [
            const AppLogo().ext.expand(),
            AppTextField(
              hint: 'Email',
              controller: _emailController,
              validator: AppForm.emailValidator,
              keyboardType: TextInputType.emailAddress,
            ),
            const Gap(24),
            AppTextField(
              hint: 'Password',
              isPassword: true,
              controller: _passwordController,
              validator: AppForm.passwordValidator,
            ),
            const Gap(32),
            AppButton(
              text: 'Login',
              onPressed: authState.isLoading ? null : _submit,
              isExpanded: true,
            ),
            const Gap(16),
            AppButton.google(
              onPressed: authState.isLoading
                  ? null
                  : () => ref.read(authStateProvider.notifier).loginWithGoogle(),
            ),
            const Gap(24),
            AppButton.text(
              text: 'Create an account',
              onPressed: () => context.go('/auth/register'),
            ),
          ],
        ),
      ),
    );
  }
}
