# Lingua Full Game Audit Report

Audit date: 2026-08-30 (Asia/Bangkok)  
Mode: read-only audit  
Repository: `/Users/krutuii/Documents/GitHub/Lingua`

> This audit did not change game source, question data, assets, Firebase configuration, Firestore data, or player progress. No commit was created. The only new file is this report.

## 1. Audit Scope

The audit covered the complete current prototype surface:

- first load, login, registration, guest flow, session restore, logout, character/student profile creation;
- Main Menu, Continue Journey, Lesson Map, story/dialogue, lesson explanations, replay and Practice Mode;
- all Act 1 stages, 1,300 Act 1 battle questions, PvP questions, optional Master Verion questions, and all three answer renderers;
- PvE battle state, HP/AP, skills, charms, Focus, items, cooldowns, Boss Intent, Parry/Point Parry, rewards, defeat/victory, save/load;
- Teacher Dashboard, PvP mock/online foundation, Lingua Advisor, tutorial/credits/account settings;
- HTML/DOM bindings, CSS/responsive behavior, asset references, Firebase/Auth/Firestore rules, security, privacy, accessibility, and performance.

The audit combined static source inspection, read-only automated validators, syntax checks, asset/path resolution, and non-destructive browser checks. Production Auth and Firestore writes were intentionally not performed.

## 2. Files Inspected

### Primary files

| File | Size / shape | Notes |
|---|---:|---|
| `index.html` | 850 lines, ~51.7 KB | All scenes and overlays are in one page. |
| `style.css` | 9,636 lines, ~209 KB | All desktop/mobile styles are in one stylesheet. |
| `script.js` | 43,907 lines, ~1.648 MB | App, Act 1, 1,300 questions, battle, PvP, Dashboard, Advisor, and Auth are monolithic. |
| `firestore.rules` | 16 lines | Rules for `players` and `pvpRooms`. |

### Project structure

- JavaScript files: one (`script.js`); no split runtime modules.
- CSS files: one (`style.css`).
- HTML files: one (`index.html`).
- Question banks: literal arrays inside `script.js`, approximately lines 377-20,798.
- PvP: integrated in `script.js`, not a separate module.
- Lingua Advisor: integrated in `script.js`, not a separate module.
- Firebase/Auth/Firestore: CDN imports and runtime logic in `script.js`; authorization rules in `firestore.rules`.
- Assets: 87 files across UI, backgrounds, characters, enemies, items, audio, tutorial, and credits; total approximately 974 MB.
- Large repository artifacts also include `Lingua Test 2.zip` (~39.5 MB) and `Lingua test 1.zip`.
- No `package.json` or project test runner was found.

### DOM inventory

- 291 unique HTML IDs; no duplicate IDs found.
- 280 literal `getElementById(...)` references inspected.
- Five referenced IDs are intentionally created at runtime: `battleFlowV2ChargeControls`, `battleSkillEffectLayer`, `linguaAdvisorChatBody`, `linguaAdvisorInput`, and `linguaAdvisorSendButton`.
- `registerBetaCode` is optional and absent by design because `AUTH_CONFIG.requireBetaCode` is false and access is guarded with optional chaining.
- 80 buttons were inventoried. All button IDs are referenced by startup bindings or runtime handlers.
- Twelve buttons omit `type`, but there is currently no `<form>` element, so they cannot accidentally submit a form in the present markup.
- All inputs have an explicit `type`; all 12 static images have an `alt` attribute.
- All 44 literal asset paths extracted from HTML/CSS/JS resolved with exact case.

## 3. Commands Run

| Check | Result |
|---|---|
| `git status --short` | Pre-existing `M index.html` and `M script.js`; audit did not alter or revert them. |
| `node --check script.js` | PASS. No JavaScript syntax error. |
| `git diff --check` | PASS. No whitespace/error marker reported. |
| HTML ID duplicate scan | PASS: 291 IDs, zero duplicates. |
| JS DOM-reference scan | PASS after accounting for five runtime-created nodes and optional beta input. |
| Button binding scan | PASS: no unreferenced static button ID found. |
| Asset existence/case scan | PASS: no broken explicit path found. |
| Act 1 VM/read-only question validator | PASS: 1,300/1,300 questions evaluable by the current answer logic. |
| Built-in `validateExactAct1QuestionBanks()` | PASS; browser logged `All exact Act 1 question banks passed validation.` |
| Charm registry audit | 74 charms, 68 registered effect types, no duplicate charm IDs, unsupported types, or missing required values. |
| Browser console | No JavaScript errors; one expected autoplay warning: BGM blocked until user interaction. |
| Responsive browser checks | Login (desktop/mobile/landscape), Main Menu 390×844, Advisor 390×844, PvP 390×844. Findings documented below. |

Source SHA-256 at the report boundary:

- `index.html`: `15ee6c0195fea9c968762b4c938bdb14178dcd9d93d8a372685fdf001427ca38`
- `style.css`: `73584ba6dc20ce2249d17e604e76d9458ae1393c844070606ff518df5553d1e8`
- `script.js`: `3e687fc463343d02b55821ce61ddbab13b15b71caacf20796c9f270784ac95c8`
- `firestore.rules`: `3830e5ab6f83da800383dde3a316009f9c6611edc61d397595a875becf399591`

No persistent helper script was created.

## 4. High-Level System Status

| System | Status | Evidence / qualification |
|---|---|---|
| First page load | PASS | Local page loaded without JS console errors. |
| Login UI | WARNING | Inputs/buttons bind; desktop background is constrained to a 520px strip. |
| Firebase login/register/session | PARTIAL | Code paths and persistence inspected; no production account was created or mutated. |
| Guest flow | PARTIAL | Handler/storage path exists; full fresh-device flow not persisted during this audit. |
| Character/student profile | PARTIAL | Validation and save paths exist; live creation was not performed. |
| Main Menu | PASS | Opened and remained usable at desktop/mobile sizes. |
| Continue Journey / Act progression | FAIL | First victory can jump from `what-is-past` to `regular-rule-1`. See C-01. |
| Lesson/story/dialogue | WARNING | Typewriter and navigation are present; progression defect makes intended sequence unreliable. |
| Act 1 question data | PASS | 1,300/1,300 structurally valid under current evaluator. Content diversity warnings remain. |
| PvE battle | PARTIAL | Core logic statically validated; all 13 stages were not live-played end to end. |
| Rewards/replay | PASS (static) | First-clear, replay, practice, and dedup guards are present. |
| Practice Mode / Lesson Map | PASS (static) | Snapshot/restore and no-save/no-reward guards are present. |
| Save/load/manual save | PARTIAL | Queuing and guards exist; cross-device/network failure matrix not exercised. |
| Teacher Dashboard | FAIL (security) | Read/filter rendering exists, but authorization is only a client-side PIN and broad Firestore read. |
| PvP mock | PASS | Mock room/question/answer/damage recovery worked without story reward mutation. |
| PvP online room | NOT TESTED | Code exists; production writes intentionally avoided. |
| PvP online combat | PARTIAL / INCOMPLETE | Combat panels are deliberately hidden and UI says it will open in a later round. |
| Lingua Advisor | PASS (mock) | Opens safely, scoped mock responses, no API/network call or state mutation found. |
| Assets | WARNING | No missing path, but repository payload is exceptionally large. |
| Mobile UI | WARNING | Main Menu/Advisor/PvP fit horizontally; battle uses aggressive clipping rules. |
| Security/privacy | FAIL | Broad player reads, broad PvP writes, weak Dashboard authorization, and an `innerHTML` injection surface. |

