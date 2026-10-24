import { VerificationRun, Claim, EvidenceSource, PipelineEvent, HealthStatus } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

class ApiError extends Error {
  code: string;
  correlationId?: string;
  details?: string[];

  constructor(message: string, code: string, correlationId?: string, details?: string[]) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.correlationId = correlationId;
    this.details = details;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorData: any = {};
    try {
      errorData = await res.json();
    } catch {
      errorData = { message: res.statusText, code: `HTTP_${res.status}` };
    }
    throw new ApiError(
      errorData.message || 'An unexpected error occurred',
      errorData.code || `HTTP_${res.status}`,
      errorData.correlationId,
      errorData.details
    );
  }
  return res.json();
}

export const api = {
  async getHealth(): Promise<HealthStatus> {
    const res = await fetch(`${API_BASE}/health`, { credentials: 'include' });
    return handleResponse<HealthStatus>(res);
  },

  async createVerification(data: {
    inputType: 'PASTED_ANSWER' | 'QUESTION';
    text: string;
    context?: string;
    reviewClaimsBeforeVerifying?: boolean;
  }): Promise<{ verificationId: string; status: string; mode: string }> {
    const res = await fetch(`${API_BASE}/verifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getVerification(id: string): Promise<VerificationRun> {
    const res = await fetch(`${API_BASE}/verifications/${id}`, { credentials: 'include' });
    return handleResponse<VerificationRun>(res);
  },

  async getClaims(id: string): Promise<Claim[]> {
    const res = await fetch(`${API_BASE}/verifications/${id}/claims`, { credentials: 'include' });
    return handleResponse<Claim[]>(res);
  },

  async updateClaimReview(
    runId: string,
    claimId: string,
    data: { included?: boolean; exclusionReason?: string }
  ): Promise<Claim> {
    const res = await fetch(`${API_BASE}/verifications/${runId}/claims/${claimId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<Claim>(res);
  },

  async startVerification(runId: string, includedClaimIds?: string[]): Promise<any> {
    const res = await fetch(`${API_BASE}/verifications/${runId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ includedClaimIds }),
    });
    return handleResponse(res);
  },

  async getSources(id: string): Promise<EvidenceSource[]> {
    const res = await fetch(`${API_BASE}/verifications/${id}/sources`, { credentials: 'include' });
    return handleResponse<EvidenceSource[]>(res);
  },

  async getEvents(id: string, after?: string): Promise<PipelineEvent[]> {
    const url = after
      ? `${API_BASE}/verifications/${id}/events?after=${encodeURIComponent(after)}`
      : `${API_BASE}/verifications/${id}/events`;
    const res = await fetch(url, { credentials: 'include' });
    return handleResponse<PipelineEvent[]>(res);
  },

  async getHistory(page = 0, size = 10, status?: string): Promise<{ content: VerificationRun[]; totalElements: number }> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) params.append('status', status);
    const res = await fetch(`${API_BASE}/verifications?${params.toString()}`, { credentials: 'include' });
    return handleResponse(res);
  },

  async deleteVerification(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/verifications/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error('Failed to delete verification');
    }
  },
};
