import "package:flutter_riverpod/flutter_riverpod.dart";
import "../core/network/api_client.dart";
import "../core/network/endpoints.dart";
import "../models/user_model.dart";

final userServiceProvider = Provider<UserService>((ref) {
  return UserService(ref.watch(apiClientProvider));
});

class UsageData {
  final double totalGb;
  final double uploadGb;
  final double downloadGb;
  final List<DailyUsage> daily;
  final Map<String, double> byApp;
  const UsageData({
    required this.totalGb,
    this.uploadGb = 0,
    this.downloadGb = 0,
    required this.daily,
    required this.byApp,
  });
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

  /// Get current user profile from /user/profile
  Future<UserModel?> getProfile() async {
    try {
      final response = await _api.get(ApiEndpoints.userProfile);
      final json = response.data as Map<String, dynamic>;
      final payload = (json["data"] as Map<String, dynamic>?) ?? json;
      return UserModel.fromJson(payload);
    } catch (_) {
      return null;
    }
  }

  /// Get current user subscription from /user/subscription
  Future<Map<String, dynamic>?> getSubscription() async {
    try {
      final response = await _api.get(ApiEndpoints.userSubscription);
      final json = response.data as Map<String, dynamic>;
      return (json["data"] as Map<String, dynamic>?) ?? json;
    } catch (_) {
      return null;
    }
  }

  /// Get current user status from /user/status
  Future<Map<String, dynamic>?> getStatus() async {
    try {
      final response = await _api.get(ApiEndpoints.userStatus);
      final json = response.data as Map<String, dynamic>;
      return (json["data"] as Map<String, dynamic>?) ?? json;
    } catch (_) {
      return null;
    }
  }

  Future<UsageData> getUsage(String userId) async {
    try {
      final response = await _api.get(ApiEndpoints.usage(userId));
      final json = response.data as Map<String, dynamic>;
      final data = (json["data"] as Map<String, dynamic>?) ?? json;

      final uploadGb = _toDouble(data["totalUploadGB"]) ?? 0.0;
      final downloadGb = _toDouble(data["totalDownloadGB"]) ?? 0.0;
      final totalGb = uploadGb + downloadGb;

      final logs = data["logs"] as List? ?? [];
      final Map<String, double> dailyMap = {};
      for (final log in logs) {
        final raw = log["createdAt"]?.toString() ?? log["date"]?.toString();
        if (raw == null) continue;
        final dt = DateTime.tryParse(raw);
        if (dt == null) continue;
        final key = "${dt.year}-${dt.month.toString().padLeft(2,"0")}-${dt.day.toString().padLeft(2,"0")}";
        final gb = (_toDouble(log["uploadGB"]) ?? 0) + (_toDouble(log["downloadGB"]) ?? 0);
        dailyMap[key] = (dailyMap[key] ?? 0) + gb;
      }

      final now = DateTime.now();
      final daily = List.generate(30, (i) {
        final d = now.subtract(Duration(days: 29 - i));
        final key = "${d.year}-${d.month.toString().padLeft(2,"0")}-${d.day.toString().padLeft(2,"0")}";
        return DailyUsage(date: d, gb: dailyMap[key] ?? 0);
      });

      return UsageData(
        totalGb: totalGb > 0 ? totalGb : 0,
        uploadGb: uploadGb,
        downloadGb: downloadGb,
        daily: daily,
        byApp: {"Upload": uploadGb, "Download": downloadGb},
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
      totalGb: 0,
      daily: List.generate(30, (i) => DailyUsage(
        date: now.subtract(Duration(days: 29 - i)),
        gb: 0,
      )),
      byApp: {"Upload": 0, "Download": 0},
    );
  }
}