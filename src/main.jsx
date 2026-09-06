import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import "./style.css";


const sb = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);


// =====================================
// LANGUAGE
// =====================================

const tx = {

  en: {
    home: "Home",
    about: "About",
    courses: "Courses",
    faculty: "Faculty",
    login: "Login",
    register: "Sign Up",
    logout: "Logout",
    dashboard: "Dashboard",
    email: "Email address",
    password: "Password",
    name: "Full Name",
    phone: "Phone Number"
  },

  bn: {
    home: "হোম",
    about: "আমাদের সম্পর্কে",
    courses: "কোর্সসমূহ",
    faculty: "শিক্ষকবৃন্দ",
    login: "লগইন",
    register: "নিবন্ধন",
    logout: "লগআউট",
    dashboard: "ড্যাশবোর্ড",
    email: "ইমেল",
    password: "পাসওয়ার্ড",
    name: "পূর্ণ নাম",
    phone: "ফোন নম্বর"
  }

};


// =====================================
// APP
// =====================================

function App() {

  const [lang, setLang] = useState("en");

  const [page, setPage] =
    useState("home");

  const [session, setSession] =
    useState(null);

  const [profile, setProfile] =
    useState(null);

  const [cats, setCats] =
    useState([]);

  const [courses, setCourses] =
    useState([]);

  const [msg, setMsg] =
    useState("");

  const t = tx[lang];


  // =====================================
  // AUTH SESSION
  // =====================================

  useEffect(() => {

    sb.auth
      .getSession()
      .then(({ data }) => {

        setSession(data.session);

      });


    const {
      data: { subscription }
    } = sb.auth.onAuthStateChange(
      (event, newSession) => {

        setSession(newSession);


        if (
          event ===
          "PASSWORD_RECOVERY"
        ) {

          setPage("reset-password");

        }

      }
    );


    return () =>
      subscription.unsubscribe();

  }, []);


  // =====================================
  // LOAD CATEGORIES & COURSES
  // =====================================

  useEffect(() => {

    async function loadData() {

      const [
        categoriesResult,
        coursesResult
      ] = await Promise.all([

        sb
          .from("categories")
          .select("*")
          .order("name"),

        sb
          .from("courses")
          .select(
            "*, categories(name)"
          )
          .order("name")

      ]);


      if (
        categoriesResult.error
      ) {

        console.log(
          categoriesResult.error
        );

      }


      if (
        coursesResult.error
      ) {

        console.log(
          coursesResult.error
        );

      }


      setCats(
        categoriesResult.data || []
      );


      setCourses(
        coursesResult.data || []
      );

    }


    loadData();

  }, []);


  // =====================================
  // LOAD PROFILE
  // =====================================

  useEffect(() => {

    if (!session) {

      setProfile(null);

      return;

    }


    async function loadProfile() {

      const {
        data,
        error
      } = await sb
        .from("profiles")
        .select("*")
        .eq(
          "id",
          session.user.id
        )
        .single();


      if (error) {

        console.log(
          "Profile error:",
          error
        );

        return;

      }


      setProfile(data);

    }


    loadProfile();

  }, [session]);


  // =====================================
  // LOGOUT
  // =====================================

  async function signout() {

    await sb.auth.signOut();

    setProfile(null);

    setPage("home");

    setMsg(
      "You have been logged out."
    );

  }


  return (

    <>

      {/* ========================= */}
      {/* HEADER */}
      {/* ========================= */}

      <header className="main-header">


        <button
          className="brand"
          onClick={() =>
            setPage("home")
          }
        >

          <span className="brand-symbol">
            ♫
          </span>


          <span>

            <b>
              সুরছবি
            </b>

            <small>
              SURCHOBI ACADEMY
            </small>

          </span>

        </button>


        <nav className="main-nav">

          <button
            onClick={() =>
              setPage("home")
            }
          >
            {t.home}
          </button>


          <button
            onClick={() =>
              setPage("about")
            }
          >
            {t.about}
          </button>


          <button
            onClick={() =>
              setPage("courses")
            }
          >
            {t.courses}
          </button>


          <button
            onClick={() =>
              setPage("faculty")
            }
          >
            {t.faculty}
          </button>


          {session && (

            <button
              onClick={() =>
                setPage("dash")
              }
            >

              {t.dashboard}

            </button>

          )}

        </nav>


        <div className="header-actions">


          <button
            className="language-button"
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


          {session ? (

            <button
              className="login-button"
              onClick={signout}
            >

              {t.logout}

            </button>

          ) : (

            <button
              className="login-button"
              onClick={() =>
                setPage("login")
              }
            >

              Login / Sign Up

            </button>

          )}

        </div>


      </header>



      {/* ========================= */}
      {/* HOME */}
      {/* ========================= */}

      {page === "home" && (

        <Home
          t={t}
          cats={cats}
          courses={courses}
          setPage={setPage}
        />

      )}



      {/* ========================= */}
      {/* ABOUT */}
      {/* ========================= */}

      {page === "about" && (

        <section className="simple-page">

          <div className="simple-page-content">

            <p className="section-label">

              OUR STORY

            </p>


            <h1>

              Nurturing Creativity
              <br />

              For A Brighter Tomorrow

            </h1>


            <p>

              SURCHOBI is a creative arts
              academy where passion meets
              discipline.

            </p>


            <p>

              Music, dance, photography,
              drawing and many other forms
              of creativity come together
              under one roof.

            </p>

          </div>

        </section>

      )}



      {/* ========================= */}
      {/* COURSES */}
      {/* ========================= */}

      {page === "courses" && (

        <CoursesPage
          courses={courses}
        />

      )}



      {/* ========================= */}
      {/* FACULTY */}
      {/* ========================= */}

      {page === "faculty" && (

        <FacultyPage />

      )}



      {/* ========================= */}
      {/* LOGIN */}
      {/* ========================= */}

      {page === "login" && (

        <Auth
          mode="login"
          setPage={setPage}
          setMsg={setMsg}
          t={t}
        />

      )}



      {/* ========================= */}
      {/* REGISTER */}
      {/* ========================= */}

      {page === "register" && (

        <Auth
          mode="register"
          setPage={setPage}
          setMsg={setMsg}
          t={t}
        />

      )}



      {/* ========================= */}
      {/* FORGOT PASSWORD */}
      {/* ========================= */}

      {page ===
        "forgot-password" && (

        <ForgotPassword
          setPage={setPage}
          setMsg={setMsg}
        />

      )}



      {/* ========================= */}
      {/* RESET PASSWORD */}
      {/* ========================= */}

      {page ===
        "reset-password" && (

        <ResetPassword
          setPage={setPage}
          setMsg={setMsg}
        />

      )}



      {/* ========================= */}
      {/* DASHBOARD */}
      {/* ========================= */}

      {page === "dash" && (

        <Dashboard
          profile={profile}
          setPage={setPage}
          signout={signout}
          setMsg={setMsg}
        />

      )}



      {/* ========================= */}
      {/* TOAST */}
      {/* ========================= */}

      {msg && (

        <div className="toast">

          <span>
            {msg}
          </span>


          <button
            onClick={() =>
              setMsg("")
            }
          >
            ×
          </button>

        </div>

      )}



      {/* ========================= */}
      {/* FOOTER */}
      {/* ========================= */}

      {page !== "dash" && (

        <Footer />

      )}

    </>

  );

}



