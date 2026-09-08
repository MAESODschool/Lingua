const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
}

function extractFunction(source, name) {
  const asyncStart = source.indexOf(`async function ${name}`);
  const start = asyncStart >= 0 ? asyncStart : source.indexOf(`function ${name}`);
  if (start < 0) return "";
  const parameterEnd = source.indexOf(")", start);
  const braceStart = source.indexOf("{", parameterEnd);
  let depth = 0;
  for (let index = braceStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  return "";
}

const teacherLoader = extractFunction(script, "loadTeacherDashboardRecords");
const teacherScene = extractFunction(script, "showTeacherDashboard");
const assetPanel = extractFunction(script, "openAssetManagerPanel");
const assetUpload = extractFunction(script, "uploadGameAssetOverride");

expect(script.includes("const ASSET_MANAGER_ENABLED = false;"), "Asset Manager feature flag is not disabled");
expect(!script.includes("firebase-storage.js"), "Firebase Storage SDK is still imported");
expect(!/\bgetStorage\s*\(/.test(script), "Firebase Storage is still initialized");
expect(script.includes("const firebaseStorage = null;"), "Storage does not remain inert while Asset Manager is disabled");
expect(assetPanel.includes("if (!ASSET_MANAGER_ENABLED)"), "Asset Manager panel is not guarded by the disabled feature flag");
expect(assetUpload.includes("validateAssetManagerWriteAccess(assetKey)"), "dormant upload code lost its access guard");
expect(script.includes("async function uploadGameAssetOverride"), "Asset Manager upload implementation was deleted");

expect(/id="customizeGameButton"[^>]*class="[^"]*hidden[^"]*"[^>]*hidden[^>]*disabled/.test(index), "main-menu Asset Manager entry is not hidden and disabled");
expect(/id="assetManagerButton"[^>]*class="[^"]*hidden[^"]*"[^>]*hidden[^>]*disabled/.test(index), "Teacher Dashboard Asset Manager button is not hidden and disabled");
expect(script.includes('els.assetManagerButton.classList.add("hidden")'), "Teacher Dashboard does not enforce the hidden Asset Manager button at runtime");
expect(script.includes("if (ASSET_MANAGER_ENABLED) {\n  els.assetManagerButton?.addEventListener"), "Asset Manager click binding is not feature-gated");
expect(script.includes("if (ASSET_MANAGER_ENABLED) {\n    void loadGameAssetOverrides()"), "startup Asset Override loading is not feature-gated");

expect(teacherLoader.includes("isCurrentUserTeacherClaimed(true)"), "Teacher claim force refresh was removed");
expect(teacherLoader.includes("getDocs(collection(firestoreDb, STUDENT_DASHBOARD_COLLECTION))"), "Teacher student-list Firestore read was removed");
expect(teacherLoader.includes("getDocs(collection(firestoreDb, PLAYER_CLIENT_PROGRESS_COLLECTION))"), "Teacher progress Firestore read was removed");
expect(teacherScene.includes("teacherDashboardStudents = await loadTeacherDashboardRecords()"), "Teacher Dashboard no longer loads student data");
expect(teacherScene.includes("renderTeacherDashboardSummary(teacherDashboardStudents)"), "Teacher Dashboard statistics render was removed");
expect(teacherScene.includes("renderTeacherDashboardTable()"), "Teacher Dashboard table render was removed");
expect(index.includes("script.js?v=teacher-dashboard-no-storage-boss-assets-20260908"), "Teacher Dashboard cache version is missing");

if (failures.length) {
  console.error(`Teacher Dashboard no-Storage checks failed (${failures.length}):`);
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Teacher Dashboard no-Storage checks passed (21 assertions).");
