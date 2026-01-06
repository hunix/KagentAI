# Agentic IDE

An agent-first AI development environment built as a VS Code extension. Combines the best of Lovable AI and Google Antigravity with support for any OpenAI-compatible LLM endpoint.

## Features

### 🤖 Agent-First Architecture
- Autonomous agents handle complex development tasks
- Multi-agent coordination (Planner, Architect, Coder, Tester, Reviewer)
- Asynchronous workflows - don't wait for agent completion

### 🎯 Artifact-Based Verification
- Transparent task plans and implementation steps
- Code patches with before/after comparisons
- Screenshots and video walkthroughs
- Structured reasoning logs
- Google Docs-style feedback on artifacts

### 🔌 Universal LLM Support
- **OpenAI-Compatible API**: Works with any OpenAI-compatible endpoint
- **LM Studio**: Local GPU server with text, instruct, multi-modal, fine-tuned models
- **Ollama**: Local model serving
- **OpenAI**: Direct integration
- **Custom Endpoints**: Any OpenAI-compatible API

### 📊 Multi-Modal Capabilities
- Text generation and completion
- Image understanding and analysis
- Embedding generation and vector search
- Fine-tuned model support
- Custom model configurations

### 🎨 Integrated Development Environment
- **Editor**: VS Code editor with AI enhancements
- **Terminal**: Agent-controlled command execution
- **Browser**: Automated testing and verification
- **Agent Manager**: Mission control for multi-agent orchestration
- **Artifacts Panel**: View and provide feedback on generated outputs
- **Knowledge Base**: Reusable patterns and context

## Installation

### Prerequisites
- VS Code 1.95+
- Node.js 18+
- An OpenAI-compatible LLM endpoint (e.g., LM Studio, Ollama, OpenAI)

### Setup

1. **Install the extension**
   ```bash
   # Clone the repository
   git clone https://github.com/yourusername/agentic-ide.git
   cd agentic-ide

   # Install dependencies
   npm install

   # Build the extension
   npm run compile
   ```

2. **Configure your LLM endpoint**
   - Open VS Code
   - Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
   - Search for "Agentic: Configure LLM Endpoint"
   - Enter your endpoint URL (e.g., `http://localhost:8000/v1`)
   - Enter your API key (can be dummy for local models)
   - Enter the model name

3. **Test the connection**
   - Press `Cmd+Shift+P` and search for "Agentic: Test Connection"
   - You should see a success message if connected

## Quick Start

### Starting Your First Task

1. Press `Cmd+Shift+P` and search for "Agentic: Start New Task"
2. Describe what you want to build (e.g., "Create a React component for user authentication")
3. Watch the Agent Manager panel as agents work on your task
4. Review artifacts as they're generated
5. Provide feedback on artifacts to guide agent behavior

### Configuring Models

#### Using LM Studio (Recommended for Local Development)

1. **Download and install LM Studio**
   - Visit https://lmstudio.ai/
   - Download for your platform

2. **Load a model**
   - Open LM Studio
   - Search for and download a model (e.g., Mistral, Llama 2)
   - Load the model

3. **Start the local server**
   - Click "Start Server"
   - Note the endpoint (usually `http://localhost:8000/v1`)

4. **Configure in Agentic IDE**
   - Press `Cmd+Shift+P` → "Agentic: Configure LLM Endpoint"
   - Endpoint: `http://localhost:8000/v1`
   - API Key: `sk-default` (or any value)
   - Model: The model name you loaded (e.g., `mistral`)

#### Using Ollama

1. **Install Ollama**
   ```bash
   curl https://ollama.ai/install.sh | sh
   ```

2. **Run a model**
   ```bash
   ollama run mistral
   ```

3. **Configure in Agentic IDE**
   - Endpoint: `http://localhost:11434/api/generate`
   - API Key: `sk-default`
   - Model: `mistral`

#### Using OpenAI

1. **Get your API key**
   - Visit https://platform.openai.com/api-keys
   - Create a new API key

2. **Configure in Agentic IDE**
   - Endpoint: `https://api.openai.com/v1`
   - API Key: Your OpenAI API key
   - Model: `gpt-4` or `gpt-3.5-turbo`

