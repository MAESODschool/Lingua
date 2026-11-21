const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
function declaration(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `Missing ${name}`);
  const end = source.indexOf("\n}", start);
  assert.ok(end >= 0, `Missing end of ${name}`);
  return source.slice(start, end + 2);
}

// A small DOM fixture for these static cards, following the existing VM tests.
// Browser execution/event handling is verified separately with native DOM nodes.
class Element {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.attributes = {};
    this.children = [];
    this.className = "";
  }
  appendChild(child) {
    this.children.push(child);
    return child;
  }
  set textContent(value) {
    this.children = [String(value)];
  }
  get textContent() {
    return this.children.map(child => typeof child === "string" ? child : child.textContent).join("");
  }
  set innerHTML(markup) {
    this.children = [];
    const stack = [this];
    const voidTags = new Set(["IMG", "INPUT", "BR", "HR", "META", "LINK"]);
    for (const token of String(markup).match(/<[^>]*>|[^<]+|</g) || []) {
      if (/^<\//.test(token)) {
        stack.pop();
      } else if (/^<[a-z]/i.test(token)) {
        const [, tagName, attributes] = token.match(/^<([^\s/>]+)([\s\S]*?)\/?>$/);
        const child = new Element(tagName);
        for (const match of attributes.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
          child.attributes[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? "";
        }
        child.className = child.attributes.class || "";
        stack.at(-1).appendChild(child);
        if (!voidTags.has(child.tagName) && !token.endsWith("/>")) stack.push(child);
      } else {
        stack.at(-1).appendChild(token);
      }
    }
  }
  querySelectorAll(selector) {
    const selectors = selector.split(",").map(value => value.trim());
    const matches = node => selectors.some(value => {
      if (value.startsWith("[")) return Object.hasOwn(node.attributes, value.slice(1, -1));
      if (value.startsWith(".")) return node.className.split(/\s+/).includes(value.slice(1));
      return node.tagName.toLowerCase() === value.toLowerCase();
    });
    const result = [];
    const visit = node => {
      for (const child of node.children) {
        if (typeof child === "string") continue;
        if (matches(child)) result.push(child);
        visit(child);
      }
    };
    visit(this);
    return result;
  }
  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }
}

const payloads = [
  "<img src=x onerror=alert(1)>",
  "<svg onload=alert(1)>",
  "<script>alert(1)</script>",
  '\"><img src=x onerror=alert(1)>',
  '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
  '<img src=x onerror="window.__LINGUA_XSS_TEST__=1">',
  "กฤติน <3",
  "A & B",
  '"Teacher" \'Student\'',
  "เด็กชาย Lingua",
  "&lt;img src=x onerror=alert(1)&gt;",
  "  กฤติน <3  "
];
const runtimeCode = [
  "safeDisplayText", "getKeyStageLabel", "buildMainMenuViewModel",
  "calculateFinalGrammariaEvaluation", "openAccountSettingsModal", "showFinalGrammariaEvaluation"
].map(declaration).join("\n");

function fixture(value, identityField) {
  const playerData = {
    characterName: "", displayName: "", username: "",
    studentFullName: value, className: value, room: value,
    studentProfile: { fullName: value, classLevel: value, room: value, studentNo: value },
    progress: { grammaria: { total: 600, history: [], earnedByBoss: {} } }
  };
  const user = { displayName: "" };
  if (identityField === "sessionDisplayName") user.displayName = value;
  else playerData[identityField] = value;
  const identityBefore = JSON.stringify({ ...playerData, progress: undefined, user });
  let modal = null;
  let saveCalls = 0;
  const characterSection = new Element("section");
  characterSection.className = "account-character-section";
  const close = () => {};
  const logout = () => {};
  const context = vm.createContext({
    document: { createElement: tagName => new Element(tagName) },
    playerData, CONFIGURED_MAX_GRAMMARIA: 750, MAIN_MENU_BOSS_IDS: [],
    getCurrentUser: () => user,
    loadProgress: () => ({}),
    ensureActProgress: () => ({}),
    ensureGrammariaState: () => playerData.progress.grammaria,
    getMainMenuStageLabels: () => ({ lesson: "Past Meaning" }),
    calculateMainMenuActProgress: () => 0,
    hasMeaningfulSavedProgress: () => false,
    ensurePlayerCharacterData: () => "male_wanderer",
    getPlayerCharacter: () => ({ id: "male_wanderer", label: "ผู้พเนจรชาย" }),
    getStudentProfileFromPlayer: () => playerData.studentProfile,
    formatStudentInfoLine: () => "",
    buildMainMenuCollection: () => [],
    createAccountCharacterSection: () => characterSection,
    savePlayerData: () => { saveCalls += 1; },
    openGameModal: options => { modal = options; },
    closeGameModal: close,
    logoutCurrentUser: logout,
    clamp: (number, min, max) => Math.min(max, Math.max(min, number))
  });
  vm.runInContext(runtimeCode, context);
  return {
    context, playerData, user, characterSection, close, logout,
    get modal() { return modal; },
    get saveCalls() { return saveCalls; },
    assertIdentityUnchanged() {
      assert.equal(JSON.stringify({ ...playerData, progress: undefined, user }), identityBefore);
    }
  };
}

