const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "script.js"), "utf8");
function declaration(name, kind = "function") {
  const start = source.indexOf(kind + " " + name + (kind === "function" ? "(" : " ="));
  assert.ok(start >= 0, "Missing " + name);
  const tail = source.slice(start);
  const end = kind === "function" ? tail.indexOf("\n}") + 2 : tail.indexOf(";\n") + 1;
  assert.ok(end > 1, "Missing end of " + name);
  return tail.slice(0, end);
}
function element() {
  const classes = new Set();
  return {
    dataset: {}, textContent: "", innerHTML: "", attributes: {},
    classList: {
      add(...values) { values.forEach(v => classes.add(v)); },
      remove(...values) { values.forEach(v => classes.delete(v)); },
      contains(v) { return classes.has(v); },
      toggle(v, force = !classes.has(v)) { force ? classes.add(v) : classes.delete(v); }
    },
    setAttribute(k, v) { this.attributes[k] = v; },
    removeAttribute(k) { delete this.attributes[k]; if (k === "src") delete this.src; }
  };
}
const els = Object.fromEntries([
  "act1EpilogueVisual", "act1EpilogueSummary", "act1PastGuardian", "act1GuardianSprite",
  "act1PastCrystal", "act1PastCrystalImage", "act1CrystalLabel", "lessonActLabel",
  "lessonLocationLabel", "dialoguePanel", "dialogueActions", "dialoguePortraitSlot",
  "dialogueSpeakerPortrait", "lessonStoryVisual", "nounActivityVisual", "nounActivity",
  "nextDialogueButton", "previousDialogueButton", "storyNameForm", "speakerName", "dialogueText"
].map(k => [k, element()]));
const stage = { id: "final-boss", type: "final-boss", enemy: "The Memory Breaker", questions: [{}] };
let saved, assessment = 0, rewards = 0, resultContinue, saveCount = 0, practiceReturns = 0, vsFinishes = 0;
const state = {
  lessonStorySteps: [], lessonSteps: [], lessonStoryStepIndex: 0,
  practiceMode: { active: false }, vsBossPractice: { active: false }
};
const ctx = vm.createContext({
  els, state, playerData: { grammaria: 432, progress: { pastFragmentAct: {} } },
  scenes: { story: element() }, verbMemoryPracticeState: { active: false }, pvpState: { active: false },
  console: { log() {}, warn() {} }, Math, JSON,
  clamp: (n, min, max) => Math.min(max, Math.max(min, n)),
  loadProgress: () => saved,
  saveProgress: update => { Object.assign(saved, update); saveCount++; return saved; },
  ensureGrammariaState() {},
  getStageById: id => id === stage.id ? stage : { id, questions: [] },
  getStageIndexById: () => 0,
  isFinalBossStage: s => s?.id === "final-boss",
  isReplayingStage: s => Boolean(s && state.activeReplayLessonId === s.id),
  isPracticeModeActive: () => state.practiceMode.active,
  isVsBossPracticeActive: () => state.vsBossPractice.active,
  getLessonSegmentDefinition: () => ({ postBossDialogue: ["บทเดิม", { optionalMasterQuestionId: "past" }] }),
  getAct1BackgroundKeyForStage: () => "memoryBreakerCitadel",
  getNextAct1BackgroundKey: () => "memoryBreakerCitadel",
  setActBackground() {}, updateLessonChrome() {},
  showScene: name => { if (name !== "story") vm.runInContext("clearAct1EpilogueVisual()", ctx); },
  stopTypewriter() {}, cancelNextDialogueHold() {}, hideDialogueChoices() {},
  updateSpeakingCharacter() {}, updateDialogueSpeakerTone() {}, updateDialogueSpeakerPortrait() {},
  startTypewriter: text => { state.typewriterText = text; state.isTypingDialogue = true; els.dialogueText.textContent = text[0]; },
  finishTypewriter: () => { state.isTypingDialogue = false; els.dialogueText.textContent = state.typewriterText; },
  resolveDialogueText: node => node.text,
  clearSpeakingCharacters() {}, isBattleStageConfig: () => false, getAllowedRuleIdsForStage: () => [],
  showActEnding: () => { assessment++; }, completeActVictoryScene: () => { assessment++; },
  showMainMenu() {}, restoreResumeCheckpoint: () => false,
  transitionToActBackground: (bg, text, next) => next(),
  grantActReward: () => { rewards++; saved.finalBossDefeated = true; return { totalAfter: 432 }; },
  renderBossGrammariaResult: (result, next) => { resultContinue = next; },
  returnFromPracticeMode: () => { practiceReturns++; },
  finishVsBossPracticeBattle: () => { vsFinishes++; }
});
for (const name of ["ACT1_EPILOGUE_VERSION", "ACT1_EPILOGUE_ASSETS", "DEFAULT_ACT1_EPILOGUE_PROGRESS",
  "ACT1_EPILOGUE_DIALOGUE", "DEFAULT_ACT_PROGRESS"]) {
  vm.runInContext(declaration(name, "const"), ctx);
}
for (const name of [
  "createDialogueNode", "createSegmentNode", "isOptionalMasterQuestionMarker", "createOptionalMasterQuestionNode",
  "appendLessonSegmentLines", "hasAct1StoryVictory", "canStartAct1Epilogue", "resumeAct1EpilogueIfNeeded",
  "getAct1EpilogueProgressUpdate", "getAct1EpilogueVisualState", "setAct1EpilogueAsset",
  "renderAct1EpilogueVisual", "showAct1EpilogueSummary", "clearAct1EpilogueVisual", "openAct1EpilogueReplay",
  "buildPostBossDialogue", "startPostBossDialogue", "startLessonDialogueSequence", "renderLessonStoryStep",
  "renderLessonStoryVisual", "advanceLessonStoryStep", "finishPastDialogueLesson", "handleNextDialogueClick",
  "advanceDialogue", "goPreviousLessonDialogueLine", "canGoPreviousLessonDialogue", "updatePreviousDialogueButton",
  "restoreSavedProgress", "restoreLessonResumeCheckpoint", "ensureActProgress", "validateProgress",
  "serializeProgressValue", "captureLessonResumeCheckpoint", "finalizeBossVictoryWithResult", "continueFinalBossVictory"
]) vm.runInContext(declaration(name), ctx);
function run(code) { return vm.runInContext(code, ctx); }
function reset(progress = {}) {
  saved = { finalBossDefeated: true, currentStageId: stage.id, currentLessonId: stage.id,
    currentScreen: "victory", rewards: ["original"], fragments: ["old fragment"], ...progress };
  ctx.playerData.progress.pastFragmentAct = saved;
  state.activeReplayLessonId = null;
  state.practiceMode.active = false; state.vsBossPractice.active = false;
  ctx.pvpState.active = false; ctx.verbMemoryPracticeState.active = false;
  state.act1EpilogueSummaryVisible = false; state.lessonStorySteps = [];
  state.currentLessonStage = null; state.actBattle = null; state.lessonStoryMode = false;
}
reset();
ctx.stage = stage;
const nodes = run("ACT1_EPILOGUE_DIALOGUE");
assert.equal(nodes.length, 53);
assert.ok(nodes.every((n, i) => n.act1EpilogueNode === i + 1 && n.text && n.speaker));
// Canonical speaker/text digest from the supplied 53-node story, independent of the renderer.
assert.equal(crypto.createHash("sha256").update(JSON.stringify(nodes.map(n => [n.speaker, n.text]))).digest("hex"),
  "84d7ba1d580db0ad63756ad78d951d48eba9eab9401737888a4067b708ad65ee");
