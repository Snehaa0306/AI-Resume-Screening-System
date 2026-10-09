import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { auth, db } from "../firebase";
import "./Dashboard.css";
import "./Settings.css";

function Settings() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const [profileMessage, setProfileMessage] = useState("");
  const [securityMessage, setSecurityMessage] = useState("");
  const [error, setError] = useState("");

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem("resumeScreenNotifications");

      return saved
        ? {
            analysis: true,
            shortlisted: true,
            jobUpdates: false,
            ...JSON.parse(saved),
          }
        : {
            analysis: true,
            shortlisted: true,
            jobUpdates: false,
          };
    } catch {
      return {
        analysis: true,
        shortlisted: true,
        jobUpdates: false,
      };
    }
  });

  // ========================================
  // LOAD LOGGED-IN USER AND FIRESTORE PROFILE
  // ========================================

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        if (isMounted) {
          setUser(null);
          setLoading(false);
          navigate("/signin", { replace: true });
        }
        return;
      }

      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (!isMounted) return;

        const userData = userDoc.exists() ? userDoc.data() : {};

        setUser(currentUser);
        setFullName(
          userData.fullName || currentUser.displayName || "Recruiter"
        );
        setEmail(currentUser.email || "");
        setCompany(userData.company || "");
      } catch (err) {
        console.error("Error loading user profile:", err);

        if (isMounted) {
          setUser(currentUser);
          setFullName(currentUser.displayName || "Recruiter");
          setEmail(currentUser.email || "");
          setCompany("");
          setError("Unable to load some profile details.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [navigate]);

  // ========================================
  // USER INITIALS
  // ========================================

  const userInitial = (fullName || email || "R")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // ========================================
  // SAVE PROFILE
  // ========================================

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    setProfileMessage("");
    setSecurityMessage("");
    setError("");

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!user) {
      setError("Please sign in to update your profile.");
      return;
    }

    try {
      setSaving(true);

      const updatedName = fullName.trim();

      // Update Firebase Authentication profile
      await updateProfile(user, {
        displayName: updatedName,
      });

      // Keep recruiter details in Firestore in sync
      await setDoc(
        doc(db, "users", user.uid),
        {
          fullName: updatedName,
          email: user.email || "",
          company: company.trim(),
          recruiterId: user.uid,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      setFullName(updatedName);
      setProfileMessage("Profile updated successfully.");
    } catch (err) {
      console.error("Profile update error:", err);
      setError("Unable to update your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // PASSWORD RESET
  // ========================================

  const handlePasswordReset = async () => {
    setSecurityMessage("");
    setProfileMessage("");
    setError("");

    if (!email) {
      setError("No email address is associated with this account.");
      return;
    }

    try {
      setSendingReset(true);

      await sendPasswordResetEmail(auth, email);

      setSecurityMessage(
        `Password reset link sent to ${email}. Please check your inbox.`
      );
    } catch (err) {
      console.error("Password reset error:", err);

      if (err.code === "auth/too-many-requests") {
        setError("Too many requests. Please try again later.");
      } else {
        setError("Unable to send the reset email. Please try again.");
      }
    } finally {
      setSendingReset(false);
    }
  };

  // ========================================
  // NOTIFICATION PREFERENCES
  // ========================================

  const handleNotificationChange = (key) => {
    const updated = {
      ...notifications,
      [key]: !notifications[key],
    };

    setNotifications(updated);

    try {
      localStorage.setItem(
        "resumeScreenNotifications",
        JSON.stringify(updated)
      );
    } catch (err) {
      console.error("Unable to save notification preferences:", err);
      setError("Unable to save notification preferences in this browser.");
    }
  };

  // ========================================
  // LOGOUT
  // ========================================

  const handleLogout = async () => {
    setError("");

    try {
      await signOut(auth);
      navigate("/signin", { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
      setError("Unable to log out. Please try again.");
    }
  };

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return <div className="settings-loading">Loading settings...</div>;
  }

  if (!user) {
    return null;
  }

  // ========================================
  // PAGE UI
  // ========================================

  return (
    <div className="dashboard-page settings-layout">
      {/* ========================================
          SIDEBAR - SAME AS DASHBOARD
      ======================================== */}

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
          <Link to="/settings" className="sidebar-link active">
            <span>⚙</span>
            Settings
          </Link>

          <Link
            to="/signin"
            className="sidebar-link logout-link"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </Link>
        </div>
      </aside>

      {/* ========================================
          MAIN CONTENT
      ======================================== */}

      <main className="settings-main">
        {/* HEADER */}

        <header className="settings-topbar">
          <div>
            <h1>Settings</h1>
            <p>Manage your account and preferences</p>
          </div>

          <div className="settings-user">
            <div className="settings-avatar">{userInitial}</div>

            <div className="settings-user-info">
              <strong>{fullName || "Recruiter"}</strong>
              <span>HR Manager</span>
            </div>
          </div>
        </header>

        {/* ERROR MESSAGE */}

        {error && (
          <div className="settings-alert settings-alert-error" role="alert">
            {error}
          </div>
        )}

        {/* ========================================
            PROFILE SETTINGS
        ======================================== */}

        <section className="settings-card">
          <div className="settings-section-heading">
            <div className="settings-section-icon">♙</div>

            <div>
              <h2>Profile Settings</h2>
              <p>Update your personal account information.</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile}>
            <div className="settings-profile-block">
              <div className="settings-large-avatar">{userInitial}</div>

              <div>
                <strong>{fullName || "Recruiter"}</strong>
                <span>{email}</span>
              </div>
            </div>

            <div className="settings-form-group">
              <label htmlFor="settings-name">Full Name</label>

              <input
                id="settings-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                autoComplete="name"
              />
            </div>

            <div className="settings-form-group">
              <label htmlFor="settings-email">Email Address</label>

              <input id="settings-email" type="email" value={email} readOnly />

              <small>Email address is managed by your login account.</small>
            </div>

            <div className="settings-form-group">
              <label htmlFor="settings-company">Company Name</label>

              <input
                id="settings-company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Enter your company name"
                autoComplete="organization"
              />
            </div>

            {profileMessage && (
              <p className="settings-success" role="status">
                {profileMessage}
              </p>
            )}

            <div className="settings-actions">
              <button
                type="submit"
                className="settings-primary-btn"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </section>

        {/* ========================================
            SECURITY
        ======================================== */}

        <section className="settings-card">
          <div className="settings-section-heading">
            <div className="settings-section-icon">♧</div>

            <div>
              <h2>Security</h2>
              <p>Keep your account secure.</p>
            </div>
          </div>

          <div className="settings-security-row">
            <div>
              <strong>Password</strong>
              <p>Receive an email to reset your account password.</p>
            </div>

            <button
              type="button"
              className="settings-secondary-btn"
              onClick={handlePasswordReset}
              disabled={sendingReset}
            >
              {sendingReset ? "Sending..." : "Reset Password"}
            </button>
          </div>

          {securityMessage && (
            <p className="settings-success" role="status">
              {securityMessage}
            </p>
          )}
        </section>

        {/* ========================================
            NOTIFICATIONS
        ======================================== */}

        <section className="settings-card">
          <div className="settings-section-heading">
            <div className="settings-section-icon">♧</div>

            <div>
              <h2>Notifications</h2>
              <p>Choose the updates you want to receive.</p>
            </div>
          </div>

          <div className="settings-notification-row">
            <div>
              <strong>Resume Analysis Updates</strong>
              <p>Updates when resume analysis is completed.</p>
            </div>

            <label className="settings-switch">
              <input
                type="checkbox"
                checked={notifications.analysis}
                onChange={() => handleNotificationChange("analysis")}
              />
              <span className="settings-switch-slider"></span>
            </label>
          </div>

          <div className="settings-notification-row">
            <div>
              <strong>Candidate Shortlisting</strong>
              <p>Updates related to shortlisted candidates.</p>
            </div>

            <label className="settings-switch">
              <input
                type="checkbox"
                checked={notifications.shortlisted}
                onChange={() => handleNotificationChange("shortlisted")}
              />
              <span className="settings-switch-slider"></span>
            </label>
          </div>

          <div className="settings-notification-row">
            <div>
              <strong>Job Updates</strong>
              <p>Reminders and updates about your job listings.</p>
            </div>

            <label className="settings-switch">
              <input
                type="checkbox"
                checked={notifications.jobUpdates}
                onChange={() => handleNotificationChange("jobUpdates")}
              />
              <span className="settings-switch-slider"></span>
            </label>
          </div>
        </section>

        {/* ========================================
            ACCOUNT
        ======================================== */}

        <section className="settings-card settings-account-card">
          <div>
            <h2>Account</h2>
            <p>Sign out of your recruiter account.</p>
          </div>

          <button
            type="button"
            className="settings-danger-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </section>
      </main>
    </div>
  );
}

export default Settings;
