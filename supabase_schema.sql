-- ==============================================================================
-- QueueSense AI — Full Centralized PostgreSQL Schema for Supabase
-- Includes: Admins, Students (with username/pass), Departments, Violations, Cameras
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ADMINS TABLE (Stores all Administrators with credentials & authority)
CREATE TABLE IF NOT EXISTS admins (
    id VARCHAR(50) PRIMARY KEY,
    password VARCHAR(100) NOT NULL,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    department VARCHAR(150) DEFAULT 'Campus Security & Discipline',
    institution VARCHAR(150) DEFAULT 'Saveetha Engineering College',
    role VARCHAR(20) DEFAULT 'admin',
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Default Root Admin
INSERT INTO admins (id, password, name, email, department, institution, role, avatar)
VALUES (
    '212224040141',
    'john24',
    'Chief Surveillance Admin',
    'admin.surveillance@saveetha.ac.in',
    'Deanery of Discipline & Campus Surveillance',
    'Saveetha Engineering College',
    'admin',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=300'
)
ON CONFLICT (id) DO NOTHING;

-- 3. STUDENTS TABLE (Includes login username & password)
CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100),
    password VARCHAR(100) DEFAULT 'student123',
    name VARCHAR(150) NOT NULL,
    register_number VARCHAR(50) NOT NULL UNIQUE,
    department_id VARCHAR(50) NOT NULL REFERENCES departments(id) ON UPDATE CASCADE,
    email VARCHAR(150),
    phone VARCHAR(50),
    avatar TEXT,
    face_photo TEXT,
    face_descriptor JSONB,
    queue_score INT DEFAULT 80 CHECK (queue_score >= 0 AND queue_score <= 100),
    monthly_reward_points INT DEFAULT 0,
    max_monthly_reward INT DEFAULT 50,
    weekly_deduction INT DEFAULT 0,
    is_eligible_for_reward BOOLEAN DEFAULT FALSE,
    current_queue_status VARCHAR(50) DEFAULT 'Proper Queue',
    join_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure username & password columns exist if students table already created
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='username') THEN
        ALTER TABLE students ADD COLUMN username VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='password') THEN
        ALTER TABLE students ADD COLUMN password VARCHAR(100) DEFAULT 'student123';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_students_department_id ON students(department_id);
CREATE INDEX IF NOT EXISTS idx_students_register_number ON students(register_number);
CREATE INDEX IF NOT EXISTS idx_students_username ON students(username);

-- 4. CAMERAS TABLE
CREATE TABLE IF NOT EXISTS cameras (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    location VARCHAR(150) NOT NULL,
    stream_type VARCHAR(50) DEFAULT 'webcam',
    stream_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    fps INT DEFAULT 30,
    confidence NUMERIC(5,2) DEFAULT 98.60,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. VIOLATIONS LOG TABLE
CREATE TABLE IF NOT EXISTS violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id VARCHAR(50) REFERENCES students(id) ON DELETE SET NULL,
    student_name VARCHAR(150) NOT NULL,
    register_number VARCHAR(50),
    department_id VARCHAR(50) REFERENCES departments(id) ON DELETE SET NULL,
    camera_id VARCHAR(50) REFERENCES cameras(id) ON DELETE SET NULL,
    camera_name VARCHAR(150),
    penalty_points INT DEFAULT 15,
    reason VARCHAR(255) DEFAULT 'Line Boundary Crossing / Queue Cut-In',
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_violations_timestamp ON violations(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_violations_student_id ON violations(student_id);

-- 6. VIEW FOR TOP DEPARTMENT STATS
CREATE OR REPLACE VIEW v_department_statistics AS
SELECT 
    d.id AS department_id,
    d.name AS department_name,
    d.code AS department_code,
    COUNT(DISTINCT s.id) AS total_students,
    COALESCE(ROUND(AVG(s.queue_score), 1), 0) AS avg_queue_score,
    COALESCE(SUM(s.weekly_deduction), 0) AS total_deductions,
    COUNT(DISTINCT CASE WHEN s.queue_score >= 90 THEN s.id END) AS reward_eligible_count
FROM departments d
LEFT JOIN students s ON s.department_id = d.id
GROUP BY d.id, d.name, d.code
ORDER BY total_students DESC, avg_queue_score DESC;

-- Enable Realtime replication
ALTER PUBLICATION supabase_realtime ADD TABLE departments, students, admins, cameras, violations;

-- Row Level Security (RLS) policies
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert/update for departments" ON departments FOR ALL USING (true);

CREATE POLICY "Allow read access for admins" ON admins FOR SELECT USING (true);
CREATE POLICY "Allow insert/update/delete for admins" ON admins FOR ALL USING (true);

CREATE POLICY "Allow read access for students" ON students FOR SELECT USING (true);
CREATE POLICY "Allow insert/update/delete for students" ON students FOR ALL USING (true);

CREATE POLICY "Allow read access for cameras" ON cameras FOR SELECT USING (true);
CREATE POLICY "Allow insert/update for cameras" ON cameras FOR ALL USING (true);

CREATE POLICY "Allow read access for violations" ON violations FOR SELECT USING (true);
CREATE POLICY "Allow insert for violations" ON violations FOR INSERT WITH CHECK (true);
