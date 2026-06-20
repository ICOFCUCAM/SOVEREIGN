import { GraduationCap } from "lucide-react";
import SchoolStudioPage, { type SchoolStudioConfig } from "@/components/school/SchoolStudioPage";

const config: SchoolStudioConfig = {
  badge: "Curriculum Builder",
  icon: GraduationCap,
  heading: <>Plan a <span className="text-gradient-gold italic">term</span></>,
  blurb: "Country, grade, subject and term become a complete plan — scheme of work, weekly plan, a sample lesson plan, learning objectives and an assessment.",
  mode: "pack",
  previewLabel: "Curriculum",
  fields: [
    { key: "country", label: "Country / curriculum", placeholder: "e.g. Nigeria", required: true },
    { key: "grade", label: "Grade", placeholder: "e.g. Grade 5", required: true },
    { key: "subject", label: "Subject", placeholder: "e.g. Science", required: true },
    { key: "term", label: "Term", type: "select", options: ["Term 1", "Term 2", "Term 3"] },
    { key: "year", label: "Academic year (optional)", placeholder: "e.g. 2026/2027" },
    { key: "topic", label: "Focus / unit (optional)", placeholder: "e.g. Living things" },
  ],
  parts: [
    { type: "scheme-of-work", label: "Scheme of work" },
    { type: "weekly-plan", label: "Weekly plan" },
    { type: "lesson-plan", label: "Lesson plan" },
    { type: "learning-objectives", label: "Objectives" },
    { type: "assessment", label: "Assessment" },
  ],
};

const CurriculumBuilder = () => <SchoolStudioPage config={config} />;
export default CurriculumBuilder;
