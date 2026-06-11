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
    <div className="login-page-wrapper">
      <div className="login-card">
        <div className="login-header">
          <div className="icon-circle">👨‍🏫</div>
          <h1>Faculty Login</h1>
          <p>Access your academic portal</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label>Employee ID</label>
            <input
              type="text"
              placeholder="Enter ID (e.g., 246M1A1201)"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Verifying..." : "Login to Portal"}
          </button>
        </form>

        <button className="back-btn" onClick={() => navigate("/")}>
          ← Back to Main Menu
        </button>
      </div>
    </div>
  );
};

export default Faculty_login;
