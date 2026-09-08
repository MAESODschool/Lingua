const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const lessonAudioPath = path.join(root, "assets/audio/lingua-lesson-theme.mp3");
const sourceAudioPath = "/Users/krutuii/Downloads/Lingua Grammar Gate.mp3";
const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
}

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}`);
  const braceStart = source.indexOf("{", start);
  let depth = 0;
  for (let index = braceStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  return "";
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

expect(fs.existsSync(lessonAudioPath), "lesson music asset is missing");
expect(fs.statSync(lessonAudioPath).size > 0, "lesson music asset is empty");
if (fs.existsSync(sourceAudioPath) && fs.existsSync(lessonAudioPath)) {
  expect(sha256(sourceAudioPath) === sha256(lessonAudioPath), "lesson music asset differs from the uploaded source");
}

expect(script.includes('id: "lesson"'), "lesson track id is missing");
expect(script.includes('name: "Lingua Grammar Gate"'), "lesson track name is missing");
expect(script.includes('src: "assets/audio/lingua-lesson-theme.mp3"'), "lesson track path is incorrect");
expect(script.includes("volume: 0.42"), "lesson track volume is incorrect");
expect(script.includes("[LESSON_MUSIC_TRACK.id]: LESSON_MUSIC_TRACK.loop"), "lesson track does not use the shared loop configuration");
expect(script.includes('if (sceneName === "story")'), "story scene has no explicit lesson routing");
expect(script.includes("return LESSON_MUSIC_TRACK.id;"), "story scene does not return the lesson track");
expect(script.includes("state.currentBgmKey === key && !bgmTracks[key].paused"), "shared BGM duplicate-play guard is missing");
expect(script.includes("Object.values(bgmTracks).forEach(track =>"), "mute does not cover all BGM tracks");
expect(script.includes("Lesson music file not found or cannot be played. Continuing without lesson music."), "missing-file warning is absent");
expect(index.includes("script.js?v=lesson-music-20260908"), "lesson music cache version is missing");

const routingSandbox = {
  LESSON_MUSIC_TRACK: { id: "lesson" },
  shouldUseLinguaBreakerBgm: sceneName => ["pvp", "vsBosses", "verbMemoryPractice"].includes(sceneName),
  shouldUseEdForgeBgm: () => false
};
vm.runInNewContext(`${extractFunction(script, "bgmKeyForScene")}\nthis.route = bgmKeyForScene;`, routingSandbox);

const expectedRoutes = {
  story: "lesson",
  login: "login",
  mainMenu: "login",
  createCharacter: "login",
  battle: "battle",
  vsBosses: "linguaBreaker",
  verbMemoryPractice: "linguaBreaker",
  pvp: "linguaBreaker",
  teacherDashboard: "hall",
  assetManager: "hall",
  tutorialGuide: "hall",
  creatorCredits: "hall",
  victory: "hall"
};
Object.entries(expectedRoutes).forEach(([sceneName, expected]) => {
  expect(routingSandbox.route(sceneName) === expected, `${sceneName} routed to the wrong BGM`);
});

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, checks: 27, expectedRoutes }, null, 2));
