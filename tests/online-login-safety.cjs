const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const rules = fs.readFileSync(path.join(root, "firestore.rules"), "utf8");
const failures = [];
const remoteProviderStart = script.indexOf("const remoteAuthProvider = {");
const remoteLoginStart = script.indexOf("async login({ username, pin })", remoteProviderStart);
const remoteLoginEnd = script.indexOf("async logout()", remoteLoginStart);
const remoteLoginSource = script.slice(remoteLoginStart, remoteLoginEnd);

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

[
  "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
  "ไม่พบบัญชีนี้ในระบบออนไลน์",
  "รหัสผ่านไม่ถูกต้อง",
  "มีการพยายามเข้าสู่ระบบหลายครั้ง กรุณารอสักครู่แล้วลองใหม่",
  "เชื่อมต่อเครือข่ายไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต",
  "บัญชีเข้าสู่ระบบแล้ว แต่ไม่มีสิทธิ์อ่าน/บันทึกข้อมูลผู้เล่น",
  "เข้าสู่ระบบสำเร็จ แต่ระบบไม่สามารถสร้างข้อมูลผู้เล่นได้ เนื่องจาก payload ไม่ตรงกับกฎความปลอดภัย",
  "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
].forEach(message => expect(script.includes(message), `missing login message: ${message}`));

expect(script.includes('createOnlineLoginStageError("firebase-auth", error)'), "Firebase Auth failures are not stage-tagged");
expect(script.includes('createOnlineLoginStageError("player-read", error)'), "player reads are not stage-tagged");
expect(script.includes('createOnlineLoginStageError("player-create", error)'), "player creates are not stage-tagged");
expect(script.includes('warnOptionalOnlineDataFailure("client progress read", error)'), "client progress read is not optional");
expect(script.includes('readCachedPlayerProgress(userId)'), "client progress has no local fallback");
expect(remoteLoginSource.includes('loadProgress(sessionUser.uid, { sessionUser })'), "login does not load progress before committing the session");
expect(remoteLoginSource.indexOf('await progressService.loadProgress(sessionUser.uid, { sessionUser });') < remoteLoginSource.indexOf('playerStorage.set(AUTH_STORAGE_KEYS.currentUser, JSON.stringify(sessionUser));'), "login commits the session before required profile loading finishes");
expect(script.includes('void loadGameAssetOverrides().catch(error => {'), "asset override startup is not isolated from auth startup");

expect(rules.includes('allow get: if isOwner(playerId) || isTeacher();'), "owner cannot read their own /players document");
expect(rules.includes('allow list: if isTeacher();'), "students may list /players or teacher list access is missing");
expect(!rules.includes('allow read, write: if request.auth != null;'), "broad authenticated Firestore access was added");
[
  "grammaria",
  "progress",
  "completedStages",
  "rewardClaims",
  "vsBossAssessmentRecords"
].forEach(field => expect(rules.includes(`'${field}'`), `protected field missing from rules: ${field}`));

const authCopy = {
  remoteLoginFailed: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
  remoteUserNotFound: "ไม่พบบัญชีนี้ในระบบออนไลน์",
  remoteWrongPassword: "รหัสผ่านไม่ถูกต้อง",
  remoteTooManyRequests: "มีการพยายามเข้าสู่ระบบหลายครั้ง กรุณารอสักครู่แล้วลองใหม่",
  remoteNetworkFailed: "เชื่อมต่อเครือข่ายไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต",
  remoteAuthUnavailable: "เชื่อมต่อ Firebase ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ต",
  remotePlayerPermissionDenied: "บัญชีเข้าสู่ระบบแล้ว แต่ไม่มีสิทธิ์อ่าน/บันทึกข้อมูลผู้เล่น กรุณาตรวจสอบ Firestore rules",
  remotePlayerCreateBlocked: "เข้าสู่ระบบสำเร็จ แต่ระบบไม่สามารถสร้างข้อมูลผู้เล่นได้ เนื่องจาก payload ไม่ตรงกับกฎความปลอดภัย",
  remoteLoginDefault: "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
};
const mapperSandbox = { AUTH_COPY: authCopy };
vm.runInNewContext(
  `${extractFunction(script, "isFirebasePermissionDeniedError")}\n${extractFunction(script, "mapFirebaseAuthError")}\nthis.mapLoginError = mapFirebaseAuthError;`,
  mapperSandbox
);
[
  [{ code: "auth/invalid-credential" }, authCopy.remoteLoginFailed],
  [{ code: "auth/user-not-found" }, authCopy.remoteUserNotFound],
  [{ code: "auth/wrong-password" }, authCopy.remoteWrongPassword],
  [{ code: "auth/too-many-requests" }, authCopy.remoteTooManyRequests],
  [{ code: "auth/network-request-failed" }, authCopy.remoteNetworkFailed],
  [{ code: "permission-denied" }, authCopy.remotePlayerPermissionDenied],
  [{ code: "permission-denied", loginStage: "player-create" }, authCopy.remotePlayerCreateBlocked],
  [{ code: "auth/internal-error" }, authCopy.remoteLoginDefault]
].forEach(([error, expected]) => {
  expect(mapperSandbox.mapLoginError(error) === expected, `wrong mapped message for ${error.code}/${error.loginStage || "general"}`);
});

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, checks: 32 }, null, 2));
