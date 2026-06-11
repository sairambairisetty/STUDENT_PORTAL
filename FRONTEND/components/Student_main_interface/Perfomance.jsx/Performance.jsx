import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Performance.css";

const Performance = () => {
  const rollNumber = localStorage.getItem("studentRollNumber") || "246M1A1201";
  const [examHistory, setExamHistory] = useState([]);
  const [detailResult, setDetailResult] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/student/my-performance/${rollNumber}`,
        );
        if (res.data.status === "success") setExamHistory(res.data.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchHistory();
  }, [rollNumber]);

  const handleSeeResult = async (examId) => {
    try {
      const res = await axios.get(
        `http://localhost:8000/student/see-result/${examId}/${rollNumber}`,
      );
      if (res.data.status === "success") {
        setDetailResult(res.data);
        setShowDetail(true);
      }
    } catch (err) {
      alert("రిజల్ట్ లోడ్ కాలేదు!");
    }
  };

  return (
    <div className="performance-container">
      {!showDetail ? (
        <>
          <h2>My Academic Performance</h2>
          <table className="perf-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Date</th>
                <th>Status</th>
                <th>Marks</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {examHistory.map((h) => (
                <tr key={h.exam_id}>
                  <td>{h.subject}</td>
                  <td>{h.exam_date}</td>
                  <td>
                    <span className={`status-tag ${h.result_status}`}>
                      {h.result_status}
                    </span>
                  </td>
                  <td>{h.total_marks}</td>
                  <td>
                    {h.result_status === "PUBLISHED" ? (
                      <button
                        className="view-res-btn"
                        onClick={() => handleSeeResult(h.exam_id)}
                      >
                        See Result
                      </button>
                    ) : (
                      <span>Wait for Key</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <div className="detailed-result-view">
          <button className="close-btn" onClick={() => setShowDetail(false)}>
            ← Back
          </button>
          <div className="summary-header">
            <h2>Result Analysis: {detailResult.summary.total_marks} Marks</h2>
            <div className="stats">
              <span className="correct">
                Correct: {detailResult.summary.correct}
              </span>
              <span className="wrong">Wrong: {detailResult.summary.wrong}</span>
            </div>
          </div>
          <div className="comparison-table-wrapper">
            <table className="compare-table">
              <thead>
                <tr>
                  <th>Q.No</th>
                  <th>Your Answer</th>
                  <th>Correct Key</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {detailResult.comparison.map((item) => (
                  <tr key={item.question_no}>
                    <td>{item.question_no}</td>
                    <td>{item.student_option}</td>
                    <td>{item.faculty_option}</td>
                    <td>
                      {item.is_match ? (
                        <span className="tick">✔</span>
                      ) : (
                        <span className="cross">✘</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Performance;
