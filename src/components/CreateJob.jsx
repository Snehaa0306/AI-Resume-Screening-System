import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CreateJob.css";
import "./Dashboard.css";

import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

function CreateJob() {
  const navigate = useNavigate();

  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [experience, setExperience] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [preferredSkills, setPreferredSkills] = useState("");

  const [departments, setDepartments] = useState([
    "IT & Engineering",
    "Human Resources",
    "Finance",
    "Marketing",
    "Sales",
    "Operations",
    "Design",
  ]);

  const [experiences, setExperiences] = useState([
    "Fresher",
    "0–1 years",
    "1–2 years",
    "2–4 years",
    "4–6 years",
    "6–8 years",
    "8+ years",
  ]);

  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [experienceOpen, setExperienceOpen] = useState(false);

  const [showDepartmentInput, setShowDepartmentInput] =
    useState(false);

  const [showExperienceInput, setShowExperienceInput] =
    useState(false);

  const [newDepartment, setNewDepartment] = useState("");
  const [newExperience, setNewExperience] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [currentUser, setCurrentUser] = useState(null);

  const departmentRef = useRef(null);
  const experienceRef = useRef(null);

  // =========================================================
  // GET CURRENT FIREBASE USER
  // =========================================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  // =========================================================
  // CLOSE DROPDOWNS WHEN CLICKING OUTSIDE
  // =========================================================

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        departmentRef.current &&
        !departmentRef.current.contains(event.target)
      ) {
        setDepartmentOpen(false);
      }

      if (
        experienceRef.current &&
        !experienceRef.current.contains(event.target)
      ) {
        setExperienceOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  // =========================================================
  // DEPARTMENT
  // =========================================================

  const handleDepartmentSelect = (value) => {
    setDepartment(value);
    setDepartmentOpen(false);
  };

  // =========================================================
  // EXPERIENCE
  // =========================================================

  const handleExperienceSelect = (value) => {
    setExperience(value);
    setExperienceOpen(false);
  };

  // =========================================================
  // ADD NEW DEPARTMENT
  // =========================================================

  const handleAddDepartment = () => {
    const value = newDepartment.trim();

    if (!value) {
      return;
    }

    if (!departments.includes(value)) {
      setDepartments([...departments, value]);
    }

    setDepartment(value);
    setNewDepartment("");
    setShowDepartmentInput(false);
    setDepartmentOpen(false);
  };

  // =========================================================
  // ADD NEW EXPERIENCE
  // =========================================================

  const handleAddExperience = () => {
    const value = newExperience.trim();

    if (!value) {
      return;
    }

    if (!experiences.includes(value)) {
      setExperiences([...experiences, value]);
    }

    setExperience(value);
    setNewExperience("");
    setShowExperienceInput(false);
    setExperienceOpen(false);
  };

  // =========================================================
  // CREATE JOB
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // Check login
    if (!currentUser) {
      setError("You must be signed in to create a job.");
      return;
    }

    // Check required fields
    if (
      !jobTitle.trim() ||
      !department.trim() ||
      !experience.trim() ||
      !jobDescription.trim() ||
      !requiredSkills.trim()
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      // =====================================================
      // SAVE JOB TO FIRESTORE
      // =====================================================

      await addDoc(collection(db, "jobs"), {
        recruiterId: currentUser.uid,

        jobTitle: jobTitle.trim(),
        department: department.trim(),
        experience: experience.trim(),
        jobDescription: jobDescription.trim(),
        requiredSkills: requiredSkills.trim(),
        preferredSkills: preferredSkills.trim(),

        status: "Active",

        createdAt: serverTimestamp(),
      });

      // =====================================================
      // SUCCESS
      // =====================================================

      setSuccess("Job created successfully!");

      // Clear form
      setJobTitle("");
      setDepartment("");
      setExperience("");
      setJobDescription("");
      setRequiredSkills("");
      setPreferredSkills("");

      // Go to dashboard
      setTimeout(() => {
        navigate("/dashboard");
      }, 1200);
    } catch (error) {
      console.error("Firebase job creation error:", error);

      setError("Unable to create job. Please try again.");
    }
  };

  return (
    <div className="dashboard-page create-job-page">
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
            <img
              src="/dashboard.svg"
              alt=""
              className="sidebar-icon"
            />
            Dashboard
          </Link>

          <Link to="/jobs" className="sidebar-link active">
            <img
              src="/jobs.svg"
              alt=""
              className="sidebar-icon"
            />
            Jobs
          </Link>

          <Link to="/screen-resumes" className="sidebar-link">
            <img
              src="/screen-resumes.svg"
              alt=""
              className="sidebar-icon"
            />
            Screen Resumes
          </Link>

          <Link to="/candidates" className="sidebar-link">
            <img
              src="/candidates.svg"
              alt=""
              className="sidebar-icon"
            />
            Candidates
          </Link>

          <Link to="/shortlisted" className="sidebar-link">
            <img
              src="/shortlisted.svg"
              alt=""
              className="sidebar-icon"
            />
            Shortlisted
          </Link>
        </nav>

        <div className="sidebar-bottom">
          <Link to="/settings" className="sidebar-link">
            <span>⚙</span>
            Settings
          </Link>

          <Link
            to="/signin"
            className="sidebar-link logout-link"
          >
            <span>↪</span>
            Logout
          </Link>
        </div>
      </aside>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="create-job-main">
        <div className="create-job-header">
          <div>
            <Link
              to="/dashboard"
              className="create-job-back"
            >
              ← Back to Dashboard
            </Link>

            <p className="create-job-small-text">Jobs</p>

            <h1>Create New Job</h1>

            <p className="create-job-subtitle">
              Add the job details and requirements for candidate
              screening.
            </p>
          </div>
        </div>

        <div className="create-job-card">
          <div className="create-job-card-header">
            <div>
              <h2>Job Information</h2>

              <p>
                Enter the details of the position you are hiring
                for.
              </p>
            </div>
          </div>

          <form
            className="create-job-form"
            onSubmit={handleSubmit}
          >
            {/* Job Title */}

            <div className="create-job-field">
              <label htmlFor="job-title">
                Job Title <span>*</span>
              </label>

              <input
                id="job-title"
                type="text"
                placeholder="e.g. Frontend Developer"
                value={jobTitle}
                onChange={(e) =>
                  setJobTitle(e.target.value)
                }
              />
            </div>

            {/* Department + Experience */}

            <div className="create-job-row">
              {/* Department */}

              <div className="create-job-field">
                <label>
                  Department <span>*</span>
                </label>

                <div
                  className="create-job-custom-dropdown"
                  ref={departmentRef}
                >
                  <button
                    type="button"
                    className={`create-job-dropdown-trigger ${
                      departmentOpen ? "open" : ""
                    }`}
                    onClick={() => {
                      setDepartmentOpen(!departmentOpen);
                      setExperienceOpen(false);
                    }}
                  >
                    <span
                      className={
                        department
                          ? "selected"
                          : "placeholder"
                      }
                    >
                      {department || "Select Department"}
                    </span>

                    <span className="create-job-dropdown-arrow">
                      {departmentOpen ? "▲" : "▼"}
                    </span>
                  </button>

                  {departmentOpen && (
                    <div className="create-job-dropdown-menu">
                      <div className="create-job-dropdown-options">
                        {departments.map((item) => (
                          <button
                            type="button"
                            key={item}
                            className={`create-job-dropdown-item ${
                              department === item
                                ? "selected-item"
                                : ""
                            }`}
                            onClick={() =>
                              handleDepartmentSelect(item)
                            }
                          >
                            {item}

                            {department === item && (
                              <span className="create-job-check">
                                ✓
                              </span>
                            )}
                          </button>
                        ))}
                      </div>

                      {!showDepartmentInput ? (
                        <button
                          type="button"
                          className="create-job-add-new"
                          onClick={() =>
                            setShowDepartmentInput(true)
                          }
                        >
                          <span>＋</span>
                          Add New Department
                        </button>
                      ) : (
                        <div className="create-job-add-container">
                          <input
                            type="text"
                            placeholder="Enter department"
                            value={newDepartment}
                            onChange={(e) =>
                              setNewDepartment(e.target.value)
                            }
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddDepartment();
                              }

                              if (e.key === "Escape") {
                                setNewDepartment("");
                                setShowDepartmentInput(false);
                              }
                            }}
                          />

                          <div className="create-job-add-actions">
                            <button
                              type="button"
                              className="create-job-add-cancel"
                              onClick={() => {
                                setNewDepartment("");
                                setShowDepartmentInput(false);
                              }}
                            >
                              Cancel
                            </button>

                            <button
                              type="button"
                              className="create-job-add-confirm"
                              onClick={handleAddDepartment}
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Experience */}

              <div className="create-job-field">
                <label>
                  Experience Required <span>*</span>
                </label>

                <div
                  className="create-job-custom-dropdown"
                  ref={experienceRef}
                >
                  <button
                    type="button"
                    className={`create-job-dropdown-trigger ${
                      experienceOpen ? "open" : ""
                    }`}
                    onClick={() => {
                      setExperienceOpen(!experienceOpen);
                      setDepartmentOpen(false);
                    }}
                  >
                    <span
                      className={
                        experience
                          ? "selected"
                          : "placeholder"
                      }
                    >
                      {experience || "Select Experience"}
                    </span>

                    <span className="create-job-dropdown-arrow">
                      {experienceOpen ? "▲" : "▼"}
                    </span>
                  </button>

                  {experienceOpen && (
                    <div className="create-job-dropdown-menu">
                      <div className="create-job-dropdown-options">
                        {experiences.map((item) => (
                          <button
                            type="button"
                            key={item}
                            className={`create-job-dropdown-item ${
                              experience === item
                                ? "selected-item"
                                : ""
                            }`}
                            onClick={() =>
                              handleExperienceSelect(item)
                            }
                          >
                            {item}

                            {experience === item && (
                              <span className="create-job-check">
                                ✓
                              </span>
                            )}
                          </button>
                        ))}
                      </div>

                      {!showExperienceInput ? (
                        <button
                          type="button"
                          className="create-job-add-new"
                          onClick={() =>
                            setShowExperienceInput(true)
                          }
                        >
                          <span>＋</span>
                          Add New Experience
                        </button>
                      ) : (
                        <div className="create-job-add-container">
                          <input
                            type="text"
                            placeholder="e.g. 10–12 years"
                            value={newExperience}
                            onChange={(e) =>
                              setNewExperience(e.target.value)
                            }
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddExperience();
                              }

                              if (e.key === "Escape") {
                                setNewExperience("");
                                setShowExperienceInput(false);
                              }
                            }}
                          />

                          <div className="create-job-add-actions">
                            <button
                              type="button"
                              className="create-job-add-cancel"
                              onClick={() => {
                                setNewExperience("");
                                setShowExperienceInput(false);
                              }}
                            >
                              Cancel
                            </button>

                            <button
                              type="button"
                              className="create-job-add-confirm"
                              onClick={handleAddExperience}
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Job Description */}

            <div className="create-job-field">
              <label htmlFor="job-description">
                Job Description <span>*</span>
              </label>

              <textarea
                id="job-description"
                rows="7"
                placeholder="Enter the complete job description, responsibilities, and other relevant information..."
                value={jobDescription}
                onChange={(e) =>
                  setJobDescription(e.target.value)
                }
              />

              <p className="create-job-helper">
                Add the responsibilities and expectations
                for this position.
              </p>
            </div>

            {/* Required Skills */}

            <div className="create-job-field">
              <label htmlFor="required-skills">
                Required Skills <span>*</span>
              </label>

              <input
                id="required-skills"
                type="text"
                placeholder="e.g. React, JavaScript, HTML, CSS"
                value={requiredSkills}
                onChange={(e) =>
                  setRequiredSkills(e.target.value)
                }
              />

              <p className="create-job-helper">
                Separate multiple skills using commas.
              </p>
            </div>

            {/* Preferred Skills */}

            <div className="create-job-field">
              <label htmlFor="preferred-skills">
                Preferred Skills
              </label>

              <input
                id="preferred-skills"
                type="text"
                placeholder="e.g. TypeScript, Git, Redux"
                value={preferredSkills}
                onChange={(e) =>
                  setPreferredSkills(e.target.value)
                }
              />

              <p className="create-job-helper">
                Optional skills that would be an advantage.
              </p>
            </div>

            {/* Error */}

            {error && (
              <p className="create-job-error">{error}</p>
            )}

            {/* Success */}

            {success && (
              <p className="create-job-success">{success}</p>
            )}

            {/* Actions */}

            <div className="create-job-actions">
              <Link
                to="/dashboard"
                className="create-job-cancel"
              >
                Cancel
              </Link>

              <button
                type="submit"
                className="create-job-submit"
              >
                Save Job
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default CreateJob;