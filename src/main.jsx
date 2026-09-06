import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import "./style.css";

const sb = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

function App() {
  const [page, setPage] = useState("home");
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [cats, setCats] = useState([]);
  const [courses, setCourses] = useState([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "PASSWORD_RECOVERY") setPage("reset");
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function load() {
      const [a, b] = await Promise.all([
        sb.from("categories").select("*").order("name"),
        sb.from("courses").select("*").order("name")
      ]);
      setCats(a.data || []);
      setCourses(b.data || []);
    }
    load();
  }, []);

  useEffect(() => {
    if (!session) return setProfile(null);
    sb.from("profiles").select("*").eq("id", session.user.id).single()
      .then(({ data, error }) => {
        if (error) console.log(error);
        setProfile(data || null);
      });
  }, [session]);

  async function logout() {
    await sb.auth.signOut();
    setProfile(null);
    setPage("home");
    setMsg("Logged out successfully.");
  }

  return <>
    <header className="main-header">
      <button className="brand" onClick={() => setPage("home")}>
        <span className="brand-symbol">♫</span>
        <span><b>সুরছবি</b><small>SURCHOBI ACADEMY</small></span>
      </button>
      <nav className="main-nav">
        <button onClick={() => setPage("home")}>Home</button>
        <button onClick={() => setPage("about")}>About</button>
        <button onClick={() => setPage("courses")}>Courses</button>
        <button onClick={() => setPage("faculty")}>Faculty</button>
        {session && <button onClick={() => setPage("dash")}>Dashboard</button>}
      </nav>
      <div className="header-actions">
        {session
          ? <button className="login-button" onClick={logout}>Logout</button>
          : <button className="login-button" onClick={() => setPage("login")}>Login / Sign Up</button>}
      </div>
    </header>

    {page === "home" && <Home cats={cats} courses={courses} setPage={setPage} />}
    {page === "about" && <Simple title="Nurturing Creativity For A Brighter Tomorrow" text="SURCHOBI is a creative arts academy where passion meets discipline." />}
    {page === "courses" && <CoursesPage courses={courses} />}
    {page === "faculty" && <Faculty />}
    {page === "login" && <Auth mode="login" setPage={setPage} setMsg={setMsg} />}
    {page === "register" && <Auth mode="register" setPage={setPage} setMsg={setMsg} />}
    {page === "forgot" && <Forgot setPage={setPage} setMsg={setMsg} />}
    {page === "reset" && <Reset setPage={setPage} setMsg={setMsg} />}
    {page === "dash" && <Dashboard profile={profile} logout={logout} setMsg={setMsg} />}

    {msg && <div className="toast"><span>{msg}</span><button onClick={() => setMsg("")}>×</button></div>}
    {page !== "dash" && <Footer />}
  </>;
}

function Home({ cats, courses, setPage }) {
  const wanted = ["Music", "Dance", "Drawing", "Photography", "Yoga", "Others"];
  const sorted = [...cats].sort((a,b) => (wanted.indexOf(a.name) < 0 ? 99 : wanted.indexOf(a.name)) - (wanted.indexOf(b.name) < 0 ? 99 : wanted.indexOf(b.name)));
  return <>
    <section className="hero-modern">
      <div className="hero-content">
        <p className="hero-label">LEARN • CREATE • EXPRESS</p>
        <h1>Art Builds<br />a Kinder,<br />Brighter World</h1>
        <h2>Music. Dance. Photography. Visual Art. And More.</h2>
        <p className="hero-description">At Surchobi, we nurture creativity, discipline and self-expression through the arts.</p>
        <div className="hero-buttons">
          <button className="gold-button" onClick={() => setPage("courses")}>Explore Courses →</button>
          <button className="outline-button" onClick={() => setPage("about")}>About Us</button>
        </div>
      </div>
      <div className="hero-art"><div className="art-panel panel-1">MUSIC</div><div className="art-panel panel-2">DANCE</div><div className="art-panel panel-3">PHOTO</div><div className="art-panel panel-4">ART</div></div>
    </section>

    <section className="category-strip">
      {sorted.map((c) => (
        <div className="category-item" key={c.id}>
          <div className="category-icon">
            <CategoryIcon name={c.name} />
          </div>
          <h3>{c.name}</h3>
          <p>{c.description || "Explore creativity"}</p>
        </div>
      ))}
    </section>

    <section className="courses-section">
      <div className="section-heading"><div><p className="section-label">EXPLORE</p><h2>Our Courses</h2></div><button className="text-button" onClick={() => setPage("courses")}>View All Courses →</button></div>
      <div className="course-grid">
        {courses.slice(0,6).map(c => <article className="course-card" key={c.id}>
          <CourseImage course={c} />
          <div className="course-info"><h3>{c.name}</h3><p>{c.description || "Discover your creativity"}</p></div>
        </article>)}
      </div>
    </section>
  </>;
}

