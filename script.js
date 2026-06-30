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
  { type: "normal", label: "โจมตีปกติ", damage: 12, warning: "บอสกำลังโจมตี!", zoneWidth: 34, minZoneWidth: 18, speed: 920, zoneSpeed: 2200, shrinkPerSecond: 4, parryDuration: 3800 },
  { type: "skill", label: "สกิลแรง", damage: 22, warning: "บอสกำลังใช้สกิลแรง!", zoneWidth: 28, minZoneWidth: 13, speed: 780, zoneSpeed: 1700, shrinkPerSecond: 5.5, parryDuration: 3400 },
  { type: "ultimate", label: "อัลติ", damage: 35, warning: "บอสกำลังใช้อัลติ! เตรียมปัดป้อง!", zoneWidth: 24, minZoneWidth: 8, speed: 650, zoneSpeed: 1250, shrinkPerSecond: 7, parryDuration: 3100 }
];

const DEFAULT_POINT_PARRY_CONFIG = {
  enabled: true,
  counterDamage: 8,
  preventDamage: true,
  chance: 0.25,
  ultimateChanceBonus: 0.1,
  targetCount: 1,
  duration: 2800,
  size: 72,
  messageTemplate: "Perfect Parry - รับดาเมจ 0 และสวนกลับ {damage}"
};

