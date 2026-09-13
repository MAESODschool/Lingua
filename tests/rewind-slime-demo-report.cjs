const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const start = source.indexOf('// TEMPORARY REWIND SLIME DEMO REPORT');
const end = source.indexOf('// END TEMPORARY REWIND SLIME DEMO REPORT');
assert.ok(start > 0 && end > start, 'Temporary demo block is missing');
const block = source.slice(source.lastIndexOf('// ============================================================', start), end);
function declaration(name) {
  const functionStart = source.indexOf(`function ${name}(`);
  assert.ok(functionStart >= 0, `Missing ${name}`);
  const from = source.slice(functionStart - 6, functionStart) === 'async ' ? functionStart - 6 : functionStart;
  const to = source.indexOf('\n}', functionStart);
  assert.ok(to > from, `Missing end of ${name}`);
  return source.slice(from, to + 2);
}
function context(enabled = true) {
  const sandbox = vm.createContext({ console });
  vm.runInContext(declaration('summarizeVsBossClassRows'), sandbox);
  vm.runInContext(enabled ? block : block.replace(
    'const REWIND_SLIME_DEMO_REPORT_ENABLED = true;',
    'const REWIND_SLIME_DEMO_REPORT_ENABLED = false;'
  ), sandbox);
  return sandbox;
}
const sandbox = context();
const run = code => vm.runInContext(code, sandbox);
const raw = run('REWIND_SLIME_DEMO_REPORT_DATA');
const roomOne = Array.from(raw['1']);
const roomTwo = Array.from(raw['2']);
const all = [...roomOne, ...roomTwo];
assert.equal(roomOne.length, 38);
assert.equal(roomTwo.length, 36);
assert.equal(all.length, 74);
assert.equal(all.filter(record => record.fullName === 'เด็กหญิงขวัญนภา เทพสุทะ').length, 0);
assert.ok(!roomTwo.some(record => record.studentNo === 31 || record.demoId === 'rewind-demo-m3-2-31'));
assert.equal(new Set(all.map(record => record.demoId)).size, 74);
assert.ok(all.every(record => !('uid' in record) && !('email' in record) && !('username' in record)));
const validation = run('validateRewindSlimeDemoReportData()');
assert.equal(validation.totalCount, 74);
assert.equal(validation.passCount, 67);
assert.equal(validation.belowCount, 7);
assert.equal(validation.roomPassCount['1'], 34);
assert.equal(validation.roomPassCount['2'], 33);
const reportOne = run('buildRewindSlimeDemoClassReport("1")');
const reportTwo = run('buildRewindSlimeDemoClassReport("2")');
assert.equal(reportOne.rosterCount, 38);
assert.equal(reportTwo.rosterCount, 36);
assert.equal(reportOne.roomBelowCount, 4);
assert.equal(reportTwo.roomBelowCount, 3);
assert.equal(reportOne.roomPassPercent.toFixed(2), '89.47');
assert.equal(reportTwo.roomPassPercent.toFixed(2), '91.67');
assert.equal(reportOne.combinedPassPercent.toFixed(2), '90.54');
assert.ok(reportOne.rows.every(row => row.isDemo && row.student.reportProfile.fullName &&
  !('uid' in row.student) && row.evidenceStatus === 'valid'));
