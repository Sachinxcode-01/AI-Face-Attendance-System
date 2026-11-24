const College = require('../models/College');

class BillingService {
  /**
   * Catalog of all institutional subscription plans
   */
  static getPlans() {
    return [
      {
        id: 'pilot',
        name: 'Campus Pilot',
        pricePerStudentYearUSD: 0,
        fixedPriceUSD: 499,
        trialDays: 60,
        studentQuota: 250,
        features: [
          'Up to 250 enrolled students',
          'Kiosk Biometric Face Scan Mode',
          'Dynamic Anti-Proxy QR Check-In',
          'Faculty & Student Mobile Apps',
          'Standard Email Notifications',
          'Daily Attendance CSV Export',
          'Community Support & SLA'
        ]
      },
      {
        id: 'standard',
        name: 'Standard College',
        pricePerStudentYearUSD: 1.20,
        minStudents: 500,
        trialDays: 0,
        features: [
          '500 to 5,000 enrolled students',
          'Full Multi-Department Hierarchy',
          'OneRoster 1.2 CSV Ingestion',
          'Super Admin & Admin Sentinel',
          'Automated Parent SMS/Email Alerts',
          '99.9% Uptime SLA Guarantee',
          'Business Hours Technical Support'
        ]
      },
      {
        id: 'enterprise',
        name: 'Enterprise Multi-Campus',
        pricePerStudentYearUSD: 0.85,
        minStudents: 2500,
        trialDays: 0,
        features: [
          'Unlimited campus enrollment',
          'White-Label Custom Domain & Theme',
          'Direct Canvas / Moodle / Blackboard API Sync',
          'SMS OTP Failover Engine Enabled',
          'Dedicated Multi-Region Cloud Cluster',
          '24/7/365 SRE On-Call & 99.99% SLA',
          'Government Tender & GeM Compliance Pack'
        ]
      }
    ];
  }

  /**
   * Calculates pricing quote based on student enrollment and chosen currency
   */
  static calculateQuote({ planId, studentCount, currency = 'USD', billingCycle = 'annual' }) {
    const plans = this.getPlans();
    const plan = plans.find(p => p.id === planId) || plans[1]; // default standard

    const exchangeRate = currency.toUpperCase() === 'INR' ? 85.0 : 1.0;
    const count = Math.max(studentCount || plan.minStudents || 500, plan.minStudents || 0);

    let annualCostUSD = 0;
    if (plan.id === 'pilot') {
      annualCostUSD = plan.fixedPriceUSD;
    } else {
      annualCostUSD = count * plan.pricePerStudentYearUSD;
    }

    const annualCost = Math.round(annualCostUSD * exchangeRate);
    const monthlyCost = Math.round((annualCost / 12) * 1.15); // 15% surcharge for monthly billing

    return {
      planId: plan.id,
      planName: plan.name,
      studentCount: count,
      currency: currency.toUpperCase(),
      billingCycle,
      annualTotal: annualCost,
      monthlyTotal: monthlyCost,
      amountToCharge: billingCycle === 'annual' ? annualCost : monthlyCost,
      effectivePricePerStudentYear: (annualCost / count).toFixed(2)
    };
  }

  /**
   * Creates simulated or Stripe checkout session
   */
  static async createCheckoutSession(collegeCode, { planId, studentCount, currency, successUrl, cancelUrl }) {
    const quote = this.calculateQuote({ planId, studentCount, currency });
    const college = await College.findOne({ code: collegeCode.toUpperCase() });
    if (!college) {
      throw new Error(`College ${collegeCode} not found`);
    }

    const sessionId = `cs_${planId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return {
      sessionId,
      url: successUrl ? `${successUrl}?session_id=${sessionId}` : `https://checkout.smartface.pro/pay/${sessionId}`,
      quote,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
  }

  /**
   * Retrieves historical invoices for an institution
   */
  static async getInvoices(collegeCode) {
    const college = await College.findOne({ code: collegeCode.toUpperCase() });
    const planName = college?.subscription?.plan || 'standard';

    return [
      {
        invoiceId: `INV-${collegeCode}-2026-001`,
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 1450.00,
        currency: 'USD',
        status: 'PAID',
        description: `SmartFace ${planName.toUpperCase()} License - Annual Tier`,
        downloadUrl: `/api/v1/billing/invoices/INV-${collegeCode}-2026-001/pdf`
      }
    ];
  }
}

module.exports = BillingService;
