'use strict';

const assert = require('assert');
const {
  classifyAttendanceStatus,
  tallyRecords,
  calculateTargetMetrics,
  simulateScenario,
  estimateRecoveryDate,
  evaluateRisk,
} = require('../../src/services/attendanceCalculator');

console.log('🧪 --- Running Deterministic Attendance Calculator Unit Tests ---');

// 1. Prompt canonical example: 32 / 50 -> 75% needs 22 consecutive classes
const ex = calculateTargetMetrics({ attended: 32, conducted: 50, target: 75 });
assert.strictEqual(ex.currentPercentage, 64);
assert.strictEqual(ex.eligible, false);
assert.strictEqual(ex.shortagePercentage, 11);
assert.strictEqual(ex.classesNeeded, 22);
assert.strictEqual(ex.allowableAbsences, 0);
assert.strictEqual(ex.possible, true);
console.log('  ✅ Canonical example (32/50 @ 75% -> 22 classes needed) passed');

// 2. Allowable absences above threshold: 40 / 50 (80%) @ 75%
// 40 / (50 + y) >= 0.75 => 40 / 0.75 - 50 = 53.33 - 50 = 3
const buf = calculateTargetMetrics({ attended: 40, conducted: 50, target: 75 });
assert.strictEqual(buf.currentPercentage, 80);
assert.strictEqual(buf.eligible, true);
assert.strictEqual(buf.classesNeeded, 0);
assert.strictEqual(buf.allowableAbsences, 3);
console.log('  ✅ Allowable absences calculation (40/50 @ 75% -> 3 safe absences) passed');

// 3. Zero conducted classes edge case
const zero = calculateTargetMetrics({ attended: 0, conducted: 0, target: 75, remainingClasses: 20 });
assert.strictEqual(zero.currentPercentage, null);
assert.strictEqual(zero.eligible, true);
assert.strictEqual(zero.classesNeeded, 0);
assert.strictEqual(zero.allowableAbsences, 20);
console.log('  ✅ Zero conducted classes edge case passed');

// 4. 100% target edge case (impossible after 1 absence, safe when 100%)
const imp100 = calculateTargetMetrics({ attended: 9, conducted: 10, target: 100 });
assert.strictEqual(imp100.possible, false);
assert.strictEqual(imp100.classesNeeded, null);
assert.strictEqual(imp100.allowableAbsences, 0);

const exact100 = calculateTargetMetrics({ attended: 10, conducted: 10, target: 100 });
assert.strictEqual(exact100.possible, true);
assert.strictEqual(exact100.eligible, true);
assert.strictEqual(exact100.classesNeeded, 0);
assert.strictEqual(exact100.allowableAbsences, 0);
console.log('  ✅ 100% target edge cases passed');

// 5. Impossible recovery before semester ends
const semesterImp = calculateTargetMetrics({ attended: 32, conducted: 50, target: 75, remainingClasses: 15 });
assert.strictEqual(semesterImp.classesNeeded, 22);
assert.strictEqual(semesterImp.achievableBeforeSemesterEnd, false);
assert.strictEqual(semesterImp.maxPossiblePercentage, 72.31);
console.log('  ✅ Impossible semester recovery detection passed');

// 6. Floating point boundary check (e.g. 85% of 20 = 17, 80% of 25 = 20)
const fp85 = calculateTargetMetrics({ attended: 17, conducted: 20, target: 85 });
assert.strictEqual(fp85.eligible, true);
assert.strictEqual(fp85.classesNeeded, 0);
assert.strictEqual(fp85.allowableAbsences, 0);

const fp80 = calculateTargetMetrics({ attended: 20, conducted: 25, target: 80 });
assert.strictEqual(fp80.eligible, true);
assert.strictEqual(fp80.classesNeeded, 0);
assert.strictEqual(fp80.allowableAbsences, 0);
console.log('  ✅ Floating-point exact boundary checks (85%, 80%) passed');

// 7. What-if simulation
const sim = simulateScenario({ attended: 32, conducted: 50, attendUpcoming: 22, missUpcoming: 0, target: 75 });
assert.strictEqual(sim.isForecast, true);
assert.strictEqual(sim.currentPercentage, 75);
assert.strictEqual(sim.eligible, true);
assert.strictEqual(sim.classesNeeded, 0);
console.log('  ✅ What-if scenario simulation passed');

// 8. Cancelled sessions, approved leave, excused absences under institutional policy
const records = [
  { status: 'Present' },
  { status: 'Absent' },
  { status: 'Cancelled session' },
  { status: 'Pending verification' },
  { status: 'Approved leave' },
  { status: 'Excused absence' },
];
const tallyDefault = tallyRecords(records, { approvedLeaveCountsAsPresent: false, excusedCountsAsPresent: true });
assert.strictEqual(tallyDefault.conducted, 4);
assert.strictEqual(tallyDefault.attended, 2); // Present + Excused
assert.strictEqual(tallyDefault.cancelled, 1);
assert.strictEqual(tallyDefault.pending, 1);
assert.strictEqual(tallyDefault.percentage, 50);

const tallyLeavePresent = tallyRecords(records, { approvedLeaveCountsAsPresent: true, excusedCountsAsPresent: true });
assert.strictEqual(tallyLeavePresent.conducted, 4);
assert.strictEqual(tallyLeavePresent.attended, 3); // Present + Approved leave + Excused
assert.strictEqual(tallyLeavePresent.percentage, 75);
console.log('  ✅ Policy-driven status classification (cancelled, pending, excused, leave) passed');

// 9. Recovery date estimation skipping holidays
const recDate = estimateRecoveryDate({
  classesNeeded: 2,
  scheduledDays: ['Monday', 'Wednesday'],
  holidayDates: ['2026-11-30'], // Monday holiday
  fromDate: new Date('2026-11-28T00:00:00Z'), // Saturday -> skips Mon Nov 30, hits Wed Dec 2 (1) and Mon Dec 7 (2)
});
assert.strictEqual(recDate, '2026-12-07');
console.log('  ✅ Recovery date estimation with holiday skipping passed');

// 10. Risk intelligence classification
const riskCrit = evaluateRisk({
  attended: 20,
  conducted: 40,
  target: 75,
  recentRecords: [
    { status: 'Absent', timestamp: '2026-11-25T10:00:00Z' },
    { status: 'Absent', timestamp: '2026-11-24T10:00:00Z' },
    { status: 'Present', timestamp: '2026-11-23T10:00:00Z' },
  ],
});
assert.strictEqual(riskCrit.riskLevel, 'Critical shortage');
assert.strictEqual(riskCrit.consecutiveAbsences, 2);
assert.ok(riskCrit.reasons.length >= 2);
console.log('  ✅ Explainable risk intelligence classification passed');

console.log('🎉 ALL ATTENDANCE CALCULATOR UNIT TESTS PASSED!');
