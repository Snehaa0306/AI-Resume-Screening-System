import React from "react";
import { Routes, Route } from "react-router-dom";

import Home from "./components/Home";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import Dashboard from "./components/Dashboard";
import CreateJob from "./components/CreateJob";
import Jobs from "./components/Jobs";
import Analysis from "./components/Analysis";
import ScreenResumes from "./components/ScreenResumes";
import CandidateDetails from "./components/CandidateDetails";
import Settings from "./components/Settings";
import ForgotPassword from "./components/ForgotPassword";

function App() {
  return (
    <Routes>
      {/* Home Page */}
      <Route path="/" element={<Home />} />

      {/* Sign In Page */}
      <Route path="/signin" element={<SignIn />} />

      {/* Sign Up Page */}
      <Route path="/signup" element={<SignUp />} />

      <Route path="/dashboard" element={<Dashboard />} />

      {/* Create Job */}
      <Route path="/create-job" element={<CreateJob />} />

      <Route path="/jobs" element={<Jobs />} />

      <Route path="/analysis" element={<Analysis />} />

      <Route path="/screen-resumes" element={<ScreenResumes />} />

      <Route path="/candidates" element={<CandidateDetails />} />

      <Route path="/settings" element={<Settings />} />

      <Route path="/forgot-password" element={<ForgotPassword />} />
    </Routes>
  );
}

export default App;
