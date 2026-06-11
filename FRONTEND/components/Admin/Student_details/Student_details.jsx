import React, { useState } from 'react';
import './Student_details.css';

const Student_details = () => {
  const [branch, setBranch] = useState('');
  const [batch, setBatch] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!branch || !batch) return alert("Please select both Branch and Batch");

    setLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/admin/student_details?branch=${branch}&batch=${batch}`);
      const result = await response.json();
      
      if (response.ok) {
        setStudents(result.data);
      } else {
        alert(result.detail);
      }
    } catch (error) {
      alert("Backend connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="details-page-container">
      <div className="selection-card no-print">
        <h2>Search Student Records</h2>
        <form onSubmit={handleSearch} className="search-form">
          <select value={branch} onChange={(e) => setBranch(e.target.value)} required>
            <option value="">-- Choose Branch --</option>
            <option value="cse">CSE</option>
            <option value="it">IT</option>
            <option value="aiml">AIML</option>
            <option value="aids">AIDS</option>
            <option value="ece">ECE</option>
          </select>

          <select value={batch} onChange={(e) => setBatch(e.target.value)} required>
            <option value="">-- Choose Batch --</option>
            <option value="2024-2028">2024-2028</option>
            <option value="2023-2027">2023-2027</option>
            <option value="2022-2026">2022-2026</option>
          </select>

          <div className="button-group">
            <button type="submit" className="search-btn" disabled={loading}>
              {loading ? "Searching..." : "View Details"}
            </button>
            {students.length > 0 && (
              <button type="button" className="print-btn" onClick={handlePrint}>
                Print Table
              </button>
            )}
          </div>
        </form>
      </div>

      {students.length > 0 ? (
        <div className="table-wrapper">
          <div className="print-only-header">
            <h1>Student Records Report</h1>
            <p>Branch: {branch.toUpperCase()} | Batch: {batch}</p>
          </div>

          <table className="details-table">
            <thead>
              <tr>
                <th>Roll Number</th>
                <th>Name</th>
                <th>Gender</th>
                <th>DOB</th>
                <th>Dept</th>
                <th>Branch</th>
                <th>Sec</th>
                <th>Batch</th>
              </tr>
            </thead>
            <tbody>
              {students.map((std) => (
                <tr key={std.roll_number}>
                  <td>{std.roll_number}</td>
                  <td>{std.name}</td>
                  <td>{std.gender}</td>
                  <td>{std.dob}</td>
                  <td>{std.department}</td>
                  <td>{std.branch}</td>
                  <td>{std.section}</td>
                  <td>{std.batch}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && branch && <p className="no-data no-print">No records found for this selection.</p>
      )}
    </div>
  );
};

export default Student_details;