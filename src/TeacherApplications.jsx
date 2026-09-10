import React,{useEffect,useState}from "react";

export default function TeacherApplications({sb,setMsg,onChanged}){
  const [rows,setRows]=useState([]);
  const [busy,setBusy]=useState("");

  const send=async(to,subject,html)=>{
    if(!to)return;
    const {error}=await sb.functions.invoke("send-surchobi-email",{body:{to,subject,html}});
    if(error)console.error(error);
  };

  const load=async()=>{
    const {data,error}=await sb
      .from("profiles")
      .select("id,full_name,email,requested_role,status,created_at,requested_course_id,courses:requested_course_id(name),teacher_course_requests(course_id,courses(name))")
      .eq("requested_role","teacher_pending")
      .eq("status","pending")
      .order("created_at",{ascending:false});

    if(error)setMsg?.(error.message);
    else setRows(data||[]);
  };

  useEffect(()=>{load()},[]);

  const decide=async(row,approved)=>{
    setBusy(row.id);
    const {error}=await sb.rpc(approved?"approve_teacher":"reject_teacher",{target_user_id:row.id});
    setBusy("");

    if(error)return setMsg?.(error.message);

    const name=row.full_name||"Teacher";
    const requested=(row.teacher_course_requests||[])
      .map(x=>x.courses?.name)
      .filter(Boolean);
    if(requested.length===0&&row.courses?.name)requested.push(row.courses.name);
    const subjects=requested.join(", ")||"your selected subject";

    if(approved){
      await send(
        row.email,
        "Your Surchobi Teacher Application Has Been Approved",
        `<h2>Congratulations, ${name}!</h2><p>Your application for <b>${subjects}</b> has been approved.</p><p>You can now log in to Surchobi Academy.</p>`
      );
    }else{
      await send(
        row.email,
        "Update on Your Surchobi Teacher Application",
        `<h2>Hello, ${name}</h2><p>Thank you for applying to Surchobi Academy. Your application was not approved at this time.</p>`
      );
    }

    setMsg?.(approved?"Teacher approved and notification email sent.":"Teacher application rejected and notification email sent.");
    await load();
    onChanged?.();
  };

  return <div className="dashboard-card manager-form teacher-applications">
    <p className="section-label">FACULTY MANAGEMENT</p>
    <h1>Pending Teacher Applications</h1>
    <p>Review teacher requests before granting teacher access.</p>
    <div className="manager-list">
      {rows.length===0
        ?<p>No pending teacher applications.</p>
        :rows.map(r=>{
          const subjects=(r.teacher_course_requests||[])
            .map(x=>x.courses?.name)
            .filter(Boolean);
          if(subjects.length===0&&r.courses?.name)subjects.push(r.courses.name);

          return <article key={r.id}>
            <div>
              <b>{r.full_name||"Unnamed applicant"}</b>
              <p>{r.email||"Email unavailable"}</p>
              <small>{subjects.join(", ")||"No subject selected"} · {new Date(r.created_at).toLocaleString()}</small>
            </div>
            <div className="review-admin-actions">
              <button disabled={!!busy} onClick={()=>decide(r,true)}>
                {busy===r.id?"Please wait...":"Approve"}
              </button>
              <button disabled={!!busy} onClick={()=>decide(r,false)}>Reject</button>
            </div>
          </article>;
        })}
    </div>
  </div>;
}