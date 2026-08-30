import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

// Public & Basic Interfaces
import Basic_interface from "./components/Basic_interface/Basic_interface";

// Student Components
import Student_login from "./components/Student_logins/Student_login";
import Student_main_interface from "./components/Student_main_interface/Student_main_interface";
import Performance from "./components/Student_main_interface/Perfomance.jsx/Performance";

// Faculty Components
import Faculty_login from "./components/Faculty/Faculty_login/Faculty_login";
import Faculty_main_interface from "./components/Faculty/Faculty_main_interface/Faculty_main_interface";
import Conduct_exam from "./components/Faculty/Conduct_exam/Conduct_exam";

// Admin Components
import Admin_login from "./components/Admin/Admin_login/Admin_login";
import Admin_main_interface from "./components/Admin/Admin_main_interface/Admin_main_interface";
import Student_registrations from "./components/Admin/Student_registrations/Student_registrations";
import Student_details from "./components/Admin/Student_details/Student_details";
import Faculty_information from "./components/Admin/Faculty_information/Faculty_information";
import Admin_conduct_exam from "./components/Admin/Admin_conduct_exam/Admin_conduct_exam"; // Import Check
import Join_exam from "./components/Student_main_interface/Join_exam/Join_exam";
import Student_exam_portal from "./components/Student_main_interface/Student_exam_portal/Student_exam_portal";
import Faculty_post_key from "./components/Faculty/Post_key/Faculty_post_key";
import Admin_post_results from "./components/Admin/Admin_post_results/Admin_post_results";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* --- PUBLIC & LOGIN ROUTES --- */}
          <Route path="/" element={<Basic_interface />} />
          <Route path="/student-login" element={<Student_login />} />
          <Route path="/admin_login" element={<Admin_login />} />
          <Route path="/faculty-login" element={<Faculty_login />} />

          {/* --- STUDENT SIDE ROUTES --- */}
          <Route
            path="/student-dashboard"
            element={<Student_main_interface />}
          />
          <Route path="/performance" element={<Performance />} />
          <Route path="/join-exam" element={<Join_exam />} />
          <Route
            path="/student-exam-portal/:examId"
            element={<Student_exam_portal />}
          />

          {/* --- ADMIN SIDE ROUTES --- */}
          <Route
            path="/admin_main_interface"
            element={<Admin_main_interface />}
          />
          <Route
            path="/student_registrations"
            element={<Student_registrations />}
          />
          <Route path="/student_details" element={<Student_details />} />
          <Route path="/faculty" element={<Faculty_information />} />

          {/* FIXED: అడ్మిన్ రూట్‌ని కరెక్ట్ సెక్షన్‌లోకి మార్చాను మరియు పాత్ కన్ఫ్యూజన్ లేకుండా సెట్ చేసాను */}
          <Route path="/admin-conduct-exam" element={<Admin_conduct_exam />} />
          <Route path="/admin-post-results" element={<Admin_post_results />} />

          {/* --- FACULTY SIDE ROUTES --- */}
          <Route
            path="/faculty_main_interface"
            element={<Faculty_main_interface />}
          />
          <Route path="/conduct-exam" element={<Conduct_exam />} />
          <Route path="/faculty-post-key" element={<Faculty_post_key />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
