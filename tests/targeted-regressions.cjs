const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
function declaration(name, kind = 'function') {
  const start = source.indexOf(`${kind} ${name}`);
  assert.ok(start >= 0, `Missing ${name}`);
  if (kind === 'function') return source.slice(source.slice(start - 6, start) === 'async ' ? start - 6 : start, source.indexOf('\n}', start) + 2);
  const tail = source.slice(start);
  const end = tail.match(/\n[}\]][^\n]*;/);
  assert.ok(end, `Missing end of ${name}`);
  return tail.slice(0, end.index + end[0].length);
}
const state = { grammaria: 0, enemyHp: 1000, enemyMaxHp: 1000, playerHp: 100, vsBossPractice: { active: false } };
const context = vm.createContext({
  state, playerData: null,
  console: { log() {}, debug() {}, warn() {} },
  Math: Object.assign(Object.create(Math), { random: () => 0.99 }),
  clamp: (n, min, max) => Math.min(max, Math.max(min, n)),
  assetPath: p => p,
  shuffleArray: a => [...a], sample: a => [a[0]],
  charmRankMeta: Object.fromEntries(['C', 'B', 'A', 'S', 'SS'].map(k => [k, { icon: '' }])),
  isFinalBossStage: stage => stage?.id === 'final-boss',
  addBattleMessageLine: (lines, text) => lines.push(text),
  recordPlayerDamage() {}, recordBossDamage() {},
  createTimestampIso: () => '2026-09-04T00:00:00Z',
  isPastQuestionContext: () => true, isMemoryEnemy: () => true,
  isTargetStunned: () => false, getPlayerHpPercent: () => 1,
  BASE_CRITICAL_CHANCE: 0, CRITICAL_DAMAGE_MULTIPLIER: 1.5,
  PLAYER_DAMAGE_TO_BOSS_MULTIPLIER: 0.9
});
const registry = declaration('VS_BOSS_REGISTRY', 'const');
for (const name of new Set(registry.match(/\b[A-Z_]+_PATH\b/g))) context[name] = name;
vm.runInContext(registry, context);
for (const name of ['VS_BOSS_OVERALL_RANK_TITLES', 'VS_BOSS_HISTORY_LIMIT', 'PVE_GRAMMARIA_ATTACK_RANKS', 'BATTLE_FLOW_V2_CONFIG', 'CHARM_EFFECT_HANDLERS', 'STATUS_BALANCE_CONFIG', 'STORY_NORMAL_ATTACK', 'PLAYER_SKILLS_V2']) {
  vm.runInContext(declaration(name, 'const'), context);
}
vm.runInContext(declaration('makeCharm'), context);
vm.runInContext(declaration('actAttackCharms', 'const'), context);
// Functions are loaded from production source; only I/O and nondeterminism are stubbed.
for (const name of [
  'makeCharm', 'getVsBossRegistryList', 'getVsBossBestAttemptForBoss', 'getVsBossBossScorePercent',
  'getVsBossOverallRank', 'calculateVsBossOverallRank',
  'getVsBossQualityLevel', 'getVsBossQualityClass', 'clampVsBossPercent', 'getVsBossBestAssessmentPercent', 'getVsBossQualityPresentation',
  'formatVsBossAttemptDateTime', 'getVsBossAttemptKnowledgePercent', 'getVsBossAttemptIso', 'getVsBossAttemptId',
  'normalizeVsBossAttempt', 'calculateVsBossAttemptTrend', 'isBetterVsBossAttempt', 'getVsBossRecord', 'getLegacyVsBossScore',
  'normalizeVsBossRecord', 'migrateLegacyBossPracticeScoreIfNeeded', 'ensureVsBossRecord', 'createVsBossAttemptRecord',
  'saveVsBossAttemptHistory', 'mergeVsBossScoreEntries', 'normalizeVsBossScores', 'mergeVsBossScoreSources', 'createVsBossScoreEntry',
  'createDialogueNode', 'createSegmentNode', 'createLessonQuizChoiceOrder', 'guidedPracticeNode', 'createBattleIntroStep',
  'buildCvcLessonTeachingFlow', 'validateCvcLessonTeachingFlow',
  'isVsBossPracticeActive', 'isVsBossesBattleContext', 'areCharmsAllowedInCurrentBattle', 'normalizeCharmEffect', 'getActivePveCharmDamageModifier',
  'getGrammariaCharmSynergyMultiplier', 'getPlayerAccumulatedGrammaria', 'getGrammariaAttackRank', 'calculateFinalPvePlayerDamage',
  'ensureBattleCharmEffectState', 'resetBattleActiveEffects', 'createBattleStatusBucket', 'resetBattleStatuses', 'ensureBattleStatuses', 'getBattleStatus',
  'isTrueBossStage', 'applyIncomingDamageModifiers', 'applyStatusDamageToTarget', 'applyCharmSetupEffect', 'rollCritical',
  'calculateCharmDamage', 'calculateBattleDamageBreakdown', 'calculateBattleFlowV2Damage', 'validateBattleSkillDamageDifferences'
]) vm.runInContext(declaration(name), context);
vm.runInContext('const VS_BOSS_REGISTRY_BY_ID = new Map(VS_BOSS_REGISTRY.map(b => [b.id, b]));', context);
vm.runInContext(declaration('getVsBossConfig'), context);
// actAttackCharms initialization requires the hoisted factory.

