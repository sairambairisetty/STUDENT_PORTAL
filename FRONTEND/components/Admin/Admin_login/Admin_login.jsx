import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Admin_login.css";

const Admin_login = () => {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://127.0.0.1:8000/login/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employee_id: employeeId, // sent as a string (e.g., "246M1A1201")
          password: password,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        alert(`Welcome, ${data.name}!`);
        navigate("/admin_main_interface");
      } else {
        alert(data.detail || "Invalid ID or Password");
      }
    } catch (error) {
      console.error("Connection Error:", error);
      alert("Cannot connect to server. Make sure FastAPI is running!");
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
            <p className="banner-eyebrow">Administration Office</p>
            <h2>Welcome Back</h2>
            <p className="banner-line">Sign in to control the system and manage records.</p>
            <button className="ghost-btn" onClick={() => navigate("/")}>
              Go Back
            </button>
          </div>
        </div>

        {/* RIGHT SIDE — form */}
        <div className="login-form-side">
          <div className="form-container">
            <span className="form-numeral">III</span>
            <h2 className="login-title">Admin Login</h2>
            <span className="subtitle">Enter your credentials to continue</span>

            <form onSubmit={handleLogin}>
              <div className="input-field">
                <label htmlFor="employeeId">Employee ID</label>
                <input
                  id="employeeId"
                  type="text"
                  placeholder="Enter Employee ID"
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
              <button type="submit" className="main-login-btn">
                Login
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Admin_login;