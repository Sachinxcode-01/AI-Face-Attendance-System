export interface RoiInputs {
  students: number;
  teachers: number;
  classesPerDay: number;
  teachingDaysPerYear: number;
  manualMinutesPerClass: number;
  smartFaceMinutesPerClass: number;
  facultyHourlyCostInr: number;
  annualAdminProcessingCostInr: number;
  hardwareCostInr: number;
  installationCostInr: number;
  subscriptionCostInr: number;
  maintenanceCostInr: number;
  baselineProxyRatePct: number;
}

export interface RoiResult {
  totalLecturesPerYear: number;
  minutesSavedPerLecture: number;
  annualTeachingHoursRecovered: number;
  equivalentTeachingDays: number;
  timeReductionPercent: number;
  estimatedFacultyTimeValueInr: number;
  estimatedAdminSavingsInr: number;
  grossEstimatedBenefitsInr: number;
  annualOperatingCostInr: number;
  yearOneTotalCostInr: number;
  netEstimatedBenefitsYear1Inr: number;
  estimatedRoiPct: number;
  estimatedPaybackMonths: number | null;
  estimatedProxyCheckInsAddressed: number;
}

export const DEFAULT_ROI_INPUTS: RoiInputs = {
  students: 2400,
  teachers: 110,
  classesPerDay: 5,
  teachingDaysPerYear: 180,
  manualMinutesPerClass: 8,
  smartFaceMinutesPerClass: 1,
  facultyHourlyCostInr: 500,
  annualAdminProcessingCostInr: 60000,
  hardwareCostInr: 120000,
  installationCostInr: 40000,
  subscriptionCostInr: 180000,
  maintenanceCostInr: 30000,
  baselineProxyRatePct: 5,
};

function clampNonNegative(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/**
 * Calculates illustrative campus ROI and time-recovery estimates.
 * Separates recovered instructional staff time from direct administrative cost savings.
 */
export function calculateRoi(rawInputs: RoiInputs): RoiResult {
  const students = clampNonNegative(rawInputs.students);
  const teachers = clampNonNegative(rawInputs.teachers);
  const classesPerDay = clampNonNegative(rawInputs.classesPerDay);
  const teachingDaysPerYear = clampNonNegative(rawInputs.teachingDaysPerYear);
  const manualMinutesPerClass = clampNonNegative(rawInputs.manualMinutesPerClass);
  const smartFaceMinutesPerClass = clampNonNegative(rawInputs.smartFaceMinutesPerClass);
  const facultyHourlyCostInr = clampNonNegative(rawInputs.facultyHourlyCostInr);
  const annualAdminProcessingCostInr = clampNonNegative(rawInputs.annualAdminProcessingCostInr);
  const hardwareCostInr = clampNonNegative(rawInputs.hardwareCostInr);
  const installationCostInr = clampNonNegative(rawInputs.installationCostInr);
  const subscriptionCostInr = clampNonNegative(rawInputs.subscriptionCostInr);
  const maintenanceCostInr = clampNonNegative(rawInputs.maintenanceCostInr);
  const baselineProxyRatePct = Math.min(100, clampNonNegative(rawInputs.baselineProxyRatePct));

  const totalLecturesPerYear = Math.round(teachers * classesPerDay * teachingDaysPerYear);
  const minutesSavedPerLecture = Math.max(0, manualMinutesPerClass - smartFaceMinutesPerClass);
  const annualTeachingHoursRecovered = Math.round((totalLecturesPerYear * minutesSavedPerLecture) / 60);
  const equivalentTeachingDays = Number((annualTeachingHoursRecovered / 8).toFixed(0));

  const timeReductionPercent =
    manualMinutesPerClass > 0
      ? Number(((minutesSavedPerLecture / manualMinutesPerClass) * 100).toFixed(1))
      : 0;

  const estimatedFacultyTimeValueInr = Math.round(annualTeachingHoursRecovered * facultyHourlyCostInr);
  const estimatedAdminSavingsInr = Math.round(annualAdminProcessingCostInr);
  const grossEstimatedBenefitsInr = estimatedFacultyTimeValueInr + estimatedAdminSavingsInr;

  const annualOperatingCostInr = Math.round(subscriptionCostInr + maintenanceCostInr);
  const yearOneTotalCostInr = Math.round(hardwareCostInr + installationCostInr + annualOperatingCostInr);
  const netEstimatedBenefitsYear1Inr = grossEstimatedBenefitsInr - yearOneTotalCostInr;

  const estimatedRoiPct =
    yearOneTotalCostInr > 0
      ? Number(((netEstimatedBenefitsYear1Inr / yearOneTotalCostInr) * 100).toFixed(1))
      : 0;

  const estimatedPaybackMonths =
    grossEstimatedBenefitsInr > 0 && yearOneTotalCostInr > 0
      ? Number(((yearOneTotalCostInr / grossEstimatedBenefitsInr) * 12).toFixed(1))
      : null;

  const estimatedProxyCheckInsAddressed = Math.round(
    students * (baselineProxyRatePct / 100) * classesPerDay * teachingDaysPerYear,
  );

  return {
    totalLecturesPerYear,
    minutesSavedPerLecture,
    annualTeachingHoursRecovered,
    equivalentTeachingDays,
    timeReductionPercent,
    estimatedFacultyTimeValueInr,
    estimatedAdminSavingsInr,
    grossEstimatedBenefitsInr,
    annualOperatingCostInr,
    yearOneTotalCostInr,
    netEstimatedBenefitsYear1Inr,
    estimatedRoiPct,
    estimatedPaybackMonths,
    estimatedProxyCheckInsAddressed,
  };
}