function courseImageUrl(course) {
  const key = `${course?.name || ""} ${course?.category || ""}`.toLowerCase();

  if (key.includes("dance")) return "https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?auto=format&fit=crop&w=1200&q=85";
  if (key.includes("drawing") || key.includes("sketch")) return "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=85";
  if (key.includes("drum")) return "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?auto=format&fit=crop&w=1200&q=85";
  if (key.includes("guitar")) return "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1200&q=85";
  if (key.includes("photo") || key.includes("camera")) return "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=85";
  if (key.includes("vocal") || key.includes("sing")) return "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=85";
  if (key.includes("yoga")) return "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=85";

  return "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=85";
}

function CourseImage({ course }) {
  return (
    <div
      className="course-image"
      style={{ backgroundImage: `url("${courseImageUrl(course)}")` }}
    >
      <div className="course-image-overlay" />
      <span>{course.category || "SURCHOBI"}</span>
    </div>
  );
}

function CategoryIcon({ name }) {
  const common = {
    viewBox: "0 0 64 64",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 3.2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true
  };
  const key = (name || "").trim().toLowerCase();

  if (key === "music") return <svg {...common}><path d="M23 48V17l25-6v31" /><circle cx="16" cy="48" r="7" /><circle cx="41" cy="42" r="7" /></svg>;

  if (key === "dance") return <svg {...common}><circle cx="28" cy="10" r="4" /><path d="M27 15c-2 8 2 13 9 17l12 2" /><path d="M28 17c-3 7-1 14 4 20l8 12" /><path d="M24 22c-2 8-7 13-15 17" /><path d="M25 37l-5 16" /><path d="M32 36l15 4" /></svg>;

  if (key === "drawing") return <svg {...common}><path d="M12 35c0-15 11-25 25-25 9 0 17 5 17 14 0 8-6 14-14 14h-5c-3 0-5 2-5 5 0 3-2 5-6 5-7 0-12-5-12-13Z" /><circle cx="25" cy="21" r="2.2" /><circle cx="35" cy="17" r="2.2" /><circle cx="45" cy="23" r="2.2" /><circle cx="21" cy="31" r="2.2" /><path d="M39 46 55 26l4 4-16 20-7 3Z" /><path d="m52 27 4 4" /></svg>;

  if (key === "photography") return <svg {...common}><path d="M8 21h12l4-7h16l4 7h12a4 4 0 0 1 4 4v25a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V25a4 4 0 0 1 4-4Z" /><circle cx="32" cy="38" r="10" /></svg>;

  if (key === "yoga") return <svg {...common}><path d="M32 55C18 55 9 47 7 37c9 0 15 4 20 10-5-8-7-17-4-28 7 4 11 11 12 20 1-9 5-16 12-20 3 11 1 20-4 28 5-6 11-10 20-10-2 10-11 18-25 18Z" /><path d="M32 55V39" /></svg>;

  return <svg {...common}><path d="M22 9l3 12 12 3-12 3-3 12-3-12-12-3 12-3 3-12Z" /><path d="M48 29l2 8 8 2-8 2-2 8-2-8-8-2 8-2 2-8Z" /></svg>;
}

function Simple({ title, text }) {
  return <section className="simple-page"><p className="section-label">OUR STORY</p><h1>{title}</h1><p>{text}</p></section>;
}

function CoursesPage({ courses }) {
  return <section className="simple-page"><p className="section-label">EXPLORE</p><h1>Our Courses</h1><div className="course-grid full-grid">
    {courses.map(c => <article className="course-card" key={c.id}><CourseImage course={c} /><div className="course-info"><h3>{c.name}</h3><p>{c.description}</p></div></article>)}
  </div></section>;
}

function Faculty() {
  const [teachers,setTeachers] = useState([]), [profiles,setProfiles] = useState([]);
  useEffect(() => { Promise.all([
    sb.from("teachers").select("*").eq("status","active"),
    sb.from("profiles").select("*").eq("role","teacher")
  ]).then(([a,b]) => {setTeachers(a.data||[]);setProfiles(b.data||[]);}); },[]);
  return <section className="simple-page"><p className="section-label">OUR PEOPLE</p><h1>Meet Our Faculty</h1><div className="management-list">
    {teachers.map(t => <div className="management-row" key={t.id}><div><b>{profiles.find(p=>p.id===t.id)?.full_name || "Teacher"}</b><small>{t.specialization}</small></div><span>{t.bio}</span></div>)}
  </div></section>;
}

