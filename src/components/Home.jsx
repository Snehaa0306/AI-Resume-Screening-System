import React from "react";
import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  return (
    <div className="home-page">
      <header className="home-navbar">
        <Link to="/" className="home-logo">
          <span className="home-logo-box">AI</span>
          <span>ResumeScreen</span>
        </Link>
        <nav className="home-nav-links">
          <a href="#how-it-works">How it works</a>
          <Link to="/signin" className="home-login-btn">
            Log in
          </Link>
        </nav>
      </header>

      <main>
        <section className="home-hero">
          <div className="home-hero-content">
            <div className="home-tag">AI-POWERED RECRUITMENT</div>
            <h1>
              Find the Right <span>Talent Faster with AI</span>
            </h1>
            <p className="home-lead">
              Screen resumes, match candidates with job requirements, and
              identify the best talent using AI-powered analysis.
            </p>
            <div className="home-hero-buttons">
              <Link to="/signin" className="home-primary-btn">
                Get Started
              </Link>
              <a href="#how-it-works" className="home-secondary-btn">
                How It Works
              </a>
            </div>
            <div className="home-trust">
              <span>Explains every score</span>
              <span>Bulk upload</span>
              <span>Your data stays private</span>
            </div>
          </div>

          <div
            className="home-screening-card"
            aria-label="Example candidate analysis"
          >
            <div className="home-card-header">
              <strong>Candidate analysis</strong>
              <span className="home-status">Analysed</span>
            </div>
            <div className="home-card-body">
              <div className="home-resume-preview">
                <h3>Aarav Kulkarni</h3>
                <p className="home-candidate-role">Software Developer · Pune</p>

                <hr />

                <h4>Experience</h4>
                <p>
                  4 years building web apps with <mark>React</mark> and{" "}
                  <mark>Python</mark> services; designed a <mark>REST API</mark>{" "}
                  serving 2M requests a day.
                </p>

                <hr />

                <h4>Skills</h4>
                <p>
                  <mark>SQL</mark>, Docker, Git, Jest
                </p>
              </div>
              <div className="home-score-panel">
                <div className="home-score-ring">
                  <span>
                    92<small>%</small>
                  </span>
                </div>
                <div className="home-score">
                  <div>
                    <span>Skills</span>
                    <strong>95%</strong>
                  </div>
                  <div className="home-score-bar">
                    <span style={{ width: "95%" }} />
                  </div>
                </div>
                <div className="home-score">
                  <div>
                    <span>Experience</span>
                    <strong>90%</strong>
                  </div>
                  <div className="home-score-bar">
                    <span style={{ width: "90%" }} />
                  </div>
                </div>
                <div className="home-score">
                  <div>
                    <span>Education</span>
                    <strong>78%</strong>
                  </div>
                  <div className="home-score-bar">
                    <span style={{ width: "78%" }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="home-result">
              <strong>✓ &nbsp; Strong match</strong>
              <p>Skills and experience closely match the job.</p>
            </div>
          </div>
        </section>

        <section className="home-features" id="features">
          <div className="home-section-heading">
            <span>FEATURES</span>
            <h2>Smarter resume screening</h2>
            <p>
              Reduce manual screening and make faster, data-driven recruitment
              decisions.
            </p>
          </div>
          <div className="home-feature-grid">
            <article className="home-feature-card">
              <div className="home-feature-icon">📄</div>
              <h3>Resume Analysis</h3>
              <p>
                Automatically extract candidate details, skills, education and
                experience from resumes.
              </p>
            </article>
            <article className="home-feature-card">
              <div className="home-feature-icon">🎯</div>
              <h3>AI Matching</h3>
              <p>
                Compare candidate resumes with job requirements using
                intelligent semantic matching.
              </p>
            </article>
            <article className="home-feature-card">
              <div className="home-feature-icon">📊</div>
              <h3>Candidate Ranking</h3>
              <p>
                Generate match scores and rank candidates from the strongest to
                the weakest match.
              </p>
            </article>
          </div>
        </section>

        <section className="home-how" id="how-it-works">
          <div className="home-section-heading">
            <span>HOW IT WORKS</span>
            <h2>Simple. Fast. Intelligent.</h2>
            <p>Screen multiple candidates in three simple steps.</p>
          </div>
          <div className="home-steps">
            <article className="home-step">
              <div className="home-step-number">1</div>
              <h3>Add the job</h3>
              <p>Add the job description, required skills and experience.</p>
            </article>
            <article className="home-step">
              <div className="home-step-number">2</div>
              <h3>Upload resumes</h3>
              <p>Upload one or multiple candidate resumes for analysis.</p>
            </article>
            <article className="home-step">
              <div className="home-step-number">3</div>
              <h3>Review ranked results</h3>
              <p>View match scores, rankings and candidate recommendations.</p>
            </article>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <div className="home-footer-logo">
          AI ResumeScreen
        </div>
        <p>AI-Based Resume Screening System</p>
        <small>© 2026 ResumeScreen. All rights reserved.</small>
      </footer>
    </div>
  );
}

export default Home;
