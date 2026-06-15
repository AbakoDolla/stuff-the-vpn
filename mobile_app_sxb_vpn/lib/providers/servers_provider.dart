import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/server_model.dart';

final serversProvider = FutureProvider<List<ServerModel>>((ref) async {
  // TODO: Implement server fetching
  return [];
});
