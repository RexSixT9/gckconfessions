const fs = require("fs");
const path = require("path");

const nodeModulesDir = path.join(process.cwd(), "node_modules");
const targetFile = path.join(nodeModulesDir, "tsconfig.json");
const analyticsTsconfig = path.join(nodeModulesDir, "@vercel", "analytics", "tsconfig.json");

if (!fs.existsSync(nodeModulesDir)) {
  process.exit(0);
}

if (fs.existsSync(targetFile)) {
  // continue
}

if (!fs.existsSync(targetFile)) {
  const content = {
    compilerOptions: {},
  };

  fs.writeFileSync(targetFile, `${JSON.stringify(content, null, 2)}\n`, "utf8");
  console.log("[postinstall] Created node_modules/tsconfig.json for dependency tsconfig compatibility.");
}

if (fs.existsSync(analyticsTsconfig)) {
  try {
    const raw = fs.readFileSync(analyticsTsconfig, "utf8");
    const parsed = JSON.parse(raw);
    parsed.extends = "../../../tsconfig.json";
    fs.writeFileSync(analyticsTsconfig, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
    console.log("[postinstall] Patched @vercel/analytics/tsconfig.json extends path for editor compatibility.");
  } catch (error) {
    console.warn("[postinstall] Could not patch @vercel/analytics/tsconfig.json", error);
  }
}