const BOSS_POINT_PARRY_CONFIGS = {
  edForger: {
    counterDamage: 10,
    chance: 0.35,
    targetCount: 2,
    duration: 2600,
    size: 66
  },
  irregularWraith: {
    counterDamage: 10,
    chance: 0.45,
    targetCount: 2,
    duration: 2400,
    size: 62
  },
  memoryBreaker: {
    counterDamage: 10,
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

const bossActionPatterns = {
  edForger: [["attack"], ["question"], ["question", "attack"], ["attack"]],
  irregularWraith: [["question"], ["attack"], ["question", "attack"], ["attack", "question"], ["question"]],
  memoryBreaker: [["question", "attack"], ["attack", "question"], ["question", "attack", "question"], ["question", "question", "attack"]]
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
    ["ed_035", "boss", "mixed-rule", "arrive ->", ["arrived", "arriveed", "arrivied", "arrivd"], "arrived", "arrive ลงท้าย e เติม -d"],
    ["ed_036", "boss", "mixed-rule", "carry ->", ["carried", "carryed", "carryied", "carryd"], "carried", "พยัญชนะ + y เปลี่ยน y เป็น i แล้วเติม -ed"]
  ];

  return items.map(item => bossQuestion({
    id: item[0],
    boss: "edForger",
    difficulty: item[1],
    type: item[2],
    baseVerb: item[3],
    prompt: item[4],
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
    ["remember", "remembered", ["rememberd", "rememberred", "rememberied"]]
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
    ["smile", "smiled", ["smileed", "smilied", "smild"]]
  ],
  endingY: [
    ["play", "played", ["playied", "plaied", "playd"], "หน้า y เป็นสระ จึงเติม -ed ได้เลย"],
    ["enjoy", "enjoyed", ["enjoied", "enjoyd", "enjoyied"], "หน้า y เป็นสระ จึงเติม -ed ได้เลย"],
    ["stay", "stayed", ["staied", "stayd", "stayied"], "หน้า y เป็นสระ จึงเติม -ed ได้เลย"],
    ["obey", "obeyed", ["obeied", "obeyd", "obeyied"], "หน้า y เป็นสระ จึงเติม -ed ได้เลย"],
    ["delay", "delayed", ["delaied", "delayd", "delayied"], "หน้า y เป็นสระ จึงเติม -ed ได้เลย"],
    ["study", "studied", ["studyed", "studyied", "studed"], "หน้า y เป็นพยัญชนะ จึงเปลี่ยน y เป็น i แล้วเติม -ed"],
    ["cry", "cried", ["cryed", "cryied", "cryd"], "หน้า y เป็นพยัญชนะ จึงเปลี่ยน y เป็น i แล้วเติม -ed"],
    ["try", "tried", ["tryed", "tryied", "tryd"], "หน้า y เป็นพยัญชนะ จึงเปลี่ยน y เป็น i แล้วเติม -ed"],
    ["carry", "carried", ["carryed", "carryied", "carred"], "หน้า y เป็นพยัญชนะ จึงเปลี่ยน y เป็น i แล้วเติม -ed"],
    ["copy", "copied", ["copyed", "copyied", "copd"], "หน้า y เป็นพยัญชนะ จึงเปลี่ยน y เป็น i แล้วเติม -ed"],
    ["hurry", "hurried", ["hurryed", "hurryied", "hurred"], "หน้า y เป็นพยัญชนะ จึงเปลี่ยน y เป็น i แล้วเติม -ed"],
    ["worry", "worried", ["worryed", "worryied", "worred"], "หน้า y เป็นพยัญชนะ จึงเปลี่ยน y เป็น i แล้วเติม -ed"],
    ["reply", "replied", ["replyed", "replyied", "repled"], "หน้า y เป็นพยัญชนะ จึงเปลี่ยน y เป็น i แล้วเติม -ed"],
    ["apply", "applied", ["applyed", "applyied", "appled"], "หน้า y เป็นพยัญชนะ จึงเปลี่ยน y เป็น i แล้วเติม -ed"]
  ],
  doubleCvc: [
    ["stop", "stopped", ["stoped", "stopied", "stopd"]],
    ["plan", "planned", ["planed", "planied", "pland"]],
    ["drop", "dropped", ["droped", "dropd", "dropied"]],
    ["clap", "clapped", ["claped", "clapd", "clapied"]],
    ["grab", "grabbed", ["grabed", "grabd", "grabied"]],
    ["hug", "hugged", ["huged", "hugd", "hugied"]],
    ["travel", "traveled", ["traveleded", "travelled", "travelied"]],
    ["prefer", "preferred", ["prefered", "preferd", "preferied"]],
    ["admit", "admitted", ["admited", "admitd", "admitied"]],
    ["occur", "occurred", ["occured", "occurd", "occuried"]],
    ["beg", "begged", ["beged", "begd", "begied"]],
    ["fit", "fitted", ["fited", "fitd", "fitied"]],
    ["rub", "rubbed", ["rubed", "rubd", "rubied"]],
    ["nod", "nodded", ["noded", "nodd", "nodied"]],
    ["permit", "permitted", ["permited", "permitd", "permitied"]]
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

const edForgerQuestions = [
  ...regularVerbBanks.addEd.filter(([verb]) => !["walk", "jump", "clean", "watch", "help", "open"].includes(verb)).slice(0, 8),
  ...regularVerbBanks.endingE.filter(([verb]) => !["like", "love", "dance", "close", "live", "move"].includes(verb)).slice(0, 8),
  ...regularVerbBanks.endingY.filter(([verb]) => !["play", "enjoy", "stay", "obey", "study", "cry"].includes(verb)).slice(0, 8),
  ...regularVerbBanks.doubleCvc.filter(([verb]) => !["stop", "plan", "drop", "clap", "grab", "hug"].includes(verb)).slice(0, 8)
].map(item => makeRegularQuestion(item, "เลือกการสะกดรูปอดีตที่ถูกต้อง"));

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
  questions.forEach(question => {
    question.lessonId = question.lessonId || fallbackLessonId;
    question.ruleId = question.ruleId || inferRuleIdFromQuestion(question) || fallbackRuleId;
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
  ["build", "built", ["builded", "buildted", "buildied"]]
];

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
  { ruleId: "irregular_v2", lessonId: "irregular-lesson", baseVerb: "speak", sentence: "Yesterday, I ____ to the old book.", options: ["spoke", "speaked", "speaks", "speaking"], answer: "spoke", explanation: "speak เป็น Irregular Verb รูป V2 คือ spoke" }
];

const irregularWraithQuestions = irregularVerbBank
  .slice(14)
  .map(makeIrregularQuestion);

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
  { type: "sentence-fill", sentence: "She ____ her old friend yesterday.", options: ["met", "meet", "meets", "meeting"], answer: "met", explanation: "meet เป็น Irregular Verb รูป V2 คือ met" }
];

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
      enemy: "Time Dust",
      thaiEnemy: "ฝุ่นเวลา",
      completionKey: "introCompleted",
      reward: { grammaria: 30, fragment: "Time Spark" },
      lesson: [
        "มาสเตอร์เวรีออน: ผู้พเนจรเอ๋ย ก่อนที่เราจะใช้พลังของอดีต เจ้าต้องเข้าใจก่อนว่า 'อดีต' ไม่ได้หมายถึงเมื่อวานเท่านั้น",
        "สิ่งใดก็ตามที่เกิดขึ้นแล้ว และจบลงแล้ว สิ่งนั้นคืออดีต",
        "หนึ่งวินาทีก่อนหน้านี้ ก็เป็นอดีต สิบนาทีก่อน ก็เป็นอดีต เมื่อเช้าที่ผ่านมา ก็เป็นอดีต หากเหตุการณ์นั้นจบลงแล้ว",
        "เมื่อวาน เดือนที่แล้ว หรือปีที่แล้ว ก็ล้วนเป็นอดีตเช่นกัน",
        "อดีตคือร่องรอยของสิ่งที่เคยเกิดขึ้น และภาษาคือพลังที่ช่วยให้เราบอกเล่าร่องรอยนั้นได้ถูกต้อง",
        "ลองดู 3 ประโยคนี้ก่อน ผู้พเนจร ทั้งสามประโยคพูดถึงเวลาไม่เหมือนกัน",
        "ภาษาไทย: ฉันกินข้าววันนี้",
        "ภาษาไทย: ฉันกินข้าวเมื่อวาน",
        "ภาษาไทย: ฉันจะกินข้าวพรุ่งนี้",
        "วันนี้ = ปัจจุบัน",
        "เมื่อวาน = อดีต",
        "พรุ่งนี้ = อนาคต",
        "ภาษาไทยไม่ว่าจะเป็นวันนี้ เมื่อวาน หรือพรุ่งนี้ คำกริยา 'กิน' ไม่ได้เปลี่ยนรูปมากนัก เราใช้คำบอกเวลาเป็นตัวช่วยให้รู้ว่าเหตุการณ์เกิดขึ้นตอนไหน"
      ],
      questions: [
        { prompt: "ประโยคใดเป็นเหตุการณ์ในอดีต", options: ["ฉันกินข้าววันนี้", "ฉันกินข้าวเมื่อวาน", "ฉันจะกินข้าวพรุ่งนี้"], answer: "ฉันกินข้าวเมื่อวาน", explanation: "คำว่า เมื่อวาน บอกว่าเหตุการณ์เกิดขึ้นแล้ว จึงเป็นอดีต" },
        { prompt: "เหตุการณ์ใดนับเป็นอดีตได้", options: ["สิ่งที่เกิดขึ้นแล้วและจบลงแล้ว", "สิ่งที่กำลังจะเกิดพรุ่งนี้", "สิ่งที่ยังไม่เริ่ม"], answer: "สิ่งที่เกิดขึ้นแล้วและจบลงแล้ว", explanation: "อดีตคือสิ่งที่เกิดขึ้นแล้วและจบลงแล้ว แม้จะเพิ่งเกิดเมื่อ 1 วินาทีก่อนก็นับเป็นอดีตได้" },
        { prompt: "คำว่า 'พรุ่งนี้' บอกเวลาใด", options: ["อดีต", "ปัจจุบัน", "อนาคต"], answer: "อนาคต", explanation: "พรุ่งนี้คือเวลาที่ยังมาไม่ถึง จึงเป็นอนาคต" },
        { prompt: "คำว่า 'วันนี้' มักใช้พูดถึงเวลาใด", options: ["อดีต", "ปัจจุบัน", "อนาคต"], answer: "ปัจจุบัน", explanation: "วันนี้คือเวลาที่กำลังเกิดขึ้นหรือเกี่ยวข้องกับปัจจุบัน" },
        { prompt: "คำว่า 'เมื่อวาน' บอกว่าเหตุการณ์เป็นอย่างไร", options: ["เกิดขึ้นแล้ว", "กำลังเกิดขึ้น", "ยังไม่เกิดขึ้น"], answer: "เกิดขึ้นแล้ว", explanation: "เมื่อวานคือเวลาที่ผ่านไปแล้ว" },
        { prompt: "ประโยค 'ฉันจะกินข้าวพรุ่งนี้' เป็นเวลาใด", options: ["อดีต", "ปัจจุบัน", "อนาคต"], answer: "อนาคต", explanation: "คำว่า จะ และ พรุ่งนี้ บอกว่าเหตุการณ์ยังไม่เกิดขึ้น" }
      ]
    },
    {
      id: "what-is-tense",
      type: "lesson-quiz",
      title: "What is Tense?",
      thaiTitle: "Tense คืออะไร",
      enemy: "Echo Tick",
      thaiEnemy: "ติ๊กสะท้อนอดีต",
      completionKey: "tenseLessonCompleted",
      reward: { grammaria: 30, fragment: "Tense Spark" },
      lesson: [
        "มาสเตอร์เวรีออน: ตอนนี้เราจะดูพลังที่ภาษาอังกฤษใช้บอกเวลา พลังนั้นเรียกว่า tense",
        "ภาษาไทย: ฉันกินข้าววันนี้ / ฉันกินข้าวเมื่อวาน / ฉันจะกินข้าวพรุ่งนี้",
        "มาสเตอร์เวรีออน: ในภาษาไทย คำกริยามักไม่เปลี่ยนรูปมากนัก แต่ภาษาอังกฤษใช้รูปของกริยาเพื่อบอกเวลา",
        "ตัวอย่างภาษาอังกฤษ: I go. / I went. / I will go.",
        `I go. = ${TENSE_LABELS.present}`,
        `I went. = ${TENSE_LABELS.past}`,
        `I will go. = ${TENSE_LABELS.future}`,
        "วันนี้เราจะเน้นพลังของอดีต นั่นคือการใช้กริยาช่องที่ 2 หรือ V2"
      ],
      questions: [
        { prompt: "I go. เป็นเวลาใด", options: [TENSE_LABELS.present, TENSE_LABELS.past, TENSE_LABELS.future], answer: TENSE_LABELS.present, explanation: "go เป็นรูปปัจจุบัน" },
        { prompt: "I went. เป็นเวลาใด", options: [TENSE_LABELS.present, TENSE_LABELS.past, TENSE_LABELS.future], answer: TENSE_LABELS.past, explanation: "went เป็น V2 ใช้พูดถึงอดีต" },
        { prompt: "I will go. เป็นเวลาใด", options: [TENSE_LABELS.present, TENSE_LABELS.past, TENSE_LABELS.future], answer: TENSE_LABELS.future, explanation: "will + V1 ใช้พูดถึงอนาคต" },
        { prompt: "ถ้าจะเล่าเรื่องที่เกิดขึ้นเมื่อวาน ภาษาอังกฤษมักต้องใช้กริยารูปใด", options: ["V1", "V2", "will + V1"], answer: "V2", explanation: "เหตุการณ์ที่เกิดขึ้นแล้วใช้ V2" }
      ]
    },
    {
      id: "regular-intro",
      type: "lesson-only",
      title: "Regular Verbs and -ed Workshop",
      thaiTitle: "โรงหลอม -ed แห่งอดีต",
      completionKey: "regularRulesCompleted",
      reward: { grammaria: 10, fragment: "Regular Gate Opened" },
      lesson: [
        "มาสเตอร์เวรีออน: ประตูแห่งอดีตมีสองเส้นทางใหญ่ ผู้พเนจร",
        "เส้นทางแรกคือ Regular Verbs กริยาที่เดินตามกฎของโรงหลอม -ed",
        "เส้นทางที่สองคือ Irregular Verbs กริยาที่ไม่ยอมเดินตามกฎ ต้องจำรูปอดีตของมันทีละคำ",
        "เราจะเริ่มจาก Regular Verbs ก่อน เพราะมันเป็นประตูแรกของการเล่าอดีตให้ถูกต้อง"
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
  makeCharm("c_memory_shard", "เศษผลึกความจำ", "C", "charge", "memoryCharge", 1, "สะสม Memory Charge 1 หน่วย"),
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
  makeCharm("b_heal_on_correct", "ฟื้นพลังจากคำตอบ", "B", "heal", "healOnCorrect", 12, "ถ้าตอบถูก ฟื้น HP 12", { duration: 1 }),
  makeCharm("b_mark", "รอยประทับ Mark", "B", "status", "applyMark", 0.15, "ติด Mark ให้บอส บอสโดนดาเมจเพิ่ม 15% 1 เทิร์น", { duration: 1 }),
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
  makeCharm("a_grammar_break", "Grammar Break", "A", "break", "bossQuestionBreak", 1, "ถ้าตอบคำถามบอสถูก ทำลาย Guard บอสและเพิ่มดาเมจครั้งถัดไป"),

  makeCharm("s_crystal_charge", "ชาร์จผลึก", "S", "charge", "crystalCharge", 1, "สะสม 1 ชาร์จ ครบ 3 ครั้ง ดาเมจถัดไป x2", { threshold: 3 }),
  makeCharm("s_time_echo", "เวทสะท้อนเวลา", "S", "attack", "delayedEchoDamage", 0.30, "ดาเมจที่ทำในเทิร์นนี้ 30% จะย้อนกลับไปโดนบอสอีกครั้งในเทิร์นถัดไป"),
  makeCharm("s_grammaria_shield", "โล่แกรมมาเรีย", "S", "defense", "blockIfGoodParry", 1, "ป้องกันดาเมจบอส 1 ครั้ง ถ้า Parry ได้อย่างน้อย Good", { duration: 1 }),
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

const MAIN_CHARACTER_IMAGE_PATH = "assets/characters/main-character-idle-transparent-clean-optimized.webp";
const MAIN_CHARACTER_FALLBACK_IMAGE_PATH = assetPath("male.png");
const TEACHER_CHARACTER_IMAGE_PATH = "assets/characters/master-verion-idle-transparent-clean-optimized.webp";
const TEACHER_CHARACTER_FALLBACK_IMAGE_PATH = assetPath("master-verion.png");
const GRAMMAR_HALL_ANIMATED_BACKGROUND_PATH = "assets/backgrounds/grammar-hall-animated.gif";
const TIME_DUST_IMAGE_PATH = "assets/characters/timedust-transparent-clean-optimized.webp";
const TIME_DUST_FALLBACK_IMAGE_PATH = assetPath("enemies/time-dust.png");
const ECHO_TRICK_IMAGE_PATH = "assets/characters/echo-trick-transparent-clean-optimized.webp";
const ECHO_TRICK_FALLBACK_IMAGE_PATH = assetPath("enemies/echo-tick.png");
const YESTERDAY_SPIRIT_IMAGE_PATH = "assets/characters/yesterday-spirit-transparent.gif";
const YESTERDAY_SPIRIT_FALLBACK_IMAGE_PATH = assetPath("memory-shade.png");

const mobilePerformanceQuery = window.matchMedia("(max-width: 768px)");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

function isPerformanceStaticBackgroundMode() {
  return mobilePerformanceQuery.matches || reducedMotionQuery.matches;
}

function updatePerformanceMode() {
  document.documentElement.classList.toggle("performance-static-bg", isPerformanceStaticBackgroundMode());
}

function createMainCharacterElement(className = "") {
  const img = document.createElement("img");
  img.className = `main-character-gif ${className}`.trim();
  img.src = MAIN_CHARACTER_IMAGE_PATH;
  img.alt = "Main Character";
  img.draggable = false;
  return img;
}

function handleMainCharacterGifError(img) {
  console.warn("[Character] main-character-idle-transparent-clean-optimized.webp failed to load");
  if (img.dataset.fallbackApplied === "true") {
    return;
  }

  img.dataset.fallbackApplied = "true";
  const fallback = document.createElement("img");
  if (img.id) {
    fallback.id = img.id;
  }
  fallback.className = img.className.replace(/\bmain-character-gif\b/g, "main-character-gif-fallback").trim();
  fallback.src = MAIN_CHARACTER_FALLBACK_IMAGE_PATH;
  fallback.alt = img.alt || "Main Character";
  fallback.draggable = false;
  fallback.setAttribute("aria-hidden", img.getAttribute("aria-hidden") || "false");
  img.replaceWith(fallback);
}

function setupMainCharacterGifs() {
  document.querySelectorAll(".main-character-gif").forEach(img => {
    img.src = MAIN_CHARACTER_IMAGE_PATH;
    img.draggable = false;
    img.addEventListener("error", () => handleMainCharacterGifError(img), { once: true });
  });
}

function handleTeacherCharacterGifError(img) {
  console.warn("[Character] master-verion-idle-transparent-clean-optimized.webp failed to load");
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

function setupAnimatedGrammarHallBackground() {
  updatePerformanceMode();
  [mobilePerformanceQuery, reducedMotionQuery].forEach(query => {
    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", updatePerformanceMode);
    } else if (typeof query.addListener === "function") {
      query.addListener(updatePerformanceMode);
    }
  });

  const backgroundProbe = new Image();
  backgroundProbe.addEventListener("error", error => {
    console.warn("[Background] animated GIF failed to load", error);
  }, { once: true });
  backgroundProbe.src = GRAMMAR_HALL_ANIMATED_BACKGROUND_PATH;
}

const enemySpriteMap = {
  "Memory Shade": assetPath("memory-shade.png"),
  "Time Dust": TIME_DUST_IMAGE_PATH,
  "Echo Tick": ECHO_TRICK_IMAGE_PATH,
  "Rewind Slime": assetPath("enemies/rewind-slime.png"),
  "Yesterday Sprite": YESTERDAY_SPIRIT_IMAGE_PATH,
  "Memory Bat": assetPath("memory-shade.png"),
  "The -ed Forger": assetPath("enemies/ed-forger.png"),
  "ช่างหลอม -ed": assetPath("enemies/ed-forger.png"),
  "The Irregular Wraith": assetPath("enemies/irregular-wraith.png"),
  "ภูต Irregular": assetPath("enemies/irregular-wraith.png"),
  "The Memory Breaker": assetPath("enemies/memory-breaker.png"),
  "ผู้ทำลายความทรงจำ": assetPath("enemies/memory-breaker.png")
};

const enemyDescriptions = {
  "Time Dust": "ฝุ่นแห่งกาลเวลาที่ลอยวนอยู่รอบเศษความทรงจำ",
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
  nextDialogueHold: null,
  audioUnlocked: false,
  currentBgmKey: "",
  isMuted: false,
  audioLocked: true,
  typewriterAudioUnlocked: false,
  lastDialogueTypeSfxAt: 0,
  dialogueTypeSfxWarned: false,
  dialogueTypeSfxPoolIndex: 0
};

const bgmTracks = {
  login: new Audio(assetPath("bgm/into-lingua-v1.mp3")),
  hall: new Audio(assetPath("bgm/verions-grammar-hall.mp3")),
  battle: new Audio(assetPath("bgm/lingua-spell-battle.mp3"))
};

Object.values(bgmTracks).forEach(track => {
  track.loop = true;
  track.volume = 0.45;
});

const DIALOGUE_TYPE_SFX_PATH = "assets/sfx/dialogue-type.mp3";
const DIALOGUE_TYPE_SFX_OFFSET = 0.12;
const DIALOGUE_TYPE_SFX_TICK_MS = 180;
const DIALOGUE_TYPE_SFX_COOLDOWN_MS = 65;
const DIALOGUE_TYPE_SFX_VOLUME = 0.16;
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
  battleTitle: document.getElementById("battleTitle"),
  battleExitButton: document.getElementById("battleExitButton"),
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
  if (name === "login" || name === "createCharacter") {
    stopTypewriter();
    state.isTypingDialogue = false;
  }
  if (name !== "story") {
    stopDialogueTypeSfx();
  }
  Object.values(scenes).forEach(scene => scene.classList.remove("active"));
  scenes[name].classList.add("active");
  playBgmForScene(name);
}

function bgmKeyForScene(sceneName) {
  if (sceneName === "login" || sceneName === "createCharacter") {
    return "login";
  }
  if (sceneName === "battle") {
    return "battle";
  }
  return "hall";
}

function playBgmForScene(sceneName) {
  playBgm(bgmKeyForScene(sceneName));
}

function playBgm(key) {
  if (!state.audioUnlocked || state.isMuted || !bgmTracks[key]) {
    return;
  }

  if (state.currentBgmKey === key && !bgmTracks[key].paused) {
    return;
  }

  Object.entries(bgmTracks).forEach(([trackKey, track]) => {
    if (trackKey !== key) {
      track.pause();
      track.currentTime = 0;
    }
  });

  state.currentBgmKey = key;
  bgmTracks[key].play().catch(() => {});
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
  if (state.audioUnlocked && state.typewriterAudioUnlocked) {
    return;
  }

  console.log("[Audio] unlock requested");
  resumeAudioContextIfPresent();
  if (!state.audioUnlocked) {
    state.audioUnlocked = true;
    state.audioLocked = false;
  }

  const activeScene = Object.keys(scenes).find(key => scenes[key].classList.contains("active")) || "login";
  playBgmForScene(activeScene);

  if (state.typewriterAudioUnlocked) {
    return;
  }

  [dialogueTypeSfx, ...dialogueTypeSfxPool].forEach(track => prepareDialogueTypeSfxTrack(track, DIALOGUE_TYPE_SFX_VOLUME));
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

  if (state.isMuted) {
    stopDialogueTypeSfx();
  }

  if (els.muteButton) {
    els.muteButton.textContent = state.isMuted ? "เสียง: ปิด" : "เสียง: เปิด";
    els.muteButton.setAttribute("aria-pressed", state.isMuted ? "true" : "false");
  }

  if (!state.isMuted) {
    unlockGameAudio();
    const activeScene = Object.keys(scenes).find(key => scenes[key].classList.contains("active")) || "login";
    playBgmForScene(activeScene);
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
      }, 380);
    }, 260);
  }, 420);
}

