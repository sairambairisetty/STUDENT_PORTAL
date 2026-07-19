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
  const [selectedFiles, setSelectedFiles] = useState({}); // Tracks the chosen file per exam row

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
      alert("Something went wrong while loading the exams list.");
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
      alert("Please select an Excel (.xlsx, .xls) file only.");
    }
  };

  // Submit Answer Key to Backend/Admin Route
  const handlePostKey = async (examId) => {
    const file = selectedFiles[examId];
    if (!file) {
      alert("Please upload the Excel answer key file first.");
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
        alert("Answer key Excel sheet was forwarded to the admin portal successfully.");
        fetchExamsList(); // Refresh table status
      }
    } catch (error) {
      console.error("Key posting error:", error);
      alert("Posting the answer key failed. Please try again.");
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
          <p className="header-eyebrow">Faculty Records Office</p>
          <h1>Faculty Answer Key Management</h1>
          <p>
            Upload the official OMR answer key Excel sheet for finished exams
            to forward it to the admin for evaluation.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="portal-loader">Loading exam records from the database...</div>
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
                            ? `${selectedFiles[exam.exam_id].name.substring(0, 15)}...`
                            : "Choose Excel Key"}
                        </label>
                      </div>
                    ) : (
                      <span className="lock-label-text">
                        {exam.result_status !== "NOT_POSTED"
                          ? "Excel Locked"
                          : "Exam Not Finished"}
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
                        {uploadingId === exam.exam_id ? "Uploading..." : "Post Key"}
                      </button>
                    ) : (
                      <span className="success-check-mark">
                        {exam.result_status !== "NOT_POSTED" ? "Sent" : "Disabled"}
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
          None of the exams you created have been approved by the admin yet.
        </div>
      )}
    </div>
  );
};

export default Faculty_post_key;