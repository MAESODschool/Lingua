import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

// Lingua Prototype 1 uses small scene switches and one shared state object.
const scenes = {
  login: document.getElementById("loginScene"),
  mainMenu: document.getElementById("mainMenuScene"),
  createCharacter: document.getElementById("createCharacterScene"),
  title: document.getElementById("titleScene"),
  story: document.getElementById("storyScene"),
  battle: document.getElementById("battleScene"),
  victory: document.getElementById("victoryScene")
};

const mainStoryDialogue = [];
const DIALOGUE_SPEED = 52;
const TEACHER_DIALOGUE_SPEED = 62;
const DIALOGUE_PUNCTUATION_PAUSE = {
  ",": 150,
  "，": 150,
  ".": 280,
  "?": 320,
  "!": 320,
  "؟": 320,
  "…": 400,
  "。": 280,
  "؟": 320
};

const prologueDialogue = [
  {
    speaker: "ระบบบรรยาย",
    text: "\"นานมาแล้ว โลก Lingua เคยมีแกนกลางของภาษาเพียงหนึ่งเดียว Grammar Core คือพลังที่เชื่อมถ้อยคำ ความหมาย และเวลาเข้าด้วยกัน\""
  },
  {
    speaker: "ระบบบรรยาย",
    text: "\"แต่ในวันที่ถูกเรียกว่า The Great Error แกนกลางนั้นแตกออกเป็นเศษเสี้ยว ปัจจุบัน อดีต และอนาคตเริ่มแยกจากกัน\""
  },
  {
    speaker: "ระบบบรรยาย",
    text: "\"เมื่อชื่อของสิ่งต่าง ๆ เริ่มเลือนหาย โลกทั้งใบจึงค่อย ๆ สูญเสียความหมาย\""
  },
  {
    speaker: "ระบบบรรยาย",
    text: "\"ท่ามกลางแสงสุดท้ายของแกรมมาเรีย เด็กคนหนึ่งได้ลืมตาขึ้นในหอคอยแห่ง Unity\""
  }
];

const PROLOGUE_LINES = [
  "ในดินแดนหนึ่งที่ถ้อยคำไม่ใช่เพียงเสียงพูด แต่คือพลังที่หล่อเลี้ยงโลกทั้งใบ…",
  "ดินแดนนั้นมีชื่อว่า ‘Lingua’ โลกแห่งภาษา เวทมนตร์ และความหมายที่ซ่อนอยู่ในทุกประโยค",
  "ครั้งหนึ่ง Lingua เคยสงบงดงาม เหล่าผู้เรียนใช้คำศัพท์และไวยากรณ์สร้างแสงสว่างให้กับดินแดน",
  "แต่เมื่อกฎแห่งภาษาเริ่มบิดเบือน เศษเสี้ยวแห่งความผิดพลาดได้ตื่นขึ้น กลายเป็นมอนสเตอร์แห่งไวยากรณ์",
  "คำกริยาหลงทาง ประโยคแตกสลาย และพลังของกาลเวลาเริ่มปั่นป่วนไปทั่วอาณาจักร",
  "เจ้าคือผู้ถูกเรียกมายัง Lingua เพื่อเรียนรู้พลังของภาษา และฟื้นฟูความหมายที่สูญหาย",
  "ทุกบทเรียนคือเวทมนตร์ ทุกคำตอบคือการต่อสู้ และทุกชัยชนะจะพา Lingua กลับคืนสู่สมดุล",
  "จงตั้งใจฟัง เรียนรู้ และใช้พลังแห่งถ้อยคำให้ถูกต้อง…",
  "การเดินทางของเจ้าใน Lingua กำลังจะเริ่มต้นขึ้น"
];

const namingDialogue = [
  {
    speaker: "มาสเตอร์เวรีออน",
    text: "\"เจ้าตื่นขึ้นท่ามกลางเศษถ้อยคำที่แตกสลาย... แต่ก่อนที่เจ้าจะก้าวไปข้างหน้า เจ้าต้องมีชื่อเสียก่อน\""
  },
  {
    speaker: "มาสเตอร์เวรีออน",
    text: "\"บอกข้ามาเถิด ผู้พเนจร เจ้าจะให้โลก Lingua เรียกเจ้าว่าอะไร?\"",
    requiresName: true
  }
];

const interactiveStoryDialogue = [
  {
    speaker: "มาสเตอร์เวรีออน",
    text: "\"ลองดู 3 ประโยคนี้ ผู้พเนจร เธอคิดว่าประโยคใดพูดถึงอดีต?\"",
    choices: [
      {
        text: "ฉันกินข้าววันนี้",
        response: "\"ยังไม่ใช่ วันนี้คือปัจจุบัน ลองสังเกตคำบอกเวลาอีกครั้ง คำว่า 'เมื่อวาน' คือเวลาที่ผ่านไปแล้ว\""
      },
      {
        text: "ฉันกินข้าวเมื่อวาน",
        response: "\"ถูกต้อง คำว่า 'เมื่อวาน' บอกว่าเหตุการณ์นั้นเกิดขึ้นแล้ว นี่แหละคืออดีต\""
      },
      {
        text: "ฉันจะกินข้าวพรุ่งนี้",
        response: "\"ยังไม่ใช่ พรุ่งนี้คืออนาคต เพราะเป็นสิ่งที่ยังไม่เกิดขึ้น อดีตต้องเป็นเหตุการณ์ที่ผ่านไปแล้ว\""
      }
    ]
  },
  {
    speaker: "มาสเตอร์เวรีออน",
    text: "\"ภาษาไทยกับภาษาอังกฤษต่างกันอย่างไรเมื่อพูดถึงเวลา?\"",
    choices: [
      {
        text: "ภาษาไทยกริยาไม่ค่อยเปลี่ยน แต่ภาษาอังกฤษเปลี่ยนรูปกริยา",
        response: "\"ดีมาก ภาษาอังกฤษใช้รูปกริยาเพื่อบอกเวลา เราจึงต้องรู้จัก V2 เมื่อต้องเล่าเรื่องในอดีต\""
      },
      {
        text: "ภาษาอังกฤษไม่มีอดีต",
        response: "\"ยังไม่ถูก ภาษาอังกฤษมีอดีต และมักแสดงผ่านรูปกริยา เช่น go เปลี่ยนเป็น went\""
      },
      {
        text: "ภาษาไทยต้องเติม -ed เสมอ",
        response: "\"ยังไม่ใช่ -ed เป็นกฎของ Regular Verbs ในภาษาอังกฤษ ไม่ใช่กฎของภาษาไทย\""
      }
    ]
  }
];


const BOSS_ACTIONS = [
  { type: "normal", label: "โจมตีปกติ", damage: 12, hitCount: 1, warning: "บอสกำลังโจมตี!", zoneWidth: 34, minZoneWidth: 18, speed: 920, zoneSpeed: 2200, shrinkPerSecond: 4, parryDuration: 3800 },
  { type: "skill", label: "สกิลแรง", damage: 22, hitCount: 2, markChance: 0.18, markDamageBonus: 0.2, markHits: 1, warning: "บอสกำลังใช้สกิลแรง!", zoneWidth: 28, minZoneWidth: 13, speed: 780, zoneSpeed: 1700, shrinkPerSecond: 5.5, parryDuration: 3400 },
  { type: "ultimate", label: "อัลติ", damage: 35, hitCount: 3, markChance: 0.28, markDamageBonus: 0.25, markHits: 2, warning: "บอสกำลังใช้อัลติ! เตรียมปัดป้อง!", zoneWidth: 24, minZoneWidth: 8, speed: 650, zoneSpeed: 1250, shrinkPerSecond: 7, parryDuration: 3100 }
];

const ENEMY_ACTION_WEIGHTS = {
  question: 0.35,
  normalAttack: 0.25,
  typing: 0.20,
  arrangement: 0.20
};

const BOSS_ACTION_BASE_WEIGHTS = {
  typing: 0.35,
  arrangement: 0.35,
  question: 0.20,
  normalAttack: 0.10
};

const BOSS_ACTION_FAIRNESS_CONFIG = {
  maxConsecutiveChallengeModes: 2,
  pityEligibleTurns: 3,
  pityBoost: 0.10,
  historyLimit: 8
};

const PLAYER_DAMAGE_TO_BOSS_MULTIPLIER = 0.90;

const BOSS_GRAMMAR_CHALLENGE_CONFIG = {
  enabled: true,
  maxSpecialConsecutive: 2,
  recentWordLimit: 8,
  counterDamageRatio: 0.6,
  counterDamageMin: 8,
  counterDamageMax: 18
};

let BOSS_V2_CHALLENGE_WORDS = [];

const DEFAULT_POINT_PARRY_CONFIG = {
  enabled: true,
  counterDamage: 4,
  preventDamage: true,
  chance: 0.25,
  ultimateChanceBonus: 0.1,
  targetCount: 1,
  duration: 2800,
  size: 72,
  messageTemplate: "Perfect Parry - รับดาเมจ 0 และสวนกลับ {damage}"
};

const PARRY_BALANCE_CONFIG = {
  pointParry: {
    enabled: true,
    durationMs: 1100,
    targetScale: 1,
    startScale: 2.4,
    perfectWindow: 0.08,
    goodWindow: 0.16,
    preventDamageOnPerfect: true,
    preventDamageOnGood: true,
    counterDamagePerfect: 4,
    counterDamageGood: 2,
    counterDamageMiss: 0
  },
  parryBar: {
    counterDamagePerfect: 4,
    counterDamageGood: 2,
    counterDamageMiss: 0
  }
};
const PARRY_BAR_ARM_DELAY_MS = 120;

const BOSS_HEAVY_ATTACK_CONFIG = {
  enabled: true,
  chance: 0.28,
  minChainCount: 2,
  maxChainCount: 3,
  allowedParryTypes: ["bar", "point"],
  damageMultiplier: 1.45,
  damageReductionPerSuccess: 0.32,
  perfectChainExtraReduction: 0.18,
  minimumDamageRatio: 0.18,
  counterDamagePerSuccess: 1,
  counterDamagePerfectChain: 3,
  gapBetweenParriesMs: 180,
  minTurnsBetweenHeavyAttacks: 2,
  debug: true
};

const STATUS_BALANCE_CONFIG = {
  stun: {
    defaultThreshold: 100,
    bossStunTurns: 1,
    playerAttackBaseBuild: {
      coreSpark: 18,
      syntaxBlade: 30,
      grammariaSurge: 45
    },
    counterBuild: {
      good: 12,
      perfect: 25
    },
    criticalExtraBuild: 10,
    repeatedStunResistanceMultiplier: 0.6
  },
  mark: {
    defaultDamageBonus: 0.25,
    defaultHits: 1,
    defaultTurns: 1
  },
  shield: {
    maxHitShieldStacks: 5,
    maxDefenseShieldPercent: 0.75
  }
};

const EARLY_BOSS_BALANCE = {
  timeDust: {
    minMaxHp: 120,
    hpMultiplier: 1.35
  },
  echoTick: {
    minMaxHp: 140,
    hpMultiplier: 1.35
  },
  echoTrick: {
    minMaxHp: 140,
    hpMultiplier: 1.35
  },
  edForger: {
    minMaxHp: 180,
    hpMultiplier: 1.4
  },
  yesterdaySprite: {
    minMaxHp: 190,
    hpMultiplier: 1.4
  },
  yesterdaySpirit: {
    minMaxHp: 190,
    hpMultiplier: 1.4
  }
};

// Canonical Act 1 encounter durability. These values only set enemy max HP and must not scale player damage.
const ACT1_ENCOUNTER_MAX_HP = Object.freeze({
  "what-is-past": 160,
  "what-is-tense": 180,
  act1_phase1_unit3_was_were: 200,
  act1_phase1_unit4_there_was_were: 220,
  act1_phase1_unit5_had: 240,
  "regular-rule-1": 280,
  "regular-rule-2": 300,
  "regular-rule-3": 340,
  "regular-rule-4": 360,
  "ed-mini-boss": 520,
  "irregular-lesson": 380,
  "irregular-mini-boss": 600,
  "final-boss": 800
});

const PHASE1_STARTER_STAGE_IDS = new Set([
  "what-is-past",
  "what-is-tense",
  "act1_phase1_unit3_was_were",
  "act1_phase1_unit4_there_was_were",
  "act1_phase1_unit5_had"
]);

const FOCUS_BALANCE_CONFIG = {
  correctApGain: 1,
  wrongApGain: 0,
  focusDamageBonusPercent: 15,
  maxFocusStacks: 1,
  refreshBuffInsteadOfStacking: true,
  buffAppliesToNextAttackOnly: true,
  allowFocusStackingWithGrammariaCharge: true,
  maxCombinedBonusPercent: 60,
  consecutiveFocusPenaltyEnabled: true,
  maxUsefulConsecutiveFocusUses: 1
};

const BATTLE_FLOW_V2_CONFIG = {
  enabled: true,
  requireSkillSelection: true,
  requireCharmSelection: true,
  requireChargeBeforeAttack: true,
  allowNoCharmOption: true,
  allowAttackWithoutCharge: true,
  wrongAnswerCanStillAttack: true,
  wrongAnswerDamageMultiplier: 0.45,
  maxChargePercent: 100,
  debug: true
};

const PLAYER_SKILLS_V2 = [
  {
    id: "coreSpark",
    name: "Core Spark",
    thaiName: "ประกายแกนไวยากรณ์",
    apCost: 1,
    cooldownTurns: 1,
    damageMultiplier: 1,
    description: "ปล่อยประกายพลังเล็ก ๆ จากเศษ Grammar Core ใช้โจมตีพื้นฐาน",
    effectText: "โจมตีพื้นฐาน ใช้ AP น้อย เหมาะสำหรับเก็บจังหวะ",
    correctAnswerBonusPercent: 0,
    chargeEfficiencyBonusPercent: 0,
    applyBossWeakenPercent: 0,
    enabled: true
  },
  {
    id: "syntaxBlade",
    name: "Syntax Blade",
    thaiName: "คมวากยสัมพันธ์",
    apCost: 2,
    cooldownTurns: 2,
    damageMultiplier: 1.35,
    description: "หลอมโครงสร้างภาษาให้กลายเป็นคมดาบเวทจาก Grammar Core",
    effectText: "ถ้าตอบถูก ดาเมจเพิ่มอีก 10%",
    correctAnswerBonusPercent: 10,
    chargeEfficiencyBonusPercent: 0,
    applyBossWeakenPercent: 0,
    enabled: true
  },
  {
    id: "grammariaSurge",
    name: "Grammaria Surge",
    thaiName: "คลื่นแกรมมาเรีย",
    apCost: 3,
    cooldownTurns: 3,
    damageMultiplier: 1.7,
    description: "ปลดคลื่นพลังเข้มข้นจากเศษ Grammar Core โจมตีอย่างรุนแรง",
    effectText: "ถ้าตอบถูก ดาเมจเพิ่ม 12% เพิ่มประสิทธิภาพการชาร์จ และทำให้บอสอ่อนแรงเล็กน้อย",
    correctAnswerBonusPercent: 12,
    chargeEfficiencyBonusPercent: 10,
    applyBossWeakenPercent: 10,
    enabled: true
  }
];
const PLAYER_SKILL_EFFECT_ASSETS = Object.freeze({
  coreSpark: "assets/effects/skill_core_spark.png",
  syntaxBlade: "assets/effects/skill_syntax_blade.png",
  grammariaSurge: "assets/effects/skill_grammaria_surge.png"
});
const PLAYER_SKILL_EFFECT_CONFIG = Object.freeze({
  coreSpark: { className: "skill-core-spark", width: "clamp(120px, 18vw, 260px)", duration: 520, impactRatio: 0.82, scale: 0.9 },
  syntaxBlade: { className: "skill-syntax-blade", width: "clamp(180px, 24vw, 340px)", duration: 640, impactRatio: 0.84, scale: 1 },
  grammariaSurge: { className: "skill-grammaria-surge", width: "clamp(240px, 32vw, 460px)", duration: 800, impactRatio: 0.86, scale: 1.06 }
});

const PLAYER_CHARMS_V2 = [
  {
    id: "none",
    name: "No Charm",
    thaiName: "ไม่ใช้ชาร์ม",
    description: "โจมตีด้วยพลังของสกิลตามปกติ",
    damageBonusPercent: 0,
    chargeBonusPercent: 0,
    correctAnswerDamageBonusPercent: 0,
    nextDamageReductionPercent: 0,
    enabled: true
  },
  {
    id: "grammarFlame",
    name: "Grammar Flame",
    thaiName: "ชาร์มเปลวไวยากรณ์",
    description: "เพิ่มดาเมจเล็กน้อย",
    damageBonusPercent: 8,
    chargeBonusPercent: 0,
    correctAnswerDamageBonusPercent: 0,
    nextDamageReductionPercent: 0,
    enabled: true
  },
  {
    id: "coreFocus",
    name: "Core Focus",
    thaiName: "ชาร์มรวมแกน",
    description: "ช่วยให้พลังชาร์จส่งผลดีขึ้นเล็กน้อย",
    damageBonusPercent: 0,
    chargeBonusPercent: 8,
    correctAnswerDamageBonusPercent: 0,
    nextDamageReductionPercent: 0,
    enabled: true
  },
  {
    id: "wisdomRune",
    name: "Wisdom Rune",
    thaiName: "รูนปัญญา",
    description: "ถ้าตอบถูก ดาเมจเพิ่มขึ้นเล็กน้อย",
    damageBonusPercent: 0,
    chargeBonusPercent: 0,
    correctAnswerDamageBonusPercent: 10,
    nextDamageReductionPercent: 0,
    enabled: true
  }
];

const BOSS_POINT_PARRY_CONFIGS = {
  edForger: {
    counterDamage: 4,
    chance: 0.35,
    targetCount: 2,
    duration: 2600,
    size: 66
  },
  irregularWraith: {
    counterDamage: 4,
    chance: 0.45,
    targetCount: 2,
    duration: 2400,
    size: 62
  },
  memoryBreaker: {
    counterDamage: 4,
    chance: 0.45,
    lowHpChance: 0.6,
    targetCount: 2,
    lowHpTargetCount: 3,
    duration: 2500,
    lowHpDuration: 2300,
    size: 62,
    lowHpSize: 58,
    lowHpThreshold: 0.45
  }
};

const bossQuestionBanks = {
  edForger: [
    { prompt: "study →", options: ["studied", "studyed", "studyied", "studed"], answer: "studied", explanation: "study ลงท้ายด้วยพยัญชนะ + y จึงเปลี่ยน y เป็น i แล้วเติม -ed" },
    { prompt: "love →", options: ["loved", "loveed", "lovied", "lovd"], answer: "loved", explanation: "love ลงท้ายด้วย e เติมแค่ -d" },
    { prompt: "stop →", options: ["stopped", "stoped", "stopied", "stopd"], answer: "stopped", explanation: "stop เป็นคำสั้นแบบ CVC จึงเพิ่ม p แล้วเติม -ed" },
    { prompt: "play →", options: ["played", "playied", "plaied", "playd"], answer: "played", explanation: "play มีสระ a หน้า y จึงเติม -ed ได้เลย" },
    { prompt: "prefer →", options: ["preferred", "prefered", "preferied", "preferrd"], answer: "preferred", explanation: "prefer ต้องเพิ่ม r ก่อนเติม -ed" },
    { prompt: "reply →", options: ["replied", "replyed", "replyied", "replid"], answer: "replied", explanation: "reply ลงท้ายด้วยพยัญชนะ + y จึงเปลี่ยน y เป็น i แล้วเติม -ed" }
  ],
  irregularWraith: [
    { prompt: "go →", options: ["went", "goed", "gone", "goes"], answer: "went", explanation: "go เป็น irregular verb รูป V2 คือ went" },
    { prompt: "eat →", options: ["ate", "eated", "eaten", "eats"], answer: "ate", explanation: "eat เป็น irregular verb รูป V2 คือ ate" },
    { prompt: "bring →", options: ["brought", "bringed", "brang", "brung"], answer: "brought", explanation: "bring เป็น irregular verb รูป V2 คือ brought" },
    { prompt: "teach →", options: ["taught", "teached", "teacht", "teaching"], answer: "taught", explanation: "teach เป็น irregular verb รูป V2 คือ taught" },
    { prompt: "write →", options: ["wrote", "writed", "written", "writing"], answer: "wrote", explanation: "write เป็น irregular verb รูป V2 คือ wrote" },
    { prompt: "find →", options: ["found", "finded", "founded", "finding"], answer: "found", explanation: "find เป็น irregular verb รูป V2 คือ found" }
  ],
  memoryBreaker: [
    { sentence: "Yesterday, I ____ to school.", options: ["went", "go", "goes", "going"], answer: "went", explanation: "Yesterday บอกอดีต จึงใช้ went" },
    { sentence: "She ____ English last night.", options: ["studied", "studyed", "studies", "studying"], answer: "studied", explanation: "study เปลี่ยน y เป็น i แล้วเติม -ed" },
    { sentence: "They ____ the window yesterday.", options: ["broke", "breaked", "broken", "break"], answer: "broke", explanation: "break เป็น irregular verb รูป V2 คือ broke" },
    { sentence: "My father ____ home late last night.", options: ["came", "comed", "come", "coming"], answer: "came", explanation: "come เป็น irregular verb รูป V2 คือ came" },
    { prompt: "เลือกประโยคที่ถูกต้อง", options: ["I studied English last night.", "I studyed English last night.", "I studying English last night.", "I studies English last night."], answer: "I studied English last night.", explanation: "ประโยคอดีตใช้ V2 และ study เป็น studied" },
    { prompt: "choose →", options: ["chose", "choosed", "chosen", "choosing"], answer: "chose", explanation: "choose เป็น irregular verb รูป V2 คือ chose" },
    { prompt: "drop →", options: ["dropped", "droped", "dropd", "dropied"], answer: "dropped", explanation: "drop ต้องเพิ่ม p ก่อนเติม -ed" },
    { sentence: "He ____ his homework this morning.", options: ["did", "do", "does", "doing"], answer: "did", explanation: "this morning ถ้าเหตุการณ์จบแล้วถือเป็นอดีต ใช้ did" }
  ]
};

const bossDifficultyWeights = {
  edForger: { medium: 60, hard: 30, boss: 10 },
  irregularWraith: { medium: 35, hard: 40, boss: 25 },
  memoryBreaker: { medium: 15, hard: 35, boss: 50 }
};

function bossQuestion(config) {
  return {
    id: config.id,
    boss: config.boss,
    difficulty: config.difficulty,
    lessonId: config.lessonId,
    ruleId: config.ruleId,
    type: config.type,
    baseVerb: config.baseVerb,
    prompt: config.prompt,
    sentence: config.sentence,
    options: config.options,
    answer: config.answer,
    explanation: config.explanation
  };
}

function buildEdForgerQuestions() {
  const items = [
    ["ed_001", "medium", "regular-ed", "walk", "walk ->", ["walked", "walkd", "walkked", "walkied"], "walked", "คำทั่วไปเติม -ed เป็น walked"],
    ["ed_002", "medium", "regular-ed", "clean", "clean ->", ["cleaned", "cleand", "cleanned", "cleanied"], "cleaned", "คำทั่วไปเติม -ed เป็น cleaned"],
    ["ed_003", "medium", "regular-ed", "help", "help ->", ["helped", "helpd", "helpped", "helpied"], "helped", "คำทั่วไปเติม -ed เป็น helped"],
    ["ed_004", "medium", "regular-ed", "watch", "watch ->", ["watched", "watchd", "watcheed", "watchied"], "watched", "คำทั่วไปเติม -ed เป็น watched"],
    ["ed_005", "medium", "ending-e", "love", "love ->", ["loved", "loveed", "lovied", "lovd"], "loved", "คำที่ลงท้ายด้วย e เติมแค่ -d"],
    ["ed_006", "medium", "ending-e", "like", "like ->", ["liked", "likeed", "likied", "likd"], "liked", "คำที่ลงท้ายด้วย e เติมแค่ -d"],
    ["ed_007", "medium", "ending-e", "move", "move ->", ["moved", "moveed", "movied", "movd"], "moved", "คำที่ลงท้ายด้วย e เติมแค่ -d"],
    ["ed_008", "medium", "ending-e", "dance", "dance ->", ["danced", "danceed", "dancied", "dancd"], "danced", "คำที่ลงท้ายด้วย e เติมแค่ -d"],
    ["ed_009", "medium", "vowel-y", "play", "play ->", ["played", "playied", "plaied", "playd"], "played", "หน้า y เป็นสระ จึงเติม -ed ได้เลย"],
    ["ed_010", "medium", "vowel-y", "enjoy", "enjoy ->", ["enjoyed", "enjoied", "enjoyd", "enjoyied"], "enjoyed", "หน้า y เป็นสระ จึงเติม -ed ได้เลย"],
    ["ed_011", "medium", "consonant-y", "study", "study ->", ["studied", "studyed", "studyied", "studed"], "studied", "พยัญชนะ + y เปลี่ยน y เป็น i แล้วเติม -ed"],
    ["ed_012", "medium", "consonant-y", "try", "try ->", ["tried", "tryed", "tryied", "trid"], "tried", "พยัญชนะ + y เปลี่ยน y เป็น i แล้วเติม -ed"],
    ["ed_013", "medium", "consonant-y", "reply", "reply ->", ["replied", "replyed", "replyied", "replid"], "replied", "พยัญชนะ + y เปลี่ยน y เป็น i แล้วเติม -ed"],
    ["ed_014", "medium", "regular-ed", "visit", "visit ->", ["visited", "visitted", "visitd", "visitied"], "visited", "visit ไม่เน้นเสียงท้ายแบบ CVC จึงเติม -ed ปกติ"],
    ["ed_015", "medium", "regular-ed", "open", "open ->", ["opened", "openned", "opend", "openied"], "opened", "open ไม่ต้องเพิ่ม n ก่อนเติม -ed"],
    ["ed_016", "medium", "regular-ed", "listen", "listen ->", ["listened", "listenned", "listend", "listenied"], "listened", "listen เติม -ed ปกติ"],
    ["ed_017", "hard", "cvc-double", "stop", "stop ->", ["stopped", "stoped", "stopied", "stopd"], "stopped", "คำสั้น CVC ต้องเพิ่มพยัญชนะท้ายก่อนเติม -ed"],
    ["ed_018", "hard", "cvc-double", "plan", "plan ->", ["planned", "planed", "planied", "pland"], "planned", "คำสั้น CVC ต้องเพิ่ม n ก่อนเติม -ed"],
    ["ed_019", "hard", "cvc-double", "drop", "drop ->", ["dropped", "droped", "dropd", "dropied"], "dropped", "คำสั้น CVC ต้องเพิ่ม p ก่อนเติม -ed"],
    ["ed_020", "hard", "cvc-double", "grab", "grab ->", ["grabbed", "grabed", "grabied", "grabd"], "grabbed", "คำสั้น CVC ต้องเพิ่ม b ก่อนเติม -ed"],
    ["ed_021", "hard", "cvc-double", "skip", "skip ->", ["skipped", "skiped", "skipd", "skipied"], "skipped", "คำสั้น CVC ต้องเพิ่ม p ก่อนเติม -ed"],
    ["ed_022", "hard", "final-stress", "prefer", "prefer ->", ["preferred", "prefered", "preferied", "preferrd"], "preferred", "prefer เน้นเสียงท้าย จึงเพิ่ม r ก่อนเติม -ed"],
    ["ed_023", "hard", "final-stress", "refer", "refer ->", ["referred", "refered", "referied", "referrd"], "referred", "refer เน้นเสียงท้าย จึงเพิ่ม r ก่อนเติม -ed"],
    ["ed_024", "hard", "final-stress", "occur", "occur ->", ["occurred", "occured", "occuried", "occurrd"], "occurred", "occur เน้นเสียงท้าย จึงเพิ่ม r ก่อนเติม -ed"],
    ["ed_025", "hard", "no-final-stress", "travel", "travel ->", ["traveled", "travelled", "traveld", "travelied"], "traveled", "ใช้รูป American English: traveled"],
    ["ed_026", "hard", "no-final-stress", "offer", "offer ->", ["offered", "offerred", "offerd", "offeried"], "offered", "offer ไม่เน้นเสียงท้าย จึงเติม -ed ปกติ"],
    ["ed_027", "hard", "ending-e", "decide", "decide ->", ["decided", "decideed", "decidied", "decidd"], "decided", "ลงท้าย e เติม -d เป็น decided"],
    ["ed_028", "hard", "ending-e", "practice", "practice ->", ["practiced", "practiceed", "practicied", "practicd"], "practiced", "ลงท้าย e เติม -d เป็น practiced"],
    ["ed_029", "boss", "mixed-rule", "study", "Which word changes y to i before -ed?", ["study", "play", "enjoy", "stay"], "study", "study ลงท้ายด้วยพยัญชนะ + y จึงเปลี่ยน y เป็น i"],
    ["ed_030", "boss", "mixed-rule", "stop", "Which word doubles the final consonant?", ["stop", "open", "visit", "clean"], "stop", "stop เป็นคำสั้น CVC จึงเพิ่ม p"],
    ["ed_031", "boss", "mixed-rule", "stop", "Which answer is correct?", ["I stopped at the tower.", "I stoped at the tower.", "I stopied at the tower.", "I stopd at the tower."], "I stopped at the tower.", "stop ต้องเป็น stopped"],
    ["ed_032", "boss", "mixed-rule", "study", "Which answer is correct?", ["She studied the rune.", "She studyed the rune.", "She studyied the rune.", "She studed the rune."], "She studied the rune.", "study ต้องเป็น studied"],
    ["ed_033", "boss", "mixed-rule", "open", "Which answer is correct?", ["They opened the gate.", "They openned the gate.", "They openied the gate.", "They opend the gate."], "They opened the gate.", "open เติม -ed ปกติ"],
    ["ed_034", "boss", "mixed-rule", "prefer", "Which answer is correct?", ["He preferred the blue crystal.", "He prefered the blue crystal.", "He preferrd the blue crystal.", "He preferied the blue crystal."], "He preferred the blue crystal.", "prefer ต้องเป็น preferred"],
    ["ed_035", "boss", "mixed-rule", "arrive", "arrive ->", ["arrived", "arriveed", "arrivied", "arrivd"], "arrived", "arrive ลงท้าย e เติม -d"],
    ["ed_036", "boss", "mixed-rule", "carry", "carry ->", ["carried", "carryed", "carryied", "carryd"], "carried", "พยัญชนะ + y เปลี่ยน y เป็น i แล้วเติม -ed"],
    ["ed_037", "medium", "regular-ed", "work", "work ->", ["worked", "workd", "workked", "workied"], "worked", "คำทั่วไปเติม -ed เป็น worked"],
    ["ed_038", "medium", "regular-ed", "look", "look ->", ["looked", "lookd", "lookked", "lookied"], "looked", "คำทั่วไปเติม -ed เป็น looked"],
    ["ed_039", "medium", "ending-e", "use", "use ->", ["used", "useed", "usied", "usd"], "used", "ลงท้าย e เติม -d เป็น used"],
    ["ed_040", "medium", "ending-e", "smile", "smile ->", ["smiled", "smileed", "smilied", "smild"], "smiled", "ลงท้าย e เติม -d เป็น smiled"],
    ["ed_041", "medium", "vowel-y", "pray", "pray ->", ["prayed", "praied", "prayd", "prayied"], "prayed", "หน้า y เป็นสระ จึงเติม -ed ได้เลย"],
    ["ed_042", "medium", "vowel-y", "employ", "employ ->", ["employed", "emploied", "employd", "employied"], "employed", "หน้า y เป็นสระ จึงเติม -ed ได้เลย"],
    ["ed_043", "medium", "consonant-y", "apply", "apply ->", ["applied", "applyed", "applyied", "appled"], "applied", "พยัญชนะ + y เปลี่ยน y เป็น i แล้วเติม -ed"],
    ["ed_044", "medium", "consonant-y", "marry", "marry ->", ["married", "marryed", "marryied", "marred"], "married", "พยัญชนะ + y เปลี่ยน y เป็น i แล้วเติม -ed"],
    ["ed_045", "hard", "cvc-double", "wrap", "wrap ->", ["wrapped", "wraped", "wrapd", "wrapied"], "wrapped", "คำสั้น CVC ต้องเพิ่ม p ก่อนเติม -ed"],
    ["ed_046", "hard", "cvc-double", "trim", "trim ->", ["trimmed", "trimed", "trimd", "trimied"], "trimmed", "คำสั้น CVC ต้องเพิ่ม m ก่อนเติม -ed"],
    ["ed_047", "hard", "cvc-double", "control", "control ->", ["controlled", "controled", "controld", "controlied"], "controlled", "control เน้นเสียงท้าย จึงเพิ่ม l ก่อนเติม -ed"],
    ["ed_048", "hard", "cvc-double", "permit", "permit ->", ["permitted", "permited", "permitd", "permitied"], "permitted", "permit เน้นเสียงท้าย จึงเพิ่ม t ก่อนเติม -ed"],
    ["ed_049", "boss", "sentence", "watch", "Yesterday, I ____ a movie with my family.", ["watched", "watch", "watches", "watching"], "watched", "Yesterday บอกอดีต และ watch เติม -ed เป็น watched"],
    ["ed_050", "boss", "sentence", "dance", "She ____ at the school show last night.", ["danced", "dance", "dances", "danceed"], "danced", "dance ลงท้าย e จึงเติมแค่ -d"],
    ["ed_051", "boss", "sentence", "study", "She ____ English last night.", ["studied", "studyed", "study", "studying"], "studied", "study มีพยัญชนะหน้า y จึงเปลี่ยน y เป็น i แล้วเติม -ed"],
    ["ed_052", "boss", "sentence", "stop", "The cart ____ near the old tower.", ["stopped", "stoped", "stop", "stopping"], "stopped", "stop เป็น CVC จึงเพิ่ม p แล้วเติม -ed"]
  ];

  return items.map(item => bossQuestion({
    id: item[0],
    boss: "edForger",
    difficulty: item[1],
    type: item[2],
    baseVerb: item[3],
    prompt: item[4].includes("____") ? undefined : item[4],
    sentence: item[4].includes("____") ? item[4] : undefined,
    options: item[5],
    answer: item[6],
    explanation: item[7]
  }));
}

function buildIrregularWraithQuestions() {
  const verbs = [
    ["ir_001", "medium", "go", "go ->", ["went", "goed", "gone", "goes"], "went"],
    ["ir_002", "medium", "eat", "eat ->", ["ate", "eated", "eaten", "eats"], "ate"],
    ["ir_003", "medium", "see", "see ->", ["saw", "seed", "seen", "sees"], "saw"],
    ["ir_004", "medium", "come", "come ->", ["came", "comed", "come", "coming"], "came"],
    ["ir_005", "medium", "buy", "buy ->", ["bought", "buyed", "brought", "buying"], "bought"],
    ["ir_006", "medium", "bring", "bring ->", ["brought", "bringed", "brang", "brung"], "brought"],
    ["ir_007", "medium", "teach", "teach ->", ["taught", "teached", "teacht", "teaching"], "taught"],
    ["ir_008", "medium", "think", "think ->", ["thought", "thinked", "thunk", "thinking"], "thought"],
    ["ir_009", "medium", "write", "write ->", ["wrote", "writed", "written", "writing"], "wrote"],
    ["ir_010", "medium", "find", "find ->", ["found", "finded", "founded", "finding"], "found"],
    ["ir_011", "medium", "make", "make ->", ["made", "maked", "makeed", "making"], "made"],
    ["ir_012", "medium", "take", "take ->", ["took", "taked", "taken", "taking"], "took"],
    ["ir_013", "medium", "give", "give ->", ["gave", "gived", "given", "giving"], "gave"],
    ["ir_014", "medium", "speak", "speak ->", ["spoke", "speaked", "spoken", "speaking"], "spoke"],
    ["ir_015", "hard", "break", "break ->", ["broke", "breaked", "broken", "break"], "broke"],
    ["ir_016", "hard", "choose", "choose ->", ["chose", "choosed", "chosen", "choosing"], "chose"],
    ["ir_017", "hard", "drive", "drive ->", ["drove", "drived", "driven", "driving"], "drove"],
    ["ir_018", "hard", "forget", "forget ->", ["forgot", "forgetted", "forgotten", "forget"], "forgot"],
    ["ir_019", "hard", "hide", "hide ->", ["hid", "hided", "hidden", "hiding"], "hid"],
    ["ir_020", "hard", "keep", "keep ->", ["kept", "keeped", "keeping", "keept"], "kept"],
    ["ir_021", "hard", "leave", "leave ->", ["left", "leaved", "leaving", "leaves"], "left"],
    ["ir_022", "hard", "lose", "lose ->", ["lost", "losed", "losing", "loosed"], "lost"],
    ["ir_023", "hard", "meet", "meet ->", ["met", "meeted", "meeting", "meat"], "met"],
    ["ir_024", "hard", "pay", "pay ->", ["paid", "payed", "payd", "paying"], "paid"],
    ["ir_025", "hard", "read", "read ->", ["read", "readed", "rode", "reading"], "read"],
    ["ir_026", "hard", "ride", "ride ->", ["rode", "rided", "ridden", "riding"], "rode"],
    ["ir_027", "hard", "rise", "rise ->", ["rose", "rised", "risen", "rising"], "rose"],
    ["ir_028", "hard", "sell", "sell ->", ["sold", "selled", "selling", "salled"], "sold"],
    ["ir_029", "hard", "send", "send ->", ["sent", "sended", "sending", "send"], "sent"],
    ["ir_030", "hard", "shake", "shake ->", ["shook", "shaked", "shaken", "shaking"], "shook"],
    ["ir_031", "boss", "steal", "steal ->", ["stole", "stealed", "stolen", "stealing"], "stole"],
    ["ir_032", "boss", "swim", "swim ->", ["swam", "swimmed", "swum", "swimming"], "swam"],
    ["ir_033", "boss", "throw", "throw ->", ["threw", "throwed", "thrown", "throwing"], "threw"],
    ["ir_034", "boss", "wear", "wear ->", ["wore", "weared", "worn", "wearing"], "wore"],
    ["ir_035", "boss", "win", "win ->", ["won", "winned", "winning", "wan"], "won"],
    ["ir_036", "boss", "begin", "begin ->", ["began", "beginned", "begun", "beginning"], "began"],
    ["ir_037", "boss", "fall", "fall ->", ["fell", "falled", "fallen", "falling"], "fell"],
    ["ir_038", "boss", "fly", "fly ->", ["flew", "flyed", "flown", "flying"], "flew"],
    ["ir_039", "boss", "grow", "grow ->", ["grew", "growed", "grown", "growing"], "grew"],
    ["ir_040", "boss", "hold", "hold ->", ["held", "holded", "holding", "hald"], "held"]
  ];

  return verbs.map(item => bossQuestion({
    id: item[0],
    boss: "irregularWraith",
    difficulty: item[1],
    type: "irregular-v2",
    baseVerb: item[2],
    prompt: item[3],
    options: item[4],
    answer: item[5],
    explanation: `${item[2]} เป็น Irregular Verb รูป V2 คือ ${item[5]}`
  }));
}

function buildMemoryBreakerQuestions() {
  const items = [
    ["mb_001", "medium", "sentence", "go", "Yesterday, I ____ to school.", ["went", "go", "goes", "going"], "went", "Yesterday บอกอดีต จึงใช้ went"],
    ["mb_002", "medium", "sentence", "study", "She ____ English last night.", ["studied", "studyed", "studies", "studying"], "studied", "last night บอกอดีต และ study เป็น studied"],
    ["mb_003", "medium", "sentence", "play", "They ____ football yesterday.", ["played", "play", "plays", "playing"], "played", "yesterday บอกอดีต จึงใช้ played"],
    ["mb_004", "medium", "sentence", "come", "My father ____ home late last night.", ["came", "comed", "come", "coming"], "came", "come เป็น Irregular Verb รูป V2 คือ came"],
    ["mb_005", "medium", "choose-correct", "study", "Choose the correct sentence.", ["I studied English last night.", "I studyed English last night.", "I studying English last night.", "I studies English last night."], "I studied English last night.", "ประโยคอดีตใช้ V2 และ study เป็น studied"],
    ["mb_006", "medium", "irregular-v2", "choose", "choose ->", ["chose", "choosed", "chosen", "choosing"], "chose", "choose เป็น Irregular Verb รูป V2 คือ chose"],
    ["mb_007", "medium", "regular-ed", "drop", "drop ->", ["dropped", "droped", "dropd", "dropied"], "dropped", "drop เป็น CVC จึงเพิ่ม p แล้วเติม -ed"],
    ["mb_008", "medium", "sentence", "do", "He ____ his homework this morning.", ["did", "do", "does", "doing"], "did", "this morning เมื่อเหตุการณ์จบแล้ว ใช้ did"],
    ["mb_009", "hard", "sentence", "break", "They ____ the window yesterday.", ["broke", "breaked", "broken", "break"], "broke", "break เป็น Irregular Verb รูป V2 คือ broke"],
    ["mb_010", "hard", "sentence", "prefer", "The scholar ____ the blue crystal.", ["preferred", "prefered", "preferied", "preferrd"], "preferred", "prefer เน้นเสียงท้าย จึงเพิ่ม r ก่อนเติม -ed"],
    ["mb_011", "hard", "sentence", "visit", "We ____ the Unity Tower last week.", ["visited", "visitted", "visit", "visitied"], "visited", "visit เติม -ed ปกติ"],
    ["mb_012", "hard", "sentence", "write", "The Wanderer ____ a note yesterday.", ["wrote", "writed", "written", "writing"], "wrote", "write เป็น Irregular Verb รูป V2 คือ wrote"],
    ["mb_013", "hard", "did-base", "go", "Did she ____ to the library yesterday?", ["go", "went", "goes", "going"], "go", "หลัง did ต้องใช้กริยาช่อง 1"],
    ["mb_014", "hard", "did-base", "eat", "Did they ____ breakfast this morning?", ["eat", "ate", "eated", "eaten"], "eat", "หลัง did ต้องใช้กริยาช่อง 1"],
    ["mb_015", "hard", "negative", "see", "I did not ____ the Memory Shade.", ["see", "saw", "seen", "seeing"], "see", "หลัง did not ต้องใช้กริยาช่อง 1"],
    ["mb_016", "hard", "negative", "make", "She did not ____ a mistake.", ["make", "made", "maked", "making"], "make", "หลัง did not ต้องใช้กริยาช่อง 1"],
    ["mb_017", "hard", "choose-correct", "go", "Choose the correct sentence.", ["Did you go yesterday?", "Did you went yesterday?", "Did you goes yesterday?", "Did you going yesterday?"], "Did you go yesterday?", "คำถามที่ใช้ did ต้องตามด้วยกริยาช่อง 1"],
    ["mb_018", "hard", "choose-correct", "see", "Choose the correct sentence.", ["I saw the tower yesterday.", "I seed the tower yesterday.", "I seen the tower yesterday.", "I seeing the tower yesterday."], "I saw the tower yesterday.", "see รูป V2 คือ saw"],
    ["mb_019", "hard", "mixed-rule", "study", "Which one is Past Simple?", ["studied", "studies", "studying", "study"], "studied", "studied เป็นรูปอดีตของ study"],
    ["mb_020", "hard", "mixed-rule", "take", "Which one is V2?", ["took", "taken", "take", "taking"], "took", "take รูป V2 คือ took"],
    ["mb_021", "hard", "sentence", "stop", "The clock ____ suddenly.", ["stopped", "stoped", "stop", "stopping"], "stopped", "stop เป็น CVC จึงเพิ่ม p แล้วเติม -ed"],
    ["mb_022", "hard", "sentence", "arrive", "Master Verion ____ before sunset.", ["arrived", "arriveed", "arrivied", "arrivd"], "arrived", "arrive ลงท้าย e เติม -d"],
    ["mb_023", "hard", "sentence", "bring", "The student ____ a book yesterday.", ["brought", "bringed", "brang", "bringing"], "brought", "bring รูป V2 คือ brought"],
    ["mb_024", "hard", "sentence", "teach", "Master Verion ____ the past tense.", ["taught", "teached", "teacht", "teaching"], "taught", "teach รูป V2 คือ taught"],
    ["mb_025", "boss", "sentence", "forget", "The shade ____ its name long ago.", ["forgot", "forgetted", "forgotten", "forget"], "forgot", "forget รูป V2 คือ forgot"],
    ["mb_026", "boss", "sentence", "hide", "The fragment ____ inside the tower.", ["hid", "hided", "hidden", "hiding"], "hid", "hide รูป V2 คือ hid"],
    ["mb_027", "boss", "sentence", "rise", "A purple light ____ from the floor.", ["rose", "rised", "risen", "rising"], "rose", "rise รูป V2 คือ rose"],
    ["mb_028", "boss", "sentence", "throw", "The wraith ____ a broken rune.", ["threw", "throwed", "thrown", "throwing"], "threw", "throw รูป V2 คือ threw"],
    ["mb_029", "boss", "sentence", "open", "The gate ____ after the spell.", ["opened", "openned", "open", "openied"], "opened", "open เติม -ed ปกติ"],
    ["mb_030", "boss", "sentence", "refer", "The book ____ to an ancient error.", ["referred", "refered", "referied", "referrd"], "referred", "refer เน้นเสียงท้าย จึงเพิ่ม r"],
    ["mb_031", "boss", "did-base", "write", "Did the Wanderer ____ the answer?", ["write", "wrote", "written", "writing"], "write", "หลัง did ต้องใช้กริยาช่อง 1"],
    ["mb_032", "boss", "did-base", "choose", "Did you ____ the correct charm?", ["choose", "chose", "chosen", "choosing"], "choose", "หลัง did ต้องใช้กริยาช่อง 1"],
    ["mb_033", "boss", "negative", "bring", "They did not ____ the old map.", ["bring", "brought", "bringed", "bringing"], "bring", "หลัง did not ต้องใช้กริยาช่อง 1"],
    ["mb_034", "boss", "negative", "take", "He did not ____ the crystal.", ["take", "took", "taken", "taking"], "take", "หลัง did not ต้องใช้กริยาช่อง 1"],
    ["mb_035", "boss", "choose-correct", "break", "Choose the correct sentence.", ["The crystal broke yesterday.", "The crystal breaked yesterday.", "The crystal broken yesterday.", "The crystal breaking yesterday."], "The crystal broke yesterday.", "break รูป V2 คือ broke"],
    ["mb_036", "boss", "choose-correct", "prefer", "Choose the correct sentence.", ["She preferred the blue rune.", "She prefered the blue rune.", "She preferied the blue rune.", "She preferrd the blue rune."], "She preferred the blue rune.", "prefer ต้องเป็น preferred"],
    ["mb_037", "boss", "choose-correct", "did-base", "Choose the correct sentence.", ["Did he make a shield?", "Did he made a shield?", "Did he makes a shield?", "Did he making a shield?"], "Did he make a shield?", "หลัง did ต้องใช้กริยาช่อง 1"],
    ["mb_038", "boss", "mixed-rule", "sell", "Which one is V2?", ["sold", "selled", "selling", "sell"], "sold", "sell รูป V2 คือ sold"],
    ["mb_039", "boss", "mixed-rule", "travel", "Which spelling is correct?", ["traveled", "travelled", "traveld", "travelied"], "traveled", "ใช้รูป American English: traveled"],
    ["mb_040", "boss", "mixed-rule", "carry", "carry ->", ["carried", "carryed", "carryied", "carryd"], "carried", "พยัญชนะ + y เปลี่ยน y เป็น i แล้วเติม -ed"],
    ["mb_041", "boss", "sentence", "swim", "The boy ____ across the river.", ["swam", "swimmed", "swum", "swimming"], "swam", "swim รูป V2 คือ swam"],
    ["mb_042", "boss", "sentence", "fly", "The letters ____ above the tower.", ["flew", "flyed", "flown", "flying"], "flew", "fly รูป V2 คือ flew"],
    ["mb_043", "boss", "sentence", "win", "The team ____ the match last week.", ["won", "winned", "winning", "win"], "won", "win รูป V2 คือ won"],
    ["mb_044", "boss", "sentence", "pay", "She ____ for the book yesterday.", ["paid", "payed", "payd", "paying"], "paid", "pay รูป V2 คือ paid"],
    ["mb_045", "boss", "sentence", "shake", "The tower ____ during the error.", ["shook", "shaked", "shaken", "shaking"], "shook", "shake รูป V2 คือ shook"],
    ["mb_046", "boss", "sentence", "leave", "They ____ before the bell.", ["left", "leaved", "leaving", "leaves"], "left", "leave รูป V2 คือ left"],
    ["mb_047", "boss", "sentence", "read", "I ____ the old scroll yesterday.", ["read", "readed", "rode", "reading"], "read", "read รูป V2 เขียนเหมือนเดิม แต่ออกเสียงต่างกัน"],
    ["mb_048", "boss", "sentence", "begin", "The battle ____ at dawn.", ["began", "beginned", "begun", "beginning"], "began", "begin รูป V2 คือ began"]
  ];

  return items.map(item => bossQuestion({
    id: item[0],
    boss: "memoryBreaker",
    difficulty: item[1],
    type: item[2],
    baseVerb: item[3],
    prompt: item[4].includes("____") ? undefined : item[4],
    sentence: item[4].includes("____") ? item[4] : undefined,
    options: item[5],
    answer: item[6],
    explanation: item[7]
  }));
}

bossQuestionBanks.edForger = buildEdForgerQuestions();
bossQuestionBanks.irregularWraith = buildIrregularWraithQuestions();
bossQuestionBanks.memoryBreaker = buildMemoryBreakerQuestions();

const TENSE_LABELS = {
  present: "Present (ปัจจุบัน)",
  past: "Past (อดีต)",
  future: "Future (อนาคต)"
};

const regularVerbBanks = {
  addEd: [
    ["walk", "walked", ["walkd", "walkked", "walkied"]],
    ["jump", "jumped", ["jumpd", "jumpped", "jumpied"]],
    ["help", "helped", ["helpd", "helpped", "helpied"]],
    ["watch", "watched", ["watchd", "watcheed", "watchied"]],
    ["open", "opened", ["opend", "openned", "openied"]],
    ["clean", "cleaned", ["cleand", "cleanned", "cleanied"]],
    ["finish", "finished", ["finishd", "finisheed", "finishied"]],
    ["answer", "answered", ["answerd", "answereed", "answeried"]],
    ["listen", "listened", ["listend", "listenned", "listenied"]],
    ["visit", "visited", ["visitd", "visitted", "visitied"]],
    ["collect", "collected", ["collectd", "collectted", "collectied"]],
    ["explain", "explained", ["explaind", "explainned", "explainied"]],
    ["return", "returned", ["returnd", "returnned", "returnied"]],
    ["repair", "repaired", ["repaird", "repairred", "repairied"]],
    ["remember", "remembered", ["rememberd", "rememberred", "rememberied"]],
    ["call", "called", ["calld", "callled", "callied"]],
    ["ask", "asked", ["askd", "askked", "askied"]],
    ["work", "worked", ["workd", "workked", "workied"]],
    ["look", "looked", ["lookd", "lookked", "lookied"]],
    ["start", "started", ["startd", "startted", "startied"]],
    ["wash", "washed", ["washd", "washeed", "washied"]],
    ["cook", "cooked", ["cookd", "cookked", "cookied"]],
    ["talk", "talked", ["talkd", "talkked", "talkied"]],
    ["rain", "rained", ["raind", "rainned", "rainied"]],
    ["paint", "painted", ["paintd", "paintted", "paintied"]],
    ["want", "wanted", ["wantd", "wantted", "wantied"]]
  ],
  endingE: [
    ["like", "liked", ["likeed", "likied", "likd"]],
    ["love", "loved", ["loveed", "lovied", "lovd"]],
    ["live", "lived", ["liveed", "livied", "livd"]],
    ["dance", "danced", ["danceed", "dancied", "dancd"]],
    ["close", "closed", ["closeed", "closied", "closd"]],
    ["move", "moved", ["moveed", "movied", "movd"]],
    ["decide", "decided", ["decideed", "decidied", "decidd"]],
    ["arrive", "arrived", ["arriveed", "arrivied", "arrivd"]],
    ["create", "created", ["createed", "creatied", "creatd"]],
    ["practice", "practiced", ["practiceed", "practicied", "practicd"]],
    ["receive", "received", ["receiveed", "receivied", "receivd"]],
    ["hope", "hoped", ["hopeed", "hopied", "hopd"]],
    ["save", "saved", ["saveed", "savied", "savd"]],
    ["use", "used", ["useed", "usied", "usd"]],
    ["change", "changed", ["changeed", "changied", "changd"]],
    ["smile", "smiled", ["smileed", "smilied", "smild"]],
    ["bake", "baked", ["bakeed", "bakied", "bakd"]],
    ["invite", "invited", ["inviteed", "invitied", "invitd"]],
    ["phone", "phoned", ["phoneed", "phonied", "phond"]],
    ["share", "shared", ["shareed", "sharied", "shard"]],
    ["care", "cared", ["careed", "caried", "card"]],
    ["agree", "agreed", ["agreeed", "agried", "agred"]],
    ["believe", "believed", ["believeed", "believied", "believd"]]
  ],
  endingY: [
    ["play", "played", ["playied", "plaied", "playd"], "หน้า y เป็นสระ จึงเติม -ed ได้เลย"],
    ["enjoy", "enjoyed", ["enjoied", "enjoyd", "enjoyied"], "หน้า y เป็นสระ จึงเติม -ed ได้เลย"],
    ["stay", "stayed", ["staied", "stayd", "stayied"], "หน้า y เป็นสระ จึงเติม -ed ได้เลย"],
    ["obey", "obeyed", ["obeied", "obeyd", "obeyied"], "หน้า y เป็นสระ จึงเติม -ed ได้เลย"],
    ["delay", "delayed", ["delaied", "delayd", "delayied"], "หน้า y เป็นสระ จึงเติม -ed ได้เลย"],
    ["pray", "prayed", ["praied", "prayd", "prayied"], "หน้า y เป็นสระ จึงเติม -ed ได้เลย"],
    ["annoy", "annoyed", ["annoied", "annoyd", "annoyied"], "หน้า y เป็นสระ จึงเติม -ed ได้เลย"],
    ["survey", "surveyed", ["surveied", "surveyd", "surveyied"], "หน้า y เป็นสระ จึงเติม -ed ได้เลย"],
    ["display", "displayed", ["displaied", "displayd", "displayied"], "หน้า y เป็นสระ จึงเติม -ed ได้เลย"],
    ["relay", "relayed", ["relaied", "relayd", "relayied"], "หน้า y เป็นสระ จึงเติม -ed ได้เลย"],
    ["destroy", "destroyed", ["destroied", "destroyd", "destroyied"], "หน้า y เป็นสระ จึงเติม -ed ได้เลย"],
    ["employ", "employed", ["emploied", "employd", "employied"], "หน้า y เป็นสระ จึงเติม -ed ได้เลย"],
    ["study", "studied", ["studyed", "studyied", "studed"], "หน้า y เป็นพยัญชนะ จึงเปลี่ยน y เป็น i แล้วเติม -ed"],
    ["cry", "cried", ["cryed", "cryied", "cryd"], "หน้า y เป็นพยัญชนะ จึงเปลี่ยน y เป็น i แล้วเติม -ed"],
    ["try", "tried", ["tryed", "tryied", "tryd"], "หน้า y เป็นพยัญชนะ จึงเปลี่ยน y เป็น i แล้วเติม -ed"],
    ["carry", "carried", ["carryed", "carryied", "carred"], "หน้า y เป็นพยัญชนะ จึงเปลี่ยน y เป็น i แล้วเติม -ed"],
    ["copy", "copied", ["copyed", "copyied", "copd"], "หน้า y เป็นพยัญชนะ จึงเปลี่ยน y เป็น i แล้วเติม -ed"],
    ["hurry", "hurried", ["hurryed", "hurryied", "hurred"], "หน้า y เป็นพยัญชนะ จึงเปลี่ยน y เป็น i แล้วเติม -ed"],
    ["worry", "worried", ["worryed", "worryied", "worred"], "หน้า y เป็นพยัญชนะ จึงเปลี่ยน y เป็น i แล้วเติม -ed"],
    ["reply", "replied", ["replyed", "replyied", "repled"], "หน้า y เป็นพยัญชนะ จึงเปลี่ยน y เป็น i แล้วเติม -ed"],
    ["apply", "applied", ["applyed", "applyied", "appled"], "หน้า y เป็นพยัญชนะ จึงเปลี่ยน y เป็น i แล้วเติม -ed"],
    ["tidy", "tidied", ["tidyed", "tidyied", "tidyd"], "หน้า y เป็นพยัญชนะ จึงเปลี่ยน y เป็น i แล้วเติม -ed"],
    ["spy", "spied", ["spyed", "spyied", "spyd"], "หน้า y เป็นพยัญชนะ จึงเปลี่ยน y เป็น i แล้วเติม -ed"],
    ["dry", "dried", ["dryed", "dryied", "dryd"], "หน้า y เป็นพยัญชนะ จึงเปลี่ยน y เป็น i แล้วเติม -ed"],
    ["fry", "fried", ["fryed", "fryied", "fryd"], "หน้า y เป็นพยัญชนะ จึงเปลี่ยน y เป็น i แล้วเติม -ed"],
    ["marry", "married", ["marryed", "marryied", "marred"], "หน้า y เป็นพยัญชนะ จึงเปลี่ยน y เป็น i แล้วเติม -ed"]
  ],
  doubleCvc: [
    ["stop", "stopped", ["stoped", "stopied", "stopd"]],
    ["plan", "planned", ["planed", "planied", "pland"]],
    ["drop", "dropped", ["droped", "dropd", "dropied"]],
    ["rob", "robbed", ["robed", "robd", "robied"]],
    ["clap", "clapped", ["claped", "clapd", "clapied"]],
    ["grab", "grabbed", ["grabed", "grabd", "grabied"]],
    ["hug", "hugged", ["huged", "hugd", "hugied"]],
    ["beg", "begged", ["beged", "begd", "begied"]],
    ["fit", "fitted", ["fited", "fitd", "fitied"]],
    ["rub", "rubbed", ["rubed", "rubd", "rubied"]],
    ["nod", "nodded", ["noded", "nodd", "nodied"]],
    ["skip", "skipped", ["skiped", "skipd", "skipied"]],
    ["slip", "slipped", ["sliped", "slipd", "slipied"]],
    ["chat", "chatted", ["chated", "chatd", "chatied"]],
    ["shop", "shopped", ["shoped", "shopd", "shopied"]],
    ["tap", "tapped", ["taped", "tapd", "tapied"]],
    ["step", "stepped", ["steped", "stepd", "stepied"]],
    ["wrap", "wrapped", ["wraped", "wrapd", "wrapied"]],
    ["trim", "trimmed", ["trimed", "trimd", "trimied"]],
    ["drag", "dragged", ["draged", "dragd", "dragied"]],
    ["admit", "admitted", ["admited", "admitd", "admitied"]],
    ["permit", "permitted", ["permited", "permitd", "permitied"]],
    ["prefer", "preferred", ["prefered", "preferd", "preferied"]],
    ["occur", "occurred", ["occured", "occurd", "occuried"]],
    ["control", "controlled", ["controled", "controld", "controlied"]]
  ]
};

function makeRegularQuestion([verb, answer, distractors, note], ruleText) {
  return {
    baseVerb: verb,
    prompt: `${verb} ->`,
    options: [answer, ...distractors],
    answer,
    explanation: `${verb} ในรูปอดีตที่ถูกต้องคือ ${answer}${note ? ` เพราะ${note}` : ` เพราะ${ruleText}`}`
  };
}

function makeRegularQuestionsExcluding(bank, ruleText, excludedVerbs = []) {
  const excluded = new Set(excludedVerbs);
  return bank
    .filter(([verb]) => !excluded.has(verb))
    .map(item => makeRegularQuestion(item, ruleText));
}

const regularRuleOneQuestions = regularVerbBanks.addEd
  .filter(([verb]) => !["walk", "jump", "clean", "watch", "help", "open"].includes(verb))
  .map(item => makeRegularQuestion(item, "คำกริยาทั่วไปเติม -ed"));

const regularRuleTwoQuestions = regularVerbBanks.endingE
  .filter(([verb]) => !["like", "love", "dance", "close", "live", "move"].includes(verb))
  .map(item => makeRegularQuestion(item, "คำลงท้ายด้วย e เติมแค่ -d"));

const regularRuleThreeQuestions = regularVerbBanks.endingY
  .filter(([verb]) => !["play", "enjoy", "stay", "obey", "study", "cry"].includes(verb))
  .map(item => makeRegularQuestion(item, "ต้องดูตัวอักษรก่อน y"));

const regularRuleFourQuestions = regularVerbBanks.doubleCvc
  .filter(([verb]) => !["stop", "plan", "drop", "clap", "grab", "hug"].includes(verb))
  .map(item => makeRegularQuestion(item, "คำสั้นบางคำเพิ่มพยัญชนะท้ายก่อนเติม -ed"));

const sentenceQuestionBanks = {
  regularEd: [
    { id: "regular_ed_watch_sentence_01", type: "sentence-fill", lessonId: "regular-rule-1", ruleId: "regular_ed", baseVerb: "watch", sentence: "Yesterday, I ____ a movie with my family.", options: ["watched", "watch", "watches", "watching"], answer: "watched", explanation: "Yesterday บอกอดีต และ watch เป็น Regular Verb จึงเติม -ed เป็น watched" },
    { id: "regular_ed_visit_sentence_02", type: "sentence-fill", lessonId: "regular-rule-1", ruleId: "regular_ed", baseVerb: "visit", sentence: "Last week, we ____ our grandmother.", options: ["visited", "visit", "visits", "visiting"], answer: "visited", explanation: "Last week บอกอดีต จึงใช้ visited" },
    { id: "regular_ed_clean_sentence_03", type: "sentence-fill", lessonId: "regular-rule-1", ruleId: "regular_ed", baseVerb: "clean", sentence: "She ____ her room yesterday.", options: ["cleaned", "clean", "cleans", "cleaning"], answer: "cleaned", explanation: "clean เป็นคำกริยาทั่วไป เติม -ed เป็น cleaned" },
    { id: "regular_ed_open_sentence_04", type: "sentence-fill", lessonId: "regular-rule-1", ruleId: "regular_ed", baseVerb: "open", sentence: "He ____ the door a minute ago.", options: ["opened", "open", "opens", "opening"], answer: "opened", explanation: "a minute ago บอกอดีต จึงใช้ opened" },
    { id: "regular_ed_work_sentence_05", type: "sentence-fill", lessonId: "regular-rule-1", ruleId: "regular_ed", baseVerb: "work", sentence: "They ____ hard yesterday.", options: ["worked", "work", "works", "working"], answer: "worked", explanation: "work เป็น Regular Verb เติม -ed เป็น worked" }
  ],
  endingE: [
    { id: "ending_e_like_sentence_01", type: "sentence-fill", lessonId: "regular-rule-2", ruleId: "ending_e_add_d", baseVerb: "like", sentence: "I ____ the story yesterday.", options: ["liked", "like", "likes", "likeed"], answer: "liked", explanation: "like ลงท้ายด้วย e อยู่แล้ว จึงเติมแค่ -d เป็น liked" },
    { id: "ending_e_dance_sentence_02", type: "sentence-fill", lessonId: "regular-rule-2", ruleId: "ending_e_add_d", baseVerb: "dance", sentence: "She ____ at the school show last night.", options: ["danced", "dance", "dances", "danceed"], answer: "danced", explanation: "dance ลงท้ายด้วย e จึงเติมแค่ -d เป็น danced" },
    { id: "ending_e_arrive_sentence_03", type: "sentence-fill", lessonId: "regular-rule-2", ruleId: "ending_e_add_d", baseVerb: "arrive", sentence: "The bus ____ late yesterday.", options: ["arrived", "arrive", "arrives", "arriveed"], answer: "arrived", explanation: "arrive ลงท้ายด้วย e จึงเติมแค่ -d เป็น arrived" },
    { id: "ending_e_use_sentence_04", type: "sentence-fill", lessonId: "regular-rule-2", ruleId: "ending_e_add_d", baseVerb: "use", sentence: "We ____ the new computer last Monday.", options: ["used", "use", "uses", "useed"], answer: "used", explanation: "use ลงท้ายด้วย e จึงเติมแค่ -d เป็น used" },
    { id: "ending_e_close_sentence_05", type: "sentence-fill", lessonId: "regular-rule-2", ruleId: "ending_e_add_d", baseVerb: "close", sentence: "He ____ the window before the rain came.", options: ["closed", "close", "closes", "closeed"], answer: "closed", explanation: "close ลงท้ายด้วย e จึงเติมแค่ -d เป็น closed" }
  ],
  endingY: [
    { id: "y_rule_play_sentence_01", type: "sentence-fill", lessonId: "regular-rule-3", ruleId: "y_rule", baseVerb: "play", sentence: "They ____ football yesterday.", options: ["played", "play", "plays", "playied"], answer: "played", explanation: "play มีสระหน้า y จึงเติม -ed เป็น played" },
    { id: "y_rule_study_sentence_02", type: "sentence-fill", lessonId: "regular-rule-3", ruleId: "y_rule", baseVerb: "study", sentence: "She ____ English last night.", options: ["studied", "studyed", "study", "studying"], answer: "studied", explanation: "study มีพยัญชนะหน้า y จึงเปลี่ยน y เป็น i แล้วเติม -ed เป็น studied" },
    { id: "y_rule_try_sentence_03", type: "sentence-fill", lessonId: "regular-rule-3", ruleId: "y_rule", baseVerb: "try", sentence: "He ____ to open the old gate.", options: ["tried", "tryed", "try", "trying"], answer: "tried", explanation: "try เปลี่ยน y เป็น i แล้วเติม -ed เป็น tried" },
    { id: "y_rule_enjoy_sentence_04", type: "sentence-fill", lessonId: "regular-rule-3", ruleId: "y_rule", baseVerb: "enjoy", sentence: "We ____ the magic lesson yesterday.", options: ["enjoyed", "enjoied", "enjoy", "enjoying"], answer: "enjoyed", explanation: "enjoy มีสระหน้า y จึงเติม -ed เป็น enjoyed" },
    { id: "y_rule_carry_sentence_05", type: "sentence-fill", lessonId: "regular-rule-3", ruleId: "y_rule", baseVerb: "carry", sentence: "The boy ____ a small lantern last night.", options: ["carried", "carryed", "carry", "carrying"], answer: "carried", explanation: "carry มีพยัญชนะหน้า y จึงเปลี่ยน y เป็น i แล้วเติม -ed เป็น carried" }
  ],
  doubleCvc: [
    { id: "cvc_stop_sentence_01", type: "sentence-fill", lessonId: "regular-rule-4", ruleId: "cvc_double", baseVerb: "stop", sentence: "The cart ____ near the old tower.", options: ["stopped", "stoped", "stop", "stopping"], answer: "stopped", explanation: "stop เป็นคำสั้นแบบ CVC จึงเพิ่ม p แล้วเติม -ed เป็น stopped" },
    { id: "cvc_plan_sentence_02", type: "sentence-fill", lessonId: "regular-rule-4", ruleId: "cvc_double", baseVerb: "plan", sentence: "We ____ the journey yesterday.", options: ["planned", "planed", "plan", "planning"], answer: "planned", explanation: "plan เพิ่ม n แล้วเติม -ed เป็น planned" },
    { id: "cvc_drop_sentence_03", type: "sentence-fill", lessonId: "regular-rule-4", ruleId: "cvc_double", baseVerb: "drop", sentence: "He ____ the crystal on the floor.", options: ["dropped", "droped", "drop", "dropping"], answer: "dropped", explanation: "drop เพิ่ม p แล้วเติม -ed เป็น dropped" },
    { id: "cvc_clap_sentence_04", type: "sentence-fill", lessonId: "regular-rule-4", ruleId: "cvc_double", baseVerb: "clap", sentence: "The students ____ after the spell worked.", options: ["clapped", "claped", "clap", "clapping"], answer: "clapped", explanation: "clap เพิ่ม p แล้วเติม -ed เป็น clapped" },
    { id: "cvc_hug_sentence_05", type: "sentence-fill", lessonId: "regular-rule-4", ruleId: "cvc_double", baseVerb: "hug", sentence: "The child ____ the little dragon.", options: ["hugged", "huged", "hug", "hugging"], answer: "hugged", explanation: "hug เพิ่ม g แล้วเติม -ed เป็น hugged" }
  ],
  irregular: [
    { id: "irregular_go_sentence_01", type: "sentence-fill", lessonId: "irregular-lesson", ruleId: "irregular_v2", baseVerb: "go", sentence: "Yesterday, I ____ to school.", options: ["went", "go", "goes", "going"], answer: "went", explanation: "go เป็น Irregular Verb รูป V2 คือ went" },
    { id: "irregular_eat_sentence_02", type: "sentence-fill", lessonId: "irregular-lesson", ruleId: "irregular_v2", baseVerb: "eat", sentence: "Last night, we ____ dinner together.", options: ["ate", "eat", "eats", "eating"], answer: "ate", explanation: "eat เป็น Irregular Verb รูป V2 คือ ate" },
    { id: "irregular_see_sentence_03", type: "sentence-fill", lessonId: "irregular-lesson", ruleId: "irregular_v2", baseVerb: "see", sentence: "She ____ a bright star yesterday.", options: ["saw", "see", "sees", "seeing"], answer: "saw", explanation: "see เป็น Irregular Verb รูป V2 คือ saw" },
    { id: "irregular_buy_sentence_04", type: "sentence-fill", lessonId: "irregular-lesson", ruleId: "irregular_v2", baseVerb: "buy", sentence: "He ____ a new book last week.", options: ["bought", "buy", "buys", "buying"], answer: "bought", explanation: "buy เป็น Irregular Verb รูป V2 คือ bought" },
    { id: "irregular_take_sentence_05", type: "sentence-fill", lessonId: "irregular-lesson", ruleId: "irregular_v2", baseVerb: "take", sentence: "They ____ the key from the old chest.", options: ["took", "take", "takes", "taking"], answer: "took", explanation: "take เป็น Irregular Verb รูป V2 คือ took" }
  ]
};

function copyQuestionBank(questions, prefix) {
  return questions.map((question, index) => ({
    ...question,
    id: `${prefix}_${question.id || index + 1}`
  }));
}

const edForgerQuestions = [
  ...regularVerbBanks.addEd.filter(([verb]) => !["walk", "jump", "clean", "watch", "help", "open"].includes(verb)).slice(0, 8),
  ...regularVerbBanks.endingE.filter(([verb]) => !["like", "love", "dance", "close", "live", "move"].includes(verb)).slice(0, 8),
  ...regularVerbBanks.endingY.filter(([verb]) => !["play", "enjoy", "stay", "obey", "study", "cry"].includes(verb)).slice(0, 8),
  ...regularVerbBanks.doubleCvc.filter(([verb]) => !["stop", "plan", "drop", "clap", "grab", "hug"].includes(verb)).slice(0, 8)
].map(item => makeRegularQuestion(item, "เลือกการสะกดรูปอดีตที่ถูกต้อง"))
  .concat(
    copyQuestionBank(sentenceQuestionBanks.regularEd, "ed_forger"),
    copyQuestionBank(sentenceQuestionBanks.endingE, "ed_forger"),
    copyQuestionBank(sentenceQuestionBanks.endingY, "ed_forger"),
    copyQuestionBank(sentenceQuestionBanks.doubleCvc, "ed_forger")
  );

const regularRuleMetaByVerb = {};

function registerRegularRuleMeta(items, lessonId, ruleId) {
  items.forEach(([verb]) => {
    regularRuleMetaByVerb[verb] = { lessonId, ruleId };
  });
}

function applyRegularRuleMeta(questions, fallbackLessonId = "", fallbackRuleId = "") {
  questions.forEach(question => {
    const meta = regularRuleMetaByVerb[question.baseVerb] || {};
    question.lessonId = question.lessonId || meta.lessonId || fallbackLessonId;
    question.ruleId = question.ruleId || meta.ruleId || fallbackRuleId;
  });
  return questions;
}

registerRegularRuleMeta(regularVerbBanks.addEd, "regular-rule-1", "regular_ed");
registerRegularRuleMeta(regularVerbBanks.endingE, "regular-rule-2", "ending_e_add_d");
registerRegularRuleMeta(regularVerbBanks.endingY, "regular-rule-3", "y_rule");
registerRegularRuleMeta(regularVerbBanks.doubleCvc, "regular-rule-4", "cvc_double");

applyRegularRuleMeta(regularRuleOneQuestions, "regular-rule-1", "regular_ed");
applyRegularRuleMeta(regularRuleTwoQuestions, "regular-rule-2", "ending_e_add_d");
applyRegularRuleMeta(regularRuleThreeQuestions, "regular-rule-3", "y_rule");
applyRegularRuleMeta(regularRuleFourQuestions, "regular-rule-4", "cvc_double");
applyRegularRuleMeta(edForgerQuestions);

function inferRuleIdFromQuestion(question) {
  const type = question.type || "";
  const regularMeta = regularRuleMetaByVerb[question.baseVerb];
  if (regularMeta && regularMeta.ruleId) {
    return regularMeta.ruleId;
  }
  if (["regular-ed"].includes(type)) {
    return "regular_ed";
  }
  if (["ending-e"].includes(type)) {
    return "ending_e_add_d";
  }
  if (["vowel-y", "consonant-y"].includes(type)) {
    return "y_rule";
  }
  if (["cvc-double", "final-stress", "no-final-stress"].includes(type)) {
    return "cvc_double";
  }
  if (["irregular-v2"].includes(type)) {
    return "irregular_v2";
  }
  if (["did-base", "negative"].includes(type)) {
    return "irregular_v2";
  }
  if (["sentence", "choose-correct", "mixed-rule"].includes(type)) {
    return "irregular_v2";
  }
  if (["sentence-fill", "correct-sentence"].includes(type)) {
    return "final_review";
  }
  return question.ruleId || "";
}

function normalizeQuestionMeta(questions, fallbackLessonId = "", fallbackRuleId = "") {
  questions.forEach((question, index) => {
    question.lessonId = question.lessonId || fallbackLessonId;
    question.ruleId = question.ruleId || inferRuleIdFromQuestion(question) || fallbackRuleId;
    question.id = question.id || getQuestionId(question, index, fallbackLessonId || "question");
  });
  return questions;
}

normalizeQuestionMeta(bossQuestionBanks.edForger, "ed-mini-boss");
normalizeQuestionMeta(bossQuestionBanks.irregularWraith, "irregular-mini-boss", "irregular_v2");
normalizeQuestionMeta(bossQuestionBanks.memoryBreaker, "final-boss");

const irregularVerbBank = [
  ["go", "went", ["goed", "goes", "gone"]],
  ["eat", "ate", ["eated", "eats", "eaten"]],
  ["see", "saw", ["seed", "seen", "seeed"]],
  ["buy", "bought", ["buyed", "buys", "buyt"]],
  ["take", "took", ["taked", "taken", "takeded"]],
  ["come", "came", ["comed", "comes", "comeed"]],
  ["have", "had", ["haved", "has", "hadded"]],
  ["do", "did", ["doed", "does", "doeded"]],
  ["make", "made", ["maked", "makes", "makeed"]],
  ["write", "wrote", ["writed", "written", "writeed"]],
  ["meet", "met", ["meeted", "meets", "meted"]],
  ["choose", "chose", ["choosed", "chosen", "chooseed"]],
  ["read", "read", ["readed", "reads", "readinged"]],
  ["give", "gave", ["gived", "given", "giveed"]],
  ["get", "got", ["getted", "gets", "geted"]],
  ["speak", "spoke", ["speaked", "spoken", "speeked"]],
  ["break", "broke", ["breaked", "broken", "breakked"]],
  ["bring", "brought", ["bringed", "brang", "bringted"]],
  ["think", "thought", ["thinked", "thunk", "thinkted"]],
  ["teach", "taught", ["teached", "teacht", "teachted"]],
  ["catch", "caught", ["catched", "catcht", "catchted"]],
  ["find", "found", ["finded", "founded", "findted"]],
  ["leave", "left", ["leaved", "leaveded", "leavet"]],
  ["feel", "felt", ["feeled", "feelt", "feeld"]],
  ["keep", "kept", ["keeped", "keept", "keepied"]],
  ["hear", "heard", ["heared", "heart", "hearded"]],
  ["lose", "lost", ["losed", "loosed", "loset"]],
  ["send", "sent", ["sended", "sendted", "sendeded"]],
  ["spend", "spent", ["spended", "spendted", "spendeded"]],
  ["build", "built", ["builded", "buildted", "buildied"]],
  ["sit", "sat", ["sitted", "sited", "sits"]],
  ["run", "ran", ["runned", "runed", "runs"]],
  ["swim", "swam", ["swimmed", "swimed", "swims"]],
  ["sing", "sang", ["singed", "sung", "sings"]],
  ["drink", "drank", ["drinked", "drunk", "drinks"]],
  ["begin", "began", ["beginned", "begined", "begins"]],
  ["fall", "fell", ["falled", "fallen", "falls"]],
  ["fly", "flew", ["flyed", "flied", "flies"]],
  ["grow", "grew", ["growed", "grown", "grows"]],
  ["know", "knew", ["knowed", "known", "knows"]],
  ["throw", "threw", ["throwed", "thrown", "throws"]],
  ["wear", "wore", ["weared", "worn", "wears"]],
  ["say", "said", ["sayed", "says", "saying"]],
  ["tell", "told", ["telled", "telling", "tolded"]],
  ["drive", "drove", ["drived", "driven", "driving"]],
  ["win", "won", ["winned", "winning", "wan"]],
  ["sleep", "slept", ["sleeped", "sleept", "sleeping"]],
  ["stand", "stood", ["standed", "standing", "stands"]],
  ["sell", "sold", ["selled", "selling", "salled"]],
  ["hold", "held", ["holded", "holding", "hald"]],
  ["pay", "paid", ["payed", "payd", "paying"]],
  ["understand", "understood", ["understanded", "understanding", "understands"]]
];

const BOSS_V2_REGULAR_RULE_SOURCES = [
  {
    bankKey: "addEd",
    ruleId: "regular_ed",
    lessonTags: ["regular-rule-1"],
    hint: "คำกริยาทั่วไปเติม -ed"
  },
  {
    bankKey: "endingE",
    ruleId: "ending_e_add_d",
    lessonTags: ["regular-rule-2"],
    hint: "ลงท้ายด้วย e เติม -d"
  },
  {
    bankKey: "endingY",
    ruleId: "y_rule",
    lessonTags: ["regular-rule-3"],
    hint: "ดูตัวอักษรก่อน y แล้วใช้รูปอดีตให้ถูก"
  },
  {
    bankKey: "doubleCvc",
    ruleId: "cvc_double",
    lessonTags: ["regular-rule-4"],
    hint: "คำสั้นบางคำเพิ่มพยัญชนะท้ายก่อนเติม -ed"
  }
];

function makeBossV2WordId(group, v1, v2) {
  return `${group}_${v1}_${v2}`.replace(/[^a-z0-9_]+/g, "_");
}

function isBossV2ArrangementSafe(v1, v2) {
  return /^[a-z]+$/.test(v1) &&
    /^[a-z]+$/.test(v2) &&
    v1 !== v2 &&
    v2.length >= 3 &&
    v2.length <= 10;
}

function buildBossV2ChallengeWords() {
  const words = [];
  BOSS_V2_REGULAR_RULE_SOURCES.forEach(source => {
    (regularVerbBanks[source.bankKey] || []).forEach(([v1, v2]) => {
      if (!isBossV2ArrangementSafe(v1, v2)) {
        return;
      }
      words.push({
        id: makeBossV2WordId("regular", v1, v2),
        group: "regular",
        ruleId: source.ruleId,
        v1,
        v2,
        lessonTags: source.lessonTags,
        hint: source.hint
      });
    });
  });

  irregularVerbBank.forEach(([v1, v2]) => {
    if (!isBossV2ArrangementSafe(v1, v2)) {
      return;
    }
    words.push({
      id: makeBossV2WordId("irregular", v1, v2),
      group: "irregular",
      ruleId: "irregular_v2",
      v1,
      v2,
      lessonTags: ["irregular-lesson"],
      hint: "Irregular Verb ต้องจำรูป V2"
    });
  });

  const seenIds = new Set();
  return words.filter(word => {
    if (seenIds.has(word.id)) {
      console.warn("[Vocabulary] Duplicate boss V2 word id skipped", word.id);
      return false;
    }
    seenIds.add(word.id);
    return true;
  });
}

BOSS_V2_CHALLENGE_WORDS = buildBossV2ChallengeWords();

function getVocabularyCoverageReport() {
  const bossWordsByGroup = BOSS_V2_CHALLENGE_WORDS.reduce((groups, word) => {
    const key = word.group || "unknown";
    groups[key] = (groups[key] || 0) + 1;
    return groups;
  }, {});
  const bossWordsByRule = BOSS_V2_CHALLENGE_WORDS.reduce((groups, word) => {
    const key = word.ruleId || "unknown";
    groups[key] = (groups[key] || 0) + 1;
    return groups;
  }, {});
  const ids = BOSS_V2_CHALLENGE_WORDS.map(word => word.id);
  const pairs = BOSS_V2_CHALLENGE_WORDS.map(word => `${word.v1}->${word.v2}`);
  return [
    { sectionId: "regular-rule-1", totalWords: regularVerbBanks.addEd.length },
    { sectionId: "regular-rule-2", totalWords: regularVerbBanks.endingE.length },
    {
      sectionId: "regular-rule-3-consonant-y",
      totalWords: regularVerbBanks.endingY.filter(([verb]) => /[^aeiou]y$/.test(verb)).length
    },
    {
      sectionId: "regular-rule-3-vowel-y",
      totalWords: regularVerbBanks.endingY.filter(([verb]) => /[aeiou]y$/.test(verb)).length
    },
    { sectionId: "regular-rule-4", totalWords: regularVerbBanks.doubleCvc.length },
    { sectionId: "irregular-lesson", totalWords: irregularVerbBank.length },
    {
      sectionId: "boss-v2-regular",
      totalWords: bossWordsByGroup.regular || 0,
      typingEligible: bossWordsByGroup.regular || 0,
      arrangementEligible: bossWordsByGroup.regular || 0
    },
    {
      sectionId: "boss-v2-irregular",
      totalWords: bossWordsByGroup.irregular || 0,
      typingEligible: bossWordsByGroup.irregular || 0,
      arrangementEligible: bossWordsByGroup.irregular || 0
    },
    {
      sectionId: "boss-v2-duplicates",
      duplicateIds: ids.length - new Set(ids).size,
      duplicatePairs: pairs.length - new Set(pairs).size
    },
    {
      sectionId: "boss-v2-by-rule",
      totalWords: BOSS_V2_CHALLENGE_WORDS.length,
      regularEd: bossWordsByRule.regular_ed || 0,
      endingE: bossWordsByRule.ending_e_add_d || 0,
      yRule: bossWordsByRule.y_rule || 0,
      cvcDouble: bossWordsByRule.cvc_double || 0,
      irregular: bossWordsByRule.irregular_v2 || 0
    }
  ];
}

if (typeof window !== "undefined") {
  window.getVocabularyCoverageReport = getVocabularyCoverageReport;
}

function makeIrregularQuestion([verb, answer, distractors]) {
  return {
    lessonId: "irregular-lesson",
    ruleId: "irregular_v2",
    baseVerb: verb,
    prompt: `${verb} ->`,
    options: [answer, ...distractors],
    answer,
    explanation: `${verb} เป็น Irregular Verb รูป V2 คือ ${answer}`
  };
}

const irregularPracticeQuestions = [
  ...irregularVerbBank.slice(6, 14).map(makeIrregularQuestion),
  { id: "irregular_speak_sentence_00", type: "sentence-fill", ruleId: "irregular_v2", lessonId: "irregular-lesson", baseVerb: "speak", sentence: "Yesterday, I ____ to the old book.", options: ["spoke", "speaked", "speaks", "speaking"], answer: "spoke", explanation: "speak เป็น Irregular Verb รูป V2 คือ spoke" },
  ...copyQuestionBank(sentenceQuestionBanks.irregular, "irregular_practice")
];

const irregularWraithQuestions = irregularVerbBank
  .slice(14)
  .map(makeIrregularQuestion)
  .concat(copyQuestionBank(sentenceQuestionBanks.irregular, "irregular_wraith"));

const finalBossQuestions = [
  makeRegularQuestion(regularVerbBanks.addEd[8], "คำกริยาทั่วไปเติม -ed"),
  makeRegularQuestion(regularVerbBanks.endingE[7], "คำลงท้ายด้วย e เติมแค่ -d"),
  makeRegularQuestion(regularVerbBanks.endingY[9], "หน้า y เป็นพยัญชนะ เปลี่ยน y เป็น i แล้วเติม -ed"),
  makeRegularQuestion(regularVerbBanks.doubleCvc[7], "เพิ่มพยัญชนะท้ายก่อนเติม -ed"),
  makeIrregularQuestion(irregularVerbBank[8]),
  makeIrregularQuestion(irregularVerbBank[9]),
  makeIrregularQuestion(irregularVerbBank[11]),
  makeIrregularQuestion(irregularVerbBank[16]),
  { type: "sentence-fill", sentence: "Yesterday, I ____ to school.", options: ["went", "go", "goes", "going"], answer: "went", explanation: "Yesterday บอกอดีต จึงต้องใช้ V2 คือ went" },
  { type: "sentence-fill", sentence: "Last night, she ____ a movie.", options: ["watched", "watch", "watches", "watching"], answer: "watched", explanation: "Last night บอกอดีต และ watch เป็น Regular Verb เติม -ed เป็น watched" },
  { type: "sentence-fill", sentence: "Two days ago, we ____ dinner together.", options: ["ate", "eat", "eats", "eating"], answer: "ate", explanation: "eat เป็น Irregular Verb รูป V2 คือ ate" },
  { type: "sentence-fill", sentence: "Last week, he ____ a new book.", options: ["bought", "buy", "buys", "buying"], answer: "bought", explanation: "buy เป็น Irregular Verb รูป V2 คือ bought" },
  { type: "sentence-fill", sentence: "My mother ____ breakfast this morning.", options: ["cooked", "cook", "cooks", "cooking"], answer: "cooked", explanation: "ถ้าเหตุการณ์เมื่อเช้าจบแล้ว ถือเป็นอดีต จึงใช้ cooked" },
  { type: "sentence-fill", sentence: "He ____ his homework last night.", options: ["did", "do", "does", "doing"], answer: "did", explanation: "do เป็น Irregular Verb รูป V2 คือ did" },
  { type: "sentence-fill", sentence: "They ____ English yesterday.", options: ["studied", "studyed", "study", "studying"], answer: "studied", explanation: "study เปลี่ยน y เป็น i แล้วเติม -ed เป็น studied" },
  { type: "correct-sentence", prompt: "เลือกประโยคที่ถูกต้อง", options: ["Yesterday, I went to school.", "Yesterday, I go to school.", "Yesterday, I goes to school.", "Yesterday, I going to school."], answer: "Yesterday, I went to school.", explanation: "Yesterday บอกอดีต จึงต้องใช้ went" },
  { type: "correct-sentence", prompt: "เลือกประโยคที่ถูกต้อง", options: ["Last night, she saw a bird.", "Last night, she see a bird.", "Last night, she sees a bird.", "Last night, she seeing a bird."], answer: "Last night, she saw a bird.", explanation: "see ในรูป V2 คือ saw" },
  { type: "correct-sentence", prompt: "เลือกประโยคที่ถูกต้อง", options: ["We watched TV yesterday.", "We watch TV yesterday.", "We watches TV yesterday.", "We watching TV yesterday."], answer: "We watched TV yesterday.", explanation: "watch ใช้ในอดีตเป็น watched" },
  { type: "correct-sentence", prompt: "เลือกประโยคที่ถูกต้อง", options: ["I studied English last night.", "I studyed English last night.", "I studying English last night.", "I studies English last night."], answer: "I studied English last night.", explanation: "study ต้องเปลี่ยน y เป็น i แล้วเติม -ed เป็น studied" },
  { type: "sentence-fill", sentence: "She ____ her old friend yesterday.", options: ["met", "meet", "meets", "meeting"], answer: "met", explanation: "meet เป็น Irregular Verb รูป V2 คือ met" },
  ...copyQuestionBank(sentenceQuestionBanks.regularEd, "final_boss"),
  ...copyQuestionBank(sentenceQuestionBanks.endingE, "final_boss"),
  ...copyQuestionBank(sentenceQuestionBanks.endingY, "final_boss"),
  ...copyQuestionBank(sentenceQuestionBanks.doubleCvc, "final_boss"),
  ...copyQuestionBank(sentenceQuestionBanks.irregular, "final_boss")
];

const phase1PastMeaningQuestions = [
  { id: "phase1-past-meaning-1", prompt: "ข้อใดคืออดีต", options: ["สิ่งที่เกิดขึ้นแล้ว", "สิ่งที่กำลังจะเกิด", "สิ่งที่ยังไม่เริ่ม"], answer: "สิ่งที่เกิดขึ้นแล้ว", explanation: "อดีตคือสิ่งที่เกิดขึ้นแล้วและจบลงแล้ว" },
  { id: "phase1-past-meaning-2", prompt: "Which phrase shows the past?", options: ["next week", "last Monday", "tomorrow", "soon"], answer: "last Monday", explanation: "ถูกต้อง last Monday บอกว่าเหตุการณ์เกิดขึ้นแล้ว" },
  { id: "phase1-past-meaning-3", prompt: "Which phrase means something happened before now?", options: ["a few minutes ago", "next year", "every day", "soon"], answer: "a few minutes ago", explanation: "ถูกต้อง ago เป็นสัญญาณว่าเหตุการณ์ผ่านมาแล้ว" },
  { id: "phase1-past-meaning-4", prompt: "Which sentence talks about the past?", options: ["I will eat dinner tomorrow.", "I ate breakfast earlier this morning.", "I am studying now.", "I play football every day."], answer: "I ate breakfast earlier this morning.", explanation: "ถูกต้อง earlier this morning ถ้าเกิดจบแล้ว ถือเป็นอดีตได้" },
  { id: "phase1-past-meaning-5", prompt: "Many years ago means:", options: ["in the future", "at this moment", "in the past", "every morning"], answer: "in the past", explanation: "ถูกต้อง many years ago ใช้เล่าเรื่องในอดีต" },
  { id: "phase1-past-meaning-6", prompt: "Which one is NOT a past time clue?", options: ["last weekend", "three years ago", "yesterday evening", "next Monday"], answer: "next Monday", explanation: "next Monday เป็นอนาคต ไม่ใช่อดีต" },
  { id: "phase1-past-meaning-7", prompt: "Which phrase is used in stories to talk about the past?", options: ["one night", "right now", "next time", "tomorrow"], answer: "one night", explanation: "ถูกต้อง one night ใช้เปิดเหตุการณ์ในเรื่องเล่าอดีตได้" },
  { id: "phase1-past-meaning-8", prompt: "Which phrase shows a past date?", options: ["in 2018", "next year", "now", "soon"], answer: "in 2018", explanation: "ถูกต้อง in 2018 เป็นวันที่ผ่านมาแล้ว" }
];

const phase1PastTimeWordsQuestions = [
  { id: "phase1-time-words-1", prompt: "Which one is a past time expression?", options: ["next week", "last summer", "now", "soon"], answer: "last summer", explanation: "ถูกต้อง last summer เป็นคำบอกเวลาในอดีต" },
  { id: "phase1-time-words-2", prompt: "Which one is NOT a past time expression?", options: ["five years ago", "yesterday morning", "next Friday", "long ago"], answer: "next Friday", explanation: "next Friday เป็นเรื่องอนาคต ไม่ใช่อดีต" },
  { id: "phase1-time-words-3", prompt: "Choose the past time expression.", options: ["earlier today", "tomorrow morning", "next month", "soon"], answer: "earlier today", explanation: "ถูกต้อง earlier today เกิดก่อนตอนนี้แล้ว" },
  { id: "phase1-time-words-4", prompt: "Which phrase can begin a story about the past?", options: ["Long ago", "Right now", "Next week", "Soon"], answer: "Long ago", explanation: "ถูกต้อง Long ago ใช้เปิดเรื่องเล่าในอดีต" },
  { id: "phase1-time-words-5", prompt: "Which phrase shows a finished time?", options: ["in 2018", "next year", "every day", "now"], answer: "in 2018", explanation: "ถูกต้อง in 2018 เป็นปีที่ผ่านไปแล้ว" },
  { id: "phase1-time-words-6", prompt: "Which sentence should use Past Simple?", options: ["I will visit my friend tomorrow.", "I visited my friend last weekend.", "I visit my friend every day.", "I am visiting my friend now."], answer: "I visited my friend last weekend.", explanation: "ถูกต้อง last weekend บอกว่าเหตุการณ์เกิดขึ้นแล้ว" },
  { id: "phase1-time-words-7", prompt: "Which phrase means ก่อนเข้าเรียน?", options: ["before class", "after tomorrow", "next class", "every class"], answer: "before class", explanation: "ถูกต้อง before class แปลว่า ก่อนเข้าเรียน" },
  { id: "phase1-time-words-8", prompt: "When I was a child talks about:", options: ["the past", "the future", "right now", "every day"], answer: "the past", explanation: "ถูกต้อง วลีนี้พูดถึงช่วงเวลาตอนเด็กในอดีต" }
];

const phase1WasWereQuestions = [
  { id: "phase1-was-were-1", prompt: "He ____ sick yesterday.", options: ["was", "were", "is"], answer: "was", explanation: "He ใช้ was ในอดีต" },
  { id: "phase1-was-were-2", prompt: "We ____ at the market last Sunday.", options: ["were", "was", "are"], answer: "were", explanation: "We ใช้ were" },
  { id: "phase1-was-were-3", prompt: "The cat ____ under the chair last night.", options: ["was", "were", "are"], answer: "was", explanation: "The cat เป็นสิ่งเดียว ใช้ was" },
  { id: "phase1-was-were-4", prompt: "You ____ late yesterday.", options: ["were", "was", "am"], answer: "were", explanation: "You ใช้ were" },
  { id: "phase1-was-were-5", prompt: "My friends ____ happy after the game.", options: ["were", "was", "is"], answer: "were", explanation: "My friends เป็นหลายคน ใช้ were" },
  { id: "phase1-was-were-6", prompt: "ข้อใดถูกต้อง", options: ["She was angry.", "She were angry.", "She is angry yesterday."], answer: "She was angry.", explanation: "She ใช้ was ในอดีต" },
  { id: "phase1-was-were-7", prompt: "It ____ dark in the cave.", options: ["was", "were", "are"], answer: "was", explanation: "It ใช้ was" },
  { id: "phase1-was-were-8", prompt: "The doors ____ open last night.", options: ["were", "was", "is"], answer: "were", explanation: "The doors มีหลายบาน ใช้ were" }
];

const phase1ThereWasWereQuestions = [
  { id: "phase1-there-1", prompt: "____ a book on the desk.", options: ["There was", "There were", "There are"], answer: "There was", explanation: "a book เป็นสิ่งเดียว จึงใช้ There was" },
  { id: "phase1-there-2", prompt: "____ three birds in the sky.", options: ["There were", "There was", "There is"], answer: "There were", explanation: "three birds มีหลายตัว จึงใช้ There were" },
  { id: "phase1-there-3", prompt: "There ____ one chair near the wall.", options: ["was", "were", "are"], answer: "was", explanation: "one chair มีหนึ่งตัว ใช้ was" },
  { id: "phase1-there-4", prompt: "There ____ many students in the hall.", options: ["were", "was", "is"], answer: "were", explanation: "many students มีหลายคน ใช้ were" },
  { id: "phase1-there-5", prompt: "ข้อใดถูกต้อง", options: ["There was a dog near the gate.", "There were a dog near the gate.", "There are a dog near the gate."], answer: "There was a dog near the gate.", explanation: "a dog เป็นสิ่งเดียว ใช้ There was" },
  { id: "phase1-there-6", prompt: "ข้อใดใช้กับ five boxes", options: ["There were five boxes.", "There was five boxes.", "There is five boxes."], answer: "There were five boxes.", explanation: "five boxes มีหลายกล่อง ใช้ There were" },
  { id: "phase1-there-7", prompt: "There was ใช้กับอะไร", options: ["สิ่งเดียว", "หลายสิ่ง", "อนาคต"], answer: "สิ่งเดียว", explanation: "There was ใช้กับเอกพจน์ในอดีต" },
  { id: "phase1-there-8", prompt: "There were ใช้กับอะไร", options: ["หลายสิ่ง", "สิ่งเดียว", "I"], answer: "หลายสิ่ง", explanation: "There were ใช้กับพหูพจน์ในอดีต" }
];

const phase1HadQuestions = [
  { id: "phase1-had-1", prompt: "Yesterday, he ____ a red notebook.", options: ["had", "has", "have"], answer: "had", explanation: "ในอดีตใช้ had" },
  { id: "phase1-had-2", prompt: "Last week, we ____ an English test.", options: ["had", "have", "has"], answer: "had", explanation: "we ในอดีตใช้ had" },
  { id: "phase1-had-3", prompt: "They ____ lunch at noon yesterday.", options: ["had", "have", "has"], answer: "had", explanation: "They ในอดีตใช้ had" },
  { id: "phase1-had-4", prompt: "My sister ____ a fever last night.", options: ["had", "has", "have"], answer: "had", explanation: "My sister ในอดีตใช้ had" },
  { id: "phase1-had-5", prompt: "had แปลว่าอะไรในบทนี้", options: ["มีแล้วในอดีต", "กำลังมี", "จะมี"], answer: "มีแล้วในอดีต", explanation: "had ใช้พูดถึงการมีในอดีต" },
  { id: "phase1-had-6", prompt: "ข้อใดถูกต้อง", options: ["She had a cold yesterday.", "She has a cold yesterday.", "She have a cold yesterday."], answer: "She had a cold yesterday.", explanation: "yesterday เป็นอดีต จึงใช้ had" },
  { id: "phase1-had-7", prompt: "have ในอดีตเปลี่ยนเป็นอะไร", options: ["had", "haved", "has"], answer: "had", explanation: "have เป็น Irregular Verb รูปอดีตคือ had" },
  { id: "phase1-had-8", prompt: "has ในอดีตเปลี่ยนเป็นอะไร", options: ["had", "hased", "have"], answer: "had", explanation: "has ในอดีตก็ใช้ had" }
];

normalizeQuestionMeta(regularRuleOneQuestions, "regular-rule-1", "regular_ed");
normalizeQuestionMeta(regularRuleTwoQuestions, "regular-rule-2", "ending_e_add_d");
normalizeQuestionMeta(regularRuleThreeQuestions, "regular-rule-3", "y_rule");
normalizeQuestionMeta(regularRuleFourQuestions, "regular-rule-4", "cvc_double");
normalizeQuestionMeta(edForgerQuestions, "ed-mini-boss");
normalizeQuestionMeta(irregularPracticeQuestions, "irregular-lesson", "irregular_v2");
normalizeQuestionMeta(irregularWraithQuestions, "irregular-mini-boss", "irregular_v2");
normalizeQuestionMeta(finalBossQuestions, "final-boss");
normalizeQuestionMeta(phase1PastMeaningQuestions, "what-is-past", "pastMeaning");
normalizeQuestionMeta(phase1PastTimeWordsQuestions, "what-is-tense", "pastTimeWords");
normalizeQuestionMeta(phase1WasWereQuestions, "act1_phase1_unit3_was_were", "wasWere");
normalizeQuestionMeta(phase1ThereWasWereQuestions, "act1_phase1_unit4_there_was_were", "thereWasWere");
normalizeQuestionMeta(phase1HadQuestions, "act1_phase1_unit5_had", "hadPast");

const PAST_FRAGMENT_ACT = {
  id: "past-fragment",
  title: "ACT: The Past Fragment",
  subtitle: "ภารกิจฟื้นคืนอดีตด้วยคำกริยาช่องที่ 2",
  reward: "Past Fragment",
  badge: "ผู้ฟื้นคืนอดีต",
  objectives: [
    "เข้าใจอดีต ปัจจุบัน และอนาคตจากตัวอย่างภาษาไทย",
    "เข้าใจแนวคิด tense ว่าภาษาอังกฤษเปลี่ยนรูปกริยาเพื่อบอกเวลา",
    "ใช้ V2 เพื่อเล่าเหตุการณ์ที่เกิดขึ้นแล้ว",
    "เติม -ed / -d ให้ Regular Verbs ได้ถูกต้อง",
    "จำและใช้ Irregular Verbs พื้นฐานได้",
    "เลือก V2 ในประโยค Past Simple ได้"
  ],
  stages: [
    {
      id: "prologue",
      type: "story",
      title: "เงาแห่งอดีตที่แตกสลาย",
      dialogues: [
        { speaker: "ระบบบรรยาย", text: "\"ประตูแห่งอดีตเปิดออกพร้อมหมอกสีม่วง เศษประโยคผิดรูปลอยอยู่รอบหอคอยแห่ง Unity\"" },
        { speaker: "ระบบบรรยาย", text: "\"Yesterday, I go to school. Last night, she eat dinner. Two days ago, they play football. ประโยคเหล่านั้นแตกร้าวราวกับความทรงจำที่ถูกเล่าผิด\"" },
        { speaker: "ผู้พเนจร", text: "\"ทำไมประโยคพวกนี้ถึงแตกออกครับ?\"" },
        { speaker: "มาสเตอร์เวรีออน", text: "\"เพราะมันกำลังเล่าเรื่องในอดีต แต่หัวใจของประโยคยังติดอยู่ในปัจจุบัน ก่อนจะใช้ V2 ได้ เจ้าต้องเข้าใจก่อนว่าอดีตคืออะไร\"" }
      ]
    },
    {
      id: "what-is-past",
      type: "lesson-quiz",
      title: "What is the Past?",
      thaiTitle: "อดีตคืออะไร",
      phase: "Act 1 Phase 1",
      phaseTitle: "Entering the Past",
      enemy: "Time Dust Sprite",
      thaiEnemy: "ภูตฝุ่นเวลา",
      enemyMaxHp: 55,
      completionKey: "introCompleted",
      reward: { grammaria: 20, fragment: "Time Dust Spark" },
      lesson: [
        "มาสเตอร์เวรีออน: อดีตคือสิ่งที่เกิดขึ้นแล้ว",
        "เช่น yesterday แปลว่า เมื่อวาน",
        "เมื่อเหตุการณ์จบแล้ว เราเรียกมันว่า past"
      ],
      questions: phase1PastMeaningQuestions
    },
    {
      id: "what-is-tense",
      type: "lesson-quiz",
      title: "Past Time Words",
      thaiTitle: "คำบอกเวลาอดีต",
      phase: "Act 1 Phase 1",
      phaseTitle: "Entering the Past",
      enemy: "Yesterday Mite",
      thaiEnemy: "ไรเมื่อวาน",
      enemyMaxHp: 60,
      completionKey: "tenseLessonCompleted",
      reward: { grammaria: 20, fragment: "Yesterday Shard" },
      lesson: [
        "มาสเตอร์เวรีออน: คำบอกเวลาช่วยให้เราเห็นอดีต",
        "yesterday คือ เมื่อวาน",
        "last night คือ เมื่อคืน"
      ],
      questions: phase1PastTimeWordsQuestions
    },
    {
      id: "act1_phase1_unit3_was_were",
      type: "lesson-quiz",
      title: "was / were",
      thaiTitle: "was / were",
      phase: "Act 1 Phase 1",
      phaseTitle: "Entering the Past",
      enemy: "Was-Were Wisp",
      thaiEnemy: "วิสป์ was-were",
      enemyMaxHp: 68,
      completionKey: "phase1WasWereCompleted",
      reward: { grammaria: 25, fragment: "Was-Were Glow" },
      lesson: [
        "มาสเตอร์เวรีออน: was และ were คือรูปอดีตของ verb to be",
        "I, he, she, it ใช้ was",
        "you, we, they ใช้ were"
      ],
      questions: phase1WasWereQuestions
    },
    {
      id: "act1_phase1_unit4_there_was_were",
      type: "lesson-quiz",
      title: "there was / there were",
      thaiTitle: "there was / there were",
      phase: "Act 1 Phase 1",
      phaseTitle: "Entering the Past",
      enemy: "Memory Lantern",
      thaiEnemy: "โคมความทรงจำ",
      enemyMaxHp: 72,
      completionKey: "phase1ThereWasWereCompleted",
      reward: { grammaria: 25, fragment: "Memory Lantern Flame" },
      lesson: [
        "มาสเตอร์เวรีออน: There was แปลว่า มีอยู่หนึ่งสิ่งในอดีต",
        "There were แปลว่า มีหลายสิ่งในอดีต",
        "ดูจำนวนของสิ่งนั้นก่อนเลือก was หรือ were"
      ],
      questions: phase1ThereWasWereQuestions
    },
    {
      id: "act1_phase1_unit5_had",
      type: "lesson-quiz",
      title: "had",
      thaiTitle: "had",
      phase: "Act 1 Phase 1",
      phaseTitle: "Entering the Past",
      enemy: "Lost Pouch Imp",
      thaiEnemy: "อิมป์ถุงของหาย",
      enemyMaxHp: 80,
      completionKey: "phase1HadCompleted",
      reward: { grammaria: 30, fragment: "Had Relic" },
      lesson: [
        "มาสเตอร์เวรีออน: had คือรูปอดีตของ have และ has",
        "ใช้ had กับทุกประธานในอดีต",
        "เช่น I had a map yesterday."
      ],
      questions: phase1HadQuestions
    },
    {
      id: "regular-intro",
      type: "lesson-only",
      title: "Regular Verbs and -ed Workshop",
      thaiTitle: "โรงหลอม -ed แห่งอดีต",
      completionKey: "regularRulesCompleted",
      reward: { grammaria: 10, fragment: "Regular Gate Opened" },
      lesson: [
        "มาสเตอร์เวรีออน: เจ้าผ่านประตูแรกของอดีตมาแล้ว ผู้พเนจร",
        "ตอนนี้เจ้ารู้แล้วว่าอดีตคือสิ่งที่เกิดขึ้นแล้ว",
        "แต่การเล่าอดีตให้ถูกต้อง ต้องใช้รูปกริยาที่ถูกต้องด้วย",
        "กริยาบางคำเดินตามกฎ",
        "เราจะเรียกมันว่า Regular Verbs",
        "โรงหลอมแห่งนี้จะสอนเจ้าให้เปลี่ยน Regular Verbs เป็นอดีต",
        "จำไว้ กฎของโรงหลอมมีมากกว่าการเติม -ed อย่างเดียว",
        "จงดูท้ายคำให้ดี แล้วเลือกกฎให้ถูก"
      ],
      questions: []
    },
    {
      id: "regular-rule-1",
      type: "lesson-quiz",
      title: "Regular Verbs: -ed / -d",
      thaiTitle: "Regular Verbs: การเติม -ed / -d",
      enemy: "Echo Tick",
      thaiEnemy: "ติ๊กสะท้อนอดีต",
      reward: { grammaria: 20, fragment: "Rule 1 Spark" },
      lesson: [
        "มาสเตอร์เวรีออน: กฎแรกของ Regular Verbs ง่ายที่สุด คำกริยาทั่วไปเติม -ed ได้เลย",
        "ให้มองคำเดิมเหมือนแกนคริสตัล แล้วเติมตราประทับ -ed เพื่อบอกว่าเหตุการณ์จบลงแล้ว",
        "Examples: walk -> walked, jump -> jumped, help -> helped, watch -> watched, open -> opened, clean -> cleaned, finish -> finished, answer -> answered"
      ],
      questions: regularRuleOneQuestions
    },
    {
      id: "regular-rule-2",
      type: "lesson-quiz",
      title: "Regular Rule 2",
      thaiTitle: "คำลงท้ายด้วย e เติม -d",
      enemy: "Echo Tick",
      thaiEnemy: "ติ๊กสะท้อนอดีต",
      reward: { grammaria: 20, fragment: "Rule 2 Spark" },
      lesson: [
        "มาสเตอร์เวรีออน: กฎที่สอง ระวังคำที่ลงท้ายด้วย e",
        "ถ้าคำกริยามี e อยู่ท้ายคำแล้ว อย่าเติม e ซ้ำ ให้เติมแค่ -d",
        "Examples: like -> liked, love -> loved, live -> lived, dance -> danced, close -> closed, move -> moved, decide -> decided, arrive -> arrived"
      ],
      questions: regularRuleTwoQuestions
    },
    {
      id: "regular-rule-3",
      type: "lesson-quiz",
      title: "Regular Rule 3",
      thaiTitle: "คำลงท้ายด้วย y",
      enemy: "Yesterday Sprite",
      thaiEnemy: "ภูตเมื่อวาน",
      reward: { grammaria: 25, fragment: "Rule 3 Spark" },
      lesson: [
        "มาสเตอร์เวรีออน: กฎที่สามคือประตูตัวอักษร y เจ้าต้องมองตัวอักษรก่อนหน้า y ให้ดี",
        "ถ้าหน้า y เป็นสระ ให้เติม -ed ได้เลย เช่น play -> played, enjoy -> enjoyed, stay -> stayed, obey -> obeyed",
        "ถ้าหน้า y เป็นพยัญชนะ ให้เปลี่ยน y เป็น i แล้วเติม -ed เช่น study -> studied, cry -> cried, try -> tried, carry -> carried, reply -> replied"
      ],
      questions: regularRuleThreeQuestions
    },
    {
      id: "regular-rule-4",
      type: "lesson-quiz",
      title: "Regular Rule 4",
      thaiTitle: "คำสั้นเพิ่มพยัญชนะท้าย",
      enemy: "Rewind Slime",
      thaiEnemy: "สไลม์ย้อนเวลา",
      reward: { grammaria: 25, fragment: "Rule 4 Spark" },
      lesson: [
        "มาสเตอร์เวรีออน: กฎที่สี่คือจังหวะสั้นของคำ CVC",
        "คำกริยาสั้นบางคำที่มีรูปแบบ พยัญชนะ + สระ + พยัญชนะ ต้องเพิ่มพยัญชนะท้ายอีกหนึ่งตัวก่อนเติม -ed",
        "Examples: stop -> stopped, plan -> planned, drop -> dropped, clap -> clapped, grab -> grabbed, hug -> hugged, prefer -> preferred, admit -> admitted"
      ],
      questions: regularRuleFourQuestions
    },
    {
      id: "ed-mini-boss",
      type: "mini-boss",
      title: "Mini Boss 1: The -ed Forger",
      thaiTitle: "ช่างหลอม -ed ที่ผิดเพี้ยน",
      enemy: "The -ed Forger",
      completionKey: "edMiniBossDefeated",
      reward: { grammaria: 80, fragment: "Ed Fragment" },
      lesson: [
        "The -ed Forger ปรากฏตัว มันคือช่างตีเวลาเสื่อมสลายที่หลอมคำกริยาอดีตผิดรูป",
        "คำผิดที่มันสร้างไว้: studyed, stoped, loveed, playied, danceed, droped",
        "ใช้กฎ -ed ทั้ง 4 ข้อเพื่อทำลายการหลอมผิดรูป"
      ],
      questions: edForgerQuestions
    },
    {
      id: "irregular-lesson",
      type: "lesson-quiz",
      title: "Irregular Verbs",
      thaiTitle: "ถ้ำกริยาที่ไม่เชื่อฟังกฎ",
      enemy: "Memory Bat",
      thaiEnemy: "ค้างคาวความทรงจำ",
      completionKey: "irregularLessonCompleted",
      reward: { grammaria: 35, fragment: "Irregular Memory Spark" },
      lesson: [
        "มาสเตอร์เวรีออน: ต่อไปคือถ้ำของ Irregular Verbs กริยาที่ไม่ยอมรับตรา -ed",
        "Regular Verbs เดินตามกฎ เช่น walk -> walked, play -> played, study -> studied",
        "Irregular Verbs เปลี่ยนรูปในแบบของตนเอง เช่น go -> went, eat -> ate, see -> saw, buy -> bought",
        "เจ้าต้องจำพวกมันทีละคำ เพราะถ้าเติม -ed แบบมั่ว ๆ ความทรงจำจะบิดเบี้ยวทันที",
        "go -> went, eat -> ate, see -> saw, buy -> bought, take -> took, come -> came, have -> had, do -> did, make -> made, write -> wrote, meet -> met, choose -> chose, read -> read, give -> gave, get -> got, speak -> spoke, break -> broke, bring -> brought, think -> thought"
      ],
      questions: irregularPracticeQuestions
    },
    {
      id: "irregular-mini-boss",
      type: "mini-boss",
      title: "Mini Boss 2: The Irregular Wraith",
      thaiTitle: "วิญญาณกริยาไร้กฎ",
      enemy: "The Irregular Wraith",
      completionKey: "irregularMiniBossDefeated",
      reward: { grammaria: 90, fragment: "Irregular Fragment" },
      lesson: [
        "The Irregular Wraith ซ่อนรูป V2 ไว้ในถ้ำความทรงจำ",
        "กริยากลุ่มนี้ไม่เติม -ed ต้องเลือก V2 ที่ถูกต้องจากความจำ",
        "ตอบให้ถูกและเตรียมปัดป้องการโจมตีของวิญญาณไร้กฎ"
      ],
      questions: irregularWraithQuestions
    },
    {
      id: "merge-twist",
      type: "story-stage",
      title: "Story Twist",
      thaiTitle: "บอสทั้งสองยังไม่ตาย และหลอมรวมกัน",
      completionKey: "twistSeen",
      reward: { grammaria: 20, fragment: "Merged Memory Warning" },
      lesson: [
        "ผู้พเนจรคิดว่าบอสทั้งสองถูกกำจัดแล้ว แต่เศษของ The -ed Forger และ The Irregular Wraith ยังไม่หายไป",
        "Boss dialogue: อดีตไม่ได้แตกเพราะกฎข้อเดียว...แต่มันแตกเพราะทุกคนเล่ามันผิดซ้ำแล้วซ้ำเล่า",
        "เศษตัวอักษรของ Regular และ Irregular ลอยขึ้นสู่ฟ้า ก่อนหลอมรวมเป็น The Memory Breaker",
        "มาสเตอร์เวรีออน: พลังของ Regular และ Irregular กำลังหลอมรวมกัน ระวังให้ดี ผู้พเนจร นี่คืออดีตที่ถูกเล่าผิดทั้งหมดรวมเป็นหนึ่งเดียว"
      ],
      questions: []
    },
    {
      id: "final-boss",
      type: "final-boss",
      title: "Final Boss: The Memory Breaker",
      thaiTitle: "ผู้ทำลายความทรงจำ",
      enemy: "The Memory Breaker",
      completionKey: "finalBossDefeated",
      bossDialogueLines: [
        "อดีตคือรากของทุกสิ่ง หากอดีตผิดพลาด ปัจจุบันก็ไร้ความหมาย",
        "ข้าไม่ยอมหลอมรวมกับปัจจุบันและอนาคต เพราะพวกมันพยายามลืมข้า",
        "เจ้าคิดว่าอนาคตสำคัญกว่าอดีตอย่างนั้นหรือ",
        "ถ้าไม่มีอดีต เจ้าจะรู้ได้อย่างไรว่าเคยล้ม เคยเรียนรู้ และเคยเติบโต",
        "จงปล่อยให้อดีตแยกออกไป ข้าจะปกป้องมันจากการถูกลืม",
        "ความทรงจำที่ถูกเล่าผิด คือบาดแผลของ Lingua"
      ],
      reward: { grammaria: 150, fragment: "Past Fragment", badge: "ผู้ฟื้นคืนอดีต" },
      lesson: [
        "The -ed Forger และ The Irregular Wraith หลอมรวมกันเป็น The Memory Breaker",
        "Final Boss จะทดสอบทุกอย่าง: Regular Verbs, Irregular Verbs, sentence completion และ correct sentences",
        "เมื่อ HP ต่ำ บอสจะใช้อัลติ เตรียมปัดป้องให้ดี"
      ],
      questions: finalBossQuestions
    },
    {
      id: "ending",
      type: "ending",
      title: "Ending",
      thaiTitle: "ได้รับ Past Fragment",
      lesson: [
        "The Memory Breaker: ข้าไม่ได้เกลียดปัจจุบันหรืออนาคต...ข้าเพียงกลัวว่าอดีตจะถูกลืม",
        "มาสเตอร์เวรีออน: อดีตไม่ควรถูกขังไว้ และไม่ควรถูกลืม อดีตมีหน้าที่บอกเราว่าเคยเกิดอะไรขึ้น เพื่อให้ปัจจุบันเข้าใจตนเอง และให้อนาคตเดินต่อไปได้อย่างถูกทาง",
        "ได้รับ Past Fragment",
        "ได้รับ Badge: ผู้ฟื้นคืนอดีต",
        "ดินแดนแห่งอดีตฟื้นคืนแล้ว"
      ]
    }
  ],
  endingLines: [
    "The Memory Breaker collapses, but before disappearing it speaks: ข้าไม่ได้เกลียดปัจจุบันหรืออนาคต...ข้าเพียงกลัวว่าอดีตจะถูกลืม",
    "มาสเตอร์เวรีออน: อดีตไม่ควรถูกขังไว้ และไม่ควรถูกลืม อดีตมีหน้าที่บอกเราว่าเคยเกิดอะไรขึ้น เพื่อให้ปัจจุบันเข้าใจตนเอง และให้อนาคตเดินต่อไปได้อย่างถูกทาง",
    "ระบบ: ได้รับ Past Fragment ได้รับ Badge: ผู้ฟื้นคืนอดีต ดินแดนแห่งอดีตฟื้นคืนแล้ว"
  ],
  summary: [
    "อดีตคือเหตุการณ์ที่เกิดขึ้นแล้วและจบลงแล้ว แม้จะเป็น 1 วินาทีก่อนหรือ 10 นาทีก่อนก็เป็นอดีตได้",
    "ภาษาไทยมักใช้คำบอกเวลา เช่น เมื่อวาน วันนี้ พรุ่งนี้ เพื่อบอกช่วงเวลา",
    "ภาษาอังกฤษใช้รูปของกริยาเพื่อบอกเวลา นี่คือแนวคิดของ tense",
    `I go. = ${TENSE_LABELS.present}, I went. = ${TENSE_LABELS.past}, I will go. = ${TENSE_LABELS.future}`,
    "เมื่อต้องการเล่าเหตุการณ์ในอดีต เราใช้กริยาช่องที่ 2 หรือ V2",
    "V2 แบ่งได้เป็น 2 กลุ่มใหญ่ คือ Regular Verbs และ Irregular Verbs",
    "Regular Verbs มักเติม -ed หรือ -d ตามกฎ",
    "คำลงท้ายด้วย e เติมแค่ -d",
    "คำลงท้ายด้วยพยัญชนะ + y เปลี่ยน y เป็น i แล้วเติม -ed",
    "คำสั้นบางคำต้องเพิ่มพยัญชนะท้ายก่อนเติม -ed",
    "Irregular Verbs ไม่เติม -ed แต่เปลี่ยนรูป เช่น go -> went, eat -> ate, see -> saw",
    "คำบอกเวลา เช่น yesterday, last night, last week, ago มักเป็นสัญญาณของ Past Simple",
    "ถ้าใช้ V2 ถูกต้อง เราจะเล่าอดีตได้ชัดเจนและถูกต้อง"
  ]
};

const nounWords = [];

const questions = PAST_FRAGMENT_ACT.stages
  .filter(stage => stage.questions)
  .flatMap(stage => stage.questions)
  .map(question => ({
    text: question.sentence || question.prompt,
    options: question.options,
    correct: question.answer
  }));

const charms = [
  {
    id: "minorPower",
    name: "เครื่องรางพลังน้อย",
    effect: "ถ้าตอบถูก ดาเมจ +10%"
  },
  {
    id: "attackRune",
    name: "เครื่องรางรูนโจมตี",
    effect: "ถ้าตอบถูก ดาเมจ +25%"
  },
  {
    id: "tinyHeal",
    name: "เครื่องรางฟื้นฟูเล็ก",
    effect: "ถ้าตอบถูก ฟื้นฟูพลังชีวิต 8"
  },
  {
    id: "guardWord",
    name: "เครื่องรางคำพิทักษ์",
    effect: "ถ้าตอบผิด ลดดาเมจศัตรูครั้งถัดไป 30%"
  },
  {
    id: "focusGlyph",
    name: "เครื่องรางสัญลักษณ์สมาธิ",
    effect: "ทำให้ช่องสมบูรณ์แบบกว้างขึ้น"
  },
  {
    id: "grammariaSpark",
    name: "เครื่องรางประกายแกรมมาเรีย",
    effect: "ถ้าตอบถูก ได้แกรมมาเรียพิเศษ +5 หลังต่อสู้"
  }
];

const CHARM_RANK_DROP_RATES = { C: 42, B: 30, A: 18, S: 8, SS: 2 };
const LOW_HP_CHARM_RANK_DROP_RATES = { C: 45, B: 35, A: 14, S: 5, SS: 1 };
const BASE_CRITICAL_CHANCE = 0.05;
const CRITICAL_DAMAGE_MULTIPLIER = 1.75;

const charmRankMeta = {
  C: { icon: "◇", label: "Common" },
  B: { icon: "◆", label: "Uncommon" },
  A: { icon: "✦", label: "Rare" },
  S: { icon: "✧", label: "Epic" },
  SS: { icon: "✺", label: "Legendary" }
};

function makeCharm(id, name, rank, type, effectType, value, description, extra = {}) {
  return {
    id,
    name,
    rank,
    type,
    effectType,
    value,
    description,
    effect: description,
    icon: extra.icon || charmRankMeta[rank].icon,
    ...extra
  };
}

const actAttackCharms = [
  makeCharm("c_minor_power", "รูนพลังน้อย", "C", "attack", "damageMultiplier", 1.10, "เพิ่มดาเมจ 10% ในการโจมตีครั้งนี้"),
  makeCharm("c_grammaria_spark", "ประกายแกรมมาเรีย", "C", "reward", "bonusGrammaria", 5, "ได้ Grammaria เพิ่ม +5 หลังจบเทิร์น"),
  makeCharm("c_small_heal", "แสงเยียวยาเล็ก", "C", "heal", "healFlat", 8, "ฟื้น HP 8"),
  makeCharm("c_short_focus", "สมาธิสั้น", "C", "parry", "parrySlow", 0.90, "ทำให้ Parry bar ช้าลงเล็กน้อย 1 ครั้ง", { duration: 1 }),
  makeCharm("c_vocab_armor", "เกราะคำศัพท์", "C", "defense", "nextDamageReduction", 0.15, "ลดดาเมจบอสครั้งถัดไป 15%", { duration: 1 }),
  makeCharm("c_past_compass", "เข็มทิศอดีต", "C", "attack", "pastDamageBonus", 1.10, "ถ้าคำถามเป็น Past Simple หรือ V2 เพิ่มดาเมจ 10%"),
  makeCharm("c_memory_shard", "เศษผลึกความจำ", "C", "charge", "memoryCharge", 1, "สะสม Memory Charge 1 หน่วย ครบ 3 หน่วยได้รับ AP +1"),
  makeCharm("c_confidence", "แต้มแห่งความมั่นใจ", "C", "reward", "nextCorrectBonusGrammaria", 3, "ตอบถูกครั้งถัดไป ได้ Grammaria เพิ่ม +3", { duration: 1 }),
  makeCharm("c_light_echo", "แรงสะท้อนเบา", "C", "attack", "echoDamage", 0.10, "หลังโจมตีหลัก ทำดาเมจซ้ำอีก 10%"),
  makeCharm("c_wanderer_breath", "ลมหายใจผู้พเนจร", "C", "heal", "conditionalHeal", 5, "ถ้า HP ต่ำกว่า 50% ฟื้นเพิ่ม 5", { condition: "hpBelow50" }),

  makeCharm("b_attack_rune", "รูนโจมตี", "B", "attack", "damageMultiplier", 1.25, "เพิ่มดาเมจ 25%"),
  makeCharm("b_guard_word", "โล่คำพิทักษ์", "B", "defense", "nextDamageReduction", 0.30, "ลดดาเมจบอสครั้งถัดไป 30%", { duration: 1 }),
  makeCharm("b_wide_parry", "เขตปัดป้องกว้างขึ้น", "B", "parry", "parryZoneBonus", 8, "ขยายช่อง Parry ทุกสีเล็กน้อย 1 ครั้ง", { duration: 1 }),
  makeCharm("b_teacher_hint", "คำใบ้จากอาจารย์", "B", "support", "removeWrongChoice", 1, "คำถามถัดไปตัดตัวเลือกผิดออก 1 ตัว", { duration: 1 }),
  makeCharm("b_second_chance", "โอกาสครั้งที่สอง", "B", "parry", "secondChanceParry", 1, "ถ้า Parry พลาด อัปเกรดเป็น Weak Parry 1 ครั้ง", { duration: 1 }),
  makeCharm("b_past_flame", "เปลวไฟแห่งอดีต", "B", "attack", "pastDamageBonus", 1.25, "ถ้าคำถามเกี่ยวกับ V2 หรือ Past Simple เพิ่มดาเมจ 25%"),
  makeCharm("b_critical_charm", "เครื่องรางคริติคอล", "B", "critical", "criticalChanceBonus", 0.15, "เพิ่มโอกาส Critical +15% ในการโจมตีครั้งนี้", { duration: 1 }),
  makeCharm("b_stun_hammer", "ค้อนสะกดจังหวะ", "B", "stun", "stunChance", 0.25, "โจมตีครั้งนี้มีโอกาส 25% ทำให้บอสติด Stun 1 เทิร์น", { duration: 1 }),
  makeCharm("b_stun_sigil", "ตราสะกดจังหวะ", "B", "stun", "stunBuild", 25, "โจมตีครั้งนี้สะสม Stun ให้บอส +25"),
  makeCharm("b_heal_on_correct", "ฟื้นพลังจากคำตอบ", "B", "heal", "healOnCorrect", 12, "ถ้าตอบถูก ฟื้น HP 12", { duration: 1 }),
  makeCharm("b_mark", "รอยประทับ Mark", "B", "status", "applyMarkStatus", 0.15, "ติด Mark ให้บอส บอสโดนดาเมจเพิ่ม 15% 1 hit", { hits: 1, duration: 1 }),
  makeCharm("b_hit_shield", "เกราะหนึ่งจังหวะ", "B", "defense", "addHitShield", 1, "สร้างเกราะรับการโจมตี 1 hit"),
  makeCharm("b_syntax_veil", "ม่านวากยสัมพันธ์", "B", "defense", "addDefenseShield", 0.30, "ลดดาเมจบอสครั้งถัดไป 30%", { hits: 1 }),
  makeCharm("b_counter_power", "พลังตอบโต้", "B", "counter", "counterOnGoodParry", 0.15, "ถ้า Good หรือ Perfect Parry สำเร็จ โจมตีสวน 15%", { duration: 1 }),
  makeCharm("b_opening_rune", "รูนเริ่มศึก", "B", "attack", "firstTurnDamageBonus", 1.35, "ถ้าเป็นเทิร์นแรกของการต่อสู้ ดาเมจเพิ่ม 35%"),

  makeCharm("a_echo_strike", "ประกายโจมตีสะท้อน", "A", "attack", "echoDamage", 0.25, "หลังโจมตีหลัก ทำดาเมจซ้ำอีก 25%"),
  makeCharm("a_memory_pierce", "แทงทะลุความทรงจำ", "A", "attack", "memoryEnemyBonus", 1.40, "เพิ่มดาเมจ 40% ใส่ศัตรูสายความทรงจำหรือกาลเวลา"),
  makeCharm("a_time_slow", "หน่วงเวลา", "A", "parry", "parrySlow", 0.75, "ทำให้ Parry bar ช้าลงชัดเจน 1 ครั้ง", { duration: 1 }),
  makeCharm("a_retry", "พลังแห่งการทบทวน", "A", "support", "retryNextWrong", 1, "ถ้าตอบผิดครั้งถัดไป ให้ลองใหม่ 1 ครั้ง โดยบอสยังไม่สวน", { duration: 1 }),
  makeCharm("a_crit_rune", "รูนคริติคอลขั้นสูง", "A", "critical", "criticalChanceBonus", 0.25, "เพิ่มโอกาส Critical +25%", { duration: 1 }),
  makeCharm("a_shock_hammer", "ค้อนช็อกแกรมมาเรีย", "A", "stun", "stunChance", 0.50, "โจมตีครั้งนี้มีโอกาส 50% ทำให้บอสติด Stun 1 เทิร์น", { duration: 1 }),
  makeCharm("a_critical_stun", "Critical Stun", "A", "critical-stun", "stunOnCritical", 0.50, "ถ้าโจมตีติด Critical มีโอกาส 50% ทำให้บอสติด Stun 1 เทิร์น", { duration: 1 }),
  makeCharm("a_shield_pierce", "พลังทำลายเกราะ", "A", "break", "shieldPierceDamage", 1.20, "ถ้าบอสมี Shield หรือ Guard ให้ทะลุและทำดาเมจเพิ่ม 20%"),
  makeCharm("a_lifesteal", "เวทดูดพลัง", "A", "heal", "lifesteal", 0.15, "เมื่อโจมตีโดน ฟื้น HP 15% ของดาเมจที่ทำได้"),
  makeCharm("a_weak_curse", "คำสาปผิดรูป", "A", "debuff", "applyWeak", 0.30, "บอสติด Weak ทำดาเมจลดลง 30% 1 เทิร์น", { duration: 1 }),
  makeCharm("a_parry_power", "เร่งพลังหลัง Parry", "A", "parry", "perfectParryNextDamage", 1.35, "ถ้า Perfect Parry สำเร็จ โจมตีครั้งถัดไปแรงขึ้น 35%", { duration: 1 }),
  makeCharm("a_stack_circle", "วงเวทสะสมพลัง", "A", "stack", "stackingCorrectDamage", 0.05, "ทุกครั้งที่ตอบถูก ดาเมจเพิ่ม 5% ซ้อนสูงสุด 5 ครั้ง", { maxStacks: 5 }),
  makeCharm("a_combo_echo", "Echo Strike", "A", "attack", "comboCorrectEcho", 0.30, "ถ้าตอบถูกติดกัน 2 ครั้ง โจมตีซ้ำอีก 30%", { condition: "twoCorrectInRow" }),
  makeCharm("a_grammar_break", "Grammar Break", "A", "break", "bossQuestionBreak", 1, "เพิ่มดาเมจ 15% และทำให้การโจมตีเจาะจังหวะ Guard ของบอส"),

  makeCharm("s_crystal_charge", "ชาร์จผลึก", "S", "charge", "crystalCharge", 1, "สะสม 1 ชาร์จ ครบ 3 ครั้ง ดาเมจถัดไป x2", { threshold: 3 }),
  makeCharm("s_time_echo", "เวทสะท้อนเวลา", "S", "attack", "delayedEchoDamage", 0.30, "ดาเมจที่ทำในเทิร์นนี้ 30% จะย้อนกลับไปโดนบอสอีกครั้งในเทิร์นถัดไป"),
  makeCharm("s_grammaria_shield", "โล่แกรมมาเรีย", "S", "defense", "addHitShield", 2, "สร้างเกราะรับการโจมตี 2 hit"),
  makeCharm("s_verion_eye", "ดวงตาแห่งเวรีออน", "S", "support", "showHintBeforeQuestion", 1, "คำถามถัดไปแสดงคำใบ้ก่อนตอบ", { duration: 1 }),
  makeCharm("s_last_memory_crit", "Last Memory Critical", "S", "critical", "lowHpCriticalBonus", 0.50, "ถ้า HP ต่ำกว่า 30% เพิ่มโอกาส Critical +50%", { condition: "hpBelow30" }),
  makeCharm("s_stun_breaker", "Stun Breaker", "S", "stun", "damageOnStunned", 1.50, "ถ้าบอสติด Stun ดาเมจเพิ่ม 50%"),
  makeCharm("s_perfect_scholar", "Perfect Scholar", "S", "stack", "correctStreakDamage", 1.75, "ถ้าตอบถูก 3 ครั้งติดกัน ดาเมจครั้งถัดไป x1.75", { condition: "threeCorrectInRow" }),
  makeCharm("s_time_skip", "Time Skip", "S", "turn", "extraTurnChance", 0.35, "หลังโจมตี มีโอกาส 35% ได้เล่นต่อทันที 1 เทิร์น"),
  makeCharm("s_grammar_roulette", "Grammar Roulette", "S", "gamble", "rouletteDamage", null, "ดาเมจสุ่ม 70% หรือ 180% ของดาเมจปกติ", { values: [0.70, 1.80] }),
  makeCharm("s_absolute_parry", "Absolute Parry", "S", "parry", "upgradeNextParry", 1, "Parry ครั้งถัดไป ถ้าโดนช่องสีใดก็ตาม จะอัปเกรดผลขึ้น 1 ระดับ", { duration: 1 }),

  makeCharm("ss_past_fragment", "เศษเสี้ยว Past Fragment", "SS", "attack", "damageAndReward", null, "ดาเมจ x2 และได้ Grammaria เพิ่ม +15", { damageMultiplier: 2.00, bonusGrammaria: 15 }),
  makeCharm("ss_v2_judgement", "ประกาศิตแห่ง V2", "SS", "attack-debuff", "v2Judgement", null, "ถ้าตอบถูก ดาเมจหนักมาก และบอสติด Weak 1 เทิร์น", { damageMultiplier: 1.85, applyWeak: 0.30, duration: 1 }),
  makeCharm("ss_reverse_curse", "คำสาปย้อนกลับ", "SS", "counter", "reflectNextBossAttack", 0.50, "ถ้าบอสโจมตีในเทิร์นถัดไป บอสโดนดาเมจสะท้อน 50%", { duration: 1 }),
  makeCharm("ss_full_memory", "ความทรงจำสมบูรณ์", "SS", "heal-attack-parry", "fullMemoryBurst", null, "ฟื้น HP 25 เพิ่มดาเมจ 50% และขยาย Parry 1 ครั้ง", { healFlat: 25, damageMultiplier: 1.50, parryZoneBonus: 10, duration: 1 }),
  makeCharm("ss_verion_seal", "เวรีออนเปิดผนึก", "SS", "support-critical", "verionSeal", null, "ตัดตัวเลือกผิด 2 ตัว และโจมตีครั้งถัดไป Critical แน่นอน", { removeWrongChoice: 2, forceCriticalNextAttack: true, duration: 1 }),
  makeCharm("ss_perfect_timeline", "Perfect Timeline", "SS", "parry-stun-counter", "perfectTimeline", null, "Perfect Parry ครั้งถัดไปทำให้บอสติด Stun และสวนกลับแรง x2", { stunOnPerfectParry: true, counterMultiplier: 2.00, duration: 1 }),
  makeCharm("ss_great_recall", "The Great Recall", "SS", "revive", "surviveFatalOnce", 0.40, "ถ้า HP เหลือ 0 ครั้งแรก จะรอดที่ 1 HP แล้วฟื้น 40%", { healPercent: 0.40, oncePerBattle: true })
];

const CHARM_EFFECT_HANDLERS = {
  damageMultiplier: { category: "damage", timing: "damage", requiresValue: true },
  bonusGrammaria: { category: "reward", timing: "setup", requiresValue: true },
  healFlat: { category: "heal", timing: "setup", requiresValue: true },
  parrySlow: { category: "parry", timing: "setup", requiresValue: true },
  nextDamageReduction: { category: "shield", timing: "setup", requiresValue: true },
  pastDamageBonus: { category: "damage", timing: "damage", requiresValue: true },
  memoryCharge: { category: "ap", timing: "setup", requiresValue: true },
  nextCorrectBonusGrammaria: { category: "reward", timing: "setup", requiresValue: true },
  echoDamage: { category: "damage", timing: "damage", requiresValue: true },
  conditionalHeal: { category: "heal", timing: "setup", requiresValue: true },
  parryZoneBonus: { category: "parry", timing: "setup", requiresValue: true },
  removeWrongChoice: { category: "support", timing: "setup", requiresValue: true },
  secondChanceParry: { category: "parry", timing: "setup", requiresValue: true },
  criticalChanceBonus: { category: "critical", timing: "setup", requiresValue: true },
  stunChance: { category: "stun", timing: "setup", requiresValue: true },
  stunBuild: { category: "stun", timing: "setup", requiresValue: true },
  healOnCorrect: { category: "heal", timing: "setup", requiresValue: true },
  applyMarkStatus: { category: "mark", timing: "setup", requiresValue: true },
  addHitShield: { category: "shield", timing: "setup", requiresValue: true },
  addDefenseShield: { category: "shield", timing: "setup", requiresValue: true },
  counterOnGoodParry: { category: "counter", timing: "parry", requiresValue: true },
  firstTurnDamageBonus: { category: "damage", timing: "damage", requiresValue: true },
  memoryEnemyBonus: { category: "damage", timing: "damage", requiresValue: true },
  retryNextWrong: { category: "support", timing: "setup", requiresValue: true },
  stunOnCritical: { category: "stun", timing: "setup", requiresValue: true },
  shieldPierceDamage: { category: "damage", timing: "damage", requiresValue: true },
  lifesteal: { category: "heal", timing: "setup", requiresValue: true },
  applyWeak: { category: "debuff", timing: "setup", requiresValue: true },
  perfectParryNextDamage: { category: "parry", timing: "parry", requiresValue: true },
  stackingCorrectDamage: { category: "damage", timing: "damage", requiresValue: true },
  comboCorrectEcho: { category: "damage", timing: "damage", requiresValue: true },
  bossQuestionBreak: { category: "damage", timing: "damage", requiresValue: false },
  crystalCharge: { category: "damage", timing: "damage", requiresValue: true },
  delayedEchoDamage: { category: "damage", timing: "damage", requiresValue: true },
  showHintBeforeQuestion: { category: "support", timing: "setup", requiresValue: true },
  lowHpCriticalBonus: { category: "critical", timing: "damage", requiresValue: true },
  damageOnStunned: { category: "damage", timing: "damage", requiresValue: true },
  correctStreakDamage: { category: "damage", timing: "damage", requiresValue: true },
  extraTurnChance: { category: "turn", timing: "postAttack", requiresValue: true },
  rouletteDamage: { category: "damage", timing: "damage", requiresValue: false },
  upgradeNextParry: { category: "parry", timing: "setup", requiresValue: true },
  damageAndReward: { category: "damage", timing: "damage", requiresValue: false },
  v2Judgement: { category: "damage", timing: "damage", requiresValue: false },
  reflectNextBossAttack: { category: "counter", timing: "parry", requiresValue: true },
  fullMemoryBurst: { category: "hybrid", timing: "setup", requiresValue: false },
  verionSeal: { category: "support", timing: "setup", requiresValue: false },
  perfectTimeline: { category: "parry", timing: "parry", requiresValue: false },
  surviveFatalOnce: { category: "revive", timing: "setup", requiresValue: true },
  applyMark: { category: "mark", timing: "setup", requiresValue: true },
  shieldAndGuard: { category: "shield", timing: "setup", requiresValue: false }
};

function normalizeCharmEffect(charm) {
  const handler = CHARM_EFFECT_HANDLERS[charm?.effectType] || null;
  return {
    id: charm?.id || "",
    name: charm?.name || charm?.thaiName || "",
    rank: charm?.rank || "",
    type: charm?.type || "",
    effectType: charm?.effectType || "",
    handler,
    supported: Boolean(handler),
    hasValue: charm?.value !== undefined && charm?.value !== null,
    valueRequired: Boolean(handler?.requiresValue)
  };
}

function getCharmDebugSummary(charm) {
  const effect = normalizeCharmEffect(charm);
  const issues = [];
  if (!effect.id) {
    issues.push("missing-id");
  }
  if (!effect.name) {
    issues.push("missing-name");
  }
  if (!effect.effectType) {
    issues.push("missing-effectType");
  }
  if (!effect.supported) {
    issues.push("unsupported-effectType");
  }
  if (effect.valueRequired && !effect.hasValue) {
    issues.push("missing-value");
  }
  if (!charm?.description && !charm?.effect) {
    issues.push("missing-description");
  }
  return {
    id: effect.id,
    name: effect.name,
    rank: effect.rank,
    type: effect.type,
    effectType: effect.effectType,
    category: effect.handler?.category || "unsupported",
    timing: effect.handler?.timing || "none",
    supported: effect.supported,
    value: charm?.value,
    issues
  };
}

function getSelectedBattleCharm() {
  const battle = state.actBattle;
  return battle?.selectedCharmId ? getBattleFlowV2Charm(battle.selectedCharmId) : null;
}

function installCharmAuditDebug() {
  if (typeof window === "undefined") {
    return;
  }
  window.debugCharmAudit = function debugCharmAudit() {
    const seenIds = new Set();
    const duplicateIds = new Set();
    const summaries = actAttackCharms.map(charm => {
      if (seenIds.has(charm.id)) {
        duplicateIds.add(charm.id);
      }
      seenIds.add(charm.id);
      const summary = getCharmDebugSummary(charm);
      if (duplicateIds.has(charm.id)) {
        summary.issues.push("duplicate-id");
      }
      return summary;
    });
    const unsupported = summaries.filter(item => !item.supported);
    const missingValues = summaries.filter(item => item.issues.includes("missing-value"));
    const issues = summaries.filter(item => item.issues.length);
    console.group("[Charm Audit]");
    console.log("total charms:", summaries.length);
    console.log("supported effect types:", Object.keys(CHARM_EFFECT_HANDLERS).sort());
    console.log("unsupported effect types:", unsupported);
    console.log("missing values:", missingValues);
    console.log("duplicates:", [...duplicateIds]);
    console.table(summaries);
    if (issues.length) {
      console.warn("[Charm Audit] issues found", issues);
    } else {
      console.log("[Charm Audit] all charm effect types are mapped");
    }
    console.groupEnd();
    return { total: summaries.length, unsupported, missingValues, duplicateIds: [...duplicateIds], issues, summaries };
  };
}

installCharmAuditDebug();

const enemyAttackPatterns = {
  normal: {
    id: "normal",
    name: "ดูดกลืนชื่อ",
    announce: "Memory Shade กำลังโจมตี!",
    hits: 1,
    baseDamage: 18,
    countdownOptions: [3, 5],
    shortStepDuration: 850,
    longStepDuration: 950,
    gaugeSpeed: 1150,
    gaugeZoneWidth: 22,
    gaugeZoneShrinkPerHit: 0,
    gaugeSpeedUpPerHit: 0
  },
  silentBarrage: {
    id: "silentBarrage",
    name: "Silent Barrage",
    announce: "Null Core uses Silent Barrage!",
    hits: 5,
    baseDamage: 8,
    countdownOptions: [3, 5],
    shortStepDuration: 820,
    longStepDuration: 920,
    gaugeSpeed: 1120,
    gaugeZoneWidth: 26,
    gaugeZoneShrinkPerHit: 3,
    gaugeSpeedUpPerHit: 80
  }
};

const ASSET_BASE_URL = "./assets/";

function assetPath(fileName) {
  return `${ASSET_BASE_URL}${fileName.replace(/^\/+/, "")}`;
}

const MAIN_CHARACTER_IMAGE_PATH = "assets/characters/male_wanderer_idle.gif";
const MALE_WANDERER_BATTLE_BACK_IMAGE_PATH = "assets/characters/male_wanderer_back.png";
const FEMALE_WANDERER_BATTLE_BACK_IMAGE_PATH = "assets/characters/female_wanderer_back.png";
const MAIN_CHARACTER_FALLBACK_IMAGE_PATH = "assets/characters/main-character-idle-transparent-clean-optimized.webp";
const TEACHER_CHARACTER_IMAGE_PATH = "assets/characters/master_verion_idle.gif";
const TEACHER_CHARACTER_FALLBACK_IMAGE_PATH = assetPath("master-verion.png");
const PLAYER_BATTLE_BACK_MODEL_BY_GENDER = Object.freeze({
  male: MALE_WANDERER_BATTLE_BACK_IMAGE_PATH,
  female: FEMALE_WANDERER_BATTLE_BACK_IMAGE_PATH
});
const PLAYER_CHARACTERS = {
  male_wanderer: {
    id: "male_wanderer",
    label: "ผู้พเนจรชาย",
    asset: MAIN_CHARACTER_IMAGE_PATH,
    fallbackAsset: MAIN_CHARACTER_FALLBACK_IMAGE_PATH,
    battleAsset: PLAYER_BATTLE_BACK_MODEL_BY_GENDER.male,
    battleFallbackAsset: MAIN_CHARACTER_IMAGE_PATH
  },
  female_wanderer: {
    id: "female_wanderer",
    label: "ผู้พเนจรหญิง",
    asset: "assets/characters/female_wanderer_idle.gif",
    fallbackAsset: MAIN_CHARACTER_IMAGE_PATH,
    battleAsset: PLAYER_BATTLE_BACK_MODEL_BY_GENDER.female,
    battleFallbackAsset: PLAYER_BATTLE_BACK_MODEL_BY_GENDER.male
  }
};
const DIALOGUE_SPEAKER_PORTRAITS = {
  master_verion: {
    name: "มาสเตอร์เวรีออน",
    portrait: "assets/portraits/master_verion_portrait.png"
  },
  male_wanderer: {
    name: "ผู้พเนจร",
    portrait: "assets/portraits/male_wanderer_portrait.png"
  },
  female_wanderer: {
    name: "ผู้พเนจร",
    portrait: "assets/portraits/female_wanderer_portrait.png"
  },
  memory_breaker: {
    name: "ผู้ทำลายความทรงจำ",
    portrait: "assets/portraits/memory_breaker_portrait.png"
  },
  ed_forger: {
    name: "The Ed Forger",
    portrait: "assets/portraits/ed_forger_portrait.png"
  }
};
const GRAMMAR_HALL_ANIMATED_BACKGROUND_PATH = "assets/backgrounds/grammar-hall-animated.gif";
const ACT1_BACKGROUND_MAP = {
  timeDustFields: "assets/backgrounds/act1/act1_time_dust_fields.png",
  echoTickRuins: "assets/backgrounds/act1/act1_echo_tick_ruins.png",
  edForge: "assets/backgrounds/act1/act1_ed_forge.png",
  irregularCave: "assets/backgrounds/act1/act1_irregular_cave.png",
  rewindClockworks: "assets/backgrounds/act1/act1_rewind_clockworks.png",
  memoryBreakerCitadel: "assets/backgrounds/act1/act1_memory_breaker_citadel.png"
};
const ACT1_BACKGROUND_FALLBACKS = {
  // TODO: Keep act1_echo_tick_ruins.png as the safe fallback if act1_rewind_clockworks.png is replaced.
  rewindClockworks: ACT1_BACKGROUND_MAP.echoTickRuins
};
const DEFAULT_ACT1_BACKGROUND_KEY = "timeDustFields";
const ACT1_STAGE_BACKGROUND_KEYS = {
  prologue: "timeDustFields",
  "what-is-past": "timeDustFields",
  "what-is-tense": "timeDustFields",
  act1_phase1_unit3_was_were: "timeDustFields",
  act1_phase1_unit4_there_was_were: "timeDustFields",
  act1_phase1_unit5_had: "timeDustFields",
  "regular-intro": "edForge",
  "regular-rule-1": "edForge",
  "regular-rule-2": "edForge",
  "regular-rule-3": "edForge",
  "regular-rule-4": "rewindClockworks",
  "ed-mini-boss": "edForge",
  "irregular-lesson": "irregularCave",
  "irregular-mini-boss": "irregularCave",
  "merge-twist": "rewindClockworks",
  "final-boss": "memoryBreakerCitadel",
  ending: "memoryBreakerCitadel"
};
const TIME_DUST_IMAGE_PATH = "assets/characters/timedust-transparent-clean-optimized.webp";
const TIME_DUST_FALLBACK_IMAGE_PATH = assetPath("enemies/time-dust.png");
const ECHO_TRICK_IMAGE_PATH = "assets/characters/echo-trick-transparent-clean-optimized.webp";
const ECHO_TRICK_FALLBACK_IMAGE_PATH = assetPath("enemies/echo-tick.png");
const YESTERDAY_SPIRIT_IMAGE_PATH = "assets/characters/yesterday-spirit-transparent.gif";
const YESTERDAY_SPIRIT_FALLBACK_IMAGE_PATH = assetPath("memory-shade.png");
const MEMORY_BREAKER_IMAGE_PATH = "assets/bosses/memory_breaker_battle_idle_v3.gif";
const MEMORY_BREAKER_FALLBACK_IMAGE_PATH = assetPath("enemies/memory-breaker.png");

function createMainCharacterElement(className = "") {
  const img = document.createElement("img");
  img.className = `main-character-gif ${className}`.trim();
  img.alt = "Main Character";
  img.draggable = false;
  applyPlayerCharacterImage(img);
  return img;
}

function normalizePlayerCharacterId(characterId) {
  return PLAYER_CHARACTERS[characterId] ? characterId : "male_wanderer";
}

function getCharacterIdFromAvatar(avatar = {}) {
  if (avatar.characterId) {
    return normalizePlayerCharacterId(avatar.characterId);
  }
  return avatar.gender === "female" ? "female_wanderer" : "male_wanderer";
}

function getCharacterIdFromGender(gender) {
  return gender === "female" ? "female_wanderer" : "male_wanderer";
}

function ensurePlayerCharacterData(data = playerData) {
  if (!data) {
    return "male_wanderer";
  }
  const characterId = normalizePlayerCharacterId(data.characterId || getCharacterIdFromAvatar(data.avatar));
  data.characterId = characterId;
  data.avatar = {
    ...(data.avatar || {}),
    characterId
  };
  return characterId;
}

function getPlayerCharacter(characterId = ensurePlayerCharacterData()) {
  return PLAYER_CHARACTERS[normalizePlayerCharacterId(characterId)] || PLAYER_CHARACTERS.male_wanderer;
}

function getPlayerBattleBackModelPath(characterId = ensurePlayerCharacterData()) {
  const normalizedCharacterId = normalizePlayerCharacterId(characterId);
  const gender = normalizedCharacterId === "female_wanderer" ? "female" : "male";
  return PLAYER_BATTLE_BACK_MODEL_BY_GENDER[gender] || PLAYER_BATTLE_BACK_MODEL_BY_GENDER.male;
}

function applyPlayerCharacterImage(img, characterId = ensurePlayerCharacterData()) {
  if (!img) {
    return;
  }
  const character = getPlayerCharacter(characterId);
  const useBattleBackView = img.dataset.characterView === "battle-back";
  const asset = useBattleBackView ? getPlayerBattleBackModelPath(character.id) : character.asset;
  const fallbackAsset = useBattleBackView ? (character.battleFallbackAsset || "") : character.fallbackAsset;
  img.className = img.className.replace(/\bmain-character-gif-fallback\b/g, "main-character-gif").trim();
  img.classList.remove("hidden");
  img.dataset.characterId = character.id;
  img.dataset.fallbackApplied = "false";
  img.dataset.fallbackSrc = fallbackAsset;
  img.src = asset;
  img.alt = character.label;
  img.draggable = false;
  img.onerror = () => handleMainCharacterGifError(img);
}

function handleMainCharacterGifError(img) {
  const failedCharacterId = normalizePlayerCharacterId(img?.dataset?.characterId);
  console.warn("[Character] player character asset failed to load", failedCharacterId);
  if (img?.dataset?.characterView === "battle-back") {
    const fallbackSrc = img.dataset.fallbackSrc || "";
    if (fallbackSrc && img.src !== fallbackSrc && img.dataset.fallbackApplied !== "true") {
      img.dataset.fallbackApplied = "true";
      img.src = fallbackSrc;
      return;
    }

    img.classList.add("hidden");
    img.onerror = null;
    console.warn("[Battle UI] Player battle model hidden after load failure", {
      characterId: failedCharacterId,
      src: img.src
    });
    return;
  }
  if (failedCharacterId !== "male_wanderer") {
    applyPlayerCharacterImage(img, "male_wanderer");
    return;
  }
  if (img.dataset.fallbackApplied === "true") {
    return;
  }

  img.dataset.fallbackApplied = "true";
  img.className = img.className.replace(/\bmain-character-gif\b/g, "main-character-gif-fallback").trim();
  img.src = MAIN_CHARACTER_FALLBACK_IMAGE_PATH;
}

function setupMainCharacterGifs() {
  refreshPlayerCharacterSprites();
}

function refreshPlayerCharacterSprites(characterId = ensurePlayerCharacterData()) {
  document.querySelectorAll(".main-character-gif, .main-character-gif-fallback").forEach(img => {
    applyPlayerCharacterImage(img, characterId);
  });
}

function handleTeacherCharacterGifError(img) {
  console.warn("[Character] Master Verion character asset failed to load");
  if (img.dataset.fallbackApplied === "true") {
    return;
  }

  img.dataset.fallbackApplied = "true";
  img.src = TEACHER_CHARACTER_FALLBACK_IMAGE_PATH;
}

function setupTeacherCharacterGifs() {
  document.querySelectorAll(".teacher-character-gif").forEach(img => {
    img.src = TEACHER_CHARACTER_IMAGE_PATH;
    img.draggable = false;
    img.addEventListener("error", () => handleTeacherCharacterGifError(img), { once: true });
  });
}

function getAct1BackgroundSrc(backgroundKey) {
  const key = backgroundKey || DEFAULT_ACT1_BACKGROUND_KEY;
  return ACT1_BACKGROUND_MAP[key] ||
    ACT1_BACKGROUND_FALLBACKS[key] ||
    ACT1_BACKGROUND_MAP[DEFAULT_ACT1_BACKGROUND_KEY] ||
    GRAMMAR_HALL_ANIMATED_BACKGROUND_PATH;
}

function getAct1BackgroundKeyForStage(stage) {
  if (!stage) {
    return DEFAULT_ACT1_BACKGROUND_KEY;
  }
  return ACT1_STAGE_BACKGROUND_KEYS[stage.id] || DEFAULT_ACT1_BACKGROUND_KEY;
}

function getNextAct1BackgroundKey(stage) {
  const playableStages = getPlayableStages();
  const currentIndex = stage ? getStageIndexById(stage.id) : -1;
  const nextStage = currentIndex >= 0 ? playableStages[currentIndex + 1] : null;
  return getAct1BackgroundKeyForStage(nextStage || stage);
}

function shouldTransitionToNextStageFromReward(stage) {
  return stage?.id === "act1_phase1_unit5_had";
}

function setActBackground(backgroundKey, options = {}) {
  const src = getAct1BackgroundSrc(backgroundKey);
  if (!src) {
    if (options.warnMissing) {
      console.warn("[Act1Background] Missing background:", backgroundKey);
    }
    return GRAMMAR_HALL_ANIMATED_BACKGROUND_PATH;
  }

  const cssUrl = `url("${src}")`;
  document.documentElement.style.setProperty("--act1-scene-background", cssUrl);
  document.body.dataset.actBackgroundKey = backgroundKey || DEFAULT_ACT1_BACKGROUND_KEY;
  return src;
}

function preloadAct1Backgrounds() {
  const sources = new Set([
    ...Object.values(ACT1_BACKGROUND_MAP),
    ...Object.values(ACT1_BACKGROUND_FALLBACKS)
  ].filter(Boolean));

  sources.forEach(src => {
    const image = new Image();
    image.onload = () => {
      image.dataset.loaded = "true";
    };
    image.onerror = () => {
      console.warn("[Act1Background] Failed to preload:", src);
    };
    image.src = src;
  });
}

function transitionToActBackground(backgroundKey, message, callback) {
  runSceneTransition(message, () => {
    setActBackground(backgroundKey, { warnMissing: true });
    if (typeof callback === "function") {
      callback();
    }
  });
}

function setupAnimatedGrammarHallBackground() {
  const backgroundProbe = new Image();
  backgroundProbe.addEventListener("error", error => {
    console.warn("[Background] animated GIF failed to load", error);
  }, { once: true });
  backgroundProbe.src = GRAMMAR_HALL_ANIMATED_BACKGROUND_PATH;
}

const enemySpriteMap = {
  "Memory Shade": assetPath("memory-shade.png"),
  "Time Dust": TIME_DUST_IMAGE_PATH,
  "Time Dust Sprite": TIME_DUST_IMAGE_PATH,
  "Echo Tick": ECHO_TRICK_IMAGE_PATH,
  "Yesterday Mite": YESTERDAY_SPIRIT_IMAGE_PATH,
  "Was-Were Wisp": assetPath("memory-shade.png"),
  "Memory Lantern": assetPath("memory-shade.png"),
  "Lost Pouch Imp": assetPath("memory-shade.png"),
  "Rewind Slime": assetPath("enemies/rewind-slime.png"),
  "Yesterday Sprite": YESTERDAY_SPIRIT_IMAGE_PATH,
  "Memory Bat": assetPath("memory-shade.png"),
  "The -ed Forger": assetPath("enemies/ed-forger.png"),
  "ช่างหลอม -ed": assetPath("enemies/ed-forger.png"),
  "The Irregular Wraith": assetPath("enemies/irregular-wraith.png"),
  "ภูต Irregular": assetPath("enemies/irregular-wraith.png"),
  "The Memory Breaker": MEMORY_BREAKER_IMAGE_PATH,
  "ผู้ทำลายความทรงจำ": MEMORY_BREAKER_IMAGE_PATH
};

const enemyDescriptions = {
  "Time Dust": "ฝุ่นแห่งกาลเวลาที่ลอยวนอยู่รอบเศษความทรงจำ",
  "Time Dust Sprite": "ภูตฝุ่นเวลาเล็ก ๆ ที่เฝ้าทางเข้าอดีต",
  "Yesterday Mite": "แมลงจิ๋วที่กัดกินคำบอกเวลาอดีต",
  "Was-Were Wisp": "แสงวิบวับที่สลับ was และ were",
  "Memory Lantern": "โคมไฟความทรงจำที่ส่องจำนวนของสิ่งต่าง ๆ",
  "Lost Pouch Imp": "อิมป์ตัวเล็กที่ขโมยของในอดีตไปซ่อน",
  "Echo Tick": "สิ่งมีชีวิตกลไกเวลาที่ทำให้ช่วงเวลาซ้ำไปซ้ำมา",
  "Rewind Slime": "สไลม์แห่งการย้อนกลับที่กลืนเศษเวลาไว้ในตัว",
  "Memory Shade": "เงาความทรงจำที่บิดเบือนคำกริยาในอดีต",
  "The -ed Forger": "ช่างหลอมคำกริยาอดีตที่สร้างรูป -ed ผิดเพี้ยน",
  "The Irregular Wraith": "วิญญาณกริยาไร้กฎที่ซ่อนรูป V2 ไว้ในความทรงจำ",
  "The Memory Breaker": "เศษความทรงจำ Regular และ Irregular ที่หลอมรวมจนบิดเบี้ยว"
};

const HIT_TOLERANCE = 3;

const skipBattleEnemies = [
  {
    id: "time-dust",
    stageId: "what-is-past",
    name: "Time Dust",
    thaiName: "ไทม์ดัสต์",
    description: "ฝุ่นแห่งกาลเวลาที่ลอยวนอยู่รอบเศษความทรงจำ",
    lesson: "อดีตคืออะไร"
  },
  {
    id: "echo-tick",
    stageId: "regular-rule-1",
    name: "Echo Tick",
    thaiName: "เอคโคทิก",
    description: "สิ่งมีชีวิตกลไกเวลาที่ทำให้ช่วงเวลาซ้ำไปซ้ำมา",
    lesson: "กฎการเติม -d"
  },
  {
    id: "rewind-slime",
    stageId: "regular-rule-4",
    name: "Rewind Slime",
    thaiName: "รีไวน์สไลม์",
    description: "สไลม์แห่งการย้อนกลับที่กลืนเศษเวลาไว้ในตัว",
    lesson: "กฎ y เป็น ied"
  },
  {
    id: "ed-forger",
    stageId: "ed-mini-boss",
    name: "The -ed Forger",
    thaiName: "ช่างหลอม -ed",
    description: "มินิบอสที่หลอมรูปอดีตของคำกริยาปกติให้ผิดเพี้ยน",
    lesson: "Regular Verb Mini Boss"
  },
  {
    id: "irregular-wraith",
    stageId: "irregular-mini-boss",
    name: "The Irregular Wraith",
    thaiName: "ภูต Irregular",
    description: "วิญญาณกริยาไร้กฎที่ซ่อนรูป V2 ไว้ในความทรงจำ",
    lesson: "Irregular Verb Mini Boss"
  },
  {
    id: "memory-breaker",
    stageId: "final-boss",
    name: "The Memory Breaker",
    thaiName: "ผู้ทำลายความทรงจำ",
    description: "บอสใหญ่ที่ผสม Regular และ Irregular จนเวลาแตกกระจาย",
    lesson: "Past Fragment Final Boss"
  }
];

let playerData = null;

const playerStorage = {
  get(key) {
    return localStorage.getItem(key);
  },
  set(key, value) {
    localStorage.setItem(key, value);
  },
  remove(key) {
    localStorage.removeItem(key);
  }
};

const AUTH_CONFIG = {
  betaCode: "LINGUA_BETA_2026",
  requireBetaCode: false,
  mode: "firebase",
  remoteEnabled: true,
  provider: "firebase",
  useRemoteAuth: true
};

const REMOTE_AUTH_CONFIG = {
  provider: "firebase",
  enabled: true,
  firebaseConfig: {
    apiKey: "AIzaSyBA5JKnMcAdzFcjdVnksofzGHWxWPTGNZA",
    authDomain: "lingua-close-beta-1.firebaseapp.com",
    projectId: "lingua-close-beta-1",
    storageBucket: "lingua-close-beta-1.firebasestorage.app",
    messagingSenderId: "1061012230661",
    appId: "1:1061012230661:web:9156e800d671491c61c26c",
    measurementId: "G-4FXFY4QRZQ"
  },
  supabaseUrl: "",
  supabaseAnonKey: ""
};

const AUTH_STORAGE_KEYS = {
  users: "lingua_users",
  currentUser: "lingua_current_user",
  guestProgress: "lingua_progress_guest",
  registeredProgressPrefix: "lingua_progress_registered_",
  guestPrologueSeen: "lingua_guest_has_seen_prologue",
  userPrologueSeenPrefix: "lingua_user_"
};

const AUTH_COPY = {
  localModeLabel: "Close Beta: Local Test Mode",
  remoteModeLabel: "Close Beta: Online Account Mode",
  remoteLoginNotice: "บัญชีออนไลน์สามารถเข้าสู่ระบบจากเบราว์เซอร์หรืออุปกรณ์อื่นได้",
  remoteRegisterNotice: "สมัครบัญชีออนไลน์ Close Beta",
  loginLocalNotice: "บัญชี Local ใช้ได้เฉพาะเครื่อง/เบราว์เซอร์ที่สมัครไว้ หากต้องการเล่นข้ามเครื่อง ต้องเชื่อมระบบฐานข้อมูลออนไลน์",
  registerLocalNotice: "ขณะนี้เป็นโหมดทดสอบแบบ Local บัญชีจะบันทึกเฉพาะเครื่องและเบราว์เซอร์นี้เท่านั้น หากเปลี่ยนเครื่องหรือเปลี่ยนเบราว์เซอร์ อาจไม่พบบัญชีเดิม",
  registerLocalSuccess: "สมัครสำเร็จแล้ว บัญชีนี้ยังเป็นบัญชี Local ใช้ได้เฉพาะเครื่อง/เบราว์เซอร์นี้",
  remoteRegisterSuccess: "สมัครสำเร็จแล้ว บัญชีนี้เป็นบัญชีออนไลน์ สามารถใช้ข้ามเครื่องได้",
  localUserNotFound: "ไม่พบผู้ใช้ในเบราว์เซอร์นี้ หากคุณสมัครจากเครื่องหรือเบราว์เซอร์อื่น ระบบ Local จะยังไม่สามารถดึงบัญชีเดิมได้",
  remoteAuthUnavailable: "ไม่สามารถเชื่อมต่อบัญชีออนไลน์ได้ กรุณาลองใหม่",
  remoteLoginFailed: "ไม่พบบัญชีนี้ หรือ PIN ไม่ถูกต้อง"
};

function isRemoteAuthConfigured() {
  return Boolean(
    REMOTE_AUTH_CONFIG.enabled &&
    (REMOTE_AUTH_CONFIG.firebaseConfig || (REMOTE_AUTH_CONFIG.supabaseUrl && REMOTE_AUTH_CONFIG.supabaseAnonKey))
  );
}

function getAuthMode() {
  if (AUTH_CONFIG.remoteEnabled && AUTH_CONFIG.mode === "firebase" && isRemoteAuthConfigured()) {
    return "firebase";
  }
  return "local";
}

function shouldValidateBetaCode() {
  return AUTH_CONFIG.requireBetaCode === true;
}

function getRegisterBetaCodeValue() {
  if (shouldValidateBetaCode()) {
    return els.registerBetaCode?.value || "";
  }
  return AUTH_CONFIG.betaCode;
}

function getAuthModeLabel() {
  return getAuthMode() === "firebase" ? AUTH_COPY.remoteModeLabel : AUTH_COPY.localModeLabel;
}

function getAuthPanelNotice(panelName) {
  if (getAuthMode() === "firebase") {
    return panelName === "register" ? AUTH_COPY.remoteRegisterNotice : AUTH_COPY.remoteLoginNotice;
  }
  return panelName === "register" ? AUTH_COPY.registerLocalNotice : AUTH_COPY.loginLocalNotice;
}

const firebaseApp = initializeApp(REMOTE_AUTH_CONFIG.firebaseConfig);
const firebaseAuth = getAuth(firebaseApp);
const firestoreDb = getFirestore(firebaseApp);
const firebaseReady = getAuthMode() === "firebase";
console.log("[Auth] mode:", AUTH_CONFIG.mode);
console.log("[Firebase] initialized:", firebaseReady);
let resolveFirebaseAuthReady = null;
const firebaseAuthReady = new Promise(resolve => {
  resolveFirebaseAuthReady = resolve;
});

onAuthStateChanged(firebaseAuth, user => {
  resolveFirebaseAuthReady(user);
});

async function waitForFirebaseAuthReady() {
  await firebaseAuthReady;
  return firebaseAuth.currentUser;
}

// Auth Service
// Local fallback is for testing only. A real close beta should validate beta codes
// and hash PIN/passwords in a backend or auth provider such as Firebase/Supabase.
if (getAuthMode() === "local") {
  if (AUTH_CONFIG.remoteEnabled || AUTH_CONFIG.useRemoteAuth || REMOTE_AUTH_CONFIG.enabled) {
    console.warn("[Auth] Remote auth is not configured completely. Falling back to local auth.");
  }
  console.warn("[Auth] Using local fallback auth. This is not production-safe for a real close beta.");
}

const DEFAULT_ACT_PROGRESS = {
  currentActId: "past-fragment",
  currentLessonId: "what-is-past",
  currentStageId: "what-is-past",
  lessonPhase: "teacherExplanation",
  currentDialogueIndex: 0,
  currentLessonStepIndex: 0,
  completedLessons: [],
  defeatedBosses: [],
  unlockedStages: ["what-is-past"],
  currentScreen: "story",
  lastSafeScreen: "story",
  lastUpdatedAt: null
};

const GRAMMARIA_POINTS = {
  correctAnswer: 10,
  parry: 15,
  charge: 5
};

const GRAMMARIA_CHARGE_CONFIG = {
  speedPerSecond: 80,
  min: 0,
  max: 100
};

const REVIVE_CONFIG = {
  enabled: true,
  chance: 0.10,
  hpPercentAfterRevive: 0.35,
  maxRevivesPerBattle: 1,
  source: "master"
};

const CONFIGURED_MAX_GRAMMARIA = 750;

const state = {
  currentUser: null,
  dialogueIndex: 0,
  typewriterTimer: null,
  typewriterText: "",
  typewriterIndex: 0,
  isTypingDialogue: false,
  isPrologueActive: false,
  prologueIndex: 0,
  prologueTextIndex: 0,
  prologueTyping: false,
  prologueTimer: null,
  prologueCurrentLine: "",
  prologueCompleteCallback: null,
  activeDialogue: [],
  awaitingName: false,
  awaitingDialogueChoice: false,
  isTransitioning: false,
  enemyTurnTimer: null,
  selectedNouns: new Set(),
  playerHp: 100,
  enemyHp: 80,
  grammaria: 0,
  sparkBonus: 0,
  currentQuestion: null,
  answerCorrect: false,
  selectedCharm: null,
  shield: 0,
  guardShield: 0,
  charge: null,
  parry: null,
  parryAttack: null,
  enemyMaxHp: 80,
  actStageIndex: 0,
  actBattle: null,
  currentBattleStats: null,
  lastGrammariaResult: null,
  lastStageResult: null,
  lessonSteps: [],
  lessonStepIndex: 0,
  currentLessonStage: null,
  postBossDialogueStage: null,
  activeReplayLessonId: null,
  replayReturnProgress: null,
  lessonStoryMode: false,
  lessonStorySteps: [],
  lessonStoryStepIndex: 0,
  lastCharmSet: [],
  battleActiveEffects: {},
  isLessonSummaryOpen: false,
  usedGeneralQuestionIds: new Set(),
  lastGeneralQuestionBaseVerb: "",
  pointParry: null,
  timeDustTransitionComplete: false,
  isReturningToMainMenu: false,
  manualSaveInProgress: false,
  nextDialogueHold: null,
  audioUnlocked: false,
  currentBgmKey: "",
  pendingBgmKey: "",
  isMuted: false,
  audioLocked: true,
  typewriterAudioUnlocked: false,
  lastDialogueTypeSfxAt: 0,
  dialogueTypeSfxWarned: false,
  dialogueTypeSfxPoolIndex: 0,
  victoryMusicPlayedForBattle: false,
  victoryMusicActive: false
};

const BGM_PATHS = {
  login: "assets/bgm/into-lingua-v1.mp3",
  hall: "assets/bgm/verions-grammar-hall.mp3",
  battle: "assets/bgm/lingua-spell-battle.mp3",
  victoryScene: "assets/bgm/victory-scene.mp3",
  edForge: "assets/bgm/ed_forge_bgm.mp3"
};

const BGM_LOOP = {
  login: true,
  hall: true,
  battle: true,
  victoryScene: false,
  edForge: true
};

const DEFAULT_BGM_VOLUME = 0.45;
const BGM_FADE_MS = 650;
const BGM_VOLUME = {
  edForge: 0.32
};

const ED_FORGE_BGM_STAGE_IDS = new Set([
  "regular-intro",
  "regular-rule-1",
  "regular-rule-2",
  "regular-rule-3",
  "regular-rule-4",
  "ed-mini-boss"
]);

const bgmTracks = Object.fromEntries(
  Object.entries(BGM_PATHS).map(([key, path]) => [key, new Audio(path)])
);
const bgmFadeTimers = new Map();

function getBgmVolume(key) {
  return BGM_VOLUME[key] ?? DEFAULT_BGM_VOLUME;
}

Object.entries(bgmTracks).forEach(([key, track]) => {
  track.loop = Boolean(BGM_LOOP[key]);
  track.preload = "auto";
  track.volume = getBgmVolume(key);
  track.addEventListener("error", error => {
    console.warn(`[BGM] ${key} track failed to load`, {
      src: BGM_PATHS[key],
      error
    });
  }, { once: true });
});

const DIALOGUE_TYPE_SFX_PATH = "assets/sfx/dialogue-type.mp3";
const DIALOGUE_TYPE_SFX_OFFSET = 0.12;
const DIALOGUE_TYPE_SFX_TICK_MS = 180;
const DIALOGUE_TYPE_SFX_COOLDOWN_MS = 65;
const DIALOGUE_TYPE_SFX_VOLUME = 0.16;
const SFX_PATHS = {
  attack: "assets/sfx/attack-hit.mp3",
  button: "assets/sfx/button-click.mp3"
};
const SFX_VOLUME = {
  attack: 0.65,
  button: 0.45
};
const SFX_POOL_SIZE = 3;
const dialogueTypeSfx = new Audio(DIALOGUE_TYPE_SFX_PATH);
dialogueTypeSfx.preload = "auto";
dialogueTypeSfx.volume = DIALOGUE_TYPE_SFX_VOLUME;
const dialogueTypeSfxPool = Array.from({ length: 4 }, () => {
  const track = new Audio(DIALOGUE_TYPE_SFX_PATH);
  track.preload = "auto";
  track.volume = DIALOGUE_TYPE_SFX_VOLUME;
  return track;
});
dialogueTypeSfxPool.forEach(track => {
  track.addEventListener("error", error => {
    console.warn("[Audio] typewriter file failed to load", error);
  }, { once: true });
});
dialogueTypeSfxPool.forEach(track => track.load());

const sfxPools = Object.fromEntries(
  Object.entries(SFX_PATHS).map(([key, path]) => [
    key,
    Array.from({ length: SFX_POOL_SIZE }, () => {
      const track = new Audio(path);
      track.preload = "auto";
      track.volume = SFX_VOLUME[key] || 0.5;
      track.addEventListener("error", error => {
        console.warn(`[Audio] ${key} SFX failed to load`, error);
      }, { once: true });
      return track;
    })
  ])
);
const sfxPoolIndexes = Object.fromEntries(Object.keys(SFX_PATHS).map(key => [key, 0]));
sfxPools.attack.forEach(track => track.load());
sfxPools.button.forEach(track => track.load());

let dialogueTypeSfxLoadedLogged = false;

function logDialogueTypeSfxLoaded() {
  if (dialogueTypeSfxLoadedLogged) {
    return;
  }

  dialogueTypeSfxLoadedLogged = true;
  console.log("[Audio] Loaded assets/sfx/dialogue-type.mp3");
}

dialogueTypeSfx.addEventListener("loadeddata", logDialogueTypeSfxLoaded, { once: true });
dialogueTypeSfx.addEventListener("canplaythrough", logDialogueTypeSfxLoaded, { once: true });

dialogueTypeSfx.addEventListener("error", error => {
  console.warn("[Audio] typewriter file failed to load", error);
}, { once: true });

dialogueTypeSfx.load();

const els = {
  muteButton: document.getElementById("muteButton"),
  manualSaveButton: document.getElementById("manualSaveButton"),
  logoutButton: document.getElementById("logoutButton"),
  showLoginPanelButton: document.getElementById("showLoginPanelButton"),
  showRegisterPanelButton: document.getElementById("showRegisterPanelButton"),
  loginPanel: document.getElementById("loginPanel"),
  registerPanel: document.getElementById("registerPanel"),
  authModeLabel: document.getElementById("authModeLabel"),
  loginLocalNotice: document.getElementById("loginLocalNotice"),
  registerLocalNotice: document.getElementById("registerLocalNotice"),
  loginButton: document.getElementById("loginButton"),
  registerButton: document.getElementById("registerButton"),
  guestLoginButton: document.getElementById("guestLoginButton"),
  mainMenuLogo: document.getElementById("mainMenuLogo"),
  mainMenuLogoFallback: document.getElementById("mainMenuLogoFallback"),
  mainMenuAvatar: document.getElementById("mainMenuAvatar"),
  mainMenuPlayerName: document.getElementById("mainMenuPlayerName"),
  mainMenuPlayerTitle: document.getElementById("mainMenuPlayerTitle"),
  mainMenuCurrentAct: document.getElementById("mainMenuCurrentAct"),
  mainMenuGrammaria: document.getElementById("mainMenuGrammaria"),
  mainMenuCurrentLesson: document.getElementById("mainMenuCurrentLesson"),
  mainMenuCurrentArea: document.getElementById("mainMenuCurrentArea"),
  mainMenuNextGoal: document.getElementById("mainMenuNextGoal"),
  mainMenuProgressPercent: document.getElementById("mainMenuProgressPercent"),
  mainMenuProgressFill: document.getElementById("mainMenuProgressFill"),
  mainMenuBossesDefeated: document.getElementById("mainMenuBossesDefeated"),
  mainMenuCollection: document.getElementById("mainMenuCollection"),
  continueJourneyButton: document.getElementById("continueJourneyButton"),
  lessonMapButton: document.getElementById("lessonMapButton"),
  assessmentResultButton: document.getElementById("assessmentResultButton"),
  accountSettingsButton: document.getElementById("accountSettingsButton"),
  mainMenuLogoutButton: document.getElementById("mainMenuLogoutButton"),
  loginUsername: document.getElementById("loginUsername"),
  loginPin: document.getElementById("loginPin"),
  registerDisplayName: document.getElementById("registerDisplayName"),
  registerUsername: document.getElementById("registerUsername"),
  registerPin: document.getElementById("registerPin"),
  registerConfirmPin: document.getElementById("registerConfirmPin"),
  registerBetaCode: document.getElementById("registerBetaCode"),
  loginStatus: document.getElementById("loginStatus"),
  classNameSelect: document.getElementById("classNameSelect"),
  keyStageSelect: document.getElementById("keyStageSelect"),
  roomInput: document.getElementById("roomInput"),
  avatarPreview: document.getElementById("avatarPreview"),
  avatarPreviewText: document.getElementById("avatarPreviewText"),
  createCharacterButton: document.getElementById("createCharacterButton"),
  createStatus: document.getElementById("createStatus"),
  storyNameForm: document.getElementById("storyNameForm"),
  storyNameInput: document.getElementById("storyNameInput"),
  confirmNameButton: document.getElementById("confirmNameButton"),
  namePromptStatus: document.getElementById("namePromptStatus"),
  startButton: document.getElementById("startButton"),
  speakerName: document.getElementById("speakerName"),
  dialogueText: document.getElementById("dialogueText"),
  dialogueChoices: document.getElementById("dialogueChoices"),
  dialoguePortraitSlot: document.getElementById("dialoguePortraitSlot"),
  dialogueSpeakerPortrait: document.getElementById("dialogueSpeakerPortrait"),
  previousDialogueButton: document.getElementById("previousDialogueButton"),
  nextDialogueButton: document.getElementById("nextDialogueButton"),
  lessonGrammariaDisplay: document.getElementById("lessonGrammariaDisplay"),
  dialoguePanel: document.getElementById("dialoguePanel"),
  dialogueActions: document.getElementById("dialogueActions"),
  lessonStoryVisual: document.getElementById("lessonStoryVisual"),
  nounActivity: document.getElementById("nounActivity"),
  nounActivityVisual: document.getElementById("nounActivityVisual"),
  explanationCloseButton: document.getElementById("explanationCloseButton"),
  wordGrid: document.getElementById("wordGrid"),
  activityFeedback: document.getElementById("activityFeedback"),
  battleButton: document.getElementById("battleButton"),
  playerHpFill: document.getElementById("playerHpFill"),
  playerApPips: document.getElementById("playerApPips"),
  enemyHpFill: document.getElementById("enemyHpFill"),
  playerHpText: document.getElementById("playerHpText"),
  enemyHpText: document.getElementById("enemyHpText"),
  grammariaText: document.getElementById("grammariaText"),
  shieldText: document.getElementById("shieldText"),
  bossStatusText: document.getElementById("bossStatusText"),
  battleTitle: document.getElementById("battleTitle"),
  battleExitButton: document.getElementById("battleExitButton"),
  battleTurnIndicator: document.getElementById("battleTurnIndicator"),
  battleCurrentTurn: document.getElementById("battleCurrentTurn"),
  battleCurrentTurnActor: document.getElementById("battleCurrentTurnActor"),
  battleUpcomingTurnList: document.getElementById("battleUpcomingTurnList"),
  battleEnemySprite: document.getElementById("battleEnemySprite"),
  battleEnemyName: document.getElementById("battleEnemyName"),
  battleEnemyDescription: document.getElementById("battleEnemyDescription"),
  battleMessage: document.getElementById("battleMessage"),
  bossIntentPanel: document.getElementById("bossIntentPanel"),
  bossIntentName: document.getElementById("bossIntentName"),
  bossIntentText: document.getElementById("bossIntentText"),
  bossIntentType: document.getElementById("bossIntentType"),
  bossIntentReadyButton: document.getElementById("bossIntentReadyButton"),
  actionMenu: document.getElementById("actionMenu"),
  attackButton: document.getElementById("attackButton"),
  itemButton: document.getElementById("itemButton"),
  focusButton: document.getElementById("focusButton"),
  questionPanel: document.getElementById("questionPanel"),
  questionText: document.getElementById("questionText"),
  answerOptions: document.getElementById("answerOptions"),
  charmPanel: document.getElementById("charmPanel"),
  charmOptions: document.getElementById("charmOptions"),
  chargePanel: document.getElementById("chargePanel"),
  chargeBar: document.getElementById("chargeBar"),
  perfectZone: document.getElementById("perfectZone"),
  chargeMarker: document.getElementById("chargeMarker"),
  chargePercentText: document.getElementById("chargePercentText"),
  chargeFeedbackText: document.getElementById("chargeFeedbackText"),
  stopChargeButton: document.getElementById("stopChargeButton"),
  parryPanel: document.getElementById("parryPanel"),
  enemyAttackName: document.getElementById("enemyAttackName"),
  parryHitText: document.getElementById("parryHitText"),
  parryCountdown: document.getElementById("parryCountdown"),
  parryGaugeZone: document.getElementById("parryGaugeZone"),
  parryGaugeMarker: document.getElementById("parryGaugeMarker"),
  parryHitResult: document.getElementById("parryHitResult"),
  parryButton: document.getElementById("parryButton"),
  pointParryPanel: document.getElementById("pointParryPanel"),
  pointParryTitle: document.getElementById("pointParryTitle"),
  pointParryInstruction: document.getElementById("pointParryInstruction"),
  pointParryArena: document.getElementById("pointParryArena"),
  pointParryResult: document.getElementById("pointParryResult"),
  continueBattleButton: document.getElementById("continueBattleButton"),
  victoryTitle: document.getElementById("victoryTitle"),
  victoryEnemy: document.getElementById("victoryEnemy"),
  victoryStory: document.getElementById("victoryStory"),
  victoryGrammaria: document.getElementById("victoryGrammaria"),
  victoryExtra: document.getElementById("victoryExtra"),
  victoryBadge: document.getElementById("victoryBadge"),
  victoryFragmentText: document.getElementById("victoryFragmentText"),
  returnTitleButton: document.getElementById("returnTitleButton"),
  sceneTransition: document.getElementById("sceneTransition"),
  transitionText: document.getElementById("transitionText"),
  prologueOverlay: document.getElementById("prologueOverlay"),
  prologueText: document.getElementById("prologueText"),
  prologueHint: document.getElementById("prologueHint"),
  prologueNextButton: document.getElementById("prologueNextButton"),
  storyWanderer: document.getElementById("storyWanderer"),
  storyVerion: document.getElementById("storyVerion"),
  lessonBackButton: document.getElementById("lessonBackButton"),
  lessonSelectButton: document.getElementById("lessonSelectButton"),
  lessonDictionaryButton: document.getElementById("lessonDictionaryButton"),
  lessonExplainButton: document.getElementById("lessonExplainButton"),
  lessonReviewButton: document.getElementById("lessonReviewButton"),
  skipLessonButton: document.getElementById("skipLessonButton"),
  skipBattleButton: document.getElementById("skipBattleButton"),
  lessonActLabel: document.getElementById("lessonActLabel"),
  lessonLocationLabel: document.getElementById("lessonLocationLabel"),
  lessonProgressText: document.getElementById("lessonProgressText"),
  battlePlayer: document.getElementById("battlePlayer"),
  battleEnemy: document.getElementById("battleEnemy"),
  gameModal: document.getElementById("gameModal"),
  gameModalClose: document.getElementById("gameModalClose"),
  gameModalTitle: document.getElementById("gameModalTitle"),
  gameModalBody: document.getElementById("gameModalBody"),
  gameModalContent: document.getElementById("gameModalContent"),
  gameModalActions: document.getElementById("gameModalActions")
};

function showScene(name) {
  cleanupButtonsForSceneChange(name);
  if (name !== "battle") {
    cleanupBattleSkillEffects();
  }
  if (name === "login" || name === "createCharacter") {
    stopTypewriter();
    state.isTypingDialogue = false;
  }
  if (name !== "story") {
    stopDialogueTypeSfx();
  }
  Object.values(scenes).forEach(scene => scene.classList.remove("active"));
  if (["story", "battle", "mainMenu"].includes(name)) {
    refreshPlayerCharacterSprites();
  }
  scenes[name].classList.add("active");
  applyDebugButtonVisibility();
  updateManualSaveButtonVisibility(name);
  playBgmForScene(name);
  renderBattleTurnIndicator();
}

function cleanupButtonsForSceneChange(nextScene) {
  if (nextScene !== "battle") {
    clearParryLayoutState();
  }
  if (nextScene !== "battle") {
    cleanupBattleInputState();
  }
  if (nextScene !== "story" && nextScene !== "battle") {
    clearBattleButtonAction({ hide: true });
  }
}

function bgmKeyForScene(sceneName) {
  if (sceneName === "login" || sceneName === "mainMenu" || sceneName === "createCharacter") {
    return "login";
  }
  if (shouldUseEdForgeBgm(sceneName)) {
    return "edForge";
  }
  if (sceneName === "battle") {
    return "battle";
  }
  return "hall";
}

function getBgmContextStages(sceneName) {
  const stages = sceneName === "battle"
    ? [state.actBattle?.stage]
    : [
      state.currentLessonStage,
      state.postBossDialogueStage
    ];
  if (typeof getPlayableStages === "function") {
    stages.push(getPlayableStages()[state.actStageIndex]);
  }
  return stages.filter(Boolean);
}

function isEdForgeBgmStage(stage) {
  const stageId = typeof stage === "string" ? stage : stage?.id;
  return ED_FORGE_BGM_STAGE_IDS.has(stageId);
}

function shouldUseEdForgeBgm(sceneName) {
  if (sceneName !== "story" && sceneName !== "battle") {
    return false;
  }
  return getBgmContextStages(sceneName).some(isEdForgeBgmStage);
}

function playBgmForScene(sceneName) {
  if (sceneName === "victory") {
    playVictorySceneMusicOnce();
    return;
  }
  stopVictorySceneMusic();
  playBgm(bgmKeyForScene(sceneName));
}

function playBgm(key, options = {}) {
  if (!bgmTracks[key]) {
    return false;
  }
  if (state.isMuted) {
    return false;
  }
  if (!state.audioUnlocked) {
    state.pendingBgmKey = key;
    return false;
  }

  const shouldRestart = options.restart === true;
  if (!shouldRestart && state.currentBgmKey === key && !bgmTracks[key].paused) {
    if (state.pendingBgmKey === key) {
      state.pendingBgmKey = "";
    }
    return true;
  }

  const previousKey = state.currentBgmKey;
  const previousTrack = previousKey ? bgmTracks[previousKey] : null;
  const shouldFadeEdForgeTransition = previousKey &&
    previousKey !== key &&
    (previousKey === "edForge" || key === "edForge") &&
    options.fade !== false;

  Object.entries(bgmTracks).forEach(([trackKey, track]) => {
    if (trackKey !== key && (!shouldFadeEdForgeTransition || trackKey !== previousKey)) {
      clearBgmFadeTimer(trackKey);
      track.pause();
      track.currentTime = 0;
    }
  });

  state.currentBgmKey = key;
  bgmTracks[key].loop = Boolean(BGM_LOOP[key]);
  bgmTracks[key].muted = state.isMuted;
  if (shouldRestart) {
    bgmTracks[key].currentTime = 0;
  }
  if (shouldFadeEdForgeTransition) {
    fadeOutPreviousBgm(previousKey, previousTrack);
    fadeInBgm(key, bgmTracks[key]);
  } else {
    clearBgmFadeTimer(key);
    bgmTracks[key].volume = getBgmVolume(key);
  }
  const playPromise = bgmTracks[key].play();
  if (playPromise && typeof playPromise.then === "function") {
    playPromise
      .then(() => {
        if (state.pendingBgmKey === key) {
          state.pendingBgmKey = "";
        }
      })
      .catch(error => {
        state.pendingBgmKey = key;
        console.warn("[BGM] Playback blocked until user interaction", {
          trackId: key,
          src: BGM_PATHS[key],
          currentTrackId: state.currentBgmKey,
          error
        });
      });
  }
  return true;
}

function clearBgmFadeTimer(key) {
  const frameId = bgmFadeTimers.get(key);
  if (frameId) {
    cancelAnimationFrame(frameId);
    bgmFadeTimers.delete(key);
  }
}

function fadeBgmTrack(key, track, fromVolume, toVolume, durationMs, onComplete) {
  clearBgmFadeTimer(key);
  const startedAt = performance.now();
  track.volume = fromVolume;

  const step = now => {
    const progress = clamp((now - startedAt) / durationMs, 0, 1);
    track.volume = fromVolume + (toVolume - fromVolume) * progress;
    if (progress >= 1) {
      bgmFadeTimers.delete(key);
      if (onComplete) {
        onComplete();
      }
      return;
    }
    bgmFadeTimers.set(key, requestAnimationFrame(step));
  };

  bgmFadeTimers.set(key, requestAnimationFrame(step));
}

function fadeOutPreviousBgm(previousKey, previousTrack) {
  if (!previousTrack || previousTrack.paused) {
    return;
  }
  fadeBgmTrack(previousKey, previousTrack, previousTrack.volume, 0, BGM_FADE_MS, () => {
    previousTrack.pause();
    previousTrack.currentTime = 0;
    previousTrack.volume = getBgmVolume(previousKey);
  });
}

function fadeInBgm(key, track) {
  clearBgmFadeTimer(key);
  const targetVolume = getBgmVolume(key);
  track.volume = 0;
  fadeBgmTrack(key, track, 0, targetVolume, BGM_FADE_MS);
}

function playVictorySceneMusic() {
  const didPlay = playBgm("victoryScene", { restart: true });
  if (didPlay) {
    state.victoryMusicActive = true;
  }
  return didPlay;
}

function playVictorySceneMusicOnce() {
  if (state.victoryMusicPlayedForBattle) {
    return false;
  }

  const didPlay = playVictorySceneMusic();
  if (didPlay) {
    state.victoryMusicPlayedForBattle = true;
  }
  return didPlay;
}

function stopVictorySceneMusic() {
  const track = bgmTracks.victoryScene;
  if (!track) {
    return;
  }
  track.pause();
  track.currentTime = 0;
  state.victoryMusicActive = false;
  if (state.currentBgmKey === "victoryScene") {
    state.currentBgmKey = "";
  }
}

function resetVictorySceneMusicForBattle() {
  state.victoryMusicPlayedForBattle = false;
  stopVictorySceneMusic();
}

function shouldPlayDialogueTypeSfx() {
  if (!canPlayTypewriterSfx()) {
    return false;
  }
  return state.isTypingDialogue
    && state.audioUnlocked
    && state.typewriterAudioUnlocked
    && !state.isMuted
    && scenes.story
    && scenes.story.classList.contains("active")
    && els.dialoguePanel
    && !els.dialoguePanel.classList.contains("hidden");
}

function canPlayTypewriterSfx() {
  if (state.isPrologueActive) {
    return state.prologueTyping === true;
  }
  return state.isTypingDialogue
    && scenes.story
    && scenes.story.classList.contains("active")
    && els.dialoguePanel
    && !els.dialoguePanel.classList.contains("hidden");
}

function prepareDialogueTypeSfxTrack(track, volume = DIALOGUE_TYPE_SFX_VOLUME) {
  track.preload = "auto";
  track.src = DIALOGUE_TYPE_SFX_PATH;
  track.volume = volume;
  track.muted = state.isMuted;
  try {
    track.load();
  } catch (error) {
    console.warn("[Audio] typewriter file failed to load", error);
  }
}

function resumeAudioContextIfPresent() {
  const context = window.audioContext || window.gameAudioContext || window.linguaAudioContext;
  if (!context || context.state !== "suspended" || typeof context.resume !== "function") {
    return;
  }

  context.resume().catch(error => {
    console.warn("[Audio] audio context resume failed", error);
  });
}

function seekDialogueTypeSfxStart(track) {
  try {
    track.currentTime = Math.min(DIALOGUE_TYPE_SFX_OFFSET, Math.max(track.duration - 0.05, 0) || DIALOGUE_TYPE_SFX_OFFSET);
  } catch (error) {
    track.currentTime = 0;
  }
}

function getDialogueTypeSfxTrack() {
  const track = dialogueTypeSfxPool[state.dialogueTypeSfxPoolIndex % dialogueTypeSfxPool.length];
  state.dialogueTypeSfxPoolIndex += 1;
  return track;
}

function prepareSfxTrack(track, key) {
  track.preload = "auto";
  track.volume = SFX_VOLUME[key] || 0.5;
  track.muted = state.isMuted;
  try {
    track.load();
  } catch (error) {
    console.warn(`[Audio] ${key} SFX failed to load`, error);
  }
}

function getSfxTrack(key) {
  const pool = sfxPools[key];
  if (!pool || !pool.length) {
    return null;
  }
  const index = sfxPoolIndexes[key] % pool.length;
  sfxPoolIndexes[key] = index + 1;
  return pool[index];
}

function playSfx(key) {
  if (!state.audioUnlocked || state.isMuted) {
    return;
  }

  const track = getSfxTrack(key);
  if (!track) {
    return;
  }

  track.pause();
  track.currentTime = 0;
  track.volume = SFX_VOLUME[key] || 0.5;
  track.muted = state.isMuted;
  track.play().catch(() => {});
}

function playAttackSfx() {
  playSfx("attack");
}

function playButtonSfx() {
  if (!state.audioUnlocked) {
    unlockGameAudio();
  }
  playSfx("button");
}

function shouldPlayButtonSfxForEvent(event) {
  const button = event.target?.closest?.("button");
  if (!button || button.disabled || button.getAttribute("aria-disabled") === "true") {
    return false;
  }
  if (button.id === "stopChargeButton") {
    return false;
  }
  return true;
}

function handleButtonSfxPointer(event) {
  if (shouldPlayButtonSfxForEvent(event)) {
    playButtonSfx();
  }
}

function handleButtonSfxKey(event) {
  if (event.repeat || (event.key !== "Enter" && event.key !== " ")) {
    return;
  }
  if (shouldPlayButtonSfxForEvent(event)) {
    playButtonSfx();
  }
}

function playDialogueTypeSfxTick(character) {
  if (!shouldPlayDialogueTypeSfx() || /\s/.test(character)) {
    return;
  }

  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  if (state.typewriterIndex % 2 !== 0 || now - state.lastDialogueTypeSfxAt < DIALOGUE_TYPE_SFX_COOLDOWN_MS) {
    return;
  }
  state.lastDialogueTypeSfxAt = now;

  const track = getDialogueTypeSfxTrack();
  if (track.dialogueTypeSfxStopTimer) {
    clearTimeout(track.dialogueTypeSfxStopTimer);
  }

  track.pause();
  seekDialogueTypeSfxStart(track);
  track.volume = DIALOGUE_TYPE_SFX_VOLUME;
  track.muted = state.isMuted;
  track.play().catch(error => {
    if (!state.dialogueTypeSfxWarned) {
      console.warn("[Audio] typewriter play failed", error);
      state.dialogueTypeSfxWarned = true;
    }
  });

  track.dialogueTypeSfxStopTimer = setTimeout(() => {
    track.pause();
    track.currentTime = 0;
    track.dialogueTypeSfxStopTimer = null;
  }, DIALOGUE_TYPE_SFX_TICK_MS);
}

function stopDialogueTypeSfx() {
  [dialogueTypeSfx, ...dialogueTypeSfxPool].forEach(track => {
    if (track.dialogueTypeSfxStopTimer) {
      clearTimeout(track.dialogueTypeSfxStopTimer);
      track.dialogueTypeSfxStopTimer = null;
    }
    track.pause();
    track.currentTime = 0;
  });
}

function stopPrologueTypewriterSound() {
  dialogueTypeSfxPool.forEach(track => {
    if (track.dialogueTypeSfxStopTimer) {
      clearTimeout(track.dialogueTypeSfxStopTimer);
      track.dialogueTypeSfxStopTimer = null;
    }
    track.pause();
    track.currentTime = 0;
  });
  state.lastDialogueTypeSfxAt = 0;
}

function clearPrologueTypingTimer() {
  if (state.prologueTimer) {
    clearTimeout(state.prologueTimer);
    state.prologueTimer = null;
  }
}

function unlockGameAudio() {
  const shouldLogUnlock = !state.audioUnlocked || !state.typewriterAudioUnlocked || Boolean(state.pendingBgmKey);
  if (shouldLogUnlock) {
    console.log("[Audio] unlock requested");
  }
  resumeAudioContextIfPresent();
  if (!state.audioUnlocked) {
    state.audioUnlocked = true;
    state.audioLocked = false;
  }

  const activeScene = Object.keys(scenes).find(key => scenes[key].classList.contains("active")) || "login";
  if (state.pendingBgmKey && bgmTracks[state.pendingBgmKey]) {
    playBgm(state.pendingBgmKey, { fade: false });
  } else {
    playBgmForScene(activeScene);
  }

  if (state.typewriterAudioUnlocked) {
    return;
  }

  [dialogueTypeSfx, ...dialogueTypeSfxPool].forEach(track => prepareDialogueTypeSfxTrack(track, DIALOGUE_TYPE_SFX_VOLUME));
  Object.entries(sfxPools).forEach(([key, pool]) => {
    pool.forEach(track => prepareSfxTrack(track, key));
  });
  state.typewriterAudioUnlocked = true;
  state.audioLocked = false;
}

function toggleMute() {
  state.isMuted = !state.isMuted;
  Object.values(bgmTracks).forEach(track => {
    track.muted = state.isMuted;
    if (state.isMuted) {
      track.pause();
    }
  });
  [dialogueTypeSfx, ...dialogueTypeSfxPool].forEach(track => {
    track.muted = state.isMuted;
  });
  Object.values(sfxPools).flat().forEach(track => {
    track.muted = state.isMuted;
  });

  if (state.isMuted) {
    stopDialogueTypeSfx();
  }

  if (els.muteButton) {
    els.muteButton.textContent = state.isMuted ? "เสียง: ปิด" : "เสียง: เปิด";
    els.muteButton.setAttribute("aria-pressed", state.isMuted ? "true" : "false");
  }

  if (!state.isMuted) {
    unlockGameAudio();
    if (state.victoryMusicActive || state.currentBgmKey === "victoryScene") {
      playBgm("victoryScene");
    } else {
      const activeScene = Object.keys(scenes).find(key => scenes[key].classList.contains("active")) || "login";
      playBgmForScene(activeScene);
    }
  }
}

function runSceneTransition(message, onCovered) {
  if (state.isTransitioning) {
    return;
  }

  state.isTransitioning = true;
  els.transitionText.textContent = message;
  els.sceneTransition.classList.remove("hidden");

  requestAnimationFrame(() => {
    els.sceneTransition.classList.add("visible");
  });

  setTimeout(() => {
    onCovered();

    setTimeout(() => {
      els.sceneTransition.classList.remove("visible");

      setTimeout(() => {
        els.sceneTransition.classList.add("hidden");
        state.isTransitioning = false;
        updateManualSaveButtonVisibility();
      }, 620);
    }, 160);
  }, 620);
}

function resetSceneTransitionOverlay() {
  if (els.sceneTransition) {
    els.sceneTransition.classList.remove("visible");
    els.sceneTransition.classList.add("hidden");
  }
  state.isTransitioning = false;
  updateManualSaveButtonVisibility();
}

function runLessonUnitTransition(message, { onCovered, onFinished } = {}) {
  if (state.isTransitioning) {
    return false;
  }

  state.isTransitioning = true;
  setButtonEnabled(els.nextDialogueButton, false);
  setButtonEnabled(els.battleButton, false);
  setButtonEnabled(els.continueBattleButton, false);
  if (els.transitionText) {
    els.transitionText.textContent = message || "กำลังเดินทางสู่บทเรียนถัดไป...";
  }
  els.sceneTransition.classList.remove("hidden");

  requestAnimationFrame(() => {
    els.sceneTransition.classList.add("visible");
  });

  setTimeout(() => {
    try {
      if (typeof onCovered === "function") {
        onCovered();
      }
    } catch (error) {
      console.error("[LessonTransition] Failed while scene was covered", error);
      resetSceneTransitionOverlay();
      return;
    }

    setTimeout(() => {
      els.sceneTransition.classList.remove("visible");

      setTimeout(() => {
        resetSceneTransitionOverlay();
        try {
          if (typeof onFinished === "function") {
            onFinished();
          }
        } catch (error) {
          console.error("[LessonTransition] Failed after fade in", error);
          resetSceneTransitionOverlay();
        }
      }, 620);
    }, 160);
  }, 620);

  return true;
}

function closeGameModal() {
  if (!els.gameModal) {
    return;
  }

  els.gameModal.dataset.modalLocked = "false";
  els.gameModal.classList.add("hidden");
  els.gameModalClose.classList.remove("hidden");
  setButtonEnabled(els.gameModalClose, true);
  els.gameModalTitle.textContent = "";
  els.gameModalBody.textContent = "";
  els.gameModalContent.innerHTML = "";
  els.gameModalActions.innerHTML = "";
}

function isGameModalOpen() {
  return els.gameModal && !els.gameModal.classList.contains("hidden");
}

function setButtonEnabled(button, enabled) {
  if (!button) {
    return;
  }

  button.disabled = !enabled;
  button.setAttribute("aria-disabled", enabled ? "false" : "true");
  button.classList.toggle("disabled", !enabled);
  button.classList.toggle("is-disabled", !enabled);
  if (enabled) {
    button.classList.remove("is-locked");
    delete button.dataset.buttonLocked;
  }
}

function clearButtonAction(button, options = {}) {
  if (!button) {
    return;
  }

  button.onclick = null;
  delete button.dataset.buttonLocked;
  button.classList.remove("is-locked", "is-loading");
  if (options.disable !== false) {
    setButtonEnabled(button, false);
  }
}

function setButtonAction(button, label, handler, options = {}) {
  if (!button) {
    return;
  }

  clearButtonAction(button, { disable: false });
  if (label !== null && label !== undefined) {
    button.textContent = label;
  }
  if (options.hidden === false) {
    button.classList.remove("hidden");
  } else if (options.hidden === true) {
    button.classList.add("hidden");
  }
  setButtonEnabled(button, options.enabled !== false);

  button.onclick = event => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (button.disabled || button.classList.contains("hidden")) {
      return;
    }
    if (state.isTransitioning && !options.allowDuringTransition) {
      return;
    }
    if (options.lock !== false) {
      if (button.dataset.buttonLocked === "true") {
        return;
      }
      button.dataset.buttonLocked = "true";
      button.classList.add("is-locked");
      setButtonEnabled(button, false);
    }
    if (typeof handler === "function") {
      const result = handler(event);
      if (result === false && options.lock !== false) {
        delete button.dataset.buttonLocked;
        button.classList.remove("is-locked");
        setButtonEnabled(button, true);
      }
    }
  };
}

function runButtonActionOnce(button, callback) {
  if (!button || button.disabled || button.dataset.buttonLocked === "true") {
    return false;
  }
  button.dataset.buttonLocked = "true";
  button.classList.add("is-locked");
  setButtonEnabled(button, false);
  if (typeof callback === "function") {
    callback();
  }
  return true;
}

function openGameModal({ title, body = "", content = "", actions = [], lockClose = false }) {
  if (!els.gameModal) {
    return;
  }

  els.gameModal.dataset.modalLocked = "false";
  els.gameModalClose.classList.toggle("hidden", Boolean(lockClose));
  setButtonEnabled(els.gameModalClose, !lockClose);
  els.gameModalTitle.textContent = title;
  els.gameModalBody.textContent = body;
  els.gameModalContent.innerHTML = "";
  els.gameModalActions.innerHTML = "";

  if (typeof content === "string") {
    els.gameModalContent.innerHTML = content;
  } else if (content) {
    els.gameModalContent.appendChild(content);
  }

  actions.forEach(action => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = action.primary ? "primary-button" : "secondary-button";
    button.textContent = action.label;
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      if (els.gameModal.dataset.modalLocked === "true") {
        return;
      }
      els.gameModal.dataset.modalLocked = "true";
      els.gameModalActions.querySelectorAll("button").forEach(actionButton => setButtonEnabled(actionButton, false));
      setButtonEnabled(els.gameModalClose, false);
      if (typeof action.onClick === "function") {
        action.onClick(event);
      }
    });
    els.gameModalActions.appendChild(button);
  });

  els.gameModal.classList.remove("hidden");
}

function showOnlyBattlePanel(panelToShow) {
  els.questionPanel?.classList.remove("boss-v2-arrangement-active");
  scenes.battle?.classList.remove("arrangement-layout-active");
  [
    els.bossIntentPanel,
    els.actionMenu,
    els.questionPanel,
    els.charmPanel,
    els.chargePanel,
    els.parryPanel,
    els.pointParryPanel,
    els.continueBattleButton
  ]
    .filter(Boolean)
    .forEach(panel => panel.classList.add("hidden"));

  if (panelToShow !== els.continueBattleButton) {
    clearButtonAction(els.continueBattleButton, { disable: true });
  }
  if (panelToShow !== els.bossIntentPanel) {
    clearButtonAction(els.bossIntentReadyButton, { disable: true });
  }

  if (panelToShow) {
    panelToShow.classList.remove("hidden");
  }
  updateParryLayoutState(panelToShow);
}

function isParryLayoutPanel(panel) {
  return panel === els.parryPanel || panel === els.pointParryPanel;
}

function syncVisibleViewportHeight() {
  const height = window.visualViewport?.height || window.innerHeight;
  if (!height) {
    return;
  }
  document.documentElement.style.setProperty("--visible-viewport-height", `${Math.round(height)}px`);
}

function updateParryLayoutState(panelToShow = null) {
  syncVisibleViewportHeight();
  const isActive = isParryLayoutPanel(panelToShow);
  document.body.classList.toggle("parry-active", isActive);
  if (scenes.battle) {
    scenes.battle.classList.toggle("parry-layout-active", isActive);
  }
}

function clearParryLayoutState() {
  document.body.classList.remove("parry-active");
  if (scenes.battle) {
    scenes.battle.classList.remove("parry-layout-active");
  }
}

function startParryBarAfterLayout(challengeId, durationMs, onTimeout) {
  syncVisibleViewportHeight();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (!isCurrentParryBarChallenge(challengeId)) {
        return;
      }
      scheduleParryBarArming(challengeId);
      startParryGauge(challengeId);
      state.parry.resolveTimeout = setTimeout(() => {
        if (!isCurrentParryBarChallenge(challengeId)) {
          return;
        }
        onTimeout();
      }, durationMs);
    });
  });
}

function enableBattleButton(button) {
  setButtonEnabled(button, true);
}

function disableBattleButton(button) {
  setButtonEnabled(button, false);
}

function resetBattleContinueControls() {
  clearButtonAction(els.continueBattleButton, { disable: false });
  clearButtonAction(els.bossIntentReadyButton, { disable: false });
}

function showBattleContinueButton(label, onClick) {
  setButtonAction(els.continueBattleButton, label, onClick, { hidden: false });
}

function setBattleButtonAction(label, onClick, options = {}) {
  setButtonAction(els.battleButton, label, onClick, { hidden: false, ...options });
}

function clearBattleButtonAction({ hide = true } = {}) {
  clearButtonAction(els.battleButton, { disable: true });
  if (hide && els.battleButton) {
    els.battleButton.classList.add("hidden");
  }
}

function setBattleTurnOwner(owner) {
  const battle = state.actBattle;
  if (battle && (owner === "player" || owner === "enemy")) {
    battle.currentTurnActor = owner === "enemy" ? "boss" : "player";
  }
  els.battlePlayer.classList.toggle("is-active-turn", owner === "player");
  els.battleEnemy.classList.toggle("is-active-turn", owner === "enemy");
  renderBattleTurnIndicator();
}

function getBattleCurrentActorForDisplay(battle = state.actBattle) {
  if (!battle || isActBattleEnded(battle)) {
    return "";
  }
  return battle.currentTurnActor || (
    battle.pendingBossTurn ||
    battle.pendingBossAction ||
    battle.awaitingParry ||
    battle.awaitingPrepare ||
    battle.heavyAttackState?.active ||
    battle.bossGrammarChallenge?.active
      ? "boss"
      : "player"
  );
}

function getBattleActorLabel(actor, { current = false } = {}) {
  if (actor === "boss") {
    return current ? "ตาของบอส" : "บอส";
  }
  return current ? "ตาของผู้เล่น" : "ผู้เล่น";
}

function buildAlternatingTurnPreview(currentActor, count = 5) {
  const preview = [];
  let actor = currentActor === "boss" ? "player" : "boss";
  for (let index = 0; index < count; index += 1) {
    preview.push({
      actor,
      label: getBattleActorLabel(actor)
    });
    actor = actor === "boss" ? "player" : "boss";
  }
  return preview;
}

function getBattleTurnPreview(count = 5) {
  const battle = state.actBattle;
  const currentActor = getBattleCurrentActorForDisplay(battle);
  if (!currentActor) {
    return [];
  }
  return buildAlternatingTurnPreview(currentActor, count).slice(0, count);
}

function hideBattleTurnIndicator() {
  if (!els.battleTurnIndicator) {
    return;
  }
  els.battleTurnIndicator.classList.add("hidden");
  if (els.battleUpcomingTurnList) {
    els.battleUpcomingTurnList.innerHTML = "";
  }
}

function renderBattleTurnIndicator() {
  if (!els.battleTurnIndicator || !els.battleCurrentTurnActor || !els.battleUpcomingTurnList) {
    return;
  }

  const battle = state.actBattle;
  const isBattleSceneActive = scenes.battle?.classList.contains("active");
  const currentActor = getBattleCurrentActorForDisplay(battle);
  if (!isBattleSceneActive || !currentActor) {
    hideBattleTurnIndicator();
    return;
  }

  const upcomingTurns = getBattleTurnPreview(5);
  if (upcomingTurns.length !== 5) {
    hideBattleTurnIndicator();
    return;
  }

  els.battleTurnIndicator.classList.remove("hidden", "is-player-turn", "is-boss-turn");
  els.battleTurnIndicator.classList.add(currentActor === "boss" ? "is-boss-turn" : "is-player-turn");
  els.battleCurrentTurnActor.textContent = getBattleActorLabel(currentActor, { current: true });
  els.battleCurrentTurn.dataset.actor = currentActor;
  els.battleUpcomingTurnList.innerHTML = "";
  upcomingTurns.forEach((turn, index) => {
    const slot = document.createElement("div");
    slot.className = `battle-turn-slot battle-turn-slot--${turn.actor}`;
    slot.innerHTML = `
      <span class="turn-order-number">${index + 1}</span>
      <span class="turn-actor-name">${turn.label}</span>
    `;
    els.battleUpcomingTurnList.appendChild(slot);
  });
}

function setActionButtonsEnabled(isEnabled) {
  [els.attackButton, els.itemButton, els.focusButton].forEach(button => {
    setButtonEnabled(button, isEnabled);
  });
  updateActActionMenuState();
}

function isActBattleEnded(battle = state.actBattle) {
  return !battle || battle.victoryHandled || battle.isDefeated || battle.battleLocked || battle.phase === "ended" || battle.isActive === false;
}

function disableBattleInputsForDefeat() {
  setActionButtonsEnabled(false);
  [
    els.answerOptions,
    els.charmOptions,
    els.continueBattleButton,
    els.stopChargeButton,
    els.parryButton,
    els.bossIntentReadyButton
  ].filter(Boolean).forEach(container => {
    if (container.tagName === "BUTTON") {
      disableBattleButton(container);
      return;
    }
    container.querySelectorAll("button").forEach(button => {
      button.disabled = true;
    });
  });
}

function cleanupBattleInputState() {
  stopTimer("charge");
  stopParryCountdown();
  cleanupPointParryRingUI();
  cleanupBossHeavyAttackChain({ clearParryUi: false });
  clearButtonAction(els.continueBattleButton, { disable: true });
  clearButtonAction(els.bossIntentReadyButton, { disable: true });
  setActionButtonsEnabled(false);
  state.parryAttack = null;
  state.shield = 0;
  state.guardShield = 0;
}

function cleanupBossHeavyAttackChain({ clearParryUi = true } = {}) {
  const battle = state.actBattle;
  if (battle) {
    battle.heavyAttackState = null;
  }
  if (clearParryUi) {
    stopParryCountdown();
    cleanupPointParryRingUI();
  }
}

function getRevivedHp(percent = REVIVE_CONFIG.hpPercentAfterRevive) {
  return Math.max(1, Math.round(100 * percent));
}

function tryPlayerRevive(reason = "") {
  const battle = state.actBattle;
  if (!battle || battle.reviveUsedThisBattle || (battle.reviveCount || 0) >= REVIVE_CONFIG.maxRevivesPerBattle) {
    return false;
  }

  const effects = state.battleActiveEffects || {};
  if (effects.surviveFatalOnce) {
    effects.surviveFatalOnce = false;
    battle.reviveUsedThisBattle = true;
    battle.reviveCount = (battle.reviveCount || 0) + 1;
    battle.justRevived = true;
    state.playerHp = getRevivedHp(effects.surviveFatalHealPercent || 0.4);
    updateBattleStats();
    syncBattleStateToPlayerData();
    els.battleMessage.textContent = `${reason ? `${reason}\n` : ""}เครื่องรางแห่ง Lingua เปล่งประกาย! พลังสุดท้ายปกป้องเจ้าจากความพ่ายแพ้`;
    return true;
  }

  if (!REVIVE_CONFIG.enabled || Math.random() > REVIVE_CONFIG.chance) {
    return false;
  }

  battle.reviveUsedThisBattle = true;
  battle.reviveCount = (battle.reviveCount || 0) + 1;
  battle.justRevived = true;
  state.playerHp = getRevivedHp();
  updateBattleStats();
  syncBattleStateToPlayerData();
  els.battleMessage.textContent = `${reason ? `${reason}\n` : ""}แสงเวทของมาสเตอร์เวร์ออนสว่างขึ้น! เจ้าได้รับโอกาสสุดท้ายและฟื้นพลังกลับมา`;
  return true;
}

function resolvePlayerDefeat(reason = "HP เหลือ 0") {
  const battle = state.actBattle;
  if (!battle) {
    if (state.playerHp <= 0) {
      showLegacyDefeatScreen(reason);
      return true;
    }
    return false;
  }
  if (battle.battleLocked || battle.isDefeated || battle.victoryHandled) {
    return true;
  }
  if (state.playerHp > 0) {
    return false;
  }

  state.playerHp = 0;
  updateBattleStats();
  syncBattleStateToPlayerData();

  if (tryPlayerRevive(reason)) {
    return false;
  }

  showDefeatScreen(reason);
  return true;
}

function showLegacyDefeatScreen(reason = "HP เหลือ 0") {
  state.playerHp = 0;
  disableBattleInputsForDefeat();
  cleanupBattleInputState();
  updateBattleStats();

  const content = document.createElement("div");
  content.className = "defeat-result";
  content.innerHTML = `
    <p class="defeat-cause">${reason}</p>
    <p>พลังของเจ้าหมดลงในการต่อสู้ครั้งนี้ แต่บทเรียนยังไม่สิ้นสุด</p>
  `;

  openGameModal({
    title: "พ่ายแพ้…",
    body: "HP เหลือ 0",
    content,
    lockClose: true,
    actions: [
      {
        label: "ลองสู้ใหม่",
        primary: true,
        onClick: () => {
          closeGameModal();
          resetBattle();
        }
      },
      {
        label: "ไปเรียนบทนี้ใหม่",
        onClick: () => {
          closeGameModal();
          resetBattle();
          showScene("story");
        }
      }
    ]
  });
}

function showDefeatScreen(reason = "HP เหลือ 0") {
  const battle = state.actBattle;
  if (!battle) {
    return;
  }

  battle.isDefeated = true;
  battle.battleLocked = true;
  battle.isActive = false;
  battle.phase = "defeated";
  disableBattleInputsForDefeat();
  cleanupBattleInputState();
  showOnlyBattlePanel(null);
  updateBattleStats();
  saveProgress({
    currentStageId: battle.stage.id,
    currentLessonId: battle.stage.id,
    currentScreen: "lesson",
    lastSafeScreen: "lesson",
    currentDialogueIndex: battle.reviewDialogueIndex || 0,
    currentLessonStepIndex: battle.reviewLessonStepIndex || 0
  });

  const content = document.createElement("div");
  content.className = "defeat-result";
  content.innerHTML = `
    <p class="defeat-cause">${reason || "HP เหลือ 0"}</p>
    <p>พลังของเจ้าหมดลงในการต่อสู้ครั้งนี้ แต่บทเรียนยังไม่สิ้นสุด</p>
  `;

  openGameModal({
    title: "พ่ายแพ้…",
    body: "HP เหลือ 0",
    content,
    lockClose: true,
    actions: [
      {
        label: "ลองสู้ใหม่",
        primary: true,
        onClick: retryCurrentBattle
      },
      {
        label: "ไปเรียนบทนี้ใหม่",
        onClick: returnToCurrentLessonFromDefeat
      }
    ]
  });
}

function retryCurrentBattle() {
  const battle = state.actBattle;
  const stageIndex = battle?.reviewStageIndex ?? state.actStageIndex;
  closeGameModal();
  cleanupBattleInputState();
  state.actBattle = null;
  state.currentBattleStats = null;
  state.playerHp = 100;
  state.enemyHp = 100;
  runSceneTransition("ลุกขึ้นอีกครั้ง การต่อสู้เริ่มใหม่...", () => startActBattle(stageIndex));
}

function returnToCurrentLessonFromDefeat() {
  const battle = state.actBattle;
  const stageIndex = battle?.reviewStageIndex ?? state.actStageIndex;
  closeGameModal();
  cleanupBattleInputState();
  state.actBattle = null;
  state.currentBattleStats = null;
  state.playerHp = 100;
  state.enemyHp = 100;
  restoreLessonUIAfterBattle();
  runSceneTransition("กลับไปทบทวนบทเรียนอีกครั้ง...", () => {
    showStageLesson(stageIndex, { lessonStepIndex: 0, dialogueIndex: 0 });
  });
}

function clearForcedSceneTransitionLock() {
  state.isTransitioning = false;
  if (els.sceneTransition) {
    els.sceneTransition.classList.remove("visible");
    els.sceneTransition.classList.add("hidden");
  }
}

function hideBattleUICompletely() {
  console.log("[TimeDust] Hiding battle UI completely");
  setActionButtonsEnabled(false);
  stopTimer("charge");
  stopParryCountdown();
  cleanupPointParryRingUI();
  state.parryAttack = null;
  showOnlyBattlePanel(null);
  document.body.classList.remove("battle-mode", "combat-mode", "modal-open");
  Object.values(scenes).forEach(scene => {
    if (scene) {
      scene.classList.remove("active");
    }
  });
  if (scenes.battle) {
    scenes.battle.setAttribute("aria-hidden", "true");
  } else {
    console.warn("[TimeDust] Battle scene element was not found");
  }
}

function showLessonUICompletely() {
  console.log("[TimeDust] Showing lesson UI completely");
  if (!scenes.story) {
    console.warn("[TimeDust] Story/Lesson scene element was not found");
    return;
  }
  scenes.story.removeAttribute("aria-hidden");
  scenes.story.classList.add("active");
  if (scenes.battle) {
    scenes.battle.setAttribute("aria-hidden", "true");
  }
  playBgmForScene("story");
}

function restoreNextButtonForLesson() {
  console.log("[TimeDust] Restoring lesson buttons");
  if (els.nextDialogueButton) {
    els.nextDialogueButton.disabled = false;
    els.nextDialogueButton.classList.remove("disabled");
  } else {
    console.warn("[TimeDust] Next dialogue button was not found");
  }
  if (els.battleButton) {
    setButtonEnabled(els.battleButton, true);
  } else {
    console.warn("[TimeDust] Lesson main button was not found");
  }
}

function showTimeDustNextLessonFallback(stage) {
  if (!els.continueBattleButton) {
    console.warn("[TimeDust] Fallback continue button was not found");
    return;
  }

  showBattleContinueButton("ไปบทเรียนถัดไป", () => {
    console.log("[TimeDust] Fallback button clicked");
    transitionToRegularEdLessonAfterTimeDust(stage);
  });
}

function transitionToRegularEdLessonAfterTimeDust(stage) {
  if (state.timeDustTransitionComplete && !state.actBattle) {
    console.log("[TimeDust] Transition already completed");
    return;
  }

  console.log("[TimeDust] Calling transitionToRegularEdLessonAfterTimeDust");
  state.timeDustTransitionComplete = true;
  clearForcedSceneTransitionLock();

  const nextStageId = "regular-rule-1";
  const nextIndex = getStageIndexById(nextStageId);
  const nextStage = getPlayableStages()[nextIndex] || getStageById(nextStageId);
  if (!nextStage || nextIndex < 0) {
    console.warn("[TimeDust] Regular -ed lesson stage was not found:", nextStageId);
    state.timeDustTransitionComplete = false;
    showTimeDustNextLessonFallback(stage);
    return;
  }

  if (state.actBattle) {
    state.actBattle.victoryHandled = true;
    state.actBattle.isActive = false;
    state.actBattle.phase = "ended";
  }

  unlockStage(nextStageId);
  if (stage) {
    markCompletedLesson(stage.id);
    markBossDefeated(stage);
  }

  state.enemyHp = 0;
  state.actBattle = null;
  state.actStageIndex = nextIndex;
  state.currentLessonStage = nextStage;
  state.lessonStepIndex = 0;
  state.lessonStoryStepIndex = 0;

  const progress = saveProgress({
    currentActId: DEFAULT_ACT_PROGRESS.currentActId,
    currentStageId: nextStageId,
    currentLessonId: nextStageId,
    currentScreen: "lesson",
    lastSafeScreen: "lesson",
    currentDialogueIndex: 0,
    currentLessonStepIndex: 0
  });
  console.log("[TimeDust] Current lesson:", progress?.currentLessonId);

  transitionToActBackground(
    getAct1BackgroundKeyForStage(nextStage),
    "ไทม์ดัสต์สลายไปแล้ว... กฎของ Regular Verbs กำลังเปิดออก",
    () => {
      hideBattleUICompletely();
      restoreLessonUIAfterBattle();
      showLessonUICompletely();
      showStageLesson(nextIndex, { lessonStepIndex: 0, dialogueIndex: 0 });
      restoreNextButtonForLesson();
      console.log("[TimeDust] Lesson UI shown");
    }
  );
}

const ACT_MAX_AP = 5;

function normalizeBossBalanceKey(stage) {
  const raw = [
    stage?.id,
    stage?.enemy,
    stage?.enemyId,
    stage?.bossId,
    stage?.title,
    stage?.thaiEnemy
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (raw.includes("time") && raw.includes("dust")) {
    return "timeDust";
  }
  if (raw.includes("echo") && raw.includes("tick")) {
    return "echoTick";
  }
  if (raw.includes("echo") && raw.includes("trick")) {
    return "echoTrick";
  }
  if (raw.includes("forger") || raw.includes("ed-forger") || raw.includes("-ed")) {
    return "edForger";
  }
  if (raw.includes("yesterday") && raw.includes("sprite")) {
    return "yesterdaySprite";
  }
  if (raw.includes("yesterday") && raw.includes("spirit")) {
    return "yesterdaySpirit";
  }
  if (raw.includes("ภูติเมื่อวาน") || raw.includes("ภูตเมื่อวาน")) {
    return "yesterdaySprite";
  }

  return "";
}

function getBalancedBossMaxHp(stage, baseHp = 100) {
  const configuredHp = ACT1_ENCOUNTER_MAX_HP[String(stage?.id || "")];
  if (Number.isFinite(configuredHp) && configuredHp > 0) {
    return configuredHp;
  }
  const normalizedBaseHp = Math.max(1, Number(stage?.enemyMaxHp || stage?.maxHp || stage?.hp || baseHp) || baseHp);
  if (isFinalBossStage(stage)) {
    return normalizedBaseHp;
  }

  if (PHASE1_STARTER_STAGE_IDS.has(stage?.id)) {
    return normalizedBaseHp;
  }

  const bossKey = normalizeBossBalanceKey(stage);
  const balance = EARLY_BOSS_BALANCE[bossKey];
  if (!balance) {
    return normalizedBaseHp;
  }

  const multipliedHp = Math.round(normalizedBaseHp * (balance.hpMultiplier || 1));
  const minHp = Number(balance.minMaxHp || normalizedBaseHp);
  const balancedMaxHp = Math.max(normalizedBaseHp, minHp, multipliedHp);
  console.log("[Balance] boss hp", {
    stageId: stage?.id,
    enemy: stage?.enemy,
    baseHp: normalizedBaseHp,
    balancedMaxHp
  });
  return balancedMaxHp;
}

function applyFocusBuffFromMeditation() {
  const battle = state.actBattle;
  if (!battle) {
    return null;
  }

  const hadActiveBuff = Boolean(battle.focusBuff?.active);
  battle.focusBuff = {
    active: true,
    bonusPercent: FOCUS_BALANCE_CONFIG.focusDamageBonusPercent,
    stacks: FOCUS_BALANCE_CONFIG.maxFocusStacks,
    source: "meditation",
    appliesToNextAttackOnly: FOCUS_BALANCE_CONFIG.buffAppliesToNextAttackOnly,
    improveCharmRoll: true
  };
  battle.consecutiveFocusUses = (battle.consecutiveFocusUses || 0) + 1;
  return { hadActiveBuff, focusBuff: battle.focusBuff };
}

function applyFocusBonusToDamage(baseDamage, focusBuff = null) {
  if (!focusBuff?.active) {
    return {
      damage: baseDamage,
      focusBonusDamage: 0,
      focusBonusPercent: 0
    };
  }

  const focusBonusPercent = Math.min(
    Number(focusBuff.bonusPercent || 0),
    FOCUS_BALANCE_CONFIG.focusDamageBonusPercent
  );
  const focusBonusDamage = Math.round(baseDamage * (focusBonusPercent / 100));
  const damage = baseDamage + focusBonusDamage;
  console.log("[FocusBalance] applied to damage", {
    baseDamage,
    focusBonusPercent,
    focusBonusDamage,
    finalDamage: damage
  });
  return {
    damage,
    focusBonusDamage,
    focusBonusPercent
  };
}

function capCombinedDamageBonus(baseDamage, bonuses = {}) {
  const focusPercent = Number(bonuses.focusPercent || 0);
  const chargePercent = Number(bonuses.chargePercent || 0);
  const totalPercent = Math.min(
    focusPercent + chargePercent,
    FOCUS_BALANCE_CONFIG.maxCombinedBonusPercent
  );
  const bonusDamage = Math.round(baseDamage * (totalPercent / 100));
  return {
    totalPercent,
    bonusDamage,
    finalDamage: baseDamage + bonusDamage
  };
}

function clearFocusBuffAfterAttack(battle) {
  if (!battle?.focusBuff) {
    return;
  }
  battle.focusBuff.active = false;
  battle.focusBuff.stacks = 0;
  battle.focusBuff.bonusPercent = 0;
  battle.focusBuff = null;
  battle.consecutiveFocusUses = 0;
}

function getActBattle() {
  return state.actBattle;
}

function getActAP() {
  const battle = getActBattle();
  return battle ? clamp(Number(battle.ap || 0), 0, ACT_MAX_AP) : 0;
}

function setActAP(value) {
  const battle = getActBattle();
  if (!battle) {
    updateActAPUI();
    return;
  }
  battle.ap = clamp(Number(value || 0), 0, ACT_MAX_AP);
  updateActAPUI();
  updateActActionMenuState();
}

function gainActAP(amount) {
  const battle = getActBattle();
  if (!battle || !amount) {
    return;
  }
  setActAP(getActAP() + amount);
}

function spendActAP(cost) {
  const battle = getActBattle();
  if (!battle) {
    return false;
  }
  if (getActAP() < cost) {
    return false;
  }
  setActAP(getActAP() - cost);
  return true;
}

function updateActAPUI() {
  if (!els.playerApPips) {
    return;
  }

  if (!state.actBattle) {
    els.playerApPips.classList.add("hidden");
    els.playerApPips.innerHTML = "";
    return;
  }

  els.playerApPips.classList.remove("hidden");
  const ap = getActAP();
  els.playerApPips.innerHTML = "";
  for (let index = 0; index < ACT_MAX_AP; index += 1) {
    const pip = document.createElement("span");
    pip.className = `ap-pip${index < ap ? " is-filled" : ""}`;
    els.playerApPips.appendChild(pip);
  }
}

function updateActActionMenuState() {
  const battle = getActBattle();
  if (!battle || !els.actionMenu || els.actionMenu.classList.contains("hidden")) {
    return;
  }

  const ap = getActAP();
  const canChoose = !battle.actionChoiceLocked && !isActBattleEnded(battle);
  setButtonEnabled(els.attackButton, canChoose && ap >= 1);
  setButtonEnabled(els.itemButton, canChoose);
  setButtonEnabled(els.focusButton, canChoose);
  els.focusButton.classList.toggle("is-focus-hint", ap <= 0);
}

function canChooseActPlayerAction() {
  const battle = state.actBattle;
  if (!battle || isActBattleEnded(battle)) {
    return false;
  }
  if (!els.actionMenu || els.actionMenu.classList.contains("hidden")) {
    return false;
  }
  if (battle.actionChoiceLocked || battle.skillFlowLocked || battle.awaitingGrammarCharge || battle.pendingBossTurn || battle.pendingBossAction) {
    return false;
  }
  return battle.playerActionPhase === "question";
}

function chooseActPlayerActionOnce(actionHandler) {
  const battle = state.actBattle;
  if (!canChooseActPlayerAction()) {
    return false;
  }
  battle.actionChoiceLocked = true;
  setActionButtonsEnabled(false);
  actionHandler();
  return true;
}

function beginActPlayerTurn(message = "", options = {}) {
  const battle = getActBattle();
  if (!battle) {
    return;
  }
  if (isActBattleEnded(battle)) {
    console.log("[Battle] beginActPlayerTurn blocked because battle already ended");
    return;
  }

  setBattleTurnOwner("player");
  ensureBattleSkillCooldownState(battle);
  if (!options.preservePlayerTurnCounter) {
    battle.playerTurnCounter = Math.max(0, Number(battle.playerTurnCounter) || 0) + 1;
  }
  battle.pendingPlayerAttack = null;
  if (BATTLE_FLOW_V2_CONFIG.enabled) {
    resetBattleFlowV2Selection({ phase: "question", cleanupCharge: true });
  }
  battle.pendingBossAction = null;
  battle.pendingBossTurn = null;
  battle.bossIntentReadyConsumed = false;
  battle.actionChoiceLocked = false;
  battle.awaitingParry = false;
  battle.awaitingPrepare = false;
  battle.playerActionPhase = "question";
  showOnlyBattlePanel(els.actionMenu);
  resetBattleContinueControls();
  els.continueBattleButton.classList.add("hidden");
  els.battleMessage.textContent = message || (getActAP() <= 0
    ? "AP หมดชั่วคราว ใช้ตั้งสมาธิเพื่อฟื้น AP"
    : `${battle.stage.title} - เลือกการกระทำ`);
  updateBattleStats();
  updateActActionMenuState();
}

function clearEnemyTurnTimer() {
  if (state.enemyTurnTimer) {
    clearTimeout(state.enemyTurnTimer);
    state.enemyTurnTimer = null;
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function sample(array, count) {
  const copy = [...array];
  const result = [];

  while (copy.length && result.length < count) {
    const index = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(index, 1)[0]);
  }

  return result;
}

function shuffleArray(array) {
  const copy = [...array];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function getQuestionId(question, index = 0, prefix = "q") {
  if (question?.id) {
    return question.id;
  }

  const text = question?.prompt || question?.sentence || question?.baseVerb || "question";
  const answer = question?.answer || question?.correctAnswer || question?.correct || "answer";
  const ruleId = question?.ruleId || "rule";
  const lessonId = question?.lessonId || "lesson";
  return [
    prefix,
    lessonId,
    ruleId,
    index,
    String(text).slice(0, 40),
    String(answer).slice(0, 24)
  ].join("-");
}

function prepareQuestion(rawQuestion, index = 0) {
  return {
    ...rawQuestion,
    id: getQuestionId(rawQuestion, index),
    correctAnswer: rawQuestion.answer ?? rawQuestion.correct,
    options: shuffleArray(rawQuestion.options || [])
  };
}

function pickQuestion(pool, usedSet, lastBaseVerb = "") {
  if (!pool || !pool.length) {
    return null;
  }

  const usageLimit = Math.ceil(pool.length * 0.2);
  let available = pool.filter((question, index) => !usedSet.has(getQuestionId(question, index)));
  if (available.length <= usageLimit) {
    usedSet.clear();
    available = [...pool];
  }

  const withoutSameVerb = available.filter(question => !question.baseVerb || question.baseVerb !== lastBaseVerb);
  if (withoutSameVerb.length) {
    available = withoutSameVerb;
  }

  return sample(available, 1)[0] || pool[0];
}

function getAllowedRuleIdsForStage(stage) {
  if (!stage) {
    return [];
  }
  if (Array.isArray(stage.allowedRuleIds)) {
    return stage.allowedRuleIds;
  }

  const stageRules = {
    "what-is-past": ["pastMeaning"],
    "what-is-tense": ["pastTimeWords"],
    "act1_phase1_unit3_was_were": ["wasWere"],
    "act1_phase1_unit4_there_was_were": ["thereWasWere"],
    "act1_phase1_unit5_had": ["hadPast"],
    "regular-rule-1": ["regular_ed"],
    "regular-rule-2": ["ending_e_add_d"],
    "regular-rule-3": ["y_rule"],
    "regular-rule-4": ["cvc_double"],
    "ed-mini-boss": ["regular_ed", "ending_e_add_d", "y_rule", "cvc_double"],
    "irregular-lesson": ["irregular_v2"],
    "irregular-mini-boss": ["irregular_v2"],
    "final-boss": ["regular_ed", "ending_e_add_d", "y_rule", "cvc_double", "irregular_v2", "final_review"]
  };

  return stageRules[stage.id] || [];
}

function normalizeStageQuestionMetadata() {
  PAST_FRAGMENT_ACT.stages.forEach(stage => {
    const allowedRuleIds = getAllowedRuleIdsForStage(stage);
    const fallbackRuleId = allowedRuleIds[0] || `${stage.id}_rule`;
    normalizeQuestionMeta(stage.questions || [], stage.id, fallbackRuleId);
  });
}

normalizeStageQuestionMetadata();

function filterQuestionsForStage(questions, stage) {
  const allowedRuleIds = getAllowedRuleIdsForStage(stage);
  const reservedTeachingWords = getReservedTeachingVerbsForStage(stage);
  if (!allowedRuleIds.length) {
    return questions || [];
  }

  const filtered = (questions || []).filter(question => {
    const ruleId = question.ruleId || inferRuleIdFromQuestion(question);
    const baseWord = getQuestionBaseWord(question);
    return ruleId && allowedRuleIds.includes(ruleId) && (!baseWord || !reservedTeachingWords.has(baseWord));
  });

  const invalid = (questions || []).filter(question => {
    const ruleId = question.ruleId || inferRuleIdFromQuestion(question);
    const baseWord = getQuestionBaseWord(question);
    return !ruleId || !allowedRuleIds.includes(ruleId) || (baseWord && reservedTeachingWords.has(baseWord));
  });

  if (invalid.length) {
    console.warn("[Invalid Question] This question is not unlocked:", invalid);
  }

  console.log("[Boss Questions]", filtered.map(q => q.ruleId || inferRuleIdFromQuestion(q)), filtered.map((q, index) => getQuestionId(q, index)));
  return filtered;
}

function weightedPickFromTable(table) {
  const entries = Object.entries(table);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;

  for (const [key, weight] of entries) {
    roll -= weight;
    if (roll <= 0) {
      return key;
    }
  }

  return entries[entries.length - 1][0];
}

function getPlayerHpPercent() {
  return clamp((state.playerHp || 0) / 100, 0, 1);
}

function shouldUseLowHpCharmBias() {
  return getPlayerHpPercent() <= 0.35;
}

function getCharmPoolByRules(rank, excludedIds, allowHighRank = true) {
  let pool = actAttackCharms.filter(charm => charm.rank === rank && !excludedIds.has(charm.id));

  if (!allowHighRank) {
    pool = pool.filter(charm => charm.rank !== "S" && charm.rank !== "SS");
  }

  if (!pool.length) {
    pool = actAttackCharms.filter(charm => charm.rank === rank);
  }

  return pool;
}

function selectRandomActCharms() {
  const battle = state.actBattle;
  const rates = shouldUseLowHpCharmBias() ? LOW_HP_CHARM_RANK_DROP_RATES : CHARM_RANK_DROP_RATES;
  const recentIds = new Set([...(battle?.recentCharmIds || []), ...(state.lastCharmSet || [])]);
  const selected = [];
  const selectedIds = new Set();
  let highRankCount = 0;
  let attempts = 0;

  while (selected.length < 3 && attempts < 80) {
    attempts += 1;
    const rank = weightedPickFromTable(rates);
    const allowHighRank = highRankCount < 1;
    const excluded = new Set([...recentIds, ...selectedIds]);
    const pool = getCharmPoolByRules(rank, excluded, allowHighRank);
    const charm = sample(pool, 1)[0];

    if (!charm || selectedIds.has(charm.id)) {
      continue;
    }

    if ((charm.rank === "S" || charm.rank === "SS") && highRankCount >= 1) {
      continue;
    }

    selected.push(charm);
    selectedIds.add(charm.id);
    if (charm.rank === "S" || charm.rank === "SS") {
      highRankCount += 1;
    }
  }

  if (selected.length < 3) {
    const fallback = actAttackCharms.filter(charm => !selectedIds.has(charm.id));
    selected.push(...sample(fallback, 3 - selected.length));
  }

  const ranks = selected.map(charm => charm.rank);
  const allSameRank = ranks.length === 3 && ranks.every(rank => rank === ranks[0]);
  if (allSameRank) {
    const replacement = sample(actAttackCharms.filter(charm => charm.rank !== ranks[0] && !selectedIds.has(charm.id)), 1)[0];
    if (replacement) {
      selected[2] = replacement;
    }
  }

  if (shouldUseLowHpCharmBias() && !selected.some(charm => charm.type === "heal" || charm.type === "defense")) {
    const rescuePool = actAttackCharms.filter(charm =>
      (charm.type === "heal" || charm.type === "defense") &&
      (charm.rank === "C" || charm.rank === "B") &&
      !selectedIds.has(charm.id)
    );
    const rescueCharm = sample(rescuePool, 1)[0];
    if (rescueCharm) {
      const replaceIndex = selected.findIndex(charm => charm.rank === "S" || charm.rank === "SS");
      selected[replaceIndex >= 0 ? replaceIndex : 2] = rescueCharm;
    }
  }

  if (battle?.focusBuff?.improveCharmRoll && !selected.some(charm => charm.rank === "A" || charm.rank === "S" || charm.rank === "SS")) {
    const improvedCharm = sample(actAttackCharms.filter(charm => (charm.rank === "A" || charm.rank === "S") && !selectedIds.has(charm.id)), 1)[0];
    if (improvedCharm) {
      selected[2] = improvedCharm;
    }
  }

  const choices = selected.slice(0, 3);
  state.lastCharmSet = choices.map(charm => charm.id);

  if (battle) {
    battle.recentCharmIds = [...(battle.recentCharmIds || []), ...state.lastCharmSet].slice(-6);
  }

  return choices;
}

function resetBattleActiveEffects() {
  state.battleActiveEffects = {
    parrySlow: 0,
    parrySlowMultiplier: 1,
    parryWide: 0,
    parryWideBonus: 0,
    secondChance: 0,
    hint: 0,
    retry: 0,
    echoDamageNextTurn: 0,
    criticalChanceBonus: 0,
    forceCriticalNextAttack: 0,
    stunChance: 0,
    stunBuildBonus: 0,
    stunOnCriticalChance: 0,
    counterOnGoodParry: 0,
    blockIfGoodParry: 0,
    reflectNextBossAttack: 0,
    upgradeNextParry: 0,
    stunOnPerfectParry: 0,
    perfectTimelineCounterMultiplier: 1,
    bossWeak: 0,
    bossWeakTurns: 0,
    markDamageBonus: 0,
    pierceBossShieldNextAttack: 0,
    lifestealRatio: 0,
    nextCorrectBonusGrammaria: 0,
    crystalCharge: 0,
    memoryCharge: 0,
    stackingDamageBonus: 0,
    surviveFatalOnce: false
  };
}

function createBattleStatusBucket() {
  return {
    stunGauge: 0,
    stunThreshold: STATUS_BALANCE_CONFIG.stun.defaultThreshold,
    stunnedTurns: 0,
    defenseShieldPercent: 0,
    defenseShieldHits: 0,
    hitShieldStacks: 0,
    markedTurns: 0,
    markedHits: 0,
    markDamageBonus: 0
  };
}

function resetBattleStatuses(battle = state.actBattle) {
  if (!battle) {
    return null;
  }
  battle.statuses = {
    player: createBattleStatusBucket(),
    boss: createBattleStatusBucket()
  };
  return battle.statuses;
}

function ensureBattleStatuses(battle = state.actBattle) {
  if (!battle) {
    return null;
  }
  if (!battle.statuses || typeof battle.statuses !== "object") {
    resetBattleStatuses(battle);
  }
  ["player", "boss"].forEach(target => {
    battle.statuses[target] = {
      ...createBattleStatusBucket(),
      ...(battle.statuses[target] || {})
    };
  });
  battle.bossStunned = false;
  if (state.guardShield > 0) {
    battle.statuses.player.defenseShieldPercent = Math.max(
      battle.statuses.player.defenseShieldPercent || 0,
      clamp(Number(state.guardShield) || 0, 0, STATUS_BALANCE_CONFIG.shield.maxDefenseShieldPercent)
    );
    battle.statuses.player.defenseShieldHits = Math.max(battle.statuses.player.defenseShieldHits || 0, 1);
    state.guardShield = 0;
  }
  if (state.shield > 0) {
    battle.statuses.player.defenseShieldPercent = Math.max(
      battle.statuses.player.defenseShieldPercent || 0,
      clamp(Number(state.shield) || 0, 0, STATUS_BALANCE_CONFIG.shield.maxDefenseShieldPercent)
    );
    battle.statuses.player.defenseShieldHits = Math.max(battle.statuses.player.defenseShieldHits || 0, 1);
    state.shield = 0;
  }
  return battle.statuses;
}

function getBattleStatus(target, battle = state.actBattle) {
  const statuses = ensureBattleStatuses(battle);
  return statuses?.[target] || null;
}

function statusLog(label, payload = {}) {
  console.log(`[StatusSystem] ${label}`, payload);
}

function addStunGauge(target, amount, source = "", lines = []) {
  const status = getBattleStatus(target);
  if (!status || !amount) {
    return false;
  }
  const buildAmount = Math.max(0, Math.round(Number(amount) || 0));
  if (!buildAmount) {
    return false;
  }
  const threshold = getTargetStunThreshold(target);
  status.stunGauge = clamp(getTargetStunValue(target) + buildAmount, 0, threshold);
  addBattleMessageLine(lines, `${target === "boss" ? "บอส" : "ผู้เล่น"} สะสม Stun +${buildAmount}`);
  statusLog("stun build", { target, amount: buildAmount, gauge: status.stunGauge, source });
  return applyStunIfThresholdReached(target, lines);
}

function getTargetStunValue(target, battle = state.actBattle) {
  const status = getBattleStatus(target, battle);
  const value = Number(status?.stunGauge);
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, value);
}

function getTargetStunThreshold(target, battle = state.actBattle) {
  const status = getBattleStatus(target, battle);
  const threshold = Number(status?.stunThreshold ?? STATUS_BALANCE_CONFIG.stun.defaultThreshold);
  if (!Number.isFinite(threshold) || threshold <= 0) {
    return STATUS_BALANCE_CONFIG.stun.defaultThreshold;
  }
  return threshold;
}

function applyStunIfThresholdReached(target, lines = []) {
  const status = getBattleStatus(target);
  if (!status) {
    return false;
  }
  const threshold = getTargetStunThreshold(target);
  if (getTargetStunValue(target) < threshold) {
    return false;
  }
  status.stunnedTurns = Math.max(
    status.stunnedTurns || 0,
    target === "boss" ? STATUS_BALANCE_CONFIG.stun.bossStunTurns : 1
  );
  status.stunGauge = threshold;
  const battle = state.actBattle;
  if (target === "boss" && battle) {
    battle.bossStunned = false;
  }
  addBattleMessageLine(lines, `${target === "boss" ? "บอส" : "ผู้เล่น"}ติด Stun!`);
  statusLog("stun applied", { target, stunnedTurns: status.stunnedTurns, gauge: status.stunGauge });
  return true;
}

function consumeStunTurn(target) {
  const status = getBattleStatus(target);
  if (!status || !status.stunnedTurns) {
    return false;
  }
  status.stunnedTurns = Math.max(0, status.stunnedTurns - 1);
  return true;
}

function isTargetStunned(target) {
  const status = getBattleStatus(target);
  return Boolean(status?.stunnedTurns > 0 && getTargetStunValue(target) >= getTargetStunThreshold(target));
}

function addDefenseShield(target, percent, hits = 1, source = "", options = {}) {
  const status = getBattleStatus(target);
  if (!status) {
    return;
  }
  const shieldPercent = clamp(Number(percent) || 0, 0, STATUS_BALANCE_CONFIG.shield.maxDefenseShieldPercent);
  const shieldHits = Math.max(1, Math.round(Number(hits) || 1));
  status.defenseShieldPercent = Math.max(status.defenseShieldPercent || 0, shieldPercent);
  status.defenseShieldHits = Math.max(status.defenseShieldHits || 0, shieldHits);
  if (target === "player" && !options.skipLegacySync) {
    state.guardShield = Math.max(state.guardShield || 0, status.defenseShieldPercent);
  }
  console.log("[Shield] defense", { target, percent: status.defenseShieldPercent, hits: status.defenseShieldHits, source });
}

function addHitShield(target, stacks = 1, source = "") {
  const status = getBattleStatus(target);
  if (!status) {
    return;
  }
  status.hitShieldStacks = clamp(
    (status.hitShieldStacks || 0) + Math.max(1, Math.round(Number(stacks) || 1)),
    0,
    STATUS_BALANCE_CONFIG.shield.maxHitShieldStacks
  );
  console.log("[Shield] hit", { target, stacks: status.hitShieldStacks, source });
}

function applyMark(target, bonus = STATUS_BALANCE_CONFIG.mark.defaultDamageBonus, hits = STATUS_BALANCE_CONFIG.mark.defaultHits, turns = STATUS_BALANCE_CONFIG.mark.defaultTurns, source = "") {
  const status = getBattleStatus(target);
  if (!status) {
    return;
  }
  status.markDamageBonus = Math.max(status.markDamageBonus || 0, Number(bonus) || STATUS_BALANCE_CONFIG.mark.defaultDamageBonus);
  status.markedHits = Math.max(status.markedHits || 0, Math.max(1, Math.round(Number(hits) || STATUS_BALANCE_CONFIG.mark.defaultHits)));
  status.markedTurns = Math.max(status.markedTurns || 0, Math.max(1, Math.round(Number(turns) || STATUS_BALANCE_CONFIG.mark.defaultTurns)));
  console.log("[Mark]", { target, bonus: status.markDamageBonus, hits: status.markedHits, turns: status.markedTurns, source });
}

function consumeMarkOnDamage(target) {
  const status = getBattleStatus(target);
  if (!status || !(status.markedHits > 0)) {
    return;
  }
  status.markedHits = Math.max(0, status.markedHits - 1);
  if (!status.markedHits) {
    status.markDamageBonus = 0;
    status.markedTurns = 0;
  }
}

function applyIncomingDamageModifiers(target, rawDamage, context = {}) {
  const status = getBattleStatus(target);
  let finalDamage = Math.max(0, Math.round(Number(rawDamage) || 0));
  const result = {
    finalDamage,
    absorbedByHitShield: false,
    defenseReducedAmount: 0,
    markBonusAmount: 0,
    bossResistanceReducedAmount: 0,
    consumedHitShield: false,
    consumedDefenseShield: false
  };
  if (!status || finalDamage <= 0) {
    return result;
  }

  if (status.markedHits > 0 && status.markDamageBonus > 0) {
    const beforeMark = finalDamage;
    finalDamage = Math.max(0, Math.round(finalDamage * (1 + status.markDamageBonus)));
    result.markBonusAmount = finalDamage - beforeMark;
    consumeMarkOnDamage(target);
  }

  if (!context.bypassShield && finalDamage > 0 && status.defenseShieldPercent > 0 && status.defenseShieldHits > 0) {
    const beforeShield = finalDamage;
    finalDamage = Math.max(0, Math.round(finalDamage * (1 - status.defenseShieldPercent)));
    result.defenseReducedAmount = beforeShield - finalDamage;
    status.defenseShieldHits = Math.max(0, status.defenseShieldHits - 1);
    result.consumedDefenseShield = true;
    if (!status.defenseShieldHits) {
      status.defenseShieldPercent = 0;
      if (target === "player") {
        state.guardShield = 0;
      }
    }
  }

  if (!context.bypassShield && finalDamage > 0 && status.hitShieldStacks > 0) {
    status.hitShieldStacks = Math.max(0, status.hitShieldStacks - 1);
    result.absorbedByHitShield = true;
    result.consumedHitShield = true;
    finalDamage = 0;
  }

  if (target === "boss" && finalDamage > 0 && !context.skipBossDamageResistance && isTrueBossStage(state.actBattle?.stage)) {
    const beforeBossResistance = finalDamage;
    finalDamage = Math.max(1, Math.round(finalDamage * PLAYER_DAMAGE_TO_BOSS_MULTIPLIER));
    result.bossResistanceReducedAmount = beforeBossResistance - finalDamage;
  }

  result.finalDamage = finalDamage;
  console.log("[Shield] incoming damage", { target, rawDamage, ...result, source: context.source || "" });
  return result;
}

function applyStatusDamageToTarget(target, rawDamage, source = "", context = {}) {
  const damageResult = applyIncomingDamageModifiers(target, rawDamage, { source, ...context });
  const damage = damageResult.finalDamage;
  if (target === "boss") {
    state.enemyHp = clamp(state.enemyHp - damage, 0, state.enemyMaxHp);
    recordPlayerDamage(damage, source, { statusDamageResult: damageResult, ...context });
  } else {
    state.playerHp = clamp(state.playerHp - damage, 0, 100);
    recordBossDamage(damage, source, { statusDamageResult: damageResult, ...context });
  }
  return damageResult;
}

function appendDamageModifierLines(lines, target, result) {
  if (!Array.isArray(lines) || !result) {
    return;
  }
  if (result.markBonusAmount > 0) {
    addBattleMessageLine(lines, `Marked! ดาเมจเพิ่ม +${result.markBonusAmount}`);
  }
  if (result.defenseReducedAmount > 0) {
    addBattleMessageLine(lines, `Defense Shield ลดดาเมจ ${result.defenseReducedAmount}`);
  }
  if (target === "boss" && result.bossResistanceReducedAmount > 0) {
    addBattleMessageLine(lines, `Boss Resistance ลดดาเมจ ${result.bossResistanceReducedAmount}`);
  }
  if (result.absorbedByHitShield) {
    addBattleMessageLine(lines, `${target === "boss" ? "บอส" : "ผู้เล่น"}ใช้ Hit Shield กันดาเมจ`);
  }
}

function applyBossMarkOnPlayerIfHit(action, finalDamage, lines = []) {
  if (!action || finalDamage <= 0) {
    return false;
  }
  const chance = Number(action.markChance || 0);
  if (chance <= 0 || Math.random() >= chance) {
    return false;
  }
  applyMark(
    "player",
    action.markDamageBonus || STATUS_BALANCE_CONFIG.mark.defaultDamageBonus,
    action.markHits || STATUS_BALANCE_CONFIG.mark.defaultHits,
    action.markTurns || STATUS_BALANCE_CONFIG.mark.defaultTurns,
    action.type || "boss"
  );
  addBattleMessageLine(lines, "บอสประทับ Mark ใส่ผู้เล่น! การโจมตีครั้งถัดไปจะรุนแรงขึ้น");
  return true;
}

function getSkillStunBuild(skill, damageResult = {}) {
  const baseBuild = STATUS_BALANCE_CONFIG.stun.playerAttackBaseBuild[skill?.id] || 15;
  const critBuild = damageResult.isCrit ? STATUS_BALANCE_CONFIG.stun.criticalExtraBuild : 0;
  const effectBuild = Number(state.battleActiveEffects?.stunBuildBonus || 0);
  if (state.battleActiveEffects) {
    state.battleActiveEffects.stunBuildBonus = 0;
  }
  return baseBuild + critBuild + effectBuild;
}

function getCounterStunBuild(grade) {
  const normalized = String(grade || "").toLowerCase();
  if (normalized === "perfect") {
    return STATUS_BALANCE_CONFIG.stun.counterBuild.perfect;
  }
  if (normalized === "good") {
    return STATUS_BALANCE_CONFIG.stun.counterBuild.good;
  }
  return 0;
}

function useBattleEffect(effectId) {
  const effects = state.battleActiveEffects || {};
  if (!effects[effectId]) {
    return false;
  }

  effects[effectId] -= 1;
  return true;
}

function consumeBattleEffectValue(effectId, fallback = 0) {
  const effects = state.battleActiveEffects || {};
  const value = effects[effectId] || fallback;
  effects[effectId] = 0;
  return value;
}

function addBattleMessageLine(lines, text) {
  if (text) {
    lines.push(text);
  }
}

function normalizeUsername(username) {
  return String(username || "").trim().toLowerCase();
}

function isValidUsername(username) {
  return /^[a-z0-9_]{3,20}$/.test(normalizeUsername(username));
}

function usernameToInternalEmail(username) {
  return `${normalizeUsername(username)}@lingua.local`;
}

function getRegisteredUserId(username) {
  return `registered_${normalizeUsername(username)}`;
}

function getPlayerStorageKey(userId = "") {
  if (userId === "guest") {
    return AUTH_STORAGE_KEYS.guestProgress;
  }
  if (userId.startsWith("registered_")) {
    return `${AUTH_STORAGE_KEYS.registeredProgressPrefix}${userId.replace(/^registered_/, "")}`;
  }
  return `lingua_player_${normalizeUsername(userId)}`;
}

function readLocalUsers() {
  const saved = playerStorage.get(AUTH_STORAGE_KEYS.users);
  if (!saved) {
    return {};
  }
  try {
    return JSON.parse(saved) || {};
  } catch (error) {
    console.warn("[Auth] Failed to parse local users", error);
    return {};
  }
}

function writeLocalUsers(users) {
  playerStorage.set(AUTH_STORAGE_KEYS.users, JSON.stringify(users));
}

function createRandomSalt() {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.getRandomValues) {
    console.warn("[Auth] Secure random unavailable. Local fallback salt is not production-safe.");
    return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
  }
  const bytes = new Uint8Array(16);
  cryptoApi.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

async function hashPin(pin, salt) {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.subtle) {
    console.warn("[Auth] Web Crypto API unavailable. Using weak local-only hash fallback; not production-safe.");
    let hash = 2166136261;
    const input = `${salt}:${pin}`;
    for (let index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `local_${(hash >>> 0).toString(16).padStart(8, "0")}`;
  }
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  const digest = await cryptoApi.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

function createSessionUser(user) {
  return {
    userId: user.uid || user.id,
    uid: user.uid || user.id,
    id: user.uid || user.id,
    username: user.username,
    email: user.email || user.id,
    displayName: user.displayName,
    mode: user.mode,
    isGuest: user.mode === "guest"
  };
}

function sanitizeForFirestore(value) {
  return JSON.parse(JSON.stringify(value));
}

function getPlayerDocRef(uid) {
  return doc(firestoreDb, "players", uid);
}

function createFirestorePlayerDoc(sessionUser, progress) {
  ensurePlayerCharacterData(progress);
  return {
    uid: sessionUser.uid,
    username: sessionUser.username,
    displayName: sessionUser.displayName,
    mode: "registered",
    characterId: progress.characterId,
    hasSeenPrologue: Boolean(progress.hasSeenPrologue),
    progress: sanitizeForFirestore(progress),
    settings: {
      soundEnabled: true,
      musicEnabled: true,
      language: "th"
    }
  };
}

function createRemotePlayerData(sessionUser, savedProgress = null) {
  const fallback = createDefaultPlayerData(sessionUser);
  const merged = savedProgress ? mergeDeep(fallback, sanitizeForFirestore(savedProgress)) : fallback;
  merged.userId = sessionUser.uid;
  merged.uid = sessionUser.uid;
  merged.id = sessionUser.uid;
  merged.username = sessionUser.username;
  merged.email = sessionUser.email;
  merged.displayName = merged.displayName || sessionUser.displayName;
  merged.mode = "registered";
  merged.isGuest = false;
  ensurePlayerCharacterData(merged);
  return merged;
}

function mapFirebaseAuthError(error) {
  const code = error?.code || "";
  if (
    code.includes("invalid-credential") ||
    code.includes("user-not-found") ||
    code.includes("wrong-password") ||
    code.includes("invalid-login-credentials")
  ) {
    return AUTH_COPY.remoteLoginFailed;
  }
  if (code.includes("email-already-in-use")) {
    return "ชื่อผู้ใช้นี้ถูกใช้แล้ว";
  }
  if (code.includes("weak-password")) {
    return "PIN ต้องมีอย่างน้อย 6 ตัว";
  }
  if (code.includes("network-request-failed") || code.includes("unavailable")) {
    return AUTH_COPY.remoteAuthUnavailable;
  }
  if (code.includes("unauthorized-domain")) {
    return "โดเมนนี้ยังไม่ได้รับอนุญาตใน Firebase Auth กรุณาเพิ่มโดเมนของเว็บใน Authorized domains";
  }
  return error?.message ? "ไม่สามารถเชื่อมต่อบัญชีออนไลน์ได้ กรุณาลองใหม่" : AUTH_COPY.remoteAuthUnavailable;
}

async function loadRemoteSessionUser(firebaseUser, fallbackUsername = "") {
  const playerRef = getPlayerDocRef(firebaseUser.uid);
  const snapshot = await getDoc(playerRef);
  if (snapshot.exists()) {
    const data = snapshot.data();
    return createSessionUser({
      uid: firebaseUser.uid,
      id: firebaseUser.uid,
      username: data.username || fallbackUsername || firebaseUser.email?.split("@")[0] || firebaseUser.uid,
      email: firebaseUser.email,
      displayName: data.displayName || fallbackUsername || "Lingua Player",
      mode: "registered"
    });
  }

  const username = normalizeUsername(fallbackUsername || firebaseUser.email?.split("@")[0] || firebaseUser.uid);
  const sessionUser = createSessionUser({
    uid: firebaseUser.uid,
    id: firebaseUser.uid,
    username,
    email: firebaseUser.email,
    displayName: username || "Lingua Player",
    mode: "registered"
  });
  const defaultProgress = createDefaultPlayerData(sessionUser);
  await setDoc(playerRef, {
    ...createFirestorePlayerDoc(sessionUser, defaultProgress),
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
    lastActiveAt: serverTimestamp()
  });
  return sessionUser;
}

const localAuthProvider = {
  mode: "local",

  async register({ username, pin, confirmPin, displayName, betaCode }) {
    const normalizedUsername = normalizeUsername(username);
    if (!displayName.trim()) {
      throw new Error("กรุณากรอกชื่อเล่น");
    }
    if (!isValidUsername(username)) {
      throw new Error("ชื่อผู้ใช้ต้องเป็น a-z, A-Z, 0-9 หรือ _ ความยาว 3–20 ตัว");
    }
    if ((pin || "").length < 6) {
      throw new Error("PIN ต้องมีอย่างน้อย 6 ตัว");
    }
    if (pin !== confirmPin) {
      throw new Error("PIN และยืนยัน PIN ต้องตรงกัน");
    }
    if (shouldValidateBetaCode() && (betaCode || "").trim() !== AUTH_CONFIG.betaCode) {
      throw new Error("รหัส Close Beta ไม่ถูกต้อง");
    }

    const users = readLocalUsers();
    if (users[normalizedUsername]) {
      throw new Error("ชื่อผู้ใช้นี้ถูกใช้แล้ว");
    }

    const salt = createRandomSalt();
    const pinHash = await hashPin(pin, salt);
    const now = new Date().toISOString();
    const user = {
      id: getRegisteredUserId(normalizedUsername),
      username: normalizedUsername,
      displayName: displayName.trim(),
      mode: "registered",
      pinHash,
      salt,
      createdAt: now,
      lastLoginAt: now
    };
    users[normalizedUsername] = user;
    writeLocalUsers(users);
    playerStorage.set(AUTH_STORAGE_KEYS.currentUser, JSON.stringify(createSessionUser(user)));
    return createSessionUser(user);
  },

  async login({ username, pin }) {
    const normalizedUsername = normalizeUsername(username);
    if (!isValidUsername(username)) {
      throw new Error("กรุณากรอกชื่อผู้ใช้ให้ถูกต้อง");
    }
    if (!pin) {
      throw new Error("กรุณากรอก PIN");
    }

    const users = readLocalUsers();
    const user = users[normalizedUsername];
    if (!user) {
      throw new Error(AUTH_COPY.localUserNotFound);
    }
    const pinHash = await hashPin(pin, user.salt);
    if (pinHash !== user.pinHash) {
      throw new Error("PIN ไม่ถูกต้อง");
    }

    user.lastLoginAt = new Date().toISOString();
    users[normalizedUsername] = user;
    writeLocalUsers(users);
    const sessionUser = createSessionUser(user);
    playerStorage.set(AUTH_STORAGE_KEYS.currentUser, JSON.stringify(sessionUser));
    return sessionUser;
  },

  logout() {
    playerStorage.remove(AUTH_STORAGE_KEYS.currentUser);
    state.currentUser = null;
    playerData = null;
  },

  getCurrentUser() {
    if (state.currentUser) {
      return state.currentUser;
    }
    const saved = playerStorage.get(AUTH_STORAGE_KEYS.currentUser);
    if (!saved) {
      return null;
    }
    try {
      state.currentUser = JSON.parse(saved);
      return state.currentUser;
    } catch (error) {
      console.warn("[Auth] Failed to restore current user", error);
      playerStorage.remove(AUTH_STORAGE_KEYS.currentUser);
      return null;
    }
  },

  isLoggedIn() {
    return Boolean(this.getCurrentUser());
  },

  isGuest() {
    return this.getCurrentUser()?.isGuest === true;
  },

  startGuestSession() {
    const user = {
      id: "guest",
      username: "guest",
      displayName: "Guest Player",
      mode: "guest"
    };
    const sessionUser = createSessionUser(user);
    playerStorage.set(AUTH_STORAGE_KEYS.currentUser, JSON.stringify(sessionUser));
    return sessionUser;
  }
};

const remoteAuthProvider = {
  mode: "firebase",

  async register({ username, pin, confirmPin, displayName, betaCode }) {
    try {
      const normalizedUsername = normalizeUsername(username);
      if (!displayName.trim()) {
        throw new Error("กรุณากรอกชื่อเล่น");
      }
      if (!isValidUsername(normalizedUsername)) {
        throw new Error("ชื่อผู้ใช้ต้องเป็น a-z, 0-9 หรือ _ ความยาว 3–20 ตัว");
      }
      if ((pin || "").length < 6) {
        throw new Error("PIN ต้องมีอย่างน้อย 6 ตัว");
      }
      if (pin !== confirmPin) {
        throw new Error("PIN และยืนยัน PIN ต้องตรงกัน");
      }
      // Close beta frontend validation is convenient for testing. Production should
      // validate beta eligibility in a backend or Cloud Function.
      if (shouldValidateBetaCode() && (betaCode || "").trim() !== AUTH_CONFIG.betaCode) {
        throw new Error("รหัส Close Beta ไม่ถูกต้อง");
      }

      console.log("[Auth] registering username:", normalizedUsername);
      const credential = await createUserWithEmailAndPassword(firebaseAuth, usernameToInternalEmail(normalizedUsername), pin);
      console.log("[Auth] Firebase uid:", credential.user.uid);
      const sessionUser = createSessionUser({
        uid: credential.user.uid,
        id: credential.user.uid,
        username: normalizedUsername,
        email: credential.user.email,
        displayName: displayName.trim(),
        mode: "registered"
      });
      const defaultProgress = createDefaultPlayerData(sessionUser);
      defaultProgress.hasSeenPrologue = false;
      await setDoc(getPlayerDocRef(sessionUser.uid), {
        ...createFirestorePlayerDoc(sessionUser, defaultProgress),
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        lastActiveAt: serverTimestamp()
      });
      console.log("[Firestore] player profile saved:", sessionUser.uid);
      state.currentUser = sessionUser;
      playerData = defaultProgress;
      playerStorage.set(AUTH_STORAGE_KEYS.currentUser, JSON.stringify(sessionUser));
      return sessionUser;
    } catch (error) {
      if (error instanceof Error && !error.code) {
        throw error;
      }
      throw new Error(mapFirebaseAuthError(error));
    }
  },

  async login({ username, pin }) {
    try {
      const normalizedUsername = normalizeUsername(username);
      if (!isValidUsername(normalizedUsername)) {
        throw new Error("กรุณากรอกชื่อผู้ใช้ให้ถูกต้อง");
      }
      if (!pin) {
        throw new Error("กรุณากรอก PIN");
      }

      const credential = await signInWithEmailAndPassword(firebaseAuth, usernameToInternalEmail(normalizedUsername), pin);
      const sessionUser = await loadRemoteSessionUser(credential.user, normalizedUsername);
      state.currentUser = sessionUser;
      playerStorage.set(AUTH_STORAGE_KEYS.currentUser, JSON.stringify(sessionUser));
      await progressService.loadProgress(sessionUser.uid);
      await updateDoc(getPlayerDocRef(sessionUser.uid), {
        lastLoginAt: serverTimestamp(),
        lastActiveAt: serverTimestamp()
      });
      return sessionUser;
    } catch (error) {
      if (error instanceof Error && !error.code) {
        throw error;
      }
      throw new Error(mapFirebaseAuthError(error));
    }
  },

  async logout() {
    try {
      await signOut(firebaseAuth);
    } catch (error) {
      console.warn("[Auth] Firebase signOut failed; clearing local game session.", error);
    }
    playerStorage.remove(AUTH_STORAGE_KEYS.currentUser);
    state.currentUser = null;
    playerData = null;
  },

  getCurrentUser() {
    if (state.currentUser) {
      return state.currentUser;
    }
    const saved = playerStorage.get(AUTH_STORAGE_KEYS.currentUser);
    if (!saved) {
      return null;
    }
    try {
      state.currentUser = JSON.parse(saved);
      return state.currentUser;
    } catch (error) {
      console.warn("[Auth] Failed to restore current Firebase session", error);
      playerStorage.remove(AUTH_STORAGE_KEYS.currentUser);
      return null;
    }
  },

  isLoggedIn() {
    return Boolean(this.getCurrentUser());
  },

  isGuest() {
    return this.getCurrentUser()?.isGuest === true;
  },

  startGuestSession() {
    return localAuthProvider.startGuestSession();
  }
};

function getAuthProvider() {
  if (getAuthMode() === "firebase") {
    return remoteAuthProvider;
  }
  return localAuthProvider;
}

const authService = {
  get mode() {
    return getAuthProvider().mode;
  },

  register(data) {
    return getAuthProvider().register(data);
  },

  login(data) {
    return getAuthProvider().login(data);
  },

  logout() {
    return getAuthProvider().logout();
  },

  getCurrentUser() {
    return getAuthProvider().getCurrentUser();
  },

  isLoggedIn() {
    return Boolean(this.getCurrentUser());
  },

  isGuest() {
    return this.getCurrentUser()?.isGuest === true;
  },

  startGuestSession() {
    return getAuthProvider().startGuestSession();
  }
};

const progressService = {
  async loadProgress(userId) {
    if (userId !== "guest" && getAuthMode() === "firebase") {
      const firebaseUser = firebaseAuth.currentUser;
      if (!firebaseUser || firebaseUser.uid !== userId) {
        throw new Error(AUTH_COPY.remoteAuthUnavailable);
      }
      const sessionUser = getCurrentUser() || await loadRemoteSessionUser(firebaseUser);
      const snapshot = await getDoc(getPlayerDocRef(userId));
      if (!snapshot.exists()) {
        const defaultProgress = createDefaultPlayerData(sessionUser);
        await setDoc(getPlayerDocRef(userId), {
          ...createFirestorePlayerDoc(sessionUser, defaultProgress),
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          lastActiveAt: serverTimestamp()
        });
        playerData = defaultProgress;
        return playerData;
      }
      const data = snapshot.data();
      const remoteProgress = createRemotePlayerData(sessionUser, data.progress || {});
      remoteProgress.hasSeenPrologue = Boolean(data.hasSeenPrologue || remoteProgress.hasSeenPrologue);
      remoteProgress.displayName = data.displayName || remoteProgress.displayName;
      playerData = remoteProgress;
      return playerData;
    }

    const saved = playerStorage.get(getPlayerStorageKey(userId));
    if (saved) {
      return JSON.parse(saved);
    }
    const legacyKey = userId === "guest" ? "lingua_player_guest" : "";
    const legacySaved = legacyKey ? playerStorage.get(legacyKey) : null;
    return legacySaved ? JSON.parse(legacySaved) : null;
  },

  async saveProgress(userId, progress) {
    if (userId !== "guest" && getAuthMode() === "firebase") {
      const firebaseUser = firebaseAuth.currentUser;
      if (!firebaseUser || firebaseUser.uid !== userId) {
        console.warn("[Firestore] Skip save: Firebase session is not ready for this player.");
        return false;
      }
      const now = new Date().toISOString();
      const nextProgress = {
        ...progress,
        updatedAt: now,
        progress: {
          ...progress.progress,
          lastUpdatedAt: now
        }
      };
      await setDoc(getPlayerDocRef(userId), {
        uid: userId,
        username: nextProgress.username,
        displayName: nextProgress.displayName,
        mode: "registered",
        characterId: nextProgress.characterId,
        hasSeenPrologue: Boolean(nextProgress.hasSeenPrologue),
        progress: sanitizeForFirestore(nextProgress),
        settings: {
          soundEnabled: nextProgress.settings?.sound !== false,
          musicEnabled: true,
          language: nextProgress.settings?.language || "th"
        },
        lastActiveAt: serverTimestamp()
      }, { merge: true });
      return true;
    }

    playerStorage.set(getPlayerStorageKey(userId), JSON.stringify(progress));
    return true;
  },

  createDefaultProgress(user) {
    return createDefaultPlayerData(user);
  },

  async migrateGuestProgressToUser(userId) {
    const guestProgress = await this.loadProgress("guest");
    const existingProgress = await this.loadProgress(userId);
    if (guestProgress && !existingProgress) {
      await this.saveProgress(userId, { ...guestProgress, userId, isGuest: false });
    }
  }
};

function getCurrentUser() {
  return authService.getCurrentUser();
}

function setAuthStatus(message) {
  if (els.loginStatus) {
    els.loginStatus.textContent = message;
  }
}

function updateAuthUi() {
  const user = getCurrentUser();
  const isLocalMode = getAuthMode() === "local";
  if (els.authModeLabel) {
    els.authModeLabel.textContent = getAuthModeLabel();
  }
  if (els.loginLocalNotice) {
    els.loginLocalNotice.classList.toggle("hidden", !isLocalMode);
  }
  if (els.registerLocalNotice) {
    els.registerLocalNotice.classList.toggle("hidden", !isLocalMode);
  }
  if (els.logoutButton) {
    els.logoutButton.classList.toggle("hidden", !user);
    els.logoutButton.textContent = user ? `ผู้เล่น: ${user.displayName} | Logout` : "Logout";
  }
}

function showAuthPanel(panelName) {
  const showRegister = panelName === "register";
  els.loginPanel.classList.toggle("hidden", showRegister);
  els.registerPanel.classList.toggle("hidden", !showRegister);
  els.showLoginPanelButton.classList.toggle("is-active", !showRegister);
  els.showRegisterPanelButton.classList.toggle("is-active", showRegister);
  updateAuthUi();
  setAuthStatus(getAuthPanelNotice(showRegister ? "register" : "login"));
}

async function enterGameForCurrentUser(statusMessage) {
  const user = getCurrentUser();
  if (!user) {
    showScene("login");
    return;
  }

  updateAuthUi();
  setAuthStatus(statusMessage);
  if (await hasExistingPlayer(user.userId)) {
    await loadPlayerProfile(user.userId);
    runSceneTransition(statusMessage, showMainMenu);
    return;
  }

  els.createStatus.textContent = `${user.displayName} ยังไม่มีตัวละคร กรุณาสร้างตัวละครก่อนเริ่มเดินทาง`;
  runSceneTransition("กำลังเตรียมหน้าสร้างตัวละคร...", () => showScene("createCharacter"));
}

function getPrologueSeenStorageKey(user = getCurrentUser()) {
  if (!user || user.isGuest || user.userId === "guest") {
    return AUTH_STORAGE_KEYS.guestPrologueSeen;
  }
  const username = user.username || user.userId.replace(/^registered_/, "");
  return `${AUTH_STORAGE_KEYS.userPrologueSeenPrefix}${normalizeUsername(username)}_has_seen_prologue`;
}

function shouldShowPrologueForCurrentUser() {
  const user = getCurrentUser();
  const key = getPrologueSeenStorageKey(user);
  if (playerData?.hasSeenPrologue === true) {
    return false;
  }
  if (getAuthMode() === "firebase" && user && !user.isGuest) {
    return true;
  }
  return playerStorage.get(key) !== "true";
}

function markPrologueSeenForCurrentUser() {
  const user = getCurrentUser();
  const key = getPrologueSeenStorageKey(user);
  playerStorage.set(key, "true");
  if (playerData) {
    playerData.hasSeenPrologue = true;
    savePlayerData();
  }
}

function playPrologueTypeSfx() {
  if (!canPlayTypewriterSfx() || state.isMuted || !state.audioUnlocked || !state.typewriterAudioUnlocked) {
    return;
  }
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  if (now - state.lastDialogueTypeSfxAt < DIALOGUE_TYPE_SFX_COOLDOWN_MS) {
    return;
  }
  state.lastDialogueTypeSfxAt = now;
  const track = dialogueTypeSfxPool[state.dialogueTypeSfxPoolIndex % dialogueTypeSfxPool.length];
  state.dialogueTypeSfxPoolIndex += 1;
  if (track.dialogueTypeSfxStopTimer) {
    clearTimeout(track.dialogueTypeSfxStopTimer);
    track.dialogueTypeSfxStopTimer = null;
  }
  try {
    track.pause();
    seekDialogueTypeSfxStart(track);
    track.volume = DIALOGUE_TYPE_SFX_VOLUME;
    track.muted = state.isMuted;
    track.play().catch(() => {});
    track.dialogueTypeSfxStopTimer = setTimeout(() => {
      track.pause();
      track.currentTime = 0;
      track.dialogueTypeSfxStopTimer = null;
    }, DIALOGUE_TYPE_SFX_TICK_MS);
  } catch (error) {
    if (!state.dialogueTypeSfxWarned) {
      state.dialogueTypeSfxWarned = true;
      console.warn("[Audio] Prologue typewriter sound failed", error);
    }
  }
}

function showPrologueIntro(onComplete) {
  if (!els.prologueOverlay || state.isPrologueActive) {
    onComplete();
    return;
  }

  stopDialogueTypeSfx();
  cleanupPrologueTypingState();
  state.isPrologueActive = true;
  state.prologueIndex = 0;
  state.prologueTextIndex = 0;
  state.prologueTyping = false;
  state.prologueCompleteCallback = onComplete;
  els.prologueText.textContent = "";
  els.prologueHint.textContent = "แตะเพื่อไปต่อ";
  els.prologueNextButton.textContent = "ถัดไป";
  els.prologueOverlay.classList.remove("hidden");
  requestAnimationFrame(() => {
    els.prologueOverlay.classList.add("visible");
    startPrologueLine();
  });
}

function startPrologueLine() {
  clearPrologueTypingTimer();
  stopPrologueTypewriterSound();
  const line = PROLOGUE_LINES[state.prologueIndex] || "";
  state.prologueCurrentLine = line;
  state.prologueTextIndex = 0;
  state.prologueTyping = true;
  els.prologueText.textContent = "";
  els.prologueHint.textContent = "แตะเพื่อแสดงข้อความทั้งหมด";
  typePrologueCharacter();
}

function typePrologueCharacter() {
  if (!state.isPrologueActive || !state.prologueTyping) {
    return;
  }
  const line = state.prologueCurrentLine || "";
  if (state.prologueTextIndex >= line.length) {
    finishPrologueLine();
    return;
  }
  state.prologueTextIndex += 1;
  els.prologueText.textContent = line.slice(0, state.prologueTextIndex);
  if (state.prologueTextIndex % 3 === 0) {
    playPrologueTypeSfx();
  }
  state.prologueTimer = setTimeout(typePrologueCharacter, 34);
}

function finishPrologueLine() {
  clearPrologueTypingTimer();
  state.prologueTyping = false;
  stopPrologueTypewriterSound();
  els.prologueText.textContent = state.prologueCurrentLine || "";
  const isLastLine = state.prologueIndex >= PROLOGUE_LINES.length - 1;
  els.prologueHint.textContent = isLastLine ? "แตะหน้าจอเพื่อเข้าสู่บทเรียน" : "แตะเพื่อไปต่อ";
  els.prologueNextButton.textContent = isLastLine ? "เข้าสู่บทเรียน" : "ถัดไป";
}

function advancePrologue() {
  if (!state.isPrologueActive) {
    return;
  }
  if (state.prologueTyping) {
    finishPrologueLine();
    return;
  }
  if (state.prologueIndex < PROLOGUE_LINES.length - 1) {
    state.prologueIndex += 1;
    startPrologueLine();
    return;
  }
  completePrologueIntro();
}

function completePrologueIntro() {
  if (!state.isPrologueActive) {
    return;
  }
  cleanupPrologueTypingState();
  markPrologueSeenForCurrentUser();
  const onComplete = state.prologueCompleteCallback || setupStoryScene;
  state.isPrologueActive = false;
  state.prologueCompleteCallback = null;
  els.prologueOverlay.classList.remove("visible");
  setTimeout(() => {
    cleanupPrologueTypingState();
    els.prologueOverlay.classList.add("hidden");
    onComplete();
  }, 520);
}

function cleanupPrologueTypingState() {
  clearPrologueTypingTimer();
  state.prologueTyping = false;
  stopPrologueTypewriterSound();
}

function startGameAfterLogin() {
  if (shouldShowPrologueForCurrentUser()) {
    showPrologueIntro(setupStoryScene);
    return;
  }
  setupStoryScene();
}

function resetPrologueForCurrentUser() {
  const key = getPrologueSeenStorageKey();
  playerStorage.remove(key);
  if (playerData) {
    playerData.hasSeenPrologue = false;
    savePlayerData();
  }
}

async function registerCloseBetaUser() {
  try {
    setAuthStatus("กำลังสร้างบัญชี...");
    state.currentUser = await authService.register({
      displayName: els.registerDisplayName.value,
      username: els.registerUsername.value,
      pin: els.registerPin.value,
      confirmPin: els.registerConfirmPin.value,
      betaCode: getRegisterBetaCodeValue()
    });
    await enterGameForCurrentUser(getAuthMode() === "firebase" ? AUTH_COPY.remoteRegisterSuccess : AUTH_COPY.registerLocalSuccess);
  } catch (error) {
    setAuthStatus(error.message || "สมัครไม่สำเร็จ");
  }
}

async function loginRegisteredUser() {
  try {
    setAuthStatus("กำลังเข้าสู่ระบบ...");
    state.currentUser = await authService.login({
      username: els.loginUsername.value,
      pin: els.loginPin.value
    });
    await enterGameForCurrentUser("เข้าสู่ระบบสำเร็จ กำลังโหลด progress เดิม");
  } catch (error) {
    setAuthStatus(error.message || "เข้าสู่ระบบไม่สำเร็จ");
  }
}

async function hasExistingPlayer(userId) {
  const profile = await progressService.loadProgress(userId);
  return Boolean(profile?.className && profile?.room);
}

async function loginAsGuest() {
  state.currentUser = authService.startGuestSession();
  setAuthStatus("กำลังโหลดข้อมูล Guest... progress จะอยู่เฉพาะเครื่องนี้");
  await enterGameForCurrentUser(await hasExistingPlayer("guest") ? "พบข้อมูล Guest เดิม กำลังเข้าสู่โลก Lingua" : "กำลังเตรียมตัวละคร Guest ใหม่");
}

async function logoutCurrentUser() {
  clearEnemyTurnTimer();
  stopTimer("charge");
  stopParryCountdown();
  await authService.logout();
  updateAuthUi();
  setAuthStatus("ออกจากระบบแล้ว สามารถเลือกผู้เล่นใหม่ได้");
  showScene("login");
}

async function initializeAuthUi() {
  showAuthPanel("login");
  if (getAuthMode() === "firebase") {
    const firebaseUser = await waitForFirebaseAuthReady();
    if (firebaseUser && (!state.currentUser || state.currentUser.isGuest || state.currentUser.uid !== firebaseUser.uid)) {
      state.currentUser = await loadRemoteSessionUser(firebaseUser);
      playerStorage.set(AUTH_STORAGE_KEYS.currentUser, JSON.stringify(state.currentUser));
      await progressService.loadProgress(firebaseUser.uid);
    } else if (!firebaseUser && state.currentUser && !state.currentUser.isGuest) {
      state.currentUser = null;
      playerStorage.remove(AUTH_STORAGE_KEYS.currentUser);
    }
  }
  const user = getCurrentUser();
  updateAuthUi();
  if (user) {
    setAuthStatus(`พบ session ของ ${user.displayName} กดเข้าสู่ระบบหรือ Logout เพื่อเปลี่ยนผู้เล่น`);
  }
}

async function loadPlayerData(userId) {
  return progressService.loadProgress(userId);
}

async function loadPlayerProfile(userId) {
  playerData = await loadPlayerData(userId);
  if (playerData) {
    ensurePlayerCharacterData(playerData);
    state.currentUser = {
      userId: playerData.userId,
      uid: playerData.uid || playerData.userId,
      id: playerData.userId,
      username: playerData.username || playerData.userId,
      email: playerData.email || playerData.userId,
      displayName: playerData.displayName,
      mode: playerData.mode || (playerData.isGuest ? "guest" : "registered"),
      isGuest: Boolean(playerData.isGuest)
    };
    playerStorage.set(AUTH_STORAGE_KEYS.currentUser, JSON.stringify(state.currentUser));
    updateAuthUi();
    refreshPlayerCharacterSprites();
  }
  return playerData;
}

function savePlayerProfile() {
  return savePlayerData();
}

function createDefaultPlayerData(user) {
  const now = new Date().toISOString();
  return {
    userId: user.userId,
    id: user.userId,
    username: user.username || user.userId,
    email: user.email || user.userId,
    displayName: user.displayName,
    hasSeenPrologue: false,
    mode: user.mode || (user.isGuest ? "guest" : "registered"),
    isGuest: Boolean(user.isGuest),
    characterId: "male_wanderer",
    characterName: "",
    className: "",
    room: "",
    keyStage: user.keyStage || "",
    avatar: {
      characterId: "male_wanderer",
      gender: "other",
      bodyType: "normal",
      type: "wanderer",
      outfit: "default",
      color: "blue"
    },
    level: 1,
    grammaria: 0,
    coins: 0,
    hp: 100,
    maxHp: 100,
    stats: {
      atk: 1,
      def: 1,
      vit: 1,
      agi: 1,
      luk: 1,
      statusPoints: 0
    },
    progress: {
      currentAct: 1,
      currentChapter: 1,
      currentScene: "story",
      unlockedFragments: [],
      restoredCores: [],
      defeatedEnemies: [],
      grammaria: createDefaultGrammariaState(),
      playerProfile: {
        keyStage: user.keyStage || "",
        className: "",
        room: ""
      },
      pastFragmentAct: {
        ...DEFAULT_ACT_PROGRESS,
        introCompleted: false,
        tenseLessonCompleted: false,
        regularRulesCompleted: false,
        edMiniBossDefeated: false,
        irregularLessonCompleted: false,
        irregularMiniBossDefeated: false,
        twistSeen: false,
        finalBossDefeated: false,
        rewards: [],
        completedStages: [],
        fragments: [],
        grammariaEarned: 0,
        badge: ""
      }
    },
    inventory: {
      battleItems: [],
      equipment: [],
      keyItems: []
    },
    settings: {
      textSpeed: "normal",
      sound: true,
      language: "th"
    },
    createdAt: now,
    updatedAt: now
  };
}

let pendingProgressSave = Promise.resolve(true);

function serializeProgressValue(value) {
  if (value instanceof Set) {
    return [...value].map(item => serializeProgressValue(item));
  }
  if (Array.isArray(value)) {
    return value.map(item => serializeProgressValue(item));
  }
  if (value && typeof value === "object") {
    const output = {};
    Object.entries(value).forEach(([key, nestedValue]) => {
      if (typeof nestedValue === "function" || typeof nestedValue === "undefined") {
        return;
      }
      output[key] = serializeProgressValue(nestedValue);
    });
    return output;
  }
  return value;
}

function queuePlayerDataSave(snapshot, reason = "auto") {
  pendingProgressSave = pendingProgressSave
    .catch(() => false)
    .then(() => progressService.saveProgress(snapshot.userId, snapshot))
    .catch(error => {
      console.warn(`[Progress] Failed to save player data (${reason})`, error);
      setAuthStatus(AUTH_COPY.remoteAuthUnavailable);
      return false;
    });
  return pendingProgressSave;
}

function flushPendingProgressSaves() {
  return pendingProgressSave.catch(() => false);
}

function savePlayerData(reason = "auto") {
  if (!playerData) {
    return false;
  }

  ensurePlayerCharacterData(playerData);
  playerData.updatedAt = new Date().toISOString();
  const snapshot = serializeProgressValue(playerData);
  return queuePlayerDataSave(snapshot, reason);
}

function mergeDeep(target, source) {
  Object.entries(source).forEach(([key, value]) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      target[key] = target[key] || {};
      mergeDeep(target[key], value);
    } else {
      target[key] = value;
    }
  });
  return target;
}

function updatePlayerProgress(updateObject) {
  if (!playerData) {
    return;
  }

  mergeDeep(playerData, updateObject);
  savePlayerData();
}

function syncBattleStateToPlayerData() {
  if (!playerData) {
    return;
  }

  updatePlayerProgress({
    grammaria: state.grammaria,
    hp: state.playerHp
  });
}

function addUniqueProgressItem(listName, value) {
  if (!playerData) {
    return;
  }

  if (!playerData.progress[listName].includes(value)) {
    playerData.progress[listName].push(value);
  }
}

async function createCharacterFromForm() {
  const user = getCurrentUser();
  if (!user) {
    els.createStatus.textContent = "กรุณาเข้าสู่ระบบก่อนสร้างตัวละคร";
    showScene("login");
    return;
  }

  const className = els.classNameSelect.value;
  const keyStage = els.keyStageSelect?.value || getKeyStageFromClassName(className);
  const room = els.roomInput.value.trim();
  const avatarChoice = document.querySelector("input[name=\"avatarType\"]:checked");
  const genderChoice = document.querySelector("input[name=\"avatarGender\"]:checked");
  const bodyTypeChoice = document.querySelector("input[name=\"avatarBodyType\"]:checked");
  const selectedGender = genderChoice ? genderChoice.value : "other";
  const characterId = getCharacterIdFromGender(selectedGender);

  if (!room) {
    els.createStatus.textContent = "กรุณากรอกห้องเรียน";
    return;
  }

  playerData = createDefaultPlayerData(user);
  playerData.characterId = characterId;
  playerData.characterName = "";
  playerData.className = className;
  playerData.keyStage = keyStage;
  playerData.room = room;
  playerData.progress.playerProfile = {
    ...(playerData.progress.playerProfile || {}),
    keyStage,
    className,
    room
  };
  playerData.avatar = {
    characterId,
    gender: selectedGender,
    bodyType: bodyTypeChoice ? bodyTypeChoice.value : "normal",
    type: avatarChoice ? avatarChoice.value : "wanderer",
    outfit: "default",
    color: "blue"
  };

  await savePlayerProfile();
  refreshPlayerCharacterSprites(characterId);
  els.createStatus.textContent = "บันทึกข้อมูลแล้ว";
  runSceneTransition("บันทึกข้อมูลแล้ว กำลังเปิดเมนูผู้เล่น...", showMainMenu);
}

function getCheckedRadioValue(name, fallback) {
  const checked = document.querySelector(`input[name="${name}"]:checked`);
  return checked ? checked.value : fallback;
}

function updateAvatarPreview() {
  if (!els.avatarPreview || !els.avatarPreviewText) {
    return;
  }

  const gender = getCheckedRadioValue("avatarGender", "other");
  const bodyType = getCheckedRadioValue("avatarBodyType", "normal");
  const characterId = getCharacterIdFromGender(gender);
  const character = getPlayerCharacter(characterId);
  const genderLabels = { male: "ชาย", female: "หญิง", other: "ไม่ระบุ" };
  const bodyLabels = { small: "ตัวเล็ก", normal: "ปกติ", tall: "สูง" };

  els.avatarPreview.className = `avatar-preview main-character-gif main-character-preview-gif avatar-gender-${gender} avatar-body-${bodyType}`;
  applyPlayerCharacterImage(els.avatarPreview, characterId);
  els.avatarPreviewText.textContent = `ตัวอย่าง: ${character.label} / ${genderLabels[gender] || genderLabels.other} / ${bodyLabels[bodyType] || bodyLabels.normal}`;
}

function bindAvatarPreviewInputs() {
  document.querySelectorAll("input[name=\"avatarGender\"], input[name=\"avatarBodyType\"]").forEach(input => {
    input.addEventListener("change", updateAvatarPreview);
  });
  updateAvatarPreview();
}

function getCharacterName() {
  return playerData && playerData.characterName ? playerData.characterName.trim() : "";
}

function createNameGreetingLine() {
  return {
    speaker: "มาสเตอร์เวรีออน",
    text: () => `"ยินดีที่ได้พบเจ้า, ${getCharacterName()} นับจากนี้ ชื่อนี้จะเป็นแสงแรกที่ผูกเจ้ากับโลก Lingua"`
  };
}

function buildStoryDialogue() {
  const actPrologue = PAST_FRAGMENT_ACT.stages.find(stage => stage.id === "prologue");
  const lines = [
    ...actPrologue.dialogues,
    ...interactiveStoryDialogue
  ];

  if (getCharacterName()) {
    lines.push(createNameGreetingLine());
  } else {
    lines.push(...namingDialogue);
  }

  lines.push({
    speaker: "ระบบ",
    text: `"${PAST_FRAGMENT_ACT.title}: ${PAST_FRAGMENT_ACT.subtitle}"`
  });
  return lines;
}

function getSelectedPlayerDialogueGender(data = playerData) {
  const avatarGender = data?.avatar?.gender;
  if (avatarGender === "female" || avatarGender === "male" || avatarGender === "other") {
    return avatarGender;
  }

  const characterId = data?.characterId || data?.avatar?.characterId || "";
  if (characterId === "female_wanderer") {
    return "female";
  }
  if (characterId === "male_wanderer") {
    return "male";
  }

  return "";
}

function isPlayerDialogueSpeaker(lineOrSpeaker = {}) {
  const line = typeof lineOrSpeaker === "object" && lineOrSpeaker !== null ? lineOrSpeaker : {};
  const speaker = String(typeof lineOrSpeaker === "string" ? lineOrSpeaker : line.speaker || "").trim();
  const speakerId = String(line.speakerId || line.speakerKey || line.characterId || line.actor || line.role || "").trim().toLowerCase();

  if (line.isPlayerSpeaker === true || ["player", "wanderer", "hero", "protagonist", "male_wanderer", "female_wanderer"].includes(speakerId)) {
    return true;
  }

  if (speaker.includes("ผู้พเนจร")) {
    return true;
  }

  const playerNames = [
    getCharacterName(),
    playerData?.characterName,
    playerData?.displayName,
    state.currentUser?.displayName
  ].map(name => String(name || "").trim()).filter(Boolean);

  return Boolean(speaker && playerNames.includes(speaker));
}

function convertFemalePlayerThaiParticle(text) {
  const value = String(text || "");
  const trailingMarks = "[\\s\"'“”‘’»›)\\]\\}]*";
  const questionParticlePattern = new RegExp(`ครับ(\\s*[?？]${trailingMarks})$`);
  const statementParticlePattern = new RegExp(`ครับ([.!！。…]*${trailingMarks})$`);

  if (questionParticlePattern.test(value)) {
    return value.replace(questionParticlePattern, "คะ$1");
  }

  return value.replace(statementParticlePattern, "ค่ะ$1");
}

function resolvePlayerDialogueForGender(text, line = {}) {
  const originalText = String(text || "");
  // Limit particle conversion to player-spoken lines so narration, NPCs, and battle announcements stay unchanged.
  if (!isPlayerDialogueSpeaker(line) || getSelectedPlayerDialogueGender() !== "female") {
    return originalText;
  }

  return convertFemalePlayerThaiParticle(originalText);
}

function resolveDialogueText(line) {
  const text = typeof line.text === "function" ? line.text() : line.text;
  return resolvePlayerDialogueForGender(text, line);
}

function showNamePrompt() {
  state.awaitingName = true;
  els.storyNameForm.classList.remove("hidden");
  els.nextDialogueButton.classList.add("hidden");
  els.namePromptStatus.textContent = "";
  setDialogueButtonReady(false);
  setTimeout(() => els.storyNameInput.focus(), 80);
}

function hideNamePrompt() {
  state.awaitingName = false;
  els.storyNameForm.classList.add("hidden");
  els.nextDialogueButton.classList.remove("hidden");
}

function confirmStoryName() {
  const name = els.storyNameInput.value.trim();

  if (!name) {
    els.namePromptStatus.textContent = "กรุณากรอกชื่อก่อนเริ่มการเดินทาง";
    return;
  }

  if (!playerData) {
    const user = getCurrentUser() || authService.startGuestSession();
    playerData = createDefaultPlayerData(user);
  }

  playerData.characterName = name;
  playerData.displayName = name;
  savePlayerData();
  hideNamePrompt();
  state.activeDialogue.splice(state.dialogueIndex + 1, 0, createNameGreetingLine());
  advanceDialogue();
}

function updateDialogue() {
  const line = state.activeDialogue[state.dialogueIndex];
  els.speakerName.textContent = line.speaker;
  updateSpeakingCharacter(line.speaker);
  updateDialogueSpeakerTone(line.speaker);
  updateDialogueSpeakerPortrait(line.speaker);
  hideDialogueChoices();
  updatePreviousDialogueButton();
  startTypewriter(resolveDialogueText(line));
}

function updateDialogueSpeakerTone(speaker = "") {
  els.dialoguePanel.classList.remove("speaker-player", "speaker-verion", "speaker-system");
  els.dialoguePanel.classList.add(getSpeakerToneClass(speaker));
}

function getDialogueSpeakerId(speaker = "") {
  const text = String(speaker || "");
  if (text.includes("ผู้พเนจร")) {
    return ensurePlayerCharacterData();
  }
  if (text.includes("มาสเตอร์เวรีออน") || text.includes("เวรีออน")) {
    return "master_verion";
  }
  if (text.includes("Memory Breaker") || text.includes("ผู้ทำลายความทรงจำ")) {
    return "memory_breaker";
  }
  if (text.includes("Ed Forger") || text.includes("-ed Forger") || text.includes("The -ed Forger")) {
    return "ed_forger";
  }
  return "";
}

function hideDialogueSpeakerPortrait(reason = "") {
  if (!els.dialoguePanel || !els.dialoguePortraitSlot || !els.dialogueSpeakerPortrait) {
    return;
  }
  els.dialoguePanel.classList.add("dialogue-portrait-missing");
  els.dialoguePortraitSlot.classList.add("hidden");
  els.dialogueSpeakerPortrait.removeAttribute("src");
  els.dialogueSpeakerPortrait.alt = "";
  if (reason) {
    console.warn("[Dialogue] portrait hidden", reason);
  }
}

function updateDialogueSpeakerPortrait(speaker = "") {
  if (!els.dialoguePanel || !els.dialoguePortraitSlot || !els.dialogueSpeakerPortrait) {
    return;
  }

  const speakerId = getDialogueSpeakerId(speaker);
  const portraitConfig = speakerId ? DIALOGUE_SPEAKER_PORTRAITS[speakerId] : null;
  if (!portraitConfig?.portrait) {
    hideDialogueSpeakerPortrait("");
    return;
  }

  els.dialoguePanel.classList.remove("dialogue-portrait-missing");
  els.dialoguePortraitSlot.classList.remove("hidden");
  els.dialogueSpeakerPortrait.onerror = () => hideDialogueSpeakerPortrait(portraitConfig.portrait);
  els.dialogueSpeakerPortrait.src = portraitConfig.portrait;
  els.dialogueSpeakerPortrait.alt = portraitConfig.name || speaker || "";
}

function startTypewriter(text) {
  stopTypewriter();
  state.typewriterText = text;
  state.typewriterIndex = 0;
  state.isTypingDialogue = true;
  state.lastDialogueTypeSfxAt = 0;
  els.dialogueText.textContent = "";
  setDialogueButtonReady(false);
  typeNextCharacter();
}

function canGoPreviousLessonDialogue() {
  return Boolean(
    state.lessonStoryMode &&
    !state.actBattle &&
    Array.isArray(state.lessonStorySteps) &&
    state.lessonStorySteps.length > 0 &&
    state.lessonStoryStepIndex > 0 &&
    !state.awaitingDialogueChoice &&
    !state.awaitingName
  );
}

function updatePreviousDialogueButton() {
  if (!els.previousDialogueButton) {
    return;
  }

  const canGoPrevious = canGoPreviousLessonDialogue();
  els.previousDialogueButton.disabled = !canGoPrevious;
  els.previousDialogueButton.setAttribute("aria-disabled", canGoPrevious ? "false" : "true");
  els.previousDialogueButton.classList.toggle("hidden", !state.lessonStoryMode || Boolean(state.actBattle));
}

function goPreviousLessonDialogueLine(event = null) {
  if (event) {
    event.preventDefault();
  }

  if (!state.lessonStoryMode || state.actBattle) {
    return;
  }

  if (state.isTypingDialogue) {
    finishTypewriter();
    updatePreviousDialogueButton();
    return;
  }

  if (!canGoPreviousLessonDialogue()) {
    updatePreviousDialogueButton();
    return;
  }

  stopTypewriter();
  cancelNextDialogueHold();
  hideDialogueChoices();
  state.lessonStoryStepIndex = Math.max(0, state.lessonStoryStepIndex - 1);
  renderLessonStoryStep({ direction: "backward", suppressProgressSave: true });
}

function typeNextCharacter() {
  if (!state.isTypingDialogue) {
    return;
  }

  state.typewriterIndex += 1;
  els.dialogueText.textContent = state.typewriterText.slice(0, state.typewriterIndex);
  const revealedCharacter = state.typewriterText[state.typewriterIndex - 1] || "";

  if (state.typewriterIndex >= state.typewriterText.length) {
    finishTypewriter();
    return;
  }

  playDialogueTypeSfxTick(revealedCharacter);
  state.typewriterTimer = setTimeout(typeNextCharacter, getTypewriterDelay());
}

function getTypewriterDelay() {
  const currentCharacter = state.typewriterText[state.typewriterIndex - 1] || "";
  const line = state.activeDialogue[state.dialogueIndex] || {};
  const baseSpeed = line.speaker && line.speaker.includes("เวรีออน")
    ? TEACHER_DIALOGUE_SPEED
    : DIALOGUE_SPEED;

  return baseSpeed + (DIALOGUE_PUNCTUATION_PAUSE[currentCharacter] || 0);
}

function finishTypewriter() {
  stopTypewriter();
  els.dialogueText.textContent = state.typewriterText;
  state.isTypingDialogue = false;

  const line = state.activeDialogue[state.dialogueIndex];
  if (line && line.optionalMasterQuestionId) {
    showOptionalMasterQuestionChoices(line.optionalMasterQuestionId);
    setDialogueButtonReady(false);
    return;
  }

  if (line && line.lessonChoices) {
    showLessonStoryChoices(line.lessonChoices);
    setDialogueButtonReady(false);
    return;
  }

  if (line && line.choices) {
    showDialogueChoices(line.choices);
    setDialogueButtonReady(false);
    return;
  }

  setDialogueButtonReady(true);
  updatePreviousDialogueButton();
  if (line && line.requiresName && !getCharacterName()) {
    showNamePrompt();
  }
}

function handleNextDialogueClick(event) {
  if (state.nextDialogueHold?.completed) {
    state.nextDialogueHold = null;
    return;
  }
  if (state.isTypingDialogue) {
    finishTypewriter();
    return;
  }
  advanceDialogue(event);
}

function canHoldSkipDialogue() {
  const storyActive = scenes.story && scenes.story.classList.contains("active");
  return storyActive && !state.awaitingDialogueChoice && !state.awaitingName;
}

function startNextDialogueHold(event) {
  if (!canHoldSkipDialogue()) {
    return;
  }

  cancelNextDialogueHold();
  const duration = 820;
  const startedAt = performance.now();
  state.nextDialogueHold = {
    completed: false,
    timer: setTimeout(completeNextDialogueHold, duration),
    frame: null
  };
  els.nextDialogueButton.classList.add("is-holding");

  const update = now => {
    if (!state.nextDialogueHold) {
      return;
    }
    const progress = clamp((now - startedAt) / duration, 0, 1);
    els.nextDialogueButton.style.setProperty("--hold-progress", `${progress * 100}%`);
    state.nextDialogueHold.frame = requestAnimationFrame(update);
  };
  state.nextDialogueHold.frame = requestAnimationFrame(update);
}

function completeNextDialogueHold() {
  if (!state.nextDialogueHold || !canHoldSkipDialogue()) {
    cancelNextDialogueHold();
    return;
  }

  state.nextDialogueHold.completed = true;
  if (state.nextDialogueHold.frame) {
    cancelAnimationFrame(state.nextDialogueHold.frame);
    state.nextDialogueHold.frame = null;
  }
  els.nextDialogueButton.classList.remove("is-holding");
  els.nextDialogueButton.style.removeProperty("--hold-progress");
  if (state.isTypingDialogue) {
    finishTypewriter();
  } else {
    advanceDialogue();
  }
}

function cancelNextDialogueHold() {
  if (!state.nextDialogueHold) {
    return;
  }
  if (state.nextDialogueHold.timer) {
    clearTimeout(state.nextDialogueHold.timer);
  }
  if (state.nextDialogueHold.frame) {
    cancelAnimationFrame(state.nextDialogueHold.frame);
  }
  if (!state.nextDialogueHold.completed) {
    state.nextDialogueHold = null;
  }
  els.nextDialogueButton.classList.remove("is-holding");
  els.nextDialogueButton.style.removeProperty("--hold-progress");
}

function showDialogueChoices(choices) {
  state.awaitingDialogueChoice = true;
  els.dialogueChoices.innerHTML = "";
  choices.forEach(choice => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "dialogue-choice-btn";
    button.textContent = choice.text;
    button.addEventListener("click", () => {
      if (button.disabled) {
        return;
      }
      els.dialogueChoices.querySelectorAll("button").forEach(choiceButton => setButtonEnabled(choiceButton, false));
      chooseDialogueResponse(choice);
    });
    els.dialogueChoices.appendChild(button);
  });
  els.dialogueChoices.classList.remove("hidden");
}

function hideDialogueChoices() {
  state.awaitingDialogueChoice = false;
  els.dialogueChoices.innerHTML = "";
  els.dialogueChoices.classList.add("hidden");
}

function chooseDialogueResponse(choice) {
  hideDialogueChoices();
  state.activeDialogue.splice(state.dialogueIndex + 1, 0, {
    speaker: "มาสเตอร์เวรีออน",
    text: choice.response
  });
  advanceDialogue();
}

function stopTypewriter() {
  if (state.typewriterTimer) {
    clearTimeout(state.typewriterTimer);
  }

  state.typewriterTimer = null;
  stopDialogueTypeSfx();
}

function setDialogueButtonReady(isReady) {
  const shouldDisable = !isReady && !state.isTypingDialogue;
  els.nextDialogueButton.disabled = shouldDisable;
  els.nextDialogueButton.setAttribute("aria-disabled", isReady ? "false" : "true");
  els.nextDialogueButton.classList.toggle("is-waiting", !isReady);
}

function updateSpeakingCharacter(speaker) {
  els.storyWanderer.classList.remove("is-speaking");
  els.storyVerion.classList.remove("is-speaking");

  if (speaker.includes("ผู้พเนจร")) {
    els.storyWanderer.classList.add("is-speaking");
  }

  if (speaker.includes("เวรีออน")) {
    els.storyVerion.classList.add("is-speaking");
  }
}

function clearSpeakingCharacters() {
  els.storyWanderer.classList.remove("is-speaking");
  els.storyVerion.classList.remove("is-speaking");
}

function triggerMotion(element, className) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);

  setTimeout(() => {
    element.classList.remove(className);
  }, 560);
}

function startStory() {
  if (state.isTransitioning) {
    return;
  }

  runSceneTransition("กำลังเข้าสู่หอคอยแห่ง Unity...", setupStoryScene);
}

function restoreSavedProgress() {
  const progress = loadProgress();
  if (!progress || progress.currentScreen === "story") {
    return false;
  }

  if (progress.finalBossDefeated || progress.currentScreen === "victory") {
    completeActVictoryScene();
    return true;
  }

  if (restoreResumeCheckpoint(progress.resumeCheckpoint)) {
    return true;
  }

  const restoredStage = getStageById(progress.currentStageId);
  if (
    progress.currentScreen === "lesson" &&
    progress.lessonPhase === "postBossDialogue" &&
    isFinalBossStage(restoredStage)
  ) {
    console.log("[FinalBoss] restoring post boss dialogue", {
      stageId: restoredStage.id,
      dialogueIndex: progress.currentDialogueIndex || 0
    });
    startPostBossDialogue(restoredStage, progress.currentDialogueIndex || 0);
    return true;
  }

  if (progress.currentScreen === "actInfo") {
    showActInfoScreen();
    return true;
  }

  const stageIndex = getStageIndexById(progress.currentStageId);
  if (stageIndex >= 0) {
    showStageLesson(stageIndex, {
      lessonStepIndex: progress.currentLessonStepIndex,
      dialogueIndex: progress.currentDialogueIndex
    });
    return true;
  }

  return false;
}

function setupStoryScene(options = {}) {
  if (!options.forceIntro && restoreSavedProgress()) {
    return;
  }

  setActBackground("timeDustFields");
  stopTypewriter();
  const progress = loadProgress();
  state.dialogueIndex = progress && progress.currentScreen === "story"
    ? clamp(progress.currentDialogueIndex || 0, 0, 999)
    : 0;
  state.activeDialogue = buildStoryDialogue();
  state.dialogueIndex = clamp(state.dialogueIndex, 0, Math.max(state.activeDialogue.length - 1, 0));
  state.awaitingName = false;
  state.awaitingDialogueChoice = false;
  hideDialogueChoices();
  hideNamePrompt();
  els.storyNameInput.value = "";
  els.dialoguePanel.classList.remove("hidden");
  els.dialogueActions.classList.remove("hidden");
  els.nounActivity.classList.add("hidden");
  els.nounActivityVisual.classList.add("hidden");
  updateLessonChrome(null, 0, "story");
  showScene("story");
  saveProgress({
    currentScreen: "story",
    lastSafeScreen: "story",
    currentDialogueIndex: state.dialogueIndex,
    currentLessonStepIndex: 0
  });
  updateDialogue();
}

function advanceDialogue() {
  if (state.isTransitioning) {
    return;
  }

  if (state.isTypingDialogue) {
    return;
  }

  if (state.awaitingName) {
    return;
  }

  if (state.awaitingDialogueChoice) {
    return;
  }

  if (state.lessonStoryMode) {
    advanceLessonStoryStep();
    return;
  }

  state.dialogueIndex += 1;
  saveProgress({
    currentScreen: "story",
    lastSafeScreen: "story",
    currentDialogueIndex: state.dialogueIndex,
    currentLessonStepIndex: 0
  });

  if (state.dialogueIndex >= state.activeDialogue.length) {
    stopTypewriter();
    clearSpeakingCharacters();
    runSceneTransition("เสียงของถ้อยคำเริ่มกลับคืน...", () => {
      els.dialoguePanel.classList.add("hidden");
      els.dialogueActions.classList.add("hidden");
      startNounActivity();
    });
    return;
  }

  updateDialogue();
}

function startNounActivity() {
  setActBackground("timeDustFields");
  showActInfoScreen();
}

function getPlayableStages() {
  return PAST_FRAGMENT_ACT.stages.filter(stage =>
    !["story", "ending"].includes(stage.type) &&
    !["regular-intro"].includes(stage.id)
  );
}

function ensureActProgress() {
  if (!playerData) {
    return null;
  }

  ensureGrammariaState();

  const defaults = {
    ...DEFAULT_ACT_PROGRESS,
    introCompleted: false,
    tenseLessonCompleted: false,
    regularRulesCompleted: false,
    phase1WasWereCompleted: false,
    phase1ThereWasWereCompleted: false,
    phase1HadCompleted: false,
    edMiniBossDefeated: false,
    irregularLessonCompleted: false,
    irregularMiniBossDefeated: false,
    twistSeen: false,
    finalBossDefeated: false,
    rewards: [],
    completedStages: [],
    fragments: [],
    grammariaEarned: 0,
    badge: ""
  };
  const saved = playerData.progress.pastFragmentAct || {};
  playerData.progress.pastFragmentAct = {
    ...defaults,
    ...saved,
    completedLessons: Array.isArray(saved.completedLessons) ? saved.completedLessons : defaults.completedLessons,
    defeatedBosses: Array.isArray(saved.defeatedBosses) ? saved.defeatedBosses : defaults.defeatedBosses,
    unlockedStages: Array.isArray(saved.unlockedStages) && saved.unlockedStages.length ? saved.unlockedStages : defaults.unlockedStages,
    rewards: Array.isArray(saved.rewards) ? saved.rewards : defaults.rewards,
    completedStages: Array.isArray(saved.completedStages) ? saved.completedStages : defaults.completedStages,
    fragments: Array.isArray(saved.fragments) ? saved.fragments : defaults.fragments
  };
  return playerData.progress.pastFragmentAct;
}

function createDefaultGrammariaState() {
  return {
    total: 0,
    earnedByBoss: {},
    history: [],
    finalEvaluation: null
  };
}

function getKeyStageFromClassName(className = "") {
  if (/ป\.[1-3]/.test(className)) {
    return "lowerPrimary";
  }
  if (/ม\.[1-3]/.test(className)) {
    return "lowerSecondary";
  }
  return "upperPrimary";
}

function getKeyStageLabel(keyStage) {
  const labels = {
    lowerPrimary: "ช่วงชั้นที่ 1 ป.1 - ป.3",
    upperPrimary: "ช่วงชั้นที่ 2 ป.4 - ป.6",
    lowerSecondary: "ช่วงชั้นที่ 3 ม.1 - ม.3"
  };

  return labels[keyStage] || labels.upperPrimary;
}

function ensureGrammariaState() {
  if (!playerData) {
    return null;
  }

  if (!playerData.progress) {
    playerData.progress = {};
  }

  const saved = playerData.progress.grammaria || {};
  const total = Number.isFinite(Number(saved.total))
    ? Number(saved.total)
    : Number(playerData.grammaria || 0);
  playerData.progress.grammaria = {
    ...createDefaultGrammariaState(),
    ...saved,
    total,
    earnedByBoss: saved.earnedByBoss && typeof saved.earnedByBoss === "object" ? saved.earnedByBoss : {},
    history: Array.isArray(saved.history) ? saved.history : []
  };

  const className = playerData.className || "";
  const keyStage = playerData.progress.playerProfile?.keyStage
    || playerData.keyStage
    || getKeyStageFromClassName(className);
  playerData.keyStage = keyStage;
  playerData.progress.playerProfile = {
    ...(playerData.progress.playerProfile || {}),
    keyStage,
    className,
    room: playerData.room || ""
  };
  playerData.grammaria = playerData.progress.grammaria.total;
  updateLessonGrammariaDisplay();
  return playerData.progress.grammaria;
}

function getCurrentBattleStats() {
  return state.actBattle?.grammariaStats || state.currentBattleStats || null;
}

function createBattleStats(boss) {
  const bossId = getBossProgressId(boss) || boss?.id || boss?.enemy || "unknown-boss";
  return {
    bossId,
    bossName: boss?.thaiEnemy || boss?.enemy || boss?.title || "บอสแห่ง Lingua",
    correctAnswers: 0,
    wrongAnswers: 0,
    parryCount: 0,
    grammariaChargeCount: 0,
    grammariaChargePercents: [],
    playerDamageDealt: 0,
    bossDamageDealt: 0,
    parryCounterDamage: 0,
    chargeBonusDamageTotal: 0,
    highestDamage: 0,
    damageEvents: [],
    parryEvents: {},
    startedAt: Date.now()
  };
}

function recordCorrectAnswerForGrammaria() {
  const stats = getCurrentBattleStats();
  if (stats) {
    stats.correctAnswers += 1;
  }
}

function recordWrongAnswerForGrammaria() {
  const stats = getCurrentBattleStats();
  if (stats) {
    stats.wrongAnswers += 1;
  }
}

function recordParryForGrammaria(result, eventKey = "") {
  const stats = getCurrentBattleStats();
  if (!stats || !["GOOD", "PERFECT"].includes(result)) {
    return;
  }

  const key = eventKey || `${stats.parryCount}:${Date.now()}`;
  if (stats.parryEvents[key]) {
    return;
  }
  stats.parryEvents[key] = result;
  stats.parryCount += 1;
}

function recordGrammariaChargeUse(percent = 0) {
  const stats = getCurrentBattleStats();
  if (stats) {
    stats.grammariaChargeCount += 1;
    if (!Array.isArray(stats.grammariaChargePercents)) {
      stats.grammariaChargePercents = [];
    }
    stats.grammariaChargePercents.push(Math.round(percent));
  }
}

function pushBattleDamageEvent(stats, event) {
  if (!stats) {
    return;
  }
  if (!Array.isArray(stats.damageEvents)) {
    stats.damageEvents = [];
  }
  stats.damageEvents.push(event);
  if (stats.damageEvents.length > 40) {
    stats.damageEvents = stats.damageEvents.slice(-40);
  }
}

function recordPlayerDamage(amount, source = "attack", extra = {}) {
  const stats = getCurrentBattleStats();
  const damage = Math.max(0, Math.round(Number(amount) || 0));
  if (!stats || damage <= 0) {
    return;
  }

  stats.playerDamageDealt = (stats.playerDamageDealt || 0) + damage;
  stats.highestDamage = Math.max(stats.highestDamage || 0, damage);
  pushBattleDamageEvent(stats, {
    type: "player",
    source,
    amount: damage,
    at: Date.now(),
    ...extra
  });
}

function recordBossDamage(amount, source = "bossAttack", extra = {}) {
  const stats = getCurrentBattleStats();
  const damage = Math.max(0, Math.round(Number(amount) || 0));
  if (!stats || damage <= 0) {
    return;
  }

  stats.bossDamageDealt = (stats.bossDamageDealt || 0) + damage;
  pushBattleDamageEvent(stats, {
    type: "boss",
    source,
    amount: damage,
    at: Date.now(),
    ...extra
  });
}

function recordParryCounterDamage(amount, source = "pointParryCounter") {
  const stats = getCurrentBattleStats();
  const damage = Math.max(0, Math.round(Number(amount) || 0));
  if (!stats || damage <= 0) {
    return;
  }

  stats.parryCounterDamage = (stats.parryCounterDamage || 0) + damage;
  recordPlayerDamage(damage, source);
}

function recordChargeBonusDamage(amount) {
  const stats = getCurrentBattleStats();
  const damage = Math.max(0, Math.round(Number(amount) || 0));
  if (!stats || damage <= 0) {
    return;
  }

  stats.chargeBonusDamageTotal = (stats.chargeBonusDamageTotal || 0) + damage;
}

function calculateBossGrammaria(stats) {
  const correctPoints = (stats?.correctAnswers || 0) * GRAMMARIA_POINTS.correctAnswer;
  const parryPoints = (stats?.parryCount || 0) * GRAMMARIA_POINTS.parry;
  const chargePoints = (stats?.grammariaChargeCount || 0) * GRAMMARIA_POINTS.charge;

  return {
    correctPoints,
    parryPoints,
    chargePoints,
    total: correctPoints + parryPoints + chargePoints
  };
}

function awardBossGrammaria(stage, stats = getCurrentBattleStats()) {
  const progressState = ensureGrammariaState();
  if (!progressState || !stage) {
    return null;
  }

  const bossId = stats?.bossId || getBossProgressId(stage) || stage.id;
  const bossName = stats?.bossName || stage.thaiEnemy || stage.enemy || stage.title;
  const saved = progressState.earnedByBoss[bossId];
  if (saved) {
    const duplicateResult = {
      ...saved,
      bossId,
      bossName,
      duplicate: true,
      earned: saved.earned || 0,
      totalAfter: progressState.total,
      correctAnswers: stats?.correctAnswers || saved.correctAnswers || 0,
      wrongAnswers: stats?.wrongAnswers || saved.wrongAnswers || 0,
      parryCount: stats?.parryCount || saved.parryCount || 0,
      grammariaChargeCount: stats?.grammariaChargeCount || saved.grammariaChargeCount || 0,
      playerDamageDealt: stats?.playerDamageDealt || saved.playerDamageDealt || 0,
      bossDamageDealt: stats?.bossDamageDealt || saved.bossDamageDealt || 0,
      parryCounterDamage: stats?.parryCounterDamage || saved.parryCounterDamage || 0,
      chargeBonusDamageTotal: stats?.chargeBonusDamageTotal || saved.chargeBonusDamageTotal || 0,
      highestDamage: stats?.highestDamage || saved.highestDamage || 0,
      damageEvents: Array.isArray(stats?.damageEvents)
        ? stats.damageEvents.slice(-20)
        : (Array.isArray(saved.damageEvents) ? saved.damageEvents.slice(-20) : []),
      rewardFragment: stage?.reward?.fragment || saved.rewardFragment || "",
      rewardBadge: stage?.reward?.badge || saved.rewardBadge || ""
    };
    state.lastGrammariaResult = duplicateResult;
    return duplicateResult;
  }

  const cleanStats = {
    bossId,
    bossName,
    correctAnswers: stats?.correctAnswers || 0,
    wrongAnswers: stats?.wrongAnswers || 0,
    parryCount: stats?.parryCount || 0,
    grammariaChargeCount: stats?.grammariaChargeCount || 0,
    grammariaChargePercents: Array.isArray(stats?.grammariaChargePercents) ? [...stats.grammariaChargePercents] : [],
    playerDamageDealt: stats?.playerDamageDealt || 0,
    bossDamageDealt: stats?.bossDamageDealt || 0,
    parryCounterDamage: stats?.parryCounterDamage || 0,
    chargeBonusDamageTotal: stats?.chargeBonusDamageTotal || 0,
    highestDamage: stats?.highestDamage || 0,
    damageEvents: Array.isArray(stats?.damageEvents) ? stats.damageEvents.slice(-20) : [],
    rewardFragment: stage?.reward?.fragment || "",
    rewardBadge: stage?.reward?.badge || ""
  };
  const points = calculateBossGrammaria(cleanStats);
  const completedAt = new Date().toISOString();
  const result = {
    ...cleanStats,
    correctPoints: points.correctPoints,
    parryPoints: points.parryPoints,
    chargePoints: points.chargePoints,
    earned: points.total,
    completedAt,
    duplicate: false,
    totalAfter: progressState.total + points.total
  };

  progressState.total = result.totalAfter;
  progressState.earnedByBoss[bossId] = result;
  progressState.history.push(result);
  playerData.grammaria = progressState.total;
  state.grammaria = progressState.total;
  state.lastGrammariaResult = result;
  updateLessonGrammariaDisplay();
  console.log("[Grammaria] earned from boss:", {
    bossId,
    earned: result.earned,
    total: progressState.total
  });
  return result;
}

function createBossResultSnapshot(stage, stats = getCurrentBattleStats()) {
  const bossId = stats?.bossId || getBossProgressId(stage) || stage?.id || "unknown-boss";
  const cleanStats = {
    bossId,
    bossName: stats?.bossName || stage?.thaiEnemy || stage?.enemy || stage?.title || "บอสแห่ง Lingua",
    correctAnswers: stats?.correctAnswers || 0,
    wrongAnswers: stats?.wrongAnswers || 0,
    parryCount: stats?.parryCount || 0,
    grammariaChargeCount: stats?.grammariaChargeCount || 0,
    playerDamageDealt: stats?.playerDamageDealt || 0,
    bossDamageDealt: stats?.bossDamageDealt || 0,
    parryCounterDamage: stats?.parryCounterDamage || 0,
    chargeBonusDamageTotal: stats?.chargeBonusDamageTotal || 0,
    highestDamage: stats?.highestDamage || 0,
    damageEvents: Array.isArray(stats?.damageEvents) ? stats.damageEvents.slice(-20) : [],
    rewardFragment: stage?.reward?.fragment || "",
    rewardBadge: stage?.reward?.badge || ""
  };
  const points = calculateBossGrammaria(cleanStats);
  return {
    ...cleanStats,
    correctPoints: points.correctPoints,
    parryPoints: points.parryPoints,
    chargePoints: points.chargePoints,
    earned: points.total,
    totalAfter: playerData?.progress?.grammaria?.total ?? playerData?.grammaria ?? state.grammaria ?? 0,
    duplicate: false
  };
}

function renderBossGrammariaResult(result, onContinue) {
  if (!result) {
    if (typeof onContinue === "function") {
      onContinue();
    }
    return;
  }

  playVictorySceneMusicOnce();

  const panel = document.createElement("div");
  panel.className = "grammaria-result";
  panel.innerHTML = `
    <div class="grammaria-breakdown">
      <h3>${result.replay ? "Replay Complete / เรียนซ้ำสำเร็จ" : "สรุปการต่อสู้"}</h3>
      <div class="grammaria-breakdown-row"><span>ตอบถูก</span><strong>${result.correctAnswers || 0} ข้อ</strong></div>
      <div class="grammaria-breakdown-row"><span>ตอบผิด</span><strong>${result.wrongAnswers || 0} ข้อ</strong></div>
      <div class="grammaria-breakdown-row"><span>ดาเมจที่ทำกับบอส</span><strong>${result.playerDamageDealt || 0}</strong></div>
      <div class="grammaria-breakdown-row"><span>ดาเมจที่ได้รับจากบอส</span><strong>${result.bossDamageDealt || 0}</strong></div>
      <div class="grammaria-breakdown-row"><span>ดาเมจสูงสุดต่อครั้ง</span><strong>${result.highestDamage || 0}</strong></div>

      <h3>เทคนิคพิเศษ</h3>
      <div class="grammaria-breakdown-row"><span>Point Parry</span><strong>${result.parryCount || 0} ครั้ง</strong></div>
      <div class="grammaria-breakdown-row"><span>Counter Damage จาก Parry</span><strong>${result.parryCounterDamage || 0}</strong></div>
      <div class="grammaria-breakdown-row"><span>Grammaria Charge</span><strong>${result.grammariaChargeCount || 0} ครั้ง</strong></div>
      <div class="grammaria-breakdown-row"><span>โบนัส Damage จาก Charge</span><strong>${result.chargeBonusDamageTotal || 0}</strong></div>

      <h3>สรุป Grammaria</h3>
      <div class="grammaria-breakdown-row"><span>ตอบถูก ${result.correctAnswers || 0} ข้อ × ${GRAMMARIA_POINTS.correctAnswer}</span><strong>${result.correctPoints || 0}</strong></div>
      <div class="grammaria-breakdown-row"><span>Point Parry ${result.parryCount || 0} ครั้ง × ${GRAMMARIA_POINTS.parry}</span><strong>${result.parryPoints || 0}</strong></div>
      <div class="grammaria-breakdown-row"><span>Grammaria Charge ${result.grammariaChargeCount || 0} ครั้ง × ${GRAMMARIA_POINTS.charge}</span><strong>${result.chargePoints || 0}</strong></div>
      <div class="grammaria-total-row"><span>${result.replay ? "ได้รับในโหมดเรียนซ้ำ" : "ได้รับจากบอสนี้"}</span><strong>${result.earned || 0} Grammaria</strong></div>
      <div class="grammaria-total-row"><span>Grammaria สะสมทั้งหมด</span><strong>${result.totalAfter || 0}</strong></div>

      <h3>Fragment / Reward</h3>
      <div class="grammaria-breakdown-row"><span>Fragment ที่ได้รับ</span><strong>${result.replay ? "ไม่มีรางวัลซ้ำ" : (result.rewardFragment || "ไม่มี")}</strong></div>
      ${result.rewardBadge ? `<div class="grammaria-breakdown-row"><span>Badge ที่ได้รับ</span><strong>${result.rewardBadge}</strong></div>` : ""}
    </div>
    ${result.replay ? "<p class=\"grammaria-result-note\">คุณได้ทบทวนบทเรียนนี้แล้ว ไม่มีการรับ Grammaria หรือรางวัลซ้ำในโหมดเรียนซ้ำ</p>" : ""}
    ${result.duplicate && !result.replay ? "<p class=\"grammaria-result-note\">บอสนี้เคยให้ Grammaria แล้ว จึงไม่เพิ่มคะแนนซ้ำ แต่ยังแสดงผลการต่อสู้ให้ดูได้</p>" : ""}
  `;

  console.log("[BossResult] finalizing", {
    stageId: result.bossId,
    bossId: result.bossId,
    earned: result.earned,
    playerDamageDealt: result.playerDamageDealt,
    bossDamageDealt: result.bossDamageDealt
  });

  openGameModal({
    title: result.replay ? "เรียนซ้ำสำเร็จ" : `ชัยชนะเหนือ ${result.bossName || "บอสแห่ง Lingua"}`,
    body: result.replay ? "ไม่มีการรับ Grammaria หรือรางวัลซ้ำในโหมดเรียนซ้ำ" : "สรุปผลการต่อสู้และรางวัลที่ได้รับ",
    content: panel,
    actions: [
      {
        label: "ไปต่อ",
        primary: true,
        onClick: () => {
          closeGameModal();
          if (typeof onContinue === "function") {
            onContinue();
          }
        }
      }
    ]
  });
}

function updateLessonGrammariaDisplay() {
  if (!els?.lessonGrammariaDisplay) {
    return;
  }

  const total = playerData?.progress?.grammaria?.total ?? playerData?.grammaria ?? 0;
  els.lessonGrammariaDisplay.textContent = `Grammaria สะสม: ${Number(total) || 0}`;
}

function calculateFinalGrammariaEvaluation(progress = playerData?.progress) {
  const grammariaState = ensureGrammariaState();
  const totalGrammaria = grammariaState?.total || 0;
  // TODO: ปรับคะแนนเต็มตามจำนวนบอสจริงของ ACT เมื่อเพิ่ม content ครบทุก ACT
  const historyMax = Math.max((grammariaState?.history?.length || 0) * 120, 1);
  const maxGrammariaPossible = Math.max(CONFIGURED_MAX_GRAMMARIA, historyMax);
  const grammariaPercent = clamp(Math.round((totalGrammaria / maxGrammariaPossible) * 100), 0, 100);
  const keyStage = progress?.playerProfile?.keyStage || playerData?.keyStage || "upperPrimary";
  let qualityLevel = "ควรฝึกฝนเพิ่มเติม";
  let summaryText = "ผู้เล่นควรกลับไปทบทวนบทเรียน ฝึกตอบคำถาม และลองต่อสู้กับบอสอีกครั้งเพื่อเสริมความมั่นใจ";

  if (grammariaPercent >= 90) {
    qualityLevel = "ดีเยี่ยม";
    summaryText = "ผู้เล่นสามารถใช้พลังภาษาได้อย่างแม่นยำ มีความเข้าใจบทเรียนและรับมือกับสถานการณ์ใน Lingua ได้โดดเด่น";
  } else if (grammariaPercent >= 75) {
    qualityLevel = "ดีมาก";
    summaryText = "ผู้เล่นมีความเข้าใจภาษาในระดับดีมาก สามารถตอบคำถามและใช้กลยุทธ์ในการต่อสู้ได้อย่างเหมาะสม";
  } else if (grammariaPercent >= 60) {
    qualityLevel = "ผ่านเกณฑ์";
    summaryText = "ผู้เล่นมีความเข้าใจพื้นฐานตามช่วงชั้นที่เลือก และสามารถพัฒนาต่อได้จากการทบทวนบทเรียนเพิ่มเติม";
  }

  return {
    playerName: playerData?.characterName || playerData?.displayName || playerData?.username || "ผู้เล่น",
    keyStage,
    keyStageLabel: getKeyStageLabel(keyStage),
    totalGrammaria,
    maxGrammariaPossible,
    grammariaPercent,
    qualityLevel,
    summaryText,
    evaluatedAt: new Date().toISOString()
  };
}

function showFinalGrammariaEvaluation(onContinue = null) {
  const progress = ensureActProgress();
  if (!progress || !playerData) {
    return;
  }

  const evaluation = calculateFinalGrammariaEvaluation(playerData.progress);
  playerData.progress.grammaria.finalEvaluation = evaluation;
  savePlayerData();

  const panel = document.createElement("div");
  panel.className = "final-evaluation-panel";
  panel.innerHTML = `
    <div class="final-evaluation-summary">ชื่อผู้เล่น: ${evaluation.playerName}</div>
    <div class="grammaria-breakdown">
      <div class="grammaria-breakdown-row"><span>ช่วงชั้น</span><strong>${evaluation.keyStageLabel}</strong></div>
      <div class="grammaria-breakdown-row"><span>Grammaria สะสมทั้งหมด</span><strong>${evaluation.totalGrammaria}</strong></div>
      <div class="grammaria-breakdown-row"><span>คิดเป็น</span><strong>${evaluation.grammariaPercent}%</strong></div>
      <div class="grammaria-total-row"><span>ระดับคุณภาพ</span><strong>${evaluation.qualityLevel}</strong></div>
    </div>
    <div class="final-evaluation-summary">${evaluation.summaryText}</div>
  `;

  openGameModal({
    title: "ผลการประเมินพลังภาษาแห่ง Lingua",
    body: "ผลการประเมินพลังภาษา",
    content: panel,
    actions: [
      {
        label: onContinue ? "เล่นต่อ/ทบทวนบทเรียน" : "กลับหน้าแรก",
        primary: true,
        onClick: () => {
          closeGameModal();
          if (typeof onContinue === "function") {
            onContinue();
          } else {
            showScene("login");
          }
        }
      }
    ]
  });
}

function getStageIndexById(stageId) {
  return getPlayableStages().findIndex(stage => stage.id === stageId);
}

function getStageById(stageId) {
  return getPlayableStages().find(stage => stage.id === stageId) || null;
}

function normalizeEnemyId(enemy) {
  const raw = typeof enemy === "string"
    ? enemy
    : (enemy?.id || enemy?.name || enemy?.enemy || enemy?.thaiEnemy || "");
  const key = String(raw).trim().toLowerCase().replace(/[\s_-]+/g, "");

  if (["ฝุ่นเวลา", "timedust"].includes(key) || raw === "Time Dust" || raw === "timeDust" || raw === "time_dust") {
    return "timeDust";
  }
  if (["ภูตฝุ่นเวลา", "timedustsprite"].includes(key) || raw === "Time Dust Sprite" || raw === "timeDustSprite" || raw === "time_dust_sprite") {
    return "timeDustSprite";
  }
  if (["ไรเมื่อวาน", "yesterdaymite"].includes(key) || raw === "Yesterday Mite" || raw === "yesterdayMite" || raw === "yesterday_mite") {
    return "yesterdayMite";
  }
  if (["วิสป์waswere", "waswerewisp"].includes(key) || raw === "Was-Were Wisp" || raw === "wasWereWisp" || raw === "was_were_wisp") {
    return "wasWereWisp";
  }
  if (["โคมความทรงจำ", "memorylantern"].includes(key) || raw === "Memory Lantern" || raw === "memoryLantern" || raw === "memory_lantern") {
    return "memoryLantern";
  }
  if (["อิมป์ถุงของหาย", "lostpouchimp"].includes(key) || raw === "Lost Pouch Imp" || raw === "lostPouchImp" || raw === "lost_pouch_imp") {
    return "lostPouchImp";
  }
  if (["ติ๊กสะท้อนอดีต", "echotick"].includes(key) || raw === "Echo Tick" || raw === "echoTick" || raw === "echo_tick") {
    return "echoTick";
  }
  if (["สไลม์ย้อนเวลา", "rewindslime"].includes(key) || raw === "Rewind Slime" || raw === "rewindSlime") {
    return "rewindSlime";
  }
  if (raw === "The -ed Forger" || raw === "ช่างหลอม -ed") {
    return "edForger";
  }
  if (raw === "The Irregular Wraith" || raw === "ภูต Irregular") {
    return "irregularWraith";
  }
  if (raw === "The Memory Breaker" || raw === "ผู้ทำลายความทรงจำ") {
    return "memoryBreaker";
  }
  return raw || "";
}

function isFinalBossStage(stage) {
  if (!stage) {
    return false;
  }

  const normalizedEnemy = normalizeEnemyId(stage);
  const compactEnemy = String(stage.enemy || stage.name || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
  return stage.id === "final-boss" ||
    stage.type === "final-boss" ||
    stage.enemy === "The Memory Breaker" ||
    normalizedEnemy === "memoryBreaker" ||
    compactEnemy === "thememorybreaker" ||
    compactEnemy === "memorybreaker";
}

function isTrueBossStage(stage) {
  if (!stage) {
    return false;
  }
  return isFinalBossStage(stage) || String(stage.type || "").includes("boss");
}

function getBossProgressId(stage) {
  if (!stage) {
    return "";
  }
  const normalizedId = normalizeEnemyId(stage);
  if (normalizedId) {
    return normalizedId;
  }
  if (stage.id === "what-is-past" || stage.enemy === "Time Dust") {
    return "timeDust";
  }
  if (stage.id === "regular-rule-1" || stage.enemy === "Echo Tick") {
    return "echoTick";
  }
  if (stage.id === "regular-rule-3" || stage.enemy === "Yesterday Sprite") {
    return "yesterdaySprite";
  }
  if (stage.id === "regular-rule-4" || stage.enemy === "Rewind Slime") {
    return "rewindSlime";
  }
  if (stage.id === "ed-mini-boss") {
    return "edForger";
  }
  if (stage.id === "irregular-mini-boss") {
    return "irregularWraith";
  }
  if (isFinalBossStage(stage)) {
    return "memoryBreaker";
  }
  return "";
}

function validateProgress(progress) {
  const fallbackStage = DEFAULT_ACT_PROGRESS.currentStageId;
  if (progress.currentStageId === "regular-intro") {
    progress.currentStageId = "regular-rule-1";
  }
  if (progress.currentLessonId === "regular-intro") {
    progress.currentLessonId = "regular-rule-1";
  }
  if (!getStageById(progress.currentStageId)) {
    progress.currentStageId = fallbackStage;
  }
  if (!getStageById(progress.currentLessonId)) {
    progress.currentLessonId = progress.currentStageId;
  }
  progress.lessonPhase = progress.lessonPhase || "teacherExplanation";
  progress.currentDialogueIndex = Math.max(0, Number(progress.currentDialogueIndex) || 0);
  progress.currentLessonStepIndex = Math.max(0, Number(progress.currentLessonStepIndex) || 0);
  ["completedLessons", "defeatedBosses", "unlockedStages", "rewards", "completedStages", "fragments"].forEach(key => {
    if (!Array.isArray(progress[key])) {
      progress[key] = [];
    }
  });
  if (!progress.unlockedStages.length) {
    progress.unlockedStages.push(fallbackStage);
  }
  ensureGrammariaState();
  return progress;
}

function loadProgress() {
  const progress = ensureActProgress();
  if (!progress) {
    return null;
  }
  validateProgress(progress);
  console.log("[Progress] Loaded:", progress);
  updateLessonGrammariaDisplay();
  return progress;
}

const RESUME_CHECKPOINT_VERSION = 1;
let manualSaveStatusTimer = null;

function getActiveSceneName() {
  return Object.entries(scenes).find(([, scene]) => scene?.classList.contains("active"))?.[0] || "";
}

function isManualSaveScene(sceneName = getActiveSceneName()) {
  return sceneName === "story" || sceneName === "battle";
}

function updateManualSaveButtonVisibility(sceneName = getActiveSceneName()) {
  if (!els.manualSaveButton) {
    return;
  }
  const hasSupportedContext = sceneName === "battle"
    ? Boolean(state.actBattle)
    : sceneName === "story" && Boolean(state.currentLessonStage || state.lessonStoryMode || state.lessonSteps.length);
  const canShow = Boolean(playerData) &&
    isManualSaveScene(sceneName) &&
    hasSupportedContext &&
    !state.isPrologueActive &&
    !state.isTransitioning;
  els.manualSaveButton.classList.toggle("hidden", !canShow);
  if (!canShow) {
    setManualSaveButtonState("normal");
  }
}

function setManualSaveButtonState(status = "normal") {
  if (!els.manualSaveButton) {
    return;
  }
  window.clearTimeout(manualSaveStatusTimer);
  els.manualSaveButton.classList.remove("is-success", "is-error");
  els.manualSaveButton.disabled = status === "saving";
  if (status === "saving") {
    els.manualSaveButton.textContent = "กำลังบันทึก...";
    return;
  }
  if (status === "success") {
    els.manualSaveButton.textContent = "บันทึกแล้ว";
    els.manualSaveButton.classList.add("is-success");
    manualSaveStatusTimer = window.setTimeout(() => setManualSaveButtonState("normal"), 1800);
    return;
  }
  if (status === "failure") {
    els.manualSaveButton.textContent = "บันทึกไม่สำเร็จ";
    els.manualSaveButton.classList.add("is-error");
    manualSaveStatusTimer = window.setTimeout(() => setManualSaveButtonState("normal"), 2200);
    return;
  }
  els.manualSaveButton.textContent = "💾 บันทึก";
}

function setToArray(value) {
  return value instanceof Set ? [...value] : Array.isArray(value) ? value : [];
}

function restoreSet(value) {
  return new Set(Array.isArray(value) ? value : []);
}

function getCheckpointStageId() {
  return state.currentLessonStage?.id ||
    state.actBattle?.stage?.id ||
    getPlayableStages()[state.actStageIndex]?.id ||
    ensureActProgress()?.currentStageId ||
    DEFAULT_ACT_PROGRESS.currentStageId;
}

function captureLessonResumeCheckpoint(source, savedAt) {
  if (!state.currentLessonStage && !state.lessonStoryMode && !state.lessonSteps.length) {
    return null;
  }
  const stageId = getCheckpointStageId();
  const stage = getStageById(stageId);
  if (!stage || getActiveSceneName() !== "story") {
    return null;
  }

  const phase = state.lessonStoryMode
    ? (state.lessonStorySteps[state.lessonStoryStepIndex]?.phase || (stage.isPostBossDialogue ? "postBossDialogue" : "teacherExplanation"))
    : (ensureActProgress()?.lessonPhase || "teacherExplanation");

  return {
    version: RESUME_CHECKPOINT_VERSION,
    source,
    savedAt,
    scene: "lesson",
    stageId: stage.id,
    lesson: {
      mode: phase === "postBossDialogue"
        ? "postBossDialogue"
        : state.lessonStoryMode ? "dialogue" : "activity",
      phase,
      dialogueIndex: Math.max(0, Number(state.lessonStoryStepIndex) || 0),
      lessonStepIndex: Math.max(0, Number(state.lessonStepIndex) || 0),
      isReplay: Boolean(state.activeReplayLessonId === stage.id),
      replayReturnProgress: state.replayReturnProgress || null
    },
    battle: null
  };
}

function getBattleResumeMode(battle) {
  if (!battle) {
    return "player-action-menu";
  }
  if (battle.bossGrammarChallenge?.active && battle.bossGrammarChallenge.mode === "typing") {
    return "boss-typing";
  }
  if (battle.bossGrammarChallenge?.active && battle.bossGrammarChallenge.mode === "arrangement") {
    return "boss-arrangement";
  }
  if (battle.bossQuestionState?.active && battle.currentBossQuestion) {
    return "boss-question";
  }
  if (state.parry || state.pointParry?.active || battle.heavyAttackState?.active || battle.awaitingParry || battle.awaitingPrepare) {
    return "boss-intent";
  }
  if (battle.pendingBossTurn && !els.bossIntentPanel?.classList.contains("hidden")) {
    return "boss-intent";
  }
  if (battle.pendingBossTurn) {
    return "boss-intent";
  }
  if (!els.continueBattleButton?.classList.contains("hidden")) {
    return "continue";
  }
  if (battle.playerActionPhase === "skillSelect") {
    return "skill-select";
  }
  if (battle.playerActionPhase === "charmSelect") {
    return "charm-select";
  }
  if (battle.playerActionPhase === "charge") {
    return "charge";
  }
  if (!els.questionPanel?.classList.contains("hidden") && battle.currentFocusQuestion) {
    return "focus-question";
  }
  if (!els.questionPanel?.classList.contains("hidden") && battle.currentQuestion) {
    return "player-question";
  }
  return "player-action-menu";
}

function captureBattleResumeCheckpoint(source, savedAt) {
  const battle = state.actBattle;
  const stage = battle?.stage;
  if (!battle || !stage || getActiveSceneName() !== "battle" || isActBattleEnded(battle) || battle.victoryHandled) {
    return null;
  }

  const battleSnapshot = serializeProgressValue({
    ...battle,
    stage: undefined,
    stageId: stage.id,
    resumeMode: getBattleResumeMode(battle),
    skillCooldowns: { ...(ensureBattleSkillCooldownState(battle)?.skillCooldowns || createInitialSkillCooldowns()) },
    skillCooldownStartedTurn: { ...(battle.skillCooldownStartedTurn || {}) },
    skillCooldownLastTickPlayerTurn: Math.max(0, Number(battle.skillCooldownLastTickPlayerTurn) || 0),
    playerTurnCounter: Math.max(0, Number(battle.playerTurnCounter) || 0),
    usedQuestionIds: setToArray(battle.usedQuestionIds),
    usedBossQuestionIds: setToArray(battle.usedBossQuestionIds),
    usedFocusQuestionIds: setToArray(battle.usedFocusQuestionIds),
    playerHp: state.playerHp,
    enemyHp: state.enemyHp,
    enemyMaxHp: state.enemyMaxHp,
    grammaria: state.grammaria,
    sparkBonus: state.sparkBonus,
    shield: state.shield,
    guardShield: state.guardShield,
    battleActiveEffects: state.battleActiveEffects || {},
    currentQuestion: battle.currentQuestion || null,
    currentFocusQuestion: battle.currentFocusQuestion || null,
    currentBossQuestion: battle.currentBossQuestion || null
  });

  return {
    version: RESUME_CHECKPOINT_VERSION,
    source,
    savedAt,
    scene: "battle",
    stageId: stage.id,
    lesson: null,
    battle: battleSnapshot
  };
}

function captureCurrentResumeCheckpoint({ source = "auto" } = {}) {
  if (!playerData || state.isPrologueActive || state.isTransitioning) {
    return null;
  }
  const savedAt = new Date().toISOString();
  if (getActiveSceneName() === "battle") {
    return captureBattleResumeCheckpoint(source, savedAt);
  }
  if (getActiveSceneName() === "story") {
    return captureLessonResumeCheckpoint(source, savedAt);
  }
  return null;
}

function validateResumeCheckpoint(checkpoint) {
  if (!checkpoint || checkpoint.version !== RESUME_CHECKPOINT_VERSION) {
    return false;
  }
  if (checkpoint.scene !== "lesson" && checkpoint.scene !== "battle") {
    return false;
  }
  const stage = getStageById(checkpoint.stageId);
  if (!stage) {
    return false;
  }
  if (checkpoint.scene === "battle") {
    return Boolean(checkpoint.battle && !checkpoint.battle.victoryHandled && !checkpoint.battle.isDefeated);
  }
  return Boolean(checkpoint.lesson);
}

function restoreLessonResumeCheckpoint(checkpoint) {
  const stage = getStageById(checkpoint.stageId);
  const stageIndex = getStageIndexById(checkpoint.stageId);
  if (!stage || stageIndex < 0) {
    return false;
  }

  const lesson = checkpoint.lesson || {};
  state.activeReplayLessonId = lesson.isReplay ? stage.id : null;
  state.replayReturnProgress = lesson.replayReturnProgress || null;

  if (lesson.mode === "postBossDialogue" || lesson.phase === "postBossDialogue") {
    startPostBossDialogue(stage, lesson.dialogueIndex || 0);
    return true;
  }

  if (lesson.mode === "activity") {
    setActBackground(getAct1BackgroundKeyForStage(stage), { warnMissing: true });
    state.actStageIndex = stageIndex;
    state.currentLessonStage = stage;
    state.lessonStoryMode = false;
    state.lessonStorySteps = [];
    state.lessonStoryStepIndex = 0;
    state.lessonSteps = buildGuidedLessonSteps(stage);
    state.lessonStepIndex = clamp(lesson.lessonStepIndex || 0, 0, Math.max(state.lessonSteps.length - 1, 0));
    updateLessonChrome(stage, stageIndex, "lesson");
    showScene("story");
    renderLessonStep();
    return true;
  }

  showStageLesson(stageIndex, {
    dialogueIndex: lesson.dialogueIndex || 0,
    lessonStepIndex: lesson.lessonStepIndex || 0,
    isReplay: lesson.isReplay,
    preserveReplayState: true
  });
  return true;
}

function createBattleStageFromCheckpoint(stageId) {
  const stageConfig = getStageById(stageId);
  if (!stageConfig) {
    return null;
  }
  return {
    ...stageConfig,
    questions: filterQuestionsForStage(stageConfig.questions || [], stageConfig)
  };
}

function hydrateBattleSnapshot(snapshot, stage) {
  const battle = {
    ...snapshot,
    stage,
    usedQuestionIds: restoreSet(snapshot.usedQuestionIds),
    usedBossQuestionIds: restoreSet(snapshot.usedBossQuestionIds),
    usedFocusQuestionIds: restoreSet(snapshot.usedFocusQuestionIds)
  };
  battle.isActive = true;
  battle.isDefeated = false;
  battle.victoryHandled = false;
  ensureBattleSkillCooldownState(battle);
  return battle;
}

function renderRestoredPlayerQuestion() {
  const battle = state.actBattle;
  const question = battle?.currentQuestion;
  if (!battle || !question) {
    beginActPlayerTurn("กลับสู่เทิร์นของผู้พเนจร", { preservePlayerTurnCounter: true });
    return;
  }
  setBattleTurnOwner("player");
  els.continueBattleButton.classList.add("hidden");
  els.battleMessage.textContent = `${battle.stage.title} - คำถาม ${battle.questionIndex + 1} / ${battle.stage.questions.length}`;
  els.questionText.textContent = getQuestionText(question);
  els.answerOptions.innerHTML = "";
  question.options.forEach(option => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-button";
    button.textContent = option;
    button.addEventListener("click", () => chooseActAnswer(option));
    els.answerOptions.appendChild(button);
  });
  showOnlyBattlePanel(els.questionPanel);
}

function renderRestoredFocusQuestion() {
  const battle = state.actBattle;
  const question = battle?.currentFocusQuestion;
  if (!battle || !question) {
    beginActPlayerTurn("กลับสู่เทิร์นของผู้พเนจร", { preservePlayerTurnCounter: true });
    return;
  }
  setBattleTurnOwner("player");
  els.battleMessage.textContent = "ตั้งสมาธิ: ตอบคำถามสั้น ๆ เพื่อรวบรวม Grammaria และฟื้น AP";
  els.questionText.textContent = getQuestionText(question);
  els.answerOptions.innerHTML = "";
  question.options.forEach(option => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-button";
    button.textContent = option;
    button.addEventListener("click", () => chooseActFocusAnswer(option, question));
    els.answerOptions.appendChild(button);
  });
  showOnlyBattlePanel(els.questionPanel);
}

function renderRestoredBossQuestion() {
  const battle = state.actBattle;
  const question = battle?.currentBossQuestion;
  if (!battle || !question) {
    showBossIntentPanel(battle?.pendingBossTurn);
    return;
  }
  battle.bossQuestionState = {
    active: true,
    inputLocked: false,
    resolved: false,
    questionId: question.id || ""
  };
  showOnlyBattlePanel(els.questionPanel);
  setBattleTurnOwner("enemy");
  els.continueBattleButton.classList.add("hidden");
  els.battleMessage.textContent = "บอส: “ถ้าเจ้าจำอดีตผิด ความทรงจำก็จะแตกสลาย... ตอบข้ามา!”";
  els.questionText.textContent = getQuestionText(question);
  els.answerOptions.innerHTML = "";
  question.options.forEach(option => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-button";
    button.textContent = option;
    button.addEventListener("click", () => chooseBossQuestionAnswer(option, question));
    els.answerOptions.appendChild(button);
  });
}

function renderRestoredBattleCheckpoint(resumeMode) {
  const battle = state.actBattle;
  if (!battle) {
    return false;
  }

  switch (resumeMode) {
    case "player-question":
      renderRestoredPlayerQuestion();
      return true;
    case "focus-question":
      renderRestoredFocusQuestion();
      return true;
    case "skill-select":
      renderBattleSkillSelectionPanel();
      return true;
    case "charm-select":
      renderBattleCharmSelectionPanel();
      return true;
    case "charge":
      renderBattleChargePanel();
      return true;
    case "boss-typing":
      showBossTypingChallenge();
      return true;
    case "boss-arrangement":
      showBossArrangementChallenge();
      return true;
    case "boss-question":
      renderRestoredBossQuestion();
      return true;
    case "boss-intent":
      if (battle.pendingBossTurn) {
        showBossIntentPanel(battle.pendingBossTurn);
        return true;
      }
      break;
    case "continue":
      setBattleTurnOwner("player");
      showOnlyBattlePanel(null);
      showBattleContinueButton(
        battle.questionIndex >= battle.stage.questions.length - 1 || state.enemyHp <= 0 ? "รับรางวัล" : "คำถามถัดไป",
        continueActBattle
      );
      return true;
    default:
      break;
  }
  beginActPlayerTurn("กลับสู่เทิร์นของผู้พเนจร", { preservePlayerTurnCounter: true });
  return true;
}

function restoreBattleResumeCheckpoint(checkpoint) {
  const stage = createBattleStageFromCheckpoint(checkpoint.stageId);
  const stageIndex = getStageIndexById(checkpoint.stageId);
  if (!stage || stageIndex < 0 || !stage.questions.length) {
    return false;
  }

  cleanupBossHeavyAttackChain({ clearParryUi: true });
  cleanupBattleInputState();
  resetVictorySceneMusicForBattle();
  setActBackground(getAct1BackgroundKeyForStage(stage), { warnMissing: true });

  const battle = hydrateBattleSnapshot(checkpoint.battle, stage);
  state.actStageIndex = stageIndex;
  state.currentLessonStage = stage;
  state.actBattle = battle;
  state.currentBattleStats = battle.grammariaStats || createBattleStats(stage);
  state.playerHp = clamp(Number(checkpoint.battle.playerHp ?? state.playerHp), 0, 100);
  state.enemyMaxHp = Math.max(1, Number(checkpoint.battle.enemyMaxHp || state.enemyMaxHp || 1));
  state.enemyHp = clamp(Number(checkpoint.battle.enemyHp ?? state.enemyHp), 0, state.enemyMaxHp);
  state.grammaria = Number(checkpoint.battle.grammaria ?? state.grammaria) || 0;
  state.sparkBonus = Number(checkpoint.battle.sparkBonus ?? state.sparkBonus) || 0;
  state.shield = Number(checkpoint.battle.shield ?? state.shield) || 0;
  state.guardShield = Number(checkpoint.battle.guardShield ?? state.guardShield) || 0;
  state.battleActiveEffects = checkpoint.battle.battleActiveEffects || {};

  resetBattleContinueControls();
  showScene("battle");
  updateBattleEnemyVisual(stage);
  updateBattleStats();
  renderBattleTurnIndicator();
  return renderRestoredBattleCheckpoint(checkpoint.battle.resumeMode || "player-action-menu");
}

function restoreResumeCheckpoint(checkpoint) {
  if (!validateResumeCheckpoint(checkpoint)) {
    return false;
  }
  try {
    if (checkpoint.scene === "battle") {
      return restoreBattleResumeCheckpoint(checkpoint);
    }
    return restoreLessonResumeCheckpoint(checkpoint);
  } catch (error) {
    console.warn("[Progress] Failed to restore resume checkpoint", error);
    return false;
  }
}

const MAIN_MENU_STAGE_LABELS = {
  "what-is-past": {
    lesson: "What is the Past?",
    area: "Time Dust Fields",
    goal: "Defeat Time Dust Sprite"
  },
  "what-is-tense": {
    lesson: "Past Time Words",
    area: "Time Dust Fields",
    goal: "Defeat Yesterday Mite"
  },
  "act1_phase1_unit3_was_were": {
    lesson: "was / were",
    area: "Time Dust Fields",
    goal: "Defeat Was-Were Wisp"
  },
  "act1_phase1_unit4_there_was_were": {
    lesson: "there was / there were",
    area: "Time Dust Fields",
    goal: "Defeat Memory Lantern"
  },
  "act1_phase1_unit5_had": {
    lesson: "had",
    area: "Time Dust Fields",
    goal: "Defeat Lost Pouch Imp"
  },
  "regular-rule-1": {
    lesson: "Phase 2: Forging Regular Verbs",
    area: "The Ed Forge",
    goal: "เดินทางสู่ The Ed Forge"
  },
  "regular-rule-2": {
    lesson: "Regular Verb Rules",
    area: "The Ed Forge",
    goal: "Use -d for verbs ending in e"
  },
  "regular-rule-3": {
    lesson: "Regular Verb Rules",
    area: "The Ed Forge",
    goal: "Use y-ending rules correctly"
  },
  "regular-rule-4": {
    lesson: "Past Simple Review",
    area: "Rewind Clockworks",
    goal: "Review short verb spelling rules"
  },
  "ed-mini-boss": {
    lesson: "Regular Verb Boss Trial",
    area: "The Ed Forge",
    goal: "Defeat The -ed Forger"
  },
  "irregular-lesson": {
    lesson: "Irregular Verb Lesson",
    area: "Irregular Cave",
    goal: "Learn irregular V2 forms"
  },
  "irregular-mini-boss": {
    lesson: "Irregular Verb Boss Trial",
    area: "Irregular Cave",
    goal: "Defeat The Irregular Wraith"
  },
  "merge-twist": {
    lesson: "Past Simple Review",
    area: "Rewind Clockworks",
    goal: "Prepare for the final boss"
  },
  "final-boss": {
    lesson: "Final Assessment",
    area: "Memory Breaker Citadel",
    goal: "Defeat The Memory Breaker"
  }
};

const MAIN_MENU_BOSS_IDS = ["timeDustSprite", "yesterdayMite", "wasWereWisp", "memoryLantern", "lostPouchImp", "timeDust", "echoTick", "yesterdaySprite", "edForger", "irregularWraith", "memoryBreaker"];
const MAIN_MENU_COLLECTION_ITEMS = [
  { id: "timeDustSprite", label: "Time Dust Spark", match: ["Time Dust Spark"] },
  { id: "yesterdayMite", label: "Yesterday Shard", match: ["Yesterday Shard"] },
  { id: "wasWereWisp", label: "Was-Were Glow", match: ["Was-Were Glow"] },
  { id: "memoryLantern", label: "Memory Lantern Flame", match: ["Memory Lantern Flame"] },
  { id: "lostPouchImp", label: "Had Relic", match: ["Had Relic"] },
  { id: "timeDust", label: "Time Spark", match: ["Time Spark"] },
  { id: "echoTick", label: "Tense Spark", match: ["Tense Spark", "Rule 1 Spark", "Rule 2 Spark"] },
  { id: "edForger", label: "Ed Fragment", match: ["Ed Fragment"] },
  { id: "irregularWraith", label: "Irregular Fragment", match: ["Irregular Fragment", "Irregular Memory Spark"] },
  { id: "memoryBreaker", label: "Past Fragment", match: ["Past Fragment"] }
];

function safeDisplayText(value, fallback = "ยังไม่มีข้อมูล") {
  if (value === null || value === undefined) {
    return fallback;
  }
  const text = String(value).trim();
  if (!text || text === "undefined" || text === "null" || text === "NaN") {
    return fallback;
  }
  return text;
}

function hasMeaningfulSavedProgress(progress) {
  if (!progress) {
    return false;
  }
  return Boolean(
    progress.lastUpdatedAt ||
    (Array.isArray(progress.completedLessons) && progress.completedLessons.length) ||
    (Array.isArray(progress.defeatedBosses) && progress.defeatedBosses.length) ||
    progress.currentScreen !== "story" ||
    progress.currentStageId !== DEFAULT_ACT_PROGRESS.currentStageId
  );
}

function getMainMenuStage(progress) {
  const stageId = progress?.currentStageId || progress?.currentLessonId || DEFAULT_ACT_PROGRESS.currentStageId;
  return getStageById(stageId) || getStageById(DEFAULT_ACT_PROGRESS.currentStageId) || getPlayableStages()[0] || null;
}

function getMainMenuStageLabels(progress) {
  if (progress?.finalBossDefeated || progress?.currentScreen === "victory" || progress?.currentScreen === "pastFragmentVictory") {
    return {
      lesson: "Act 1 Completed",
      area: "Past Fragment Restored",
      goal: "View assessment result"
    };
  }
  const stage = getMainMenuStage(progress);
  const mapped = MAIN_MENU_STAGE_LABELS[stage?.id] || {};
  return {
    lesson: safeDisplayText(mapped.lesson || stage?.title || stage?.thaiTitle, "ยังไม่มีความคืบหน้าที่บันทึกไว้"),
    area: safeDisplayText(mapped.area || stage?.thaiTitle || stage?.title, "รอการบันทึกข้อมูล"),
    goal: safeDisplayText(mapped.goal || (stage?.enemy ? `Defeat ${stage.enemy}` : "เริ่มการเดินทางใน Act 1"), "เริ่มการเดินทางใน Act 1")
  };
}

function calculateMainMenuActProgress(progress) {
  if (!progress) {
    return 0;
  }
  if (progress.finalBossDefeated || progress.currentScreen === "victory" || progress.currentScreen === "pastFragmentVictory") {
    return 100;
  }
  const playableStages = getPlayableStages();
  const completed = new Set(progress.completedLessons || []);
  const completedCount = playableStages.filter(stage => completed.has(stage.id)).length;
  const stageIndex = Math.max(getStageIndexById(progress.currentStageId), 0);
  const stepProgress = Math.max(completedCount, stageIndex);
  return clamp(Math.round((stepProgress / Math.max(playableStages.length, 1)) * 100), 0, 99);
}

function buildMainMenuCollection(progress, grammariaState) {
  const rewards = new Set([...(progress?.rewards || []), ...(progress?.fragments || [])]);
  const defeated = new Set(progress?.defeatedBosses || []);
  const earnedBosses = grammariaState?.earnedByBoss || {};
  return MAIN_MENU_COLLECTION_ITEMS.map(item => {
    const unlocked = defeated.has(item.id) ||
      Boolean(earnedBosses[item.id]) ||
      item.match.some(fragment => rewards.has(fragment));
    return {
      label: unlocked ? item.label : "???",
      status: unlocked ? "Unlocked" : "ยังไม่ค้นพบ",
      unlocked
    };
  });
}

function buildMainMenuViewModel() {
  const user = getCurrentUser();
  const progress = loadProgress();
  const grammariaState = ensureGrammariaState();
  const labels = getMainMenuStageLabels(progress);
  const defeatedBosses = new Set(progress?.defeatedBosses || []);
  Object.keys(grammariaState?.earnedByBoss || {}).forEach(bossId => defeatedBosses.add(bossId));
  const bossesDefeated = MAIN_MENU_BOSS_IDS.filter(bossId => defeatedBosses.has(bossId)).length;
  const playerName = safeDisplayText(playerData?.characterName || playerData?.displayName || user?.displayName, "นักเดินทางแห่ง Lingua");
  const accountType = user?.isGuest || playerData?.isGuest ? "Guest" : "Registered";
  const progressPercent = calculateMainMenuActProgress(progress);
  const hasSave = hasMeaningfulSavedProgress(progress);
  const character = getPlayerCharacter(ensurePlayerCharacterData());

  return {
    playerName,
    accountType,
    title: playerData?.level && playerData.level > 1 ? `Level ${playerData.level} Wordmage` : "Novice Wordmage",
    avatarSrc: character.asset,
    characterId: character.id,
    characterLabel: character.label,
    currentActLabel: "Act 1: Past Fragment",
    currentLessonLabel: labels.lesson,
    currentAreaLabel: labels.area,
    nextGoalLabel: labels.goal,
    grammariaPoints: Number(grammariaState?.total ?? playerData?.grammaria ?? 0) || 0,
    collection: buildMainMenuCollection(progress, grammariaState),
    bossesDefeated,
    totalBosses: MAIN_MENU_BOSS_IDS.length,
    progressPercent,
    canContinue: hasSave,
    act1Completed: progress?.finalBossDefeated || progress?.currentScreen === "victory" || progress?.currentScreen === "pastFragmentVictory",
    saveStatus: progress?.lastUpdatedAt ? "บันทึกแล้ว" : "ยังไม่มีความคืบหน้าที่บันทึกไว้"
  };
}

function renderMainMenuCollection(collection = []) {
  if (!els.mainMenuCollection) {
    return;
  }
  els.mainMenuCollection.innerHTML = "";
  if (!collection.length) {
    const empty = document.createElement("div");
    empty.className = "collection-fragment-card is-locked";
    empty.innerHTML = "<strong>???</strong><span>ยังไม่มี Grammaria ที่ได้รับ</span>";
    els.mainMenuCollection.appendChild(empty);
    return;
  }
  collection.forEach(item => {
    const card = document.createElement("div");
    card.className = `collection-fragment-card${item.unlocked ? "" : " is-locked"}`;
    card.innerHTML = `<strong>${safeDisplayText(item.label, "???")}</strong><span>${safeDisplayText(item.status, "ยังไม่ค้นพบ")}</span>`;
    els.mainMenuCollection.appendChild(card);
  });
}

function renderMainMenu() {
  const view = buildMainMenuViewModel();
  if (els.mainMenuLogo && els.mainMenuLogoFallback) {
    els.mainMenuLogo.classList.remove("hidden");
    els.mainMenuLogoFallback.classList.add("hidden");
    els.mainMenuLogo.addEventListener("error", () => {
      els.mainMenuLogo.classList.add("hidden");
      els.mainMenuLogoFallback.classList.remove("hidden");
    }, { once: true });
  }
  if (els.mainMenuAvatar) {
    applyPlayerCharacterImage(els.mainMenuAvatar, view.characterId);
  }
  els.mainMenuPlayerName.textContent = view.playerName;
  els.mainMenuPlayerTitle.textContent = view.title;
  els.mainMenuCurrentAct.textContent = view.currentActLabel;
  els.mainMenuGrammaria.textContent = view.grammariaPoints.toLocaleString("en-US");
  els.mainMenuCurrentLesson.textContent = view.currentLessonLabel;
  els.mainMenuCurrentArea.textContent = view.currentAreaLabel;
  els.mainMenuNextGoal.textContent = view.nextGoalLabel;
  els.mainMenuProgressPercent.textContent = `${view.progressPercent}%`;
  els.mainMenuProgressFill.style.width = `${view.progressPercent}%`;
  els.mainMenuBossesDefeated.textContent = `${view.bossesDefeated} / ${view.totalBosses}`;
  renderMainMenuCollection(view.collection);

  setButtonAction(els.continueJourneyButton, view.canContinue ? "เดินทางต่อ" : "เริ่มการเดินทาง", continueJourneyFromMainMenu, { lock: true });
  setButtonAction(els.lessonMapButton, "แผนที่บทเรียน", openMainMenuLessonMap, { lock: false });
  setButtonAction(els.assessmentResultButton, "ผลการประเมิน", openMainMenuAssessmentResult, { lock: false });
  setButtonAction(els.accountSettingsButton, "ตั้งค่าบัญชี", openAccountSettingsModal, { lock: false });
  setButtonAction(els.mainMenuLogoutButton, "ออกจากระบบ", logoutCurrentUser, { lock: true });
}

function showMainMenu() {
  renderMainMenu();
  showScene("mainMenu");
}

function continueJourneyFromMainMenu() {
  runSceneTransition("กำลังเปิดเส้นทางการเรียนรู้...", startGameAfterLogin);
}

function openMainMenuLessonMap() {
  if (typeof openLessonSelectModal === "function") {
    openLessonSelectModal();
    return;
  }
  openGameModal({
    title: "แผนที่บทเรียน",
    body: "แผนที่บทเรียนจะเปิดใช้ใน Prototype ถัดไป",
    actions: [{ label: "ปิด", primary: true, onClick: closeGameModal }]
  });
}

function openMainMenuAssessmentResult() {
  const progress = loadProgress();
  if (progress?.finalBossDefeated || progress?.currentScreen === "victory" || progress?.currentScreen === "pastFragmentVictory") {
    runSceneTransition("กำลังเปิดผลการประเมิน...", completeActVictoryScene);
    return;
  }
  openGameModal({
    title: "ผลการประเมิน",
    body: "ผลการประเมินจะปรากฏหลังจากเอาชนะ The Memory Breaker",
    actions: [{ label: "รับทราบ", primary: true, onClick: closeGameModal }]
  });
}

function createAccountCharacterSection() {
  const currentCharacterId = ensurePlayerCharacterData();
  const currentCharacter = getPlayerCharacter(currentCharacterId);
  const section = document.createElement("section");
  section.className = "account-character-section";
  section.innerHTML = `
    <h3>ตัวละครของฉัน</h3>
    <div class="account-character-preview">
      <img class="main-character-gif account-character-image" src="${currentCharacter.asset}" alt="${currentCharacter.label}" draggable="false">
      <strong id="accountCharacterCurrentLabel">${currentCharacter.label}</strong>
    </div>
    <div class="account-character-options" role="radiogroup" aria-label="เลือกตัวละคร">
      ${Object.values(PLAYER_CHARACTERS).map(character => `
        <label class="account-character-option">
          <input type="radio" name="accountCharacterId" value="${character.id}" ${character.id === currentCharacterId ? "checked" : ""}>
          <span>${character.label}</span>
        </label>
      `).join("")}
    </div>
    <button id="saveAccountCharacterButton" class="primary-button" type="button">บันทึกตัวละคร</button>
    <p id="accountCharacterStatus" class="form-status">เลือกตัวละครที่ต้องการใช้ในเมนูและฉากต่อสู้</p>
  `;
  const preview = section.querySelector(".account-character-image");
  const currentLabel = section.querySelector("#accountCharacterCurrentLabel");
  const status = section.querySelector("#accountCharacterStatus");
  const saveButton = section.querySelector("#saveAccountCharacterButton");
  const updatePreview = characterId => {
    const character = getPlayerCharacter(characterId);
    applyPlayerCharacterImage(preview, character.id);
    currentLabel.textContent = character.label;
  };
  section.querySelectorAll("input[name=\"accountCharacterId\"]").forEach(input => {
    input.addEventListener("change", () => updatePreview(input.value));
  });
  saveButton.addEventListener("click", event => {
    event.preventDefault();
    if (!runButtonActionOnce(saveButton, async () => {
      const selected = section.querySelector("input[name=\"accountCharacterId\"]:checked");
      const characterId = normalizePlayerCharacterId(selected?.value);
      if (!playerData) {
        status.textContent = "ยังไม่พบข้อมูลผู้เล่น";
        setButtonEnabled(saveButton, true);
        delete saveButton.dataset.buttonLocked;
        return;
      }
      playerData.characterId = characterId;
      playerData.avatar = {
        ...(playerData.avatar || {}),
        characterId,
        gender: characterId === "female_wanderer" ? "female" : "male"
      };
      try {
        await savePlayerData();
        refreshPlayerCharacterSprites(characterId);
        renderMainMenu();
        updatePreview(characterId);
        status.textContent = "เปลี่ยนตัวละครสำเร็จ";
      } catch (error) {
        console.warn("[Character] Failed to save selected character", error);
        status.textContent = "บันทึกตัวละครไม่สำเร็จ กรุณาลองใหม่";
      }
      delete saveButton.dataset.buttonLocked;
      saveButton.classList.remove("is-locked");
      setButtonEnabled(saveButton, true);
    })) {
      return;
    }
  });
  return section;
}

function startLessonFromLessonMap(stage, stageIndex, { isReplay = false } = {}) {
  if (!stage || stageIndex < 0 || state.isTransitioning) {
    return;
  }

  closeGameModal();
  if (isReplay) {
    runSceneTransition("กำลังเปิดโหมดเรียนซ้ำ...", () => {
      showStageLesson(stageIndex, { lessonStepIndex: 0, dialogueIndex: 0, isReplay: true });
    });
    return;
  }

  saveProgress({
    currentLessonId: stage.id,
    currentStageId: stage.id,
    currentScreen: "lesson",
    lastSafeScreen: "lesson"
  });
  runSceneTransition("กำลังเปิดบทเรียน...", () => {
    showStageLesson(stageIndex, { lessonStepIndex: 0, dialogueIndex: 0 });
  });
}

function confirmReplayLesson(stage, stageIndex) {
  openGameModal({
    title: "เรียนซ้ำบทเรียน",
    body: "คุณต้องการเรียนซ้ำบทเรียนนี้หรือไม่? การเรียนซ้ำจะไม่ได้รับ Grammaria หรือรางวัลซ้ำ",
    actions: [
      { label: "ยกเลิก", onClick: closeGameModal },
      {
        label: "เรียนซ้ำ",
        primary: true,
        onClick: () => startLessonFromLessonMap(stage, stageIndex, { isReplay: true })
      }
    ]
  });
}

function openAccountSettingsModal() {
  const view = buildMainMenuViewModel();
  const panel = document.createElement("div");
  panel.className = "account-settings-panel";
  panel.innerHTML = `
    <div class="grammaria-breakdown-row"><span>Player Name / ชื่อผู้เล่น</span><strong>${view.playerName}</strong></div>
    <div class="grammaria-breakdown-row"><span>Account Type / ประเภทบัญชี</span><strong>${view.accountType}</strong></div>
    <div class="grammaria-breakdown-row"><span>Current Act / Act ปัจจุบัน</span><strong>${view.currentActLabel}</strong></div>
    <div class="grammaria-breakdown-row"><span>Current Lesson / บทเรียนปัจจุบัน</span><strong>${view.currentLessonLabel}</strong></div>
    <div class="grammaria-breakdown-row"><span>Save Status / สถานะการบันทึก</span><strong>${view.saveStatus}</strong></div>
  `;
  panel.appendChild(createAccountCharacterSection());
  openGameModal({
    title: "Account Settings / ตั้งค่าบัญชี",
    body: "ข้อมูลบัญชีและสถานะการบันทึก",
    content: panel,
    actions: [
      { label: "ปิด", onClick: closeGameModal },
      { label: "ออกจากระบบ", primary: true, onClick: logoutCurrentUser }
    ]
  });
}

function saveProgress(updateObject = {}, options = {}) {
  const progress = ensureActProgress();
  if (!progress) {
    return null;
  }

  mergeDeep(progress, updateObject);
  validateProgress(progress);
  const shouldCaptureCheckpoint = options.captureCheckpoint === true ||
    (options.captureCheckpoint !== false && isManualSaveScene());
  if (shouldCaptureCheckpoint) {
    const checkpoint = captureCurrentResumeCheckpoint({ source: options.source || "auto" });
    if (checkpoint) {
      progress.resumeCheckpoint = checkpoint;
    } else if (options.requireCheckpoint) {
      console.warn("[Progress] Unable to capture resume checkpoint", { source: options.source || "auto" });
      return null;
    }
  }
  progress.lastUpdatedAt = new Date().toISOString();
  playerData.progress.currentScene = progress.currentScreen;
  ensureGrammariaState();
  savePlayerData(options.source || "auto");
  console.log("[Progress] Saved:", progress);
  return progress;
}

async function manualSaveCurrentProgress(event = null) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  if (state.manualSaveInProgress || !playerData || !isManualSaveScene()) {
    return;
  }

  state.manualSaveInProgress = true;
  setManualSaveButtonState("saving");
  try {
    const progress = saveProgress({}, {
      source: "manual",
      captureCheckpoint: true,
      requireCheckpoint: true
    });
    if (!progress?.resumeCheckpoint) {
      throw new Error("No supported resume checkpoint for current scene");
    }
    const persisted = await flushPendingProgressSaves();
    if (persisted === false) {
      throw new Error("Persistence service returned false");
    }
    setManualSaveButtonState("success");
  } catch (error) {
    console.warn("[Progress] Manual save failed", error);
    setManualSaveButtonState("failure");
  } finally {
    state.manualSaveInProgress = false;
    updateManualSaveButtonVisibility();
  }
}

function unlockStage(stageId) {
  if (!stageId) {
    return;
  }
  const progress = ensureActProgress();
  if (progress && !progress.unlockedStages.includes(stageId)) {
    progress.unlockedStages.push(stageId);
  }
}

function markCompletedLesson(stageId) {
  if (!stageId) {
    return;
  }
  const progress = ensureActProgress();
  if (progress && !progress.completedLessons.includes(stageId)) {
    progress.completedLessons.push(stageId);
  }
}

function markBossDefeated(stage) {
  const bossId = getBossProgressId(stage);
  if (!bossId) {
    return;
  }
  const progress = ensureActProgress();
  if (progress && !progress.defeatedBosses.includes(bossId)) {
    progress.defeatedBosses.push(bossId);
  }
  if (playerData && playerData.progress && Array.isArray(playerData.progress.defeatedEnemies)) {
    addUniqueProgressItem("defeatedEnemies", bossId);
  }
  console.log("[BattleWin] Boss defeated:", bossId);
}

function renderActionCards(items, className = "lesson-card") {
  els.wordGrid.innerHTML = "";
  items.forEach(item => {
    const card = document.createElement("div");
    card.className = `${className} ${getSpeakerToneClass(item)} ${getLessonCardRole(item)}`;
    card.textContent = item;
    els.wordGrid.appendChild(card);
  });
}

function showLessonSummaryModal(stage) {
  if (!stage) {
    return;
  }

  state.isLessonSummaryOpen = true;
  els.nounActivityVisual.querySelector("h3").textContent = stage.thaiTitle || stage.title;
  els.activityFeedback.textContent = "สรุปแนวคิดสำคัญ";
  renderActionCards(buildLessonDisplayItems(stage), "lesson-card");
  els.nounActivityVisual.classList.remove("hidden");
}

function getLessonCardRole(text = "") {
  if (text.includes("->") || text.includes("→") || text.includes("=")) {
    return "lesson-example";
  }

  if (text.startsWith("คำถาม:") || text.startsWith("ตรวจความเข้าใจ")) {
    return "lesson-question";
  }

  if (text.startsWith("ตัวเลือก:")) {
    return "lesson-choice";
  }

  return "";
}

function buildLessonDisplayItems(stage) {
  const items = (stage.lesson || []).flatMap(splitLessonItem);
  const firstQuestion = stage.questions && stage.questions[0];

  if (firstQuestion) {
    items.push("ตรวจความเข้าใจ");
    items.push(`คำถาม: ${firstQuestion.prompt || firstQuestion.sentence}`);
    firstQuestion.options.forEach(option => {
      items.push(`ตัวเลือก: ${option}`);
    });
  }

  return items;
}

function splitLessonItem(item) {
  if (!item || item.length < 92) {
    return [item];
  }

  return item
    .split(/(?<=[.!?])\s+|(?<=ครับ)\s+|(?<=ค่ะ)\s+|(?<=ก่อน)\s+/)
    .map(part => part.trim())
    .filter(Boolean);
}

function getSpeakerToneClass(text = "") {
  if (text.includes("ผู้พเนจร")) {
    return "speaker-player";
  }

  if (text.includes("มาสเตอร์เวรีออน") || text.includes("เวรีออน")) {
    return "speaker-verion";
  }

  return "speaker-system";
}

function updateLessonChrome(stage = null, stageIndex = 0, mode = "lesson") {
  const playableStages = getPlayableStages();
  const total = Math.max(playableStages.length, 1);
  const current = Math.min(stageIndex + 1, total);
  const location = stage
    ? (stage.thaiTitle || stage.title || "หอคอยแห่ง Unity")
    : "หอคอยแห่ง Unity";

  els.lessonActLabel.textContent = PAST_FRAGMENT_ACT.title;
  els.lessonLocationLabel.textContent = mode === "story" ? "หอคอยแห่ง Unity" : location;
  els.lessonProgressText.textContent = `${current} / ${total}`;
  updateLessonGrammariaDisplay();
}

function closeExplanationPanel() {
  state.isLessonSummaryOpen = false;
  els.nounActivityVisual.classList.add("hidden");
}

function buildPastTeachingSteps() {
  return [
    {
      speaker: "มาสเตอร์เวรีออน",
      text: "ผู้พเนจรเอ๋ย ก่อนที่เราจะก้าวเข้าสู่ดินแดนแห่งอดีต เจ้าต้องเข้าใจก่อนว่า 'อดีต' คืออะไร"
    },
    {
      speaker: "มาสเตอร์เวรีออน",
      text: "หลายคนคิดว่าอดีตต้องเป็นเรื่องไกลตัว เช่น เมื่อวาน เดือนที่แล้ว หรือปีที่แล้ว แต่ความจริงแล้ว อดีตอาจอยู่ใกล้กว่านั้นมาก"
    },
    {
      speaker: "มาสเตอร์เวรีออน",
      text: "สิ่งใดก็ตามที่เกิดขึ้นแล้ว และจบลงแล้ว สิ่งนั้นคืออดีต"
    },
    {
      speaker: "มาสเตอร์เวรีออน",
      text: "หนึ่งวินาทีก่อนหน้านี้ ก็เป็นอดีต สิบนาทีก่อน ก็เป็นอดีต เมื่อเช้าที่ผ่านมา ก็เป็นอดีตเช่นกัน",
      visual: {
        title: "ตัวอย่างของอดีต",
        cards: ["1 วินาทีที่แล้ว", "10 นาทีที่แล้ว", "เมื่อเช้าที่ผ่านมา", "เมื่อวาน", "ปีที่แล้ว"]
      }
    },
    {
      speaker: "มาสเตอร์เวรีออน",
      text: "อดีตคือร่องรอยของสิ่งที่เคยเกิดขึ้น และภาษาคือเวทมนตร์ที่ช่วยให้เราบอกเล่าร่องรอยนั้นได้ถูกต้อง"
    },
    {
      speaker: "มาสเตอร์เวรีออน",
      text: "ถ้าอย่างนั้น เจ้าคิดว่าข้อใดเป็นอดีต?",
      lessonChoices: createLessonQuizChoiceOrder([
        {
          text: "สิ่งที่กำลังเกิดขึ้นตอนนี้",
          correct: false,
          response: "ยังไม่ใช่ ลองจำไว้ว่า อดีตต้องเป็นสิ่งที่เกิดขึ้นแล้ว และจบลงแล้ว"
        },
        {
          text: "สิ่งที่เกิดขึ้นแล้วและจบลงแล้ว",
          correct: true,
          response: "ถูกต้อง อดีตคือร่องรอยของสิ่งที่เกิดขึ้นแล้ว และจบลงแล้ว"
        },
        {
          text: "สิ่งที่ยังไม่เกิดขึ้น",
          correct: false,
          response: "ยังไม่ใช่ ลองจำไว้ว่า อดีตต้องเป็นสิ่งที่เกิดขึ้นแล้ว และจบลงแล้ว"
        }
      ])
    },
    {
      speaker: "มาสเตอร์เวรีออน",
      text: "คราวนี้ลองมองประโยคภาษาไทยสามประโยคนี้ เจ้าจะเห็นว่าเวลาในประโยคต่างกัน แม้คำกริยาจะยังดูคล้ายเดิม",
      visual: {
        title: "ตัวอย่างภาษาไทย",
        cards: ["ฉันกินข้าววันนี้", "ฉันกินข้าวเมื่อวาน", "ฉันจะกินข้าวพรุ่งนี้"]
      }
    },
    {
      speaker: "มาสเตอร์เวรีออน",
      text: "คำว่า วันนี้ บอกปัจจุบัน คำว่า เมื่อวาน บอกอดีต และคำว่า พรุ่งนี้ บอกอนาคต ภาษาไทยมักใช้คำบอกเวลาเหล่านี้ช่วยบอกว่าเหตุการณ์เกิดขึ้นตอนไหน",
      visual: {
        title: "คำบอกเวลา",
        cards: ["วันนี้ = ปัจจุบัน", "เมื่อวาน = อดีต", "พรุ่งนี้ = อนาคต"]
      }
    },
    {
      speaker: "มาสเตอร์เวรีออน",
      text: "แต่ภาษาอังกฤษต่างออกไปเล็กน้อย ภาษาอังกฤษไม่ได้ดูแค่คำบอกเวลาเท่านั้น แต่ยังดูรูปของคำกริยาด้วย",
      visual: {
        title: "English Tense",
        cards: [`I go. = ${TENSE_LABELS.present}`, `I went. = ${TENSE_LABELS.past}`, `I will go. = ${TENSE_LABELS.future}`],
        emphasize: true
      }
    },
    {
      speaker: "มาสเตอร์เวรีออน",
      text: "เมื่อเข้าใจอดีตแล้ว จงตอบคำถามเพื่อฟื้นคืน Time Spark แห่งดินแดนอดีต"
    }
  ];
}

function buildPostTimeDustRegularVerbDialogue() {
  return [
    {
      speaker: "มาสเตอร์เวรีออน",
      text: "ตอนนี้เจ้ารู้แล้วว่า อดีตคือสิ่งที่เกิดขึ้นและจบลงแล้ว"
    },
    {
      speaker: "มาสเตอร์เวรีออน",
      text: "แต่ในภาษาอังกฤษ การเล่าเรื่องในอดีตไม่ได้ใช้แค่คำบอกเวลาเท่านั้น"
    },
    {
      speaker: "มาสเตอร์เวรีออน",
      text: "เจ้าต้องเปลี่ยนคำกริยาให้กลายเป็นรูปอดีตด้วย"
    },
    {
      speaker: "มาสเตอร์เวรีออน",
      text: "สำหรับคำกริยาปกติ เรามักเติม -ed ต่อท้ายคำกริยา"
    },
    {
      speaker: "มาสเตอร์เวรีออน",
      text: "เช่น play กลายเป็น played"
    },
    {
      speaker: "มาสเตอร์เวรีออน",
      text: "walk กลายเป็น walked"
    },
    {
      speaker: "มาสเตอร์เวรีออน",
      text: "และ clean กลายเป็น cleaned"
    },
    {
      speaker: "มาสเตอร์เวรีออน",
      text: "จำไว้ให้ดี กริยาเหล่านี้เรียกว่า Regular Verbs"
    }
  ];
}

function createDialogueNode(speaker, text) {
  return {
    speaker: speaker || "มาสเตอร์เวรีออน",
    text: String(text || "").trim()
  };
}

function createSegmentNode(text, phase = "teacherExplanation", speaker = "มาสเตอร์เวรีออน", extra = {}) {
  return {
    ...createDialogueNode(speaker, text),
    phase,
    ...extra
  };
}

function createLessonQuizChoiceOrder(choices = []) {
  // Shuffle lesson quiz buttons once while building the step so rerenders and Previous keep the same order.
  return shuffleArray(choices).map(choice => (
    choice && typeof choice === "object" ? { ...choice } : choice
  ));
}

function guidedPracticeNode(prompt, choices, correctAnswer, feedback) {
  const shuffledChoices = createLessonQuizChoiceOrder(choices);
  return createSegmentNode(prompt, "guidedPractice", "มาสเตอร์เวรีออน", {
    lessonChoices: shuffledChoices.map(choice => ({
      text: choice,
      correct: choice === correctAnswer,
      response: choice === correctAnswer
        ? feedback.correct
        : `${feedback.wrong} คำตอบที่ถูกคือ ${correctAnswer}`
    }))
  });
}

const OPTIONAL_MASTER_QUESTIONS = {
  openingAct1: {
    continueText: "ข้าเข้าใจแล้ว เดินทางต่อ",
    questions: [
      {
        id: "past_fragment",
        question: "Past Fragment คืออะไร?",
        answer: [
          "Past Fragment คือเศษพลังของอดีตที่หลุดออกจากแกนภาษา",
          "มันเก็บเสียง ภาพ และความทรงจำของสิ่งที่เคยเกิดขึ้นไว้ภายใน",
          "เมื่อเศษพลังนี้แตกสลาย อดีตก็เริ่มพร่าเลือน",
          "สิ่งที่เคยเกิดขึ้น อาจถูกลืมราวกับไม่เคยมีอยู่"
        ]
      },
      {
        id: "language_repairs_past",
        question: "ทำไมภาษาเกี่ยวกับการซ่อมอดีต?",
        answer: [
          "ใน Lingua ภาษาไม่ใช่เพียงคำพูด",
          "ภาษาเป็นเวทมนตร์ที่จัดระเบียบความทรงจำ",
          "ถ้าใช้กฎภาษาให้ถูกต้อง ความทรงจำจะกลับเข้าที่",
          "แต่ถ้าใช้ผิด เงาแห่งอดีตจะบิดเบือนความจริง"
        ]
      }
    ]
  },
  whatIsPast: {
    continueText: "ข้าเข้าใจแล้ว เดินทางต่อ",
    questions: [
      {
        id: "this_morning_past",
        question: "เมื่อเช้านี้ถือว่าเป็นอดีตไหม?",
        answer: [
          "ถือว่าเป็นอดีตได้ ถ้าเหตุการณ์นั้นเกิดขึ้นแล้วก่อนตอนนี้",
          "แม้ดวงอาทิตย์ของวันนี้ยังไม่ลับฟ้า แต่เหตุการณ์ที่ผ่านไปแล้วก็คือเงาของอดีต",
          "เช่น I ate breakfast this morning.",
          "this morning จึงเป็นคำใบ้อดีตได้ หากเรื่องนั้นเกิดขึ้นไปแล้ว"
        ]
      },
      {
        id: "past_not_far",
        question: "อดีตต้องเป็นเรื่องเมื่อวานเท่านั้นหรือเปล่า?",
        answer: [
          "ไม่ใช่เลย ผู้พเนจร",
          "yesterday เป็นเพียงประตูบานหนึ่งของอดีตเท่านั้น",
          "อดีตอาจซ่อนอยู่ในคำว่า last week, five years ago, long ago หรือ once",
          "จงมองหาคำที่บอกว่าเหตุการณ์นั้นผ่านไปแล้ว"
        ]
      }
    ]
  },
  pastTimeWords: {
    continueText: "ข้าเข้าใจแล้ว เริ่มต่อสู้",
    questions: [
      {
        id: "last_ago",
        question: "last กับ ago ต่างกันยังไง?",
        answer: [
          "last ใช้ชี้ไปยังช่วงเวลาก่อนหน้านี้",
          "เช่น last night, last week และ last year",
          "แต่ ago ใช้นับย้อนกลับจากตอนนี้",
          "เช่น two days ago หรือ five years ago"
        ]
      },
      {
        id: "every_day",
        question: "every day เป็นคำบอกอดีตไหม?",
        answer: [
          "every day ไม่ใช่คำบอกอดีตเฉพาะครั้ง",
          "มันบอกกิจวัตร หรือสิ่งที่เกิดขึ้นเป็นประจำ",
          "ถ้าจะพูดถึงอดีต ต้องมีคำใบ้ที่ชัดกว่า เช่น yesterday หรือ last Monday",
          "อย่าให้คำที่ดูคุ้นตาหลอกเจ้าออกจากเส้นทางเวลา"
        ]
      }
    ]
  },
  wasWere: {
    continueText: "ข้าเข้าใจแล้ว เริ่มต่อสู้",
    questions: [
      {
        id: "verb_vs_to_be",
        question: "Verb ทั่วไปต่างจาก Verb to be ยังไง?",
        answer: [
          "Verb ทั่วไปคือกริยาที่บอกการกระทำ",
          "เช่น go, eat, play และ walk",
          "แต่ Verb to be บอกสถานะ ตัวตน ความรู้สึก หรือสถานที่",
          "มันเหมือนแสงที่บอกว่าใครเป็นอะไร หรืออยู่ที่ใดในความทรงจำ"
        ]
      },
      {
        id: "was_play_wrong",
        question: "ทำไม I was play ถึงผิด?",
        answer: [
          "I was play ผิด เพราะ play เป็นกริยาทั่วไป",
          "was ใช้กับ Verb to be ไม่ได้ใช้วางหน้ากริยาทั่วไปแบบนี้",
          "ถ้าจะเล่าอดีตของการเล่น ต้องเปลี่ยน play เป็น played",
          "จึงควรพูดว่า I played football yesterday."
        ]
      }
    ]
  },
  thereWasWere: {
    continueText: "ข้าเข้าใจแล้ว เริ่มต่อสู้",
    questions: [
      {
        id: "there_vs_was",
        question: "there was ต่างจาก was เฉย ๆ ยังไง?",
        answer: [
          "was และ were ธรรมดาใช้กับประธานโดยตรง",
          "เช่น He was tired หรือ They were happy",
          "แต่ there was และ there were ใช้บอกว่า เคยมีบางสิ่งอยู่",
          "มันคือเวทที่เปิดเผยสิ่งที่เคยอยู่ในฉากความทรงจำ"
        ]
      },
      {
        id: "there_count",
        question: "ดูตรงไหนว่าต้องใช้ there was หรือ there were?",
        answer: [
          "ให้ดูคำนามที่อยู่ข้างหลัง",
          "ถ้ามีสิ่งเดียว ใช้ there was",
          "ถ้ามีหลายสิ่ง ใช้ there were",
          "เช่น There was a book แต่ There were three books."
        ]
      }
    ]
  },
  hadPast: {
    continueText: "ข้าเข้าใจแล้ว เริ่มต่อสู้",
    questions: [
      {
        id: "he_she_had",
        question: "ทำไม he กับ she ก็ใช้ had?",
        answer: [
          "เพราะในอดีต have และ has จะรวมเป็นรูปเดียวกัน",
          "รูปนั้นคือ had",
          "ดังนั้น he, she และ it ก็ใช้ had ได้",
          "เช่น She had a key yesterday."
        ]
      },
      {
        id: "had_all_subjects",
        question: "had ใช้กับทุกประธานเลยไหม?",
        answer: [
          "ใช่แล้ว ในอดีต had ใช้ได้กับทุกประธาน",
          "I had, you had, we had, they had",
          "He had, she had, it had",
          "had คือร่องรอยของสิ่งที่เคยมีอยู่ในอดีต"
        ]
      }
    ]
  },
  phase1Ending: {
    continueText: "ข้าเข้าใจแล้ว เดินทางต่อ",
    questions: [
      {
        id: "next_lesson",
        question: "ต่อไปเราจะเรียนอะไร?",
        answer: [
          "ต่อไป เจ้าจะเรียนวิธีเปลี่ยนกริยาทั่วไปให้เป็นอดีต",
          "เจ้ารู้แล้วว่าอดีตคืออะไร",
          "บัดนี้ เจ้าต้องเรียนรู้วิธีเขียนการกระทำในอดีต",
          "เส้นทางนั้นจะพาเราไปยัง The Ed Forge"
        ]
      },
      {
        id: "regular_meaning",
        question: "Regular Verb คืออะไร?",
        answer: [
          "Regular Verb คือกริยาที่เปลี่ยนรูปตามกฎ",
          "มันไม่ดื้อรั้นเหมือนกริยาไร้กฎ",
          "ส่วนมาก เมื่อเข้าสู่อดีต มันจะรับตรา -ed",
          "แต่ตรานั้นมีหลายกฎ และเจ้าต้องหลอมมันให้ถูกต้อง"
        ]
      }
    ]
  },
  regularEd: {
    continueText: "ข้าเข้าใจแล้ว เริ่มต่อสู้",
    questions: [
      {
        id: "regular_meaning",
        question: "Regular Verb คืออะไร?",
        answer: [
          "Regular Verb คือกริยาที่ตามกฎ",
          "เมื่อเล่าอดีต มักเติม -ed",
          "เช่น walk กลายเป็น walked"
        ]
      },
      {
        id: "ed_mark",
        question: "-ed บอกอะไร?",
        answer: [
          "-ed เป็นตราแห่งอดีตของคำทั่วไป",
          "มันบอกว่าเหตุการณ์เกิดขึ้นแล้ว",
          "เช่น I watched the moon."
        ]
      }
    ]
  },
  endingEAddD: {
    continueText: "ข้าเข้าใจแล้ว เรียนต่อ",
    questions: [
      {
        id: "why_only_d",
        question: "ทำไม like ไม่เป็น likeed?",
        answer: [
          "เพราะ like มีตัว e อยู่ท้ายคำแล้ว",
          "ถ้าเติม -ed ทั้งหมด จะกลายเป็น likeed ซึ่งผิด",
          "คำนี้ต้องรับเพียงตัว d เพิ่มเข้าไป",
          "like จึงกลายเป็น liked"
        ]
      },
      {
        id: "spot_ending_e",
        question: "ถ้าคำลงท้ายด้วย e ต้องทำยังไง?",
        answer: [
          "ถ้ากริยาลงท้ายด้วย e ให้เติมเพียง -d",
          "อย่าให้เปลวไฟของโรงหลอมเติม e ซ้ำจนคำเสียรูป",
          "love จึงเป็น loved",
          "dance จึงเป็น danced"
        ]
      }
    ]
  },
  yRule: {
    continueText: "ข้าเข้าใจแล้ว เริ่มต่อสู้",
    questions: [
      {
        id: "y_always_change",
        question: "ทำไม study เป็น studied แต่ play เป็น played?",
        answer: [
          "study มีพยัญชนะอยู่หน้า y",
          "เมื่อเข้าสู่อดีต y จึงเปลี่ยนเป็น i แล้วเติม -ed",
          "study จึงกลายเป็น studied",
          "แต่ play มีสระอยู่หน้า y จึงเติม -ed ได้เลย เป็น played"
        ]
      },
      {
        id: "y_to_i",
        question: "ต้องเปลี่ยน y เป็น i ทุกครั้งไหม?",
        answer: [
          "ไม่ต้องเปลี่ยนทุกครั้ง",
          "กฎนี้ขึ้นอยู่กับตัวอักษรก่อน y",
          "ถ้าหน้า y เป็นพยัญชนะ ให้เปลี่ยน y เป็น i แล้วเติม -ed",
          "ถ้าหน้า y เป็นสระ ให้เติม -ed ได้เลย"
        ]
      }
    ]
  },
  doubleConsonant: {
    continueText: "ข้าเข้าใจแล้ว เริ่มต่อสู้",
    questions: [
      {
        id: "why_double",
        question: "ทำไม stop เป็น stopped?",
        answer: [
          "stop เป็นคำสั้นที่จบด้วยพยัญชนะเสียงหนัก",
          "ก่อนรับตรา -ed มันต้องเพิ่มพยัญชนะท้ายอีกหนึ่งตัว",
          "stop จึงกลายเป็น stopped",
          "เหมือนการตอกตราให้แน่นบนประตูแห่งอดีต"
        ]
      },
      {
        id: "not_every_word",
        question: "ทำไม open ไม่เป็น openned?",
        answer: [
          "open ไม่ใช้กฎเพิ่มพยัญชนะท้ายแบบนั้น",
          "มันจึงเติม -ed ได้ตามปกติ",
          "open กลายเป็น opened",
          "ไม่ใช่ openned อย่าให้คำหลอกให้เจ้าตอกตัวอักษรเกินจำเป็น"
        ]
      }
    ]
  },
  beforeEdForger: {
    continueText: "ข้าเข้าใจแล้ว เริ่มต่อสู้",
    questions: [
      {
        id: "forger_test",
        question: "บอสนี้จะทดสอบอะไร?",
        answer: [
          "The Ed Forger จะทดสอบกฎของ Regular Verb ทั้งหมด",
          "มันจะโยนคำที่ถูกหลอมผิดออกมาเพื่อทำให้เจ้าสับสน",
          "เจ้าต้องพิสูจน์ว่าเข้าใจกฎ ไม่ใช่แค่จำคำตอบ",
          "นี่คือประตูสุดท้ายของโรงหลอม -ed"
        ]
      },
      {
        id: "before_boss_tip",
        question: "ฉันควรดูอะไรก่อนตอบ?",
        answer: [
          "ก่อนตอบ ให้มองท้ายคำก่อนเสมอ",
          "ดูว่าคำลงท้ายด้วย e หรือไม่",
          "ดูว่าคำลงท้ายด้วย y หรือไม่ และหน้า y เป็นสระหรือพยัญชนะ",
          "จากนั้นค่อยดูว่าต้องเพิ่มพยัญชนะท้ายหรือไม่"
        ]
      }
    ]
  }
};

function isOptionalMasterQuestionMarker(entry) {
  return Boolean(entry && typeof entry === "object" && entry.optionalMasterQuestionId);
}

function createOptionalMasterQuestionNode(menuId, phase = "teacherExplanation") {
  return createSegmentNode("ถามมาสเตอร์เวรีออน", phase, "ผู้พเนจร", {
    optionalMasterQuestionId: menuId
  });
}

function appendLessonSegmentLines(steps, lines, phase, speaker = "มาสเตอร์เวรีออน") {
  (lines || []).forEach(entry => {
    if (isOptionalMasterQuestionMarker(entry)) {
      steps.push(createOptionalMasterQuestionNode(entry.optionalMasterQuestionId, phase));
      return;
    }
    steps.push(createSegmentNode(entry, phase, speaker));
  });
}

const LESSON_SEGMENTS = {
  "what-is-past": {
    ruleId: "past_concept",
    teacherExplanation: [
      "ก่อนจะเข้าสู่ The Past Fragment เจ้าต้องเข้าใจก่อนว่า อดีต คือสิ่งที่เกิดขึ้นแล้วและจบลงแล้ว",
      "อดีตไม่จำเป็นต้องเป็นเรื่องไกลตัวเสมอไป หนึ่งวินาทีก่อนหน้านี้ก็ถือเป็นอดีตแล้ว",
      "เมื่อเช้าที่ผ่านมา เมื่อวาน สัปดาห์ที่แล้ว และปีที่แล้ว ล้วนเป็นอดีต เพราะเหตุการณ์เหล่านั้นจบลงแล้ว",
      "ภาษาไทยมักใช้คำบอกเวลา เช่น เมื่อวาน เมื่อเช้า เมื่อกี้ หรือปีที่แล้ว เพื่อบอกว่าเรื่องนั้นอยู่ในอดีต",
      "แต่ภาษาอังกฤษมีเวทมนตร์อีกชั้นหนึ่ง มันเปลี่ยนรูปคำกริยาเพื่อบอกเวลา",
      "ดังนั้นการเข้าใจอดีตจึงเป็นประตูแรก ก่อนที่เจ้าจะเรียน Past Simple",
      "หากเจ้ารู้ว่าเหตุการณ์ใดจบลงแล้ว เจ้าจะเริ่มเลือกคำกริยารูปอดีตได้ถูกต้อง",
      "จงจำไว้ อดีตคือร่องรอยของสิ่งที่เกิดขึ้นแล้ว ไม่ใช่สิ่งที่กำลังเกิดหรือยังไม่เกิด"
    ],
    teacherExamples: [
      "เมื่อวานฉันอ่านหนังสือ เหตุการณ์นี้จบลงแล้ว จึงเป็นอดีต",
      "เมื่อเช้าฉันกินข้าว เหตุการณ์นี้จบลงแล้ว จึงเป็นอดีต",
      "พรุ่งนี้ฉันจะไปโรงเรียน ยังไม่เกิดขึ้น จึงไม่ใช่อดีต",
      "ตอนนี้ฉันกำลังเรียน เหตุการณ์กำลังเกิดขึ้น จึงไม่ใช่อดีต"
    ],
    guidedPractice: [
      {
        prompt: "ลองตอบข้า ข้อใดเป็นอดีต?",
        choices: ["ฉันกำลังเดิน", "ฉันเดินเมื่อวาน", "ฉันจะเดินพรุ่งนี้"],
        answer: "ฉันเดินเมื่อวาน",
        feedback: {
          correct: "ถูกต้อง เมื่อวานบอกว่าเหตุการณ์เกิดขึ้นและจบไปแล้ว นั่นคืออดีต",
          wrong: "ยังไม่ใช่ ให้มองหาคำที่บอกว่าเหตุการณ์จบไปแล้ว"
        }
      },
      {
        prompt: "ถ้าเหตุการณ์เกิดขึ้นเมื่อ 10 นาทีที่แล้ว เราเรียกว่าอะไร?",
        choices: ["อดีต", "ปัจจุบัน", "อนาคต"],
        answer: "อดีต",
        feedback: {
          correct: "ถูกต้อง แม้จะเพิ่งเกิดเมื่อไม่นาน แต่ถ้าจบลงแล้วก็เป็นอดีต",
          wrong: "ยังไม่ถูก เหตุการณ์ที่จบลงแล้วคืออดีต"
        }
      }
    ],
    preBossDialogue: [
      "ดีมาก เจ้าพร้อมให้ Time Dust ทดสอบแล้ว",
      "บอสจะไม่ได้สอนเจ้า มันจะทดสอบว่าเจ้ารู้จักอดีตจริงหรือไม่"
    ],
    postBossDialogue: [
      "Time Dust สลายไปแล้ว เศษเวลาที่แตกกระจายเริ่มกลับมาเป็นระเบียบ",
      "ต่อไปเจ้าจะเรียนว่า ภาษาอังกฤษเปลี่ยนคำกริยาอย่างไรเมื่อต้องเล่าอดีต"
    ]
  },
  "what-is-tense": {
    ruleId: "tense_concept",
    teacherExplanation: [
      "ต่อไปคือคำว่า tense ในภาษาอังกฤษ",
      "Tense คือระบบที่ช่วยบอกว่าเหตุการณ์เกิดขึ้นเมื่อใด",
      "ถ้าเกิดตอนนี้ เราเรียกว่า present",
      "ถ้าเกิดขึ้นแล้วและจบลงแล้ว เราเรียกว่า past",
      "ถ้ายังไม่เกิดขึ้น เราเรียกว่า future",
      "ภาษาไทยมักใช้คำบอกเวลา แต่ภาษาอังกฤษมักเปลี่ยนรูปคำกริยาด้วย",
      "ตัวอย่างเช่น go คือไปในปัจจุบัน went คือไปในอดีต และ will go คือจะไปในอนาคต",
      "เมื่อเห็นคำบอกเวลาและรูปกริยา เจ้าจะอ่านเวลาในประโยคได้แม่นขึ้น"
    ],
    teacherExamples: [
      "I go to school. เป็น present เพราะใช้ go",
      "I went to school. เป็น past เพราะใช้ went",
      "I will go to school. เป็น future เพราะใช้ will go",
      "Yesterday, I went to school. คำว่า yesterday ช่วยย้ำว่าเป็นอดีต"
    ],
    guidedPractice: [
      {
        prompt: "ประโยค I went home. อยู่ในเวลาใด?",
        choices: [TENSE_LABELS.present, TENSE_LABELS.past, TENSE_LABELS.future],
        answer: TENSE_LABELS.past,
        feedback: {
          correct: "ถูกต้อง went เป็นรูปอดีตของ go",
          wrong: "ยังไม่ถูก ให้ดูรูปกริยา went ซึ่งเป็นอดีต"
        }
      },
      {
        prompt: "ถ้าจะเล่าเรื่องเมื่อวาน ภาษาอังกฤษมักใช้กริยารูปใด?",
        choices: ["V1", "V2", "will + V1"],
        answer: "V2",
        feedback: {
          correct: "ถูกต้อง เหตุการณ์ในอดีตมักใช้ V2",
          wrong: "ยังไม่ใช่ เมื่อเล่าอดีตให้มองหา V2"
        }
      }
    ],
    preBossDialogue: [
      "Echo Tick จะทดสอบว่าเจ้ารู้จัก present, past และ future หรือไม่",
      "จำไว้ บอสคือการประเมิน ไม่ใช่บทเรียนใหม่"
    ],
    postBossDialogue: [
      "เจ้าควบคุมเสียงสะท้อนของ tense ได้แล้ว",
      "ถึงเวลาเรียนกฎแรกของ Regular Verbs"
    ]
  },
  "regular-rule-1": {
    ruleId: "regular_ed",
    teacherExampleVerbs: ["walk", "jump", "clean", "watch"],
    guidedPracticeVerbs: ["help", "open"],
    teacherExplanation: [
      "กฎแรกของโรงหลอมง่ายที่สุด",
      "กริยาทั่วไปที่ไม่มีตัวลงท้ายพิเศษ ให้เติม -ed",
      "Regular Verb คือกริยาที่เปลี่ยนเป็นอดีตตามกฎ",
      "walk จึงกลายเป็น walked",
      "help จึงกลายเป็น helped",
      "ตรา -ed บอกว่าเหตุการณ์นั้นเกิดขึ้นแล้ว",
      "ถ้าคำไม่ได้ลงท้ายแบบพิเศษ ให้เริ่มจากกฎเติม -ed",
      "ในการต่อสู้นี้ เจ้าต้องหลอมคำกริยาให้เป็นรูปอดีต"
    ],
    teacherExamples: [
      "walk → walked แปลว่า เดิน → เดินไปแล้ว",
      "jump → jumped แปลว่า กระโดด → กระโดดไปแล้ว",
      "clean → cleaned แปลว่า ทำความสะอาด → ทำความสะอาดไปแล้ว",
      "watch → watched แปลว่า ดู → ดูไปแล้ว"
    ],
    guidedPractice: [
      {
        prompt: "เวร์ออนยื่นเศษคำว่า help ให้เจ้า ถ้าจะเปลี่ยนเป็นอดีต ควรเป็นข้อใด?",
        choices: ["helped", "helpd", "helpped"],
        answer: "helped",
        feedback: {
          correct: "ถูกต้อง help เป็น Regular Verb ทั่วไป จึงประทับ -ed กลายเป็น helped",
          wrong: "ยังไม่ใช่ help ไม่ต้องเพิ่มตัวอักษรอื่น ใช้คาถาพื้นฐาน: help + -ed = helped"
        }
      },
      {
        prompt: "ต่อไปคือคำว่า open ถ้าเหตุการณ์เกิดขึ้นแล้วและจบลงแล้ว ต้องเลือกข้อใด?",
        choices: ["opened", "openned", "opend"],
        answer: "opened",
        feedback: {
          correct: "ดีมาก open เป็นคำกริยาทั่วไป จึงเติม -ed เป็น opened",
          wrong: "ยังไม่ถูก open ไม่ต้องเพิ่ม n และไม่ใช่ opend ให้เติม -ed เป็น opened"
        }
      }
    ],
    preBossDialogue: [
      "ดีมาก ตรา -ed เริ่มส่องแสงในมือของเจ้าแล้ว",
      "Echo Tick จะทดสอบว่าคำทั่วไปควรหลอมอย่างไร",
      "ติ๊ก... ถ้าเจ้าเติมผิด เวลาในคำกริยาจะย้อนกลับ"
    ],
    postBossDialogue: [
      "เสียงสะท้อนของ Echo Tick เริ่มเงียบลง กฎ -ed ของเจ้ามั่นคงขึ้นแล้ว",
      "แต่เส้นทางของอดีตยังมีกฎย่อยซ่อนอยู่",
      "ต่อไป เจ้าจะพบคำกริยาที่มี e เฝ้าอยู่ปลายคำ"
    ]
  },
  "regular-rule-2": {
    ruleId: "ending_e_add_d",
    teacherExampleVerbs: ["like", "love", "dance", "close"],
    guidedPracticeVerbs: ["live", "move"],
    teacherExplanation: [
      "กฎที่สอง ต้องระวังตัว e ท้ายคำ",
      "ถ้าคำกริยามี e อยู่แล้ว",
      "อย่าเติม e ซ้ำ",
      "ให้เติมแค่ -d",
      "like จึงเป็น liked",
      "love จึงเป็น loved",
      "คำผิดที่ต้องระวังคือ likeed และ loveed",
      "ก่อนตอบ ให้มองท้ายคำก่อนเสมอ"
    ],
    teacherExamples: [
      "like → liked แปลว่า ชอบ → ชอบแล้ว",
      "love → loved แปลว่า รัก → รักแล้ว",
      "dance → danced แปลว่า เต้น → เต้นแล้ว",
      "close → closed แปลว่า ปิด → ปิดแล้ว"
    ],
    guidedPractice: [
      {
        prompt: "เวร์ออนชี้ไปที่คำว่า live คำนี้มี e อยู่ท้าย ถ้าจะทำให้เป็นอดีตควรเลือกข้อใด?",
        choices: ["lived", "liveed", "livied"],
        answer: "lived",
        feedback: {
          correct: "ถูกต้อง live มี e อยู่ท้ายคำแล้ว จึงเติมแค่ -d เป็น lived",
          wrong: "ยังไม่ถูก live มี e อยู่ท้ายอยู่แล้ว ห้ามเติม e ซ้ำ คำที่ถูกคือ lived"
        }
      },
      {
        prompt: "แล้วคำว่า move ล่ะ ถ้าจะเล่าว่าเคลื่อนที่ไปแล้ว ควรเลือกข้อใด?",
        choices: ["moved", "moveed", "movied"],
        answer: "moved",
        feedback: {
          correct: "ดีมาก move ลงท้ายด้วย e จึงเติมเพียง -d เป็น moved",
          wrong: "ยังไม่ใช่ move มี e อยู่ท้ายคำแล้ว ให้เติมแค่ -d เป็น moved"
        }
      }
    ],
    preBossDialogue: [
      "เจ้ามองเห็น e ที่ปลายคำได้แล้ว",
      "Echo Tick จะหลอกให้เจ้าเติม e ซ้ำ",
      { optionalMasterQuestionId: "endingEAddD" },
      "จงดูท้ายคำก่อน แล้วเติมเพียง -d ให้ถูกต้อง"
    ],
    postBossDialogue: [
      "คำลงท้ายด้วย e ไม่สามารถหลอกเจ้าได้อีกแล้ว",
      "เจ้าไม่เติม e ซ้ำ และเลือกใช้ -d ได้ถูกต้อง",
      "ต่อไป เราจะเข้าสู่ประตูของตัวอักษร y ซึ่งมีกฎสองเส้นทาง"
    ]
  },
  "regular-rule-3": {
    ruleId: "y_rule",
    teacherExampleVerbs: ["play", "enjoy", "stay", "obey"],
    guidedPracticeVerbs: ["study", "cry"],
    teacherExplanation: [
      "กฎที่สามคือประตูตัว y",
      "คำที่ลงท้ายด้วย y ต้องดูตัวอักษรก่อน y",
      "ถ้าหน้า y เป็นสระ ให้เติม -ed ได้เลย",
      "play จึงเป็น played",
      "แต่ถ้าหน้า y เป็นพยัญชนะ",
      "ให้เปลี่ยน y เป็น i แล้วเติม -ed",
      "study จึงเป็น studied",
      "อย่าจำแค่ว่า y ต้องเปลี่ยนเสมอ",
      "เจ้าต้องดูตัวหน้า y ก่อน"
    ],
    teacherExamples: [
      "play กลายเป็น played เพราะหน้า y เป็นสระ",
      "enjoy กลายเป็น enjoyed เพราะหน้า y เป็นสระ",
      "stay กลายเป็น stayed เพราะหน้า y เป็นสระ",
      "obey กลายเป็น obeyed เพราะหน้า y เป็นสระ"
    ],
    guidedPractice: [
      {
        prompt: "study เมื่อเป็นอดีตควรเป็นข้อใด?",
        choices: ["studied", "studyed", "studyied"],
        answer: "studied",
        feedback: {
          correct: "ถูกต้อง d เป็นพยัญชนะก่อน y จึงเปลี่ยน y เป็น i แล้วเติม -ed",
          wrong: "ยังไม่ถูก study ต้องเปลี่ยน y เป็น i ก่อนเติม -ed"
        }
      },
      {
        prompt: "cry เมื่อเป็นอดีตควรเป็นข้อใด?",
        choices: ["cried", "cryed", "cryied"],
        answer: "cried",
        feedback: {
          correct: "ดีมาก r เป็นพยัญชนะก่อน y จึงเป็น cried",
          wrong: "ยังไม่ถูก cry ใช้กฎพยัญชนะ + y"
        }
      }
    ],
    preBossDialogue: [
      "ตอนนี้เจ้ารู้ทั้งสองทางของตัว y แล้ว",
      "Yesterday Sprite จะสลับ play กับ study ให้เจ้าสับสน",
      { optionalMasterQuestionId: "yRule" },
      "อย่าเดา ให้มองตัวก่อน y เสมอ"
    ],
    postBossDialogue: [
      "ประตูของ y เปิดออกแล้ว",
      "ยังเหลือกฎคำสั้นที่ต้องเพิ่มพยัญชนะท้าย"
    ]
  },
  "regular-rule-4": {
    ruleId: "cvc_double",
    teacherExampleVerbs: ["stop", "plan", "drop", "clap"],
    guidedPracticeVerbs: ["grab", "hug"],
    teacherExplanation: [
      "กฎที่สี่ต้องใช้ความระมัดระวังมากที่สุด",
      "คำสั้นบางคำต้องเพิ่มพยัญชนะท้ายก่อนเติม -ed",
      "stop จึงเป็น stopped",
      "plan จึงเป็น planned",
      "แต่ไม่ใช่ทุกคำที่ต้องเพิ่มพยัญชนะ",
      "open เป็น opened",
      "ไม่ใช่ openned",
      "กฎนี้ไม่ได้ใช้กับทุกคำ",
      "จงดูคำให้ดี อย่าเพิ่มตัวสะกดโดยไม่จำเป็น"
    ],
    teacherExamples: [
      "stop กลายเป็น stopped",
      "plan กลายเป็น planned",
      "drop กลายเป็น dropped",
      "clap กลายเป็น clapped"
    ],
    guidedPractice: [
      {
        prompt: "grab เมื่อเป็นอดีตควรเป็นข้อใด?",
        choices: ["grabbed", "grabed", "grabied"],
        answer: "grabbed",
        feedback: {
          correct: "ถูกต้อง grab เป็นคำสั้น จึงเพิ่ม b แล้วเติม -ed",
          wrong: "ยังไม่ถูก grab ต้องย้ำ b ก่อนเติม -ed"
        }
      },
      {
        prompt: "hug เมื่อเป็นอดีตควรเป็นข้อใด?",
        choices: ["hugged", "huged", "hugd"],
        answer: "hugged",
        feedback: {
          correct: "ดีมาก hug เพิ่ม g แล้วเติม -ed เป็น hugged",
          wrong: "ยังไม่ถูก hug ต้องเพิ่ม g ก่อนเติม -ed"
        }
      }
    ],
    preBossDialogue: [
      "เจ้าฝึกคำสั้นเพิ่มพยัญชนะท้ายแล้ว",
      "Rewind Slime จะย้อนคำให้ผิด ถ้าเจ้าสะกดไม่แม่น",
      { optionalMasterQuestionId: "doubleConsonant" },
      "ดูคำให้ดี แล้วค่อยหลอมรูปอดีต"
    ],
    postBossDialogue: [
      "กฎ Regular Verbs ทั้งสี่เริ่มรวมเป็นพลังเดียว",
      "ต่อไปคือบอสหลอม -ed ที่จะทดสอบกฎ Regular ทั้งหมด"
    ]
  },
  "ed-mini-boss": {
    ruleId: "regular_review",
    blockedBossVerbs: ["walk", "jump", "clean", "watch", "help", "open", "like", "love", "dance", "close", "live", "move", "play", "enjoy", "stay", "obey", "study", "cry", "stop", "plan", "drop", "clap", "grab", "hug", "remember", "receive", "reply", "occur", "collect", "save"],
    teacherExplanation: [
      "ไฟในโรงหลอมสว่างขึ้นจนเห็นเงาช่างหลอมขนาดใหญ่",
      "เศษคำผิดลอยอยู่รอบตัวเขา",
      "studyed, stoped, loveed, playied, danceed, droped",
      "ระวังให้ดี ผู้พเนจร",
      "นี่คือ The -ed Forger",
      "เขาหลอมคำกริยาอดีตผิดรูปซ้ำแล้วซ้ำเล่า",
      "การต่อสู้นี้ไม่ใช่การจำกฎข้อเดียว",
      "แต่คือการเลือกกฎให้ตรงกับคำ",
      "ถ้าคำทั่วไป ให้เติม -ed",
      "ถ้าลงท้ายด้วย e ให้เติมแค่ -d",
      "ถ้าลงท้ายด้วย y ให้ดูตัวก่อน y",
      "ถ้าเป็นคำสั้นบางคำ ให้เพิ่มพยัญชนะท้ายก่อนเติม -ed",
      "ใช้ทุกกฎที่เจ้าเรียนมา",
      "แล้วทำลายการหลอมผิดรูปของเขา"
    ],
    teacherExamples: [
      "remember กลายเป็น remembered ตามกฎเติม -ed",
      "receive กลายเป็น received เพราะลงท้ายด้วย e",
      "reply กลายเป็น replied เพราะพยัญชนะ + y",
      "occur กลายเป็น occurred เพราะต้องเพิ่ม r"
    ],
    guidedPractice: [
      {
        prompt: "ข้อใดเป็นอดีตของ collect?",
        choices: ["collected", "collectd", "collectied"],
        answer: "collected",
        feedback: {
          correct: "ถูกต้อง collect ใช้กฎเติม -ed",
          wrong: "ยังไม่ถูก collect เป็นคำทั่วไป เติม -ed"
        }
      },
      {
        prompt: "ข้อใดเป็นอดีตของ save?",
        choices: ["saved", "saveed", "savied"],
        answer: "saved",
        feedback: {
          correct: "ถูกต้อง save ลงท้ายด้วย e เติมแค่ -d",
          wrong: "ยังไม่ถูก save มี e ท้ายคำแล้ว"
        }
      }
    ],
    preBossDialogue: [
      "The -ed Forger จะใช้คำใหม่จากกฎเดิมทั้งหมด",
      "ถ้าเจ้ารู้กฎจริง จงพิสูจน์ให้เขาเห็น",
      { optionalMasterQuestionId: "beforeEdForger" },
      "จงเลือกกฎให้ตรงกับคำ แล้วหลอมอดีตให้ถูกต้อง"
    ],
    postBossDialogue: [
      "เปลวไฟแห่งกฎยอมรับเจ้าแล้ว",
      "เจ้าไม่ได้แค่เติม -ed",
      "แต่เจ้าเข้าใจว่ากฎใดควรใช้กับคำใด",
      "Regular Verbs ได้รับการหลอมคืนสู่รูปอดีตที่ถูกต้องแล้ว",
      "Phase 2 Completed: Forging Regular Verbs",
      "พื้นที่ถัดไปถูกปลดล็อก: Irregular Cave",
      "ยังมีกริยาบางคำที่ไม่ยอมเดินตามกฎ",
      "เส้นทางต่อไปคือถ้ำของ Irregular Verbs",
      "ที่นั่น เจ้าจะต้องใช้ความจำ ไม่ใช่แค่กฎ"
    ]
  },
  "irregular-lesson": {
    ruleId: "irregular_v2",
    teacherExampleVerbs: ["go", "eat", "see", "come"],
    guidedPracticeVerbs: ["buy", "take"],
    teacherExplanation: [
      "ตอนนี้เจ้ารู้ Regular Verbs แล้ว แต่ไม่ใช่คำกริยาทุกคำจะเติม -ed",
      "คำกริยาบางคำเปลี่ยนรูปเองเมื่อเป็นอดีต",
      "เราเรียกคำเหล่านี้ว่า Irregular Verbs",
      "คำกลุ่มนี้ต้องจำรูป V2 ของแต่ละคำ",
      "go ไม่ใช่ goed แต่เป็น went",
      "eat ไม่ใช่ eated แต่เป็น ate",
      "เมื่อเจอ Irregular Verb ให้ใช้ความจำและบริบทเวลา",
      "ใน Past Simple คำเหล่านี้ใช้รูป V2 เช่นเดียวกัน เพียงแต่รูป V2 ไม่ได้เติม -ed"
    ],
    teacherExamples: [
      "go กลายเป็น went",
      "eat กลายเป็น ate",
      "see กลายเป็น saw",
      "come กลายเป็น came"
    ],
    guidedPractice: [
      {
        prompt: "buy เมื่อเป็นอดีตควรเป็นข้อใด?",
        choices: ["bought", "buyed", "buyt"],
        answer: "bought",
        feedback: {
          correct: "ถูกต้อง buy เป็น Irregular Verb รูป V2 คือ bought",
          wrong: "ยังไม่ถูก buy ไม่เติม -ed แต่เปลี่ยนเป็น bought"
        }
      },
      {
        prompt: "take เมื่อเป็นอดีตควรเป็นข้อใด?",
        choices: ["took", "taked", "taken"],
        answer: "took",
        feedback: {
          correct: "ดีมาก take รูป V2 คือ took",
          wrong: "ยังไม่ถูก take ในอดีตใช้ took"
        }
      }
    ],
    preBossDialogue: [
      "เจ้าฝึก Irregular Verbs กับข้าแล้ว",
      "Memory Bat จะใช้คำใหม่เพื่อทดสอบความจำของเจ้า"
    ],
    postBossDialogue: [
      "เจ้าเริ่มจำกริยาไร้กฎได้แล้ว",
      "แต่ The Irregular Wraith ยังรออยู่ลึกกว่านั้น"
    ]
  },
  "irregular-mini-boss": {
    ruleId: "irregular_v2",
    teacherExplanation: [
      "ก่อนเจอ The Irregular Wraith เราจะทบทวน Irregular Verbs อีกครั้ง",
      "Irregular Verbs ไม่ใช้รูปเติม -ed ตามปกติ",
      "คำตอบต้องเป็น V2 ของคำนั้น",
      "บางคำเปลี่ยนเสียงไปมาก เช่น write เป็น wrote",
      "บางคำเปลี่ยนสั้นลง เช่น meet เป็น met",
      "บางคำต้องจำเป็นคู่ เช่น bring เป็น brought",
      "หากเห็นคำบอกเวลาในอดีต ให้มองหา V2",
      "บอสตัวนี้จะทดสอบความจำ ไม่ได้สอนคำใหม่ระหว่างต่อสู้"
    ],
    teacherExamples: [
      "write กลายเป็น wrote",
      "meet กลายเป็น met",
      "bring กลายเป็น brought",
      "teach กลายเป็น taught"
    ],
    guidedPractice: [
      {
        prompt: "break เมื่อเป็นอดีตควรเป็นข้อใด?",
        choices: ["broke", "breaked", "broken"],
        answer: "broke",
        feedback: {
          correct: "ถูกต้อง break รูป V2 คือ broke",
          wrong: "ยังไม่ถูก break ใน Past Simple ใช้ broke"
        }
      },
      {
        prompt: "choose เมื่อเป็นอดีตควรเป็นข้อใด?",
        choices: ["chose", "choosed", "chosen"],
        answer: "chose",
        feedback: {
          correct: "ดีมาก choose รูป V2 คือ chose",
          wrong: "ยังไม่ถูก choose ในอดีตใช้ chose"
        }
      }
    ],
    preBossDialogue: [
      "เจ้าพร้อมทดสอบ Irregular Verbs แล้ว",
      "The Irregular Wraith จะใช้คำใหม่เพื่อวัดความเข้าใจของเจ้า"
    ],
    postBossDialogue: [
      "วิญญาณกริยาไร้กฎอ่อนแรงลงแล้ว",
      "แต่เศษพลัง Regular และ Irregular กำลังรวมกันเป็นภัยใหญ่กว่าเดิม"
    ]
  },
  "final-boss": {
    ruleId: "final_review",
    blockedBossVerbs: ["open", "carry", "go", "make"],
    teacherExplanation: [
      "นี่คือการทบทวนใหญ่ก่อน The Memory Breaker",
      "เจ้าจะต้องใช้ทั้ง Regular และ Irregular Verbs",
      "ถ้าเป็นคำทั่วไป อาจเติม -ed",
      "ถ้าลงท้ายด้วย e ให้เติมแค่ -d",
      "ถ้าลงท้าย y ให้ดูตัวก่อน y",
      "ถ้าเป็นคำสั้นบางคำ อาจต้องเพิ่มพยัญชนะท้าย",
      "ถ้าเป็น Irregular Verb ต้องจำรูป V2",
      "และถ้าประโยคใช้ did หรือ did not กริยาหลัง did ต้องกลับเป็น V1"
    ],
    teacherExamples: [
      "Yesterday, I opened the gate.",
      "She carried the crystal.",
      "They went to the tower.",
      "Did he make a shield?"
    ],
    guidedPractice: [
      {
        prompt: "หลัง did ควรใช้กริยารูปใด?",
        choices: ["V1", "V2", "V3"],
        answer: "V1",
        feedback: {
          correct: "ถูกต้อง did รับหน้าที่บอกอดีตแล้ว กริยาหลัง did ใช้ V1",
          wrong: "ยังไม่ถูก หลัง did ให้กลับไปใช้ V1"
        }
      },
      {
        prompt: "ถ้าเห็น yesterday และไม่มี did ควรมองหากริยารูปใด?",
        choices: ["V1", "V2", "will + V1"],
        answer: "V2",
        feedback: {
          correct: "ถูกต้อง yesterday บอกอดีต จึงมักใช้ V2",
          wrong: "ยังไม่ถูก เหตุการณ์อดีตมักใช้ V2"
        }
      }
    ],
    preBossDialogue: [
      "ทุกกฎที่เจ้าเรียนมาจะรวมกันในการต่อสู้นี้",
      "The Memory Breaker คือการประเมินสุดท้ายของ Past Fragment"
    ],
    postBossDialogue: [
      "The Memory Breaker สลายแล้ว",
      "Past Fragment กลับคืนสู่ Lingua เพราะเจ้ารู้วิธีเล่าอดีตอย่างถูกต้อง"
    ]
  }
};

Object.assign(LESSON_SEGMENTS, {
  "what-is-past": {
    ruleId: "pastMeaning",
    teacherExplanation: [
      "แสงสีม่วงค่อย ๆ เปิดออกตรงหน้าเจ้า",
      "เศษนาฬิกาเก่าลอยอยู่ทั่วท้องฟ้า",
      "เศษกระดาษจากความทรงจำหมุนวนอยู่รอบตัว",
      "สถานที่แห่งนี้ไม่ใช่โลกปัจจุบัน",
      "มันคือดินแดนแห่งความทรงจำที่แตกสลาย",
      "ยินดีต้อนรับ ผู้พเนจรแห่งภาษา",
      "ข้าคือ มาสเตอร์เวรีออน",
      "ผู้เฝ้ามองแกนภาษาแห่ง Lingua",
      "เจ้าถูกเรียกมาที่นี่ เพราะ Past Fragment กำลังแตกสลาย",
      "เมื่ออดีตแตกสลาย ความทรงจำก็เริ่มผิดเพี้ยน",
      { optionalMasterQuestionId: "openingAct1" },
      "ภารกิจของเจ้าคือฟื้นคืนอดีต",
      "ใน Lingua อดีตถูกซ่อมด้วยความเข้าใจเรื่องภาษา",
      "ทุกคำตอบที่ถูกต้อง จะทำให้ความทรงจำกลับเข้าที่",
      "ก่อนต่อสู้กับเงาแห่งอดีต เจ้าต้องเข้าใจก่อน",
      "อดีตคือสิ่งที่เกิดขึ้นแล้ว",
      "ถ้าเหตุการณ์จบแล้ว เราเรียกว่า past",
      "ตอนนี้คือ present",
      "สิ่งที่ยังไม่เกิดคือ future",
      "แต่สิ่งที่เกิดไปแล้วคือ past",
      "หลายคนจำได้แค่คำว่า yesterday",
      "แต่ภาษาอังกฤษมีคำใบ้อดีตอีกมาก",
      "คำเหล่านี้เป็นเหมือนร่องรอยของอดีต",
      "last night หมายถึง เมื่อคืน",
      "last week หมายถึง สัปดาห์ที่แล้ว",
      "two days ago หมายถึง สองวันที่แล้ว",
      "in 2020 หมายถึง ในปี 2020",
      "บางครั้ง เหตุการณ์ที่เกิดวันนี้ก็เป็นอดีตได้",
      "เช่น this morning หรือ earlier today",
      "ถ้ามันเกิดขึ้นแล้วก่อนตอนนี้ มันคืออดีต",
      { optionalMasterQuestionId: "whatIsPast" },
      "ในเรื่องเล่า เราอาจเจอ long ago",
      "หรือคำว่า once ที่แปลว่า ครั้งหนึ่ง",
      "คำเหล่านี้จะพาเราเข้าไปในความทรงจำเก่า",
      "จงมองหาคำใบ้ของอดีตให้ดี"
    ],
    teacherExamples: [
      "yesterday = เมื่อวาน",
      "last night = เมื่อคืน",
      "two days ago = สองวันที่แล้ว",
      "in 2020 = ในปี 2020",
      "this morning = เมื่อเช้านี้",
      "earlier today = ก่อนหน้านี้วันนี้",
      "long ago = เมื่อนานมาแล้ว",
      "once = ครั้งหนึ่ง"
    ],
    guidedPractice: [
      {
        prompt: "ข้อใดเป็นคำใบ้อดีต?",
        choices: ["earlier today", "tomorrow", "right now"],
        answer: "earlier today",
        feedback: {
          correct: "ถูกต้อง earlier today บอกว่าเกิดก่อนตอนนี้แล้ว",
          wrong: "ยังไม่ใช่ ให้มองหาคำที่บอกว่าเกิดขึ้นแล้ว"
        }
      },
      {
        prompt: "long ago ใช้พูดถึงเวลาใด?",
        choices: ["อดีต", "อนาคต", "ตอนนี้"],
        answer: "อดีต",
        feedback: {
          correct: "ดีมาก long ago ใช้เล่าเรื่องในอดีต",
          wrong: "ยังไม่ถูก long ago หมายถึง เมื่อนานมาแล้ว"
        }
      }
    ],
    preBossDialogue: [
      "ฝุ่นเวลาบนพื้นเริ่มรวมตัวกัน",
      "Time Dust Sprite เกิดจากความทรงจำที่จำเวลาไม่ได้",
      "มันจะทดสอบว่าเจ้ารู้จักอดีตหรือยัง"
    ],
    postBossDialogue: [
      "Time Dust Sprite สลายไปแล้ว",
      "เศษเวลาแรกกลับมาเป็นระเบียบ",
      "เจ้ารู้แล้วว่า past คือสิ่งที่เกิดขึ้นแล้ว",
      "ต่อไปเราจะตามหาคำบอกเวลาอดีตให้ชัดขึ้น"
    ]
  },
  "what-is-tense": {
    ruleId: "pastTimeWords",
    teacherExplanation: [
      "เส้นทางข้างหน้าเต็มไปด้วยป้ายเวลา",
      "บางป้ายบอกปัจจุบัน",
      "บางป้ายบอกอนาคต",
      "แต่ป้ายที่แตกร้าวคือป้ายของอดีต",
      "คำบอกเวลาช่วยให้เรารู้ว่าเรื่องเกิดเมื่อไร",
      "ตอนนี้เจ้ารู้แล้วว่าอดีตคือสิ่งที่เกิดขึ้นแล้ว",
      "ต่อไป เจ้าต้องจำแนกคำบอกเวลาให้แม่นยำขึ้น",
      "คำว่า last มักพาเราไปสู่อดีต",
      "เช่น last month, last year และ last weekend",
      "คำว่า ago ก็เป็นสัญญาณสำคัญของอดีต",
      "เช่น five years ago หรือ a few hours ago",
      "บางคำบอกปีหรือวันที่ผ่านมาแล้ว",
      "เช่น in 2019 หรือ on May 5th, 2022",
      "บางคำขึ้นต้นด้วย before",
      "เช่น before class หรือ before lunch",
      "ในเรื่องเล่า คำว่า once และ long ago ก็เปิดประตูสู่อดีต",
      "when I was a child ก็เล่าช่วงวัยเด็กในอดีต",
      "ถ้าแยกคำเหล่านี้ได้ เจ้าจะรู้ว่าเมื่อใดต้องใช้ Past Simple",
      "คำบอกเวลาไม่ได้เปลี่ยนกริยาเอง",
      "แต่มันเตือนเราว่า ประโยคนี้เล่าเรื่องที่จบแล้ว"
    ],
    teacherExamples: [
      "last month = เดือนที่แล้ว",
      "last year = ปีที่แล้ว",
      "last weekend = สุดสัปดาห์ที่แล้ว",
      "five years ago = ห้าปีที่แล้ว",
      "a few hours ago = ไม่กี่ชั่วโมงก่อน",
      "in 2019 = ในปี 2019",
      "on May 5th, 2022 = วันที่ 5 พฤษภาคม 2022",
      "when I was a child = ตอนที่ฉันเป็นเด็ก"
    ],
    guidedPractice: [
      {
        prompt: "ข้อใดเป็นคำบอกเวลาอดีต?",
        choices: ["last weekend", "next week", "now"],
        answer: "last weekend",
        feedback: {
          correct: "ถูกต้อง last weekend เป็นเวลาที่ผ่านมาแล้ว",
          wrong: "ยังไม่ถูก ลองหาคำที่บอกว่าเหตุการณ์เกิดขึ้นไปแล้ว"
        }
      },
      {
        prompt: "ข้อใดไม่ใช่อดีต?",
        choices: ["soon", "before lunch", "many years ago"],
        answer: "soon",
        feedback: {
          correct: "ดีมาก soon บอกว่ายังไม่เกิด",
          wrong: "ระวังนะ before และ ago มักชี้ไปยังอดีต"
        }
      }
    ],
    preBossDialogue: [
      "Yesterday Mite กำลังกัดกินคำบอกเวลา",
      "ถ้าคำบอกเวลาหายไป ความทรงจำจะลำดับผิด",
      { optionalMasterQuestionId: "pastTimeWords" },
      "เลือกคำอดีตให้ถูก แล้วเส้นทางจะเปิด"
    ],
    postBossDialogue: [
      "Yesterday Mite ถอยกลับไปแล้ว",
      "คำบอกเวลาอดีตเริ่มส่องแสง",
      "ตอนนี้เจ้ารู้สัญญาณของอดีตมากขึ้น",
      "ต่อไปเราจะเรียน Verb to be ในอดีต",
      "นั่นคือ was และ were"
    ]
  },
  "act1_phase1_unit3_was_were": {
    ruleId: "wasWere",
    teacherExplanation: [
      "ก่อนเรียน was และ were เราต้องรู้จักคำว่า Verb",
      "Verb แปลว่า คำกริยา",
      "คำกริยาคือคำที่บอกการกระทำ",
      "เช่น go แปลว่า ไป",
      "eat แปลว่า กิน",
      "play แปลว่า เล่น",
      "walk แปลว่า เดิน",
      "แต่มีคำกริยากลุ่มหนึ่งพิเศษมาก",
      "กลุ่มนี้ชื่อว่า Verb to be",
      "Verb to be ไม่ได้บอกการกระทำเสมอไป",
      "มันใช้บอกว่าใครเป็นอะไร",
      "มันใช้บอกว่าใครอยู่ที่ไหน",
      "มันใช้บอกว่าสิ่งนั้นมีสภาพอย่างไร",
      "ในปัจจุบัน Verb to be คือ is, am, are",
      "I ใช้ am",
      "he, she, it ใช้ is",
      "you, we, they ใช้ are",
      "แต่เมื่อเรื่องเกิดในอดีต รูปของมันจะเปลี่ยน",
      "am ในอดีตเปลี่ยนเป็น was",
      "is ในอดีตเปลี่ยนเป็น was",
      "are ในอดีตเปลี่ยนเป็น were",
      "ดังนั้น I am ready กลายเป็น I was ready",
      "She is here กลายเป็น She was here",
      "They are tired กลายเป็น They were tired",
      "จำง่าย ๆ คือ I, he, she, it ใช้ was",
      "you, we, they ใช้ were",
      "อย่าสับสนกับกริยาการกระทำ",
      "ถ้าพูดว่า play ในอดีต เราจะเรียนกฎอื่นภายหลัง",
      "แต่ถ้าพูดว่า เป็น อยู่ คือ หรือรู้สึกในอดีต",
      "ให้คิดถึง was และ were ก่อน"
    ],
    teacherExamples: [
      "I am ready. -> I was ready.",
      "She is here. -> She was here.",
      "They are tired. -> They were tired.",
      "We are in the room. -> We were in the room."
    ],
    guidedPractice: [
      {
        prompt: "I ____ happy yesterday.",
        choices: ["was", "were", "am"],
        answer: "was",
        feedback: {
          correct: "ถูกต้อง I ใช้ was ในอดีต",
          wrong: "ยังไม่ถูก I ต้องใช้ was"
        }
      },
      {
        prompt: "They ____ tired last night.",
        choices: ["were", "was", "is"],
        answer: "were",
        feedback: {
          correct: "ดีมาก They ใช้ were",
          wrong: "ยังไม่ถูก They ต้องใช้ were"
        }
      }
    ],
    preBossDialogue: [
      "Was-Were Wisp ลอยออกมาจากหมอกเวลา",
      "มันสลับ was กับ were เพื่อทำให้ประโยคเพี้ยน",
      { optionalMasterQuestionId: "wasWere" },
      "จำคู่ประธานกับ was/were ให้ดี"
    ],
    postBossDialogue: [
      "Was-Were Wisp สงบลงแล้ว",
      "เจ้ารู้แล้วว่า Verb to be มีรูปอดีต",
      "was และ were ช่วยเล่าอดีตของสภาพและสถานที่",
      "ต่อไปเราจะใช้ was และ were กับคำว่า there"
    ]
  },
  "act1_phase1_unit4_there_was_were": {
    ruleId: "thereWasWere",
    teacherExplanation: [
      "บางครั้งเราไม่ได้บอกว่าใครทำอะไร",
      "เราแค่อยากบอกว่า ในอดีตมีบางสิ่งอยู่",
      "ภาษาอังกฤษใช้ there was และ there were",
      "There was แปลว่า มีอยู่ในอดีต",
      "ใช้ There was กับสิ่งเดียว",
      "เช่น มีโคมไฟหนึ่งดวง",
      "There were ก็แปลว่า มีอยู่ในอดีต",
      "แต่ใช้กับหลายสิ่ง",
      "เช่น มีประตูหลายบาน",
      "จุดสำคัญคือดูจำนวนของสิ่งนั้น",
      "สิ่งเดียวใช้ There was",
      "หลายสิ่งใช้ There were",
      "ถ้าเห็น a, an หรือ one มักเป็นสิ่งเดียว",
      "ถ้าเห็น two, three, many มักเป็นหลายสิ่ง",
      "อย่าดูแค่คำว่า there",
      "ให้ดูสิ่งที่อยู่หลัง there was หรือ there were"
    ],
    teacherExamples: [
      "There was a lantern.",
      "There was one bridge.",
      "There were two doors.",
      "There were many clocks."
    ],
    guidedPractice: [
      {
        prompt: "____ a book on the table.",
        choices: ["There was", "There were", "There are"],
        answer: "There was",
        feedback: {
          correct: "ถูกต้อง a book มีหนึ่งเล่ม ใช้ There was",
          wrong: "ยังไม่ถูก a book เป็นสิ่งเดียว"
        }
      },
      {
        prompt: "____ two cats in the room.",
        choices: ["There were", "There was", "There is"],
        answer: "There were",
        feedback: {
          correct: "ดีมาก two cats มีหลายตัว ใช้ There were",
          wrong: "ยังไม่ถูก two cats เป็นหลายสิ่ง"
        }
      }
    ],
    preBossDialogue: [
      "Memory Lantern จุดไฟขึ้นกลางทาง",
      "แสงของมันแยกสิ่งเดียวกับหลายสิ่งออกจากกัน",
      { optionalMasterQuestionId: "thereWasWere" },
      "มันจะถามว่าในอดีตมีสิ่งเดียวหรือหลายสิ่ง"
    ],
    postBossDialogue: [
      "Memory Lantern Flame กลับมาอยู่ในมือเจ้า",
      "เจ้ามองเห็นจำนวนในประโยคได้ดีขึ้น",
      "there was และ there were จะช่วยเล่าฉากในอดีต",
      "ต่อไปคือคำว่า had"
    ]
  },
  "act1_phase1_unit5_had": {
    ruleId: "hadPast",
    teacherExplanation: [
      "ตอนนี้เรามาถึง Relic ชิ้นสุดท้ายของ Phase 1",
      "คำนี้คือ had",
      "had คือรูปอดีตของ have",
      "had คือรูปอดีตของ has ด้วย",
      "have แปลว่า มี",
      "has ก็แปลว่า มี",
      "แต่ในอดีต ทั้ง have และ has เปลี่ยนเป็น had",
      "ข้อดีคือ had ใช้กับทุกประธาน",
      "I ใช้ had",
      "you ใช้ had",
      "he ใช้ had",
      "she ใช้ had",
      "we ใช้ had",
      "they ใช้ had",
      "had แปลว่า มีแล้วในอดีต",
      "ถ้าเรื่องเกิดเมื่อวาน ใช้ had",
      "ถ้าเรื่องเกิดสัปดาห์ที่แล้ว ใช้ had",
      "ถ้าเรื่องเกิดไปแล้วและพูดถึงการมี ใช้ had",
      "ไม่ต้องเติม s",
      "ไม่ต้องเปลี่ยนตามประธาน",
      "จำไว้ว่า อดีตของ have และ has คือ had"
    ],
    teacherExamples: [
      "I had a map yesterday.",
      "She had a key last night.",
      "They had a mission last week.",
      "We had little time."
    ],
    guidedPractice: [
      {
        prompt: "I ____ a map yesterday.",
        choices: ["had", "have", "has"],
        answer: "had",
        feedback: {
          correct: "ถูกต้อง อดีตใช้ had",
          wrong: "ยังไม่ถูก have ในอดีตคือ had"
        }
      },
      {
        prompt: "She ____ a blue crystal.",
        choices: ["had", "has", "have"],
        answer: "had",
        feedback: {
          correct: "ดีมาก she ในอดีตใช้ had",
          wrong: "ยังไม่ถูก ในอดีตใช้ had กับทุกประธาน"
        }
      }
    ],
    preBossDialogue: [
      "Lost Pouch Imp ขโมย Had Relic ไป",
      "มันทำให้ have และ has หลงทางในอดีต",
      { optionalMasterQuestionId: "hadPast" },
      "ใช้ had ให้ถูก แล้วเอาของคืนมา"
    ],
    postBossDialogue: [
      "Had Relic กลับคืนมาแล้ว",
      "ของในถุงเริ่มกลับไปหาเจ้าของแล้ว",
      "ดีมาก ผู้พเนจร",
      "ตอนนี้เจ้าผ่านพื้นฐานของอดีตแล้ว",
      "เจ้ารู้จักคำบอกเวลาในอดีต",
      "เจ้ารู้จัก was และ were",
      "เจ้ารู้จัก there was และ there were",
      "และเจ้ารู้ว่า have กับ has ในอดีตคือ had",
      "Phase 1: Entering the Past เสร็จสมบูรณ์",
      { optionalMasterQuestionId: "phase1Ending" },
      "เจ้าพร้อมจะเปลี่ยนกริยาทั่วไปให้เป็นอดีตแล้ว",
      "เส้นทางต่อไปไม่ใช่ทุ่งฝุ่นเวลาอีกแล้ว",
      "เจ้าต้องเดินทางไปยังโรงหลอมแห่ง -ed",
      "ที่นั่น Regular Verbs จะถูกหลอมให้กลายเป็นอดีต",
      "จงเตรียมตัวให้พร้อม"
    ]
  }
});

function getLessonSegmentDefinition(stageId) {
  return LESSON_SEGMENTS[stageId] || null;
}

function getReservedTeachingVerbsForStage(stage) {
  const segment = getLessonSegmentDefinition(stage?.id);
  if (!segment) {
    return new Set();
  }
  return new Set([
    ...(segment.teacherExampleVerbs || []),
    ...(segment.guidedPracticeVerbs || []),
    ...(segment.blockedBossVerbs || [])
  ]);
}

function getQuestionBaseWord(question) {
  return question?.baseVerb || question?.baseWord || "";
}

function buildLessonSegmentDialogue(stage) {
  const segment = getLessonSegmentDefinition(stage.id);
  if (!segment) {
    return null;
  }

  const steps = [];
  appendLessonSegmentLines(steps, segment.teacherExplanation, "teacherExplanation");
  (segment.teacherExamples || []).forEach((text, index) => {
    steps.push(createSegmentNode(`ตัวอย่างที่ ${index + 1}: ${text}`, "teacherExamples"));
  });
  (segment.guidedPractice || []).forEach(practice => {
    steps.push(guidedPracticeNode(practice.prompt, practice.choices, practice.answer, practice.feedback));
  });
  appendLessonSegmentLines(steps, segment.preBossDialogue, "preBossDialogue");
  if (stage.questions && stage.questions.length) {
    steps.push(createBattleIntroStep(stage));
  }
  return steps;
}

function buildPostBossDialogue(stage) {
  const segment = getLessonSegmentDefinition(stage?.id);
  const lines = segment?.postBossDialogue?.length
    ? segment.postBossDialogue
    : [`${stage?.thaiEnemy || stage?.enemy || "บอส"} พ่ายแพ้แล้ว`, "บทเรียนส่วนนี้เสร็จสมบูรณ์แล้ว เราจะเดินหน้าต่อ"];
  const steps = [];
  appendLessonSegmentLines(steps, lines, "postBossDialogue");
  return steps;
}

function validateLessonSegments() {
  Object.entries(LESSON_SEGMENTS).forEach(([segmentId, segment]) => {
    const stage = getStageById(segmentId);
    const warnings = [];
    if ((segment.teacherExplanation || []).length < 8) {
      warnings.push("teacherExplanation should have at least 8 nodes");
    }
    if ((segment.teacherExamples || []).length < 3) {
      warnings.push("teacherExamples should have at least 3 examples");
    }
    if (stage?.questions?.length && (segment.guidedPractice || []).length < 2) {
      warnings.push("guidedPractice should have at least 2 questions");
    }
    if (stage?.questions?.length && (segment.preBossDialogue || []).length < 2) {
      warnings.push("preBossDialogue should have at least 2 nodes");
    }
    const reservedWords = new Set([
      ...(segment.teacherExampleVerbs || []),
      ...(segment.guidedPracticeVerbs || []),
      ...(segment.blockedBossVerbs || [])
    ]);
    const validBossQuestions = filterQuestionsForStage(stage?.questions || [], stage || { id: segmentId });
    if (stage?.questions?.length && validBossQuestions.length < 8) {
      warnings.push(`Not enough boss questions after filtering: ${validBossQuestions.length}`);
    }
    const invalidBossQuestions = validBossQuestions
      .filter(question => reservedWords.has(getQuestionBaseWord(question)));
    if (invalidBossQuestions.length) {
      warnings.push(`Vocabulary overlap detected: ${invalidBossQuestions.map(getQuestionBaseWord).join(", ")}`);
    }
    if (warnings.length) {
      console.warn("[Lesson Segment Validation]", segmentId, warnings);
    }
  });
}

validateLessonSegments();

function parseLessonLineToDialogueNodes(line) {
  const text = String(line || "").trim();
  if (!text) {
    return [];
  }

  const speakerMatch = text.match(/^([^:：]{2,40})[:：]\s*(.+)$/);
  const speaker = speakerMatch ? speakerMatch[1].trim() : "มาสเตอร์เวรีออน";
  const body = speakerMatch ? speakerMatch[2].trim() : text;
  const exampleMatch = body.match(/^Examples?:\s*(.+)$/i);

  if (exampleMatch) {
    return exampleMatch[1]
      .split(/\s*,\s*/)
      .map(example => example.trim())
      .filter(Boolean)
      .map(example => createDialogueNode(speaker, example));
  }

  return body
    .split(/\s+\/\s+/)
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => createDialogueNode(speaker, part));
}

function buildStageDialogueSequence(stage) {
  const segmentDialogue = buildLessonSegmentDialogue(stage);
  if (segmentDialogue) {
    return segmentDialogue;
  }

  const lessonLines = (stage.lesson || []).flatMap(parseLessonLineToDialogueNodes);
  if (lessonLines.length) {
    return lessonLines;
  }

  return [
    createDialogueNode("มาสเตอร์เวรีออน", `${stage.thaiTitle || stage.title} กำลังเริ่มขึ้น`),
    createDialogueNode("มาสเตอร์เวรีออน", stage.questions && stage.questions.length
      ? "เมื่อพร้อมแล้ว จงเข้าสู่บทฝึกเพื่อทดสอบพลังแกรมมาเรียของเจ้า"
      : "บทเรียนช่วงนี้เสร็จสิ้นแล้ว เราจะเดินหน้าต่อไป")
  ];
}

function startPastDialogueLesson(stage, resumeDialogueIndex = 0) {
  startLessonDialogueSequence(stage, buildStageDialogueSequence(stage), resumeDialogueIndex);
}

function startPostTimeDustRegularVerbDialogue(stage, resumeDialogueIndex = 0) {
  startLessonDialogueSequence(stage, buildStageDialogueSequence(stage), resumeDialogueIndex);
}

function startStageDialogueLesson(stage, resumeDialogueIndex = 0) {
  startLessonDialogueSequence(stage, buildStageDialogueSequence(stage), resumeDialogueIndex);
}

function startLessonDialogueSequence(stage, steps, resumeDialogueIndex = 0) {
  state.lessonStoryMode = true;
  state.lessonStorySteps = steps;
  state.lessonStoryStepIndex = clamp(resumeDialogueIndex, 0, Math.max(state.lessonStorySteps.length - 1, 0));
  state.lessonSteps = [];
  state.lessonStepIndex = 0;
  state.activeDialogue = [];
  state.dialogueIndex = 0;
  state.awaitingDialogueChoice = false;
  updateLessonChrome(stage, state.actStageIndex, "lesson");
  els.nounActivityVisual.classList.add("hidden");
  els.nounActivity.classList.add("hidden");
  els.dialoguePanel.classList.remove("hidden");
  els.dialogueActions.classList.remove("hidden");
  els.nextDialogueButton.classList.remove("hidden");
  els.storyNameForm.classList.add("hidden");
  els.nextDialogueButton.textContent = "ถัดไป";
  showScene("story");
  saveProgress({
    currentStageId: stage.id,
    currentLessonId: stage.id,
    currentScreen: "lesson",
    lastSafeScreen: "lesson",
    lessonPhase: steps[state.lessonStoryStepIndex]?.phase || (stage.isPostBossDialogue ? "postBossDialogue" : "teacherExplanation"),
    currentDialogueIndex: state.lessonStoryStepIndex,
    currentLessonStepIndex: 0
  });
  renderLessonStoryStep();
}

function renderLessonStoryStep(options = {}) {
  const step = state.lessonStorySteps[state.lessonStoryStepIndex];
  if (!step) {
    finishPastDialogueLesson();
    return;
  }

  if (step.optionalMasterReturn) {
    const menuIndex = clamp(step.optionalMasterMenuIndex, 0, Math.max(state.lessonStorySteps.length - 1, 0));
    removeOptionalMasterTempSteps(menuIndex);
    state.lessonStoryStepIndex = menuIndex;
    renderLessonStoryStep({ suppressProgressSave: true });
    return;
  }

  if (state.currentLessonStage && !options.suppressProgressSave && !step.optionalMasterTemp) {
    saveProgress({
      currentStageId: state.currentLessonStage.id,
      currentLessonId: state.currentLessonStage.id,
      currentScreen: "lesson",
      lastSafeScreen: "lesson",
      lessonPhase: step.phase || (state.currentLessonStage.isPostBossDialogue ? "postBossDialogue" : "teacherExplanation"),
      currentDialogueIndex: state.lessonStoryStepIndex,
      currentLessonStepIndex: 0
    });
  }
  renderLessonStoryVisual(step.visual);
  hideDialogueChoices();
  state.activeDialogue = [step];
  state.dialogueIndex = 0;
  els.speakerName.textContent = step.speaker;
  updateSpeakingCharacter(step.speaker);
  updateDialogueSpeakerTone(step.speaker);
  updateDialogueSpeakerPortrait(step.speaker);
  const finalButtonText = state.currentLessonStage?.questions?.length
    ? (state.currentLessonStage.type && state.currentLessonStage.type.includes("boss") ? "เริ่มต่อสู้" : "เริ่มฝึก")
    : "ไปต่อ";
  els.nextDialogueButton.textContent = state.lessonStoryStepIndex >= state.lessonStorySteps.length - 1 ? finalButtonText : "ถัดไป";
  updatePreviousDialogueButton();
  startTypewriter(resolveDialogueText(step));
}

function renderLessonStoryVisual(visual) {
  if (!visual) {
    els.lessonStoryVisual.classList.add("hidden");
    els.lessonStoryVisual.innerHTML = "";
    return;
  }

  const cards = visual.cards
    .map(card => `<div class="lesson-visual-card ${visual.emphasize ? "is-emphasis" : ""}">${card}</div>`)
    .join("");
  els.lessonStoryVisual.innerHTML = `<h3>${visual.title}</h3><div class="lesson-visual-grid">${cards}</div>`;
  els.lessonStoryVisual.classList.remove("hidden");
}

function showLessonStoryChoices(choices) {
  state.awaitingDialogueChoice = true;
  els.dialogueChoices.innerHTML = "";
  choices.forEach(choice => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = choice.optionalMasterContinue || choice.optionalMasterQuestionId
      ? "dialogue-choice-btn optional-master-choice"
      : "dialogue-choice-btn";
    button.textContent = choice.text;
    button.addEventListener("click", () => {
      if (button.disabled) {
        return;
      }
      els.dialogueChoices.querySelectorAll("button").forEach(choiceButton => setButtonEnabled(choiceButton, false));
      chooseLessonStoryChoice(choice);
    });
    els.dialogueChoices.appendChild(button);
  });
  els.dialogueChoices.classList.remove("hidden");
}

function showOptionalMasterQuestionChoices(menuId) {
  const menu = OPTIONAL_MASTER_QUESTIONS[menuId];
  if (!menu || !Array.isArray(menu.questions) || menu.questions.length < 2) {
    setDialogueButtonReady(true);
    updatePreviousDialogueButton();
    return;
  }

  const choices = menu.questions.map(question => ({
    text: question.question,
    optionalMasterQuestionId: menuId,
    optionalMasterQuestionItemId: question.id
  }));
  choices.push({
    text: menu.continueText || "ข้าเข้าใจแล้ว ไปต่อ",
    optionalMasterContinue: true,
    optionalMasterQuestionId: menuId
  });
  showLessonStoryChoices(choices);
}

function removeOptionalMasterTempSteps(menuIndex) {
  while (state.lessonStorySteps[menuIndex + 1]?.optionalMasterTemp) {
    state.lessonStorySteps.splice(menuIndex + 1, 1);
  }
}

function createOptionalMasterAnswerStep(text, menuIndex) {
  return createSegmentNode(text, "optionalMasterAnswer", "มาสเตอร์เวรีออน", {
    optionalMasterTemp: true,
    optionalMasterMenuIndex: menuIndex
  });
}

function handleOptionalMasterQuestionChoice(choice) {
  const menuIndex = state.lessonStoryStepIndex;
  removeOptionalMasterTempSteps(menuIndex);
  state.awaitingDialogueChoice = false;

  if (choice.optionalMasterContinue) {
    advanceLessonStoryStep();
    return;
  }

  const menu = OPTIONAL_MASTER_QUESTIONS[choice.optionalMasterQuestionId];
  const question = menu?.questions?.find(item => item.id === choice.optionalMasterQuestionItemId);
  const answerLines = Array.isArray(question?.answer) ? question.answer : [];
  if (!answerLines.length) {
    renderLessonStoryStep({ suppressProgressSave: true });
    return;
  }

  const answerSteps = answerLines.map(line => createOptionalMasterAnswerStep(line, menuIndex));
  answerSteps.push(createSegmentNode("", "optionalMasterReturn", "มาสเตอร์เวรีออน", {
    optionalMasterTemp: true,
    optionalMasterReturn: true,
    optionalMasterMenuIndex: menuIndex
  }));
  state.lessonStorySteps.splice(menuIndex + 1, 0, ...answerSteps);
  state.lessonStoryStepIndex = menuIndex + 1;
  renderLessonStoryStep({ suppressProgressSave: true });
}

function chooseLessonStoryChoice(choice) {
  if (choice.optionalMasterContinue || choice.optionalMasterQuestionId) {
    hideDialogueChoices();
    handleOptionalMasterQuestionChoice(choice);
    return;
  }

  hideDialogueChoices();
  state.lessonStorySteps.splice(state.lessonStoryStepIndex + 1, 0, {
    speaker: "มาสเตอร์เวรีออน",
    text: choice.response
  });
  state.lessonStoryStepIndex += 1;
  saveProgress({
    currentDialogueIndex: state.lessonStoryStepIndex,
    currentScreen: "lesson",
    lastSafeScreen: "lesson"
  });
  renderLessonStoryStep();
}

function advanceLessonStoryStep() {
  state.lessonStoryStepIndex += 1;
  if (!state.lessonStorySteps[state.lessonStoryStepIndex]?.optionalMasterTemp) {
    saveProgress({
      currentDialogueIndex: state.lessonStoryStepIndex,
      currentScreen: "lesson",
      lastSafeScreen: "lesson"
    });
  }
  if (state.lessonStoryStepIndex >= state.lessonStorySteps.length) {
    finishPastDialogueLesson();
    return;
  }
  renderLessonStoryStep();
}

function finishPastDialogueLesson() {
  const stage = state.currentLessonStage;
  state.lessonStoryMode = false;
  state.lessonStorySteps = [];
  state.lessonStoryStepIndex = 0;
  updatePreviousDialogueButton();
  els.lessonStoryVisual.classList.add("hidden");
  els.lessonStoryVisual.innerHTML = "";
  clearSpeakingCharacters();
  els.dialoguePanel.classList.add("hidden");
  els.dialogueActions.classList.add("hidden");
  console.log("[Lesson Complete]", stage?.id, "Unlocked:", getAllowedRuleIdsForStage(stage));
  if (stage?.isPostBossDialogue) {
    const completedStage = state.postBossDialogueStage || stage;
    state.postBossDialogueStage = null;
    console.log("[PostBossDialogue] finished", {
      stageId: completedStage.id,
      type: completedStage.type,
      enemy: completedStage.enemy,
      isFinalBoss: isFinalBossStage(completedStage)
    });
    if (isFinalBossStage(completedStage)) {
      console.log("[FinalBoss] showActEnding");
      showActEnding();
      return;
    }
    showStageReward(completedStage);
    return;
  }
  if (stage && stage.questions && stage.questions.length) {
    startBattleFromActivity();
    return;
  }
  if (stage) {
    completeNonBattleStage(stage);
  }
}

function startPostBossDialogue(stage, dialogueIndex = 0) {
  const postBossStage = {
    ...stage,
    questions: [],
    isPostBossDialogue: true
  };
  setActBackground(getAct1BackgroundKeyForStage(stage), { warnMissing: true });
  state.postBossDialogueStage = stage;
  state.currentLessonStage = postBossStage;
  const stageIndex = getStageIndexById(stage.id);
  state.actStageIndex = stageIndex >= 0 ? stageIndex : state.actStageIndex;
  if (!isReplayingStage(stage)) {
    saveProgress({
      currentStageId: stage.id,
      currentLessonId: stage.id,
      currentScreen: "lesson",
      lastSafeScreen: isFinalBossStage(stage) ? "victory" : "lesson",
      lessonPhase: "postBossDialogue",
      currentDialogueIndex: dialogueIndex,
      currentLessonStepIndex: 0
    });
  }
  console.log("[Lesson Start]", `${stage.id}:postBoss`, ["postBossDialogue"]);
  startLessonDialogueSequence(postBossStage, buildPostBossDialogue(stage), dialogueIndex);
}

function buildRegularEdLessonSteps(stage) {
  const steps = [
    { type: "dialogue", speaker: "มาสเตอร์เวรีออน", text: "ดีมาก ผู้พเนจร ไทม์ดัสต์สลายไปแล้ว เศษฝุ่นแห่งกาลเวลาเริ่มกลับมาเป็นระเบียบอีกครั้ง" },
    { type: "dialogue", speaker: "มาสเตอร์เวรีออน", text: "ตอนนี้เจ้ารู้แล้วว่า อดีตคือสิ่งที่เกิดขึ้นแล้วและจบลงแล้ว แต่ในภาษาอังกฤษ การเล่าอดีตไม่ได้ใช้แค่คำบอกเวลาเท่านั้น" },
    { type: "dialogue", speaker: "มาสเตอร์เวรีออน", text: "ภาษาอังกฤษยังเปลี่ยนรูปคำกริยา เพื่อบอกว่าเหตุการณ์นั้นเกิดขึ้นในอดีต" },
    { type: "dialogue", speaker: "มาสเตอร์เวรีออน", text: "คำกริยาบางกลุ่มเชื่อฟังกฎของอดีตอย่างเรียบร้อย เมื่อมันเดินผ่านประตูแห่งเมื่อวาน มันเพียงเติม -ed ต่อท้าย" },
    { type: "dialogue", speaker: "มาสเตอร์เวรีออน", text: "คำกริยาเหล่านี้เรียกว่า Regular Verbs หรือคำกริยาปกติ" },
    {
      type: "example",
      title: "Regular Verbs: คำทั่วไปเติม -ed",
      examples: [
        { label: "walk", sentence: "walk → walked", meaning: "เดิน → เดินแล้ว" },
        { label: "jump", sentence: "jump → jumped", meaning: "กระโดด → กระโดดแล้ว" },
        { label: "clean", sentence: "clean → cleaned", meaning: "ทำความสะอาด → ทำความสะอาดแล้ว" },
        { label: "watch", sentence: "watch → watched", meaning: "ดู → ดูแล้ว" }
      ]
    },
    { type: "dialogue", speaker: "มาสเตอร์เวรีออน", text: "เห็นหรือไม่ ผู้พเนจร คำเหล่านี้ไม่ได้เปลี่ยนรูปแปลก ๆ เพียงเติม -ed ก็กลายเป็นอดีตได้" },
    {
      type: "check",
      speaker: "มาสเตอร์เวรีออน",
      prompt: "ลองช่วยข้าเปลี่ยนคำนี้ให้เป็นอดีต: jump → ?",
      choices: ["jumped", "jumpd", "jumpied", "jumping"],
      answer: "jumped",
      correctFeedback: "ถูกต้อง jump เป็นคำกริยาทั่วไป จึงเติม -ed เป็น jumped",
      wrongFeedback: "ยังไม่ใช่ ผู้พเนจร jump เป็นคำกริยาทั่วไป ให้เติม -ed จึงเป็น jumped"
    },
    { type: "dialogue", speaker: "มาสเตอร์เวรีออน", text: "แต่จงระวัง ไม่ใช่ทุกคำจะเติม -ed ต่อท้ายตรง ๆ เสมอไป" },
    { type: "dialogue", speaker: "มาสเตอร์เวรีออน", text: "ถ้าคำกริยาลงท้ายด้วย e อยู่แล้ว เราไม่ต้องเติม e ซ้ำ ให้เติมเพียง -d" },
    {
      type: "example",
      title: "คำลงท้ายด้วย e เติมแค่ -d",
      examples: [
        { label: "like", sentence: "like → liked", meaning: "ชอบ → ชอบแล้ว" },
        { label: "love", sentence: "love → loved", meaning: "รัก → รักแล้ว" },
        { label: "dance", sentence: "dance → danced", meaning: "เต้น → เต้นแล้ว" },
        { label: "close", sentence: "close → closed", meaning: "ปิด → ปิดแล้ว" }
      ]
    },
    { type: "dialogue", speaker: "มาสเตอร์เวรีออน", text: "like จึงไม่ใช่ likeed แต่เป็น liked เพราะมี e อยู่ท้ายคำแล้ว" },
    {
      type: "check",
      speaker: "มาสเตอร์เวรีออน",
      prompt: "คำว่า love เมื่อเป็นอดีตควรเป็นข้อใด",
      choices: ["loveed", "loved", "lovied", "loving"],
      answer: "loved",
      correctFeedback: "ดีมาก love ลงท้ายด้วย e อยู่แล้ว จึงเติมแค่ -d เป็น loved",
      wrongFeedback: "ยังไม่ถูก love มี e ท้ายคำอยู่แล้ว จึงเติมเพียง -d เป็น loved"
    },
    { type: "dialogue", speaker: "มาสเตอร์เวรีออน", text: "ยอดเยี่ยม ผู้พเนจร เจ้ากำลังเริ่มเข้าใจกฎของ Regular Verbs แล้ว" },
    { type: "dialogue", speaker: "มาสเตอร์เวรีออน", text: "แต่ข้างหน้า เอคโททิกกำลังรออยู่ มันจะทดสอบว่าเจ้าจำได้หรือไม่ว่า คำใดต้องเติม -ed และคำใดเติมเพียง -d" }
  ];

  if (stage.questions && stage.questions.length) {
    steps.push(createBattleIntroStep(stage));
  }

  return steps;
}

function createBattleIntroStep(stage) {
  return {
    type: "battle-intro",
    speaker: "ระบบ",
    text: isFinalBossStage(stage)
      ? `${stage.enemy} ปรากฏตัวแล้ว ใช้สิ่งที่เรียนทั้งหมดเพื่อฟื้นคืน Past Fragment`
      : `${stage.enemy || stage.thaiEnemy || "เงาความทรงจำ"} กำลังรออยู่ เริ่มฝึกเมื่อพร้อม`
  };
}

function buildGuidedLessonSteps(stage) {
  if (stage.id === "regular-rule-1") {
    return buildRegularEdLessonSteps(stage);
  }

  const steps = [];
  const lessonLines = (stage.lesson || []).flatMap(splitLessonItem);
  const firstQuestion = stage.questions && stage.questions[0];

  steps.push({
    type: "dialogue",
    speaker: "มาสเตอร์เวรีออน",
    text: isFinalBossStage(stage)
      ? `${stage.enemy} กำลังทดสอบทุกความทรงจำของอดีต เตรียมทบทวนให้ชัดก่อนต่อสู้`
      : `วันนี้เราจะเรียนเรื่อง ${stage.thaiTitle || stage.title} ทีละขั้น`
  });

  lessonLines.forEach((line, index) => {
    if (line.includes("->") || line.includes("→") || line.includes("=")) {
      steps.push({
        type: "examples",
        title: "ตัวอย่างสำคัญ",
        cards: splitExampleCards(line)
      });
      return;
    }

    if (line.startsWith("มาสเตอร์เวรีออน:")) {
      steps.push({
        type: "dialogue",
        speaker: "มาสเตอร์เวรีออน",
        text: line.replace("มาสเตอร์เวรีออน:", "").trim()
      });
      return;
    }

    steps.push({
      type: index % 2 === 0 ? "dialogue" : "thought",
      speaker: index % 2 === 0 ? "มาสเตอร์เวรีออน" : "บทเรียน",
      text: line
    });
  });

  if (firstQuestion) {
    const preparedFirstQuestion = prepareQuestion(firstQuestion);
    steps.push({
      type: "check",
      speaker: "มาสเตอร์เวรีออน",
      prompt: preparedFirstQuestion.prompt || preparedFirstQuestion.sentence,
      answer: preparedFirstQuestion.correctAnswer,
      correctFeedback: `ถูกต้อง ${preparedFirstQuestion.explanation}`,
      wrongFeedback: `ยังไม่ใช่ คำตอบที่ถูกคือ ${preparedFirstQuestion.correctAnswer} ${preparedFirstQuestion.explanation}`,
      choices: preparedFirstQuestion.options.map(option => ({
        text: option,
        correct: option === preparedFirstQuestion.correctAnswer,
        response: option === preparedFirstQuestion.correctAnswer
          ? `ถูกต้อง ${preparedFirstQuestion.explanation}`
          : `ยังไม่ใช่ คำตอบที่ถูกคือ ${preparedFirstQuestion.correctAnswer} ${preparedFirstQuestion.explanation}`
      }))
    });
  }

  steps.push({
    type: stage.questions && stage.questions.length ? "drill-intro" : "dialogue",
    speaker: "มาสเตอร์เวรีออน",
    text: stage.questions && stage.questions.length
      ? "เจ้าพร้อมแล้ว ต่อไปเป็นแบบฝึกสั้น ๆ ก่อนเผชิญพลังของอดีต"
      : "บทเรียนส่วนนี้เสร็จแล้ว เราจะไปยังขั้นต่อไป"
  });

  if (stage.questions && stage.questions.length) {
    steps.push({
      type: "battle-intro",
      speaker: "ระบบ",
      text: isFinalBossStage(stage)
        ? `${stage.enemy} ปรากฏตัวแล้ว ใช้สิ่งที่เรียนทั้งหมดเพื่อฟื้นคืน Past Fragment`
        : `${stage.enemy || stage.thaiEnemy || "เงาความทรงจำ"} กำลังรออยู่ เริ่มฝึกเมื่อพร้อม`
    });
  }

  return steps;
}

function splitExampleCards(text) {
  return text
    .replace(/^Examples?:\s*/i, "")
    .split(/,\s*| \/ /)
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, 4);
}

function renderLessonStep() {
  const stage = state.currentLessonStage;
  const step = state.lessonSteps[state.lessonStepIndex];
  if (!stage || !step) {
    return;
  }
  updatePreviousDialogueButton();

  saveProgress({
    currentStageId: stage.id,
    currentLessonId: stage.id,
    currentScreen: "lesson",
    lastSafeScreen: "lesson",
    currentLessonStepIndex: state.lessonStepIndex,
    currentDialogueIndex: 0
  });
  state.isLessonSummaryOpen = false;
  els.nounActivityVisual.querySelector("h3").textContent = stage.thaiTitle || stage.title;
  els.activityFeedback.textContent = getLessonStepFeedback(step);
  const lessonSpeakerLabel = els.nounActivityVisual.querySelector(".speaker-name");
  if (lessonSpeakerLabel) {
    lessonSpeakerLabel.textContent = step.type === "example" || step.type === "examples"
      ? "ตัวอย่าง"
      : step.type === "check" || step.type === "choice"
        ? "ตรวจความเข้าใจ"
        : (step.speaker || "มาสเตอร์เวรีออน");
  }
  els.wordGrid.innerHTML = "";
  els.nounActivityVisual.classList.remove("hidden");
  els.nounActivity.classList.remove("hidden");
  els.battleButton.classList.remove("hidden");

  if (step.type === "check" || step.type === "choice") {
    renderLessonCheckStep(step);
    clearBattleButtonAction({ hide: true });
    return;
  }

  if (step.type === "example" || step.type === "examples") {
    renderExampleCards(step);
  } else {
    renderLessonTextStep(step);
  }

  setBattleButtonAction(getLessonStepButtonText(step), advanceLessonStep);
}

function getLessonStepFeedback(step) {
  const labels = {
    dialogue: "มาสเตอร์เวรีออนกำลังอธิบาย",
    thought: "สรุปแนวคิดสำคัญ",
    example: "ดูตัวอย่างทีละชุด",
    examples: "ดูตัวอย่างทีละชุด",
    check: "ตรวจความเข้าใจ",
    choice: "เลือกคำตอบของเจ้า",
    "drill-intro": "เตรียมเริ่มฝึก",
    "battle-intro": "พร้อมเข้าสู่การต่อสู้"
  };
  return labels[step.type] || "บทเรียน";
}

function getLessonStepButtonText(step) {
  if (step.type === "drill-intro") {
    return "เริ่มฝึก";
  }
  if (step.type === "battle-intro") {
    return "เริ่มต่อสู้";
  }
  return "ถัดไป";
}

function renderLessonTextStep(step) {
  const card = document.createElement("div");
  card.className = `lesson-step-card ${step.type === "thought" ? "lesson-thought-bubble" : "speaker-verion"}`;
  card.innerHTML = `<strong>${step.speaker || "บทเรียน"}</strong><span>${resolveDialogueText(step)}</span>`;
  els.wordGrid.appendChild(card);
}

function renderExampleCards(step) {
  const title = document.createElement("div");
  title.className = "lesson-step-card lesson-question";
  title.textContent = step.title || "ตัวอย่าง";
  els.wordGrid.appendChild(title);

  (step.examples || step.cards || []).forEach(example => {
    const card = document.createElement("div");
    card.className = "lesson-step-card lesson-example";
    if (typeof example === "string") {
      card.textContent = example;
    } else {
      card.innerHTML = `<strong>${example.sentence}</strong><span>${example.meaning}</span>`;
    }
    els.wordGrid.appendChild(card);
  });
}

function renderLessonCheckStep(step) {
  renderLessonTextStep({
    type: "dialogue",
    speaker: step.speaker || "มาสเตอร์เวรีออน",
    text: step.prompt || step.text
  });
  step.choices.forEach(choice => {
    const choiceText = typeof choice === "string" ? choice : choice.text;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "lesson-choice-btn";
    button.textContent = choiceText;
    button.addEventListener("click", () => {
      if (button.disabled) {
        return;
      }
      els.wordGrid.querySelectorAll(".lesson-choice-btn").forEach(choiceButton => setButtonEnabled(choiceButton, false));
      chooseLessonStepAnswer(choice, step);
    });
    els.wordGrid.appendChild(button);
  });
}

function chooseLessonStepAnswer(choice, step = null) {
  const selectedText = typeof choice === "string" ? choice : choice.text;
  const hasModernAnswer = step && typeof step.answer !== "undefined";
  const isCorrect = hasModernAnswer ? selectedText === step.answer : Boolean(choice.correct);
  const feedbackText = hasModernAnswer
    ? (isCorrect ? step.correctFeedback : step.wrongFeedback)
    : choice.response;
  els.wordGrid.innerHTML = "";
  const feedback = document.createElement("div");
  feedback.className = `lesson-step-card ${isCorrect ? "lesson-feedback-correct" : "lesson-feedback-wrong"}`;
  feedback.innerHTML = `<strong>${isCorrect ? "ถูกต้อง" : "ลองใหม่ในใจอีกครั้ง"}</strong><span>${feedbackText}</span>`;
  els.wordGrid.appendChild(feedback);
  setBattleButtonAction("ถัดไป", advanceLessonStep);
}

function advanceLessonStep() {
  const step = state.lessonSteps[state.lessonStepIndex];
  if (step && step.type === "battle-intro") {
    startBattleFromActivity();
    return;
  }

  state.lessonStepIndex += 1;
  if (state.lessonStepIndex >= state.lessonSteps.length) {
    completeNonBattleStage(state.currentLessonStage);
    return;
  }
  renderLessonStep();
}

function showActInfoScreen() {
  state.actStageIndex = 0;
  state.isLessonSummaryOpen = false;
  updateLessonChrome(null, 0, "lesson");
  els.activityFeedback.textContent = "เมื่อจบ ACT นี้ ผู้เรียนสามารถใช้ V2 เพื่อเล่าเหตุการณ์ในอดีตได้";
  els.nounActivityVisual.querySelector("h3").textContent = PAST_FRAGMENT_ACT.title;
  renderActionCards([
    "Stage Progression",
    ...PAST_FRAGMENT_ACT.stages.map(stage => `${stage.title}${stage.thaiTitle ? ` / ${stage.thaiTitle}` : ""}`),
    "Learning Objectives",
    ...PAST_FRAGMENT_ACT.objectives
  ], "lesson-card");
  setBattleButtonAction("เริ่มภารกิจ", () => showStageLesson(0));

  els.nounActivity.classList.remove("hidden");
  els.nounActivityVisual.classList.remove("hidden");
  saveProgress({
    currentScreen: "actInfo",
    lastSafeScreen: "actInfo",
    currentStageId: getPlayableStages()[0]?.id || DEFAULT_ACT_PROGRESS.currentStageId,
    currentLessonId: getPlayableStages()[0]?.id || DEFAULT_ACT_PROGRESS.currentLessonId,
    currentLessonStepIndex: 0,
    currentDialogueIndex: 0
  });
}

function showStageLesson(stageIndex, resumeState = {}) {
  const stage = getPlayableStages()[stageIndex];
  if (!stage) {
    showActEnding();
    return;
  }

  const isReplay = Boolean(resumeState.isReplay);
  if (isReplay) {
    const progress = loadProgress();
    state.activeReplayLessonId = stage.id;
    state.replayReturnProgress = progress ? {
      currentStageId: progress.currentStageId,
      currentLessonId: progress.currentLessonId,
      currentScreen: progress.currentScreen,
      lastSafeScreen: progress.lastSafeScreen,
      lessonPhase: progress.lessonPhase,
      currentDialogueIndex: progress.currentDialogueIndex,
      currentLessonStepIndex: progress.currentLessonStepIndex
    } : null;
  } else if (!resumeState.preserveReplayState) {
    state.activeReplayLessonId = null;
    state.replayReturnProgress = null;
  }

  setActBackground(getAct1BackgroundKeyForStage(stage), { warnMissing: true });
  state.actStageIndex = stageIndex;
  state.currentLessonStage = stage;
  updateLessonChrome(stage, stageIndex, "lesson");
  if (isReplay) {
    els.activityFeedback.textContent = "โหมดเรียนซ้ำ: จะไม่ได้รับ Grammaria หรือรางวัลซ้ำ";
  }
  console.log("[Lesson Start]", stage.id, getAllowedRuleIdsForStage(stage));
  startStageDialogueLesson(stage, resumeState.dialogueIndex || 0);
  if (!isReplay) {
    saveProgress({
      currentStageId: stage.id,
      currentLessonId: stage.id,
      currentScreen: "lesson",
      lastSafeScreen: "lesson",
      lessonPhase: (buildStageDialogueSequence(stage)[resumeState.dialogueIndex || 0] || {}).phase || "teacherExplanation",
      currentLessonStepIndex: 0,
      currentDialogueIndex: resumeState.dialogueIndex || 0
    });
  }
}

function completeNonBattleStage(stage) {
  state.lastStageResult = {
    correctAnswers: 0,
    totalQuestions: 0
  };
  grantActReward(stage, { awardGrammaria: false });
  showStageReward(stage);
}

function startBattleFromActivity() {
  const stage = getPlayableStages()[state.actStageIndex] || getPlayableStages()[0];
  runSceneTransition(`${stage.enemy} ปรากฏตัว!`, () => startActBattle(state.actStageIndex));
}

function getQuestionText(question) {
  const phase = question.phase ? `[${question.phase}] ` : "";
  return phase + (question.sentence || question.prompt);
}

function startActBattle(stageIndex) {
  cleanupBossHeavyAttackChain({ clearParryUi: true });
  const stageConfig = getPlayableStages()[stageIndex];
  setActBackground(getAct1BackgroundKeyForStage(stageConfig), { warnMissing: true });
  const allowedRuleIds = getAllowedRuleIdsForStage(stageConfig);
  const stage = {
    ...stageConfig,
    questions: filterQuestionsForStage(stageConfig.questions || [], stageConfig)
  };
  console.log("[Battle Start]", stage.id, "Allowed Rules:", allowedRuleIds);
  console.log("[BattleFlowV2] enabled =", BATTLE_FLOW_V2_CONFIG?.enabled);
  const questionCount = stage.questions.length;
  if (!questionCount) {
    console.error("[Battle Start] No valid questions for stage:", stage.id);
    completeNonBattleStage(stageConfig);
    return;
  }
  resetVictorySceneMusicForBattle();
  const baseEnemyMaxHp = isFinalBossStage(stage) ? 140 : 100;
  const enemyMaxHp = getBalancedBossMaxHp(stage, baseEnemyMaxHp);
  state.timeDustTransitionComplete = false;
  state.actStageIndex = stageIndex;
  state.actBattle = {
    stage,
    questionIndex: 0,
    correctAnswers: 0,
    damagePerCorrect: Math.ceil(baseEnemyMaxHp / questionCount),
    turnNumber: 1,
    awaitingParry: false,
    awaitingPrepare: false,
    pendingBossAction: null,
    pendingBossTurn: null,
    bossIntentReadyConsumed: false,
    bossQuestionState: createBossQuestionState(),
    bossQuestionIndex: 0,
    enemyActionHistory: {
      lastMode: "",
      consecutiveCount: 0,
      actions: [],
      turnsSinceTyping: 0,
      turnsSinceArrangement: 0
    },
    pendingPlayerAttack: null,
    playerActionPhase: "question",
    pendingPlayerAnswer: null,
    actionChoiceLocked: false,
    selectedSkillId: "",
    selectedCharmId: "",
    selectedChargePercent: 0,
    skillCooldowns: createInitialSkillCooldowns(),
    skillCooldownStartedTurn: {},
    skillCooldownLastTickPlayerTurn: 0,
    playerTurnCounter: 0,
    pendingAttackData: null,
    skillFlowLocked: false,
    heavyAttackState: null,
    lastHeavyAttackTurn: -999,
    bossTurnCount: 0,
    recentCharmIds: [],
    usedQuestionIds: new Set(),
    lastQuestionBaseVerb: "",
    currentQuestion: null,
    usedBossQuestionIds: new Set(),
    lastBossQuestionBaseVerb: "",
    usedFocusQuestionIds: new Set(),
    lastFocusQuestionId: "",
    lastFocusQuestionBaseVerb: "",
    focusQuestionIndex: 0,
    recentFocusQuestionIds: [],
    simpleIrregularStreak: 0,
    bossStunned: false,
    bossWasStunnedLastTurn: false,
    stunSkipResolving: false,
    stunTurnCompleted: false,
    correctStreak: 0,
    ap: ACT_MAX_AP,
    focusBuff: null,
    criticalCounterReady: false,
    awaitingGrammarCharge: false,
    pendingGrammarCharge: null,
    isActive: true,
    isDefeated: false,
    battleLocked: false,
    reviveUsedThisBattle: false,
    reviveCount: 0,
    justRevived: false,
    reviewStageIndex: stageIndex,
    reviewLessonStepIndex: state.lessonStepIndex || 0,
    reviewDialogueIndex: state.lessonStoryStepIndex || 0,
    victoryHandled: false,
    grammariaStats: createBattleStats(stage),
    statuses: null,
    bossGrammarChallenge: createBossGrammarChallengeState()
  };
  resetBattleStatuses(state.actBattle);
  state.currentBattleStats = state.actBattle.grammariaStats;
  console.log("[Grammaria] battle stats:", state.currentBattleStats);
  state.playerHp = 100;
  state.enemyMaxHp = enemyMaxHp;
  state.enemyHp = state.enemyMaxHp;
  state.grammaria = playerData ? playerData.grammaria || 0 : state.grammaria;
  state.sparkBonus = 0;
  resetBattleActiveEffects();
  saveProgress({
    currentStageId: stage.id,
    currentLessonId: stage.id,
    currentScreen: "battle",
    lastSafeScreen: "lesson",
    currentLessonStepIndex: state.lessonStepIndex || 0,
    currentDialogueIndex: state.lessonStoryStepIndex || 0
  });
  els.battleTitle.textContent = isFinalBossStage(stage) ? "Final Boss: The Memory Breaker" : stage.title;
  updateBattleEnemyVisual(stage);
  updateBattleStats();
  resetBattleContinueControls();
  els.continueBattleButton.classList.add("hidden");
  els.bossIntentReadyButton?.classList.remove("hidden");
  setActionButtonsEnabled(false);
  showScene("battle");
  beginActPlayerTurn("เลือกการกระทำเพื่อเริ่มเทิร์นของผู้พเนจร");
}

function startActAttackAction() {
  const battle = state.actBattle;
  if (!battle) {
    return;
  }

  if (BATTLE_FLOW_V2_CONFIG.enabled) {
    battle.playerActionPhase = "question";
    battle.pendingPlayerAnswer = null;
    battle.selectedSkillId = "";
    battle.selectedCharmId = "";
    battle.selectedChargePercent = 0;
    battle.pendingAttackData = null;
    battle.skillFlowLocked = false;
    showActBattleQuestion();
    return;
  }

  if (!spendActAP(1)) {
    beginActPlayerTurn("AP ไม่พอสำหรับโจมตี ใช้ตั้งสมาธิเพื่อฟื้น AP");
    return;
  }

  showActBattleQuestion();
}

function useActItem() {
  const battle = state.actBattle;
  if (!battle) {
    return;
  }

  battle.actionChoiceLocked = false;
  battle.advanceQuestionOnContinue = false;
  showOnlyBattlePanel(els.actionMenu);
  els.battleMessage.textContent = "ระบบไอเทมจะเปิดใช้ในเวอร์ชันถัดไป";
  if (els.activityFeedback) {
    els.activityFeedback.textContent = "ยังไม่มีไอเทมให้ใช้ในการต่อสู้นี้";
  }
  updateActActionMenuState();
}

function startActFocusAction() {
  const battle = state.actBattle;
  if (!battle) {
    return;
  }

  const rawFocusQuestion = getFocusQuestion(battle.stage);
  if (!rawFocusQuestion) {
    els.battleMessage.textContent = "สมาธิยังไม่ก่อรูป ไม่มีคำถามสำหรับรวบรวม Grammaria ในตอนนี้";
    beginActPlayerTurn("ไม่มีคำถามสำหรับนั่งสมาธิ ลองเลือกการกระทำอื่น");
    return;
  }

  const focusQuestion = prepareQuestion(rawFocusQuestion, battle.focusQuestionIndex || 0);
  battle.currentFocusQuestion = focusQuestion;
  battle.advanceQuestionOnContinue = false;
  showOnlyBattlePanel(els.questionPanel);
  setBattleTurnOwner("player");
  els.battleMessage.textContent = "ตั้งสมาธิ: ตอบคำถามสั้น ๆ เพื่อรวบรวม Grammaria และฟื้น AP";
  els.questionText.textContent = getQuestionText(focusQuestion);
  els.answerOptions.innerHTML = "";

  focusQuestion.options.forEach(option => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-button";
    button.textContent = option;
    button.addEventListener("click", () => chooseActFocusAnswer(option, focusQuestion));
    els.answerOptions.appendChild(button);
  });
}

function chooseActFocusAnswer(option, question) {
  const battle = state.actBattle;
  if (!battle) {
    return;
  }

  const correctAnswer = question.correctAnswer || question.answer;
  const isCorrect = option === correctAnswer;
  els.answerOptions.querySelectorAll("button").forEach(button => {
    button.disabled = true;
    if (button.textContent === correctAnswer) {
      button.classList.add("correct");
    }
    if (button.textContent === option && !isCorrect) {
      button.classList.add("wrong");
    }
  });

  const feedback = document.createElement("div");
  feedback.className = "answer-feedback";
  if (isCorrect) {
    recordCorrectAnswerForGrammaria();
    const apGain = FOCUS_BALANCE_CONFIG.correctApGain;
    gainActAP(apGain);
    const focusResult = applyFocusBuffFromMeditation();
    const focusBonusPercent = focusResult?.focusBuff?.bonusPercent || FOCUS_BALANCE_CONFIG.focusDamageBonusPercent;
    feedback.innerHTML = focusResult?.hadActiveBuff
      ? `<strong>ตั้งสมาธิสำเร็จ!</strong><br>สมาธิของเจ้ายังคงมั่นคง โบนัสเดิมถูกรีเฟรช แต่จะไม่ซ้อนทับ<br>${question.explanation || ""}`
      : `<strong>ตั้งสมาธิสำเร็จ!</strong><br>ได้รับ AP +${apGain} และพลังโจมตีครั้งถัดไปเพิ่มขึ้น ${focusBonusPercent}%<br>${question.explanation || ""}`;
    els.battleMessage.textContent = focusResult?.hadActiveBuff
      ? "สมาธิของเจ้ายังคงมั่นคง โบนัสเดิมถูกรีเฟรช แต่จะไม่ซ้อนทับ"
      : `สมาธิของเจ้าสงบลง ได้รับ AP +${apGain} และพลังโจมตีครั้งถัดไปเพิ่มขึ้น ${focusBonusPercent}%`;
    console.log("[FocusBalance] meditation result", {
      correct: true,
      apGain,
      focusBonusPercent: battle.focusBuff?.bonusPercent || 0,
      stacks: battle.focusBuff?.stacks || 0
    });
  } else {
    recordWrongAnswerForGrammaria();
    const apGain = FOCUS_BALANCE_CONFIG.wrongApGain;
    gainActAP(apGain);
    feedback.innerHTML = `<strong>สมาธิยังไม่นิ่งพอ</strong><br>รอบนี้ไม่ได้รับโบนัส คำตอบที่ถูกคือ <strong>${correctAnswer}</strong><br>${question.explanation || ""}`;
    els.battleMessage.textContent = "สมาธิยังไม่นิ่งพอ รอบนี้ไม่ได้รับโบนัส";
    console.log("[FocusBalance] meditation result", {
      correct: false,
      apGain,
      focusBonusPercent: battle.focusBuff?.bonusPercent || 0,
      stacks: battle.focusBuff?.stacks || 0
    });
  }

  els.answerOptions.appendChild(feedback);
  updateBattleStats();
  syncBattleStateToPlayerData();
  completePlayerSkillCooldownTurn(battle);
  if (!isCorrect && resolvePlayerDefeat("HP เหลือ 0")) {
    return;
  }
  battle.pendingBossAction = chooseActBossAction(battle);
  battle.advanceQuestionOnContinue = false;
  if (battle.pendingBossAction && battle.pendingBossAction.sequence) {
    battle.pendingBossAction.sequence = battle.pendingBossAction.sequence.map(step => step === "attack" ? "question" : step);
  }
  setTimeout(startActBossWarning, 1100);
}

function showActBattleQuestion() {
  const battle = state.actBattle;
  battle.answerResolving = false;
  battle.advanceQuestionOnContinue = true;
  const rawQuestion = pickQuestion(
    battle.stage.questions,
    battle.usedQuestionIds,
    battle.lastQuestionBaseVerb || ""
  ) || battle.stage.questions[battle.questionIndex];
  const rawQuestionIndex = battle.stage.questions.indexOf(rawQuestion);
  const question = prepareQuestion(rawQuestion, rawQuestionIndex);
  battle.currentQuestion = question;
  battle.lastQuestionBaseVerb = question.baseVerb || "";
  battle.usedQuestionIds.add(question.id);
  battle.pendingPlayerAttack = null;
  setBattleTurnOwner("player");
  els.continueBattleButton.classList.add("hidden");
  els.battleMessage.textContent = `${battle.stage.title} - คำถาม ${battle.questionIndex + 1} / ${battle.stage.questions.length}`;
  els.questionText.textContent = getQuestionText(question);
  els.answerOptions.innerHTML = "";

  let visibleOptions = [...question.options];
  const hintCount = Math.min(state.battleActiveEffects?.hint || 0, 2);
  if (hintCount > 0) {
    state.battleActiveEffects.hint = Math.max((state.battleActiveEffects.hint || 0) - hintCount, 0);
    const wrongOptions = visibleOptions.filter(option => option !== (question.correctAnswer || question.answer));
    const removedWrong = sample(wrongOptions, hintCount);
    visibleOptions = visibleOptions.filter(option => !removedWrong.includes(option));
    els.battleMessage.textContent += " | แสงชี้คำตอบลบตัวเลือกผิดออก 1 ข้อ";
  }

  if (state.battleActiveEffects.echoDamageNextTurn) {
    const echoDamage = state.battleActiveEffects.echoDamageNextTurn;
    state.battleActiveEffects.echoDamageNextTurn = 0;
    const echoResult = applyStatusDamageToTarget("boss", echoDamage, "echoDamage");
    triggerEnemyHitFeedback(echoResult.finalDamage);
    updateBattleStats();
    els.battleMessage.textContent += ` | เสียงสะท้อนสร้างดาเมจ ${echoResult.finalDamage}`;
    if (state.enemyHp <= 0) {
      handleActEnemyDefeated("echoDamage");
      return;
    }
  }

  visibleOptions.forEach(option => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-button";
    button.textContent = option;
    button.addEventListener("click", () => chooseActAnswer(option, button));
    els.answerOptions.appendChild(button);
  });

  showOnlyBattlePanel(els.questionPanel);
}

const BATTLE_CORRECT_FEEDBACK_DELAY_MS = 650;
const BATTLE_CORRECT_SUCCESS_MESSAGE = "ถูกต้อง! พลังแกรมมาเรียตอบสนอง เตรียมเลือกสกิลโจมตี";

function showBattleCorrectAnswerFeedback(button) {
  if (!button) {
    return;
  }
  button.classList.add("is-battle-correct");
  if (!button.querySelector(".battle-correct-label")) {
    const label = document.createElement("span");
    label.className = "battle-correct-label";
    label.textContent = "Correct!";
    button.appendChild(label);
  }
}

function chooseActAnswer(option, selectedButton = null) {
  const battle = state.actBattle;
  if (!battle || battle.answerResolving) {
    return;
  }
  battle.answerResolving = true;
  const question = battle.currentQuestion || prepareQuestion(battle.stage.questions[battle.questionIndex], battle.questionIndex);
  const isCorrect = option === (question.correctAnswer || question.answer);
  const feedback = document.createElement("div");
  feedback.className = "answer-feedback";

  els.answerOptions.querySelectorAll("button").forEach(button => {
    button.disabled = true;
    if (button.textContent === (question.correctAnswer || question.answer)) {
      button.classList.add("correct");
    }
    if (button.textContent === option && !isCorrect) {
      button.classList.add("wrong");
    }
  });

  if (isCorrect) {
    showBattleCorrectAnswerFeedback(selectedButton);
    setBattleTurnOwner("player");
    battle.correctAnswers += 1;
    recordCorrectAnswerForGrammaria();
    battle.correctStreak = (battle.correctStreak || 0) + 1;
    const bonusGrammaria = consumeBattleEffectValue("nextCorrectBonusGrammaria", 0);
    battle.pendingPlayerAttack = {
      baseDamage: battle.damagePerCorrect,
      grammariaGain: 10 + bonusGrammaria
    };
    feedback.innerHTML = `<strong>Correct!</strong><br>${question.explanation}`;
  } else {
    battle.correctStreak = 0;
    if (useBattleEffect("retry")) {
      battle.answerResolving = false;
      els.answerOptions.querySelectorAll("button").forEach(button => {
        button.disabled = button.textContent === option;
        button.classList.remove("correct");
      });
      feedback.innerHTML = `<strong>ย้อนคิดทำงาน!</strong><br>คำตอบนี้ยังไม่ถูก แต่เจ้ามีโอกาสลองอีกครั้ง`;
      els.answerOptions.appendChild(feedback);
      els.battleMessage.textContent = "เครื่องรางย้อนคิดช่วยให้ลองตอบใหม่ในคำถามเดิม";
      return;
    }

    setBattleTurnOwner("enemy");
    recordWrongAnswerForGrammaria();
    const penaltyResult = applyStatusDamageToTarget("player", 12, "wrongAnswerPenalty");
    playAttackSfx();
    triggerMotion(els.battleEnemy, "enemy-attack-motion");
    feedback.innerHTML = `<strong>ยังไม่ถูกต้อง</strong><br>รับดาเมจ ${penaltyResult.finalDamage}<br>คำตอบที่ถูกคือ <strong>${question.correctAnswer || question.answer}</strong><br>${question.explanation}`;
  }

  els.answerOptions.appendChild(feedback);
  updateBattleStats();
  syncBattleStateToPlayerData();
  if (!isCorrect && resolvePlayerDefeat("HP เหลือ 0")) {
    return;
  }

  if (BATTLE_FLOW_V2_CONFIG?.enabled) {
    if (isCorrect) {
      els.battleMessage.textContent = BATTLE_CORRECT_SUCCESS_MESSAGE;
      window.setTimeout(() => handleBattleFlowV2AnswerResolved(question, option, isCorrect), BATTLE_CORRECT_FEEDBACK_DELAY_MS);
      return;
    }
    handleBattleFlowV2AnswerResolved(question, option, isCorrect);
    return;
  }

  battle.pendingBossAction = chooseActBossAction(battle);

  if (isCorrect) {
    els.battleMessage.textContent = BATTLE_CORRECT_SUCCESS_MESSAGE;
    els.continueBattleButton.classList.add("hidden");
    setTimeout(showActCharmChoices, BATTLE_CORRECT_FEEDBACK_DELAY_MS);
    return;
  }

  els.continueBattleButton.classList.add("hidden");
  setTimeout(startActBossWarning, 1100);
}

function battleFlowV2Log(label, payload = {}) {
  if (BATTLE_FLOW_V2_CONFIG.debug) {
    console.log(`[BattleFlowV2] ${label}`, payload);
  }
}

function getBattlePlayerAp() {
  const battle = state.actBattle;
  if (!battle) {
    return 0;
  }
  return Number(battle.playerAp ?? battle.ap ?? 0);
}

function spendBattlePlayerAp(amount) {
  const battle = state.actBattle;
  if (!battle) {
    return false;
  }

  const cost = Math.max(0, Number(amount || 0));
  const currentAp = getBattlePlayerAp();
  if (currentAp < cost) {
    return false;
  }

  if (typeof battle.playerAp === "number") {
    battle.playerAp = Math.max(0, battle.playerAp - cost);
  } else if (typeof battle.ap === "number") {
    battle.ap = Math.max(0, battle.ap - cost);
  } else {
    battle.playerAp = Math.max(0, currentAp - cost);
  }
  return true;
}

function getBattleFlowV2Skill(skillId) {
  return PLAYER_SKILLS_V2.find(skill => skill.id === skillId && skill.enabled);
}

function createInitialSkillCooldowns() {
  return PLAYER_SKILLS_V2.reduce((cooldowns, skill) => {
    if (skill.enabled) {
      cooldowns[skill.id] = 0;
    }
    return cooldowns;
  }, {});
}

function ensureBattleSkillCooldownState(battle = state.actBattle) {
  if (!battle) {
    return null;
  }
  if (!battle.skillCooldowns || typeof battle.skillCooldowns !== "object" || Array.isArray(battle.skillCooldowns)) {
    battle.skillCooldowns = createInitialSkillCooldowns();
  }
  if (!battle.skillCooldownStartedTurn || typeof battle.skillCooldownStartedTurn !== "object" || Array.isArray(battle.skillCooldownStartedTurn)) {
    battle.skillCooldownStartedTurn = {};
  }
  PLAYER_SKILLS_V2.filter(skill => skill.enabled).forEach(skill => {
    const remaining = Math.max(0, Number(battle.skillCooldowns[skill.id]) || 0);
    battle.skillCooldowns[skill.id] = remaining;
    if (remaining <= 0 && battle.skillCooldownStartedTurn[skill.id] !== undefined) {
      delete battle.skillCooldownStartedTurn[skill.id];
    }
  });
  battle.playerTurnCounter = Math.max(0, Number(battle.playerTurnCounter) || 0);
  battle.skillCooldownLastTickPlayerTurn = Math.max(0, Number(battle.skillCooldownLastTickPlayerTurn) || 0);
  return battle;
}

function getRemainingSkillCooldown(skillId, battle = state.actBattle) {
  const activeBattle = ensureBattleSkillCooldownState(battle);
  if (!activeBattle || !skillId) {
    return 0;
  }
  return Math.max(0, Number(activeBattle.skillCooldowns[skillId]) || 0);
}

function applySkillCooldownAfterUse(skillId, battle = state.actBattle) {
  const activeBattle = ensureBattleSkillCooldownState(battle);
  const skill = getBattleFlowV2Skill(skillId);
  if (!activeBattle || !skill) {
    return;
  }
  const cooldownTurns = Math.max(0, Number(skill.cooldownTurns) || 0);
  if (cooldownTurns <= 0) {
    return;
  }
  activeBattle.skillCooldowns[skill.id] = cooldownTurns;
  activeBattle.skillCooldownStartedTurn[skill.id] = Math.max(0, Number(activeBattle.playerTurnCounter) || 0);
}

function tickPlayerSkillCooldowns(battle = state.actBattle) {
  const activeBattle = ensureBattleSkillCooldownState(battle);
  if (!activeBattle) {
    return;
  }
  const currentTurn = Math.max(0, Number(activeBattle.playerTurnCounter) || 0);
  if (!currentTurn || activeBattle.skillCooldownLastTickPlayerTurn === currentTurn) {
    return;
  }

  PLAYER_SKILLS_V2.filter(skill => skill.enabled).forEach(skill => {
    const remaining = getRemainingSkillCooldown(skill.id, activeBattle);
    if (remaining <= 0) {
      return;
    }
    const startedTurn = Math.max(0, Number(activeBattle.skillCooldownStartedTurn[skill.id]) || 0);
    if (startedTurn === currentTurn) {
      return;
    }
    activeBattle.skillCooldowns[skill.id] = Math.max(0, remaining - 1);
    if (activeBattle.skillCooldowns[skill.id] <= 0) {
      delete activeBattle.skillCooldownStartedTurn[skill.id];
    }
  });
  activeBattle.skillCooldownLastTickPlayerTurn = currentTurn;
}

function completePlayerSkillCooldownTurn(battle = state.actBattle) {
  tickPlayerSkillCooldowns(battle);
}

function getBattleFlowV2Charm(charmId) {
  return actAttackCharms.find(charm => charm.id === charmId) ||
    PLAYER_CHARMS_V2.find(charm => charm.id === charmId && charm.enabled);
}

function getAllGrammariaBowls() {
  return Array.isArray(actAttackCharms) && actAttackCharms.length
    ? actAttackCharms
    : PLAYER_CHARMS_V2.filter(charm => charm.enabled);
}

function selectRandomGrammariaBowls(count = 3) {
  const battle = state.actBattle;
  const allBowls = getAllGrammariaBowls();
  const recentIds = new Set([...(battle?.recentCharmIds || []), ...(state.lastCharmSet || [])]);
  const freshPool = allBowls.filter(bowl => !recentIds.has(bowl.id));
  const basePool = freshPool.length >= count ? freshPool : allBowls;
  const choices = sample(basePool, Math.min(count, basePool.length));
  state.lastCharmSet = choices.map(bowl => bowl.id);
  if (battle) {
    battle.recentCharmIds = [...(battle.recentCharmIds || []), ...state.lastCharmSet].slice(-6);
  }
  battleFlowV2Log("bowl roll", {
    totalBowls: allBowls.length,
    choices: choices.map(bowl => `${bowl.rank || "-"}:${bowl.name || bowl.thaiName}`)
  });
  return choices;
}

function handleBattleFlowV2AnswerResolved(question, selectedAnswer, isCorrect) {
  const battle = state.actBattle;
  if (!battle) {
    return;
  }

  battle.pendingPlayerAnswer = {
    questionId: question?.id || "",
    isCorrect: Boolean(isCorrect),
    selectedAnswer,
    correctAnswer: question?.answer || question?.correctAnswer || "",
    baseVerb: question?.baseVerb || "",
    ruleId: question?.ruleId || "",
    answeredAt: Date.now()
  };
  battle.pendingPlayerAttack = {
    baseDamage: battle.pendingPlayerAttack?.baseDamage || battle.damagePerCorrect,
    grammariaGain: isCorrect ? (battle.pendingPlayerAttack?.grammariaGain || 10) : 0
  };
  if (!isCorrect) {
    battle.pendingPlayerAttack = null;
    battle.playerActionPhase = "enemyTurn";
    completePlayerSkillCooldownTurn(battle);
    battle.pendingBossAction = chooseActBossAction(battle);
    setBattleTurnOwner("enemy");
    battleFlowV2Log("wrong answer resolved, starting boss flow", battle.pendingPlayerAnswer);
    startActBossWarning();
    return;
  }

  battle.playerActionPhase = "skillSelect";
  battle.selectedSkillId = "";
  battle.selectedCharmId = "";
  battle.selectedChargePercent = 0;
  battle.pendingAttackData = null;
  battle.skillFlowLocked = false;
  setBattleTurnOwner("player");
  battleFlowV2Log("answer resolved, showing skill panel", battle.pendingPlayerAnswer);
  renderBattleSkillSelectionPanel();
}

function renderBattleSkillSelectionPanel() {
  const battle = state.actBattle;
  if (!battle) {
    return;
  }

  battle.playerActionPhase = "skillSelect";
  cleanupGrammariaCharge();
  const currentAp = getBattlePlayerAp();
  els.battleMessage.textContent = "แตะสกิลที่ต้องการใช้";
  els.charmPanel.querySelector("h3").textContent = "เลือกสกิลโจมตี";
  els.charmOptions.innerHTML = "";
  els.charmOptions.classList.add("battle-flow-v2-options");
  els.continueBattleButton.classList.add("hidden");

  const panel = document.createElement("div");
  panel.className = "battle-flow-v2-panel battle-skill-panel";
  panel.innerHTML = `
    <div class="battle-flow-v2-header battle-flow-v2-meta">
      <strong>AP ${currentAp} / ${ACT_MAX_AP}</strong>
    </div>
    <p class="battle-flow-v2-hint">เลือกพลังจากเศษ Grammar Core เพื่อโจมตี</p>
  `;
  const optionScroll = document.createElement("div");
  optionScroll.className = "battle-flow-v2-body battle-skill-scroll";
  const optionGrid = document.createElement("div");
  optionGrid.className = "battle-flow-v2-card-grid battle-skill-grid";

  PLAYER_SKILLS_V2.filter(skill => skill.enabled).forEach(skill => {
    const remainingCooldown = getRemainingSkillCooldown(skill.id, battle);
    const isCoolingDown = remainingCooldown > 0;
    const hasEnoughAp = currentAp >= skill.apCost;
    const canUse = !isCoolingDown && hasEnoughAp;
    const unavailableNote = isCoolingDown
      ? `<small class="skill-unavailable-note skill-cooldown-badge">คูลดาวน์ ${remainingCooldown} เทิร์น</small>`
      : (!hasEnoughAp ? `<small class="skill-unavailable-note">AP ไม่พอ</small>` : "");
    const button = document.createElement("button");
    button.type = "button";
    button.className = `skill-card battle-flow-v3-skill-card${canUse ? "" : " is-disabled"}${isCoolingDown ? " is-skill-cooling-down" : ""}`;
    button.disabled = !canUse && !isCoolingDown;
    button.setAttribute("aria-disabled", canUse ? "false" : "true");
    button.innerHTML = `
      <span class="skill-card-topline">
        <strong>${skill.thaiName}</strong>
        <em>ใช้ ${skill.apCost} AP</em>
      </span>
      <span>${skill.description}</span>
      <small>${skill.effectText}</small>
      ${unavailableNote}
    `;
    button.addEventListener("click", () => selectBattleSkill(skill.id));
    optionGrid.appendChild(button);
  });
  optionScroll.appendChild(optionGrid);
  panel.appendChild(optionScroll);

  els.charmOptions.appendChild(panel);
  showOnlyBattlePanel(els.charmPanel);
  battleFlowV2Log("skill panel rendered", {
    currentAp,
    skillCount: PLAYER_SKILLS_V2.length,
    phase: battle.playerActionPhase
  });
}

function selectBattleSkill(skillId) {
  const battle = state.actBattle;
  if (!battle || battle.playerActionPhase !== "skillSelect") {
    return;
  }

  const skill = getBattleFlowV2Skill(skillId);
  if (!skill) {
    console.warn("[BattleFlowV2] skill not found", skillId);
    return;
  }

  const remainingCooldown = getRemainingSkillCooldown(skill.id, battle);
  if (remainingCooldown > 0) {
    els.battleMessage.textContent = `สกิลนี้ยังคูลดาวน์อยู่ ต้องรออีก ${remainingCooldown} เทิร์น`;
    return;
  }

  const currentAp = getBattlePlayerAp();
  if (currentAp < skill.apCost) {
    els.battleMessage.textContent = `AP ไม่พอสำหรับ ${skill.thaiName}`;
    renderBattleSkillSelectionPanel();
    return;
  }

  battle.selectedSkillId = skill.id;
  battle.playerActionPhase = "charmSelect";
  battleFlowV2Log("skill selected", { skillId: skill.id, apCost: skill.apCost, currentAp });
  renderBattleCharmSelectionPanel();
}

function renderBattleCharmSelectionPanel() {
  const battle = state.actBattle;
  if (!battle) {
    return;
  }

  const skill = getBattleFlowV2Skill(battle.selectedSkillId);
  if (!skill) {
    renderBattleSkillSelectionPanel();
    return;
  }

  battle.playerActionPhase = "charmSelect";
  els.battleMessage.textContent = "แตะชามที่ต้องการใช้กับสกิลนี้";
  els.charmPanel.querySelector("h3").textContent = "เลือกชาม Grammaria";
  els.charmOptions.innerHTML = "";
  els.charmOptions.classList.add("battle-flow-v2-options");

  const panel = document.createElement("div");
  panel.className = "battle-flow-v2-panel battle-charm-panel";
  panel.innerHTML = `
    <div class="battle-flow-v2-header battle-flow-v2-meta">
      <strong>${skill.thaiName} · ${skill.apCost} AP</strong>
    </div>
  `;
  const optionScroll = document.createElement("div");
  optionScroll.className = "battle-flow-v2-body battle-charm-scroll";
  const optionGrid = document.createElement("div");
  optionGrid.className = "battle-flow-v2-card-grid battle-charm-grid";

  selectRandomGrammariaBowls(3).forEach(charm => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `charm-card battle-flow-v2-charm rank-${String(charm.rank || "c").toLowerCase()}`;
    const rankLabel = charmRankMeta[charm.rank] || charmRankMeta.C;
    button.innerHTML = `
      <span class="charm-topline">
        <span class="charm-icon" aria-hidden="true">${charm.icon || rankLabel.icon || "✦"}</span>
        <span class="charm-rank">${rankLabel.label || "Bowl"}</span>
      </span>
      <strong>${charm.thaiName || charm.name}</strong>
      <span class="charm-description">${charm.description || charm.effect}</span>
    `;
    button.addEventListener("click", () => selectBattleCharm(charm.id));
    optionGrid.appendChild(button);
  });
  optionScroll.appendChild(optionGrid);
  panel.appendChild(optionScroll);

  const backButton = document.createElement("button");
  backButton.type = "button";
  backButton.className = "secondary-button battle-flow-v2-back";
  backButton.textContent = "กลับไปเลือกสกิล";
  backButton.addEventListener("click", renderBattleSkillSelectionPanel);
  panel.appendChild(backButton);

  els.charmOptions.appendChild(panel);
  showOnlyBattlePanel(els.charmPanel);
}

function selectBattleCharm(charmId) {
  const battle = state.actBattle;
  if (!battle || battle.playerActionPhase !== "charmSelect") {
    return;
  }

  const charm = getBattleFlowV2Charm(charmId);
  if (!charm) {
    console.warn("[BattleFlowV2] charm not found", charmId);
    return;
  }

  battle.selectedCharmId = charm.id;
  battle.selectedChargePercent = 0;
  battle.playerActionPhase = "charge";
  battleFlowV2Log("bowl selected", { bowlId: charm.id, name: charm.name || charm.thaiName });
  renderBattleChargePanel();
}

function ensureBattleFlowV2ChargeControls() {
  let controls = document.getElementById("battleFlowV2ChargeControls");
  if (!controls) {
    controls = document.createElement("div");
    controls.id = "battleFlowV2ChargeControls";
    controls.className = "battle-flow-v2-charge-controls";
    els.chargePanel.appendChild(controls);
  }
  return controls;
}

function renderBattleChargePanel() {
  const battle = state.actBattle;
  if (!battle) {
    return;
  }

  const skill = getBattleFlowV2Skill(battle.selectedSkillId);
  const charm = getBattleFlowV2Charm(battle.selectedCharmId);
  if (!skill) {
    renderBattleSkillSelectionPanel();
    return;
  }
  if (!charm) {
    renderBattleCharmSelectionPanel();
    return;
  }

  battle.playerActionPhase = "charge";
  battle.selectedChargePercent = 0;
  battle.isCharging = false;
  battle.isAttacking = false;
  battle.isResolvingTurn = false;
  els.battleMessage.textContent = `ชาร์จพลัง ${skill.thaiName} แล้วปล่อยเพื่อโจมตีอัตโนมัติ`;

  const controls = ensureBattleFlowV2ChargeControls();
  controls.innerHTML = `
    <div class="battle-flow-v2-panel battle-charge-panel">
      <div class="battle-flow-v2-header">
        <span>ชาร์จพลังโจมตี</span>
        <strong>${skill.thaiName}</strong>
      </div>
      <p class="battle-flow-v2-hint">ชาม: ${charm.thaiName || charm.name}</p>
      <div class="battle-flow-v2-actions">
        <button type="button" class="secondary-button" id="battleFlowV2BackToCharm">กลับไปเลือกชาม</button>
      </div>
    </div>
  `;
  controls.querySelector("#battleFlowV2BackToCharm")?.addEventListener("click", () => {
    cleanupGrammariaCharge();
    renderBattleCharmSelectionPanel();
  });

  showOnlyBattlePanel(els.chargePanel);
  setupGrammariaCharge({
    label: skill.thaiName,
    onComplete: chargePercent => {
      const currentBattle = state.actBattle;
      if (!currentBattle || currentBattle.playerActionPhase !== "charge" || currentBattle.isResolvingTurn) {
        return;
      }
      currentBattle.selectedChargePercent = clamp(Math.round(Number(chargePercent) || 0), 0, BATTLE_FLOW_V2_CONFIG.maxChargePercent);
      battleFlowV2Log("charge selected", { chargePercent: currentBattle.selectedChargePercent });
      confirmBattleFlowV2Attack();
    }
  });
}

function confirmBattleFlowV2Attack() {
  const battle = state.actBattle;
  if (!battle || battle.playerActionPhase !== "charge") {
    return;
  }

  const skill = getBattleFlowV2Skill(battle.selectedSkillId);
  const charm = getBattleFlowV2Charm(battle.selectedCharmId);
  if (!skill) {
    els.battleMessage.textContent = "ยังไม่ได้เลือกสกิล";
    renderBattleSkillSelectionPanel();
    return;
  }
  if (!charm) {
    els.battleMessage.textContent = "ยังไม่ได้เลือกชาม";
    renderBattleCharmSelectionPanel();
    return;
  }
  if (getBattlePlayerAp() < skill.apCost) {
    els.battleMessage.textContent = `AP ไม่พอสำหรับ ${skill.thaiName}`;
    renderBattleSkillSelectionPanel();
    return;
  }

  resolveBattleFlowV2PlayerAttack({
    skill,
    charm,
    chargePercent: battle.selectedChargePercent || 0
  });
}

function getBattleFlowV2BaseDamage(answerResult) {
  const battle = state.actBattle;
  if (battle?.pendingPlayerAttack?.baseDamage) {
    return battle.pendingPlayerAttack.baseDamage;
  }
  return answerResult?.isCorrect ? 16 : 8;
}

function calculateBattleFlowV2Damage({ baseDamage, answerResult, skill, charm, chargePercent }) {
  const isCorrect = Boolean(answerResult?.isCorrect);
  let workingDamage = Number(baseDamage || 0);
  if (!Number.isFinite(workingDamage) || workingDamage <= 0) {
    workingDamage = 1;
  }

  if (!isCorrect) {
    workingDamage *= BATTLE_FLOW_V2_CONFIG.wrongAnswerDamageMultiplier;
  }
  workingDamage *= Number(skill?.damageMultiplier || 1);
  if (isCorrect && skill?.correctAnswerBonusPercent) {
    workingDamage *= 1 + Number(skill.correctAnswerBonusPercent || 0) / 100;
  }

  let bowlBonus = { totalDamage: Math.round(workingDamage), grammariaBonus: 0, isCrit: false, stunChance: 0, bonusLines: [] };
  if (charm?.effectType) {
    const bonusLines = [`ชาม ${charm.name || charm.thaiName}`];
    const charmDamage = calculateCharmDamage(charm, Math.max(1, Math.round(workingDamage)), bonusLines);
    bowlBonus = {
      ...charmDamage,
      bonusLines
    };
    workingDamage = charmDamage.totalDamage;
  }

  if (charm?.damageBonusPercent) {
    workingDamage *= 1 + Number(charm.damageBonusPercent || 0) / 100;
  }
  if (isCorrect && charm?.correctAnswerDamageBonusPercent) {
    workingDamage *= 1 + Number(charm.correctAnswerDamageBonusPercent || 0) / 100;
  }

  const effectiveChargePercent = Math.min(
    BATTLE_FLOW_V2_CONFIG.maxChargePercent,
    Math.max(
      0,
      Number(chargePercent || 0) +
        Number(skill?.chargeEfficiencyBonusPercent || 0) +
        Number(charm?.chargeBonusPercent || 0)
    )
  );
  workingDamage *= 1 + effectiveChargePercent / 100;

  return {
    finalDamage: Math.max(1, Math.round(workingDamage)),
    isCorrect,
    skillId: skill?.id || "",
    charmId: charm?.id || "",
    chargePercent: effectiveChargePercent,
    answerMultiplier: isCorrect ? 1 : BATTLE_FLOW_V2_CONFIG.wrongAnswerDamageMultiplier,
    grammariaBonus: bowlBonus.grammariaBonus || 0,
    isCrit: Boolean(bowlBonus.isCrit),
    stunChance: bowlBonus.stunChance || 0,
    bypassBossShield: Boolean(bowlBonus.bypassBossShield),
    bonusLines: bowlBonus.bonusLines || []
  };
}

function applyBattleFlowV2SkillEffects({ skill, charm }) {
  const battle = state.actBattle;
  if (!battle) {
    return;
  }

  if (skill?.applyBossWeakenPercent) {
    battle.bossWeakenedPercent = Math.max(
      Number(battle.bossWeakenedPercent || 0),
      Number(skill.applyBossWeakenPercent || 0)
    );
  }
  if (charm?.nextDamageReductionPercent) {
    battle.playerNextDamageReductionPercent = Math.max(
      Number(battle.playerNextDamageReductionPercent || 0),
      Number(charm.nextDamageReductionPercent || 0)
    );
  }
}

function showBattleFlowV2AttackFeedback({ skill, charm, damageResult }) {
  const skillLines = {
    coreSpark: "เศษพลังจาก Grammar Core สว่างขึ้น — ประกายแกนไวยากรณ์พุ่งเข้าใส่ศัตรู!",
    syntaxBlade: "โครงสร้างภาษาเรียงตัวเป็นคมดาบ — คมวากยสัมพันธ์ฟาดผ่านศัตรู!",
    grammariaSurge: "เศษแกนแกรมมาเรียปลดคลื่นพลัง — คลื่นแกรมมาเรียซัดเข้าใส่ศัตรูอย่างรุนแรง!"
  };
  const lines = [
    skillLines[skill.id] || `${skill.thaiName} พุ่งเข้าใส่ศัตรู!`,
    `ชาม: ${charm.thaiName || charm.name}`,
    `สร้างความเสียหาย ${damageResult.finalDamage} หน่วย`
  ];
  if (!damageResult.isCorrect) {
    lines.push("คำตอบยังไม่มั่นคง พลังโจมตีจึงลดลง");
  }
  if (damageResult.chargePercent > 0) {
    lines.push(`พลังชาร์จ ${damageResult.chargePercent}% เสริมการโจมตี`);
  }
  (damageResult.bonusLines || []).forEach(line => lines.push(line));
  els.battleMessage.textContent = lines.join("\n");
}

function applyCharmPostAttackEffect(charm, context = {}) {
  const battle = context.battle || state.actBattle;
  const lines = context.lines || [];
  const result = { extraTurn: false };
  if (!battle || !charm) {
    return result;
  }

  if (charm.effectType === "extraTurnChance") {
    const chance = clamp(Number(charm.value || 0), 0, 1);
    if (Math.random() < chance) {
      result.extraTurn = true;
      addBattleMessageLine(lines, "Time Skip ทำงาน! ได้เล่นต่อทันที");
    } else {
      addBattleMessageLine(lines, "Time Skip ไม่ทำงานในครั้งนี้");
    }
  }

  return result;
}

function cleanupBattleSkillEffects() {
  const layer = document.getElementById("battleSkillEffectLayer");
  layer?.querySelectorAll(".skill-effect-projectile").forEach(effect => effect.remove());
  els.battleEnemySprite?.classList.remove("boss-hit-flash", "boss-hit-flash-strong");
  state.isSkillEffectPlaying = false;
}

function getBattleSkillEffectLayer() {
  const stage = document.querySelector("#battleScene .battlefield-stage");
  if (!stage) {
    return null;
  }
  let layer = document.getElementById("battleSkillEffectLayer");
  if (!layer) {
    layer = document.createElement("div");
    layer.id = "battleSkillEffectLayer";
    layer.className = "battle-skill-effect-layer";
    stage.appendChild(layer);
  }
  return layer;
}

function getBattleEffectPoint(element, layer, xRatio, yRatio) {
  if (!element || !layer) {
    return null;
  }
  const rect = element.getBoundingClientRect();
  const layerRect = layer.getBoundingClientRect();
  if (!rect.width || !rect.height || !layerRect.width || !layerRect.height) {
    return null;
  }
  return {
    x: rect.left - layerRect.left + rect.width * xRatio,
    y: rect.top - layerRect.top + rect.height * yRatio
  };
}

function triggerBattleBossHitFlash(skillId = "") {
  const sprite = els.battleEnemySprite;
  if (!sprite) {
    return;
  }
  sprite.classList.remove("boss-hit-flash", "boss-hit-flash-strong");
  void sprite.offsetWidth;
  sprite.classList.add("boss-hit-flash");
  if (skillId === "grammariaSurge") {
    sprite.classList.add("boss-hit-flash-strong");
  }
  window.setTimeout(() => {
    sprite.classList.remove("boss-hit-flash", "boss-hit-flash-strong");
  }, skillId === "grammariaSurge" ? 260 : 220);
}

function playBattleSkillEffect(skillId = "") {
  const assetPath = PLAYER_SKILL_EFFECT_ASSETS[skillId];
  const config = PLAYER_SKILL_EFFECT_CONFIG[skillId] || PLAYER_SKILL_EFFECT_CONFIG.coreSpark;
  const layer = getBattleSkillEffectLayer();
  if (!assetPath || !layer || !els.battlePlayerSprite || !els.battleEnemySprite) {
    if (skillId && !assetPath) {
      console.warn("[BattleSkillEffect] unknown skill effect id", skillId);
    }
    return Promise.resolve(false);
  }

  cleanupBattleSkillEffects();
  state.isSkillEffectPlaying = true;
  const start = getBattleEffectPoint(els.battlePlayerSprite, layer, 0.58, 0.42);
  const end = getBattleEffectPoint(els.battleEnemySprite, layer, 0.5, 0.5);
  if (!start || !end) {
    state.isSkillEffectPlaying = false;
    return Promise.resolve(false);
  }

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const duration = reducedMotion ? 120 : config.duration;
  const impactMs = Math.max(80, Math.round(duration * config.impactRatio));

  const projectile = document.createElement("img");
  projectile.className = `skill-effect-projectile ${config.className}`;
  projectile.alt = "";
  projectile.draggable = false;
  projectile.decoding = "async";
  projectile.style.width = typeof config.width === "number" ? `${config.width}px` : config.width;
  projectile.style.left = `${start.x}px`;
  projectile.style.top = `${start.y}px`;
  projectile.style.setProperty("--skill-effect-angle", `${angle}deg`);
  projectile.style.setProperty("--skill-effect-scale", String(config.scale || 1));

  let impactResolved = false;
  let finishedResolved = false;
  let started = false;
  const resolveImpact = value => {
    if (impactResolved) {
      return;
    }
    impactResolved = true;
    triggerBattleBossHitFlash(skillId);
    return value;
  };
  const finishEffect = value => {
    if (finishedResolved) {
      return;
    }
    finishedResolved = true;
    projectile.remove();
    state.isSkillEffectPlaying = false;
    return value;
  };

  return new Promise(resolve => {
    const startAnimation = () => {
      if (started || !document.body.contains(projectile)) {
        return;
      }
      started = true;
      const baseTransform = `translate(-50%, -50%) rotate(${angle}deg) scale(${config.scale || 1})`;
      const introTransform = `translate(-50%, -50%) rotate(${angle}deg) scale(${(config.scale || 1) * 0.82})`;
      const impactTransform = `translate(-50%, -50%) rotate(${angle}deg) scale(${(config.scale || 1) * 1.05})`;
      const keyframes = [
        { left: `${start.x}px`, top: `${start.y}px`, opacity: 0, transform: introTransform },
        { left: `${start.x + dx * 0.12}px`, top: `${start.y + dy * 0.12}px`, opacity: 1, transform: baseTransform, offset: 0.16 },
        { left: `${end.x}px`, top: `${end.y}px`, opacity: 0.96, transform: impactTransform, offset: config.impactRatio },
        { left: `${end.x + dx * 0.05}px`, top: `${end.y + dy * 0.05}px`, opacity: 0, transform: impactTransform }
      ];

      window.setTimeout(() => {
        resolveImpact(true);
        resolve(true);
      }, impactMs);

      if (typeof projectile.animate === "function") {
        const animation = projectile.animate(keyframes, {
          duration,
          easing: "cubic-bezier(0.18, 0.78, 0.24, 1)",
          fill: "forwards"
        });
        animation.finished
          .catch(() => false)
          .finally(() => finishEffect(true));
      } else {
        projectile.style.transition = `left ${duration}ms cubic-bezier(0.18, 0.78, 0.24, 1), top ${duration}ms cubic-bezier(0.18, 0.78, 0.24, 1), opacity ${duration}ms ease-out, transform ${duration}ms ease-out`;
        projectile.style.opacity = "1";
        projectile.style.transform = baseTransform;
        window.requestAnimationFrame(() => {
          projectile.style.left = `${end.x}px`;
          projectile.style.top = `${end.y}px`;
          projectile.style.transform = impactTransform;
        });
        window.setTimeout(() => finishEffect(true), duration + 40);
      }
    };

    projectile.addEventListener("error", () => {
      console.warn("[BattleSkillEffect] missing or failed effect asset", assetPath);
      finishEffect(false);
      resolve(false);
    }, { once: true });

    projectile.addEventListener("load", () => {
      window.requestAnimationFrame(() => startAnimation());
    }, { once: true });

    layer.appendChild(projectile);
    projectile.src = assetPath;
    if (projectile.complete && projectile.naturalWidth > 0) {
      window.requestAnimationFrame(() => startAnimation());
    }
    window.setTimeout(() => {
      if (!started && !impactResolved && document.body.contains(projectile)) {
        console.warn("[BattleSkillEffect] effect asset did not become ready in time", assetPath);
        resolveImpact(false);
        resolve(false);
        finishEffect(false);
      }
    }, Math.max(duration + 300, 1600));
  });
}

function applyCharmParryEffect({ grade, damage, counterDamage, action, lines = [] }) {
  const effects = state.battleActiveEffects || {};
  const normalizedGrade = String(grade || "").toUpperCase();
  const isGoodOrPerfect = normalizedGrade === "GOOD" || normalizedGrade === "PERFECT";
  let nextDamage = Math.max(0, Math.round(Number(damage) || 0));
  let nextCounterDamage = Math.max(0, Math.round(Number(counterDamage) || 0));

  if (isGoodOrPerfect && effects.blockIfGoodParry) {
    nextDamage = 0;
    effects.blockIfGoodParry = Math.max(0, effects.blockIfGoodParry - 1);
    addBattleMessageLine(lines, "โล่แกรมมาเรียบล็อกดาเมจจาก Parry สำเร็จ");
  }

  if (isGoodOrPerfect && effects.counterOnGoodParry) {
    const bonusCounter = Math.max(1, Math.round((action?.damage || 1) * effects.counterOnGoodParry));
    nextCounterDamage += bonusCounter;
    effects.counterOnGoodParry = 0;
    addBattleMessageLine(lines, `พลังชามทำให้ Counter แรงขึ้น +${bonusCounter}`);
  }

  if (normalizedGrade === "PERFECT" && effects.perfectParryNextDamage) {
    effects.perfectParryDamageBonus = Math.max(effects.perfectParryDamageBonus || 0, effects.perfectParryNextDamage);
    effects.perfectParryNextDamage = 0;
    addBattleMessageLine(lines, "Perfect Parry ชาร์จพลังโจมตีครั้งถัดไป");
  }

  if (normalizedGrade === "PERFECT" && effects.stunOnPerfectParry) {
    nextCounterDamage = Math.round(nextCounterDamage * (effects.perfectTimelineCounterMultiplier || 2));
    tryStunBoss(1, lines);
    effects.stunOnPerfectParry = 0;
    effects.perfectTimelineCounterMultiplier = 1;
    addBattleMessageLine(lines, "Perfect Timeline ทำงาน");
  }

  if (effects.reflectNextBossAttack) {
    const reflectedDamage = Math.max(1, Math.round((action?.damage || 1) * effects.reflectNextBossAttack));
    nextCounterDamage += reflectedDamage;
    effects.reflectNextBossAttack = 0;
    addBattleMessageLine(lines, `คำสาปย้อนกลับสะท้อนดาเมจ +${reflectedDamage}`);
  }

  return { damage: nextDamage, counterDamage: nextCounterDamage };
}

function resetBattleFlowV2Selection({ phase = "bossTurn", cleanupCharge = true } = {}) {
  const battle = state.actBattle;
  if (!battle) {
    return;
  }

  battle.pendingPlayerAnswer = null;
  battle.pendingPlayerAttack = null;
  battle.selectedSkillId = "";
  battle.selectedCharmId = "";
  battle.selectedChargePercent = 0;
  battle.pendingAttackData = null;
  battle.skillFlowLocked = false;
  battle.isCharging = false;
  battle.isAttacking = false;
  battle.isResolvingTurn = false;
  battle.playerActionPhase = phase;
  if (cleanupCharge) {
    cleanupGrammariaCharge();
  }
}

async function resolveBattleFlowV2PlayerAttack({ skill, charm, chargePercent }) {
  const battle = state.actBattle;
  if (!battle || battle.skillFlowLocked || battle.isResolvingTurn) {
    return;
  }

  battle.skillFlowLocked = true;
  battle.isResolvingTurn = true;
  battle.isAttacking = true;
  battle.playerActionPhase = "attackResolve";
  const answerResult = battle.pendingPlayerAnswer;
  if (!answerResult) {
    console.warn("[BattleFlowV2] missing pending answer");
    battle.skillFlowLocked = false;
    battle.isResolvingTurn = false;
    battle.isAttacking = false;
    beginActPlayerTurn("เกิดข้อผิดพลาดในการโจมตี ลองตอบคำถามใหม่อีกครั้ง");
    return;
  }

  if (!spendBattlePlayerAp(skill.apCost)) {
    battle.skillFlowLocked = false;
    battle.isResolvingTurn = false;
    battle.isAttacking = false;
    els.battleMessage.textContent = `AP ไม่พอสำหรับ ${skill.thaiName}`;
    renderBattleSkillSelectionPanel();
    return;
  }
  applySkillCooldownAfterUse(skill.id, battle);

  const baseDamage = getBattleFlowV2BaseDamage(answerResult);
  const damageResult = calculateBattleFlowV2Damage({
    baseDamage,
    answerResult,
    skill,
    charm,
    chargePercent
  });

  applyBattleFlowV2SkillEffects({ skill, charm, answerResult, damageResult });
  triggerMotion(els.battlePlayer, "player-attack-motion");
  await playBattleSkillEffect(skill.id);
  if (!state.actBattle || state.actBattle !== battle || isActBattleEnded(battle)) {
    cleanupBattleSkillEffects();
    battle.skillFlowLocked = false;
    battle.isResolvingTurn = false;
    battle.isAttacking = false;
    return;
  }
  const rawPlayerDamage = damageResult.finalDamage;
  const bossDamageModifiers = applyStatusDamageToTarget("boss", rawPlayerDamage, "battleFlowV2Skill", {
    skillId: skill.id,
    charmId: charm.id,
    chargePercent: damageResult.chargePercent,
    bypassShield: damageResult.bypassBossShield
  });
  damageResult.rawFinalDamage = rawPlayerDamage;
  damageResult.finalDamage = bossDamageModifiers.finalDamage;
  appendDamageModifierLines(damageResult.bonusLines, "boss", bossDamageModifiers);
  if (damageResult.finalDamage > 0) {
    addStunGauge("boss", getSkillStunBuild(skill, damageResult), `skill:${skill.id}`, damageResult.bonusLines);
  }
  const rawChargePercent = clamp(Math.round(Number(chargePercent) || 0), 0, BATTLE_FLOW_V2_CONFIG.maxChargePercent);
  if (rawChargePercent > 0) {
    recordGrammariaChargeUse(rawChargePercent);
    recordChargeBonusDamage(Math.round(baseDamage * (rawChargePercent / 100)));
  }
  triggerEnemyHitFeedback(damageResult.finalDamage);

  tryStunBoss(damageResult.stunChance || 0, damageResult.bonusLines || []);
  const postEffectLines = [];
  const postEffectResult = applyCharmPostAttackEffect(charm, {
    battle,
    damageResult,
    lines: postEffectLines
  });
  damageResult.bonusLines.push(...postEffectLines);

  const grammariaGain = (battle.pendingPlayerAttack?.grammariaGain || 0) + (damageResult.grammariaBonus || 0);
  if (grammariaGain > 0) {
    state.grammaria += grammariaGain;
  }
  clearFocusBuffAfterAttack(battle);
  resetBattleFlowV2Selection({ phase: "bossTurn", cleanupCharge: true });
  updateBattleStats();
  syncBattleStateToPlayerData();
  showOnlyBattlePanel(null);
  showBattleFlowV2AttackFeedback({ skill, charm, damageResult });
  if (grammariaGain > 0) {
    els.battleMessage.textContent += `\nได้รับ Grammaria +${grammariaGain}`;
  }

  battleFlowV2Log("attack resolved", {
    skillId: skill.id,
    charmId: charm.id,
    apCost: skill.apCost,
    finalDamage: damageResult.finalDamage,
    enemyHp: state.enemyHp
  });

  if (state.enemyHp <= 0) {
    completePlayerSkillCooldownTurn(battle);
    battle.skillFlowLocked = false;
    battle.isResolvingTurn = false;
    battle.isAttacking = false;
    handleActEnemyDefeated("battleFlowV2Skill");
    return;
  }

  if (postEffectResult.extraTurn) {
    completePlayerSkillCooldownTurn(battle);
    battle.skillFlowLocked = false;
    battle.isResolvingTurn = false;
    battle.isAttacking = false;
    battle.playerActionPhase = "question";
    setBattleTurnOwner("player");
    showBattleContinueButton(
      battle.questionIndex >= battle.stage.questions.length - 1 ? "รับรางวัล" : "คำถามถัดไป",
      continueActBattle
    );
    return;
  }

  completePlayerSkillCooldownTurn(battle);
  battle.skillFlowLocked = false;
  battle.isResolvingTurn = false;
  battle.isAttacking = false;
  els.continueBattleButton.classList.add("hidden");
  battle.pendingBossAction = chooseActBossAction(battle);
  setTimeout(startActBossWarning, 900);
}

function showActCharmChoices() {
  const battle = state.actBattle;
  if (!battle || !battle.pendingPlayerAttack) {
    return;
  }

  els.charmPanel.querySelector("h3").textContent = "เลือกเครื่องรางเวท 1 ชิ้น";
  els.charmOptions.innerHTML = "";
  els.charmOptions.classList.remove("battle-flow-v2-options");
  selectRandomActCharms().forEach(charm => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `charm-card rank-${charm.rank.toLowerCase()}`;
    const rankLabel = charmRankMeta[charm.rank] || charmRankMeta.C;
    button.innerHTML = `
      <span class="charm-topline">
        <span class="charm-icon" aria-hidden="true">${charm.icon || "✦"}</span>
        <span class="charm-rank">${rankLabel.label}</span>
      </span>
      <strong>${charm.name}</strong>
      <span class="charm-description">${charm.description || charm.effect}</span>
    `;
    button.addEventListener("click", () => chooseActCharmV2(charm));
    els.charmOptions.appendChild(button);
  });

  showOnlyBattlePanel(els.charmPanel);
}

function getBossKey(stage) {
  if (!stage) {
    return null;
  }
  if (stage.id === "ed-mini-boss" || stage.enemy === "The -ed Forger") {
    return "edForger";
  }
  if (stage.id === "irregular-mini-boss" || stage.enemy === "The Irregular Wraith") {
    return "irregularWraith";
  }
  if (isFinalBossStage(stage)) {
    return "memoryBreaker";
  }
  return null;
}

function createBossGrammarChallengeState() {
  return {
    active: false,
    mode: "normal",
    word: null,
    inputLocked: false,
    resolved: false,
    consecutiveSpecialCount: 0,
    recentWordIds: [],
    arrangementTiles: [],
    selectedTileIds: []
  };
}

function createBossQuestionState() {
  return {
    active: false,
    inputLocked: false,
    resolved: false,
    questionId: ""
  };
}

function normalizeV2Answer(value = "") {
  return String(value).trim().toLowerCase().replace(/\s+/g, "");
}

function addRecentBossV2Word(challenge, wordId) {
  if (!challenge || !wordId) {
    return;
  }
  if (!Array.isArray(challenge.recentWordIds)) {
    challenge.recentWordIds = [];
  }
  challenge.recentWordIds = challenge.recentWordIds.filter(id => id !== wordId);
  challenge.recentWordIds.push(wordId);
  const limit = BOSS_GRAMMAR_CHALLENGE_CONFIG.recentWordLimit;
  if (challenge.recentWordIds.length > limit) {
    challenge.recentWordIds = challenge.recentWordIds.slice(-limit);
  }
}

function resetActiveBossGrammarChallenge({ keepSession = true } = {}) {
  const challenge = state.actBattle?.bossGrammarChallenge;
  if (!challenge) {
    return;
  }
  const consecutiveSpecialCount = keepSession ? challenge.consecutiveSpecialCount : 0;
  const recentWordIds = keepSession && Array.isArray(challenge.recentWordIds) ? [...challenge.recentWordIds] : [];
  Object.assign(challenge, createBossGrammarChallengeState(), {
    consecutiveSpecialCount,
    recentWordIds
  });
}

function getCompletedLessonSetForBossChallenges() {
  const progress = ensureActProgress();
  if (progress) {
    validateProgress(progress);
  }
  const completed = new Set();
  [
    progress?.completedLessons,
    progress?.completedStages
  ].forEach(list => {
    if (!Array.isArray(list)) {
      return;
    }
    list.forEach(id => {
      if (id) {
        completed.add(id);
      }
    });
  });
  return completed;
}

function hasTaughtBossV2Word(word, completedSet, stage) {
  if (!word || !completedSet) {
    return false;
  }
  const bossKey = getBossKey(stage);
  const stageId = stage?.id || "";
  if (bossKey === "edForger" && word.group === "regular" && stageId === "ed-mini-boss") {
    return true;
  }
  if (bossKey === "irregularWraith" && word.group === "irregular" && stageId === "irregular-mini-boss") {
    return true;
  }
  if (bossKey === "memoryBreaker") {
    return word.lessonTags.some(tag => completedSet.has(tag)) ||
      (word.group === "regular" && completedSet.has("ed-mini-boss")) ||
      (word.group === "irregular" && completedSet.has("irregular-mini-boss"));
  }
  return word.lessonTags.some(tag => completedSet.has(tag));
}

function getEligibleBossV2Words(stage, challenge) {
  const bossKey = getBossKey(stage);
  if (!BOSS_GRAMMAR_CHALLENGE_CONFIG.enabled || !bossKey) {
    return [];
  }

  const completedSet = getCompletedLessonSetForBossChallenges();
  let allowedGroups = [];
  if (bossKey === "edForger") {
    allowedGroups = ["regular"];
  } else if (bossKey === "irregularWraith") {
    allowedGroups = ["irregular"];
  } else if (bossKey === "memoryBreaker") {
    allowedGroups = ["regular", "irregular"];
  }

  const taughtWords = BOSS_V2_CHALLENGE_WORDS.filter(word =>
    allowedGroups.includes(word.group) &&
    hasTaughtBossV2Word(word, completedSet, stage)
  );
  if (!taughtWords.length) {
    return [];
  }

  const recentIds = new Set(challenge?.recentWordIds || []);
  const freshWords = taughtWords.filter(word => !recentIds.has(word.id));
  return freshWords.length ? freshWords : taughtWords;
}

function chooseBossV2ChallengeWord(stage, challenge) {
  const eligibleWords = getEligibleBossV2Words(stage, challenge);
  return sample(eligibleWords, 1)[0] || null;
}

function getEnemyActionHistory(battle) {
  if (!battle.enemyActionHistory) {
    battle.enemyActionHistory = {
      lastMode: "",
      consecutiveCount: 0,
      actions: [],
      turnsSinceTyping: 0,
      turnsSinceArrangement: 0
    };
  }
  if (!Array.isArray(battle.enemyActionHistory.actions)) {
    battle.enemyActionHistory.actions = [];
  }
  battle.enemyActionHistory.turnsSinceTyping = Number(battle.enemyActionHistory.turnsSinceTyping || 0);
  battle.enemyActionHistory.turnsSinceArrangement = Number(battle.enemyActionHistory.turnsSinceArrangement || 0);
  return battle.enemyActionHistory;
}

function hasEnemyQuestionAvailable(stage) {
  return getEnemyQuestionBank(stage).questions.length > 0;
}

function supportsBossGrammarChallenges(battle) {
  return Boolean(battle && getBossKey(battle.stage));
}

function getEligibleEnemyActionModes(battle) {
  if (!battle || isActBattleEnded(battle)) {
    return [];
  }

  const modes = [];
  if (hasEnemyQuestionAvailable(battle.stage)) {
    modes.push("question");
  }
  modes.push("normalAttack");

  const challenge = battle.bossGrammarChallenge || createBossGrammarChallengeState();
  const hasEligibleV2Words = supportsBossGrammarChallenges(battle) &&
    Boolean(chooseBossV2ChallengeWord(battle.stage, challenge));
  if (hasEligibleV2Words && !challenge.active) {
    modes.push("typing", "arrangement");
  }

  const history = getEnemyActionHistory(battle);
  if (
    history.lastMode &&
    history.consecutiveCount >= BOSS_ACTION_FAIRNESS_CONFIG.maxConsecutiveChallengeModes &&
    history.lastMode !== "normalAttack" &&
    modes.length > 1
  ) {
    return modes.filter(mode => mode !== history.lastMode);
  }
  return modes;
}

function getBossActionWeightsForBattle(battle) {
  return supportsBossGrammarChallenges(battle)
    ? BOSS_ACTION_BASE_WEIGHTS
    : ENEMY_ACTION_WEIGHTS;
}

function getWeightedEnemyActionEntries(battle, modes, weights = getBossActionWeightsForBattle(battle)) {
  const history = getEnemyActionHistory(battle);
  return modes
    .map(mode => {
      let weight = Math.max(0, Number(weights[mode]) || 0);
      if (
        mode === "typing" &&
        history.turnsSinceTyping >= BOSS_ACTION_FAIRNESS_CONFIG.pityEligibleTurns
      ) {
        weight += BOSS_ACTION_FAIRNESS_CONFIG.pityBoost;
      }
      if (
        mode === "arrangement" &&
        history.turnsSinceArrangement >= BOSS_ACTION_FAIRNESS_CONFIG.pityEligibleTurns
      ) {
        weight += BOSS_ACTION_FAIRNESS_CONFIG.pityBoost;
      }
      return { mode, weight };
    })
    .filter(item => item.weight > 0);
}

function normalizeEnemyActionWeights(entries) {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  if (!Number.isFinite(total) || total <= 0) {
    return [];
  }
  return entries.map(entry => ({
    ...entry,
    weight: entry.weight / total
  }));
}

function selectWeightedEnemyActionMode(battle, modes, weights = getBossActionWeightsForBattle(battle)) {
  const safeModes = Array.isArray(modes) ? modes : [];
  const weightedModes = safeModes.length
    ? getWeightedEnemyActionEntries(battle, safeModes, weights)
    : [];
  if (!weightedModes.length) {
    return safeModes.includes("normalAttack") ? "normalAttack" : safeModes[0] || "normalAttack";
  }

  const normalizedModes = normalizeEnemyActionWeights(weightedModes);
  if (!normalizedModes.length) {
    return safeModes.includes("normalAttack") ? "normalAttack" : safeModes[0] || "normalAttack";
  }

  const roll = Math.random();
  let cumulative = 0;
  for (const item of normalizedModes) {
    cumulative += item.weight;
    if (roll < cumulative) {
      return item.mode;
    }
  }
  return normalizedModes[normalizedModes.length - 1].mode;
}

function recordEnemyActionMode(battle, mode, eligibleModes = []) {
  const history = getEnemyActionHistory(battle);
  if (history.lastMode === mode) {
    history.consecutiveCount += 1;
  } else {
    history.lastMode = mode;
    history.consecutiveCount = 1;
  }
  history.actions.push(mode);
  if (history.actions.length > BOSS_ACTION_FAIRNESS_CONFIG.historyLimit) {
    history.actions = history.actions.slice(-BOSS_ACTION_FAIRNESS_CONFIG.historyLimit);
  }
  if (eligibleModes.includes("typing")) {
    history.turnsSinceTyping = mode === "typing" ? 0 : history.turnsSinceTyping + 1;
  }
  if (eligibleModes.includes("arrangement")) {
    history.turnsSinceArrangement = mode === "arrangement" ? 0 : history.turnsSinceArrangement + 1;
  }
}

function createArrangementTiles(answer) {
  return String(answer)
    .split("")
    .map((char, index) => ({ id: `${char}-${index}-${Math.random().toString(36).slice(2, 6)}`, char, originalIndex: index }));
}

function startBossGrammarChallengeIfEligible() {
  const battle = state.actBattle;
  const challenge = battle?.bossGrammarChallenge;
  if (!battle || !challenge || !battle.pendingBossTurn || !battle.pendingBossAction) {
    return false;
  }

  const forcedMode = battle.pendingBossAction.grammarChallengeMode;
  if (forcedMode !== "typing" && forcedMode !== "arrangement") {
    return false;
  }

  const word = chooseBossV2ChallengeWord(battle.stage, challenge);
  const mode = forcedMode;
  if (!word) {
    challenge.consecutiveSpecialCount = 0;
    return false;
  }

  Object.assign(challenge, {
    active: true,
    mode,
    word,
    inputLocked: false,
    resolved: false,
    arrangementTiles: mode === "arrangement" ? shuffleArray(createArrangementTiles(word.v2)) : [],
    selectedTileIds: []
  });
  challenge.consecutiveSpecialCount = (challenge.consecutiveSpecialCount || 0) + 1;
  addRecentBossV2Word(challenge, word.id);

  if (mode === "typing") {
    showBossTypingChallenge();
  } else {
    showBossArrangementChallenge();
  }
  return true;
}

function lockBossGrammarChallengeControls() {
  const challenge = state.actBattle?.bossGrammarChallenge;
  if (challenge) {
    challenge.inputLocked = true;
  }
  els.answerOptions.querySelectorAll("button, input").forEach(control => {
    control.disabled = true;
  });
}

function renderBossChallengeHeader(title, word) {
  els.questionText.innerHTML = `
    <span class="boss-v2-challenge-kicker">V1 → V2</span>
    <strong>${title}</strong>
    <span class="boss-v2-challenge-prompt">เปลี่ยน <b>${word.v1}</b> ให้เป็นรูปอดีต</span>
    <span class="boss-v2-challenge-hint">${word.hint}</span>
  `;
}

function showBossTypingChallenge() {
  const battle = state.actBattle;
  const challenge = battle?.bossGrammarChallenge;
  if (!battle || !challenge?.word) {
    return;
  }

  setBattleTurnOwner("enemy");
  showOnlyBattlePanel(els.questionPanel);
  els.continueBattleButton.classList.add("hidden");
  els.battleMessage.textContent = "บอสทดสอบรูปอดีต พิมพ์คำตอบแล้วกด ยืนยัน";
  renderBossChallengeHeader("Typing Answer Mode", challenge.word);
  els.answerOptions.innerHTML = "";

  const panel = document.createElement("div");
  panel.className = "boss-v2-challenge-panel boss-v2-typing-panel";
  const input = document.createElement("input");
  input.type = "text";
  input.className = "boss-v2-typing-input";
  input.autocomplete = "off";
  input.spellcheck = false;
  input.placeholder = "พิมพ์ V2 ที่นี่";
  input.setAttribute("aria-label", "พิมพ์คำตอบ V2");
  const confirmButton = document.createElement("button");
  confirmButton.type = "button";
  confirmButton.className = "answer-button boss-v2-confirm-button";
  confirmButton.textContent = "ยืนยัน";
  confirmButton.setAttribute("aria-label", "ยืนยัน");
  confirmButton.disabled = true;

  input.addEventListener("input", () => {
    confirmButton.disabled = challenge.inputLocked || !input.value.trim();
  });
  input.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
    }
  });
  confirmButton.addEventListener("click", () => confirmBossTypingChallenge(input.value));

  panel.append(input, confirmButton);
  els.answerOptions.appendChild(panel);
  input.focus({ preventScroll: true });
}

function confirmBossTypingChallenge(value) {
  const battle = state.actBattle;
  const challenge = battle?.bossGrammarChallenge;
  if (!battle || !challenge?.active || challenge.mode !== "typing" || challenge.resolved || challenge.inputLocked) {
    return;
  }

  const answer = normalizeV2Answer(value);
  if (!answer) {
    return;
  }

  challenge.resolved = true;
  lockBossGrammarChallengeControls();
  const isCorrect = answer === normalizeV2Answer(challenge.word.v2);
  showBossGrammarChallengeFeedback(isCorrect, isCorrect
    ? `ถูกต้อง! ${challenge.word.v1} → ${challenge.word.v2}`
    : `ยังไม่ถูก ${challenge.word.v1} → ${challenge.word.v2}`);

  if (isCorrect) {
    window.setTimeout(() => {
      forceBossTurnToStoredDefenseOnly(battle);
      resetActiveBossGrammarChallenge({ keepSession: true });
      showBossIntentPanel(battle.pendingBossTurn);
    }, 650);
    return;
  }

  window.setTimeout(() => resolveBossGrammarDirectHit("typing"), 650);
}

function forceBossTurnToStoredDefenseOnly(battle) {
  if (!battle?.pendingBossTurn || !battle.pendingBossAction) {
    return;
  }
  const currentSequence = battle.pendingBossTurn.sequence?.length
    ? battle.pendingBossTurn.sequence
    : battle.pendingBossAction.sequence || ["attack"];
  const defenseSequence = currentSequence.filter(step => ["attack", "point", "heavy"].includes(step));
  battle.pendingBossTurn.sequence = defenseSequence.length
    ? defenseSequence
    : [chooseBossDefenseStep(battle.pendingBossAction, battle)];
  battle.pendingBossTurn.stepIndex = 0;
}

function showBossArrangementChallenge() {
  const battle = state.actBattle;
  const challenge = battle?.bossGrammarChallenge;
  if (!battle || !challenge?.word) {
    return;
  }

  setBattleTurnOwner("enemy");
  showOnlyBattlePanel(els.questionPanel);
  syncVisibleViewportHeight();
  els.questionPanel.classList.add("boss-v2-arrangement-active");
  scenes.battle.classList.add("arrangement-layout-active");
  els.continueBattleButton.classList.add("hidden");
  els.battleMessage.textContent = "เรียงตัวอักษรให้เป็น V2 แล้วกด ยืนยัน";
  renderBossChallengeHeader("Word Arrangement Mode", challenge.word);
  renderBossArrangementControls();
}

function renderBossArrangementControls() {
  const battle = state.actBattle;
  const challenge = battle?.bossGrammarChallenge;
  if (!battle || !challenge?.word || challenge.mode !== "arrangement") {
    return;
  }

  const selectedIds = new Set(challenge.selectedTileIds || []);
  const selectedTiles = challenge.selectedTileIds
    .map(id => challenge.arrangementTiles.find(tile => tile.id === id))
    .filter(Boolean);
  els.answerOptions.innerHTML = "";

  const panel = document.createElement("div");
  panel.className = "boss-v2-challenge-panel boss-v2-arrangement-panel";
  const answerRow = document.createElement("div");
  answerRow.className = "boss-v2-arrangement-answer";
  const selectedText = selectedTiles.map(tile => tile.char).join("");
  answerRow.textContent = selectedText || "แตะตัวอักษรเพื่อเรียงคำ";

  const tileRow = document.createElement("div");
  tileRow.className = "boss-v2-arrangement-tiles";
  challenge.arrangementTiles.forEach(tile => {
    if (selectedIds.has(tile.id)) {
      return;
    }
    const tileButton = document.createElement("button");
    tileButton.type = "button";
    tileButton.className = "boss-v2-letter-tile";
    tileButton.textContent = tile.char;
    tileButton.disabled = challenge.inputLocked;
    tileButton.addEventListener("click", () => {
      if (challenge.inputLocked || selectedIds.has(tile.id)) {
        return;
      }
      challenge.selectedTileIds.push(tile.id);
      renderBossArrangementControls();
    });
    tileRow.appendChild(tileButton);
  });

  const controlRow = document.createElement("div");
  controlRow.className = "boss-v2-arrangement-controls";
  const editControls = document.createElement("div");
  editControls.className = "boss-v2-arrangement-edit-controls";
  const undoButton = document.createElement("button");
  undoButton.type = "button";
  undoButton.className = "answer-button secondary";
  undoButton.textContent = "ย้อนหนึ่งตัว";
  undoButton.disabled = challenge.inputLocked || !challenge.selectedTileIds.length;
  undoButton.addEventListener("click", () => {
    if (challenge.inputLocked) {
      return;
    }
    challenge.selectedTileIds.pop();
    renderBossArrangementControls();
  });

  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className = "answer-button secondary";
  clearButton.textContent = "ล้างคำตอบ";
  clearButton.disabled = challenge.inputLocked || !challenge.selectedTileIds.length;
  clearButton.addEventListener("click", () => {
    if (challenge.inputLocked) {
      return;
    }
    challenge.selectedTileIds = [];
    renderBossArrangementControls();
  });

  const confirmButton = document.createElement("button");
  confirmButton.type = "button";
  confirmButton.className = "answer-button boss-v2-confirm-button";
  confirmButton.textContent = "ยืนยัน";
  confirmButton.setAttribute("aria-label", "ยืนยัน");
  confirmButton.disabled = challenge.inputLocked || challenge.selectedTileIds.length !== challenge.arrangementTiles.length;
  confirmButton.addEventListener("click", confirmBossArrangementChallenge);

  editControls.append(undoButton, clearButton);
  controlRow.append(editControls, confirmButton);
  panel.append(answerRow, tileRow, controlRow);
  els.answerOptions.appendChild(panel);
}

function confirmBossArrangementChallenge() {
  const battle = state.actBattle;
  const challenge = battle?.bossGrammarChallenge;
  if (!battle || !challenge?.active || challenge.mode !== "arrangement" || challenge.resolved || challenge.inputLocked) {
    return;
  }
  if (challenge.selectedTileIds.length !== challenge.arrangementTiles.length) {
    return;
  }

  challenge.resolved = true;
  lockBossGrammarChallengeControls();
  const answer = challenge.selectedTileIds
    .map(id => challenge.arrangementTiles.find(tile => tile.id === id)?.char || "")
    .join("");
  const isCorrect = normalizeV2Answer(answer) === normalizeV2Answer(challenge.word.v2);
  showBossGrammarChallengeFeedback(isCorrect, isCorrect
    ? `เรียงถูกต้อง! ${challenge.word.v1} → ${challenge.word.v2}`
    : `ยังไม่ถูก ${challenge.word.v1} → ${challenge.word.v2}`);

  if (isCorrect) {
    window.setTimeout(resolveBossGrammarCounterAttack, 650);
    return;
  }

  window.setTimeout(() => resolveBossGrammarDirectHit("arrangement"), 650);
}

function showBossGrammarChallengeFeedback(isCorrect, text) {
  const feedback = document.createElement("div");
  feedback.className = `answer-feedback ${isCorrect ? "correct" : "wrong"}`;
  feedback.innerHTML = `<strong>${isCorrect ? "ถูกต้อง!" : "ยังไม่ถูกต้อง"}</strong><br>${text}`;
  els.answerOptions.appendChild(feedback);
  els.battleMessage.textContent = isCorrect
    ? "เจ้าต้านโจทย์ของบอสได้สำเร็จ"
    : "บอสโจมตีทันที ไม่มีจังหวะ Parry";
}

function resolveBossGrammarDirectHit(mode) {
  const battle = state.actBattle;
  if (!battle || !battle.pendingBossAction || isActBattleEnded(battle)) {
    return;
  }

  const action = battle.pendingBossAction;
  resetActiveBossGrammarChallenge({ keepSession: true });
  showOnlyBattlePanel(null);
  setBattleTurnOwner("enemy");
  const rawDamage = Math.max(1, Number(action.damage || action.baseDamage || battle.stage?.enemyDamage || battle.stage?.bossDamage || 12));
  const playerDamageResult = applyStatusDamageToTarget("player", rawDamage, "bossV2ChallengeDirectHit", {
    mode,
    actionType: action.type,
    bypassParry: true
  });
  const feedbackLines = [];
  appendDamageModifierLines(feedbackLines, "player", playerDamageResult);
  applyBossMarkOnPlayerIfHit(action, playerDamageResult.finalDamage, feedbackLines);
  playAttackSfx();
  triggerMotion(els.battleEnemy, "enemy-attack-motion");
  updateBattleStats();
  syncBattleStateToPlayerData();
  els.battleMessage.textContent = `บอสโจมตีเข้าเต็ม ๆ รับดาเมจ ${playerDamageResult.finalDamage}`;
  if (feedbackLines.length) {
    els.battleMessage.textContent += `\n${feedbackLines.join("\n")}`;
  }

  if (resolvePlayerDefeat("HP เหลือ 0")) {
    return;
  }

  finalizeBossTurnState();
  showBattleContinueButton(
    battle.questionIndex >= battle.stage.questions.length - 1 ? "รับรางวัล" : "เทิร์นถัดไป",
    continueActBattle
  );
  battle.justRevived = false;
}

function resolveBossGrammarCounterAttack() {
  const battle = state.actBattle;
  if (!battle || !battle.pendingBossAction || isActBattleEnded(battle)) {
    return;
  }

  const challengeWord = battle.bossGrammarChallenge?.word;
  resetActiveBossGrammarChallenge({ keepSession: true });
  showOnlyBattlePanel(null);
  setBattleTurnOwner("enemy");
  const baseDamage = Number(battle.damagePerCorrect || 12);
  const counterDamage = clamp(
    Math.round(baseDamage * BOSS_GRAMMAR_CHALLENGE_CONFIG.counterDamageRatio),
    BOSS_GRAMMAR_CHALLENGE_CONFIG.counterDamageMin,
    BOSS_GRAMMAR_CHALLENGE_CONFIG.counterDamageMax
  );
  const bossDamageResult = applyStatusDamageToTarget("boss", counterDamage, "bossV2ArrangementCounter", {
    wordId: challengeWord?.id || "",
    noApCost: true,
    noReward: true
  });
  triggerMotion(els.battlePlayer, "player-attack-motion");
  triggerEnemyHitFeedback(bossDamageResult.finalDamage, "COUNTER");
  updateBattleStats();
  syncBattleStateToPlayerData();
  els.battleMessage.textContent = `เรียงคำสำเร็จ! เจ้าสวนกลับ ${bossDamageResult.finalDamage} ดาเมจ\nไม่มีการใช้ AP และไม่มีรางวัลพิเศษ`;

  if (state.enemyHp <= 0) {
    handleActEnemyDefeated("bossV2ArrangementCounter");
    return;
  }

  finalizeBossTurnState();
  showBattleContinueButton(
    battle.questionIndex >= battle.stage.questions.length - 1 ? "รับรางวัล" : "เทิร์นถัดไป",
    continueActBattle
  );
  battle.justRevived = false;
}

function getParryConfigForBoss(stage, action = null) {
  const bossKey = getBossKey(stage);
  const keyedConfig = bossKey ? BOSS_POINT_PARRY_CONFIGS[bossKey] || {} : {};
  const stageConfig = stage?.parryConfig || {};
  const config = {
    ...DEFAULT_POINT_PARRY_CONFIG,
    ...keyedConfig,
    ...stageConfig
  };

  if (stage?.parryEnabled === false || stageConfig.enabled === false) {
    config.enabled = false;
  }

  if (stage?.parryReward != null) {
    config.counterDamage = stage.parryReward;
  }

  const hpPercent = state.enemyMaxHp ? state.enemyHp / state.enemyMaxHp : 1;
  const lowHpThreshold = config.lowHpThreshold ?? 0.45;
  const isLowHp = hpPercent <= lowHpThreshold;

  if (isLowHp) {
    if (config.lowHpChance != null) {
      config.chance = config.lowHpChance;
    }
    if (config.lowHpTargetCount != null) {
      config.targetCount = config.lowHpTargetCount;
    }
    if (config.lowHpDuration != null) {
      config.duration = config.lowHpDuration;
    }
    if (config.lowHpSize != null) {
      config.size = config.lowHpSize;
    }
  }

  if (action?.type === "ultimate") {
    config.chance += config.ultimateChanceBonus || 0;
  }

  config.chance = clamp(config.chance, 0, 1);
  config.counterDamage = Math.max(0, Math.round(config.counterDamage || 0));
  return config;
}

function buildPointParryMessage(config, damage, result) {
  if (result === "PERFECT") {
    return (config.messageTemplate || DEFAULT_POINT_PARRY_CONFIG.messageTemplate).replace("{damage}", damage);
  }
  return null;
}

function getFocusQuestion(stage) {
  const battle = state.actBattle;
  if (!battle || !stage) {
    return null;
  }

  const stageQuestions = Array.isArray(stage.questions) ? stage.questions : [];
  const bossKey = getBossKey(stage);
  const bossBank = bossKey && bossQuestionBanks[bossKey]
    ? filterQuestionsForStage(bossQuestionBanks[bossKey], stage)
    : [];
  const rawPool = [...stageQuestions, ...bossBank].filter(Boolean);

  if (!rawPool.length) {
    return null;
  }

  const seenIds = new Set();
  const normalizedPool = rawPool.map((question, index) => {
    const baseId = getQuestionId(question, index, `focus-${stage.id || "stage"}`);
    const id = seenIds.has(baseId) ? `${baseId}-${index}` : baseId;
    seenIds.add(id);
    return { ...question, id };
  });

  if (!battle.usedFocusQuestionIds) {
    battle.usedFocusQuestionIds = new Set();
  }
  if (!Array.isArray(battle.recentFocusQuestionIds)) {
    battle.recentFocusQuestionIds = [];
  }

  const lastId = battle.lastFocusQuestionId || "";
  const lastBaseVerb = battle.lastFocusQuestionBaseVerb || "";
  let pool = normalizedPool.filter(question =>
    !battle.usedFocusQuestionIds.has(question.id) &&
    question.id !== lastId &&
    (!getQuestionBaseWord(question) || getQuestionBaseWord(question) !== lastBaseVerb)
  );

  if (!pool.length) {
    pool = normalizedPool.filter(question =>
      !battle.usedFocusQuestionIds.has(question.id) &&
      question.id !== lastId
    );
  }

  if (!pool.length) {
    battle.usedFocusQuestionIds.clear();
    pool = normalizedPool.filter(question => question.id !== lastId);
  }

  if (!pool.length) {
    pool = normalizedPool;
  }

  const question = sample(pool, 1)[0];
  if (!question) {
    return null;
  }

  battle.usedFocusQuestionIds.add(question.id);
  battle.lastFocusQuestionId = question.id;
  battle.lastFocusQuestionBaseVerb = getQuestionBaseWord(question);
  battle.focusQuestionIndex = (battle.focusQuestionIndex || 0) + 1;
  battle.recentFocusQuestionIds = [
    ...(battle.recentFocusQuestionIds || []),
    question.id
  ].slice(-5);

  return question;
}

function normalizeEnemyQuestionBank(questions, stage, source) {
  const stageId = stage?.id || "stage";
  return (questions || []).map((question, index) => ({
    ...question,
    id: getQuestionId(question, index, `enemy-${source}-${stageId}`)
  }));
}

function getEnemyQuestionBank(stage) {
  if (!stage) {
    return {
      source: "none",
      bossKey: null,
      questions: []
    };
  }

  const key = getBossKey(stage);
  const dedicatedBank = key && Array.isArray(bossQuestionBanks[key])
    ? normalizeEnemyQuestionBank(filterQuestionsForStage(bossQuestionBanks[key], stage), stage, "boss")
    : [];

  if (dedicatedBank.length) {
    return {
      source: "boss",
      bossKey: key,
      questions: dedicatedBank
    };
  }

  const stageBank = Array.isArray(stage.questions)
    ? normalizeEnemyQuestionBank(filterQuestionsForStage(stage.questions, stage), stage, "stage")
    : [];

  if (stageBank.length) {
    return {
      source: "stage",
      bossKey: key,
      questions: stageBank
    };
  }

  return {
    source: "none",
    bossKey: key,
    questions: []
  };
}

function getBossQuestion(stage) {
  const bankData = getEnemyQuestionBank(stage);
  const { source, bossKey: key, questions: bank } = bankData;
  if (!bank.length) {
    console.warn("[Enemy Question] No valid question bank available", {
      stageId: stage?.id,
      enemy: stage?.enemy,
      bossKey: key,
      source
    });
    return null;
  }

  const battle = state.actBattle;
  if (!battle) {
    return sample(bank, 1)[0];
  }

  if (!battle.usedBossQuestionIds || battle.usedBossQuestionIds.size > Math.floor(bank.length * 0.8)) {
    battle.usedBossQuestionIds = new Set();
  }

  const hasDifficultyMetadata = source === "boss" && bank.some(question => question.difficulty);
  const weights = bossDifficultyWeights[key] || { medium: 50, hard: 35, boss: 15 };
  const preferredDifficulty = hasDifficultyMetadata ? weightedPickFromTable(weights) : null;
  let pool = hasDifficultyMetadata
    ? bank.filter(question =>
      question.difficulty === preferredDifficulty &&
      !battle.usedBossQuestionIds.has(question.id) &&
      getQuestionBaseWord(question) !== battle.lastBossQuestionBaseVerb
    )
    : [];

  if (source === "boss" && key === "memoryBreaker" && battle.simpleIrregularStreak >= 2) {
    pool = pool.filter(question => !["irregular-v2", "mixed-rule"].includes(question.type));
  }

  if (!pool.length) {
    pool = bank.filter(question =>
      !battle.usedBossQuestionIds.has(question.id) &&
      getQuestionBaseWord(question) !== battle.lastBossQuestionBaseVerb
    );
  }

  if (!pool.length) {
    pool = bank.filter(question => !battle.usedBossQuestionIds.has(question.id));
  }

  if (!pool.length) {
    battle.usedBossQuestionIds.clear();
    pool = [...bank];
  }

  const question = sample(pool, 1)[0];
  battle.usedBossQuestionIds.add(question.id);
  battle.lastBossQuestionBaseVerb = getQuestionBaseWord(question) || "";
  battle.bossQuestionIndex += 1;

  if (source === "boss" && key === "memoryBreaker" && question.type === "irregular-v2") {
    battle.simpleIrregularStreak = (battle.simpleIrregularStreak || 0) + 1;
  } else if (source === "boss" && key === "memoryBreaker") {
    battle.simpleIrregularStreak = 0;
  }

  return question;
}

function showEnemyDamageFloat(amount, label = "") {
  if (!els.battleEnemy || !amount) {
    return;
  }

  const floater = document.createElement("span");
  floater.className = "damage-float";
  if (label === "CRIT") {
    floater.classList.add("crit");
  }
  floater.textContent = `${label}${label ? " " : ""}-${amount}`;
  floater.style.left = `${36 + Math.random() * 28}%`;
  floater.style.top = `${18 + Math.random() * 26}%`;
  els.battleEnemy.appendChild(floater);
  setTimeout(() => floater.remove(), 950);
}

function triggerEnemyHitFeedback(amount = 0, label = "") {
  if (amount <= 0) {
    return;
  }
  playAttackSfx();
  if (amount > 0) {
    showEnemyDamageFloat(amount, label);
  }
  if (els.battleEnemy) {
    els.battleEnemy.classList.remove("enemy-hit");
    void els.battleEnemy.offsetWidth;
    els.battleEnemy.classList.add("enemy-hit");
    setTimeout(() => els.battleEnemy.classList.remove("enemy-hit"), 460);
  }
}

function isPastQuestionContext() {
  const battle = state.actBattle;
  if (!battle) {
    return false;
  }
  const question = battle.stage.questions[battle.questionIndex];
  const questionText = `${getQuestionText(question)} ${battle.stage.title}`.toLowerCase();
  return ["past", "v2", "yesterday", "last", "ago", "did"].some(token => questionText.includes(token)) ||
    questionText.includes("อดีต");
}

function isMemoryEnemy(stage) {
  const text = `${stage?.enemy || ""} ${stage?.title || ""}`.toLowerCase();
  return ["memory", "time", "wraith", "shade", "breaker"].some(token => text.includes(token));
}

function rollCritical(extraChance = 0, force = false) {
  const effects = state.battleActiveEffects || {};
  const chance = clamp(BASE_CRITICAL_CHANCE + extraChance + (effects.criticalChanceBonus || 0), 0, 0.95);
  effects.criticalChanceBonus = 0;
  return force || Math.random() < chance;
}

function tryStunBoss(baseChance, lines) {
  const battle = state.actBattle;
  if (!battle || baseChance <= 0) {
    return false;
  }

  ensureBattleStatuses();
  let chance = baseChance;
  if (battle.bossWasStunnedLastTurn) {
    chance *= STATUS_BALANCE_CONFIG.stun.repeatedStunResistanceMultiplier;
    battle.bossWasStunnedLastTurn = false;
  }

  if (Math.random() < chance) {
    const bossStatus = getBattleStatus("boss");
    if (bossStatus) {
      const threshold = getTargetStunThreshold("boss");
      bossStatus.stunGauge = threshold;
      bossStatus.stunnedTurns = Math.max(bossStatus.stunnedTurns || 0, STATUS_BALANCE_CONFIG.stun.bossStunTurns);
    }
    battle.bossStunned = false;
    addBattleMessageLine(lines, "บอสติด Stun! การโจมตีครั้งถัดไปถูกหยุดไว้");
    statusLog("stun chance success", { chance });
    return true;
  }

  const buildAmount = Math.round(chance * 30);
  if (buildAmount > 0) {
    addStunGauge("boss", buildAmount, "partial-stun-charm", lines);
  }
  return false;
}

function applyCharmSetupEffect(charm, lines) {
  const effects = state.battleActiveEffects || {};

  switch (charm.effectType) {
    case "bonusGrammaria":
      return { bonusGrammaria: charm.value || 0 };
    case "healFlat":
      state.playerHp = clamp(state.playerHp + (charm.value || 0), 0, 100);
      addBattleMessageLine(lines, `ฟื้น HP +${charm.value || 0}`);
      break;
    case "conditionalHeal":
      if (state.playerHp <= 50) {
        state.playerHp = clamp(state.playerHp + (charm.value || 0), 0, 100);
        addBattleMessageLine(lines, `HP ต่ำกว่า 50% ฟื้น HP +${charm.value || 0}`);
      }
      break;
    case "healOnCorrect":
      state.playerHp = clamp(state.playerHp + (charm.value || 0), 0, 100);
      addBattleMessageLine(lines, `ตอบถูกแล้วฟื้น HP +${charm.value || 0}`);
      break;
    case "parrySlow":
      effects.parrySlow += 1;
      effects.parrySlowMultiplier = Math.min(effects.parrySlowMultiplier || 1, charm.value || 0.9);
      addBattleMessageLine(lines, "Parry ครั้งถัดไปช้าลง");
      break;
    case "parryZoneBonus":
      effects.parryWide += 1;
      effects.parryWideBonus = Math.max(effects.parryWideBonus || 0, charm.value || 0);
      addBattleMessageLine(lines, "ช่อง Parry ครั้งถัดไปกว้างขึ้น");
      break;
    case "nextDamageReduction":
      addDefenseShield("player", charm.value || 0, charm.hits || 1, charm.id);
      addBattleMessageLine(lines, `ลดดาเมจบอสครั้งถัดไป ${Math.round((charm.value || 0) * 100)}%`);
      break;
    case "addDefenseShield":
      addDefenseShield("player", charm.value || 0, charm.hits || charm.duration || 1, charm.id);
      addBattleMessageLine(lines, `Defense Shield ${Math.round((charm.value || 0) * 100)}% x${charm.hits || charm.duration || 1}`);
      break;
    case "addHitShield":
      addHitShield("player", charm.value || 1, charm.id);
      addBattleMessageLine(lines, `Hit Shield +${charm.value || 1}`);
      break;
    case "shieldAndGuard":
      addHitShield("player", charm.stacks || 1, charm.id);
      addDefenseShield("player", charm.value || 0.25, charm.hits || 1, charm.id);
      addBattleMessageLine(lines, "สร้างโล่และเกราะป้องกัน");
      break;
    case "memoryCharge":
      effects.memoryCharge += charm.value || 1;
      addBattleMessageLine(lines, `สะสม Memory Charge ${effects.memoryCharge}`);
      if (effects.memoryCharge >= (charm.threshold || 3)) {
        effects.memoryCharge = 0;
        gainActAP(1);
        addBattleMessageLine(lines, "Memory Charge ครบ 3: ได้รับ AP +1");
      }
      break;
    case "nextCorrectBonusGrammaria":
      effects.nextCorrectBonusGrammaria += charm.value || 0;
      addBattleMessageLine(lines, `คำตอบถูกครั้งถัดไปได้ Grammaria +${charm.value || 0}`);
      break;
    case "removeWrongChoice":
    case "showHintBeforeQuestion":
      effects.hint += charm.removeWrongChoice || charm.value || 1;
      addBattleMessageLine(lines, `คำถามถัดไปตัดตัวเลือกผิด ${charm.removeWrongChoice || charm.value || 1} ตัว`);
      break;
    case "secondChanceParry":
      effects.secondChance += 1;
      addBattleMessageLine(lines, "ถ้า Parry พลาด จะลดโทษให้ 1 ครั้ง");
      break;
    case "criticalChanceBonus":
      effects.criticalChanceBonus += charm.value || 0;
      addBattleMessageLine(lines, `เพิ่มโอกาส Critical +${Math.round((charm.value || 0) * 100)}%`);
      break;
    case "retryNextWrong":
      effects.retry += 1;
      addBattleMessageLine(lines, "ตอบผิดครั้งถัดไปจะได้ลองใหม่ 1 ครั้ง");
      break;
    case "applyMark":
    case "applyMarkStatus":
      applyMark("boss", charm.value || STATUS_BALANCE_CONFIG.mark.defaultDamageBonus, charm.hits || 1, charm.duration || 1, charm.id);
      addBattleMessageLine(lines, `Marked! บอสโดนดาเมจเพิ่ม ${Math.round((charm.value || STATUS_BALANCE_CONFIG.mark.defaultDamageBonus) * 100)}%`);
      break;
    case "counterOnGoodParry":
      effects.counterOnGoodParry = Math.max(effects.counterOnGoodParry || 0, charm.value || 0);
      addBattleMessageLine(lines, "Good/Perfect Parry ครั้งถัดไปจะสวนกลับเพิ่ม");
      break;
    case "stunChance":
      effects.stunChance = Math.max(effects.stunChance || 0, charm.value || 0);
      addBattleMessageLine(lines, `มีโอกาส Stun บอส ${Math.round((charm.value || 0) * 100)}%`);
      break;
    case "stunBuild":
      effects.stunBuildBonus = Math.max(effects.stunBuildBonus || 0, charm.value || 0);
      addBattleMessageLine(lines, `สะสม Stun ให้บอส +${charm.value || 0}`);
      break;
    case "stunOnCritical":
      effects.stunOnCriticalChance = Math.max(effects.stunOnCriticalChance || 0, charm.value || 0);
      addBattleMessageLine(lines, "ถ้า Critical จะมีโอกาสทำให้บอส Stun");
      break;
    case "lifesteal":
      effects.lifestealRatio = Math.max(effects.lifestealRatio || 0, charm.value || 0);
      addBattleMessageLine(lines, "โจมตีครั้งนี้จะดูดพลังกลับมา");
      break;
    case "applyWeak":
      effects.bossWeak = Math.max(effects.bossWeak || 0, charm.value || 0);
      effects.bossWeakTurns = Math.max(effects.bossWeakTurns || 0, charm.duration || 1);
      addBattleMessageLine(lines, "บอสติด Weak ดาเมจครั้งถัดไปลดลง");
      break;
    case "perfectParryNextDamage":
      effects.perfectParryNextDamage = Math.max(effects.perfectParryNextDamage || 0, charm.value || 1);
      addBattleMessageLine(lines, "Perfect Parry ครั้งถัดไปจะเร่งพลังโจมตี");
      break;
    case "blockIfGoodParry":
      effects.blockIfGoodParry += 1;
      addBattleMessageLine(lines, "ถ้า Parry ได้อย่างน้อย Good จะบล็อกดาเมจ");
      break;
    case "reflectNextBossAttack":
      effects.reflectNextBossAttack = Math.max(effects.reflectNextBossAttack || 0, charm.value || 0);
      addBattleMessageLine(lines, "บอสจะได้รับดาเมจสะท้อนจากการโจมตีครั้งถัดไป");
      break;
    case "upgradeNextParry":
      effects.upgradeNextParry += 1;
      addBattleMessageLine(lines, "ผล Parry ครั้งถัดไปจะถูกอัปเกรด 1 ระดับ");
      break;
    case "perfectTimeline":
      effects.stunOnPerfectParry = 1;
      effects.perfectTimelineCounterMultiplier = Math.max(effects.perfectTimelineCounterMultiplier || 1, charm.counterMultiplier || 2);
      addBattleMessageLine(lines, "Perfect Parry ครั้งถัดไปจะ Stun และสวนกลับแรงขึ้น");
      break;
    case "surviveFatalOnce":
      effects.surviveFatalOnce = true;
      effects.surviveFatalHealPercent = charm.value || charm.healPercent || 0.4;
      addBattleMessageLine(lines, "ได้รับพร Great Recall ป้องกันการล้ม 1 ครั้ง");
      break;
    case "fullMemoryBurst":
      state.playerHp = clamp(state.playerHp + (charm.healFlat || 25), 0, 100);
      effects.parryWide += 1;
      effects.parryWideBonus = Math.max(effects.parryWideBonus || 0, charm.parryZoneBonus || 10);
      addBattleMessageLine(lines, `ฟื้น HP +${charm.healFlat || 25} และ Parry ครั้งถัดไปกว้างขึ้น`);
      return { damageMultiplier: charm.damageMultiplier || 1.5 };
    case "verionSeal":
      effects.hint += charm.removeWrongChoice || 2;
      effects.forceCriticalNextAttack += 1;
      addBattleMessageLine(lines, "เวรีออนเปิดผนึก: ตัดตัวเลือกผิดและบังคับ Critical");
      break;
    default:
      break;
  }

  return {};
}

function calculateCharmDamage(charm, baseDamage, lines) {
  const battle = state.actBattle;
  const effects = state.battleActiveEffects || {};
  const setup = applyCharmSetupEffect(charm, lines);
  let damage = baseDamage;
  let echoRatio = 0;
  let delayedEchoRatio = 0;
  let extraGrammaria = setup.bonusGrammaria || 0;
  let stunChance = effects.stunChance || 0;
  let forceCritical = Boolean(effects.forceCriticalNextAttack);

  if (setup.damageMultiplier) {
    damage = Math.round(damage * setup.damageMultiplier);
  }

  switch (charm.effectType) {
    case "damageMultiplier":
      damage = Math.round(damage * (charm.value || 1));
      break;
    case "pastDamageBonus":
      if (isPastQuestionContext()) {
        damage = Math.round(damage * (charm.value || 1));
        addBattleMessageLine(lines, "Past/V2 bonus ทำงาน");
      }
      break;
    case "echoDamage":
      echoRatio = Math.max(echoRatio, charm.value || 0);
      break;
    case "firstTurnDamageBonus":
      if ((battle?.turnNumber || 1) === 1) {
        damage = Math.round(damage * (charm.value || 1));
        addBattleMessageLine(lines, "Opening bonus ทำงาน");
      }
      break;
    case "memoryEnemyBonus":
      if (isMemoryEnemy(battle?.stage)) {
        damage = Math.round(damage * (charm.value || 1));
        addBattleMessageLine(lines, "Memory enemy bonus ทำงาน");
      }
      break;
    case "shieldPierceDamage":
      if (getBattleStatus("boss")?.defenseShieldPercent > 0 || getBattleStatus("boss")?.hitShieldStacks > 0) {
        effects.pierceBossShieldNextAttack = 1;
        addBattleMessageLine(lines, "Shield Pierce ทำงาน");
        damage = Math.round(damage * (charm.value || 1.2));
      }
      break;
    case "stackingCorrectDamage":
      effects.stackingDamageBonus = clamp((effects.stackingDamageBonus || 0) + (charm.value || 0.05), 0, (charm.value || 0.05) * (charm.maxStacks || 5));
      damage = Math.round(damage * (1 + effects.stackingDamageBonus));
      addBattleMessageLine(lines, `วงเวทสะสมพลัง +${Math.round(effects.stackingDamageBonus * 100)}%`);
      break;
    case "comboCorrectEcho":
      if ((battle?.correctStreak || 0) >= 2) {
        echoRatio = Math.max(echoRatio, charm.value || 0.3);
        addBattleMessageLine(lines, "Echo combo ทำงาน");
      }
      break;
    case "bossQuestionBreak":
      damage = Math.round(damage * 1.15);
      effects.pierceBossShieldNextAttack = 1;
      addBattleMessageLine(lines, "Grammar Break เพิ่มดาเมจและเจาะ Guard บอส");
      break;
    case "crystalCharge":
      effects.crystalCharge += charm.value || 1;
      addBattleMessageLine(lines, `Crystal Charge ${effects.crystalCharge}/3`);
      if (effects.crystalCharge >= (charm.threshold || 3)) {
        damage *= 2;
        effects.crystalCharge = 0;
        addBattleMessageLine(lines, "Crystal Charge ครบ 3: ดาเมจ x2");
      }
      break;
    case "delayedEchoDamage":
      delayedEchoRatio = Math.max(delayedEchoRatio, charm.value || 0.3);
      break;
    case "lowHpCriticalBonus":
      if (getPlayerHpPercent() <= 0.3) {
        effects.criticalChanceBonus += charm.value || 0;
        addBattleMessageLine(lines, "Low HP Critical bonus ทำงาน");
      }
      break;
    case "damageOnStunned":
      if (battle?.bossStunned || isTargetStunned("boss")) {
        damage = Math.round(damage * (charm.value || 1.5));
        addBattleMessageLine(lines, "Stun Breaker ทำงาน");
      }
      break;
    case "correctStreakDamage":
      if ((battle?.correctStreak || 0) >= 3) {
        damage = Math.round(damage * (charm.value || 1.75));
        addBattleMessageLine(lines, "ตอบถูก 3 ครั้งติดกัน: ดาเมจเพิ่ม");
      }
      break;
    case "rouletteDamage": {
      const values = charm.values || [0.7, 1.8];
      const multiplier = sample(values, 1)[0];
      damage = Math.round(damage * multiplier);
      addBattleMessageLine(lines, `Grammar Roulette x${multiplier}`);
      break;
    }
    case "damageAndReward":
      damage = Math.round(damage * (charm.damageMultiplier || 2));
      extraGrammaria += charm.bonusGrammaria || 15;
      break;
    case "v2Judgement":
      damage = Math.round(damage * (charm.damageMultiplier || 1.85));
      effects.bossWeak = Math.max(effects.bossWeak || 0, charm.applyWeak || 0.3);
      effects.bossWeakTurns = Math.max(effects.bossWeakTurns || 0, charm.duration || 1);
      break;
    default:
      break;
  }

  if (effects.markDamageBonus) {
    damage = Math.round(damage * (1 + effects.markDamageBonus));
    effects.markDamageBonus = 0;
  }

  if (effects.perfectParryDamageBonus) {
    damage = Math.round(damage * effects.perfectParryDamageBonus);
    effects.perfectParryDamageBonus = 0;
  }

  if (forceCritical) {
    effects.forceCriticalNextAttack = 0;
  }

  const isCrit = rollCritical(0, forceCritical);
  if (isCrit) {
    damage = Math.round(damage * CRITICAL_DAMAGE_MULTIPLIER);
    addBattleMessageLine(lines, "CRITICAL!");
    stunChance = Math.max(stunChance, effects.stunOnCriticalChance || 0);
  }
  effects.stunOnCriticalChance = 0;
  effects.stunChance = 0;

  const echoDamage = Math.round(damage * echoRatio);
  const totalDamage = damage + echoDamage;
  if (echoDamage) {
    addBattleMessageLine(lines, `Echo Damage +${echoDamage}`);
  }

  if (delayedEchoRatio) {
    effects.echoDamageNextTurn += Math.round(totalDamage * delayedEchoRatio);
    addBattleMessageLine(lines, "Time Echo จะย้อนกลับไปโจมตีอีกครั้งในเทิร์นถัดไป");
  }

  const healFromLifesteal = Math.round(totalDamage * (effects.lifestealRatio || 0));
  if (healFromLifesteal) {
    state.playerHp = clamp(state.playerHp + healFromLifesteal, 0, 100);
    effects.lifestealRatio = 0;
    addBattleMessageLine(lines, `ดูดพลังฟื้น HP +${healFromLifesteal}`);
  }

  const bypassBossShield = Boolean(effects.pierceBossShieldNextAttack);
  effects.pierceBossShieldNextAttack = 0;
  return { totalDamage, grammariaBonus: extraGrammaria, isCrit, stunChance, bypassBossShield };
}

function chooseActCharmV2(charm) {
  const battle = state.actBattle;
  if (!battle || !battle.pendingPlayerAttack) {
    return;
  }

  battle.awaitingGrammarCharge = true;
  battle.pendingGrammarCharge = { charm };
  startActGrammarCharge(charm);
  return;

  const rankLabel = charmRankMeta[charm.rank]?.label || `[${charm.rank}]`;
  const bonusLines = [`เลือก ${rankLabel} ${charm.name}`];
  const { totalDamage, grammariaBonus, isCrit, stunChance } = calculateCharmDamage(charm, battle.pendingPlayerAttack.baseDamage, bonusLines);
  const grammariaGain = battle.pendingPlayerAttack.grammariaGain + grammariaBonus;

  triggerMotion(els.battlePlayer, "player-attack-motion");
  state.enemyHp = clamp(state.enemyHp - totalDamage, 0, state.enemyMaxHp);
  recordPlayerDamage(totalDamage, "grammariaCharge");
  triggerEnemyHitFeedback(totalDamage, isCrit ? "CRIT" : "");
  state.grammaria += grammariaGain;
  battle.pendingPlayerAttack = null;

  tryStunBoss(stunChance, bonusLines);

  updateBattleStats();
  syncBattleStateToPlayerData();
  showOnlyBattlePanel(null);
  els.battleMessage.textContent = `${bonusLines.join("\n")}\nผู้พเนจรร่าย Grammaria สร้างดาเมจ ${totalDamage} และได้รับ Grammaria +${grammariaGain}`;

  if (state.enemyHp <= 0) {
    handleActEnemyDefeated("grammariaCharge");
    return;
  }

  if (charm.effectType === "extraTurnChance" && Math.random() < (charm.value || 0)) {
    els.battleMessage.textContent += "\nTime Skip ทำงาน! ได้เล่นต่อทันที";
    showBattleContinueButton(
      battle.questionIndex >= battle.stage.questions.length - 1 ? "รับรางวัล" : "คำถามถัดไป",
      continueActBattle
    );
    return;
  }

  els.continueBattleButton.classList.add("hidden");
  setTimeout(startActBossWarning, 900);
}

function startActGrammarCharge(charm) {
  els.battleMessage.textContent = `เลือก ${charm.name} แล้ว กดค้างเพื่อชาร์จ Grammaria`;
  showOnlyBattlePanel(els.chargePanel);
  setupGrammariaCharge({
    label: charm.name,
    onComplete: chargePercent => {
      const battle = state.actBattle;
      if (!battle || !battle.awaitingGrammarCharge) {
        return;
      }
      battle.awaitingGrammarCharge = false;
      battle.pendingGrammarCharge = null;
      resolveActCharmAttack(charm, chargePercent);
    }
  });
}

function stopActGrammarCharge() {
  const battle = state.actBattle;
  if (!battle || !battle.awaitingGrammarCharge || !state.charge) {
    return;
  }

  finishGrammariaCharge();
}

function calculateChargeDamage(baseDamage, chargePercent) {
  const percent = clamp(Math.round(Number(chargePercent) || 0), 0, 100);
  const bonusDamage = Math.round(baseDamage * (percent / 100));
  return {
    percent,
    bonusDamage,
    finalDamage: baseDamage + bonusDamage
  };
}

function buildChargeFeedback(percent, baseDamage, bonusDamage, finalDamage) {
  const prefix = percent >= 100
    ? "Perfect Charge! "
    : percent <= 20
      ? "Charge ต่ำ "
      : "";
  return `${prefix}พลัง Grammaria เพิ่มดาเมจ +${percent}%\nดาเมจพื้นฐาน ${baseDamage} + โบนัส ${bonusDamage} = ${finalDamage}`;
}

function resolveActCharmAttack(charm, chargePercent = 0) {
  const battle = state.actBattle;
  if (!battle || !battle.pendingPlayerAttack || !charm) {
    return;
  }

  const rankLabel = charmRankMeta[charm.rank]?.label || `[${charm.rank}]`;
  const normalizedChargePercent = clamp(Math.round(Number(chargePercent) || 0), 0, 100);
  const bonusLines = [`เลือก ${rankLabel} ${charm.name}`, `Grammaria Charge: ${normalizedChargePercent}%`];
  const effects = state.battleActiveEffects || {};
  const focusBuff = battle.focusBuff || null;
  if (battle.criticalCounterReady) {
    effects.forceCriticalNextAttack += 1;
    bonusLines.push("Critical Counter ทำงานจาก Perfect Point Parry");
  }

  const damageResult = calculateCharmDamage(charm, battle.pendingPlayerAttack.baseDamage, bonusLines);
  let totalDamage = damageResult.totalDamage;
  const grammariaBonus = damageResult.grammariaBonus;
  const isCrit = damageResult.isCrit;
  const stunChance = damageResult.stunChance;

  let chargeDamage = calculateChargeDamage(totalDamage, normalizedChargePercent);
  if (focusBuff?.active) {
    const focusPercent = Math.min(
      Number(focusBuff.bonusPercent || 0),
      FOCUS_BALANCE_CONFIG.focusDamageBonusPercent
    );
    const combinedDamage = capCombinedDamageBonus(totalDamage, {
      focusPercent,
      chargePercent: normalizedChargePercent
    });
    chargeDamage = {
      percent: combinedDamage.totalPercent,
      bonusDamage: combinedDamage.bonusDamage,
      finalDamage: combinedDamage.finalDamage
    };
    console.log("[FocusBalance] applied to damage", {
      baseDamage: totalDamage,
      focusBonusPercent: focusPercent,
      focusBonusDamage: Math.round(totalDamage * (focusPercent / 100)),
      finalDamage: chargeDamage.finalDamage
    });
    totalDamage = chargeDamage.finalDamage;
    bonusLines.push(`พลังสมาธิช่วยเสริมการโจมตี +${focusPercent}%`);
  } else {
    totalDamage = chargeDamage.finalDamage;
  }
  bonusLines.push(buildChargeFeedback(chargeDamage.percent, totalDamage - chargeDamage.bonusDamage, chargeDamage.bonusDamage, chargeDamage.finalDamage));
  if (battle.criticalCounterReady) {
    totalDamage = Math.round(totalDamage * 1.15);
  }

  const grammariaGain = battle.pendingPlayerAttack.grammariaGain + grammariaBonus;

  triggerMotion(els.battlePlayer, "player-attack-motion");
  const rawTotalDamage = totalDamage;
  const bossDamageResult = applyStatusDamageToTarget("boss", rawTotalDamage, "grammariaCharge", {
    chargePercent: normalizedChargePercent,
    bypassShield: damageResult.bypassBossShield
  });
  appendDamageModifierLines(bonusLines, "boss", bossDamageResult);
  totalDamage = bossDamageResult.finalDamage;
  if (totalDamage > 0) {
    addStunGauge("boss", getSkillStunBuild({ id: "grammariaCharge" }, damageResult), "grammariaCharge", bonusLines);
  }
  recordChargeBonusDamage(chargeDamage.bonusDamage);
  triggerEnemyHitFeedback(totalDamage, isCrit ? "CRIT" : "");
  state.grammaria += grammariaGain;
  gainActAP(1);
  if (isCrit) {
    gainActAP(1);
  }
  recordGrammariaChargeUse(normalizedChargePercent);
  battle.pendingPlayerAttack = null;
  clearFocusBuffAfterAttack(battle);
  battle.criticalCounterReady = false;

  tryStunBoss(stunChance, bonusLines);

  updateBattleStats();
  syncBattleStateToPlayerData();
  showOnlyBattlePanel(null);
  els.battleMessage.textContent = `${bonusLines.join("\n")}\nผู้พเนจรร่าย Grammaria สร้างดาเมจ ${totalDamage} และได้รับ Grammaria +${grammariaGain}`;

  if (state.enemyHp <= 0) {
    handleActEnemyDefeated("grammariaCharge");
    return;
  }

  if (charm.effectType === "extraTurnChance" && Math.random() < (charm.value || 0)) {
    els.battleMessage.textContent += "\nTime Skip ทำงาน! ได้เล่นต่อทันที";
    showBattleContinueButton(
      battle.questionIndex >= battle.stage.questions.length - 1 ? "รับรางวัล" : "เทิร์นถัดไป",
      continueActBattle
    );
    return;
  }

  els.continueBattleButton.classList.add("hidden");
  battle.pendingBossAction = chooseActBossAction(battle);
  setTimeout(startActBossWarning, 900);
}

function chooseActCharm(charm) {
  const battle = state.actBattle;
  if (!battle || !battle.pendingPlayerAttack) {
    return;
  }

  let damage = battle.pendingPlayerAttack.baseDamage;
  let grammariaGain = battle.pendingPlayerAttack.grammariaGain;
  const bonusLines = [`เลือก ${charm.name}`];

  if (charm.id === "actPower") {
    damage = Math.round(damage * 1.25);
    bonusLines.push("พลังโจมตีเพิ่มขึ้น");
  }

  if (charm.id === "actGrammaria") {
    grammariaGain += 10;
    bonusLines.push("Grammaria ฟื้นคืนเพิ่มขึ้น");
  }

  if (charm.id === "actWeaken") {
    state.guardShield = Math.max(state.guardShield, 0.3);
    bonusLines.push("การโจมตีถัดไปของศัตรูอ่อนแรงลง");
  }

  if (charm.id === "actEcho") {
    damage += 7;
    bonusLines.push("เกิดการโจมตีซ้ำเล็กน้อย");
  }

  if (charm.id === "doubleHit") {
    const extraDamage = Math.max(4, Math.round(damage * 0.35));
    damage += extraDamage;
    bonusLines.push(`จังหวะซ้ำสร้างดาเมจเพิ่ม ${extraDamage}`);
  }

  if (charm.id === "heal") {
    state.playerHp = clamp(state.playerHp + 12, 0, 100);
    bonusLines.push("HP ฟื้นฟู 12 หน่วย");
  }

  if (charm.id === "parrySlow") {
    state.battleActiveEffects.parrySlow += 1;
    bonusLines.push("แพรี่ครั้งถัดไปจะช้าลง");
  }

  if (charm.id === "parryWide") {
    state.battleActiveEffects.parryWide += 1;
    bonusLines.push("โซนแพรี่ครั้งถัดไปกว้างขึ้น");
  }

  if (charm.id === "secondChance") {
    state.battleActiveEffects.secondChance += 1;
    bonusLines.push("ถ้าแพรี่พลาด จะลดดาเมจลงครึ่งหนึ่ง");
  }

  if (charm.id === "hint") {
    state.battleActiveEffects.hint += 1;
    bonusLines.push("คำถามถัดไปจะลบตัวเลือกผิด 1 ข้อ");
  }

  if (charm.id === "retry") {
    state.battleActiveEffects.retry += 1;
    bonusLines.push("ตอบผิดครั้งถัดไปจะได้ลองใหม่");
  }

  if (charm.id === "pastBonus") {
    const questionText = `${getQuestionText(battle.stage.questions[battle.questionIndex])} ${battle.stage.title}`.toLowerCase();
    if (questionText.includes("past") || questionText.includes("v2") || questionText.includes("อดีต")) {
      damage = Math.round(damage * 1.3);
      grammariaGain += 6;
      bonusLines.push("พลัง Past/V2 ทำงาน");
    } else {
      state.battleActiveEffects.echoDamageNextTurn += 6;
      bonusLines.push("เก็บเสียงสะท้อนไว้สร้างดาเมจในเทิร์นถัดไป");
    }
  }

  triggerMotion(els.battlePlayer, "player-attack-motion");
  const bossDamageResult = applyStatusDamageToTarget("boss", damage, "charmAttack");
  appendDamageModifierLines(bonusLines, "boss", bossDamageResult);
  damage = bossDamageResult.finalDamage;
  if (damage > 0) {
    addStunGauge("boss", 15, "legacy-charm-attack", bonusLines);
  }
  triggerEnemyHitFeedback(damage);
  state.grammaria += grammariaGain;
  battle.pendingPlayerAttack = null;

  updateBattleStats();
  syncBattleStateToPlayerData();
  showOnlyBattlePanel(null);
  els.battleMessage.textContent = `${bonusLines.join("\n")}\nผู้พเนจรร่าย Grammaria สร้างดาเมจ ${damage} และได้รับ Grammaria +${grammariaGain}`;

  if (state.enemyHp <= 0) {
    handleActEnemyDefeated("actCharmDamage");
    return;
  }

  els.continueBattleButton.classList.add("hidden");
  setTimeout(startActBossWarning, 900);
}

function heavyAttackLog(label, payload = {}) {
  if (BOSS_HEAVY_ATTACK_CONFIG.debug) {
    console.log(`[HeavyAttack] ${label}`, payload);
  }
}

function randomInt(min, max) {
  const lo = Math.ceil(Number(min) || 0);
  const hi = Math.floor(Number(max) || lo);
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

function canBossUseHeavyAttack(stage) {
  if (!stage) {
    return false;
  }
  const normalized = normalizeEnemyId(stage);
  const compactEnemy = String(stage.enemy || stage.name || stage.id || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
  return [
    "edForger",
    "yesterdaySprite",
    "yesterdaySpirit",
    "memoryBreaker"
  ].includes(normalized) ||
    compactEnemy === "yesterdaysprite" ||
    compactEnemy === "yesterdayspirit" ||
    compactEnemy === "regularrule3" ||
    stage.id === "regular-rule-3";
}

function shouldBossUseHeavyAttack(stage, battle) {
  if (!BOSS_HEAVY_ATTACK_CONFIG.enabled || !stage || !battle) {
    return false;
  }
  if (isActBattleEnded(battle) || state.playerHp <= 0 || state.enemyHp <= 0) {
    return false;
  }
  if (!canBossUseHeavyAttack(stage) || battle.heavyAttackState?.active || state.parry || state.pointParry?.active) {
    heavyAttackLog("roll", {
      enemy: stage?.enemy,
      canUse: canBossUseHeavyAttack(stage),
      chance: BOSS_HEAVY_ATTACK_CONFIG.chance,
      result: false
    });
    return false;
  }

  const currentTurn = Number(battle.bossTurnCount || 0);
  const lastTurn = Number(battle.lastHeavyAttackTurn ?? -999);
  if (currentTurn - lastTurn < BOSS_HEAVY_ATTACK_CONFIG.minTurnsBetweenHeavyAttacks) {
    heavyAttackLog("roll", {
      enemy: stage?.enemy,
      canUse: true,
      chance: BOSS_HEAVY_ATTACK_CONFIG.chance,
      result: false,
      reason: "cooldown"
    });
    return false;
  }

  const useHeavy = Math.random() < BOSS_HEAVY_ATTACK_CONFIG.chance;
  heavyAttackLog("roll", {
    enemy: stage?.enemy,
    canUse: true,
    chance: BOSS_HEAVY_ATTACK_CONFIG.chance,
    result: useHeavy
  });
  return useHeavy;
}

function getBossHeavyAttackBaseDamage(stage, battle) {
  const actionDamage = Number(battle?.pendingBossAction?.damage || 0);
  const normalDamage = actionDamage || Number(stage?.enemyDamage || stage?.bossDamage || 12);
  return Math.max(8, Math.round(normalDamage * BOSS_HEAVY_ATTACK_CONFIG.damageMultiplier));
}

function getBossActionHitCount(action) {
  const explicitHitCount = Number(action?.hitCount || 0);
  if (Number.isFinite(explicitHitCount) && explicitHitCount > 0) {
    return clamp(Math.round(explicitHitCount), 1, 3);
  }
  if (action?.type === "ultimate") {
    return 3;
  }
  if (action?.type === "skill") {
    return 2;
  }
  return 1;
}

function createBossHeavyAttackAction(stage, battle) {
  const templateAction = battle?.pendingBossAction || BOSS_ACTIONS.find(action => action.type === "skill") || BOSS_ACTIONS[0];
  const actionHitCount = getBossActionHitCount(templateAction);
  const chainCount = actionHitCount > 1
    ? actionHitCount
    : randomInt(BOSS_HEAVY_ATTACK_CONFIG.minChainCount, BOSS_HEAVY_ATTACK_CONFIG.maxChainCount);
  const allowedTypes = BOSS_HEAVY_ATTACK_CONFIG.allowedParryTypes.length
    ? BOSS_HEAVY_ATTACK_CONFIG.allowedParryTypes
    : ["bar"];
  const parryTypes = Array.from({ length: chainCount }, () => sample(allowedTypes, 1)[0] || "bar");
  const action = {
    ...templateAction,
    type: "heavyAttack",
    label: "ท่าโจมตีรุนแรง",
    warning: `${stage?.thaiEnemy || stage?.enemy || "บอส"} กำลังรวบรวมพลังโจมตีรุนแรง!`,
    description: "บอสกำลังรวบรวมพลังโจมตีหนัก ต้องปัดป้องต่อเนื่อง!",
    chainCount,
    parryTypes,
    baseDamage: getBossHeavyAttackBaseDamage(stage, battle),
    damage: getBossHeavyAttackBaseDamage(stage, battle),
    sequence: ["heavy"],
    bossKey: getBossKey(stage),
    createdAt: Date.now()
  };
  heavyAttackLog("action created", action);
  return action;
}

function createBossComboAttackAction(stage, battle, templateAction) {
  const chainCount = getBossActionHitCount(templateAction);
  const allowedTypes = BOSS_HEAVY_ATTACK_CONFIG.allowedParryTypes.length
    ? BOSS_HEAVY_ATTACK_CONFIG.allowedParryTypes
    : ["bar"];
  const parryTypes = Array.from({ length: chainCount }, () => sample(allowedTypes, 1)[0] || "bar");
  let insertedComboStep = false;
  const sourceSequence = templateAction.sequence?.length ? templateAction.sequence : ["attack"];
  const sequence = sourceSequence.flatMap(step => {
    if (step !== "attack" && step !== "point") {
      return [step];
    }
    if (insertedComboStep) {
      return [];
    }
    insertedComboStep = true;
    return ["heavy"];
  });
  if (!sequence.includes("heavy")) {
    sequence.push("heavy");
  }

  const action = {
    ...templateAction,
    warning: templateAction.warning || `${stage?.thaiEnemy || stage?.enemy || "บอส"} กำลังโจมตีต่อเนื่อง!`,
    description: "บอสกำลังใช้ combo attack ต้องปัดป้องต่อเนื่อง!",
    chainCount,
    parryTypes,
    baseDamage: Number(templateAction.damage || stage?.enemyDamage || stage?.bossDamage || 12),
    damage: Number(templateAction.damage || stage?.enemyDamage || stage?.bossDamage || 12),
    sequence,
    bossKey: getBossKey(stage),
    createdAt: Date.now()
  };
  heavyAttackLog("combo action created", action);
  return action;
}

function chooseActBossAction(battle) {
  const hpPercent = state.enemyHp / state.enemyMaxHp;
  const bossKey = getBossKey(battle.stage);
  let baseAction = BOSS_ACTIONS[0];

  if (isFinalBossStage(battle.stage) && (hpPercent <= 0.35 || battle.turnNumber % 5 === 0)) {
    baseAction = BOSS_ACTIONS.find(action => action.type === "ultimate");
  } else if (battle.stage.type.includes("boss") && battle.turnNumber % 5 === 0) {
    baseAction = BOSS_ACTIONS.find(action => action.type === "ultimate");
  } else if (battle.stage.type.includes("boss") && battle.turnNumber % 3 === 0) {
    baseAction = BOSS_ACTIONS.find(action => action.type === "skill");
  }

  const eligibleModes = getEligibleEnemyActionModes(battle);
  const weightedEntries = getWeightedEnemyActionEntries(battle, eligibleModes);
  const finalNormalizedWeights = normalizeEnemyActionWeights(weightedEntries);
  const historyBeforeSelection = getEnemyActionHistory(battle);
  const debugHistorySnapshot = {
    turnsSinceTyping: historyBeforeSelection.turnsSinceTyping,
    turnsSinceArrangement: historyBeforeSelection.turnsSinceArrangement,
    actions: [...historyBeforeSelection.actions]
  };
  const selectedMode = selectWeightedEnemyActionMode(battle, eligibleModes);
  recordEnemyActionMode(battle, selectedMode, eligibleModes);
  const pattern = selectedMode === "question" ? ["question"] : ["attack"];

  const action = {
    ...baseAction,
    sequence: [...pattern],
    bossKey,
    enemyActionMode: selectedMode,
    grammarChallengeMode: selectedMode === "typing" || selectedMode === "arrangement" ? selectedMode : ""
  };
  if (supportsBossGrammarChallenges(battle)) {
    console.debug("[Boss Action] Weighted selection", {
      stageId: battle.stage?.id,
      bossKey,
      eligibleActions: eligibleModes,
      baseWeights: getBossActionWeightsForBattle(battle),
      turnsSinceTyping: debugHistorySnapshot.turnsSinceTyping,
      turnsSinceArrangement: debugHistorySnapshot.turnsSinceArrangement,
      recentActions: debugHistorySnapshot.actions,
      finalNormalizedWeights,
      selectedAction: selectedMode
    });
  }
  action.sequence = action.sequence.map(step => step === "attack" ? chooseBossDefenseStep(action, battle) : step);
  return action;
}

function chooseBossDefenseStep(action, battle) {
  const parryConfig = getParryConfigForBoss(battle.stage, action);
  if (!parryConfig.enabled) {
    return "attack";
  }
  return Math.random() < parryConfig.chance ? "point" : "attack";
}

function shouldEnemyBeStunned(battle = state.actBattle) {
  if (!battle || isActBattleEnded(battle)) {
    return false;
  }
  const bossStatus = getBattleStatus("boss", battle);
  const stunValue = getTargetStunValue("boss", battle);
  const threshold = getTargetStunThreshold("boss", battle);
  if (stunValue >= threshold) {
    bossStatus.stunnedTurns = Math.max(bossStatus.stunnedTurns || 0, STATUS_BALANCE_CONFIG.stun.bossStunTurns);
    return true;
  }
  if (bossStatus) {
    bossStatus.stunnedTurns = 0;
  }
  battle.bossStunned = false;
  battle.stunSkipResolving = false;
  battle.stunTurnCompleted = false;
  return false;
}

function completeStunnedEnemyTurn() {
  const battle = state.actBattle;
  if (!battle || battle.stunTurnCompleted || isActBattleEnded(battle)) {
    return;
  }

  battle.stunTurnCompleted = true;
  battle.stunSkipResolving = false;
  battle.pendingBossAction = null;
  battle.pendingBossTurn = null;
  battle.awaitingPrepare = false;
  battle.awaitingParry = false;
  battle.turnNumber += 1;
  setBattleTurnOwner("player");

  showBattleContinueButton(
    battle.questionIndex >= battle.stage.questions.length - 1 || state.enemyHp <= 0 ? "รับรางวัล" : "คำถามถัดไป",
    continueActBattle
  );
}

function resolveEnemyStunAtTurnStart(battle = state.actBattle) {
  if (!battle || isActBattleEnded(battle)) {
    return false;
  }

  ensureBattleStatuses(battle);
  if (!shouldEnemyBeStunned(battle)) {
    return false;
  }
  if (battle.stunSkipResolving) {
    return true;
  }

  const bossStatus = getBattleStatus("boss", battle);
  battle.stunSkipResolving = true;
  battle.stunTurnCompleted = false;
  battle.bossWasStunnedLastTurn = true;
  battle.bossStunned = false;
  if (bossStatus) {
    consumeStunTurn("boss");
    bossStatus.stunGauge = 0;
    bossStatus.stunnedTurns = 0;
  }
  battle.pendingBossAction = null;
  battle.pendingBossTurn = null;

  showOnlyBattlePanel(null);
  setBattleTurnOwner("enemy");
  els.battleMessage.textContent = "บอสติด Stun! การโจมตีครั้งนี้ถูกหยุดไว้";
  showBattleContinueButton("ดำเนินต่อ", completeStunnedEnemyTurn);
  updateBattleStats();
  syncBattleStateToPlayerData();
  return true;
}

function bossIntentLabel(turn) {
  if (!turn) {
    return "เตรียมป้องกัน";
  }
  const remaining = turn.sequence.slice(turn.stepIndex);
  if (remaining.includes("heavy")) {
    return "Parry Chain";
  }
  if (remaining.includes("question")) {
    return "โจทย์บอส";
  }
  if (remaining.includes("point")) {
    return "Point Parry";
  }
  return "Parry Bar";
}

function showBossIntentPanel(turn) {
  const battle = state.actBattle;
  if (!battle || !turn) {
    return;
  }

  setBattleTurnOwner("enemy");
  showOnlyBattlePanel(els.bossIntentPanel);
  const enemyName = battle.stage.thaiEnemy || battle.stage.enemy || "Memory Shade";
  const action = battle.pendingBossAction;
  els.bossIntentName.textContent = enemyName;
  els.bossIntentText.textContent = action?.type === "heavyAttack" || action?.chainCount > 1
    ? `${enemyName} กำลังรวบรวมพลังโจมตีต่อเนื่อง! เตรียมปัดป้อง ${action.chainCount} ครั้ง`
    : action?.warning || "ศัตรูกำลังเตรียมโจมตี";
  els.bossIntentType.textContent = `รูปแบบถัดไป: ${bossIntentLabel(turn)}`;
  battle.bossIntentReadyConsumed = false;
  setButtonAction(els.bossIntentReadyButton, "เตรียมพร้อม", handleBossIntentReady, { hidden: false });
  els.battleMessage.textContent = "อ่านสัญญาณศัตรูก่อนเริ่มจังหวะป้องกัน";
}

function handleBossIntentReady(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const battle = state.actBattle;
  if (!battle || !battle.pendingBossTurn || !battle.pendingBossAction) {
    return;
  }

  if (isActBattleEnded(battle)) {
    return;
  }

  if (battle.bossIntentReadyConsumed) {
    return;
  }

  battle.bossIntentReadyConsumed = true;
  disableBattleButton(els.bossIntentReadyButton);
  runNextBossTurnStep();
}

function startActBossWarning() {
  const battle = state.actBattle;
  if (!battle || !battle.pendingBossAction) {
    return;
  }
  if (isActBattleEnded(battle)) {
    console.log("[Battle] startActBossWarning blocked because battle already ended");
    return;
  }

  setBattleTurnOwner("enemy");
  if (resolveEnemyStunAtTurnStart(battle)) {
    return;
  }

  battle.bossTurnCount = (battle.bossTurnCount || 0) + 1;
  if (shouldBossUseHeavyAttack(battle.stage, battle)) {
    battle.pendingBossAction = createBossHeavyAttackAction(battle.stage, battle);
    battle.lastHeavyAttackTurn = battle.bossTurnCount;
  } else if (getBossActionHitCount(battle.pendingBossAction) > 1) {
    battle.pendingBossAction = createBossComboAttackAction(battle.stage, battle, battle.pendingBossAction);
  }

  const action = battle.pendingBossAction;
  battle.pendingBossTurn = {
    action,
    sequence: [...(action.sequence || ["attack"])],
    stepIndex: 0,
    correctQuestions: 0,
    wrongQuestions: 0
  };

  if (startBossGrammarChallengeIfEligible()) {
    return;
  }

  showBossIntentPanel(battle.pendingBossTurn);
}

function runNextBossTurnStep() {
  const battle = state.actBattle;
  if (!battle || !battle.pendingBossTurn) {
    return;
  }
  if (isActBattleEnded(battle)) {
    console.log("[Battle] runNextBossTurnStep blocked because battle already ended");
    return;
  }

  const turn = battle.pendingBossTurn;
  if (turn.stepIndex >= turn.sequence.length) {
    finishBossTurn();
    return;
  }

  const step = turn.sequence[turn.stepIndex];
  turn.stepIndex += 1;

  if (step === "question") {
    showBossQuestionStep();
    return;
  }

  if (step === "point") {
    showPointParryStep();
    return;
  }

  if (step === "heavy") {
    startBossHeavyAttackParryChain(battle.pendingBossAction);
    return;
  }

  showBossAttackStep();
}

function resetBossQuestionState(battle = state.actBattle) {
  if (!battle) {
    return;
  }
  battle.currentBossQuestion = null;
  battle.bossQuestionState = createBossQuestionState();
}

function isRenderableBossQuestion(question) {
  if (!question) {
    return false;
  }
  const answer = question.correctAnswer || question.answer;
  const questionText = getQuestionText(question);
  return Boolean(
    questionText &&
    answer &&
    Array.isArray(question.options) &&
    question.options.length >= 2 &&
    question.options.includes(answer)
  );
}

function fallbackBossQuestionToStoredAttack(reason = "missing-question") {
  const battle = state.actBattle;
  if (!battle || !battle.pendingBossTurn || !battle.pendingBossAction || isActBattleEnded(battle)) {
    return;
  }

  console.warn("[Enemy Question] Unable to render question; falling back to stored boss action", {
    reason,
    stageId: battle.stage?.id,
    enemy: battle.stage?.enemy,
    bossKey: getBossKey(battle.stage),
    actionType: battle.pendingBossAction?.type,
    sequence: battle.pendingBossTurn?.sequence,
    stepIndex: battle.pendingBossTurn?.stepIndex
  });
  resetBossQuestionState(battle);
  setBattleTurnOwner("enemy");

  const turn = battle.pendingBossTurn;
  const currentStepIndex = Math.max(0, turn.stepIndex - 1);
  const fallbackStep = chooseBossDefenseStep(battle.pendingBossAction, battle);
  turn.sequence.splice(currentStepIndex, 1, fallbackStep);
  turn.stepIndex = currentStepIndex;
  runNextBossTurnStep();
}

function showHeavyAttackChainMessage(action) {
  const battle = state.actBattle;
  if (!battle || !action) {
    return;
  }
  setBattleTurnOwner("enemy");
  showOnlyBattlePanel(null);
  els.continueBattleButton.classList.add("hidden");
  els.battleMessage.textContent = `${action.warning}\nปัดป้องต่อเนื่อง ${action.chainCount} ครั้ง`;
}

function startBossHeavyAttackParryChain(action) {
  const battle = state.actBattle;
  if (!battle || !action || isActBattleEnded(battle) || state.playerHp <= 0 || state.enemyHp <= 0) {
    return;
  }
  if (battle.heavyAttackState?.active) {
    return;
  }

  stopParryCountdown();
  cleanupPointParryRingUI();
  els.continueBattleButton.classList.add("hidden");
  battle.awaitingPrepare = false;
  battle.awaitingParry = false;
  battle.heavyAttackState = {
    active: true,
    action,
    currentIndex: 0,
    chainCount: action.chainCount,
    parryTypes: action.parryTypes,
    results: [],
    baseDamage: action.baseDamage,
    startedAt: Date.now(),
    resolved: false
  };

  heavyAttackLog("chain start", {
    enemy: battle.stage?.enemy,
    chainCount: action.chainCount,
    parryTypes: action.parryTypes,
    baseDamage: action.baseDamage
  });

  showHeavyAttackChainMessage(action);
  window.setTimeout(startNextHeavyAttackParry, BOSS_HEAVY_ATTACK_CONFIG.gapBetweenParriesMs);
}

function startNextHeavyAttackParry() {
  const battle = state.actBattle;
  const chain = battle?.heavyAttackState;
  if (!battle || !chain || !chain.active || chain.resolved || isActBattleEnded(battle)) {
    return;
  }

  if (chain.currentIndex >= chain.chainCount) {
    resolveBossHeavyAttackChain();
    return;
  }

  const parryType = chain.parryTypes[chain.currentIndex] || "bar";
  const displayIndex = chain.currentIndex + 1;
  els.continueBattleButton.classList.add("hidden");
  els.battleMessage.textContent = `ปัดป้องต่อเนื่อง ${displayIndex}/${chain.chainCount}`;
  heavyAttackLog("parry start", {
    index: displayIndex,
    total: chain.chainCount,
    type: parryType
  });

  if (parryType === "point") {
    startHeavyAttackPointParry({
      index: chain.currentIndex,
      total: chain.chainCount,
      onComplete: handleHeavyAttackParryResult
    });
    return;
  }

  startHeavyAttackParryBar({
    index: chain.currentIndex,
    total: chain.chainCount,
    onComplete: handleHeavyAttackParryResult
  });
}

function resolveHeavyAttackHitStatus(normalizedResult, chain) {
  const battle = state.actBattle;
  const action = chain?.action || battle?.pendingBossAction;
  const damagePerHit = Math.max(1, Math.round((chain?.baseDamage || action?.damage || 1) / Math.max(1, chain?.chainCount || 1)));
  let rawDamage = damagePerHit;
  let rawCounterDamage = 0;
  if (normalizedResult.grade === "perfect") {
    rawDamage = 0;
    rawCounterDamage = BOSS_HEAVY_ATTACK_CONFIG.counterDamagePerSuccess;
  } else if (normalizedResult.grade === "good") {
    rawDamage = Math.round(damagePerHit * 0.4);
    rawCounterDamage = BOSS_HEAVY_ATTACK_CONFIG.counterDamagePerSuccess;
  } else if (normalizedResult.grade === "weak") {
    rawDamage = Math.round(damagePerHit * 0.6);
  }

  const lines = [];
  const parryCharmResult = applyCharmParryEffect({
    grade: normalizedResult.grade,
    damage: rawDamage,
    counterDamage: rawCounterDamage,
    action,
    lines
  });
  rawDamage = parryCharmResult.damage;
  rawCounterDamage = parryCharmResult.counterDamage;
  const playerDamageResult = applyStatusDamageToTarget("player", rawDamage, "bossHeavyAttackHit", {
    hitIndex: normalizedResult.index + 1,
    grade: normalizedResult.grade
  });
  const bossCounterResult = applyStatusDamageToTarget("boss", rawCounterDamage, "bossHeavyAttackChainCounter", {
    hitIndex: normalizedResult.index + 1,
    grade: normalizedResult.grade
  });
  appendDamageModifierLines(lines, "player", playerDamageResult);
  appendDamageModifierLines(lines, "boss", bossCounterResult);
  applyBossMarkOnPlayerIfHit(action, playerDamageResult.finalDamage, lines);
  recordParryCounterDamage(bossCounterResult.finalDamage, "bossHeavyAttackChainCounter");
  if (bossCounterResult.finalDamage > 0) {
    addStunGauge("boss", getCounterStunBuild(normalizedResult.grade), `heavy-chain:${normalizedResult.grade}`, lines);
  }
  return {
    rawDamage,
    finalDamage: playerDamageResult.finalDamage,
    rawCounterDamage,
    counterDamage: bossCounterResult.finalDamage,
    playerDamageResult,
    bossCounterResult,
    lines
  };
}

function handleHeavyAttackParryResult(result) {
  const battle = state.actBattle;
  const chain = battle?.heavyAttackState;
  if (!battle || !chain || !chain.active || chain.resolved) {
    return;
  }

  const normalizedResult = {
    index: chain.currentIndex,
    type: chain.parryTypes[chain.currentIndex] || "bar",
    grade: result?.grade || "miss",
    success: result?.success === true || result?.grade === "perfect" || result?.grade === "good",
    meta: result || {},
    at: Date.now()
  };

  const hitStatus = resolveHeavyAttackHitStatus(normalizedResult, chain);
  normalizedResult.meta = {
    ...normalizedResult.meta,
    ...hitStatus
  };
  chain.results.push(normalizedResult);
  chain.currentIndex += 1;
  if (normalizedResult.meta?.apGain) {
    els.battleMessage.textContent = `Perfect Parry! +${normalizedResult.meta.apGain} AP`;
  }
  heavyAttackLog("parry result", normalizedResult);

  if (chain.currentIndex >= chain.chainCount) {
    resolveBossHeavyAttackChain();
    return;
  }
  if (state.enemyHp <= 0 || state.playerHp <= 0) {
    resolveBossHeavyAttackChain();
    return;
  }

  window.setTimeout(startNextHeavyAttackParry, BOSS_HEAVY_ATTACK_CONFIG.gapBetweenParriesMs);
}

function startHeavyAttackParryBar({ index, total, onComplete }) {
  const battle = state.actBattle;
  const action = battle?.pendingBossAction;
  if (!battle || !action) {
    return;
  }

  const difficulty = getActParryDifficulty(action);
  const adjustedZoneWidth = clamp(action.zoneWidth - difficulty.widthPenalty, action.minZoneWidth, 46);
  const durationMs = Math.max(1500, action.parryDuration * difficulty.durationMultiplier);
  const challenge = createParryBarChallenge({ durationMs });
  battle.awaitingParry = true;
  setBattleTurnOwner("enemy");
  state.parry = {
    challengeId: challenge.id,
    active: true,
    resolved: false,
    inputArmed: false,
    inputLocked: false,
    chainMode: true,
    onComplete,
    startedAt: challenge.startedAt,
    durationMs: challenge.durationMs,
    armedTimeout: null,
    gaugeProgress: 0,
    gaugeDirection: 1,
    gaugeLastTime: null,
    gaugeFrame: null,
    gaugeSpeed: Math.max(520, action.speed * difficulty.speedMultiplier),
    zoneMoves: true,
    gaugeZoneInitialWidth: adjustedZoneWidth,
    gaugeZoneWidth: adjustedZoneWidth,
    gaugeZoneMinWidth: action.minZoneWidth,
    gaugeZoneShrinkPerSecond: action.shrinkPerSecond,
    gaugeZoneStart: Math.random() * (100 - adjustedZoneWidth),
    gaugeZoneDirection: Math.random() < 0.5 ? -1 : 1,
    gaugeZoneSpeed: action.zoneSpeed,
    tickTimeout: null,
    resolveTimeout: null
  };

  els.enemyAttackName.textContent = action.label;
  els.parryHitText.textContent = `Chain ${index + 1} / ${total}`;
  els.parryCountdown.textContent = "TAP";
  els.parryHitResult.textContent = "";
  els.parryGaugeZone.style.width = `${adjustedZoneWidth}%`;
  els.parryGaugeZone.style.left = `${state.parry.gaugeZoneStart}%`;
  els.parryButton.disabled = true;
  showOnlyBattlePanel(els.parryPanel);
  startParryBarAfterLayout(challenge.id, durationMs, () => {
    stopActParry("MISS", { source: "timeout", challengeId: challenge.id });
  });
}

function startHeavyAttackPointParry({ index, total, onComplete }) {
  const battle = state.actBattle;
  if (!battle || !battle.pendingBossAction) {
    return;
  }

  const difficulty = getPointParryDifficulty();
  setBattleTurnOwner("enemy");
  showOnlyBattlePanel(els.pointParryPanel);
  els.pointParryTitle.textContent = `Point Parry ${index + 1}/${total}`;
  els.pointParryInstruction.textContent = "กดเมื่อวงกลมประสานกัน!";
  els.pointParryResult.textContent = "";
  els.pointParryArena.innerHTML = "";

  const ringGame = document.createElement("div");
  ringGame.className = "point-parry-ring-game";
  ringGame.innerHTML = `
    <div class="point-parry-target-ring" aria-hidden="true"></div>
    <div class="point-parry-shrinking-ring" aria-hidden="true"></div>
    <button class="point-parry-hit-button" type="button" aria-label="ปัดจังหวะ">ปัดจังหวะ!</button>
  `;
  const hitButton = ringGame.querySelector(".point-parry-hit-button");
  hitButton.addEventListener("pointerdown", event => {
    event.preventDefault();
    resolvePointParryRing("tap");
  }, { passive: false });
  els.pointParryArena.appendChild(ringGame);
  startPointParryRingAfterLayout({
    ...difficulty,
    chainMode: true,
    onComplete
  });
}

function resolveBossHeavyAttackChain() {
  const battle = state.actBattle;
  const chain = battle?.heavyAttackState;
  if (!battle || !chain || chain.resolved) {
    return;
  }

  chain.resolved = true;
  const total = chain.chainCount;
  const successCount = chain.results.filter(item => item.success).length;
  const missCount = total - successCount;
  const perfectChain = successCount === total;
  const apGainCount = chain.results.reduce((sum, item) => sum + Number(item.meta?.apGain || 0), 0);
  const finalDamage = chain.results.reduce((sum, item) => sum + Number(item.meta?.finalDamage || 0), 0);
  const appliedCounterDamage = chain.results.reduce((sum, item) => sum + Number(item.meta?.counterDamage || 0), 0);
  let counterBonusDamage = 0;
  if (perfectChain) {
    const bonusResult = applyStatusDamageToTarget(
      "boss",
      BOSS_HEAVY_ATTACK_CONFIG.counterDamagePerfectChain,
      "bossHeavyAttackPerfectChainBonus",
      { grade: "perfect-chain" }
    );
    counterBonusDamage = bonusResult.finalDamage;
    recordParryCounterDamage(counterBonusDamage, "bossHeavyAttackPerfectChainBonus");
  }
  const counterDamage = appliedCounterDamage + counterBonusDamage;

  const summary = {
    total,
    successCount,
    missCount,
    perfectChain,
    baseDamage: chain.baseDamage,
    finalDamage,
    counterDamage,
    counterBonusDamage,
    apGainCount,
    results: chain.results
  };
  heavyAttackLog("complete", summary);
  applyBossHeavyAttackChainResult(summary);
}

function showBossHeavyAttackChainSummary(summary) {
  const apLine = summary.apGainCount ? `\nPerfect Parry! ได้รับ AP +${summary.apGainCount}` : "";
  if (summary.perfectChain) {
    els.battleMessage.textContent = `ปัดป้องสมบูรณ์! เจ้าป้องกันท่าโจมตีรุนแรงได้ทั้งหมด และสวนกลับ ${summary.counterDamage} ดาเมจ${apLine}`;
    return;
  }
  if (summary.successCount > 0) {
    els.battleMessage.textContent = `เจ้าปัดป้องได้ ${summary.successCount}/${summary.total} ครั้ง รับความเสียหายลดลง เหลือ ${summary.finalDamage} ดาเมจ${apLine}`;
    return;
  }
  els.battleMessage.textContent = `เจ้าพลาดจังหวะทั้งหมด! รับความเสียหาย ${summary.finalDamage} ดาเมจ${apLine}`;
}

function finishBossTurnAfterHeavyAttack() {
  const battle = state.actBattle;
  if (!battle || isActBattleEnded(battle)) {
    return;
  }
  const hasMoreBossSteps = battle.pendingBossTurn && battle.pendingBossTurn.stepIndex < battle.pendingBossTurn.sequence.length;
  if (!hasMoreBossSteps) {
    finalizeBossTurnState();
  }
  showBattleContinueButton(
    hasMoreBossSteps ? "ดำเนินต่อ" : (battle.questionIndex >= battle.stage.questions.length - 1 ? "รับรางวัล" : "เทิร์นถัดไป"),
    hasMoreBossSteps ? runNextBossTurnStep : continueActBattle
  );
}

function applyBossHeavyAttackChainResult(summary) {
  const battle = state.actBattle;
  if (!battle) {
    return;
  }

  stopParryCountdown();
  cleanupPointParryRingUI();
  showOnlyBattlePanel(null);
  setBattleTurnOwner("enemy");

  if (summary.counterDamage > 0) {
    triggerMotion(els.battlePlayer, "player-attack-motion");
    triggerEnemyHitFeedback(summary.counterDamage, "COUNTER");
  } else if (summary.finalDamage > 0) {
    triggerMotion(els.battleEnemy, "enemy-attack-motion");
  }

  if (summary.finalDamage > 0) {
    playAttackSfx();
  }

  updateBattleStats();
  syncBattleStateToPlayerData();
  showBossHeavyAttackChainSummary(summary);
  battle.heavyAttackState = null;
  battle.awaitingParry = false;
  battle.awaitingPrepare = false;

  if (state.enemyHp <= 0) {
    handleActEnemyDefeated("bossHeavyAttackChainCounter");
    return;
  }
  if (resolvePlayerDefeat("HP เหลือ 0")) {
    return;
  }

  finishBossTurnAfterHeavyAttack();
}

function getPointParryDifficulty() {
  const battle = state.actBattle;
  const config = getParryConfigForBoss(battle?.stage, battle?.pendingBossAction);
  return {
    durationMs: PARRY_BALANCE_CONFIG.pointParry.durationMs,
    targetScale: PARRY_BALANCE_CONFIG.pointParry.targetScale,
    startScale: PARRY_BALANCE_CONFIG.pointParry.startScale,
    perfectWindow: PARRY_BALANCE_CONFIG.pointParry.perfectWindow,
    goodWindow: PARRY_BALANCE_CONFIG.pointParry.goodWindow,
    size: config.size
  };
}

let pointParryLayoutStartToken = 0;

function cancelPointParryRingChallenge() {
  if (state.pointParry?.rafId) {
    cancelAnimationFrame(state.pointParry.rafId);
  }
  if (state.pointParry?.timeout) {
    clearTimeout(state.pointParry.timeout);
  }
}

function cleanupPointParryRingUI() {
  pointParryLayoutStartToken += 1;
  cancelPointParryRingChallenge();
  state.pointParry = null;
  clearParryLayoutState();
  if (els.pointParryArena) {
    els.pointParryArena.innerHTML = "";
  }
}

function updatePointParryRingScale(scale) {
  const ring = els.pointParryArena?.querySelector(".point-parry-shrinking-ring");
  if (!ring) {
    return;
  }
  ring.style.transform = `scale(${scale})`;
}

function startPointParryRingChallenge(options = {}) {
  cancelPointParryRingChallenge();
  const config = {
    ...PARRY_BALANCE_CONFIG.pointParry,
    ...options
  };
  const startedAt = performance.now();
  state.pointParry = {
    active: true,
    startedAt,
    durationMs: config.durationMs,
    startScale: config.startScale,
    targetScale: config.targetScale,
    perfectWindow: config.perfectWindow,
    goodWindow: config.goodWindow,
    chainMode: Boolean(config.chainMode),
    onComplete: typeof config.onComplete === "function" ? config.onComplete : null,
    resolved: false,
    rafId: null,
    timeout: null,
    currentScale: config.startScale
  };

  console.log("[PointParryRing] start", {
    durationMs: config.durationMs,
    startScale: config.startScale,
    targetScale: config.targetScale
  });

  function tick(now) {
    if (!state.pointParry?.active || state.pointParry.resolved) {
      return;
    }

    const elapsed = now - state.pointParry.startedAt;
    const progress = Math.min(1, elapsed / state.pointParry.durationMs);
    const scale = state.pointParry.startScale -
      (state.pointParry.startScale - state.pointParry.targetScale) * progress;

    state.pointParry.currentScale = scale;
    updatePointParryRingScale(scale);

    if (progress >= 1) {
      resolvePointParryRing("timeout");
      return;
    }

    state.pointParry.rafId = requestAnimationFrame(tick);
  }

  updatePointParryRingScale(config.startScale);
  state.pointParry.rafId = requestAnimationFrame(tick);
}

function startPointParryRingAfterLayout(options = {}) {
  const token = ++pointParryLayoutStartToken;
  syncVisibleViewportHeight();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (token !== pointParryLayoutStartToken) {
        return;
      }
      if (els.pointParryPanel?.classList.contains("hidden")) {
        return;
      }
      if (!els.pointParryArena?.querySelector(".point-parry-ring-game")) {
        return;
      }
      startPointParryRingChallenge(options);
    });
  });
}

function resolvePointParryRing(reason = "tap") {
  const challenge = state.pointParry;
  if (!challenge || challenge.resolved) {
    return;
  }

  challenge.resolved = true;
  if (challenge.rafId) {
    cancelAnimationFrame(challenge.rafId);
  }

  const scaleDelta = Math.abs(challenge.currentScale - challenge.targetScale);
  let result = "MISS";
  if (reason !== "timeout") {
    if (scaleDelta <= challenge.perfectWindow) {
      result = "PERFECT";
    } else if (scaleDelta <= challenge.goodWindow) {
      result = "GOOD";
    }
  }

  console.log("[PointParryRing] result", {
    grade: result.toLowerCase(),
    scaleDelta
  });
  resolvePointParry(result, { scaleDelta, reason });
}

function showPointParryStep() {
  const battle = state.actBattle;
  if (!battle || !battle.pendingBossAction) {
    return;
  }

  const parryConfig = getParryConfigForBoss(battle.stage, battle.pendingBossAction);
  if (!parryConfig.enabled) {
    showBossAttackStep();
    return;
  }

  const difficulty = getPointParryDifficulty();
  setBattleTurnOwner("enemy");
  showOnlyBattlePanel(els.pointParryPanel);
  els.pointParryTitle.textContent = battle.pendingBossAction.label || "Memory Fracture";
  els.pointParryInstruction.textContent = "กดเมื่อวงกลมประสานกัน!";
  els.pointParryResult.textContent = "";
  els.pointParryArena.innerHTML = "";

  const ringGame = document.createElement("div");
  ringGame.className = "point-parry-ring-game";
  ringGame.innerHTML = `
    <div class="point-parry-target-ring" aria-hidden="true"></div>
    <div class="point-parry-shrinking-ring" aria-hidden="true"></div>
    <button class="point-parry-hit-button" type="button" aria-label="ปัดจังหวะ">ปัดจังหวะ!</button>
  `;
  const hitButton = ringGame.querySelector(".point-parry-hit-button");
  hitButton.addEventListener("pointerdown", event => {
    event.preventDefault();
    resolvePointParryRing("tap");
  }, { passive: false });
  els.pointParryArena.appendChild(ringGame);
  startPointParryRingAfterLayout(difficulty);
}

function resolvePointParry(result, meta = {}) {
  const battle = state.actBattle;
  if (!battle || !battle.pendingBossAction || !state.pointParry?.active) {
    return;
  }

  cancelPointParryRingChallenge();
  state.pointParry.active = false;

  if (state.pointParry.chainMode) {
    const effects = state.battleActiveEffects || {};
    if (result !== "MISS" && effects.upgradeNextParry) {
      const upgradeMap = { GOOD: "PERFECT", PERFECT: "PERFECT" };
      result = upgradeMap[result] || result;
      effects.upgradeNextParry = Math.max(0, effects.upgradeNextParry - 1);
    }
    const grade = String(result || "MISS").toLowerCase();
    const onComplete = state.pointParry.onComplete;
    const apGain = result === "PERFECT" ? 1 : 0;
    if (apGain) {
      gainActAP(apGain);
      updateBattleStats();
    }
    recordParryForGrammaria(result, `heavy-point:${battle.turnNumber}:${battle.heavyAttackState?.currentIndex || 0}`);
    cleanupPointParryRingUI();
    showOnlyBattlePanel(null);
    if (typeof onComplete === "function") {
      onComplete({
        type: "point",
        grade,
        success: result === "PERFECT" || result === "GOOD",
        source: meta.reason || "tap",
        scaleDelta: meta.scaleDelta,
        apGain
      });
    }
    return;
  }

  const action = battle.pendingBossAction;
  const effects = state.battleActiveEffects || {};
  const parryConfig = getParryConfigForBoss(battle.stage, action);
  let damage = action.damage;
  let counterDamage = 0;

  if (result === "PERFECT") {
    damage = PARRY_BALANCE_CONFIG.pointParry.preventDamageOnPerfect ? 0 : damage;
    counterDamage = Math.min(parryConfig.counterDamage, PARRY_BALANCE_CONFIG.pointParry.counterDamagePerfect);
    battle.criticalCounterReady = true;
    gainActAP(1);
  } else if (result === "GOOD") {
    damage = PARRY_BALANCE_CONFIG.pointParry.preventDamageOnGood ? 0 : Math.round(action.damage * 0.5);
    counterDamage = PARRY_BALANCE_CONFIG.pointParry.counterDamageGood;
  }
  const feedbackLines = [];
  const parryCharmResult = applyCharmParryEffect({
    grade: result,
    damage,
    counterDamage,
    action,
    lines: feedbackLines
  });
  damage = parryCharmResult.damage;
  counterDamage = parryCharmResult.counterDamage;
  console.log("[ParryBalance] counter damage", {
    type: "point",
    grade: result.toLowerCase(),
    counterDamage,
    scaleDelta: meta.scaleDelta
  });
  recordParryForGrammaria(result, `point:${battle.turnNumber}:${battle.pendingBossTurn?.stepIndex || 0}`);

  if (effects.bossWeak) {
    damage = Math.round(damage * (1 - effects.bossWeak));
  }

  const playerDamageResult = applyStatusDamageToTarget("player", damage, "pointParryDamage", { result });
  const bossCounterResult = applyStatusDamageToTarget("boss", counterDamage, "pointParryCounter", { result });
  appendDamageModifierLines(feedbackLines, "player", playerDamageResult);
  appendDamageModifierLines(feedbackLines, "boss", bossCounterResult);
  applyBossMarkOnPlayerIfHit(action, playerDamageResult.finalDamage, feedbackLines);
  recordParryCounterDamage(bossCounterResult.finalDamage, "pointParryCounter");
  if (bossCounterResult.finalDamage > 0) {
    addStunGauge("boss", getCounterStunBuild(result), `point-parry:${result}`, feedbackLines);
  }
  damage = playerDamageResult.finalDamage;
  counterDamage = bossCounterResult.finalDamage;
  if (damage > 0) {
    playAttackSfx();
  }

  if (counterDamage) {
    triggerMotion(els.battlePlayer, "player-attack-motion");
    triggerEnemyHitFeedback(counterDamage, "COUNTER");
  } else {
    triggerMotion(els.battleEnemy, "enemy-attack-motion");
  }

  updateBattleStats();
  syncBattleStateToPlayerData();
  cleanupPointParryRingUI();
  showOnlyBattlePanel(null);
  setBattleTurnOwner("enemy");
  els.battleMessage.textContent = result === "PERFECT"
    ? `Perfect Parry! ปัดการโจมตีสำเร็จ และสวนกลับ ${counterDamage} ดาเมจ และได้รับ Critical Counter`
    : result === "GOOD"
      ? `Parry สำเร็จ! ปัดการโจมตี และสวนกลับ ${counterDamage} ดาเมจ`
      : `พลาดจังหวะ! การโจมตีผ่านเข้ามา รับดาเมจ ${damage}`;
  if (feedbackLines.length) {
    els.battleMessage.textContent += `\n${feedbackLines.join("\n")}`;
  }

  if (state.enemyHp <= 0) {
    handleActEnemyDefeated("pointParryCounter");
    return;
  }
  if (resolvePlayerDefeat("HP เหลือ 0")) {
    return;
  }

  const hasMoreBossSteps = battle.pendingBossTurn && battle.pendingBossTurn.stepIndex < battle.pendingBossTurn.sequence.length;
  if (!hasMoreBossSteps) {
    finalizeBossTurnState();
    if (resolvePlayerDefeat("HP เหลือ 0")) {
      return;
    }
  }

  showBattleContinueButton(
    hasMoreBossSteps ? "ดำเนินต่อ" : (battle.questionIndex >= battle.stage.questions.length - 1 ? "รับรางวัล" : "เทิร์นถัดไป"),
    hasMoreBossSteps ? runNextBossTurnStep : continueActBattle
  );
  battle.justRevived = false;
}

function showBossAttackStep() {
  const battle = state.actBattle;
  if (!battle || !battle.pendingBossAction) {
    return;
  }
  if (isActBattleEnded(battle)) {
    console.log("[Battle] showBossAttackStep blocked because battle already ended");
    return;
  }

  const action = battle.pendingBossAction;
  const bossLine = battle.stage.bossDialogueLines
    ? `\n${battle.stage.bossDialogueLines[(battle.turnNumber - 1) % battle.stage.bossDialogueLines.length]}`
    : "";
  const extraWarning = action.type === "ultimate"
    ? "\nอัลติเมทกำลังมา โซนแพรี่จะแคบและไวมาก!"
    : action.type === "skill"
      ? "\nสกิลแรงกำลังมา ตั้งสมาธิก่อนเริ่มแพรี่!"
      : "\nกดเตรียมพร้อมเมื่อพร้อมเข้าสู่จังหวะแพรี่";

  battle.awaitingPrepare = true;
  showOnlyBattlePanel(null);
  setBattleTurnOwner("enemy");
  els.battleMessage.textContent = `${action.warning}${extraWarning}${bossLine}`;
  showBattleContinueButton("เตรียมพร้อม", prepareActParry);
}

function showBossQuestionStep() {
  const battle = state.actBattle;
  if (isActBattleEnded(battle)) {
    console.log("[Battle] showBossQuestionStep blocked because battle already ended");
    return;
  }
  const rawQuestion = battle && getBossQuestion(battle.stage);
  if (!battle || !rawQuestion) {
    fallbackBossQuestionToStoredAttack("no-boss-question");
    return;
  }
  const question = prepareQuestion(rawQuestion);
  if (!isRenderableBossQuestion(question)) {
    fallbackBossQuestionToStoredAttack("invalid-boss-question");
    return;
  }

  battle.currentBossQuestion = question;
  battle.bossQuestionState = {
    active: true,
    inputLocked: false,
    resolved: false,
    questionId: question.id || ""
  };

  showOnlyBattlePanel(els.questionPanel);
  setBattleTurnOwner("enemy");
  els.continueBattleButton.classList.add("hidden");
  els.battleMessage.textContent = "บอส: “ถ้าเจ้าจำอดีตผิด ความทรงจำก็จะแตกสลาย... ตอบข้ามา!”";
  els.questionText.textContent = getQuestionText(question);
  els.answerOptions.innerHTML = "";

  question.options.forEach(option => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-button";
    button.textContent = option;
    button.addEventListener("click", () => chooseBossQuestionAnswer(option, question));
    els.answerOptions.appendChild(button);
  });
}

function chooseBossQuestionAnswer(option, question) {
  const battle = state.actBattle;
  if (!battle || !battle.pendingBossTurn || !battle.pendingBossAction) {
    return;
  }
  if (!battle.bossQuestionState?.active || battle.bossQuestionState.inputLocked || battle.bossQuestionState.resolved) {
    return;
  }
  battle.bossQuestionState.inputLocked = true;
  battle.bossQuestionState.resolved = true;

  const isCorrect = option === (question.correctAnswer || question.answer);
  const feedback = document.createElement("div");
  feedback.className = "answer-feedback";

  els.answerOptions.querySelectorAll("button").forEach(button => {
    button.disabled = true;
    if (button.textContent === (question.correctAnswer || question.answer)) {
      button.classList.add("correct");
    }
    if (button.textContent === option && !isCorrect) {
      button.classList.add("wrong");
    }
  });

  if (isCorrect) {
    battle.pendingBossTurn.correctQuestions += 1;
    recordCorrectAnswerForGrammaria();
    battle.pendingBossAction.damage = Math.max(4, battle.pendingBossAction.damage - 7);
    feedback.innerHTML = `<strong>คำตอบถูกต้อง!</strong><br>เจ้าต้านพลังของบอสได้<br>${question.explanation}`;
  } else {
    battle.pendingBossTurn.wrongQuestions += 1;
    recordWrongAnswerForGrammaria();
    battle.pendingBossAction.damage += 6;
    const chipDamage = isFinalBossStage(battle.stage) ? 10 : 7;
    const chipResult = applyStatusDamageToTarget("player", chipDamage, "bossChipDamage", { source: "bossQuestion" });
    playAttackSfx();
    triggerMotion(els.battleEnemy, "enemy-attack-motion");
    feedback.innerHTML = `<strong>ยังไม่ถูกต้อง!</strong><br>บอสโจมตีแรงขึ้น รับดาเมจ ${chipResult.finalDamage}<br>คำตอบที่ถูกคือ <strong>${question.correctAnswer || question.answer}</strong><br>${question.explanation}`;
  }

  els.answerOptions.appendChild(feedback);
  updateBattleStats();
  syncBattleStateToPlayerData();
  battle.bossQuestionState.active = false;
  if (!isCorrect && resolvePlayerDefeat("HP เหลือ 0")) {
    return;
  }
  if (!battle.justRevived) {
    els.battleMessage.textContent = isCorrect
      ? "คำตอบถูกต้อง! พลังโจมตีของบอสอ่อนลง"
      : "ยังไม่ถูกต้อง! บอสสะสมพลังโจมตีเพิ่มขึ้น";
  }
  battle.justRevived = false;
  showBattleContinueButton("ดำเนินต่อ", runNextBossTurnStep);
}

function finishBossTurn() {
  const battle = state.actBattle;
  if (!battle) {
    return;
  }
  if (isActBattleEnded(battle)) {
    console.log("[Battle] finishBossTurn blocked because battle already ended");
    return;
  }

  finalizeBossTurnState();
  showOnlyBattlePanel(null);
  setBattleTurnOwner("player");

  if (resolvePlayerDefeat("HP เหลือ 0")) {
    return;
  }

  showBattleContinueButton(
    battle.questionIndex >= battle.stage.questions.length - 1 || state.enemyHp <= 0 ? "รับรางวัล" : "คำถามถัดไป",
    continueActBattle
  );
}

function finalizeBossTurnState() {
  const battle = state.actBattle;
  if (!battle) {
    return;
  }
  battle.awaitingParry = false;
  battle.awaitingPrepare = false;
  resetBossQuestionState(battle);
  battle.pendingBossAction = null;
  battle.pendingBossTurn = null;
  battle.turnNumber += 1;
  battle.currentTurnActor = "player";
  renderBattleTurnIndicator();
}

function prepareActParry() {
  const battle = state.actBattle;
  if (!battle || !battle.pendingBossAction || !battle.awaitingPrepare) {
    return;
  }

  battle.awaitingPrepare = false;
  els.continueBattleButton.classList.add("hidden");
  els.battleMessage.textContent = "จับจังหวะเส้นสีขาวให้เข้าโซนเป้าหมาย ส้ม/เหลือง/เขียว...";
  setBattleTurnOwner("enemy");
  setTimeout(beginActParryPhase, battle.pendingBossAction.type === "ultimate" ? 700 : 450);
}

function getActParryDifficulty(action) {
  const battle = state.actBattle;
  const bossKey = getBossKey(battle?.stage);
  const hpPercent = state.enemyHp / state.enemyMaxHp;
  let widthPenalty = 0;
  let speedMultiplier = 1;
  let durationMultiplier = 1;

  if (bossKey === "edForger") {
    widthPenalty = 2;
    speedMultiplier = 0.94;
  } else if (bossKey === "irregularWraith") {
    widthPenalty = 3;
    speedMultiplier = 0.9;
  } else if (bossKey === "memoryBreaker") {
    widthPenalty = hpPercent <= 0.45 ? 6 : 4;
    speedMultiplier = hpPercent <= 0.45 ? 0.82 : 0.88;
    durationMultiplier = hpPercent <= 0.45 ? 0.9 : 0.95;
  }

  if (action.type === "ultimate") {
    widthPenalty += 2;
    speedMultiplier *= 0.9;
  }

  return { widthPenalty, speedMultiplier, durationMultiplier };
}

function beginActParryPhase() {
  const battle = state.actBattle;
  if (!battle || !battle.pendingBossAction) {
    return;
  }

  const action = battle.pendingBossAction;
  const effects = state.battleActiveEffects || {};
  const difficulty = getActParryDifficulty(action);
  const slowBonus = useBattleEffect("parrySlow") ? (1 / Math.max(effects.parrySlowMultiplier || 0.9, 0.5)) : 1;
  const wideBonus = useBattleEffect("parryWide") ? (effects.parryWideBonus || 8) : 0;
  effects.parrySlowMultiplier = 1;
  effects.parryWideBonus = 0;
  const adjustedZoneWidth = clamp(action.zoneWidth + wideBonus - difficulty.widthPenalty, action.minZoneWidth, 46);
  const durationMs = Math.max(1500, action.parryDuration * difficulty.durationMultiplier);
  const challenge = createParryBarChallenge({ durationMs });
  battle.awaitingParry = true;
  setBattleTurnOwner("enemy");
  state.parry = {
    challengeId: challenge.id,
    active: true,
    resolved: false,
    inputArmed: false,
    inputLocked: false,
    startedAt: challenge.startedAt,
    durationMs: challenge.durationMs,
    armedTimeout: null,
    gaugeProgress: 0,
    gaugeDirection: 1,
    gaugeLastTime: null,
    gaugeFrame: null,
    gaugeSpeed: Math.max(520, action.speed * slowBonus * difficulty.speedMultiplier),
    zoneMoves: true,
    gaugeZoneInitialWidth: adjustedZoneWidth,
    gaugeZoneWidth: adjustedZoneWidth,
    gaugeZoneMinWidth: action.minZoneWidth,
    gaugeZoneShrinkPerSecond: action.shrinkPerSecond,
    gaugeZoneStart: Math.random() * (100 - adjustedZoneWidth),
    gaugeZoneDirection: Math.random() < 0.5 ? -1 : 1,
    gaugeZoneSpeed: action.zoneSpeed,
    tickTimeout: null,
    resolveTimeout: null
  };

  els.enemyAttackName.textContent = action.label;
  els.parryHitText.textContent = `Turn ${battle.turnNumber}`;
  els.parryCountdown.textContent = action.type === "ultimate" ? "ULT" : "TAP";
  els.parryHitResult.textContent = "";
  els.parryGaugeZone.style.width = `${adjustedZoneWidth}%`;
  els.parryGaugeZone.style.left = `${state.parry.gaugeZoneStart}%`;
  els.parryButton.disabled = true;
  showOnlyBattlePanel(els.parryPanel);
  console.log("[ParryBar] start", {
    challengeId: challenge.id,
    durationMs
  });
  startParryBarAfterLayout(challenge.id, durationMs, () => {
    console.log("[ParryBar] timeout = miss", {
      challengeId: challenge.id,
      progress: state.parry.gaugeProgress
    });
    stopActParry("MISS", { source: "timeout", challengeId: challenge.id });
  });
}

function stopActParry(forcedResult = null, meta = {}) {
  const battle = state.actBattle;
  if (!battle || !battle.awaitingParry || !state.parry) {
    return;
  }
  if (meta.challengeId && !isCurrentParryBarChallenge(meta.challengeId)) {
    console.warn("[ParryBar] ignored stale result", meta);
    return;
  }

  const action = battle.pendingBossAction;
  let parryResult = forcedResult || parryGaugeResult(state.parry.gaugeProgress);
  let damage = action.damage;
  let counterDamage = 0;
  const effects = state.battleActiveEffects || {};
  const isTimeoutResult = meta.source === "timeout";

  if (!isTimeoutResult && parryResult === "MISS" && useBattleEffect("secondChance")) {
    parryResult = "WEAK";
  }

  if (!isTimeoutResult && effects.upgradeNextParry) {
    const upgradeMap = { MISS: "WEAK", WEAK: "GOOD", GOOD: "PERFECT", PERFECT: "PERFECT" };
    parryResult = upgradeMap[parryResult] || parryResult;
    effects.upgradeNextParry -= 1;
  }

  if (state.parry.chainMode) {
    const onComplete = state.parry.onComplete;
    const challengeId = meta.challengeId || state.parry.challengeId;
    const apGain = parryResult === "PERFECT" ? 1 : 0;
    if (apGain) {
      gainActAP(apGain);
      updateBattleStats();
    }
    recordParryForGrammaria(parryResult, `heavy-bar:${battle.turnNumber}:${battle.heavyAttackState?.currentIndex || 0}`);
    console.log("[ParryBar] chain result", {
      grade: parryResult.toLowerCase(),
      source: meta.source || "player",
      challengeId
    });
    battle.awaitingParry = false;
    state.parry.resolved = true;
    stopParryCountdown();
    showOnlyBattlePanel(null);
    if (typeof onComplete === "function") {
      onComplete({
        type: "bar",
        grade: parryResult.toLowerCase(),
        success: parryResult === "PERFECT" || parryResult === "GOOD",
        source: meta.source || "player",
        apGain
      });
    }
    return;
  }

  if (parryResult === "PERFECT") {
    damage = 0;
    counterDamage = PARRY_BALANCE_CONFIG.parryBar.counterDamagePerfect;
    gainActAP(1);
  } else if (parryResult === "GOOD") {
    damage = Math.round(action.damage * 0.4);
    counterDamage = PARRY_BALANCE_CONFIG.parryBar.counterDamageGood;
  } else if (parryResult === "WEAK") {
    damage = Math.round(action.damage * 0.6);
  }

  if (effects.bossWeak) {
    damage = Math.round(damage * (1 - effects.bossWeak));
    effects.bossWeakTurns = Math.max((effects.bossWeakTurns || 1) - 1, 0);
    if (!effects.bossWeakTurns) {
      effects.bossWeak = 0;
    }
  }

  if ((parryResult === "GOOD" || parryResult === "PERFECT") && effects.blockIfGoodParry) {
    damage = 0;
    effects.blockIfGoodParry -= 1;
  }

  if ((parryResult === "GOOD" || parryResult === "PERFECT") && effects.counterOnGoodParry) {
    counterDamage += Math.max(1, Math.round(action.damage * effects.counterOnGoodParry));
    effects.counterOnGoodParry = 0;
  }

  if (parryResult === "PERFECT" && effects.perfectParryNextDamage) {
    effects.perfectParryDamageBonus = Math.max(effects.perfectParryDamageBonus || 0, effects.perfectParryNextDamage);
    effects.perfectParryNextDamage = 0;
  }

  if (parryResult === "PERFECT" && effects.stunOnPerfectParry) {
    counterDamage = Math.round(counterDamage * (effects.perfectTimelineCounterMultiplier || 2));
    tryStunBoss(1, []);
    effects.stunOnPerfectParry = 0;
    effects.perfectTimelineCounterMultiplier = 1;
  }
  recordParryForGrammaria(parryResult, `act:${battle.turnNumber}:${battle.pendingBossTurn?.stepIndex || 0}`);

  if (effects.reflectNextBossAttack) {
    const reflectedDamage = Math.max(1, Math.round(action.damage * effects.reflectNextBossAttack));
    counterDamage += reflectedDamage;
    effects.reflectNextBossAttack = 0;
  }
  console.log("[ParryBalance] counter damage", {
    type: "bar",
    grade: parryResult.toLowerCase(),
    counterDamage,
    source: meta.source || "player",
    challengeId: meta.challengeId || state.parry.challengeId
  });
  console.log("[ParryBar] result", {
    grade: parryResult.toLowerCase(),
    source: meta.source || "player",
    challengeId: meta.challengeId || state.parry.challengeId
  });

  state.parry.resolved = true;
  const feedbackLines = [];
  const playerDamageResult = applyStatusDamageToTarget("player", damage, "bossAttack", { result: parryResult });
  const bossCounterResult = applyStatusDamageToTarget("boss", counterDamage, "parryCounter", { result: parryResult });
  appendDamageModifierLines(feedbackLines, "player", playerDamageResult);
  appendDamageModifierLines(feedbackLines, "boss", bossCounterResult);
  applyBossMarkOnPlayerIfHit(action, playerDamageResult.finalDamage, feedbackLines);
  recordParryCounterDamage(bossCounterResult.finalDamage, "parryCounter");
  if (bossCounterResult.finalDamage > 0) {
    addStunGauge("boss", getCounterStunBuild(parryResult), `bar-parry:${parryResult}`, feedbackLines);
  }
  damage = playerDamageResult.finalDamage;
  counterDamage = bossCounterResult.finalDamage;
  if (damage > 0) {
    playAttackSfx();
  }
  battle.awaitingParry = false;
  battle.awaitingPrepare = false;
  stopParryCountdown();
  if (counterDamage) {
    triggerMotion(els.battlePlayer, "player-attack-motion");
    triggerEnemyHitFeedback(counterDamage);
  } else {
    triggerMotion(els.battleEnemy, "enemy-attack-motion");
  }
  updateBattleStats();
  syncBattleStateToPlayerData();
  showOnlyBattlePanel(null);
  setBattleTurnOwner("enemy");

  els.battleMessage.textContent = `${thaiParryName(parryResult)} - รับดาเมจ ${damage}${counterDamage ? ` และสวนกลับ ${counterDamage}` : ""}`;
  if (feedbackLines.length) {
    els.battleMessage.textContent += `\n${feedbackLines.join("\n")}`;
  }
  if (state.enemyHp <= 0) {
    handleActEnemyDefeated("parryCounter");
    return;
  }
  if (resolvePlayerDefeat("HP เหลือ 0")) {
    return;
  }

  const hasMoreBossSteps = battle.pendingBossTurn && battle.pendingBossTurn.stepIndex < battle.pendingBossTurn.sequence.length;
  if (!hasMoreBossSteps) {
    finalizeBossTurnState();
    if (resolvePlayerDefeat("HP เหลือ 0")) {
      return;
    }
  }
  showBattleContinueButton(
    hasMoreBossSteps ? "ดำเนินต่อ" : (battle.questionIndex >= battle.stage.questions.length - 1 ? "รับรางวัล" : "คำถามถัดไป"),
    hasMoreBossSteps ? runNextBossTurnStep : continueActBattle
  );
  battle.justRevived = false;
}

function continueActBattle() {
  const battle = state.actBattle;
  if (!battle || isActBattleEnded(battle)) {
    console.log("[Battle] continueActBattle blocked because battle already ended");
    return;
  }
  els.continueBattleButton.classList.add("hidden");
  const shouldAdvanceQuestion = battle.advanceQuestionOnContinue !== false;
  if (shouldAdvanceQuestion) {
    battle.questionIndex += 1;
  } else {
    battle.advanceQuestionOnContinue = true;
  }

  if (battle.questionIndex >= battle.stage.questions.length && isFinalBossStage(battle.stage) && state.enemyHp > 0) {
    els.battleMessage.textContent = "The Memory Breaker ยังไม่สลาย ความทรงจำต้องการคำตอบที่ถูกต้องมากกว่านี้";
    state.playerHp = 100;
    state.enemyHp = state.enemyMaxHp;
    battle.questionIndex = 0;
    battle.correctAnswers = 0;
    updateBattleStats();
    showBattleContinueButton("ลองต่อสู้อีกครั้ง", () => beginActPlayerTurn("เลือกการกระทำเพื่อเริ่มรอบใหม่"));
    return;
  }

  if (state.enemyHp <= 0) {
    handleActEnemyDefeated("continueCheck");
    return;
  }

  if (battle.questionIndex >= battle.stage.questions.length) {
    completeActStage();
    return;
  }

  if (resolvePlayerDefeat("HP เหลือ 0")) {
    return;
  }

  beginActPlayerTurn("เทิร์นใหม่เริ่มแล้ว เลือกการกระทำ");
}

function addUniqueActValue(list, value) {
  if (!list.includes(value)) {
    list.push(value);
  }
}

function isReplayingStage(stage) {
  return Boolean(stage && state.activeReplayLessonId === stage.id);
}

function createReplayBossResultSnapshot(stage, stats = getCurrentBattleStats()) {
  const snapshot = createBossResultSnapshot(stage, stats);
  return {
    ...snapshot,
    replay: true,
    duplicate: true,
    earned: 0,
    correctPoints: 0,
    parryPoints: 0,
    chargePoints: 0,
    totalAfter: playerData?.progress?.grammaria?.total ?? playerData?.grammaria ?? state.grammaria ?? 0,
    rewardFragment: "",
    rewardBadge: ""
  };
}

function grantActReward(stage, options = {}) {
  const progress = ensureActProgress();
  if (!progress) {
    return null;
  }

  if (isReplayingStage(stage)) {
    state.lastGrammariaResult = createReplayBossResultSnapshot(stage);
    return state.lastGrammariaResult;
  }

  const alreadyCompleted = progress.completedStages.includes(stage.id) || progress.completedLessons.includes(stage.id);
  const shouldAwardGrammaria = options.awardGrammaria !== false && !alreadyCompleted;
  const grammariaResult = shouldAwardGrammaria
    ? awardBossGrammaria(stage)
    : (alreadyCompleted ? {
      ...createReplayBossResultSnapshot(stage),
      replay: false,
      duplicate: true,
      rewardFragment: stage?.reward?.fragment || ""
    } : null);
  if (grammariaResult) {
    state.lastGrammariaResult = grammariaResult;
  }
  addUniqueActValue(progress.completedStages, stage.id);
  markCompletedLesson(stage.id);
  markBossDefeated(stage);
  if (stage.completionKey) {
    progress[stage.completionKey] = true;
  }
  if (stage.reward && stage.reward.fragment) {
    addUniqueActValue(progress.fragments, stage.reward.fragment);
    addUniqueActValue(progress.rewards, stage.reward.fragment);
  }
  if (!alreadyCompleted && stage.reward && shouldAwardGrammaria) {
    progress.grammariaEarned = playerData.progress.grammaria.total;
  }
  if (stage.reward && stage.reward.badge) {
    progress.badge = stage.reward.badge;
    addUniqueActValue(progress.rewards, `Badge: ${stage.reward.badge}`);
  }

  const currentIndex = getStageIndexById(stage.id);
  const nextStage = getPlayableStages()[currentIndex + 1] || null;
  const finalBoss = isFinalBossStage(stage);
  if (nextStage) {
    unlockStage(nextStage.id);
  }
  saveProgress({
    currentStageId: finalBoss ? stage.id : (nextStage ? nextStage.id : stage.id),
    currentLessonId: finalBoss ? stage.id : (nextStage ? nextStage.id : stage.id),
    currentScreen: finalBoss ? "victory" : "lesson",
    lastSafeScreen: finalBoss ? "victory" : "lesson",
    currentDialogueIndex: 0,
    currentLessonStepIndex: 0
  });
  return grammariaResult;
}

function handleTimeDustDefeated(stage) {
  console.log("[TimeDust] handleTimeDustDefeated called");
  finalizeBossVictoryWithResult(stage, () => {
    console.log("[BossResult] Time Dust result shown before transition");
    transitionToRegularEdLessonAfterTimeDust(stage);
  });
  return;

  const nextStageId = "regular-rule-1";
  const nextIndex = getStageIndexById(nextStageId);
  console.log("[Battle] Time Dust victory transition starting");
  unlockStage(nextStageId);
  markCompletedLesson(stage.id);
  markBossDefeated(stage);
  const progress = saveProgress({
    currentActId: DEFAULT_ACT_PROGRESS.currentActId,
    currentStageId: nextStageId,
    currentLessonId: nextStageId,
    currentScreen: "lesson",
    lastSafeScreen: "lesson",
    currentDialogueIndex: 0,
    currentLessonStepIndex: 0
  });
  console.log("[Progress] Next lesson after Time Dust:", progress?.currentLessonId);

  state.actBattle = null;
  state.currentLessonStage = getPlayableStages()[nextIndex];
  state.lessonStepIndex = 0;
  restoreLessonUIAfterBattle();
  console.log("[UI] Exiting battle and rendering lesson");
  runSceneTransition("ไทม์ดัสต์สลายไปแล้ว... กฎของ Regular Verbs กำลังเปิดออก", () => {
    showStageLesson(nextIndex, { lessonStepIndex: 0, dialogueIndex: 0 });
  });
}

function finalizeBossVictoryWithResult(stage, onContinue) {
  if (!stage) {
    return;
  }

  const grammariaResult = grantActReward(stage) || createBossResultSnapshot(stage);
  state.actBattle = null;
  state.grammaria = playerData ? playerData.grammaria || state.grammaria : state.grammaria;

  renderBossGrammariaResult(grammariaResult, () => {
    console.log("[BossResult] continue to next stage", stage.id);
    if (typeof onContinue === "function") {
      onContinue();
    }
  });
}

function continueFinalBossVictory(stage) {
  console.log("[FinalBoss] showing Grammaria result");
  finalizeBossVictoryWithResult(stage, () => {
    console.log("[FinalBoss] starting post boss dialogue");
    transitionToActBackground(getNextAct1BackgroundKey(stage), "ความทรงจำสุดท้ายกำลังกลับคืน...", () => {
      startPostBossDialogue(stage);
    });
  });
}

function continueToPostBossDialogue(stage) {
  startPostBossDialogue(stage);
}

function handleActEnemyDefeated(source = "damage") {
  const battle = state.actBattle;
  if (!battle || battle.victoryHandled) {
    return true;
  }

  battle.victoryHandled = true;
  battle.isActive = false;
  state.enemyHp = 0;
  const normalizedEnemyId = normalizeEnemyId(battle.stage);
  console.log("[Battle] Enemy HP after damage:", state.enemyHp);
  console.log("[Battle] Enemy defeated:", normalizedEnemyId);

  setActionButtonsEnabled(false);
  stopTimer("charge");
  stopParryCountdown();
  cleanupBossHeavyAttackChain({ clearParryUi: true });
  showOnlyBattlePanel(null);
  updateBattleStats();
  syncBattleStateToPlayerData();
  setBattleTurnOwner("player");

  state.lastStageResult = {
    correctAnswers: battle.correctAnswers,
    totalQuestions: battle.stage.questions.length
  };

  els.battleMessage.textContent = `${battle.stage.thaiEnemy || battle.stage.enemy} พ่ายแพ้แล้ว! กำลังเปิดบทเรียนถัดไป...`;
  playVictorySceneMusicOnce();

  console.log("[TimeDust] Victory message shown", {
    enemyId: normalizedEnemyId,
    stageId: battle.stage.id,
    enemyHp: state.enemyHp
  });

  if (normalizedEnemyId === "timeDust") {
    const defeatedStage = battle.stage;
    finalizeBossVictoryWithResult(defeatedStage, () => {
      console.log("[BossResult] Time Dust result shown before transition");
      transitionToRegularEdLessonAfterTimeDust(defeatedStage);
    });
    return true;
  }

  if (isFinalBossStage(battle.stage)) {
    continueFinalBossVictory(battle.stage);
    return true;
  }

  finalizeBossVictoryWithResult(battle.stage, () => {
    continueToPostBossDialogue(battle.stage);
  });
  return true;
}

function completeActStage() {
  const battle = state.actBattle;
  if (!battle) {
    return;
  }
  const stage = battle.stage;
  console.log("[BattleComplete] stage", {
    stageId: stage.id,
    type: stage.type,
    enemy: stage.enemy,
    isFinalBoss: isFinalBossStage(stage)
  });
  state.lastStageResult = {
    correctAnswers: battle.correctAnswers,
    totalQuestions: stage.questions.length
  };

  if (stage.enemy === "Time Dust") {
    finalizeBossVictoryWithResult(stage, () => {
      console.log("[BossResult] Time Dust result shown before transition");
      transitionToRegularEdLessonAfterTimeDust(stage);
    });
    return;
  }

  if (isFinalBossStage(stage)) {
    continueFinalBossVictory(stage);
    return;
  }

  finalizeBossVictoryWithResult(stage, () => {
    continueToPostBossDialogue(stage);
  });
}

function restoreLessonUIAfterBattle() {
  console.log("[UI] Restoring lesson UI after battle");
  state.actBattle = null;
  state.parryAttack = null;
  stopTimer("charge");
  stopParryCountdown();
  showOnlyBattlePanel(null);
  document.body.classList.remove("battle-mode", "combat-mode", "modal-open");
  els.dialoguePanel.classList.add("hidden");
  els.dialogueActions.classList.add("hidden");
  els.nounActivity.classList.remove("hidden");
  els.nounActivityVisual.classList.remove("hidden");
  setButtonEnabled(els.battleButton, true);
  els.battleButton.classList.remove("hidden");
  els.nextDialogueButton.classList.remove("hidden", "disabled");
  els.nextDialogueButton.disabled = false;
}

function transitionToNextStageLesson(stage, nextStage, nextIndex) {
  if (!nextStage) {
    showStageLesson(nextIndex);
    return false;
  }

  const nextBackgroundKey = getAct1BackgroundKeyForStage(nextStage);
  const message = stage?.id === "act1_phase1_unit5_had"
    ? "The Ed Forge กำลังเปิดออก..."
    : nextStage?.id === "irregular-lesson"
      ? "Irregular Cave กำลังปรากฏ..."
      : "ความทรงจำกำลังเปลี่ยนรูป...";

  return runLessonUnitTransition(message, {
    onCovered: () => {
      setActBackground(nextBackgroundKey, { warnMissing: true });
    },
    onFinished: () => {
      showStageLesson(nextIndex, { lessonStepIndex: 0, dialogueIndex: 0 });
    }
  });
}

function showStageReward(stage) {
  if (isFinalBossStage(stage)) {
    console.warn("[FinalBoss] showStageReward called for final boss; redirecting to post boss dialogue");
    startPostBossDialogue(stage);
    return;
  }

  const nextIndex = state.actStageIndex + 1;
  const isReplay = isReplayingStage(stage);
  const grammariaEarned = state.lastGrammariaResult?.bossId === (getBossProgressId(stage) || stage.id)
    ? state.lastGrammariaResult.earned || 0
    : 0;
  state.isLessonSummaryOpen = false;
  restoreLessonUIAfterBattle();
  const rewardLines = isReplay
    ? [
      state.lastStageResult.totalQuestions
        ? `คำตอบถูกต้อง: ${state.lastStageResult.correctAnswers} / ${state.lastStageResult.totalQuestions}`
        : "บทเรียนเสร็จสิ้น",
      "เรียนซ้ำสำเร็จ",
      "ไม่มีการรับ Grammaria หรือรางวัลซ้ำในโหมดเรียนซ้ำ"
    ]
    : [
      state.lastStageResult.totalQuestions
        ? `คำตอบถูกต้อง: ${state.lastStageResult.correctAnswers} / ${state.lastStageResult.totalQuestions}`
        : "บทเรียนเสร็จสิ้น",
      `Fragment: ${stage.reward.fragment}`,
      `Grammaria ที่ได้รับ: +${grammariaEarned}`
    ];

  updateLessonChrome(stage, state.actStageIndex, "lesson");
  els.nounActivityVisual.querySelector("h3").textContent = isReplay ? "เรียนซ้ำสำเร็จ" : "ได้รับ Fragment";
  els.activityFeedback.textContent = isReplay
    ? "คุณได้ทบทวนบทเรียนนี้แล้ว ไม่มีรางวัลซ้ำ"
    : `ได้รับ ${stage.reward.fragment} และ Grammaria +${grammariaEarned}`;
  renderActionCards(rewardLines, "lesson-card");
  const nextStage = getPlayableStages()[nextIndex];
  if (nextStage && !isReplay) {
    console.log("[Progress] Next lesson:", nextStage.id);
    saveProgress({
      currentStageId: nextStage.id,
      currentLessonId: nextStage.id,
      currentScreen: "lesson",
      lastSafeScreen: "lesson",
      lessonPhase: "teacherExplanation",
      currentDialogueIndex: 0,
      currentLessonStepIndex: 0
    });
  }
  if (isReplay) {
    setBattleButtonAction("กลับเมนูผู้เล่น", () => {
      state.activeReplayLessonId = null;
      state.replayReturnProgress = null;
      showMainMenu();
    });
    showScene("story");
    return;
  }
  const rewardButtonLabel = stage.id === "ed-mini-boss"
    ? "ไปยัง Irregular Verbs"
    : shouldTransitionToNextStageFromReward(stage)
      ? "เดินทางสู่ The Ed Forge"
    : nextStage && nextStage.type === "final-boss"
      ? "ต่อสู้บอสปรากฏตัว"
      : "ด่านถัดไป";
  setBattleButtonAction(rewardButtonLabel, () => {
    if (nextStage) {
      transitionToNextStageLesson(stage, nextStage, nextIndex);
      return;
    }
    showStageLesson(nextIndex);
  });
  showScene("story");
}

function resetBattle() {
  clearEnemyTurnTimer();
  stopTimer("charge");
  stopParryCountdown();
  cleanupBossHeavyAttackChain({ clearParryUi: true });

  state.playerHp = 100;
  state.enemyHp = 80;
  state.enemyMaxHp = 80;
  state.grammaria = 0;
  state.sparkBonus = 0;
  state.currentQuestion = null;
  state.answerCorrect = false;
  state.selectedCharm = null;
  state.shield = 0;
  state.guardShield = 0;
  state.parryAttack = null;
  resetBattleActiveEffects();

  updateBattleStats();
  updateBattleEnemyVisual();
  updatePlayerProgress({
    hp: state.playerHp,
    progress: { currentScene: "battle" }
  });
  setActionButtonsEnabled(true);
  els.battleMessage.textContent = "Memory Shade ลอยออกมาจากเศษประโยคอดีต";
  showOnlyBattlePanel(els.actionMenu);
  setBattleTurnOwner("player");
  showScene("battle");
}

function updateBattleEnemyVisual(stage = null) {
  const enemyName = stage && stage.enemy ? stage.enemy : "Memory Shade";
  const thaiName = stage && stage.thaiEnemy ? stage.thaiEnemy : enemyName;
  const sprite = enemySpriteMap[enemyName] || assetPath("memory-shade.png");
  const isTimeDust = enemyName === "Time Dust";
  const isEchoTrick = enemyName === "Echo Tick";
  const isYesterdaySpirit = enemyName === "Yesterday Sprite";
  const isMemoryBreaker = enemyName === "The Memory Breaker" || enemyName === "ผู้ทำลายความทรงจำ";

  if (els.battleEnemySprite) {
    els.battleEnemySprite.onerror = null;
    els.battleEnemySprite.classList.toggle("timedust-gif", isTimeDust);
    els.battleEnemySprite.classList.toggle("echo-trick-gif", isEchoTrick);
    els.battleEnemySprite.classList.toggle("yesterday-spirit-gif", isYesterdaySpirit);
    els.battleEnemySprite.classList.toggle("memory-breaker-gif", isMemoryBreaker);
    if (isTimeDust || isEchoTrick || isYesterdaySpirit || isMemoryBreaker) {
      const specialEnemyClass = isTimeDust
        ? "timedust-gif"
        : isEchoTrick
          ? "echo-trick-gif"
          : isYesterdaySpirit
            ? "yesterday-spirit-gif"
            : "memory-breaker-gif";
      const fallbackSprite = isTimeDust
        ? TIME_DUST_FALLBACK_IMAGE_PATH
        : isEchoTrick
          ? ECHO_TRICK_FALLBACK_IMAGE_PATH
          : isYesterdaySpirit
            ? YESTERDAY_SPIRIT_FALLBACK_IMAGE_PATH
            : MEMORY_BREAKER_FALLBACK_IMAGE_PATH;
      const warnLabel = isTimeDust ? "TimeDust" : (isEchoTrick ? "EchoTrick" : (isYesterdaySpirit ? "YesterdaySpirit" : "MemoryBreaker"));
      els.battleEnemySprite.onerror = error => {
        console.warn(`[${warnLabel}] transparent GIF failed to load`, error);
        els.battleEnemySprite.onerror = null;
        els.battleEnemySprite.classList.remove(specialEnemyClass);
        els.battleEnemySprite.src = fallbackSprite;
      };
    }
    els.battleEnemySprite.src = sprite;
    els.battleEnemySprite.alt = enemyName;
  }

  if (els.battleEnemyName) {
    els.battleEnemyName.textContent = thaiName;
  }

  if (els.battleEnemyDescription) {
    els.battleEnemyDescription.textContent = enemyDescriptions[enemyName] || "เงาความทรงจำจาก Past Fragment";
  }
}

function getPlayerBattleStatusParts(playerStatus = getBattleStatus("player")) {
  const statusParts = [];
  if (playerStatus?.defenseShieldPercent > 0 && playerStatus.defenseShieldHits > 0) {
    statusParts.push(`DEF ${Math.round(playerStatus.defenseShieldPercent * 100)}% x${playerStatus.defenseShieldHits}`);
  }
  if (playerStatus?.hitShieldStacks > 0) {
    statusParts.push(`เกราะ x${playerStatus.hitShieldStacks}`);
  }
  if (playerStatus?.markedHits > 0) {
    statusParts.push(`Marked +${Math.round(playerStatus.markDamageBonus * 100)}%`);
  }
  return statusParts;
}

function getBossBattleStatusParts(bossStatus = getBattleStatus("boss")) {
  const threshold = bossStatus?.stunThreshold || STATUS_BALANCE_CONFIG.stun.defaultThreshold;
  const statusParts = [`Stun ${Math.round(bossStatus?.stunGauge || 0)}/${threshold}`];
  if (bossStatus?.stunnedTurns > 0) {
    statusParts.push(`Stunned x${bossStatus.stunnedTurns}`);
  }
  if (bossStatus?.markedHits > 0) {
    statusParts.push(`Marked +${Math.round(bossStatus.markDamageBonus * 100)}%`);
  }
  return statusParts;
}

function renderPlayerBattleStatuses(playerStatus = getBattleStatus("player")) {
  if (!els.shieldText) {
    return;
  }
  const playerStatusParts = getPlayerBattleStatusParts(playerStatus);
  els.shieldText.textContent = playerStatusParts.length ? playerStatusParts.join(" | ") : "ไม่มี";
}

function renderBossBattleStatuses(bossStatus = getBattleStatus("boss")) {
  if (!els.bossStatusText) {
    return;
  }
  els.bossStatusText.textContent = getBossBattleStatusParts(bossStatus).join(" | ");
}

function updateBattleStats() {
  const playerPercent = (state.playerHp / 100) * 100;
  const enemyMaxHp = state.enemyMaxHp || 80;
  const enemyPercent = (state.enemyHp / enemyMaxHp) * 100;

  els.playerHpFill.style.width = `${playerPercent}%`;
  els.enemyHpFill.style.width = `${enemyPercent}%`;
  els.playerHpText.textContent = `พลังชีวิต ${state.playerHp} / 100`;
  els.enemyHpText.textContent = `พลังชีวิต ${state.enemyHp} / ${enemyMaxHp}`;
  els.grammariaText.textContent = state.grammaria;

  const statuses = ensureBattleStatuses();
  renderPlayerBattleStatuses(statuses?.player || null);
  renderBossBattleStatuses(statuses?.boss || null);

  updateActAPUI();
}

function startAttack() {
  setBattleTurnOwner("player");
  const rawQuestion = pickQuestion(questions, state.usedGeneralQuestionIds, state.lastGeneralQuestionBaseVerb);
  state.currentQuestion = prepareQuestion(rawQuestion);
  state.usedGeneralQuestionIds.add(state.currentQuestion.id);
  state.lastGeneralQuestionBaseVerb = state.currentQuestion.baseVerb || "";
  state.answerCorrect = false;
  state.selectedCharm = null;

  els.questionText.textContent = state.currentQuestion.text;
  els.answerOptions.innerHTML = "";

  state.currentQuestion.options.forEach(option => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-button";
    button.textContent = option;
    button.addEventListener("click", () => chooseAnswer(option));
    els.answerOptions.appendChild(button);
  });

  els.battleMessage.textContent = "ระบุความหมายก่อนร่ายเวท";
  showOnlyBattlePanel(els.questionPanel);
}

function chooseAnswer(option) {
  state.answerCorrect = option === (state.currentQuestion.correctAnswer || state.currentQuestion.correct);
  els.battleMessage.textContent = state.answerCorrect
    ? "คำนั้นเปล่งแสงแห่งความหมาย เลือกเครื่องรางหนึ่งชิ้น"
    : "ความหมายเริ่มสั่นไหว เครื่องรางอาจยังช่วยปกป้องเจ้าได้";
  showCharmChoices();
}

function showCharmChoices() {
  els.charmOptions.innerHTML = "";
  els.charmOptions.classList.remove("battle-flow-v2-options");

  sample(charms, 3).forEach(charm => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "charm-card";
    button.innerHTML = `<strong>${charm.name}</strong><span>${charm.effect}</span>`;
    button.addEventListener("click", () => chooseCharm(charm));
    els.charmOptions.appendChild(button);
  });

  showOnlyBattlePanel(els.charmPanel);
}

function chooseCharm(charm) {
  state.selectedCharm = charm;
  els.battleMessage.textContent = `เลือก ${charm.name} แล้ว กดค้างเพื่อชาร์จ Grammaria`;
  startCharge();
}

function startCharge() {
  showOnlyBattlePanel(els.chargePanel);
  setupGrammariaCharge({
    label: state.selectedCharm?.name || "Grammaria",
    onComplete: chargePercent => resolvePlayerAttack(chargePercent)
  });
}

function setupGrammariaCharge({ label = "Grammaria", onComplete } = {}) {
  cleanupGrammariaCharge({ resetUi: false });
  state.charge = {
    label,
    onComplete,
    isCharging: false,
    completed: false,
    value: GRAMMARIA_CHARGE_CONFIG.min,
    direction: 1,
    lastTime: null,
    frame: null,
    lastPointerFinishAt: 0
  };
  updateChargeBarUI(0, `กดค้างเพื่อชาร์จ ${label}`);
  if (els.stopChargeButton) {
    els.stopChargeButton.textContent = "กดค้างเพื่อชาร์จ";
    els.stopChargeButton.disabled = false;
  }
}

function updateChargeBarUI(value = 0, feedback = "") {
  const percent = clamp(Math.round(Number(value) || 0), GRAMMARIA_CHARGE_CONFIG.min, GRAMMARIA_CHARGE_CONFIG.max);
  if (els.perfectZone) {
    els.perfectZone.style.width = `${percent}%`;
    els.perfectZone.style.left = "0";
  }
  if (els.chargeMarker) {
    els.chargeMarker.style.left = `calc(${percent}% - 4px)`;
  }
  if (els.chargePercentText) {
    els.chargePercentText.textContent = `Charge ${percent}%`;
  }
  if (els.chargeFeedbackText && feedback) {
    els.chargeFeedbackText.textContent = feedback;
  }
}

function startGrammariaChargeHold(event = null) {
  if (event) {
    event.preventDefault();
  }

  const charge = state.charge;
  if (!charge || charge.completed || charge.isCharging) {
    return;
  }

  playButtonSfx();
  charge.isCharging = true;
  charge.lastTime = null;
  if (els.stopChargeButton) {
    els.stopChargeButton.textContent = "ปล่อยเพื่อหยุด";
  }
  updateChargeBarUI(charge.value, "ปล่อยเพื่อหยุดค่า Charge");

  const step = timestamp => {
    const current = state.charge;
    if (!current || !current.isCharging || current.completed) {
      return;
    }

    if (!current.lastTime) {
      current.lastTime = timestamp;
    }

    const elapsed = Math.min(timestamp - current.lastTime, 80);
    current.lastTime = timestamp;
    current.value += (elapsed / 1000) * GRAMMARIA_CHARGE_CONFIG.speedPerSecond * current.direction;

    if (current.value >= GRAMMARIA_CHARGE_CONFIG.max) {
      current.value = GRAMMARIA_CHARGE_CONFIG.max;
      current.direction = -1;
    }

    if (current.value <= GRAMMARIA_CHARGE_CONFIG.min) {
      current.value = GRAMMARIA_CHARGE_CONFIG.min;
      current.direction = 1;
    }

    updateChargeBarUI(current.value, "ปล่อยเพื่อหยุดค่า Charge");
    current.frame = requestAnimationFrame(step);
  };

  charge.frame = requestAnimationFrame(step);
}

function finishGrammariaCharge(event = null, { cancel = false } = {}) {
  if (event) {
    event.preventDefault();
  }

  const charge = state.charge;
  if (!charge || charge.completed) {
    return;
  }

  if (!charge.isCharging && !cancel) {
    return;
  }

  if (charge.frame) {
    cancelAnimationFrame(charge.frame);
  }
  charge.frame = null;
  charge.isCharging = false;

  if (cancel) {
    cleanupGrammariaCharge();
    return;
  }

  charge.completed = true;
  charge.lastPointerFinishAt = Date.now();
  const percent = clamp(Math.round(charge.value), GRAMMARIA_CHARGE_CONFIG.min, GRAMMARIA_CHARGE_CONFIG.max);
  updateChargeBarUI(percent, `Grammaria Charge: ${percent}% - พลังโจมตีรอบนี้เพิ่มขึ้น ${percent}%`);
  if (els.stopChargeButton) {
    els.stopChargeButton.textContent = `Charge ${percent}%`;
    els.stopChargeButton.disabled = true;
  }

  const onComplete = charge.onComplete;
  state.charge = null;
  if (typeof onComplete === "function") {
    onComplete(percent);
  }
}

function cleanupGrammariaCharge({ resetUi = true } = {}) {
  const charge = state.charge;
  if (charge?.frame) {
    cancelAnimationFrame(charge.frame);
  }
  state.charge = null;
  if (resetUi) {
    updateChargeBarUI(0, "กดค้างเพื่อชาร์จ แล้วปล่อยเพื่อหยุดค่า");
    if (els.stopChargeButton) {
      els.stopChargeButton.textContent = "กดค้างเพื่อชาร์จ";
      els.stopChargeButton.disabled = false;
    }
  }
}

function stopTimer(type) {
  if (type === "charge") {
    cleanupGrammariaCharge();
    return;
  }

  const timer = state[type];
  if (timer && timer.frame) {
    cancelAnimationFrame(timer.frame);
  }
  state[type] = null;
}

function stopParryCountdown() {
  if (!state.parry) {
    return;
  }

  if (state.parry.armedTimeout) {
    clearTimeout(state.parry.armedTimeout);
  }

  if (state.parry.tickTimeout) {
    clearTimeout(state.parry.tickTimeout);
  }

  if (state.parry.resolveTimeout) {
    clearTimeout(state.parry.resolveTimeout);
  }

  if (state.parry.gaugeFrame) {
    cancelAnimationFrame(state.parry.gaugeFrame);
  }

  state.parry = null;
  els.parryButton.disabled = false;
  clearParryLayoutState();
}

function createParryBarChallenge(config = {}) {
  return {
    id: `parry-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    startedAt: performance.now(),
    durationMs: config.durationMs || 1200,
    resolved: false,
    inputArmed: false,
    armedTimeout: null
  };
}

function isCurrentParryBarChallenge(challengeId) {
  return Boolean(state.parry && state.parry.challengeId === challengeId && !state.parry.resolved);
}

function armParryBarChallenge(challengeId) {
  if (!isCurrentParryBarChallenge(challengeId)) {
    return;
  }
  state.parry.inputArmed = true;
  els.parryButton.disabled = false;
  console.log("[ParryBar] armed", { challengeId });
}

function scheduleParryBarArming(challengeId) {
  if (!state.parry) {
    return;
  }
  state.parry.armedTimeout = setTimeout(() => armParryBarChallenge(challengeId), PARRY_BAR_ARM_DELAY_MS);
}

function timingResult(progress, perfectWidth) {
  const perfectStart = (100 - perfectWidth) / 2;
  const perfectEnd = perfectStart + perfectWidth;
  const greatStart = perfectStart - 12;
  const greatEnd = perfectEnd + 12;
  const goodStart = perfectStart - 24;
  const goodEnd = perfectEnd + 24;

  if (progress >= perfectStart && progress <= perfectEnd) {
    return "PERFECT";
  }

  if (progress >= greatStart && progress <= greatEnd) {
    return "GREAT";
  }

  if (progress >= goodStart && progress <= goodEnd) {
    return "GOOD";
  }

  return "MISS";
}

function thaiTimingName(result) {
  const names = {
    PERFECT: "สมบูรณ์แบบ",
    GREAT: "ยอดเยี่ยม",
    GOOD: "ดี",
    MISS: "พลาด"
  };

  return names[result] || result;
}

function stopCharge() {
  if (!state.charge) {
    return;
  }

  finishGrammariaCharge();
}

function resolvePlayerAttack(chargePercent = 0) {
  const normalizedChargePercent = clamp(Math.round(Number(chargePercent) || 0), 0, 100);
  let damage = 0;
  let message = "";

  if (state.answerCorrect) {
    triggerMotion(els.battlePlayer, "player-attack-motion");
    damage = 25;

    if (state.selectedCharm.id === "minorPower") {
      damage *= 1.1;
    }

    if (state.selectedCharm.id === "attackRune") {
      damage *= 1.25;
    }

    const baseDamage = Math.round(damage);
    const chargeDamage = calculateChargeDamage(baseDamage, normalizedChargePercent);
    damage = chargeDamage.finalDamage;
    state.enemyHp = clamp(state.enemyHp - damage, 0, 80);
    recordPlayerDamage(damage, "grammariaCharge", {
      chargePercent: normalizedChargePercent
    });
    recordChargeBonusDamage(chargeDamage.bonusDamage);
    triggerEnemyHitFeedback(damage);
    state.grammaria += 20;
    recordGrammariaChargeUse(normalizedChargePercent);

    if (state.selectedCharm.id === "tinyHeal") {
      state.playerHp = clamp(state.playerHp + 8, 0, 100);
    }

    if (state.selectedCharm.id === "grammariaSpark") {
      state.sparkBonus += 5;
    }

    message = `ผู้พเนจรร่ายแกรมมาเรีย!\n${buildChargeFeedback(chargeDamage.percent, baseDamage, chargeDamage.bonusDamage, chargeDamage.finalDamage)}`;
  } else {
    if (state.selectedCharm.id === "guardWord") {
      state.guardShield = 0.3;
    }

    message = `แกรมมาเรียเลือนหาย ความหมายยังไม่ชัดเจน Charge ${normalizedChargePercent}% จึงโจมตีไม่ได้`;
  }

  updateBattleStats();
  syncBattleStateToPlayerData();
  endPlayerTurn(message);
}

function useItem() {
  endPlayerTurn("เจ้ายังไม่มีไอเทมต่อสู้ จังหวะลังเลเปิดช่องให้ศัตรูโจมตี");
}

function endPlayerTurn(message) {
  clearEnemyTurnTimer();
  showOnlyBattlePanel(null);
  els.battleMessage.textContent = message;

  if (state.enemyHp <= 0) {
    setTimeout(showVictory, 900);
    return;
  }

  setActionButtonsEnabled(false);
  state.enemyTurnTimer = setTimeout(() => {
    state.enemyTurnTimer = null;
    startEnemyTurn();
  }, 900);
}

function focusTurn() {
  state.shield = 0.4;
  updateBattleStats();
  endPlayerTurn("ผู้พเนจรตั้งสมาธิและทำให้กระแสแกรมมาเรียนิ่งขึ้น");
}

function startEnemyTurn(pattern = enemyAttackPatterns.normal) {
  startEnemyAttack(pattern);
}

function startEnemyAttack(pattern) {
  clearEnemyTurnTimer();
  stopParryCountdown();
  setActionButtonsEnabled(false);
  setBattleTurnOwner("enemy");
  triggerMotion(els.battleEnemy, "enemy-attack-motion");
  state.parryAttack = {
    pattern,
    hitIndex: 0,
    results: [],
    totalDamage: 0,
    totalCounterDamage: 0,
    perfectStreak: 0,
    maxPerfectStreak: 0,
    streakBonus: false,
    fullPerfectBonus: false
  };

  els.battleMessage.textContent = pattern.hits > 1
    ? `${pattern.announce}\nเตรียมปัดป้อง ${pattern.hits} hit ติดต่อกัน!`
    : pattern.announce;

  showBattleContinueButton("เตรียมพร้อม", () => {
    els.continueBattleButton.classList.add("hidden");
    els.battleMessage.textContent = "จับจังหวะเส้นสีขาวให้เข้าโซนเป้าหมาย ส้ม/เหลือง/เขียว...";
    setTimeout(beginNextParryHit, 420);
  });
}

function beginNextParryHit() {
  const attack = state.parryAttack;
  if (!attack) {
    return;
  }

  if (attack.hitIndex >= attack.pattern.hits) {
    finishEnemyAttackSequence();
    return;
  }

  attack.hitIndex += 1;
  const hitNumber = attack.hitIndex;
  const pattern = attack.pattern;
  const gaugeZoneWidth = Math.max(12, pattern.gaugeZoneWidth - ((hitNumber - 1) * pattern.gaugeZoneShrinkPerHit));
  const gaugeSpeed = Math.max(720, pattern.gaugeSpeed - ((hitNumber - 1) * pattern.gaugeSpeedUpPerHit));

  const durationMs = Math.max(2600, 3800 - (hitNumber * 250));
  const challenge = createParryBarChallenge({ durationMs });
  state.parry = {
    challengeId: challenge.id,
    active: true,
    resolved: false,
    inputArmed: false,
    inputLocked: false,
    startedAt: challenge.startedAt,
    durationMs: challenge.durationMs,
    armedTimeout: null,
    hitNumber,
    totalHits: pattern.hits,
    tickTimeout: null,
    resolveTimeout: null,
    gaugeProgress: 0,
    gaugeDirection: 1,
    gaugeLastTime: null,
    gaugeFrame: null,
    gaugeSpeed,
    zoneMoves: true,
    gaugeZoneWidth,
    gaugeZoneMinWidth: Math.max(8, gaugeZoneWidth - 12),
    gaugeZoneShrinkPerSecond: 4 + hitNumber,
    gaugeZoneStart: Math.random() * (100 - gaugeZoneWidth),
    gaugeZoneDirection: Math.random() < 0.5 ? -1 : 1,
    gaugeZoneSpeed: Math.max(1100, pattern.gaugeSpeed + 650 - (hitNumber * 90))
  };

  els.enemyAttackName.textContent = pattern.name;
  els.parryHitText.textContent = `Hit ${hitNumber} / ${pattern.hits}`;
  els.parryCountdown.textContent = "TAP";
  els.parryHitResult.textContent = attack.results.length
    ? `ผลล่าสุด: ${thaiParryName(attack.results[attack.results.length - 1].result)}`
    : "";
  els.parryGaugeZone.style.width = `${gaugeZoneWidth}%`;
  els.parryGaugeZone.style.left = `${state.parry.gaugeZoneStart}%`;
  els.parryButton.disabled = true;
  showOnlyBattlePanel(els.parryPanel);
  console.log("[ParryBar] start", {
    challengeId: challenge.id,
    durationMs
  });
  startParryBarAfterLayout(challenge.id, durationMs, () => {
    console.log("[ParryBar] timeout = miss", {
      challengeId: challenge.id,
      progress: state.parry.gaugeProgress
    });
    resolveCountdownParry("MISS", { source: "timeout", challengeId: challenge.id });
  });
}

function startParryGauge(challengeId = state.parry?.challengeId) {
  const step = timestamp => {
    if (!isCurrentParryBarChallenge(challengeId) || !state.parry.active) {
      return;
    }

    if (!state.parry.gaugeLastTime) {
      state.parry.gaugeLastTime = timestamp;
    }

    const elapsed = timestamp - state.parry.gaugeLastTime;
    state.parry.gaugeLastTime = timestamp;
    state.parry.gaugeProgress += (elapsed / state.parry.gaugeSpeed) * 100 * state.parry.gaugeDirection;

    if (state.parry.zoneMoves) {
      const shrinkAmount = (elapsed / 1000) * state.parry.gaugeZoneShrinkPerSecond;
      state.parry.gaugeZoneWidth = Math.max(
        state.parry.gaugeZoneMinWidth,
        state.parry.gaugeZoneWidth - shrinkAmount
      );

      state.parry.gaugeZoneStart += (elapsed / state.parry.gaugeZoneSpeed) * 100 * state.parry.gaugeZoneDirection;

      const maxZoneStart = 100 - state.parry.gaugeZoneWidth;
      if (state.parry.gaugeZoneStart >= maxZoneStart) {
        state.parry.gaugeZoneStart = maxZoneStart;
        state.parry.gaugeZoneDirection = -1;
      }

      if (state.parry.gaugeZoneStart <= 0) {
        state.parry.gaugeZoneStart = 0;
        state.parry.gaugeZoneDirection = 1;
      }

      els.parryGaugeZone.style.width = `${state.parry.gaugeZoneWidth}%`;
      els.parryGaugeZone.style.left = `${state.parry.gaugeZoneStart}%`;
    }

    if (state.parry.gaugeProgress >= 100) {
      state.parry.gaugeProgress = 100;
      state.parry.gaugeDirection = -1;
    }

    if (state.parry.gaugeProgress <= 0) {
      state.parry.gaugeProgress = 0;
      state.parry.gaugeDirection = 1;
    }

    els.parryGaugeMarker.style.left = `calc(${state.parry.gaugeProgress}% - 5px)`;
    state.parry.gaugeFrame = requestAnimationFrame(step);
  };

  els.parryGaugeMarker.style.left = "0";
  state.parry.gaugeFrame = requestAnimationFrame(step);
}

function showParryCount(count) {
  els.parryCountdown.textContent = count;
  els.parryCountdown.classList.remove("pulse");
  void els.parryCountdown.offsetWidth;
  els.parryCountdown.classList.add("pulse");
}

function scheduleParryCount(count) {
  if (!state.parry || !state.parry.active) {
    return;
  }
  const challengeId = state.parry.challengeId;

  if (count > 1) {
    state.parry.tickTimeout = setTimeout(() => {
      if (!isCurrentParryBarChallenge(challengeId)) {
        return;
      }
      showParryCount(count - 1);
      scheduleParryCount(count - 1);
    }, state.parry.stepDuration);
    return;
  }

  state.parry.resolveTimeout = setTimeout(() => {
    if (!isCurrentParryBarChallenge(challengeId)) {
      return;
    }
    console.log("[ParryBar] timeout = miss", {
      challengeId,
      progress: state.parry.gaugeProgress
    });
    resolveCountdownParry("MISS", { source: "timeout", challengeId });
  }, state.parry.stepDuration + 650);
}

function stopParry(event = null) {
  if (!event) {
    console.warn("[ParryBar] ignored input without player event");
    return;
  }
  if (event.isTrusted === false) {
    console.warn("[ParryBar] ignored synthetic event");
    return;
  }
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (!state.parry || !state.parry.active || state.parry.inputLocked) {
    return;
  }
  const challengeId = state.parry.challengeId;
  if (!state.parry.inputArmed) {
    console.warn("[ParryBar] ignored early input", { challengeId });
    return;
  }

  state.parry.inputLocked = true;
  const frozenProgress = state.parry.gaugeProgress;
  els.parryGaugeMarker.style.left = `calc(${frozenProgress}% - 5px)`;
  const frozenResult = parryGaugeResult(frozenProgress, HIT_TOLERANCE);
  els.parryButton.disabled = true;
  console.log("[ParryBar] input", {
    challengeId,
    isTrusted: event.isTrusted,
    progress: frozenProgress,
    grade: frozenResult.toLowerCase()
  });

  if (state.actBattle && state.actBattle.awaitingParry) {
    freezeParryFeedback(frozenResult, () => stopActParry(frozenResult, { source: "player", challengeId }), challengeId);
    return;
  }

  const result = state.parry.targetTime
    ? countdownParryResult(performance.now(), frozenResult)
    : frozenResult;
  freezeParryFeedback(result, () => resolveCountdownParry(result, { source: "player", challengeId }), challengeId);
}

function freezeParryFeedback(result, onDone, challengeId = state.parry?.challengeId) {
  if (!state.parry) {
    onDone();
    return;
  }
  if (!isCurrentParryBarChallenge(challengeId)) {
    return;
  }

  if (state.parry.tickTimeout) {
    clearTimeout(state.parry.tickTimeout);
    state.parry.tickTimeout = null;
  }

  if (state.parry.resolveTimeout) {
    clearTimeout(state.parry.resolveTimeout);
    state.parry.resolveTimeout = null;
  }

  if (state.parry.gaugeFrame) {
    cancelAnimationFrame(state.parry.gaugeFrame);
    state.parry.gaugeFrame = null;
  }

  const gauge = document.getElementById("parryGauge");
  els.parryGaugeZone.classList.remove("flash-perfect", "flash-good", "flash-weak");
  if (gauge) {
    gauge.classList.remove("flash-miss");
  }

  if (result === "PERFECT") {
    els.parryGaugeZone.classList.add("flash-perfect");
  } else if (result === "GOOD") {
    els.parryGaugeZone.classList.add("flash-good");
  } else if (result === "WEAK") {
    els.parryGaugeZone.classList.add("flash-weak");
  } else if (gauge) {
    gauge.classList.add("flash-miss");
  }

  els.parryHitResult.textContent = `${thaiParryName(result)}!`;
  setTimeout(() => {
    if (!isCurrentParryBarChallenge(challengeId)) {
      return;
    }
    els.parryGaugeZone.classList.remove("flash-perfect", "flash-good", "flash-weak");
    if (gauge) {
      gauge.classList.remove("flash-miss");
    }
    onDone();
  }, 680);
}

function countdownParryResult(clickTime, frozenGaugeResult = null) {
  if (!state.parry.targetTime) {
    return frozenGaugeResult || parryGaugeResult(state.parry.gaugeProgress, HIT_TOLERANCE);
  }

  const diff = Math.abs(clickTime - state.parry.targetTime);
  const tooEarly = clickTime < state.parry.targetTime - 700;
  const tooLate = clickTime > state.parry.targetTime + 1050;
  const gaugeResult = frozenGaugeResult || parryGaugeResult(state.parry.gaugeProgress, HIT_TOLERANCE);

  if (tooEarly || tooLate) {
    return "MISS";
  }

  if (diff <= 250) {
    return gaugeResult === "MISS" ? "GOOD" : gaugeResult;
  }

  if (diff <= 550) {
    return gaugeResult === "MISS" ? "WEAK" : gaugeResult === "PERFECT" ? "GOOD" : gaugeResult;
  }

  return gaugeResult === "MISS" ? "WEAK" : gaugeResult;
}

function parryGaugeResult(progress, tolerance = 0) {
  const zoneStart = state.parry.gaugeZoneStart;
  const width = state.parry.gaugeZoneWidth;
  const weakStart = zoneStart - tolerance;
  const weakEnd = zoneStart + width + tolerance;
  const goodStart = zoneStart + (width * 0.24) - tolerance;
  const goodEnd = zoneStart + (width * 0.76) + tolerance;
  const perfectStart = zoneStart + (width * 0.38) - tolerance;
  const perfectEnd = zoneStart + (width * 0.62) + tolerance;

  if (progress >= perfectStart && progress <= perfectEnd) {
    return "PERFECT";
  }

  if (progress >= goodStart && progress <= goodEnd) {
    return "GOOD";
  }

  if (progress >= weakStart && progress <= weakEnd) {
    return "WEAK";
  }

  return "MISS";
}

function resolveCountdownParry(result, meta = {}) {
  if (!state.parry || !state.parry.active) {
    return;
  }
  if (meta.challengeId && !isCurrentParryBarChallenge(meta.challengeId)) {
    console.warn("[ParryBar] ignored stale result", meta);
    return;
  }

  const hitNumber = state.parry.hitNumber;
  state.parry.resolved = true;
  state.parry.active = false;
  els.parryButton.disabled = true;
  console.log("[ParryBar] result", {
    grade: result.toLowerCase(),
    source: meta.source || "player",
    challengeId: meta.challengeId || state.parry.challengeId
  });
  stopParryCountdown();
  resolveEnemyHit(result, hitNumber, meta);
}

function resolveEnemyHit(parryResult, hitNumber, meta = {}) {
  const attack = state.parryAttack;
  if (!attack) {
    return;
  }

  const hit = calculateParryHit(parryResult, attack.pattern.baseDamage, meta);
  attack.results.push({ hit: hitNumber, result: parryResult, damage: hit.damage, counterDamage: hit.counterDamage });
  attack.totalDamage += hit.damage;
  attack.totalCounterDamage += hit.counterDamage;

  if (parryResult === "PERFECT") {
    attack.perfectStreak += 1;
    attack.maxPerfectStreak = Math.max(attack.maxPerfectStreak, attack.perfectStreak);
    recordParryForGrammaria(parryResult, `legacy:${hitNumber}:${attack.results.length}`);
  } else {
    attack.perfectStreak = 0;
  }

  els.parryHitResult.textContent = `${thaiParryName(parryResult)} - ดาเมจที่รับ ${hit.damage}`;

  if (attack.hitIndex >= attack.pattern.hits) {
    setTimeout(finishEnemyAttackSequence, 700);
    return;
  }

  setTimeout(beginNextParryHit, 700);
}

function calculateParryHit(parryResult, baseDamage, meta = {}) {
  if (parryResult === "PERFECT") {
    return { damage: 0, counterDamage: PARRY_BALANCE_CONFIG.parryBar.counterDamagePerfect };
  }

  if (parryResult === "GOOD") {
    return { damage: Math.round(baseDamage * 0.4), counterDamage: PARRY_BALANCE_CONFIG.parryBar.counterDamageGood };
  }

  if (parryResult === "WEAK") {
    return { damage: Math.round(baseDamage * 0.7), counterDamage: 0 };
  }

  if (parryResult === "MISS" && meta.source !== "timeout" && useBattleEffect("secondChance")) {
    return { damage: Math.round(baseDamage * 0.5), counterDamage: 0 };
  }

  return { damage: baseDamage, counterDamage: 0 };
}

function finishEnemyAttackSequence() {
  const attack = state.parryAttack;
  if (!attack) {
    return;
  }

  let totalDamage = attack.totalDamage;
  let totalCounterDamage = attack.totalCounterDamage;
  const counts = countParryResults(attack.results);
  const summaryLines = [];

  if (attack.maxPerfectStreak >= 3) {
    attack.streakBonus = true;
    totalCounterDamage += 10;
    summaryLines.push("Perfect Streak! Grammaria Counter is charging!");
  }

  if (attack.pattern.hits > 1 && counts.PERFECT === attack.pattern.hits) {
    attack.fullPerfectBonus = true;
    totalCounterDamage += 20;
    summaryLines.push("GRAMMARIA COUNTER BURST!");
  }

  if (state.shield > 0) {
    totalDamage *= 1 - state.shield;
    state.shield = 0;
  }

  if (state.guardShield > 0) {
    totalDamage *= 1 - state.guardShield;
    state.guardShield = 0;
  }

  totalDamage = Math.round(totalDamage);
  state.playerHp = clamp(state.playerHp - totalDamage, 0, 100);
  state.enemyHp = clamp(state.enemyHp - totalCounterDamage, 0, 80);
  recordBossDamage(totalDamage, "legacyEnemyAttack");
  recordParryCounterDamage(totalCounterDamage, "legacyParryCounter");
  if (totalDamage > 0) {
    playAttackSfx();
  }
  triggerEnemyHitFeedback(totalCounterDamage);

  updateBattleStats();
  syncBattleStateToPlayerData();
  showOnlyBattlePanel(null);
  els.battleMessage.textContent = buildParrySummary(attack, counts, totalDamage, totalCounterDamage, summaryLines);
  state.parryAttack = null;
  setBattleTurnOwner("player");

  if (state.enemyHp <= 0) {
    setTimeout(showVictory, 900);
    return;
  }

  if (resolvePlayerDefeat("HP เหลือ 0")) {
    return;
  }

  showBattleContinueButton("ตาผู้เล่น", () => {
    els.battleMessage.textContent = "เลือกการกระทำของเจ้า";
    setActionButtonsEnabled(true);
    setBattleTurnOwner("player");
    showOnlyBattlePanel(els.actionMenu);
  });
}

function countParryResults(results) {
  return results.reduce((counts, item) => {
    counts[item.result] += 1;
    return counts;
  }, { PERFECT: 0, GOOD: 0, WEAK: 0, MISS: 0 });
}

function buildParrySummary(attack, counts, totalDamage, totalCounterDamage, bonusLines) {
  const title = attack.pattern.hits > 1 ? "สรุปผล Multi-Hit Parry" : thaiParryName(attack.results[0].result);
  const lines = [
    title,
    `ท่าโจมตี: ${attack.pattern.name}`,
    `Perfect: ${counts.PERFECT}`,
    `Good: ${counts.GOOD}`,
    `Weak: ${counts.WEAK}`,
    `Miss: ${counts.MISS}`,
    `Total Damage Taken: ${totalDamage}`
  ];

  if (totalCounterDamage > 0) {
    lines.push(`Counter Damage: ${totalCounterDamage}`);
  }

  return lines.concat(bonusLines).join("\n");
}

function thaiParryName(result) {
  const names = {
    PERFECT: "Perfect Parry",
    GOOD: "Good Parry",
    WEAK: "Weak Parry",
    MISS: "Miss"
  };

  return names[result] || result;
}

function showActEnding() {
  showFinalGrammariaEvaluation(() => {
    runSceneTransition("Past Fragment กำลังฟื้นคืน...", completeActVictoryScene);
  });
}

function calculatePercent(correct = 0, wrong = 0) {
  const total = (Number(correct) || 0) + (Number(wrong) || 0);
  return total > 0 ? Math.round(((Number(correct) || 0) / total) * 100) : null;
}

function formatAssessmentPercent(value) {
  return value === null || Number.isNaN(value) ? "รอข้อมูล" : `${value}%`;
}

function getSavedBossResult(bossId) {
  const grammariaState = playerData?.progress?.grammaria || ensureGrammariaState();
  return grammariaState?.earnedByBoss?.[bossId] || null;
}

function combineBossResults(bossIds = []) {
  return bossIds
    .map(getSavedBossResult)
    .filter(Boolean)
    .reduce((summary, result) => {
      summary.correctAnswers += Number(result.correctAnswers) || 0;
      summary.wrongAnswers += Number(result.wrongAnswers) || 0;
      summary.parryCount += Number(result.parryCount) || 0;
      summary.playerDamageDealt += Number(result.playerDamageDealt) || 0;
      summary.bossDamageDealt += Number(result.bossDamageDealt) || 0;
      summary.highestDamage = Math.max(summary.highestDamage, Number(result.highestDamage) || 0);
      if (Array.isArray(result.damageEvents)) {
        summary.damageEvents.push(...result.damageEvents);
      }
      return summary;
    }, {
      correctAnswers: 0,
      wrongAnswers: 0,
      parryCount: 0,
      playerDamageDealt: 0,
      bossDamageDealt: 0,
      highestDamage: 0,
      damageEvents: []
    });
}

function buildAct1AssessmentResult(progress = ensureActProgress()) {
  const allBossSummary = combineBossResults(["timeDustSprite", "yesterdayMite", "wasWereWisp", "memoryLantern", "lostPouchImp", "timeDust", "echoTick", "yesterdaySprite", "rewindSlime", "edForger", "irregularWraith", "memoryBreaker"]);
  const regularSummary = combineBossResults(["echoTick", "yesterdaySprite", "rewindSlime", "edForger"]);
  const irregularSummary = combineBossResults(["irregularWraith", "memoryBreaker"]);
  const finalBossSummary = combineBossResults(["memoryBreaker"]);
  const pastTimeWordsSummary = combineBossResults(["timeDustSprite", "yesterdayMite", "timeDust"]);
  const finalBossResult = getSavedBossResult("memoryBreaker");
  const totalAnswered = allBossSummary.correctAnswers + allBossSummary.wrongAnswers;
  const overallAccuracy = calculatePercent(allBossSummary.correctAnswers, allBossSummary.wrongAnswers);
  const regularAccuracy = calculatePercent(regularSummary.correctAnswers, regularSummary.wrongAnswers);
  const irregularAccuracy = calculatePercent(irregularSummary.correctAnswers, irregularSummary.wrongAnswers);
  const finalBossAccuracy = calculatePercent(finalBossSummary.correctAnswers, finalBossSummary.wrongAnswers);
  const wrongAnswersReviewed = allBossSummary.wrongAnswers;
  const completed = Boolean(progress?.finalBossDefeated || progress?.completedStages?.includes("final-boss") || finalBossResult);
  const gameEvidenceScore = [
    completed ? 3 : 0,
    overallAccuracy !== null && overallAccuracy >= 70 ? 4 : 0,
    regularAccuracy !== null && regularAccuracy >= 60 ? 2 : 0,
    irregularAccuracy !== null && irregularAccuracy >= 60 ? 2 : 0,
    wrongAnswersReviewed > 0 && completed ? 2 : 0,
    null
  ];
  const gameEvidenceEarned = gameEvidenceScore
    .filter(value => typeof value === "number")
    .reduce((total, value) => total + value, 0);
  const regularPass = regularAccuracy !== null && regularAccuracy >= 50;
  const irregularPass = irregularAccuracy !== null && irregularAccuracy >= 50;

  return {
    act: 1,
    actName: "Past Fragment",
    topic: "Past Simple Tense",
    targetGroup: "มัธยมศึกษาปีที่ 2",
    bossDefeated: "The Memory Breaker",
    completed,
    accuracy: {
      overall: overallAccuracy,
      regularVerb: regularAccuracy,
      irregularVerb: irregularAccuracy,
      sentenceCorrection: null,
      didStructure: finalBossAccuracy,
      pastTimeWords: calculatePercent(pastTimeWordsSummary.correctAnswers, pastTimeWordsSummary.wrongAnswers),
      totalAnswered
    },
    gameEvidence: {
      attempts: Math.max(1, Object.keys(playerData?.progress?.grammaria?.earnedByBoss || {}).length || 1),
      wrongAnswersReviewed,
      improvementAfterRetry: wrongAnswersReviewed > 0 && completed,
      highestCombo: finalBossSummary.highestDamage || allBossSummary.highestDamage || 0,
      perfectParry: allBossSummary.parryCount || 0,
      playerDamageDealt: allBossSummary.playerDamageDealt,
      bossDamageDealt: allBossSummary.bossDamageDealt
    },
    score: {
      knowledge: null,
      application: null,
      gameEvidence: gameEvidenceEarned,
      competency: null,
      attitude: null,
      total: null
    },
    passingConditions: {
      actCompleted: completed,
      totalScoreAtLeast60: null,
      regularAtLeast50: regularPass,
      irregularAtLeast50: irregularPass,
      reflectionSubmitted: null
    },
    qualityLevel: "รอครูประเมิน",
    teacherAssessmentRequired: true
  };
}

function assessmentStatusLabel(value) {
  if (value === null) {
    return "รอครูประเมิน";
  }
  return value ? "ผ่านเงื่อนไข" : "ควรฝึกเพิ่มเติม";
}

function renderRubricRows(items) {
  return items.map(item => `
    <div class="assessment-rubric-row">
      <span>${item.label}</span>
      <strong>${item.points === "-" ? "-" : `${item.points} คะแนน`}</strong>
      <em>${item.status || "รอครูประเมิน"}</em>
    </div>
  `).join("");
}

function renderAct1AssessmentHtml(result) {
  const shouldShowRemedial = result.passingConditions.regularAtLeast50 === false || result.passingConditions.irregularAtLeast50 === false;
  const regularRemedial = result.passingConditions.regularAtLeast50 === false
    ? "<p>ควรทบทวนกฎการเติม -ed, -d, y → ied และการเพิ่มพยัญชนะท้ายก่อนเติม -ed</p>"
    : "";
  const irregularRemedial = result.passingConditions.irregularAtLeast50 === false
    ? "<p>ควรทบทวนกริยา Irregular Verb ที่พบบ่อย เช่น go → went, eat → ate, see → saw, write → wrote</p>"
    : "";

  return `
    <section class="assessment-panel">
      <div class="assessment-header">
        <p class="eyebrow">Act 1 Completed: Past Fragment Restored</p>
        <h3>แบบประเมินผลการเรียนรู้หลังจบเกม Lingua Act 1: Past Fragment</h3>
        <p>เรื่อง Past Simple Tense • ${result.targetGroup} • คะแนนเต็ม 100 คะแนน</p>
        <p class="assessment-note">การผ่านเกมเป็นหลักฐานการเรียนรู้เบื้องต้น ครูผู้สอนจะประเมินผลร่วมกับความถูกต้องของคำตอบ การนำความรู้ไปใช้ และการสะท้อนผลของผู้เรียน</p>
      </div>

      <div class="assessment-summary-grid">
        <div><span>Final Boss Defeated</span><strong>${result.bossDefeated}</strong></div>
        <div><span>ความถูกต้องรวม</span><strong>${formatAssessmentPercent(result.accuracy.overall)}</strong></div>
        <div><span>Regular Verb Accuracy</span><strong>${formatAssessmentPercent(result.accuracy.regularVerb)}</strong></div>
        <div><span>Irregular Verb Accuracy</span><strong>${formatAssessmentPercent(result.accuracy.irregularVerb)}</strong></div>
        <div><span>Sentence Correction Accuracy</span><strong>${formatAssessmentPercent(result.accuracy.sentenceCorrection)}</strong></div>
        <div><span>did / did not Accuracy</span><strong>${formatAssessmentPercent(result.accuracy.didStructure)}</strong></div>
      </div>

      <div class="assessment-score-card">
        <h3>โครงสร้างการประเมิน 100 คะแนน</h3>
        ${renderRubricRows([
          { label: "ด้านความรู้และความถูกต้องทางไวยากรณ์", points: 40, status: "ใช้หลักฐานคำตอบในเกมประกอบ" },
          { label: "ด้านทักษะการนำความรู้ไปใช้", points: 25, status: "รอครูประเมินจากใบงาน / การสะท้อนผล" },
          { label: "ด้านหลักฐานการเรียนรู้จากเกม", points: 15, status: `${result.score.gameEvidence} / 15 คะแนน (ระบบคำนวณได้)` },
          { label: "ด้านสมรรถนะสำคัญของผู้เรียน", points: 10 },
          { label: "ด้านคุณลักษณะอันพึงประสงค์และเจตคติในการเรียนรู้", points: 10 }
        ])}
        <div class="assessment-total-line"><span>คะแนนรวมเพื่อสรุปผล</span><strong>รอครูประเมิน</strong></div>
      </div>

      <div class="assessment-two-column">
        <div class="assessment-score-card">
          <h3>ด้านความรู้และความถูกต้องทางไวยากรณ์ — 40 คะแนน</h3>
          ${renderRubricRows([
            { label: "เข้าใจคำบอกเวลาในอดีต เช่น yesterday, last night, ago, in 2020", points: 5, status: formatAssessmentPercent(result.accuracy.pastTimeWords) },
            { label: "เปลี่ยนกริยา Regular Verb พื้นฐานได้ถูกต้อง เช่น walk → walked, play → played", points: 6, status: "ใช้ Regular Verb Accuracy ประกอบ" },
            { label: "ใช้กฎเติม -d ได้ถูกต้อง เช่น like → liked, love → loved", points: 4, status: "ใช้ Regular Verb Accuracy ประกอบ" },
            { label: "ใช้กฎคำลงท้าย y ได้ถูกต้อง เช่น study → studied, play → played", points: 6, status: "ใช้ Regular Verb Accuracy ประกอบ" },
            { label: "ใช้กฎเพิ่มพยัญชนะท้ายก่อนเติม -ed ได้ถูกต้อง เช่น stop → stopped", points: 6, status: "ใช้ Regular Verb Accuracy ประกอบ" },
            { label: "เปลี่ยนกริยา Irregular Verb ที่พบบ่อยได้ถูกต้อง เช่น go → went, eat → ate", points: 8, status: formatAssessmentPercent(result.accuracy.irregularVerb) },
            { label: "ใช้โครงสร้าง did / did not + V1 ได้ถูกต้อง", points: 5, status: formatAssessmentPercent(result.accuracy.didStructure) }
          ])}
        </div>

        <div class="assessment-score-card">
          <h3>ด้านทักษะการนำความรู้ไปใช้ — 25 คะแนน</h3>
          ${renderRubricRows([
            { label: "เลือกกริยาช่องที่ 2 ได้ถูกต้องตามบริบทของประโยค", points: 5, status: "ใช้หลักฐานคำตอบในเกมประกอบ" },
            { label: "เติมประโยค Past Simple ได้ถูกต้อง", points: 5, status: "ใช้หลักฐานคำตอบในเกมประกอบ" },
            { label: "แก้ไขประโยค Past Simple ที่ผิดได้ถูกต้อง", points: 5, status: formatAssessmentPercent(result.accuracy.sentenceCorrection) },
            { label: "แต่งประโยค Past Simple จากประสบการณ์ของตนเองได้", points: 5, status: "รอครูประเมินจากใบงาน" },
            { label: "อธิบายเหตุผลของคำตอบได้อย่างง่ายเป็นภาษาไทยหรือภาษาอังกฤษ", points: 5, status: "รอครูประเมินจากการสะท้อนผล" }
          ])}
          <p>รอครูประเมินจากใบงาน / การสะท้อนผลหลังเล่นเกม</p>
        </div>
      </div>

      <div class="assessment-two-column">
        <div class="assessment-score-card">
          <h3>หลักฐานการเรียนรู้จากเกม — 15 คะแนน</h3>
          ${renderRubricRows([
            { label: "เล่นจบ Act 1 และเอาชนะ The Memory Breaker ได้", points: 3, status: result.completed ? "ผ่าน" : "ยังไม่ผ่าน" },
            { label: "ความถูกต้องรวมของคำตอบอย่างน้อย 70%", points: 4, status: formatAssessmentPercent(result.accuracy.overall) },
            { label: "ความถูกต้องหัวข้อ Regular Verb อย่างน้อย 60%", points: 2, status: formatAssessmentPercent(result.accuracy.regularVerb) },
            { label: "ความถูกต้องหัวข้อ Irregular Verb อย่างน้อย 60%", points: 2, status: formatAssessmentPercent(result.accuracy.irregularVerb) },
            { label: "มีพัฒนาการจากการตอบผิดหรือการเล่นซ้ำ", points: 2, status: result.gameEvidence.improvementAfterRetry ? "มีหลักฐานเบื้องต้น" : "รอครูพิจารณา" },
            { label: "เล่นอย่างซื่อสัตย์ ไม่สุ่มกด หรือคัดลอกคำตอบ", points: 2, status: "รอครูประเมิน" }
          ])}
        </div>
      </div>

      <div class="assessment-summary-grid">
        <div><span>จำนวนครั้งที่พยายาม</span><strong>${result.gameEvidence.attempts}</strong></div>
        <div><span>จำนวนข้อผิดพลาดที่ได้รับการทบทวน</span><strong>${result.gameEvidence.wrongAnswersReviewed}</strong></div>
        <div><span>มีพัฒนาการหลังการตอบผิด</span><strong>${result.gameEvidence.improvementAfterRetry ? "มี" : "ไม่มีข้อมูลเพียงพอ"}</strong></div>
        <div><span>Perfect / Good Parry</span><strong>${result.gameEvidence.perfectParry}</strong></div>
        <div><span>ดาเมจสูงสุด / Highest Combo</span><strong>${result.gameEvidence.highestCombo}</strong></div>
        <div><span>ระดับคุณภาพ</span><strong>${result.qualityLevel}</strong></div>
      </div>

      <div class="assessment-two-column">
        <div class="assessment-score-card">
          <h3>สมรรถนะสำคัญของผู้เรียน — 10 คะแนน</h3>
          ${renderRubricRows([
            { label: "ความสามารถในการสื่อสาร: อธิบายคำตอบหรือเหตุผลทางไวยากรณ์ได้", points: 2 },
            { label: "ความสามารถในการคิด: วิเคราะห์ได้ว่าทำไมกริยาต้องเปลี่ยนรูป", points: 2 },
            { label: "ความสามารถในการแก้ปัญหา: แก้ไขข้อผิดพลาดหลังได้รับผลสะท้อนได้", points: 2 },
            { label: "ความสามารถในการใช้เทคโนโลยี: ใช้เกม Lingua เป็นเครื่องมือเรียนรู้อย่างเหมาะสม", points: 2 },
            { label: "ความสามารถในการเรียนรู้ด้วยตนเอง: พัฒนาตนเองจากการลองผิดลองถูก", points: 2 }
          ])}
        </div>

        <div class="assessment-score-card">
          <h3>คุณลักษณะอันพึงประสงค์และเจตคติในการเรียนรู้ — 10 คะแนน</h3>
          ${renderRubricRows([
            { label: "มีส่วนร่วมในกิจกรรมอย่างตั้งใจ", points: 2 },
            { label: "มีความพยายาม ไม่ยอมแพ้เมื่อตอบผิดหรือแพ้บอส", points: 2 },
            { label: "เล่นอย่างซื่อสัตย์และปฏิบัติตามกติกาชั้นเรียน", points: 2 },
            { label: "ช่วยเหลือเพื่อนอย่างเหมาะสมโดยไม่บอกคำตอบตรง ๆ", points: 2 },
            { label: "ส่งแบบสะท้อนผลหลังเล่นเกมครบถ้วน", points: 2 }
          ])}
        </div>
      </div>

      <div class="assessment-score-card">
        <h3>เงื่อนไขขั้นต่ำในการผ่านการประเมิน Act 1</h3>
        ${renderRubricRows([
          { label: "เล่นจบ Act 1 และเอาชนะ The Memory Breaker", points: "-", status: assessmentStatusLabel(result.passingConditions.actCompleted) },
          { label: "ได้คะแนนรวมอย่างน้อย 60 คะแนน", points: "-", status: assessmentStatusLabel(result.passingConditions.totalScoreAtLeast60) },
          { label: "Regular Verb อย่างน้อย 50%", points: "-", status: assessmentStatusLabel(result.passingConditions.regularAtLeast50) },
          { label: "Irregular Verb อย่างน้อย 50%", points: "-", status: assessmentStatusLabel(result.passingConditions.irregularAtLeast50) },
          { label: "ส่งแบบสะท้อนผลหลังเล่นเกม", points: "-", status: assessmentStatusLabel(result.passingConditions.reflectionSubmitted) }
        ])}
      </div>

      <div class="assessment-score-card">
        <h3>ระดับคุณภาพสำหรับครูใช้ประกอบการตัดสิน</h3>
        <p>80–100 คะแนน: ดีเยี่ยม / Excellent — ผู้เรียนมีความเข้าใจชัดเจน ใช้ Past Simple ได้ถูกต้อง และสามารถนำความรู้ไปใช้ได้ดี</p>
        <p>70–79 คะแนน: ดี / Good — ผู้เรียนเข้าใจเนื้อหาหลัก ใช้ Past Simple ได้ค่อนข้างถูกต้อง มีข้อผิดพลาดเล็กน้อย</p>
        <p>60–69 คะแนน: ผ่าน / Pass — ผู้เรียนผ่านเกณฑ์ขั้นต่ำ แต่ยังต้องฝึกฝนเพิ่มเติมในบางประเด็น</p>
        <p>ต่ำกว่า 60 คะแนน: ต้องปรับปรุง / Needs Improvement — ผู้เรียนยังไม่ผ่านเกณฑ์ ควรได้รับการสอนเสริมและประเมินซ้ำ</p>
      </div>

      <div class="assessment-reflection">
        <h3>คำถามสะท้อนผลหลังเล่นเกม</h3>
        <ol>
          <li>กฎไวยากรณ์เรื่องใดที่ฉันเข้าใจมากที่สุดจาก Lingua Act 1?</li>
          <li>ส่วนใดยากที่สุดสำหรับฉัน: Regular Verb หรือ Irregular Verb เพราะเหตุใด?</li>
          <li>เขียนประโยค Past Simple เกี่ยวกับชีวิตของตนเอง 3 ประโยค เช่น Yesterday, I played football. / Last night, I ate dinner. / Two days ago, I went to the market.</li>
        </ol>
        <p>ให้นักเรียนตอบคำถามสะท้อนผลในใบงานหรือสมุดเรียน</p>
      </div>

      ${shouldShowRemedial ? `
        <div class="assessment-remedial">
          <h3>ข้อเสนอแนะเพื่อการฝึกเพิ่มเติม</h3>
          <p>ผู้เรียนควรทบทวนเนื้อหาเรื่อง Past Simple Tense เพิ่มเติม โดยเฉพาะหัวข้อที่มีความถูกต้องต่ำ และทำแบบฝึกหัดเสริมก่อนรับการประเมินซ้ำ</p>
          ${regularRemedial}
          ${irregularRemedial}
        </div>
      ` : ""}
    </section>
  `;
}

function completeActVictoryScene() {
  clearEnemyTurnTimer();
  stopTimer("charge");
  stopParryCountdown();
  const progress = ensureActProgress();
  const rewards = progress ? progress.rewards.join(", ") : "Time Spark, Tense Spark, Ed Fragment, Irregular Fragment, Past Fragment";
  const assessmentResult = buildAct1AssessmentResult(progress);

  document.querySelector(".victory-card")?.classList.add("final-assessment-card");
  els.victoryTitle.textContent = "แบบประเมินผลการเรียนรู้หลังจบเกม Lingua Act 1: Past Fragment";
  els.victoryEnemy.textContent = "The Memory Breaker";
  els.victoryStory.textContent = "Lingua Act 1 Learning Achievement Assessment: Past Simple Tense";
  els.victoryGrammaria.textContent = playerData ? playerData.grammaria || 0 : state.grammaria;
  els.victoryExtra.textContent = rewards;
  els.victoryBadge.textContent = PAST_FRAGMENT_ACT.badge;
  els.victoryFragmentText.innerHTML = renderAct1AssessmentHtml(assessmentResult);

  if (playerData) {
    playerData.progress.currentScene = "pastFragmentVictory";
    playerData.progress.act1AssessmentResult = assessmentResult;
    savePlayerData();
  }

  showScene("victory");
}

function showVictory() {
  runSceneTransition("Past Fragment กำลังฟื้นคืน...", completeVictoryScene);
}

function completeVictoryScene() {
  clearEnemyTurnTimer();
  stopTimer("charge");
  stopParryCountdown();
  document.querySelector(".victory-card")?.classList.remove("final-assessment-card");
  els.victoryGrammaria.textContent = state.grammaria + state.sparkBonus;
  els.victoryExtra.textContent = state.sparkBonus;

  if (playerData) {
    playerData.grammaria = state.grammaria + state.sparkBonus;
    playerData.hp = state.playerHp;
    playerData.progress.currentScene = "victory";
    addUniqueProgressItem("unlockedFragments", "Past Spark ชิ้นที่ 1");
    addUniqueProgressItem("defeatedEnemies", "Memory Shade");
    savePlayerData();
  }

  showScene("victory");
}

function saveCurrentLessonPositionBeforeMainMenu() {
  if (!playerData) {
    return;
  }

  if (state.activeReplayLessonId) {
    return;
  }

  const stage = state.currentLessonStage || getPlayableStages()[state.actStageIndex] || null;
  if (!stage) {
    return;
  }

  const lessonPhase = state.lessonStoryMode
    ? (state.lessonStorySteps[state.lessonStoryStepIndex]?.phase || "teacherExplanation")
    : "teacherExplanation";

  saveProgress({
    currentStageId: stage.id,
    currentLessonId: stage.id,
    currentScreen: "lesson",
    lastSafeScreen: "lesson",
    lessonPhase,
    currentDialogueIndex: Math.max(0, Number(state.lessonStoryStepIndex) || 0),
    currentLessonStepIndex: Math.max(0, Number(state.lessonStepIndex) || 0)
  });
}

function returnToPlayerMainMenuFromLesson(event = null) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (state.isReturningToMainMenu) {
    return;
  }

  state.isReturningToMainMenu = true;

  try {
    if (isGameModalOpen()) {
      closeGameModal();
    }
    closeExplanationPanel();
    stopTypewriter();
    cancelNextDialogueHold();
    hideDialogueChoices();
    hideNamePrompt();
    state.isTypingDialogue = false;
    state.awaitingDialogueChoice = false;
    saveCurrentLessonPositionBeforeMainMenu();
    showMainMenu();
    state.activeReplayLessonId = null;
    state.replayReturnProgress = null;
  } finally {
    setTimeout(() => {
      state.isReturningToMainMenu = false;
    }, 500);
  }
}

function handleLessonBack() {
  if (isGameModalOpen()) {
    closeGameModal();
    return;
  }

  if (state.activeReplayLessonId) {
    returnToPlayerMainMenuFromLesson();
    return;
  }

  if (state.isLessonSummaryOpen && !els.nounActivityVisual.classList.contains("hidden")) {
    closeExplanationPanel();
    return;
  }

  if (scenes.battle.classList.contains("active")) {
    confirmExitBattle();
    return;
  }

  if (state.lessonStoryMode) {
    stopTypewriter();
    if (state.lessonStoryStepIndex > 0) {
      state.lessonStoryStepIndex -= 1;
      renderLessonStoryStep();
      return;
    }

    showActInfoScreen();
    return;
  }

  if (state.lessonStepIndex > 0) {
    state.lessonStepIndex -= 1;
    renderLessonStep();
    return;
  }

  showActInfoScreen();
}

function confirmExitBattle() {
  openGameModal({
    title: "ออกจากการต่อสู้นี้หรือไม่?",
    body: "ต้องการออกจากการต่อสู้และกลับไปหน้าบทเรียนหรือไม่?",
    actions: [
      {
        label: "อยู่ต่อ",
        onClick: closeGameModal
      },
      {
        label: "ออกจากการต่อสู้",
        primary: true,
        onClick: () => {
          closeGameModal();
          clearEnemyTurnTimer();
          stopTimer("charge");
          stopParryCountdown();
          state.actBattle = null;
          state.parryAttack = null;
          if (state.activeReplayLessonId) {
            showMainMenu();
            state.activeReplayLessonId = null;
            state.replayReturnProgress = null;
            return;
          }
          runSceneTransition("กลับสู่แผนที่บทเรียน...", () => {
            showScene("story");
            showActInfoScreen();
          });
        }
      }
    ]
  });
}

const lessonSelectGroups = [
  { title: "อดีตคืออะไร", stageId: "what-is-past" },
  { title: "คำบอกเวลาอดีต", stageId: "what-is-tense" },
  { title: "was / were", stageId: "act1_phase1_unit3_was_were" },
  { title: "there was / there were", stageId: "act1_phase1_unit4_there_was_were" },
  { title: "had", stageId: "act1_phase1_unit5_had" },
  { title: "Regular Verbs: -ed", stageId: "regular-rule-1" },
  { title: "Regular Verbs: e + -d", stageId: "regular-rule-2" },
  { title: "Regular Verbs: y / CVC", stageId: "regular-rule-3" },
  { title: "Irregular Verbs", stageId: "irregular-lesson" },
  { title: "Final Review", stageId: "final-boss" }
];

const TEACHER_DEBUG_MODE = false;
const PROTOTYPE_DEBUG_MODE = TEACHER_DEBUG_MODE;
const LESSON_SELECT_TEST_MODE = TEACHER_DEBUG_MODE;

function applyDebugButtonVisibility() {
  [els.skipLessonButton, els.skipBattleButton].forEach(button => {
    if (!button) {
      return;
    }
    button.classList.toggle("hidden", !TEACHER_DEBUG_MODE);
    button.tabIndex = TEACHER_DEBUG_MODE ? 0 : -1;
    setButtonEnabled(button, TEACHER_DEBUG_MODE);
  });
}

function guardTeacherDebugAction(action) {
  if (!TEACHER_DEBUG_MODE) {
    console.info("[ButtonAudit] Teacher debug action is disabled.");
    return false;
  }
  if (typeof action === "function") {
    action();
  }
  return true;
}

function openLessonSelectModal() {
  const progress = loadProgress();
  const completed = new Set(progress?.completedLessons || []);
  const unlocked = new Set(progress?.unlockedStages || []);
  const stages = getPlayableStages();
  const content = document.createElement("div");
  content.className = "lesson-select-grid";

  lessonSelectGroups.forEach(group => {
    const stageIndex = stages.findIndex(stage => stage.id === group.stageId);
    const stage = stages[stageIndex];
    if (!stage) {
      return;
    }

    const isCompleted = completed.has(stage.id);
    const isUnlocked = unlocked.has(stage.id) || isCompleted || LESSON_SELECT_TEST_MODE;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `lesson-select-card ${isCompleted ? "is-completed" : ""} ${isUnlocked ? "" : "is-locked"}`;
    button.disabled = !isUnlocked;
    button.innerHTML = `
      <strong>${group.title}</strong>
      <span>${stage.thaiTitle || stage.title}</span>
      <em>${isCompleted ? "เรียนซ้ำได้" : isUnlocked ? (LESSON_SELECT_TEST_MODE ? "เปิดสำหรับทดสอบ" : "เริ่ม / เล่นต่อ") : "ยังไม่ปลดล็อก"}</em>
    `;
    button.addEventListener("click", () => {
      if (!isUnlocked) {
        openGameModal({
          title: "บทเรียนยังไม่ปลดล็อก",
          body: "บทเรียนนี้ยังไม่ปลดล็อก กรุณาเรียนบทเรียนก่อนหน้าให้สำเร็จก่อน",
          actions: [{ label: "รับทราบ", primary: true, onClick: closeGameModal }]
        });
        return;
      }
      if (isCompleted) {
        confirmReplayLesson(stage, stageIndex);
        return;
      }
      startLessonFromLessonMap(stage, stageIndex);
    });
    content.appendChild(button);
  });

  openGameModal({
    title: "เลือกบทเรียน",
    body: "เลือกบทเรียนเพื่อเริ่มหรือทบทวน ความคืบหน้าเดิมจะไม่ถูกลบ",
    content,
    actions: [{ label: "ปิด", onClick: closeGameModal }]
  });
}

function openSkipLessonModal() {
  if (!TEACHER_DEBUG_MODE) {
    return;
  }
  const stage = state.currentLessonStage || getPlayableStages()[state.actStageIndex] || getPlayableStages()[0];
  openGameModal({
    title: "ข้ามบทเรียนนี้?",
    body: "ระบบจะพาไปยังจุดก่อนต่อสู้ของบทปัจจุบัน โดยไม่บันทึกว่าบทเรียนนี้สำเร็จ",
    actions: [
      { label: "ยกเลิก", onClick: closeGameModal },
      {
        label: "ข้ามบทเรียน",
        primary: true,
        onClick: () => {
          closeGameModal();
          skipCurrentLessonToBattleIntro(stage);
        }
      }
    ]
  });
}

function skipCurrentLessonToBattleIntro(stage) {
  const stages = getPlayableStages();
  const stageIndex = Math.max(stages.findIndex(item => item.id === stage.id), 0);
  state.actStageIndex = stageIndex;
  state.currentLessonStage = stage;
  state.lessonStoryMode = false;
  updatePreviousDialogueButton();
  state.lessonSteps = [];
  state.lessonStepIndex = 0;
  updateLessonChrome(stage, stageIndex, "lesson");
  hideDialogueChoices();
  hideNamePrompt();
  els.dialoguePanel.classList.add("hidden");
  els.dialogueActions.classList.add("hidden");
  els.lessonStoryVisual.classList.add("hidden");
  els.lessonStoryVisual.innerHTML = "";
  saveProgress({
    currentLessonId: stage.id,
    currentStageId: stage.id,
    currentScreen: stage.questions && stage.questions.length ? "battle" : "lesson",
    lastSafeScreen: "lesson",
    currentLessonStepIndex: 0,
    currentDialogueIndex: 0
  });
  if (stage.questions && stage.questions.length) {
    startBattleFromActivity();
    return;
  }
  completeNonBattleStage(stage);
}

function openSkipBattleModal() {
  if (!TEACHER_DEBUG_MODE) {
    return;
  }
  openGameModal({
    title: "ข้ามไปต่อสู้",
    body: "ต้องการข้ามบทเรียนไปสู่การต่อสู้ใช่หรือไม่?",
    actions: [
      {
        label: "ยกเลิก",
        onClick: closeGameModal
      },
      {
        label: "ข้ามไปต่อสู้",
        primary: true,
        onClick: renderBattleSelect
      }
    ]
  });
}

function renderBattleSelect() {
  const wrapper = document.createElement("div");
  wrapper.className = "skip-enemy-grid";

  skipBattleEnemies.forEach(enemy => {
    const card = document.createElement("article");
    card.className = "skip-enemy-card";
    const isTimeDust = enemy.name === "Time Dust";
    const isEchoTrick = enemy.name === "Echo Tick";
    const isYesterdaySpirit = enemy.name === "Yesterday Sprite";
    const isMemoryBreaker = enemy.name === "The Memory Breaker";
    const specialEnemyClass = isTimeDust
      ? "timedust-gif"
      : isEchoTrick
        ? "echo-trick-gif"
        : isYesterdaySpirit
          ? "yesterday-spirit-gif"
          : isMemoryBreaker
            ? "memory-breaker-gif"
            : "";
    card.innerHTML = `
      <img class="${specialEnemyClass}" src="${enemySpriteMap[enemy.name] || assetPath("memory-shade.png")}" alt="${enemy.name}">
      <div>
        <h4>${enemy.thaiName}</h4>
        <p>${enemy.description}</p>
        <p>${enemy.lesson}</p>
      </div>
    `;
    if (isTimeDust || isEchoTrick || isYesterdaySpirit || isMemoryBreaker) {
      const specialEnemyImage = card.querySelector("img");
      const fallbackSprite = isTimeDust
        ? TIME_DUST_FALLBACK_IMAGE_PATH
        : isEchoTrick
          ? ECHO_TRICK_FALLBACK_IMAGE_PATH
          : isYesterdaySpirit
            ? YESTERDAY_SPIRIT_FALLBACK_IMAGE_PATH
            : MEMORY_BREAKER_FALLBACK_IMAGE_PATH;
      const warnLabel = isTimeDust ? "TimeDust" : (isEchoTrick ? "EchoTrick" : (isYesterdaySpirit ? "YesterdaySpirit" : "MemoryBreaker"));
      specialEnemyImage.addEventListener("error", error => {
        console.warn(`[${warnLabel}] transparent GIF failed to load`, error);
        specialEnemyImage.classList.remove(specialEnemyClass);
        specialEnemyImage.src = fallbackSprite;
      }, { once: true });
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "primary-button";
    button.textContent = "เริ่มต่อสู้";
    button.addEventListener("click", () => startBattleByEnemy(enemy.id));
    card.appendChild(button);
    wrapper.appendChild(card);
  });

  openGameModal({
    title: "เลือกศัตรู",
    body: "เลือกการต่อสู้ที่ต้องการฝึก",
    content: wrapper,
    actions: [
      {
        label: "ย้อนกลับ",
        onClick: openSkipBattleModal
      }
    ]
  });
}

function startBattleByEnemy(enemyId) {
  const enemy = skipBattleEnemies.find(item => item.id === enemyId);
  if (!enemy) {
    return;
  }

  const stages = getPlayableStages();
  const stageIndex = stages.findIndex(stage => stage.id === enemy.stageId);
  if (stageIndex < 0) {
    return;
  }

  const stage = stages[stageIndex];
  state.actStageIndex = stageIndex;
  state.currentLessonStage = stage;
  state.lessonStoryMode = false;
  updatePreviousDialogueButton();
  state.lessonStorySteps = [];
  state.lessonStoryStepIndex = 0;
  state.postBossDialogueStage = null;

  saveProgress({
    currentStageId: stage.id,
    currentLessonId: stage.id,
    currentScreen: "battle",
    lastSafeScreen: "lesson",
    lessonPhase: "battle",
    currentDialogueIndex: 0,
    currentLessonStepIndex: 0
  });

  console.log("[SkipBattle] start", {
    enemyId,
    stageId: stage.id,
    stageIndex,
    type: stage.type,
    enemy: stage.enemy
  });

  closeGameModal();
  runSceneTransition(`${enemy.name} ปรากฏตัว!`, () => startActBattle(stageIndex));
}

function returnToTitleSafely() {
  if (!runButtonActionOnce(els.returnTitleButton, () => {
    closeGameModal();
    clearEnemyTurnTimer();
    stopTimer("charge");
    stopParryCountdown();
    cleanupPointParryRingUI();
    cleanupBossHeavyAttackChain({ clearParryUi: true });
    cancelNextDialogueHold();
    state.actBattle = null;
    state.parryAttack = null;
    state.isPrologueActive = false;
    state.isTypingDialogue = false;
    setActionButtonsEnabled(false);
    clearButtonAction(els.continueBattleButton, { disable: true });
    clearButtonAction(els.bossIntentReadyButton, { disable: true });
    showOnlyBattlePanel(null);
    showScene("login");
  })) {
    return;
  }

  setTimeout(() => setButtonEnabled(els.returnTitleButton, true), 400);
}

applyDebugButtonVisibility();

els.showLoginPanelButton.addEventListener("click", () => showAuthPanel("login"));
els.showRegisterPanelButton.addEventListener("click", () => showAuthPanel("register"));
els.loginButton.addEventListener("click", loginRegisteredUser);
els.registerButton.addEventListener("click", registerCloseBetaUser);
els.guestLoginButton.addEventListener("click", loginAsGuest);
els.logoutButton.addEventListener("click", logoutCurrentUser);
els.loginPin.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    loginRegisteredUser();
  }
});
els.registerConfirmPin.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    registerCloseBetaUser();
  }
});
els.prologueOverlay.addEventListener("click", advancePrologue);
els.prologueNextButton.addEventListener("click", event => {
  event.stopPropagation();
  advancePrologue();
});
document.addEventListener("keydown", event => {
  if (!state.isPrologueActive) {
    return;
  }
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    advancePrologue();
  }
});
els.createCharacterButton.addEventListener("click", createCharacterFromForm);
els.confirmNameButton.addEventListener("click", confirmStoryName);
els.storyNameInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    confirmStoryName();
  }
});
els.startButton.addEventListener("click", startStory);
els.nextDialogueButton.addEventListener("click", handleNextDialogueClick);
els.nextDialogueButton.addEventListener("pointerdown", startNextDialogueHold);
els.nextDialogueButton.addEventListener("pointerup", cancelNextDialogueHold);
els.nextDialogueButton.addEventListener("pointerleave", cancelNextDialogueHold);
els.nextDialogueButton.addEventListener("pointercancel", cancelNextDialogueHold);
els.explanationCloseButton.addEventListener("click", closeExplanationPanel);
els.lessonBackButton.addEventListener("click", returnToPlayerMainMenuFromLesson);
els.lessonSelectButton.addEventListener("click", openLessonSelectModal);
els.battleExitButton.addEventListener("click", confirmExitBattle);
els.lessonDictionaryButton.addEventListener("click", () => {
  openGameModal({
    title: "พจนานุกรมแกรมมาเรีย",
    body: "พจนานุกรมแกรมมาเรียจะเปิดใช้ใน Prototype ถัดไป",
    actions: [{ label: "รับทราบ", primary: true, onClick: closeGameModal }]
  });
});
els.lessonExplainButton.addEventListener("click", () => {
  showLessonSummaryModal(state.currentLessonStage || getPlayableStages()[state.actStageIndex]);
});
els.lessonReviewButton.addEventListener("click", () => {
  const stage = getPlayableStages()[state.actStageIndex];
  if (stage) {
    state.currentLessonStage = stage;
    showLessonSummaryModal(stage);
  }
});
els.skipBattleButton.addEventListener("click", () => guardTeacherDebugAction(openSkipBattleModal));
els.skipLessonButton.addEventListener("click", () => guardTeacherDebugAction(openSkipLessonModal));
els.previousDialogueButton.addEventListener("click", goPreviousLessonDialogueLine);
els.attackButton.addEventListener("click", () => {
  if (state.actBattle) {
    chooseActPlayerActionOnce(startActAttackAction);
    return;
  }
  startAttack();
});
els.itemButton.addEventListener("click", () => {
  if (state.actBattle) {
    chooseActPlayerActionOnce(useActItem);
    return;
  }
  useItem();
});
els.focusButton.addEventListener("click", () => {
  if (state.actBattle) {
    chooseActPlayerActionOnce(startActFocusAction);
    return;
  }
  focusTurn();
});
els.stopChargeButton.addEventListener("pointerdown", event => {
  startGrammariaChargeHold(event);
});
els.stopChargeButton.addEventListener("pointerup", event => {
  finishGrammariaCharge(event);
});
els.stopChargeButton.addEventListener("pointercancel", event => {
  finishGrammariaCharge(event, { cancel: true });
});
els.stopChargeButton.addEventListener("pointerleave", event => {
  finishGrammariaCharge(event);
});
els.stopChargeButton.addEventListener("click", event => {
  event.preventDefault();
});
els.stopChargeButton.addEventListener("keydown", event => {
  if (event.key === "Enter" || event.key === " ") {
    startGrammariaChargeHold(event);
  }
});
els.stopChargeButton.addEventListener("keyup", event => {
  if (event.key === "Enter" || event.key === " ") {
    finishGrammariaCharge(event);
  }
});
els.parryButton.addEventListener("pointerdown", stopParry);
els.parryButton.addEventListener("keydown", event => {
  if (event.key === "Enter" || event.key === " ") {
    stopParry(event);
  }
});
els.gameModalClose.addEventListener("click", closeGameModal);
els.returnTitleButton.addEventListener("click", returnToTitleSafely);
els.muteButton.addEventListener("click", toggleMute);
els.manualSaveButton?.addEventListener("click", manualSaveCurrentProgress);

document.addEventListener("pointerdown", handleButtonSfxPointer, true);
document.addEventListener("keydown", handleButtonSfxKey, true);

window.debugButtonAudit = function debugButtonAudit() {
  const activeScene = Object.entries(scenes).find(([, scene]) => scene?.classList.contains("active"))?.[0] || "unknown";
  const battlePanels = {
    bossIntent: els.bossIntentPanel,
    actionMenu: els.actionMenu,
    question: els.questionPanel,
    charm: els.charmPanel,
    charge: els.chargePanel,
    parry: els.parryPanel,
    pointParry: els.pointParryPanel,
    continue: els.continueBattleButton
  };
  const visibleBattlePanel = Object.entries(battlePanels)
    .filter(([, panel]) => panel && !panel.classList.contains("hidden"))
    .map(([name]) => name);
  const buttonEntries = {
    attack: els.attackButton,
    item: els.itemButton,
    focus: els.focusButton,
    continueBattle: els.continueBattleButton,
    bossIntentReady: els.bossIntentReadyButton,
    battle: els.battleButton,
    skipLesson: els.skipLessonButton,
    skipBattle: els.skipBattleButton,
    returnTitle: els.returnTitleButton,
    dictionary: els.lessonDictionaryButton
  };
  const report = Object.fromEntries(Object.entries(buttonEntries).map(([name, button]) => [name, button ? {
    exists: true,
    hidden: button.classList.contains("hidden"),
    disabled: button.disabled,
    ariaDisabled: button.getAttribute("aria-disabled"),
    locked: button.dataset.buttonLocked === "true",
    label: button.textContent.trim()
  } : { exists: false }]));
  report.scene = {
    activeScene,
    modalOpen: isGameModalOpen(),
    battleActive: Boolean(state.actBattle),
    battlePhase: state.actBattle?.playerActionPhase || state.actBattle?.phase || "",
    visibleBattlePanel
  };
  report.flags = {
    TEACHER_DEBUG_MODE,
    PROTOTYPE_DEBUG_MODE,
    LESSON_SELECT_TEST_MODE
  };
  console.table(report);
  return report;
};

function bindGameAudioUnlockEvents() {
  const unlockOptions = { capture: true, passive: true };
  document.addEventListener("pointerdown", unlockGameAudio, unlockOptions);
  document.addEventListener("touchstart", unlockGameAudio, unlockOptions);
  document.addEventListener("click", unlockGameAudio, unlockOptions);
  document.addEventListener("keydown", unlockGameAudio, true);
  [
    els.guestLoginButton,
    els.loginButton,
    els.registerButton,
    els.logoutButton,
    els.prologueNextButton,
    els.startButton,
    els.nextDialogueButton
  ].forEach(button => {
    if (!button) {
      return;
    }
    button.addEventListener("pointerdown", unlockGameAudio, unlockOptions);
    button.addEventListener("touchstart", unlockGameAudio, unlockOptions);
    button.addEventListener("click", unlockGameAudio, unlockOptions);
  });
}

function bindVisibleViewportSync() {
  let frameId = null;
  const requestSync = () => {
    if (frameId) {
      return;
    }
    frameId = requestAnimationFrame(() => {
      frameId = null;
      syncVisibleViewportHeight();
    });
  };

  syncVisibleViewportHeight();
  window.addEventListener("resize", requestSync, { passive: true });
  window.addEventListener("orientationchange", requestSync, { passive: true });
  window.visualViewport?.addEventListener("resize", requestSync, { passive: true });
}

bindGameAudioUnlockEvents();
bindVisibleViewportSync();
initializeAuthUi().catch(error => {
  console.warn("[Auth] Failed to initialize Firebase auth state", error);
  updateAuthUi();
  setAuthStatus(AUTH_COPY.remoteAuthUnavailable);
});
setupAnimatedGrammarHallBackground();
setupMainCharacterGifs();
setupTeacherCharacterGifs();
preloadAct1Backgrounds();
bindAvatarPreviewInputs();

window.debugBattleMobileLayout = function debugBattleMobileLayout() {
  const measure = selector => {
    const element = document.querySelector(selector);
    if (!element) {
      return null;
    }
    const rect = element.getBoundingClientRect();
    return Math.round(rect.height);
  };
  const layout = {
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    scene: measure("#battleScene"),
    header: measure("#battleScene .scene-header"),
    stage: measure("#battleScene .battle-stage"),
    dashboard: measure("#battleScene .battle-dashboard"),
    panel: measure("#battleScene .battle-panel"),
    options: measure("#battleScene .battle-flow-v2-body")
  };
  console.table(layout);
  return layout;
};