function closeGameModal() {
  if (!els.gameModal) {
    return;
  }

  els.gameModal.classList.add("hidden");
  els.gameModalTitle.textContent = "";
  els.gameModalBody.textContent = "";
  els.gameModalContent.innerHTML = "";
  els.gameModalActions.innerHTML = "";
}

function isGameModalOpen() {
  return els.gameModal && !els.gameModal.classList.contains("hidden");
}

function openGameModal({ title, body = "", content = "", actions = [] }) {
  if (!els.gameModal) {
    return;
  }

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
    button.addEventListener("click", action.onClick);
    els.gameModalActions.appendChild(button);
  });

  els.gameModal.classList.remove("hidden");
}

function showOnlyBattlePanel(panelToShow) {
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

  if (panelToShow) {
    panelToShow.classList.remove("hidden");
  }
}

function setBattleTurnOwner(owner) {
  els.battlePlayer.classList.toggle("is-active-turn", owner === "player");
  els.battleEnemy.classList.toggle("is-active-turn", owner === "enemy");
}

function setActionButtonsEnabled(isEnabled) {
  [els.attackButton, els.itemButton, els.focusButton].forEach(button => {
    button.disabled = !isEnabled;
  });
  updateActActionMenuState();
}

function isActBattleEnded(battle = state.actBattle) {
  return !battle || battle.victoryHandled || battle.phase === "ended" || battle.isActive === false;
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
  if (state.pointParry?.timeout) {
    clearTimeout(state.pointParry.timeout);
  }
  state.pointParry = null;
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
    els.battleButton.disabled = false;
    els.battleButton.classList.remove("disabled");
  } else {
    console.warn("[TimeDust] Lesson main button was not found");
  }
}

function showTimeDustNextLessonFallback(stage) {
  if (!els.continueBattleButton) {
    console.warn("[TimeDust] Fallback continue button was not found");
    return;
  }

  els.continueBattleButton.textContent = "ไปบทเรียนถัดไป";
  els.continueBattleButton.disabled = false;
  els.continueBattleButton.classList.remove("hidden", "disabled");
  els.continueBattleButton.onclick = () => {
    console.log("[TimeDust] Fallback button clicked");
    transitionToRegularEdLessonAfterTimeDust(stage);
  };
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

  hideBattleUICompletely();
  restoreLessonUIAfterBattle();
  showLessonUICompletely();
  showStageLesson(nextIndex, { lessonStepIndex: 0, dialogueIndex: 0 });
  restoreNextButtonForLesson();
  console.log("[TimeDust] Lesson UI shown");
}

const ACT_MAX_AP = 5;

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
  els.attackButton.disabled = ap < 1;
  els.itemButton.disabled = ap < 1;
  els.focusButton.disabled = false;
  els.focusButton.classList.toggle("is-focus-hint", ap <= 0);
}

