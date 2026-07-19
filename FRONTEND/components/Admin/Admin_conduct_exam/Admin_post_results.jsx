import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Admin_post_results.css';

const Admin_post_results = () => {
    const [pendingResults, setPendingResults] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPending = async () => {
        try {
            const res = await axios.get("http://localhost:8000/admin/pending-results");
            if (res.data.status === 'success') setPendingResults(res.data.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchPending(); }, []);

    const handlePublish = async (examId) => {
        try {
            const res = await axios.post(`http://localhost:8000/admin/post-results/${examId}`);
            if (res.data.status === 'success') {
                alert("🎉 resulsts are published");
                fetchPending();
            }
        } catch (err) { alert("we have error to publish the resuts"); }
    };

    return (
        <div className="admin-results-container">
            <h2>Approve & Evaluate Results</h2>
            <div className="results-grid">
                {pendingResults.length > 0 ? pendingResults.map(res => (
                    <div className="res-card" key={res.exam_id}>
                        <div className="res-info">
                            <h3>{res.subject}</h3>
                            <p>Branch: {res.branch.toUpperCase()} | Faculty: {res.faculty_id}</p>
                            <p>Exam Date: {res.exam_date}</p>
                        </div>
                        <button className="publish-btn" onClick={() => handlePublish(res.exam_id)}>
                            🚀 Evaluate & Publish Results
                        </button>
                    </div>
                )) : <p className="no-data">we have no pending exams </p>}
            </div>
        </div>
    );
};

export default Admin_post_results;