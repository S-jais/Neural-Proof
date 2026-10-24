export type VerdictType =
  | 'SUPPORTED'
  | 'CONTRADICTED'
  | 'PARTIALLY_SUPPORTED'
  | 'INSUFFICIENT_EVIDENCE';

export type ClaimProcessingStatus =
  | 'PENDING'
  | 'SEARCHING'
  | 'FETCHING'
  | 'EVALUATING'
  | 'COMPLETED'
  | 'RETRIEVAL_FAILED'
  | 'EVALUATION_FAILED'
  | 'EVALUATION_UNAVAILABLE'
  | 'EXCLUDED'
  | 'SKIPPED_LIMIT';

export type RunStatus =
  | 'QUEUED'
  | 'EXTRACTING_CLAIMS'
  | 'AWAITING_CLAIM_REVIEW'
  | 'VERIFYING'
  | 'FINALIZING'
  | 'COMPLETED'
  | 'PARTIAL'
  | 'FAILED'
  | 'TIMED_OUT';

export interface ClaimEvidence {
  id: string;
  passageId: string;
  passageText: string;
  charStart?: number;
  charEnd?: number;
  stance: 'SUPPORTS' | 'CONTRADICTS' | 'PARTIAL' | 'CONTEXT' | 'NOT_CITED';
  relevanceScore?: number;
  note?: string;
  usedInVerdict: boolean;
  sourceId: string;
  sourceUrl: string;
  sourceDomain: string;
  sourceTitle?: string;
  sourceClass?: string;
  publicationDate?: string;
  lastUpdatedDate?: string;
  retrievalMethod?: string;
}

export interface Claim {
  id: string;
  ordinal: number;
  claimKey: string;
  originalText: string;
  normalizedText: string;
  spanStart?: number;
  spanEnd?: number;
  claimType: string;
  isVerifiable: boolean;
  nonVerifiableReason?: string;
  isTimeSensitive: boolean;
  entities: string[];
  timeContext?: string;
  qualifiers: string[];
  included: boolean;
  exclusionReason?: string;
  processingStatus: ClaimProcessingStatus;
  verdict?: VerdictType;
  confidenceLabel?: 'LOW' | 'MEDIUM' | 'HIGH';
  confidenceBasis?: string;
  explanation?: string;
  verdictRationale?: string;
  evidenceDirectness?: string;
  temporalAssessment?: string;
  claimAmbiguity?: string;
  unsupportedParts?: string[];
  neededQualifications?: string[];
  limitations?: string[];
  evidence: ClaimEvidence[];
  errorCode?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface EvidenceSource {
  id: string;
  url: string;
  normalizedUrl: string;
  domain: string;
  title?: string;
  publisher?: string;
  sourceClass: string;
  publicationDate?: string;
  lastUpdatedDate?: string;
  dateOrigin?: string;
  retrievedAt: string;
  retrievalMethod: string;
  retrievalStatus: string;
  failureReason?: string;
  snippet?: string;
  contentCharCount?: number;
}

export interface Conflict {
  id: string;
  claimId: string;
  conflictType: string;
  description: string;
  sideAPassageIds?: string[];
  sideBPassageIds?: string[];
  resolution: string;
  resolutionBasis?: string;
  createdAt: string;
}

export interface PipelineEvent {
  id: string;
  claimId?: string;
  stage: string;
  level: string;
  message: string;
  createdAt: string;
}

export interface VerificationRun {
  id: string;
  status: RunStatus;
  currentStage?: string;
  mode: 'LIVE' | 'MOCK';
  inputType: 'PASTED_ANSWER' | 'QUESTION';
  originalInput: string;
  contextText?: string;
  generatedAnswer?: string;
  generationModel?: string;
  reviewBeforeVerify: boolean;
  summary: {
    text?: string;
    method?: string;
  };
  counts: {
    totalClaims: number;
    includedClaims: number;
    supported: number;
    contradicted: number;
    partiallySupported: number;
    insufficientEvidence: number;
    notCompleted: number;
  };
  claims: Claim[];
  conflicts: Conflict[];
  warnings: string[];
  errorCode?: string;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  createdAt: string;
}

export interface HealthStatus {
  status: string;
  database: string;
  aiPipeline: string;
  tinyFish: string;
  llm: string;
  timestamp: string;
}
