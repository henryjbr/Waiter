const { copyFileSync, mkdirSync } = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..", "..");
const webRoot = path.join(__dirname, "..", "www");
const webFiles = ["index.html", "script.js", "style.css", "supabase-config.js"];

mkdirSync(webRoot, { recursive: true });

for (const file of webFiles) {
  copyFileSync(path.join(projectRoot, file), path.join(webRoot, file));
  console.log(`Sincronizado: ${file}`);
}
