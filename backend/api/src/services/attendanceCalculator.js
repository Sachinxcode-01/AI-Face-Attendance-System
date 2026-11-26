'use strict';

/**
 * Deterministic Attendance Calculator, Forecasting Engine & Risk Intelligence.
 * Uses exact integer basis-point arithmetic (1% = 100 bp) to prevent IEEE-754 drift.
 * Never relies on LLM outputs for numerical attendance calculations.
 */

const DEFAULT_POLICY = {
  minPercentage: 75,
  approvedLeaveCountsAsPresent: false,
  excusedCountsAsPresent: true,
  lateCountsAsPresent: true,
};

const NON_CONDUCTED_STATUSES = new Set([
  'cancelled',
  'cancelled session',
  'not recorded',
  'pending verification',
]);

const EXCUSED_STATUSES = new Set(['excused', 'excused absence']);
const LEAVE_STATUSES = new Set(['medical leave', 'approved leave', 'leave']);

function round2(value) {
  return Math.round(value * 100) / 100;
}

function normalizeTarget(target) {
  const num = Number(target);
  if (!Number.isFinite(num) || num <= 0) return 0;
  if (num >= 100) return 100;
  return round2(num);
}

function classifyAttendanceStatus(rawStatus, policy = {}) {
  const merged = { ...DEFAULT_POLICY, ...policy };
  const s = String(rawStatus || 'Present').trim().toLowerCase();

  if (NON_CONDUCTED_STATUSES.has(s)) {
    return { conducted: false, attended: false, category: s };
  }
  if (s === 'present' || s === 'verified_face' || s === 'verified_qr' || s === 'manually recorded') {
    return { conducted: true, attended: true, category: 'present' };
  }
  if (s === 'late') {
    return { conducted: true, attended: Boolean(merged.lateCountsAsPresent), category: 'late' };
  }
  if (EXCUSED_STATUSES.has(s)) {
    return { conducted: true, attended: Boolean(merged.excusedCountsAsPresent), category: 'excused' };
  }
  if (LEAVE_STATUSES.has(s)) {
    return { conducted: true, attended: Boolean(merged.approvedLeaveCountsAsPresent), category: 'leave' };
  }
  if (s === 'absent') {
    return { conducted: true, attended: false, category: 'absent' };
  }
  // Unknown status treated conservatively as conducted & absent unless explicitly non-conducted
  return { conducted: true, attended: false, category: s };
}

function tallyRecords(records = [], policy = {}) {
  let attended = 0;
  let conducted = 0;
  let missed = 0;
  let late = 0;
  let excused = 0;
  let leave = 0;
  let cancelled = 0;
  let pending = 0;

  for (const rec of records) {
    const raw = typeof rec === 'string' ? rec : rec?.status;
    const s = String(raw || '').trim().toLowerCase();
    if (s === 'cancelled' || s === 'cancelled session') {
      cancelled++;
      continue;
    }
    if (s === 'pending verification') {
      pending++;
      continue;
    }
    const cls = classifyAttendanceStatus(raw, policy);
    if (!cls.conducted) continue;
    conducted++;
    if (cls.attended) {
      attended++;
    } else {
      missed++;
    }
    if (cls.category === 'late') late++;
    if (cls.category === 'excused') excused++;
    if (cls.category === 'leave') leave++;
  }

  const percentage = conducted > 0 ? round2((attended / conducted) * 100) : null;
  return {
    attended,
    conducted,
    missed,
    late,
    excused,
    leave,
    cancelled,
    pending,
    percentage,
  };
}

/**
 * Computes consecutive classes required to reach target% and allowable absences
 * without falling below target%.
 */