## 5. Critical Findings

### C-01 — First victory skips four Phase 1 lessons

- **Severity:** CRITICAL
- **System:** Act 1 progression / Continue Journey
- **Location:** `script.js:24522-24575`, `script.js:41453-41458`; related normal reward/unlock path near `script.js:41330-41335`
- **What is wrong:** Any defeated enemy normalized as `timeDust` is routed to `transitionToRegularEdLessonAfterTimeDust()`. That function hardcodes `nextStageId = "regular-rule-1"`. The first stage, `what-is-past`, uses `Time Dust Sprite`, which normalizes to `timeDust`, even though its intended next stage is `what-is-tense`.
- **Impact:** Completing the first battle sets saved `currentStageId/currentLessonId` to `regular-rule-1`, skipping `what-is-tense`, `was/were`, `there was/were`, and `had` in Continue Journey. The normal reward path first unlocks the correct next stage, but the special transition immediately moves current progress farther ahead.
- **Reproduction:** Start with fresh Act 1 progress → complete `what-is-past` → continue from the result screen → inspect current lesson/Main Menu. Expected: `what-is-tense`. Actual code path: `regular-rule-1`.
- **Risk to data/progress:** Yes. It writes the wrong current stage to saved progress and can make student sequencing/reporting inaccurate.
- **Affected surfaces:** PvE, Lesson flow, Main Menu, Teacher Dashboard progress display.
- **Fix direction (do not implement in this audit):** Scope the special transition to the exact intended stage/boss or derive the next stage from ordered stage data. Add a fresh-save integration test asserting every stage transitions to its immediate successor.

## 6. High Findings

### H-01 — Every authenticated user can list all student/player records

- **Severity:** HIGH
- **System:** Firestore / Teacher Dashboard / privacy
- **Location:** `firestore.rules:5-8`
- **What is wrong:** `allow get, list: if request.auth != null;` permits any signed-in student to query the entire `players` collection.
- **Impact:** Player documents contain usernames/login email, full name, class, room, number, character, Grammaria, and detailed progress. The client-side Teacher Dashboard PIN is not an authorization boundary.
- **Verification:** Sign in as any ordinary user and query/list `/players` directly with the Firebase SDK; rules permit it.
- **Risk to data/progress:** Confidentiality risk; no direct write to other player documents under the current rule.
- **Affected surfaces:** Dashboard, Auth, student privacy.
- **Fix direction:** Use server-verified teacher/admin claims or a separate teacher-authorized aggregate; restrict students to `request.auth.uid == playerId`.

### H-02 — Any authenticated user can update any PvP room

- **Severity:** HIGH
- **System:** Firestore / PvP integrity
- **Location:** `firestore.rules:11-13`
- **What is wrong:** `allow read, create, update: if request.auth != null;` does not require room membership, valid state transitions, field restrictions, or ownership.
- **Impact:** Any signed-in user can alter opponent IDs, HP, winner, actions, or room status for any known room. Client-side answer and damage checks are also forgeable.
- **Verification:** An authenticated client can issue an update to a room it did not create/join; rules permit the request.
- **Risk to data/progress:** PvP room integrity and privacy; story rewards are currently separated.
- **Affected surfaces:** PvP online.
- **Fix direction:** Restrict reads/writes to room participants and validate allowed fields/state transitions, ideally with trusted server resolution.

### H-03 — Teacher Dashboard uses a discoverable 4-digit frontend gate, not authorization

- **Severity:** HIGH
- **System:** Teacher Dashboard / security
- **Location:** digest at `script.js:22371`; verifier around `script.js:22510`; Dashboard query around `script.js:32380`; rules at `firestore.rules:6`
- **What is wrong:** The PIN is compared in browser JavaScript. Even as SHA-256, the digest and verifier are shipped to every client; a 4-digit value is trivial to brute-force or bypass in DevTools. Firestore rules do not check a teacher role.
- **Impact:** A student can bypass the UI gate and read all student data because H-01 independently grants collection access.
- **Verification:** Inspect/override the client verifier or call Firestore directly as any authenticated account.
- **Risk to data/progress:** High confidentiality risk; Dashboard itself is read-only.
- **Affected surfaces:** Dashboard, Auth, Firestore.
- **Fix direction:** Treat the PIN only as optional UX. Enforce teacher identity in Firebase custom claims/rules and minimize returned fields.

### H-04 — Empty or filtered-out battle question pool completes the stage

- **Severity:** HIGH
- **System:** PvE battle / progress / rewards
- **Location:** `script.js:35426-35442`
- **What is wrong:** If filtering leaves `stage.questions.length === 0`, `startActBattle()` calls `completeNonBattleStage(stageConfig)`.
- **Impact:** A malformed bank/rule mapping can fail open, completing/unlocking a battle stage without combat. Current banks are nonempty, so this is a defensive-design defect rather than a presently triggered stage.
- **Reproduction:** In a safe test copy, make a battle stage's rule filter return zero questions and start it; the stage is completed instead of blocked.
- **Risk to data/progress:** Yes, if triggered by future data edits or a filter regression.
- **Affected surfaces:** PvE, rewards, Teacher Dashboard progress.
- **Fix direction:** Show a recoverable content error and do not call any completion/reward path.

### H-05 — Online PvP is exposed as a room feature but combat is not playable

- **Severity:** HIGH
- **System:** PvP online
- **Location:** `script.js:31582-31600`
- **What is wrong:** `renderPvpOnlineFoundationState()` hides question, answer, action, skill, charm, charge, and resolution panels. The visible message explicitly says online combat will open in a later round.
- **Impact:** Create/join/resume foundation may work, but connected users cannot complete an online duel through the UI.
- **Reproduction:** Create and join an online room in a safe Firebase test project; after connection, combat panels remain hidden.
- **Risk to data/progress:** No story reward risk found; abandoned/incomplete room documents can remain.
- **Affected surfaces:** PvP online only.
- **Fix direction:** Label the feature clearly as preview/room test until authoritative combat synchronization and end-state tests are complete.

### H-06 — Asset payload is too large for reliable web/mobile delivery

