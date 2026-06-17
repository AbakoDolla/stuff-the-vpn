allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    project.evaluationDependsOn(":app")
}

subprojects {
    val setupAndroid: (Project) -> Unit = { p ->
        if (p.hasProperty("android")) {
            val android = p.extensions.getByName("android") as com.android.build.gradle.BaseExtension
            android.apply {
                if (compileSdkVersion == null) {
                    compileSdkVersion(34)
                }
                defaultConfig {
                    if (minSdkVersion == null) {
                        minSdkVersion(21)
                    }
                    if (targetSdkVersion == null) {
                        targetSdkVersion(34)
                    }
                }
            }
        }
    }

    if (project.state.executed) {
        setupAndroid(project)
    } else {
        project.afterEvaluate {
            setupAndroid(project)
        }
    }
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
