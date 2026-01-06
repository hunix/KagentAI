# Phase 2 Implementation Guide - Agentic IDE

## Overview

Phase 2 builds on the Phase 1 foundation by implementing the core agent orchestration system, artifact generation, state management, and tool integration.

## What's Included in Phase 2

### 1. Agent Types & Interfaces (`src/agents/agent-types.ts`)

Comprehensive type definitions for:
- **Agent Roles**: planner, architect, coder, tester, reviewer
- **Task Status**: pending, planning, executing, verifying, complete, failed, paused
- **Artifact Types**: plan, implementation_plan, code_patch, screenshot, walkthrough, reasoning
- **State Objects**: TaskState, AgentState, TaskPlan, ImplementationPlan, etc.
- **Execution Models**: agent-driven, agent-assisted, review-driven, custom

### 2. Artifact Generator (`src/artifacts/artifact-generator.ts`)

Creates structured, human-readable artifacts:

**Artifact Types:**
- **Task Plans**: High-level breakdown with goals and approach
- **Implementation Plans**: Detailed file-by-file instructions
- **Code Patches**: Before/after code changes with reasoning
- **Screenshots**: Visual verification of results
- **Walkthroughs**: Step-by-step verification with test results
- **Reasoning**: Agent's thought process and decisions

**Features:**
- Markdown formatting for display
- Artifact versioning and feedback tracking
- Export to markdown
- Summary generation
- Feedback incorporation

### 3. State Manager (`src/state/state-manager.ts`)

Persistent state management with checkpointing:

**Features:**
- Task and agent state creation/updates
- Artifact management
- Feedback tracking
- Error logging
- Execution log history
- Checkpoint system (save/restore)
- State change notifications
- Statistics and analytics
- Import/export functionality

**Key Methods:**
```typescript
// Task management
createTaskState(title, description, projectPath, techStack)
updateTaskState(taskId, updates)
getTaskState(taskId)
deleteTask(taskId)

// Agent management
createAgentState(taskId, role, model)
updateAgentState(agentId, updates)
getAgentState(agentId)

// Artifact management
addArtifact(taskId, artifact)
addFeedback(taskId, artifactId, feedback)

// Checkpointing
createCheckpoint(taskId)
restoreCheckpoint(checkpointId)
listCheckpoints(taskId)

// Notifications
subscribe(taskId, listener)
```

### 4. Tool Registry (`src/tools/tool-registry.ts`)

MCP-based tool access for agents:

**Tool Categories:**
- **File System**: read_file, write_file, list_files
- **Terminal**: execute_command, run_tests
- **Browser**: navigate_url, take_screenshot, click_element
- **Code Analysis**: analyze_code, search_codebase

**Features:**
- Tool registration and management
- Parameter validation
- Tool execution with error handling
- Call history tracking
- Statistics and analytics
- Role-based tool access

**Key Methods:**
```typescript
registerTool(tool)
executeTool(toolName, params)
listToolsForRole(role)
getCallHistory(toolName, limit)
getStatistics()
```

### 5. Prompt Manager (`src/prompts/prompt-manager.ts`)

BAML-style prompt management:

**Default Prompts:**
- **Planner**: Task breakdown and planning
- **Architect**: Implementation planning
- **Coder**: Code generation
- **Tester**: Verification and testing
- **Reviewer**: Code review and quality assurance

**Features:**
- Template registration
- Variable substitution
- Input/output schema validation
- Execution history tracking
- Template statistics
- Example-based learning

**Key Methods:**
```typescript
registerTemplate(template)
renderPrompt(templateId, variables)
validateInput(templateId, input)
validateOutput(templateId, output)
recordExecution(templateId, input, output)
getExecutionHistory(templateId, limit)
```

### 6. Base Agent Class (`src/agents/base-agent.ts`)

Abstract base class for all agents:

**Features:**
- LLM communication (streaming and non-streaming)
- Tool execution
- State management
- Artifact creation
- Error handling
- Reasoning tracking
- Conversation history

**Key Methods:**
```typescript
// Communication
sendMessage(userMessage)
streamMessage(userMessage)

// Tool execution
executeTool(toolName, params)
getAvailableTools()

// State management
updateStatus(status, progress)
addReasoningStep(step)
addArtifact(artifact)
addError(message, severity)

// Lifecycle
execute()
pause()
resume()
cancel()
complete()
```

---

## Architecture Overview

### Component Interaction

