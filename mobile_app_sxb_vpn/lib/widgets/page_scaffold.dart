import 'package:flutter/material.dart';

class PageScaffold extends StatelessWidget {
  final Widget body;

  const PageScaffold({super.key, required this.body});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: body,
        ),
      ),
    );
  }
}