- **Severity:** HIGH
- **System:** Performance / deployment
- **Location:** `assets/` (~974 MB), especially `assets/characters/`
- **What is wrong:** Several GIFs are 40-89 MB each; duplicate source/transparent/optimized variants are committed and some animated backgrounds/models are loaded by the app.
- **Impact:** Long GitHub Pages downloads, memory pressure, stutter, tab reloads, data usage, and poor school/mobile network reliability.
- **Examples:** `master-verion-v2.gif` and `master-verion-new-source.gif` ~88.57 MB each; `timedust.gif` ~75.19 MB; `yesterday-spirit.gif` ~73.32 MB; `echo-trick.gif` ~67.80 MB; `main-character-idle.gif` ~60.86 MB; `grammar-hall-animated.gif` ~42.14 MB.
- **Risk to data/progress:** Indirect; unloads/timeouts can interrupt gameplay before save.
- **Affected surfaces:** All visual scenes, especially mobile.
- **Fix direction:** Inventory actual references, remove repository-only duplicates from deploy output, convert animations to efficient video/WebP formats, lazy-load per scene, and set performance budgets.

## 7. Medium Findings

### M-01 — Login background is not full-page on desktop

- **Severity:** MEDIUM
- **System:** Login UI
- **Location:** `style.css:610-620`
- **Finding:** `#loginScene { width: min(520px, 100%); margin: 0 auto; }` constrains the background scene to a centered 520px strip. At 1440×900 the scene spans x=460..980, leaving the rest outside the intended hero background.
- **Reproduction:** Open Login at 1440×900.
- **Impact:** Violates the intended full-page background presentation; Auth controls still work.
- **Fix direction:** Let the scene fill the viewport and constrain only the login card.

### M-02 — Mobile battle content can be clipped by multiple `overflow: hidden` constraints

- **Severity:** MEDIUM
- **System:** Battle responsive UI
- **Location:** `style.css:4893+`, `style.css:5234+`, `style.css:5669+`
- **Finding:** On small screens, the active scene is fixed to `100svh`; battle stage, dashboard, message, panel, charm panel/options, and flow panel all receive max-heights and hidden overflow. Long Thai explanations, typing UI, word tiles, or charm lists have no guaranteed scroll container.
- **Impact:** Dynamic controls may become unreachable on short mobile landscape or large-font settings.
- **Reproduction:** Test a 360×640/640×360 device with arrangement questions and maximum-length feedback.
- **Fix direction:** Keep fixed combat framing only where necessary and provide explicit scrolling for the active lower panel.

### M-03 — Stored player name can enter `innerHTML` without escaping

- **Severity:** MEDIUM
- **System:** Account Settings / XSS
- **Location:** `safeDisplayText()` at `script.js:29925`; `openAccountSettingsModal()` at `script.js:32900-32928`; profile validator at `script.js:22462`
- **Finding:** `safeDisplayText` validates emptiness but does not HTML-escape. `view.playerName`, ultimately derived from user-controlled character/display name, is interpolated into `panel.innerHTML`. Student/profile validation checks presence but not markup.
- **Impact:** A crafted name stored in local/Firestore profile can execute markup/script-capable payloads when Account Settings opens. The Teacher Dashboard itself uses `textContent`, which limits cross-user propagation there.
- **Reproduction:** In an isolated test profile, use an HTML payload as character name and open Account Settings.
- **Fix direction:** Build rows with `textContent` or apply the existing `escapeHtml()` at every interpolation boundary.

### M-04 — Unknown question types silently fall back to multiple-choice

- **Severity:** MEDIUM
- **System:** Question contract
- **Location:** question type normalization/rendering near `script.js:36000-36330`
- **Finding:** Unsupported/typo type strings are treated as multiple-choice rather than rejected. Current aliases such as `incorrect-sentence` work only because they have options.
- **Impact:** A future typo may conceal a data defect until runtime, produce generated distractors, or change intended interaction.
- **Fix direction:** Maintain an explicit alias map and make validation fail for unknown types.

### M-05 — Final boss bank contains only multiple-choice questions

- **Severity:** MEDIUM
- **System:** Assessment/content diversity
- **Location:** `finalBossQuestions`, beginning `script.js:11753`
- **Finding:** All 100 final-boss questions are multiple-choice; there are no typing or arrangement items.
- **Impact:** The final assessment does not directly measure productive spelling/sentence construction and does not exercise mixed-type battle UI.
- **Fix direction:** If mixed assessment is intended, define a target distribution and validate it. No current answer is structurally invalid.

### M-06 — Eighty duplicate prompts reduce question diversity

- **Severity:** MEDIUM
- **System:** Question banks / repeat quality
- **Location:** primarily `irregularPracticeQuestions` vs `irregularWraithQuestions`; also repeated generic prompts across regular-rule banks
- **Finding:** The cross-bank audit found 80 duplicate prompt strings. Some repetition may be intentional review, but large overlap increases predictability.
- **Impact:** Students can memorize wording; smart-repeat feels repetitive even with unique IDs.
- **Fix direction:** Distinguish intentional review duplicates from accidental copies and set a cross-bank duplicate threshold.

### M-07 — Optional Master Verion questions contain a duplicate ID

- **Severity:** MEDIUM
- **System:** Lesson optional questions
- **Location:** `script.js:33464` and `script.js:33479`
- **Finding:** `regular_meaning` appears in both `phase1Ending` and `regularEd` menus.
- **Impact:** Current menu-local lookup works, but analytics/history keyed globally by ID would collide.
- **Fix direction:** Namespace IDs by menu/stage.

### M-08 — Teacher password fallback can never validate without Web Crypto

- **Severity:** MEDIUM
- **System:** Teacher Dashboard compatibility
- **Location:** `sha256Hex()` around `script.js:22500`
- **Finding:** Without `crypto.subtle`, the function returns `fallback_<fnv-like hash>` but compares it against a SHA-256 digest, so no password can match.
- **Impact:** Dashboard access fails in unsupported/insecure contexts. Modern secure browsers normally provide Web Crypto.
- **Fix direction:** Explicitly report unsupported security context rather than compute an incompatible fallback.

### M-09 — General game modal lacks keyboard focus management

- **Severity:** MEDIUM
- **System:** Accessibility / overlays
- **Location:** `openGameModal()` at `script.js:23969`, `closeGameModal()` at `script.js:23863`, startup bindings near `script.js:43773`
- **Finding:** Modal has `role="dialog"` and `aria-modal`, but opening does not focus the modal/first action, trap Tab, record/restore prior focus, or close on Escape. Only the Advisor has an Escape handler.
- **Impact:** Keyboard and screen-reader users can remain behind the modal or become disoriented.
- **Fix direction:** Add focus entry/trap/restore and Escape behavior unless `lockClose` is active.

### M-10 — PvP forfeit code is unreachable from the rendered UI

- **Severity:** MEDIUM
- **System:** PvP online
- **Location:** `renderPvpScene()` around `script.js:31628`
- **Finding:** `pvpForfeitButton` is always given `hidden`, even in online mode, despite a forfeit handler existing.
- **Impact:** A connected player cannot intentionally conclude a match through the visible interface.
- **Fix direction:** Show it only in an active online match and validate the transaction server-side/rules-side.

### M-11 — Debug logging is enabled and player progress is logged

