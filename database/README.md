# Neural Proof Database Architecture

This directory documents the database schema and Flyway migration strategy for Neural Proof.

## Storage Layer
- **Production Engine**: PostgreSQL 16+
- **Migration Tool**: Flyway (managed via Java Spring Boot in `backend-java/src/main/resources/db/migration`)
- **Key Characteristics**:
  - UUID Primary Keys (`uuid-ossp`)
  - Strict Foreign Key Cascading: Deleting a verification run cleans up all related claims, evidence passages, sources, conflicts, and events.
  - JSONB attributes for structured, extensible attributes (`entities`, `limits_snapshot`, `warnings`, `quality_assessment`).
  - No secrets or credentials are ever persisted.
  - Verification quality labels (`claim_reviews`) stored separately for benchmark measurement.
  - High-performance composite indexes on session history and input deduplication hashes.
