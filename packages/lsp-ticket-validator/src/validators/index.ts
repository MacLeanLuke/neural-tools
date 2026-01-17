export { BaseTicketValidator } from './base';
export { JiraTicketValidator, createDefaultJiraTemplate } from './jira';
export { LinearTicketValidator, createDefaultLinearTemplate } from './linear';
export { GitHubIssueValidator, createDefaultGitHubTemplate } from './github';
export { GenericTicketValidator, createDefaultGenericTemplate } from './generic';

import { BaseTicketValidator } from './base';
import { JiraTicketValidator, createDefaultJiraTemplate } from './jira';
import { LinearTicketValidator, createDefaultLinearTemplate } from './linear';
import { GitHubIssueValidator, createDefaultGitHubTemplate } from './github';
import { GenericTicketValidator, createDefaultGenericTemplate } from './generic';
import { TicketingSystem, TicketTemplate } from '../types';

/**
 * Factory function to create the appropriate validator for a template
 */
export function createValidator(template: TicketTemplate): BaseTicketValidator {
  switch (template.system) {
    case TicketingSystem.JIRA:
      return new JiraTicketValidator(template);
    case TicketingSystem.LINEAR:
      return new LinearTicketValidator(template);
    case TicketingSystem.GITHUB:
      return new GitHubIssueValidator(template);
    case TicketingSystem.GENERIC:
    default:
      return new GenericTicketValidator(template);
  }
}

/**
 * Get default template for a ticketing system
 */
export function getDefaultTemplate(system: TicketingSystem): TicketTemplate {
  switch (system) {
    case TicketingSystem.JIRA:
      return createDefaultJiraTemplate();
    case TicketingSystem.LINEAR:
      return createDefaultLinearTemplate();
    case TicketingSystem.GITHUB:
      return createDefaultGitHubTemplate();
    case TicketingSystem.GENERIC:
    default:
      return createDefaultGenericTemplate();
  }
}
