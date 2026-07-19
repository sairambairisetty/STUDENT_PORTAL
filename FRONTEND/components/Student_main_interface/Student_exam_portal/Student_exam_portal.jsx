import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Student_exam_portal.css";

const Student_exam_portal = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const rollNumber = localStorage.getItem("studentRollNumber") || "246M1A1201";

  const [examDetails, setExamDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [durationLeft, setDurationLeft] = useState(0);

  // ---------------- NEW: Fullscreen + Keyboard Lock state ----------------
  const [fsWarning, setFsWarning] = useState("");

  // NEW: Force the browser into fullscreen mode
  const enterFullscreen = useCallback(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    } else if (el.msRequestFullscreen) {
      el.msRequestFullscreen();
    }
  }, []);

  // NEW: Enter fullscreen + block keyboard as soon as the exam portal mounts
  useEffect(() => {
    enterFullscreen();

    const handleFsChange = () => {
      const fsActive = !!document.fullscreenElement;
      if (!fsActive) {
        setFsWarning(
          "you are out side of full screen . please enter to full screen mode",
        );
        setTimeout(() => {
          enterFullscreen();
        }, 500);
      } else {
        setFsWarning("");
      }
    };

    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    document.addEventListener("msfullscreenchange", handleFsChange);

    // Block every keyboard key — only mouse should work during the exam
    const blockKeyboard = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };
    window.addEventListener("keydown", blockKeyboard, true);
    window.addEventListener("keyup", blockKeyboard, true);
    window.addEventListener("keypress", blockKeyboard, true);

    // Block right-click menu and copy/cut/paste
    const blockContextMenu = (e) => e.preventDefault();
    document.addEventListener("contextmenu", blockContextMenu);

    const blockClipboard = (e) => e.preventDefault();
    document.addEventListener("copy", blockClipboard);
    document.addEventListener("cut", blockClipboard);
    document.addEventListener("paste", blockClipboard);

    // Warn on accidental tab close / refresh while exam is in progress
    const beforeUnloadHandler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnloadHandler);

    // Cleanup everything when the student leaves this page (after submit)
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
      document.removeEventListener("msfullscreenchange", handleFsChange);
      window.removeEventListener("keydown", blockKeyboard, true);
      window.removeEventListener("keyup", blockKeyboard, true);
      window.removeEventListener("keypress", blockKeyboard, true);
      document.removeEventListener("contextmenu", blockContextMenu);
      document.removeEventListener("copy", blockClipboard);
      document.removeEventListener("cut", blockClipboard);
      document.removeEventListener("paste", blockClipboard);
      window.removeEventListener("beforeunload", beforeUnloadHandler);

      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [enterFullscreen]);
  // ---------------- END NEW ----------------

  // 1. Fetch PDF Path, Duration & Total Questions Count from Backend
  useEffect(() => {
    const fetchPortalData = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/student/exam-portal-details/${examId}`,
        );
        if (response.data.status === "success") {
          const exam = response.data.data;
          setExamDetails(exam);
          setDurationLeft(exam.exam_duration * 60);
        }
      } catch (error) {
        console.error("Portal Data Error:", error);
        alert("error in exam loading");
        navigate("/student-dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchPortalData();
  }, [examId, navigate]);

  // 2. Countdown Timer & Auto-Submit when Time Over
  useEffect(() => {
    if (durationLeft <= 0 && !loading && examDetails) {
      if (durationLeft === 0) {
        alert("⏳ Time Over! answers are submitting automatically.");
        handleFinalSubmit(true);
      }
      return;
    }

    const timer = setInterval(() => {
      setDurationLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [durationLeft, loading, examDetails]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const handleOptionChange = (qNum, option) => {
    setAnswers({ ...answers, [qNum]: option });
  };

  // 3. Submit Answers Sheet to DB
  const handleFinalSubmit = async (isAuto = false) => {
    if (!isAuto) {
      const confirmSubmit = window.confirm("are u sure to lock the answers");
      if (!confirmSubmit) return;
    }

    try {
      const response = await axios.post(
        "http://localhost:8000/student/submit-answers",
        {
          roll_number: rollNumber,
          exam_id: parseInt(examId),
          answers: answers,
        },
      );

      if (response.data.status === "success") {
        alert(
          "🎉 answers sheets will be forwarded sucessfully to your faculty",
        );
        navigate("/student-dashboard");
      }
    } catch (error) {
      print("Submission error:", error);
      alert("error in submiting your answers");
    }
  };

  if (loading) return <div className="portal-loading">please wait</div>;

  return (
    <div className="exam-portal-layout">
      {/* NEW: Fullscreen exit warning banner */}
      {fsWarning && (
        <div className="fullscreen-warning-banner">{fsWarning}</div>
      )}

      <header className="portal-top-bar">
        <div className="portal-title">
          <h2>CampusPro Examination Portal</h2>
          <span>
            Subject: <strong>{examDetails?.subject}</strong>
          </span>
        </div>
        <div className="portal-timer-badge">
          <span>Time Remaining:</span>
          <span className="countdown-clock">{formatTime(durationLeft)}</span>
        </div>
      </header>

      <div className="split-screen-container">
        {/* Left Side Panel - PDF View */}
        <div className="left-pdf-panel">
          {examDetails?.pdf_path ? (
            <iframe
              src={`http://localhost:8000/${examDetails.pdf_path}#toolbar=0`}
              width="100%"
              height="100%"
              title="Question Paper"
              className="pdf-iframe"
            />
          ) : (
            <div className="no-pdf-msg">question paper not loaded</div>
          )}
        </div>

        {/* Right Side Panel - OMR Layout */}
        <div className="right-omr-panel">
          <div className="omr-header">
            <h3>Digital OMR Answer Sheet</h3>
            <p>select correct option to see the left side pdf</p>
          </div>

          <div className="omr-scroll-area">
            {/* FIXED: ఇక్కడ 30 కాకుండా డేటాబేస్ నుండి వచ్చే కౌంట్ బట్టి బబుల్స్ జెనరేట్ అవుతాయి */}
            {Array.from(
              { length: examDetails?.total_questions || 30 },
              (_, i) => i + 1,
            ).map((qNum) => (
              <div key={qNum} className="omr-row">
                <span className="q-number">Q{qNum}.</span>
                <div className="options-group">
                  {["A", "B", "C", "D"].map((opt) => (
                    <label
                      key={opt}
                      className={`opt-label ${answers[qNum] === opt ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name={`q-${qNum}`}
                        value={opt}
                        checked={answers[qNum] === opt}
                        onChange={() => handleOptionChange(qNum, opt)}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* FIXED: ఈ సబ్మిట్ యాక్షన్ బాక్స్ ఇప్పుడు స్క్రోల్ అవ్వకుండా స్థిరంగా కిందనే ఉంటుంది */}
          <div className="omr-footer-action">
            <button
              className="lock-exam-btn"
              onClick={() => handleFinalSubmit(false)}
            >
              🔒 Submit & Lock Answer Sheet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Student_exam_portal;
