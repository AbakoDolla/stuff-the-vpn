import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/storage/secure_storage.dart';
import '../models/device_activation_model.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/device_service.dart';

/// Activation state for the current device session.
class ActivationState {
  final bool isActivated;
  final bool isChecking;
  final DeviceActivationResult? activationResult;
  final UserModel? user;
  final String? error;

  const ActivationState({
    this.isActivated  = false,
    this.isChecking   = true,
    this.activationResult,
    this.user,
    this.error,
  });

  ActivationState copyWith({
    bool? isActivated,
    bool? isChecking,
    DeviceActivationResult? activationResult,
    UserModel? user,
    String? error,
  }) {
    return ActivationState(
      isActivated:       isActivated       ?? this.isActivated,
      isChecking:        isChecking        ?? this.isChecking,
      activationResult:  activationResult  ?? this.activationResult,
      user:              user              ?? this.user,
      error:             error,
    );
  }
}

class ActivationNotifier extends AsyncNotifier<ActivationState> {
  @override
  Future<ActivationState> build() async {
    // 1. Check local storage first (fast path)
    final storage       = ref.read(secureStorageProvider);
    final locallyActive = await storage.isDeviceActivated();

    if (!locallyActive) {
      return const ActivationState(isActivated: false, isChecking: false);
    }

    // 2. Validate the stored JWT with the backend (GET /auth/me)
    final authService = ref.read(authServiceProvider);
    final user        = await authService.getMe();

    if (user == null) {
      // Token invalid / expired — clear session, require re-activation
      await storage.clearAll();
      return const ActivationState(isActivated: false, isChecking: false);
    }

    return ActivationState(
      isActivated: true,
      isChecking:  false,
      user:        user,
    );
  }

  /// Activates the device with the provided token (and optional contact info).
  /// On success the user will not see the activation screen again as long as
  /// the backend keeps the device in ACTIVE status.
  Future<void> activate({
    required String token,
    String? phone,
    String? email,
    String? name,
    String? appVersion,
  }) async {
    state = const AsyncValue.loading();
    try {
      final deviceService = ref.read(deviceServiceProvider);
      final response      = await deviceService.activateDevice(
        token:      token,
        phone:      phone,
        email:      email,
        name:       name,
        appVersion: appVersion,
      );

      if (!response.success || response.result == null) {
        state = AsyncValue.data(ActivationState(
          isActivated: false,
          isChecking:  false,
          error:       response.error ?? 'Activation failed',
        ));
        return;
      }

      state = AsyncValue.data(ActivationState(
        isActivated:      true,
        isChecking:       false,
        activationResult: response.result,
        user:             response.result!.user,
      ));
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  /// Clears the local session so the activation screen is shown again.
  Future<void> deactivate() async {
    await ref.read(secureStorageProvider).clearAll();
    state = const AsyncValue.data(
      ActivationState(isActivated: false, isChecking: false),
    );
  }

  /// Re-validates the current session against the backend.
  Future<void> revalidate() async {
    final storage = ref.read(secureStorageProvider);
    final stored  = await storage.isDeviceActivated();
    if (!stored) {
      state = const AsyncValue.data(
        ActivationState(isActivated: false, isChecking: false),
      );
      return;
    }
    final user = await ref.read(authServiceProvider).getMe();
    if (user == null) {
      await storage.clearAll();
      state = const AsyncValue.data(
        ActivationState(isActivated: false, isChecking: false),
      );
    } else {
      state = AsyncValue.data(
        ActivationState(isActivated: true, isChecking: false, user: user),
      );
    }
  }
}

final activationProvider =
    AsyncNotifierProvider<ActivationNotifier, ActivationState>(
  () => ActivationNotifier(),
);
