// Basic smoke test for the SXB VPN app widget tree.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:sst_vpn/widgets/glass_card.dart';

void main() {
  testWidgets('GlassCard renders its child', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: GlassCard(child: Text('hello')),
        ),
      ),
    );

    expect(find.text('hello'), findsOneWidget);
  });
}
