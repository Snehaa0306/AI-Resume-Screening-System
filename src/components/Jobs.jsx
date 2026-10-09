
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Jobs.css";
import "./Dashboard.css";

import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "../firebase";

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingIds, setUpdatingIds] = useState([]);

  // LOAD JOBS FROM FIRESTORE
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setJobs([]);
        setLoading(false);
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

        console.log("Jobs loaded:", loadedJobs);
        setJobs(loadedJobs);
      } catch (error) {
        console.error("Error loading jobs from Firebase:", error);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // FORMAT DATE
  const formatDate = (date) => {
    if (!date) return "—";

    if (date?.toDate) {
      return date.toDate().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }

    const jobDate = new Date(date);

    if (Number.isNaN(jobDate.getTime())) return "—";

    return jobDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // JOB INITIALS
  const getJobInitials = (title) => {
    if (!title) return "JB";

    const words = title.trim().split(/\s+/).filter(Boolean);

    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }

    return (
      words[0].charAt(0) + words[1].charAt(0)
    ).toUpperCase();
  };

  // CHECK JOB STATUS
  const isJobActive = (job) =>
    !job.status || String(job.status).toLowerCase() === "active";

  // SEARCH JOBS
  const filteredJobs = jobs.filter((job) => {
    const search = searchTerm.toLowerCase().trim();

    if (!search) return true;

    const searchableText = [
      job.jobTitle,
      job.department,
      job.experience,
      job.requiredSkills,
      job.preferredSkills,
      job.status,
    ]
      .filter(Boolean)
      .map((value) =>
        Array.isArray(value) ? value.join(" ") : String(value)
      )
      .join(" ")
      .toLowerCase();

    return searchableText.includes(search);
  });

  // TOGGLE ACTIVE / INACTIVE
  const toggleJobStatus = async (job) => {
    if (!job.id || updatingIds.includes(job.id)) return;

    const newStatus = isJobActive(job) ? "Inactive" : "Active";

    setUpdatingIds((prev) => [...prev, job.id]);

    try {
      await updateDoc(doc(db, "jobs", job.id), {
        status: newStatus,
      });

      setJobs((prev) =>
        prev.map((item) =>
          item.id === job.id
            ? { ...item, status: newStatus }
            : item
        )
      );
    } catch (error) {
      console.error("Error updating job status:", error);
      alert("Unable to update job status. Please try again.");
    } finally {
      setUpdatingIds((prev) =>
        prev.filter((id) => id !== job.id)
      );
    }
  };

  // SUMMARY COUNTS
  const activeJobsCount = jobs.filter(isJobActive).length;
  const inactiveJobsCount = jobs.length - activeJobsCount;

  return (
    <div className="dashboard-page jobs-page">
      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <div className="dashboard-logo">
          <span>AI</span>
          Resume Analyzer
        </div>

        <nav className="sidebar-menu">
          <Link to="/dashboard" className="sidebar-link">
            <img src="/dashboard.svg" alt="" className="sidebar-icon" />
            Dashboard
          </Link>

          <Link to="/jobs" className="sidebar-link active">
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

      {/* MAIN CONTENT */}
      <main className="jobs-main">
        {/* HEADER */}
        <div className="jobs-header">
          <div>
            <p className="jobs-small-text">Jobs</p>
            <h1>Jobs</h1>
            <p className="jobs-subtitle">
              Manage your job openings and candidate screening requirements.
            </p>
          </div>

          <Link to="/create-job" className="jobs-create-button">
            <span>＋</span>
            Create New Job
          </Link>
        </div>

        {/* JOB SUMMARY */}
        <div className="jobs-summary">
          <div className="jobs-summary-card">
            <div className="jobs-summary-icon blue">▣</div>
            <div>
              <span>Total Jobs</span>
              <strong>{jobs.length}</strong>
            </div>
          </div>

          <div className="jobs-summary-card">
            <div className="jobs-summary-icon green">✓</div>
            <div>
              <span>Active Jobs</span>
              <strong>{activeJobsCount}</strong>
            </div>
          </div>

          <div className="jobs-summary-card">
            <div className="jobs-summary-icon purple">◷</div>
            <div>
              <span>Inactive Jobs</span>
              <strong>{inactiveJobsCount}</strong>
            </div>
          </div>
        </div>

        {/* JOBS CARD */}
        <div className="jobs-card">
          <div className="jobs-card-header jobs-card-header-tools">
            <div>
              <h2>All Jobs</h2>
              <p>
                View and manage the positions created for recruitment.
              </p>
            </div>

            <div className="jobs-tools">
              {/* SEARCH BAR */}
              <div className="jobs-search">
                <span className="jobs-search-icon">⌕</span>

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search jobs..."
                  aria-label="Search jobs"
                />

                {searchTerm && (
                  <button
                    type="button"
                    className="jobs-search-clear"
                    onClick={() => setSearchTerm("")}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>

              <span className="jobs-count">
                {filteredJobs.length}{" "}
                {filteredJobs.length === 1 ? "Job" : "Jobs"}
              </span>
            </div>
          </div>

          {/* LOADING */}
          {loading ? (
            <div className="jobs-empty">
              <div className="jobs-empty-icon">▣</div>
              <h3>Loading jobs...</h3>
              <p>Fetching your jobs from Firebase.</p>
            </div>
          ) : jobs.length === 0 ? (
            /* NO JOBS */
            <div className="jobs-empty">
              <div className="jobs-empty-icon">▣</div>
              <h3>No jobs created yet</h3>
              <p>
                Create your first job to start screening candidates.
              </p>
              <Link to="/create-job" className="jobs-empty-button">
                Create New Job
              </Link>
            </div>
          ) : filteredJobs.length === 0 ? (
            /* NO SEARCH RESULTS */
            <div className="jobs-empty">
              <div className="jobs-empty-icon">⌕</div>
              <h3>No matching jobs found</h3>
              <p>
                Try searching by job title, department, experience, or skills.
              </p>
              <button
                type="button"
                className="jobs-empty-button"
                onClick={() => setSearchTerm("")}
              >
                Clear Search
              </button>
            </div>
          ) : (
            /* JOB LIST */
            <div className="jobs-list">
              {filteredJobs.map((job) => {
                const active = isJobActive(job);
                const updating = updatingIds.includes(job.id);

                return (
                  <div className="jobs-item" key={job.id}>
                    {/* JOB ICON */}
                    <div className="jobs-job-icon">
                      {getJobInitials(job.jobTitle)}
                    </div>

                    {/* JOB INFORMATION */}
                    <div className="jobs-job-details">
                      <h3>{job.jobTitle || "Untitled Job"}</h3>

                      <div className="jobs-job-meta">
                        <span>{job.department || "No department"}</span>
                        <span className="jobs-meta-dot">•</span>
                        <span>
                          {job.experience || "Experience not specified"}
                        </span>
                      </div>

                      <div className="jobs-skills">
                        <strong>Required Skills:</strong>
                        <span>
                          {Array.isArray(job.requiredSkills)
                            ? job.requiredSkills.join(", ")
                            : job.requiredSkills || "No required skills added"}
                        </span>
                      </div>
                    </div>

                    {/* STATUS AND DATE */}
                    <div className="jobs-status-container">
                      <span
                        className={`jobs-status ${
                          active ? "active" : "inactive"
                        }`}
                      >
                        {active ? "Active" : "Inactive"}
                      </span>

                      <span className="jobs-created-date">
                        Created {formatDate(job.createdAt)}
                      </span>
                    </div>

                    {/* ACTIONS */}
                    <div className="jobs-item-action">
                      <button
                        type="button"
                        className={`jobs-toggle-button ${
                          active ? "make-inactive" : "make-active"
                        }`}
                        disabled={updating}
                        onClick={() => toggleJobStatus(job)}
                      >
                        {updating
                          ? "Updating..."
                          : active
                          ? "Mark Inactive"
                          : "Mark Active"}
                      </button>

                      <Link
                        to="/screen-resumes"
                        className="jobs-screen-button"
                      >
                        Screen Resumes
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Jobs;