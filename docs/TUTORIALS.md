# KagentAI Tutorials

Welcome to the KagentAI tutorials! These guides will help you get started and master the platform.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Building Your First App](#building-your-first-app)
3. [Creating Custom Agents](#creating-custom-agents)
4. [Using the Web Dashboard](#using-the-web-dashboard)
5. [Advanced Configuration](#advanced-configuration)

---

## Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/hunix/KagentAI.git

# Install dependencies
cd KagentAI
npm install

# Build the project
npm run compile
```

### Configuration

1. Copy `.env.example` to `.env`
2. Configure your LLM endpoint (OpenAI, Ollama, LM Studio, etc.)
3. Set up your database path (optional)

---

## Building Your First App

In this tutorial, we'll build a simple "Hello World" CLI tool.

1. **Start KagentAI**:
   ```bash
   npm start
   ```

2. **Enter Task**:
   "Create a Node.js CLI tool that prints 'Hello World' in different colors based on user input."

3. **Watch the Agents**:
   - **Planner** will outline the steps.
   - **Architect** will design the code structure.
   - **Coder** will write the code using `chalk` or `colors`.
   - **Tester** will verify it works.

4. **Run the Result**:
   ```bash
   node hello-world.js --color blue
   ```

---

## Creating Custom Agents

You can create specialized agents for your specific needs.

1. **Define the Template**:
   Create a new file in `src/custom-agents/my-agent.ts`.

   ```typescript
   export const MyAgent = {
     name: 'My Specialized Agent',
     description: 'Does specific things',
     category: 'special',
     prompt: 'You are a specialized agent...',
     tools: ['file-read', 'file-write'],
   };
   ```

2. **Register the Agent**:
   Add it to the `CustomAgentFramework`.

3. **Use the Agent**:
   Select it when starting a new task.

---

## Using the Web Dashboard

The web dashboard provides a visual interface for managing your agents.

1. **Start the Dashboard**:
   ```bash
   npm run dashboard
   ```

2. **Navigate**:
   - **Overview**: See system status and activity.
   - **Agents**: Monitor active agents and their tasks.
   - **Tasks**: View task history and logs.
   - **Settings**: Configure the system.

---

## Advanced Configuration

### Using Local LLMs (Ollama/LM Studio)

1. Set `LLM_PROVIDER=openai` (generic OpenAI compatible)
2. Set `LLM_BASE_URL=http://localhost:11434/v1` (for Ollama)
3. Set `LLM_MODEL=mistral` (or your model name)
4. Set `LLM_API_KEY=any` (if not required)

### Database Integration

KagentAI supports SQLite and PostgreSQL.

1. Set `DB_TYPE=sqlite`
2. Set `DB_PATH=./data/kagent.db`

For PostgreSQL:
1. Set `DB_TYPE=postgres`
2. Set `DB_URL=postgresql://user:pass@localhost:5432/kagent`
