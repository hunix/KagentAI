/**
 * Agent Types and Interfaces
 * 
 * Defines the core types for the multi-agent orchestration system
 */

/**
 * Agent role types
 */
export type AgentRole = 'planner' | 'architect' | 'coder' | 'tester' | 'reviewer';

/**
 * Task status
 */
export type TaskStatus = 'pending' | 'planning' | 'executing' | 'verifying' | 'complete' | 'failed' | 'paused';

/**
 * Agent status
 */
export type AgentStatus = 'idle' | 'planning' | 'executing' | 'waiting_for_feedback' | 'complete' | 'error';

/**
 * Artifact types
 */
export type ArtifactType = 'plan' | 'implementation_plan' | 'code_patch' | 'screenshot' | 'walkthrough' | 'reasoning';

/**
 * User feedback on artifacts
 */
export interface UserFeedback {
  id: string;
  artifactId: string;
  author: string;
  comment: string;
  timestamp: number;
  resolved: boolean;
}

/**
 * Artifact - tangible output from agents
 */
export interface Artifact {
  id: string;
  type: ArtifactType;
  agentId: string;
  taskId: string;
  content: any;
  metadata: {
    createdAt: number;
    updatedAt: number;
    version: number;
    summary?: string;
  };
  feedback: UserFeedback[];
}

/**
 * Task plan breakdown
 */
export interface TaskPlan {
  id: string;
  title: string;
  description: string;
  goals: string[];
  approach: string;
  steps: TaskStep[];
  estimatedDuration: string;
  dependencies: string[];
}

/**
 * Individual task step
 */
export interface TaskStep {
  id: string;
  title: string;
  description: string;
  assignedTo?: AgentRole;
  status: 'pending' | 'in_progress' | 'complete' | 'failed';
  dependencies: string[];
  artifacts: string[];
}

/**
 * Implementation plan with file-level details
 */
export interface ImplementationPlan {
  id: string;
  taskId: string;
  steps: ImplementationStep[];
  fileRequirements: FileRequirement[];
  dependencies: Dependency[];
}

/**
 * Implementation step
 */
export interface ImplementationStep {
  id: string;
  title: string;
  description: string;
  files: string[];
  commands?: string[];
  expectedOutput?: string;
}

/**
 * File requirement
 */
export interface FileRequirement {
  path: string;
  purpose: string;
  type: 'create' | 'modify' | 'delete';
  dependencies: string[];
}

/**
 * Dependency information
 */
export interface Dependency {
  name: string;
  version?: string;
  type: 'npm' | 'pip' | 'system' | 'other';
  installCommand?: string;
}

/**
 * Code patch/change
 */
export interface CodePatch {
  id: string;
  filePath: string;
  before: string;
  after: string;
  description: string;
  reasoning: string;
}

/**
 * Test result
 */
export interface TestResult {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  error?: string;
  output?: string;
}

/**
 * Walkthrough step (for testing/verification)
 */
export interface WalkthroughStep {
  id: string;
  title: string;
  description: string;
  action: string;
  expectedResult: string;
  screenshot?: string;
  videoSegment?: string;
  testResults?: TestResult[];
}

/**
 * Agent state
 */
export interface AgentState {
  id: string;
  role: AgentRole;
  taskId: string;
  status: AgentStatus;
  progress: number; // 0-100
  currentStep?: string;
  artifacts: Artifact[];
  errors: ErrorLog[];
  startedAt: number;
  completedAt?: number;
  reasoning: string[];
}

/**
 * Task state
 */
export interface TaskState {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  progress: number; // 0-100
  plan?: TaskPlan;
  implementationPlan?: ImplementationPlan;
  agents: AgentState[];
  artifacts: Artifact[];
  feedback: UserFeedback[];
  errors: ErrorLog[];
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  context: TaskContext;
}

/**
 * Task context (project information)
 */
export interface TaskContext {
  projectPath: string;
  techStack: string[];
  codebaseStructure: string;
  existingPatterns: string[];
  knowledgeBaseEntries: string[];
}

/**
 * Error log
 */
export interface ErrorLog {
  id: string;
  timestamp: number;
  agentId?: string;
  message: string;
  stack?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  resolved: boolean;
  resolution?: string;
}

/**
 * Agent message for communication
 */
export interface AgentMessage {
  id: string;
  from: string; // agent ID
  to: string; // agent ID or 'user'
  type: 'request' | 'response' | 'feedback' | 'notification';
  content: any;
  timestamp: number;
}

/**
 * Tool call result
 */
export interface ToolCallResult {
  toolName: string;
  input: any;
  output: any;
  success: boolean;
  error?: string;
  duration: number;
}

/**
 * Execution log entry
 */
export interface ExecutionLogEntry {
  id: string;
  timestamp: number;
  agentId: string;
  type: 'tool_call' | 'decision' | 'artifact_generated' | 'feedback_received' | 'error';
  content: any;
}

/**
 * Agent execution mode
 */
export type ExecutionMode = 'agent-driven' | 'agent-assisted' | 'review-driven' | 'custom';

/**
 * Agent configuration
 */
export interface AgentConfig {
  role: AgentRole;
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  tools: string[];
  executionMode: ExecutionMode;
  verificationCheckpoints?: string[];
}

/**
 * Multi-agent graph configuration
 */
export interface AgentGraphConfig {
  agents: AgentConfig[];
  edges: Array<{
    from: AgentRole;
    to: AgentRole;
    condition?: (state: TaskState) => boolean;
  }>;
  startAgent: AgentRole;
  endAgent: AgentRole;
}
