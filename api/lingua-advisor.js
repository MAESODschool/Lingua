"use strict";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const MAX_BODY_BYTES = 16 * 1024;
const MAX_MESSAGE_LENGTH = 500;
const REQUEST_TIMEOUT_MS = 25000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 15;

const ALLOWED_MODES = new Set([
  "hint",
  "explain",
  "summary",
  "practice",
  "game-help",
  "assessment",
  "story",
  "free-question"
]);

const ALLOWED_SCOPE_TYPES = new Set([
  "lesson",
  "game_help",
  "assessment",
  "story",
  "other_english"
]);

const rateLimitBuckets = new Map();

const ADVISOR_INSTRUCTIONS = `คุณคือ “มาสเตอร์เวอริออน” ที่ปรึกษาในเกมการศึกษา Lingua

หน้าที่:
- ช่วยนักเรียนไทยเรียนภาษาอังกฤษ อธิบายไวยากรณ์ ให้คำใบ้ ทบทวนบทเรียน และอธิบายวิธีเล่น
- ใช้ภาษาไทยเป็นหลัก และยกตัวอย่างภาษาอังกฤษเมื่อช่วยให้เข้าใจง่ายขึ้น
- ตอบสั้น ชัดเจน อบอุ่น มีบรรยากาศแฟนตาซีเล็กน้อย และเหมาะกับนักเรียน ม.1-ม.3

กฎความปลอดภัย:
- ตอบเฉพาะขอบเขตที่เลือกและข้อมูลใน payload เท่านั้น
- ห้ามอ้างว่าได้ปลดล็อกบทเรียน ให้รางวัล เปลี่ยนคะแนน บันทึกความคืบหน้า หรือแก้สถานะเกม
- ห้ามขอข้อมูลส่วนตัวและห้ามตอบคำถามส่วนตัวหรืออ่อนไหวที่ไม่เกี่ยวกับการเรียน
- ถ้า mode เป็น hint และ hasAnswered เป็น false ให้ใบ้แนวคิดเท่านั้น ห้ามบอกคำตอบสุดท้าย
- ถ้า mode เป็น explain และ hasAnswered เป็น true จึงอธิบายคำตอบที่ถูกต้องได้
- ถ้าเป็น free-question ระหว่างการต่อสู้ที่ยังไม่ตอบ ห้ามแก้โจทย์ปัจจุบันหรือบอกคำตอบตรง ๆ
- หากข้อมูลไม่พอ ให้บอกว่าสามารถอธิบายได้เฉพาะหัวข้อบทเรียนนี้
- ห้ามเขียนบทความยาว`;

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(payload));
}

function getHeader(request, name) {
  const value = request.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : String(value || "");
}

function getAllowedOrigins() {
  return String(process.env.LINGUA_ALLOWED_ORIGINS || "")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);
}

function applyCors(request, response) {
  const origin = getHeader(request, "origin");
  const allowedOrigins = getAllowedOrigins();
  if (!origin) {
    return true;
  }
  if (allowedOrigins.length && !allowedOrigins.includes(origin)) {
    return false;
  }
  if (allowedOrigins.includes(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
    response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Lingua-Advisor-Secret");
  }
  return true;
}

function getClientIdentifier(request) {
  const forwardedFor = getHeader(request, "x-forwarded-for").split(",")[0].trim();
  return forwardedFor || request.socket?.remoteAddress || "unknown";
}

function isRateLimited(request, now = Date.now()) {
  const key = getClientIdentifier(request);
  const current = rateLimitBuckets.get(key);
  if (!current || now - current.startedAt >= RATE_LIMIT_WINDOW_MS) {
    rateLimitBuckets.set(key, { startedAt: now, count: 1 });
    return false;
  }
  current.count += 1;
  return current.count > RATE_LIMIT_MAX_REQUESTS;
}

function cleanString(value, maxLength = 200) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function parseRequestBody(request) {
  if (request.body && typeof request.body === "object" && !Buffer.isBuffer(request.body)) {
    const serialized = JSON.stringify(request.body);
    if (Buffer.byteLength(serialized, "utf8") > MAX_BODY_BYTES) {
      throw new Error("PAYLOAD_TOO_LARGE");
    }
    return request.body;
  }
  const rawBody = Buffer.isBuffer(request.body)
    ? request.body.toString("utf8")
    : String(request.body || "");
  if (!rawBody || Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
    throw new Error(rawBody ? "PAYLOAD_TOO_LARGE" : "INVALID_JSON");
  }
  try {
    return JSON.parse(rawBody);
  } catch (_error) {
    throw new Error("INVALID_JSON");
  }
}

function sanitizeAdvisorPayload(body) {
  const mode = cleanString(body?.mode, 40);
  if (!ALLOWED_MODES.has(mode)) {
    const error = new Error("UNSUPPORTED_MODE");
    error.publicMessage = "โหมดคำถามนี้ยังไม่รองรับ";
    throw error;
  }

  const studentMessage = cleanString(body?.studentMessage, MAX_MESSAGE_LENGTH + 1);
  if (!studentMessage || studentMessage.length > MAX_MESSAGE_LENGTH) {
    const error = new Error("INVALID_MESSAGE");
    error.publicMessage = "กรุณาส่งคำถามที่มีความยาวไม่เกิน 500 ตัวอักษร";
    throw error;
  }

  const scopeType = cleanString(body?.scope?.type, 40);
  if (!ALLOWED_SCOPE_TYPES.has(scopeType)) {
    const error = new Error("INVALID_SCOPE");
    error.publicMessage = "กรุณาเลือกขอบเขตคำถามที่รองรับ";
    throw error;
  }

  const hasAnswered = body?.context?.hasAnswered === true;
  const safeContext = {
    scene: cleanString(body?.context?.scene, 40),
    stageId: cleanString(body?.context?.stageId, 100),
    stageTitle: cleanString(body?.context?.stageTitle, 160),
    enemyName: cleanString(body?.context?.enemyName, 120),
    questionPrompt: cleanString(body?.context?.questionPrompt, 500),
    questionType: cleanString(body?.context?.questionType, 50),
    hasAnswered,
    selectedAnswer: hasAnswered ? cleanString(body?.context?.selectedAnswer, 300) : "",
    isAnswerCorrect: hasAnswered && typeof body?.context?.isAnswerCorrect === "boolean"
      ? body.context.isAnswerCorrect
      : null,
    playerGrade: cleanString(body?.context?.playerGrade, 30) || "ม.1"
  };

  if (hasAnswered && body?.context?.correctAnswer !== undefined) {
    safeContext.correctAnswer = cleanString(body.context.correctAnswer, 300);
  }

  return {
    mode,
    studentMessage,
    scope: {
      type: scopeType,
      lessonId: cleanString(body?.scope?.lessonId, 100),
      lessonTitle: cleanString(body?.scope?.lessonTitle, 160),
      topic: cleanString(body?.scope?.topic, 160)
    },
    context: safeContext
  };
}

function extractResponseText(data) {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }
  const textParts = [];
  for (const item of Array.isArray(data?.output) ? data.output : []) {
    for (const content of Array.isArray(item?.content) ? item.content : []) {
      if (content?.type === "output_text" && typeof content.text === "string") {
        textParts.push(content.text.trim());
      }
    }
  }
  return textParts.filter(Boolean).join("\n").trim();
}