function run(code) { return vm.runInContext(code, context); }
const ids = run('VS_BOSS_REGISTRY.map(b => b.id)');
assert.equal(ids.length, 11);
assert.equal(run('calculateVsBossOverallRank({}).overallScorePercent'), 0);
assert.equal(run('calculateVsBossOverallRank({}).rank'), 'D');
const skillDamageValidation = run('validateBattleSkillDamageDifferences()');
assert.equal(skillDamageValidation.ok, true, JSON.stringify(skillDamageValidation));
assert.deepEqual(
  {...skillDamageValidation.sample},
  {normal:20, coreSpark:24, syntaxBlade:31, grammariaSurge:42}
);
assert.equal(skillDamageValidation.vsBosses.charmMultiplier, 1);
assert.ok(skillDamageValidation.story.withCharm > skillDamageValidation.story.withoutCharm);
context.one = { [ids[0]]: { bestAttempt: { scorePercent: 100 } } };
assert.equal(run('calculateVsBossOverallRank(one).overallScorePercent'), 9);
for (const [score, rank] of [[0,'D'], [39,'D'], [40,'C'], [59,'C'], [60,'B'], [74,'B'], [75,'A'], [89,'A'], [90,'S'], [100,'S']]) {
  context.records = Object.fromEntries(ids.map(id => [id, { bestAttempt: { scorePercent: score }, latestAttempt: { scorePercent: 0 } }]));
  assert.equal(run('calculateVsBossOverallRank(records).rank'), rank);
}
for (const [bestAttempt, expected] of [
  [{ scorePercent: 80, score: 10, accuracy: 20 }, 80],
  [{ score: 50, accuracy: 20 }, 50], [{ accuracy: 70 }, 70], [{ correct: 3, total: 4 }, 75],
  [{ scorePercent: 999 }, 100], [{ scorePercent: -10 }, 0], [{ scorePercent: null, correct: 3, total: 4 }, 75]
]) {
  context.entry = { bestAttempt };
  assert.equal(run('getVsBossBossScorePercent({id:"test", maxScore:100}, entry)'), expected);
}
context.old = { bestScore: 200, bestAttempt: { score: 200, scorePercent: 92 }, attempts: 1 };
context.lower = { score: 90, correctAnswers: 3, totalQuestions: 10 };
assert.equal(run('createVsBossScoreEntry(old, lower, 2).bestAttempt.scorePercent'), 92);
context.older = { [ids[0]]: context.old };
context.newer = { [ids[0]]: { bestScore: 250, bestAccuracy: 96, attempts: 2 } };
assert.equal(run('mergeVsBossScoreSources(newer, older)')[ids[0]].bestScore, 250);
assert.equal(run('calculateVsBossOverallRank(null).rank'), 'D');
assert.equal(run('calculateVsBossOverallRank({[VS_BOSS_REGISTRY[0].id]: {attempts: 1, bestScore: 0}}).completedBosses'), 1);