function calculateTargetMetrics({ attended = 0, conducted = 0, target = 75, remainingClasses = null } = {}) {
  const safeAttended = Math.max(0, Math.floor(Number(attended) || 0));
  const safeConducted = Math.max(safeAttended, Math.floor(Number(conducted) || 0));
  const targetPct = normalizeTarget(target);
  const targetBp = Math.round(targetPct * 100); // out of 10000

  const currentPercentage = safeConducted > 0 ? round2((safeAttended / safeConducted) * 100) : null;
  const shortagePercentage =
    currentPercentage !== null && currentPercentage < targetPct
      ? round2(targetPct - currentPercentage)
      : 0;

  // Handle 0 conducted classes
  if (safeConducted === 0) {
    const rem = remainingClasses == null ? null : Math.max(0, Math.floor(remainingClasses));
    return {
      attended: 0,
      conducted: 0,
      missed: 0,
      targetPercentage: targetPct,
      currentPercentage: null,
      eligible: true,
      shortagePercentage: 0,
      classesNeeded: 0,
      possible: true,
      achievableBeforeSemesterEnd: true,
      allowableAbsences: rem !== null ? rem : 0,
      remainingClasses: rem,
      statusNote: 'No classes conducted yet.',
    };
  }

  // Exact integer basis-point comparison: 10000 * attended >= targetBp * conducted
  const lhs = 10000 * safeAttended;
  const rhs = targetBp * safeConducted;
  const eligible = lhs >= rhs;

  let classesNeeded = 0;
  let possible = true;
  let allowableAbsences = 0;
  let statusNote = '';

  if (targetBp === 10000) {
    if (safeAttended < safeConducted) {
      classesNeeded = null;
      possible = false;
      allowableAbsences = 0;
      statusNote = '100% attendance cannot be recovered once an absence has occurred.';
    } else {
      classesNeeded = 0;
      possible = true;
      allowableAbsences = 0;
      statusNote = 'Currently at 100%. Missing any class will drop below 100%.';
    }
  } else if (targetBp === 0) {
    classesNeeded = 0;
    possible = true;
    allowableAbsences = remainingClasses != null ? Math.max(0, Math.floor(remainingClasses)) : 999;
    statusNote = '0% threshold requires no minimum classes.';
  } else if (!eligible) {
    const numerator = rhs - lhs;
    const denominator = 10000 - targetBp;
    classesNeeded = Math.ceil(numerator / denominator);
    possible = true;
    allowableAbsences = 0;
    statusNote = `Attend the next ${classesNeeded} consecutive ${classesNeeded === 1 ? 'class' : 'classes'} to reach ${targetPct}%.`;
  } else {
    classesNeeded = 0;
    possible = true;
    allowableAbsences = Math.max(0, Math.floor((lhs - rhs) / targetBp));
    statusNote = allowableAbsences > 0
      ? `You can miss up to ${allowableAbsences} upcoming ${allowableAbsences === 1 ? 'class' : 'classes'} and stay at or above ${targetPct}%.`
      : `On target (${currentPercentage}%), but no absence buffer remains.`;
  }

  const rem = remainingClasses == null ? null : Math.max(0, Math.floor(remainingClasses));
  let achievableBeforeSemesterEnd = possible;
  if (rem !== null && classesNeeded !== null && classesNeeded > rem) {
    achievableBeforeSemesterEnd = false;
    statusNote = `Needs ${classesNeeded} consecutive classes, but only ${rem} scheduled classes remain in the semester.`;
  }

  const maxPossiblePercentage =
    rem !== null && safeConducted + rem > 0
      ? round2(((safeAttended + rem) / (safeConducted + rem)) * 100)
      : null;

  const minPossiblePercentage =
    rem !== null && safeConducted + rem > 0
      ? round2((safeAttended / (safeConducted + rem)) * 100)
      : null;

  return {
    attended: safeAttended,
    conducted: safeConducted,
    missed: safeConducted - safeAttended,
    targetPercentage: targetPct,
    currentPercentage,
    eligible,
    shortagePercentage,
    classesNeeded,
    possible,
    achievableBeforeSemesterEnd,
    allowableAbsences,
    remainingClasses: rem,
    maxPossiblePercentage,
    minPossiblePercentage,
    statusNote,
  };
}

/**
 * Deterministic what-if scenario simulation.
 */
