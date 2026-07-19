import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Basic_interface.css';

const PORTALS = [
  {
    key: 'student',
    route: '/student-login',
    label: 'Student',
    roman: 'I',
    tagline: 'View Profile & Academic Data',
    glyph: (
      <svg viewBox="0 0 48 48" fill="none">
        <path d="M24 6L4 16l20 10 20-10L24 6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M12 21v10c0 3 5.4 6 12 6s12-3 12-6V21" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M40 18v13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'faculty',
    route: '/faculty-login',
    label: 'Faculty',
    roman: 'II',
    tagline: 'Manage Grades & Attendance',
    glyph: (
      <svg viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="15" r="7" stroke="currentColor" strokeWidth="1.6" />
        <path d="M10 40c0-8 6.3-14 14-14s14 6 14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M17 24l-3 4M31 24l3 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'admin',
    route: '/admin_login',
    label: 'Administrator',
    roman: 'III',
    tagline: 'Control System & Database',
    glyph: (
      <svg viewBox="0 0 48 48" fill="none">
        <path d="M24 5l16 6v11c0 10-6.8 17.4-16 21-9.2-3.6-16-11-16-21V11l16-6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M17 24l5 5 9-10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const Basic_interface = () => {
  const navigate = useNavigate();

  return (
    <div className="portal-root">
      <header className="hero-section">
        <p className="crest-line" aria-hidden="true">
          <span className="crest-dash" />
          <span className="crest-dot" />
          <span className="crest-dash" />
        </p>
        <p className="eyebrow"></p>
        <h1 className="portal-title">
          Welcome <span className="italic-accent">Back</span>
        </h1>
        <div className="subtitle-rule">
          <span className="rule" />
          <p className="portal-subtitle">BVC College of Engineering</p>
          <span className="rule" />
        </div>
      </header>

      <div className="card-wrapper">
        {PORTALS.map((p) => (
          <div
            key={p.key}
            className="glass-card"
            onClick={() => navigate(p.route)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') navigate(p.route);
            }}
          >
            <span className="card-numeral">{p.roman}</span>
            <div className="icon">{p.glyph}</div>
            <h2>{p.label}</h2>
            <p>{p.tagline}</p>
            <button className="enter-btn" type="button">
              <span>Login</span>
              <svg className="btn-arrow" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <footer className="portal-footer">
        <span className="rule small" />
        <p></p>
      </footer>
    </div>
  );
};

export default Basic_interface;