```
┌─────────────────────────────────────────────────────────┐
│                  Agent Orchestrator                      │
│              (LangGraph - Phase 3)                       │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   ┌─────────┐  ┌─────────┐  ┌─────────┐
   │ Planner │  │Architect│  │ Coder   │
   │ Agent   │  │ Agent   │  │ Agent   │
   └────┬────┘  └────┬────┘  └────┬────┘
        │            │            │
        └────────────┼────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
   ┌──────────┐ ┌──────────┐ ┌──────────┐
   │ Artifact │ │  State   │ │   Tool   │
   │Generator │ │ Manager  │ │Registry  │
   └──────────┘ └──────────┘ └──────────┘
        │            │            │
        └────────────┼────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
   ┌──────────┐ ┌──────────┐ ┌──────────┐
   │  Prompt  │ │OpenAI    │ │ VS Code  │
   │ Manager  │ │ Client   │ │Extension │
   └──────────┘ └──────────┘ └──────────┘
```

---

## Data Flow

### Task Execution Flow

```
1. User creates task
   └─> StateManager.createTaskState()
   └─> Planner Agent starts

2. Planner Agent executes
   └─> PromptManager.renderPrompt('planner-task-breakdown')
   └─> OpenAIClient.complete()
   └─> ArtifactGenerator.generateTaskPlan()
   └─> StateManager.addArtifact()

3. User provides feedback (optional)
   └─> StateManager.addFeedback()

4. Architect Agent executes
   └─> PromptManager.renderPrompt('architect-implementation-plan')
   └─> OpenAIClient.complete()
   └─> ArtifactGenerator.generateImplementationPlan()

5. Coder Agent executes
   └─> ToolRegistry.executeTool('read_file')
   └─> PromptManager.renderPrompt('coder-generate-code')
   └─> OpenAIClient.complete()
   └─> ToolRegistry.executeTool('write_file')
   └─> ArtifactGenerator.generateCodePatch()

6. Tester Agent executes
   └─> ToolRegistry.executeTool('execute_command')
   └─> ToolRegistry.executeTool('run_tests')
   └─> ArtifactGenerator.generateWalkthrough()

7. Reviewer Agent executes
   └─> ArtifactGenerator.generateReasoning()

8. Task complete
   └─> StateManager.updateTaskState(status: 'complete')
```

---

## Implementation Guide

### Step 1: Set Up Phase 2 Components

All Phase 2 components are already created:

```bash
cd /home/ubuntu/agentic-ide

# Files created:
# - src/agents/agent-types.ts
# - src/artifacts/artifact-generator.ts
# - src/state/state-manager.ts
# - src/tools/tool-registry.ts
# - src/prompts/prompt-manager.ts
# - src/agents/base-agent.ts
```

### Step 2: Implement Specific Agents

Create agent implementations for each role:

```typescript
// src/agents/planner-agent.ts
export class PlannerAgent extends BaseAgent {
  async execute(): Promise<void> {
    // Implement planner logic
  }
}

// src/agents/architect-agent.ts
export class ArchitectAgent extends BaseAgent {
  async execute(): Promise<void> {
    // Implement architect logic
  }
}

// src/agents/coder-agent.ts
export class CoderAgent extends BaseAgent {
  async execute(): Promise<void> {
    // Implement coder logic
  }
}

// src/agents/tester-agent.ts
export class TesterAgent extends BaseAgent {
  async execute(): Promise<void> {
    // Implement tester logic
  }
}

// src/agents/reviewer-agent.ts
export class ReviewerAgent extends BaseAgent {
  async execute(): Promise<void> {
    // Implement reviewer logic
  }
}
```

### Step 3: Implement Tool Execution

Replace stub implementations in ToolRegistry:

```typescript
// File system tools
'read_file': async (params) => {
  // Use VS Code API to read file
  const uri = vscode.Uri.file(params.path);
  const content = await vscode.workspace.fs.readFile(uri);
  return content.toString();
}

// Terminal tools
'execute_command': async (params) => {
  // Execute shell command
  const { exec } = require('child_process');
  return new Promise((resolve, reject) => {
    exec(params.command, (error, stdout, stderr) => {
      if (error) reject(error);
      resolve(stdout);
    });
  });
}

// Browser tools
'navigate_url': async (params) => {
  // Use Playwright to navigate
  await page.goto(params.url);
}
```

### Step 4: Create Agent Orchestrator

Implement LangGraph-based orchestration (Phase 3):