assert.deepEqual(nodes.reduce((a, n) => (a[n.speaker] = (a[n.speaker] || 0) + 1, a), {}),
  { "ผู้พเนจร": 17, "มาสเตอร์เวรีออน": 22, "ผู้พิทักษ์แห่งอดีต": 14 });

run("continueFinalBossVictory(stage)");
assert.equal(rewards, 1);
assert.equal(state.currentLessonStage, null, "Keep existing Grammaria result before the epilogue");
resultContinue();
assert.equal(state.currentLessonStage.isAct1Epilogue, true);
assert.equal(state.lessonStorySteps.length, 53);
assert.equal(assessment, 0);
assert.equal(state.lessonStoryStepIndex, 0);
run("handleNextDialogueClick()");
assert.equal(state.lessonStoryStepIndex, 0, "First click reveals the current typewriter line");
assert.equal(els.dialogueText.textContent, nodes[0].text);
run("handleNextDialogueClick()");
assert.equal(state.lessonStoryStepIndex, 1);
run("finishTypewriter(); goPreviousLessonDialogueLine()");
assert.equal(state.lessonStoryStepIndex, 0);
assert.equal(saved.act1EpilogueDialogueIndex, 0, "Previous also saves the actual epilogue position");

const expectedVisuals = [[0,"quiet"],[4,"last-fragment"],[10,"fragments"],[13,"resonance"],
  [19,"merging"],[21,"core"],[27,"guardian"],[46,"acquired"]];
