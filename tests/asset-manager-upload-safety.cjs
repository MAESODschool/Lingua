const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const firestoreRules = fs.readFileSync(path.join(root, "firestore.rules"), "utf8");
const storageRules = fs.readFileSync(path.join(root, "storage.rules"), "utf8");
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(root, "firebase.json"), "utf8"));
const failures = [];

function expect(condition, message) {
  if (!condition) failures.push(message);
}

function extractFunction(source, name) {
  const asyncStart = source.indexOf(`async function ${name}`);
  const start = asyncStart >= 0 ? asyncStart : source.indexOf(`function ${name}`);
  if (start < 0) return "";
  const parameterEnd = source.indexOf(")", start);
  const braceStart = source.indexOf("{", parameterEnd);
  let depth = 0;
  for (let index = braceStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  return "";
}

expect(script.includes("teacherClaim: 15000"), "teacher claim timeout is missing");
expect(script.includes("storageUpload: 30000"), "Storage upload timeout is not 30 seconds");
expect(script.includes("downloadUrl: 15000"), "download URL timeout is not 15 seconds");
expect(script.includes("firestoreSave: 15000"), "Firestore timeout is not 15 seconds");
expect(script.includes("totalSave: 60000"), "total save timeout is not 60 seconds");
expect(script.includes('"asset-manager/timeout"'), "Asset Manager timeout error code is missing");
expect(script.includes("การอัปโหลดใช้เวลานานเกินไป"), "Thai timeout message is missing");
expect(script.includes("ไม่มีสิทธิ์อัปโหลดไฟล์ไปยัง Firebase Storage"), "Thai Storage permission message is missing");
expect(script.includes("ไม่มีสิทธิ์บันทึกข้อมูล Asset ใน Firestore"), "Thai Firestore permission message is missing");
expect(script.includes("เชื่อมต่อ Firebase ไม่สำเร็จ"), "Thai network message is missing");
expect(script.includes("getIdTokenResult(forceRefresh)"), "Asset Manager token refresh support is missing");
expect(script.includes("isCurrentUserAssetManagerClaimed(true)"), "upload does not force-refresh the current token");
expect(script.includes("currentUser.getIdTokenResult(true)"), "Asset Manager open flow does not force-refresh the current token");
expect(script.includes("firebaseAuth.currentUser || await withTimeout("), "Asset Manager open flow does not wait for Firebase Auth");
expect(script.includes("async function requireAssetManagerOnlineAccess()"), "Asset Manager online access gate is missing");
expect(script.includes("Asset Manager ต้องใช้บัญชีออนไลน์ที่มีสิทธิ์ teacher/admin/assetManager"), "guest Asset Manager rejection is missing");
expect(script.includes("!options.claimVerified && !(await requireAssetManagerOnlineAccess())"), "Asset Manager panel does not enforce the online claim gate");
expect(script.includes("Storage bucket ไม่ถูกต้อง"), "Storage bucket diagnostic is missing");
expect(script.includes('code === "storage/canceled"'), "Storage canceled diagnostic is missing");
expect(script.includes('code === "storage/bucket-not-found"'), "missing Storage bucket diagnostic is absent");
expect(script.includes("getStorage(firebaseApp, firebaseStorageBucketUrl)"), "Storage is not initialized with the configured bucket");
expect(script.includes("ไฟล์มีขนาดใหญ่เกิน 5 MB"), "Thai file-size message is missing");
expect(script.includes("รองรับเฉพาะ PNG, JPG, WEBP หรือ GIF"), "Thai file-type message is missing");
expect(script.includes('key: "was_were_wisp"'), "Was-Were Wisp Asset Manager key is missing");
expect(script.includes("`game-assets/${item.category}/${item.key}/${timestamp}_${safeFileName}`"), "upload path is not scoped by category and asset key");
expect(script.includes("GAME_ASSET_OVERRIDE_COLLECTION, item.key"), "Firestore override does not use the asset key document");
expect(script.includes("applyGameAssetOverridesToUi();"), "saved override is not applied immediately");
expect(script.includes("renderAssetManagerGrid();"), "Asset Manager grid is not re-rendered after save");
expect(script.includes('saveButton.textContent = "บันทึกและใช้ภาพนี้"'), "save button text is not restored");
expect(script.includes("setButtonEnabled(els.gameModalClose, true)"), "modal close button is not restored");
expect(script.includes('classList.remove("is-saving")'), "saving state is not removed");
expect(script.includes("finally {\n    resetAssetManagerOperationUi(options);\n  }"), "operation UI is not reset in finally");
expect(/script\.js\?v=[a-z0-9-]+20260908/.test(index), "current script cache version is missing");
expect(firebaseConfig.storage?.rules === "storage.rules", "firebase.json does not register Storage rules");
expect(firebaseConfig.firestore?.rules === "firestore.rules", "firebase.json does not register Firestore rules");

expect(storageRules.includes("match /game-assets/{category}/{assetKey}/{fileName}"), "Storage rules do not match the upload path");
expect(storageRules.includes("request.auth.token.get('teacher', false) == true"), "Storage teacher claim is missing");
expect(storageRules.includes("request.auth.token.get('admin', false) == true"), "Storage admin claim is missing");
expect(storageRules.includes("request.auth.token.get('assetManager', false) == true"), "Storage assetManager claim is missing");
expect(storageRules.includes("request.resource.size <= 5 * 1024 * 1024"), "Storage size limit is missing");
expect(storageRules.includes("request.resource.contentType is string"), "Storage content type guard is missing");
expect(storageRules.includes("image/(png|jpeg|webp|gif)"), "Storage image type allowlist is missing");
expect(storageRules.includes("allow read, write: if false"), "Storage catch-all deny is missing");

expect(firestoreRules.includes("function isAssetManager()"), "Firestore Asset Manager claim helper is missing");
expect(firestoreRules.includes("match /gameAssetOverrides/{assetKey}"), "Firestore override path is missing");
expect(firestoreRules.includes("allow create: if isAssetManager()"), "Firestore override create is not admin-only");
expect(firestoreRules.includes("allow update: if isAssetManager()"), "Firestore override update is not admin-only");
expect(firestoreRules.includes("hasOnly(gameAssetOverrideKeys())"), "Firestore safe-field allowlist is missing");
expect(firestoreRules.includes("allow delete: if false"), "Firestore override delete deny is missing");

const sandbox = {
  GAME_ASSET_ALLOWED_TYPES: Object.freeze(["image/png", "image/jpeg", "image/webp", "image/gif"]),
  GAME_ASSET_MAX_FILE_SIZE: 5 * 1024 * 1024,
  setTimeout,
  clearTimeout
};
vm.runInNewContext(
  `${extractFunction(script, "createStudentManagementError")}\n` +
  `${extractFunction(script, "validateGameAssetFile")}\n` +
  `${extractFunction(script, "withTimeout")}\n` +
  "this.validateFile = validateGameAssetFile; this.timeout = withTimeout;",
  sandbox
);

expect(sandbox.validateFile({ name: "wisp.png", type: "image/png", size: 2048 }) === "", "valid PNG is rejected");
expect(sandbox.validateFile({ name: "wisp.exe", type: "application/octet-stream", size: 2048 }) === "รองรับเฉพาะ PNG, JPG, WEBP หรือ GIF", "wrong file type is not rejected clearly");
expect(sandbox.validateFile({ name: "wisp.png", type: "image/png", size: 5 * 1024 * 1024 + 1 }) === "ไฟล์มีขนาดใหญ่เกิน 5 MB", "oversized file is not rejected clearly");

(async () => {
  const immediate = await sandbox.timeout(Promise.resolve("ok"), 50, "test", "test-step");
  expect(immediate === "ok", "withTimeout changes a successful result");
  try {
    await sandbox.timeout(new Promise(() => {}), 10, "test", "storage-upload");
    expect(false, "withTimeout did not reject a stalled promise");
  } catch (error) {
    expect(error.code === "asset-manager/timeout", "timeout uses the wrong error code");
    expect(error.assetManagerStep === "storage-upload", "timeout loses its step name");
  }

  const makeClassList = initial => {
    const values = new Set(initial);
    return {
      add: value => values.add(value),
      remove: value => values.delete(value),
      contains: value => values.has(value),
      toggle: (value, active) => active ? values.add(value) : values.delete(value),
      has: value => values.has(value)
    };
  };
  const saveButton = { textContent: "บันทึกและใช้ภาพนี้", classList: makeClassList([]), dataset: {} };
  const cancelButton = { textContent: "ยกเลิก", classList: makeClassList([]), dataset: {} };
  const closeButton = { classList: makeClassList([]), dataset: {} };
  const modalClassList = makeClassList([]);
  const modalSandbox = {
    console: { info() {}, error() {} },
    setTimeout,
    clearTimeout,
    GAME_ASSET_TIMEOUT_MS: { totalSave: 50 },
    gameAssetOverrideState: { operationBusy: false },
    els: {
      gameModal: { classList: modalClassList, dataset: { modalLocked: "true" } },
      gameModalBody: { textContent: "" },
      gameModalContent: { querySelector: selector => selector === "#assetUploadModal" ? {} : null },
      gameModalActions: {
        querySelector: selector => selector === ".primary-button" ? saveButton : null,
        querySelectorAll: () => [cancelButton, saveButton]
      },
      gameModalClose: closeButton
    },
    setButtonEnabled(button, enabled) {
      button.disabled = !enabled;
      button.classList.toggle("disabled", !enabled);
      button.classList.toggle("is-disabled", !enabled);
    },
    getAssetManagerErrorMessage: () => "ทดสอบข้อผิดพลาด",
    setAssetManagerStatus() {},
    renderAssetManagerGrid() {},
    openGameModal() {},
    closeGameModal() {}
  };
  vm.runInNewContext(
    `${extractFunction(script, "createStudentManagementError")}\n` +
    `${extractFunction(script, "withTimeout")}\n` +
    `${extractFunction(script, "resetAssetManagerOperationUi")}\n` +
    `${extractFunction(script, "performAssetManagerOperation")}\n` +
    "this.performOperation = performAssetManagerOperation;",
    modalSandbox
  );
  let inlineError = "";
  await modalSandbox.performOperation(
    () => Promise.reject(new Error("simulated failure")),
    "unused success",
    {
      keepUploadModalOnError: true,
      idleMessage: "พร้อมลองใหม่",
      onError: message => { inlineError = message; }
    }
  );
  expect(modalSandbox.gameAssetOverrideState.operationBusy === false, "failure leaves operationBusy enabled");
  expect(modalSandbox.els.gameModal.dataset.modalLocked === "false", "failure leaves the modal locked");
  expect(saveButton.disabled === false, "failure leaves the save button disabled");
  expect(cancelButton.disabled === false, "failure leaves the cancel button disabled");
  expect(closeButton.disabled === false, "failure leaves the close button disabled");
  expect(saveButton.textContent === "บันทึกและใช้ภาพนี้", "failure does not restore save button text");
  expect(modalSandbox.els.gameModalBody.textContent === "พร้อมลองใหม่", "failure does not restore the idle message");
  expect(!modalClassList.has("is-saving"), "failure leaves the saving class active");
  expect(inlineError === "ทดสอบข้อผิดพลาด", "failure is not displayed inside the upload modal");

  let forceRefreshArgument = null;
  const claimSandbox = {
    getAuthMode: () => "firebase",
    firebaseAuth: {
      currentUser: {
        getIdTokenResult: async forceRefresh => {
          forceRefreshArgument = forceRefresh;
          return { claims: { teacher: true } };
        }
      }
    },
    waitForFirebaseAuthReady: async () => null,
    console: { error() {} }
  };
  vm.runInNewContext(
    `${extractFunction(script, "hasAssetManagerClaim")}\n` +
    `${extractFunction(script, "isCurrentUserAssetManagerClaimed")}\n` +
    "this.hasAssetClaim = isCurrentUserAssetManagerClaimed;",
    claimSandbox
  );
  expect(await claimSandbox.hasAssetClaim(true) === true, "teacher claim is not accepted for Asset Manager");
  expect(forceRefreshArgument === true, "teacher claim token is not force-refreshed before upload");

  const requestedUid = "WJtnnbrZibUUyYOS348hHDVVbf53";
  let openedTokenRefresh = null;
  const accessModals = [];
  const accessSandbox = {
    getAuthMode: () => "firebase",
    firebaseAuth: { currentUser: null },
    waitForFirebaseAuthReady: async () => ({
      uid: requestedUid,
      getIdTokenResult: async forceRefresh => {
        openedTokenRefresh = forceRefresh;
        return { claims: { teacher: true } };
      }
    }),
    GAME_ASSET_TIMEOUT_MS: { teacherClaim: 50 },
    setTimeout,
    clearTimeout,
    console: { error() {} },
    openGameModal: config => accessModals.push(config),
    closeGameModal() {},
    getAssetManagerErrorMessage: error => error.message
  };
  vm.runInNewContext(
    `${extractFunction(script, "createStudentManagementError")}\n` +
    `${extractFunction(script, "withTimeout")}\n` +
    `${extractFunction(script, "hasAssetManagerClaim")}\n` +
    `${extractFunction(script, "requireAssetManagerOnlineAccess")}\n` +
    "this.requireOnlineAccess = requireAssetManagerOnlineAccess;",
    accessSandbox
  );
  expect(await accessSandbox.requireOnlineAccess() === true, `teacher UID ${requestedUid} was rejected`);
  expect(openedTokenRefresh === true, `teacher UID ${requestedUid} token was not force-refreshed`);
  expect(accessModals.length === 0, `teacher UID ${requestedUid} received an unexpected access error`);

  if (failures.length) {
    console.error(JSON.stringify({ ok: false, failures }, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify({
    ok: true,
    checks: 71,
    uploadPath: "game-assets/{category}/{assetKey}/{fileName}",
    firestorePath: "gameAssetOverrides/{assetKey}"
  }, null, 2));
})().catch(error => {
  console.error(error);
  process.exit(1);
});
