import React,{useEffect,useState}from "react";
import { sb } from "./supabaseClient";

export default function TeacherApplications({setMsg,onChanged}){
  const [rows,setRows]=useState([]),[busy,setBusy]=useState("");
  const load=async()=>{
    const {data,error}=await sb.from("profiles").select("id,full_name,email,requested_role,status,created_at").eq("requested_role","teacher_pending").eq("status","pending").order("created_at",{ascending:false});
    if(error) setMsg?.(error.message); else setRows(data||[]);
  };
  useEffect(()=>{load()},[]);
  const decide=async(id,approved)=>{
    setBusy(id);
    const {error}=await sb.rpc(approved?"approve_teacher":"reject_teacher",{target_user_id:id});
    setBusy("");
    if(error){setMsg?.(error.message);return}
    setMsg?.(approved?"Teacher approved successfully.":"Teacher application rejected.");
    await load(); onChanged?.();
  };
  return <div className="dashboard-card manager-form teacher-applications">
    <p className="section-label">FACULTY MANAGEMENT</p>
    <h1>Pending Teacher Applications</h1>
    <p>Review teacher requests before granting teacher access.</p>
    <div className="manager-list">
      {rows.length===0?<p>No pending teacher applications.</p>:rows.map(r=><article key={r.id}>
        <div><b>{r.full_name||"Unnamed applicant"}</b><p>{r.email||"Email available in Auth"}</p><small>{new Date(r.created_at).toLocaleString()}</small></div>
        <div className="review-admin-actions">
          <button disabled={!!busy} onClick={()=>decide(r.id,true)}>{busy===r.id?"Please wait...":"Approve"}</button>
          <button disabled={!!busy} onClick={()=>decide(r.id,false)}>Reject</button>
        </div>
      </article>)}
    </div>
  </div>;
}