for (const [index, expected] of expectedVisuals) {
  state.lessonStoryStepIndex = index;
  run("renderLessonStoryStep()");
  assert.equal(run("scenes.story.dataset.epilogueState"), expected);
  assert.equal(saved.act1EpilogueDialogueIndex, index);
  assert.equal(els.act1PastCrystalImage.dataset.epilogueAsset,
    index >= 21 ? "assets/items/past_core.png" : "",
    "The official Past Core appears only after fragment merging has completed");
}
state.lessonStoryStepIndex = 19; run("renderLessonStoryStep()");
assert.equal(run("scenes.story.dataset.epilogueState"), "merging", "Reverse visual state is independent of earned flags");
assert.equal(saved.pastCoreRestored, true);
assert.equal(saved.pastGuardianAwakened, true);
assert.equal(saved.pastCoreAndGuardianAcquired, true);
assert.equal(saved.act1EpilogueCompleted, undefined);
assert.deepEqual(saved.fragments, ["old fragment"]);
assert.equal(ctx.playerData.grammaria, 432);
assert.equal(rewards, 1);

const image = element(), host = element();
ctx.image = image; ctx.host = host;
run('setAct1EpilogueAsset(image, "missing.png", host)');
image.onerror();
assert.equal(image.classList.contains("hidden"), true);
assert.equal(host.classList.contains("act1-asset-ready"), false);
assert.equal(image.src, undefined);
run('setAct1EpilogueAsset(image, "", host)');
assert.equal(image.src, undefined, "An unset asset uses CSS without requesting an empty URL");
run('setAct1EpilogueAsset(image, "available.png", host)');
image.onload();
assert.equal(host.classList.contains("act1-asset-ready"), true);
assert.equal(image.classList.contains("hidden"), false);

reset({ act1EpilogueVersion: 1, act1EpilogueDialogueIndex: 19, currentScreen: "lesson" });
assert.equal(run("restoreSavedProgress()"), true);
assert.equal(state.lessonStoryStepIndex, 19);
assert.equal(run("scenes.story.dataset.epilogueState"), "merging");
reset({ currentDialogueIndex: 99, currentScreen: "pastFragmentVictory", act1AssessmentResult: { oldScore: 77 } });
assert.equal(run("restoreSavedProgress()"), true);
assert.equal(state.lessonStoryStepIndex, 0, "Legacy ending indices must not skip new dialogue");
assert.deepEqual(saved.act1AssessmentResult, { oldScore: 77 });
assert.equal(assessment, 0);

ctx.getCheckpointStageId = () => stage.id;
ctx.getActiveSceneName = () => "story";
ctx.RESUME_CHECKPOINT_VERSION = 1;
const checkpoint = run('captureLessonResumeCheckpoint("auto", "now")');
assert.equal(checkpoint.lesson.mode, "postBossDialogue");
assert.equal(checkpoint.lesson.act1EpilogueVersion, 1);
saved.act1EpilogueVersion = 1; saved.act1EpilogueDialogueIndex = 13;
ctx.checkpoint = checkpoint;
run("restoreLessonResumeCheckpoint(checkpoint)");
assert.equal(state.lessonStoryStepIndex, 13, "Pending epilogue takes priority over stale generic checkpoint");

// Normalization and serialization preserve old arrays/scores and add false defaults only.
reset({ act1AssessmentResult: { oldScore: 77 } });
const normalized = run("ensureActProgress()");
assert.equal(normalized.act1EpilogueCompleted, false);
assert.equal(normalized.pastCoreRestored, false);
assert.equal(normalized.finalBossDefeated, true);
assert.deepEqual(normalized.fragments, ["old fragment"]);
ctx.dataToSerialize = normalized;
const roundTrip = JSON.parse(JSON.stringify(run("serializeProgressValue(validateProgress(dataToSerialize))")));
assert.equal(roundTrip.act1EpilogueCompleted, false);
assert.deepEqual(roundTrip.act1AssessmentResult, { oldScore: 77 });

