-- =========================================================
-- COACH GENIE AI - CLEAN MVP DATABASE SCHEMA
-- =========================================================

-- =========================================================
-- EXTENSIONS
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =========================================================
-- USERS
-- =========================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    name VARCHAR(100) NOT NULL,

    email VARCHAR(255) UNIQUE NOT NULL,

    password_hash TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- USER PROFILES (PERSONALIZATION CORE)
-- =========================================================

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_id UUID UNIQUE
    REFERENCES users(id)
    ON DELETE CASCADE,

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
-- CHATS
-- =========================================================

CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_id UUID
    REFERENCES users(id)
    ON DELETE CASCADE,

    title VARCHAR(255),

    chat_type VARCHAR(50) DEFAULT 'doubt_solver',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- MESSAGES
-- =========================================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    chat_id UUID
    REFERENCES chats(id)
    ON DELETE CASCADE,

    sender VARCHAR(10)
    CHECK (sender IN ('user', 'ai'))
    NOT NULL,

    content TEXT NOT NULL,

    subject VARCHAR(100),

    topic VARCHAR(255),

    tokens_used INT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- AI LOGS
-- =========================================================

CREATE TABLE ai_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    chat_id UUID
    REFERENCES chats(id)
    ON DELETE CASCADE,

    message_id UUID
    REFERENCES messages(id)
    ON DELETE CASCADE,

    provider VARCHAR(50),

    model_name VARCHAR(100),

    agent_name VARCHAR(100),

    prompt TEXT,

    retrieved_context TEXT,

    response TEXT,

    tokens_used INT,

    latency FLOAT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- USER ACTIVITY
-- =========================================================

CREATE TABLE user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_id UUID
    REFERENCES users(id)
    ON DELETE CASCADE,

    action VARCHAR(100),

    metadata JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- KNOWLEDGE CHUNKS (RAG CORE)
-- =========================================================

CREATE TABLE knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    board VARCHAR(50),

    class_level INT,

    subject VARCHAR(100),

    chapter VARCHAR(255),

    topic VARCHAR(255),

    source VARCHAR(255),

    content TEXT NOT NULL,

    metadata JSONB,

    embedding VECTOR(384),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- NECESSARY TABLES
-- =========================================================

