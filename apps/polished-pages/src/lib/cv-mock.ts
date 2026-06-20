import type { CvData } from "@/lib/cv-data";

// Realistic mock candidate used for template previews and visual QA.
export const MOCK_CV: CvData = {
  name: "Astrid Halvorsen",
  title: "Senior Product Manager",
  photo: null,
  contact: {
    email: "astrid.halvorsen@email.com",
    phone: "+47 482 19 003",
    location: "Oslo, Norway",
    linkedin: "linkedin.com/in/astridhalvorsen",
  },
  summary:
    "Senior product leader with 9+ years building B2B SaaS and data platforms across energy, media and fintech. Track record of shipping products that move core metrics — owning strategy, discovery and delivery for cross-functional teams of up to 18. Known for translating ambiguous problems into focused roadmaps and for raising the analytical bar of the teams I lead.",
  experiences: [
    {
      company: "Equinor",
      title: "Senior Product Manager — Digital Platforms",
      start: "2021",
      end: "Present",
      bullets: [
        "Owned the strategy and roadmap for an internal data platform used by 4,000+ engineers, growing weekly active users 3.4x in 18 months.",
        "Led a team of 12 across product, design and analytics to deliver a self-serve analytics suite that cut report turnaround from days to minutes.",
        "Introduced an opportunity-solution discovery practice now adopted by 6 product teams.",
      ],
    },
    {
      company: "Schibsted",
      title: "Product Manager — Marketplace",
      start: "2018",
      end: "2021",
      bullets: [
        "Launched a trust & safety initiative that reduced fraudulent listings 41% while improving seller activation.",
        "Ran a pricing experimentation programme generating €2.3M incremental annual revenue.",
      ],
    },
    {
      company: "DNB",
      title: "Associate Product Manager",
      start: "2015",
      end: "2018",
      bullets: [
        "Shipped the first mobile onboarding flow, lifting completion 27%.",
        "Partnered with compliance to deliver KYC automation across three markets.",
      ],
    },
  ],
  education: [
    { degree: "MSc", field: "Computer Science", institution: "NTNU, Trondheim", year: "2015" },
    { degree: "Exchange", field: "Human-Computer Interaction", institution: "TU Delft", year: "2014" },
  ],
  skills: [
    "Product Strategy", "Roadmapping", "Discovery & Research", "Experimentation (A/B)",
    "SQL & Analytics", "Stakeholder Management", "Agile / Scrum", "Figma", "Go-to-Market", "OKRs",
  ],
  languages: ["Norwegian (Native)", "English (Fluent)", "German (B1)"],
  certifications: ["Pragmatic Institute — PMC III", "Certified Scrum Product Owner (CSPO)", "AWS Cloud Practitioner"],
  references: [
    { name: "Henrik Solberg", title: "VP Product", company: "Equinor", email: "h.solberg@email.com" },
  ],
  metrics: [
    { value: "3.4×", label: "Platform growth" },
    { value: "€2.3M", label: "Revenue impact" },
    { value: "18", label: "Team led" },
    { value: "41%", label: "Fraud reduction" },
  ],
  achievements: [
    "Scaled an internal data platform to 4,000+ engineers, tripling weekly active users.",
    "Delivered €2.3M incremental annual revenue through a pricing experimentation programme.",
    "Built and led an 18-person cross-functional product organisation.",
  ],
  projects: [
    { name: "Self-Serve Analytics Suite", description: "Cut report turnaround from days to minutes for 4,000+ users.", tech: "BigQuery · dbt · Looker" },
    { name: "Trust & Safety Platform", description: "ML-assisted fraud detection reducing fraudulent listings 41%.", tech: "Python · Kafka · GCP" },
    { name: "Mobile Onboarding", description: "Re-architected KYC flow lifting completion 27% across three markets.", tech: "React Native · Node" },
  ],
  publications: [
    "Halvorsen, A. & Lien, M. (2023). “Opportunity-Solution Discovery at Scale.” Nordic Product Conference.",
    "Halvorsen, A. (2021). “Pricing Experimentation in Two-Sided Marketplaces.” Journal of Digital Commerce, 14(2).",
  ],
  languageLevels: [
    { language: "Norwegian", level: "Native" },
    { language: "English", level: "C2 — Fluent" },
    { language: "German", level: "B1 — Intermediate" },
    { language: "Swedish", level: "B2 — Working" },
  ],
  clearance: "Security clearance: SECRET (Norwegian NSM) — active",
  portfolio: "astridhalvorsen.design",
};
