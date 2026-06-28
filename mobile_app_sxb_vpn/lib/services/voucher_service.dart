import "package:flutter_riverpod/flutter_riverpod.dart";
import "../core/network/api_client.dart";
import "../core/network/endpoints.dart";

final voucherServiceProvider = Provider<VoucherService>((ref) {
  return VoucherService(ref.watch(apiClientProvider));
});

class VoucherResult {
  final bool success;
  final String? message;
  final String? error;
  final Map<String, dynamic>? data;
  const VoucherResult({required this.success, this.message, this.error, this.data});
}

class VoucherService {
  final ApiClient _api;
  VoucherService(this._api);

  Future<VoucherResult> redeem(String code) async {
    try {
      final response = await _api.post(ApiEndpoints.redeemVoucher, data: {"code": code});
      final json = response.data as Map<String, dynamic>;
      return VoucherResult(
        success: true,
        message: json["message"]?.toString() ?? "Voucher activé avec succès !",
        data: json["data"] as Map<String, dynamic>?,
      );
    } catch (e) {
      final msg = e.toString();
      String error;
      if (msg.contains("404")) {
        error = "Code invalide ou déjà utilisé";
      } else if (msg.contains("400")) {
        error = "Code invalide";
      } else if (msg.contains("409")) {
        error = "Ce voucher a déjà été utilisé";
      } else if (msg.contains("SocketException")) {
        error = "Pas de connexion internet";
      } else {
        error = "Erreur lors de l'activation";
      }
      return VoucherResult(success: false, error: error);
    }
  }
}
