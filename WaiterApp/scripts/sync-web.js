const { copyFileSync, mkdirSync } = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..", "..");
const webRoot = path.join(__dirname, "..", "www");
const webFiles = [
  path.join("dist", "index.html"),
  path.join("dist", "style.css"),
  path.join("dist", "bundle.js"),
];

mkdirSync(webRoot, { recursive: true });

for (const file of webFiles) {
  const destination = path.join(webRoot, file);
  mkdirSync(path.dirname(destination), { recursive: true });
  copyFileSync(path.join(projectRoot, file), destination);
  console.log(`Sincronizado: ${file}`);
}
