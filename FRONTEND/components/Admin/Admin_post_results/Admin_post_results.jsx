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
    const confirmTrigger = window.confirm(`మీరు నిజంగానే Exam #${examId} రిజల్ట్స్‌ని ఎవాల్యుయేట్ చేసి పబ్లిష్ చేయాలనుకుంటున్నారా?`);
    if (!confirmTrigger) return;

    try {
      setProcessingId(examId);
      const response = await axios.post(`http://localhost:8000/admin/post-results/${examId}`);
      
      if (response.data.status === 'success') {
        alert("🎉 అద్భుతం! విద్యార్థుల OMR రెస్పాన్స్ షీట్లు అన్నీ అఫీషియల్ ఎక్సెల్ కీ తో కంపేర్ చేయబడి, మార్కులు పబ్లిష్ అయ్యాయి!");
        fetchPendingResults(); // Reload table data
      }
    } catch (error) {
      console.error("Evaluation crash error:", error);
      alert("రిజల్ట్స్ ఎవాల్యుయేషన్ రన్ చేయడం విఫలమైంది!");
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
          <h1>Automated OMR Evaluation Control Centre</h1>
          <p>ఫ్యాకల్టీలు సబ్మిట్ చేసిన అఫీషియల్ ఎక్సెల్ ఆన్సర్ కీస్ ఇక్కడ ఉన్నాయి. సింగిల్ క్లిక్‌తో మార్కులను ప్రాసెస్ చేయండి.</p>
        </div>
      </header>

      {/* Dynamic Content Loader */}
      {loading ? (
        <div className="results-loader-box">డేటాబేస్ నుండి పెండింగ్ రిజల్ట్స్ రికార్డ్స్ లోడ్ అవుతున్నాయి...</div>
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
                <th>Action Node</th>
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
                      title="Hit Post to Calculate Marks"
                    >
                      {processingId === item.exam_id ? "⏳ Evaluating..." : "🚀 Hit Post to Publish"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="results-empty-container">
          🌴 సూపర్ సాయిరామ్! ఫ్యాకల్టీల నుండి ప్రస్తుతం ఎలాంటి పెండింగ్ రిజల్ట్స్ అప్‌లోడ్స్ లేవు. అంతా అప్‌-టు-డేట్ లో ఉంది.
        </div>
      )}
    </div>
  );
};

export default Admin_post_results;