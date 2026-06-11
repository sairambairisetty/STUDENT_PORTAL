
-- 1. Student Credentials Matrix for Login
CREATE TABLE IF NOT EXISTS Student_Logins (
    roll_number VARCHAR(30) PRIMARY KEY,
    password VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    branch VARCHAR(50) NOT NULL
);

-- 2. Information Technology (IT) Data Node
CREATE TABLE IF NOT EXISTS it (
    roll_number VARCHAR(30) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    dob DATE NOT NULL,
    department VARCHAR(50) NOT NULL,
    branch VARCHAR(50) NOT NULL,
    section VARCHAR(10) NOT NULL,
    batch VARCHAR(20) NOT NULL
);

-- 3. Computer Science & Engineering (CSE) Data Node
CREATE TABLE IF NOT EXISTS cse (
    roll_number VARCHAR(30) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    dob DATE NOT NULL,
    department VARCHAR(50) NOT NULL,
    branch VARCHAR(50) NOT NULL,
    section VARCHAR(10) NOT NULL,
    batch VARCHAR(20) NOT NULL
);

-- 4. Electronics & Communication Engineering (ECE) Data Node
CREATE TABLE IF NOT EXISTS ece (
    roll_number VARCHAR(30) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    dob DATE NOT NULL,
    department VARCHAR(50) NOT NULL,
    branch VARCHAR(50) NOT NULL,
    section VARCHAR(10) NOT NULL,
    batch VARCHAR(20) NOT NULL
);

-- 5. Electrical & Electronics Engineering (EEE) Data Node
CREATE TABLE IF NOT EXISTS eee (
    roll_number VARCHAR(30) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    dob DATE NOT NULL,
    department VARCHAR(50) NOT NULL,
    branch VARCHAR(50) NOT NULL,
    section VARCHAR(10) NOT NULL,
    batch VARCHAR(20) NOT NULL
);

-- 6. Mechanical Engineering (MECH) Data Node
CREATE TABLE IF NOT EXISTS mech (
    roll_number VARCHAR(30) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    dob DATE NOT NULL,
    department VARCHAR(50) NOT NULL,
    branch VARCHAR(50) NOT NULL,
    section VARCHAR(10) NOT NULL,
    batch VARCHAR(20) NOT NULL
);

-- 7. Civil Engineering (CIVIL) Data Node
CREATE TABLE IF NOT EXISTS civil (
    roll_number VARCHAR(30) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    dob DATE NOT NULL,
    department VARCHAR(50) NOT NULL,
    branch VARCHAR(50) NOT NULL,
    section VARCHAR(10) NOT NULL,
    batch VARCHAR(20) NOT NULL
);


-- ---------------------------------------------------------------------------
-- SECTION 2: "ADMIN" DATABASE & TABLES

-- ---------------------------------------------------------------------------

-- 1. Global Admin Authorization Secrets
CREATE TABLE IF NOT EXISTS admin_logins (
    employee_id VARCHAR(30) PRIMARY KEY,
    password VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL
);

-- 2. Faculty Portal Access Credentials
CREATE TABLE IF NOT EXISTS faculty_logins (
    employee_id VARCHAR(30) PRIMARY KEY,
    password VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(50) NOT NULL
);

-- 3. Core Faculty Professional Profiles Directory
CREATE TABLE IF NOT EXISTS faculty_info (
    employee_id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    designation VARCHAR(50) NOT NULL,
    department VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    joining_date DATE NOT NULL
);

-- 4. Central Examination Manifest Matrix (Core Table)
CREATE TABLE IF NOT EXISTS exam_sheets (
    exam_id SERIAL PRIMARY KEY,
    faculty_id VARCHAR(30) NOT NULL,
    branch VARCHAR(50) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    year VARCHAR(20) NOT NULL,
    exam_date DATE NOT NULL,
    exam_time TIME NOT NULL,
    exam_duration INT NOT NULL,
    total_questions INT NOT NULL,
    pdf_path VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',        -- Enums: PENDING, APPROVED
    result_status VARCHAR(20) DEFAULT 'NOT_POSTED', -- Enums: NOT_POSTED, KEY_SUBMITTED, PUBLISHED
    key_excel_path VARCHAR(255)
);

-- 5. Student Seat Map Allocation Ledger
CREATE TABLE IF NOT EXISTS exam_eligible_students (
    mapping_id SERIAL PRIMARY KEY,
    exam_id INT NOT NULL REFERENCES exam_sheets(exam_id) ON DELETE CASCADE,
    roll_number VARCHAR(30) NOT NULL,
    is_notified BOOLEAN DEFAULT FALSE,
    CONSTRAINT unique_eligibility UNIQUE (exam_id, roll_number)
);

-- 6. Live OMR Raw JSON Option Streams Submissions Table
CREATE TABLE IF NOT EXISTS student_responses (
    response_id SERIAL PRIMARY KEY,
    roll_number VARCHAR(30) NOT NULL,
    exam_id INT NOT NULL REFERENCES exam_sheets(exam_id) ON DELETE CASCADE,
    answers JSONB NOT NULL, -- Stores data like {"1": "A", "2": "B"}
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_student_exam UNIQUE (roll_number, exam_id)
);

-- 7. Automated Evaluated Final Grade Ledger Sheets
CREATE TABLE IF NOT EXISTS student_results (
    result_id SERIAL PRIMARY KEY,
    roll_number VARCHAR(30) NOT NULL,
    exam_id INT NOT NULL REFERENCES exam_sheets(exam_id) ON DELETE CASCADE,
    total_marks INT NOT NULL,
    correct_answers INT NOT NULL,
    wrong_answers INT NOT NULL,
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_student_result UNIQUE (roll_number, exam_id)
);

-- ---------------------------------------------------------------------------
-- DEFAULT SEED DATA INJECTIONS FOR FAST DEPLOYMENT TESTING
-- ---------------------------------------------------------------------------
-- Create Default Administrator Node
INSERT INTO admin_logins (employee_id, password, name) 
VALUES ('ADMIN01', 'admin123', 'Head Administrator')
ON CONFLICT DO NOTHING;

-- Create Default Testing Faculty Node
INSERT INTO faculty_logins (employee_id, password, name, department)
VALUES ('FAC01', 'faculty123', 'Dr. Suryavenkata Saikumar', 'Information Technology')
ON CONFLICT DO NOTHING;

-- Create Default Student Access Link Token
INSERT INTO Student_Logins (roll_number, password, name, branch)
VALUES ('246M1A1201', 'sairam123', 'SAIRAM BAIRESETTY', 'it')
ON CONFLICT DO NOTHING;
