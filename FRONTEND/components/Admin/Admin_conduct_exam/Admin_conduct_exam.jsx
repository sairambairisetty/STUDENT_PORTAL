import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Admin_conduct_exam.css";

const Admin_conduct_exam = () => {
  const [pendingExams, setPendingExams] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch all pending exams when admin opens this page
  useEffect(() => {
    fetchPendingExams();
  }, []);

  const fetchPendingExams = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/admin/pending-exams",
      );
      if (response.data.status === "success") {
        setPendingExams(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching pending exams:", error);
      alert("పెండింగ్ ఎగ్జామ్స్ లిస్ట్ లోడ్ చేయడంలో లోపం జరిగింది!");
    } finally {
      setLoading(false);
    }
  };

  // 2. Approve Exam and Trigger Notifications
  const handleApprove = async (examId) => {
    try {
      const response = await axios.post(
        `http://localhost:8000/admin/approve-exam/${examId}`,
      );
      if (response.data.status === "success") {
        alert(
          "🚀 Exam Approved & Launched! సెలెక్ట్ అయిన స్టూడెంట్స్ కి నోటిఫికేషన్ వెళ్ళింది.",
        );
        // టేబుల్ నుండి అప్రూవ్ అయిన ఎగ్జామ్ ని తీసేయడం
        setPendingExams(pendingExams.filter((exam) => exam.exam_id !== examId));
      }
    } catch (error) {
      console.error("Approval Error:", error);
      alert("ఎగ్జామ్ అప్రూవ్ చేయడం విఫలమైంది!");
    }
  };

  return (
    <div className="admin-exam-container">
      <div className="admin-exam-header">
        <h1>Admin Examination Control Portal</h1>
        <p>
          ఫ్యాకల్టీ సబ్మిట్ చేసిన క్వశ్చన్ పేపర్స్ ని రివ్యూ చేసి, ఇక్కడ అప్రూవ్
          చేయండి.
        </p>
      </div>

      {loading ? (
        <div className="admin-status">
          పెండింగ్ ఎగ్జామ్స్ రికార్డ్స్ లోడ్ అవుతున్నాయి...
        </div>
      ) : pendingExams.length > 0 ? (
        <div className="admin-table-wrapper">
          <table className="admin-exam-table">
            <thead>
              <tr>
                <th>Exam ID</th>
                <th>Faculty</th>
                <th>Branch</th>
                <th>Batch</th>
                <th>Subject</th>
                <th>Exam Date & Time</th>
                <th>Duration</th>
                <th>Question Paper</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingExams.map((exam) => (
                <tr key={exam.exam_id}>
                  <td>
                    <strong>#{exam.exam_id}</strong>
                  </td>
                  <td>{exam.faculty_id}</td>
                  <td className="branch-badge">{exam.branch.toUpperCase()}</td>
                  <td>{exam.year}</td>
                  <td>{exam.subject}</td>
                  <td>
                    {exam.exam_date} @ {exam.exam_time}
                  </td>
                  <td>{exam.exam_duration} Mins</td>
                  <td>
                    {/* సర్వర్ లోని PDF పాత్ ని బ్రౌజర్ లో ఓపెన్ చేయడానికి */}
                    <a
                      href={`http://localhost:8000/${exam.pdf_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="view-pdf-btn"
                    >
                      📄 View PDF
                    </a>
                  </td>
                  <td>
                    <button
                      className="approve-btn"
                      onClick={() => handleApprove(exam.exam_id)}
                    >
                      ✅ Approve & Notify
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-status empty">
          🎉 ప్రస్తుతం ఎలాంటి పెండింగ్ ఎగ్జామ్ షీట్స్ లేవు!
        </div>
      )}
    </div>
  );
};

export default Admin_conduct_exam;
