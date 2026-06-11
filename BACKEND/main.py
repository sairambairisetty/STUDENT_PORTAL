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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Configurations
DB_CONFIG = {
    "dbname": "STUDENTS",
    "user": "your database",
    "password": "give your password", 
    "host": "localhost",
    "port": "5432"
}

ADMIN_DB_CONFIG = {
    "dbname": "ADMIN", 
    "user": "your database",
    "password": "give your password",
    "host": "localhost",
    "port": "5432"
}

# Upload Directories Setup
UPLOAD_DIR = "uploaded_exams"
KEYS_DIR = "uploaded_keys" # NEW: Answer keys దాచడానికి ఫోల్డర్

for folder in [UPLOAD_DIR, KEYS_DIR]:
    if not os.path.exists(folder):
        os.makedirs(folder)

# Mount Static Routes
app.mount("/uploaded_exams", StaticFiles(directory=UPLOAD_DIR), name="uploaded_exams")
app.mount("/uploaded_keys", StaticFiles(directory=KEYS_DIR), name="uploaded_keys")

# Pydantic Models
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
    table_name = branch.strip().lower()
    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()

        for _, row in df.iterrows():
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
    try:
        clean_subject = subject.replace(' ', '_').strip()
        file_name = f"{branch}_{batch}_{clean_subject}_{file.filename}"
        file_location = os.path.join(UPLOAD_DIR, file_name)
        
        with open(file_location, "wb+") as file_object:
            file_object.write(await file.read())

        student_roll_numbers = json.loads(selected_students)

        conn = psycopg2.connect(**ADMIN_DB_CONFIG)
        cur = conn.cursor()

        insert_exam_query = """
            INSERT INTO exam_sheets (faculty_id, branch, subject, year, exam_date, exam_time, exam_duration, total_questions, pdf_path)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING exam_id;
        """
        cur.execute(insert_exam_query, (
            faculty_id, branch.strip().lower(), subject.strip(), 
            batch.strip(), exam_date, exam_time, exam_duration, total_questions, file_location
        ))
        
        exam_id = cur.fetchone()[0]

        insert_students_query = """
            INSERT INTO exam_eligible_students (exam_id, roll_number)
            VALUES (%s, %s);
        """
        for roll_number in student_roll_numbers:
            cur.execute(insert_students_query, (exam_id, str(roll_number)))

        conn.commit()
        cur.close()
        conn.close()

        return {"status": "success", "message": "Exam setup forwarded to admin successfully", "exam_id": exam_id}

    except Exception as e:
        print(f"Faculty Exam Submission Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# NEW: 2.1 FACULTY EXAMS LIST FOR KEY POSTING (With Finish Status logic)
@app.get("/faculty/posted-exams/{faculty_id}")
async def get_faculty_posted_exams(faculty_id: str):
    """ఫ్యాకల్టీ క్రియేట్ చేసిన ఎగ్జామ్స్ లిస్ట్ ని, అది ఫినిష్ అయిందో లేదో లెక్కగట్టి టేబుల్ కోసం ఇస్తుంది"""
    try:
        conn = psycopg2.connect(**ADMIN_DB_CONFIG)
        cur = conn.cursor()
        
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
        now = datetime.now()
        
        for r in rows:
            # ఎగ్జామ్ ఫినిష్ అయిందో లేదో కరెంట్ టైమ్ తో కంపేర్ చేస్తున్నాం
            exam_datetime_str = f"{r[4]}T{r[5]}"
            try:
                if len(r[5].split(':')) == 2:
                    exam_datetime_str += ":00"
                exam_start = datetime.strptime(exam_datetime_str, "%Y-%m-%dT%H:%M:%S")
                exam_end = datetime.fromtimestamp(exam_start.timestamp() + (r[6] * 60))
                is_finished = now > exam_end
            except Exception:
                is_finished = True # Safe fallback
                
            exam_list.append({
                "exam_id": r[0], "branch": r[1], "subject": r[2], "year": r[3],
                "exam_date": str(r[4]), "exam_time": str(r[5]), "exam_duration": r[6],
                "is_finished": is_finished, "result_status": r[7]
            })
            
        return {"status": "success", "data": exam_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# NEW: 2.2 FACULTY SUBMIT ANSWER KEY EXCEL
@app.post("/faculty/submit-key-excel")
async def faculty_submit_key_excel(exam_id: int = Form(...), file: UploadFile = File(...)):
    """ఫ్యాకల్టీ అప్‌లోడ్ చేసిన కీ ఎక్సెల్ ఫైల్ ని దాచి, ఎగ్జామ్ స్టేటస్ ని KEY_SUBMITTED గా మారుస్తుంది"""
    try:
        file_name = f"key_{exam_id}_{file.filename}"
        file_location = os.path.join(KEYS_DIR, file_name)
        
        with open(file_location, "wb+") as file_object:
            file_object.write(await file.read())
            
        conn = psycopg2.connect(**ADMIN_DB_CONFIG)
        cur = conn.cursor()
        
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
    try:
        conn = psycopg2.connect(**ADMIN_DB_CONFIG)
        cur = conn.cursor()
        cur.execute("UPDATE exam_sheets SET status = 'APPROVED' WHERE exam_id = %s", (exam_id,))
        cur.execute("UPDATE exam_eligible_students SET is_notified = TRUE WHERE exam_id = %s", (exam_id,))
        conn.commit()
        cur.close()
        conn.close()
        return {"status": "success", "message": f"Exam #{exam_id} approved successfully."}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))


