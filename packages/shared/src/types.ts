// ===== ASI-1 API Types =====

export interface ASI1Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ASI1Choice {
  message: { role: 'assistant'; content: string };
  finish_reason: 'stop' | 'length';
}

export interface ASI1StreamChoice {
  delta: { role?: string; content?: string };
  finish_reason: 'stop' | 'length' | null;
}

export interface ASI1Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ASI1Response {
  id: string;
  choices: ASI1Choice[];
  usage: ASI1Usage;
}

export interface ASI1StreamResponse {
  id: string;
  choices: ASI1StreamChoice[];
}

export interface ASI1RequestOptions {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

// ===== File System Types =====

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  size?: number;
  language?: string;
}

export interface FileChange {
  path: string;
  originalContent: string;
  fixedContent: string;
  diff?: string;
}

export interface WorkspaceFile {
  path: string;
  content: string;
  language: string;
  isDirty: boolean;
  lastModified: number;
}

// ===== Agent Types =====

export type AgentType = 'security' | 'performance' | 'style' | 'documentation';
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type DocMode = 'gaps' | 'generate' | 'both';

export type SecurityCategory =
  | 'XSS' | 'CSRF' | 'Secrets' | 'Storage' | 'CSP' | 'MixedContent'
  | 'OpenRedirect' | 'PrototypePollution' | 'Dependencies' | 'PostMessage'
  | 'Iframe' | 'Clickjacking' | 'CORS';

export type PerformanceCategory =
  | 'ReRenders' | 'BundleSize' | 'MemoryLeak' | 'Network'
  | 'ImageOptimization' | 'CSSPerformance' | 'Virtualization' | 'Debounce';

export type StyleCategory =
  | 'Naming' | 'Architecture' | 'Accessibility' | 'Duplication'
  | 'ModernJS' | 'ReactBestPractices' | 'FileOrganization' | 'Consistency';

export type FindingCategory = SecurityCategory | PerformanceCategory | StyleCategory | string;

export interface Finding {
  id: string;
  severity: Severity;
  category: FindingCategory;
  file: string;
  lineStart?: number;
  lineEnd?: number;
  title: string;
  description: string;
  exploitScenario?: string;
  currentCode?: string;
  fixedCode?: string;
  fixExplanation?: string;
  references?: string[];
  agent: AgentType;
}

export interface AgentSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface AgentResult {
  agent: AgentType;
  findings: Finding[];
  summary: AgentSummary;
  overallRiskScore: number;
  executionTimeMs: number;
  tokensUsed?: number;
  error?: string;
}

export interface AgentOptions {
  mode?: DocMode;
  quickMode?: boolean;
  maxTokens?: number;
}

export interface AgentProgressEvent {
  agent: string;
  status: 'started' | 'analyzing' | 'complete' | 'error';
  filesProcessed: number;
  totalFiles: number;
  batchIndex: number;
  totalBatches: number;
}

export interface FullReviewResult {
  agentResults: Record<AgentType, AgentResult>;
  mergedFindings: Finding[];
  overallScores: Record<AgentType, number> & { aggregate: number };
  generatedDocs?: Record<string, string>;
  metadata: {
    totalFiles: number;
    totalTokensUsed: number;
    executionTimeMs: number;
    timestamp: string;
  };
}

export interface QuickReviewResult {
  findings: Finding[];
  summary: AgentSummary;
  filePath: string;
}

export interface PRFixSet {
  branchName: string;
  commitMessage: string;
  prTitle: string;
  prBody: string;
  fileChanges: FileChange[];
}

// ===== Chat Types =====

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  tokenCount?: number;
}

export interface ChatRequest {
  message: string;
  history: ASI1Message[];
  stream?: boolean;
}

export interface CompletionRequest {
  prefix: string;
  suffix: string;
  language: string;
  contextFiles?: Array<{ path: string; content: string }>;
}

export interface CompletionResult {
  suggestion: string;
  filePath?: string;
  cursorOffset?: number;
}

// ===== GitHub Types =====

export interface GitHubRepo {
  owner: string;
  repo: string;
  branch?: string;
  url: string;
}

export interface GitHubImportRequest {
  url: string;
  branch?: string;
}

export interface GitHubImportResult {
  fileTree: FileNode[];
  files: Record<string, string>;
  totalFiles: number;
}

export interface PRCreateRequest {
  owner: string;
  repo: string;
  baseBranch: string;
  changes: FileChange[];
  title: string;
  body: string;
}

// ===== WebSocket Event Payloads =====

export interface WSCompletionRequest {
  filePath: string;
  prefix: string;
  suffix: string;
  language: string;
  contextFiles?: Array<{ path: string; content: string }>;
}

export interface WSReviewRequest {
  files: Record<string, string>;
  agents?: AgentType[];
}

export interface WSChatMessage {
  message: string;
  history: ASI1Message[];
}

export interface WSExecuteRequest {
  language: string;
  content: string;
}

// ===== API Response Wrappers =====

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// ===== Settings =====

export interface UserSettings {
  theme: 'dark' | 'light';
  fontSize: number;
  tabSize: number;
  autoSave: boolean;
  aiCompletions: boolean;
  keybindings: 'default' | 'vim' | 'emacs';
  wordWrap: boolean;
  minimap: boolean;
}
