import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class ConfigsState {
  final Map<String, String> configs;
  final bool loading;
  final String? error;

  const ConfigsState({
    this.configs = const {},
    this.loading = false,
    this.error,
  });

  ConfigsState copyWith({
    Map<String, String>? configs,
    bool? loading,
    String? error,
  }) {
    return ConfigsState(
      configs: configs ?? this.configs,
      loading: loading ?? this.loading,
      error: error,
    );
  }

  String? get(String key) => configs[key];
  int getInt(String key, int fallback) => int.tryParse(configs[key] ?? '') ?? fallback;
  bool getBool(String key) => (configs[key] ?? '').toLowerCase() == 'true';
}

class ConfigsNotifier extends AsyncNotifier<ConfigsState> {
  @override
  Future<ConfigsState> build() async {
    await _loadConfigs();
    return const ConfigsState();
  }

  Future<void> _loadConfigs() async {
    state = const AsyncValue.loading();
    try {
      final response = await Supabase.instance.client
          .from('configs')
          .select()
          .order('category');

      final Map<String, String> cfg = {};
      for (final item in response) {
        cfg[item['key']?.toString() ?? ''] = item['value']?.toString() ?? '';
      }

      state = AsyncValue.data(ConfigsState(configs: cfg, loading: false));
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> refresh() async {
    await _loadConfigs();
  }
}

final configsProvider =
    AsyncNotifierProvider<ConfigsNotifier, ConfigsState>(
        () => ConfigsNotifier());
