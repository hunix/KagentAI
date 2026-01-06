# Contributing to Agentic IDE

Thank you for your interest in contributing to **Agentic IDE**! This document provides guidelines and instructions for contributing.

---

## 🤝 Code of Conduct

We are committed to providing a welcoming and inspiring community for all. Please read and adhere to our Code of Conduct.

- Be respectful and inclusive
- Welcome diverse perspectives
- Focus on what is best for the community
- Show empathy towards other community members

---

## 🚀 Getting Started

### Prerequisites

- Node.js 22+
- npm or pnpm
- Git
- VS Code (recommended)

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/hunix/KagentAI.git
cd KagentAI

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Run tests
npm test

# Start development
npm run dev
```

---

## 📝 Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Write clean, well-documented code
- Follow the existing code style
- Add tests for new features
- Update documentation

### 3. Commit Your Changes

```bash
git add .
git commit -m "feat: add your feature description"
```

Use conventional commits:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation
- `style:` for code style changes
- `refactor:` for refactoring
- `test:` for tests
- `chore:` for maintenance

### 4. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub.

---

## 🎯 Contribution Areas

### High Priority
- [ ] Advanced embeddings integration
- [ ] Real-time collaboration features
- [ ] Custom agent creation framework
- [ ] Performance optimizations
- [ ] Security enhancements

### Medium Priority
- [ ] Additional tool implementations
- [ ] UI/UX improvements
- [ ] Documentation enhancements
- [ ] Test coverage expansion
- [ ] Example projects

### Low Priority
- [ ] Code style improvements
- [ ] Comment enhancements
- [ ] Minor bug fixes
- [ ] Dependency updates

---

## 🧪 Testing

### Run Tests

```bash
npm test
```

### Run Specific Test Suite

```bash
npm test -- agents.test.ts
npm test -- integration.test.ts
```

### Generate Coverage Report

```bash
npm test -- --coverage
```

### Write Tests

- Create test files in `src/__tests__/`
- Follow existing test patterns
- Aim for 80%+ coverage
- Test both success and failure cases

---

## 📚 Code Style

### TypeScript Guidelines

```typescript
// Use strict types
const value: string = "example";

// Use interfaces for objects
interface MyInterface {
  property: string;
  method(): void;
}

// Use enums for constants
enum Status {
  Active = "active",
  Inactive = "inactive",
}

// Use async/await
async function fetchData(): Promise<void> {
  try {
    const data = await someAsyncOperation();
  } catch (error) {
    console.error(error);
  }
}
```

### Naming Conventions

- **Classes**: PascalCase (e.g., `MyClass`)
- **Functions**: camelCase (e.g., `myFunction`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MY_CONSTANT`)
- **Interfaces**: PascalCase with `I` prefix (e.g., `IMyInterface`)
- **Files**: kebab-case (e.g., `my-file.ts`)

### Documentation

```typescript
/**
 * Brief description of the function
 * 
 * Longer description if needed
 * 
 * @param param1 - Description of param1
 * @param param2 - Description of param2
 * @returns Description of return value
 * @throws Description of exceptions
 * 
 * @example
 * const result = myFunction('value1', 'value2');
 */
function myFunction(param1: string, param2: string): string {
  return `${param1}-${param2}`;
}
```

---

## 🔍 Code Review Process

### What We Look For

1. **Functionality**: Does it work as intended?
2. **Code Quality**: Is it clean and maintainable?
3. **Tests**: Are there adequate tests?
4. **Documentation**: Is it well-documented?
5. **Performance**: Are there performance concerns?
6. **Security**: Are there security concerns?

### Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No console.log statements
- [ ] No hardcoded values
- [ ] Error handling is comprehensive
- [ ] Performance is acceptable

---

## 📦 Adding New Features

### Adding a New Agent

```typescript
// src/agents/my-agent.ts
import { BaseAgent } from './base-agent';

export class MyAgent extends BaseAgent {
  async execute(): Promise<void> {
    // Implementation
  }
}
```

### Adding a New Tool

```typescript
// src/tools/my-tool.ts
export class MyTools {
  async myTool(): Promise<void> {
    // Implementation
  }
}
```

### Adding a New Command

```typescript
// src/commands/my-command.ts
export async function registerMyCommand(): Promise<void> {
  // Implementation
}
```

---

## 🐛 Bug Reports

### Creating a Bug Report

1. Check existing issues first
2. Provide a clear title
3. Describe the bug
4. Provide steps to reproduce
5. Include expected vs actual behavior
6. Include environment details

### Bug Report Template

```markdown
## Description
Brief description of the bug

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: 
- Node.js version:
- npm version:
- Project version:

## Screenshots
If applicable, add screenshots
```

---

## 💡 Feature Requests

### Creating a Feature Request

1. Check existing issues first
2. Provide a clear title
3. Describe the feature
4. Explain the use case
5. Provide examples if possible

### Feature Request Template

```markdown
## Description
Brief description of the feature

## Use Case
Why is this feature needed?

## Proposed Solution
How should it work?

## Examples
Code examples or mockups

## Alternatives
Alternative approaches considered
```

---

## 📖 Documentation

### Update Documentation

- Update relevant `.md` files
- Add code examples
- Update API documentation
- Update deployment guides

### Documentation Structure

```
docs/
├── README.md
├── CONTRIBUTING.md
├── DEPLOYMENT_GUIDE.md
├── guides/
│   ├── getting-started.md
│   ├── configuration.md
│   └── troubleshooting.md
└── api/
    ├── agents.md
    ├── tools.md
    └── state-management.md
```

---

## 🔄 Commit Message Guidelines

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to build process, dependencies, etc.

### Scope

- `agents`: Agent system changes
- `tools`: Tool system changes
- `state`: State management changes
- `api`: API server changes
- `cli`: CLI interface changes
- `docs`: Documentation changes

### Subject

- Use imperative mood ("add" not "added" or "adds")
- Don't capitalize first letter
- No period (.) at the end
- Limit to 50 characters

### Example

```
feat(agents): add custom agent creation framework

Implement framework for users to create custom agents
with predefined interfaces and lifecycle hooks.

Closes #123
```

---

## 🚀 Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes (backward compatible)

### Release Steps

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag
4. Push to GitHub
5. Create GitHub release
6. Publish to npm (if applicable)

---

## 📞 Getting Help

- **Questions**: Open a discussion on GitHub
- **Issues**: Create an issue with detailed information
- **Chat**: Join our community Discord (if available)

---

## 🎓 Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [Git Documentation](https://git-scm.com/doc)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

## 📋 Contributor Recognition

We recognize and appreciate all contributions! Contributors will be:
- Added to `CONTRIBUTORS.md`
- Mentioned in release notes
- Recognized in documentation

---

## ⚖️ License

By contributing to Agentic IDE, you agree that your contributions will be licensed under its MIT License.

---

Thank you for contributing to **Agentic IDE**! 🎉

Together, we're building the future of AI development environments.
