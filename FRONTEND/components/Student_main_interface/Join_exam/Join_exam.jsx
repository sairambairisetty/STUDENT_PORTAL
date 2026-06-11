import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Join_exam.css";

const Join_exam = () => {
  const navigate = useNavigate();

  // LocalStorage nundi data theesukuntunam
  const rollNumber = localStorage.getItem("studentRollNumber") || "246M1A1201"; 
  const branch = localStorage.getItem("studentBranch") || "it";

  const [activeExams, setActiveExams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Timer States
  const [timeLeft, setTimeLeft] = useState("");
  const [isExamReady, setIsExamReady] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);

  // 1. Fetch exams allocated to this specific student
  useEffect(() => {
    const fetchStudentExams = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/student/my-exams/${rollNumber}`,
          {
            params: { branch: branch.toLowerCase() },
          },
        );
        if (
          response.data.status === "success" &&
          response.data.data.length > 0
        ) {
          setActiveExams(response.data.data);
          setSelectedExam(response.data.data[0]); 
        }
      } catch (error) {
        console.error("Error fetching student exams:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudentExams();
  }, [rollNumber, branch]);

  // 2. Real-Time Countdown Timer Logic (Robust Parsing Fix)
  useEffect(() => {
    if (!selectedExam) return;

    const timer = setInterval(() => {
      const now = new Date();

      // Time formatting format string setup (e.g., hh:mm:ss build)
      let timeStr = selectedExam.exam_time;
      if (timeStr.split(':').length === 2) {
        timeStr = `${timeStr}:00`; // Seconds missing unte safe ga append chesthunnam
      }

      const examDateTimeStr = `${selectedExam.exam_date}T${timeStr}`;
      const examStartTime = new Date(examDateTimeStr);

      const difference = examStartTime - now; 

      if (difference <= 0) {
        // Exam Start time cross ayindi or running lo undhi
        const examDurationMs = selectedExam.exam_duration * 60 * 1000;
        const examEndTime = new Date(examStartTime.getTime() + examDurationMs);
        
        if (now < examEndTime) {
          // Exam live running inside slot time
          setTimeLeft("EXAM IS LIVE!");
          setIsExamReady(true);
        } else {
          // Exam duration poorthi aipothe
          setTimeLeft("Exam Expired");
          setIsExamReady(false);
          clearInterval(timer);
        }
      } else {
        // Countdown remaining hours, minutes, seconds calculation
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        setTimeLeft(formattedTime);
        setIsExamReady(false);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedExam]);

  const handleStartExam = () => {
    if (selectedExam) {
      navigate(`/student-exam-portal/${selectedExam.exam_id}`);
    }
  };

  return (
    <div className="join-exam-container">
      {/* Header Area */}
      <header className="join-header">
        <button
          className="back-btn"
          onClick={() => navigate("/student-dashboard")}
        >
          ← Back to Dashboard
        </button>
        <div className="live-timer-box">
          <span className="timer-label">Status / Countdown:</span>
          <span className="timer-clock">{timeLeft || "Checking..."}</span>
        </div>
      </header>

      {loading ? (
        <div className="join-status">
          షెడ్యూల్ అయిన ఎగ్జామ్స్ వెతుకుతున్నాము...
        </div>
      ) : selectedExam ? (
        <div className="exam-waiting-room">
          <div className="motivation-card">
            <div className="motivation-overlay">
              <div className="academic-badge">
                {selectedExam.branch.toUpperCase()} - {selectedExam.subject}
              </div>
              <h1>All The Best, {rollNumber}!</h1>
              <p>
                రైల్వే ఎగ్జామ్ రూల్స్ ప్రకారం కౌంట్‌డౌన్ ముగియగానే పేపర్
                ఆటోమేటిక్‌గా ఓపెన్ అవుతుంది.
              </p>

              <div className="exam-meta-details">
                <div className="meta-item">
                  📅 <strong>Date:</strong> {selectedExam.exam_date}
                </div>
                <div className="meta-item">
                  ⏰ <strong>Time:</strong> {selectedExam.exam_time}
                </div>
                <div className="meta-item">
                  ⏳ <strong>Duration:</strong> {selectedExam.exam_duration}{" "}
                  Mins
                </div>
              </div>

              {/* Dynamic Locking Button Override for Testing */}
              <button
                className={`start-portal-btn ${isExamReady ? "ready" : "locked"}`}
                disabled={!isExamReady}
                onClick={handleStartExam}
              >
                {isExamReady
                  ? "🖊️ Start Examination Now"
                  : "🔒 Exam is Locked (Waiting for Time)"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="join-status no-exams">
          🎉 నీ బ్రాంచ్ కి ప్రస్తుతం ఎలాంటి యాక్టివ్ ఎగ్జామ్స్ షెడ్యూల్ కాలేదు!
        </div>
      )}
    </div>
  );
};

export default Join_exam;