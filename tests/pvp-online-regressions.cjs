const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const rules = fs.readFileSync(path.join(root, "firestore.rules"), "utf8");
let checks = 0;

function check(condition, message) {
  checks += 1;
  assert.ok(condition, message);
}

function extractFunction(name) {
  const signature = `function ${name}`;
  const start = script.indexOf(signature);
  assert.ok(start >= 0, `Missing ${name}`);
  const braceStart = script.indexOf("{", start);
  let depth = 0;
  for (let cursor = braceStart; cursor < script.length; cursor += 1) {
    if (script[cursor] === "{") depth += 1;
    if (script[cursor] === "}") depth -= 1;
    if (depth === 0) return script.slice(start, cursor + 1);
  }
  throw new Error(`Unclosed function ${name}`);
}

function extractConstant(name) {
  const start = script.indexOf(`const ${name} =`);
  assert.ok(start >= 0, `Missing ${name}`);
  const tail = script.slice(start);
  const end = tail.match(/\n[}\]][^\n]*;/);
  assert.ok(end, `Missing end of ${name}`);
  return tail.slice(0, end.index + end[0].length);
}

const pvpMarkup = index.slice(index.indexOf('id="pvpDuelScene"'), index.indexOf('id="tutorialGuideScene"'));
const pvpRuntime = script.slice(script.indexOf('const PVP_ONLINE_COLLECTION'), script.indexOf('function renderMainMenuVsBossOverallRank'));
check(!pvpMarkup.includes("จำลอง:"), "player-facing PvP still exposes mock controls");
check(!pvpMarkup.includes("pvpMockOpponent"), "mock opponent controls remain in the PvP scene");
check(pvpMarkup.includes("สร้างห้องออนไลน์"), "online room creation is missing");
check(pvpMarkup.includes("เข้าร่วมห้องออนไลน์"), "online room join is missing");
check(pvpMarkup.includes("pvpForfeitButton"), "online forfeit control is missing");
check(pvpMarkup.includes('pattern="[A-HJ-NP-Z2-9]{6}"'), "room code input does not validate the six-character format");

const laneSource = extractFunction("createPvpOnlineLane");
check(laneSource.includes("questionChoicesToSend: createPvpOnlineQuestionChoices()"), "online lanes start without question choices");
const onlineFoundationSource = extractFunction("renderPvpOnlineFoundationState");
check(onlineFoundationSource.includes('roomStatus === "playing"'), "playing rooms are still treated as lobby-only");
check(!onlineFoundationSource.includes("ระบบต่อสู้ออนไลน์จะเปิดในรอบถัดไป"), "online combat is still marked as unavailable");
check(extractFunction("enterPvpMode").includes("resetPvpOnlineLobbyState()"), "PvP does not open in the online lobby");
check(extractFunction("enterPvpMode").includes("resumePvpOnlineRoom()"), "saved online room is not resumed on entry");
check(extractFunction("exitPvpMode").includes("setPvpParticipantConnection(false)"), "leaving the scene does not update online presence");
check(extractFunction("leaveOnlinePvpRoom").includes('status: "finished"'), "leaving an active match does not finish it");
check(extractFunction("leaveOnlinePvpRoom").includes('status: "abandoned"'), "leaving a waiting room does not abandon it");
check(extractFunction("submitOnlinePvpAnswer").includes('pvpState.phase = "answer-result"'), "online answers skip result feedback");
check(extractFunction("continueAfterPvpAnswerResult").includes('pvpState.mode !== "online"'), "online answer continuation replaces server question choices");
check(extractFunction("updateOnlinePvpLane").includes("didUpdate"), "stale online actions are reported as successful");
check(script.includes('void resolveOnlinePvpAction();'), "interrupted online action resolution has no retry path");
check(script.includes('els.pvpForfeitButton?.classList.toggle("hidden"'), "forfeit remains permanently hidden during online matches");
check(!pvpRuntime.includes("progressService.saveProgress"), "PvP writes into player progress");
check(!pvpRuntime.includes("savePlayerData("), "PvP grants or persists profile rewards");

const sandbox = { Math, Date };
vm.runInNewContext([
  extractConstant("PVP_MOCK_QUESTION_BANK"),
  extractFunction("pvpRandomItem"),
  extractFunction("normalizePvpRoomCode"),
  extractFunction("isValidPvpRoomCode"),
  extractFunction("createPvpOnlineQuestionChoices"),
  extractFunction("createPvpOnlineLane"),
  extractFunction("normalizePvpAnswer"),
  extractFunction("getPvpAcceptedAnswers"),
  extractFunction("evaluatePvpAnswer"),
  "this.lane = createPvpOnlineLane();",
  "this.evaluate = evaluatePvpAnswer;",
  "this.validRoomCode = isValidPvpRoomCode;",
  "this.bank = PVP_MOCK_QUESTION_BANK;"
].join("\n"), sandbox);

check(sandbox.lane.phase === "send-question", "new online lane starts in the wrong phase");
check(sandbox.lane.questionChoicesToSend.length === 3, "new online lane does not receive three question choices");
check(
  [...sandbox.lane.questionChoicesToSend.map(question => question.difficulty)].sort().join(",") === "easy,hard,medium",
  "new online lane does not receive easy, medium and hard choices"
);
const sampleQuestion = sandbox.bank.find(question => question.id === "pvp-easy-001");
check(sandbox.evaluate(sampleQuestion, " WAS ").correct === true, "online answer normalization rejects a valid answer");
check(sandbox.evaluate(sampleQuestion, "were").correct === false, "online answer evaluation accepts an invalid answer");
check(sandbox.validRoomCode("ab2cd3") === true, "valid room code is rejected");
check(sandbox.validRoomCode("ABC/12") === false, "invalid Firestore room path is accepted");

check(rules.includes("match /pvpRooms/{roomId}"), "Firestore PvP room rules are missing");
check(rules.includes("isJoiningAsPlayerB()"), "Firestore does not guard the second-player join transition");
check(rules.includes("keepsPvpRoomIdentity()"), "Firestore does not preserve PvP room participant identity");
check(rules.includes("pvpRoomShapeIsValid(roomId)"), "Firestore does not validate PvP room shape and HP bounds");
check(rules.includes("request.resource.data.players.A.hp <= 120"), "Firestore does not cap Player A HP");
check(rules.includes("request.resource.data.players.B.hp <= 120"), "Firestore does not cap Player B HP");

console.log(JSON.stringify({ ok: true, checks }, null, 2));
