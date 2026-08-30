import React, { useState, useEffect, useCallback, useRef } from "react";
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

  // Security, Fullscreen & Grace Timer States
  const [warnings, setWarnings] = useState(0);
  const [fsWarning, setFsWarning] = useState("");
  const [isOutsideFs, setIsOutsideFs] = useState(false);
  const [graceTimeLeft, setGraceTimeLeft] = useState(10);

  // References to keep event listeners updated with the freshest states
  const answersRef = useRef(answers);
  const warningsRef = useRef(warnings);
  const graceTimerRef = useRef(null);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    warningsRef.current = warnings;
  }, [warnings]);

  // Force the browser into fullscreen mode
  const enterFullscreen = useCallback(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    } else if (el.msRequestFullscreen) {
      el.msRequestFullscreen();
    }
    setIsOutsideFs(false);
    setFsWarning("");
    if (graceTimerRef.current) {
      clearInterval(graceTimerRef.current);
    }
  }, []);

  // 1. Core Submission Handler (Accessible by both manual click and auto-trigger)
  const handleFinalSubmit = useCallback(
    async (isAuto = false) => {
      // Clear any running grace period timers immediately
      if (graceTimerRef.current) {
        clearInterval(graceTimerRef.current);
      }

      if (!isAuto) {
        const confirmSubmit = window.confirm(
          "Are you sure you want to lock and submit your answers?",
        );
        if (!confirmSubmit) return;
      }

      try {
        const response = await axios.post(
          "http://localhost:8000/student/submit-answers",
          {
            roll_number: rollNumber,
            exam_id: parseInt(examId),
            answers: answersRef.current,
          },
        );

        if (response.data.status === "success") {
          alert(
            "🎉 Answer sheet has been successfully forwarded to your faculty.",
          );
          navigate("/student-dashboard");
        }
      } catch (error) {
        console.error("Submission error:", error);
        alert(
          "Error submitting your answers. Please contact the administrator.",
        );
      }
    },
    [examId, rollNumber, navigate],
  );

  // 2. Fullscreen Monitoring & Grace Period Timer Logic
  useEffect(() => {
    enterFullscreen();

    const handleFsChange = () => {
      const fsActive = !!document.fullscreenElement;

      if (!fsActive) {
        // Increment warning count immediately upon exit
        const nextCount = warningsRef.current + 1;
        setWarnings(nextCount);

        if (nextCount >= 3) {
          setFsWarning(
            "🚨 Malpractice detected! Exited fullscreen 3 times. Submitting exam...",
          );
          alert(
            "🚨 Malpractice Lockout! You have breached the fullscreen rule 3 times. Your exam is ending immediately.",
          );
          handleFinalSubmit(true);
          return;
        }

        // Trigger the 10-second grace window setup
        setIsOutsideFs(true);
        setGraceTimeLeft(10);
        setFsWarning(
          `⚠️ Left fullscreen! Violation Count: ${nextCount} / 3. Return within 10 seconds!`,
        );

        // Start a precise 1-second interval countdown ticker
        let currentGrace = 10;
        if (graceTimerRef.current) clearInterval(graceTimerRef.current);

        graceTimerRef.current = setInterval(() => {
          currentGrace -= 1;
          setGraceTimeLeft(currentGrace);

          if (currentGrace <= 0) {
            clearInterval(graceTimerRef.current);
            setFsWarning("🚨 Time ran out! Submitting exam automatically...");
            alert(
              "🚨 Time limit exceeded! You did not return to fullscreen within 10 seconds. Your exam is closing now.",
            );
            handleFinalSubmit(true);
          } else {
            setFsWarning(
              `⚠️ Left fullscreen! Violation Count: ${nextCount} / 3. Return within ${currentGrace} seconds!`,
            );
          }
        }, 1000);
      } else {
        // Clean up locks if the user manually or via button enters fullscreen successfully
        setIsOutsideFs(false);
        setFsWarning("");
        if (graceTimerRef.current) {
          clearInterval(graceTimerRef.current);
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    document.addEventListener("msfullscreenchange", handleFsChange);

    // Block all keyboard inputs
    const blockKeyboard = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };
    window.addEventListener("keydown", blockKeyboard, true);
    window.addEventListener("keyup", blockKeyboard, true);
    window.addEventListener("keypress", blockKeyboard, true);

    // Block right-click and clipboard manipulations
    const blockContextMenu = (e) => e.preventDefault();
    document.addEventListener("contextmenu", blockContextMenu);

    const blockClipboard = (e) => e.preventDefault();
    document.addEventListener("copy", blockClipboard);
    document.addEventListener("cut", blockClipboard);
    document.addEventListener("paste", blockClipboard);

    // Trap page refreshes
    const beforeUnloadHandler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnloadHandler);

    // Cleanups on component unmount
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
      if (graceTimerRef.current) clearInterval(graceTimerRef.current);

      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [enterFullscreen, handleFinalSubmit]);

  // 3. Fetch PDF Meta structural layout metrics from backend
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
        console.error("Portal Data Fetch Error:", error);
        alert("Error loading exam details. Moving back to dashboard.");
        navigate("/student-dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchPortalData();
  }, [examId, navigate]);

  // 4. Dynamic countdown duration tick down engine
  useEffect(() => {
    if (durationLeft <= 0 && !loading && examDetails) {
      if (durationLeft === 0) {
        alert(
          "⏳ Time Over! Your answers are being locked and submitted automatically.",
        );
        handleFinalSubmit(true);
      }
      return;
    }

    const timer = setInterval(() => {
      setDurationLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [durationLeft, loading, examDetails, handleFinalSubmit]);

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

  if (loading)
    return (
      <div className="portal-loading">
        Please wait, setting up secure desktop framework...
      </div>
    );

  return (
    <div className="exam-portal-layout">
      {/* Dynamic malpractice safety notification alert banner + Return Button */}
      {fsWarning && (
        <div className="fullscreen-warning-banner">
          <span>{fsWarning}</span>
          {isOutsideFs && (
            <button className="re-enter-fs-btn" onClick={enterFullscreen}>
              🔄 Re-enter Fullscreen ({graceTimeLeft}s)
            </button>
          )}
        </div>
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
        {/* Left Side Panel - PDF Render Canvas */}
        <div className="left-pdf-panel">
          {examDetails?.pdf_path ? (
            <iframe
              src={`http://localhost:8000/${examDetails.pdf_path}#toolbar=0`}
              width="100%"
              height="100%"
              title="Question Paper Workspace"
              className="pdf-iframe"
            />
          ) : (
            <div className="no-pdf-msg">
              Question paper asset failed to load properly.
            </div>
          )}
        </div>

        {/* Right Side Panel - OMR Layout Engine */}
        <div className="right-omr-panel">
          <div className="omr-header">
            <h3>Digital OMR Answer Sheet</h3>
            <p>
              Select corresponding values relative to the adjacent assessment
              sheet
            </p>
          </div>

          <div className="omr-scroll-area">
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

          {/* Secure submission lock deck */}
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