// =====================================
// HOME
// =====================================

function Home({
  t,
  cats,
  courses,
  setPage
}) {

  return (

    <>

      {/* HERO */}

      <section className="hero-modern">


        <div className="hero-content">


          <p className="hero-label">

            LEARN • CREATE • EXPRESS

          </p>


          <h1>

            Art Builds
            <br />

            a Kinder,
            <br />

            Brighter World

          </h1>


          <h2>

            Music. Dance. Photography.
            Visual Art. And More.

          </h2>


          <p className="hero-description">

            At Surchobi, we nurture
            creativity, discipline and
            self-expression through the
            arts.

          </p>


          <div className="hero-buttons">


            <button
              className="gold-button"
              onClick={() =>
                setPage("courses")
              }
            >

              Explore Courses
              <span>
                →
              </span>

            </button>


            <button
              className="outline-button"
              onClick={() =>
                setPage("about")
              }
            >

              ▷ Watch Our Story

            </button>

          </div>


        </div>


        <div className="hero-art">

          <div className="art-panel panel-1">

            MUSIC

          </div>


          <div className="art-panel panel-2">

            DANCE

          </div>


          <div className="art-panel panel-3">

            PHOTO

          </div>


          <div className="art-panel panel-4">

            ART

          </div>

        </div>


      </section>



      {/* CATEGORIES */}

      <section className="category-strip">

        {cats.length > 0

          ? cats.map(
            (cat, index) => (

              <div
                className="category-item"
                key={cat.id}
              >

                <div className="category-icon">

                  {
                    [
                      "♫",
                      "♬",
                      "◉",
                      "✎",
                      "☾",
                      "✦"
                    ][index % 6]
                  }

                </div>


                <h3>

                  {cat.name}

                </h3>


                <p>

                  {cat.description ||
                    "Explore creativity"}

                </p>

              </div>

            )
          )

          : (

            <>

              <div className="category-item">
                <div className="category-icon">
                  ♫
                </div>
                <h3>Music</h3>
                <p>Find Your Sound</p>
              </div>


              <div className="category-item">
                <div className="category-icon">
                  ♬
                </div>
                <h3>Dance</h3>
                <p>Move. Express. Shine.</p>
              </div>


              <div className="category-item">
                <div className="category-icon">
                  ◉
                </div>
                <h3>Photography</h3>
                <p>Capture Perspectives</p>
              </div>

            </>

          )}

      </section>



      {/* COURSES */}

      <section className="courses-section">


        <div className="section-heading">

          <div>

            <p className="section-label">

              EXPLORE

            </p>


            <h2>

              Our Courses

            </h2>

          </div>


          <button
            className="text-button"
            onClick={() =>
              setPage("courses")
            }
          >

            View All Courses →

          </button>

        </div>


        <div className="course-grid">


          {courses
            .slice(0, 6)
            .map((course) => (

              <article
                className="course-card"
                key={course.id}
              >

                <div className="course-image">

                  <span>

                    {course.categories?.name ||
                      "SURCHOBI"}

                  </span>

                </div>


                <div className="course-info">

                  <h3>

                    {course.name}

                  </h3>


                  <p>

                    {course.description ||
                      "Discover your creativity"}

                  </p>


                  <button>

                    →

                  </button>

                </div>

              </article>

            ))}

        </div>


      </section>



      {/* FEATURES */}

      <section className="features-band">


        <div>

          <span>🎓</span>

          <h3>
            Expert Mentors
          </h3>

          <p>
            Learn from experienced
            professionals
          </p>

        </div>


        <div>

          <span>👥</span>

          <h3>
            Creative Community
          </h3>

          <p>
            Be part of a vibrant
            artistic family
          </p>

        </div>


        <div>

          <span>★</span>

          <h3>
            Events & Showcase
          </h3>

          <p>
            Regular performances
            and exhibitions
          </p>

        </div>


        <div>

          <span>▥</span>

          <h3>
            Personal Growth
          </h3>

          <p>
            Build confidence and
            discipline
          </p>

        </div>


      </section>



      {/* STORY */}

      <section className="story-section">


        <div className="story-text">

          <p className="section-label">

            OUR STORY

          </p>


          <h2>

            Nurturing Creativity
            <br />

            For A Brighter Tomorrow

          </h2>


          <p>

            Surchobi is a creative arts
            academy built on the belief
            that the arts make life
            richer, kinder and more
            meaningful.

          </p>


          <button
            className="gold-button"
            onClick={() =>
              setPage("about")
            }
          >

            Know More About Us →

          </button>

        </div>


        <div className="story-art">

          <div className="story-logo">

            ♫

            <span>
              সুরছবি
            </span>

          </div>

        </div>


        <div className="quote-box">

          <span>
            “
          </span>


          <p>

            Creativity is
            <br />

            not a talent.
            <br />

            It is a way of life.

          </p>


          <small>

            — Surchobi

          </small>

        </div>


      </section>


    </>

  );

}



