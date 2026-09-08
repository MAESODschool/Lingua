const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const rules = fs.readFileSync(path.join(root, "firestore.rules"), "utf8");
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

expect(script.includes('const STUDENT_DASHBOARD_COLLECTION = "players"'), "Teacher Dashboard does not use players");
expect(script.includes('const PLAYER_CLIENT_PROGRESS_COLLECTION = "playerClientProgress"'), "client progress collection is missing");
expect(script.includes("isCurrentUserTeacherClaimed(true)"), "Teacher Dashboard does not force-refresh its claim");
const loadStart = script.indexOf("async function loadTeacherDashboardRecords");
const claimCheck = script.indexOf("isCurrentUserTeacherClaimed(true)", loadStart);
const playersQuery = script.indexOf("getDocs(collection(firestoreDb, STUDENT_DASHBOARD_COLLECTION))", loadStart);
expect(claimCheck >= loadStart && claimCheck < playersQuery, "claim is not refreshed before the players query");
expect(index.includes("script.js?v=teacher-dashboard-permission-20260908"), "Teacher Dashboard cache version is missing");

expect(rules.includes("function isTeacherOrAdmin()"), "isTeacherOrAdmin rules helper is missing");
expect(rules.includes("request.auth.token.get('teacher', false) == true"), "teacher claim is missing from rules");
expect(rules.includes("request.auth.token.get('admin', false) == true"), "admin claim is missing from rules");
expect(rules.includes("match /players/{playerId}"), "players rules are missing");
expect(rules.includes("allow get: if isOwner(playerId) || isTeacher();"), "players get rule is incorrect");
expect(rules.includes("allow list: if isTeacher();"), "teachers cannot list players");
expect(rules.includes("isOwner(playerId) && ownerPlayerUpdateIsValid()"), "owner player update allowlist is missing");
expect(rules.includes("affectedKeys().hasOnly(ownerPlayerUpdateKeys())"), "owner updates are not field-restricted");
expect(rules.includes("hasAny(protectedPlayerKeys())"), "protected player fields are not guarded");
expect(rules.includes("match /playerClientProgress/{playerId}"), "client progress rules are missing");

(async () => {
  const requestedUid = "WJtnnbrZibUUyYOS348hHDVVbf53";
  let refreshArgument = null;
  const sandbox = {
    getAuthMode: () => "firebase",
    firebaseAuth: {
      currentUser: {
        uid: requestedUid,
        getIdTokenResult: async forceRefresh => {
          refreshArgument = forceRefresh;
          return { claims: { teacher: true } };
        }
      }
    },
    waitForFirebaseAuthReady: async () => null,
    console: { error() {} }
  };
  vm.runInNewContext(
    `${extractFunction(script, "isCurrentUserTeacherClaimed")}\n` +
    "this.isTeacherClaimed = isCurrentUserTeacherClaimed;",
    sandbox
  );
  expect(await sandbox.isTeacherClaimed(true) === true, `teacher UID ${requestedUid} was rejected`);
  expect(refreshArgument === true, `teacher UID ${requestedUid} token was not force-refreshed`);

  if (failures.length) {
    console.error(JSON.stringify({ ok: false, failures }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({
    ok: true,
    checks: 17,
    teacherUid: requestedUid,
    collections: ["players", "playerClientProgress"]
  }, null, 2));
})().catch(error => {
  console.error(error);
  process.exit(1);
});
