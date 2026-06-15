import 'package:flutter/material.dart';

class VpnButton extends StatelessWidget {
  final bool isConnected;
  final VoidCallback? onPressed;

  const VpnButton({super.key, this.isConnected = false, this.onPressed});

  @override
  Widget build(BuildContext context) {
    return FloatingActionButton(
      onPressed: onPressed,
      shape: const CircleBorder(),
      child: Icon(isConnected ? Icons.vpn_key_off : Icons.vpn_key),
    );
  }
}
