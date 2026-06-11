import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Student_login.css';

const Student_login = () => {
    const [rollNumber, setRollNumber] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isExiting, setIsExiting] = useState(false); // 🔥 for animation
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await axios.post('http://127.0.0.1:8000/login/student', {
                roll_number: rollNumber,
                password: password
            });

            if (response.data.status === "success") {
                setIsExiting(true); // trigger exit animation

                setTimeout(() => {
                    localStorage.setItem('studentName', response.data.name);
                    localStorage.setItem('studentBranch', response.data.branch);
                    navigate('/student-dashboard');
                }, 500);
            }
        } catch (err) {
            setError(err.response?.data?.detail || "Connection Failed");
        }
    };

    return (
        <div className={`login-main-container ${isExiting ? 'exit' : ''}`}>
            <div className="login-box-wrapper">

                {/* LEFT SIDE */}
                <div className="login-side-banner">
                    <div className="banner-content">
                        <h2>Welcome Back</h2>
                        <button className="ghost-btn" onClick={() => navigate('/')}>
                            Go Back
                        </button>
                    </div>
                </div>

                {/* RIGHT SIDE */}
                <div className="login-form-side">
                    <div className="form-container">

                        <h2 className="login-title">Student Login</h2>
                        <span className="subtitle">Enter your credentials</span>

                        {error && <p className="error-msg">{error}</p>}

                        <form onSubmit={handleSubmit}>
                            <div className="input-field">
                                <input
                                    type="text"
                                    placeholder="Roll Number"
                                    value={rollNumber}
                                    onChange={(e) => setRollNumber(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="input-field">
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <button type="submit" className="main-login-btn">
                                Sign In
                            </button>
                        </form>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default Student_login;