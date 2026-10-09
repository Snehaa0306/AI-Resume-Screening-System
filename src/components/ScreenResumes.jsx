import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import "./ScreenResumes.css";
import "./Dashboard.css";
import "./Analysis.css";

import { onAuthStateChanged } from "firebase/auth";

import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { auth, db } from "../firebase";

function ScreenResumes() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // =========================================================
  // JOBS
  // =========================================================

  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [firebaseUser, setFirebaseUser] = useState(null);

  // =========================================================
  // RESUMES
  // =========================================================

  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");

  // =========================================================
  // ANALYSIS
  // =========================================================

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStarted, setAnalysisStarted] = useState(false);
  const [analysisResults, setAnalysisResults] = useState([]);

  // =========================================================
  // CANDIDATE DECISIONS
  // =========================================================

  const [candidateDecisions, setCandidateDecisions] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("resumeScreenCandidateDecisions") || "[]"
      );
    } catch {
      return [];
    }
  });

  // =========================================================
  // CURRENT USER
  // =========================================================

  const [userName, setUserName] = useState("Recruiter");

  // =========================================================
  // GET CURRENT USER
  // =========================================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserName("Recruiter");
        setFirebaseUser(null);
        return;
      }

      setFirebaseUser(user);

      try {
        const userQuery = query(
          collection(db, "users"),
          where("__name__", "==", user.uid)
        );

        const userSnapshot = await getDocs(userQuery);

        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data();

          setUserName(userData.fullName || "Recruiter");
        } else {
          setUserName("Recruiter");
        }
      } catch (error) {
        console.error("Error loading user:", error);
        setUserName("Recruiter");
      }
    });

    return () => unsubscribe();
  }, []);

  const userInitial = userName
    .split(" ")
    .filter(Boolean)
    .map((name) => name.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // =========================================================
  // LOAD ONLY LOGGED-IN RECRUITER'S JOBS
  // =========================================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setFirebaseUser(null);
        setJobs([]);
        return;
      }

      setFirebaseUser(user);

      try {
        console.log("Screen Resumes - Logged-in user UID:", user.uid);

        const jobsQuery = query(
          collection(db, "jobs"),
          where("recruiterId", "==", user.uid)
        );

        const querySnapshot = await getDocs(jobsQuery);

        const loadedJobs = querySnapshot.docs.map((jobDoc) => ({
          id: jobDoc.id,
          ...jobDoc.data(),
        }));

        console.log("Screen Resumes - Firebase jobs:", loadedJobs);

        setJobs(loadedJobs);
      } catch (error) {
        console.error("Error loading jobs from Firebase:", error);

        setJobs([]);
        setError("Unable to load your jobs.");
      }
    });

    return () => unsubscribe();
  }, []);

  // =========================================================
  // SELECTED JOB
  // =========================================================

  const selectedJob = jobs.find(
    (job) => String(job.id) === String(selectedJobId)
  );

  // =========================================================
  // FILE SELECTION
  // =========================================================

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    addFiles(selectedFiles);

    event.target.value = "";
  };

  // =========================================================
  // ADD FILES
  // =========================================================

  const addFiles = (selectedFiles) => {
    setError("");

    const allowedExtensions = [".pdf", ".doc", ".docx"];

    const validFiles = [];
    const invalidFiles = [];

    selectedFiles.forEach((file) => {
      const fileName = file.name.toLowerCase();

      const isValid = allowedExtensions.some((extension) =>
        fileName.endsWith(extension)
      );

      if (isValid) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      setError(
        `Unsupported file type: ${invalidFiles.join(
          ", "
        )}. Please upload PDF, DOC or DOCX files.`
      );
    }

    setFiles((previousFiles) => {
      const existingNames = previousFiles.map((file) => file.name);

      const newFiles = validFiles.filter(
        (file) => !existingNames.includes(file.name)
      );

      if (newFiles.length > 0) {
        setAnalysisStarted(false);
        setAnalysisResults([]);
      }

      return [...previousFiles, ...newFiles];
    });
  };

  // =========================================================
  // DRAG AND DROP
  // =========================================================

  const handleDrop = (event) => {
    event.preventDefault();

    const droppedFiles = Array.from(event.dataTransfer.files || []);

    addFiles(droppedFiles);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  // =========================================================
  // REMOVE FILE
  // =========================================================

  const handleRemoveFile = (fileName) => {
    setFiles((previousFiles) =>
      previousFiles.filter((file) => file.name !== fileName)
    );

    setAnalysisStarted(false);
    setAnalysisResults([]);
    setError("");
  };

  // =========================================================
  // FORMAT FILE SIZE
  // =========================================================

  const formatFileSize = (bytes) => {
    if (!bytes) {
      return "0 KB";
    }

    const sizeInKB = bytes / 1024;

    if (sizeInKB < 1024) {
      return `${sizeInKB.toFixed(1)} KB`;
    }

    return `${(sizeInKB / 1024).toFixed(1)} MB`;
  };

  // =========================================================
  // GET FILE TYPE
  // =========================================================

  const getFileType = (fileName) => {
    if (!fileName) {
      return "FILE";
    }

    return fileName.split(".").pop().toUpperCase();
  };

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
  // CANDIDATE IDENTIFIERS
  // =========================================================

  const getJobKey = (job) => String(job?.id || job?.jobTitle || "unknown-job");

  const getCandidateKey = (candidate) =>
    String(
      candidate.fileName || candidate.candidateName || "unknown-candidate"
    );

  // =========================================================
  // GET SAVED CANDIDATE DECISION
  // =========================================================

  const getCandidateDecision = (candidate) => {
    const jobKey = getJobKey(selectedJob);

    const candidateKey = getCandidateKey(candidate);

    return (
      candidateDecisions.find(
        (item) => item.jobKey === jobKey && item.candidateKey === candidateKey
      )?.status || ""
    );
  };

  // =========================================================
  // SAVE SHORTLIST OR REJECT DECISION
  // =========================================================

  const handleCandidateDecision = (candidate, status) => {
    const jobKey = getJobKey(selectedJob);

    const candidateKey = getCandidateKey(candidate);

    const record = {
      jobKey,
      jobId: selectedJob?.id || null,

      jobTitle: selectedJob?.jobTitle || "Untitled Job",

      candidateKey,

      candidateName: candidate.candidateName || "Unknown Candidate",

      currentRole: candidate.currentRole || "",

      experienceYears: candidate.experienceYears ?? 0,

      matchScore: Number(candidate.matchScore ?? candidate.score ?? 0),

      recommendation: candidate.recommendation || "",

      summary: candidate.summary || "",

      fileName: candidate.fileName || "",

      status,
    };

    const updated = [
      ...candidateDecisions.filter(
        (item) =>
          !(item.jobKey === jobKey && item.candidateKey === candidateKey)
      ),
      record,
    ];

    try {
      localStorage.setItem(
        "resumeScreenCandidateDecisions",
        JSON.stringify(updated)
      );

      setCandidateDecisions(updated);
    } catch (err) {
      console.error("Unable to save candidate decision:", err);

      setError("Unable to save this decision in your browser.");
    }
  };

  // =========================================================
  // SCORE STYLE
  // =========================================================

  const getScoreClass = (score) => {
    if (score >= 75) {
      return "high";
    }

    if (score >= 50) {
      return "medium";
    }

    return "low";
  };

  // =========================================================
  // RECOMMENDATION STYLE
  // =========================================================

  const getRecommendationClass = (recommendation) => {
    if (!recommendation) {
      return "";
    }

    return recommendation.toLowerCase().replace(/\s+/g, "-");
  };

  // =========================================================
  // SKILLS
  // =========================================================

  const renderSkills = (skills, type = "") => {
    if (!Array.isArray(skills) || skills.length === 0) {
      return <span className="candidate-analysis-no-skills">None</span>;
    }

    return skills.map((skill, index) => (
      <span
        className={`candidate-analysis-skill ${type}`}
        key={`${skill}-${index}`}
      >
        {skill}
      </span>
    ));
  };

  // =========================================================
  // CANDIDATE INITIALS
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
  // START ANALYSIS
  // =========================================================

  const handleStartAnalysis = async () => {
    setError("");
    setAnalysisStarted(false);
    setAnalysisResults([]);

    if (!selectedJobId) {
      setError("Please select a job before uploading resumes.");
      return;
    }

    if (!selectedJob) {
      setError("The selected job could not be found. Please select it again.");
      return;
    }

    if (files.length === 0) {
      setError("Please upload at least one candidate resume.");
      return;
    }

    const actualFiles = files.filter((file) => file instanceof File);

    if (actualFiles.length !== files.length) {
      setError(
        "The original resume files are no longer available. Please upload the resumes again."
      );
      return;
    }

    const loggedInUser = firebaseUser || auth.currentUser;

    if (!loggedInUser) {
      setError("Your login session could not be found. Please sign in again.");
      return;
    }

    setIsAnalyzing(true);

    try {
      // =====================================================
      // SAVE CANDIDATE UPLOAD RECORDS
      // =====================================================

      let existingCandidates = [];

      try {
        existingCandidates = JSON.parse(
          localStorage.getItem("resumeScreenCandidates") || "[]"
        );

        if (!Array.isArray(existingCandidates)) {
          existingCandidates = [];
        }
      } catch {
        existingCandidates = [];
      }

      const newCandidates = actualFiles.map((file, index) => ({
        id: Date.now() + index,

        jobId: selectedJob.id,

        jobTitle: selectedJob.jobTitle,

        fileName: file.name,

        fileType: getFileType(file.name),

        fileSize: file.size,

        status: "Uploaded",

        uploadedAt: new Date().toISOString(),
      }));

      const updatedCandidates = [...existingCandidates, ...newCandidates];

      localStorage.setItem(
        "resumeScreenCandidates",
        JSON.stringify(updatedCandidates)
      );

      // =====================================================
      // PREPARE BACKEND REQUEST
      // =====================================================

      const formData = new FormData();

      formData.append("jobTitle", selectedJob.jobTitle || "");

      formData.append("department", selectedJob.department || "");

      formData.append("experience", selectedJob.experience || "");

      formData.append("jobDescription", selectedJob.jobDescription || "");

      formData.append("requiredSkills", selectedJob.requiredSkills || "");

      formData.append("preferredSkills", selectedJob.preferredSkills || "");

      actualFiles.forEach((file) => {
        formData.append("resumes", file);
      });

      // =====================================================
      // CALL BACKEND
      // =====================================================

      const response = await fetch(
        "http://localhost:5000/api/analyze-resumes",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Resume analysis request failed.");
      }

      console.log("BACKEND RESPONSE:", data);

      const results = data.data?.resumes || [];

      console.log("AI ANALYSIS RESULTS:", results);

      setAnalysisResults(results);

      // =====================================================
      // SAVE AI RESULTS TO FIRESTORE
      // =====================================================

      for (const candidate of results) {
        const score = Number(candidate.matchScore ?? candidate.score ?? 0);

        await addDoc(collection(db, "candidateAnalyses"), {
          recruiterId: loggedInUser.uid,

          recruiterEmail: loggedInUser.email || "",

          jobId: selectedJob.id,

          jobTitle: selectedJob.jobTitle || "Untitled Job",

          candidateName: candidate.candidateName || "Unknown Candidate",

          fileName: candidate.fileName || "",

          currentRole: candidate.currentRole || "",

          experienceYears: Number(candidate.experienceYears ?? 0),

          matchScore: score,

          experienceMatch: candidate.experienceMatch || "",

          recommendation: candidate.recommendation || "",

          matchedRequiredSkills: candidate.matchedRequiredSkills || [],

          missingRequiredSkills: candidate.missingRequiredSkills || [],

          matchedPreferredSkills: candidate.matchedPreferredSkills || [],

          missingPreferredSkills: candidate.missingPreferredSkills || [],

          summary: candidate.summary || "",

          reasoning: candidate.reasoning || "",

          createdAt: serverTimestamp(),
        });
      }

      console.log("Candidate analysis scores saved to Firestore.");

      setAnalysisStarted(true);
    } catch (err) {
      console.error("Backend/Firebase connection error:", err);

      setError(
        err.message ||
          "Unable to process the resumes. Please make sure the backend is running."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem("resumeScreenCurrentUser");

    navigate("/signin");
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="dashboard-page screen-resumes-page">
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

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

          <Link to="/jobs" className="sidebar-link">
            <img src="/jobs.svg" alt="" className="sidebar-icon" />
            Jobs
          </Link>

          <Link to="/screen-resumes" className="sidebar-link active">
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

          <button
            type="button"
            className="sidebar-link logout-link"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="screen-resumes-header-text">
            <p className="dashboard-small-text">Resume Screening</p>

            <h1>Screen Resumes</h1>

            <p className="dashboard-subtitle">
              Select a job and upload candidate resumes for screening and
              analysis.
            </p>
          </div>
        </header>

        <div className="screen-resumes-content">
          {/* =================================================
              STEP 1: SELECT JOB
          ================================================= */}

          <section className="screen-resumes-card">
            <div className="screen-resumes-card-heading">
              <div className="screen-resumes-step-number">1</div>

              <div>
                <h2>Select Job</h2>

                <p>Choose the job against which candidates will be analyzed.</p>
              </div>
            </div>

            <label className="screen-resumes-label" htmlFor="job-position">
              Job Position
            </label>

            {jobs.length === 0 ? (
              <div className="screen-resumes-no-jobs">
                <div className="screen-resumes-empty-icon">💼</div>

                <h3>No jobs available</h3>

                <p>Create a job first before uploading candidate resumes.</p>

                <Link
                  to="/create-job"
                  className="screen-resumes-create-job-btn"
                >
                  + Create New Job
                </Link>
              </div>
            ) : (
              <select
                id="job-position"
                className="screen-resumes-job-select"
                value={selectedJobId}
                onChange={(event) => {
                  setSelectedJobId(event.target.value);

                  setAnalysisStarted(false);

                  setAnalysisResults([]);

                  setError("");
                }}
              >
                <option value="">Select a job</option>

                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.jobTitle}

                    {job.department ? ` — ${job.department}` : ""}
                  </option>
                ))}
              </select>
            )}

            {selectedJob && (
              <div className="screen-resumes-selected-job">
                <div className="screen-resumes-selected-icon">
                  {getJobInitials(selectedJob.jobTitle)}
                </div>

                <div>
                  <strong>{selectedJob.jobTitle}</strong>

                  <p>
                    {selectedJob.department || "Department not specified"}

                    {" • "}

                    {selectedJob.experience || "Experience not specified"}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* =================================================
              STEP 2: UPLOAD RESUMES
          ================================================= */}

          <section className="screen-resumes-card">
            <div className="screen-resumes-card-heading">
              <div className="screen-resumes-step-number">2</div>

              <div>
                <h2>Upload Candidate Resumes</h2>

                <p>Upload one or multiple candidate resumes.</p>
              </div>
            </div>

            <div
              className="screen-resumes-dropzone"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => !isAnalyzing && fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (
                  !isAnalyzing &&
                  (event.key === "Enter" || event.key === " ")
                ) {
                  event.preventDefault();

                  fileInputRef.current?.click();
                }
              }}
            >
              <div className="screen-resumes-upload-icon">↑</div>

              <h3>Drag &amp; drop resumes here</h3>

              <p>or click to browse files</p>

              <span>Supported formats: PDF, DOC, DOCX</span>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                multiple
                onChange={handleFileSelect}
                hidden
                disabled={isAnalyzing}
              />
            </div>

            {error && (
              <div className="screen-resumes-error" role="alert">
                {error}
              </div>
            )}

            {files.length > 0 && (
              <div className="screen-resumes-file-section">
                <div className="screen-resumes-file-heading">
                  <h3>Uploaded Resumes</h3>

                  <span>
                    {files.length} {files.length === 1 ? "resume" : "resumes"}
                  </span>
                </div>

                <div className="screen-resumes-file-list">
                  {files.map((file) => (
                    <div
                      className="screen-resumes-file-item"
                      key={`${file.name}-${file.lastModified}`}
                    >
                      <div className="screen-resumes-file-icon">
                        {getFileType(file.name)}
                      </div>

                      <div className="screen-resumes-file-info">
                        <strong>{file.name}</strong>

                        <span>{formatFileSize(file.size)}</span>
                      </div>

                      <div className="screen-resumes-file-status">Ready</div>

                      <button
                        type="button"
                        className="screen-resumes-remove-btn"
                        onClick={(event) => {
                          event.stopPropagation();

                          handleRemoveFile(file.name);
                        }}
                        aria-label={`Remove ${file.name}`}
                        disabled={isAnalyzing}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* =================================================
              INFORMATION CARD
          ================================================= */}

          {!analysisStarted && (
            <section className="screen-resumes-info-card">
              <div className="screen-resumes-info-icon">✦</div>

              <div>
                <h3>How resume screening works</h3>

                <p>
                  The selected job description will be used as the reference
                  when analyzing the uploaded candidate resumes.
                </p>

                <div className="screen-resumes-info-points">
                  <span>✓ Skills matching</span>

                  <span>✓ Experience comparison</span>

                  <span>✓ Missing requirements</span>

                  <span>✓ Overall match analysis</span>
                </div>
              </div>
            </section>
          )}

          {/* =================================================
              ANALYSIS LOADING
          ================================================= */}

          {isAnalyzing && (
            <section className="analysis-ai-card screen-resumes-loading">
              <div className="analysis-ai-icon">
                <span className="analysis-spinner" />
              </div>

              <div className="analysis-ai-content">
                <p className="analysis-section-label">
                  AI SCREENING IN PROGRESS
                </p>

                <h2>Analyzing candidate resumes...</h2>

                <p>
                  Please wait while the system extracts resume information and
                  compares candidates with the selected job requirements.
                </p>
              </div>
            </section>
          )}

          {/* =================================================
              RESULTS
          ================================================= */}

          {analysisStarted && analysisResults.length > 0 && (
            <section className="candidate-analysis-section">
              <div className="candidate-analysis-header">
                <div className="candidate-analysis-header-text">
                  <p className="candidate-analysis-label">AI RESULTS</p>

                  <h2 className="candidate-analysis-title">
                    Candidate Analysis
                  </h2>

                  <p className="candidate-analysis-description">
                    Candidates analyzed against the selected job requirements.
                  </p>
                </div>

                <div className="candidate-analysis-count">
                  <strong>{analysisResults.length}</strong>

                  <span>Candidates</span>
                </div>
              </div>

              <div className="candidate-analysis-list">
                {analysisResults.map((candidate, index) => {
                  const score = Number(
                    candidate.matchScore ?? candidate.score ?? 0
                  );

                  const recommendationClass = getRecommendationClass(
                    candidate.recommendation
                  );

                  const decision = getCandidateDecision(candidate);

                  return (
                    <div
                      className="candidate-analysis-card"
                      key={`${
                        candidate.fileName ||
                        candidate.candidateName ||
                        "candidate"
                      }-${index}`}
                    >
                      <div className="candidate-analysis-card-header">
                        <div className="candidate-analysis-person">
                          <div className="candidate-analysis-avatar">
                            {getCandidateInitials(candidate.candidateName)}
                          </div>

                          <div className="candidate-analysis-person-info">
                            <h3>
                              {candidate.candidateName || "Unknown Candidate"}
                            </h3>

                            <p>
                              {candidate.currentRole || "Role not available"}
                            </p>
                          </div>
                        </div>

                        <div className="candidate-analysis-score">
                          <span
                            className={`candidate-analysis-score-value ${getScoreClass(
                              score
                            )}`}
                          >
                            {score}%
                          </span>

                          <span className="candidate-analysis-score-label">
                            Match Score
                          </span>
                        </div>
                      </div>

                      <div className="candidate-analysis-meta">
                        <div className="candidate-analysis-meta-item">
                          <span>Experience</span>

                          <strong>
                            {candidate.experienceYears ?? 0} years
                          </strong>
                        </div>

                        <div className="candidate-analysis-meta-item">
                          <span>Experience Match</span>

                          <strong>
                            {candidate.experienceMatch || "Not available"}
                          </strong>
                        </div>

                        <div className="candidate-analysis-meta-item">
                          <span>Recommendation</span>

                          <strong
                            className={`candidate-analysis-recommendation ${recommendationClass}`}
                          >
                            {candidate.recommendation || "Not available"}
                          </strong>
                        </div>
                      </div>

                      <div className="candidate-analysis-body">
                        <div className="candidate-analysis-skills">
                          <div className="candidate-analysis-skill-box">
                            <div className="candidate-analysis-skill-heading">
                              <h4>Matched Required Skills</h4>

                              <span>
                                {candidate.matchedRequiredSkills?.length || 0}
                              </span>
                            </div>

                            <div className="candidate-analysis-skill-list">
                              {renderSkills(
                                candidate.matchedRequiredSkills,
                                "matched"
                              )}
                            </div>
                          </div>

                          <div className="candidate-analysis-skill-box">
                            <div className="candidate-analysis-skill-heading">
                              <h4>Missing Required Skills</h4>

                              <span>
                                {candidate.missingRequiredSkills?.length || 0}
                              </span>
                            </div>

                            <div className="candidate-analysis-skill-list">
                              {renderSkills(
                                candidate.missingRequiredSkills,
                                "missing"
                              )}
                            </div>
                          </div>

                          <div className="candidate-analysis-skill-box">
                            <div className="candidate-analysis-skill-heading">
                              <h4>Matched Preferred Skills</h4>

                              <span>
                                {candidate.matchedPreferredSkills?.length || 0}
                              </span>
                            </div>

                            <div className="candidate-analysis-skill-list">
                              {renderSkills(
                                candidate.matchedPreferredSkills,
                                "matched"
                              )}
                            </div>
                          </div>

                          <div className="candidate-analysis-skill-box">
                            <div className="candidate-analysis-skill-heading">
                              <h4>Missing Preferred Skills</h4>

                              <span>
                                {candidate.missingPreferredSkills?.length || 0}
                              </span>
                            </div>

                            <div className="candidate-analysis-skill-list">
                              {renderSkills(
                                candidate.missingPreferredSkills,
                                "missing"
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="candidate-analysis-summary">
                          <p className="candidate-analysis-summary-label">
                            AI SUMMARY
                          </p>

                          <p>{candidate.summary || "No summary available."}</p>
                        </div>

                        {candidate.reasoning && (
                          <details className="candidate-analysis-reasoning">
                            <summary>View detailed AI reasoning</summary>

                            <p>{candidate.reasoning}</p>
                          </details>
                        )}

                        <div className="candidate-analysis-actions">
                          {decision && (
                            <span
                              className={`candidate-analysis-current-status ${decision}`}
                              aria-live="polite"
                            >
                              {decision === "shortlisted"
                                ? "Currently shortlisted"
                                : "Currently rejected"}
                            </span>
                          )}

                          <div className="candidate-analysis-decision-buttons">
                            <button
                              type="button"
                              className={`candidate-analysis-shortlist-btn ${
                                decision === "shortlisted" ? "selected" : ""
                              }`}
                              aria-pressed={decision === "shortlisted"}
                              onClick={() =>
                                handleCandidateDecision(
                                  candidate,
                                  "shortlisted"
                                )
                              }
                            >
                              {decision === "shortlisted"
                                ? "Shortlisted ✓"
                                : "Shortlist"}
                            </button>

                            <button
                              type="button"
                              className={`candidate-analysis-reject-btn ${
                                decision === "rejected" ? "selected" : ""
                              }`}
                              aria-pressed={decision === "rejected"}
                              onClick={() =>
                                handleCandidateDecision(candidate, "rejected")
                              }
                            >
                              {decision === "rejected"
                                ? "Rejected ✓"
                                : "Reject"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* =================================================
              NO RESULTS
          ================================================= */}

          {analysisStarted && analysisResults.length === 0 && (
            <section className="analysis-result-placeholder">
              <div className="analysis-result-icon">!</div>

              <div>
                <h2>No analysis results available</h2>

                <p>
                  The resumes were processed, but no analysis results were
                  returned by the backend.
                </p>
              </div>
            </section>
          )}

          {/* =================================================
              BOTTOM ACTIONS
          ================================================= */}

          <div className="screen-resumes-actions">
            <Link to="/dashboard" className="screen-resumes-cancel-btn">
              Cancel
            </Link>

            {!analysisStarted && (
              <button
                type="button"
                className="screen-resumes-analyze-btn"
                onClick={handleStartAnalysis}
                disabled={!selectedJobId || files.length === 0 || isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <span className="analysis-spinner" />
                    Analyzing Resumes...
                  </>
                ) : (
                  <>
                    Continue to Analysis
                    <span>→</span>
                  </>
                )}
              </button>
            )}

            {analysisStarted && (
              <button
                type="button"
                className="screen-resumes-analyze-btn"
                onClick={() => {
                  setAnalysisStarted(false);
                  setAnalysisResults([]);
                  setError("");
                }}
              >
                Analyze Again
                <span>↻</span>
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ScreenResumes;
