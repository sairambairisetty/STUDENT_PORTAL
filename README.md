# CampusPro - Automated OMR Examination Portal

An end-to-end university examination management system designed with an automated OMR evaluation engine. This system digitizes the entire examination lifecycle across Faculty, Admin, and Student modules.

## 🚀 Key Modules & Workflow

### 1. Faculty Node
- **Exam Drafting:** Upload official question paper PDFs and configure scheduling constants (Exam Date, Start Time, and Duration).
- **Dynamic OMR Scaling:** Faculty sets the exact `total_questions` count, causing the student-side OMR interface to dynamically scale to that exact number of bubbles.
- **Answer Key Submission:** Once an exam is concluded, faculty can upload the official answer key via an Excel sheet (`.xlsx`) to trigger the scoring mechanism.

### 2. Admin Subsystem Control
- **Exam Approvals:** Review exam metadata submitted by faculty and broadcast notifications to assigned student queues.
- **One-Click Evaluation Engine:** Review uploaded Excel keys and trigger the backend OMR grading loop to instantly evaluate student choices against the key.

### 3. Student Portal
- **Real-Time Waiting Room:** Secure countdown state locks the portal until the exact examination timestamp is reached.
- **Split-Screen Exam Space:** Left panel embeds the scrollable Question PDF, while the right panel displays the digital interactive OMR sheet.
- **Instant Response Submission:** Automatically locks and posts choices into the cloud node upon manual submission or timer expiration.
- **Side-by-Side Performance Analytics:** Once results are out, students can view their complete evaluation matrix showcasing their selected choice alongside the correct key with visual status markings (✔️ / ❌) and total score summaries.

---

## 🛠️ Tech Stack
- **Frontend Framework:** React.js, React Router DOM, Axios, CSS3
- **Backend Architecture:** Python, FastAPI, Uvicorn, Pandas (Data Stream Processing)
- **Database Engine:** PostgreSQL (pgAdmin)

---

## 📁 Repository Structure
```text
STUDENT_PORTAL/
│
├── frontend/                 # React UI Source Subsystem
│   ├── package.json          # UI Dependency Node Maps
│   └── src/
│       └── components/       # Core Portals (Faculty, Admin, Student)
│
└── backend/                  # Fast-API Layer
    ├── main.py               # Main API routes & OMR evaluation logic
    └── requirements.txt      # Python Environment package dependencies
