import { describe, it, expect } from 'vitest';
import { api } from '../services/api';

describe('Frontend API Client Service', () => {
  it('instantiates the API client with clean methods', () => {
    expect(api).toBeDefined();
    expect(typeof api.getHealth).toBe('function');
    expect(typeof api.createVerification).toBe('function');
    expect(typeof api.getVerification).toBe('function');
    expect(typeof api.getClaims).toBe('function');
    expect(typeof api.getSources).toBe('function');
    expect(typeof api.getEvents).toBe('function');
    expect(typeof api.getHistory).toBe('function');
    expect(typeof api.deleteVerification).toBe('function');
    expect(typeof api.updateClaimReview).toBe('function');
    expect(typeof api.startVerification).toBe('function');
  });

  it('contains no hardcoded API secrets (Law 5)', () => {
    const apiString = api.toString();
    expect(apiString).not.toMatch(/sk-[a-zA-Z0-9]{20,}/);
    expect(apiString).not.toMatch(/tinyfish-[a-zA-Z0-9]{20,}/);
  });
});
