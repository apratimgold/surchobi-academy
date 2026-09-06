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

    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });


    const {
      data: { subscription }
    } = sb.auth.onAuthStateChange(
      (event, newSession) => {

        setSession(newSession);

      }
    );


    return () => {
      subscription.unsubscribe();
    };

  }, []);



  // =========================
  // LOAD CATEGORIES & COURSES
  // =========================

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
          .select("*,categories(name)")
          .order("name")

      ]);


      if (categoriesResult.error) {

        console.error(
          "Categories error:",
          categoriesResult.error
        );

      }


      if (coursesResult.error) {

        console.error(
          "Courses error:",
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



  // =========================
  // LOAD USER PROFILE
  // =========================

  useEffect(() => {

    if (!session) {

      setProfile(null);

      return;

    }


    async function loadProfile() {

      console.log(
        "Loading profile:",
        session.user.id
      );


      const {
        data,
        error
      } = await sb
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();


      console.log(
        "Profile:",
        data
      );


      console.log(
        "Profile error:",
        error
      );


      if (!error) {

        setProfile(data);

      }

    }


    loadProfile();

  }, [session]);



  // =========================
  // LOGOUT
  // =========================

  async function signout() {

    await sb.auth.signOut();

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


          {[
            "home",
            "about",
            "courses"
          ].map((x) => (

            <button
              key={x}
              onClick={() => setPage(x)}
            >

              {t[x]}

            </button>

          ))}



          {session ? (

            <>


              <button
                onClick={() =>
                  setPage("dash")
                }
              >

                Dashboard

              </button>



              <button
                onClick={signout}
              >

                {t.logout}

              </button>


            </>

          ) : (

            <>


              <button
                onClick={() =>
                  setPage("login")
                }
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



      {/* =====================
          HOME PAGE
      ===================== */}

      {page === "home" && (

        <>


          <section className="hero">


            <div>


              <p className="eyebrow">

                CREATIVE ACADEMY · KOLKATA

              </p>



              <h1>
                সুরছবি
              </h1>



              <h2>
                SURCHOBI ACADEMY
              </h2>



              <p>
                {t.welcome}
              </p>



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


            <h2>
              {t.world}
            </h2>



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



                  <h3>
                    {c.name}
                  </h3>



                  <p>
                    {c.description}
                  </p>


                </article>

              ))}


            </div>


          </section>


        </>

      )}



      {/* =====================
          ABOUT PAGE
      ===================== */}

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

              : "সঙ্গীত, নৃত্য, ফটোগ্রাফি, অঙ্কন ও যোগের এক সৃজনশীল ঠিকানা সুরছবি।"

            }

          </p>


        </section>

      )}



      {/* =====================
          COURSES PAGE
      ===================== */}

      {page === "courses" && (

        <section className="page">


          <h1>
            {t.courses}
          </h1>



          <div className="cards">


            {courses.map((c) => (

              <article
                className="card"
                key={c.id}
              >


                <h3>
                  {c.name}
                </h3>



                <p>
                  {c.description}
                </p>



                <small>
                  {c.categories?.name}
                </small>


              </article>

            ))}


          </div>


        </section>

      )}



      {/* =====================
          LOGIN
      ===================== */}

      {page === "login" && (

        <Auth
          t={t}
          login
          setPage={setPage}
          setMsg={setMsg}
        />

      )}



      {/* =====================
          REGISTER
      ===================== */}

      {page === "register" && (

        <Auth
          t={t}
          register
          setPage={setPage}
          setMsg={setMsg}
        />

      )}



      {/* =====================
          DASHBOARD
      ===================== */}

      {page === "dash" && (

        <Dash
          profile={profile}
          t={t}
        />

      )}



      {/* =====================
          TOAST MESSAGE
      ===================== */}

      {msg && (

        <div className="toast">


          {msg}



          <button
            onClick={() =>
              setMsg("")
            }
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





// =========================
// AUTH COMPONENT
// =========================

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


    // LOGIN

    if (login) {

      result =
        await sb.auth.signInWithPassword({

          email,
          password

        });

    }


    // REGISTER

    else {

      result =
        await sb.auth.signUp({

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

      console.error(
        "Authentication error:",
        result.error
      );


      setMsg(
        result.error.message
      );


      return;

    }



    if (login) {

      setMsg(
        "Welcome to SURCHOBI"
      );


      setPage("dash");

    }


    else {

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
                setName(
                  event.target.value
                )
              }

              required

            />



            <input

              placeholder={t.phone}

              value={phone}

              onChange={(event) =>
                setPhone(
                  event.target.value
                )
              }

            />


          </>

        )}



        <input

          type="email"

          placeholder={t.email}

          value={email}

          onChange={(event) =>
            setEmail(
              event.target.value
            )
          }

          required

        />



        <input

          type="password"

          placeholder={t.password}

          value={password}

          onChange={(event) =>
            setPassword(
              event.target.value
            )
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





// =========================
// DASHBOARD COMPONENT
// =========================

function Dash({ profile, t }) {


  const [data, setData] =
    useState(null);


  const [
    pendingStudents,
    setPendingStudents
  ] = useState([]);


  const [loading, setLoading] =
    useState(true);



  useEffect(() => {


    if (!profile) {

      return;

    }



    async function loadDashboard() {


      setLoading(true);


      // =====================
      // ADMIN
      // =====================

      if (profile.role === "admin") {


        console.log(
          "ADMIN detected"
        );


        console.log(
          "Loading pending students..."
        );



        const {

          data: studentData,

          error: studentError

        } = await sb

          .from("students")

          .select("*")

          .eq(
            "status",
            "pending"
          );



        console.log(
          "Pending students:",
          studentData
        );


        console.log(
          "Students error:",
          studentError
        );



        if (studentError) {


          console.error(
            "STUDENTS TABLE ERROR:",
            studentError
          );


          setLoading(false);


          return;

        }



        console.log(
          "Loading profiles..."
        );



        const {

          data: profileData,

          error: profileError

        } = await sb

          .from("profiles")

          .select("*");



        console.log(
          "Profiles:",
          profileData
        );


        console.log(
          "Profiles error:",
          profileError
        );



        if (profileError) {


          console.error(
            "PROFILES TABLE ERROR:",
            profileError
          );


          setLoading(false);


          return;

        }



        const combinedStudents =

          (studentData || []).map(
            (student) => {


              const studentProfile =

                (profileData || []).find(
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
          "Combined students:",
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

          .eq(
            "id",
            profile.id
          )

          .single();



        console.log(
          "Student:",
          student
        );


        console.log(
          "Student error:",
          error
        );



        if (!error) {

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



        console.log(
          "Teacher batches:",
          batches
        );


        console.log(
          "Teacher error:",
          error
        );



        if (!error) {

          setData(batches);

        }

      }



      setLoading(false);

    }



    loadDashboard();


  }, [profile]);





  // =====================
  // APPROVE STUDENT
  // =====================

  async function approveStudent(id) {


    console.log(
      "Approving student:",
      id
    );



    const { error } = await sb

      .from("students")

      .update({

        status: "active"

      })

      .eq(
        "id",
        id
      );



    console.log(
      "Approval error:",
      error
    );



    if (error) {


      alert(
        error.message
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





  // =====================
  // PROFILE LOADING
  // =====================

  if (!profile) {


    return (

      <section className="page">

        Loading profile...

      </section>

    );

  }





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

            : "Dashboard"

          }

        </h1>



        {/* =====================
            ADMIN DASHBOARD
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

                          Phone: {student.phone}

                        </p>

                      )}



                      <p>

                        Student Code:{" "}

                        {

                          student.student_code ||

                          "Not assigned"

                        }

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
            STUDENT DASHBOARD
        ===================== */}

        {profile.role === "student" && (

          <div>


            <h2>

              Welcome,
              {" "}
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



            {!loading && !data && (

              <p>

                Your student record is being
                prepared.

              </p>

            )}


          </div>

        )}



        {/* =====================
            TEACHER DASHBOARD
        ===================== */}

        {profile.role === "teacher" && (

          <div>


            <h2>

              Teacher Dashboard

            </h2>



            {!loading && (

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





// =========================
// RENDER APP
// =========================

createRoot(
  document.getElementById("root")
).render(
  <App />
);
