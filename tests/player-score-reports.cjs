const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
function declaration(name) {
  const functionStart = source.indexOf(`function ${name}(`);
  const start = source.slice(functionStart - 6, functionStart) === 'async ' ? functionStart - 6 : functionStart;
  assert.ok(start >= 0, `Missing ${name}`);
  const end = source.indexOf('\n}', start);
  assert.ok(end >= 0, `Missing end of ${name}`);
  return source.slice(start, end + 2);
}
const sandbox = vm.createContext({});
vm.runInContext('const VS_BOSS_HISTORY_LIMIT = 50;', sandbox);
for (const name of [
  'getVsBossAttemptIso', 'getVsBossAttemptId',
  'isValidVsBossReportAttempt', 'deriveStudentVsBossReport', 'summarizeVsBossClassRows', 'buildVsBossClassReport',
  'formatVsBossReportPercent', 'formatVsBossReportPoints', 'formatVsBossReportDevelopment'
]) vm.runInContext(declaration(name), sandbox);
const run = code => vm.runInContext(code, sandbox);
const bossId = 'the_memory_breaker';
function attempt(index, correct, total = 10, resultStatus = 'victory') {
  const completedAt = new Date(Date.UTC(2026, 8, index, 10)).toISOString();
  const startedAt = new Date(Date.UTC(2026, 8, index, 9)).toISOString();
  return {
    attemptId: `${bossId}_${completedAt.replace(/[:.]/g, '-')}`,
    bossId, attemptNumber: index, assessmentType: 'practice', startedAt, completedAt,
    resultStatus, correctAnswers: correct, wrongAnswers: total - correct,
    totalQuestions: total, knowledgeScorePercent: correct / total * 100,
    gameScore: 9999 - index
  };
}
function student(uid, number, room = '3') {
  const profile = { fullName: `นักเรียน ${uid}`, classLevel: 'ม.2', room, studentNo: number };
  return { uid, sourceId: uid, profileCompleted: true, isDeleted: false,
    reportProfileCompleted: true, reportIdentityValid: true, profile, reportProfile: profile };
}
const a1 = attempt(1, 2, 10, 'defeat');
const a2 = attempt(2, 8);
const a3 = attempt(3, 6);
const b1 = attempt(4, 0, 10, 'defeat');
const entries = [student('a', '10'), student('b', '2'), student('c', '9'), student('hidden', '1'), student('other', '4', '4')];
entries[3].isDeleted = true;
const records = new Map([
  ['a', { record: { bossId, attempts: 3, firstAttempt: a1, latestAttempt: a3, bestAttempt: a2, history: [a1, a2, a3] } }],
  ['b', { record: { bossId, attempts: 1, firstAttempt: b1, latestAttempt: b1, bestAttempt: b1, history: [b1] } }]
]);
sandbox.entries = entries;
sandbox.records = vm.runInContext('new Map()', sandbox);
for (const [uid, value] of records) sandbox.records.set(uid, value);
sandbox.bossId = bossId;
const report = run('buildVsBossClassReport(entries, records, bossId, "ม.2", "3")');
assert.equal(report.rosterCount, 3);
assert.equal(report.assessedCount, 2);
assert.deepEqual(Array.from(report.rows, row => row.student.uid), ['b', 'c', 'a']);
assert.equal(report.firstAverage, 10);
assert.equal(report.latestAverage, 30);
assert.equal(report.bestAverage, 40);
assert.equal(report.differencePoints, 20);
assert.equal(report.relativeChangePercent, 200);
assert.ok(Math.abs(report.coveragePercent - 200 / 3) < 0.000001);
assert.equal(report.rows[0].firstScore, 0);
assert.equal(report.rows[0].status, 'มีผล 1 ครั้ง');
assert.equal(report.rows[1].status, 'ยังไม่มีผลประเมิน');
assert.equal(report.rows[1].firstScore, null);
assert.equal(report.rows[2].deltaPoints, 40);
assert.equal(report.rows[2].bestScore, 80);
sandbox.zeroQuestions = { ...b1, totalQuestions: 0, correctAnswers: 0, wrongAnswers: 0, knowledgeScorePercent: 0 };
assert.equal(run('isValidVsBossReportAttempt(zeroQuestions, bossId)'), true);