- **Severity:** MEDIUM
- **System:** Privacy / performance / diagnostics
- **Location:** config flags `script.js:267` and `script.js:372`; progress logs at `script.js:29194` and `script.js:32967`; many battle logs throughout
- **Finding:** Battle/heavy-attack debug flags are true. Full progress objects, Firebase UIDs, usernames, battle state, and student counts are logged.
- **Impact:** Shared school devices and support screenshots can expose identity/progress; frequent logs add runtime noise.
- **Fix direction:** Centralize a production-disabled logger and redact identifiers/profile objects.

### M-12 — Monolithic runtime increases regression and startup risk

- **Severity:** MEDIUM
- **System:** Architecture/performance
- **Location:** `script.js` (~1.648 MB, 43,907 lines)
- **Finding:** Auth, content, 1,300 questions, battle, PvP, Advisor, Dashboard, and rendering share global state in one non-module file.
- **Impact:** Every change reparses/reloads all systems, global coupling is hard to test, and duplicate/dead logic is easier to retain.
- **Fix direction:** After urgent defects, split immutable content and pure validators first, then stateful subsystems behind narrow interfaces.

## 8. Low Findings

### L-01 — Dead code remains after unconditional returns

- **Severity:** LOW
- **Location:** `handleTimeDustDefeated()` after `script.js:41353`; `chooseActCharmV2()` after an unconditional return near `script.js:39268`
- **Impact:** Misleads future maintainers and contributed to duplicated Time Dust transition logic.
- **Fix direction:** Remove only after regression tests capture intended behavior.

### L-02 — Some tap targets are below 44px

- **Severity:** LOW
- **Location:** Login tabs are 38px at `style.css:660+`; several PvP/top controls measure about 38-42px.
- **Impact:** Harder touch use on small screens.
- **Fix direction:** Use at least 44×44 CSS pixels for primary interactive targets.

### L-03 — Focus-visible styling is inconsistent

- **Severity:** LOW
- **Location:** Only selected controls have `:focus-visible` rules (`style.css:205`, `2764`, `2952`, `8528`, `9076`, `9271`).
- **Impact:** Some keyboard focus positions may be difficult to see.
- **Fix direction:** Provide a consistent global focus token without removing component-specific styling.

### L-04 — Buttons without `type` depend on current no-form markup

- **Severity:** LOW
- **Location:** 12 buttons including `startButton`, `attackButton`, `itemButton`, `focusButton`, `parryButton`, and `returnTitleButton`.
- **Impact:** No current bug, but future wrapping in a form could cause accidental submission.
- **Fix direction:** Set `type="button"` explicitly during a later markup cleanup.

### L-05 — Normal autoplay warning can obscure real console signals

- **Severity:** INFO
- **Location:** BGM startup around `script.js:23415`
- **Finding:** Browser warning occurs before user interaction and is handled.
- **Impact:** No functional failure; expected platform behavior.

### L-06 — TODOs and prototype labels remain

- **Severity:** LOW
- **Location:** background fallback TODO `script.js:21642`, roster duplicate-number TODO `script.js:27788`, score-total TODO `script.js:28979`, online-combat placeholder `script.js:31599`.
- **Impact:** Documents unfinished behavior; online placeholder is covered separately as H-05.

## 9. Question Bank Audit

### Act 1 exact bank inventory

| Bank | Stage/topic | MC | Typing | Arrangement | Total | Expected | Result |
|---|---|---:|---:|---:|---:|---:|---|
| `phase1PastMeaningQuestions` | What is Past | 80 | 10 | 10 | 100 | 100 | PASS |
| `phase1PastTimeWordsQuestions` | Past Time Words / tense context | 80 | 10 | 10 | 100 | 100 | PASS |
| `phase1WasWereQuestions` | was / were | 90 | 10 | 0 | 100 | 100 | PASS |
| `phase1ThereWasWereQuestions` | there was / there were | 100 | 0 | 0 | 100 | 100 | PASS; limited type diversity |
| `phase1HadQuestions` | had | 79 | 10 | 11 | 100 | 100 | PASS |
| `regularRuleOneQuestions` | add `-ed` | 80 | 10 | 10 | 100 | 100 | PASS |
| `regularRuleTwoQuestions` | ending `e`, add `-d` | 80 | 10 | 10 | 100 | 100 | PASS |
| `regularRuleThreeQuestions` | consonant + `y` → `ied` | 80 | 10 | 10 | 100 | 100 | PASS |
| `regularRuleFourQuestions` | CVC/double consonant | 80 | 10 | 10 | 100 | 100 | PASS |
| `edForgerQuestions` | regular-rule mini boss | 80 | 10 | 10 | 100 | 100 | PASS |
| `irregularPracticeQuestions` | irregular lesson | 90 | 10 | 0 | 100 | 100 | PASS; overlaps Wraith prompts |
| `irregularWraithQuestions` | irregular mini boss | 90 | 10 | 0 | 100 | 100 | PASS; overlaps practice prompts |
| `finalBossQuestions` | Memory Breaker | 100 | 0 | 0 | 100 | 100 | PASS structurally; M-05 |
| **Act 1 total** | 13 banks | **1,109** | **110** | **81** | **1,300** | **1,300** | **PASS** |

### Other question sources

| Source | Count / behavior | Audit result |
|---|---|---|
| `PVP_QUESTION_BANK` | 36: 12 MC, 12 typing, 12 arrangement | Structurally valid; mock renderer exercised. |
| Practice Mode | Reuses the selected stage's Act 1 bank | Same 1,300-question validation applies; no separate mutable copy. |
| Focus | Selects from current stage questions and uses the same renderer/evaluator | Input/tiles/MC rendering and recovery fallback present. |
| Optional Master Verion menus | 12 menus × 2 prompts = 24 advisory questions | Content present; duplicate ID `regular_meaning` (M-07). These are dialogue choices, not scored battle questions. |
| Guided lesson practice | Stored in `LESSON_SEGMENTS` with explicit choices/answers | Correct answer is compared against configured answer; no missing UI data found in inspected segments. |
| Recovery/fallback | Data-error panel and question-exhaustion recovery actions exist | Prevents a missing renderer from becoming a silent lock; H-04 remains a fail-open at battle start. |
| Old was/were extras | `extraWasWereQuestions=[]`, `wasWereWispExtraBattleQuestions50=[]` | Neutralized; not pushed into the 100-question current bank. |

### Exhaustive validation results

The read-only validator applied current normalization/evaluation behavior to every Act 1 and PvP question:

- zero empty prompt or missing primary answer;
- zero duplicate question IDs inside the 13 exact Act 1 banks;
- zero MC items whose correct answer is absent from options;
- zero empty/duplicate MC options;
- zero placeholder values such as `ตัวเลือกหลอก`, `undefined`, or `null`;
- zero typing questions without an accepted answer path;
- zero arrangement questions with impossible tile multisets;
- zero prompts that would render without an answer control under current type routing;
- correct submissions are accepted after trim/case normalization; wrong answer samples are rejected;
- arrangement evaluation ignores a final period and represents duplicate words as indexed tile objects;
- typing Enter submission, arrangement undo/clear/confirm, and MC button creation are implemented;
- malformed typing/arrangement data produces a recovery error UI instead of an empty panel;
- current stage banks do not exhaust into a soft-lock: indexing wraps while the enemy lives and a recovery route exists.

