const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
}

const assets = [
  ["Was-Were Wisp", "assets/enemies/was-were-wisp.png", "WAS_WERE_WISP_IMAGE_PATH"],
  ["Memory Lantern", "assets/enemies/memory-lantern.png", "MEMORY_LANTERN_IMAGE_PATH"],
  ["Lost Pouch Imp", "assets/enemies/lost-pouch-imp.png", "LOST_POUCH_IMP_IMAGE_PATH"],
  ["Memory Bat", "assets/enemies/memory-bat.png", "MEMORY_BAT_IMAGE_PATH"],
  ["The Memory Breaker", "assets/enemies/the-memory-breaker.png", "MEMORY_BREAKER_IMAGE_PATH"]
];

for (const [bossName, relativePath, constantName] of assets) {
  const absolutePath = path.join(root, relativePath);
  expect(fs.existsSync(absolutePath), `${bossName} replacement file is missing`);
  if (!fs.existsSync(absolutePath)) continue;
  const png = fs.readFileSync(absolutePath);
  expect(png.subarray(1, 4).toString("ascii") === "PNG", `${bossName} replacement is not a PNG`);
  expect(png[25] === 6, `${bossName} replacement is not RGBA with transparency support`);
  expect(script.includes(`const ${constantName} = "${relativePath}";`), `${bossName} path constant is incorrect`);
}

expect(script.includes('portrait: MEMORY_BREAKER_IMAGE_PATH'), "Memory Breaker dialogue portrait does not use the replacement");
expect(script.includes('"Memory Lantern": MEMORY_LANTERN_IMAGE_PATH'), "Memory Lantern story sprite mapping is incorrect");
expect(script.includes('"Lost Pouch Imp": LOST_POUCH_IMP_IMAGE_PATH'), "Lost Pouch Imp story sprite mapping is incorrect");
expect(script.includes('"Memory Bat": MEMORY_BAT_IMAGE_PATH'), "Memory Bat story sprite mapping is incorrect");
expect(script.includes('fallbackImage: MEMORY_BREAKER_IMAGE_PATH'), "Memory Breaker VS Bosses fallback is incorrect");
expect(index.includes('id="verbMemoryBossSprite" class="verb-memory-boss-sprite" src="assets/enemies/the-memory-breaker.png"'), "Verb Memory Practice still uses the old Memory Breaker image");
expect(index.includes("script.js?v=teacher-dashboard-no-storage-boss-assets-20260908"), "boss asset cache version is missing");

if (failures.length) {
  console.error(`Boss asset replacement checks failed (${failures.length}):`);
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Boss asset replacement checks passed (${assets.length} transparent PNG assets).`);
