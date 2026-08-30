import React, { useState } from 'react';
import './Faculty_information.css';

const Faculty_information = () => {
  const [empId, setEmpId] = useState('');
  const [facultyData, setFacultyData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!empId) return;

    setLoading(true);
    setFacultyData(null);

    try {
      const response = await fetch(`http://127.0.0.1:8000/admin/faculty_search/${empId}`);
      const result = await response.json();

      if (response.ok) {
        setFacultyData(result.data);
      } else {
        alert(result.detail);
      }
    } catch (error) {
      alert("Server connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="faculty-info-container">
      <div className="search-section">
        <h2>Faculty Information Lookup</h2>
        <form onSubmit={handleSearch} className="id-search-form">
          <input 
            type="text" 
            placeholder="Enter Employee ID (e.g. FAC001)" 
            value={empId} 
            onChange={(e) => setEmpId(e.target.value)} 
            required
          />
          <button type="submit">{loading ? "Searching..." : "Get Details"}</button>
        </form>
      </div>

      {facultyData && (
        <div className="profile-display-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {facultyData["Full Name"].charAt(0)}
            </div>
            <h3>{facultyData["Full Name"]}</h3>
            <p>{facultyData["Designation"]}</p>
          </div>

          <div className="details-grid">
            {Object.entries(facultyData).map(([label, value]) => (
              <div className="detail-row" key={label}>
                <span className="detail-label">{label}</span>
                <span className="detail-value">{value || "N/A"}</span>
              </div>
            ))}
          </div>
          
          <button className="print-profile-btn" onClick={() => window.print()}>
            Print Profile
          </button>
        </div>
      )}
    </div>
  );
};

export default Faculty_information;