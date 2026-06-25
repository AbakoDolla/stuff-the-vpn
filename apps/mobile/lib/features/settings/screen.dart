import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../services/api_service.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});
  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _currCtrl = TextEditingController();
  final _newCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _changing = false;

  @override
  void dispose() { _currCtrl.dispose(); _newCtrl.dispose(); _confirmCtrl.dispose(); super.dispose(); }

  Future<void> _changePassword() async {
    if (_newCtrl.text != _confirmCtrl.text) {
      _showSnack('Les mots de passe ne correspondent pas', error: true);
      return;
    }
    setState(() => _changing = true);
    try {
      await ApiService.changePassword(_currCtrl.text, _newCtrl.text);
      _currCtrl.clear(); _newCtrl.clear(); _confirmCtrl.clear();
      _showSnack('Mot de passe mis à jour');
    } catch (e) {
      _showSnack(e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _changing = false);
    }
  }

  void _showSnack(String msg, {bool error = false}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: error ? const Color(0xFFEF4444) : const Color(0xFF10B981),
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Paramètres')),
      body: ListView(padding: const EdgeInsets.all(20), children: [
        const Text('SÉCURITÉ', style: TextStyle(color: Color(0xFF64748B), fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 1.5)),
        const SizedBox(height: 10),
        Container(
          decoration: BoxDecoration(color: const Color(0xFF0F1629), borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFF1E2D45))),
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Changer le mot de passe', style: TextStyle(color: Color(0xFFF1F5F9), fontSize: 15, fontWeight: FontWeight.w600)),
            const SizedBox(height: 16),
            _pwField('Mot de passe actuel', _currCtrl),
            const SizedBox(height: 12),
            _pwField('Nouveau mot de passe', _newCtrl),
            const SizedBox(height: 12),
            _pwField('Confirmer le nouveau', _confirmCtrl),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _changing ? null : _changePassword,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0099FF),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 13),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: _changing ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Text('Mettre à jour'),
              ),
            ),
          ]),
        ),
        const SizedBox(height: 24),
        const Text('INFORMATIONS', style: TextStyle(color: Color(0xFF64748B), fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 1.5)),
        const SizedBox(height: 10),
        Container(
          decoration: BoxDecoration(color: const Color(0xFF0F1629), borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFF1E2D45))),
          child: Column(children: [
            _infoTile('Version', '1.0.0'),
            _infoTile('Serveur API', '185.237.15.214'),
            _infoTile('Protocoles', 'VLESS · VMESS · TROJAN · SSH'),
          ]),
        ),
      ]),
    );
  }

  Widget _pwField(String label, TextEditingController ctrl) {
    return TextField(
      controller: ctrl,
      obscureText: true,
      style: const TextStyle(color: Color(0xFFF1F5F9)),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 13),
        filled: true,
        fillColor: const Color(0xFF141C2E),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF1E2D45))),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF1E2D45))),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF0099FF))),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      ),
    );
  }

  Widget _infoTile(String label, String value) {
    return InkWell(
      onLongPress: () {
        Clipboard.setData(ClipboardData(text: value));
        _showSnack('Copié !');
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFF1E2D45), width: 0.5))),
        child: Row(children: [
          Expanded(child: Text(label, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13))),
          Text(value, style: const TextStyle(color: Color(0xFF64748B), fontSize: 12, fontFamily: 'monospace')),
        ]),
      ),
    );
  }
}
