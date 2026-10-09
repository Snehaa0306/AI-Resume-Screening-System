import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./SignIn.css";

import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

function SignIn() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================================================
  // SIGN IN
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const trimmedEmail = email.trim().toLowerCase();

    // Check empty fields
    if (!trimmedEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    // Check email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      // =====================================================
      // FIREBASE AUTHENTICATION
      // =====================================================

      const userCredential = await signInWithEmailAndPassword(
        auth,
        trimmedEmail,
        password
      );

      const user = userCredential.user;

      // =====================================================
      // SAVE CURRENT USER
      // =====================================================
      // We only store basic information locally.
      // Password is NOT stored.

      localStorage.setItem(
        "resumeScreenCurrentUser",
        JSON.stringify({
          id: user.uid,
          email: user.email,
        })
      );

      // =====================================================
      // SUCCESS
      // =====================================================

      setSuccess("Sign In successful! Redirecting...");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error) {
      console.error("Firebase sign-in error:", error);

      // =====================================================
      // FIREBASE ERROR HANDLING
      // =====================================================

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        setError("Invalid email or password. Please try again.");
      } else if (error.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (error.code === "auth/user-disabled") {
        setError("This account has been disabled.");
      } else if (error.code === "auth/too-many-requests") {
        setError(
          "Too many unsuccessful attempts. Please try again later."
        );
      } else {
        setError("Unable to sign in. Please try again.");
      }
    }
  };

  return (
    <div className="signin-page">
      <div className="signin-layout">
        {/* =====================================================
            LEFT INFORMATION PANEL
        ====================================================== */}

        <aside className="signin-side-panel">
          <Link to="/" className="signin-logo">
            <span className="signin-logo-box">AI</span>
            <span>ResumeScreen</span>
          </Link>

          <div className="signin-side-content">
            <h2>
              Your best candidates are
              <br />
              already in the pile
            </h2>

            <div className="signin-candidate-list">
              <div className="signin-candidate">
                <div>
                  <strong>Priya N.</strong>
                  <span>Data Analyst</span>
                </div>
                <b>94%</b>
              </div>

              <div className="signin-candidate">
                <div>
                  <strong>Aarav K.</strong>
                  <span>Software Developer</span>
                </div>
                <b>92%</b>
              </div>

              <div className="signin-candidate">
                <div>
                  <strong>Rohan S.</strong>
                  <span>Software Developer</span>
                </div>
                <b>81%</b>
              </div>
            </div>
          </div>

          <p className="signin-side-footer">
            Scores explain themselves, so every decision is easy to defend.
          </p>
        </aside>

        {/* =====================================================
            RIGHT SIGN-IN PANEL
        ====================================================== */}

        <main className="signin-form-panel">
          <div className="signin-form-container">
            {/* Heading */}

            <div className="signin-heading">
              <h1>Welcome back</h1>
              <p>Log in to your recruiter account.</p>
            </div>

            {/* Sign-in form */}

            <form className="signin-form" onSubmit={handleSubmit}>
              {/* Email */}

              <div className="signin-field">
                <label htmlFor="signin-email">Work email</label>

                <input
                  id="signin-email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Password */}

              <div className="signin-field">
                <div className="signin-password-label">
                  <label htmlFor="signin-password">Password</label>

                  <Link to="/forgot-password">
                    Forgot Password?
                  </Link>
                </div>

                <input
                  id="signin-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* Error message */}

              {error && (
                <p className="signin-error" role="alert">
                  {error}
                </p>
              )}

              {/* Success message */}

              {success && (
                <p className="signin-success" role="status">
                  {success}
                </p>
              )}

              {/* Submit button */}

              <button type="submit" className="signin-btn">
                Log in
              </button>
            </form>

            {/* Sign-up link */}

            <p className="signin-signup">
              New to ResumeScreen?{" "}
              <Link to="/signup">Create an account</Link>
            </p>

            {/* Back to home */}

            <Link to="/" className="signin-back">
              ← Back to home
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}

export default SignIn;