function Auth({ mode,setPage,setMsg }) {
  const login=mode==="login";
  const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[name,setName]=useState(""),[phone,setPhone]=useState(""),[loading,setLoading]=useState(false);
  async function submit(e){
    e.preventDefault();setLoading(true);
    if(login){
      const {error}=await sb.auth.signInWithPassword({email,password});
      setLoading(false);if(error)return setMsg(error.message);setPage("dash");return;
    }
    const {data,error}=await sb.auth.signUp({email,password,options:{data:{full_name:name,phone}}});
    if(error){setLoading(false);return setMsg(error.message);}
    if(data.user){
      const {error:pe}=await sb.from("profiles").upsert({id:data.user.id,full_name:name,phone,role:"student"});
      if(!pe) await sb.from("students").upsert({id:data.user.id,status:"pending"});
    }
    setLoading(false);setMsg("Registration successful. Check your email if confirmation is enabled.");setPage("login");
  }
  return <section className="auth-page"><div className="auth-panel"><form className="auth-form" onSubmit={submit}>
    <h1>{login?"Welcome Back":"Begin Your Journey"}</h1>
    {!login && <><input placeholder="Full Name" value={name} onChange={e=>setName(e.target.value)} required/><input placeholder="Phone Number" value={phone} onChange={e=>setPhone(e.target.value)}/></>}
    <input type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} required/>
    <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required/>
    {login && <button type="button" className="forgot-button" onClick={()=>setPage("forgot")}>Forgot Password?</button>}
    <button className="gold-button auth-submit">{loading?"Please wait...":login?"Login":"Create Account"}</button>
    <p className="auth-switch">{login?"Don't have an account?":"Already have an account?"}<button type="button" onClick={()=>setPage(login?"register":"login")}>{login?" Sign Up":" Login"}</button></p>
  </form></div></section>;
}

function Forgot({setPage,setMsg}){
  const [email,setEmail]=useState("");
  async function submit(e){e.preventDefault();const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin});if(error)return setMsg(error.message);setMsg("Reset link sent.");setPage("login");}
  return <section className="auth-page"><div className="auth-panel"><form className="auth-form" onSubmit={submit}><h1>Forgot Password?</h1><input type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} required/><button className="gold-button">Send Reset Link</button><button type="button" className="back-button" onClick={()=>setPage("login")}>← Back to Login</button></form></div></section>;
}

function Reset({setPage,setMsg}){
  const [a,setA]=useState(""),[b,setB]=useState("");
  async function submit(e){e.preventDefault();if(a!==b)return setMsg("Passwords do not match.");const {error}=await sb.auth.updateUser({password:a});if(error)return setMsg(error.message);setMsg("Password updated.");setPage("login");}
  return <section className="auth-page"><div className="auth-panel"><form className="auth-form" onSubmit={submit}><h1>Create New Password</h1><input type="password" placeholder="New password" value={a} onChange={e=>setA(e.target.value)} required/><input type="password" placeholder="Confirm password" value={b} onChange={e=>setB(e.target.value)} required/><button className="gold-button">Update Password</button></form></div></section>;
}

function Dashboard({profile,logout,setMsg}){
  const [view,setView]=useState("dashboard");
  if(!profile)return <div className="loading-page">Loading dashboard...</div>;
  if(profile.role==="student")return <StudentDash profile={profile} logout={logout}/>;
  const menu=[["dashboard","⌂","Dashboard"],["students","♙","Students"],["teachers","♧","Teachers"],["courses","▤","Courses"],["batches","◫","Batches"],["attendance","▦","Attendance"],["fees","▣","Fees & Payments"],["notices","♢","Notices"],["events","▧","Events"]];
  return <div className="dashboard-layout">
    <aside className="dashboard-sidebar"><div className="dashboard-logo"><span>♫</span><div><b>সুরছবি</b><small>CREATIVE ARTS</small></div></div>
      <div className="sidebar-menu">{menu.map(x=><button key={x[0]} className={view===x[0]?"active":""} onClick={()=>setView(x[0])}><span>{x[1]}</span>{x[2]}</button>)}</div>
      <div className="sidebar-bottom"><p>Different Arts.<br/>One Soul.</p><button onClick={logout}>↪ Logout</button></div>
    </aside>
    <main className="dashboard-main">
      <div className="dashboard-topbar"><p>“Art Builds a Kinder, Brighter World”</p><div className="profile-mini"><span>{profile.full_name?.[0]?.toUpperCase()}</span><div><b>{profile.full_name}</b><small>{profile.role}</small></div></div></div>
      {view==="dashboard"&&<Overview profile={profile} go={setView} setMsg={setMsg}/>}
      {view==="students"&&<Students setMsg={setMsg}/>}
      {view==="teachers"&&<Teachers setMsg={setMsg}/>}
      {view==="courses"&&<Courses setMsg={setMsg}/>}
      {view==="batches"&&<Batches setMsg={setMsg}/>}
      {view==="attendance"&&<Attendance setMsg={setMsg}/>}
      {view==="fees"&&<Fees setMsg={setMsg}/>}
      {view==="notices"&&<Notices profile={profile} setMsg={setMsg}/>}
      {view==="events"&&<section className="manager-page"><h1>Events</h1><p>Your database currently has no events table. Create one before events can be saved.</p></section>}
    </main>
  </div>;
}

