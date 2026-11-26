const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "script.js"), "utf8");
const bankSource = fs.readFileSync(path.join(root, "assets/data/irregular_verb_memory_bank.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
function constant(name) {
  const start = source.indexOf(`const ${name} =`);
  assert.ok(start >= 0, `Missing ${name}`);
  const tail = source.slice(start);
  const end = tail.match(/\n[}\]][^\n]*;/);
  assert.ok(end, `Missing end of ${name}`);
  return tail.slice(0, end.index + end[0].length);
}

class Element {
  constructor(tagName = "div") {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.className = "";
    this.style = {};
    this.dataset = {};
    this.attributes = {};
    this.listeners = {};
    this.disabled = false;
    this.value = "";
    this.classList = {
      contains: name => this.className.split(/\s+/).includes(name),
      toggle: (name, enabled) => {
        const values = new Set(this.className.split(/\s+/).filter(Boolean));
        const add = enabled ?? !values.has(name);
        if (add) values.add(name); else values.delete(name);
        this.className = [...values].join(" ");
        return add;
      },
      add: name => this.classList.toggle(name, true),
      remove: name => this.classList.toggle(name, false)
    };
  }
  set textContent(value) { this.text = String(value); this.children = []; }
  get textContent() { return this.text || ""; }
  appendChild(child) { this.children.push(child); return child; }
  addEventListener(type, handler) { this.listeners[type] = handler; }
  click() { if (!this.disabled) this.listeners.click?.(); }
  querySelectorAll(selector) { return this.children.filter(child => child.tagName.toLowerCase() === selector); }
  closest() { return this; }
  scrollIntoView() {}
  getAttribute(name) { return this[name] || this.attributes[name] || null; }
  removeAttribute(name) { delete this[name]; delete this.attributes[name]; }
}