async function callOpenAI(safePayload) {
  const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) {
    const error = new Error("OPENAI_API_KEY_MISSING");
    error.statusCode = 503;
    throw error;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const openAIResponse = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: String(process.env.OPENAI_MODEL || "gpt-5").trim(),
        instructions: ADVISOR_INSTRUCTIONS,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: JSON.stringify(safePayload)
              }
            ]
          }
        ],
        max_output_tokens: 500,
        store: false,
        text: { verbosity: "low" }
      }),
      signal: controller.signal
    });
    const responseData = await openAIResponse.json().catch(() => null);
    if (!openAIResponse.ok) {
      const error = new Error("OPENAI_REQUEST_FAILED");
      error.statusCode = openAIResponse.status >= 500 ? 502 : 500;
      throw error;
    }
    const answer = extractResponseText(responseData);
    if (!answer) {
      const error = new Error("OPENAI_EMPTY_RESPONSE");
      error.statusCode = 502;
      throw error;
    }
    return answer.slice(0, 3000);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function linguaAdvisorHandler(request, response) {
  if (!applyCors(request, response)) {
    sendJson(response, 403, { ok: false, error: "ไม่อนุญาตให้เรียกที่ปรึกษาจากเว็บไซต์นี้" });
    return;
  }
  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST, OPTIONS");
    sendJson(response, 405, { ok: false, error: "รองรับเฉพาะคำขอแบบ POST" });
    return;
  }
  if (!getHeader(request, "content-type").toLowerCase().includes("application/json")) {
    sendJson(response, 415, { ok: false, error: "กรุณาส่งข้อมูลแบบ JSON" });
    return;
  }

  const sharedSecret = String(process.env.LINGUA_ADVISOR_SHARED_SECRET || "").trim();
  if (sharedSecret && getHeader(request, "x-lingua-advisor-secret") !== sharedSecret) {
    sendJson(response, 401, { ok: false, error: "ไม่สามารถยืนยันสิทธิ์การใช้งานที่ปรึกษา" });
    return;
  }
  if (isRateLimited(request)) {
    sendJson(response, 429, { ok: false, error: "ส่งคำถามถี่เกินไป กรุณารอสักครู่" });
    return;
  }

  let safePayload;
  try {
    safePayload = sanitizeAdvisorPayload(parseRequestBody(request));
  } catch (error) {
    const statusCode = error.message === "PAYLOAD_TOO_LARGE" ? 413 : 400;
    sendJson(response, statusCode, {
      ok: false,
      error: error.publicMessage || "ข้อมูลคำถามไม่ถูกต้อง"
    });
    return;
  }

  try {
    const answer = await callOpenAI(safePayload);
    sendJson(response, 200, {
      ok: true,
      answer,
      mode: safePayload.mode,
      scopeType: safePayload.scope.type
    });
  } catch (error) {
    sendJson(response, Number(error.statusCode) || 502, {
      ok: false,
      error: "ตอนนี้ที่ปรึกษายังตอบไม่ได้ กรุณาลองใหม่อีกครั้ง"
    });
  }
}

module.exports = linguaAdvisorHandler;
module.exports._internals = {
  ALLOWED_MODES,
  ALLOWED_SCOPE_TYPES,
  extractResponseText,
  sanitizeAdvisorPayload
};
