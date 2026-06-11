import React from "react";
import { useNavigate } from "react-router-dom";
import "./Faculty_main_interface.css";

const Faculty_main_interface = () => {
  const navigate = useNavigate();

  // FIXED: నీ రిక్వైర్మెంట్ ప్రకారం ఇక్కడ 3 కార్డ్స్ గా అప్‌డేట్ చేశాను సాయిరామ్
  const menuItems = [
    {
      id: 1,
      title: "Students Information",
      description:
        "Access detailed student profiles, track attendance records, and review academic performance across semesters.",
      icon: "👥",
      btnText: "View Students",
      colorClass: "blue-accent",
      path: "/student_details",
    },
    {
      id: 2,
      title: "Conduct an Exam",
      description:
        "Create new question papers, schedule examination slots, and manage live proctoring settings.",
      icon: "📝",
      btnText: "Launch Portal",
      colorClass: "orange-accent",
      path: "/conduct-exam",
    },
    {
      id: 3,
      title: "Post Answer Key",
      description:
        "Upload official OMR answer keys via Excel sheets for completed exams to trigger student evaluation.",
      icon: "🔑",
      btnText: "Upload Key Portal",
      colorClass: "green-accent", // కొత్త కలర్ థీమ్
      path: "/faculty-post-key", // ఈ పాత్‌ను నీ App.jsx రూట్స్‌లో యాడ్ చేసుకో సాయిరామ్
    },
  ];

  return (
    <div className="faculty-wrapper">
      <nav className="faculty-nav">
        <span className="logo">
          Faculty<span>Portal</span>
        </span>
      </nav>

      <main className="faculty-content">
        <header className="content-header">
          <h1>Welcome Back, Professor</h1>
          <p>Select a module below to manage your academic tasks.</p>
        </header>

        <section className="interface-grid">
          {menuItems.map((item) => (
            <div key={item.id} className={`interface-card ${item.colorClass}`}>
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
