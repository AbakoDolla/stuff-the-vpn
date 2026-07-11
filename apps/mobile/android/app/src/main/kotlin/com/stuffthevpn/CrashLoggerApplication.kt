package com.stuffthevpn

import io.flutter.app.FlutterApplication
import java.io.File
import java.io.FileWriter
import java.io.PrintWriter
import java.io.StringWriter
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Application personnalisée qui intercepte TOUTE exception non gérée
 * (y compris celles qui surviennent avant même que le moteur Flutter
 * ne démarre, pendant l'enregistrement des plugins natifs) et écrit
 * la trace complète dans un fichier texte lisible sans PC ni root.
 *
 * Fichier généré dans :
 *   /Android/data/com.stuffthevpn.app/files/crash_TIMESTAMP.txt
 * (visible avec n'importe quel gestionnaire de fichiers)
 */
class CrashLoggerApplication : FlutterApplication() {
    override fun onCreate() {
        super.onCreate()

        val defaultHandler = Thread.getDefaultUncaughtExceptionHandler()

        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            try {
                val sw = StringWriter()
                throwable.printStackTrace(PrintWriter(sw))

                val timestamp = SimpleDateFormat("yyyy-MM-dd_HH-mm-ss", Locale.US).format(Date())
                val dir = getExternalFilesDir(null)
                if (dir != null) {
                    if (!dir.exists()) dir.mkdirs()
                    val file = File(dir, "crash_$timestamp.txt")
                    FileWriter(file).use { writer ->
                        writer.write("=== STUFF THE VPN CRASH LOG ===\n")
                        writer.write("Time: $timestamp\n")
                        writer.write("Thread: ${thread.name}\n\n")
                        writer.write(sw.toString())
                    }
                }
            } catch (e: Exception) {
                // Ne jamais laisser le logger lui-même planter
            }
            // Laisse le comportement normal du crash se produire ensuite
            // (le dialogue système "l'app s'est arrêtée" s'affichera comme avant)
            defaultHandler?.uncaughtException(thread, throwable)
        }
    }
}