function simulateScenario({ attended = 0, conducted = 0, attendUpcoming = 0, missUpcoming = 0, target = 75 } = {}) {
  const addAttend = Math.max(0, Math.floor(Number(attendUpcoming) || 0));
  const addMiss = Math.max(0, Math.floor(Number(missUpcoming) || 0));
  const nextAttended = Math.max(0, Math.floor(Number(attended) || 0)) + addAttend;
  const nextConducted = Math.max(0, Math.floor(Number(conducted) || 0)) + addAttend + addMiss;

  const projected = calculateTargetMetrics({
    attended: nextAttended,
    conducted: nextConducted,
    target,
  });

  return {
    isForecast: true,
    simulatedAttend: addAttend,
    simulatedMiss: addMiss,
    ...projected,
  };
}

/**
 * Estimate the calendar date on which the `classesNeeded`-th upcoming class occurs
 * using weekly timetable days (e.g. ['Monday', 'Wednesday']) and holiday dates.
 */
function estimateRecoveryDate({
  classesNeeded,
  scheduledDays = [],
  holidayDates = [],
  fromDate = new Date(),
  maxHorizonDays = 180,
} = {}) {
  if (!classesNeeded || classesNeeded <= 0) return null;
  if (!Array.isArray(scheduledDays) || scheduledDays.length === 0) return null;

  const dayMap = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
  const slotsPerDow = {};
  for (const d of scheduledDays) {
    const key = String(d || '').trim().slice(0, 3).toLowerCase();
    if (key in dayMap) {
      const dow = dayMap[key];
      slotsPerDow[dow] = (slotsPerDow[dow] || 0) + 1;
    }
  }
  if (Object.keys(slotsPerDow).length === 0) return null;

  const holidays = new Set(
    (holidayDates || []).map((h) => {
      const dt = new Date(h);
      return Number.isNaN(dt.getTime()) ? String(h).slice(0, 10) : dt.toISOString().slice(0, 10);
    })
  );

  let remaining = classesNeeded;
  const cursor = new Date(fromDate);
  cursor.setUTCHours(0, 0, 0, 0);

  for (let i = 1; i <= maxHorizonDays; i++) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    const iso = cursor.toISOString().slice(0, 10);
    if (holidays.has(iso)) continue;
    const count = slotsPerDow[cursor.getUTCDay()] || 0;
    if (count > 0) {
      remaining -= count;
      if (remaining <= 0) {
        return iso;
      }
    }
  }
  return null;
}

/**
 * Explainable rule-based risk intelligence.
 */
