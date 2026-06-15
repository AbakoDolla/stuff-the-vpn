import 'package:flutter/material.dart';

class AppButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isExpanded;

  const AppButton({
    super.key,
    required this.text,
    this.onPressed,
    this.isExpanded = false,
  });

  factory AppButton.google({required VoidCallback? onPressed}) {
    return AppButton(
      text: 'Continue with Google',
      onPressed: onPressed,
    );
  }

  factory AppButton.text({
    required String text,
    required VoidCallback? onPressed,
  }) {
    return AppButton(
      text: text,
      onPressed: onPressed,
    );
  }

  @override
  Widget build(BuildContext context) {
    final button = ElevatedButton(
      onPressed: onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: const Color(0xFF2563EB),
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        padding: const EdgeInsets.symmetric(vertical: 16),
      ),
      child: Text(text, style: const TextStyle(fontSize: 16)),
    );

    if (isExpanded) {
      return Row(
        children: [Expanded(child: button)],
      );
    }

    return button;
  }
}
