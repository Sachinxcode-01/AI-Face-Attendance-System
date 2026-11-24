"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  CheckCircle,
  GraduationCap,
  MessageSquare,
  Presentation,
  Quote,
  ShieldCheck,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { Reveal } from "./ui/reveal";
import { SectionHeading } from "./ui/section-heading";
import { SpotlightCard } from "./ui/spotlight-card";

type Stakeholder = "teachers" | "administrators" | "parents" | "students";

const REVIEWS = {
  teachers: [
    {
      name: "Prof. K. Venkatesh",
      role: "HOD Computer Science, BDT College of Engineering",
      quote:
        "Taking attendance manually used to swallow 12 to 14 minutes of every 50-minute lecture. With SmartFace, students walk past the kiosk, the screen confirms their check-in, and my entire class roster is filled before I finish greeting them.",
      metric: "14 mins saved per lecture",
      verified: true,
    },
    {
      name: "Dr. Maria Rodriguez",
      role: "Associate Professor & Dean of Instruction",
      quote:
        "The rotating HMAC QR code completely ended proxy attendance. Students previously texted photos of attendance sheets; with SmartFace tokens rotating every 30 seconds, proxy attendance is mathematically impossible.",
      metric: "100% proxy eliminated",
      verified: true,
    },
    {
      name: "Prof. Arvind Shenoy",
      role: "Senior Lecturer, Department of Electronics",
      quote:
        "Manual override is always one tap away if someone wears a medical bandage, but in 99.8% of cases ArcFace detects them effortlessly even in varying classroom morning lighting.",
      metric: "99.8% verification reliability",
      verified: true,
    },
  ],
  administrators: [
    {
      name: "Dr. S. K. Narang",
      role: "Principal, National Institute of Technology & Science",
      quote:
        "During our NAAC & NBA accreditation inspection, our team generated complete cohort attendance compliance reports in 2 clicks. The tamper-evident cryptographic audit logs made every record defensible.",
      metric: "Instant NAAC / NBA audit reports",
      verified: true,
    },
    {
      name: "Fr. Thomas Joseph",
      role: "Campus Director, Loyola Technical Campus",
      quote:
        "We deployed 8 edge kiosks across main college entry gates. Over 4,500 students enter smoothly within a 20-minute morning window without a single queue jam. It transformed morning campus logistics.",
      metric: "4,500 students verified in 20 min",
      verified: true,
    },
    {
      name: "Rajiv Malhotra",
      role: "Chief Information Officer, Dayanand University",
      quote:
        "The zero-photo storage architecture was the deciding factor for our institutional privacy board. Only 512-dim mathematical vector embeddings are stored, ensuring full compliance with India's DPDP Act.",
      metric: "Zero photo privacy compliance",
      verified: true,
    },
  ],
  parents: [
    {
      name: "Sunita Deshmukh",
      role: "Parent of 2nd Year B.Tech Student",
      quote:
        "I receive a WhatsApp confirmation at 8:42 AM the exact moment my daughter steps through the college gate. As a working parent living 40 km away, that real-time visibility gives our family total peace of mind.",
      metric: "Instant 8:42 AM gate alert",
      verified: true,
    },
    {
      name: "Rajeshwari Iyer",
      role: "Parent of Architecture Student",
      quote:
        "No more end-of-semester shock notices about attendance shortages. The Parent Portal shows her daily attendance percentage, and submitting medical leave notes takes 10 seconds on my phone.",
      metric: "Zero attendance shortages",
      verified: true,
    },
  ],
  students: [
    {
      name: "Aryan Mehta",
      role: "President, Student Campus Council",
      quote:
        "No one likes touching fingerprint biometric scanners that hundreds of people touch during flu season. Touchless face recognition at the gate is instant, hygienic, and fair. There are zero attendance disputes now.",
      metric: "Hygienic touchless entry",
      verified: true,
    },
    {
      name: "Sneha Patil",
      role: "Final Year Electronics Student",
      quote:
        "The attendance streak badges and Nexa AI assistant keep track of exactly how many classes you can afford to miss for cultural festivals while staying safely above the mandatory 75% university criteria.",
      metric: "Gamified 75% safety tracker",
      verified: true,
    },
  ],
};

const CASE_STUDIES = [
  {
    college: "St. Xavier's Institute of Engineering",
    size: "4,500 Students · 185 Faculty",
    challenge:
      "18-minute morning bottleneck queues at entry turnstiles and persistent proxy attendance in large 120-seat lecture halls.",
    solution:
      "Installed 8 SmartFace Edge Kiosks at main turnstiles paired with classroom rotating QR sessions on teacher podium projectors.",
    results: [
      "100% elimination of proxy check-ins in 48 hours",
      "Morning gate transit speed reduced to <300ms per student",
      "Zero network crashes during morning peak rush",
    ],
    badge: "Engineering Campus",
  },
  {
    college: "Apex Global University",
    size: "12,000 Students · 640 Faculty",
    challenge:
      "Fragmented paper attendance led to 3 weeks of manual data compilation every semester for university regulatory compliance.",
    solution:
      "Campus-wide rollout of SmartFace Sentinel with automated synchronization into the university ERP and student portal.",
    results: [
      "4,800 faculty instructional hours reclaimed annually",
      "One-click institutional compliance reports for accreditation",
      "Automated WhatsApp alerts to parents reducing absenteeism by 32%",
    ],
    badge: "Multi-Campus University",
  },
  {
    college: "National Polytechnic Campus",
    size: "2,800 Students · 95 Faculty",
    challenge:
      "Severe coastal monsoon storms routinely caused fiber internet dropouts, paralyzing cloud-dependent biometric terminals.",
    solution:
      "Deployed SmartFace local SQLite edge buffer nodes that verify biometrics offline and reconcile instantly upon uplink restore.",
    results: [
      "100% operational uptime maintained during multi-day internet outages",
      "Zero lost punches or corrupted attendance records",
      "Low hardware cost running on standard USB webcams",
    ],
    badge: "Polytechnic Institute",
  },
];