function evaluateRisk({
  attended = 0,
  conducted = 0,
  target = 75,
  recentRecords = [],
  subjects = [],
  remainingClasses = null,
} = {}) {
  const metrics = calculateTargetMetrics({ attended, conducted, target, remainingClasses });
  const reasons = [];
  const recommendations = [];

  // Count consecutive recent absences (records expected newest-first or sorted here)
  const sorted = [...recentRecords].sort((a, b) => new Date(b.timestamp || b.date || 0) - new Date(a.timestamp || a.date || 0));
  let consecutiveAbsences = 0;
  for (const r of sorted) {
    const cls = classifyAttendanceStatus(r.status);
    if (!cls.conducted) continue;
    if (!cls.attended) consecutiveAbsences++;
    else break;
  }

  // Trend detection: compare last 7 conducted vs prior 7 conducted
  const conductedList = sorted.filter((r) => classifyAttendanceStatus(r.status).conducted);
  let trendDirection = 'stable';
  if (conductedList.length >= 6) {
    const recentSlice = conductedList.slice(0, Math.floor(conductedList.length / 2));
    const priorSlice = conductedList.slice(Math.floor(conductedList.length / 2));
    const recentRate = recentSlice.filter((r) => classifyAttendanceStatus(r.status).attended).length / recentSlice.length;
    const priorRate = priorSlice.filter((r) => classifyAttendanceStatus(r.status).attended).length / priorSlice.length;
    if (recentRate - priorRate <= -0.08) {
      trendDirection = 'declining';
      reasons.push(`Recent attendance rate (${round2(recentRate * 100)}%) declined compared to earlier sessions (${round2(priorRate * 100)}%).`);
    } else if (recentRate - priorRate >= 0.08) {
      trendDirection = 'improving';
    }
  }

  const belowThresholdSubjects = (subjects || []).filter((s) => s.conducted > 0 && s.percentage !== null && s.percentage < metrics.targetPercentage);

  if (metrics.conducted === 0) {
    return {
      riskLevel: 'Safe',
      trendDirection: 'stable',
      consecutiveAbsences: 0,
      reasons: ['No conducted classes recorded yet.'],
      recommendations: ['Check in on time once your classes begin to build your attendance buffer.'],
      belowThresholdSubjects: [],
    };
  }

  if (metrics.currentPercentage < Math.max(0, metrics.targetPercentage - 10) || !metrics.achievableBeforeSemesterEnd) {
    reasons.push(`Overall attendance (${metrics.currentPercentage}%) is critically below the ${metrics.targetPercentage}% institutional requirement.`);
  } else if (metrics.currentPercentage < metrics.targetPercentage) {
    reasons.push(`Overall attendance (${metrics.currentPercentage}%) is ${metrics.shortagePercentage}% below the ${metrics.targetPercentage}% target.`);
  } else if (metrics.currentPercentage < metrics.targetPercentage + 5) {
    reasons.push(`Overall attendance (${metrics.currentPercentage}%) is within 5% of the ${metrics.targetPercentage}% threshold (${metrics.allowableAbsences} safe absences remaining).`);
  }

  if (consecutiveAbsences >= 2) {
    reasons.push(`${consecutiveAbsences} consecutive unexcused absences detected in recent sessions.`);
  }

  if (belowThresholdSubjects.length > 0) {
    reasons.push(
      `${belowThresholdSubjects.length} subject(s) below ${metrics.targetPercentage}%: ${belowThresholdSubjects.map((s) => `${s.subject} (${s.percentage}%)`).join(', ')}.`
    );
    for (const s of belowThresholdSubjects) {
      if (s.classesNeeded !== null && s.classesNeeded > 0) {
        recommendations.push(`Attend the next ${s.classesNeeded} consecutive ${s.subject} class(es) to restore ${metrics.targetPercentage}%.`);
      }
    }
  }

  let riskLevel = 'Safe';
  if (!metrics.achievableBeforeSemesterEnd || metrics.currentPercentage < Math.max(0, metrics.targetPercentage - 10)) {
    riskLevel = 'Critical shortage';
  } else if (metrics.currentPercentage < metrics.targetPercentage || consecutiveAbsences >= 3) {
    riskLevel = 'At risk';
  } else if (
    metrics.currentPercentage < metrics.targetPercentage + 5 ||
    belowThresholdSubjects.length > 0 ||
    trendDirection === 'declining' ||
    consecutiveAbsences >= 2
  ) {
    riskLevel = 'Attention required';
  }

  if (recommendations.length === 0) {
    if (metrics.classesNeeded && metrics.classesNeeded > 0) {
      recommendations.push(`Attend the next ${metrics.classesNeeded} consecutive class(es) to reach ${metrics.targetPercentage}%.`);
    } else if (riskLevel === 'Attention required') {
      recommendations.push('Prioritize attending all scheduled classes this week to widen your safety margin.');
    } else {
      recommendations.push('Maintain your current attendance cadence to stay comfortably eligible.');
    }
  }

  return {
    riskLevel,
    trendDirection,
    consecutiveAbsences,
    reasons: reasons.length > 0 ? reasons : [`Attendance (${metrics.currentPercentage}%) comfortably meets the ${metrics.targetPercentage}% threshold.`],
    recommendations,
    belowThresholdSubjects: belowThresholdSubjects.map((s) => s.subject),
  };
}

module.exports = {
  DEFAULT_POLICY,
  round2,
  classifyAttendanceStatus,
  tallyRecords,
  calculateTargetMetrics,
  simulateScenario,
  estimateRecoveryDate,
  evaluateRisk,
};
