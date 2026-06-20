import { ClipboardCheck } from "lucide-react";
import SchoolStudioPage, { type SchoolStudioConfig } from "@/components/school/SchoolStudioPage";

// Exam & Assessment Pack: a complete, coherent assessment kit for one topic.
// The marking guide is generated against the exam this run produces, so it
// always matches; the rubric and exam-prep round it out for the teacher.
const config: SchoolStudioConfig = {
  badge: "Exam & Assessment Pack",
  icon: ClipboardCheck,
  heading: <>Build a <span className="text-gradient-gold italic">complete assessment</span></>,
  blurb: "One topic becomes a full assessment kit — learning objectives, exam-prep, the exam itself, a matching marking guide and a grading rubric.",
  mode: "pack",
  previewLabel: "Assessment",
  fields: [
    { key: "grade", label: "Grade / level", placeholder: "e.g. Grade 8", required: true },
    { key: "subject", label: "Subject", placeholder: "e.g. Biology", required: true },
    { key: "topic", label: "Topic", placeholder: "e.g. The human digestive system", required: true },
    { key: "country", label: "Country / curriculum (optional)", placeholder: "e.g. United States", list: "country-options" },
    { key: "language", label: "Language (optional)", placeholder: "e.g. English" },
  ],
  parts: [
    { type: "learning-objectives", label: "Learning objectives" },
    { type: "exam-prep", label: "Exam prep" },
    { type: "exam", label: "Exam paper" },
    { type: "marking-guide", label: "Marking guide" },
    { type: "assessment", label: "Grading rubric" },
  ],
};

const ExamAssessmentPack = () => <SchoolStudioPage config={config} />;
export default ExamAssessmentPack;
