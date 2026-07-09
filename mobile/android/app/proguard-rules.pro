# Flutter/ProGuard rules for SXB VPN

# Keep Flutter classes
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.**  { *; }
-keep class io.flutter.util.**  { *; }
-keep class io.flutter.view.**  { *; }
-keep class io.flutter.**  { *; }
-keep class io.flutter.plugins.**  { *; }

# Keep HTTP client classes
-keep class com.google.httpclient.** { *; }
-keep class org.apache.http.** { *; }

# Keep JSON serialization
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes Exceptions

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep R classes
-keepclassmembers class **.R$* {
    public static <fields>;
}

# Keep enums
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Obfuscate network URLs (security)
-keep class com.sxbvpn.app.** { *; }

# Prevent stripping of secure storage
-keep class androidx.security.crypto.** { *; }

# Keep Flutter Secure Storage
-keep class com.it_nomads.fluttersecurestorage.** { *; }

# Remove logging in release
-assumenosideeffects class android.util.Log {
    public static int v(...);
    public static int d(...);
    public static int i(...);
}
