-- ============================================================
--  COACHING ERP  –  PostgreSQL Database Schema
--  Generated from: coaching-erp-backend folder structure
--  Modules: Tenancy · Auth · Lead · Admission · Student ·
--           Batch · Attendance · Test/Exam · Syllabus ·
--           Fees · Growth Card · AI Sessions · Notifications
--  Requires: PostgreSQL 15+ with pgvector extension
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- CREATE EXTENSION IF NOT EXISTS "vector";   -- pgvector for AI embeddings

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE tenant_plan        AS ENUM ('free', 'basic', 'pro', 'enterprise');
CREATE TYPE user_role          AS ENUM ('owner', 'counselor', 'tutor', 'parent', 'student');
CREATE TYPE lead_source        AS ENUM ('walk_in', 'website', 'referral', 'whatsapp', 'social', 'other');
CREATE TYPE lead_status        AS ENUM ('new', 'contacted', 'follow_up', 'interested', 'converted', 'lost');
CREATE TYPE lead_activity_type AS ENUM ('call', 'email', 'whatsapp', 'visit', 'note', 'status_change');
CREATE TYPE admission_status   AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE gender_type        AS ENUM ('male', 'female', 'other');
CREATE TYPE class_status       AS ENUM ('scheduled', 'ongoing', 'completed', 'cancelled');
CREATE TYPE attendance_status  AS ENUM ('present', 'absent', 'late', 'excused');
CREATE TYPE exam_type          AS ENUM ('unit_test', 'mock', 'midterm', 'final', 'practice');
CREATE TYPE syllabus_status    AS ENUM ('not_started', 'in_progress', 'completed');
CREATE TYPE invoice_status     AS ENUM ('pending', 'partial', 'paid', 'overdue', 'waived');
CREATE TYPE payment_mode       AS ENUM ('cash', 'upi', 'card', 'bank_transfer', 'cheque', 'other');
CREATE TYPE ai_feature         AS ENUM ('career_guidance', 'doubt_solver', 'ai_tutor', 'roleplay_career', 'institute_analytics');
CREATE TYPE message_role       AS ENUM ('user', 'assistant', 'system');
CREATE TYPE notif_channel      AS ENUM ('whatsapp', 'email', 'push');
CREATE TYPE notif_status       AS ENUM ('queued', 'sent', 'delivered', 'failed', 'read');
CREATE TYPE dashboard_role     AS ENUM ('owner', 'counselor', 'tutor', 'parent', 'student');


-- ============================================================
-- 1.  TENANCY
-- ============================================================

CREATE TABLE tenants (
  id          UUID          NOT NULL DEFAULT uuid_generate_v4(),
  name        VARCHAR(150)  NOT NULL,
  subdomain   VARCHAR(100)  NOT NULL,
  plan        tenant_plan   NOT NULL DEFAULT 'basic',
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
  settings    JSONB         NULL,   -- whatsapp_api_key, theme, locale …
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_tenants        PRIMARY KEY (id),
  CONSTRAINT uq_tenant_subdomain UNIQUE (subdomain)
);

COMMENT ON COLUMN tenants.settings IS 'Arbitrary per-tenant config: whatsapp_api_key, theme, locale, etc.';


-- ============================================================
-- 2.  USERS & AUTH
-- ============================================================

