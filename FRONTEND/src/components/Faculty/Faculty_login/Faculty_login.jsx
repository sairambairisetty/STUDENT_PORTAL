import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Faculty_login.css";

const Faculty_login = () => {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/login/faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: employeeId,
          password: password,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        // Store faculty info for the dashboard
        localStorage.setItem("facultyName", data.name);
        localStorage.setItem("facultyDept", data.dept);
        alert(`Welcome, Prof. ${data.name}`);
        navigate("/faculty_main_interface");
      } else {
        alert(data.detail || "Invalid Credentials");
      }
    } catch (error) {
      alert("Server connection failed. Please start your FastAPI server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-main-container">
      <div className="login-box-wrapper">

        {/* LEFT SIDE — banner */}
        <div className="login-side-banner">
          <div className="banner-content">
            <p className="banner-crest" aria-hidden="true">
              <span className="crest-dash" />
              <span className="crest-dot" />
              <span className="crest-dash" />
            </p>
            <p className="banner-eyebrow">Faculty Records Office</p>
            <h2>Welcome Back</h2>
            <p className="banner-line">Sign in to manage grades, attendance, and your academic portal.</p>
            <button className="ghost-btn" onClick={() => navigate("/")}>
              Go Back
            </button>
          </div>
        </div>

        {/* RIGHT SIDE — form */}
        <div className="login-form-side">
          <div className="form-container">
            <span className="form-numeral">II</span>
            <h2 className="login-title">Faculty Login</h2>
            <span className="subtitle">Access your academic portal</span>

            <form onSubmit={handleLogin}>
              <div className="input-field">
                <label htmlFor="employeeId">Employee ID</label>
                <input
                  id="employeeId"
                  type="text"
                  placeholder="e.g., 246M1A1201"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  required
                />
              </div>
              <div className="input-field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="main-login-btn" disabled={loading}>
                {loading ? "Verifying..." : "Login to Portal"}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Faculty_login;