function Overview({profile,go,setMsg}){
  const [data,setData]=useState({students:0,teachers:0,courses:0,batches:0,pending:[]});
  async function load(){
    const [s,t,c,b,p,pr]=await Promise.all([
      sb.from("students").select("id",{count:"exact",head:true}),
      sb.from("profiles").select("id",{count:"exact",head:true}).eq("role","teacher"),
      sb.from("courses").select("id",{count:"exact",head:true}),
      sb.from("batches").select("id",{count:"exact",head:true}),
      sb.from("students").select("*").eq("status","pending"),
      sb.from("profiles").select("id,full_name,phone")
    ]);
    const ps=pr.data||[];
    setData({students:s.count||0,teachers:t.count||0,courses:c.count||0,batches:b.count||0,pending:(p.data||[]).map(x=>({...x,profile:ps.find(q=>q.id===x.id)}))});
  }
  useEffect(()=>{load();},[]);
  async function approve(id){const {error}=await sb.from("students").update({status:"active"}).eq("id",id);if(error)return setMsg(error.message);setMsg("Student approved.");load();}
  return <>
    <section className="dashboard-welcome"><div><h1>Welcome back, {profile.full_name}!</h1><p>Manage your academy, nurture talent, and keep the arts alive.</p></div><div className="welcome-art">Creativity<br/>changes lives</div></section>
    <section className="stats-grid"><Stat icon="👥" n={data.students} l="Total Students"/><Stat icon="🎓" n={data.teachers} l="Total Teachers"/><Stat icon="▤" n={data.courses} l="Active Courses"/><Stat icon="◫" n={data.batches} l="Total Batches"/></section>
    <section className="dashboard-content-grid">
      <div className="dashboard-card pending-card"><div className="card-title"><h2>📋 Pending Student Approvals <span>{data.pending.length}</span></h2><button onClick={()=>go("students")}>View All →</button></div>
        {!data.pending.length?<div className="empty-state">🎉<p>No students are waiting for approval.</p></div>:data.pending.map(s=><div className="pending-row" key={s.id}><div className="student-avatar">{s.profile?.full_name?.[0]?.toUpperCase()||"S"}</div><div className="student-info"><b>{s.profile?.full_name||"Unknown Student"}</b><small>{s.profile?.phone||"No phone number"}</small></div><span className="pending-badge">Pending</span><button className="approve-button" onClick={()=>approve(s.id)}>✓ Approve</button></div>)}
      </div>
      <div className="dashboard-card quick-card"><h2>⚡ Quick Actions</h2>
        <button onClick={()=>go("students")}>👤 Add New Student <span>→</span></button><button onClick={()=>go("teachers")}>♧ Add New Teacher <span>→</span></button><button onClick={()=>go("courses")}>▤ Create New Course <span>→</span></button><button onClick={()=>go("batches")}>◫ Create New Batch <span>→</span></button><button onClick={()=>go("notices")}>📢 Send Notice <span>→</span></button>
      </div>
    </section>
  </>;
}

function Stat({icon,n,l}){return <div className="stat-card"><div className="stat-icon">{icon}</div><div><h2>{n}</h2><p>{l}</p></div></div>;}
function Header({title,text}){return <div className="manager-header"><h1>{title}</h1>{text&&<p>{text}</p>}</div>;}
function List({children}){return <div className="management-list">{children}</div>;}

