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
for (const name of ['VS_BOSS_OVERALL_RANK_TITLES', 'PVE_GRAMMARIA_ATTACK_RANKS', 'BATTLE_FLOW_V2_CONFIG', 'CHARM_EFFECT_HANDLERS', 'STATUS_BALANCE_CONFIG', 'STORY_NORMAL_ATTACK']) {
  vm.runInContext(declaration(name, 'const'), context);
}
vm.runInContext(declaration('makeCharm'), context);
vm.runInContext(declaration('actAttackCharms', 'const'), context);
// Functions are loaded from production source; only I/O and nondeterminism are stubbed.
for (const name of [
  'makeCharm', 'getVsBossRegistryList', 'getVsBossBestAttemptForBoss', 'getVsBossBossScorePercent',
  'getVsBossOverallRank', 'calculateVsBossOverallRank', 'normalizeVsBossScores', 'mergeVsBossScoreSources', 'createVsBossScoreEntry',
  'createDialogueNode', 'createSegmentNode', 'createLessonQuizChoiceOrder', 'guidedPracticeNode', 'createBattleIntroStep',
  'buildCvcLessonTeachingFlow', 'validateCvcLessonTeachingFlow',
  'isVsBossPracticeActive', 'isVsBossesBattleContext', 'areCharmsAllowedInCurrentBattle', 'normalizeCharmEffect', 'getActivePveCharmDamageModifier',
  'getGrammariaCharmSynergyMultiplier', 'getPlayerAccumulatedGrammaria', 'getGrammariaAttackRank', 'calculateFinalPvePlayerDamage',
  'ensureBattleCharmEffectState', 'resetBattleActiveEffects', 'createBattleStatusBucket', 'resetBattleStatuses', 'ensureBattleStatuses', 'getBattleStatus',
  'isTrueBossStage', 'applyIncomingDamageModifiers', 'applyStatusDamageToTarget', 'applyCharmSetupEffect', 'rollCritical',
  'calculateCharmDamage', 'calculateBattleFlowV2Damage'
]) vm.runInContext(declaration(name), context);
vm.runInContext('const VS_BOSS_REGISTRY_BY_ID = new Map(VS_BOSS_REGISTRY.map(b => [b.id, b]));', context);
vm.runInContext(declaration('getVsBossConfig'), context);
// actAttackCharms initialization requires the hoisted factory.

function run(code) { return vm.runInContext(code, context); }
const ids = run('VS_BOSS_REGISTRY.map(b => b.id)');
assert.equal(ids.length, 11);
assert.equal(run('calculateVsBossOverallRank({}).overallScorePercent'), 0);
assert.equal(run('calculateVsBossOverallRank({}).rank'), 'D');
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

function hit(charmId, { base = 1, rank = 0, vs = false, finalBoss = false, shield = false, charge = 0, correct = true } = {}) {
  state.grammaria = rank;
  state.vsBossPractice.active = vs;
  state.enemyHp = state.enemyMaxHp = 1000;
  state.actBattle = { stage: { id: finalBoss ? 'final-boss' : 'regular-rule-4', type: 'boss' }, turnNumber: 1, correctStreak: 3 };
  run('resetBattleActiveEffects(); resetBattleStatuses();');
  if (shield) state.actBattle.statuses.boss.hitShieldStacks = 1;
  context.charmId = charmId;
  context.base = base; context.charge = charge; context.correct = correct;
  const result = run(`(() => {
    const charm = actAttackCharms.find(c => c.id === charmId) || null;
    const calculated = calculateBattleFlowV2Damage({ baseDamage: base, answerResult: {isCorrect: correct}, skill: {damageMultiplier: 1}, charm, chargePercent: charge });
    const applied = applyStatusDamageToTarget('boss', calculated.finalDamage, 'test', {
      pvePlayerAttack: true, isSuccessfulAttack: correct, charm,
      charmDamageMultiplier: calculated.charmDamageMultiplier, bypassShield: calculated.bypassBossShield
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
  context.attack = {skill:{id:'coreSpark',thaiName:'Spark',apCost:1,damageMultiplier:1}, charm:run('actAttackCharms.find(c=>c.id==="b_attack_rune")'),chargePercent:0};
  const first = run('resolveBattleFlowV2PlayerAttack(attack)');
  const duplicate = run('resolveBattleFlowV2PlayerAttack(attack)');
  assert.equal(state.actBattle.selectedCharmId, 'b_attack_rune');
  assert.equal(state.enemyHp, 1000);
  animationFinish();
  await Promise.all([first, duplicate]);
  assert.equal(apSpent, 1);
  assert.equal(state.enemyHp, 992);
  assert.equal(displayedDamage, 8);
  assert.equal(state.actBattle.selectedCharmId, '');
  assert.match(context.els.battleMessage.textContent, /ชามเพิ่มพลังทำงาน! x1.25/);
  state.actBattle.pendingPlayerAnswer = {isCorrect:false};
  await run('resolveBattleFlowV2PlayerAttack(attack)');
  assert.equal(apSpent, 1);
  assert.equal(state.enemyHp, 992);
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
