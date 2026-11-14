-- =============================================================================
-- SmartFace Attendance - Supabase PostgreSQL Schema with pgvector
-- =============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";      -- pgvector for face embeddings

-- -----------------------------------------------------------------------------
-- 2. Students / Users Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(50) UNIQUE NOT NULL,       -- e.g. Roll No / Student ID
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    semester INTEGER DEFAULT 1,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for searching students
CREATE INDEX IF NOT EXISTS idx_students_student_id ON public.students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_dept_sem ON public.students(department, semester);

-- -----------------------------------------------------------------------------
-- 3. Face Embeddings Table (512-dimensional vector for FaceNet / InsightFace)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.face_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    embedding vector(512) NOT NULL,              -- 512-d feature vector
    model_version VARCHAR(50) DEFAULT 'facenet512',
    confidence FLOAT DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_face_embeddings_student_id ON public.face_embeddings(student_id);

-- HNSW Vector Cosine Index for ultra-fast face search (< 2ms)
CREATE INDEX IF NOT EXISTS idx_face_embeddings_hnsw
    ON public.face_embeddings USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- -----------------------------------------------------------------------------
-- 4. Class / Exam Sessions Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_code VARCHAR(50) UNIQUE NOT NULL,
    subject_code VARCHAR(50) NOT NULL,
    subject_name VARCHAR(255) NOT NULL,
    room_number VARCHAR(50),
    faculty_email VARCHAR(255),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_status_time ON public.sessions(status, start_time);

-- -----------------------------------------------------------------------------
-- 5. Attendance Logs Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'excused')),
    verification_method VARCHAR(30) DEFAULT 'face_recognition', -- face_recognition, rfid, manual
    confidence_score FLOAT,
    device_id VARCHAR(100),
    marked_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Compound index for fast student attendance history and duplicate check
CREATE INDEX IF NOT EXISTS idx_attendance_student_session ON public.attendance_logs(student_id, session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_marked_at ON public.attendance_logs(marked_at DESC);

-- -----------------------------------------------------------------------------
-- 6. RPC Function: Fast Cosine Similarity Face Matching
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION match_face(
    query_embedding vector(512),
    match_threshold FLOAT DEFAULT 0.60,
    match_count INT DEFAULT 1
)
RETURNS TABLE (
    student_id UUID,
    roll_number VARCHAR(50),
    full_name VARCHAR(255),
    avatar_url TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id AS student_id,
        s.student_id AS roll_number,
        s.full_name,
        s.avatar_url,
        1 - (fe.embedding <=> query_embedding) AS similarity
    FROM public.face_embeddings fe
    JOIN public.students s ON s.id = fe.student_id
    WHERE 1 - (fe.embedding <=> query_embedding) > match_threshold
    ORDER BY fe.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;

-- -----------------------------------------------------------------------------
-- 7. Row Level Security (RLS)
-- -----------------------------------------------------------------------------
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.face_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- Read policies for authenticated users
CREATE POLICY "Allow authenticated read on students"
    ON public.students FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on sessions"
    ON public.sessions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on attendance_logs"
    ON public.attendance_logs FOR SELECT TO authenticated USING (true);

-- Service role bypasses RLS automatically for backend mutations