// =====================================
// COURSES PAGE
// =====================================

function CoursesPage({
  courses
}) {

  return (

    <section className="simple-page">

      <p className="section-label">

        EXPLORE

      </p>


      <h1>

        Our Courses

      </h1>


      <div className="course-grid full-grid">

        {courses.map(
          (course) => (

            <article
              className="course-card"
              key={course.id}
            >

              <div className="course-image">

                <span>

                  {course.categories?.name}

                </span>

              </div>


              <div className="course-info">

                <h3>

                  {course.name}

                </h3>


                <p>

                  {course.description}

                </p>

              </div>

            </article>

          )
        )}

      </div>

    </section>

  );

}



// =====================================
// FACULTY
// =====================================

function FacultyPage() {

  return (

    <section className="simple-page">

      <p className="section-label">

        OUR PEOPLE

      </p>


      <h1>

        Meet Our Faculty

      </h1>


      <p>

        Our experienced teachers guide
        students through their creative
        journey.

      </p>

    </section>

  );

}



// =====================================
// AUTH
// =====================================

function Auth({
  mode,
  setPage,
  setMsg,
  t
}) {

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  const isLogin =
    mode === "login";


  async function submit(event) {

    event.preventDefault();

    setLoading(true);


    let result;


    if (isLogin) {

      result =
        await sb.auth
          .signInWithPassword({

            email,
            password

          });

    }

    else {

      result =
        await sb.auth.signUp({

          email,

          password,

          options: {

            data: {

              full_name:
                name,

              phone:
                phone

            }

          }

        });

    }


    setLoading(false);


    if (result.error) {

      setMsg(
        result.error.message
      );

      return;

    }


    if (isLogin) {

      setMsg(
        "Welcome to SURCHOBI!"
      );

      setPage("dash");

    }

    else {

      setMsg(
        "Registration successful! Please check your email."
      );

      setPage("login");

    }

  }


  return (

    <section className="auth-page">


      <div className="auth-panel">


        <div className="auth-brand">

          <span>
            ♫
          </span>

          <h2>

            সুরছবি

          </h2>


          <p>

            SURCHOBI ACADEMY

          </p>

        </div>


        <form
          className="auth-form"
          onSubmit={submit}
        >


          <p className="section-label">

            WELCOME

          </p>


          <h1>

            {isLogin
              ? "Welcome Back"
              : "Begin Your Journey"}

          </h1>


          {!isLogin && (

            <>

              <input
                placeholder={t.name}
                value={name}
                onChange={(e) =>
                  setName(
                    e.target.value
                  )
                }
                required
              />


              <input
                placeholder={t.phone}
                value={phone}
                onChange={(e) =>
                  setPhone(
                    e.target.value
                  )
                }
              />

            </>

          )}


          <input
            type="email"
            placeholder={t.email}
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
            required
          />


          <input
            type="password"
            placeholder={t.password}
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            required
          />


          {isLogin && (

            <button
              type="button"
              className="forgot-button"
              onClick={() =>
                setPage(
                  "forgot-password"
                )
              }
            >

              Forgot Password?

            </button>

          )}


          <button
            className="gold-button auth-submit"
          >

            {loading
              ? "Please wait..."
              : isLogin
                ? "Login"
                : "Create Account"}

          </button>


          <p className="auth-switch">

            {isLogin
              ? "Don't have an account?"
              : "Already have an account?"}


            <button
              type="button"
              onClick={() =>
                setPage(
                  isLogin
                    ? "register"
                    : "login"
                )
              }
            >

              {isLogin
                ? " Sign Up"
                : " Login"}

            </button>

          </p>


        </form>


      </div>

    </section>

  );

}