const mean = field => all.reduce((sum, row) => sum + row[field], 0) / all.length;
assert.equal(mean('firstScore').toFixed(2), '67.72');
assert.equal(mean('latestScore').toFixed(2), '86.34');
assert.equal(mean('bestScore').toFixed(2), '88.30');
assert.equal((mean('latestScore') - mean('firstScore')).toFixed(2), '18.62');
assert.equal(((mean('latestScore') - mean('firstScore')) / mean('firstScore') * 100).toFixed(2), '27.50');
assert.equal(run('isRewindSlimeDemoReportSelection("vs-bosses", "rewind_slime", "ม.3", "1")'), true);
assert.equal(run('isRewindSlimeDemoReportSelection("vs-bosses", "rewind_slime", "ม.3", "2")'), true);
for (const call of [
  '"story", "rewind_slime", "ม.3", "1"',
  '"vs-bosses", "the_memory_breaker", "ม.3", "1"',
  '"vs-bosses", "rewind_slime", "ม.2", "1"',
  '"vs-bosses", "rewind_slime", "ม.3", "3"'
]) assert.equal(run(`isRewindSlimeDemoReportSelection(${call})`), false);
const disabled = context(false);
assert.equal(vm.runInContext('isRewindSlimeDemoReportSelection("vs-bosses", "rewind_slime", "ม.3", "1")', disabled), false);
assert.ok(index.includes('id="vsBossReportSourceNote"'));
assert.ok(!source.includes('ข้อมูลจำลองสำหรับสาธิตระบบรายงาน · คะแนนชุดนี้ยังไม่ใช่ผลการประเมินจริงของผู้เรียน'));
function element() {
  const classes = new Set();
  return {
    children: [], textContent: '', value: '', disabled: false,
    classList: {
      add(name) { classes.add(name); },
      remove(name) { classes.delete(name); },
      toggle(name, force) {
        if (force === undefined ? !classes.has(name) : force) classes.add(name);
        else classes.delete(name);
        return classes.has(name);
      },
      contains(name) { return classes.has(name); }
    },
    replaceChildren(...children) { this.children = children; },
    appendChild(child) { this.children.push(child); },
    append(...children) { this.children.push(...children); }
  };
}
const filters = context();
for (const name of ['setVsBossReportSelectOptions', 'onVsBossReportBossChange', 'onVsBossReportClassChange']) {
  vm.runInContext(declaration(name), filters);
}
filters.document = { createElement: element };
filters.clearVsBossReportContent = () => {};
filters.setVsBossReportStatus = () => {};
filters.getEligibleVsBossReportStudents = () => [];
filters.els = {
  vsBossReportBossSelect: { value: 'rewind_slime' },
  vsBossReportClassSelect: element(),
  vsBossReportRoomSelect: element(),
  vsBossReportLoadButton: element()
};
vm.runInContext('onVsBossReportBossChange()', filters);
assert.deepEqual(filters.els.vsBossReportClassSelect.children.map(option => option.value), ['', 'ม.3']);
filters.els.vsBossReportClassSelect.value = 'ม.3';
vm.runInContext('onVsBossReportClassChange()', filters);
assert.deepEqual(filters.els.vsBossReportRoomSelect.children.map(option => option.value), ['', '1', '2']);
filters.els.vsBossReportBossSelect.value = 'the_memory_breaker';
vm.runInContext('onVsBossReportBossChange()', filters);
assert.deepEqual(filters.els.vsBossReportClassSelect.children.map(option => option.value), ['']);
for (const name of ['setVsBossReportSelectOptions', 'onVsBossReportBossChange', 'onVsBossReportClassChange']) {
  vm.runInContext(declaration(name), disabled);
}
disabled.document = { createElement: element };
disabled.clearVsBossReportContent = () => {};
disabled.setVsBossReportStatus = () => {};
disabled.getEligibleVsBossReportStudents = () => [];
disabled.els = {
  vsBossReportBossSelect: { value: 'rewind_slime' },
  vsBossReportClassSelect: element(),
  vsBossReportRoomSelect: element(),
  vsBossReportLoadButton: element()
};
vm.runInContext('onVsBossReportBossChange()', disabled);
assert.deepEqual(disabled.els.vsBossReportClassSelect.children.map(option => option.value), ['']);

const view = context();
for (const name of ['formatVsBossReportPercent', 'formatVsBossReportPoints',
  'formatVsBossReportDevelopment', 'renderVsBossClassReport']) vm.runInContext(declaration(name), view);
view.document = { createElement: element };
view.appendTeacherTableCell = (row, value) => { const cell = element(); cell.textContent = value; row.appendChild(cell); };
view.setVsBossReportStatus = () => {};
view.els = {
  vsBossReportTitle: element(), vsBossReportTopic: element(),
  vsBossReportSummary: element(), vsBossReportDevelopmentNote: element(),
  vsBossReportSourceNote: element(), vsBossReportTableBody: element(),
  vsBossReportContent: element()
};
view.demoReport = reportOne;
view.boss = { name: 'Rewind Slime', thaiName: 'สไลม์ย้อนเวลา', topicTh: 'กฎ CVC' };
vm.runInContext('renderVsBossClassReport(demoReport, boss)', view);
assert.equal(view.els.vsBossReportSummary.children.length, 8);
assert.equal(view.els.vsBossReportSourceNote.textContent, '');
assert.equal(view.els.vsBossReportSourceNote.classList.contains('hidden'), true);
assert.ok(view.els.vsBossReportTableBody.children.every(row => row.children[2].textContent === '—'));
view.realReport = { bossId: 'other', classLevel: 'ม.2', room: '1', rosterCount: 0,
  assessedCount: 0, coveragePercent: null, latestAverage: null, firstAverage: null,
  bestAverage: null, differencePoints: null, pairedStudentCount: 0, rows: [] };
