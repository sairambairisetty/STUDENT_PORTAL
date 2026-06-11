import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin_main_interface.css';

const Admin_main_interface = () => {
    const navigate = useNavigate();
    const adminName = localStorage.getItem('adminName') || 'Administrator';

    // Admin dashboard links control grid
    const adminModules = [
        {
            id: 1,
            title: "Student Registrations",
            description: "Upload Excel sheets to perform bulk student admissions and data registration directly into the central node database.",
            icon: "📥",
            btnText: "Open Admissions",
            path: "/student_registrations"
        },
        {
            id: 2,
            title: "Student Directories",
            description: "View, filter, query, and manage complete registered student profile sheets filtered seamlessly by branch and active batch years.",
            icon: "📋",
            btnText: "View Records",
            path: "/student_details"
        },
        {
            id: 3,
            title: "Faculty Information",
            description: "Search system faculty credentials, review technical designations, handle organizational updates, and query access parameters.",
            icon: "👨‍🏫",
            btnText: "Manage Faculty",
            path: "/faculty"
        },
        {
            id: 4,
            title: "Review Pending Exams",
            description: "Verify evaluation metadata, dates, slots, and forward exam sheets drafted by faculty into active state deployment queues.",
            icon: "🛡️",
            btnText: "Approve Exams",
            path: "/admin-conduct-exam"
        },
        /* FIXED: నీ రిక్వైర్మెంట్ ప్రకారం ఇక్కడ 5వ ఆప్షన్ గా 'Publish Results' బటన్ అండ్ కార్డ్ యాడ్ చేశాను సాయిరామ్ */
        {
            id: 5,
            title: "Manage & Publish Results",
            description: "Trigger the automated OMR evaluation engine. Cross-verify student option maps with official faculty answer keys to post global results.",
            icon: "🚀",
            btnText: "Evaluate & Post Results",
            path: "/admin-post-results", // ఈ పాత్ నీ App.jsx లో ఆల్రెడీ మనం సెట్ చేశాం
            isHighlight: true
        }
    ];

    return (
        <div className="admin-wrapper">
            <nav className="admin-navbar">
                <div className="admin-logo">Admin<span>Portal</span></div>
                <div className="admin-profile-badge">⚡ {adminName}</div>
            </nav>

            <main className="admin-content-pane">
                <header className="admin-welcome-banner">
                    <h1>System Command Dashboard</h1>
                    <p>Welcome back! Select a module subsystem node below to perform active campus management operations.</p>
                </header>

                <section className="admin-modules-layout-grid">
                    {adminModules.map((module) => (
                        <div key={module.id} className={`admin-module-card ${module.isHighlight ? 'result-glow-accent' : ''}`}>
                            <div className="admin-card-icon-slot">{module.icon}</div>
                            <div className="admin-card-details-slot">
                                {window.innerWidth < 600 ? "" : ""}
                                <h2>{module.title}</h2>
                                <p>{module.description}</p>
                                <button 
                                    className="admin-action-trigger-btn"
                                    onClick={() => navigate(module.path)}
                                >
                                    {module.btnText}
                                </button>
                            </div>
                        </div>
                    ))}
                </section>
            </main>
        </div>
    );
};

export default Admin_main_interface;