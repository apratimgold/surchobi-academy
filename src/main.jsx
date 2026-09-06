import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import "./style.css";

const sb = createClient(
  import.meta.env.VITE_SUPABASE_URL ||
    "https://placeholder.supabase.co",
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    "placeholder"
);

const tx = {
  en: {
    home: "Home",
    about: "About",
    courses: "Courses",
    login: "Login",
    register: "Register",
    logout: "Logout",
    welcome: "Where creativity finds its rhythm.",
    explore: "Explore Courses",
    world: "Our Creative World",
    email: "Email",
    password: "Password",
    name: "Full Name",
    phone: "Phone",
    pending: "Your registration is awaiting approval."
  },

  bn: {
    home: "হোম",
    about: "আমাদের সম্পর্কে",
    courses: "কোর্সসমূহ",
    login: "লগইন",
    register: "নিবন্ধন",
    logout: "লগআউট",
    welcome: "যেখানে সৃজনশীলতা খুঁজে পায় তার নিজস্ব ছন্দ।",
    explore: "কোর্স দেখুন",
    world: "আমাদের সৃজনশীল জগৎ",
    email: "ইমেল",
    password: "পাসওয়ার্ড",
    name: "পূর্ণ নাম",
    phone: "ফোন",
    pending: "আপনার নিবন্ধন অনুমোদনের অপেক্ষায় আছে।"
  }
};

