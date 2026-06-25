import 'package:flutter/material.dart';
import '../../services/api_service.dart';

class VoucherScreen extends StatefulWidget {
  const VoucherScreen({super.key});
  @override
  State<VoucherScreen> createState() => _VoucherScreenState();
}

class _VoucherScreenState extends State<VoucherScreen> {
  final _ctrl = TextEditingController();
  bool _loading = false;
  String? _error;
  bool _success = false;

  Future<void> _redeem() async {
    if (_ctrl.text.trim().isEmpty) return;
    setState(() { _loading = true; _error = null; _success = false; });
    try {
      await ApiService.redeemVoucher(_ctrl.text.trim());
      if (mounted) setState(() { _success = true; _ctrl.clear(); });
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Voucher')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF0A1A35), Color(0xFF0F1E38)]),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF1E2D45)),
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Icon(Icons.confirmation_num, color: Color(0xFF0099FF), size: 32),
                const SizedBox(height: 12),
                const Text('Activer un voucher', style: TextStyle(color: Color(0xFFF1F5F9), fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                const Text('Entrez votre code voucher pour ajouter du quota à votre compte.', style: TextStyle(color: Color(0xFF64748B), fontSize: 13)),
              ]),
            ),
            const SizedBox(height: 32),
            const Text('Code voucher', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13, fontWeight: FontWeight.w500)),
            const SizedBox(height: 8),
            TextField(
              controller: _ctrl,
              textCapitalization: TextCapitalization.characters,
              style: const TextStyle(color: Color(0xFFF1F5F9), letterSpacing: 2, fontWeight: FontWeight.w600),
              decoration: InputDecoration(
                hintText: 'SXB-XXXX-XXXX-XXXX',
                hintStyle: const TextStyle(color: Color(0xFF1E2D45), letterSpacing: 2),
                filled: true,
                fillColor: const Color(0xFF0F1629),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF1E2D45))),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF1E2D45))),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF0099FF), width: 1.5)),
                prefixIcon: const Icon(Icons.tag, color: Color(0xFF64748B)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: Colors.red.withOpacity(0.1), borderRadius: BorderRadius.circular(10), border: Border.all(color: Colors.red.withOpacity(0.3))),
                child: Row(children: [
                  const Icon(Icons.error_outline, color: Colors.red, size: 16),
                  const SizedBox(width: 8),
                  Expanded(child: Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 13))),
                ]),
              ),
            ],
            if (_success) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: const Color(0xFF10B981).withOpacity(0.1), borderRadius: BorderRadius.circular(10), border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3))),
                child: const Row(children: [
                  Icon(Icons.check_circle, color: Color(0xFF10B981), size: 16),
                  SizedBox(width: 8),
                  Text('Voucher activé avec succès !', style: TextStyle(color: Color(0xFF10B981), fontSize: 13)),
                ]),
              ),
            ],
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _loading ? null : _redeem,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0099FF),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                child: _loading
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Activer le voucher', style: TextStyle(fontWeight: FontWeight.w600)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