## Configuration

### Settings

Configure Agentic IDE in VS Code settings:

```json
{
  "agentic.llm.endpoint": "http://localhost:8000/v1",
  "agentic.llm.apiKey": "sk-default",
  "agentic.llm.model": "mistral",
  "agentic.llm.contextWindow": 32000,
  "agentic.llm.temperature": 0.7,
  "agentic.llm.maxTokens": 4096,
  "agentic.embedding.endpoint": "http://localhost:8000/v1",
  "agentic.embedding.model": "embedding-model",
  "agentic.agent.defaultMode": "agent-assisted",
  "agentic.agent.enableBrowserAutomation": true,
  "agentic.agent.enableKnowledgeBase": true
}
```

### Agent Execution Modes

- **Agent-Driven**: Agent has full autonomy, no interruptions
- **Agent-Assisted**: Agent pauses at verification checkpoints (recommended)
- **Review-Driven**: Strict human control, agent proposes everything
- **Custom**: Mix modes task-by-task

## Architecture

### Components

- **Model Client**: Generic OpenAI-compatible LLM interface
- **Model Manager**: Handles multiple model profiles and switching
- **Agent Orchestrator**: LangGraph-based multi-agent system
- **Artifact Generator**: Creates human-readable outputs
- **Tool Registry**: MCP-based tool access (file system, terminal, browser)
- **State Manager**: Persistent task and agent state
- **Knowledge Base**: Context caching and pattern reuse

### Data Flow

```
User Task
  ↓
Planner Agent (create plan)
  ↓
Architect Agent (break down into steps)
  ↓
Coder Agent (generate code)
  ↓
Tester Agent (verify and test)
  ↓
Reviewer Agent (quality check)
  ↓
Display Artifacts & Feedback Loop
```

## Commands

| Command | Description |
|---------|-------------|
| `agentic.configureEndpoint` | Configure LLM endpoint |
| `agentic.selectModel` | Switch between model profiles |
| `agentic.testConnection` | Test connection to LLM endpoint |
| `agentic.startTask` | Start a new agent task |
| `agentic.pauseAgent` | Pause running agent |
| `agentic.resumeAgent` | Resume paused agent |
| `agentic.cancelTask` | Cancel current task |

## Development

### Building

```bash
# Compile TypeScript
npm run compile

# Watch mode
npm run watch

# Lint
npm run lint
```

### Testing

```bash
npm run test
```

### Packaging

```bash
# Create VSIX package
npm run package

# Publish to marketplace
npm run publish
```

## Roadmap

### Phase 1: Foundation ✓
- [x] VS Code extension scaffold
- [x] Generic OpenAI-compatible model client
- [x] Model manager with multi-profile support
- [x] Configuration system
- [x] UI providers (Agent Manager, Artifacts, Knowledge Base)

### Phase 2: Core Features
- [ ] Agent orchestration (LangGraph)
- [ ] Artifact generation system
- [ ] Terminal integration
- [ ] State persistence
- [ ] Feedback loop system

### Phase 3: Advanced Features
- [ ] Browser automation
- [ ] Multi-agent coordination
- [ ] Knowledge base implementation
- [ ] Vector search
- [ ] Fine-tuned model support

### Phase 4: Optimization
- [ ] Performance tuning
- [ ] Error handling and recovery
- [ ] Security hardening
- [ ] Comprehensive testing

### Phase 5: Deployment
- [ ] Package as desktop app
- [ ] VS Code Marketplace publication
- [ ] Documentation and guides
- [ ] Community support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Support

- **Issues**: Report bugs and request features on GitHub
- **Documentation**: https://github.com/yourusername/agentic-ide/wiki
- **Community**: Join our Discord server (link coming soon)

## Acknowledgments

- Inspired by [Lovable AI](https://lovable.ai/)
- Inspired by [Google Antigravity](https://antigravity.dev/)
- Built on [VS Code](https://code.visualstudio.com/)
- Uses [LangChain](https://langchain.com/) for agent orchestration

## References

- [VS Code Extension API](https://code.visualstudio.com/api)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [LM Studio](https://lmstudio.ai/)
- [Ollama](https://ollama.ai/)
