SxB Mobile (scaffold)

Instructions rapides pour lancer l'application mobile locale:

1. Vérifier le SDK Flutter installé (ici le projet suppose le SDK déjà installé):

```powershell
& 'C:\\Users\\Evans Abah\\Documents\\flutter\\bin\\flutter.bat' doctor -v
```

2. Installer les dépendances et lancer sur un appareil disponible:

```bash
cd mobile
flutter pub get
flutter run -d chrome
```

3. Si vous voulez utiliser un émulateur Android, installez d'abord Android Studio / Android SDK et créez un AVD.

```bash
flutter emulators
flutter emulators --create --name pixel
flutter emulators --launch pixel
flutter run
```

Remarques:
- Le scaffold a été amélioré pour afficher l'URL backend, un token Bearer optionnel, et le résultat de `/admin/stats`.
- Si `flutter doctor` indique qu'il manque l'Android SDK ou un AVD, installez les composants Android nécessaires.
- Si `flutter doctor` échoue pendant `pub get`, vérifiez la connexion internet ou le proxy système.