function Students({setMsg}){
  const [rows,setRows]=useState([]),[profiles,setProfiles]=useState([]),[q,setQ]=useState("");
  async function load(){const [s,p]=await Promise.all([sb.from("students").select("*").order("created_at",{ascending:false}),sb.from("profiles").select("*").eq("role","student")]);setRows(s.data||[]);setProfiles(p.data||[]);}
  useEffect(()=>{load();},[]);
  async function approve(id){const {error}=await sb.from("students").update({status:"active"}).eq("id",id);if(error)return setMsg(error.message);setMsg("Student approved.");load();}
  async function code(id,student_code){const v=prompt("Student code:",student_code||"");if(v===null)return;const {error}=await sb.from("students").update({student_code:v}).eq("id",id);if(error)return setMsg(error.message);setMsg("Student code saved.");load();}
  const filtered=rows.filter(s=>{const p=profiles.find(x=>x.id===s.id);return `${p?.full_name||""} ${p?.phone||""} ${s.student_code||""}`.toLowerCase().includes(q.toLowerCase());});
  return <section className="manager-page"><Header title="Students" text="Approve and manage registered students."/><input className="manager-search" placeholder="Search student..." value={q} onChange={e=>setQ(e.target.value)}/><List>{filtered.map(s=>{const p=profiles.find(x=>x.id===s.id);return <div className="management-row" key={s.id}><div><b>{p?.full_name||"Unknown Student"}</b><small>{p?.phone||"No phone"} • Code: {s.student_code||"Not assigned"}</small></div><span>{s.status}</span>{s.status!=="active"&&<button className="approve-button" onClick={()=>approve(s.id)}>Approve</button>}<button onClick={()=>code(s.id,s.student_code)}>Student Code</button></div>;})}{!filtered.length&&<p>No students found.</p>}</List></section>;
}

function Teachers({setMsg}){
  const [rows,setRows]=useState([]);
  const [profiles,setProfiles]=useState([]);
  const [form,setForm]=useState({profile_id:"",specialization:"",bio:"",status:"active"});
  const [saving,setSaving]=useState(false);

  async function load(){
    const [teacherResult,profileResult]=await Promise.all([
      sb.from("teachers").select("*").order("created_at",{ascending:false}),
      sb.from("profiles").select("*").order("full_name")
    ]);

    if(teacherResult.error) setMsg(teacherResult.error.message);
    if(profileResult.error) setMsg(profileResult.error.message);

    setRows(teacherResult.data||[]);
    setProfiles(profileResult.data||[]);
  }

  useEffect(()=>{load();},[]);

  const teacherIds=rows.map(x=>x.id);

  const availableProfiles=profiles.filter(
    p=>p.role!=="teacher" && !teacherIds.includes(p.id)
  );

  async function save(e){
    e.preventDefault();

    if(!form.profile_id){
      return setMsg("Please select a registered user.");
    }

    setSaving(true);

    // 1. Promote the selected registered user to Teacher.
    const {error:profileError}=await sb
      .from("profiles")
      .update({role:"teacher"})
      .eq("id",form.profile_id);

    if(profileError){
      setSaving(false);
      return setMsg(`Could not update role: ${profileError.message}`);
    }

    // 2. Create the teacher details record using the same UUID automatically.
    const {error:teacherError}=await sb
      .from("teachers")
      .insert({
        id:form.profile_id,
        specialization:form.specialization.trim()||null,
        bio:form.bio.trim()||null,
        status:form.status
      });

    if(teacherError){
      // Roll back the role if the teacher record could not be created.
      await sb.from("profiles").update({role:"student"}).eq("id",form.profile_id);
      setSaving(false);
      return setMsg(`Could not create teacher: ${teacherError.message}`);
    }

    setSaving(false);
    setMsg("Teacher added successfully!");
    setForm({profile_id:"",specialization:"",bio:"",status:"active"});
    load();
  }

  async function del(id,name){
    if(!confirm(`Remove ${name||"this teacher"} from Teachers?`)) return;

    const {error}=await sb.from("teachers").delete().eq("id",id);

    if(error) return setMsg(error.message);

    await sb.from("profiles").update({role:"student"}).eq("id",id);

    setMsg("Teacher removed successfully.");
    load();
  }

  return <section className="manager-page">
    <Header
      title="Teachers"
      text="Promote registered users to teachers and manage faculty details."
    />

    <form className="manager-form teacher-form" onSubmit={save}>

      <select
        value={form.profile_id}
        onChange={e=>setForm({...form,profile_id:e.target.value})}
        required
      >
        <option value="">Select a registered user</option>

        {availableProfiles.map(p=>(
          <option key={p.id} value={p.id}>
            {p.full_name} {p.phone?`(${p.phone})`:""}
          </option>
        ))}

      </select>

      <input
        placeholder="Specialization (e.g. Classical Music)"
        value={form.specialization}
        onChange={e=>setForm({...form,specialization:e.target.value})}
      />

      <input
        placeholder="Short bio"
        value={form.bio}
        onChange={e=>setForm({...form,bio:e.target.value})}
      />

      <select
        value={form.status}
        onChange={e=>setForm({...form,status:e.target.value})}
      >
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      <button className="gold-button" disabled={saving}>
        {saving?"Adding Teacher...":"+ Add Teacher"}
      </button>

    </form>

    <p className="manager-note">
      Select a registered user. The dashboard automatically changes the role to Teacher and creates the teacher record. No UUID or SQL is needed.
    </p>

    {!availableProfiles.length && (
      <p className="manager-note">
        No available registered users found. The person must first create a normal account using Sign Up.
      </p>
    )}

    <List>
      {rows.map(teacher=>{
        const p=profiles.find(x=>x.id===teacher.id);

        return <div className="management-row" key={teacher.id}>
          <div>
            <b>{p?.full_name||"Teacher"}</b>

            <small>
              {teacher.specialization||"No specialization"}
              {p?.phone?` • ${p.phone}`:""}
              {teacher.bio?` • ${teacher.bio}`:""}
            </small>
          </div>

          <span>{teacher.status}</span>

          <button onClick={()=>del(teacher.id,p?.full_name)}>
            Remove
          </button>
        </div>;
      })}

      {!rows.length&&<p>No teachers added yet.</p>}
    </List>
  </section>;
}

