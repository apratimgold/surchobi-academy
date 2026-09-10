import fs from "node:fs";

const src = fs.readFileSync("src/main.jsx", "utf8");
const migration = fs.readFileSync("supabase/migrations/202609100001_role_registration.sql", "utf8");

const requiredUi = [
  'const [accountType,setAccountType]=useState("student")',
  'requested_role:desiredRole',
  'accountType==="teacher"',
  'teacher_pending',
  'Register as'
];
const missingUi = requiredUi.filter(x => !src.includes(x));
if (missingUi.length) {
  console.error("Role registration UI checks failed:", missingUi.join(", "));
  process.exit(1);
}

const requiredDb = [
  "requested_role",
  "profiles_role_check",
  "sync_student_teacher_directory",
  "handle_new_user",
  "approve_teacher_application",
  "reject_teacher_application"
];
const missingDb = requiredDb.filter(x => !migration.includes(x));
if (missingDb.length) {
  console.error("Role registration migration checks failed:", missingDb.join(", "));
  process.exit(1);
}

console.log("Role registration checks passed.");
