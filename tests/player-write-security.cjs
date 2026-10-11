const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const rules = fs.readFileSync(path.join(root, "firestore.rules"), "utf8");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
}

function includesAll(source, values) {
  return values.every(value => source.includes(value));
}

const playersMatch = rules.match(/match \/players\/\{playerId\} \{([\s\S]*?)\n    \}/)?.[1] || "";
const clientProgressMatch = rules.match(/match \/playerClientProgress\/\{playerId\} \{([\s\S]*?)\n    \}/)?.[1] || "";

expect(!rules.includes("allow create: if isOwner(playerId);"), "broad owner create rule remains");
expect(!rules.includes("allow update: if isOwner(playerId) || isTeacher();"), "broad owner update rule remains");
expect(playersMatch.includes("ownerPlayerCreateIsValid(playerId)"), "safe owner create guard is missing");
expect(playersMatch.includes("ownerPlayerUpdateIsValid()"), "safe owner update guard is missing");
expect(playersMatch.includes("teacherPlayerUpdateIsValid()"), "teacher update allowlist guard is missing");
expect(playersMatch.includes("allow get: if isOwner(playerId) || isTeacher();"), "owner/teacher get rule is missing");
expect(playersMatch.includes("allow list: if isTeacher();"), "teacher-only list rule is missing");
expect(playersMatch.includes("allow delete: if false;"), "player delete is not denied");

expect(rules.includes("request.resource.data.diff(resource.data).affectedKeys().hasOnly(ownerPlayerUpdateKeys())"), "owner update does not use affected-key allowlisting");
expect(includesAll(rules, [
  "'grammaria'", "'progress'", "'completedStages'", "'unlockedStages'", "'defeatedBosses'",
  "'rewardClaims'", "'bossPracticeScores'", "'vsBossAssessmentRecords'", "'vsBossScoreHistory'",
  "'role'", "'admin'", "'teacher'"
]), "protected player field coverage is incomplete");
expect(rules.includes("request.auth.token.get('teacher', false) == true"), "teacher custom claim check is missing");
expect(rules.includes("request.auth.token.get('admin', false) == true"), "admin custom claim check is missing");

expect(clientProgressMatch.includes("clientProgressCreateIsValid(playerId)"), "client-reported progress create guard is missing");
expect(clientProgressMatch.includes("clientProgressUpdateIsValid(playerId)"), "client-reported progress update guard is missing");
expect(clientProgressMatch.includes("allow list: if isTeacher();"), "client progress list is not teacher-only");
expect(clientProgressMatch.includes("allow delete: if false;"), "client progress delete is not denied");
expect(rules.includes("request.resource.data.clientReported == true"), "client-reported marker is not required");

expect(script.includes("function sanitizeOwnerPlayerProfilePayload"), "owner payload sanitizer is missing");
expect(script.includes("function sanitizeTeacherPlayerUpdatePayload"), "teacher payload sanitizer is missing");
expect(script.includes("function normalizeLegacyPlayerDocSafely"), "legacy player compatibility helper is missing");
expect(script.includes("function validatePlayerWritePayloadSafety"), "development payload validator is missing");
expect(script.includes("getPlayerClientProgressDocRef(userId)"), "general progress save is not routed to client progress");
expect(script.includes("getPlayerClientProgressDocRef(ownerId)"), "practice score save is not routed to client progress");
expect(!script.includes("[`progress.bossPracticeScores.${bossId}`]"), "VS Bosses still writes progress directly to /players");
expect(!script.includes("transaction.update(playerRef, {\n        verbMemoryPracticeBest"), "Verb Memory still writes directly to /players");
expect(script.includes("ระบบออนไลน์ไม่อนุญาตให้บันทึกข้อมูลส่วนนี้ ข้อมูลการเล่นยังอยู่ในเครื่องนี้"), "permission-denied fallback message is missing");

const result = {
  ok: failures.length === 0,
  failures,
  checks: 24
};

console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exitCode = 1;