for (const [percent, quality] of [[95,'ดีเยี่ยม'], [90,'ดีเยี่ยม'], [85,'ดี'], [80,'ดี'], [70,'พอใช้'], [60,'พอใช้'], [55,'ปรับปรุง']]) {
  context.percent = percent;
  assert.equal(run('getVsBossQualityLevel(percent)'), quality);
}
assert.equal(run('getVsBossQualityLevel(null)'), 'ยังไม่มีผลประเมิน');
context.qualityPlayer = {vsBossAssessmentRecords:{rewind_slime:{bestAttempt:{knowledgeScorePercent:95}},echo_tick:{bestAttempt:{knowledgeScorePercent:70}}}};
assert.equal(run('getVsBossBestAssessmentPercent(qualityPlayer,"rewind_slime")'), 95);
assert.equal(run('getVsBossBestAssessmentPercent(qualityPlayer,"echo_tick")'), 70);
context.qualityPlayer = {bossPracticeScores:{rewind_slime:{bestAccuracy:85}}};
assert.equal(run('getVsBossBestAssessmentPercent(qualityPlayer,"rewind_slime")'), 85);
context.qualityPlayer = {bossPracticeScores:{rewind_slime:{bestCorrect:9,bestTotal:12}}};
assert.equal(run('getVsBossBestAssessmentPercent(qualityPlayer,"rewind_slime")'), 75);
context.qualityPlayer = {bossPracticeScores:{rewind_slime:{bestScore:210,maxGameScore:300}}};
assert.equal(run('getVsBossBestAssessmentPercent(qualityPlayer,"rewind_slime")'), 70);
assert.equal(run('getVsBossBestAssessmentPercent({},"memory_bat")'), null);
assert.equal(run('formatVsBossAttemptDateTime("not-a-date")'), 'ไม่ทราบวันที่');
context.historyPlayer = {vsBossAssessmentRecords:{},bossPracticeScores:{}};
function saveHistory(bossId, correct, minute, score = correct * 20) {
  context.historyBoss = run(`getVsBossConfig("${bossId}")`);
  context.historyResult = {
    correctAnswers:correct, wrongAnswers:10-correct, totalQuestions:10, score, maxGameScore:300,
    bossDefeated:correct >= 5, startedAt:`2026-09-06T02:${String(minute).padStart(2,'0')}:00.000Z`,
    endedAt:`2026-09-06T02:${String(minute).padStart(2,'0')}:30.000Z`
  };
  return run('saveVsBossAttemptHistory(historyPlayer, historyBoss, historyResult)');
}
const firstHistory = saveHistory('rewind_slime', 6, 1);
const higherHistory = saveHistory('rewind_slime', 8, 2);
const lowerHistory = saveHistory('rewind_slime', 7, 3);
const sameHistory = saveHistory('rewind_slime', 7, 4);
assert.equal(firstHistory.attempt.trendFromPrevious, 'first-attempt');
assert.equal(higherHistory.attempt.trendFromPrevious, 'up');
assert.equal(higherHistory.attempt.improvementFromPrevious, 20);
assert.equal(lowerHistory.attempt.trendFromPrevious, 'down');
assert.equal(sameHistory.attempt.trendFromPrevious, 'same');
assert.equal(sameHistory.record.firstAttempt.attemptId, firstHistory.attempt.attemptId);
assert.equal(sameHistory.record.latestAttempt.attemptId, sameHistory.attempt.attemptId);
assert.equal(sameHistory.record.bestAttempt.attemptId, higherHistory.attempt.attemptId);
const duplicateHistory = saveHistory('rewind_slime', 7, 4);
assert.equal(duplicateHistory.wasDuplicate, true);
assert.equal(duplicateHistory.record.attempts, 4);
saveHistory('echo_tick', 9, 5);
assert.equal(context.historyPlayer.vsBossAssessmentRecords.echo_tick.history.length, 1);
assert.ok(context.historyPlayer.vsBossAssessmentRecords.rewind_slime.history.every(attempt => attempt.bossId === 'rewind_slime'));
assert.ok(context.historyPlayer.vsBossAssessmentRecords.echo_tick.history.every(attempt => attempt.bossId === 'echo_tick'));
context.persistedHistory = JSON.parse(JSON.stringify(context.historyPlayer.vsBossAssessmentRecords));
const reloadedHistory = run('normalizeVsBossScores(persistedHistory)');
assert.equal(reloadedHistory.rewind_slime.history.length, 4);
assert.equal(reloadedHistory.echo_tick.history.length, 1);
assert.equal(reloadedHistory.rewind_slime.latestAttempt.attemptId, sameHistory.attempt.attemptId);
context.legacyPlayer = {progress:{bossPracticeScores:{echo_tick:{bestScore:145,bestAccuracy:75,attempts:3,lastPlayedAt:'2026-09-01T00:00:00Z'}}}};
const migratedLegacy = run('migrateLegacyBossPracticeScoreIfNeeded(legacyPlayer,"echo_tick")');
assert.equal(migratedLegacy.history.length, 0);
assert.equal(migratedLegacy.attempts, 3);
assert.equal(migratedLegacy.hasLegacySummary, true);
context.limitPlayer = {vsBossAssessmentRecords:{}};
context.historyBoss = run('getVsBossConfig("echo_tick")');
for (let index = 0; index < 55; index++) {
  context.historyResult = {
    correctAnswers:index === 0 ? 10 : 5, wrongAnswers:index === 0 ? 0 : 5, totalQuestions:10,
    score:index, bossDefeated:true, endedAt:new Date(Date.UTC(2026,8,7,0,index,0)).toISOString()
  };
  run('saveVsBossAttemptHistory(limitPlayer,historyBoss,historyResult)');
}
const limitedHistory = context.limitPlayer.vsBossAssessmentRecords.echo_tick;
assert.equal(limitedHistory.history.length, 50);
assert.equal(limitedHistory.attempts, 55);
assert.equal(limitedHistory.firstAttempt.attemptNumber, 1);
assert.equal(limitedHistory.bestAttempt.knowledgeScorePercent, 100);

