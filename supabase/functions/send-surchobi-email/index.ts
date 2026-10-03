import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("SURCHOBI_FROM_EMAIL") || "Surchobi Academy <onboarding@resend.dev>";

function escapeHtml(value=""){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (!RESEND_API_KEY) return Response.json({ error: "Email service is not configured" }, { status: 500 });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { data: adminProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role,status")
      .eq("id", user.id)
      .single();

    if (profileError || adminProfile?.role !== "admin" || adminProfile?.status !== "active") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { action, teacher_id, subjects } = body ?? {};
    if (!["teacher_approved", "teacher_rejected"].includes(action) || !teacher_id) {
      return Response.json({ error: "Invalid email action" }, { status: 400 });
    }

    const { data: teacher, error: teacherError } = await supabase
      .from("profiles")
      .select("email,full_name")
      .eq("id", teacher_id)
      .single();

    if (teacherError || !teacher?.email) {
      return Response.json({ error: "Teacher email not found" }, { status: 404 });
    }

    const name = escapeHtml(teacher.full_name || "Teacher");
    const subjectText = escapeHtml(subjects || "your selected course");
    const approved = action === "teacher_approved";
    const subject = approved
      ? "Your Surchobi Teacher Application Has Been Approved"
      : "Update on Your Surchobi Teacher Application";
    const html = approved
      ? `<h2>Congratulations, ${name}!</h2><p>Your application for <b>${subjectText}</b> has been approved.</p><p>You can now log in to Surchobi Academy.</p>`
      : `<h2>Hello, ${name}</h2><p>Thank you for applying to Surchobi Academy. Your application was not approved at this time.</p>`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from: FROM_EMAIL, to: [teacher.email], subject, html })
    });

    const data = await response.json();
    return Response.json(data, { status: response.ok ? 200 : response.status });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
});