function App() {
  const [lang, setLang] = useState("en");
  const [page, setPage] = useState("home");

  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  const [cats, setCats] = useState([]);
  const [courses, setCourses] = useState([]);

  const [msg, setMsg] = useState("");

  const t = tx[lang];

  // =========================
  // AUTH SESSION
  // =========================

  useEffect(() => {
    async function getSession() {
      const {
        data: { session }
      } = await sb.auth.getSession();

      setSession(session);
    }

    getSession();

    const {
      data: { subscription }
    } = sb.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // =========================
  // LOAD CATEGORIES & COURSES
  // =========================

  useEffect(() => {
    async function loadData() {
      const [categoriesResult, coursesResult] =
        await Promise.all([
          sb
            .from("categories")
            .select("*")
            .order("name"),

          sb
            .from("courses")
            .select("*, categories(name)")
            .order("name")
        ]);

      if (categoriesResult.error) {
        console.error(
          "Categories error:",
          categoriesResult.error
        );
      } else {
        setCats(categoriesResult.data || []);
      }

      if (coursesResult.error) {
        console.error(
          "Courses error:",
          coursesResult.error
        );
      } else {
        setCourses(coursesResult.data || []);
      }
    }

    loadData();
  }, []);

  // =========================
  // LOAD PROFILE
  // =========================

  useEffect(() => {
    if (!session) {
      setProfile(null);
      return;
    }

    async function loadProfile() {
      const { data, error } = await sb
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Profile error:", error);
        setProfile(null);
        return;
      }

      console.log("Logged in profile:", data);

      setProfile(data);
    }

    loadProfile();
  }, [session]);

  // =========================
  // LOGOUT
  // =========================

  async function signout() {
    await sb.auth.signOut();

    setSession(null);
    setProfile(null);

    setPage("home");
  }

  return (
    <>
      {/* HEADER */}

      <header>
        <button
          className="brand"
          onClick={() => setPage("home")}
        >
          <b>সুরছবি</b>

          <small>
            SURCHOBI ACADEMY
          </small>
        </button>

        <nav>
          {["home", "about", "courses"].map(
            (x) => (
              <button
                key={x}
                onClick={() => setPage(x)}
              >
                {t[x]}
              </button>
            )
          )}

          {session ? (
            <>
              <button
                onClick={() => setPage("dash")}
              >
                Dashboard
              </button>

              <button onClick={signout}>
                {t.logout}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setPage("login")}
              >
                {t.login}
              </button>

              <button
                className="gold"
                onClick={() =>
                  setPage("register")
                }
              >
                {t.register}
              </button>
            </>
          )}
        </nav>

        <button
          className="lang"
          onClick={() =>
            setLang(
              lang === "en"
                ? "bn"
                : "en"
            )
          }
        >
          {lang === "en"
            ? "বাংলা"
            : "English"}
        </button>
      </header>

      {/* HOME */}

      {page === "home" && (
        <>
          <section className="hero">
            <div>
              <p className="eyebrow">
                CREATIVE ACADEMY · KOLKATA
              </p>

              <h1>সুরছবি</h1>

              <h2>
                SURCHOBI ACADEMY
              </h2>

              <p>{t.welcome}</p>

              <button
                className="gold big"
                onClick={() =>
                  setPage("courses")
                }
              >
                {t.explore}
              </button>
            </div>

            <div className="art">
              ♫
              <i>◉</i>
              <em>✦</em>
            </div>
          </section>

          <section className="section">
            <h2>{t.world}</h2>

            <div className="cards">
              {cats.map((c, i) => (
                <article
                  className="card"
                  key={c.id}
                >
                  <div className="icon">
                    {
                      [
                        "♫",
                        "◈",
                        "◉",
                        "✎",
                        "☾",
                        "✦"
                      ][i % 6]
                    }
                  </div>

                  <h3>{c.name}</h3>

                  <p>
                    {c.description}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      {/* ABOUT */}

      {page === "about" && (
        <section className="page">
          <h1>
            {lang === "en"
              ? "About SURCHOBI"
              : "সুরছবি সম্পর্কে"}
          </h1>

          <p>
            {lang === "en"
              ? "SURCHOBI brings music, dance, photography, drawing and yoga under one creative roof."
              : "সঙ্গীত, নৃত্য, ফটোগ্রাফি, অঙ্কন ও যোগের এক সৃজনশীল ঠিকানা সুরছবি।"}
          </p>
        </section>
      )}

      {/* COURSES */}

      {page === "courses" && (
        <section className="page">
          <h1>{t.courses}</h1>

          <div className="cards">
            {courses.map((c) => (
              <article
                className="card"
                key={c.id}
              >
                <h3>{c.name}</h3>

                <p>{c.description}</p>

                <small>
                  {c.categories?.name}
                </small>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* LOGIN */}

      {page === "login" && (
        <Auth
          t={t}
          login={true}
          register={false}
          setPage={setPage}
          setMsg={setMsg}
        />
      )}

      {/* REGISTER */}

      {page === "register" && (
        <Auth
          t={t}
          login={false}
          register={true}
          setPage={setPage}
          setMsg={setMsg}
        />
      )}

      {/* DASHBOARD */}

      {page === "dash" && (
        <Dash
          profile={profile}
          t={t}
        />
      )}

      {/* TOAST */}

      {msg && (
        <div className="toast">
          {msg}

          <button
            onClick={() => setMsg("")}
          >
            ×
          </button>
        </div>
      )}

      {/* FOOTER */}

      <footer>
        © 2026 SURCHOBI Academy · সুরছবি
      </footer>
    </>
  );
}


// =====================================
// AUTH COMPONENT
// =====================================

function Auth({
  t,
  login,
  register,
  setPage,
  setMsg
}) {
  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  async function go(event) {
    event.preventDefault();

    let result;

    if (login) {
      result =
        await sb.auth.signInWithPassword({
          email,
          password
        });
    } else {
      result = await sb.auth.signUp({
        email,
        password,

        options: {
          data: {
            full_name: name,
            phone: phone
          }
        }
      });
    }

    if (result.error) {
      console.error(result.error);

      setMsg(result.error.message);

      return;
    }

    if (login) {
      setMsg("Welcome to SURCHOBI");

      setPage("dash");
    } else {
      setMsg(
        "Registration successful. Please check your email to confirm your account."
      );

      setPage("login");
    }
  }

  return (
    <section className="auth">
      <form onSubmit={go}>
        <h1>
          {login
            ? t.login
            : t.register}
        </h1>

        {register && (
          <>
            <input
              placeholder={t.name}
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              required
            />

            <input
              placeholder={t.phone}
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value)
              }
            />
          </>
        )}

        <input
          type="email"
          placeholder={t.email}
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          required
        />

        <input
          type="password"
          placeholder={t.password}
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          required
        />

        <button className="gold big">
          {login
            ? t.login
            : t.register}
        </button>
      </form>
    </section>
  );
}


// =====================================
// DASHBOARD
// =====================================

function Dash({ profile, t }) {
  const [data, setData] =
    useState(null);

  const [
    pendingStudents,
    setPendingStudents
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  // =====================================
  // LOAD DASHBOARD
  // =====================================

  useEffect(() => {
    if (!profile) return;

    async function loadDashboard() {
      setLoading(true);

      setErrorMessage("");

      console.log(
        "Dashboard profile:",
        profile
      );

      // =====================
      // ADMIN
      // =====================

      if (profile.role === "admin") {
        console.log(
          "ADMIN: Loading pending students"
        );

        const {
          data: students,
          error: studentsError
        } = await sb
          .from("students")
          .select("*")
          .eq("status", "pending");

        console.log(
          "Pending students result:",
          students
        );

        console.log(
          "Pending students error:",
          studentsError
        );

        if (studentsError) {
          setErrorMessage(
            studentsError.message
          );

          setLoading(false);

          return;
        }

        // Get profile information
        const {
          data: profiles,
          error: profilesError
        } = await sb
          .from("profiles")
          .select("*");

        console.log(
          "Profiles result:",
          profiles
        );

        console.log(
          "Profiles error:",
          profilesError
        );

        if (profilesError) {
          setErrorMessage(
            profilesError.message
          );

          setLoading(false);

          return;
        }

        // Combine students + profiles
        const combinedStudents =
          (students || []).map(
            (student) => {
              const studentProfile =
                (profiles || []).find(
                  (p) =>
                    p.id === student.id
                );

              return {
                ...student,

                full_name:
                  studentProfile?.full_name ||
                  "Unknown Student",

                phone:
                  studentProfile?.phone ||
                  ""
              };
            }
          );

        console.log(
          "FINAL STUDENTS:",
          combinedStudents
        );

        setPendingStudents(
          combinedStudents
        );
      }

      // =====================
      // STUDENT
      // =====================

      else if (
        profile.role === "student"
      ) {
        const {
          data: student,
          error
        } = await sb
          .from("students")
          .select("*")
          .eq("id", profile.id)
          .single();

        console.log(
          "Student data:",
          student
        );

        console.log(
          "Student error:",
          error
        );

        if (error) {
          setErrorMessage(
            error.message
          );
        } else {
          setData(student);
        }
      }

      // =====================
      // TEACHER
      // =====================

      else if (
        profile.role === "teacher"
      ) {
        const {
          data: batches,
          error
        } = await sb
          .from("batches")
          .select("*")
          .eq(
            "teacher_id",
            profile.id
          );

        if (error) {
          setErrorMessage(
            error.message
          );
        } else {
          setData(batches);
        }
      }

      setLoading(false);
    }

    loadDashboard();
  }, [profile]);


  // =====================================
  // APPROVE STUDENT
  // =====================================

  async function approveStudent(id) {
    const { error } = await sb
      .from("students")
      .update({
        status: "active"
      })
      .eq("id", id);

    if (error) {
      console.error(
        "Approval error:",
        error
      );

      alert(
        "Error: " + error.message
      );

      return;
    }

    setPendingStudents(
      (currentStudents) =>
        currentStudents.filter(
          (student) =>
            student.id !== id
        )
    );

    alert(
      "Student approved successfully!"
    );
  }


  // =====================================
  // PROFILE LOADING
  // =====================================

  if (!profile) {
    return (
      <section className="page">
        <h2>
          Loading profile...
        </h2>
      </section>
    );
  }


  // =====================================
  // DASHBOARD UI
  // =====================================

  return (
    <section className="dash">

      <aside>
        <h2>
          {profile.full_name}
        </h2>

        <p>
          {profile.role?.toUpperCase()}
        </p>

        <p>
          Students · Teachers ·
          Courses · Batches
        </p>
      </aside>


      <article>

        <h1>
          {profile.role === "admin"
            ? "Admin Dashboard"
            : "Dashboard"}
        </h1>


        {/* ERROR */}

        {errorMessage && (
          <div className="notice">
            <b>Error:</b>{" "}
            {errorMessage}
          </div>
        )}


        {/* =====================
            ADMIN
        ===================== */}

        {profile.role === "admin" && (
          <div>

            <h2>
              Pending Student Approvals
            </h2>


            {loading && (
              <p>
                Loading students...
              </p>
            )}


            {!loading &&
              !errorMessage &&
              pendingStudents.length === 0 && (
                <p>
                  🎉 No students are waiting
                  for approval.
                </p>
              )}


            {!loading &&
              pendingStudents.map(
                (student) => (

                  <div
                    className="student-row"
                    key={student.id}
                  >

                    <div>

                      <h3>
                        {student.full_name}
                      </h3>


                      {student.phone && (
                        <p>
                          Phone:{" "}
                          {student.phone}
                        </p>
                      )}


                      <p>
                        Student Code:{" "}

                        {student.student_code ||
                          "Not assigned"}
                      </p>


                      <p>
                        Status:{" "}

                        <b>
                          {student.status}
                        </b>
                      </p>


                      {student.date_of_birth && (
                        <p>
                          Date of Birth:{" "}

                          {student.date_of_birth}
                        </p>
                      )}


                      {student.address && (
                        <p>
                          Address:{" "}

                          {student.address}
                        </p>
                      )}

                    </div>


                    <button
                      className="gold"
                      onClick={() =>
                        approveStudent(
                          student.id
                        )
                      }
                    >
                      ✓ Approve
                    </button>

                  </div>
                )
              )}

          </div>
        )}


        {/* =====================
            STUDENT
        ===================== */}

        {profile.role === "student" && (
          <div>

            <h2>
              Welcome,{" "}
              {profile.full_name}
            </h2>


            {loading && (
              <p>
                Loading...
              </p>
            )}


            {!loading &&
              data?.status === "pending" && (
                <div className="notice">
                  {t.pending}
                </div>
              )}


            {!loading &&
              data?.status === "active" && (
                <div className="notice">
                  🎉 Your account has been
                  approved!
                </div>
              )}


            {!loading &&
              !data &&
              !errorMessage && (
                <p>
                  Your student record is
                  being prepared.
                </p>
              )}

          </div>
        )}


        {/* =====================
            TEACHER
        ===================== */}

        {profile.role === "teacher" && (
          <div>

            <h2>
              Teacher Dashboard
            </h2>


            {loading && (
              <p>
                Loading...
              </p>
            )}


            {!loading &&
              data &&
              (
                <pre>
                  {JSON.stringify(
                    data,
                    null,
                    2
                  )}
                </pre>
              )}

          </div>
        )}

      </article>
    </section>
  );
}


// =====================================
// RENDER
// =====================================

createRoot(
  document.getElementById("root")
).render(
  <App />
);
