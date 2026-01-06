# Phase 1 Implementation Guide - Agentic IDE

## Overview

Phase 1 establishes the foundation for Agentic IDE with a fully functional VS Code extension that can connect to any OpenAI-compatible LLM endpoint. This includes model management, configuration, and UI scaffolding.

## What's Included

### 1. Generic OpenAI-Compatible Model Client (`src/models/openai-client.ts`)

A production-ready client that works with ANY OpenAI-compatible API:

**Features:**
- ✅ Chat completions (streaming and non-streaming)
- ✅ Embedding generation
- ✅ Token counting
- ✅ Multi-modal support (text, images)
- ✅ Model listing
- ✅ Connection testing
- ✅ Error handling with detailed messages

**Supports:**
- LM Studio (local GPU server)
- Ollama
- OpenAI
- Azure OpenAI
- Anthropic Claude (via OpenAI adapter)
- Any custom OpenAI-compatible endpoint

**Usage:**
```typescript
import { OpenAIClient } from './models/openai-client';

const client = new OpenAIClient({
  endpoint: 'http://localhost:8000/v1',
  apiKey: 'sk-default',
  model: 'mistral',
  contextWindow: 32000,
  maxTokens: 4096,
  temperature: 0.7,
});

// Simple completion
const response = await client.complete([
  { role: 'user', content: 'Hello, world!' }
]);

// Streaming
for await (const chunk of client.stream([
  { role: 'user', content: 'Tell me a story' }
])) {
  console.log(chunk);
}

// Embeddings
const embeddings = await client.embed('Some text');

// Token counting
const tokens = await client.countTokens('Some text');
```

### 2. Model Manager (`src/models/model-manager.ts`)

Manages multiple LLM profiles and configurations:

**Features:**
- ✅ Multiple model profiles (text, instruct, chat, embedding, multimodal, fine-tuned)
- ✅ Profile switching
- ✅ Connection testing
- ✅ Secure configuration storage
- ✅ Model-specific metadata
- ✅ Specialized client getters (embedding, vision)

**Usage:**
```typescript
import { createModelManager } from './models/model-manager';

const manager = createModelManager(context);

// Switch models
manager.switchProfile('profile-id');

// Get active client
const client = manager.getActiveClient();

// Get specialized clients
const embeddingClient = manager.getEmbeddingClient();
const visionClient = manager.getVisionClient();

// Add new profile
await manager.addProfile({
  id: 'local-mistral',
  name: 'Local Mistral',
  endpoint: 'http://localhost:8000/v1',
  apiKey: 'sk-default',
  modelName: 'mistral',
  metadata: {
    id: 'mistral',
    name: 'Mistral',
    type: 'instruct',
    contextWindow: 32000,
    maxTokens: 4096,
    supportsStreaming: true,
    supportsEmbeddings: false,
    supportsVision: false,
  },
});
```

### 3. Extension Entry Point (`src/extension.ts`)

Main extension activation and initialization:

**Features:**
- ✅ Model manager initialization
- ✅ Connection testing on startup
- ✅ UI provider registration
- ✅ Command registration
- ✅ Status bar integration
- ✅ Error handling

### 4. Model Configuration Command (`src/commands/model-config.ts`)

User-friendly configuration interface:

**Commands:**
- `agentic.configureEndpoint` - Configure LLM endpoint
- `agentic.selectModel` - Switch between models
- `agentic.testConnection` - Test endpoint connectivity
- `agentic.addProfile` - Add new model profile

**Features:**
- ✅ Input validation
- ✅ Connection testing
- ✅ Model listing
- ✅ Secure API key input
- ✅ User feedback

### 5. Agent Commands (`src/commands/agent-commands.ts`)

Placeholder for agent operations (expanded in Phase 2):

**Commands:**
- `agentic.initializeAgent` - Initialize agent
- `agentic.startTask` - Start new task
- `agentic.pauseAgent` - Pause agent
- `agentic.resumeAgent` - Resume agent
- `agentic.cancelTask` - Cancel task

### 6. UI Providers

Three tree view providers for the VS Code sidebar:

**Agent Manager Provider** (`src/ui/agent-manager-provider.ts`)
- Shows active model
- Displays agent status
- Lists running agents (Phase 2+)