function Courses({setMsg}){
  const [rows,setRows]=useState([]),[cats,setCats]=useState([]),[f,setF]=useState({name:"",category:"",category_id:"",description:""});
  async function load(){const [c,a]=await Promise.all([sb.from("courses").select("*").order("name"),sb.from("categories").select("*").order("name")]);setRows(c.data||[]);setCats(a.data||[]);}
  useEffect(()=>{load();},[]);
  async function save(e){e.preventDefault();const cat=cats.find(x=>x.id===f.category_id);const {error}=await sb.from("courses").insert({name:f.name,category:cat?.name||f.category,category_id:f.category_id||null,description:f.description||null});if(error)return setMsg(error.message);setMsg("Course created.");setF({name:"",category:"",category_id:"",description:""});load();}
  async function del(id){if(!confirm("Delete course?"))return;const {error}=await sb.from("courses").delete().eq("id",id);if(error)return setMsg(error.message);load();}
  return <section className="manager-page"><Header title="Courses"/><form className="manager-form" onSubmit={save}><input placeholder="Course name" value={f.name} onChange={e=>setF({...f,name:e.target.value})} required/><select value={f.category_id} onChange={e=>setF({...f,category_id:e.target.value})}><option value="">Select category</option>{cats.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select><input placeholder="Or type category" value={f.category} onChange={e=>setF({...f,category:e.target.value})}/><input placeholder="Description" value={f.description} onChange={e=>setF({...f,description:e.target.value})}/><button className="gold-button">Create Course</button></form><List>{rows.map(c=><div className="management-row" key={c.id}><div><b>{c.name}</b><small>{c.description}</small></div><span>{c.category}</span><button onClick={()=>del(c.id)}>Delete</button></div>)}</List></section>;
}

function Batches({setMsg}){
  const [rows,setRows]=useState([]),[courses,setCourses]=useState([]),[teachers,setTeachers]=useState([]),[profiles,setProfiles]=useState([]),[f,setF]=useState({name:"",course_id:"",teacher_id:"",schedule:""});
  async function load(){const [b,c,t,p]=await Promise.all([sb.from("batches").select("*"),sb.from("courses").select("*"),sb.from("teachers").select("*").eq("status","active"),sb.from("profiles").select("*")]);setRows(b.data||[]);setCourses(c.data||[]);setTeachers(t.data||[]);setProfiles(p.data||[]);}
  useEffect(()=>{load();},[]);
  async function save(e){e.preventDefault();const {error}=await sb.from("batches").insert({name:f.name,course_id:f.course_id||null,teacher_id:f.teacher_id||null,schedule:f.schedule||null});if(error)return setMsg(error.message);setMsg("Batch created.");setF({name:"",course_id:"",teacher_id:"",schedule:""});load();}
  async function del(id){if(!confirm("Delete batch?"))return;const {error}=await sb.from("batches").delete().eq("id",id);if(error)return setMsg(error.message);load();}
  return <section className="manager-page"><Header title="Batches"/><form className="manager-form" onSubmit={save}><input placeholder="Batch name" value={f.name} onChange={e=>setF({...f,name:e.target.value})} required/><select value={f.course_id} onChange={e=>setF({...f,course_id:e.target.value})}><option value="">Select course</option>{courses.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select><select value={f.teacher_id} onChange={e=>setF({...f,teacher_id:e.target.value})}><option value="">Select teacher</option>{teachers.map(x=><option key={x.id} value={x.id}>{profiles.find(p=>p.id===x.id)?.full_name||x.id}</option>)}</select><input placeholder="Schedule" value={f.schedule} onChange={e=>setF({...f,schedule:e.target.value})}/><button className="gold-button">Create Batch</button></form><List>{rows.map(b=><div className="management-row" key={b.id}><div><b>{b.name}</b><small>{courses.find(c=>c.id===b.course_id)?.name||"No course"} • {profiles.find(p=>p.id===b.teacher_id)?.full_name||"No teacher"}</small></div><span>{b.schedule}</span><button onClick={()=>del(b.id)}>Delete</button></div>)}</List></section>;
}

function Attendance({setMsg}){
  const [students,setStudents]=useState([]),[profiles,setProfiles]=useState([]),[batches,setBatches]=useState([]),[records,setRecords]=useState([]),[f,setF]=useState({student_id:"",batch_id:"",attendance_date:new Date().toISOString().slice(0,10),status:"present"});
  async function load(){const [s,p,b,a]=await Promise.all([sb.from("students").select("*").eq("status","active"),sb.from("profiles").select("*"),sb.from("batches").select("*"),sb.from("attendance").select("*").order("attendance_date",{ascending:false}).limit(50)]);setStudents(s.data||[]);setProfiles(p.data||[]);setBatches(b.data||[]);setRecords(a.data||[]);}
  useEffect(()=>{load();},[]);
  async function save(e){e.preventDefault();const {error}=await sb.from("attendance").insert({...f,batch_id:f.batch_id||null});if(error)return setMsg(error.message);setMsg("Attendance marked.");load();}
  return <section className="manager-page"><Header title="Attendance"/><form className="manager-form" onSubmit={save}><select value={f.student_id} onChange={e=>setF({...f,student_id:e.target.value})} required><option value="">Select student</option>{students.map(x=><option key={x.id} value={x.id}>{profiles.find(p=>p.id===x.id)?.full_name||x.id}</option>)}</select><select value={f.batch_id} onChange={e=>setF({...f,batch_id:e.target.value})}><option value="">Select batch</option>{batches.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select><input type="date" value={f.attendance_date} onChange={e=>setF({...f,attendance_date:e.target.value})}/><select value={f.status} onChange={e=>setF({...f,status:e.target.value})}><option>present</option><option>absent</option><option>late</option></select><button className="gold-button">Mark Attendance</button></form><List>{records.map(r=><div className="management-row" key={r.id}><div><b>{profiles.find(p=>p.id===r.student_id)?.full_name||"Student"}</b><small>{batches.find(b=>b.id===r.batch_id)?.name||"No batch"}</small></div><span>{r.attendance_date}</span><span>{r.status}</span></div>)}</List></section>;
}

function Fees({setMsg}){
  const [students,setStudents]=useState([]),[profiles,setProfiles]=useState([]),[rows,setRows]=useState([]),[f,setF]=useState({student_id:"",month:new Date().toISOString().slice(0,10),amount:"",status:"not_paid"});
  async function load(){const [s,p,r]=await Promise.all([sb.from("students").select("*"),sb.from("profiles").select("*"),sb.from("fee_records").select("*").order("updated_at",{ascending:false}).limit(50)]);setStudents(s.data||[]);setProfiles(p.data||[]);setRows(r.data||[]);}
  useEffect(()=>{load();},[]);
  async function save(e){e.preventDefault();const {error}=await sb.from("fee_records").insert({student_id:f.student_id,month:f.month||null,amount:Number(f.amount),status:f.status});if(error)return setMsg(error.message);setMsg("Fee record saved.");load();}
  return <section className="manager-page"><Header title="Fees & Payments"/><form className="manager-form" onSubmit={save}><select value={f.student_id} onChange={e=>setF({...f,student_id:e.target.value})} required><option value="">Select student</option>{students.map(x=><option key={x.id} value={x.id}>{profiles.find(p=>p.id===x.id)?.full_name||x.id}</option>)}</select><input type="date" value={f.month} onChange={e=>setF({...f,month:e.target.value})}/><input type="number" placeholder="Amount" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})} required/><select value={f.status} onChange={e=>setF({...f,status:e.target.value})}><option>not_paid</option><option>paid</option><option>partial</option></select><button className="gold-button">Save Fee</button></form><List>{rows.map(r=><div className="management-row" key={r.id}><div><b>{profiles.find(p=>p.id===r.student_id)?.full_name||"Student"}</b><small>{r.month}</small></div><span>₹ {r.amount}</span><span>{r.status}</span></div>)}</List></section>;
}

