import io
import os
import json
import pandas as pd
import psycopg2
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles  
from pydantic import BaseModel
from datetime import datetime

# Initialize the App FIRST
app = FastAPI()

# Middleware configuration
# Allows cross-origin requests from frontend framework environments (like React running on a different port)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Configurations
# Primary database containing branch-wise tables and student specific details
DB_CONFIG = {
    "dbname": "STUDENTS",
    "user": "postgres",
    "password": "Sairam1205@", 
    "host": "localhost",
    "port": "5432"
}

# Administrative database managing scheduling, answer keys, exam configurations, and results
ADMIN_DB_CONFIG = {
    "dbname": "ADMIN", 
    "user": "postgres",
    "password": "Sairam1205@",
    "host": "localhost",
    "port": "5432"
}

# Upload Directories Setup
UPLOAD_DIR = "uploaded_exams"
KEYS_DIR = "uploaded_keys" # Folder dedicated to saving answer key sheets

# Iterate and safely generate target host folders if missing on initial launch
for folder in [UPLOAD_DIR, KEYS_DIR]:
    if not os.path.exists(folder):
        os.makedirs(folder)

# Mount Static Routes
# Serves static assets directly via endpoints so PDFs and Excel sheets can be downloaded/viewed via local URLs
app.mount("/uploaded_exams", StaticFiles(directory=UPLOAD_DIR), name="uploaded_exams")
app.mount("/uploaded_keys", StaticFiles(directory=KEYS_DIR), name="uploaded_keys")

# Pydantic Models for strict incoming JSON validation
class LoginRequest(BaseModel):
    roll_number: str
    password: str

class AdminLoginRequest(BaseModel):
    employee_id: str 
    password: str

class FacultyLoginRequest(BaseModel):
    employee_id: str
    password: str

class StudentSubmitRequest(BaseModel):
    roll_number: str
    exam_id: int
    answers: dict  


