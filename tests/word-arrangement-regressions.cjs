const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
const styles = fs.readFileSync(path.join(__dirname, "..", "style.css"), "utf8");

function declaration(name, kind = "function") {
  const start = source.indexOf(`${kind} ${name}`);
  assert.ok(start >= 0, `Missing ${name}`);
  if (kind === "function") {
    return source.slice(start, source.indexOf("\n}", start) + 2);
  }
  const tail = source.slice(start);
  const end = tail.match(/\n[}\]][^\n]*;/);
  assert.ok(end, `Missing end of ${name}`);
  return tail.slice(0, end.index + end[0].length);
}

function evaluateConstant(name, extras = {}) {
  const sandbox = { ...extras };
  vm.runInNewContext(`${declaration(name, "const")}\nthis.value = ${name};`, sandbox);
  return sandbox.value;
}

const act1BankNames = [
  "phase1PastMeaningQuestions",
  "phase1PastTimeWordsQuestions",
  "phase1WasWereQuestions",
  "phase1ThereWasWereQuestions",
  "phase1HadQuestions",
  "regularRuleOneQuestions",
  "regularRuleTwoQuestions",
  "regularRuleThreeQuestions",
  "regularRuleFourQuestions",
  "edForgerQuestions",
  "irregularPracticeQuestions",
  "irregularWraithQuestions",
  "finalBossQuestions"
];
const stageBankNames = {
  "what-is-past": "phase1PastMeaningQuestions",
  "what-is-tense": "phase1PastTimeWordsQuestions",
  "act1_phase1_unit3_was_were": "phase1WasWereQuestions",
  "act1_phase1_unit4_there_was_were": "phase1ThereWasWereQuestions",
  "act1_phase1_unit5_had": "phase1HadQuestions",
  "regular-rule-1": "regularRuleOneQuestions",
  "regular-rule-2": "regularRuleTwoQuestions",
  "regular-rule-3": "regularRuleThreeQuestions",
  "regular-rule-4": "regularRuleFourQuestions",
  "ed-mini-boss": "edForgerQuestions",
  "irregular-lesson": "irregularPracticeQuestions",
  "irregular-mini-boss": "irregularWraithQuestions",
  "final-boss": "finalBossQuestions"
};
const typeContext = {};
vm.runInNewContext(declaration("getBattleQuestionType"), typeContext);
function isNormalizedArrangement(question) {
  typeContext.question = question;
  return vm.runInNewContext("getBattleQuestionType(question) === 'word-arrangement'", typeContext);
}
const banks = Object.fromEntries(act1BankNames.map(name => [name, evaluateConstant(name)]));
const act1ArrangementQuestions = act1BankNames.flatMap(name =>
  banks[name].filter(isNormalizedArrangement)
);
const pvpArrangementQuestions = evaluateConstant("PVP_MOCK_QUESTION_BANK")
  .filter(isNormalizedArrangement);

assert.equal(act1ArrangementQuestions.length, 81, "Unexpected Act 1 arrangement count");
assert.equal(pvpArrangementQuestions.length, 12, "Unexpected PvP arrangement count");
assert.equal(new Set([...act1ArrangementQuestions, ...pvpArrangementQuestions].map(question => question.id)).size, 93);

const registryCode = declaration("VS_BOSS_REGISTRY", "const");
const registryContext = { Object, assetPath: value => value };
for (const pathName of new Set(registryCode.match(/\b[A-Z][A-Z0-9_]*_PATH\b/g) || [])) {
  registryContext[pathName] = pathName;
}
vm.runInNewContext(`${registryCode}\nthis.value = VS_BOSS_REGISTRY;`, registryContext);
const vsBossArrangementQuestions = registryContext.value.flatMap(config =>
  config.relatedStageIds.flatMap(stageId =>
    banks[stageBankNames[stageId]].filter(isNormalizedArrangement)
  )
);
assert.equal(vsBossArrangementQuestions.length, 81, "VS Bosses must reuse every matching Act 1 arrangement");

