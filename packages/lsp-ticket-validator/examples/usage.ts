import {
  createValidator,
  getDefaultTemplate,
  TicketingSystem,
  Ticket,
  JiraTicket,
  loadConfig,
  getTemplate,
} from '@neural-tools/lsp-ticket-validator';

/**
 * Example 1: Basic validation with default template
 */
function example1_basicValidation() {
  console.log('Example 1: Basic Validation\n');

  // Create a Jira validator with default template
  const template = getDefaultTemplate(TicketingSystem.JIRA);
  const validator = createValidator(template);

  // Create a ticket
  const ticket: Ticket = {
    title: 'Implement user authentication',
    description: 'Add OAuth2 authentication for users with support for Google and GitHub providers',
    project: 'PROJ',
    issueType: 'Task',
    priority: 'High',
    labels: ['backend', 'security'],
  };

  // Validate
  const result = validator.validate(ticket);

  // Get feedback
  const feedback = validator.generateFeedback(result);
  console.log(feedback);
  console.log('\n---\n');
}

/**
 * Example 2: Validation with custom configuration
 */
function example2_customConfig() {
  console.log('Example 2: Custom Configuration\n');

  // Load configuration from file
  const config = loadConfig('./examples/jira-config.json');
  const template = getTemplate(config, 'Jira Standard Template');
  const validator = createValidator(template);

  // Create a ticket that will have warnings
  const ticket: Ticket = {
    title: 'Add feature', // Too short, no tag
    description: 'Need to add this feature', // Too short
    project: 'BACKEND',
    issueType: 'Task',
  };

  const result = validator.validate(ticket);
  const feedback = validator.generateFeedback(result);
  console.log(feedback);
  console.log('\n---\n');
}

/**
 * Example 3: AI Agent workflow - iterative ticket creation
 */
async function example3_aiAgentWorkflow() {
  console.log('Example 3: AI Agent Workflow\n');

  const config = loadConfig('./examples/jira-config.json');
  const template = getTemplate(config, 'Jira Standard Template');
  const validator = createValidator(template);

  // Simulate an AI agent's first attempt
  let ticket: Ticket = {
    title: 'Auth',
    description: 'Add auth',
    project: 'BACKEND',
    issueType: 'Task',
  };

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;
    console.log(`Attempt ${attempts}:`);

    const result = validator.validate(ticket);

    if (result.valid) {
      console.log('✓ Ticket is valid and ready to be created!');
      break;
    }

    // Show feedback
    const feedback = validator.generateFeedback(result);
    console.log(feedback);

    // Simulate AI fixing the issues
    if (attempts < maxAttempts) {
      console.log('\n→ AI is fixing the issues...\n');
      ticket = await simulateAIFix(ticket, result);
    }
  }

  console.log('\n---\n');
}

/**
 * Simulate an AI agent fixing validation issues
 */
async function simulateAIFix(ticket: Ticket, validationResult: any): Promise<Ticket> {
  // In a real scenario, this would call an LLM with the feedback
  // For demo purposes, we'll manually fix the issues

  const fixedTicket: Ticket = {
    ...ticket,
    title: '[FEATURE] Implement comprehensive user authentication system',
    description: `We need to implement a user authentication system with the following requirements:

1. Support for multiple authentication providers (OAuth2)
2. Secure token management (JWT)
3. Session handling and refresh mechanisms
4. Rate limiting for security

This feature is critical for our Q1 roadmap and will enable users to securely access our platform.

Acceptance Criteria:
- Users can authenticate via OAuth2 providers
- JWT tokens are properly validated
- Sessions are managed securely
- Rate limiting prevents abuse`,
    priority: 'High',
    labels: ['backend', 'authentication', 'security'],
  };

  return fixedTicket;
}

/**
 * Example 4: Validating different ticketing systems
 */
function example4_multipleSystemsValidation() {
  console.log('Example 4: Multiple Systems\n');

  // GitHub Issue
  const githubTemplate = getDefaultTemplate(TicketingSystem.GITHUB);
  const githubValidator = createValidator(githubTemplate);

  const githubIssue: Ticket = {
    title: 'Add WebSocket support',
    description: 'Implement WebSocket connections for real-time chat feature',
    owner: 'acme-corp',
    repo: 'backend-api',
    labels: ['enhancement', 'websocket'],
  } as any;

  console.log('GitHub Issue:');
  const githubResult = githubValidator.validate(githubIssue);
  console.log(githubValidator.generateFeedback(githubResult));

  console.log('\n');

  // Linear Issue
  const linearTemplate = getDefaultTemplate(TicketingSystem.LINEAR);
  const linearValidator = createValidator(linearTemplate);

  const linearIssue: Ticket = {
    title: 'Implement GraphQL API',
    description: 'Create GraphQL API for user management',
    teamId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    priorityLabel: 'High',
    estimate: 5,
  } as any;

  console.log('Linear Issue:');
  const linearResult = linearValidator.validate(linearIssue);
  console.log(linearValidator.generateFeedback(linearResult));

  console.log('\n---\n');
}

/**
 * Example 5: Custom validators
 */
function example5_customValidators() {
  console.log('Example 5: Custom Validators\n');

  const template = {
    name: 'Custom Template',
    system: TicketingSystem.JIRA,
    fields: [
      {
        path: 'title',
        label: 'Title',
        rules: [
          {
            type: 'required' as const,
            severity: 'error' as const,
          },
          {
            type: 'custom' as const,
            validator: 'containsJiraTicket',
            severity: 'warning' as const,
            message: 'Title should reference a related Jira ticket',
          },
        ],
      },
    ],
    customValidators: {
      containsJiraTicket: (value: any) => {
        const jiraPattern = /[A-Z]+-\d+/;
        if (jiraPattern.test(value)) {
          return true;
        }
        return 'Title should contain a Jira ticket reference like PROJ-123';
      },
    },
  };

  const validator = createValidator(template);

  const ticket1: Ticket = {
    title: 'Fix bug in authentication',
    description: 'Bug fix',
  };

  const ticket2: Ticket = {
    title: 'Fix bug in authentication (relates to BACKEND-456)',
    description: 'Bug fix',
  };

  console.log('Ticket without Jira reference:');
  console.log(validator.generateFeedback(validator.validate(ticket1)));

  console.log('\nTicket with Jira reference:');
  console.log(validator.generateFeedback(validator.validate(ticket2)));

  console.log('\n---\n');
}

// Run all examples
async function main() {
  console.log('='.repeat(60));
  console.log('LSP Ticket Validator - Usage Examples');
  console.log('='.repeat(60));
  console.log('\n');

  example1_basicValidation();
  example2_customConfig();
  await example3_aiAgentWorkflow();
  example4_multipleSystemsValidation();
  example5_customValidators();

  console.log('All examples completed!');
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}