# --- 1. BULK REGISTRATION ---
@app.post("/admin/register-bulk")
async def register_bulk_students(branch: str = Form(...), file: UploadFile = File(...)):
    """
    Reads an uploaded Excel sheet of students and executes a bulk UPSERT operational loop 
    into a dynamic department table inside the STUDENTS database.
    """
    table_name = branch.strip().lower() # Resolves specific table target based on student branch name
    try:
        # Read incoming binary data straight into memory block
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        
        # Open interface connection to local student database instance
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()

        # Iterate through every row item extracted from the excel spreadsheet matrix
        for _, row in df.iterrows():
            # SQL statement utilizing an upside insert (UPSERT) override logic block on key clash
            query = f"""
                INSERT INTO {table_name} 
                (roll_number, name, gender, dob, department, branch, section, batch)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (roll_number) DO UPDATE SET
                name = EXCLUDED.name,
                department = EXCLUDED.department,
                section = EXCLUDED.section
            """
            cur.execute(query, (
                str(row['roll_number']), str(row['name']), str(row['gender']),
                str(row['dob']), str(row['department']), str(row['branch']),
                str(row['section']), str(row['batch'])
            ))

        # Commit transactional adjustments and gracefully sever active cursor links
        conn.commit()
        cur.close()
        conn.close()
        return {"status": "success", "message": f"Successfully updated {table_name}"}
    except Exception as e:
        print(f"Bulk Upload Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- 2. FACULTY EXAM SUBMISSION ENDPOINT ---
@app.post("/faculty/submit-exam")
async def faculty_submit_exam(
    faculty_id: str = Form(...),
    branch: str = Form(...),
    subject: str = Form(...),
    batch: str = Form(...),
    exam_date: str = Form(...),
    exam_time: str = Form(...),
    exam_duration: int = Form(...),  
    total_questions: int = Form(...),  
    selected_students: str = Form(...),  
    file: UploadFile = File(...)
):
    """
    Accepts detailed form parameters alongside a question paper PDF from an authenticated faculty member,
    storing transactional references and staging eligible user lists pending final authorization.
    """
    try:
        # Sanitize internal spaces in name variables to eliminate directory structure breaking routes
        clean_subject = subject.replace(' ', '_').strip()
        file_name = f"{branch}_{batch}_{clean_subject}_{file.filename}"
        file_location = os.path.join(UPLOAD_DIR, file_name)
        
        # Write binary stream chucks to permanent local filesystem storage path
        with open(file_location, "wb+") as file_object:
            file_object.write(await file.read())

        # Unpack serialized incoming array parsing selected student primary tracking targets
        student_roll_numbers = json.loads(selected_students)

        # Establish programmatic handle on administrative infrastructure tables
        conn = psycopg2.connect(**ADMIN_DB_CONFIG)
        cur = conn.cursor()

        # Insert metadata descriptor parameters tracking overall examination profiles
        insert_exam_query = """
            INSERT INTO exam_sheets (faculty_id, branch, subject, year, exam_date, exam_time, exam_duration, total_questions, pdf_path)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING exam_id;
        """
        cur.execute(insert_exam_query, (
            faculty_id, branch.strip().lower(), subject.strip(), 
            batch.strip(), exam_date, exam_time, exam_duration, total_questions, file_location
        ))
        
        # Fetch the uniquely generated identity structural key returned by engine
        exam_id = cur.fetchone()[0]

        # Bind individual student reference links explicitly against current assignment configuration profile
        insert_students_query = """
            INSERT INTO exam_eligible_students (exam_id, roll_number)
            VALUES (%s, %s);
        """
        for roll_number in student_roll_numbers:
            cur.execute(insert_students_query, (exam_id, str(roll_number)))

        # Commit operational processing requests safely to persistent log engine
        conn.commit()
        cur.close()
        conn.close()

        return {"status": "success", "message": "Exam setup forwarded to admin successfully", "exam_id": exam_id}

    except Exception as e:
        print(f"Faculty Exam Submission Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- 2.1 FACULTY EXAMS LIST FOR KEY POSTING ---
@app.get("/faculty/posted-exams/{faculty_id}")
async def get_faculty_posted_exams(faculty_id: str):
    """
    Retrieves list of admin-approved exams belonging to a faculty member, checking live deadlines 
    dynamically to verify if submission channels for answer sheets should be open.
    """
    try:
        conn = psycopg2.connect(**ADMIN_DB_CONFIG)
        cur = conn.cursor()
        
        # Query target dataset capturing established metadata structural arrays
        query = """
            SELECT exam_id, branch, subject, year, exam_date, exam_time, exam_duration, result_status 
            FROM exam_sheets 
            WHERE faculty_id = %s AND status = 'APPROVED'
            ORDER BY exam_id DESC
        """
        cur.execute(query, (faculty_id,))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        
        exam_list = []
        now = datetime.now() # Extract current timeline parameters for boundary matching processes
        
        for r in rows:
            exam_datetime_str = f"{r[4]}T{r[5]}"
            try:
                # Standardize ISO-compliant timestamps parsing secondary trailing precision spaces
                if len(r[5].split(':')) == 2:
                    exam_datetime_str += ":00"
                exam_start = datetime.strptime(exam_datetime_str, "%Y-%m-%dT%H:%M:%S")
                # Calculate systemic end boundary using execution duration offset values
                exam_end = datetime.fromtimestamp(exam_start.timestamp() + (r[6] * 60))
                # Validate whether chronological instance parameter exceeds active running limits
                is_finished = now > exam_end
            except Exception:
                is_finished = True
                
            exam_list.append({
                "exam_id": r[0], "branch": r[1], "subject": r[2], "year": r[3],
                "exam_date": str(r[4]), "exam_time": str(r[5]), "exam_duration": r[6],
                "is_finished": is_finished, "result_status": r[7]
            })
            
        return {"status": "success", "data": exam_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- 2.2 FACULTY SUBMIT ANSWER KEY EXCEL ---
@app.post("/faculty/submit-key-excel")
async def faculty_submit_key_excel(exam_id: int = Form(...), file: UploadFile = File(...)):
    """
    Handles file parsing metrics capturing Master Answer Key parameters in an excel table format, 
    saving files locally and setting status context tags.
    """
    try:
        file_name = f"key_{exam_id}_{file.filename}"
        file_location = os.path.join(KEYS_DIR, file_name)
        
        # Flash resource contents directly to designated application structural file targets
        with open(file_location, "wb+") as file_object:
            file_object.write(await file.read())
            
        conn = psycopg2.connect(**ADMIN_DB_CONFIG)
        cur = conn.cursor()
        
        # Advance structural status flag to prompt grading routine access channels inside the admin dashboard
        query = "UPDATE exam_sheets SET result_status = 'KEY_SUBMITTED', key_excel_path = %s WHERE exam_id = %s"
        cur.execute(query, (file_location, exam_id))
        
        conn.commit()
        cur.close()
        conn.close()
        return {"status": "success", "message": "Answer key sheet successfully forwarded to Admin portal!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- 3. ADMIN CONTROL ENDPOINTS ---
@app.get("/admin/pending-exams")
async def get_pending_exams():
    """
    Extracts chronological listing tracking all newly deployed testing entries waiting 
    for global approval routing inside the administrative workflow.
    """
    try:
        conn = psycopg2.connect(**ADMIN_DB_CONFIG)
        cur = conn.cursor()
        query = """
            SELECT exam_id, faculty_id, branch, subject, year, exam_date, exam_time, exam_duration, pdf_path 
            FROM exam_sheets WHERE status = 'PENDING' ORDER BY exam_id ASC
        """
        cur.execute(query)
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return {"status": "success", "data": [{"exam_id": r[0], "faculty_id": r[1], "branch": r[2], "subject": r[3], "year": r[4], "exam_date": str(r[5]), "exam_time": str(r[6]), "exam_duration": r[7], "pdf_path": r[8]} for r in rows]}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/approve-exam/{exam_id}")
async def approve_exam(exam_id: int):
    """
    Authorizes a pending exam entry, activating global user visibility status parameters across student dashboards.
    """
    try:
        conn = psycopg2.connect(**ADMIN_DB_CONFIG)
        cur = conn.cursor()
        # Flip core testing authorization visibility profiles to affirmative status structures
        cur.execute("UPDATE exam_sheets SET status = 'APPROVED' WHERE exam_id = %s", (exam_id,))
        # Trigger true state mappings enabling downstream alerting mechanisms inside target channels
        cur.execute("UPDATE exam_eligible_students SET is_notified = TRUE WHERE exam_id = %s", (exam_id,))
        conn.commit()
        cur.close()
        conn.close()
        return {"status": "success", "message": f"Exam #{exam_id} approved successfully."}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))


# --- 3.1 ADMIN GET PENDING RESULTS FOR POSTING ---
@app.get("/admin/pending-results")
async def admin_get_pending_results():
    """
    Compiles detailed listings filtering examinations that possess uploaded answer keys 
    but are awaiting systematic evaluation triggering.
    """
    try:
        conn = psycopg2.connect(**ADMIN_DB_CONFIG)
        cur = conn.cursor()
        query = """
            SELECT exam_id, faculty_id, branch, subject, year, exam_date, key_excel_path 
            FROM exam_sheets WHERE result_status = 'KEY_SUBMITTED' ORDER BY exam_id ASC
        """
        cur.execute(query)
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return {"status": "success", "data": [{"exam_id": r[0], "faculty_id": r[1], "branch": r[2], "subject": r[3], "year": r[4], "exam_date": str(r[5]), "key_path": r[6]} for r in rows]}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))