// =====================================
// FORGOT PASSWORD
// =====================================

function ForgotPassword({
  setPage,
  setMsg
}) {

  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  async function submit(event) {

    event.preventDefault();

    setLoading(true);


    const {
      error
    } = await sb.auth
      .resetPasswordForEmail(
        email,
        {
          redirectTo:
            window.location.origin
        }
      );


    setLoading(false);


    if (error) {

      setMsg(
        error.message
      );

      return;

    }


    setMsg(
      "Password reset link has been sent to your email."
    );


    setPage("login");

  }


  return (

    <section className="auth-page">

      <div className="auth-panel">


        <form
          className="auth-form"
          onSubmit={submit}
        >


          <p className="section-label">

            PASSWORD RECOVERY

          </p>


          <h1>

            Forgot Password?

          </h1>


          <p>

            Enter your email address.
            We will send you a password
            reset link.

          </p>


          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
            required
          />


          <button
            className="gold-button auth-submit"
          >

            {loading
              ? "Sending..."
              : "Send Reset Link"}

          </button>


          <button
            type="button"
            className="back-button"
            onClick={() =>
              setPage("login")
            }
          >

            ← Back to Login

          </button>


        </form>


      </div>

    </section>

  );

}



// =====================================
// RESET PASSWORD
// =====================================

