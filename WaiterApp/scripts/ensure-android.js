const { existsSync } = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const appRoot = path.resolve(__dirname, "..");
const androidPath = path.join(appRoot, "platforms", "android");

if (existsSync(androidPath)) {
  console.log("Plataforma Android pronta.");
  process.exit(0);
}

const packageJson = require(path.join(appRoot, "package.json"));
const androidVersion = packageJson.devDependencies["cordova-android"];
const cordovaCli = require.resolve("cordova/bin/cordova");

console.log(`Instalando plataforma Android ${androidVersion}...`);

const result = spawnSync(
  process.execPath,
  [cordovaCli, "platform", "add", `android@${androidVersion}`, "--nosave"],
  { cwd: appRoot, stdio: "inherit" }
);

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

if (!existsSync(androidPath)) {
  throw new Error("O Cordova terminou sem criar platforms/android.");
}

console.log("Plataforma Android criada com sucesso.");