function fixture() {
  const clock = {
    now: 10000, sequence: 0, jobs: new Map(),
    set(callback, delay) {
      const id = ++this.sequence;
      this.jobs.set(id, { at: this.now + delay, callback });
      return id;
    },
    advance(duration) {
      const end = this.now + duration;
      for (;;) {
        const next = [...this.jobs].filter(([, job]) => job.at <= end)
          .sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
        if (!next) break;
        this.now = Math.max(this.now, next[1].at);
        this.jobs.delete(next[0]);
        next[1].callback();
      }
      this.now = end;
    }
  };
  const local = new Map();
  const remote = new Map();
  const writes = [];
  const user = { uid: "student-a", isGuest: true };
  const els = Object.fromEntries([...html.matchAll(/id="(verbMemory[^"]+)"/g)].map(match => [match[1], new Element()]));
  const snapshot = ref => ({ exists: () => remote.has(ref), data: () => remote.get(ref) });
  const context = vm.createContext({
    console: { log() {}, info() {}, warn() {}, error() {} },
    Date: class extends Date { static now() { return clock.now; } },
    setTimeout: (callback, delay) => clock.set(callback, delay),
    clearTimeout: id => clock.jobs.delete(id),
    document: { createElement: tag => new Element(tag) }, els,
    MEMORY_BREAKER_IMAGE_PATH: "assets/enemies/the-memory-breaker.png",
    MEMORY_BREAKER_FALLBACK_IMAGE_PATH: "assets/enemies/memory-breaker.png",
    getGameAssetUrl: (_key, fallback) => fallback,
    getCurrentUser: () => user,
    getAuthMode: () => context.authMode,
    authMode: "local", firebaseAuth: { currentUser: { uid: user.uid } }, firestoreDb: {},
    playerData: { userId: user.uid, grammaria: 123 },
    playerStorage: { get: key => local.get(key) || null, set: (key, value) => local.set(key, value) },
    getPlayerClientProgressDocRef: uid => `playerClientProgress/${uid}`,
    getPlayerDocRef: uid => `players/${uid}`,
    getDoc: async ref => snapshot(ref),
    runTransaction: async (_db, callback) => callback({
      get: async ref => snapshot(ref),
      set: (ref, payload) => { writes.push({ ref, payload }); remote.set(ref, payload); }
    }),
    buildClientReportedProgressPayload: (uid, progress) => ({ uid, authUid: uid, clientReported: true, schemaVersion: 1, progress }),
    createTimestampIso: () => new Date(clock.now).toISOString(),
    clamp: (number, min, max) => Math.min(max, Math.max(min, number)),
    closeGameModal() {}, renderMainMenu() {}, showScene() {}
  });
  context.window = context;
  vm.runInContext(bankSource, context);
  vm.runInContext(`
    const IRREGULAR_VERB_MEMORY_BANK = window.IRREGULAR_VERB_MEMORY_BANK;
    const IRREGULAR_VERB_MEMORY_LEVEL_TWO_BANK = Object.freeze([...IRREGULAR_VERB_MEMORY_BANK, ...window.IRREGULAR_VERB_MEMORY_LEVEL_TWO_EXTRA]);
    const VERB_MEMORY_SLOTS = ["v1", "v2", "v3"];
    const VERB_MEMORY_SCORE_BY_SLOT = { v1: 10, v2: 12, v3: 15 };
    const VERB_MEMORY_FORBIDDEN_OPTION_PATTERN = /^(?:undefined|null|todo|wrong option|distractor|placeholder|ตัวเลือกหลอก)$/i;
    ${constant("VERB_MEMORY_CONFIG")}
    ${constant("VERB_MEMORY_LEVELS")}
    ${constant("verbMemoryPracticeState")}
    this.practice = verbMemoryPracticeState;
  `, context);
  vm.runInContext(source.slice(source.indexOf("function getVerbMemoryLevel("), source.indexOf("function startPracticeLessonFromMap(")), context);
  return { context, state: context.practice, clock, els, local, remote, writes, user,
    run: code => vm.runInContext(code, context),
    async open(levelId) { context.practice.levelId = levelId; await context.openVerbMemoryPracticeScene(); }
  };
}
const flush = () => new Promise(resolve => setImmediate(resolve));

(async () => {
  const test = fixture();
  assert.equal(test.run("getVerbMemoryBank(1).length"), 169);
  assert.equal(test.run("getVerbMemoryBank(2).length"), 219);
  assert.equal(test.context.IRREGULAR_VERB_MEMORY_LEVEL_TWO_EXTRA.length, 50);
  assert.equal(test.run("new Set(getVerbMemoryBank(2).map(v => v.id)).size"), 219);
  assert.equal(test.run("new Set(getVerbMemoryBank(2).map(v => v.v1)).size"), 219);
  for (const levelId of [1, 2]) {
    assert.equal(test.run(`validateIrregularVerbMemoryBank(${levelId}).ok`), true);
    const choices = test.run(`validateVerbMemoryChoiceGeneration({levelId:${levelId},runsPerCase:12})`);
    assert.equal(choices.ok, true, JSON.stringify(choices.failures));
    assert.equal(choices.levelId, levelId, "Validation cache must be scoped to the bank");
  }
  assert.equal(test.run("IRREGULAR_VERB_MEMORY_LEVEL_TWO_BANK.slice(169).every(v => getValidVerbMemoryMissingSlots(v).length > 0)"), true);

  await test.open(1);
  assert.equal(test.state.bossMaxHp, 1000);
  assert.equal(test.state.answerDeadline, null);
  const first = test.state.currentChallenge;
  test.clock.advance(20000);
  assert.equal(test.state.playerHp, 100);
  assert.equal(test.state.currentChallenge, first, "Level 1 must remain untimed");
  assert.ok(test.els.verbMemoryTimer.classList.contains("hidden"));

  await test.open(2);
  assert.equal(test.state.bossHp, 2000);
  assert.equal(test.state.answerDeadline - test.clock.now, 5000);
  assert.equal(test.els.verbMemoryBossLevelSelect.value, "2");
  assert.ok(!test.els.verbMemoryTimer.classList.contains("hidden"));
  assert.equal(test.els.verbMemoryBossSprite.src, "assets/enemies/the-memory-breaker.png");
  const expiredQuestion = test.state.currentChallenge;
  test.clock.advance(4999);
  assert.equal(test.state.playerHp, 100);
  test.clock.advance(1);
  assert.equal(test.state.playerHp, 95);
  assert.equal(test.state.bossHp, 2000);
  assert.equal(test.state.timedOut, 1);
  assert.equal(test.state.wrong, 1);
  assert.equal(test.state.total, 1);
  assert.equal(test.state.answerTimer, null);
  test.context.handleVerbMemoryChoice(expiredQuestion.correctAnswer, expiredQuestion);
  assert.equal(test.state.playerHp, 95, "Expired answers cannot incur a second penalty");
  test.clock.advance(1050);
  assert.equal(test.state.answerDeadline - test.clock.now, 5000, "Next word receives its own full deadline");
  const total = test.state.total;
  test.context.handleVerbMemoryChoice(expiredQuestion.correctAnswer, expiredQuestion);
  assert.equal(test.state.total, total, "Stale question handlers cannot answer the next word");

  const timely = test.state.currentChallenge;
  test.clock.advance(4999);
  test.context.handleVerbMemoryChoice(timely.correctAnswer, timely);
  assert.equal(test.state.correct, 1);
  assert.equal(test.state.bossHp, 1985);
  test.clock.advance(1);
  assert.equal(test.state.playerHp, 95, "A timely answer must cancel its timeout");

  await test.open(2);
  test.clock.now += 6000; // Simulate a throttled tab before queued timer callbacks run.
  test.context.handleVerbMemoryChoice(test.state.currentChallenge.correctAnswer);
  assert.equal(test.state.playerHp, 95, "A late click cannot beat a delayed timer callback");
  assert.equal(test.state.correct, 0);
  test.clock.advance(1050);
  test.context.handleVerbMemoryChoice("wrong answer");
  assert.equal(test.state.playerHp, 85, "Ordinary wrong answers retain the existing HP 10 penalty");

  await test.open(2);
  const oldTimer = test.clock.jobs.get(test.state.answerTimer).callback;
  test.els.verbMemoryBossLevelSelect.value = "1";
  test.context.changeVerbMemoryBossLevel();
  await flush();
  oldTimer();
  test.clock.advance(10000);
  assert.equal(test.state.levelId, 1);
  assert.equal(test.state.bossHp, 1000);
  assert.equal(test.state.playerHp, 100, "Changing levels cancels the previous deadline");
  await test.open(2);
  test.context.returnFromVerbMemoryPracticeToMainMenu();
  test.clock.advance(10000);
  assert.equal(test.state.playerHp, 100, "Leaving practice stops timed damage");
  assert.equal(test.state.active, false);
  assert.equal(test.state.answerDeadline, null);

  await test.open(2);
  for (let index = 0; index < 20; index += 1) {
    test.clock.advance(5000);
    assert.equal(test.state.playerHp, 100 - (index + 1) * 5);
    test.clock.advance(1050);
  }
  await flush();
  assert.equal(test.state.lastResult.reason, "player-defeated");
  assert.equal(test.state.lastResult.levelId, 2);
  assert.equal(test.state.lastResult.timedOut, 20);
  assert.equal(test.state.active, false);
  assert.equal(test.state.answerTimer, null);
  assert.match(test.els.verbMemoryResultTaunt.textContent, /The Memory Breaker:.*ฮ่า/);
  assert.ok(!test.els.verbMemoryResultTaunt.classList.contains("hidden"));
  assert.equal(test.context.playerData.grammaria, 123, "Practice must not award real Grammaria");
  await test.open(2);
  test.state.bossHp = 15;
  test.context.handleVerbMemoryChoice(test.state.currentChallenge.correctAnswer);
  test.clock.advance(1050);
  await flush();
  assert.equal(test.state.lastResult.reason, "boss-defeated");
  assert.ok(test.els.verbMemoryResultTaunt.classList.contains("hidden"), "Victory must clear the defeat taunt");
  assert.equal(test.state.answerTimer, null);
  assert.ok(test.els.verbMemoryTimer.classList.contains("hidden"));

  const score = fixture();
  score.local.set("lingua:verbMemoryPracticeBest:student-a", JSON.stringify({ bestScore: 999, attempts: 3 }));
  await score.open(2);
  assert.equal(score.state.bestRecord.bestScore, 0, "Level 2 cannot inherit the old level 1 score");
  const result = { levelId: 2, ownerId: score.user.uid, sessionId: score.state.sessionId, score: 40, total: 2, correct: 1, bestStreak: 1 };
  await score.context.saveVerbMemoryPracticeBestScore(result);
  assert.equal(JSON.parse(score.local.get("lingua:verbMemoryPracticeBest:student-a")).bestScore, 999);
  assert.equal(JSON.parse(score.local.get("lingua:verbMemoryPracticeBest:student-a:level2")).bestScore, 40);
  assert.equal(score.context.playerData.verbMemoryPracticeBestByLevel[2].bestScore, 40, "The normal progress snapshot must keep the latest result");
  await score.open(1);
  assert.equal(score.state.bestRecord.bestScore, 999, "Existing scores keep their original storage key");
  assert.equal(score.context.playerData.verbMemoryPracticeBest.bestScore, 999);
  await score.open(2);
  assert.equal(score.state.bestRecord.bestScore, 40);

  score.context.authMode = "firebase";
  score.user.isGuest = false;
  score.remote.set("playerClientProgress/student-a", { progress: { verbMemoryPracticeBest: { bestScore: 999 }, storyMarker: "preserve" } });
  await score.context.saveVerbMemoryPracticeBestScore({ ...result, sessionId: score.state.sessionId, score: 70 });
  const write = score.writes.at(-1);
  assert.equal(write.ref, "playerClientProgress/student-a");
  assert.equal(write.payload.clientReported, true);
  assert.equal(write.payload.progress.verbMemoryPracticeBest.bestScore, 999);
  assert.equal(write.payload.progress.verbMemoryPracticeBestByLevel[2].bestScore, 70);
  assert.equal(write.payload.progress.storyMarker, "preserve");
  assert.equal(score.context.playerData.verbMemoryPracticeBestByLevel[2].bestScore, 70, "Returning to the menu must not overwrite the newly saved record");
  score.user.uid = "student-b";
  await assert.rejects(score.context.saveVerbMemoryPracticeBestScore(result), /player changed/);
  assert.equal(score.writes.length, 1, "Account changes must not write another player's result");

  const pending = fixture();
  await pending.open(1);
  pending.context.authMode = "firebase";
  pending.user.isGuest = false;
  let releaseLoad;
  pending.context.getDoc = () => new Promise(resolve => { releaseLoad = resolve; });
  const oldLoad = pending.context.loadVerbMemoryPracticeBestScore({ force: true });
  pending.state.levelId = 2;
  pending.context.resetVerbMemoryPracticeState({ preserveBest: false });
  releaseLoad({ exists: () => true, data: () => ({ progress: { verbMemoryPracticeBest: { bestScore: 555 } } }) });
  await oldLoad;
  assert.equal(pending.state.bestRecord, null, "A delayed level 1 load cannot overwrite level 2's record");

  const offline = fixture();
  await offline.open(2);
  offline.context.playerData.verbMemoryPracticeBestByLevel[2] = { bestScore: 300, attempts: 4 };
  offline.context.authMode = "firebase";
  offline.user.isGuest = false;
  offline.context.getDoc = async () => { throw new Error("offline"); };
  await offline.context.loadVerbMemoryPracticeBestScore({ force: true });
  assert.equal(offline.state.bestRecord.bestScore, 300, "An offline load must preserve a known best score");
  assert.equal(offline.context.playerData.verbMemoryPracticeBestByLevel[2].bestScore, 300);
  assert.equal(offline.writes.length, 0);

  const saving = fixture();
  await saving.open(2);
  let releaseSave;
  saving.context.saveVerbMemoryPracticeBestScore = () => new Promise(resolve => { releaseSave = resolve; });
  const oldFinish = saving.context.finishVerbMemoryPracticeGame("player-defeated");
  saving.state.levelId = 1;
  await saving.context.openVerbMemoryPracticeScene();
  releaseSave({ isNewBest: true });
  await oldFinish;
  assert.equal(saving.state.levelId, 1);
  assert.equal(saving.state.bossHp, 1000);
  assert.equal(saving.state.active, true);
  assert.ok(saving.els.verbMemoryResultPanel.classList.contains("hidden"), "A delayed result cannot cover a new round");

  console.log("PASS: Verb Memory levels, 169+50 verbs, choice validation, 5-second deadlines, HP penalties, timer cleanup, defeat taunt, isolated records and mocked client-progress persistence");
})().catch(error => { console.error(error); process.exitCode = 1; });