function Notices({profile,setMsg}){
  const [rows,setRows]=useState([]),[title,setTitle]=useState(""),[content,setContent]=useState("");
  async function load(){const {data}=await sb.from("notices").select("*").order("created_at",{ascending:false});setRows(data||[]);}
  useEffect(()=>{load();},[]);
  async function save(e){e.preventDefault();const {error}=await sb.from("notices").insert({title,content,created_by:profile.id});if(error)return setMsg(error.message);setTitle("");setContent("");setMsg("Notice published.");load();}
  async function del(id){if(!confirm("Delete notice?"))return;const {error}=await sb.from("notices").delete().eq("id",id);if(error)return setMsg(error.message);load();}
  return <section className="manager-page"><Header title="Notices"/><form className="manager-form notice-form" onSubmit={save}><input placeholder="Notice title" value={title} onChange={e=>setTitle(e.target.value)} required/><textarea placeholder="Write notice..." value={content} onChange={e=>setContent(e.target.value)} required/><button className="gold-button">Publish Notice</button></form><List>{rows.map(n=><div className="management-row notice-row" key={n.id}><div><b>{n.title}</b><small>{n.content}</small></div><span>{new Date(n.created_at).toLocaleDateString()}</span><button onClick={()=>del(n.id)}>Delete</button></div>)}</List></section>;
}

