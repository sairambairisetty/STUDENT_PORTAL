import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Student_main_interface.css';

const Student_main_interface = () => {
    const navigate = useNavigate();
    
    const studentName = localStorage.getItem('studentName') || 'User';
    const studentBranch = localStorage.getItem('studentBranch') || 'General';

    return (
        <div className="main-interface-container">
            {/* Sidebar with Profile and Messages removed */}
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <h2>Campus<span>Pro</span></h2>
                </div>
                <nav className="sidebar-menu">
                    <button className="active">Dashboard</button>
                    {/* The Profile and Messages buttons have been removed from here */}
                    <button className="logout-nav" onClick={() => navigate('/')}>Sign Out</button>
                </nav>
            </aside>

            {/* Main Dashboard Area remains the same */}
            <main className="dashboard-view">
                <header className="top-header">
                    <div className="welcome-section">
                        <h1>Hello, {studentName}!</h1>
                        <p>Welcome back to the {studentBranch} Department.</p>
                    </div>
                    <div className="status-badge">{studentBranch} Student</div>
                </header>

                <div className="action-grid">
                    <div className="feature-card performance" onClick={() => navigate('/performance')}>
                        <div className="card-inner">
                            <div className="card-icon">📈</div>
                            <div className="card-text">
                                <h3>My Performance</h3>
                                <p>Analyze your CGPA, attendance, and internal marks.</p>
                            </div>
                        </div>
                        <div className="card-footer">View Details →</div>
                    </div>

                    <div className="feature-card exam" onClick={() => navigate('/join-exam')}>
                        <div className="card-inner">
                            <div className="card-icon">🖊️</div>
                            <div className="card-text">
                                <h3>Join in Exam</h3>
                                <p>Access active examination halls and practice tests.</p>
                            </div>
                        </div>
                        <div className="card-footer">Start Exam →</div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Student_main_interface;