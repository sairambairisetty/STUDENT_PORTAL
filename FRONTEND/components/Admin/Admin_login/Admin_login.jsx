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
          employee_id: employeeId, // Now correctly sending as a string (e.g., "246M1A1201")
          password: password,
        }),
      }); // Fixed: Added missing closing parenthesis here

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
    <div className="login-wrapper">
      <form className="login-box" onSubmit={handleLogin}>
        <h1>Admin Login</h1>

        <input
          type="text" 
          placeholder="Employee ID"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Admin_login;