# --- 3.2 ADMIN POST RESULTS & AUTO EVALUATION OMR ALGORITHM (RECTIFIED) ---
@app.post("/admin/post-results/{exam_id}")
async def admin_post_results(exam_id: int):
    """
    Executes core programmatic bulk grading loop by cross-analyzing serialized client answer configurations 
    against a verified administrative master spreadsheet dataset.
    """
    try:
        conn = psycopg2.connect(**ADMIN_DB_CONFIG)
        cur = conn.cursor()
        
        # 1. Fetch file locator target mapped against desired evaluation session instance
        cur.execute("SELECT key_excel_path FROM exam_sheets WHERE exam_id = %s", (exam_id,))
        res = cur.fetchone()
        if not res or not res[0]:
            raise HTTPException(status_code=400, detail="Answer key Excel file not found in DB!")
        
        key_path = res[0]
        
        # 2. Parse Excel Key structural bounds using pandas engines
        df_key = pd.read_excel(key_path)
        
        # Standardize structural metadata header elements converting spaces and character cases
        df_key.columns = [c.strip().lower() for c in df_key.columns]
        
        # Map master validation structural dictionary entries natively inside runtime cache memory space
        official_key = {}
        for _, row in df_key.iterrows():
            q_no = row.get('question_no')
            c_opt = row.get('correct_option')
            if q_no is not None and c_opt is not None:
                try:
                    # Coerce floating decimal types into clean standardized character numerical entries
                    clean_q = str(int(float(q_no)))
                    official_key[clean_q] = str(c_opt).strip().upper()
                except ValueError:
                    continue
            
        # 3. Pull total set tracking individual raw data payloads submitted by user population matrix
        cur.execute("SELECT roll_number, answers FROM student_responses WHERE exam_id = %s", (exam_id,))
        student_responses = cur.fetchall()
        
        # Wipe structural duplication entries inside storage layer to guarantee fresh processing execution tracking
        cur.execute("DELETE FROM student_results WHERE exam_id = %s", (exam_id,))
        
        # 4. Initiate scoring analysis looping parameters iterating per dynamic response item matching block
        for roll_no, answers_json in student_responses:
            if isinstance(answers_json, str):
                student_answers = json.loads(answers_json)
            elif isinstance(answers_json, dict):
                student_answers = answers_json
            else:
                student_answers = {}
            
            correct_cnt = 0
            wrong_cnt = 0
            
            # Match performance indexes side by side across tracking items keys mapping structure arrays
            for q_no, correct_opt in official_key.items():
                student_opt = student_answers.get(str(q_no))
                if student_opt:
                    if str(student_opt).strip().upper() == correct_opt:
                        correct_cnt += 1
                    else:
                        wrong_cnt += 1
                        
            # Execute scoring computation operations mapping weights against target arrays 
            total_marks = correct_cnt * 1
            
            # Export structured calculation performance bounds to final reporting layer logs
            insert_res_query = """
                INSERT INTO student_results (roll_number, exam_id, total_marks, correct_answers, wrong_answers, evaluated_at)
                VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
            """
            cur.execute(insert_res_query, (roll_no.upper(), exam_id, total_marks, correct_cnt, wrong_cnt))
            
        # Flip global flag alerting user spaces that analytical processing operations are finished and live
        cur.execute("UPDATE exam_sheets SET result_status = 'PUBLISHED' WHERE exam_id = %s", (exam_id,))
        
        conn.commit()
        cur.close()
        conn.close()
        return {"status": "success", "message": f"Results successfully evaluated and published for Exam #{exam_id}!"}
    except Exception as e:
        print(f"❌ EVALUATION CRASHED ON EXAM #{exam_id}. REASON: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- 4. STUDENT PORTAL EXAM ROUTES ---
@app.get("/student/my-exams/{roll_number}")
async def get_student_exams(roll_number: str, branch: str):
    """
    Returns un-submitted, active, and approved testing items specifically tailored for 
    the targeted requesting user's structural clearance profile.
    """
    try:
        conn = psycopg2.connect(**ADMIN_DB_CONFIG)
        cur = conn.cursor()
        
        # Uses explicit JOIN mechanics verifying notification paths while ignoring double-submission attempts
        query = """
            SELECT es.exam_id, es.branch, es.subject, es.year, es.exam_date, es.exam_time, es.exam_duration
            FROM exam_sheets es JOIN exam_eligible_students ees ON es.exam_id = ees.exam_id
            LEFT JOIN student_responses sr ON es.exam_id = sr.exam_id AND UPPER(sr.roll_number) = UPPER(ees.roll_number)
            WHERE UPPER(ees.roll_number) = %s AND es.branch = %s AND es.status = 'APPROVED' AND sr.response_id IS NULL
            ORDER BY es.exam_date DESC, es.exam_time DESC
        """
        cur.execute(query, (roll_number.upper(), branch.strip().lower()))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return {"status": "success", "data": [{"exam_id": r[0], "branch": r[1], "subject": r[2], "year": r[3], "exam_date": str(r[4]), "exam_time": str(r[5]), "exam_duration": r[6]} for r in rows]}
    except Exception as e: 
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/student/exam-portal-details/{exam_id}")
async def get_exam_portal_details(exam_id: int):
    """
    Fetches exact structural testing bounds and local file paths for question paper rendering 
    modules inside the live browser testing dashboard.
    """
    try:
        conn = psycopg2.connect(**ADMIN_DB_CONFIG)
        cur = conn.cursor()
        query = "SELECT subject, exam_duration, pdf_path, total_questions FROM exam_sheets WHERE exam_id = %s AND status = 'APPROVED'"
        cur.execute(query, (exam_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        # Normalizes target location strings correcting directory slash elements across system environments
        if row: return {"status": "success", "data": {"subject": row[0], "exam_duration": row[1], "pdf_path": row[2].replace("\\", "/"), "total_questions": row[3]}}
        raise HTTPException(status_code=404, detail="Exam Paper Details Not Found")
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.post("/student/submit-answers")
async def student_submit_answers(data: StudentSubmitRequest):
    """
    Pushes student selections live into administrative storage channels using an upsert override pattern 
    allowing adjustments prior to deadline closures.
    """
    try:
        conn = psycopg2.connect(**ADMIN_DB_CONFIG)
        cur = conn.cursor()
        query = "INSERT INTO student_responses (roll_number, exam_id, answers) VALUES (%s, %s, %s) ON CONFLICT (roll_number, exam_id) DO UPDATE SET answers = EXCLUDED.answers, submitted_at = CURRENT_TIMESTAMP"
        cur.execute(query, (data.roll_number.upper(), data.exam_id, json.dumps(data.answers)))
        conn.commit()
        cur.close()
        conn.close()
        return {"status": "success", "message": "Your answer sheet successfully forwarded to the faculty."}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))


# --- 4.3 STUDENT PERFORMANCE ---
@app.get("/student/my-performance/{roll_number}")
async def student_get_performance(roll_number: str):
    """
    Compiles history matrix profile logs capturing performance summaries for historical review sessions.
    """
    try:
        conn = psycopg2.connect(**ADMIN_DB_CONFIG)
        cur = conn.cursor()
        
        query = """
            SELECT es.exam_id, es.subject, es.exam_date, es.exam_time, es.result_status, res.total_marks
            FROM student_responses sr
            JOIN exam_sheets es ON sr.exam_id = es.exam_id
            LEFT JOIN student_results res ON sr.exam_id = res.exam_id AND UPPER(res.roll_number) = UPPER(sr.roll_number)
            WHERE UPPER(sr.roll_number) = %s
            ORDER BY es.exam_date DESC
        """
        cur.execute(query, (roll_number.upper(),))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        
        return {"status": "success", "data": [
            {
                "exam_id": r[0], "subject": r[1], "exam_date": str(r[2]), 
                "exam_time": str(r[3]), "result_status": r[4], "total_marks": r[5] if r[5] is not None else "N/A"
            } for r in rows
        ]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- 4.4 SEE DETAILED RESULT COMPARISON (RECTIFIED FOR EXCEL HEADERS AND BLANK ROWS) ---
@app.get("/student/see-result/{exam_id}/{roll_number}")
async def student_see_detailed_result(exam_id: int, roll_number: str):
    """
    Constructs a highly detailed side-by-side array comparing user inputs directly 
    against institutional answer parameters, generating true/false comparative states per row item.
    """
    try:
        conn = psycopg2.connect(**ADMIN_DB_CONFIG)
        cur = conn.cursor()
        
        # 1. Gather specified user response parameters from storage layers
        cur.execute("SELECT answers FROM student_responses WHERE exam_id = %s AND UPPER(roll_number) = %s", (exam_id, roll_number.upper()))
        res_stu = cur.fetchone()
        
        if res_stu and res_stu[0]:
            if isinstance(res_stu[0], dict):
                student_ans = res_stu[0]
            else:
                student_ans = json.loads(res_stu[0])
        else:
            student_ans = {}
        
        # 2. Extract relative location strings matching institutional answer parameters sheet files
        cur.execute("SELECT key_excel_path FROM exam_sheets WHERE exam_id = %s", (exam_id,))
        res_key = cur.fetchone()
        
        official_key = {}
        if res_key and res_key[0]:
            if os.path.exists(res_key[0]):
                df_key = pd.read_excel(res_key[0])
                df_key.columns = [c.strip().lower() for c in df_key.columns]
                
                # Dynamic matching loops fallback configuration patterns adapting against header naming anomalies
                q_col = 'question_no' if 'question_no' in df_key.columns else df_key.columns[0]
                a_col = 'correct_option' if 'correct_option' in df_key.columns else df_key.columns[1]
                
                for _, row in df_key.iterrows():
                    q_val = row.get(q_col)
                    a_val = row.get(a_col)
                    if pd.notna(q_val) and pd.notna(a_val):
                        try:
                            # Safely ignore textual non-numeric data fields that pop up during operations
                            clean_q = str(int(float(q_val)))
                            official_key[clean_q] = str(a_val).strip().upper()
                        except ValueError:
                            continue
                
        # 3. Pull aggregate evaluation figures from performance database logs
        cur.execute("SELECT total_marks, correct_answers, wrong_answers FROM student_results WHERE exam_id = %s AND UPPER(roll_number) = %s", (exam_id, roll_number.upper()))
        res_sum = cur.fetchone()
        
        if res_sum:
            summary = {
                "total_marks": res_sum[0], 
                "correct": res_sum[1], 
                "wrong": res_sum[2]
            }
        else:
            summary = {"total_marks": 0, "correct": 0, "wrong": 0}
        
        # 4. Synthesize structural arrays packing side-by-side response elements cleanly
        comparison = []
        all_q_keys = set(list(student_ans.keys()) + list(official_key.keys()))
        all_q_nos = sorted(list(all_q_keys), key=lambda x: int(x) if str(x).isdigit() else 999)
        
        for q in all_q_nos:
            s_opt = student_ans.get(str(q), "-")
            f_opt = official_key.get(str(q), "-")
            comparison.append({
                "question_no": q,
                "student_option": s_opt,
                "faculty_option": f_opt,
                "is_match": str(s_opt).strip().upper() == str(f_opt).strip().upper() if s_opt != "-" and f_opt != "-" else False
            })
            
        cur.close()
        conn.close()
        return {"status": "success", "summary": summary, "comparison": comparison}
    except Exception as e:
        print(f"❌ SEE RESULT CRASHED: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- 5. SYSTEM LOGIN ENDPOINTS ---
@app.post("/login/student")
async def student_login(data: LoginRequest):
    """
    Authenticates core student entities validating credentials against historical profile registries.
    """
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        query = "SELECT name, branch FROM Student_Logins WHERE UPPER(ROLL_NUMBER) = %s AND PASSWORD = %s"
        cur.execute(query, (data.roll_number.upper(), data.password))
        user = cur.fetchone()
        cur.close()
        conn.close()
        if user: return {"status": "success", "name": user[0], "branch": user[1]}
        raise HTTPException(status_code=401, detail="Invalid Student Credentials")
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.post("/login/admin")
async def admin_login(data: AdminLoginRequest):
    """
    Validates structural clearances for high-level platform controllers.
    """
    try:
        conn = psycopg2.connect(**ADMIN_DB_CONFIG)
        cur = conn.cursor()
        query = "SELECT name FROM admin_logins WHERE UPPER(employee_id) = %s AND password = %s"
        cur.execute(query, (data.employee_id.upper(), data.password))
        admin = cur.fetchone()
        cur.close()
        conn.close()
        if admin: return {"status": "success", "name": admin[0]}
        raise HTTPException(status_code=401, detail="Invalid Admin Credentials")
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.post("/login/faculty")
async def faculty_login(data: FacultyLoginRequest):
    """
    Verifies credential matches mapping across authorized educational content developers.
    """
    try:
        conn = psycopg2.connect(**ADMIN_DB_CONFIG)
        cur = conn.cursor()
        query = "SELECT name, department FROM faculty_logins WHERE UPPER(employee_id) = %s AND password = %s"
        cur.execute(query, (data.employee_id.upper(), data.password))
        user = cur.fetchone()
        cur.close()
        conn.close()
        if user: return {"status": "success", "name": user[0], "dept": user[1]}
        raise HTTPException(status_code=401, detail="Invalid Faculty Credentials")
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))


# --- 6. DATA VIEWING ENDPOINTS ---
@app.get("/admin/student_details")
async def get_student_details(branch: str, batch: str):
    """
    Queries targeted data rows matching specific branch and batch profiles from student repository tables.
    """
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        table_name = branch.strip().lower()
        query = f"SELECT roll_number, name, gender, dob, department, branch, section, batch FROM {table_name} WHERE batch = %s ORDER BY roll_number ASC"
        cur.execute(query, (batch,))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return {"status": "success", "data": [{"roll_number": r[0], "name": r[1], "gender": r[2], "dob": str(r[3]).split(' ')[0], "department": r[4], "branch": r[5], "section": r[6], "batch": r[7]} for r in rows]}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/faculty_search/{employee_id}")
async def get_faculty_by_id(employee_id: str):
    """
    Returns complete data attributes matching a particular faculty member registry identity index.
    """
    try:
        conn = psycopg2.connect(**ADMIN_DB_CONFIG) 
        cur = conn.cursor()
        query = "SELECT * FROM faculty_info WHERE UPPER(employee_id) = %s"
        cur.execute(query, (employee_id.upper(),))
        row = cur.fetchone()
        cur.close()
        conn.close()
        if row: return {"status": "success", "data": {"Employee ID": row[0], "Full Name": row[1], "Gender": row[2], "Designation": row[3], "Department": row[4], "Email": row[5], "Phone": row[6], "Joining Date": str(row[7])}}
        raise HTTPException(status_code=404, detail="Faculty Not Found")
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))