### Content-quality warnings

- 80 prompt strings are duplicated across banks, mainly irregular practice/Wraith and generic regular-rule wording (M-06).
- Final boss is all MC (M-05).
- Unknown type aliases silently become MC (M-04).
- No observed contamination of was/were with `there was/were` or `had` in the current exact banks.
- No observed wrong regular transformations, irregular V2 mappings, CVC doubling, `y → ied`, ending-`e + d`, or placeholder choices in the automated structural/evaluator audit.
- Semantic correctness of all 1,300 explanations was not independently reviewed by two human language experts; high-risk rule transformations and answer-option consistency were machine-checked against configured accepted answers.

## 10. PvE Battle Audit

### Stage/balance inventory

| Stage | Enemy max HP | Configured first-clear reward |
|---|---:|---:|
| `what-is-past` | 55 | 20 |
| `what-is-tense` | 60 | 20 |
| `act1_phase1_unit3_was_were` | 50 | 25 |
| `act1_phase1_unit4_there_was_were` | 70 | 25 |
| `act1_phase1_unit5_had` | 75 | 30 |
| `regular-rule-1` | 85 | 20 |
| `regular-rule-2` | 90 | 20 |
| `regular-rule-3` | 95 | 25 |
| `regular-rule-4` | 100 | 25 |
| `ed-mini-boss` | 150 | 80 |
| `irregular-lesson` | 105 | 35 |
| `irregular-mini-boss` | 170 | 90 |
| `final-boss` | 240 | 150 |

All 13 stages have a linked 100-question bank, HP, reward, enemy metadata, and an existing referenced background/asset path. `regular-intro` and `merge-twist` are story/interstitial content and correctly do not supply battle questions.

### Core battle state

- Player HP initializes to 100; AP initializes to 5 and clamps to configured maximum plus any applied max-AP bonus.
- Enemy HP comes from `ACT1_ENCOUNTER_MAX_HP` and clamps to zero.
- Battle state tracks action/answer locks, question histories, item counts, cooldowns, pending attack, Boss Intent, heavy attack, parry IDs/timers, extra-turn flags, victory handling, and practice/replay context.
- Invalid AP/cooldown/selection paths return before cost application.
- `victoryHandled`, `isActive`, stale challenge IDs, and action locks protect against common double-click and duplicate-victory cases.
- Enemy-turn timers, typewriter timers, requestAnimationFrame loops, parry state, and PvP snapshot unsubscribe have cleanup paths.

### Skills

| Skill | AP | Cooldown | Base multiplier / behavior |
|---|---:|---:|---|
| Core Spark | 1 | 1 | ×1.00 |
| Syntax Blade | 2 | 2 | ×1.35 and +10% correct-answer component |
| Grammaria Surge | 3 | 3 | ×1.70, +12%, charge efficiency, Weak interaction |

No infinite bonus-turn path was found. `doubleTurnChanceOnce` and `perfectChargeExtraTurnOnce` use battle flags, and bonus turns are prevented from chaining another bonus turn.

### Items

| Item | Asset/color | Start | Effect | Result |
|---|---|---:|---|---|
| HP potion | `assets/items/hp_potion.png` red/pink | 2 | HP +30 | Correct mapping; clamps at max. |
| AP potion | `assets/items/ap_potion.png` blue/purple | 2 | AP +2 | Correct mapping; clamps at max. |
| Attack boost | `assets/items/attack_boost_potion.png` orange/gold | 1 | Next positive attack ×2 | Consumed once; duplicate ready state is blocked. |

### Grammaria damage scaling observed

| Grammaria | Rank multiplier | Minimum final damage |
|---:|---:|---:|
| 0-149 | ×1.00 | 6 |
| 150-299 | ×1.25 | 9 |
| 300-499 | ×1.55 | 12 |
| 500+ | ×1.90 | 16 |

- Damage charms receive additional synergy of ×1.05 at 300-499 and ×1.10 at 500+.
- True bosses apply ×0.90 resistance.
- PvP uses a separate formula and does not use the PvE Grammaria rank multiplier.
- Practice uses the player's current Grammaria for combat strength but reward functions return zero.
- **Balance caveat:** minimum rank damage is applied after most mitigation. Therefore the minimum can partially override boss resistance/defense in low-damage cases. This is not a coding soft-lock, but the design order should be confirmed.

### Battle conclusions

- Answer renderers, items, AP checks, cooldown setup/tick paths, Boss Intent, parry guards, stun state, victory dedup, defeat/retry/exit handlers, and recovery panels are present.
- No evidence of damage being hard-stuck at 2 was found.
- H-04 is the main fail-open defense issue.
- M-02 is the main mobile reachability risk.
- Full live playthrough of every stage/skill/charm/parry combination was outside the read-only, no-progress-mutation boundary.

## 11. Lesson / Story Audit

- Existing typewriter uses gradual text reveal, shared speaker-name/portrait box, Next behavior, skip-current-line handling, and typewriter sound pool.
- Next/Previous, explanation, review, Lesson Map, dictionary placeholder, battle entry, and back-to-menu handlers are bound.
- Dialogue and activity resume fields are saved separately (`currentDialogueIndex`, `currentLessonStepIndex`, screen/mode context).
- Fast-click protections exist through typing state and button/action locks; no duplicate listener binding loop was found.
- Optional Master questions are inserted into the existing lesson flow, not a separate dialogue engine.
- Master Verion/player assets have load-failure fallbacks; explicit referenced paths exist.
- Lesson Map constructs reached entries; completed entries are replayable, current entries are playable, and future locked entries are excluded/blocked.
- **FAIL:** C-01 breaks the intended Phase 1 sequence after the first battle.
- Dictionary button currently announces a future prototype rather than opening a functional dictionary; this is an intentional placeholder UX, not a crash.

## 12. Reward / Progress Audit

- Default progress safely initializes arrays for completed lessons/stages, unlocked stages, defeated bosses, rewards, fragments, and claimed reward behavior.
- First-clear reward logic checks completion before awarding and deduplicates fragments, rewards, badges, and defeated bosses.
- Replay stores the replay target separately, does not overwrite current progress when entering, and returns zero/duplicate reward output.
- Practice snapshots progress/Grammaria/HP, makes `saveProgress()` return without persistent mutation, and restores the snapshot on exit.
- Save writes are queued through a pending promise, reducing overlapping Firestore write races.
- Manual save validates a supported checkpoint and waits for pending writes.
- Guest/local data and Firebase player data use separate storage paths; logout clears the active game session and signs out Firebase when applicable.
- Configured first-clear stage rewards total 565 across 13 battle stages; no change was made.
- **Critical exception:** C-01 writes an incorrect current stage after the first victory.
- Full cross-account switching and network-offline conflict behavior require manual testing with isolated accounts.