const cvc = run('validateCvcLessonTeachingFlow()');
assert.equal(cvc.ok, true, JSON.stringify(cvc));
assert.equal(cvc.guidedPracticeCount, 9);
const steps = run('buildCvcLessonTeachingFlow({id:"regular-rule-4", enemy:"Rewind Slime"})');
assert.equal(steps.at(-1).nextButtonText, 'เริ่มต่อสู้กับ Rewind Slime');
for (let i = 0; i < steps.length; i++) {
  if (steps[i].cvcTeachingCheck) assert.equal(steps[i + 1].cvcTeachingFeedback, true);
}
assert.ok(JSON.stringify(steps).includes('t-o-p'));
assert.ok(JSON.stringify(steps).includes('l-a-n'));
vm.runInContext(declaration('regularRuleFourQuestions', 'const'), context);
const bank = run('regularRuleFourQuestions');
assert.equal(bank.length, 100);
assert.equal(new Set(bank.map(q => q.id)).size, 100);
for (const question of bank) {
  assert.ok(question.answer && question.explanation, question.id);
  if (question.options?.length) assert.ok(question.options.includes(question.answer), question.id);
}
context.PAST_FRAGMENT_ACT = {stages:[{id:'regular-rule-4',questions:bank}]};
context.filterQuestionsForStage = questions => questions;
vm.runInContext(declaration('REWIND_SLIME_REQUIRED_CVC_VERBS','const'),context);
vm.runInContext(declaration('cloneVsBossQuestion'),context);
vm.runInContext(declaration('getVsBossQuestionPool'),context);
vm.runInContext(declaration('normalizeBattleAnswer'),context);
vm.runInContext(declaration('normalizeActFreeAnswer'),context);
vm.runInContext(declaration('validateRewindSlimeVsBossAndCvcBank'),context);
const rewindValidation = run('validateRewindSlimeVsBossAndCvcBank()');
assert.equal(rewindValidation.ok,true,JSON.stringify(rewindValidation));
assert.deepEqual([...rewindValidation.rewindSlime.relatedStageIds],['regular-rule-4']);
assert.equal(rewindValidation.rewindSlime.questionCount,100);
assert.equal(rewindValidation.targetVerbs.found,20);
assert.deepEqual([...rewindValidation.targetVerbs.missing],[]);
assert.ok(ids.indexOf('rewind_slime') < ids.indexOf('ed_forger'));
assert.ok(!run('getVsBossConfig("echo_tick").relatedStageIds.includes("regular-rule-4")'));

