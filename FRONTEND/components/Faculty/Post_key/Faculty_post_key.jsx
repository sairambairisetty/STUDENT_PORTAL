import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Faculty_post_key.css";

const Faculty_post_key = () => {
  const navigate = useNavigate();
  const facultyId = localStorage.getItem("facultyEmployeeId") || "FAC_MEMBER";

  // States
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState({}); // To track files for each exam row отдельно

  // Fetch Exams Posted by Faculty
  const fetchExamsList = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8000/faculty/posted-exams/${facultyId}`,
      );
      if (response.data.status === "success") {
        setExams(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching posted exams:", error);
      alert("ఎగ్జామ్స్ లిస్ట్ లోడ్ చేయడంలో లోపం జరిగింది!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamsList();
  }, []);

  // Handle individual row file selection
  const handleFileChange = (examId, file) => {
    if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))) {
      setSelectedFiles({
        ...selectedFiles,
        [examId]: file,
      });
    } else {
      alert("దయచేసి కేవలం Excel (.xlsx, .xls) ఫైల్ మాత్రమే ఎంచుకోండి!");
    }
  };

  // Submit Answer Key to Backend/Admin Route
  const handlePostKey = async (examId) => {
    const file = selectedFiles[examId];
    if (!file) {
      alert("దయచేసి ముందుగా Excel Answer Key ఫైల్‌ను అప్‌లోడ్ చేయండి!");
      return;
    }

    const formData = new FormData();
    formData.append("exam_id", examId);
    formData.append("file", file);

    try {
      setUploadingId(examId);
      const response = await axios.post(
        "http://localhost:8000/faculty/submit-key-excel",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      if (response.data.status === "success") {
        alert(
          "🎉 Answer Key Excel sheet విజయవంతంగా అడ్మిన్ పోర్టల్‌కి ఫార్వర్డ్ చేయబడింది!",
        );
        fetchExamsList(); // Refresh table status
      }
    } catch (error) {
      console.error("Key posting error:", error);
      alert("Answer Key పోస్ట్ చేయడం విఫలమైంది!");
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="post-key-portal-container">
      <header className="portal-action-header">
        <button
          className="back-dash-btn"
          onClick={() => navigate("/faculty-main-interface")}
        >
          ← Back to Dashboard
        </button>
        <div className="header-meta">
          <h1>Faculty Answer Key Management</h1>
          <p>
            ఎగ్జామ్ ముగిసిన పేపర్లకు ఇక్కడ అఫీషియల్ OMR Answer Key ఎక్సెల్
            షీట్లను అప్‌లోడ్ చేసి అడ్మిన్ కి పంపండి.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="portal-loader">
          డేటాబేస్ నుండి ఎగ్జామ్ రికార్డ్స్ లోడ్ అవుతున్నాయి...
        </div>
      ) : exams.length > 0 ? (
        <div className="table-responsive-wrapper">
          <table className="faculty-key-table">
            <thead>
              <tr>
                <th>Exam ID</th>
                <th>Subject Name</th>
                <th>Branch</th>
                <th>Exam Date</th>
                <th>Start Time</th>
                <th>Duration</th>
                <th>Finished Status</th>
                <th>Result Status</th>
                <th>Upload Key (Excel)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam.exam_id}>
                  <td>
                    <span className="exam-id-badge">#{exam.exam_id}</span>
                  </td>
                  <td>
                    <strong className="subject-text">{exam.subject}</strong>
                  </td>
                  <td>
                    <span className="branch-tag">
                      {exam.branch.toUpperCase()}
                    </span>
                  </td>
                  <td>{exam.exam_date}</td>
                  <td>{exam.exam_time}</td>
                  <td>{exam.exam_duration} Mins</td>
                  <td>
                    {/* REQUIREMENT: True / False Display with clean custom badges */}
                    <span
                      className={`status-badge ${exam.is_finished ? "true-badge" : "false-badge"}`}
                    >
                      {exam.is_finished ? "TRUE" : "FALSE"}
                    </span>
                  </td>
                  <td>
                    <span className={`result-state-tag ${exam.result_status}`}>
                      {exam.result_status}
                    </span>
                  </td>
                  <td>
                    {exam.is_finished && exam.result_status === "NOT_POSTED" ? (
                      <div className="excel-input-wrapper">
                        <input
                          type="file"
                          id={`file-${exam.exam_id}`}
                          accept=".xlsx, .xls"
                          onChange={(e) =>
                            handleFileChange(exam.exam_id, e.target.files[0])
                          }
                          className="hidden-file-input"
                        />
                        <label
                          htmlFor={`file-${exam.exam_id}`}
                          className="custom-file-label"
                        >
                          {selectedFiles[exam.exam_id]
                            ? `📁 ${selectedFiles[exam.exam_id].name.substring(0, 15)}...`
                            : "Choose Excel Key"}
                        </label>
                      </div>
                    ) : (
                      <span className="lock-label-text">
                        {exam.result_status !== "NOT_POSTED"
                          ? "🔒 Excel Locked"
                          : "⏳ Exam Not Finished"}
                      </span>
                    )}
                  </td>
                  <td>
                    {exam.is_finished && exam.result_status === "NOT_POSTED" ? (
                      <button
                        className="post-submit-icon-btn"
                        onClick={() => handlePostKey(exam.exam_id)}
                        disabled={uploadingId === exam.exam_id}
                        title="Forward Key to Admin"
                      >
                        {uploadingId === exam.exam_id ? "⏳" : "🚀 Post Key"}
                      </button>
                    ) : (
                      <span className="success-check-mark">
                        {exam.result_status !== "NOT_POSTED"
                          ? "✅ Sent"
                          : "❌ Disabled"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-exams-box">
          📭 నువ్వు ఇప్పటివరకు క్రియేట్ చేసిన ఎగ్జామ్స్ ఏవీ అడ్మిన్ చేత అప్రూవ్
          చేయబడలేదు!
        </div>
      )}
    </div>
  );
};

export default Faculty_post_key;