sandbox.bad = { ...a1, gameScore: 100000 };
assert.equal(run('isValidVsBossReportAttempt(bad, bossId)'), true);
for (const bad of [
  { ...a1, bossId: 'other' }, { ...a1, resultStatus: 'abandoned' },
  { ...a1, knowledgeScorePercent: undefined }, { ...a1, knowledgeScorePercent: 99 },
  { ...a1, attemptId: 'legacy' }, { ...a1, totalQuestions: 0 },
  { ...a1, startedAt: null },
  { ...a1, assessmentType: 'story' }, { ...a1, correctAnswers: 11 }
]) {
  sandbox.bad = bad;
  assert.equal(run('isValidVsBossReportAttempt(bad, bossId)'), false);
}
sandbox.legacy = { bestScore: 300, bestAccuracy: 90, attempts: 7, hasLegacySummary: true };
assert.equal(run('deriveStudentVsBossReport(entries[0], legacy, bossId)').evidenceStatus, 'legacy');
sandbox.capped = { attempts: 51, history: [a3], latestAttempt: a3, bestAttempt: a3 };
assert.equal(run('deriveStudentVsBossReport(entries[0], capped, bossId)').evidenceStatus, 'invalid');
sandbox.complete = { attempts: 2, history: [a1, a2] };
assert.equal(run('deriveStudentVsBossReport(entries[0], complete, bossId)').firstScore, 20);
assert.equal(run('buildVsBossClassReport(entries, new Map(), bossId, "ม.2", "4")').assessedCount, 0);
const noData = run('buildVsBossClassReport(entries, new Map(), bossId, "ม.2", "3")');
assert.equal(noData.firstAverage, null);
assert.equal(noData.coveragePercent, 0);
const zeroOnly = new Map([['b', records.get('b')]]);
sandbox.zeroOnly = vm.runInContext('new Map()', sandbox);
for (const [uid, value] of zeroOnly) sandbox.zeroOnly.set(uid, value);
assert.equal(run('buildVsBossClassReport(entries, zeroOnly, bossId, "ม.2", "3")').relativeChangePercent, null);
sandbox.malformed = { attempts: 2, history: [a1, { ...a2, resultStatus: 'abandoned' }] };
assert.equal(run('deriveStudentVsBossReport(entries[0], malformed, bossId)').evidenceStatus, 'invalid');
sandbox.conflict = { attempts: 1, history: [a1], firstAttempt: { ...a1, correctAnswers: 3, wrongAnswers: 7, knowledgeScorePercent: 30 }, latestAttempt: a1, bestAttempt: a1 };
assert.equal(run('deriveStudentVsBossReport(entries[0], conflict, bossId)').evidenceStatus, 'invalid');
sandbox.wrongRecord = { bossId: 'other', attempts: 1, history: [a1] };
assert.equal(run('deriveStudentVsBossReport(entries[0], wrongRecord, bossId)').evidenceStatus, 'invalid');
sandbox.legacyWithReal = { attempts: 8, hasLegacySummary: true, history: [a1], firstAttempt: null, latestAttempt: a1, bestAttempt: a1 };
assert.equal(run('deriveStudentVsBossReport(entries[0], legacyWithReal, bossId)').firstScore, 20);
assert.equal(run('deriveStudentVsBossReport(entries[0], 12, bossId)').evidenceStatus, 'invalid');
const sampleStudents = [student('sa', '1'), student('sb', '2'), student('sc', '3'), student('sd', '4')];
const a = [attempt(11, 6), attempt(12, 9), attempt(13, 8)].map((item, index) => ({ ...item, attemptNumber: index + 1 }));
const b = [attempt(14, 7), attempt(15, 8), attempt(16, 7)].map((item, index) => ({ ...item, attemptNumber: index + 1 }));
const c = [attempt(17, 5), attempt(18, 8)].map((item, index) => ({ ...item, attemptNumber: index + 1 }));
sandbox.sampleStudents = sampleStudents;
sandbox.sampleRecords = vm.runInContext('new Map()', sandbox);
for (const [uid, history] of [['sa', a], ['sb', b], ['sc', c]]) {
  sandbox.sampleRecords.set(uid, { record: {
    attempts: history.length, history, firstAttempt: history[0],
    latestAttempt: history.at(-1), bestAttempt: history.reduce((best, item) =>
      item.knowledgeScorePercent > best.knowledgeScorePercent ? item : best)
  } });
}
const sample = run('buildVsBossClassReport(sampleStudents, sampleRecords, bossId, "ม.2", "3")');
sandbox.sample = sample;
assert.equal(sample.rosterCount, 4);
assert.equal(sample.assessedCount, 3);
assert.equal(sample.coveragePercent, 75);
assert.equal(sample.firstAverage, 60);
assert.ok(Math.abs(sample.latestAverage - 76.6666667) < 0.00001);
assert.ok(Math.abs(sample.bestAverage - 83.3333333) < 0.00001);
assert.ok(Math.abs(sample.differencePoints - 16.6666667) < 0.00001);
assert.ok(Math.abs(sample.relativeChangePercent - 27.7777778) < 0.00001);
assert.equal(run('formatVsBossReportDevelopment(sample)'), 'สูงขึ้น +16.7 จุด (+27.8%)');
sandbox.negative = { differencePoints: -6.5, relativeChangePercent: -9.3 };
assert.equal(run('formatVsBossReportDevelopment(negative)'), 'ต่ำลง -6.5 จุด (-9.3%)');
assert.equal(sample.rows[0].attemptCount, 3);
const singleRecords = vm.runInContext('new Map()', sandbox);
for (const [uid, item] of [['sa', a[0]], ['sb', b[0]], ['sc', c[0]]]) {
  singleRecords.set(uid, { record: { attempts: 1, history: [item], firstAttempt: item, latestAttempt: item, bestAttempt: item } });
}
sandbox.singleRecords = singleRecords;
const single = run('buildVsBossClassReport(sampleStudents, singleRecords, bossId, "ม.2", "3")');
assert.equal(single.firstAverage, single.latestAverage);
assert.equal(single.latestAverage, single.bestAverage);
assert.equal(single.differencePoints, 0);
for (const id of ['playerScoreReportsButton', 'playerScoreReportsPanel', 'vsBossReportBossSelect',
  'vsBossReportClassSelect', 'vsBossReportRoomSelect', 'vsBossReportLoadButton',
  'vsBossReportSummary', 'vsBossReportTableBody']) {
  assert.ok(index.includes(`id="${id}"`), `Missing report element ${id}`);
}
const loader = declaration('loadVsBossClassReport');
assert.ok(loader.includes('getDoc(getPlayerClientProgressDocRef(student.sourceId))'));
assert.ok(loader.includes('progress.vsBossAssessmentRecords?.[boss.id]'));
assert.ok(!/\b(setDoc|updateDoc|runTransaction|addDoc|deleteDoc)\s*\(/.test(loader));
const renderer = declaration('renderVsBossClassReport');
assert.ok(!renderer.includes('innerHTML'));
vm.runInContext('const PLAYER_CLIENT_PROGRESS_SCHEMA_VERSION = 1;', sandbox);
vm.runInContext(loader, sandbox);
sandbox.els = {
  vsBossReportBossSelect: { value: bossId },
  vsBossReportClassSelect: { value: 'ม.2' },
  vsBossReportRoomSelect: { value: '3' },
  vsBossReportLoadButton: { disabled: false }
};
sandbox.teacherDashboardStudents = entries;
sandbox.teacherDashboardAccessGranted = true;
sandbox.teacherDashboardLoadError = '';
sandbox.vsBossReportLoadVersion = 0;
sandbox.clearVsBossReportContent = () => { sandbox.vsBossReportLoadVersion += 1; };
sandbox.setVsBossReportStatus = () => {};
sandbox.isCurrentUserTeacherClaimed = async () => true;
sandbox.getVsBossConfig = id => id === bossId ? { id } : null;
sandbox.isRewindSlimeDemoReportSelection = () => false;
sandbox.getEligibleVsBossReportStudents = () => entries.filter(item => !item.isDeleted && item.reportIdentityValid);
sandbox.getPlayerClientProgressDocRef = uid => uid;
sandbox.isFirebasePermissionDeniedError = () => false;
const snapshotFor = uid => records.has(uid)
  ? { exists: () => true, data: () => ({ uid, authUid: uid, schemaVersion: 1,
      clientReported: true, progress: { vsBossAssessmentRecords: { [bossId]: records.get(uid).record } } }) }
  : { exists: () => false };
let drawn = null;
sandbox.renderVsBossClassReport = report => { drawn = report; };
(async () => {
  const reads = [];
  sandbox.getDoc = async uid => { reads.push(uid); return snapshotFor(uid); };
  await run('loadVsBossClassReport()');
  assert.deepEqual(reads.sort(), ['a', 'b', 'c']);
  assert.equal(drawn.assessedCount, 2);
  assert.equal(sandbox.els.vsBossReportLoadButton.disabled, false);

  drawn = null;
  const resolvers = [];
  let signalRead;
  const readStarted = new Promise(resolve => { signalRead = resolve; });
  sandbox.getDoc = () => new Promise(resolve => { resolvers.push(resolve); signalRead(); });
  const staleLoad = run('loadVsBossClassReport()');
  await readStarted;
  sandbox.vsBossReportLoadVersion += 1;
  for (const [index, resolve] of resolvers.entries()) resolve(snapshotFor(['a', 'b', 'c'][index]));
  await staleLoad;
  assert.equal(drawn, null, 'An obsolete room request rendered stale data');
  console.log('Player Score Reports analytics and read-only loader checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
