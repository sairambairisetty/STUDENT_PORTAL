import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Conduct_exam.css";

const Conduct_exam = () => {
  // Form Input States
  const [branch, setBranch] = useState("");
  const [subject, setSubject] = useState("");
  const [batch, setBatch] = useState("");
  const [examDate, setExamDate] = useState("");
  const [examTime, setExamTime] = useState("");
  const [examDuration, setExamDuration] = useState("");

  const [totalQuestions, setTotalQuestions] = useState("50");
  const [pdfFile, setPdfFile] = useState(null);

  // Dynamic Students States
  const [studentsList, setStudentsList] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Fetch Students when BOTH Branch and Batch are selected
  useEffect(() => {
    const fetchStudents = async () => {
      if (branch && batch) {
        setLoadingStudents(true);
        try {
          const response = await axios.get(
            `http://localhost:8000/admin/student_details`,
            {
              params: {
                branch: branch.toLowerCase().trim(),
                batch: batch,
              },
            },
          );

          if (response.data.status === "success") {
            setStudentsList(response.data.data);
            setSelectedStudents([]);
          }
        } catch (error) {
          console.error("Error fetching students:", error);
          alert("Failed to load student data for the selected branch and batch.");
          setStudentsList([]);
        } finally {
          setLoadingStudents(false);
        }
      } else {
        setStudentsList([]);
        setSelectedStudents([]);
      }
    };

    fetchStudents();
  }, [branch, batch]);

  const handleCheckboxChange = (rollNumber) => {
    if (selectedStudents.includes(rollNumber)) {
      setSelectedStudents(selectedStudents.filter((id) => id !== rollNumber));
    } else {
      setSelectedStudents([...selectedStudents, rollNumber]);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allRolls = studentsList.map((student) => student.roll_number);
      setSelectedStudents(allRolls);
    } else {
      setSelectedStudents([]);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
    } else {
      alert("Please upload a PDF file only.");
      e.target.value = null;
      setPdfFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !branch ||
      !subject ||
      !batch ||
      !examDate ||
      !examTime ||
      !examDuration ||
      !totalQuestions ||
      !pdfFile
    ) {
      alert("Please fill in all the fields before submitting.");
      return;
    }

    if (selectedStudents.length === 0) {
      alert("Please select at least one student.");
      return;
    }

    const formData = new FormData();
    formData.append("faculty_id", "FAC_MEMBER");
    formData.append("branch", branch);
    formData.append("subject", subject);
    formData.append("batch", batch);
    formData.append("exam_date", examDate);
    formData.append("exam_time", examTime);
    formData.append("exam_duration", Number(examDuration));
    formData.append("total_questions", Number(totalQuestions));
    formData.append("file", pdfFile);
    formData.append("selected_students", JSON.stringify(selectedStudents));

    try {
      const response = await axios.post(
        "http://localhost:8000/faculty/submit-exam",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      if (response.data.status === "success") {
        alert("Exam paper, duration, and student list were sent to the admin successfully.");
        setSubject("");
        setExamDate("");
        setExamTime("");
        setExamDuration("");
        setTotalQuestions("50");
        setPdfFile(null);
        setSelectedStudents([]);

        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = "";
      }
    } catch (error) {
      console.error("Submission Error:", error);
      alert("Failed to save the exam record to the database.");
    }
  };

  return (
    <div className="conduct-exam-container">
      <div className="conduct-exam-header">
        <p className="header-eyebrow">Faculty Records Office</p>
        <h1>Launch Examination Portal</h1>
        <p>Select the students who will take the exam from the branch's student table.</p>
      </div>

      <form onSubmit={handleSubmit} className="exam-form-layout">
        {/* Left Section: Exam Configurations */}
        <div className="form-left-panel">
          <h3>Exam Parameters</h3>

          <div className="input-group">
            <label>Branch</label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              required
            >
              <option value="">Select Branch</option>
              <option value="aids">Artificial Intelligence & Data Science (AIDS)</option>
              <option value="aiml">Artificial Intelligence & Machine Learning (AIML)</option>
              <option value="cse">Computer Science Engineering (CSE)</option>
              <option value="ece">Electronics & Communication (ECE)</option>
              <option value="it">Information Technology (IT)</option>
            </select>
          </div>

          <div className="input-group">
            <label>Year / Batch</label>
            <select
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              required
            >
              <option value="">Select Year / Batch</option>
              <option value="2024-2028">2024 - 2028 Batch</option>
              <option value="2023-2027">2023 - 2027 Batch</option>
              <option value="2022-2026">2022 - 2026 Batch</option>
              <option value="2021-2025">2021 - 2025 Batch</option>
            </select>
          </div>

          <div className="input-group">
            <label>Subject Name</label>
            <input
              type="text"
              placeholder="e.g., Database Management Systems"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          <div className="datetime-duration-grid">
            <div className="input-group">
              <label>Exam Date</label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Start Time</label>
              <input
                type="time"
                value={examTime}
                onChange={(e) => setExamTime(e.target.value)}
                required
              />
            </div>
            <div className="input-group full-width-mobile">
              <label>Duration</label>
              <select
                value={examDuration}
                onChange={(e) => setExamDuration(e.target.value)}
                required
              >
                <option value="">Select Duration</option>
                <option value="30">30 Minutes</option>
                <option value="60">1 Hour (60 mins)</option>
                <option value="90">1.5 Hours (90 mins)</option>
                <option value="120">2 Hours (120 mins)</option>
                <option value="180">3 Hours (180 mins)</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label>Total Questions (OMR Count)</label>
            <input
              type="number"
              min="1"
              value={totalQuestions}
              onChange={(e) => setTotalQuestions(e.target.value)}
              required
            />
          </div>

          <div className="input-group file-upload-box">
            <label>Upload Question Paper (PDF)</label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              required
            />
          </div>

          <button type="submit" className="submit-exam-btn">
            Forward Paper to Admin Portal
          </button>
        </div>

        {/* Right Section: Checkboxes for Selection */}
        <div className="form-right-panel">
          <h3>Select Students ({selectedStudents.length} Selected)</h3>

          {loadingStudents ? (
            <div className="status-msg">Loading table rows from the database...</div>
          ) : studentsList.length > 0 ? (
            <div className="student-list-wrapper">
              <div className="select-all-box">
                <input
                  type="checkbox"
                  id="selectAll"
                  onChange={handleSelectAll}
                  checked={selectedStudents.length === studentsList.length}
                />
                <label htmlFor="selectAll">
                  <strong>Select All Students</strong>
                </label>
              </div>

              <div className="student-scroll-area">
                <table className="student-table">
                  <thead>
                    <tr>
                      <th>Select</th>
                      <th>Roll Number</th>
                      <th>Name</th>
                      <th>Section</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsList.map((student) => (
                      <tr key={student.roll_number}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(
                              student.roll_number,
                            )}
                            onChange={() =>
                              handleCheckboxChange(student.roll_number)
                            }
                          />
                        </td>
                        <td>{student.roll_number}</td>
                        <td>{student.name}</td>
                        <td>{student.section}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="status-msg empty">
              Select both Branch and Year/Batch above to load the student list.
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default Conduct_exam;