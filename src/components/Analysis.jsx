import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Analysis.css";

function Analysis() {
  const location = useLocation();
  const navigate = useNavigate();

  const [job, setJob] = useState(location.state?.job || null);
  const [files, setFiles] = useState(location.state?.files || []);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStarted, setAnalysisStarted] = useState(false);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [error, setError] = useState("");

  // Read previously saved shortlist/reject decisions.
  const [candidateDecisions, setCandidateDecisions] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("resumeScreenCandidateDecisions") || "[]"
      );
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!job) {
      try {
        const savedCandidates = JSON.parse(
          localStorage.getItem("resumeScreenCandidates") || "[]"
        );
        const latestCandidate = savedCandidates[savedCandidates.length - 1];

        if (latestCandidate?.jobId) {
          const savedJobs = JSON.parse(
            localStorage.getItem("resumeScreenJobs") || "[]"
          );
          const savedJob = savedJobs.find(
            (item) => item.id === latestCandidate.jobId
          );

          if (savedJob) setJob(savedJob);

          const candidatesForJob = savedCandidates.filter(
            (candidate) => candidate.jobId === latestCandidate.jobId
          );

          setFiles(
            candidatesForJob.map((candidate) => ({
              name: candidate.fileName,
              size: candidate.fileSize,
              type: candidate.fileType,
            }))
          );
        }
      } catch (err) {
        console.error("Unable to recover saved job information:", err);
      }
    }
  }, [job]);

  const currentUser = (() => {
    try {
      return JSON.parse(
        localStorage.getItem("resumeScreenCurrentUser") || "{}"
      );
    } catch {
      return {};
    }
  })();

  const userName = currentUser.fullName || "Recruiter";
  const userInitial = userName
    .split(" ")
    .filter(Boolean)
    .map((name) => name.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Job and candidate identifiers keep decisions associated with a job.
  const getJobKey = (selectedJob) =>
    String(selectedJob?.id || selectedJob?.jobTitle || "unknown-job");

  const getCandidateKey = (candidate) =>
    String(
      candidate.fileName ||
      candidate.candidateName ||
      "unknown-candidate"
    );

  const getCandidateDecision = (candidate) => {
    const jobKey = getJobKey(job);
    const candidateKey = getCandidateKey(candidate);

    return (
      candidateDecisions.find(
        (item) =>
          item.jobKey === jobKey &&
          item.candidateKey === candidateKey
      )?.status || ""
    );
  };

  // Save or update a candidate's decision without changing other records.
  const handleCandidateDecision = (candidate, status) => {
    const jobKey = getJobKey(job);
    const candidateKey = getCandidateKey(candidate);

    const record = {
      jobKey,
      jobId: job?.id || null,
      jobTitle: job?.jobTitle || "Untitled Job",
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
          !(
            item.jobKey === jobKey &&
            item.candidateKey === candidateKey
          )
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

  const getJobInitials = (title) => {
    if (!title) return "JB";
    const words = title.trim().split(" ").filter(Boolean);

    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }

    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  };

  const getFileType = (file) => {
    if (file.type && file.type.length <= 5) {
      return file.type.toUpperCase();
    }
    if (file.name) {
      return file.name.split(".").pop().toUpperCase();
    }
    return "FILE";
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "Size unavailable";
    const sizeInKB = bytes / 1024;

    if (sizeInKB < 1024) return `${sizeInKB.toFixed(1)} KB`;
    return `${(sizeInKB / 1024).toFixed(1)} MB`;
  };

  // Start AI analysis. The backend request remains unchanged.
  const handleStartAnalysis = async () => {
    setError("");
    setAnalysisStarted(false);
    setAnalysisResults([]);

    if (!job) {
      setError("No job was selected. Please go back and select a job.");
      return;
    }

    if (files.length === 0) {
      setError("No resumes were found. Please upload candidate resumes first.");
      return;
    }

    const actualFiles = files.filter((file) => file instanceof File);

    if (actualFiles.length !== files.length) {
      setError(
        "The original resume files are no longer available. Please go back to Upload Resumes and upload the resumes again."
      );
      setIsAnalyzing(false);
      return;
    }

    setIsAnalyzing(true);

    try {
      const formData = new FormData();

      formData.append("jobTitle", job.jobTitle || "");
      formData.append("department", job.department || "");
      formData.append("experience", job.experience || "");
      formData.append("jobDescription", job.jobDescription || "");
      formData.append("requiredSkills", job.requiredSkills || "");
      formData.append("preferredSkills", job.preferredSkills || "");

      actualFiles.forEach((file) => {
        formData.append("resumes", file);
      });

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
      setIsAnalyzing(false);
      setAnalysisStarted(true);
    } catch (err) {
      console.error("Backend connection error:", err);
      setIsAnalyzing(false);
      setError(
        err.message ||
          "Unable to process the resumes. Please make sure the backend is running."
      );
    }
  };

  const handleBackToUpload = () => {
    navigate("/upload-resumes", { state: { job } });
  };

  const getScoreClass = (score) => {
    if (score >= 75) return "high";
    if (score >= 50) return "medium";
    return "low";
  };

  const getRecommendationClass = (recommendation) => {
    if (!recommendation) return "";
    return recommendation.toLowerCase().replace(/\s+/g, "-");
  };

  const renderSkills = (skills, type = "") => {
    if (!skills || skills.length === 0) {
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

  const getCandidateInitials = (name) => {
    if (!name) return "NA";
    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="analysis-page">
      <aside className="analysis-sidebar">
        <div className="analysis-logo">
          <div className="analysis-logo-mark">RS</div>
          <div>
            <h2>ResumeScreen</h2>
            <span>AI Recruitment</span>
          </div>
        </div>

        <nav className="analysis-nav">
          <Link to="/dashboard" className="analysis-nav-item">
            <span className="analysis-nav-icon">▦</span>
            Dashboard
          </Link>

          <Link to="/jobs" className="analysis-nav-item">
            <span className="analysis-nav-icon">💼</span>
            Jobs
          </Link>

          <Link
            to="/candidates"
            className="analysis-nav-item analysis-nav-active"
          >
            <span className="analysis-nav-icon">👥</span>
            Candidates
          </Link>

          <Link to="/shortlisted" className="analysis-nav-item">
            <span className="analysis-nav-icon">✓</span>
            Shortlisted
          </Link>
        </nav>

        <div className="analysis-sidebar-bottom">
          <Link to="/settings" className="analysis-nav-item">
            <span className="analysis-nav-icon">⚙</span>
            Settings
          </Link>

          <button
            className="analysis-logout"
            onClick={() => {
              localStorage.removeItem("resumeScreenCurrentUser");
              navigate("/signin");
            }}
          >
            <span className="analysis-nav-icon">↪</span>
            Logout
          </button>
        </div>
      </aside>

      <main className="analysis-main">
        <header className="analysis-header">
          <div className="analysis-header-left">
            <p className="analysis-breadcrumb">
              Candidates / Resume Analysis
            </p>
            <h1>Resume Analysis</h1>
            <p className="analysis-header-description">
              Review candidate resumes against the selected job requirements.
            </p>
          </div>

          <div className="analysis-header-right">
            <div className="analysis-user">
              <div className="analysis-user-avatar">{userInitial}</div>
              <div>
                <strong>{userName}</strong>
                <span>Recruiter</span>
              </div>
            </div>
          </div>
        </header>

        <div className="analysis-content">
          {error && (
            <div className="analysis-error">
              <span>!</span>
              {error}
            </div>
          )}

          <section className="analysis-card analysis-job-card">
            <div className="analysis-card-heading">
              <div className="analysis-heading-icon">
                {getJobInitials(job?.jobTitle)}
              </div>
              <div>
                <p className="analysis-section-label">SELECTED JOB</p>
                <h2>{job?.jobTitle || "No job selected"}</h2>
                <p>{job?.department || "Department not specified"}</p>
              </div>
            </div>

            {job ? (
              <div className="analysis-job-details">
                <div className="analysis-detail-item">
                  <span>Experience Required</span>
                  <strong>{job.experience || "Not specified"}</strong>
                </div>
                <div className="analysis-detail-item">
                  <span>Required Skills</span>
                  <strong>
                    {job.requiredSkills || "No required skills specified"}
                  </strong>
                </div>
                <div className="analysis-detail-item">
                  <span>Preferred Skills</span>
                  <strong>
                    {job.preferredSkills || "No preferred skills specified"}
                  </strong>
                </div>
              </div>
            ) : (
              <div className="analysis-empty-job">
                <p>No job information is available.</p>
                <Link to="/upload-resumes">Go back to Upload Resumes</Link>
              </div>
            )}
          </section>

          <section className="analysis-card">
            <div className="analysis-card-top">
              <div>
                <p className="analysis-section-label">CANDIDATE RESUMES</p>
                <h2>Uploaded Resumes</h2>
                <p>These resumes will be evaluated against the selected job.</p>
              </div>
              <div className="analysis-resume-count">
                <strong>{files.length}</strong>
                <span>{files.length === 1 ? "Resume" : "Resumes"}</span>
              </div>
            </div>

            {files.length > 0 ? (
              <div className="analysis-file-list">
                {files.map((file, index) => (
                  <div
                    className="analysis-file-item"
                    key={`${file.name}-${index}`}
                  >
                    <div className="analysis-file-icon">
                      {getFileType(file)}
                    </div>
                    <div className="analysis-file-info">
                      <strong>
                        {file.name || `Candidate Resume ${index + 1}`}
                      </strong>
                      <span>{formatFileSize(file.size)}</span>
                    </div>
                    <div className="analysis-file-status">
                      <span className="analysis-status-dot" />
                      Ready
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="analysis-empty-files">
                <div className="analysis-empty-icon">↑</div>
                <h3>No resumes available</h3>
                <p>Upload candidate resumes before starting the analysis.</p>
                <Link to="/upload-resumes">Upload Resumes</Link>
              </div>
            )}
          </section>

          {!analysisStarted && (
            <section className="analysis-ai-card">
              <div className="analysis-ai-icon">✦</div>
              <div className="analysis-ai-content">
                <p className="analysis-section-label">AI SCREENING</p>
                <h2>Analyze candidates against this job</h2>
                <p>
                  The AI screening process will compare the information
                  extracted from each resume with the selected job description
                  and requirements.
                </p>
                <div className="analysis-ai-points">
                  <div><span>✓</span><p>Skills matching</p></div>
                  <div><span>✓</span><p>Experience comparison</p></div>
                  <div><span>✓</span><p>Missing requirements</p></div>
                  <div><span>✓</span><p>AI-generated explanation</p></div>
                </div>
              </div>
            </section>
          )}

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
                      key={`${candidate.fileName || candidate.candidateName || "candidate"}-${index}`}
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
                            <p>{candidate.currentRole || "Role not available"}</p>
                          </div>
                        </div>

                        <div className="candidate-analysis-score">
                          <span
                            className={`candidate-analysis-score-value ${getScoreClass(score)}`}
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
                          <strong>{candidate.experienceYears ?? 0} years</strong>
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
                              {renderSkills(candidate.matchedRequiredSkills, "matched")}
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
                              {renderSkills(candidate.missingRequiredSkills, "missing")}
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
                              {renderSkills(candidate.matchedPreferredSkills, "matched")}
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
                              {renderSkills(candidate.missingPreferredSkills, "missing")}
                            </div>
                          </div>
                        </div>

                        <div className="candidate-analysis-summary">
                          <p className="candidate-analysis-summary-label">
                            AI SUMMARY
                          </p>
                          <p>
                            {candidate.summary || "No summary available."}
                          </p>
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
                              className={`candidate-analysis-shortlist-btn ${decision === "shortlisted" ? "selected" : ""}`}
                              aria-pressed={decision === "shortlisted"}
                              onClick={() =>
                                handleCandidateDecision(candidate, "shortlisted")
                              }
                            >
                              {decision === "shortlisted"
                                ? "Shortlisted ✓"
                                : "Shortlist"}
                            </button>

                            <button
                              type="button"
                              className={`candidate-analysis-reject-btn ${decision === "rejected" ? "selected" : ""}`}
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

          {analysisStarted && analysisResults.length === 0 && (
            <section className="analysis-result-placeholder">
              <div className="analysis-result-icon">!</div>
              <div>
                <h2>No analysis results available</h2>
                <p>
                  The resumes were processed, but no analysis results were
                  returned.
                </p>
              </div>
            </section>
          )}

          <div className="analysis-actions">
            <button
              type="button"
              className="analysis-back-btn"
              onClick={handleBackToUpload}
            >
              ← Back to Upload
            </button>

            {!analysisStarted && (
              <button
                type="button"
                className="analysis-start-btn"
                onClick={handleStartAnalysis}
                disabled={!job || files.length === 0 || isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <span className="analysis-spinner" />
                    Analyzing Resumes...
                  </>
                ) : (
                  <>
                    Start AI Analysis
                    <span>→</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Analysis;