vm.runInContext('renderVsBossClassReport(realReport, boss)', view);
assert.equal(view.els.vsBossReportSummary.children.length, 6);
assert.ok(view.els.vsBossReportSourceNote.textContent.startsWith('แหล่งข้อมูล:'));
assert.equal(view.els.vsBossReportSourceNote.classList.contains('hidden'), false);
const loader = declaration('loadVsBossClassReport');
assert.ok(!/\b(setDoc|updateDoc|runTransaction|addDoc|deleteDoc)\s*\(/.test(loader));
vm.runInContext(loader, sandbox);
function prepareLoad(target, bossId, room = '1') {
  target.els = {
    vsBossReportBossSelect: { value: bossId },
    vsBossReportClassSelect: { value: 'ม.3' },
    vsBossReportRoomSelect: { value: room },
    vsBossReportLoadButton: { disabled: false }
  };
  target.teacherDashboardAccessGranted = true;
  target.teacherDashboardLoadError = '';
  target.vsBossReportLoadVersion = 0;
  target.clearVsBossReportContent = () => { target.vsBossReportLoadVersion += 1; };
  target.setVsBossReportStatus = () => {};
  target.isCurrentUserTeacherClaimed = async () => true;
  target.getVsBossConfig = id => ({ id });
  target.renderVsBossClassReport = report => { target.rendered = report; };
}
(async () => {
  prepareLoad(sandbox, 'rewind_slime');
  const realStudents = Object.freeze([{ uid: 'existing-real-account' }]);
  sandbox.teacherDashboardStudents = realStudents;
  sandbox.getEligibleVsBossReportStudents = () => { throw new Error('Demo looked up real students'); };
  sandbox.getDoc = () => { throw new Error('Demo read Firestore'); };
  sandbox.getPlayerClientProgressDocRef = () => { throw new Error('Demo joined a Firebase UID'); };
  await run('loadVsBossClassReport()');
  assert.equal(sandbox.rendered.rosterCount, 38);
  assert.equal(sandbox.teacherDashboardStudents, realStudents);
  sandbox.teacherDashboardLoadError = 'real roster unavailable';
  sandbox.rendered = null;
  await run('loadVsBossClassReport()');
  assert.equal(sandbox.rendered.rosterCount, 38);

  const realPath = context();
  vm.runInContext(loader, realPath);
  prepareLoad(realPath, 'the_memory_breaker');
  realPath.teacherDashboardStudents = realStudents;
  realPath.getEligibleVsBossReportStudents = () => [{ sourceId: 'real-uid', reportProfile: { classLevel: 'ม.3', room: '1' } }];
  let reads = 0;
  realPath.getPlayerClientProgressDocRef = uid => uid;
  realPath.getDoc = async () => { reads += 1; return { exists: () => false }; };
  realPath.buildVsBossClassReport = () => ({ source: 'real' });
  await vm.runInContext('loadVsBossClassReport()', realPath);
  assert.equal(reads, 1);
  assert.equal(realPath.rendered.source, 'real');

  const off = context(false);
  vm.runInContext(loader, off);
  prepareLoad(off, 'rewind_slime');
  off.teacherDashboardStudents = realStudents;
  off.getEligibleVsBossReportStudents = realPath.getEligibleVsBossReportStudents;
  off.getPlayerClientProgressDocRef = uid => uid;
  off.getDoc = async () => { reads += 1; return { exists: () => false }; };
  off.buildVsBossClassReport = realPath.buildVsBossClassReport;
  await vm.runInContext('loadVsBossClassReport()', off);
  assert.equal(off.rendered.source, 'real');
  assert.equal(reads, 2);
  console.log('Rewind Slime demo report checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
