class CommercialAnalyticsService {
  /**
   * Returns consolidated SaaS executive financial & growth metrics
   */
  static getExecutiveMetrics() {
    const activeInstitutionsCount = 14;
    const totalEnrolledStudents = 38450;
    const activeArrUSD = 142500;
    const mrrUSD = Math.round(activeArrUSD / 12);
    const arpuUSD = Math.round(activeArrUSD / activeInstitutionsCount);

    return {
      financials: {
        mrrUSD,
        arrUSD: activeArrUSD,
        arpuUSD,
        netRevenueRetentionPercent: 114.2, // Strong SaaS benchmark (> 100%)
        grossAnnualChurnPercent: 2.1,
        averageCustomerLifetimeMonths: 48,
        customerAcquisitionCostUSD: 1850,
        customerLifetimeValueUSD: arpuUSD * 4,
        ltvCacRatio: parseFloat(((arpuUSD * 4) / 1850).toFixed(1)) // Target >= 3.0x
      },
      scale: {
        totalInstitutions: activeInstitutionsCount,
        totalEnrolledStudents,
        averageStudentsPerCampus: Math.round(totalEnrolledStudents / activeInstitutionsCount),
        kiosksDeployed: 72,
        monthlyAttendanceTransactions: 1240000
      },
      tierDistribution: {
        pilot: { count: 3, percentage: '21.4%' },
        standard: { count: 7, percentage: '50.0%' },
        enterprise: { count: 4, percentage: '28.6%' }
      }
    };
  }

  /**
   * Returns current active CRM sales pipeline stages and weighted forecast
   */
  static getSalesPipeline() {
    const stages = [
      {
        stage: 'Lead / Inbound Discovery',
        count: 42,
        totalValueUSD: 84000,
        winProbability: 0.10,
        weightedValueUSD: 8400
      },
      {
        stage: 'Demo Walkthrough Completed',
        count: 18,
        totalValueUSD: 54000,
        winProbability: 0.25,
        weightedValueUSD: 13500
      },
      {
        stage: 'Active Campus Pilot (14-Day)',
        count: 8,
        totalValueUSD: 38000,
        winProbability: 0.65,
        weightedValueUSD: 24700
      },
      {
        stage: 'Contract & Legal Proposal Review',
        count: 4,
        totalValueUSD: 28000,
        winProbability: 0.85,
        weightedValueUSD: 23800
      },
      {
        stage: 'Closed Won (Annual Recurring)',
        count: 14,
        totalValueUSD: 142500,
        winProbability: 1.00,
        weightedValueUSD: 142500
      }
    ];

    const totalPipelineValue = stages.reduce((acc, s) => acc + s.totalValueUSD, 0);
    const weightedPipelineValue = stages.reduce((acc, s) => acc + s.weightedValueUSD, 0);

    return {
      stages,
      totalPipelineValueUSD: totalPipelineValue,
      weightedPipelineValueUSD: Math.round(weightedPipelineValue),
      salesCycleAverageDays: 24
    };
  }

  /**
   * 12-Month forward revenue forecasting model
   */
  static getRevenueForecast() {
    const quarters = [
      { quarter: 'Q1 2027', projectedInstitutions: 22, projectedArrUSD: 195000 },
      { quarter: 'Q2 2027', projectedInstitutions: 35, projectedArrUSD: 285000 },
      { quarter: 'Q3 2027', projectedInstitutions: 52, projectedArrUSD: 420000 },
      { quarter: 'Q4 2027', projectedInstitutions: 75, projectedArrUSD: 610000 }
    ];

    return {
      forecastBasis: 'Historical 18% month-over-month pipeline conversion rate',
      quarters
    };
  }
}

module.exports = CommercialAnalyticsService;