# NEW: 3.1 ADMIN GET PENDING RESULTS FOR POSTING
@app.get("/admin/pending-results")
async def admin_get_pending_results():
    """ఫ్యాకల్టీ కీ సబ్మిట్ చేసి, రిజల్ట్స్ పోస్టింగ్ కోసం వెయిట్ చేస్తున్న లిస్ట్ అందిస్తుంది"""
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


# NEW: 3.2 ADMIN POST RESULTS & AUTO EVALUATION OMR ALGORITHM
@app.post("/admin/post-results/{exam_id}")
async def admin_post_results(exam_id: int):
    """ఎక్సెల్ కీ షీట్ లోని డేటాని, స్టూడెంట్స్ సబ్మిట్ చేసిన OMR ఆప్షన్స్ ని కంపేర్ చేసి ఆటోమేటిక్‌గా రిజల్ట్స్ క్యాలిక్యులేట్ చేస్తుంది"""
    try:
        conn = psycopg2.connect(**ADMIN_DB_CONFIG)
        cur = conn.cursor()
        
        # 1. Get Key Excel Path
        cur.execute("SELECT key_excel_path FROM exam_sheets WHERE exam_id = %s", (exam_id,))
        res = cur.fetchone()
        if not res or not res[0]:
            raise HTTPException(status_code=400, detail="Answer key Excel file not found!")
        
        key_path = res[0]
        
        # 2. Parse Excel Key (Format dynamic column names lookup: 'question_no', 'correct_option')
        df_key = pd.read_excel(key_path)
        # Convert to dictionary {1: 'A', 2: 'B', ...}
        official_key = {}
        for _, row in df_key.iterrows():
            official_key[str(int(row['question_no']))] = str(row['correct_option']).strip().upper()
            
        # 3. Get All Student Responses for this exam
        cur.execute("SELECT roll_number, answers FROM student_responses WHERE exam_id = %s", (exam_id,))
        student_responses = cur.fetchall()
        
        # 4. Evaluation Loop
        for roll_no, answers_json in student_responses:
            student_answers = answers_json if isinstance(answers_json, dict) else json.loads(answers_json)
            
            correct_cnt = 0
            wrong_cnt = 0
            
            for q_no, correct_opt in official_key.items():
                student_opt = student_answers.get(str(q_no))
                if student_opt:
                    if str(student_opt).strip().upper() == correct_opt:
                        correct_cnt += 1
                    else:
                        wrong_cnt += 1
                        
            total_marks = correct_cnt * 1 # Each question carries 1 mark
            
            # Save into student_results table
            insert_res_query = """
                INSERT INTO student_results (roll_number, exam_id, total_marks, correct_answers, wrong_answers)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (roll_number, exam_id) DO UPDATE SET
                total_marks = EXCLUDED.total_marks, correct_answers = EXCLUDED.correct_answers, wrong_answers = EXCLUDED.wrong_answers
            """
            cur.execute(insert_res_query, (roll_no.upper(), exam_id, total_marks, correct_cnt, wrong_cnt))
            
        # 5. Update Exam status to UPDATED
        cur.execute("UPDATE exam_sheets SET result_status = 'PUBLISHED' WHERE exam_id = %s", (exam_id,))
        
        conn.commit()
        cur.close()
        conn.close()
        return {"status": "success", "message": f"Results successfully evaluated and published for Exam #{exam_id}!"}
    except Exception as e:
        print(f"Evaluation Crash: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- 4. STUDENT PORTAL EXAM ROUTES ---
@app.get("/student/my-exams/{roll_number}")
async def get_student_exams(roll_number: str, branch: str):
    try:
        conn = psycopg2.connect(**ADMIN_DB_CONFIG)
        cur = conn.cursor()
        query = """
            SELECT es.exam_id, es.branch, es.subject, es.year, es.exam_date, es.exam_time, es.exam_duration
            FROM exam_sheets es JOIN exam_eligible_students ees ON es.exam_id = ees.exam_id
            LEFT JOIN student_responses sr ON es.exam_id = sr.exam_id AND UPPER(sr.roll_number) = UPPER(ees.roll_number)
            WHERE UPPER(ees.roll_number) = %s AND es.branch = %s AND es.status = 'APPROVED' AND sr.response_id IS NULL
            ORDER BY es.exam_date ASC, es.exam_time ASC
        """
        cur.execute(query, (roll_number.upper(), branch.strip().lower()))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return {"status": "success", "data": [{"exam_id": r[0], "branch": r[1], "subject": r[2], "year": r[3], "exam_date": str(r[4]), "exam_time": str(r[5]), "exam_duration": r[6]} for r in rows]}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.get("/student/exam-portal-details/{exam_id}")
async def get_exam_portal_details(exam_id: int):
    try:
        conn = psycopg2.connect(**ADMIN_DB_CONFIG)
        cur = conn.cursor()
        query = "SELECT subject, exam_duration, pdf_path, total_questions FROM exam_sheets WHERE exam_id = %s AND status = 'APPROVED'"
        cur.execute(query, (exam_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        if row: return {"status": "success", "data": {"subject": row[0], "exam_duration": row[1], "pdf_path": row[2].replace("\\", "/"), "total_questions": row[3]}}
        raise HTTPException(status_code=404, detail="Exam Paper Details Not Found")
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.post("/student/submit-answers")
async def student_submit_answers(data: StudentSubmitRequest):
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


# NEW: 4.3 STUDENT PERFORMANCE (All historically written exams list)
@app.get("/student/my-performance/{roll_number}")
async def student_get_performance(roll_number: str):
    """స్టూడెంట్ రాసిన అన్ని ఎగ్జామ్స్ లిస్ట్, రిజల్ట్ పబ్లిష్ అయిందో లేదో స్టేటస్ తో సహా ఇస్తుంది"""
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


# NEW: 4.4 SEE DETAILED RESULT COMPARISON (Student vs Faculty Key)
@app.get("/student/see-result/{exam_id}/{roll_number}")
async def student_see_detailed_result(exam_id: int, roll_number: str):
    """స్టూడెంట్ రాసిన ఆప్షన్స్, అఫీషియల్ ఎక్సెల్ ఆప్షన్స్ పక్కపక్కన పెట్టి ఫ్రంటెండ్‌కి పంపుతుంది"""
    try:
        conn = psycopg2.connect(**ADMIN_DB_CONFIG)
        cur = conn.cursor()
        
        # 1. Get Student Answers
        cur.execute("SELECT answers FROM student_responses WHERE exam_id = %s AND UPPER(roll_number) = %s", (exam_id, roll_number.upper()))
        res_stu = cur.fetchone()
        student_ans = json.loads(res_stu[0]) if res_stu else {}
        
        # 2. Get Excel Key Path
        cur.execute("SELECT key_excel_path FROM exam_sheets WHERE exam_id = %s", (exam_id,))
        res_key = cur.fetchone()
        
        official_key = {}
        if res_key and res_key[0]:
            df_key = pd.read_excel(res_key[0])
            for _, row in df_key.iterrows():
                official_key[str(int(row['question_no']))] = str(row['correct_option']).strip().upper()
                
        # 3. Get Summary marks data
        cur.execute("SELECT total_marks, correct_answers, wrong_answers FROM student_results WHERE exam_id = %s AND UPPER(roll_number) = %s", (exam_id, roll_number.upper()))
        res_sum = cur.fetchone()
        
        summary = {"total_marks": res_sum[0], "correct": res_sum[1], "wrong": res_sum[2]} if res_sum else {"total_marks": 0, "correct": 0, "wrong": 0}
        
        # 4. Zip side-by-side comparison list
        comparison = []
        all_q_nos = sorted(list(set(list(student_ans.keys()) + list(official_key.keys()))), key=lambda x: int(x))
        
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
        raise HTTPException(status_code=500, detail=str(e))


# --- 5. SYSTEM LOGIN ENDPOINTS ---
@app.post("/login/student")
async def student_login(data: LoginRequest):
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
