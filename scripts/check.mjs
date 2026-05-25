import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const requiredFiles = [
  "package.json",
  "LICENSE",
  "README.md",
  "PRIVACY.md",
  "PUBLISH_BLOCKERS.md",
  "examples/tool-state.json",
  "public/index.html",
  "public/styles.css",
  "public/app.js",
  "public/manifest.webmanifest",
  "public/sw.js",
  "public/icon-192.svg",
  "public/icon-512.svg",
  "scripts/check.mjs",
  "scripts/smoke.mjs"
];
const appSourceFiles = ["public/app.js", "public/sw.js"];
const networkPattern = new RegExp([
  "f" + "etch\\s*\\(",
  "XML" + "HttpRequest",
  "send" + "Beacon",
  "Web" + "Socket",
  "Event" + "Source",
  "node:" + "https",
  "node:" + "http",
  "curl\\s+"
].join("|"), "i");
const remoteAssetPattern = /<(script|link|img|iframe)[^>]+(src|href)=["']https?:\/\//i;

async function main() {
  const contents = new Map();
  for (const file of requiredFiles) {
    const text = await readText(file);
    contents.set(file, text);
    assert(text.trim().length > 0, `${file} must not be empty`);
  }

  const packageJson = JSON.parse(contents.get("package.json"));
  assert(packageJson.private === true, "package must stay private until PWA publication path is final");
  assert(packageJson.type === "module", "package must use ESM");
  assert(packageJson.license === "MIT", "package must declare MIT license for public source release");
  assert(packageJson.homepage === "https://a1local.com.au/extensions/", "package must include the A1 Local tools homepage");
  assert(packageJson.repository?.url === "https://github.com/a1local/adpages-toolkit-pwa.git", "package must include the public source repository URL");
  assert(packageJson.scripts?.check && packageJson.scripts?.smoke, "check and smoke scripts are required");
  assert(!packageJson.dependencies, "PWA scaffold must not add runtime dependencies");

  const manifest = JSON.parse(contents.get("public/manifest.webmanifest"));
  assert(manifest.display === "standalone", "manifest must be installable as standalone");
  assert(manifest.icons?.length >= 2, "manifest must include icon entries");
  assert(manifest.start_url === "./index.html", "manifest start_url should point to local app shell");

  const sample = JSON.parse(contents.get("examples/tool-state.json"));
  assert(sample.utm?.campaign && sample.business?.businessName, "sample state must include UTM and business inputs");

  const html = contents.get("public/index.html");
  assert(html.includes('rel="manifest"'), "HTML must link the manifest");
  assert(html.includes('type="module"'), "HTML must load module app script");
  assert(html.includes("https://a1local.com.au/extensions/"), "HTML must include visible A1 Local/AdPages attribution link");
  assert(html.includes("What this toolkit helps with"), "HTML must explain practical use cases");
  assert(!remoteAssetPattern.test(html), "HTML must not load remote assets");

  const app = contents.get("public/app.js");
  for (const token of ["buildUtmUrl", "validateGoogleAdsCopy", "buildLocalBusinessSchema", "buildLaunchChecklist", "serviceWorker"]) {
    assert(app.includes(token), `app.js must include ${token}`);
  }

  const sw = contents.get("public/sw.js");
  assert(sw.includes("CACHE_NAME") && sw.includes("caches.match"), "service worker must cache the app shell");

  const readme = contents.get("README.md");
  assert(readme.includes("Microsoft Store PWA packaging later"), "README must document Microsoft Store path as later");
  assert(readme.includes("does not make network calls"), "README must disclose local-only behavior");

  const privacy = contents.get("PRIVACY.md");
  assert(privacy.includes("does not collect analytics"), "privacy must disclose analytics behavior");

  for (const file of appSourceFiles) {
    const text = contents.get(file);
    assert(!networkPattern.test(text), `${file} must not include outbound network primitives`);
  }

  console.log("adpages toolkit pwa check ok");
}

async function readText(file) {
  return readFile(new URL(file, root), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