export function SocialProof() {
  const [activeTab, setActiveTab] = useState<Stakeholder>("teachers");

  const tabs: { id: Stakeholder; label: string; icon: any }[] = [
    { id: "teachers", label: "Teacher Reviews", icon: Presentation },
    { id: "administrators", label: "Administrator Reviews", icon: ShieldCheck },
    { id: "parents", label: "Parent Reviews", icon: Users },
    { id: "students", label: "Student Reviews", icon: GraduationCap },
  ];

  return (
    <section
      id="social-proof"
      className="relative scroll-mt-24 border-t border-[var(--hairline)] py-24 sm:py-32 lg:py-36"
    >
      <div className="relative mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
        <SectionHeading
          eyebrow="Social Proof & Validation"
          title="Endorsed by Faculty, Trusted by Leadership"
          description="Hear how teachers, principals, deans, parents, and students experience frictionless, proxy-free campus attendance every single day."
        />

        {/* Stakeholder Selector Tabs */}
        <div className="mt-12 flex justify-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-full border border-white/10 bg-surface/80 backdrop-blur-md">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-white text-black shadow-md font-semibold"
                      : "text-mid hover:text-hi hover:bg-white/[0.04]"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-black" : "text-accent"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Testimonials Grid with smooth transition */}
        <div className="mt-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.25 }}
              className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
            >
              {REVIEWS[activeTab].map((review, i) => (
                <SpotlightCard
                  key={i}
                  spotlightColor="rgba(143, 139, 255, 0.18)"
                  className="flex flex-col justify-between p-6 sm:p-7"
                >
                  <div>
                    <div className="flex items-center justify-between text-faint mb-4">
                      <div className="flex text-amber-400 gap-0.5">
                        {[...Array(5)].map((_, starIndex) => (
                          <Star key={starIndex} className="h-4 w-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-spotify bg-spotify/10 border border-spotify/20 px-2 py-0.5 rounded-full">
                        {review.metric}
                      </span>
                    </div>

                    <p className="text-[14px] leading-relaxed text-mid italic">
                      "{review.quote}"
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between">
                    <div>
                      <h4 className="font-display text-[14.5px] font-semibold text-hi">
                        {review.name}
                      </h4>
                      <p className="font-mono text-[11px] text-faint mt-0.5">{review.role}</p>
                    </div>
                    {review.verified && (
                      <span title="Verified Institutional User">
                        <CheckCircle className="h-4 w-4 text-spotify" />
                      </span>
                    )}
                  </div>
                </SpotlightCard>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Case Studies / Success Stories Section */}
        <div className="mt-24">
          <div className="text-center max-w-xl mx-auto mb-12">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-spotify">
              Documented Impact
            </p>
            <h3 className="mt-2 font-display text-2xl sm:text-3xl font-medium text-hi">
              Real Campus Deployments & Results
            </h3>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {CASE_STUDIES.map((study, idx) => (
              <Reveal key={study.college} delay={idx * 0.1} direction="up">
                <div className="card-bytune rounded-[22px] p-6 sm:p-7 h-full flex flex-col justify-between border border-white/10 bg-surface/90 shadow-xl">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                      <span className="font-mono text-[10.5px] uppercase tracking-wider text-accent font-semibold">
                        {study.badge}
                      </span>
                      <span className="font-mono text-[11px] text-faint">{study.size}</span>
                    </div>

                    <h4 className="mt-4 font-display text-lg font-medium text-hi">
                      {study.college}
                    </h4>

                    <div className="mt-4 space-y-3 text-[13px]">
                      <div>
                        <span className="font-mono text-[10.5px] uppercase tracking-wider text-red-400 font-semibold block">
                          Challenge
                        </span>
                        <p className="text-mid mt-0.5">{study.challenge}</p>
                      </div>

                      <div>
                        <span className="font-mono text-[10.5px] uppercase tracking-wider text-accent block font-semibold">
                          Deployment
                        </span>
                        <p className="text-mid mt-0.5">{study.solution}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/[0.08] space-y-2">
                    <span className="font-mono text-[10.5px] uppercase tracking-wider text-spotify font-semibold block">
                      Key Outcomes
                    </span>
                    {study.results.map((res, rIdx) => (
                      <div key={rIdx} className="flex items-start gap-2 text-[12.5px] text-hi">
                        <CheckCircle className="h-3.5 w-3.5 text-spotify shrink-0 mt-0.5" />
                        <span>{res}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
