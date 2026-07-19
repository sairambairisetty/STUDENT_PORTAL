import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Join_exam.css";

const Join_exam = () => {
  const navigate = useNavigate();

  // LocalStorage నుండి డేటా తీసుకుంటున్నాం
  const rollNumber = localStorage.getItem("studentRollNumber") || "246M1A1201";
  const branch = localStorage.getItem("studentBranch") || "it";

  const [activeExams, setActiveExams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Timer States
  const [timeLeft, setTimeLeft] = useState("");
  const [isExamReady, setIsExamReady] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);

  // ✅ FIXED: Auto Polling - ప్రతీ 5 సెకన్లకి అడ్మిన్ అప్రూవల్ ని ఆటో-రిఫ్రెష్ చేస్తుంది
  useEffect(() => {
    const fetchStudentExams = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/student/my-exams/${rollNumber}`,
          {
            params: { branch: branch.toLowerCase() },
          },
        );
        if (response.data.status === "success") {
          setActiveExams(response.data.data);
          
          // ఒకవేళ ఆల్రెడీ ఎగ్జామ్ సెలెక్ట్ అయ్యి ఉంటే దాన్ని డిస్టర్బ్ చేయకుండా, లేకపోతే మొదటిది సెట్ చేస్తాం
          if (response.data.data.length > 0) {
            setSelectedExam(prev => prev ? response.data.data.find(e => e.exam_id === prev.exam_id) || response.data.data[0] : response.data.data[0]);
          } else {
            setSelectedExam(null);
          }
        }
      } catch (error) {
        console.error("Error fetching student exams:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentExams(); // ఫస్ట్ టైమ్ రన్ అవుతుంది

    const interval = setInterval(() => {
      fetchStudentExams(); // ప్రతీ 5 సెకన్లకి బ్యాకెండ్ నుండి ఫ్రెష్ డేటా తెస్తుంది
    }, 5000);

    return () => clearInterval(interval); // పేజీ మారితే టైమర్ క్లీన్ అవుతుంది
  }, [rollNumber, branch]);

  // Real-Time Countdown Timer Logic
  useEffect(() => {
    if (!selectedExam) {
      setTimeLeft("");
      return;
    }

    const timer = setInterval(() => {
      const now = new Date();

      let timeStr = selectedExam.exam_time;
      if (timeStr.split(":").length === 2) {
        timeStr = `${timeStr}:00`; 
      }

      // ✅ FIXED: 'T' తీసేసి స్పేస్ ఇచ్చాం! దీనివల్ల Indian Standard Time (IST) కరెక్ట్ గా పనిచేస్తుంది
      const examDateTimeStr = `${selectedExam.exam_date} ${timeStr}`;
      const examStartTime = new Date(examDateTimeStr);

      const difference = examStartTime - now;

      if (difference <= 0) {
        const examDurationMs = selectedExam.exam_duration * 60 * 1000;
        const examEndTime = new Date(examStartTime.getTime() + examDurationMs);

        if (now < examEndTime) {
          setTimeLeft("EXAM IS LIVE!");
          setIsExamReady(true);
        } else {
          setTimeLeft("Exam Expired");
          setIsExamReady(false);
          clearInterval(timer);
        }
      } else {
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
        <div className="join-status">Searching for scheduled exams...</div>
      ) : selectedExam ? (
        <div className="exam-waiting-room">
          <div className="motivation-card">
            <div className="motivation-overlay">
              <div className="academic-badge">
                {selectedExam.branch.toUpperCase()} - {selectedExam.subject}
              </div>
              <h1>All The Best, {rollNumber}!</h1>

              <div className="exam-meta-details">
                <div className="meta-item">
                  📅 <strong>Date:</strong> {selectedExam.exam_date}
                </div>
                <div className="meta-item">
                  ⏰ <strong>Time:</strong> {selectedExam.exam_time}
                </div>
                <div className="meta-item">
                  ⏳ <strong>Duration:</strong> {selectedExam.exam_duration} Mins
                </div>
              </div>

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
          We have no exams scheduled in this particular Branch at the moment.
        </div>
      )}
    </div>
  );
};

export default Join_exam;