function StudentDash({profile,logout}){
  const [view,setView]=useState("dashboard"),[student,setStudent]=useState(null),[attendance,setAttendance]=useState([]),[fees,setFees]=useState([]),[notices,setNotices]=useState([]);
  useEffect(()=>{Promise.all([sb.from("students").select("*").eq("id",profile.id).single(),sb.from("attendance").select("*").eq("student_id",profile.id).order("attendance_date",{ascending:false}),sb.from("fee_records").select("*").eq("student_id",profile.id),sb.from("notices").select("*").order("created_at",{ascending:false})]).then(([s,a,f,n])=>{setStudent(s.data);setAttendance(a.data||[]);setFees(f.data||[]);setNotices(n.data||[]);});},[profile]);
  const menu=[["dashboard","Dashboard"],["profile","My Profile"],["attendance","Attendance"],["fees","Fees"],["notices","Notices"]];
  return <div className="dashboard-layout"><aside className="dashboard-sidebar"><div className="dashboard-logo"><span>♫</span><div><b>সুরছবি</b><small>STUDENT PORTAL</small></div></div><div className="sidebar-menu">{menu.map(x=><button key={x[0]} className={view===x[0]?"active":""} onClick={()=>setView(x[0])}>{x[1]}</button>)}</div><div className="sidebar-bottom"><button onClick={logout}>↪ Logout</button></div></aside><main className="dashboard-main">
    {view==="dashboard"&&<><section className="dashboard-welcome student-welcome"><div><p className="section-label">STUDENT PORTAL</p><h1>Welcome, {profile.full_name}!</h1><p>Continue your creative journey with SURCHOBI.</p></div></section><section className="student-status-grid"><div className="dashboard-card"><h3>Status</h3><h2>{student?.status==="active"?"✓ Approved":"⏳ Pending"}</h2></div><div className="dashboard-card"><h3>Student Code</h3><h2>{student?.student_code||"Not assigned"}</h2></div><div className="dashboard-card"><h3>Attendance Records</h3><h2>{attendance.length}</h2></div></section></>}
    {view==="profile"&&<section className="manager-page"><Header title="My Profile"/><div className="dashboard-card"><h2>{profile.full_name}</h2><p>{profile.phone||"No phone number"}</p></div></section>}
    {view==="attendance"&&<section className="manager-page"><Header title="My Attendance"/><List>{attendance.map(x=><div className="management-row" key={x.id}><b>{x.attendance_date}</b><span>{x.status}</span></div>)}</List></section>}
    {view==="fees"&&<section className="manager-page"><Header title="My Fees"/><List>{fees.map(x=><div className="management-row" key={x.id}><b>₹ {x.amount}</b><span>{x.status}</span></div>)}</List></section>}
    {view==="notices"&&<section className="manager-page"><Header title="Notices"/><List>{notices.map(x=><div className="management-row notice-row" key={x.id}><div><b>{x.title}</b><small>{x.content}</small></div></div>)}</List></section>}
  </main></div>;
}

function Footer(){return <footer className="modern-footer"><div className="footer-brand"><h2>♫ সুরছবি</h2><p>SURCHOBI ACADEMY</p><span>Learn • Create • Express</span></div><div><h4>Contact Us</h4><p>Kolkata, West Bengal, India</p></div><div className="footer-bottom">© 2026 Surchobi Academy. All rights reserved.</div></footer>;}

createRoot(document.getElementById("root")).render(<App />);
