import React, { useState } from 'react';
import './Student_registrations.css';

const Student_registrations = () => {
  const [branch, setBranch] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // NEW: State for the success/error message
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!branch || !file) return setStatus({ type: 'error', message: "Please select a branch and a file" });

    setUploading(true);
    setStatus({ type: '', message: '' }); // Clear previous messages

    const formData = new FormData();
    formData.append('branch', branch); 
    formData.append('file', file);

    try {
      const response = await fetch('http://127.0.0.1:8000/admin/register-bulk', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // Show success message on screen
        setStatus({ 
            type: 'success', 
            message: `✅ Data successfully saved to ${branch.toUpperCase()} database!` 
        });
        setFile(null); // Clear file after success
        setBranch(''); // Optional: Reset branch
      } else {
        setStatus({ 
            type: 'error', 
            message: `❌ Error: ${data.detail || "Upload failed"}` 
        });
      }
    } catch (err) {
      setStatus({ type: 'error', message: "❌ Cannot connect to server. Is FastAPI running?" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="registration-container">
      <div className="registration-card">
        <h2>Bulk Student Registration</h2>
        
        {/* NEW: Status Message Display */}
        {status.message && (
          <div className={`status-box ${status.type}`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleUpload}>
          <div className="input-field">
            <label>Select Branch</label>
            <select 
              value={branch} 
              onChange={(e) => setBranch(e.target.value)} 
              required
            >
              <option value="">-- Choose Branch --</option>
              <option value="cse">CSE (Computer Science)</option>
              <option value="it">IT (Information Technology)</option>
              <option value="aiml">AIML (AI & Machine Learning)</option>
              <option value="aids">AIDS (AI & Data Science)</option>
              <option value="ece">ECE (Electronics & Communication)</option>
            </select>
          </div>

          <div className="file-upload-section" onClick={() => document.getElementById('fileInput').click()}>
            <label className="file-label">
              <span>{file ? `📄 ${file.name}` : "📁 Click to upload Excel file"}</span>
              <input 
                id="fileInput"
                type="file" 
                accept=".xls, .xlsx" 
                onChange={(e) => {
                    setFile(e.target.files[0]);
                    setStatus({ type: '', message: '' }); // Clear msg when new file selected
                }} 
                hidden 
              />
            </label>
          </div>

          <button type="submit" className="submit-btn" disabled={uploading}>
            {uploading ? "Uploading..." : "Upload & Save to Database"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Student_registrations;