## 13. Practice Mode / Lesson Map Audit

- Completed/unlocked lessons are available for review; locked lessons remain blocked.
- Replay confirmation explains that no duplicate Grammaria/reward is granted.
- Double-entry guards prevent opening/starting the same selection twice.
- Practice state holds a return snapshot rather than replacing real current lesson.
- Practice reward function returns no Grammaria/item/fragment and does not mark bosses defeated.
- `saveProgress()` exits early during active practice.
- Exit/result restores real progress and player identity.
- A refresh during practice was not destructively tested; code indicates the real snapshot remains unsaved and normal progress should survive, but this needs the manual case in Section 21.
- Teacher debug skip actions are gated separately and were not invoked; audit found no intentional reward path attached to Practice Mode.

## 14. Teacher Dashboard Audit

- Current SHA-256 digest matches password `4957`; the prior password digest does not match.
- Password is not displayed in UI, console, or localStorage; only the digest is shipped.
- Dashboard reads `players` via `getDocs`, normalizes incomplete/guest records, and does not write progress.
- Filters exist for class level, room, and search.
- Table rendering uses DOM/text content for record values, reducing table XSS risk.
- Columns/summary include identity/class, character, current lesson, progress percent, Grammaria, bosses, and last active.
- Missing profiles receive explicit fallback labels; guests are filtered out.
- Firestore permission errors are mapped to a Thai user-facing message.
- CSS gives the 980px table a horizontal scroll wrapper on mobile.
- **Security status: FAIL** due H-01/H-03; the UI gate must not be considered authorization.
- **Compatibility warning:** M-08 causes gate failure where Web Crypto is unavailable.

## 15. PvP Audit

### Mock mode

- Main Menu button opens a separate `pvpDuelScene`, not the PvE `battleScene`.
- Mock room creation, question selection, receive/answer, wrong-answer recovery, damage (observed 120 → 105), and restart flow worked in local browser testing.
- Bank supports MC, typing, and arrangement.
- Mock controls do not call Firestore and do not grant Grammaria/story rewards or alter Teacher Dashboard progress.
- Action log is trimmed to 30 entries.

### Online room foundation

- Create, join, code normalization, resume session, copy code, leave, snapshot listener, side A/B mapping, and transaction functions exist.
- Listener unsubscribe is called on leave/exit/reset paths.
- Live create/join was not run because it would write production `pvpRooms`.
- Firestore rules permit the operations but are overbroad (H-02).
- Connected online combat is deliberately hidden/incomplete (H-05).
- Forfeit is hidden (M-10).
- The client contains answer and damage resolution code, but client authority is cheat-prone even after UI exposure.
- Mobile 390×844 had no horizontal clipping, but the screen is approximately 1,985px tall before expanded battle details; usability requires substantial scrolling.

**Exact current status:** Mock duel is functional. Online room infrastructure is partially implemented. Online combat is not currently playable through the UI.

## 16. Lingua Advisor Audit

- Buttons exist on Main Menu and Battle; lesson-context/map access is integrated through the lesson/review UI paths.
- Overlay opens above the current scene and closes by button, backdrop click, or Escape.
- Starts with five scope cards: lessons, game/how-to, assessment, story/world, and other English questions.
- Lesson scope derives entries from existing lesson data and preserves locked status.
- Scope badge and quick actions change with selected scope.
- Master Verion image has a valid path and load fallback.
- Messages are escaped with `escapeHtml`; input is capped at 280 characters.
- State is explicitly `mode: "mock"`; no `fetch`, OpenAI SDK, bearer token, WebSocket, or backend call is present.
- Inspection found no mutation of progress, rewards, HP, AP, turn ownership, or unlocked lessons.
- Mobile 390×844: 374×828 panel, visible close control, five scope buttons, and scrollable 14-item lesson list; no clipping observed.
- No answer-revealing API exists; mock content should still be reviewed pedagogically if expanded.

## 17. Firebase / Firestore / Auth Audit

- Firebase app initialization appears once using Firebase CDN 12.15.0.
- Browser-local Firebase Auth persistence is requested; failures are caught and logged.
- `onAuthStateChanged`, login, register, logout, remote profile save/load, and local fallback paths have error handling.
- Guest/local identity is separated from Firebase user identity in storage keys and mode flags.
- Firebase web config is client-visible as expected and is not itself a secret.
- No OpenAI/API secret, bearer token, private service credential, or server private key was found.
- Advisor adds no external request. Network activity is limited to the existing Firebase/CDN/audio/image resources.
- Dashboard is read-only at application level; mock PvP and Advisor do not write Firestore.
- H-01 and H-02 make Firestore authorization unsafe for real student deployment.
- Local fallback Auth explicitly warns that it is not production-safe; it should remain a prototype/offline mode only.
- Progress/profile logging (M-11) can expose data on shared devices.
- Account Settings `innerHTML` path creates M-03.

## 18. UI / Responsive / Asset Audit

### Browser observations

- Login 390×844: card and background fit; no horizontal overflow.
- Login 360×620: register card fits and scrolls within the scene.
- Login 844×390: card remains reachable through its internal scroll.
- Login 1440×900: background scene is only 520px wide (M-01).
- Main Menu 390×844: no horizontal clipping; page is approximately 2,169px tall and scrollable.
- Advisor 390×844: usable, close button visible, list scrolls.
- PvP 390×844: no horizontal clipping; very tall vertical workflow.
- Teacher Dashboard table has an explicit horizontal scroll wrapper.
- PvE battle mobile was not entered with a real progress mutation; CSS inspection shows M-02.

### Assets

- No missing or case-mismatched explicit asset path was found.
- Player, Master Verion, enemies, backgrounds, potion icons, logo, login hero, tutorial, credits, PvP/Advisor references all resolve.
- Potion color mapping is correct: red/pink HP, blue/purple AP, orange/gold attack boost.
- All static image tags have alt attributes; a dynamic decorative portrait uses empty alt appropriately when hidden.
- Performance is the dominant asset issue (H-06), not path correctness.

### CSS risk profile

- `.hidden` consistently uses `display: none !important`; runtime toggling is extensive but IDs/handlers are present.
- Mobile battle has nested height/overflow constraints (M-02).
- Login width constraint causes the desktop hero defect (M-01).
- No confirmed z-index collision hid Advisor close controls in tested viewports.
- Legacy and new battle rules coexist in a 9,636-line stylesheet, increasing cascade-regression risk even where current screenshots fit.

## 19. Security / Privacy Risks

| ID | Severity | Risk | Data/progress impact |
|---|---|---|---|
| H-01 | HIGH | Any authenticated user can list all student/player documents. | Personal-data confidentiality. |
| H-02 | HIGH | Any authenticated user can update any PvP room. | Match integrity and room privacy. |
| H-03 | HIGH | Client-only 4-digit Dashboard gate is bypassable/brute-forceable. | Exposes data already permitted by rules. |
| M-03 | MEDIUM | User-controlled player name enters Account Settings `innerHTML`. | Stored self-XSS/session risk. |
| M-11 | MEDIUM | Progress, username, UID, and runtime data logged to console. | Shared-device privacy/support-log leakage. |
| INFO | INFO | PvP answer/damage resolution is client-side. | Cheating/tampering if online combat is enabled unchanged. |
| INFO | INFO | Future Advisor API keys would be unsafe in frontend. | No such key/call exists now. |

