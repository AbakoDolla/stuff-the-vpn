#!/usr/bin/env node

/**
 * SxB VPN - Deployment Verification Script
 * Vérifie que l'application est prête pour le déploiement
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const checks = [];
let passedCount = 0;
let failedCount = 0;

function pass(message) {
  console.log(`✅ ${message}`);
  passedCount++;
}

function fail(message) {
  console.log(`❌ ${message}`);
  failedCount++;
}

function warn(message) {
  console.log(`⚠️ ${message}`);
}

console.log("\n========== SxB VPN - Deployment Verification ==========\n");

// 1. Vérifier que l'APK existe
console.log("📦 Checking APK file...");
const apkPath = path.join(__dirname, "public", "downloads", "sxb-vpn.apk");
if (fs.existsSync(apkPath)) {
  const stats = fs.statSync(apkPath);
  pass(`APK found at ${apkPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
} else {
  fail(`APK not found at ${apkPath}`);
}

// 2. Vérifier les fichiers de configuration
console.log("\n📁 Checking configuration files...");
const envExample = path.join(__dirname, ".env.example");
const envProdExample = path.join(__dirname, ".env.production.example");

if (fs.existsSync(envExample)) {
  pass(".env.example exists");
} else {
  fail(".env.example missing");
}

if (fs.existsSync(envProdExample)) {
  pass(".env.production.example exists");
} else {
  warn(".env.production.example missing");
}

// 3. Vérifier la structure du projet
console.log("\n📂 Checking project structure...");
const requiredDirs = ["src", "dist", "public"];
for (const dir of requiredDirs) {
  const dirPath = path.join(__dirname, dir);
  if (fs.existsSync(dirPath)) {
    pass(`${dir}/ directory exists`);
  } else if (dir === "dist") {
    warn("dist/ directory not found (normal before build)");
  } else {
    fail(`${dir}/ directory missing`);
  }
}

// 4. Vérifier les fichiers source critiques
console.log("\n🔍 Checking source files...");
const criticalFiles = [
  "src/app.ts",
  "src/index.ts",
  "src/config/env.ts",
];

for (const file of criticalFiles) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    pass(`${file} found`);
  } else {
    fail(`${file} missing`);
  }
}

// 5. Vérifier qu'il n'y a pas de doublon de route APK
console.log("\n🛡️ Checking for code issues...");
const indexTsPath = path.join(__dirname, "src", "index.ts");
if (fs.existsSync(indexTsPath)) {
  const indexContent = fs.readFileSync(indexTsPath, "utf-8");
  if (indexContent.includes("app.get('/api/apk/download')")) {
    fail("Duplicate APK route found in src/index.ts - this should be removed!");
  } else {
    pass("No duplicate APK route in src/index.ts");
  }
}

// 6. Vérifier package.json
console.log("\n📋 Checking package.json...");
const packageJsonPath = path.join(__dirname, "package.json");
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  if (packageJson.scripts && packageJson.scripts.build) {
    pass("Build script configured");
  } else {
    fail("Build script missing");
  }

  if (packageJson.scripts && packageJson.scripts.start) {
    pass("Start script configured");
  } else {
    fail("Start script missing");
  }
}

// 7. Vérifier vercel.json
console.log("\n☁️ Checking Vercel configuration...");
const vercelJsonPath = path.join(__dirname, "vercel.json");
if (fs.existsSync(vercelJsonPath)) {
  pass("vercel.json exists");
  const vercelJson = JSON.parse(fs.readFileSync(vercelJsonPath, "utf-8"));
  if (vercelJson.builds && vercelJson.routes) {
    pass("vercel.json has correct structure");
  } else {
    warn("vercel.json may need review");
  }
}

// 8. Résumé
console.log("\n========== Summary ==========\n");
console.log(`✅ Passed: ${passedCount}`);
console.log(`❌ Failed: ${failedCount}`);
console.log(`⚠️ Warnings: Check the output above\n`);

if (failedCount === 0) {
  console.log("🎉 All checks passed! Ready for deployment.");
  process.exit(0);
} else {
  console.log("🔧 Please fix the issues above before deploying.");
  process.exit(1);
}