CREATE TABLE users (
  id             UUID         NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id      UUID         NOT NULL,
  email          VARCHAR(255) NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  role           user_role    NOT NULL DEFAULT 'student',
  first_name     VARCHAR(100) NOT NULL,
  last_name      VARCHAR(100) NOT NULL,
  phone          VARCHAR(20)  NULL,
  avatar_url     VARCHAR(500) NULL,
  is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
  last_login_at  TIMESTAMPTZ  NULL,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_users              PRIMARY KEY (id),
  CONSTRAINT uq_users_tenant_email UNIQUE (tenant_id, email),
  CONSTRAINT fk_users_tenant       FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_users_tenant ON users (tenant_id);
CREATE INDEX idx_users_role   ON users (tenant_id, role);


CREATE TABLE refresh_tokens (
  id          UUID         NOT NULL DEFAULT uuid_generate_v4(),
  user_id     UUID         NOT NULL,
  tenant_id   UUID         NOT NULL,
  token_hash  VARCHAR(255) NOT NULL,
  expires_at  TIMESTAMPTZ  NOT NULL,
  revoked     BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_refresh_tokens       PRIMARY KEY (id),
  CONSTRAINT uq_refresh_token_hash   UNIQUE (token_hash),
  CONSTRAINT fk_refresh_user         FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
  CONSTRAINT fk_refresh_tenant       FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_rt_user_tenant ON refresh_tokens (user_id, tenant_id);


-- ============================================================
-- 3.  LEAD MANAGEMENT
-- ============================================================

CREATE TABLE leads (
  id                UUID          NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id         UUID          NOT NULL,
  assigned_to       UUID          NULL,
  full_name         VARCHAR(150)  NOT NULL,
  email             VARCHAR(255)  NULL,
  phone             VARCHAR(20)   NOT NULL,
  parent_name       VARCHAR(150)  NULL,
  parent_phone      VARCHAR(20)   NULL,
  source            lead_source   NOT NULL DEFAULT 'website',
  status            lead_status   NOT NULL DEFAULT 'new',
  interested_course VARCHAR(150)  NULL,
  notes             TEXT          NULL,
  follow_up_date    DATE          NULL,
  converted_at      TIMESTAMPTZ   NULL,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_leads         PRIMARY KEY (id),
  CONSTRAINT fk_leads_tenant  FOREIGN KEY (tenant_id)   REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_leads_user    FOREIGN KEY (assigned_to) REFERENCES users(id)   ON DELETE SET NULL
);

CREATE INDEX idx_leads_tenant ON leads (tenant_id);
CREATE INDEX idx_leads_status ON leads (tenant_id, status);
CREATE INDEX idx_leads_follow ON leads (tenant_id, follow_up_date) WHERE follow_up_date IS NOT NULL;


CREATE TABLE lead_activities (
  id          UUID               NOT NULL DEFAULT uuid_generate_v4(),
  lead_id     UUID               NOT NULL,
  tenant_id   UUID               NOT NULL,
  created_by  UUID               NULL,
  type        lead_activity_type NOT NULL,
  description TEXT               NOT NULL,
  created_at  TIMESTAMPTZ        NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_lead_activities  PRIMARY KEY (id),
  CONSTRAINT fk_la_lead          FOREIGN KEY (lead_id)    REFERENCES leads(id)   ON DELETE CASCADE,
  CONSTRAINT fk_la_tenant        FOREIGN KEY (tenant_id)  REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_la_user          FOREIGN KEY (created_by) REFERENCES users(id)   ON DELETE SET NULL
);

CREATE INDEX idx_la_lead ON lead_activities (lead_id);


-- ============================================================
-- 4.  ADMISSION MANAGEMENT
-- ============================================================

CREATE TABLE admissions (
  id                 UUID             NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id          UUID             NOT NULL,
  lead_id            UUID             NULL,
  student_id         UUID             NULL,
  admission_number   VARCHAR(50)      NOT NULL,
  academic_year      VARCHAR(20)      NOT NULL,
  status             admission_status NOT NULL DEFAULT 'pending',
  applied_course     VARCHAR(150)     NOT NULL,
  documents_verified BOOLEAN          NOT NULL DEFAULT FALSE,
  remarks            TEXT             NULL,
  approved_by        UUID             NULL,
  approved_at        TIMESTAMPTZ      NULL,
  created_at         TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_admissions        PRIMARY KEY (id),
  CONSTRAINT uq_admission_number  UNIQUE (tenant_id, admission_number),
  CONSTRAINT fk_adm_tenant        FOREIGN KEY (tenant_id)   REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_adm_lead          FOREIGN KEY (lead_id)     REFERENCES leads(id)   ON DELETE SET NULL,
  CONSTRAINT fk_adm_approver      FOREIGN KEY (approved_by) REFERENCES users(id)   ON DELETE SET NULL
);

CREATE INDEX idx_admissions_tenant ON admissions (tenant_id);
CREATE INDEX idx_admissions_status ON admissions (tenant_id, status);


-- ============================================================
-- 5.  STUDENT MASTER
-- ============================================================

CREATE TABLE students (
  id              UUID          NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id       UUID          NOT NULL,
  user_id         UUID          NULL,
  admission_id    UUID          NULL,
  enrollment_no   VARCHAR(50)   NOT NULL,
  first_name      VARCHAR(100)  NOT NULL,
  last_name       VARCHAR(100)  NOT NULL,
  date_of_birth   DATE          NULL,
  gender          gender_type   NULL,
  blood_group     VARCHAR(5)    NULL,
  photo_url       VARCHAR(500)  NULL,
  email           VARCHAR(255)  NULL,
  phone           VARCHAR(20)   NULL,
  address         TEXT          NULL,
  city            VARCHAR(100)  NULL,
  state           VARCHAR(100)  NULL,
  pincode         VARCHAR(10)   NULL,
  parent_name     VARCHAR(150)  NULL,
  parent_phone    VARCHAR(20)   NULL,
  parent_email    VARCHAR(255)  NULL,
  school_name     VARCHAR(200)  NULL,
  current_class   VARCHAR(50)   NULL,
  target_exam     VARCHAR(150)  NULL,
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  joined_at       DATE          NULL,
  left_at         DATE          NULL,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_students          PRIMARY KEY (id),
  CONSTRAINT uq_enrollment        UNIQUE (tenant_id, enrollment_no),
  CONSTRAINT fk_stu_tenant        FOREIGN KEY (tenant_id)    REFERENCES tenants(id)    ON DELETE CASCADE,
  CONSTRAINT fk_stu_user          FOREIGN KEY (user_id)      REFERENCES users(id)      ON DELETE SET NULL,
  CONSTRAINT fk_stu_admission     FOREIGN KEY (admission_id) REFERENCES admissions(id) ON DELETE SET NULL
);

CREATE INDEX idx_students_tenant ON students (tenant_id);
CREATE INDEX idx_students_active ON students (tenant_id, is_active);


-- ============================================================
-- 6.  BATCH & CLASS MANAGEMENT
-- ============================================================

CREATE TABLE subjects (
  id          UUID          NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id   UUID          NOT NULL,
  name        VARCHAR(150)  NOT NULL,
  code        VARCHAR(30)   NULL,
  description TEXT          NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_subjects     PRIMARY KEY (id),
  CONSTRAINT uq_subject_name UNIQUE (tenant_id, name),
  CONSTRAINT fk_subj_tenant  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);


CREATE TABLE batches (
  id             UUID          NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id      UUID          NOT NULL,
  name           VARCHAR(150)  NOT NULL,
  code           VARCHAR(50)   NULL,
  description    TEXT          NULL,
  target_exam    VARCHAR(150)  NULL,
  academic_year  VARCHAR(20)   NOT NULL,
  start_date     DATE          NULL,
  end_date       DATE          NULL,
  capacity       SMALLINT      NOT NULL DEFAULT 50,
  is_active      BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_batches     PRIMARY KEY (id),
  CONSTRAINT fk_batch_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_batches_tenant ON batches (tenant_id);
CREATE INDEX idx_batches_active ON batches (tenant_id, is_active);


CREATE TABLE batch_students (
  batch_id    UUID  NOT NULL,
  student_id  UUID  NOT NULL,
  enrolled_at DATE  NOT NULL,

  CONSTRAINT pk_batch_students PRIMARY KEY (batch_id, student_id),
  CONSTRAINT fk_bs_batch       FOREIGN KEY (batch_id)   REFERENCES batches(id)  ON DELETE CASCADE,
  CONSTRAINT fk_bs_student     FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE INDEX idx_bs_student ON batch_students (student_id);


CREATE TABLE classes (
  id             UUID          NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id      UUID          NOT NULL,
  batch_id       UUID          NOT NULL,
  subject_id     UUID          NULL,
  tutor_id       UUID          NULL,
  title          VARCHAR(200)  NOT NULL,
  description    TEXT          NULL,
  scheduled_at   TIMESTAMPTZ   NOT NULL,
  duration_min   SMALLINT      NOT NULL DEFAULT 60,
  room_or_link   VARCHAR(300)  NULL,
  status         class_status  NOT NULL DEFAULT 'scheduled',
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_classes      PRIMARY KEY (id),
  CONSTRAINT fk_cls_tenant   FOREIGN KEY (tenant_id)  REFERENCES tenants(id)  ON DELETE CASCADE,
  CONSTRAINT fk_cls_batch    FOREIGN KEY (batch_id)   REFERENCES batches(id)  ON DELETE CASCADE,
  CONSTRAINT fk_cls_subject  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
  CONSTRAINT fk_cls_tutor    FOREIGN KEY (tutor_id)   REFERENCES users(id)    ON DELETE SET NULL
);

CREATE INDEX idx_classes_batch        ON classes (batch_id);
CREATE INDEX idx_classes_scheduled_at ON classes (tenant_id, scheduled_at);


-- ============================================================
-- 7.  ATTENDANCE TRACKING
-- ============================================================

CREATE TABLE attendance_sessions (
  id            UUID        NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id     UUID        NOT NULL,
  class_id      UUID        NOT NULL,
  taken_by      UUID        NULL,
  session_date  DATE        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_att_sessions       PRIMARY KEY (id),
  CONSTRAINT uq_att_session        UNIQUE (class_id, session_date),
  CONSTRAINT fk_att_sess_tenant    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_att_sess_class     FOREIGN KEY (class_id)  REFERENCES classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_att_sess_user      FOREIGN KEY (taken_by)  REFERENCES users(id)   ON DELETE SET NULL
);

CREATE INDEX idx_att_sess_date ON attendance_sessions (tenant_id, session_date);


CREATE TABLE attendance_records (
  id          UUID              NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id   UUID              NOT NULL,
  session_id  UUID              NOT NULL,
  student_id  UUID              NOT NULL,
  status      attendance_status NOT NULL DEFAULT 'absent',
  remarks     VARCHAR(255)      NULL,
  created_at  TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_att_records       PRIMARY KEY (id),
  CONSTRAINT uq_att_record        UNIQUE (session_id, student_id),
  CONSTRAINT fk_att_rec_tenant    FOREIGN KEY (tenant_id)  REFERENCES tenants(id)             ON DELETE CASCADE,
  CONSTRAINT fk_att_rec_session   FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_att_rec_student   FOREIGN KEY (student_id) REFERENCES students(id)            ON DELETE CASCADE
);

CREATE INDEX idx_att_rec_student ON attendance_records (student_id);


-- ============================================================
-- 8.  TEST & EXAM MANAGEMENT
-- ============================================================

CREATE TABLE exams (
  id             UUID          NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id      UUID          NOT NULL,
  batch_id       UUID          NULL,
  subject_id     UUID          NULL,
  created_by     UUID          NULL,
  title          VARCHAR(200)  NOT NULL,
  type           exam_type     NOT NULL DEFAULT 'unit_test',
  total_marks    NUMERIC(6,2)  NOT NULL DEFAULT 100,
  passing_marks  NUMERIC(6,2)  NOT NULL DEFAULT 35,
  duration_min   SMALLINT      NOT NULL DEFAULT 60,
  scheduled_at   TIMESTAMPTZ   NULL,
  instructions   TEXT          NULL,
  is_published   BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_exams        PRIMARY KEY (id),
  CONSTRAINT fk_exam_tenant  FOREIGN KEY (tenant_id)  REFERENCES tenants(id)  ON DELETE CASCADE,
  CONSTRAINT fk_exam_batch   FOREIGN KEY (batch_id)   REFERENCES batches(id)  ON DELETE SET NULL,
  CONSTRAINT fk_exam_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
  CONSTRAINT fk_exam_creator FOREIGN KEY (created_by) REFERENCES users(id)    ON DELETE SET NULL
);

CREATE INDEX idx_exams_tenant ON exams (tenant_id);
CREATE INDEX idx_exams_batch  ON exams (batch_id);


CREATE TABLE exam_results (
  id             UUID          NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id      UUID          NOT NULL,
  exam_id        UUID          NOT NULL,
  student_id     UUID          NOT NULL,
  marks_obtained NUMERIC(6,2)  NOT NULL DEFAULT 0,
  grade          VARCHAR(5)    NULL,
  rank_in_batch  SMALLINT      NULL,
  is_pass        BOOLEAN       NOT NULL DEFAULT FALSE,
  remarks        TEXT          NULL,
  submitted_at   TIMESTAMPTZ   NULL,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_exam_results  PRIMARY KEY (id),
  CONSTRAINT uq_exam_student  UNIQUE (exam_id, student_id),
  CONSTRAINT fk_er_tenant     FOREIGN KEY (tenant_id)  REFERENCES tenants(id)  ON DELETE CASCADE,
  CONSTRAINT fk_er_exam       FOREIGN KEY (exam_id)    REFERENCES exams(id)    ON DELETE CASCADE,
  CONSTRAINT fk_er_student    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE INDEX idx_er_exam_rank ON exam_results (exam_id, rank_in_batch);


-- ============================================================
-- 9.  SYLLABUS & PROGRESS
-- ============================================================

CREATE TABLE syllabus_topics (
  id          UUID          NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id   UUID          NOT NULL,
  subject_id  UUID          NOT NULL,
  parent_id   UUID          NULL,
  title       VARCHAR(200)  NOT NULL,
  description TEXT          NULL,
  sort_order  SMALLINT      NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_syllabus_topics  PRIMARY KEY (id),
  CONSTRAINT fk_syl_tenant       FOREIGN KEY (tenant_id)  REFERENCES tenants(id)         ON DELETE CASCADE,
  CONSTRAINT fk_syl_subject      FOREIGN KEY (subject_id) REFERENCES subjects(id)        ON DELETE CASCADE,
  CONSTRAINT fk_syl_parent       FOREIGN KEY (parent_id)  REFERENCES syllabus_topics(id) ON DELETE SET NULL
);

CREATE INDEX idx_syl_subject ON syllabus_topics (subject_id);


CREATE TABLE syllabus_progress (
  id           UUID            NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id    UUID            NOT NULL,
  topic_id     UUID            NOT NULL,
  batch_id     UUID            NOT NULL,
  tutor_id     UUID            NULL,
  status       syllabus_status NOT NULL DEFAULT 'not_started',
  completed_at TIMESTAMPTZ     NULL,
  notes        TEXT            NULL,
  created_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_syllabus_progress PRIMARY KEY (id),
  CONSTRAINT uq_syl_prog          UNIQUE (topic_id, batch_id),
  CONSTRAINT fk_sp_tenant         FOREIGN KEY (tenant_id) REFERENCES tenants(id)         ON DELETE CASCADE,
  CONSTRAINT fk_sp_topic          FOREIGN KEY (topic_id)  REFERENCES syllabus_topics(id) ON DELETE CASCADE,
  CONSTRAINT fk_sp_batch          FOREIGN KEY (batch_id)  REFERENCES batches(id)         ON DELETE CASCADE,
  CONSTRAINT fk_sp_tutor          FOREIGN KEY (tutor_id)  REFERENCES users(id)           ON DELETE SET NULL
);

CREATE INDEX idx_sp_batch ON syllabus_progress (batch_id, status);


-- ============================================================
-- 10.  FEES & REVENUE
-- ============================================================

CREATE TABLE fee_structures (
  id            UUID          NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id     UUID          NOT NULL,
  batch_id      UUID          NULL,
  name          VARCHAR(150)  NOT NULL,
  total_amount  NUMERIC(10,2) NOT NULL,
  installments  SMALLINT      NOT NULL DEFAULT 1,
  description   TEXT          NULL,
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_fee_structures PRIMARY KEY (id),
  CONSTRAINT fk_fs_tenant      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_fs_batch       FOREIGN KEY (batch_id)  REFERENCES batches(id) ON DELETE SET NULL
);


CREATE TABLE fee_invoices (
  id                UUID           NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id         UUID           NOT NULL,
  student_id        UUID           NOT NULL,
  fee_structure_id  UUID           NULL,
  invoice_no        VARCHAR(50)    NOT NULL,
  amount_due        NUMERIC(10,2)  NOT NULL,
  amount_paid       NUMERIC(10,2)  NOT NULL DEFAULT 0,
  discount          NUMERIC(10,2)  NOT NULL DEFAULT 0,
  due_date          DATE           NOT NULL,
  status            invoice_status NOT NULL DEFAULT 'pending',
  created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_fee_invoices    PRIMARY KEY (id),
  CONSTRAINT uq_invoice_no      UNIQUE (tenant_id, invoice_no),
  CONSTRAINT fk_inv_tenant      FOREIGN KEY (tenant_id)        REFERENCES tenants(id)        ON DELETE CASCADE,
  CONSTRAINT fk_inv_student     FOREIGN KEY (student_id)       REFERENCES students(id)       ON DELETE CASCADE,
  CONSTRAINT fk_inv_fee_struct  FOREIGN KEY (fee_structure_id) REFERENCES fee_structures(id) ON DELETE SET NULL
);

CREATE INDEX idx_inv_student        ON fee_invoices (student_id);
CREATE INDEX idx_inv_due_status     ON fee_invoices (tenant_id, due_date, status);


CREATE TABLE fee_payments (
  id               UUID          NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id        UUID          NOT NULL,
  invoice_id       UUID          NOT NULL,
  student_id       UUID          NOT NULL,
  amount           NUMERIC(10,2) NOT NULL,
  payment_mode     payment_mode  NOT NULL DEFAULT 'cash',
  transaction_ref  VARCHAR(100)  NULL,
  paid_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  received_by      UUID          NULL,
  notes            VARCHAR(300)  NULL,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_fee_payments   PRIMARY KEY (id),
  CONSTRAINT fk_pay_tenant     FOREIGN KEY (tenant_id)   REFERENCES tenants(id)      ON DELETE CASCADE,
  CONSTRAINT fk_pay_invoice    FOREIGN KEY (invoice_id)  REFERENCES fee_invoices(id) ON DELETE CASCADE,
  CONSTRAINT fk_pay_student    FOREIGN KEY (student_id)  REFERENCES students(id)     ON DELETE CASCADE,
  CONSTRAINT fk_pay_receiver   FOREIGN KEY (received_by) REFERENCES users(id)        ON DELETE SET NULL
);

CREATE INDEX idx_pay_invoice ON fee_payments (invoice_id);


-- ============================================================
-- 11.  STUDENT GROWTH CARD
-- ============================================================

CREATE TABLE growth_cards (
  id                  UUID          NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id           UUID          NOT NULL,
  student_id          UUID          NOT NULL,
  created_by          UUID          NULL,
  period_label        VARCHAR(50)   NOT NULL,
  academic_score      NUMERIC(5,2)  NULL,
  attendance_percent  NUMERIC(5,2)  NULL,
  behavior_rating     SMALLINT      NULL CHECK (behavior_rating BETWEEN 1 AND 5),
  strengths           TEXT          NULL,
  improvement_areas   TEXT          NULL,
  tutor_remarks       TEXT          NULL,
  parent_seen         BOOLEAN       NOT NULL DEFAULT FALSE,
  parent_seen_at      TIMESTAMPTZ   NULL,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_growth_cards  PRIMARY KEY (id),
  CONSTRAINT fk_gc_tenant     FOREIGN KEY (tenant_id)  REFERENCES tenants(id)  ON DELETE CASCADE,
  CONSTRAINT fk_gc_student    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_gc_creator    FOREIGN KEY (created_by) REFERENCES users(id)    ON DELETE SET NULL
);

CREATE INDEX idx_gc_student ON growth_cards (student_id);


-- ============================================================
-- 12.  AI MODULE
--      Career Guidance · Doubt Solver · AI Tutor ·
--      Roleplay Career · Institute Analytics
-- ============================================================

CREATE TABLE ai_sessions (
  id           UUID        NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id    UUID        NOT NULL,
  user_id      UUID        NOT NULL,
  student_id   UUID        NULL,
  feature      ai_feature  NOT NULL,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at     TIMESTAMPTZ NULL,
  total_tokens INT         NULL,
  model_used   VARCHAR(80) NULL,

  CONSTRAINT pk_ai_sessions      PRIMARY KEY (id),
  CONSTRAINT fk_ai_sess_tenant   FOREIGN KEY (tenant_id)  REFERENCES tenants(id)  ON DELETE CASCADE,
  CONSTRAINT fk_ai_sess_user     FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_ai_sess_student  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
);

CREATE INDEX idx_ai_sess_tenant  ON ai_sessions (tenant_id);
CREATE INDEX idx_ai_sess_feature ON ai_sessions (tenant_id, feature);


CREATE TABLE ai_messages (
  id          UUID          NOT NULL DEFAULT uuid_generate_v4(),
  session_id  UUID          NOT NULL,
  tenant_id   UUID          NOT NULL,
  role        message_role  NOT NULL,
  content     TEXT          NOT NULL,
  tokens      INT           NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_ai_messages      PRIMARY KEY (id),
  CONSTRAINT fk_ai_msg_session   FOREIGN KEY (session_id) REFERENCES ai_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_ai_msg_tenant    FOREIGN KEY (tenant_id)  REFERENCES tenants(id)     ON DELETE CASCADE
);

CREATE INDEX idx_ai_msg_session ON ai_messages (session_id);


-- pgvector table for RAG (Retrieval-Augmented Generation)
-- vector(1536) matches OpenAI text-embedding-3-small / ada-002
-- Use vector(3072) for text-embedding-3-large
-- Use vector(1024) for Anthropic/Cohere embeddings
CREATE TABLE ai_embeddings (
  id            UUID          NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id     UUID          NOT NULL,
  source_type   VARCHAR(80)   NOT NULL,  -- 'syllabus_topic' | 'exam_result' | 'growth_card' …
  source_id     UUID          NOT NULL,
  content_text  TEXT          NOT NULL,
  embedding VECTOR(1536),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_ai_embeddings  PRIMARY KEY (id),
  CONSTRAINT fk_emb_tenant     FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_emb_tenant      ON ai_embeddings (tenant_id, source_type);
-- IVFFlat index for ANN search (tune lists = rows/1000, up to 1000 max)
CREATE INDEX idx_emb_vector_ivf  ON ai_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);


-- ============================================================
-- 13.  NOTIFICATIONS
--      WhatsApp · Email · Push
-- ============================================================

CREATE TABLE notification_templates (
  id          UUID           NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id   UUID           NOT NULL,
  name        VARCHAR(150)   NOT NULL,
  channel     notif_channel  NOT NULL,
  subject     VARCHAR(255)   NULL,
  body        TEXT           NOT NULL,
  variables   JSONB          NULL,  -- ["student_name","due_date"]
  is_active   BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_notif_templates   PRIMARY KEY (id),
  CONSTRAINT uq_notif_tpl         UNIQUE (tenant_id, name, channel),
  CONSTRAINT fk_ntpl_tenant       FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);


CREATE TABLE notification_logs (
  id             UUID          NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id      UUID          NOT NULL,
  template_id    UUID          NULL,
  recipient_id   UUID          NULL,
  channel        notif_channel NOT NULL,
  recipient_ref  VARCHAR(255)  NOT NULL,  -- phone / email / device_token
  subject        VARCHAR(255)  NULL,
  body           TEXT          NOT NULL,
  status         notif_status  NOT NULL DEFAULT 'queued',
  provider_ref   VARCHAR(255)  NULL,
  error_msg      TEXT          NULL,
  sent_at        TIMESTAMPTZ   NULL,
  delivered_at   TIMESTAMPTZ   NULL,
  read_at        TIMESTAMPTZ   NULL,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_notif_logs      PRIMARY KEY (id),
  CONSTRAINT fk_nlog_tenant     FOREIGN KEY (tenant_id)   REFERENCES tenants(id)                ON DELETE CASCADE,
  CONSTRAINT fk_nlog_template   FOREIGN KEY (template_id) REFERENCES notification_templates(id) ON DELETE SET NULL,
  CONSTRAINT fk_nlog_recipient  FOREIGN KEY (recipient_id) REFERENCES users(id)                 ON DELETE SET NULL
);

CREATE INDEX idx_nlog_tenant    ON notification_logs (tenant_id);
CREATE INDEX idx_nlog_status    ON notification_logs (tenant_id, status, created_at);
CREATE INDEX idx_nlog_recipient ON notification_logs (recipient_id) WHERE recipient_id IS NOT NULL;


-- ============================================================
-- 14.  DASHBOARD SNAPSHOTS (cached KPIs per role)
-- ============================================================

CREATE TABLE dashboard_snapshots (
  id            UUID           NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id     UUID           NOT NULL,
  role          dashboard_role NOT NULL,
  owner_id      UUID           NULL,  -- user or student this snapshot belongs to
  data          JSONB          NOT NULL,
  generated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_dashboard_snapshots PRIMARY KEY (id),
  CONSTRAINT fk_dash_tenant         FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_dash_tenant_role ON dashboard_snapshots (tenant_id, role);


-- ============================================================
-- 15.  AUTO-UPDATE updated_at TRIGGER
--      Apply to every table that has an updated_at column
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper to create the trigger for each table
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'tenants', 'users', 'leads', 'admissions', 'students',
    'batches', 'classes', 'syllabus_progress', 'fee_invoices',
    'growth_cards', 'exams'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();',
      t, t
    );
  END LOOP;
END;
$$;

0
-- ============================================================
-- 16.  ROW-LEVEL SECURITY (optional but recommended for SaaS)
--      Enable per table, then add tenant_id policies.
--      Set app.current_tenant_id via SET LOCAL in each request.
-- ============================================================

-- Example for students table (repeat pattern for other tables):
--
-- ALTER TABLE students ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY tenant_isolation ON students
--   USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
