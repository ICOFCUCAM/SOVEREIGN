import { NotebookPen } from "lucide-react";
import SchoolStudioPage, { type SchoolStudioConfig } from "@/components/school/SchoolStudioPage";

const config: SchoolStudioConfig = {
  badge: "Teacher Resource Center",
  icon: NotebookPen,
  heading: <>Teacher <span className="text-gradient-gold italic">resources</span></>,
  blurb: "One topic becomes a teacher's kit — lesson notes, a worksheet, a quiz, an exam and a matching marking guide.",
  mode: "pack",
  previewLabel: "Teacher resource",
  fields: [
    { key: "grade", label: "Grade / level", placeholder: "e.g. Grade 6", required: true },
    { key: "subject", label: "Subject", placeholder: "e.g. History", required: true },
    { key: "topic", label: "Topic", placeholder: "e.g. Ancient kingdoms", required: true },
    { key: "country", label: "Country / curriculum (optional)", placeholder: "e.g. United States", list: "country-options" },
  ],
  parts: [
    { type: "lesson-notes", label: "Lesson notes" },
    { type: "worksheet", label: "Worksheet" },
    { type: "quiz", label: "Quiz" },
    { type: "exam", label: "Exam" },
    { type: "marking-guide", label: "Marking guide" },
  ],
};

const TeacherResourceCenter = () => <SchoolStudioPage config={config} />;
export default TeacherResourceCenter;