CREATE TABLE ai_generated_reports (
    id UUID PRIMARY KEY,
    
    student_id UUID NOT NULL,

    report_type VARCHAR(100) NOT NULL,

    generated_by UUID,

    report_json JSONB NOT NULL,

    summary TEXT,

    created_at TIMESTAMP DEFAULT NOW(),

    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ai_chat_sessions (
    id UUID PRIMARY KEY,

    user_id UUID NOT NULL,

    session_name VARCHAR(255),

    created_at TIMESTAMP DEFAULT NOW(),

    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ai_chat_messages (
    id UUID PRIMARY KEY,

    session_id UUID REFERENCES ai_chat_sessions(id),

    role VARCHAR(50) NOT NULL,

    message TEXT NOT NULL,

    metadata JSONB,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ai_agent_runs (
    id UUID PRIMARY KEY,

    request_id UUID NOT NULL,

    agent_name VARCHAR(100),

    tool_called VARCHAR(255),

    status VARCHAR(50),

    latency_ms INTEGER,

    token_usage INTEGER,

    model_name VARCHAR(100),

    error_message TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ai_embeddings (
    id UUID PRIMARY KEY,

    entity_type VARCHAR(100),

    entity_id UUID,

    chunk_text TEXT,

    embedding vector(1536),

    metadata JSONB,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ai_feedback (
    id UUID PRIMARY KEY,

    message_id UUID,

    rating INTEGER,

    feedback TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alembic_version (
    version_num VARCHAR(32) NOT NULL,
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);

-- =========================================================
-- INDEXES
-- =========================================================

-- =========================================================
-- USERS
-- =========================================================

CREATE INDEX idx_users_email
ON users(email);

-- =========================================================
-- USER PROFILES
-- =========================================================

CREATE INDEX idx_user_profiles_user_id
ON user_profiles(user_id);

CREATE INDEX idx_user_profiles_class
ON user_profiles(class_level);

CREATE INDEX idx_user_profiles_board
ON user_profiles(board);

-- =========================================================
-- CHATS
-- =========================================================

CREATE INDEX idx_chats_user_id
ON chats(user_id);

CREATE INDEX idx_chats_type
ON chats(chat_type);

-- =========================================================
-- MESSAGES
-- =========================================================

CREATE INDEX idx_messages_chat_id
ON messages(chat_id);

CREATE INDEX idx_messages_subject
ON messages(subject);

-- =========================================================
-- AI LOGS
-- =========================================================

CREATE INDEX idx_ai_logs_chat_id
ON ai_logs(chat_id);

CREATE INDEX idx_ai_logs_message_id
ON ai_logs(message_id);

CREATE INDEX idx_ai_logs_agent_name
ON ai_logs(agent_name);

-- =========================================================
-- USER ACTIVITY
-- =========================================================

CREATE INDEX idx_user_activity_user_id
ON user_activity(user_id);

CREATE INDEX idx_user_activity_action
ON user_activity(action);

-- =========================================================
-- KNOWLEDGE CHUNKS
-- =========================================================

CREATE INDEX idx_knowledge_chunks_subject
ON knowledge_chunks(subject);

CREATE INDEX idx_knowledge_chunks_board
ON knowledge_chunks(board);

CREATE INDEX idx_knowledge_chunks_class
ON knowledge_chunks(class_level);

CREATE INDEX idx_knowledge_chunks_topic
ON knowledge_chunks(topic);

-- =========================================================
-- VECTOR INDEX FOR SEMANTIC SEARCH
-- =========================================================

CREATE INDEX idx_knowledge_chunks_embedding
ON knowledge_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- =========================================================
-- COACH GENIE AI - AI INDEXES
-- =========================================================

CREATE INDEX idx_ai_reports_student_id
ON ai_generated_reports(student_id);

CREATE INDEX idx_ai_reports_report_type
ON ai_generated_reports(report_type);

CREATE INDEX idx_ai_reports_created_at
ON ai_generated_reports(created_at DESC);

CREATE INDEX idx_ai_chat_sessions_user_id
ON ai_chat_sessions(user_id);

CREATE INDEX idx_ai_chat_messages_session_id
ON ai_chat_messages(session_id);

CREATE INDEX idx_ai_chat_messages_created_at
ON ai_chat_messages(created_at DESC);

CREATE INDEX idx_ai_agent_runs_request_id
ON ai_agent_runs(request_id);

CREATE INDEX idx_ai_agent_runs_agent_name
ON ai_agent_runs(agent_name);

CREATE INDEX idx_ai_agent_runs_created_at
ON ai_agent_runs(created_at DESC);

CREATE INDEX idx_ai_embeddings_entity
ON ai_embeddings(entity_type, entity_id);

-- =========================================================
-- AUTO UPDATE TIMESTAMP FUNCTION
-- =========================================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- TIMESTAMP TRIGGERS
-- =========================================================

CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_user_profiles_timestamp
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_chats_timestamp
BEFORE UPDATE ON chats
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();


-- =========================================================
-- UPDATE KNOWLEDGE CHUNKS TABLE
-- =========================================================

ALTER TABLE knowledge_chunks

ADD COLUMN question TEXT,

ADD COLUMN options JSONB,

ADD COLUMN correct_answer TEXT,

ADD COLUMN explanation TEXT;

-- =========================================================
-- OPTIONAL INDEXES
-- =========================================================

CREATE INDEX idx_knowledge_chunks_question
ON knowledge_chunks
USING gin(to_tsvector('english', question));

CREATE INDEX idx_knowledge_chunks_explanation
ON knowledge_chunks
USING gin(to_tsvector('english', explanation));

-- =========================================================
-- TESTING DATA ADDITIONS
-- =========================================================
SELECT question, correct_answer
FROM knowledge_chunks
LIMIT 15;

-- =========================================================
-- ALTERATIONS
-- =========================================================

ALTER TABLE batches
ADD COLUMN subjects JSONB;

ALTER TABLE leads
ADD COLUMN documents JSONB;

ALTER TABLE leads
ADD COLUMN subjects JSONB;

ALTER TABLE admissions
ADD COLUMN batch_id UUID;

ALTER TABLE admissions
ADD COLUMN board_name TEXT;

ALTER TABLE admissions
ADD COLUMN batch_name TEXT;

ALTER TABLE admissions
ADD COLUMN subjects JSONB;

ALTER TABLE admissions
ADD COLUMN documents JSONB;

ALTER TABLE admissions
ADD COLUMN fee_amount NUMERIC(12,2) DEFAULT 0;

ALTER TABLE admissions
ADD COLUMN fee_paid NUMERIC(12,2) DEFAULT 0;

ALTER TABLE admissions
ADD COLUMN payment_installment_schedule VARCHAR;

ALTER TABLE students
ALTER COLUMN subjects TYPE JSONB
USING to_jsonb(subjects);