function ResetPassword({
  setPage,
  setMsg
}) {

  const [password, setPassword] =
    useState("");

  const [confirm, setConfirm] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  async function submit(event) {

    event.preventDefault();


    if (password !== confirm) {

      setMsg(
        "Passwords do not match."
      );

      return;

    }


    setLoading(true);


    const {
      error
    } = await sb.auth.updateUser({

      password

    });


    setLoading(false);


    if (error) {

      setMsg(
        error.message
      );

      return;

    }


    setMsg(
      "Password updated successfully!"
    );


    setPage("login");

  }


  return (

    <section className="auth-page">

      <div className="auth-panel">


        <form
          className="auth-form"
          onSubmit={submit}
        >


          <p className="section-label">

            RESET PASSWORD

          </p>


          <h1>

            Create New Password

          </h1>


          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            required
          />


          <input
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) =>
              setConfirm(
                e.target.value
              )
            }
            required
          />


          <button
            className="gold-button auth-submit"
          >

            {loading
              ? "Updating..."
              : "Update Password"}

          </button>


        </form>


      </div>

    </section>

  );

}



// =====================================
// DASHBOARD
// =====================================

function Dashboard({
  profile,
  setPage,
  signout,
  setMsg
}) {

  const [
    pendingStudents,
    setPendingStudents
  ] = useState([]);

  const [totalStudents,
    setTotalStudents] =
    useState(0);

  const [totalTeachers,
    setTotalTeachers] =
    useState(0);

  const [totalCourses,
    setTotalCourses] =
    useState(0);

  const [totalBatches,
    setTotalBatches] =
    useState(0);

  const [loading,
    setLoading] =
    useState(true);


  const canApprove =

    profile?.role === "admin" ||

    profile?.role === "teacher";


  // =====================================
  // LOAD DASHBOARD
  // =====================================

  useEffect(() => {

    if (!profile) return;


    async function loadDashboard() {

      setLoading(true);


      // STUDENT

      if (
        profile.role === "student"
      ) {

        setLoading(false);

        return;

      }


      // ADMIN / TEACHER

      const [
        pendingResult,
        studentsResult,
        teachersResult,
        coursesResult,
        batchesResult
      ] = await Promise.all([

        sb
          .from("students")
          .select("*")
          .eq(
            "status",
            "pending"
          ),

        sb
          .from("students")
          .select(
            "id",
            { count: "exact" }
          ),

        sb
          .from("profiles")
          .select(
            "id",
            { count: "exact" }
          )
          .eq(
            "role",
            "teacher"
          ),

        sb
          .from("courses")
          .select(
            "id",
            { count: "exact" }
          ),

        sb
          .from("batches")
          .select(
            "id",
            { count: "exact" }
          )

      ]);


      if (
        pendingResult.error
      ) {

        console.log(
          pendingResult.error
        );

      }


      const studentRows =
        pendingResult.data || [];


      // LOAD PROFILES

      const {
        data: profiles
      } = await sb
        .from("profiles")
        .select("*");


      const combined =

        studentRows.map(
          (student) => {

            const studentProfile =
              profiles?.find(
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


      setPendingStudents(
        combined
      );


      setTotalStudents(
        studentsResult.count || 0
      );


      setTotalTeachers(
        teachersResult.count || 0
      );


      setTotalCourses(
        coursesResult.count || 0
      );


      setTotalBatches(
        batchesResult.count || 0
      );


      setLoading(false);

    }


    loadDashboard();

  }, [profile]);


  // =====================================
  // APPROVE STUDENT
  // =====================================

  async function approveStudent(id) {

    const {
      error
    } = await sb
      .from("students")
      .update({

        status: "active"

      })
      .eq(
        "id",
        id
      );


    if (error) {

      alert(
        error.message
      );

      return;

    }


    setPendingStudents(
      (current) =>

        current.filter(
          (student) =>
            student.id !== id
        )
    );


    setMsg(
      "Student approved successfully!"
    );

  }


  // =====================================
  // STUDENT DASHBOARD
  // =====================================

  if (
    profile &&
    profile.role === "student"
  ) {

    return (

      <StudentDashboard
        profile={profile}
        signout={signout}
      />

    );

  }


  if (!profile) {

    return (

      <div className="loading-page">

        Loading dashboard...

      </div>

    );

  }


  return (

    <div className="dashboard-layout">


      {/* SIDEBAR */}

      <aside className="dashboard-sidebar">


        <div className="dashboard-logo">

          <span>
            ♫
          </span>


          <div>

            <b>
              সুরছবি
            </b>


            <small>
              CREATIVE ARTS
            </small>

          </div>

        </div>


        <div className="sidebar-menu">


          <button className="active">

            <span>⌂</span>

            Dashboard

          </button>


          <button>

            <span>♙</span>

            Students

          </button>


          <button>

            <span>♧</span>

            Teachers

          </button>


          <button>

            <span>▤</span>

            Courses

          </button>


          <button>

            <span>◫</span>

            Batches

          </button>


          <button>

            <span>▦</span>

            Attendance

          </button>


          <button>

            <span>▣</span>

            Fees & Payments

          </button>


          <button>

            <span>♢</span>

            Notices

          </button>


          <button>

            <span>▧</span>

            Events

          </button>

        </div>


        <div className="sidebar-bottom">

          <p>

            Different Arts.
            <br />

            One Soul.

          </p>


          <button
            onClick={signout}
          >

            ↪ Logout

          </button>

        </div>


      </aside>



      {/* MAIN */}

      <main className="dashboard-main">


        {/* TOPBAR */}

        <div className="dashboard-topbar">


          <p>

            “Art Builds a Kinder,
            Brighter World”

          </p>


          <div>

            <button>

              ♧

            </button>


            <div className="profile-mini">

              <span>

                {profile.full_name
                  ?.charAt(0)
                  ?.toUpperCase()}

              </span>


              <div>

                <b>

                  {profile.full_name}

                </b>


                <small>

                  {profile.role}

                </small>

              </div>

            </div>

          </div>


        </div>



        {/* WELCOME */}

        <section className="dashboard-welcome">


          <div>

            <h1>

              Welcome back,
              {" "}

              {profile.full_name}!

            </h1>


            <p>

              Manage your academy,
              nurture talent, and keep
              the arts alive.

            </p>

          </div>


          <div className="welcome-art">

            Creativity
            <br />

            changes lives

          </div>


        </section>



        {/* STATS */}

        <section className="stats-grid">


          <StatCard
            icon="👥"
            number={totalStudents}
            label="Total Students"
          />


          <StatCard
            icon="🎓"
            number={totalTeachers}
            label="Total Teachers"
          />


          <StatCard
            icon="▤"
            number={totalCourses}
            label="Active Courses"
          />


          <StatCard
            icon="◫"
            number={totalBatches}
            label="Total Batches"
          />


        </section>



        {/* CONTENT GRID */}

        <section className="dashboard-content-grid">


          {/* PENDING */}

          <div className="dashboard-card pending-card">


            <div className="card-title">

              <h2>

                📋 Pending Student
                Approvals

                <span>

                  {pendingStudents.length}

                </span>

              </h2>


              <button>

                View All →

              </button>

            </div>


            {loading && (

              <p>

                Loading students...

              </p>

            )}


            {!loading &&
              pendingStudents.length === 0 && (

                <div className="empty-state">

                  🎉

                  <p>

                    No students are waiting
                    for approval.

                  </p>

                </div>

              )}


            {!loading &&

              pendingStudents.map(
                (student) => (

                  <div
                    className="pending-row"
                    key={student.id}
                  >


                    <div className="student-avatar">

                      {student.full_name
                        ?.charAt(0)
                        ?.toUpperCase()}

                    </div>


                    <div className="student-info">

                      <b>

                        {student.full_name}

                      </b>


                      <small>

                        {student.phone ||
                          "No phone number"}

                      </small>

                    </div>


                    <span className="pending-badge">

                      Pending

                    </span>


                    {canApprove && (

                      <button
                        className="approve-button"
                        onClick={() =>
                          approveStudent(
                            student.id
                          )
                        }
                      >

                        ✓ Approve

                      </button>

                    )}

                  </div>

                )
              )}

          </div>



          {/* QUICK ACTIONS */}

          <div className="dashboard-card quick-card">


            <h2>

              ⚡ Quick Actions

            </h2>


            <button>

              👤

              Add New Student

              <span>→</span>

            </button>


            <button>

              ♧

              Add New Teacher

              <span>→</span>

            </button>


            <button>

              ▤

              Create New Course

              <span>→</span>

            </button>


            <button>

              ◫

              Create New Batch

              <span>→</span>

            </button>


            <button>

              📢

              Send Notice

              <span>→</span>

            </button>


          </div>


        </section>



        {/* LOWER GRID */}

        <section className="dashboard-lower-grid">


          <div className="dashboard-card activity-card">


            <div className="card-title">

              <h2>

                🕘 Recent Activity

              </h2>

            </div>


            <Activity
              icon="👤"
              text="New student registration"
              time="Recently"
            />


            <Activity
              icon="🎓"
              text="Teacher management"
              time="Today"
            />


            <Activity
              icon="▤"
              text="Courses updated"
              time="Today"
            />


          </div>


          <div className="inspiration-card">


            <div>

              <p>

                Nurturing
                Creativity

              </p>


              <h2>

                For a Brighter
                Tomorrow

              </h2>


              <span>

                SURCHOBI ACADEMY

              </span>

            </div>

          </div>


        </section>


      </main>


    </div>

  );

}



// =====================================
// STUDENT DASHBOARD
// =====================================

function StudentDashboard({
  profile,
  signout
}) {

  const [
    student,
    setStudent
  ] = useState(null);


  useEffect(() => {

    async function loadStudent() {

      const {
        data
      } = await sb
        .from("students")
        .select("*")
        .eq(
          "id",
          profile.id
        )
        .single();


      setStudent(data);

    }


    loadStudent();

  }, [profile]);


  return (

    <div className="dashboard-layout">


      <aside className="dashboard-sidebar">


        <div className="dashboard-logo">

          <span>
            ♫
          </span>


          <div>

            <b>
              সুরছবি
            </b>

            <small>
              STUDENT PORTAL
            </small>

          </div>

        </div>


        <div className="sidebar-menu">

          <button className="active">

            ⌂ Dashboard

          </button>


          <button>

            👤 My Profile

          </button>


          <button>

            ▤ My Courses

          </button>


          <button>

            ◫ My Batches

          </button>


          <button>

            ▦ Attendance

          </button>


          <button>

            ▣ Fees

          </button>


          <button>

            📢 Notices

          </button>

        </div>


        <div className="sidebar-bottom">

          <button
            onClick={signout}
          >

            ↪ Logout

          </button>

        </div>


      </aside>



      <main className="dashboard-main">


        <section className="dashboard-welcome student-welcome">


          <div>

            <p className="section-label">

              STUDENT PORTAL

            </p>


            <h1>

              Welcome,
              {" "}

              {profile.full_name}!

            </h1>


            <p>

              Continue your creative
              journey with SURCHOBI.

            </p>

          </div>


        </section>



        <section className="student-status-grid">


          <div className="dashboard-card">

            <span>

              👤

            </span>


            <h3>

              Student Status

            </h3>


            <h2>

              {student?.status ===
              "active"

                ? "✓ Approved"

                : "⏳ Pending"}

            </h2>

          </div>


          <div className="dashboard-card">

            <span>

              🎓

            </span>


            <h3>

              Student Code

            </h3>


            <h2>

              {student?.student_code ||
                "Not assigned"}

            </h2>

          </div>


          <div className="dashboard-card">

            <span>

              ♫

            </span>


            <h3>

              Your Journey

            </h3>


            <h2>

              Create. Learn. Grow.

            </h2>

          </div>


        </section>


      </main>


    </div>

  );

}



// =====================================
// STAT CARD
// =====================================

function StatCard({
  icon,
  number,
  label
}) {

  return (

    <div className="stat-card">


      <div className="stat-icon">

        {icon}

      </div>


      <div>

        <h2>

          {number}

        </h2>


        <p>

          {label}

        </p>

      </div>


    </div>

  );

}



// =====================================
// ACTIVITY
// =====================================

function Activity({
  icon,
  text,
  time
}) {

  return (

    <div className="activity-row">

      <span>

        {icon}

      </span>


      <p>

        {text}

      </p>


      <small>

        {time}

      </small>

    </div>

  );

}



// =====================================
// FOOTER
// =====================================

function Footer() {

  return (

    <footer className="modern-footer">


      <div className="footer-brand">

        <h2>

          ♫ সুরছবি

        </h2>


        <p>

          SURCHOBI ACADEMY

        </p>


        <span>

          Learn • Create • Express

        </span>

      </div>


      <div>

        <h4>

          Quick Links

        </h4>


        <p>Home</p>

        <p>About</p>

        <p>Courses</p>

      </div>


      <div>

        <h4>

          Contact Us

        </h4>


        <p>

          Kolkata, West Bengal,
          India

        </p>

        <p>

          +91 XXXXX XXXXX

        </p>

      </div>


      <div>

        <h4>

          Follow Us

        </h4>


        <div className="socials">

          <span>f</span>

          <span>◎</span>

          <span>▶</span>

          <span>in</span>

        </div>

      </div>


      <div className="footer-bottom">

        © 2026 Surchobi Academy.
        All rights reserved.

      </div>


    </footer>

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
