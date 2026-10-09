
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CandidateDetails.css";

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

function CandidateDetails() {
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingIds, setUpdatingIds] = useState([]);

  // ---------- HELPERS ----------

  const getScore = (candidate) => {
    const score = Number(
      candidate.matchScore ??
        candidate.score ??
        candidate.matchPercentage ??
        0
    );

    return Number.isFinite(score)
      ? Math.max(0, Math.min(100, Math.round(score)))
      : 0;
  };

  const getScoreClass = (score) =>
    score >= 75 ? "high" : score >= 50 ? "medium" : "low";

  const getInitials = (name) => {
    if (!name) return "CA";

    const words = name.trim().split(" ").filter(Boolean);

    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }

    return (
      words[0].charAt(0) + words[1].charAt(0)
    ).toUpperCase();
  };

  const getSkills = (candidate) => {
    if (Array.isArray(candidate.matchedRequiredSkills)) {
      return candidate.matchedRequiredSkills;
    }

    if (Array.isArray(candidate.skills)) {
      return candidate.skills;
    }

    if (typeof candidate.skills === "string") {
      return candidate.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);
    }

    return [];
  };

  const getRole = (candidate) =>
    candidate.currentRole ||
    candidate.role ||
    candidate.jobTitle ||
    candidate.position ||
    "Role not available";

  const getName = (candidate) =>
    candidate.candidateName ||
    candidate.name ||
    candidate.fullName ||
    "Unknown Candidate";

  const isShortlisted = (candidate) =>
    candidate.shortlisted === true ||
    String(candidate.status || "").toLowerCase() === "shortlisted";

  const openCandidate = (candidate) => {
    navigate("/candidate-details", {
      state: { candidate },
    });
  };

  // ---------- LOAD CANDIDATES ----------

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCandidates([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const candidatesQuery = query(
          collection(db, "candidateAnalyses"),
          where("recruiterId", "==", user.uid)
        );

        const snapshot = await getDocs(candidatesQuery);

        const loaded = snapshot.docs.map((candidateDoc) => ({
          id: candidateDoc.id,
          ...candidateDoc.data(),
        }));

        loaded.sort((a, b) => getScore(b) - getScore(a));

        setCandidates(loaded);
      } catch (error) {
        console.error(
          "Error loading candidates from Firestore:",
          error
        );
        setCandidates([]);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // ---------- SEARCH ----------

  const filteredCandidates = candidates.filter((candidate) => {
    const search = searchTerm.toLowerCase().trim();

    if (!search) return true;

    const name = getName(candidate).toLowerCase();
    const role = getRole(candidate).toLowerCase();
    const skills = getSkills(candidate).join(" ").toLowerCase();

    return (
      name.includes(search) ||
      role.includes(search) ||
      skills.includes(search)
    );
  });

  // ---------- SHORTLIST ----------

  const toggleShortlist = async (candidate) => {
    if (!candidate.id || updatingIds.includes(candidate.id)) {
      return;
    }

    const newShortlistedStatus = !isShortlisted(candidate);

    setUpdatingIds((prev) => [...prev, candidate.id]);

    try {
      await updateDoc(
        doc(db, "candidateAnalyses", candidate.id),
        {
          shortlisted: newShortlistedStatus,
          status: newShortlistedStatus
            ? "shortlisted"
            : "in review",
        }
      );

      setCandidates((prev) =>
        prev.map((item) =>
          item.id === candidate.id
            ? {
                ...item,
                shortlisted: newShortlistedStatus,
                status: newShortlistedStatus
                  ? "shortlisted"
                  : "in review",
              }
            : item
        )
      );
    } catch (error) {
      console.error(
        "Error updating shortlist status:",
        error
      );

      alert(
        "Unable to update shortlist status. Please try again."
      );
    } finally {
      setUpdatingIds((prev) =>
        prev.filter((id) => id !== candidate.id)
      );
    }
  };

  // ---------- STATISTICS ----------

  const totalCandidates = candidates.length;

  const highMatches = candidates.filter(
    (candidate) => getScore(candidate) >= 75
  ).length;

  const averageMatch =
    candidates.length > 0
      ? Math.round(
          candidates.reduce(
            (total, candidate) => total + getScore(candidate),
            0
          ) / candidates.length
        )
      : 0;

  // ---------- PAGE ----------

  return (
    <div className="candidate-details-page">
      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <div className="dashboard-logo">
          <span>AI</span>
          Resume Analyzer
        </div>

        <nav className="sidebar-menu">
          <Link to="/dashboard" className="sidebar-link">
            <img
              src="/dashboard.svg"
              alt=""
              className="sidebar-icon"
            />
            Dashboard
          </Link>

          <Link to="/jobs" className="sidebar-link">
            <img
              src="/jobs.svg"
              alt=""
              className="sidebar-icon"
            />
            Jobs
          </Link>

          <Link
            to="/screen-resumes"
            className="sidebar-link"
          >
            <img
              src="/screen-resumes.svg"
              alt=""
              className="sidebar-icon"
            />
            Screen Resumes
          </Link>

          <Link
            to="/candidates"
            className="sidebar-link active"
          >
            <img
              src="/candidates.svg"
              alt=""
              className="sidebar-icon"
            />
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
      <main className="dashboard-main">
        {/* PAGE HEADER */}
        <header className="dashboard-header">
          <div>
            <p className="dashboard-small-text">
              Candidate Management
            </p>

            <h1>Candidates</h1>

            <p className="dashboard-subtitle">
              Review screened candidates, their AI match scores
              and matched skills.
            </p>
          </div>
        </header>

        {/* STATISTICS */}
        <section className="candidate-stats-grid">
          <div className="candidate-stat-card">
            <div>
              <span>Total Candidates</span>
              <h2>{totalCandidates}</h2>
              <p>Resumes screened</p>
            </div>

            <div className="candidate-stat-icon blue">
              ♙
            </div>
          </div>

          <div className="candidate-stat-card">
            <div>
              <span>High Matches</span>
              <h2>{highMatches}</h2>
              <p>75% or higher match</p>
            </div>

            <div className="candidate-stat-icon green">
              ✓
            </div>
          </div>

          <div className="candidate-stat-card">
            <div>
              <span>Average Match</span>
              <h2>{averageMatch}%</h2>
              <p>Average candidate score</p>
            </div>

            <div className="candidate-stat-icon orange">
              %
            </div>
          </div>
        </section>

        {/* CANDIDATE LIST */}
        <section className="candidate-list-card">
          <div className="candidate-list-header">
            <div>
              <h2>Scanned Candidates</h2>
              <p>
                Candidates whose resumes have been analyzed by AI
              </p>
            </div>

            <div className="candidate-list-tools">
              {/* SEARCH BAR */}
              <div className="candidate-search">
                <span className="candidate-search-icon">
                  ⌕
                </span>

                <input
                  type="text"
                  placeholder="Search candidates..."
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(e.target.value)
                  }
                  aria-label="Search candidates"
                />

                {searchTerm && (
                  <button
                    type="button"
                    className="candidate-search-clear"
                    onClick={() => setSearchTerm("")}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>

              <span className="candidate-count">
                {filteredCandidates.length} Candidates
              </span>
            </div>
          </div>

          {loading ? (
            <div className="candidate-empty">
              <div className="candidate-empty-icon">
                ⏳
              </div>
              <h3>Loading candidates...</h3>
              <p>
                Fetching screened candidates from the database.
              </p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="candidate-empty">
              <div className="candidate-empty-icon">
                ♙
              </div>
              <h3>No candidates found</h3>
              <p>
                No resumes have been screened yet. Upload resumes
                from the Screen Resumes page to see candidates here.
              </p>

              <Link
                to="/screen-resumes"
                className="candidate-empty-button"
              >
                Screen Resumes
              </Link>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="candidate-empty">
              <div className="candidate-empty-icon">
                ⌕
              </div>
              <h3>No matching candidates</h3>
              <p>
                Try searching by candidate name, role, or skill.
              </p>
            </div>
          ) : (
            <div className="cand-list">
              {filteredCandidates.map((candidate, index) => {
                const score = getScore(candidate);
                const skills = getSkills(candidate);
                const name = getName(candidate);
                const shortlisted = isShortlisted(candidate);
                const isUpdating = updatingIds.includes(
                  candidate.id
                );

                return (
                  <div
                    className="cand-row"
                    key={candidate.id || candidate._id || index}
                    role="button"
                    tabIndex={0}
                    onClick={() => openCandidate(candidate)}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" ||
                        e.key === " "
                      ) {
                        e.preventDefault();
                        openCandidate(candidate);
                      }
                    }}
                  >
                    {/* AVATAR */}
                    <div className="cand-avatar">
                      {getInitials(name)}
                    </div>

                    {/* CANDIDATE INFORMATION */}
                    <div className="cand-info">
                      <strong className="cand-name">
                        {name}
                      </strong>

                      <span className="cand-role">
                        {getRole(candidate)}
                      </span>

                      <div className="cand-skills">
                        {skills.length > 0 ? (
                          <>
                            {skills
                              .slice(0, 4)
                              .map((skill, i) => (
                                <span
                                  className="cand-chip"
                                  key={`${skill}-${i}`}
                                >
                                  {skill}
                                </span>
                              ))}

                            {skills.length > 4 && (
                              <span className="cand-chip more">
                                +{skills.length - 4}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="cand-no-skills">
                            No skills available
                          </span>
                        )}
                      </div>
                    </div>

                    {/* MATCH SCORE */}
                    <div
                      className={`cand-score ${getScoreClass(
                        score
                      )}`}
                    >
                      <strong>{score}%</strong>

                      <div
                        className="cand-bar"
                        role="progressbar"
                        aria-valuenow={score}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${name} match score`}
                      >
                        <span
                          style={{
                            width: `${score}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* SHORTLIST BUTTON */}
                    <button
                      type="button"
                      className={`cand-shortlist-btn ${
                        shortlisted ? "shortlisted" : ""
                      }`}
                      disabled={isUpdating}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleShortlist(candidate);
                      }}
                    >
                      {isUpdating
                        ? "Updating..."
                        : shortlisted
                        ? "Shortlisted ✓"
                        : "Shortlist +"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default CandidateDetails;