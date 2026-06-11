import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Basic_interface.css';

const Basic_interface = () => {
  const navigate = useNavigate();

  return (
    <div className="main-container">
      <header className="hero-section">
        <h1 className="portal-title">WELCOME <span>BACK</span></h1>
        <p className="portal-subtitle">BVC college of engineering</p>
      </header>

      <div className="card-wrapper">
        {/* Student Card */}
        <div className="glass-card student-theme" onClick={() => navigate('/student-login')}>
          <div className="icon">🎓</div>
          <h2>Student</h2>
          <p>View Profile & Academic Data</p>
          <button className="enter-btn">Login</button>
        </div>

        {/* Faculty Card - Pointing to /faculty-login */}
        <div 
          className="glass-card faculty-theme" 
          onClick={() => navigate('/faculty-login')}
        >
          <div className="icon">👨‍🏫</div>
          <h2>Faculty</h2>
          <p>Manage Grades & Attendance</p>
          <button className="enter-btn">Login</button>
        </div>

        {/* Admin Card */}
        <div className="glass-card admin-theme" onClick={() => navigate('/admin_login')}>
          <div className="icon">🛡️</div>
          <h2>Admin</h2>
          <p>Control System & Database</p>
          <button className="enter-btn">Login</button>
        </div>
      </div>
    </div>
  );
};

export default Basic_interface;