function hit(charmId, { base = 1, rank = 0, vs = false, finalBoss = false, shield = false, charge = 0, correct = true, skillId = "" } = {}) {
  state.grammaria = rank;
  state.vsBossPractice.active = vs;
  state.enemyHp = state.enemyMaxHp = 1000;
  state.actBattle = { stage: { id: finalBoss ? 'final-boss' : 'regular-rule-4', type: 'boss' }, turnNumber: 1, correctStreak: 3 };
  run('resetBattleActiveEffects(); resetBattleStatuses();');
  if (shield) state.actBattle.statuses.boss.hitShieldStacks = 1;
  context.charmId = charmId;
  context.base = base; context.charge = charge; context.correct = correct; context.skillId = skillId;
  const result = run(`(() => {
    const charm = actAttackCharms.find(c => c.id === charmId) || null;
    const skill = PLAYER_SKILLS_V2.find(candidate => candidate.id === skillId) || {id: "normalAttack", damageMultiplier: 1};
    const calculated = calculateBattleFlowV2Damage({ baseDamage: base, answerResult: {isCorrect: correct}, skill, charm, chargePercent: charge });
    const applied = applyStatusDamageToTarget('boss', calculated.finalDamage, 'test', {
      pvePlayerAttack: true, isSuccessfulAttack: correct, charm,
      skillDamageMultiplier: calculated.skillMultiplier, skillBonusMultiplier: calculated.skillBonusMultiplier,
      charmDamageMultiplier: calculated.charmDamageMultiplier, chargeDamageMultiplier: calculated.chargeMultiplier,
      bypassShield: calculated.bypassBossShield
    });
    return {damage: applied.finalDamage, multiplier: calculated.charmDamageMultiplier, hp: state.enemyHp};
  })()`);
  assert.equal(result.hp, 1000 - result.damage);
  assert.ok(Number.isFinite(result.damage));
  return result;
}
function validateStoryCharmDamagePipeline() {
  const without = hit(null);
  const withCharm = hit('b_attack_rune');
  assert.ok(withCharm.damage > without.damage);
  assert.equal(withCharm.multiplier, 1.25);
  for (const rank of [0, 150, 300, 500]) {
    for (const finalBoss of [false, true]) {
      const baseline = hit(null, {rank, finalBoss});
      for (const id of ['c_minor_power', 'b_attack_rune', 'c_past_compass', 'b_past_flame', 'c_light_echo', 'a_echo_strike', 'b_opening_rune', 'a_memory_pierce', 'a_stack_circle', 'a_combo_echo', 'a_grammar_break', 's_perfect_scholar', 'ss_past_fragment', 'ss_v2_judgement', 'ss_full_memory']) {
        assert.ok(hit(id, {rank, finalBoss}).damage > baseline.damage, `${id} rank=${rank}`);
      }
    }
  }
  assert.equal(hit('b_attack_rune', {base: 20}).damage, 23); // 20 * 1.25 * 0.9, not twice.
  assert.equal(hit('b_attack_rune', {base: 20, charge: 100}).damage, 45);
  assert.equal(hit('b_attack_rune', {shield: true}).damage, 0);
  assert.equal(hit('b_attack_rune', {correct: false}).damage, 0);
  for (const rank of [0, 150, 300, 500]) {
    const vs = hit('b_attack_rune', {vs: true, rank});
    assert.equal(vs.multiplier, 1);
    assert.equal(vs.damage, hit(null, {vs: true, rank}).damage);
  }
  return {ok: true, damageWithoutCharm: without.damage, damageWithCharm: withCharm.damage, charmMultiplier: withCharm.multiplier, failures: []};
}
for (const vs of [false, true]) {
  const appliedSkillDamage = [
    hit(null, {base:1, vs}).damage,
    hit(null, {base:1, vs, skillId:'coreSpark'}).damage,
    hit(null, {base:1, vs, skillId:'syntaxBlade'}).damage,
    hit(null, {base:1, vs, skillId:'grammariaSurge'}).damage
  ];
  assert.ok(
    appliedSkillDamage.every((damage, index) => index === 0 || damage > appliedSkillDamage[index - 1]),
    `${vs ? 'VS Bosses' : 'Story'} applied damage order: ${appliedSkillDamage.join(' < ')}`
  );
}
console.log(JSON.stringify({
  rank: `passed, ${ids.length} registered bosses`,
  rewindSlime: rewindValidation,
  cvc,
  charm: validateStoryCharmDamagePipeline()
}, null, 2));