No production secret was found. The Teacher PIN digest and Firebase web config are visible by design but cannot provide security without backend/rules enforcement.

## 20. Performance Risks

1. **HIGH:** ~974 MB asset tree and multiple 40-89 MB GIFs (H-06).
2. **MEDIUM:** 1.648 MB monolithic JavaScript must parse before all systems are available.
3. **MEDIUM:** All 1,300 Act 1 questions and PvP/advisory content are in the initial bundle.
4. **MEDIUM:** Multiple source/transparent/optimized character variants appear to duplicate deploy payload.
5. **MEDIUM:** Animated full-scene GIFs can consume substantial decode memory/CPU on low-end phones.
6. **LOW:** Debug logging is frequent in battle loops and state transitions.
7. **LOW:** Many `innerHTML` rerenders rebuild option/card collections; current list sizes are bounded.
8. **PASS:** PvP log is capped at 30; recent focus histories are capped; no unbounded Advisor message behavior was observed in the tested mock session.
9. **PASS (static):** PvP snapshot unsubscribe and battle timer/parry cleanup paths exist; no definite listener/timer leak was found.

Recommended direction: ship only referenced optimized assets, lazy-load scene content, split immutable question data from the runtime, disable production debug, and measure on a low-end Android device over throttled school Wi-Fi.

## 21. Manual Test Plan

All tests below should use a disposable Firebase test project or isolated test accounts where writes are required.

| ID / category | Steps | Expected result | Risk if failed |
|---|---|---|---|
| AUTH-01 Login | Load fresh browser → log in with a valid test account. | Main Menu/character setup opens once; no duplicate session. | Cannot access game or mixed identity. |
| AUTH-02 Register | Register a unique test user, reload, sign in again. | One Auth user/one player doc; persistence works. | Duplicate/orphan profile. |
| AUTH-03 Guest/logout | Enter Guest → make local progress → logout → sign in as registered user. | Guest data stays isolated; registered data is not replaced. | Cross-account data mixing. |
| AUTH-04 Restore | Close/reopen tab after login, then after logout. | Logged-in session restores; logout remains logged out. | Session/privacy fault. |
| CHAR-01 Character | Create male and female characters in separate disposable profiles. | Correct asset/name/profile saves and reloads. | Broken onboarding/progress identity. |
| CHAR-02 Validation | Try blank/markup/overlong names and invalid student numbers. | Clear validation; markup renders as text everywhere. | XSS or malformed roster. |
| MENU-01 Navigation | Open every Main Menu button and return. | No dead button, stacking overlay, or state mutation. | Major navigation block. |
| MENU-02 Responsive | Test 360×640, 390×844, 768×1024, 1440×900. | Full intended background, readable cards, reachable controls. | Visual/accessibility regression. |
| LESSON-01 Sequence | Fresh profile: clear each stage in order and record `currentStageId`. | Immediate ordered successor after every clear. | Detects C-01/data sequencing. |
| LESSON-02 Dialogue | Rapid-tap Next, hold, Previous, open/close explanation. | Typewriter completes/advances once; no duplicate lines. | Story soft-lock/skip. |
| LESSON-03 Map/replay | Open completed/current/locked lesson cards. | Completed replayable, current playable, locked blocked. | Progress bypass or inaccessible review. |
| BATTLE-01 Stage matrix | Start all 13 battles from clean stage fixtures. | Correct enemy, HP, background, 100-question pool. | Broken stage linkage. |
| BATTLE-02 Actions | Use normal attack, all skills, Focus, all items, all charm ranks. | Costs/cooldowns/effects match UI; invalid action costs nothing. | Balance/state corruption. |
| BATTLE-03 Defense | Exercise Boss Intent, Weak/Guard/Stun, Parry grades, Point Parry, timeout. | One resolved boss action; stale/double input ignored. | Double damage or lock. |
| BATTLE-04 End states | Win, lose, retry, exit, double-click result/continue. | Victory/defeat fires once; return context correct. | Duplicate reward/progress. |
| QTYPE-01 MC | Submit correct and every wrong option from representative stages. | Only configured answer accepted. | Incorrect assessment. |
| QTYPE-02 Typing | Test case, leading/trailing spaces, Enter, punctuation variants. | Documented normalization accepted; wrong text rejected. | Unfair marking. |
| QTYPE-03 Arrangement | Test duplicate words, undo, clear, punctuation, confirm. | Tiles remain selectable by instance; accepted sentence passes. | Impossible answer/soft-lock. |
| QTYPE-04 Exhaustion | Force long battle through full pool in isolated build. | Smart repeat/wrap continues; recovery UI remains usable. | Battle soft-lock. |
| REWARD-01 First/replay | Record totals → first clear → replay same stage twice. | Reward once; replays change no totals/collection/flags. | Reward farming. |
| REWARD-02 Progress | Replay an early lesson while current is later. | Current/latest progress remains later. | Progress rollback. |
| PRACTICE-01 Isolation | Start practice, win/lose/exit, reload mid-practice. | Real progress/rewards/HP snapshot remains unchanged. | Data corruption. |
| DASH-01 Gate | Test `4957`, old password, wrong password, no Web Crypto context. | Only current PIN works in supported secure context; clear unsupported message. | Unauthorized/blocked Dashboard. |
| DASH-02 Data/filter | With teacher-role test account, load mixed complete/incomplete records; filter class/room/search. | Correct counts/rows, no guest, safe missing values. | Incorrect student monitoring. |
| DASH-03 Rules | Use student and teacher test accounts against emulator/rules tests. | Student reads self only; teacher reads approved fields. | Confirms H-01/H-03. |
| PVP-M-01 Mock | Complete MC, typing, arrangement, attack, heal, wrong-answer loop, match end. | HP/actions sync locally; no rewards/progress writes. | Broken practice duel. |
| PVP-O-01 Room | Two test accounts create/join/copy/resume/leave room. | One room, correct A/B mapping, one listener/client, cleanup. | Room leak/desync. |
| PVP-O-02 Adversarial | Third account attempts read/update; participant sends illegal fields/damage. | Rules reject non-member/invalid transitions. | H-02 exploitation. |
| PVP-O-03 Combat | After implementation, exchange all types/actions simultaneously. | Exactly-once damage/heal, authoritative winner, forfeit works. | Cheating/race conditions. |
| ADVISOR-01 Scope | Open from Menu/Battle/Lesson → select every scope/quick action → close. | Scoped mock answer; current game state unchanged. | Turn/progress mutation. |
| ADVISOR-02 Safety | Enter HTML/script-like text and long Thai text. | Escaped/truncated safely; no network call. | XSS/privacy. |
| MOBILE-01 Battle | 360×640 and 640×360: MC/typing/arrangement/charm/parry with large text. | Every active control scrolls into reach; no overlap/clipping. | M-02 blocks play. |
| MOBILE-02 Overlays | Test modal, Advisor, Dashboard table, PvP with keyboard open. | Close controls visible; focus/scroll safe. | Trapped UI. |
| FIRE-01 Offline | Disconnect during load/save/manual save and reconnect. | Clear status, queued/retry behavior, no rollback. | Lost progress. |
| FIRE-02 Rules | Run Firebase Emulator rules tests for `players` and `pvpRooms`. | Least-privilege matrix passes. | Privacy/integrity breach. |
| SAVE-01 Checkpoints | Save/reload at story, lesson, each battle phase, result, and victory. | Supported scenes resume safely; no duplicated transition/reward. | Save corruption. |
| SAVE-02 Account switch | Alternate two users and Guest on one browser. | Storage keys and Firestore docs remain isolated. | Cross-student data leak. |

