import fs from "node:fs";

const src = fs.readFileSync("src/main.jsx", "utf8");
const required = [
  "function App", "function Auth", "function Dashboard",
  "function GalleryManager", "function HomeGallery",
  "function ProfilePhotoUploader", "function StudentLearning",
  "function TeacherBatches", "function AttendanceManager",
  "function EnrollmentManager", "function FeesManager"
];
const missing = required.filter(x => !src.includes(x));
if (missing.length) {
  console.error("Missing required application components:", missing.join(", "));
  process.exit(1);
}
const requiredTables = ["categories","courses","profiles","students","teachers","enrollments","attendance","notices","batches","fee_records","student_reviews","gallery_items"];
const missingTables = requiredTables.filter(t => !src.includes('sb.from("'+t+'")'));
if (missingTables.length) {
  console.error("Missing expected Supabase integration:", missingTables.join(", "));
  process.exit(1);
}
if (!src.includes('const GALLERY_BUCKET="gallery"')) {
  console.error("Gallery bucket configuration is missing.");
  process.exit(1);
}
console.log("Smoke test passed: core UI and Supabase integrations are present.");

const en = fs.readFileSync("src/i18n/en.js", "utf8");
const bn = fs.readFileSync("src/i18n/bn.js", "utf8");
if (!en.includes("export default") || !bn.includes("export default")) { console.error("i18n translation exports are missing."); process.exit(1); }
const i18nRequired = ["footer:", "reviews:", "gallery:", "websiteEditor:", "notices:", "fees:", "attendance:", "enrollment:", "management:"];
const missingI18n = i18nRequired.filter(k => !en.includes(k) || !bn.includes(k));
if (missingI18n.length) { console.error("Missing required i18n sections:", missingI18n.join(", ")); process.exit(1); }
if (!src.includes("useTranslation")) { console.error("Translation hook is missing."); process.exit(1); }
console.log("Smoke test passed: centralized English + Bengali i18n sections are present.");