function assertSafeIdentity(panel, identityNode, expectedText) {
  assert.equal(panel.querySelectorAll("img, svg, script, iframe").length, 0, "Identity created an executable element");
  for (const node of [panel, ...panel.querySelectorAll("div, strong, span")]) {
    assert.ok(Object.keys(node.attributes).every(name => !/^on/i.test(name)), "Identity created an event handler");
  }
  assert.ok(identityNode, "Missing identity text node");
  assert.equal(identityNode.textContent, expectedText, "Name must display as literal text without double encoding");
  assert.ok(identityNode.children.every(child => typeof child === "string"), "Name must not create child elements");
}

let cases = 0;
for (const value of payloads) {
  for (const identityField of ["characterName", "displayName", "sessionDisplayName"]) {
    const test = fixture(value, identityField);
    vm.runInContext("openAccountSettingsModal()", test.context);
    const panel = test.modal.content;
    const rows = panel.querySelectorAll(".grammaria-breakdown-row");
    assertSafeIdentity(panel, rows[0].querySelector("strong"), value.trim());
    assert.equal(panel.className, "account-settings-panel");
    assert.equal(rows.length, 5);
    assert.deepEqual(rows.map(row => row.querySelector("strong").textContent), [
      value.trim(), "Registered", "Act 1: Past Fragment", "Past Meaning", "ยังไม่มีความคืบหน้าที่บันทึกไว้"
    ]);
    assert.equal(panel.children.at(-1), test.characterSection);
    assert.equal(test.modal.actions[0].onClick, test.close);
    assert.equal(test.modal.actions[1].onClick, test.logout);
    assert.equal(test.saveCalls, 0);
    test.assertIdentityUnchanged();
    cases += 1;
  }
  for (const identityField of ["characterName", "displayName", "username"]) {
    const test = fixture(value, identityField);
    vm.runInContext("showFinalGrammariaEvaluation()", test.context);
    const panel = test.modal.content;
    assertSafeIdentity(panel, panel.querySelector(".final-evaluation-summary"), `ชื่อผู้เล่น: ${value}`);
    assert.equal(panel.className, "final-evaluation-panel");
    assert.equal(panel.querySelectorAll(".final-evaluation-summary").length, 2);
    assert.deepEqual(panel.querySelectorAll("strong").map(node => node.textContent), [
      "ช่วงชั้นที่ 2 ป.4 - ป.6", "600", "80%", "ดีมาก"
    ]);
    assert.equal(test.playerData.progress.grammaria.total, 600);
    assert.equal(test.playerData.progress.grammaria.finalEvaluation.playerName, value);
    assert.equal(test.playerData.progress.grammaria.finalEvaluation.grammariaPercent, 80);
    assert.equal(test.saveCalls, 1, "Preserve the result renderer's existing save behavior");
    assert.equal(test.modal.actions.length, 1);
    test.assertIdentityUnchanged();
    cases += 1;
  }
}

console.log(`PASS: player identity rendering safety (${cases} renderer/identity cases)`);