async function testAttackResolution() {
  let animationFinish;
  let apSpent = 0;
  let displayedDamage = null;
  context.els = { battleMessage: {}, continueBattleButton: { classList: { add() {} } } };
  for (const name of ['applyEmptyCoreCupAfterSkillSpend', 'triggerMotion', 'appendDamageModifierLines', 'addStunGauge', 'tryStunBoss', 'recordGrammariaChargeUse', 'recordChargeBonusDamage', 'triggerEnemyHitFeedback', 'clearFocusBuffAfterAttack', 'cleanupGrammariaCharge', 'syncBattleStateToPlayerData', 'showOnlyBattlePanel', 'battleFlowV2Log', 'completePlayerSkillCooldownTurn', 'startActBossWarning']) context[name] = () => {};
  context.clearPostCorrectActionState = battle => {
    if (battle) battle.pendingPostCorrectAction = null;
  };
  Object.assign(context, {
    spendBattlePlayerAp: cost => { apSpent += cost; return true; },
    applySkillCooldownAfterUse: () => [],
    playBattleSkillEffect: () => new Promise(resolve => { animationFinish = resolve; }),
    isActBattleEnded: () => false,
    consumeBattleAttackBoost: damage => ({damage, applied:false, multiplier:1}),
    getSkillStunBuild: () => 0,
    applyCharmPostAttackEffect: () => ({extraTurn:false}),
    chooseActBossAction: () => ({}), setTimeout: () => 0,
    updateBattleStats: () => { displayedDamage = 1000 - state.enemyHp; }
  });
  for (const name of ['getBattleFlowV2BaseDamage', 'applyBattleFlowV2SkillEffects', 'showBattleFlowV2AttackFeedback', 'resetBattleFlowV2Selection', 'resolveBattleFlowV2PlayerAttack']) vm.runInContext(declaration(name), context);
  hit(null);
  state.enemyHp = 1000;
  Object.assign(state.actBattle, {
    selectedCharmId: 'b_attack_rune', selectedSkillId: 'coreSpark',
    pendingPlayerAnswer: {isCorrect:true}, pendingPlayerAttack: {baseDamage:1, grammariaGain:0}
  });
  context.attack = {skill:run('PLAYER_SKILLS_V2.find(skill=>skill.id==="coreSpark")'), charm:run('actAttackCharms.find(c=>c.id==="b_attack_rune")'),chargePercent:0};
  const first = run('resolveBattleFlowV2PlayerAttack(attack)');
  const duplicate = run('resolveBattleFlowV2PlayerAttack(attack)');
  assert.equal(state.actBattle.selectedCharmId, 'b_attack_rune');
  assert.equal(state.enemyHp, 1000);
  animationFinish();
  await Promise.all([first, duplicate]);
  assert.equal(apSpent, 1);
  assert.equal(state.enemyHp, 991);
  assert.equal(displayedDamage, 9);
  assert.equal(state.actBattle.selectedCharmId, '');
  assert.match(context.els.battleMessage.textContent, /ชามเพิ่มพลังทำงาน! x1.25/);
  state.actBattle.pendingPlayerAnswer = {isCorrect:false};
  await run('resolveBattleFlowV2PlayerAttack(attack)');
  assert.equal(apSpent, 1);
  assert.equal(state.enemyHp, 991);
  console.log('Actual attack resolver: persistence, double-click, exact HP, feedback and wrong-answer guard passed.');

  // Reproduce a fresh direct attack with no AP and every skill on cooldown.
  const element = () => ({
    children: [], classList: {add() {}, remove() {}, toggle() {}, contains: () => false},
    appendChild(child) { this.children.push(child); }, querySelectorAll: () => [],
    append(...children) { this.children.push(...children); },
    addEventListener(name, fn) { this[name] = fn; }, click() { this.click?.(); },
    setAttribute() {}, focus() {}
  });
  context.document = {createElement: element};
  Object.assign(context.els, {
    answerOptions:element(), actionMenu:element(), attackButton:element(), itemButton:element(), focusButton:element(),
    postCorrectActionPanel:element(), postCorrectActionText:element(), normalAttackChoiceButton:element(), skillCharmChoiceButton:element(),
    battleSkillPanel:element(), battleSkillOptions:element(), charmPanel:element(), charmOptions:element()
  });
  let victories = 0;
  let skillPanels = 0;
  Object.assign(context, {
    getActBattle: () => state.actBattle, getActAP: () => state.actBattle.playerAp,
    setButtonEnabled: (button, enabled) => {button.disabled = !enabled;},
    hasAvailableBattleQuestion: () => true,
    showActBattleQuestion: () => {state.actBattle.answerResolving = false;},
    escapeHtml: s => s, getActQuestionPrimaryAnswer: q => q.answer,
    isActQuestionAnswerCorrect: (q, answer) => answer === q.answer,
    markQuestionResult() {}, getBattleQuestionRepeatHistory: () => ({}),
    showBattleCorrectAnswerFeedback() {}, setBattleTurnOwner() {}, recordCorrectAnswerForGrammaria() {},
    consumeBattleEffectValue: () => 0, useBattleEffect: () => false,
    recordWrongAnswerForGrammaria() {}, playAttackSfx() {}, resolvePlayerDefeat: () => false,
    applyLowHpComebackCharmEffect() {},
    hasUsableBattleSkill: () => state.actBattle.playerAp > 0,
    resetBattleContinueControls() {},
    getActBattleQuestionType: question => question?.type || 'multiple-choice',
    getUnavailableSkillGuidanceMessage: () => 'skill unavailable',
    getBattlePlayerAp: () => state.actBattle.playerAp,
    spendBattlePlayerAp: cost => {
      if (cost > state.actBattle.playerAp) return false;
      state.actBattle.playerAp -= cost;
      return true;
    },
    renderBattleSkillSelectionPanel: () => {skillPanels++;},
    handleActEnemyDefeated: () => {victories++;},
    NO_BATTLE_CHARM: {id:'', name:'disabled'}, BATTLE_CORRECT_SUCCESS_MESSAGE: 'Correct'
  });
  for (const name of [
    'isPostCorrectNormalAttackAvailable','startActAttackAction','updateActActionMenuState','buildBattleFlowV2AnswerState',
    'clearPostCorrectActionState','clearVsBossCharmState','showPostCorrectActionChoice','consumePostCorrectAction',
    'choosePostCorrectNormalAttack','choosePostCorrectSkillPath','continueBattleCorrectAnswerFeedback','chooseActAnswer','handleBattleFlowV2AnswerResolved'
  ]) vm.runInContext(declaration(name), context);
  for (const stageId of ['what-is-past','act1_phase1_unit3_was_were','regular-rule-1','irregular-lesson','irregular-mini-boss','final-boss']) {
    for (const type of ['multiple-choice','typing','word-arrangement']) {
      hit(null, {finalBoss:stageId === 'final-boss'});
      Object.assign(state.actBattle, {
        stage:{id:stageId, type:'boss'}, playerAp:0, correctAnswers:0, damagePerCorrect:1,
        skillCooldowns:{coreSpark:9,syntaxBlade:9,grammariaSurge:9},
        currentQuestion:{id:type, type, answer:'was'},
        pendingActionType:'focus', pendingPlayerAnswer:{isCorrect:false}, pendingPlayerAttack:{baseDamage:999}
      });
      state.enemyHp = 6;
      context.els.answerOptions.children = [];
      run('updateActActionMenuState(); startActAttackAction();');
      assert.equal(context.els.attackButton.disabled, false);
      assert.equal(state.actBattle.pendingActionType, 'attack');
      assert.equal(state.actBattle.pendingPlayerAttack, null);
      run('chooseActAnswer("was")');
      assert.equal(state.actBattle.pendingPlayerAnswer.isCorrect, true);
      assert.equal(state.actBattle.playerActionPhase, 'correctAnswerFeedback');
      assert.equal(context.els.normalAttackChoiceButton.textContent, 'โจมตีปกติ');
      assert.equal(context.els.skillCharmChoiceButton.textContent, 'เลือกสกิลและชาม');
      assert.equal(context.els.skillCharmChoiceButton.disabled, true);
      const firstNormal = run('choosePostCorrectNormalAttack()');
      assert.equal(run('choosePostCorrectNormalAttack()'), false); // Rapid second confirmation is ignored.
      animationFinish();
      await firstNormal;
      assert.equal(state.enemyHp, 0, `${stageId}/${type}`);
      assert.equal(state.actBattle.playerAp, 0);
      assert.equal(state.actBattle.pendingPostCorrectAction, null);
      assert.match(context.els.battleMessage.textContent, /สร้างความเสียหาย 6/);
      assert.equal(state.actBattle.skillCooldowns.coreSpark, 9);
    }
  }
  assert.equal(victories, 18);
  assert.equal(skillPanels, 0);
  // Wrong answers and optional skills retain their original routes.
  hit(null);
  state.enemyHp = 1000;
  Object.assign(state.actBattle,{playerAp:0,currentQuestion:{answer:'was'},correctAnswers:0,damagePerCorrect:1});
  run('startActAttackAction(); chooseActAnswer("were")');
  assert.equal(state.enemyHp, 1000);
  assert.equal(state.actBattle.playerActionPhase, 'enemyTurn');
  assert.equal(state.actBattle.pendingPostCorrectAction, null);
  state.actBattle.playerAp = 2;
  run('startActAttackAction(); chooseActAnswer("was")');
  assert.equal(context.els.skillCharmChoiceButton.disabled, false);
  run('choosePostCorrectSkillPath()');
  assert.equal(skillPanels, 1);
  assert.equal(state.actBattle.pendingActionType, 'skill');
  assert.equal(state.actBattle.pendingPlayerAnswer.isCorrect, true);

  // Exercise the production controls for all three supported answer adapters.
  for (const name of [
    'normalizeActFreeAnswer','getBattleAcceptedAnswers','getActQuestionAcceptedAnswers','getBattleQuestionType','getActBattleQuestionType','getBattleCorrectAnswer',
    'normalizeBattleAnswer','isInvalidBattleOption','normalizeBattleOptions','renderActTypingQuestion','renderActWordArrangementQuestion',
    'renderActBattleQuestionControls'
  ]) vm.runInContext(declaration(name), context);
  context.scenes = {battle:element()};
  context.els.questionPanel = element();
  let submitted = '';
  context.captureAnswer = answer => {submitted = answer;};
  context.els.answerOptions = element();
  context.mcQuestion = {id:'mc',type:'multiple-choice',answer:'was'};
  run('renderActBattleQuestionControls(mcQuestion,["were","was"],captureAnswer)');
  context.els.answerOptions.children.find(button => button.textContent === 'was').click();
  assert.equal(submitted,'was');
  context.els.answerOptions = element();
  context.typingQuestion = {id:'typing',type:'typing',answer:'was'};
  run('renderActBattleQuestionControls(typingQuestion,[],captureAnswer)');
  const typingPanel = context.els.answerOptions.children[0];
  typingPanel.children[0].value = 'was';
  typingPanel.children[0].input();
  typingPanel.children[1].click();
  assert.equal(submitted,'was');
  context.els.answerOptions = element();
  context.arrangeQuestion = {id:'arrange',type:'word-arrangement',answer:'They were happy',tiles:['They','were','happy']};
  run('renderActBattleQuestionControls(arrangeQuestion,[],captureAnswer)');
  const arrangePanel = context.els.answerOptions.children[0];
  arrangePanel.children[1].children.forEach(button => button.click());
  arrangePanel.children[2].children[1].click();
  assert.equal(submitted,'They were happy');

  state.vsBossPractice.active = true;
  state.actBattle.playerAp = 0;
  run('updateActActionMenuState()');
  assert.equal(context.els.attackButton.disabled, false); // Normal attack remains available without AP.
  state.actBattle.playerAp = 2;
  run('startActAttackAction(); chooseActAnswer("was")');
  assert.equal(context.els.skillCharmChoiceButton.textContent, 'เลือกสกิล');
  assert.equal(state.actBattle.selectedCharmId, '');
  assert.equal(context.els.charmOptions.children.length, 0);
  run('choosePostCorrectSkillPath()');
  assert.equal(skillPanels, 2);
  assert.equal(state.enemyHp, 1000);
  console.log('Direct Attack: zero AP, stale Focus state, cooldowns, 6 stages, MC/typing/arrangement controls, victory handoff, wrong answers, optional skills and VS isolation passed.');
}
testAttackResolution().catch(error => { console.error(error); process.exitCode = 1; });
