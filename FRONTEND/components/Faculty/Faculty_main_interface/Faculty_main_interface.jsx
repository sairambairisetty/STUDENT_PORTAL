import React from "react";
import { useNavigate } from "react-router-dom";
import "./Faculty_main_interface.css";

const Faculty_main_interface = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      id: 1,
      roman: "I",
      title: "Students Information",
      description:
        "Access detailed student profiles, track attendance records, and review academic performance across semesters.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M3.5 20c0-3.6 2.5-6.2 5.5-6.2s5.5 2.6 5.5 6.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M15.5 6.2c1.4.4 2.4 1.7 2.4 3.2 0 1.5-1 2.8-2.4 3.2M17.8 14.2c2 .6 3.4 2.5 3.4 4.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
      btnText: "View Students",
      colorClass: "navy-accent",
      path: "/student_details",
    },
    {
      id: 2,
      roman: "II",
      title: "Conduct an Exam",
      description:
        "Create new question papers, schedule examination slots, and manage live proctoring settings.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      btnText: "Launch Portal",
      colorClass: "gold-accent",
      path: "/conduct-exam",
    },
    {
      id: 3,
      roman: "III",
      title: "Post Answer Key",
      description:
        "Upload official OMR answer keys via Excel sheets for completed exams to trigger student evaluation.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="8" cy="15.5" r="3.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M10.5 13l8.5-8.5M16 5.5l2 2M18.5 3l2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      btnText: "Upload Key Portal",
      colorClass: "green-accent",
      path: "/faculty-post-key",
    },
  ];

  return (
    <div className="faculty-wrapper">
      <nav className="faculty-nav">
        <p className="nav-crest" aria-hidden="true">
          <span className="crest-dash" />
          <span className="crest-dot" />
          <span className="crest-dash" />
        </p>
        <span className="logo">
          Faculty<span>Portal</span>
        </span>
      </nav>

      <main className="faculty-content">
        <header className="content-header">
          <p className="header-eyebrow">Faculty Records Office</p>
          <h1>Welcome back, Professor</h1>
          <p className="header-sub">Select a module below to manage your academic tasks.</p>
        </header>

        <section className="interface-grid">
          {menuItems.map((item) => (
            <div key={item.id} className={`interface-card ${item.colorClass}`}>
              <span className="card-numeral">{item.roman}</span>
              <div className="card-icon">{item.icon}</div>
              <div className="card-details">
                <h2>{item.title}</h2>
                <p>{item.description}</p>
                <button
                  className="action-button"
                  onClick={() => navigate(item.path)}
                >
                  {item.btnText}
                </button>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
};

export default Faculty_main_interface;