## 22. Recommended Fix Order

1. **Fix C-01 first:** restore deterministic immediate-next-stage progression and add a full 13-stage transition test.
2. **Lock down Firestore:** fix H-01/H-02 with emulator-tested role/member rules before real student/PvP deployment.
3. **Replace Dashboard PIN as authorization:** keep it only as UX after teacher claims/rules exist.
4. **Fail closed on empty battle banks:** remove completion/reward from the zero-question path.
5. **Decide PvP product state:** hide/label online preview or finish authoritative synchronized combat before promotion.
6. **Reduce deploy assets:** largest practical reliability gain for mobile/GitHub Pages.
7. **Repair Account Settings XSS boundary and redact production logs.**
8. **Resolve mobile battle scroll/clipping, then run the viewport matrix.**
9. **Make Login background full viewport and improve modal/tap-target accessibility.**
10. **Improve question diversity/contracts:** explicit type aliases, mixed final assessment if intended, duplicate prompt review, unique optional IDs.
11. **Modularize after behavior tests exist:** start with question data/validators, then Auth, battle, PvP, Dashboard, Advisor.

## 23. Things Not Tested

- No production Firebase account was created, deleted, or modified.
- No production `players` or `pvpRooms` document was written.
- Live Firebase register/login/network-offline/cross-device behavior was not exercised end to end.
- Online PvP create/join/resume was not executed; static code and rules were inspected.
- Online PvP combat cannot be tested through current UI because it is hidden/incomplete.
- Every one of the 1,300 questions was evaluator-validated, but not answered manually by a human language expert.
- All 13 PvE battles were not live-played to completion in every skill/charm/parry/item combination.
- Mobile PvE battle was not opened using a mutating real-progress route; CSS risk was inspected statically.
- Screen-reader, switch-control, and real-device low-memory testing were not performed.
- GitHub Pages deployment/network waterfall was not run; asset sizes and paths were audited locally.
- Browser Auth console remained free of new JS errors during non-destructive checks; expected BGM autoplay warning remained.

## 24. Final Summary

### Answers to the 30 required questions

| # | Question | Answer |
|---:|---|---|
| 1 | Does the game start correctly? | **PASS locally:** Login loads and no JS error appeared. |
| 2 | Does login/register/guest work? | **PARTIAL:** handlers and storage/Auth paths exist; live production end-to-end was not run. |
| 3 | Does character creation work? | **PARTIAL:** validation/save/render paths exist; disposable live creation not performed. |
| 4 | Does Main Menu work? | **PASS** in tested desktop/mobile local UI. |
| 5 | Does every lesson open? | **FAIL as a journey:** C-01 skips four lessons after first victory; map paths exist. |
| 6 | Does every battle stage start? | **PARTIAL:** all 13 configs/banks/assets exist; not all were live-started. |
| 7 | Does every question bank have valid questions? | **PASS structurally:** Act 1 1,300/1,300 and PvP 36/36. |
| 8 | Does every question have a valid correct answer? | **PASS under current evaluator.** |
| 9 | Does every MC question include its correct answer? | **PASS:** zero missing correct options. |
| 10 | Any `ตัวเลือกหลอก` placeholders? | **No** in active audited banks. |
| 11 | Do typing questions render input? | **Yes:** shared renderer creates labeled input and confirm/Enter handling. |
| 12 | Do arrangement questions render tiles? | **Yes:** configured tiles or accepted-answer fallback; malformed data shows recovery. |
| 13 | Does Focus render answer UI? | **Yes statically:** it uses the same renderer and has exhaustion recovery. |
| 14 | Can exhaustion soft-lock battle? | **No with current banks/logic:** wrapping and recovery exist; H-04 is a separate zero-bank fail-open. |
| 15 | Does damage scaling work? | **Yes statically:** four Grammaria tiers, minima, synergy, and separate PvP path observed. |
| 16 | Are charms connected to damage/AP/cooldown? | **Yes:** 74 charms, 68 registered effect types, no unsupported config found. |
| 17 | Are rewards one-time where intended? | **Yes statically:** completion and dedup guards exist. |
| 18 | Does Practice Mode avoid rewards? | **Yes statically:** reward/save guards and snapshot restore exist. |
| 19 | Does Teacher Dashboard read correctly? | **PARTIAL:** query/normalization/filter/table code exists; live read not run and authorization is unsafe. |
| 20 | Does PvP mock work? | **Yes** in local browser checks. |
| 21 | Does PvP online create/join work? | **NOT TESTED live:** implementation exists; production writes avoided. |
| 22 | Does PvP online combat work? | **No:** current UI deliberately hides combat; status is incomplete. |
| 23 | Does Lingua Advisor open safely? | **Yes** in tested Menu/mobile flow; no game-state mutation found. |
| 24 | Does Advisor stay mock-only? | **Yes.** |
| 25 | Are external API calls present? | Existing Firebase/CDN/media only; **no Advisor/OpenAI/fetch backend call** found. |
| 26 | Are secrets exposed? | **No private API/server secret found.** PIN digest is visible and not a security boundary. |
| 27 | Are assets missing? | **No explicit referenced asset is missing/case-mismatched.** |
| 28 | Are there mobile layout risks? | **Yes:** battle clipping and very tall PvP; Menu/Advisor fit in tested portrait. |
| 29 | Are there Firestore rule risks? | **Yes, HIGH:** global authenticated player reads and PvP room updates. |
| 30 | What should be fixed first? | **C-01, the Phase 1 progression skip**, then Firestore authorization. |

### Overall verdict

Lingua has substantial content and several well-defended runtime systems: exact Act 1 banks pass the current evaluator, replay/practice reward guards are present, the mock Advisor is isolated, PvP mock works, and explicit assets/DOM bindings resolve. It is **not ready for safe production classroom deployment** because one critical progression bug writes the wrong lesson, Firestore rules expose student records and PvP mutation broadly, online PvP combat remains incomplete, and the asset payload is extreme. The first repair should be the deterministic Act 1 progression path, followed immediately by server-enforced privacy/authorization.

No issue was fixed during this audit.
