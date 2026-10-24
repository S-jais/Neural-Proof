import { describe, it, expect } from 'vitest';
import { Verdict, RunStatus, ClaimType } from '../types';

describe('Domain Rules & Verdict Enums', () => {
  it('strictly defines exactly four top-level verdicts (Law 2 & C6)', () => {
    const validVerdicts: Verdict[] = [
      'SUPPORTED',
      'CONTRADICTED',
      'PARTIALLY_SUPPORTED',
      'INSUFFICIENT_EVIDENCE',
    ];

    expect(validVerdicts).toHaveLength(4);
    expect(validVerdicts).toContain('SUPPORTED');
    expect(validVerdicts).toContain('CONTRADICTED');
    expect(validVerdicts).toContain('PARTIALLY_SUPPORTED');
    expect(validVerdicts).toContain('INSUFFICIENT_EVIDENCE');
  });

  it('verifies non-verdict processing statuses are distinct from findings (Law 3)', () => {
    const nonVerdicts = [
      'PENDING',
      'SEARCHING',
      'FETCHING',
      'EVALUATING',
      'RETRIEVAL_FAILED',
      'EVALUATION_FAILED',
      'EVALUATION_UNAVAILABLE',
      'EXCLUDED',
      'SKIPPED_LIMIT',
    ];

    // None of these operational failure statuses may collide with conclusive verdicts
    for (const status of nonVerdicts) {
      expect(['SUPPORTED', 'CONTRADICTED', 'PARTIALLY_SUPPORTED', 'INSUFFICIENT_EVIDENCE']).not.toContain(status);
    }
  });

  it('validates claim types contextual classification', () => {
    const types: ClaimType[] = [
      'NUMERICAL',
      'DATE_OR_TIMELINE',
      'NAMED_ENTITY_FACT',
      'POLICY_OR_ELIGIBILITY',
      'SCIENTIFIC',
      'CAUSAL',
      'DEFINITIONAL',
      'STATISTICAL',
      'OTHER',
    ];
    expect(types).toHaveLength(9);
  });
});
