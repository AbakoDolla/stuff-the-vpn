import 'package:flutter/material.dart';

class MainScaffold extends StatelessWidget {
  final Widget body;
  final int selectedIndex;
  final Function(int) onDestinationSelected;

  const MainScaffold({
    super.key,
    required this.body,
    required this.selectedIndex,
    required this.onDestinationSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: body,
      bottomNavigationBar: NavigationBar(
        selectedIndex: selectedIndex,
        onDestinationSelected: onDestinationSelected,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.public), label: 'Servers'),
          NavigationDestination(icon: Icon(Icons.person), label: 'Profile'),
          NavigationDestination(icon: Icon(Icons.bar_chart), label: 'Usage'),
        ],
      ),
    );
  }
}