const expandedPoolSource = declaration("getExpandedStageQuestionPool");
for (const bankName of act1BankNames) {
  assert.match(expandedPoolSource, new RegExp(`\\b${bankName}\\b`), `${bankName} missing from expanded/practice source`);
}
assert.match(declaration("getStageFocusQuestionPool"), /getExpandedStageQuestionPool\(stage, "focus"\)/);
assert.match(declaration("startActFocusAction"), /renderActBattleQuestionControls\(/);
assert.match(declaration("showBossQuestionStep"), /renderActBattleQuestionControls\(/);
assert.match(declaration("showActBattleQuestion"), /getActArrangementTileData[\s\S]*showBattleQuestionExhaustedRecovery/);
assert.match(declaration("startActFocusAction"), /getActArrangementTileData[\s\S]*showBattleQuestionExhaustedRecovery/);
assert.match(declaration("showOnlyBattlePanel"), /classList\.remove\("boss-v2-arrangement-active"\)/);
assert.match(declaration("showOnlyBattlePanel"), /classList\.remove\("arrangement-layout-active"\)/);

class MockClassList {
  constructor(element) {
    this.element = element;
  }
  values() {
    return new Set(String(this.element.className || "").split(/\s+/).filter(Boolean));
  }
  write(values) {
    this.element.className = [...values].join(" ");
  }
  add(...names) {
    const values = this.values();
    names.forEach(name => values.add(name));
    this.write(values);
  }
  remove(...names) {
    const values = this.values();
    names.forEach(name => values.delete(name));
    this.write(values);
  }
  contains(name) {
    return this.values().has(name);
  }
  toggle(name, force) {
    const values = this.values();
    const enabled = force === undefined ? !values.has(name) : Boolean(force);
    if (enabled) values.add(name); else values.delete(name);
    this.write(values);
    return enabled;
  }
}

function element(tagName = "div") {
  const listeners = {};
  const node = {
    tagName: String(tagName).toUpperCase(),
    className: "",
    children: [],
    textContent: "",
    value: "",
    disabled: false,
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    append(...children) {
      children.forEach(child => this.appendChild(child));
    },
    addEventListener(type, callback) {
      listeners[type] = callback;
    },
    click() {
      if (!this.disabled) listeners.click?.({ preventDefault() {}, stopPropagation() {} });
    },
    input() {
      listeners.input?.({});
    },
    keydown(key) {
      listeners.keydown?.({ key, preventDefault() {} });
    },
    setAttribute() {},
    focus() {},
    querySelectorAll(selector) {
      const matches = [];
      const visit = candidate => {
        const isMatch = selector === "button"
          ? candidate.tagName === "BUTTON"
          : selector.startsWith(".") && candidate.classList.contains(selector.slice(1));
        if (isMatch) matches.push(candidate);
        candidate.children.forEach(visit);
      };
      this.children.forEach(visit);
      return matches;
    }
  };
  node.classList = new MockClassList(node);
  Object.defineProperty(node, "innerHTML", {
    get() { return ""; },
    set(value) {
      if (value === "") this.children = [];
    }
  });
  return node;
}

const answerOptions = element();
const questionPanel = element();
const battleScene = element();
const context = vm.createContext({
  console: { log() {}, warn() {}, error() {} },
  Math,
  shuffleArray: values => [...values],
  els: { answerOptions, questionPanel },
  scenes: { battle: battleScene },
  document: {
    createElement: element,
    querySelectorAll: selector => answerOptions.querySelectorAll(selector)
  },
  getQuestionText: question => question.prompt || question.text || question.sentence || question.question || "",
  chooseActAnswer() {},
  ensureEnoughBattleDistractors: (_question, options) => [...options]
});
for (const name of [
  "getQuestionId",
  "normalizeBattleAnswer",
  "normalizeActFreeAnswer",
  "getBattleAcceptedAnswers",
  "getActQuestionAcceptedAnswers",
  "getBattleQuestionType",
  "getActBattleQuestionType",
  "isInvalidBattleOption",
  "normalizeBattleOptions",
  "getBattleCorrectAnswer",
  "getRawBattleQuestionOptions",
  "getBattleQuestionPromptSource",
  "prepareQuestion",
  "getActQuestionPrimaryAnswer",
  "normalizeActArrangementTiles",
  "getActArrangementTileData",
  "isActQuestionAnswerCorrect",
  "hasBattleContentPlaceholder",
  "inspectBattleQuestion",
  "renderActQuestionDataError",
  "renderActTypingQuestion",
  "renderActWordArrangementQuestion",
  "renderActBattleQuestionControls",
  "isRenderableBossQuestion"
]) {
  vm.runInContext(declaration(name), context);
}
context.getActQuestionOptions = question => question.options || [];

function run(expression) {
  return vm.runInContext(expression, context);
}

function resetAnswerOptions() {
  answerOptions.innerHTML = "";
}

function normalizedArrangementAnswer(value) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ").replace(/[.。]+$/g, "").trim();
}

function auditQuestion(rawQuestion, sourceName) {
  context.rawQuestion = rawQuestion;
  assert.equal(run("getActBattleQuestionType(rawQuestion)"), "word-arrangement", `${sourceName}/${rawQuestion.id}: type`);
  assert.ok(String(rawQuestion.id || "").trim(), `${sourceName}: missing id`);
  assert.ok(String(rawQuestion.prompt || rawQuestion.text || rawQuestion.sentence || rawQuestion.question || "").trim(), `${rawQuestion.id}: prompt`);
  const accepted = run("getActQuestionAcceptedAnswers(rawQuestion)");
  assert.ok(accepted.length, `${rawQuestion.id}: accepted answer`);
  assert.ok(run("getActQuestionPrimaryAnswer(rawQuestion)"), `${rawQuestion.id}: primary answer`);

  const explicit = Array.isArray(rawQuestion.tiles) ? rawQuestion.tiles : rawQuestion.words;
  assert.ok(Array.isArray(explicit) && explicit.length, `${rawQuestion.id}: explicit arrangement data`);
  explicit.forEach((tile, index) => {
    assert.notEqual(tile, null, `${rawQuestion.id}: null tile ${index}`);
    assert.notEqual(tile, undefined, `${rawQuestion.id}: undefined tile ${index}`);
    assert.ok(String(tile).trim(), `${rawQuestion.id}: empty tile ${index}`);
  });

  const tileData = run("getActArrangementTileData(rawQuestion)");
  assert.ok(tileData.tiles.length, `${rawQuestion.id}: renderable tiles`);
  const constructed = normalizedArrangementAnswer(tileData.tiles.join(tileData.joiner));
  assert.ok(accepted.some(answer => normalizedArrangementAnswer(answer) === constructed), `${rawQuestion.id}: tiles cannot construct an accepted answer`);

  const prepared = run("prepareQuestion(rawQuestion, 0)");
  assert.equal(prepared.type, rawQuestion.type, `${rawQuestion.id}: prepareQuestion type`);
  assert.deepEqual(prepared.tiles, rawQuestion.tiles, `${rawQuestion.id}: prepareQuestion tiles`);
  assert.deepEqual(prepared.words, rawQuestion.words, `${rawQuestion.id}: prepareQuestion words`);
  assert.deepEqual(prepared.acceptedAnswers, rawQuestion.acceptedAnswers, `${rawQuestion.id}: prepareQuestion acceptedAnswers`);
  assert.equal(prepared.answer, rawQuestion.answer, `${rawQuestion.id}: prepareQuestion answer`);
  context.preparedQuestion = prepared;
  assert.equal(run("inspectBattleQuestion(preparedQuestion).usable"), true, `${rawQuestion.id}: inspection`);
  assert.equal(run("isRenderableBossQuestion(preparedQuestion)"), true, `${rawQuestion.id}: boss rendering guard`);

  resetAnswerOptions();
  assert.equal(run("renderActWordArrangementQuestion(preparedQuestion, () => {})"), true, `${rawQuestion.id}: renderer result`);
  assert.equal(context.document.querySelectorAll(".boss-v2-letter-tile").length, tileData.tiles.length, `${rawQuestion.id}: DOM tile count`);
}

act1ArrangementQuestions.forEach(question => auditQuestion(question, "Act1/Practice/Focus/VS"));
pvpArrangementQuestions.forEach(question => auditQuestion(question, "PvP-audit-only"));

const focusedCases = [
  { id: "explicit-double-l", type: "word-arrangement", prompt: "เรียงตัวอักษร", tiles: ["l", "l"], answer: "ll", acceptedAnswers: ["ll"], expectedSource: "tiles" },
  { id: "explicit-double-e", type: "word-arrangement", prompt: "เรียงตัวอักษร", tiles: ["e", "e"], answer: "ee", acceptedAnswers: ["ee"], expectedSource: "tiles" },
  { id: "words-source", type: "word-arrangement", prompt: "เรียงคำ", words: ["She", "was", "happy"], answer: "She was happy.", acceptedAnswers: ["She was happy."], expectedSource: "words" },
  { id: "word-fallback", type: "word-arrangement", prompt: "Arrange the words", answer: "She was happy.", acceptedAnswers: ["She was happy."], expectedSource: "answer" },
  { id: "letter-fallback", type: "word-arrangement", prompt: "เรียงตัวอักษรให้ถูกต้อง", answer: "letter", acceptedAnswers: ["letter"], expectedSource: "answer" },
  { id: "multi-word-tiles", type: "word-arrangement", prompt: "เรียงคำ", tiles: ["The students", "wrote", "a story"], answer: "The students wrote a story.", acceptedAnswers: ["The students wrote a story."], expectedSource: "tiles" }
];
for (const question of focusedCases) {
  context.focusedQuestion = question;
  const tileData = run("getActArrangementTileData(focusedQuestion)");
  assert.equal(tileData.source, question.expectedSource, question.id);
  assert.ok(question.acceptedAnswers.some(answer =>
    normalizedArrangementAnswer(answer) === normalizedArrangementAnswer(tileData.tiles.join(tileData.joiner))
  ), question.id);
}
assert.deepEqual([...run("getActArrangementTileData({type:'word-arrangement',prompt:'เรียงตัวอักษร',answer:'letter'}).tiles")], ["l", "e", "t", "t", "e", "r"]);

for (const count of [4, 6, 8, 10, 13]) {
  for (const mode of ["character", "word"]) {
    const tiles = mode === "character"
      ? Array.from({ length: count }, (_, index) => String.fromCharCode(97 + (index % 5)))
      : Array.from({ length: count }, (_, index) => `word${index + 1}`);
    context.countQuestion = {
      id: `${mode}-${count}`,
      type: "word-arrangement",
      prompt: mode === "character" ? "เรียงตัวอักษร" : "เรียงคำ",
      tiles,
      answer: tiles.join(mode === "character" ? "" : " "),
      acceptedAnswers: [tiles.join(mode === "character" ? "" : " ")]
    };
    resetAnswerOptions();
    assert.equal(run("renderActWordArrangementQuestion(countQuestion, () => {})"), true);
    assert.equal(context.document.querySelectorAll(".boss-v2-letter-tile").length, count);
  }
}

function renderControlType(type) {
  resetAnswerOptions();
  if (type === "multiple-choice") {
    context.transitionQuestion = { id: type, type, prompt: "choose", answer: "yes", acceptedAnswers: ["yes"], options: ["yes", "no"] };
    run("renderActBattleQuestionControls(transitionQuestion, ['yes', 'no'], () => {})");
  } else if (type === "typing") {
    context.transitionQuestion = { id: type, type, prompt: "type", answer: "was", acceptedAnswers: ["was"] };
    run("renderActBattleQuestionControls(transitionQuestion, [], () => {})");
  } else {
    context.transitionQuestion = { id: type, type, prompt: "เรียงคำ", tiles: ["They", "were", "ready"], answer: "They were ready", acceptedAnswers: ["They were ready"] };
    run("renderActBattleQuestionControls(transitionQuestion, [], () => {})");
  }
  const active = questionPanel.classList.contains("boss-v2-arrangement-active") && battleScene.classList.contains("arrangement-layout-active");
  assert.equal(active, type === "word-arrangement", `stale arrangement class after ${type}`);
}
["multiple-choice", "word-arrangement", "typing", "word-arrangement", "multiple-choice", "word-arrangement"].forEach(renderControlType);

context.interactionQuestion = {
  id: "interaction",
  type: "word-arrangement",
  prompt: "เรียงคำ",
  tiles: ["They", "were", "very", "happy"],
  answer: "They were very happy",
  acceptedAnswers: ["They were very happy"]
};
let submitted = "";
context.captureArrangementAnswer = answer => { submitted = answer; };
resetAnswerOptions();
run("renderActWordArrangementQuestion(interactionQuestion, captureArrangementAnswer)");
let panel = answerOptions.children[0];
let tileRow = panel.children[1];
tileRow.children[0].click();
tileRow.children[1].click();
panel.children[2].children[0].children[0].click();
assert.equal(panel.children[0].textContent, "They", "Undo must remove one selected tile");
panel.children[1].children[1].click();
panel.children[2].children[0].children[1].click();
assert.match(panel.children[0].textContent, /แตะคำ/, "Clear must reset the answer");
panel.children[1].children.forEach(button => button.click());
panel.children[2].children[1].click();
assert.equal(submitted, "They were very happy", "Confirm must preserve word order");
assert.equal(run("isActQuestionAnswerCorrect(interactionQuestion, captureArrangementAnswer && 'They were very happy.')"), true);

context.runtimeFocusQuestion = {
  id: "focus-arrangement-runtime",
  type: "word-arrangement",
  prompt: "เรียงคำผ่าน Focus",
  words: ["We", "were", "ready"],
  answer: "We were ready",
  acceptedAnswers: ["We were ready"],
  skipBattleHistoryMark: true
};
context.state = {
  actBattle: {
    stage: { id: "what-is-past" },
    focusQuestionIndex: 0,
    usedFocusQuestionIds: new Set(),
    recentFocusQuestionIds: []
  }
};
context.els.battleMessage = element();
context.els.questionText = element();
context.getFocusQuestion = () => context.runtimeFocusQuestion;
context.getQuestionBaseWord = () => "";
context.markBattleQuestionUsed = () => {};
context.showOnlyBattlePanel = () => {};
context.setBattleTurnOwner = () => {};
context.showBattleQuestionExhaustedRecovery = () => { throw new Error("Focus arrangement unexpectedly failed closed"); };
let focusSubmitted = "";
context.chooseActFocusAnswer = answer => { focusSubmitted = answer; };
vm.runInContext(declaration("startActFocusAction"), context);
resetAnswerOptions();
run("startActFocusAction()");
assert.equal(context.document.querySelectorAll(".boss-v2-letter-tile").length, 3, "Focus must render arrangement tiles");
panel = answerOptions.children[0];
panel.children[1].children.forEach(button => button.click());
panel.children[2].children[1].click();
assert.equal(focusSubmitted, "We were ready", "Focus arrangement must submit through its adapter");

context.runtimeBossQuestion = {
  id: "vs-boss-arrangement-runtime",
  type: "word-arrangement",
  prompt: "เรียงคำผ่าน VS Bosses",
  tiles: ["They", "were", "at school", "yesterday"],
  answer: "They were at school yesterday.",
  acceptedAnswers: ["They were at school yesterday."]
};
context.state.actBattle = { stage: { id: "what-is-past" } };
context.els.continueBattleButton = element("button");
context.isActBattleEnded = () => false;
context.getBossQuestion = () => context.runtimeBossQuestion;
context.fallbackBossQuestionToStoredAttack = () => { throw new Error("VS Boss arrangement unexpectedly fell back"); };
context.resolveBattleQuestionPrompt = question => question.prompt;
let vsBossSubmitted = "";
context.chooseBossQuestionAnswer = answer => { vsBossSubmitted = answer; };
vm.runInContext(declaration("showBossQuestionStep"), context);
resetAnswerOptions();
run("showBossQuestionStep()");
assert.equal(context.document.querySelectorAll(".boss-v2-letter-tile").length, 4, "VS Bosses must render arrangement tiles");
panel = answerOptions.children[0];
panel.children[1].children[0].click();
panel.children[1].children[1].click();
panel.children[2].children[0].children[0].click();
assert.equal(panel.children[0].textContent, "They", "VS Bosses Undo must work");
panel.children[1].children[1].click();
panel.children[2].children[0].children[1].click();
assert.match(panel.children[0].textContent, /แตะคำ/, "VS Bosses Clear must work");
panel.children[1].children.forEach(button => button.click());
panel.children[2].children[1].click();
assert.equal(vsBossSubmitted, "They were at school yesterday", "VS Bosses Confirm must use the shared answer adapter");

context.malformedQuestion = {
  id: "malformed",
  type: "word-arrangement",
  prompt: "เรียงคำ",
  tiles: [null, undefined, "", "   "],
  answer: "",
  acceptedAnswers: []
};
assert.equal(run("getActArrangementTileData(malformedQuestion).tiles.length"), 0);
assert.equal(run("inspectBattleQuestion(malformedQuestion).usable"), false);
assert.equal(run("isRenderableBossQuestion(malformedQuestion)"), false);
resetAnswerOptions();
assert.equal(run("renderActWordArrangementQuestion(malformedQuestion, () => {})"), false);
assert.equal(context.document.querySelectorAll(".boss-v2-letter-tile").length, 0);
assert.equal(context.document.querySelectorAll(".battle-question-data-error").length, 1, "Malformed arrangements must fail closed with an error UI");

assert.match(styles, /#battleScene \.question-panel\.boss-v2-arrangement-active \{[\s\S]{0,700}overflow-y: auto;/);
assert.match(styles, /#battleScene \.boss-v2-arrangement-panel \{[\s\S]{0,500}grid-template-rows: auto max-content auto;/);
assert.match(styles, /#battleScene \.boss-v2-arrangement-tiles \{[\s\S]{0,500}overflow: visible;/);
assert.match(styles, /#battleScene\.active\.arrangement-layout-active \{[\s\S]{0,180}--battle-lower-ratio: 1\.18;/);

const routedChecks = act1ArrangementQuestions.length * 4 + pvpArrangementQuestions.length;
console.log(`Word arrangement regressions passed: 93 unique active questions, ${routedChecks} routed checks, renderer/state/fallback/controls/fail-closed coverage.`);
