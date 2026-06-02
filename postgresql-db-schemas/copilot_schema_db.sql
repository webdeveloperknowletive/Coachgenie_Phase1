-- =========================================================
-- EXTENSIONS
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

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