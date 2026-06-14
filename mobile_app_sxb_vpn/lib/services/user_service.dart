import "package:flutter_riverpod/flutter_riverpod.dart";
import "../core/network/api_client.dart";
import "../core/network/endpoints.dart";
import "../models/user_model.dart";

final userServiceProvider = Provider<UserService>((ref) {
  return UserService(ref.watch(apiClientProvider));
});

class UsageData {
  final double totalGb;
  final List<DailyUsage> daily;
  final Map<String, double> byApp;
  const UsageData({required this.totalGb, required this.daily, required this.byApp});
}

class DailyUsage {
  final DateTime date;
  final double gb;
  const DailyUsage({required this.date, required this.gb});
}

class UserService {
  final ApiClient _api;
  UserService(this._api);

  Future<UserModel?> getUser(String id) async {
    try {
      final response = await _api.get(ApiEndpoints.user(id));
      final json = response.data as Map<String, dynamic>;
      final payload = (json["data"] as Map<String, dynamic>?) ?? json;
      return UserModel.fromJson(payload);
    } catch (_) {
      return null;
    }
  }

  Future<UsageData> getUsage(String userId) async {
    try {
      final response = await _api.get(ApiEndpoints.usage(userId));
      final json = response.data as Map<String, dynamic>;
      final data = (json["data"] as Map<String, dynamic>?) ?? json;
      final daily = (data["daily"] as List? ?? [])
          .map((d) => DailyUsage(
                date: DateTime.tryParse(d["date"].toString()) ?? DateTime.now(),
                gb: _toDouble(d["gb"]) ?? 0,
              ))
          .toList();
      final byApp = Map<String, double>.from(
        (data["byApp"] as Map? ?? {}).map((k, v) => MapEntry(k.toString(), _toDouble(v) ?? 0)),
      );
      return UsageData(
        totalGb: _toDouble(data["totalGb"]) ?? 3.25,
        daily: daily,
        byApp: byApp,
      );
    } catch (_) {
      return _demoUsage();
    }
  }

  static double? _toDouble(dynamic v) {
    if (v == null) return null;
    if (v is double) return v;
    if (v is int) return v.toDouble();
    return double.tryParse(v.toString());
  }

  UsageData _demoUsage() {
    final now = DateTime.now();
    return UsageData(
      totalGb: 3.25,
      daily: List.generate(30, (i) => DailyUsage(
        date: now.subtract(Duration(days: 29 - i)),
        gb: 0.05 + (i * 0.08) % 0.5,
      )),
      byApp: {
        "YouTube": 1.25,
        "Instagram": 0.82,
        "Chrome": 0.61,
        "Autres": 0.55,
      },
    );
  }
}