**Artifacts Provider** (`src/ui/artifacts-provider.ts`)
- Organizes artifacts by type
- Categories: Plans, Code Patches, Screenshots, Walkthroughs, Reasoning

**Knowledge Base Provider** (`src/ui/knowledge-base-provider.ts`)
- Organizes knowledge by category
- Categories: Code Patterns, Solutions, Context, Embeddings

## Project Structure

```
agentic-ide/
├── src/
│   ├── extension.ts                    # Main extension entry point
│   ├── commands/
│   │   ├── agent-commands.ts          # Agent operations
│   │   └── model-config.ts            # Model configuration
│   ├── models/
│   │   ├── openai-client.ts           # Generic OpenAI-compatible client
│   │   └── model-manager.ts           # Model profile management
│   └── ui/
│       ├── agent-manager-provider.ts  # Agent Manager tree view
│       ├── artifacts-provider.ts      # Artifacts tree view
│       └── knowledge-base-provider.ts # Knowledge Base tree view
├── package.json                        # Extension manifest
├── tsconfig.json                       # TypeScript config
├── .eslintrc.json                     # ESLint config
├── .gitignore
├── README.md
├── .env.example
└── PHASE1_IMPLEMENTATION.md           # This file
```

## Installation & Setup

### 1. Install Dependencies

```bash
cd /home/ubuntu/agentic-ide
npm install
```

### 2. Compile TypeScript

```bash
npm run compile
```

### 3. Run in VS Code

Option A: Debug mode
```bash
# Open in VS Code
code .

# Press F5 to start debugging
```

Option B: Package and install
```bash
npm run package
# Then install the .vsix file in VS Code
```

## Configuration

### Environment Variables

Create a `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` with your LLM endpoint:

```env
OPENAI_API_BASE=http://localhost:8000/v1
OPENAI_API_KEY=sk-default
OPENAI_MODEL=mistral
```

### VS Code Settings

Configure in VS Code settings.json:

```json
{
  "agentic.llm.endpoint": "http://localhost:8000/v1",
  "agentic.llm.apiKey": "sk-default",
  "agentic.llm.model": "mistral",
  "agentic.llm.contextWindow": 32000,
  "agentic.llm.temperature": 0.7,
  "agentic.llm.maxTokens": 4096"
}
```

## Testing the Setup

### 1. Start Your LLM Server

**Using LM Studio:**
```bash
# Open LM Studio
# Load a model (e.g., Mistral)
# Click "Start Server"
# Note the endpoint (usually http://localhost:8000/v1)
```

**Using Ollama:**
```bash
ollama run mistral
```

**Using OpenAI:**
- Get API key from https://platform.openai.com/api-keys

### 2. Configure Agentic IDE

```bash
# Open VS Code with the extension
code /home/ubuntu/agentic-ide

# Press F5 to start debugging
# In the debug window, press Cmd+Shift+P
# Search for "Agentic: Configure LLM Endpoint"
# Enter your endpoint, API key, and model name
```

### 3. Test Connection

```bash
# Press Cmd+Shift+P
# Search for "Agentic: Test Connection"
# You should see a success message
```

### 4. View Status

```bash
# Check the status bar (bottom right)
# Should show "🤖 Agentic"
# Click to select different models
```

## API Reference

### OpenAIClient

```typescript
class OpenAIClient {
  // Completions
  complete(messages: Message[], options?: Partial<OpenAIConfig>): Promise<CompletionResponse>
  stream(messages: Message[], options?: Partial<OpenAIConfig>): AsyncGenerator<string>
  
  // Embeddings
  embed(input: string | string[], model?: string): Promise<EmbeddingResponse>
  
  // Utilities
  countTokens(text: string): Promise<number>
  listModels(): Promise<Array<{ id: string; object: string; owned_by: string }>>
  testConnection(): Promise<boolean>
  
  // Configuration
  updateConfig(config: Partial<OpenAIConfig>): void
  getConfig(): OpenAIConfig
}
```

### ModelManager

