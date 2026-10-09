import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./SignUp.css";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

function SignUp() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCompany = company.trim();

    // ================================
    // VALIDATION
    // ================================

    if (
      !trimmedName ||
      !trimmedEmail ||
      !trimmedCompany ||
      !password ||
      !confirmPassword
    ) {
      setError("Please fill in all the fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // ================================
    // FIREBASE SIGNUP
    // ================================

    try {
      // Create account using Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        trimmedEmail,
        password
      );

      const user = userCredential.user;

      // ================================
      // STORE USER DETAILS IN FIRESTORE
      // ================================

      await setDoc(doc(db, "users", user.uid), {
        fullName: trimmedName,
        email: trimmedEmail,
        company: trimmedCompany,
        createdAt: new Date()
      });

      // ================================
      // SUCCESS
      // ================================

      setSuccess(
        "Account created successfully! Redirecting to Sign In..."
      );

      setTimeout(() => {
        navigate("/signin");
      }, 1200);

    } catch (error) {
      console.error("Firebase signup error:", error);

      // Firebase error messages
      if (error.code === "auth/email-already-in-use") {
        setError(
          "An account with this email already exists. Please sign in."
        );
      } else if (error.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (error.code === "auth/weak-password") {
        setError("Password must contain at least 8 characters.");
      } else {
        setError("Unable to create account. Please try again.");
      }
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-layout">

        {/* Left information panel */}
        <aside className="signup-side-panel">
          <Link to="/" className="signup-logo">
            <span className="signup-logo-box">AI</span>
            <span>ResumeScreen</span>
          </Link>

          <div className="signup-side-content">
            <h2>
              Set up in a minute, screen
              <br />
              your first batch today
            </h2>

            <div className="signup-benefits">
              <div className="signup-benefit">
                Paste a job description
              </div>

              <div className="signup-benefit">
                Upload resumes in bulk
              </div>

              <div className="signup-benefit">
                Get a ranked shortlist
              </div>
            </div>
          </div>

          <p className="signup-side-footer">
            No card needed to get started.
          </p>
        </aside>

        {/* Right signup panel */}
        <main className="signup-form-panel">
          <div className="signup-form-container">

            <div className="signup-heading">
              <h1>Create your account</h1>
              <p>Start screening resumes with less effort.</p>
            </div>

            <form
              className="signup-form"
              onSubmit={handleSubmit}
            >

              {/* Name and Company */}
              <div className="signup-field-row">

                <div className="signup-field">
                  <label htmlFor="signup-name">
                    Full name
                  </label>

                  <input
                    id="signup-name"
                    type="text"
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) =>
                      setFullName(e.target.value)
                    }
                  />
                </div>

                <div className="signup-field">
                  <label htmlFor="signup-company">
                    Company
                  </label>

                  <input
                    id="signup-company"
                    type="text"
                    placeholder="Company name"
                    value={company}
                    onChange={(e) =>
                      setCompany(e.target.value)
                    }
                  />
                </div>

              </div>

              {/* Email */}
              <div className="signup-field">
                <label htmlFor="signup-email">
                  Work email
                </label>

                <input
                  id="signup-email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                />
              </div>

              {/* Password and Confirm Password */}
              <div className="signup-field-row">

                <div className="signup-field">
                  <label htmlFor="signup-password">
                    Password
                  </label>

                  <input
                    id="signup-password"
                    type="password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                  />
                </div>

                <div className="signup-field">
                  <label htmlFor="signup-confirm-password">
                    Confirm password
                  </label>

                  <input
                    id="signup-confirm-password"
                    type="password"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                  />
                </div>

              </div>

              {/* Error Message */}
              {error && (
                <p
                  className="signup-error"
                  role="alert"
                >
                  {error}
                </p>
              )}

              {/* Success Message */}
              {success && (
                <p
                  className="signup-success"
                  role="status"
                >
                  {success}
                </p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="signup-btn"
              >
                Create account
              </button>

            </form>

            <p className="signup-login">
              Already have an account?{" "}
              <Link to="/signin">
                Log in
              </Link>
            </p>

            <Link
              to="/"
              className="signup-back"
            >
              ← Back to home
            </Link>

          </div>
        </main>

      </div>
    </div>
  );
}

export default SignUp;