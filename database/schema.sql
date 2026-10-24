-- =============================================================================
-- Neural Proof: Complete Database Schema Reference (PostgreSQL)
-- Mirrored from backend-java/src/main/resources/db/migration/V1__initial_schema.sql
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. verification_runs
CREATE TABLE verification_runs (
    id UUID PRIMARY KEY,
    owner_session_id VARCHAR(255) NOT NULL,
    input_type VARCHAR(32) NOT NULL CHECK (input_type IN ('PASTED_ANSWER', 'QUESTION')),
    original_input TEXT NOT NULL,
    context_text TEXT,
    generated_answer TEXT,
    generation_model VARCHAR(100),
    mode VARCHAR(16) NOT NULL DEFAULT 'LIVE' CHECK (mode IN ('LIVE', 'MOCK')),
    review_before_verify BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(32) NOT NULL CHECK (status IN (
        'QUEUED', 'EXTRACTING_CLAIMS', 'AWAITING_CLAIM_REVIEW',
        'VERIFYING', 'FINALIZING', 'COMPLETED', 'PARTIAL', 'FAILED', 'TIMED_OUT'
    )),
    current_stage VARCHAR(32),
    overall_summary TEXT,
    summary_method VARCHAR(32),
    warnings JSONB,
    error_code VARCHAR(64),
    error_message TEXT,
    limits_snapshot JSONB,
    input_hash VARCHAR(64),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_ms BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_runs_session_created ON verification_runs (owner_session_id, created_at DESC);
CREATE INDEX idx_runs_input_hash ON verification_runs (input_hash);

-- 2. claims
CREATE TABLE claims (
    id UUID PRIMARY KEY,
    run_id UUID NOT NULL REFERENCES verification_runs(id) ON DELETE CASCADE,
    ordinal INT NOT NULL,
    claim_key VARCHAR(32) NOT NULL,
    original_text TEXT NOT NULL,
    normalized_text TEXT NOT NULL,
    span_start INT,
    span_end INT,
    claim_type VARCHAR(32) NOT NULL,
    is_verifiable BOOLEAN NOT NULL DEFAULT TRUE,
    non_verifiable_reason TEXT,
    is_time_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
    entities JSONB,
    time_context JSONB,
    qualifiers JSONB,
    verification_queries JSONB,
    included BOOLEAN NOT NULL DEFAULT TRUE,
    exclusion_reason TEXT,
    processing_status VARCHAR(32) NOT NULL CHECK (processing_status IN (
        'PENDING', 'SEARCHING', 'FETCHING', 'EVALUATING', 'COMPLETED',
        'RETRIEVAL_FAILED', 'EVALUATION_FAILED', 'EVALUATION_UNAVAILABLE',
        'EXCLUDED', 'SKIPPED_LIMIT'
    )),
    verdict VARCHAR(32) CHECK (verdict IN (
        'SUPPORTED', 'CONTRADICTED', 'PARTIALLY_SUPPORTED', 'INSUFFICIENT_EVIDENCE'
    ) OR verdict IS NULL),
    confidence_label VARCHAR(16),
    confidence_basis TEXT,
    explanation TEXT,
    verdict_rationale TEXT,
    evidence_directness VARCHAR(32),
    temporal_assessment VARCHAR(32),
    claim_ambiguity VARCHAR(32),
    unsupported_parts JSONB,
    needed_qualifications JSONB,
    limitations JSONB,
    error_code VARCHAR(64),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_run_ordinal UNIQUE (run_id, ordinal)
);

CREATE INDEX idx_claims_run_verdict ON claims (run_id, verdict);

-- 3. evidence_sources
CREATE TABLE evidence_sources (
    id UUID PRIMARY KEY,
    run_id UUID NOT NULL REFERENCES verification_runs(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    normalized_url TEXT NOT NULL,
    domain VARCHAR(255) NOT NULL,
    title TEXT,
    publisher TEXT,
    source_class VARCHAR(64) NOT NULL,
    quality_assessment JSONB,
    publication_date VARCHAR(64),
    last_updated_date VARCHAR(64),
    date_origin VARCHAR(32),
    retrieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    retrieval_method VARCHAR(32) NOT NULL,
    retrieval_status VARCHAR(32) NOT NULL,
    failure_reason TEXT,
    snippet TEXT,
    content_text TEXT,
    content_hash VARCHAR(64),
    content_char_count INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_run_normalized_url UNIQUE (run_id, normalized_url)
);

-- 4. claim_evidence
CREATE TABLE claim_evidence (
    id UUID PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES evidence_sources(id) ON DELETE CASCADE,
    passage_id VARCHAR(32) NOT NULL,
    passage_text TEXT NOT NULL,
    char_start INT,
    char_end INT,
    stance VARCHAR(32) NOT NULL CHECK (stance IN ('SUPPORTS', 'CONTRADICTS', 'PARTIAL', 'CONTEXT', 'NOT_CITED')),
    relevance_score DOUBLE PRECISION,
    note TEXT,
    used_in_verdict BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_claim_source_passage UNIQUE (claim_id, source_id, passage_id)
);

-- 5. verification_conflicts
CREATE TABLE verification_conflicts (
    id UUID PRIMARY KEY,
    run_id UUID NOT NULL REFERENCES verification_runs(id) ON DELETE CASCADE,
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    conflict_type VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    side_a_evidence_ids JSONB,
    side_b_evidence_ids JSONB,
    resolution VARCHAR(32) NOT NULL,
    resolution_basis TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. verification_events
CREATE TABLE verification_events (
    id UUID PRIMARY KEY,
    run_id UUID NOT NULL REFERENCES verification_runs(id) ON DELETE CASCADE,
    claim_id UUID,
    stage VARCHAR(32) NOT NULL,
    level VARCHAR(16) NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_run_created ON verification_events (run_id, created_at);

-- 7. retrieval_operations
CREATE TABLE retrieval_operations (
    id UUID PRIMARY KEY,
    run_id UUID NOT NULL REFERENCES verification_runs(id) ON DELETE CASCADE,
    claim_id UUID,
    provider VARCHAR(32) NOT NULL,
    operation VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    http_status INT,
    retry_count INT DEFAULT 0,
    duration_ms DOUBLE PRECISION DEFAULT 0,
    result_count INT DEFAULT 0,
    cache_hit BOOLEAN DEFAULT FALSE,
    error_code VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. claim_reviews
CREATE TABLE claim_reviews (
    id UUID PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    owner_session_id VARCHAR(255) NOT NULL,
    reviewed_verdict VARCHAR(32),
    evidence_relevant BOOLEAN,
    citation_supports_claim BOOLEAN,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
