import { PencilRuler } from "lucide-react";
import SchoolStudioPage, { type SchoolStudioConfig } from "@/components/school/SchoolStudioPage";

const config: SchoolStudioConfig = {
  badge: "Workbook Generator",
  icon: PencilRuler,
  heading: <>Build a <span className="text-gradient-gold italic">workbook</span></>,
  blurb: "Practice, activity, revision, exam-prep or homework packs — pick the type and the exercise styles, and we’ll generate a printable workbook.",
  mode: "single",
  previewLabel: "Workbook",
  fields: [
    { key: "grade", label: "Grade / level", placeholder: "e.g. Grade 4" },
    { key: "subject", label: "Subject", placeholder: "e.g. Mathematics" },
    { key: "topic", label: "Topic", placeholder: "e.g. Multiplication", required: true },
    { key: "exerciseTypes", label: "Exercise types", type: "multiselect", options: ["Multiple choice", "Fill-in-the-blanks", "Matching", "Writing", "Problem solving", "True / false", "Short answer"] },
  ],
  parts: [
    { type: "workbook", label: "Practice book" },
    { type: "activity-book", label: "Activity book" },
    { type: "revision", label: "Revision book" },
    { type: "exam-prep", label: "Exam preparation" },
    { type: "homework-pack", label: "Homework pack" },
  ],
};

const WorkbookGenerator = () => <SchoolStudioPage config={config} />;
export default WorkbookGenerator;
