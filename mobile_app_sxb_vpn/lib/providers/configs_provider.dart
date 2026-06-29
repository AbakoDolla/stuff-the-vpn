import 'package:flutter_riverpod/flutter_riverpod.dart';

class ConfigsState {
  final Map<String, String> configs;
  final bool loading;
  final String? error;

  const ConfigsState({this.configs = const {}, this.loading = false, this.error});

  ConfigsState copyWith({Map<String, String>? configs, bool? loading, String? error}) {
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
    return const ConfigsState();
  }

  Future<void> refresh() async {
    // Reserved for future remote config fetch
  }
}

final configsProvider =
    AsyncNotifierProvider<ConfigsNotifier, ConfigsState>(() => ConfigsNotifier());