reset();
run("startPostBossDialogue(stage)");
for (let i = 0; i < 53; i++) {
  assert.equal(state.lessonStoryStepIndex, i);
  run("finishTypewriter(); handleNextDialogueClick()");
}
assert.equal(state.lessonStorySteps.length, 53, "Summary is not a 54th dialogue node");
assert.equal(saved.act1EpilogueCompleted, true);
assert.equal(state.act1EpilogueSummaryVisible, true);
assert.equal(assessment, 0, "Wait for separate Continue on the completion card");
run("handleNextDialogueClick()");
assert.equal(assessment, 1);
assert.equal(rewards, 1);
const completed = JSON.stringify(saved), writesBeforeReplay = saveCount;
run("openAct1EpilogueReplay()");
assert.equal(state.currentLessonStage.isAct1Epilogue, true);
for (let i = 0; i < 53; i++) run("finishTypewriter(); handleNextDialogueClick()");
assert.equal(JSON.stringify(saved), completed);
assert.equal(saveCount, writesBeforeReplay);
assert.equal(rewards, 1);
assert.equal(assessment, 1);
run("clearAct1EpilogueVisual()");
assert.equal(run('scenes.story.classList.contains("act1-epilogue")'), false);
assert.equal(els.act1EpilogueVisual.classList.contains("hidden"), true);
assert.equal(els.dialogueSpeakerPortrait.dataset.epilogueAsset, undefined, "A resumed guardian portrait must reload its ready/fallback state");

reset({ act1EpilogueCompleted: true });
run("restoreSavedProgress()");
assert.equal(assessment, 2);
reset({ finalBossDefeated: false, completedStages: ["final-boss"], currentScreen: "lesson", act1EpilogueCompleted: true });
run("restoreSavedProgress()");
assert.equal(assessment, 3, "Legacy completed-stage proof must still reach assessment after the epilogue");
reset(); state.vsBossPractice.active = true;
run("continueFinalBossVictory(stage)");
assert.equal(vsFinishes, 1);
assert.equal(state.currentLessonStage, null);
assert.equal(run("resumeAct1EpilogueIfNeeded(loadProgress())"), false);
state.vsBossPractice.active = false; state.practiceMode.active = true;
assert.equal(run("canStartAct1Epilogue(stage)"), false);
ctx.grantActReward = () => ({ practice: true });
run("continueFinalBossVictory(stage)");
resultContinue();
assert.equal(practiceReturns, 1);
assert.equal(state.currentLessonStage, null, "Practice result returns to Practice instead of starting an epilogue");
state.practiceMode.active = false; ctx.verbMemoryPracticeState.active = true;
assert.equal(run("canStartAct1Epilogue(stage)"), false);
ctx.verbMemoryPracticeState.active = false; ctx.pvpState.active = true;
assert.equal(run("canStartAct1Epilogue(stage)"), false);
ctx.pvpState.active = false; state.activeReplayLessonId = stage.id;
run("startPostBossDialogue(stage)");
assert.equal(state.currentLessonStage.isAct1Epilogue, undefined, "A boss replay does not invoke the epilogue");
assert.equal(state.lessonStorySteps.length, 2);
assert.equal(state.lessonStorySteps[0].text, "บทเดิม");
assert.equal(state.lessonStorySteps[0].speaker, "มาสเตอร์เวรีออน");
assert.equal(state.lessonStorySteps[1].optionalMasterQuestionId, "past");
const otherLesson = run('buildPostBossDialogue({ id: "regular-rule-1" })');
assert.equal(otherLesson[0].text, "บทเดิม");
assert.equal(otherLesson[0].phase, "postBossDialogue");
assert.equal(otherLesson[1].optionalMasterQuestionId, "past");

const assets = run("ACT1_EPILOGUE_ASSETS");
for (const asset of Object.values(assets).filter(Boolean)) assert.ok(fs.existsSync(path.join(root, asset)), asset);
// These are the creator's original RGBA PNGs. Any pixel/file transformation changes their digests.
for (const [asset, width, height, digest] of [
  [assets.core, 1254, 1254, "7638b782d994ca4dfc410d4b7a03b1200babecd8b347393ccc7e1600e9926d9d"],
  [assets.guardianSprite, 1145, 1374, "ec81367bf42f65eb98bd912c4be0264b239143f3223c6cb8747537899ef5c4d6"]
]) {
  const bytes = fs.readFileSync(path.join(root, asset));
  assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"), digest, "Preserve official asset bytes: " + asset);
  assert.equal(bytes.readUInt32BE(16), width);
  assert.equal(bytes.readUInt32BE(20), height);
  assert.equal(bytes[25], 6, "Preserve the RGBA transparency channel: " + asset);
}
assert.equal(assets.guardianPortrait, assets.guardianSprite, "Portrait crops the original with CSS; no edited image file");
console.log("PASS: Act I epilogue — 53 canonical nodes, victory/result route, typewriter navigation, reversible events, safe asset fallback, save/resume, legacy migration, completion/assessment, replay isolation and no duplicate rewards");
