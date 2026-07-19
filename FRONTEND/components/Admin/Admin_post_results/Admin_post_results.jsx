import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Admin_post_results.css';

const Admin_post_results = () => {
  const navigate = useNavigate();
  const [pendingResults, setPendingResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Fetch all exams waiting for evaluation
  const fetchPendingResults = async () => {
    try {
      const response = await axios.get("http://localhost:8000/admin/pending-results");
      if (response.data.status === 'success') {
        setPendingResults(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching pending results:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingResults();
  }, []);

  // Trigger Backend OMR Auto Evaluation Algorithm
  const handleEvaluateAndPublish = async (examId) => {
    const confirmTrigger = window.confirm(`Are you sure you want to evaluate and publish results for Exam #${examId}?`);
    if (!confirmTrigger) return;

    try {
      setProcessingId(examId);
      const response = await axios.post(`http://localhost:8000/admin/post-results/${examId}`);
      
      if (response.data.status === 'success') {
        alert("Success! All student OMR response sheets have been compared against the official Excel key, and the marks have been published!");
        fetchPendingResults(); // Reload table data
      }
    } catch (error) {
      console.error("Evaluation crash error:", error);
      alert("Something went wrong while publishing the results.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="admin-results-portal-container">
      {/* Top Header Section */}
      <header className="results-portal-action-header">
        <button className="admin-dashboard-back-btn" onClick={() => navigate('/admin_main_interface')}>
          ← Back to Dashboard
        </button>
        <div className="admin-portal-header-meta">
          <p className="header-eyebrow">Admin Control Centre</p>
          <h1>Automated OMR Evaluation Control Centre</h1>
          <p className="header-sub">Review submitted answer keys and publish results to students.</p>
        </div>
      </header>

      {/* Dynamic Content Loader */}
      {loading ? (
        <div className="results-loader-box">Loading pending results...</div>
      ) : pendingResults.length > 0 ? (
        /* REQUIREMENT: Details and Post Button organized inside a Clean Table Format */
        <div className="admin-results-table-wrapper">
          <table className="admin-evaluation-table">
            <thead>
              <tr>
                <th>Exam ID</th>
                <th>Subject Name</th>
                <th>Branch</th>
                <th>Batch Year</th>
                <th>Faculty ID</th>
                <th>Exam Date</th>
                <th>Key Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingResults.map((item) => (
                <tr key={item.exam_id}>
                  <td><span className="admin-exam-id-tag">#{item.exam_id}</span></td>
                  <td><strong className="admin-subject-title">{item.subject}</strong></td>
                  <td><span className="admin-branch-badge">{item.branch.toUpperCase()}</span></td>
                  <td>{item.year}</td>
                  <td><span className="admin-fac-id-badge">{item.faculty_id}</span></td>
                  <td>{item.exam_date}</td>
                  <td>
                    <span className="admin-key-status-ready">
                      Excel Key Ready
                    </span>
                  </td>
                  <td>
                    <button 
                      className="admin-hit-post-btn"
                      onClick={() => handleEvaluateAndPublish(item.exam_id)}
                      disabled={processingId === item.exam_id}
                      title="Evaluate and publish marks"
                    >
                      {processingId === item.exam_id ? "Evaluating..." : "Evaluate & Publish"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="results-empty-container">
          No pending results to evaluate right now.
        </div>
      )}
    </div>
  );
};

export default Admin_post_results;