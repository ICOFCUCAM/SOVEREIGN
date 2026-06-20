import { School } from "lucide-react";
import SchoolStudioPage, { type SchoolStudioConfig } from "@/components/school/SchoolStudioPage";

const GRADES = ["Preschool", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9"];
const SUBJECTS = ["Mathematics", "English", "French", "Science", "Geography", "History"];

const config: SchoolStudioConfig = {
  badge: "Primary School Book Factory",
  icon: School,
  heading: <>Publish a <span className="text-gradient-gold italic">school textbook</span></>,
  blurb: "Pick a subject, grade and topic to produce a full set — textbook, workbook, teacher guide, exam and a matching marking guide. Add your country for curriculum context.",
  mode: "pack",
  previewLabel: "School book",
  fields: [
    { key: "subject", label: "Subject", type: "select", options: SUBJECTS, required: true },
    { key: "grade", label: "Grade", type: "select", options: GRADES, required: true },
    { key: "topic", label: "Topic / unit", placeholder: "e.g. Fractions", required: true },
    { key: "country", label: "Country / curriculum (optional)", placeholder: "e.g. United States", list: "country-options" },
    { key: "language", label: "Language (optional)", placeholder: "e.g. English" },
  ],
  parts: [
    { type: "textbook", label: "Textbook" },
    { type: "workbook", label: "Workbook" },
    { type: "teacher-guide", label: "Teacher guide" },
    { type: "exam", label: "Exam" },
    { type: "marking-guide", label: "Marking guide" },
  ],
};

const PrimaryBookFactory = () => <SchoolStudioPage config={config} />;
export default PrimaryBookFactory;
