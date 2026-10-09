
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import "./ForgotPassword.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError("Please enter your registered email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      await sendPasswordResetEmail(auth, trimmedEmail);

      setSuccess(
        "If an account exists for this email, a password reset link has been sent. Please check your inbox and spam folder."
      );
    } catch (err) {
      console.error("Password reset error:", err);

      if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many requests. Please try again later.");
      } else {
        setError("Unable to send the reset email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-page">
      <div className="forgot-card">
        <Link to="/" className="forgot-logo">
          <span className="forgot-logo-box">AI</span>
          <span>ResumeScreen</span>
        </Link>

        <div className="forgot-icon">
          <span>✉</span>
        </div>

        <div className="forgot-heading">
          <h1>Forgot password?</h1>
          <p>
            No worries! Enter your registered email address and
            we'll send you a link to reset your password.
          </p>
        </div>

        <form className="forgot-form" onSubmit={handleSubmit}>
          <div className="forgot-field">
            <label htmlFor="forgot-email">Work email</label>
            <input
              id="forgot-email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          {error && (
            <p className="forgot-error" role="alert">
              {error}
            </p>
          )}

          {success && (
            <p className="forgot-success" role="status">
              {success}
            </p>
          )}

          <button
            type="submit"
            className="forgot-btn"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <Link to="/signin" className="forgot-back">
          ← Back to Login
        </Link>
      </div>
    </div>
  );
}

export default ForgotPassword;