const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const rules = fs.readFileSync(path.join(root, "firestore.rules"), "utf8");
const failures = [];
let checkCount = 0;
const remoteProviderStart = script.indexOf("const remoteAuthProvider = {");
const remoteLoginStart = script.indexOf("async login({ username, pin })", remoteProviderStart);
const remoteLoginEnd = script.indexOf("async logout()", remoteLoginStart);
const remoteLoginSource = script.slice(remoteLoginStart, remoteLoginEnd);
const remoteLogoutStart = script.indexOf("async logout()", remoteLoginEnd);
const remoteLogoutEnd = script.indexOf("\n  getCurrentUser()", remoteLogoutStart);
const remoteLogoutSource = script.slice(remoteLogoutStart, remoteLogoutEnd);

function expect(condition, message) {
  checkCount += 1;
  if (!condition) failures.push(message);
}

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}`);
  const braceStart = source.indexOf("{", start);
  let depth = 0;
  for (let index = braceStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  return "";
}

[
  "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
  "ไม่พบบัญชีนี้ในระบบออนไลน์",
  "รหัสผ่านไม่ถูกต้อง",
  "มีการพยายามเข้าสู่ระบบหลายครั้ง กรุณารอสักครู่แล้วลองใหม่",
  "เชื่อมต่อเครือข่ายไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต",
  "บัญชีเข้าสู่ระบบแล้ว แต่ไม่มีสิทธิ์อ่าน/บันทึกข้อมูลผู้เล่น",
  "เข้าสู่ระบบสำเร็จ แต่ระบบไม่สามารถสร้างข้อมูลผู้เล่นได้ เนื่องจาก payload ไม่ตรงกับกฎความปลอดภัย",
  "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
].forEach(message => expect(script.includes(message), `missing login message: ${message}`));

expect(script.includes('createOnlineLoginStageError("firebase-auth", error)'), "Firebase Auth failures are not stage-tagged");
expect(script.includes('createOnlineLoginStageError("player-read", error)'), "player reads are not stage-tagged");
expect(script.includes('createOnlineLoginStageError("player-create", error)'), "player creates are not stage-tagged");
expect(script.includes('warnOptionalOnlineDataFailure("client progress read", error)'), "client progress read is not optional");
expect(script.includes('readCachedPlayerProgress(userId)'), "client progress has no local fallback");
expect(script.includes("setPersistence(firebaseAuth, browserLocalPersistence)"), "Firebase browser-local persistence is no longer enabled");
const waitForFirebaseAuthReadySource = extractFunction(script, "waitForFirebaseAuthReady");
expect(
  waitForFirebaseAuthReadySource.indexOf("await firebasePersistenceReady") < waitForFirebaseAuthReadySource.indexOf("await firebaseAuthReady"),
  "startup no longer waits for persistence before restored Firebase Auth state"
);
expect(remoteLoginSource.includes('loadProgress(sessionUser.uid, { sessionUser })'), "login does not load progress before committing the session");
expect(remoteLoginSource.indexOf('await progressService.loadProgress(sessionUser.uid, { sessionUser });') < remoteLoginSource.indexOf('playerStorage.set(AUTH_STORAGE_KEYS.currentUser, JSON.stringify(sessionUser));'), "login commits the session before required profile loading finishes");
expect(script.includes('void loadGameAssetOverrides().catch(error => {'), "asset override startup is not isolated from auth startup");

expect(rules.includes('allow get: if isOwner(playerId) || isTeacher();'), "owner cannot read their own /players document");
expect(rules.includes('allow list: if isTeacher();'), "students may list /players or teacher list access is missing");
expect(!rules.includes('allow read, write: if request.auth != null;'), "broad authenticated Firestore access was added");
[
  "grammaria",
  "progress",
  "completedStages",
  "rewardClaims",
  "vsBossAssessmentRecords"
].forEach(field => expect(rules.includes(`'${field}'`), `protected field missing from rules: ${field}`));

const authCopy = {
  remoteLoginFailed: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
  remoteUserNotFound: "ไม่พบบัญชีนี้ในระบบออนไลน์",
  remoteWrongPassword: "รหัสผ่านไม่ถูกต้อง",
  remoteTooManyRequests: "มีการพยายามเข้าสู่ระบบหลายครั้ง กรุณารอสักครู่แล้วลองใหม่",
  remoteNetworkFailed: "เชื่อมต่อเครือข่ายไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต",
  remoteAuthUnavailable: "เชื่อมต่อ Firebase ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ต",
  remotePlayerPermissionDenied: "บัญชีเข้าสู่ระบบแล้ว แต่ไม่มีสิทธิ์อ่าน/บันทึกข้อมูลผู้เล่น กรุณาตรวจสอบ Firestore rules",
  remotePlayerCreateBlocked: "เข้าสู่ระบบสำเร็จ แต่ระบบไม่สามารถสร้างข้อมูลผู้เล่นได้ เนื่องจาก payload ไม่ตรงกับกฎความปลอดภัย",
  remoteLoginDefault: "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
};
const mapperSandbox = { AUTH_COPY: authCopy };
vm.runInNewContext(
  `${extractFunction(script, "isFirebasePermissionDeniedError")}\n${extractFunction(script, "mapFirebaseAuthError")}\nthis.mapLoginError = mapFirebaseAuthError;`,
  mapperSandbox
);
[
  [{ code: "auth/invalid-credential" }, authCopy.remoteLoginFailed],
  [{ code: "auth/user-not-found" }, authCopy.remoteUserNotFound],
  [{ code: "auth/wrong-password" }, authCopy.remoteWrongPassword],
  [{ code: "auth/too-many-requests" }, authCopy.remoteTooManyRequests],
  [{ code: "auth/network-request-failed" }, authCopy.remoteNetworkFailed],
  [{ code: "permission-denied" }, authCopy.remotePlayerPermissionDenied],
  [{ code: "permission-denied", loginStage: "player-create" }, authCopy.remotePlayerCreateBlocked],
  [{ code: "auth/internal-error" }, authCopy.remoteLoginDefault]
].forEach(([error, expected]) => {
  expect(mapperSandbox.mapLoginError(error) === expected, `wrong mapped message for ${error.code}/${error.loginStage || "general"}`);
});

expect(remoteLogoutSource.includes("await signOut(firebaseAuth)"), "Firebase logout no longer signs out the persisted Auth session");
expect(remoteLogoutSource.includes("playerStorage.remove(AUTH_STORAGE_KEYS.currentUser)"), "Firebase logout no longer clears the local app session");

async function runStartupScenario({
  firebaseUser = null,
  cachedUser = null,
  profile = null,
  initialPlayerData = null,
  profileLoadError = null
} = {}) {
  const calls = [];
  let storedUser = cachedUser;
  const sandbox = {
    AUTH_COPY: {
      remoteSessionRestoreFailed: "restore-failed"
    },
    AUTH_STORAGE_KEYS: { currentUser: "current-user" },
    JSON,
    console: { warn: () => {} },
    state: { currentUser: null },
    playerData: initialPlayerData,
    els: {
      createStatus: { textContent: "" }
    },
    scenes: {
      login: {
        classList: { toggle: () => {} }
      }
    },
    playerStorage: {
      set: (_key, value) => {
        storedUser = JSON.parse(value);
      },
      remove: () => {
        storedUser = null;
      }
    },
    getAuthMode: () => "firebase",
    getAuthPanelNotice: () => "login-notice",
    setAuthRestoreUiState: mode => calls.push(`auth-ui:${mode}`),
    showAuthPanel: panel => calls.push(`auth-panel:${panel}`),
    setAuthStatus: message => calls.push(`status:${message}`),
    waitForFirebaseAuthReady: async () => firebaseUser,
    getCurrentUser: () => sandbox.state.currentUser || storedUser,
    loadRemoteSessionUser: async user => ({
      userId: user.uid,
      uid: user.uid,
      id: user.uid,
      username: "student",
      displayName: "Student",
      mode: "registered",
      isGuest: false
    }),
    loadPlayerProfile: async () => {
      if (profileLoadError) throw profileLoadError;
      return profile;
    },
    updateAuthUi: () => calls.push("update-auth-ui"),
    hasCompleteStudentProfile: studentProfile => Boolean(
      studentProfile?.fullName && studentProfile?.classLevel && studentProfile?.room && studentProfile?.studentNo
    ),
    getStudentProfileFromPlayer: data => (data || profile)?.studentProfile || null,
    showScene: scene => calls.push(`scene:${scene}`),
    showMainMenu: () => calls.push("main-menu"),
    restoreLastSceneForCurrentUser: async () => {
      calls.push("restore-last-scene");
      return true;
    }
  };
  const initializeAuthUiSource = extractFunction(script, "initializeAuthUi").replace(
    /^function initializeAuthUi/,
    "async function initializeAuthUi"
  );
  vm.runInNewContext(
    `${initializeAuthUiSource}\nthis.runInitializeAuthUi = initializeAuthUi;`,
    sandbox
  );
  await sandbox.runInitializeAuthUi();
  return { calls, sandbox, getStoredUser: () => storedUser };
}

async function runStartupRegressionTests() {
  const completeProfile = {
    studentProfile: {
      fullName: "Student One",
      classLevel: "ม.3",
      room: "1",
      studentNo: "1"
    }
  };
  const firebaseUser = { uid: "firebase-student-1" };

  const returning = await runStartupScenario({ firebaseUser, profile: completeProfile });
  expect(returning.calls.includes("main-menu"), `persisted Firebase user does not route to Main Menu (${returning.calls.join(", ")})`);
  expect(!returning.calls.includes("restore-last-scene"), "persisted Firebase user still restores Battle/Lesson/last scene on startup");

  const signedOut = await runStartupScenario();
  expect(signedOut.calls.includes("scene:login"), "missing Firebase session does not route to Login");
  expect(!signedOut.calls.includes("main-menu"), "signed-out user can auto-enter Main Menu");

  const incomplete = await runStartupScenario({
    firebaseUser,
    profile: { studentProfile: { fullName: "Student One", classLevel: "ม.3", room: "" } }
  });
  expect(incomplete.calls.includes("scene:createCharacter"), "incomplete Firebase profile does not route to Create Character");
  expect(!incomplete.calls.includes("main-menu"), "incomplete Firebase profile can enter Main Menu");

  const staleLocal = await runStartupScenario({
    initialPlayerData: { userId: "stale-student", grammaria: 999 },
    cachedUser: {
      userId: "stale-student",
      uid: "stale-student",
      displayName: "Stale Student",
      mode: "registered",
      isGuest: false
    }
  });
  expect(staleLocal.calls.includes("scene:login"), "stale local user is accepted without a Firebase session");
  expect(staleLocal.getStoredUser() === null, "stale local app session is not cleared after Firebase confirms sign-out");
  expect(staleLocal.sandbox.playerData === null, "stale player data survives Firebase-confirmed sign-out");

  const loadFailure = await runStartupScenario({
    firebaseUser,
    profileLoadError: new Error("network unavailable")
  });
  expect(loadFailure.calls.includes("auth-ui:error"), "profile load failure does not expose the recoverable retry state");
  expect(loadFailure.calls.includes("status:restore-failed"), "profile load failure does not show the safe restore message");
  expect(loadFailure.sandbox.state.currentUser?.uid === firebaseUser.uid, "profile load failure destroys the valid Firebase-backed app session");
}

runStartupRegressionTests().then(() => {
  if (failures.length) {
    console.error(JSON.stringify({ ok: false, failures }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({ ok: true, checks: checkCount }, null, 2));
}).catch(error => {
  console.error(error);
  process.exit(1);
});
