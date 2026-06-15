-- =========================================================
-- 0. EXTENSIONS & CORE UTILITIES
-- =========================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Automated Timestamp Function
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- 1. TENANT MANAGEMENT (The Multi-Tenant Foundation)
-- =========================================================
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    plan VARCHAR(20) NOT NULL DEFAULT 'basic',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- 2. CORE USERS & PROFILES
-- =========================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    class_level INT,
    board VARCHAR(50),
    school_name VARCHAR(255),
    interests TEXT[],
    strengths TEXT[],
    weaknesses TEXT[],
    learning_style VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- 3. ACADEMIC & OPERATIONAL MODULES
-- =========================================================
CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    subjects JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
    subjects JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    status VARCHAR(50) DEFAULT 'open',
    documents JSONB DEFAULT '[]'::jsonb,
    subjects JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
    board_name TEXT,
    batch_name TEXT,
    subjects JSONB DEFAULT '[]'::jsonb,
    documents JSONB DEFAULT '[]'::jsonb,
    fee_amount NUMERIC(12,2) DEFAULT 0.00,
    fee_paid NUMERIC(12,2) DEFAULT 0.00,
    payment_installment_schedule VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- 4. SYLLABUS & PROGRESS TRACKING
-- =========================================================
CREATE TABLE syllabus_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    subject VARCHAR(150),
    title VARCHAR(300) NOT NULL,
    description TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_syllabus_item UNIQUE (batch_id, title)
);

CREATE TABLE syllabus_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES syllabus_items(id) ON DELETE CASCADE,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    CONSTRAINT uq_syllabus_progress UNIQUE (item_id, batch_id)
);

-- =========================================================
-- 5. GROWTH CARDS (Student Performance & Parent Tracking)
-- =========================================================
CREATE TABLE growth_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    period_label VARCHAR(50) NOT NULL,
    academic_score NUMERIC(5, 2),
    attendance_percent NUMERIC(5, 2),
    behavior_rating SMALLINT CONSTRAINT chk_behavior_rating CHECK (behavior_rating BETWEEN 1 AND 5),
    strengths TEXT,
    improvement_areas TEXT,
    tutor_remarks TEXT,
    parent_seen BOOLEAN NOT NULL DEFAULT FALSE,
    parent_seen_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- 6. IN-APP NOTIFICATIONS (INBOX)
-- =========================================================
CREATE TABLE inbox_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL = broadcast to all staff in tenant
    title VARCHAR(255) NOT NULL,
    body TEXT,
    icon VARCHAR(50),
    link VARCHAR(500),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- 7. HUMAN-TO-HUMAN CHAT SYSTEM
-- =========================================================
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) DEFAULT 'New Conversation',
    chat_type VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL CONSTRAINT messages_sender_check CHECK (sender IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- 8. CORE KNOWLEDGE BASE & AI GLOBAL DATA (No Tenant ID)
-- =========================================================
CREATE TABLE knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    correct_answer TEXT,
    explanation TEXT,
    embedding VECTOR(1536),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    embedding VECTOR(1536) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- 9. AI SESSIONS, LOGGING & ANALYTICS
-- =========================================================
CREATE TABLE ai_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    feature VARCHAR(50) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    total_tokens INTEGER DEFAULT 0,
    model_used VARCHAR(80)
);

CREATE TABLE ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    tokens INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dashboard_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    owner_id UUID,
    data TEXT NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    prompt_tokens INT DEFAULT 0,
    completion_tokens INT DEFAULT 0,
    total_tokens INT DEFAULT 0,
    latency_ms INT,
    model_used VARCHAR(100),
    status VARCHAR(50),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai_agent_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_name VARCHAR(100) NOT NULL,
    request_id UUID,
    status VARCHAR(50),
    steps_executed JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai_generated_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    report_type VARCHAR(100),
    content JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- 10. PRODUCTION-GRADE PERFORMANCE INDEXING
-- =========================================================

-- Modern HNSW Vector Indexing for blazing-fast semantic search
CREATE INDEX idx_knowledge_chunks_embedding ON knowledge_chunks USING hnsw (embedding vector_cosine_ops);

-- Full-Text Keyword Fallbacks
CREATE INDEX idx_knowledge_chunks_question_fts ON knowledge_chunks USING gin(to_tsvector('english', question));
CREATE INDEX idx_knowledge_chunks_explanation_fts ON knowledge_chunks USING gin(to_tsvector('english', explanation));

-- Multi-Tenant & Core Lookups
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_students_user ON students(user_id);
CREATE INDEX idx_admissions_user ON admissions(user_id);

-- Syllabus Lookups
CREATE INDEX idx_syllabus_items_tenant ON syllabus_items(tenant_id);
CREATE INDEX idx_syllabus_items_batch ON syllabus_items(batch_id);
CREATE INDEX idx_syllabus_progress_tenant ON syllabus_progress(tenant_id);
CREATE INDEX idx_syllabus_progress_batch ON syllabus_progress(batch_id);
CREATE INDEX idx_syllabus_progress_item ON syllabus_progress(item_id);

-- Growth Card Lookups
CREATE INDEX idx_gc_student ON growth_cards(student_id);
CREATE INDEX idx_gc_tenant ON growth_cards(tenant_id);

-- Inbox Lookups
CREATE INDEX idx_inbox_tenant ON inbox_notifications(tenant_id);
CREATE INDEX idx_inbox_user ON inbox_notifications(user_id);

-- Chat & AI Sessions Lookups
CREATE INDEX idx_chats_user ON chats(user_id);
CREATE INDEX idx_messages_chat ON messages(chat_id);
CREATE INDEX idx_ai_sess_tenant ON ai_sessions(tenant_id);
CREATE INDEX idx_ai_sess_feature ON ai_sessions(tenant_id, feature);
CREATE INDEX idx_ai_msg_session ON ai_messages(session_id);
CREATE INDEX idx_dash_tenant_role ON dashboard_snapshots(tenant_id, role);

-- =========================================================
-- 11. AUTOMATED TIMESTAMP TRIGGERS
-- =========================================================
CREATE TRIGGER trg_update_tenants BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_update_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_update_user_profiles BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_update_batches BEFORE UPDATE ON batches FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_update_students BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_update_leads BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_update_admissions BEFORE UPDATE ON admissions FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_update_growth_cards BEFORE UPDATE ON growth_cards FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_update_chats BEFORE UPDATE ON chats FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_update_knowledge_chunks BEFORE UPDATE ON knowledge_chunks FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_update_ai_reports BEFORE UPDATE ON ai_generated_reports FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- =========================================================
-- 12. ALTERATIONS FOR TABLES
-- =========================================================

ALTER TABLE users
ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'USER';

ALTER TABLE users
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;