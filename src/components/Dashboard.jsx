import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import "./Dashboard.css";

import { onAuthStateChanged } from "firebase/auth";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { auth, db } from "../firebase";

function Dashboard() {
  // =========================================================
  // CURRENT USER
  // =========================================================

  const [currentUser, setCurrentUser] = useState(null);
  const [userName, setUserName] = useState("Recruiter");

  // =========================================================
  // JOBS
  // =========================================================

  const [jobs, setJobs] = useState([]);

  // =========================================================
  // CANDIDATE ANALYSES
  // =========================================================

  const [candidateAnalyses, setCandidateAnalyses] = useState([]);

  // =========================================================
  // GET LOGGED-IN USER FROM FIREBASE
  // =========================================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCurrentUser(null);
        setUserName("Recruiter");

        return;
      }

      try {
        const userDocRef = doc(db, "users", user.uid);

        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();

          setCurrentUser({
            id: user.uid,

            email: user.email,

            fullName: userData.fullName || "Recruiter",

            company: userData.company || "",
          });

          setUserName(userData.fullName || "Recruiter");
        } else {
          setCurrentUser({
            id: user.uid,

            email: user.email,

            fullName: "Recruiter",
          });

          setUserName("Recruiter");
        }
      } catch (error) {
        console.error("Error loading user profile:", error);

        setUserName("Recruiter");
      }
    });

    return () => unsubscribe();
  }, []);

  // =========================================================
  // GET USER FIRST NAME
  // =========================================================

  const firstName = userName.split(" ")[0];

  // =========================================================
  // GENERATE USER INITIALS
  // =========================================================

  const userInitial = userName
    .split(" ")
    .filter(Boolean)
    .map((name) => name.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // =========================================================
  // GET JOBS CREATED BY LOGGED-IN RECRUITER
  // =========================================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setJobs([]);

        return;
      }

      try {
        console.log("Logged-in user UID:", user.uid);

        const jobsQuery = query(
          collection(db, "jobs"),
          where("recruiterId", "==", user.uid)
        );

        const querySnapshot = await getDocs(jobsQuery);

        const loadedJobs = querySnapshot.docs.map((jobDoc) => ({
          id: jobDoc.id,

          ...jobDoc.data(),
        }));

        console.log("Jobs found:", loadedJobs);

        setJobs(loadedJobs);
      } catch (error) {
        console.error("Error loading jobs:", error);

        setJobs([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // =========================================================
  // GET CANDIDATE ANALYSES
  // ONLY CURRENT RECRUITER
  // =========================================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCandidateAnalyses([]);

        return;
      }

      try {
        console.log("Loading candidate analyses for recruiter:", user.uid);

        const candidatesQuery = query(
          collection(db, "candidateAnalyses"),
          where("recruiterId", "==", user.uid)
        );

        const querySnapshot = await getDocs(candidatesQuery);

        const loadedCandidates = querySnapshot.docs.map((candidateDoc) => ({
          id: candidateDoc.id,

          ...candidateDoc.data(),
        }));

        console.log("Candidate analyses found:", loadedCandidates);

        setCandidateAnalyses(loadedCandidates);
      } catch (error) {
        console.error("Error loading candidate analyses:", error);

        setCandidateAnalyses([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // =========================================================
  // GET ONLY ACTIVE JOBS
  // =========================================================

  const activeJobs = jobs.filter(
    (job) => !job.status || job.status === "Active"
  );

  // =========================================================
  // CANDIDATE STATISTICS
  // =========================================================

  const totalCandidates = candidateAnalyses.length;

  // =========================================================
  // TOP 3 CANDIDATES
  // =========================================================

  const topCandidates = [...candidateAnalyses]
    .sort((a, b) => Number(b.matchScore || 0) - Number(a.matchScore || 0))
    .slice(0, 3);

  // =========================================================
  // AVERAGE MATCH
  // =========================================================

  const averageMatch =
    totalCandidates > 0
      ? Math.round(
          candidateAnalyses.reduce(
            (total, candidate) => total + Number(candidate.matchScore || 0),
            0
          ) / totalCandidates
        )
      : 0;

  // =========================================================
  // GET JOB INITIALS
  // =========================================================

  const getJobInitials = (title) => {
    if (!title) {
      return "JB";
    }

    const words = title.trim().split(" ").filter(Boolean);

    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }

    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  };

  // =========================================================
  // GET CANDIDATE INITIALS
  // =========================================================

  const getCandidateInitials = (name) => {
    if (!name) {
      return "NA";
    }

    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  // =========================================================
  // RETURN UI
  // =========================================================

  return (
    <div className="dashboard-page">
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="dashboard-sidebar">
        <div className="dashboard-logo">
          <span>AI</span>
          Resume Analyzer
        </div>

        <nav className="sidebar-menu">
          <Link to="/dashboard" className="sidebar-link active">
            <img src="/dashboard.svg" alt="" className="sidebar-icon" />
            Dashboard
          </Link>

          <Link to="/jobs" className="sidebar-link">
            <img src="/jobs.svg" alt="" className="sidebar-icon" />
            Jobs
          </Link>

          <Link to="/screen-resumes" className="sidebar-link">
            <img src="/screen-resumes.svg" alt="" className="sidebar-icon" />
            Screen Resumes
          </Link>

          <Link to="/candidates" className="sidebar-link">
            <img src="/candidates.svg" alt="" className="sidebar-icon" />
            Candidates
          </Link>

        </nav>

        <div className="sidebar-bottom">
          <Link to="/settings" className="sidebar-link">
            <span>⚙</span>
            Settings
          </Link>

          <Link to="/signin" className="sidebar-link logout-link">
            <span>↪</span>
            Logout
          </Link>
        </div>
      </aside>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="dashboard-main">
        {/* =================================================
            HEADER
        ================================================= */}

        <header className="dashboard-header">
          <div>
            <p className="dashboard-small-text">Recruiter Dashboard</p>

            <h1>Welcome back, {userName}!</h1>

            <p className="dashboard-subtitle">
              Manage your jobs and analyze candidates efficiently.
            </p>
          </div>

          <div className="profile-section">
            <div className="notification-icon">♢</div>

            <div className="profile-avatar">{userInitial}</div>

            <div className="profile-info">
              <span className="profile-name">{userName}</span>

              <span className="profile-role">HR Manager</span>
            </div>
          </div>
        </header>

        {/* =================================================
            QUICK ACTIONS
        ================================================= */}

        <section className="quick-actions">
          <Link to="/create-job" className="primary-action">
            <span className="action-icon">+</span>

            <div>
              <strong>Create New Job</strong>

              <p>Add a job description and requirements</p>
            </div>
          </Link>

          <Link to="/upload-resumes" className="secondary-action">
            <span className="action-icon">↑</span>

            <div>
              <strong>Upload Resumes</strong>

              <p>Upload candidate resumes for analysis</p>
            </div>
          </Link>
        </section>

        {/* =================================================
            STATISTICS
        ================================================= */}

        <section className="stats-grid">
          {/* ACTIVE JOBS */}

          <div className="stat-card">
            <div className="stat-top">
              <span>Active Jobs</span>

              <div className="stat-icon blue">▣</div>
            </div>

            <h2>{activeJobs.length}</h2>

            <p>Currently active positions</p>
          </div>

          {/* TOTAL CANDIDATES */}

          <div className="stat-card">
            <div className="stat-top">
              <span>Total Candidates</span>

              <div className="stat-icon purple">♙</div>
            </div>

            <h2>{totalCandidates}</h2>

            <p>Resumes analyzed</p>
          </div>

          {/* SHORTLISTED */}

          <div className="stat-card">
            <div className="stat-top">
              <span>Shortlisted</span>

              <div className="stat-icon green">✓</div>
            </div>

            <h2>32</h2>

            <p>Candidates shortlisted</p>
          </div>

          {/* AVERAGE MATCH */}

          <div className="stat-card">
            <div className="stat-top">
              <span>Average Match</span>

              <div className="stat-icon orange">%</div>
            </div>

            <h2>{averageMatch}%</h2>

            <p>Average candidate match</p>
          </div>
        </section>

        {/* =================================================
            MAIN DASHBOARD GRID
        ================================================= */}

        <section className="dashboard-content">
          {/* =================================================
              ACTIVE JOBS
          ================================================= */}

          <div className="dashboard-card jobs-card">
            <div className="card-header">
              <div>
                <h2>Active Jobs</h2>

                <p>Manage your current job openings</p>
              </div>

              <Link to="/jobs" className="view-all">
                View All
              </Link>
            </div>

            <div className="job-list">
              {activeJobs.length === 0 ? (
                <div
                  style={{
                    minHeight: "190px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    padding: "25px 15px",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      background: "#e8f0ff",
                      color: "#3d73df",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "19px",
                      fontWeight: "700",
                      marginBottom: "10px",
                    }}
                  >
                    ▣
                  </div>

                  <strong
                    style={{
                      color: "#17243d",
                      fontSize: "13px",
                      fontWeight: "600",
                    }}
                  >
                    No active jobs yet
                  </strong>

                  <p
                    style={{
                      margin: "5px 0 12px",
                      color: "#7183a1",
                      fontSize: "10px",
                    }}
                  >
                    Create a job to start screening candidates.
                  </p>

                  <Link
                    to="/create-job"
                    style={{
                      color: "#195bc6",
                      fontSize: "10px",
                      fontWeight: "600",
                      textDecoration: "none",
                    }}
                  >
                    + Create New Job
                  </Link>
                </div>
              ) : (
                activeJobs.slice(0, 3).map((job) => (
                  <div className="job-item" key={job.id}>
                    <div className="job-icon">
                      {getJobInitials(job.jobTitle)}
                    </div>

                    <div className="job-details">
                      <h3>{job.jobTitle}</h3>

                      <p>{job.requiredSkills || "No skills specified"}</p>

                      <span>
                        {job.department || "Department not specified"}

                        {" • "}

                        {job.experience || "Experience not specified"}
                      </span>
                    </div>

                    <div className="job-status">{job.status || "Active"}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* =================================================
              TOP CANDIDATES
          ================================================= */}

          <div className="dashboard-card candidates-card">
            <div className="card-header">
              <div>
                <h2>Top Candidates</h2>

                <p>Highest matching candidates</p>
              </div>

              <Link to="/candidates" className="view-all">
                View All
              </Link>
            </div>

            <div className="candidate-list">
              {topCandidates.length === 0 ? (
                <div
                  style={{
                    minHeight: "150px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    color: "#7183a1",
                    fontSize: "12px",
                  }}
                >
                  No candidates screened yet.
                </div>
              ) : (
                topCandidates.map((candidate) => {
                  const candidateName =
                    candidate.candidateName || "Unknown Candidate";

                  const initials = getCandidateInitials(candidateName);

                  return (
                    <div className="candidate-item" key={candidate.id}>
                      <div className="candidate-avatar">{initials}</div>

                      <div className="candidate-details">
                        <h3>{candidateName}</h3>

                        <p>{candidate.currentRole || "Role not available"}</p>
                      </div>

                      <div className="match-score">
                        <strong>{Number(candidate.matchScore || 0)}%</strong>

                        <span>Match</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* =================================================
            RECENT ACTIVITY
        ================================================= */}

        <section className="dashboard-card recent-card">
          <div className="card-header">
            <div>
              <h2>Recent Activity</h2>

              <p>Latest recruitment activity</p>
            </div>
          </div>

          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-dot"></div>

              <div>
                <strong>12 new resumes uploaded</strong>

                <p>Frontend Developer • 20 minutes ago</p>
              </div>
            </div>

            <div className="activity-item">
              <div className="activity-dot"></div>

              <div>
                <strong>5 candidates shortlisted</strong>

                <p>AI / ML Engineer • 1 hour ago</p>
              </div>
            </div>

            <div className="activity-item">
              <div className="activity-dot"></div>

              <div>
                <strong>New job created</strong>

                <p>UI/UX Designer • 3 hours ago</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
