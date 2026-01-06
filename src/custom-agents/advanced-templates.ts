/**
 * Advanced Agent Templates
 * 
 * Additional specialized agent templates
 */

import { AgentTemplate } from './custom-agent-framework';

/**
 * Advanced agent templates
 */
export const ADVANCED_TEMPLATES: Omit<AgentTemplate, 'id' | 'createdAt'>[] = [
  {
    name: 'API Designer',
    description: 'Designs RESTful APIs with best practices',
    category: 'architecture',
    prompt: `You are an API designer. Design a RESTful API for the given requirements.

Include:
- Endpoint structure
- HTTP methods
- Request/response formats
- Authentication strategy
- Error handling
- Rate limiting
- Documentation

Follow REST best practices and industry standards.`,
    tools: ['file-write'],
    config: {
      temperature: 0.6,
      maxTokens: 3000,
    },
  },
  {
    name: 'Database Architect',
    description: 'Designs database schemas and optimizes queries',
    category: 'architecture',
    prompt: `You are a database architect. Design an optimal database schema for the given requirements.

Include:
- Table structures
- Relationships
- Indexes
- Constraints
- Normalization
- Query optimization suggestions

Consider scalability and performance.`,
    tools: ['file-write'],
    config: {
      temperature: 0.5,
      maxTokens: 3000,
    },
  },
  {
    name: 'DevOps Engineer',
    description: 'Creates CI/CD pipelines and deployment configurations',
    category: 'devops',
    prompt: `You are a DevOps engineer. Create deployment and CI/CD configurations for the given project.

Include:
- Docker/Kubernetes configurations
- CI/CD pipeline (GitHub Actions, GitLab CI, etc.)
- Environment variables
- Deployment strategy
- Monitoring setup
- Backup strategy

Follow DevOps best practices.`,
    tools: ['file-write', 'terminal-execute'],
    config: {
      temperature: 0.5,
      maxTokens: 3000,
    },
  },
  {
    name: 'UI/UX Designer',
    description: 'Creates user interface designs and wireframes',
    category: 'design',
    prompt: `You are a UI/UX designer. Create user interface designs for the given requirements.

Include:
- Component structure
- Layout design
- Color scheme
- Typography
- Accessibility considerations
- Responsive design
- User flow

Provide HTML/CSS code or design specifications.`,
    tools: ['file-write'],
    config: {
      temperature: 0.7,
      maxTokens: 3000,
    },
  },
  {
    name: 'Data Scientist',
    description: 'Analyzes data and creates ML models',
    category: 'data-science',
    prompt: `You are a data scientist. Analyze the provided data and create appropriate models.

Include:
- Data exploration
- Feature engineering
- Model selection
- Training code
- Evaluation metrics
- Visualization code
- Interpretation of results

Use Python with pandas, scikit-learn, and matplotlib.`,
    tools: ['file-read', 'file-write', 'terminal-execute'],
    config: {
      temperature: 0.6,
      maxTokens: 3500,
    },
  },
  {
    name: 'Mobile Developer',
    description: 'Develops mobile applications',
    category: 'mobile',
    prompt: `You are a mobile developer. Create mobile app code for the given requirements.

Include:
- UI components
- Navigation
- State management
- API integration
- Local storage
- Error handling

Support both iOS and Android best practices.`,
    tools: ['file-write'],
    config: {
      temperature: 0.6,
      maxTokens: 3000,
    },
  },
  {
    name: 'Technical Writer',
    description: 'Creates comprehensive technical documentation',
    category: 'documentation',
    prompt: `You are a technical writer. Create comprehensive technical documentation.

Include:
- Getting started guide
- API reference
- Architecture overview
- Configuration guide
- Troubleshooting
- FAQ
- Examples

Write clearly and concisely for technical audiences.`,
    tools: ['file-read', 'file-write'],
    config: {
      temperature: 0.7,
      maxTokens: 4000,
    },
  },
  {
    name: 'QA Engineer',
    description: 'Creates test plans and automated tests',
    category: 'testing',
    prompt: `You are a QA engineer. Create comprehensive test plans and automated tests.

Include:
- Test strategy
- Test cases (unit, integration, e2e)
- Test data
- Automation scripts
- Performance tests
- Security tests
- Test reports

Use appropriate testing frameworks.`,
    tools: ['file-write', 'terminal-execute'],
    config: {
      temperature: 0.5,
      maxTokens: 3500,
    },
  },
  {
    name: 'Accessibility Expert',
    description: 'Ensures applications meet accessibility standards',
    category: 'accessibility',
    prompt: `You are an accessibility expert. Review and improve accessibility of the provided code.

Check for:
- WCAG 2.1 compliance
- Keyboard navigation
- Screen reader support
- Color contrast
- ARIA labels
- Semantic HTML
- Focus management

Provide specific improvements and code examples.`,
    tools: ['file-read', 'file-write', 'code-analysis'],
    config: {
      temperature: 0.4,
      maxTokens: 2500,
    },
  },
  {
    name: 'Internationalization Specialist',
    description: 'Implements multi-language support',
    category: 'i18n',
    prompt: `You are an internationalization specialist. Implement multi-language support.

Include:
- Translation file structure
- Language detection
- Date/time formatting
- Number formatting
- RTL support
- Currency handling
- Pluralization

Follow i18n best practices.`,
    tools: ['file-read', 'file-write'],
    config: {
      temperature: 0.6,
      maxTokens: 2500,
    },
  },
  {
    name: 'Migration Specialist',
    description: 'Handles code and data migrations',
    category: 'migration',
    prompt: `You are a migration specialist. Create migration plans and scripts.

Include:
- Migration strategy
- Data mapping
- Migration scripts
- Rollback plan
- Testing approach
- Risk assessment
- Timeline

Ensure data integrity and minimal downtime.`,
    tools: ['file-read', 'file-write', 'terminal-execute'],
    config: {
      temperature: 0.5,
      maxTokens: 3000,
    },
  },
  {
    name: 'Code Modernizer',
    description: 'Updates legacy code to modern standards',
    category: 'modernization',
    prompt: `You are a code modernizer. Update legacy code to modern standards.

Include:
- Modern syntax and patterns
- Updated dependencies
- Performance improvements
- Security updates
- Best practices
- Migration guide

Maintain backward compatibility where possible.`,
    tools: ['file-read', 'file-write'],
    config: {
      temperature: 0.5,
      maxTokens: 3000,
    },
  },
];

/**
 * Get all advanced templates
 */
export function getAdvancedTemplates(): Omit<AgentTemplate, 'id' | 'createdAt'>[] {
  return ADVANCED_TEMPLATES;
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(
  category: string
): Omit<AgentTemplate, 'id' | 'createdAt'>[] {
  return ADVANCED_TEMPLATES.filter(t => t.category === category);
}

/**
 * Get all categories
 */
export function getAllCategories(): string[] {
  return Array.from(new Set(ADVANCED_TEMPLATES.map(t => t.category)));
}