```typescript
// src/agents/agent-orchestrator.ts
export class AgentOrchestrator {
  private agents: Map<AgentRole, BaseAgent>;
  private graph: AgentGraph;
  
  async executeTask(task: TaskState): Promise<void> {
    // Orchestrate agent execution
  }
}
```

### Step 5: Integrate with Extension

Update extension to use Phase 2 components:

```typescript
// src/extension.ts
import { StateManager } from './state/state-manager';
import { ToolRegistry } from './tools/tool-registry';
import { PromptManager } from './prompts/prompt-manager';

export async function activate(context: vscode.ExtensionContext) {
  // ... existing code ...
  
  // Initialize Phase 2 components
  const stateManager = createStateManager();
  const toolRegistry = createToolRegistry();
  const promptManager = createPromptManager();
  
  // Store in context for use in commands
  context.globalState.update('stateManager', stateManager);
  context.globalState.update('toolRegistry', toolRegistry);
  context.globalState.update('promptManager', promptManager);
}
```

---

## Usage Examples

### Create and Execute a Task

```typescript
// Create task
const task = stateManager.createTaskState(
  'Build authentication system',
  'Create a secure user authentication system',
  '/path/to/project',
  ['TypeScript', 'React', 'Node.js']
);

// Create planner agent
const planner = new PlannerAgent(
  'planner',
  task.id,
  modelClient,
  stateManager,
  toolRegistry,
  promptManager
);

// Execute planner
await planner.execute();

// Get artifacts
const taskState = stateManager.getTaskState(task.id);
console.log('Generated artifacts:', taskState.artifacts);
```

### Add Feedback to Artifact

```typescript
const feedback: UserFeedback = {
  id: uuidv4(),
  artifactId: artifact.id,
  author: 'user',
  comment: 'Please add error handling for network failures',
  timestamp: Date.now(),
  resolved: false,
};

stateManager.addFeedback(task.id, artifact.id, feedback);

// Agent can now incorporate feedback
```

### Checkpoint and Restore

```typescript
// Create checkpoint before risky operation
const checkpointId = stateManager.createCheckpoint(task.id);

// If something goes wrong, restore
stateManager.restoreCheckpoint(checkpointId);
```

---

## Testing Phase 2

### Unit Tests

```bash
# Test StateManager
npm test -- src/state/state-manager.test.ts

# Test ArtifactGenerator
npm test -- src/artifacts/artifact-generator.test.ts

# Test ToolRegistry
npm test -- src/tools/tool-registry.test.ts

# Test PromptManager
npm test -- src/prompts/prompt-manager.test.ts
```

### Integration Tests

```typescript
// Test full task execution
describe('Task Execution', () => {
  it('should execute planner agent', async () => {
    const task = stateManager.createTaskState(...);
    const planner = new PlannerAgent(...);
    await planner.execute();
    
    const taskState = stateManager.getTaskState(task.id);
    expect(taskState.artifacts).toHaveLength(1);
    expect(taskState.artifacts[0].type).toBe('plan');
  });
});
```

---

## Next Steps (Phase 3)

Phase 3 will implement:

- [ ] **Agent Orchestrator**: LangGraph-based multi-agent system
- [ ] **Agent Implementations**: Planner, Architect, Coder, Tester, Reviewer
- [ ] **Tool Implementation**: File system, terminal, browser, code analysis
- [ ] **Feedback Loop**: Asynchronous feedback incorporation
- [ ] **Browser Automation**: Playwright integration
- [ ] **Knowledge Base**: Vector search and pattern reuse

---

## Troubleshooting

### State Not Updating

**Problem**: Changes to state don't appear in UI

**Solution**: Make sure to use `updateTaskState()` or `updateAgentState()` methods, not direct mutations

### Artifacts Not Generated

**Problem**: No artifacts appear after agent execution

**Solution**: Ensure agent calls `addArtifact()` method with proper artifact object

### Tool Execution Fails

**Problem**: Tool execution returns error

**Solution**: Check tool parameters match schema, verify tool is implemented

---

## Resources

- [Agent Types](./src/agents/agent-types.ts)
- [Artifact Generator](./src/artifacts/artifact-generator.ts)
- [State Manager](./src/state/state-manager.ts)
- [Tool Registry](./src/tools/tool-registry.ts)
- [Prompt Manager](./src/prompts/prompt-manager.ts)
- [Base Agent](./src/agents/base-agent.ts)

---

**Phase 2 Status**: ✅ Foundation Complete

**Next Phase**: Phase 3 - Agent Orchestration & Implementation (Weeks 5-6)