```typescript
class ModelManager {
  // Profile Management
  addProfile(profile: ModelProfile): Promise<void>
  removeProfile(profileId: string): Promise<void>
  switchProfile(profileId: string): void
  updateProfile(profileId: string, updates: Partial<ModelProfile>): Promise<void>
  
  // Client Access
  getActiveClient(): OpenAIClient
  getClient(profileId: string): OpenAIClient
  getEmbeddingClient(): OpenAIClient
  getVisionClient(): OpenAIClient
  
  // Profile Info
  getActiveProfile(): ModelProfile
  getAllProfiles(): ModelProfile[]
  getProfilesByType(type: ModelMetadata['type']): ModelProfile[]
  
  // Testing
  testProfile(profileId: string): Promise<boolean>
  listModels(): Promise<Array<{ id: string; object: string; owned_by: string }>>
}
```

## Multi-Model Support

### Supported Model Types

1. **Text Models**
   - For text generation and completion
   - Example: Mistral, Llama 2, Phi

2. **Instruct Models**
   - Fine-tuned for instruction following
   - Example: Mistral-Instruct, Llama 2-Chat

3. **Chat Models**
   - Optimized for conversation
   - Example: GPT-4, Claude

4. **Embedding Models**
   - Generate vector embeddings
   - Example: all-MiniLM-L6-v2, text-embedding-3-small

5. **Multimodal Models**
   - Process text and images
   - Example: LLaVA, GPT-4 Vision

6. **Fine-tuned Models**
   - Custom models trained on specific data
   - Example: Your custom fine-tuned Mistral

### Adding a Custom Model Profile

```typescript
const customProfile: ModelProfile = {
  id: 'my-custom-model',
  name: 'My Custom Model',
  endpoint: 'http://localhost:8000/v1',
  apiKey: 'sk-custom',
  modelName: 'my-custom-mistral',
  metadata: {
    id: 'my-custom-mistral',
    name: 'My Custom Mistral',
    type: 'finetuned',
    contextWindow: 32000,
    maxTokens: 4096,
    supportsStreaming: true,
    supportsEmbeddings: false,
    supportsVision: false,
    description: 'Custom fine-tuned Mistral for my domain',
    tags: ['custom', 'finetuned', 'mistral'],
  },
  temperature: 0.5,
  topP: 0.9,
};

await modelManager.addProfile(customProfile);
```

## Next Steps (Phase 2)

Phase 2 will build on this foundation with:

- [ ] **Agent Orchestration**: LangGraph-based multi-agent system
- [ ] **Artifact Generation**: Create structured outputs (plans, patches, screenshots)
- [ ] **State Management**: Persistent task and agent state
- [ ] **Terminal Integration**: Agent-controlled command execution
- [ ] **Feedback Loop**: Asynchronous feedback incorporation
- [ ] **Knowledge Base**: Context caching and pattern reuse

## Troubleshooting

### Connection Issues

**Problem**: "Cannot connect to endpoint"

**Solutions:**
1. Check endpoint URL is correct (should include `/v1` for OpenAI-compatible APIs)
2. Verify LLM server is running
3. Check firewall/network settings
4. Try `curl http://localhost:8000/v1/models` to test endpoint

### Model Not Found

**Problem**: "Model not found" error

**Solutions:**
1. Verify model name matches what's running on server
2. Use `agentic.listModels` command to see available models
3. Check LM Studio or Ollama interface for loaded model names

### API Key Issues

**Problem**: "Authentication failed"

**Solutions:**
1. For local models, use dummy key like `sk-default`
2. For OpenAI, verify API key is correct
3. Check API key has required permissions

### Performance Issues

**Problem**: Slow responses or timeouts

**Solutions:**
1. Reduce `contextWindow` in settings
2. Reduce `maxTokens` for faster responses
3. Check LLM server resource usage
4. Try smaller model if available

## Contributing

To contribute to Phase 1 or report issues:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [LM Studio Documentation](https://lmstudio.ai/)
- [Ollama Documentation](https://ollama.ai/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Support

- **Issues**: Report on GitHub
- **Questions**: Create a discussion
- **Documentation**: See README.md

---

**Phase 1 Status**: ✅ Complete

**Next Phase**: Phase 2 - Core Agent Features (Weeks 3-4)
