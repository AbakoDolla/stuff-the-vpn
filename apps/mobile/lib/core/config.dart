/// Configuration de l'application SxBVPN.
/// Pour définir l'URL backend à la compilation :
///   flutter run --dart-define=BACKEND_URL=http://10.0.2.2:5000/api   (émulateur Android)
///   flutter run --dart-define=BACKEND_URL=http://192.168.X.X:5000/api (appareil physique)
class AppConfig {
  static const String backendUrl = String.fromEnvironment(
    'BACKEND_URL',
    defaultValue: 'http://10.0.2.2:5000/api', // localhost depuis l'émulateur Android
  );
}