function beginActPlayerTurn(message = "") {
  const battle = getActBattle();
  if (!battle) {
    return;
  }
  if (isActBattleEnded(battle)) {
    console.log("[Battle] beginActPlayerTurn blocked because battle already ended");
    return;
  }

  setBattleTurnOwner("player");
  battle.pendingPlayerAttack = null;
  battle.pendingBossAction = null;
  battle.pendingBossTurn = null;
  battle.awaitingParry = false;
  battle.awaitingPrepare = false;
  showOnlyBattlePanel(els.actionMenu);
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

function getQuestionId(question, index = 0) {
  return question.id || `${question.baseVerb || "q"}-${question.prompt || question.sentence || index}`;
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
    "what-is-past": ["past_concept"],
    "what-is-tense": ["tense_concept"],
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
    console.error("[Invalid Question] This question is not unlocked:", invalid);
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
    lifestealRatio: 0,
    nextCorrectBonusGrammaria: 0,
    crystalCharge: 0,
    memoryCharge: 0,
    stackingDamageBonus: 0,
    surviveFatalOnce: false
  };
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
  return {
    uid: sessionUser.uid,
    username: sessionUser.username,
    displayName: sessionUser.displayName,
    mode: "registered",
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
    runSceneTransition(statusMessage, startGameAfterLogin);
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
    characterName: "",
    className: "",
    room: "",
    keyStage: user.keyStage || "",
    avatar: {
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

function savePlayerData() {
  if (!playerData) {
    return false;
  }

  playerData.updatedAt = new Date().toISOString();
  return progressService.saveProgress(playerData.userId, playerData).catch(error => {
    console.warn("[Progress] Failed to save player data", error);
    setAuthStatus(AUTH_COPY.remoteAuthUnavailable);
    return false;
  });
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

  if (!room) {
    els.createStatus.textContent = "กรุณากรอกห้องเรียน";
    return;
  }

  playerData = createDefaultPlayerData(user);
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
    gender: genderChoice ? genderChoice.value : "other",
    bodyType: bodyTypeChoice ? bodyTypeChoice.value : "normal",
    type: avatarChoice ? avatarChoice.value : "wanderer",
    outfit: "default",
    color: "blue"
  };

  await savePlayerProfile();
  els.createStatus.textContent = "บันทึกข้อมูลแล้ว";
  runSceneTransition("บันทึกข้อมูลแล้ว กำลังเข้าสู่โลก Lingua...", startGameAfterLogin);
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
  const genderLabels = { male: "ชาย", female: "หญิง", other: "ไม่ระบุ" };
  const bodyLabels = { small: "ตัวเล็ก", normal: "ปกติ", tall: "สูง" };

  els.avatarPreview.className = `avatar-preview main-character-gif main-character-preview-gif avatar-gender-${gender} avatar-body-${bodyType}`;
  els.avatarPreviewText.textContent = `ตัวอย่าง: ${genderLabels[gender] || genderLabels.other} / ${bodyLabels[bodyType] || bodyLabels.normal}`;
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

function resolveDialogueText(line) {
  return typeof line.text === "function" ? line.text() : line.text;
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
  hideDialogueChoices();
  startTypewriter(resolveDialogueText(line));
}

function updateDialogueSpeakerTone(speaker = "") {
  els.dialoguePanel.classList.remove("speaker-player", "speaker-verion", "speaker-system");
  els.dialoguePanel.classList.add(getSpeakerToneClass(speaker));
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
    button.className = "dialogue-choice-btn";
    button.textContent = choice.text;
    button.addEventListener("click", () => chooseDialogueResponse(choice));
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
      totalAfter: progressState.total
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
    grammariaChargePercents: Array.isArray(stats?.grammariaChargePercents) ? [...stats.grammariaChargePercents] : []
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

function renderBossGrammariaResult(result, onContinue) {
  if (!result) {
    if (typeof onContinue === "function") {
      onContinue();
    }
    return;
  }

  const panel = document.createElement("div");
  panel.className = "grammaria-result";
  panel.innerHTML = `
    <div class="grammaria-breakdown">
      <div class="grammaria-breakdown-row"><span>ตอบถูก ${result.correctAnswers || 0} ข้อ × ${GRAMMARIA_POINTS.correctAnswer}</span><strong>${result.correctPoints || 0}</strong></div>
      <div class="grammaria-breakdown-row"><span>Point Parry ${result.parryCount || 0} ครั้ง × ${GRAMMARIA_POINTS.parry}</span><strong>${result.parryPoints || 0}</strong></div>
      <div class="grammaria-breakdown-row"><span>Grammaria Charge ${result.grammariaChargeCount || 0} ครั้ง × ${GRAMMARIA_POINTS.charge}</span><strong>${result.chargePoints || 0}</strong></div>
      <div class="grammaria-total-row"><span>ได้รับจากบอสนี้</span><strong>${result.earned || 0} Grammaria</strong></div>
      <div class="grammaria-total-row"><span>Grammaria สะสมทั้งหมด</span><strong>${result.totalAfter || 0}</strong></div>
    </div>
    ${result.duplicate ? "<p class=\"grammaria-result-note\">บอสนี้เคยให้คะแนนแล้ว จึงไม่เพิ่มคะแนนซ้ำ</p>" : ""}
  `;

  openGameModal({
    title: `ชัยชนะเหนือ ${result.bossName || "บอสแห่ง Lingua"}`,
    body: "แต้ม Grammaria ที่ได้รับ",
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
  if (stage.id === "final-boss") {
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

function saveProgress(updateObject = {}) {
  const progress = ensureActProgress();
  if (!progress) {
    return null;
  }

  mergeDeep(progress, updateObject);
  validateProgress(progress);
  progress.lastUpdatedAt = new Date().toISOString();
  playerData.progress.currentScene = progress.currentScreen;
  ensureGrammariaState();
  savePlayerData();
  console.log("[Progress] Saved:", progress);
  return progress;
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
      lessonChoices: [
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
      ]
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

function guidedPracticeNode(prompt, choices, correctAnswer, feedback) {
  return createSegmentNode(prompt, "guidedPractice", "มาสเตอร์เวรีออน", {
    lessonChoices: choices.map(choice => ({
      text: choice,
      correct: choice === correctAnswer,
      response: choice === correctAnswer
        ? feedback.correct
        : `${feedback.wrong} คำตอบที่ถูกคือ ${correctAnswer}`
    }))
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
      "ตอนนี้เจ้ารู้แล้วว่าอดีตคือสิ่งที่เกิดขึ้นและจบลงแล้ว",
      "แต่ในภาษาอังกฤษ การเล่าอดีตไม่ได้ใช้แค่คำบอกเวลาเท่านั้น",
      "เจ้าต้องเปลี่ยนคำกริยาให้กลายเป็นรูปอดีตด้วย",
      "คำกริยาปกติเรียกว่า Regular Verbs",
      "กฎพื้นฐานที่สุดคือ เติม -ed ต่อท้ายคำกริยา",
      "กฎนี้ใช้กับคำกริยาทั่วไปที่ไม่ได้ลงท้ายแบบพิเศษ",
      "เมื่อเติม -ed แล้ว คำกริยาจะบอกว่าเหตุการณ์นั้นเกิดขึ้นแล้ว",
      "อย่าจำแค่คำตอบ ให้จำหลักว่า verb ปกติ + ed = past"
    ],
    teacherExamples: [
      "walk กลายเป็น walked",
      "jump กลายเป็น jumped",
      "clean กลายเป็น cleaned",
      "watch กลายเป็น watched"
    ],
    guidedPractice: [
      {
        prompt: "ลองฝึกกับข้า help เมื่อเป็นอดีตควรเป็นข้อใด?",
        choices: ["helped", "helpd", "helpped"],
        answer: "helped",
        feedback: {
          correct: "ถูกต้อง help เป็นคำกริยาทั่วไป จึงเติม -ed เป็น helped",
          wrong: "ยังไม่ถูก help ใช้กฎพื้นฐาน เติม -ed"
        }
      },
      {
        prompt: "แล้ว open เมื่อเป็นอดีตควรเป็นข้อใด?",
        choices: ["opened", "openned", "opend"],
        answer: "opened",
        feedback: {
          correct: "ดีมาก open เติม -ed ปกติเป็น opened",
          wrong: "ยังไม่ถูก open ไม่ต้องเพิ่ม n ให้เติม -ed ปกติ"
        }
      }
    ],
    preBossDialogue: [
      "ดีมาก เจ้าฝึกกฎเติม -ed กับข้าแล้ว",
      "Echo Tick จะใช้คำใหม่เพื่อทดสอบว่าเจ้าเข้าใจกฎ ไม่ใช่แค่จำตัวอย่าง"
    ],
    postBossDialogue: [
      "กฎเติม -ed เริ่มมั่นคงแล้ว",
      "แต่คำที่ลงท้ายด้วย e มีทางเดินของมันเอง เราจะเรียนต่อทันที"
    ]
  },
  "regular-rule-2": {
    ruleId: "ending_e_add_d",
    teacherExampleVerbs: ["like", "love", "dance", "close"],
    guidedPracticeVerbs: ["live", "move"],
    teacherExplanation: [
      "กฎที่สองเกี่ยวกับคำกริยาที่ลงท้ายด้วย e",
      "ถ้าคำกริยามี e อยู่ท้ายคำแล้ว เราไม่เติม e ซ้ำ",
      "ให้เติมเพียง -d ต่อท้ายคำ",
      "ดังนั้น love จะไม่เป็น loveed",
      "เพราะ e มีอยู่แล้ว จึงกลายเป็น loved",
      "กฎนี้ช่วยให้สะกดคำสั้นและถูกต้องขึ้น",
      "ให้มองท้ายคำก่อนเสมอ ถ้าเห็น e ให้เติมแค่ d",
      "นี่คือกฎ ending e + d"
    ],
    teacherExamples: [
      "like กลายเป็น liked",
      "love กลายเป็น loved",
      "dance กลายเป็น danced",
      "close กลายเป็น closed"
    ],
    guidedPractice: [
      {
        prompt: "live เมื่อเป็นอดีตควรเป็นข้อใด?",
        choices: ["lived", "liveed", "livied"],
        answer: "lived",
        feedback: {
          correct: "ถูกต้อง live ลงท้ายด้วย e จึงเติมแค่ -d",
          wrong: "ยังไม่ถูก live มี e อยู่ท้ายคำแล้ว"
        }
      },
      {
        prompt: "move เมื่อเป็นอดีตควรเป็นข้อใด?",
        choices: ["moved", "moveed", "movied"],
        answer: "moved",
        feedback: {
          correct: "ดีมาก move เติมเพียง -d เป็น moved",
          wrong: "ยังไม่ถูก คำที่ลงท้ายด้วย e เติมแค่ -d"
        }
      }
    ],
    preBossDialogue: [
      "เจ้าฝึกกฎลงท้าย e แล้ว",
      "บอสจะใช้คำใหม่เพื่อดูว่าเจ้ามองท้ายคำเป็นหรือไม่"
    ],
    postBossDialogue: [
      "คำลงท้ายด้วย e ไม่หลอกเจ้าแล้ว",
      "ต่อไปเราจะเข้าสู่ประตูของตัวอักษร y"
    ]
  },
  "regular-rule-3": {
    ruleId: "y_rule",
    teacherExampleVerbs: ["play", "enjoy", "stay", "obey"],
    guidedPracticeVerbs: ["study", "cry"],
    teacherExplanation: [
      "กฎที่สามคือคำกริยาที่ลงท้ายด้วย y",
      "กฎนี้ต้องดูตัวอักษรก่อนหน้า y",
      "ถ้าหน้า y เป็นสระ เช่น a, e, i, o, u ให้เติม -ed ได้เลย",
      "play จึงกลายเป็น played ไม่ใช่ plaied",
      "ถ้าหน้า y เป็นพยัญชนะ ให้เปลี่ยน y เป็น i แล้วเติม -ed",
      "study จึงกลายเป็น studied",
      "กฎนี้มีสองทาง จึงต้องมองตัวก่อน y ทุกครั้ง",
      "สระ + y เติม -ed แต่พยัญชนะ + y เปลี่ยน y เป็น ied"
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
      "ตอนนี้เจ้ารู้ทั้งสระ + y และพยัญชนะ + y แล้ว",
      "Yesterday Sprite จะทดสอบด้วยคำใหม่ อย่าเดา ให้มองตัวก่อน y"
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
      "กฎที่สี่คือคำสั้นบางคำต้องเพิ่มพยัญชนะท้ายก่อนเติม -ed",
      "เรามักเห็นในคำแบบ consonant-vowel-consonant หรือ CVC",
      "ถ้าคำสั้นและเสียงเน้นที่ท้ายคำ ให้เพิ่มตัวท้ายอีกหนึ่งตัว",
      "จากนั้นจึงเติม -ed",
      "stop จึงกลายเป็น stopped",
      "plan จึงกลายเป็น planned",
      "กฎนี้ไม่ได้ใช้กับทุกคำ ต้องดูความสั้นและเสียงของคำ",
      "ในบทนี้ให้จำภาพง่าย ๆ ว่า คำสั้นปิดท้ายแน่น ให้ย้ำตัวท้ายก่อนเติม -ed"
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
      "Rewind Slime จะใช้คำใหม่เพื่อทดสอบว่ากฎนี้มั่นคงหรือยัง"
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
      "ก่อนเจอ The -ed Forger เราจะทบทวน Regular Verbs ทั้งหมด",
      "กฎแรก คำทั่วไปเติม -ed",
      "กฎที่สอง คำลงท้ายด้วย e เติมแค่ -d",
      "กฎที่สาม คำลงท้าย y ต้องดูตัวก่อน y",
      "กฎที่สี่ คำสั้นบางคำเพิ่มพยัญชนะท้ายก่อนเติม -ed",
      "บอสตัวนี้ไม่ได้สอนกฎใหม่ มันจะทดสอบว่ากฎทั้งหมดเชื่อมกันหรือยัง",
      "ถ้าเห็นคำถาม ให้ถามตัวเองก่อนว่า คำนี้อยู่กฎไหน",
      "เมื่อรู้กฎแล้ว คำตอบจะค่อย ๆ ชัดขึ้น"
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
      "ดีมาก นี่คือการทบทวนก่อนสอบจริง",
      "The -ed Forger จะใช้คำใหม่จากกฎเดิมทั้งหมด"
    ],
    postBossDialogue: [
      "The -ed Forger ถูกทำลายแล้ว",
      "แต่ในอดีตยังมีคำกริยาอีกกลุ่มที่ไม่ยอมเดินตามกฎ"
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
  (segment.teacherExplanation || []).forEach(text => {
    steps.push(createSegmentNode(text, "teacherExplanation"));
  });
  (segment.teacherExamples || []).forEach((text, index) => {
    steps.push(createSegmentNode(`ตัวอย่างที่ ${index + 1}: ${text}`, "teacherExamples"));
  });
  (segment.guidedPractice || []).forEach(practice => {
    steps.push(guidedPracticeNode(practice.prompt, practice.choices, practice.answer, practice.feedback));
  });
  (segment.preBossDialogue || []).forEach(text => {
    steps.push(createSegmentNode(text, "preBossDialogue"));
  });
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
  return lines.map(text => createSegmentNode(text, "postBossDialogue"));
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

function renderLessonStoryStep() {
  const step = state.lessonStorySteps[state.lessonStoryStepIndex];
  if (!step) {
    finishPastDialogueLesson();
    return;
  }

  if (state.currentLessonStage) {
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
  const finalButtonText = state.currentLessonStage?.questions?.length
    ? (state.currentLessonStage.type && state.currentLessonStage.type.includes("boss") ? "เริ่มต่อสู้" : "เริ่มฝึก")
    : "ไปต่อ";
  els.nextDialogueButton.textContent = state.lessonStoryStepIndex >= state.lessonStorySteps.length - 1 ? finalButtonText : "ถัดไป";
  startTypewriter(step.text);
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
    button.className = "dialogue-choice-btn";
    button.textContent = choice.text;
    button.addEventListener("click", () => chooseLessonStoryChoice(choice));
    els.dialogueChoices.appendChild(button);
  });
  els.dialogueChoices.classList.remove("hidden");
}

function chooseLessonStoryChoice(choice) {
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
  saveProgress({
    currentDialogueIndex: state.lessonStoryStepIndex,
    currentScreen: "lesson",
    lastSafeScreen: "lesson"
  });
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
  els.lessonStoryVisual.classList.add("hidden");
  els.lessonStoryVisual.innerHTML = "";
  clearSpeakingCharacters();
  els.dialoguePanel.classList.add("hidden");
  els.dialogueActions.classList.add("hidden");
  console.log("[Lesson Complete]", stage?.id, "Unlocked:", getAllowedRuleIdsForStage(stage));
  if (stage?.isPostBossDialogue) {
    const completedStage = state.postBossDialogueStage || stage;
    state.postBossDialogueStage = null;
    if (completedStage.type === "final-boss") {
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

function startPostBossDialogue(stage) {
  const postBossStage = {
    ...stage,
    questions: [],
    isPostBossDialogue: true
  };
  state.postBossDialogueStage = stage;
  state.currentLessonStage = postBossStage;
  console.log("[Lesson Start]", `${stage.id}:postBoss`, ["postBossDialogue"]);
  startLessonDialogueSequence(postBossStage, buildPostBossDialogue(stage), 0);
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
    text: stage.type === "final-boss"
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
    text: stage.type === "final-boss"
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
      text: stage.type === "final-boss"
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
    els.battleButton.classList.add("hidden");
    return;
  }

  if (step.type === "example" || step.type === "examples") {
    renderExampleCards(step);
  } else {
    renderLessonTextStep(step);
  }

  els.battleButton.textContent = getLessonStepButtonText(step);
  els.battleButton.onclick = advanceLessonStep;
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
  card.innerHTML = `<strong>${step.speaker || "บทเรียน"}</strong><span>${step.text}</span>`;
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
    button.className = "lesson-choice-btn";
    button.textContent = choiceText;
    button.addEventListener("click", () => chooseLessonStepAnswer(choice, step));
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
  els.battleButton.textContent = "ถัดไป";
  els.battleButton.onclick = advanceLessonStep;
  els.battleButton.classList.remove("hidden");
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
  els.battleButton.textContent = "เริ่มภารกิจ";
  els.battleButton.classList.remove("hidden");
  els.battleButton.onclick = () => showStageLesson(0);

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

  state.actStageIndex = stageIndex;
  state.currentLessonStage = stage;
  updateLessonChrome(stage, stageIndex, "lesson");
  console.log("[Lesson Start]", stage.id, getAllowedRuleIdsForStage(stage));
  startStageDialogueLesson(stage, resumeState.dialogueIndex || 0);
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
  const stageConfig = getPlayableStages()[stageIndex];
  const allowedRuleIds = getAllowedRuleIdsForStage(stageConfig);
  const stage = {
    ...stageConfig,
    questions: filterQuestionsForStage(stageConfig.questions || [], stageConfig)
  };
  console.log("[Battle Start]", stage.id, "Allowed Rules:", allowedRuleIds);
  const questionCount = stage.questions.length;
  if (!questionCount) {
    console.error("[Battle Start] No valid questions for stage:", stage.id);
    completeNonBattleStage(stageConfig);
    return;
  }
  const enemyMaxHp = stage.type === "final-boss" ? 140 : 100;
  state.timeDustTransitionComplete = false;
  state.actStageIndex = stageIndex;
  state.actBattle = {
    stage,
    questionIndex: 0,
    correctAnswers: 0,
    damagePerCorrect: Math.ceil(enemyMaxHp / questionCount),
    turnNumber: 1,
    awaitingParry: false,
    awaitingPrepare: false,
    pendingBossAction: null,
    pendingBossTurn: null,
    bossQuestionIndex: 0,
    pendingPlayerAttack: null,
    recentCharmIds: [],
    usedQuestionIds: new Set(),
    lastQuestionBaseVerb: "",
    currentQuestion: null,
    usedBossQuestionIds: new Set(),
    lastBossQuestionBaseVerb: "",
    simpleIrregularStreak: 0,
    bossStunned: false,
    bossWasStunnedLastTurn: false,
    correctStreak: 0,
    ap: ACT_MAX_AP,
    focusBuff: null,
    criticalCounterReady: false,
    awaitingGrammarCharge: false,
    pendingGrammarCharge: null,
    isActive: true,
    victoryHandled: false,
    grammariaStats: createBattleStats(stage)
  };
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
  els.battleTitle.textContent = stage.type === "final-boss" ? "Final Boss: The Memory Breaker" : stage.title;
  updateBattleEnemyVisual(stage);
  updateBattleStats();
  setActionButtonsEnabled(false);
  showScene("battle");
  beginActPlayerTurn("เลือกการกระทำเพื่อเริ่มเทิร์นของผู้พเนจร");
}

function startActAttackAction() {
  const battle = state.actBattle;
  if (!battle) {
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

  if (!spendActAP(1)) {
    beginActPlayerTurn("AP ไม่พอสำหรับใช้ไอเทม ใช้ตั้งสมาธิเพื่อฟื้น AP");
    return;
  }

  battle.pendingBossAction = chooseActBossAction(battle);
  battle.advanceQuestionOnContinue = false;
  els.battleMessage.textContent = "ยังไม่มีไอเทมต่อสู้ในบททดสอบนี้ การลังเลเปิดช่องให้ศัตรูตอบโต้";
  setTimeout(startActBossWarning, 800);
}

function startActFocusAction() {
  const battle = state.actBattle;
  if (!battle) {
    return;
  }

  const focusQuestion = prepareQuestion(getBossQuestion(battle.stage) || battle.stage.questions[battle.questionIndex]);
  battle.currentFocusQuestion = focusQuestion;
  battle.advanceQuestionOnContinue = false;
  showOnlyBattlePanel(els.questionPanel);
  setBattleTurnOwner("player");
  els.battleMessage.textContent = "ตั้งสมาธิ: ตอบคำถามสั้น ๆ เพื่อรวบรวม Grammaria และฟื้น AP";
  els.questionText.textContent = getQuestionText(focusQuestion);
  els.answerOptions.innerHTML = "";

  focusQuestion.options.forEach(option => {
    const button = document.createElement("button");
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
    gainActAP(2);
    battle.focusBuff = {
      damageMultiplier: 1.25,
      critBonus: 0.05,
      improveCharmRoll: true
    };
    feedback.innerHTML = `<strong>ตั้งสมาธิสำเร็จ!</strong><br>ฟื้น AP +2 และการโจมตีครั้งถัดไปทรงพลังขึ้น<br>${question.explanation || ""}`;
    els.battleMessage.textContent = "Grammaria นิ่งขึ้น การโจมตีครั้งถัดไปได้รับ Focus Buff";
  } else {
    recordWrongAnswerForGrammaria();
    gainActAP(1);
    feedback.innerHTML = `<strong>สมาธิยังไม่นิ่ง</strong><br>ฟื้น AP +1 คำตอบที่ถูกคือ <strong>${correctAnswer}</strong><br>${question.explanation || ""}`;
    els.battleMessage.textContent = "ยังรวบรวมสมาธิได้บางส่วน ฟื้น AP +1";
  }

  els.answerOptions.appendChild(feedback);
  updateBattleStats();
  syncBattleStateToPlayerData();
  battle.pendingBossAction = chooseActBossAction(battle);
  battle.advanceQuestionOnContinue = false;
  if (battle.pendingBossAction && battle.pendingBossAction.sequence) {
    battle.pendingBossAction.sequence = battle.pendingBossAction.sequence.map(step => step === "attack" ? "question" : step);
  }
  setTimeout(startActBossWarning, 1100);
}

function showActBattleQuestion() {
  const battle = state.actBattle;
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
    state.enemyHp = clamp(state.enemyHp - echoDamage, 0, state.enemyMaxHp);
    triggerEnemyHitFeedback(echoDamage);
    updateBattleStats();
    els.battleMessage.textContent += ` | เสียงสะท้อนสร้างดาเมจ ${echoDamage}`;
    if (state.enemyHp <= 0) {
      handleActEnemyDefeated("echoDamage");
      return;
    }
  }

  visibleOptions.forEach(option => {
    const button = document.createElement("button");
    button.className = "answer-button";
    button.textContent = option;
    button.addEventListener("click", () => chooseActAnswer(option));
    els.answerOptions.appendChild(button);
  });

  showOnlyBattlePanel(els.questionPanel);
}

function chooseActAnswer(option) {
  const battle = state.actBattle;
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
    setBattleTurnOwner("player");
    battle.correctAnswers += 1;
    recordCorrectAnswerForGrammaria();
    battle.correctStreak = (battle.correctStreak || 0) + 1;
    const bonusGrammaria = consumeBattleEffectValue("nextCorrectBonusGrammaria", 0);
    battle.pendingPlayerAttack = {
      baseDamage: battle.damagePerCorrect,
      grammariaGain: 10 + bonusGrammaria
    };
    feedback.innerHTML = `<strong>คำตอบถูกต้อง!</strong><br>${question.explanation}`;
  } else {
    battle.correctStreak = 0;
    if (useBattleEffect("retry")) {
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
    state.playerHp = clamp(state.playerHp - 12, 0, 100);
    triggerMotion(els.battleEnemy, "enemy-attack-motion");
    feedback.innerHTML = `<strong>ยังไม่ถูกต้อง</strong><br>คำตอบที่ถูกคือ <strong>${question.correctAnswer || question.answer}</strong><br>${question.explanation}`;
  }

  els.answerOptions.appendChild(feedback);
  updateBattleStats();
  syncBattleStateToPlayerData();
  battle.pendingBossAction = chooseActBossAction(battle);

  if (isCorrect) {
    els.battleMessage.textContent = "คำตอบถูกต้อง! เลือกเครื่องรางเพื่อเสริมพลังโจมตี";
    els.continueBattleButton.classList.add("hidden");
    setTimeout(showActCharmChoices, 650);
    return;
  }

  els.continueBattleButton.classList.add("hidden");
  setTimeout(startActBossWarning, 1100);
}

function showActCharmChoices() {
  const battle = state.actBattle;
  if (!battle || !battle.pendingPlayerAttack) {
    return;
  }

  els.charmOptions.innerHTML = "";
  selectRandomActCharms().forEach(charm => {
    const button = document.createElement("button");
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
  if (stage.id === "final-boss" || stage.enemy === "The Memory Breaker") {
    return "memoryBreaker";
  }
  return null;
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

function getBossQuestion(stage) {
  const key = getBossKey(stage);
  const rawBank = key ? bossQuestionBanks[key] : null;
  const bank = rawBank ? filterQuestionsForStage(rawBank, stage) : null;
  if (!bank || !bank.length) {
    return null;
  }

  const battle = state.actBattle;
  if (!battle) {
    return sample(bank, 1)[0];
  }

  if (!battle.usedBossQuestionIds || battle.usedBossQuestionIds.size > Math.floor(bank.length * 0.8)) {
    battle.usedBossQuestionIds = new Set();
  }

  const weights = bossDifficultyWeights[key] || { medium: 50, hard: 35, boss: 15 };
  let preferredDifficulty = weightedPickFromTable(weights);
  let pool = bank.filter(question =>
    question.difficulty === preferredDifficulty &&
    !battle.usedBossQuestionIds.has(question.id) &&
    question.baseVerb !== battle.lastBossQuestionBaseVerb
  );

  if (key === "memoryBreaker" && battle.simpleIrregularStreak >= 2) {
    pool = pool.filter(question => !["irregular-v2", "mixed-rule"].includes(question.type));
  }

  if (!pool.length) {
    pool = bank.filter(question =>
      !battle.usedBossQuestionIds.has(question.id) &&
      question.baseVerb !== battle.lastBossQuestionBaseVerb
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
  battle.lastBossQuestionBaseVerb = question.baseVerb || "";
  battle.bossQuestionIndex += 1;

  if (key === "memoryBreaker" && question.type === "irregular-v2") {
    battle.simpleIrregularStreak = (battle.simpleIrregularStreak || 0) + 1;
  } else if (key === "memoryBreaker") {
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

  let chance = baseChance;
  if (battle.bossWasStunnedLastTurn) {
    chance *= 0.5;
    battle.bossWasStunnedLastTurn = false;
  }

  if (Math.random() < chance) {
    battle.bossStunned = true;
    addBattleMessageLine(lines, "บอสติด Stun! การโจมตีครั้งถัดไปถูกหยุดไว้");
    return true;
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
      state.guardShield = Math.max(state.guardShield || 0, charm.value || 0);
      addBattleMessageLine(lines, `ลดดาเมจบอสครั้งถัดไป ${Math.round((charm.value || 0) * 100)}%`);
      break;
    case "memoryCharge":
      effects.memoryCharge += charm.value || 1;
      addBattleMessageLine(lines, `สะสม Memory Charge ${effects.memoryCharge}`);
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
      effects.markDamageBonus = Math.max(effects.markDamageBonus || 0, charm.value || 0);
      addBattleMessageLine(lines, "บอสติด Mark รับดาเมจเพิ่มในครั้งนี้");
      break;
    case "counterOnGoodParry":
      effects.counterOnGoodParry = Math.max(effects.counterOnGoodParry || 0, charm.value || 0);
      addBattleMessageLine(lines, "Good/Perfect Parry ครั้งถัดไปจะสวนกลับเพิ่ม");
      break;
    case "stunChance":
      effects.stunChance = Math.max(effects.stunChance || 0, charm.value || 0);
      addBattleMessageLine(lines, `มีโอกาส Stun บอส ${Math.round((charm.value || 0) * 100)}%`);
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
      damage = Math.round(damage * (charm.value || 1.2));
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
      addBattleMessageLine(lines, "Grammar Break เพิ่มดาเมจ");
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
      if (battle?.bossStunned) {
        damage = Math.round(damage * (charm.value || 1.5));
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

  return { totalDamage, grammariaBonus: extraGrammaria, isCrit, stunChance };
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
    els.continueBattleButton.textContent = battle.questionIndex >= battle.stage.questions.length - 1 ? "รับรางวัล" : "คำถามถัดไป";
    els.continueBattleButton.onclick = continueActBattle;
    els.continueBattleButton.classList.remove("hidden");
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
  if (focusBuff?.critBonus) {
    effects.criticalChanceBonus += focusBuff.critBonus;
  }
  if (battle.criticalCounterReady) {
    effects.forceCriticalNextAttack += 1;
    bonusLines.push("Critical Counter ทำงานจาก Perfect Point Parry");
  }

  const damageResult = calculateCharmDamage(charm, battle.pendingPlayerAttack.baseDamage, bonusLines);
  let totalDamage = damageResult.totalDamage;
  const grammariaBonus = damageResult.grammariaBonus;
  const isCrit = damageResult.isCrit;
  const stunChance = damageResult.stunChance;

  const chargeDamage = calculateChargeDamage(totalDamage, normalizedChargePercent);
  totalDamage = chargeDamage.finalDamage;
  bonusLines.push(buildChargeFeedback(chargeDamage.percent, totalDamage - chargeDamage.bonusDamage, chargeDamage.bonusDamage, chargeDamage.finalDamage));
  if (focusBuff?.damageMultiplier) {
    totalDamage = Math.round(totalDamage * focusBuff.damageMultiplier);
    bonusLines.push("Focus Buff เพิ่มพลังโจมตี");
  }
  if (battle.criticalCounterReady) {
    totalDamage = Math.round(totalDamage * 1.15);
  }

  const grammariaGain = battle.pendingPlayerAttack.grammariaGain + grammariaBonus;

  triggerMotion(els.battlePlayer, "player-attack-motion");
  state.enemyHp = clamp(state.enemyHp - totalDamage, 0, state.enemyMaxHp);
  triggerEnemyHitFeedback(totalDamage, isCrit ? "CRIT" : "");
  state.grammaria += grammariaGain;
  gainActAP(1);
  if (isCrit) {
    gainActAP(1);
  }
  recordGrammariaChargeUse(normalizedChargePercent);
  battle.pendingPlayerAttack = null;
  battle.focusBuff = null;
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
    els.continueBattleButton.textContent = battle.questionIndex >= battle.stage.questions.length - 1 ? "รับรางวัล" : "เทิร์นถัดไป";
    els.continueBattleButton.onclick = continueActBattle;
    els.continueBattleButton.classList.remove("hidden");
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
  state.enemyHp = clamp(state.enemyHp - damage, 0, state.enemyMaxHp);
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

function chooseActBossAction(battle) {
  const hpPercent = state.enemyHp / state.enemyMaxHp;
  const bossKey = getBossKey(battle.stage);
  const patterns = bossKey ? bossActionPatterns[bossKey] : null;
  let baseAction = BOSS_ACTIONS[0];

  if (battle.stage.type === "final-boss" && (hpPercent <= 0.35 || battle.turnNumber % 5 === 0)) {
    baseAction = BOSS_ACTIONS.find(action => action.type === "ultimate");
  } else if (battle.stage.type.includes("boss") && battle.turnNumber % 5 === 0) {
    baseAction = BOSS_ACTIONS.find(action => action.type === "ultimate");
  } else if (battle.stage.type.includes("boss") && battle.turnNumber % 3 === 0) {
    baseAction = BOSS_ACTIONS.find(action => action.type === "skill");
  }

  const pattern = !patterns
    ? ["attack"]
    : baseAction.type === "ultimate"
    ? (bossKey === "memoryBreaker" ? ["question", "question", "attack"] : ["question", "attack"])
    : sample(patterns, 1)[0];

  const action = {
    ...baseAction,
    sequence: [...pattern],
    bossKey
  };
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

function bossIntentLabel(turn) {
  if (!turn) {
    return "เตรียมป้องกัน";
  }
  const remaining = turn.sequence.slice(turn.stepIndex);
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
  els.bossIntentName.textContent = enemyName;
  els.bossIntentText.textContent = battle.pendingBossAction?.warning || "ศัตรูกำลังเตรียมโจมตี";
  els.bossIntentType.textContent = `รูปแบบถัดไป: ${bossIntentLabel(turn)}`;
  els.battleMessage.textContent = "อ่านสัญญาณศัตรูก่อนเริ่มจังหวะป้องกัน";
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

  if (battle.bossStunned) {
    battle.bossStunned = false;
    battle.bossWasStunnedLastTurn = true;
    battle.pendingBossAction = null;
    battle.pendingBossTurn = null;
    battle.turnNumber += 1;
    showOnlyBattlePanel(null);
    setBattleTurnOwner("player");
    els.battleMessage.textContent = "บอสติด Stun! การโจมตีครั้งถัดไปถูกหยุดไว้";
    els.continueBattleButton.textContent = battle.questionIndex >= battle.stage.questions.length - 1 ? "รับรางวัล" : "คำถามถัดไป";
    els.continueBattleButton.onclick = continueActBattle;
    els.continueBattleButton.classList.remove("hidden");
    return;
  }

  const action = battle.pendingBossAction;
  battle.pendingBossTurn = {
    action,
    sequence: [...(action.sequence || ["attack"])],
    stepIndex: 0,
    correctQuestions: 0,
    wrongQuestions: 0
  };

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

  showBossAttackStep();
}

function getPointParryDifficulty() {
  const battle = state.actBattle;
  const config = getParryConfigForBoss(battle?.stage, battle?.pendingBossAction);
  return {
    targetCount: config.targetCount,
    duration: config.duration,
    size: config.size
  };
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
  state.pointParry = {
    active: true,
    hits: 0,
    targetCount: difficulty.targetCount,
    timeout: null
  };

  setBattleTurnOwner("enemy");
  showOnlyBattlePanel(els.pointParryPanel);
  els.pointParryTitle.textContent = battle.pendingBossAction.label || "Memory Fracture";
  els.pointParryInstruction.textContent = "แตะวงเวทที่ปรากฏให้ครบก่อนเวลาหมด";
  els.pointParryResult.textContent = "";
  els.pointParryArena.innerHTML = "";

  for (let index = 0; index < difficulty.targetCount; index += 1) {
    const target = document.createElement("button");
    target.className = "point-parry-target";
    target.type = "button";
    target.style.width = `${difficulty.size}px`;
    target.style.height = `${difficulty.size}px`;
    target.style.left = `${12 + Math.random() * 68}%`;
    target.style.top = `${14 + Math.random() * 62}%`;
    target.textContent = "✦";
    target.addEventListener("pointerdown", event => {
      event.preventDefault();
      if (!state.pointParry?.active || target.classList.contains("is-hit")) {
        return;
      }
      target.classList.add("is-hit");
      state.pointParry.hits += 1;
      if (state.pointParry.hits >= state.pointParry.targetCount) {
        resolvePointParry("PERFECT");
      }
    });
    els.pointParryArena.appendChild(target);
  }

  state.pointParry.timeout = setTimeout(() => {
    if (!state.pointParry?.active) {
      return;
    }
    resolvePointParry(state.pointParry.hits > 0 ? "GOOD" : "MISS");
  }, difficulty.duration);
}

function resolvePointParry(result) {
  const battle = state.actBattle;
  if (!battle || !battle.pendingBossAction || !state.pointParry?.active) {
    return;
  }

  if (state.pointParry.timeout) {
    clearTimeout(state.pointParry.timeout);
  }
  state.pointParry.active = false;

  const action = battle.pendingBossAction;
  const effects = state.battleActiveEffects || {};
  const parryConfig = getParryConfigForBoss(battle.stage, action);
  let damage = action.damage;
  let counterDamage = 0;

  if (result === "PERFECT") {
    damage = parryConfig.preventDamage ? 0 : damage;
    counterDamage = parryConfig.counterDamage;
    battle.criticalCounterReady = true;
    gainActAP(1);
  } else if (result === "GOOD") {
    damage = Math.round(action.damage * 0.5);
  }
  recordParryForGrammaria(result, `point:${battle.turnNumber}:${battle.pendingBossTurn?.stepIndex || 0}`);

  if (state.shield > 0) {
    damage = Math.round(damage * (1 - state.shield));
    state.shield = 0;
  }
  if (state.guardShield > 0) {
    damage = Math.round(damage * (1 - state.guardShield));
    state.guardShield = 0;
  }
  if (effects.bossWeak) {
    damage = Math.round(damage * (1 - effects.bossWeak));
  }

  state.playerHp = clamp(state.playerHp - damage, 0, 100);
  state.enemyHp = clamp(state.enemyHp - counterDamage, 0, state.enemyMaxHp);

  if (counterDamage) {
    triggerMotion(els.battlePlayer, "player-attack-motion");
    triggerEnemyHitFeedback(counterDamage, "COUNTER");
  } else {
    triggerMotion(els.battleEnemy, "enemy-attack-motion");
  }

  updateBattleStats();
  syncBattleStateToPlayerData();
  showOnlyBattlePanel(null);
  setBattleTurnOwner("player");
  els.battleMessage.textContent = result === "PERFECT"
    ? `${buildPointParryMessage(parryConfig, counterDamage, result)} และได้รับ Critical Counter`
    : result === "GOOD"
      ? `POINT GUARD! ลดดาเมจ เหลือรับ ${damage}`
      : `MISS! รับดาเมจ ${damage}`;

  if (state.enemyHp <= 0) {
    handleActEnemyDefeated("pointParryCounter");
    return;
  }

  const hasMoreBossSteps = battle.pendingBossTurn && battle.pendingBossTurn.stepIndex < battle.pendingBossTurn.sequence.length;
  if (!hasMoreBossSteps) {
    finalizeBossTurnState();
    if (state.playerHp <= 0) {
      state.playerHp = 35;
      updateBattleStats();
      els.battleMessage.textContent += "\nมาสเตอร์เวรีออนประคองความทรงจำไว้ เจ้าลุกขึ้นพร้อมพลังชีวิต 35";
    }
  }

  els.continueBattleButton.textContent = hasMoreBossSteps ? "ดำเนินต่อ" : (battle.questionIndex >= battle.stage.questions.length - 1 ? "รับรางวัล" : "เทิร์นถัดไป");
  els.continueBattleButton.onclick = hasMoreBossSteps ? runNextBossTurnStep : continueActBattle;
  els.continueBattleButton.classList.remove("hidden");
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
  els.continueBattleButton.textContent = "เตรียมพร้อม";
  els.continueBattleButton.onclick = prepareActParry;
  els.continueBattleButton.classList.remove("hidden");
}

function showBossQuestionStep() {
  const battle = state.actBattle;
  if (isActBattleEnded(battle)) {
    console.log("[Battle] showBossQuestionStep blocked because battle already ended");
    return;
  }
  const rawQuestion = battle && getBossQuestion(battle.stage);
  if (!battle || !rawQuestion) {
    runNextBossTurnStep();
    return;
  }
  const question = prepareQuestion(rawQuestion);
  battle.currentBossQuestion = question;

  showOnlyBattlePanel(els.questionPanel);
  setBattleTurnOwner("enemy");
  els.continueBattleButton.classList.add("hidden");
  els.battleMessage.textContent = "บอส: “ถ้าเจ้าจำอดีตผิด ความทรงจำก็จะแตกสลาย... ตอบข้ามา!”";
  els.questionText.textContent = getQuestionText(question);
  els.answerOptions.innerHTML = "";

  question.options.forEach(option => {
    const button = document.createElement("button");
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
    const chipDamage = battle.stage.type === "final-boss" ? 10 : 7;
    state.playerHp = clamp(state.playerHp - chipDamage, 0, 100);
    triggerMotion(els.battleEnemy, "enemy-attack-motion");
    feedback.innerHTML = `<strong>ยังไม่ถูกต้อง!</strong><br>บอสโจมตีแรงขึ้น คำตอบที่ถูกคือ <strong>${question.correctAnswer || question.answer}</strong><br>${question.explanation}`;
  }

  els.answerOptions.appendChild(feedback);
  updateBattleStats();
  syncBattleStateToPlayerData();
  els.battleMessage.textContent = isCorrect
    ? "คำตอบถูกต้อง! พลังโจมตีของบอสอ่อนลง"
    : "ยังไม่ถูกต้อง! บอสสะสมพลังโจมตีเพิ่มขึ้น";
  els.continueBattleButton.textContent = "ดำเนินต่อ";
  els.continueBattleButton.onclick = runNextBossTurnStep;
  els.continueBattleButton.classList.remove("hidden");
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

  if (state.playerHp <= 0) {
    state.playerHp = 35;
    updateBattleStats();
    els.battleMessage.textContent += "\nมาสเตอร์เวรีออนประคองความทรงจำไว้ เจ้าลุกขึ้นพร้อมพลังชีวิต 35";
  }

  els.continueBattleButton.textContent = battle.questionIndex >= battle.stage.questions.length - 1 || state.enemyHp <= 0 ? "รับรางวัล" : "คำถามถัดไป";
  els.continueBattleButton.onclick = continueActBattle;
  els.continueBattleButton.classList.remove("hidden");
}

function finalizeBossTurnState() {
  const battle = state.actBattle;
  if (!battle) {
    return;
  }
  battle.awaitingParry = false;
  battle.awaitingPrepare = false;
  battle.pendingBossAction = null;
  battle.pendingBossTurn = null;
  battle.turnNumber += 1;
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
  battle.awaitingParry = true;
  setBattleTurnOwner("enemy");
  state.parry = {
    active: true,
    inputLocked: false,
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
  els.parryButton.disabled = false;
  showOnlyBattlePanel(els.parryPanel);
  startParryGauge();
  state.parry.resolveTimeout = setTimeout(() => stopActParry("MISS"), Math.max(1500, action.parryDuration * difficulty.durationMultiplier));
}

function stopActParry(forcedResult = null) {
  const battle = state.actBattle;
  if (!battle || !battle.awaitingParry || !state.parry) {
    return;
  }

  const action = battle.pendingBossAction;
  let parryResult = forcedResult || parryGaugeResult(state.parry.gaugeProgress);
  let damage = action.damage;
  let counterDamage = 0;
  const effects = state.battleActiveEffects || {};

  if (parryResult === "MISS" && useBattleEffect("secondChance")) {
    parryResult = "WEAK";
  }

  if (effects.upgradeNextParry) {
    const upgradeMap = { MISS: "WEAK", WEAK: "GOOD", GOOD: "PERFECT", PERFECT: "PERFECT" };
    parryResult = upgradeMap[parryResult] || parryResult;
    effects.upgradeNextParry -= 1;
  }

  if (parryResult === "PERFECT") {
    damage = 0;
    counterDamage = 8;
    gainActAP(1);
  } else if (parryResult === "GOOD") {
    damage = Math.round(action.damage * 0.4);
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

  if (state.shield > 0) {
    damage = Math.round(damage * (1 - state.shield));
    state.shield = 0;
  }

  if (state.guardShield > 0) {
    damage = Math.round(damage * (1 - state.guardShield));
    state.guardShield = 0;
  }

  state.playerHp = clamp(state.playerHp - damage, 0, 100);
  if (state.playerHp <= 0 && effects.surviveFatalOnce) {
    effects.surviveFatalOnce = false;
    const healAmount = Math.max(1, Math.round(100 * (effects.surviveFatalHealPercent || 0.4)));
    state.playerHp = clamp(1 + healAmount, 1, 100);
    damage = 0;
  }
  state.enemyHp = clamp(state.enemyHp - counterDamage, 0, state.enemyMaxHp);
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
  setBattleTurnOwner("player");

  els.battleMessage.textContent = `${thaiParryName(parryResult)} - รับดาเมจ ${damage}${counterDamage ? ` และสวนกลับ ${counterDamage}` : ""}`;
  if (state.enemyHp <= 0) {
    handleActEnemyDefeated("parryCounter");
    return;
  }

  const hasMoreBossSteps = battle.pendingBossTurn && battle.pendingBossTurn.stepIndex < battle.pendingBossTurn.sequence.length;
  if (!hasMoreBossSteps) {
    finalizeBossTurnState();
    if (state.playerHp <= 0) {
      state.playerHp = 35;
      updateBattleStats();
      els.battleMessage.textContent += "\nมาสเตอร์เวรีออนประคองความทรงจำไว้ เจ้าลุกขึ้นพร้อมพลังชีวิต 35";
    }
  }
  els.continueBattleButton.textContent = hasMoreBossSteps ? "ดำเนินต่อ" : (battle.questionIndex >= battle.stage.questions.length - 1 ? "รับรางวัล" : "คำถามถัดไป");
  els.continueBattleButton.onclick = hasMoreBossSteps ? runNextBossTurnStep : continueActBattle;
  els.continueBattleButton.classList.remove("hidden");
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

  if (battle.questionIndex >= battle.stage.questions.length && battle.stage.type === "final-boss" && state.enemyHp > 0) {
    els.battleMessage.textContent = "The Memory Breaker ยังไม่สลาย ความทรงจำต้องการคำตอบที่ถูกต้องมากกว่านี้";
    state.playerHp = 100;
    state.enemyHp = state.enemyMaxHp;
    battle.questionIndex = 0;
    battle.correctAnswers = 0;
    updateBattleStats();
    els.continueBattleButton.textContent = "ลองต่อสู้อีกครั้ง";
    els.continueBattleButton.onclick = () => beginActPlayerTurn("เลือกการกระทำเพื่อเริ่มรอบใหม่");
    els.continueBattleButton.classList.remove("hidden");
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

  if (state.playerHp <= 0) {
    state.playerHp = 35;
    updateBattleStats();
    els.battleMessage.textContent = "มาสเตอร์เวรีออนประคองความทรงจำไว้ เจ้าลุกขึ้นพร้อมพลังชีวิต 35";
  }

  beginActPlayerTurn("เทิร์นใหม่เริ่มแล้ว เลือกการกระทำ");
}

function addUniqueActValue(list, value) {
  if (!list.includes(value)) {
    list.push(value);
  }
}

function grantActReward(stage, options = {}) {
  const progress = ensureActProgress();
  if (!progress) {
    return null;
  }

  const shouldAwardGrammaria = options.awardGrammaria !== false;
  const alreadyCompleted = progress.completedStages.includes(stage.id);
  const grammariaResult = shouldAwardGrammaria ? awardBossGrammaria(stage) : null;
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
  if (nextStage) {
    unlockStage(nextStage.id);
  }
  saveProgress({
    currentStageId: stage.id === "final-boss" ? stage.id : (nextStage ? nextStage.id : stage.id),
    currentLessonId: stage.id === "final-boss" ? stage.id : (nextStage ? nextStage.id : stage.id),
    currentScreen: stage.id === "final-boss" ? "victory" : "lesson",
    lastSafeScreen: stage.id === "final-boss" ? "victory" : "lesson",
    currentDialogueIndex: 0,
    currentLessonStepIndex: 0
  });
  return grammariaResult;
}

function handleTimeDustDefeated(stage) {
  console.log("[TimeDust] handleTimeDustDefeated called");
  transitionToRegularEdLessonAfterTimeDust(stage);
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
  showOnlyBattlePanel(null);
  updateBattleStats();
  syncBattleStateToPlayerData();
  setBattleTurnOwner("player");

  state.lastStageResult = {
    correctAnswers: battle.correctAnswers,
    totalQuestions: battle.stage.questions.length
  };

  els.battleMessage.textContent = `${battle.stage.thaiEnemy || battle.stage.enemy} พ่ายแพ้แล้ว! กำลังเปิดบทเรียนถัดไป...`;

  console.log("[TimeDust] Victory message shown", {
    enemyId: normalizedEnemyId,
    stageId: battle.stage.id,
    enemyHp: state.enemyHp
  });

  if (normalizedEnemyId === "timeDust") {
    const defeatedStage = battle.stage;
    const grammariaResult = grantActReward(defeatedStage);
    state.grammaria = playerData ? playerData.grammaria || state.grammaria : state.grammaria;
    state.actBattle = null;
    renderBossGrammariaResult(grammariaResult, () => {
      showTimeDustNextLessonFallback(defeatedStage);
      setTimeout(() => {
        console.log("[TimeDust] Transition after Grammaria result fired");
        transitionToRegularEdLessonAfterTimeDust(defeatedStage);
      }, 400);
    });
    return true;
  }

  els.continueBattleButton.textContent = "รับรางวัล";
  els.continueBattleButton.onclick = completeActStage;
  els.continueBattleButton.classList.remove("hidden");
  return true;
}

function completeActStage() {
  const battle = state.actBattle;
  if (!battle) {
    return;
  }
  const stage = battle.stage;
  state.lastStageResult = {
    correctAnswers: battle.correctAnswers,
    totalQuestions: stage.questions.length
  };
  const grammariaResult = grantActReward(stage);
  state.actBattle = null;
  state.grammaria = playerData ? playerData.grammaria || state.grammaria : state.grammaria;

  if (stage.id === "what-is-past") {
    handleTimeDustDefeated(stage);
    return;
  }

  if (stage.type === "final-boss") {
    renderBossGrammariaResult(grammariaResult, () => {
      runSceneTransition("ความทรงจำสุดท้ายกำลังกลับคืน...", () => startPostBossDialogue(stage));
    });
    return;
  }

  renderBossGrammariaResult(grammariaResult, () => {
    runSceneTransition(`ได้รับ ${stage.reward.fragment}`, () => startPostBossDialogue(stage));
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
  els.battleButton.classList.remove("hidden", "disabled");
  els.battleButton.disabled = false;
  els.nextDialogueButton.classList.remove("hidden", "disabled");
  els.nextDialogueButton.disabled = false;
}

function showStageReward(stage) {
  const nextIndex = state.actStageIndex + 1;
  const grammariaEarned = state.lastGrammariaResult?.bossId === (getBossProgressId(stage) || stage.id)
    ? state.lastGrammariaResult.earned || 0
    : 0;
  state.isLessonSummaryOpen = false;
  restoreLessonUIAfterBattle();
  const rewardLines = [
    state.lastStageResult.totalQuestions
      ? `คำตอบถูกต้อง: ${state.lastStageResult.correctAnswers} / ${state.lastStageResult.totalQuestions}`
      : "บทเรียนเสร็จสิ้น",
    `Fragment: ${stage.reward.fragment}`,
    `Grammaria ที่ได้รับ: +${grammariaEarned}`
  ];

  updateLessonChrome(stage, state.actStageIndex, "lesson");
  els.nounActivityVisual.querySelector("h3").textContent = "ได้รับ Fragment";
  els.activityFeedback.textContent = `ได้รับ ${stage.reward.fragment} และ Grammaria +${grammariaEarned}`;
  renderActionCards(rewardLines, "lesson-card");
  const nextStage = getPlayableStages()[nextIndex];
  if (nextStage) {
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
  els.battleButton.textContent = stage.id === "ed-mini-boss"
    ? "ไปยัง Irregular Verbs"
    : nextStage && nextStage.type === "final-boss"
      ? "ต่อสู้บอสปรากฏตัว"
      : "ด่านถัดไป";
  els.battleButton.classList.remove("hidden");
  els.battleButton.onclick = () => showStageLesson(nextIndex);
  showScene("story");
}

function resetBattle() {
  clearEnemyTurnTimer();
  stopTimer("charge");
  stopParryCountdown();

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

  if (els.battleEnemySprite) {
    els.battleEnemySprite.onerror = null;
    els.battleEnemySprite.classList.toggle("timedust-gif", isTimeDust);
    els.battleEnemySprite.classList.toggle("echo-trick-gif", isEchoTrick);
    els.battleEnemySprite.classList.toggle("yesterday-spirit-gif", isYesterdaySpirit);
    if (isTimeDust || isEchoTrick || isYesterdaySpirit) {
      const specialEnemyClass = isTimeDust ? "timedust-gif" : (isEchoTrick ? "echo-trick-gif" : "yesterday-spirit-gif");
      const fallbackSprite = isTimeDust
        ? TIME_DUST_FALLBACK_IMAGE_PATH
        : isEchoTrick
          ? ECHO_TRICK_FALLBACK_IMAGE_PATH
          : YESTERDAY_SPIRIT_FALLBACK_IMAGE_PATH;
      const warnLabel = isTimeDust ? "TimeDust" : (isEchoTrick ? "EchoTrick" : "YesterdaySpirit");
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

function updateBattleStats() {
  const playerPercent = (state.playerHp / 100) * 100;
  const enemyMaxHp = state.enemyMaxHp || 80;
  const enemyPercent = (state.enemyHp / enemyMaxHp) * 100;

  els.playerHpFill.style.width = `${playerPercent}%`;
  els.enemyHpFill.style.width = `${enemyPercent}%`;
  els.playerHpText.textContent = `พลังชีวิต ${state.playerHp} / 100`;
  els.enemyHpText.textContent = `พลังชีวิต ${state.enemyHp} / ${enemyMaxHp}`;
  els.grammariaText.textContent = state.grammaria;

  if (state.shield > 0) {
    els.shieldText.textContent = "สมาธิ";
  } else if (state.guardShield > 0) {
    els.shieldText.textContent = "พิทักษ์";
  } else {
    els.shieldText.textContent = "ไม่มี";
  }

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

  sample(charms, 3).forEach(charm => {
    const button = document.createElement("button");
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

  els.continueBattleButton.textContent = "เตรียมพร้อม";
  els.continueBattleButton.onclick = () => {
    els.continueBattleButton.classList.add("hidden");
    els.battleMessage.textContent = "จับจังหวะเส้นสีขาวให้เข้าโซนเป้าหมาย ส้ม/เหลือง/เขียว...";
    setTimeout(beginNextParryHit, 420);
  };
  els.continueBattleButton.classList.remove("hidden");
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

  state.parry = {
    active: true,
    inputLocked: false,
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
  els.parryButton.disabled = false;
  showOnlyBattlePanel(els.parryPanel);
  startParryGauge();
  state.parry.resolveTimeout = setTimeout(() => {
    resolveCountdownParry("MISS");
  }, Math.max(2600, 3800 - (hitNumber * 250)));
}

function startParryGauge() {
  const step = timestamp => {
    if (!state.parry || !state.parry.active) {
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

  if (count > 1) {
    state.parry.tickTimeout = setTimeout(() => {
      showParryCount(count - 1);
      scheduleParryCount(count - 1);
    }, state.parry.stepDuration);
    return;
  }

  state.parry.resolveTimeout = setTimeout(() => {
    resolveCountdownParry("MISS");
  }, state.parry.stepDuration + 650);
}

function stopParry(event = null) {
  if (event) {
    event.preventDefault();
  }

  if (!state.parry || !state.parry.active || state.parry.inputLocked) {
    return;
  }

  state.parry.inputLocked = true;
  const frozenProgress = state.parry.gaugeProgress;
  els.parryGaugeMarker.style.left = `calc(${frozenProgress}% - 5px)`;
  const frozenResult = parryGaugeResult(frozenProgress, HIT_TOLERANCE);
  els.parryButton.disabled = true;

  if (state.actBattle && state.actBattle.awaitingParry) {
    freezeParryFeedback(frozenResult, () => stopActParry(frozenResult));
    return;
  }

  const result = state.parry.targetTime
    ? countdownParryResult(performance.now(), frozenResult)
    : frozenResult;
  freezeParryFeedback(result, () => resolveCountdownParry(result));
}

function freezeParryFeedback(result, onDone) {
  if (!state.parry) {
    onDone();
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

function resolveCountdownParry(result) {
  if (!state.parry || !state.parry.active) {
    return;
  }

  const hitNumber = state.parry.hitNumber;
  state.parry.active = false;
  els.parryButton.disabled = true;
  stopParryCountdown();
  resolveEnemyHit(result, hitNumber);
}

function resolveEnemyHit(parryResult, hitNumber) {
  const attack = state.parryAttack;
  if (!attack) {
    return;
  }

  const hit = calculateParryHit(parryResult, attack.pattern.baseDamage);
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

function calculateParryHit(parryResult, baseDamage) {
  if (parryResult === "PERFECT") {
    return { damage: 0, counterDamage: 5 };
  }

  if (parryResult === "GOOD") {
    return { damage: Math.round(baseDamage * 0.4), counterDamage: 0 };
  }

  if (parryResult === "WEAK") {
    return { damage: Math.round(baseDamage * 0.7), counterDamage: 0 };
  }

  if (parryResult === "MISS" && useBattleEffect("secondChance")) {
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

  if (state.playerHp <= 0) {
    state.playerHp = 35;
    updateBattleStats();
    els.battleMessage.textContent += "\nอาจารย์เวเรียนประคองบทเรียนไว้ ผู้พเนจรลุกขึ้นพร้อมพลังชีวิต 35";
  }

  els.continueBattleButton.textContent = "ตาผู้เล่น";
  els.continueBattleButton.onclick = () => {
    els.battleMessage.textContent = "เลือกการกระทำของเจ้า";
    setActionButtonsEnabled(true);
    setBattleTurnOwner("player");
    showOnlyBattlePanel(els.actionMenu);
  };
  els.continueBattleButton.classList.remove("hidden");
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

function completeActVictoryScene() {
  clearEnemyTurnTimer();
  stopTimer("charge");
  stopParryCountdown();
  const progress = ensureActProgress();
  const rewards = progress ? progress.rewards.join(", ") : "Time Spark, Tense Spark, Ed Fragment, Irregular Fragment, Past Fragment";

  els.victoryTitle.textContent = "ได้รับ Past Fragment";
  els.victoryEnemy.textContent = "The Memory Breaker";
  els.victoryStory.textContent = PAST_FRAGMENT_ACT.endingLines.join(" ");
  els.victoryGrammaria.textContent = playerData ? playerData.grammaria || 0 : state.grammaria;
  els.victoryExtra.textContent = rewards;
  els.victoryBadge.textContent = PAST_FRAGMENT_ACT.badge;
  els.victoryFragmentText.innerHTML = `สรุปบทเรียนโดยมาสเตอร์เวรีออน<br>${PAST_FRAGMENT_ACT.summary.map(item => `• ${item}`).join("<br>")}`;

  if (playerData) {
    playerData.progress.currentScene = "pastFragmentVictory";
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

function handleLessonBack() {
  if (isGameModalOpen()) {
    closeGameModal();
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
  { title: "Regular Verbs: -ed", stageId: "regular-rule-1" },
  { title: "Regular Verbs: e + -d", stageId: "regular-rule-2" },
  { title: "Regular Verbs: y / CVC", stageId: "regular-rule-3" },
  { title: "Irregular Verbs", stageId: "irregular-lesson" },
  { title: "Final Review", stageId: "final-boss" }
];

const LESSON_SELECT_TEST_MODE = true;

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
      closeGameModal();
      saveProgress({
        currentLessonId: stage.id,
        currentStageId: stage.id,
        currentScreen: "lesson",
        lastSafeScreen: "lesson"
      });
      showStageLesson(stageIndex);
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
    const specialEnemyClass = isTimeDust
      ? "timedust-gif"
      : isEchoTrick
        ? "echo-trick-gif"
        : isYesterdaySpirit
          ? "yesterday-spirit-gif"
          : "";
    card.innerHTML = `
      <img class="${specialEnemyClass}" src="${enemySpriteMap[enemy.name] || assetPath("memory-shade.png")}" alt="${enemy.name}">
      <div>
        <h4>${enemy.thaiName}</h4>
        <p>${enemy.description}</p>
        <p>${enemy.lesson}</p>
      </div>
    `;
    if (isTimeDust || isEchoTrick || isYesterdaySpirit) {
      const specialEnemyImage = card.querySelector("img");
      const fallbackSprite = isTimeDust
        ? TIME_DUST_FALLBACK_IMAGE_PATH
        : isEchoTrick
          ? ECHO_TRICK_FALLBACK_IMAGE_PATH
          : YESTERDAY_SPIRIT_FALLBACK_IMAGE_PATH;
      const warnLabel = isTimeDust ? "TimeDust" : (isEchoTrick ? "EchoTrick" : "YesterdaySpirit");
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

  const stageIndex = getPlayableStages().findIndex(stage => stage.id === enemy.stageId);
  if (stageIndex < 0) {
    return;
  }

  closeGameModal();
  state.currentLessonStage = getPlayableStages()[stageIndex];
  runSceneTransition(`${enemy.name} ปรากฏตัว!`, () => startActBattle(stageIndex));
}

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
els.lessonBackButton.addEventListener("click", handleLessonBack);
els.lessonSelectButton.addEventListener("click", openLessonSelectModal);
els.battleExitButton.addEventListener("click", confirmExitBattle);
els.lessonDictionaryButton.addEventListener("click", () => {
  els.activityFeedback.textContent = "พจนานุกรมแกรมมาเรียจะเปิดใช้ใน Prototype ถัดไป";
  els.nounActivityVisual.classList.remove("hidden");
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
els.skipBattleButton.addEventListener("click", openSkipBattleModal);
els.skipLessonButton.addEventListener("click", openSkipLessonModal);
els.attackButton.addEventListener("click", () => {
  if (state.actBattle) {
    startActAttackAction();
    return;
  }
  startAttack();
});
els.itemButton.addEventListener("click", () => {
  if (state.actBattle) {
    useActItem();
    return;
  }
  useItem();
});
els.focusButton.addEventListener("click", () => {
  if (state.actBattle) {
    startActFocusAction();
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
els.returnTitleButton.addEventListener("click", () => showScene("login"));
els.bossIntentReadyButton.addEventListener("click", runNextBossTurnStep);
els.muteButton.addEventListener("click", toggleMute);

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

bindGameAudioUnlockEvents();
initializeAuthUi().catch(error => {
  console.warn("[Auth] Failed to initialize Firebase auth state", error);
  updateAuthUi();
  setAuthStatus(AUTH_COPY.remoteAuthUnavailable);
});
setupAnimatedGrammarHallBackground();
setupMainCharacterGifs();
setupTeacherCharacterGifs();
bindAvatarPreviewInputs();
