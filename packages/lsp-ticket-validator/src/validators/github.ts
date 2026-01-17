import { BaseTicketValidator } from './base';
import {
  Ticket,
  GitHubIssue,
  TicketingSystem,
  TicketTemplate,
  ValidationRuleType,
  DiagnosticSeverity
} from '../types';

/**
 * GitHub Issues-specific ticket validator
 * Handles GitHub's issue structure and repository-based organization
 */
export class GitHubIssueValidator extends BaseTicketValidator {
  constructor(template: TicketTemplate) {
    super(template);
  }

  getSystemType(): TicketingSystem {
    return TicketingSystem.GITHUB;
  }

  /**
   * Transform generic ticket to GitHub Issue format
   */
  transformTicket(ticket: Ticket): GitHubIssue {
    // If already in GitHub format, return as-is
    if ('owner' in ticket && 'repo' in ticket) {
      return ticket as GitHubIssue;
    }

    // Transform generic ticket to GitHub format
    const githubIssue: GitHubIssue = {
      ...ticket,
      owner: (ticket as any).owner || '',
      repo: (ticket as any).repo || '',
      title: ticket.title,
      body: ticket.description,
    };

    // Map optional fields
    if (ticket.assignee) {
      githubIssue.assignees = [ticket.assignee];
    } else if ((ticket as any).assignees) {
      githubIssue.assignees = (ticket as any).assignees;
    }

    if (ticket.labels && ticket.labels.length > 0) {
      githubIssue.labels = ticket.labels;
    }

    if (ticket.status) {
      githubIssue.state = ticket.status === 'closed' ? 'closed' : 'open';
    }

    if ((ticket as any).milestone !== undefined) {
      githubIssue.milestone = (ticket as any).milestone;
    }

    return githubIssue;
  }

  /**
   * Override field value extraction for GitHub's structure
   */
  protected getFieldValue(ticket: any, path: string): any {
    // Handle GitHub-specific field mappings
    const githubFieldMappings: Record<string, string> = {
      description: 'body',
    };

    // If path matches a mapping, use the GitHub-specific path
    const mappedPath = githubFieldMappings[path] || path;

    return super.getFieldValue(ticket, mappedPath);
  }
}

/**
 * Create a default GitHub Issues template
 */
export function createDefaultGitHubTemplate(): TicketTemplate {
  return {
    name: 'Default GitHub Issues Template',
    description: 'Standard GitHub issue validation template',
    system: TicketingSystem.GITHUB,
    fields: [
      {
        path: 'owner',
        label: 'Repository Owner',
        rules: [
          {
            type: ValidationRuleType.REQUIRED,
            severity: DiagnosticSeverity.ERROR,
            message: 'Repository owner is required',
          },
          {
            type: ValidationRuleType.PATTERN,
            pattern: '^[a-zA-Z0-9-]+$',
            severity: DiagnosticSeverity.ERROR,
            message: 'Repository owner must be a valid GitHub username or organization',
          },
        ],
      },
      {
        path: 'repo',
        label: 'Repository Name',
        rules: [
          {
            type: ValidationRuleType.REQUIRED,
            severity: DiagnosticSeverity.ERROR,
            message: 'Repository name is required',
          },
          {
            type: ValidationRuleType.PATTERN,
            pattern: '^[a-zA-Z0-9-_.]+$',
            severity: DiagnosticSeverity.ERROR,
            message: 'Repository name must be a valid GitHub repository name',
          },
        ],
      },
      {
        path: 'title',
        label: 'Title',
        rules: [
          {
            type: ValidationRuleType.REQUIRED,
            severity: DiagnosticSeverity.ERROR,
            message: 'Title is required',
          },
          {
            type: ValidationRuleType.MIN_LENGTH,
            min: 10,
            severity: DiagnosticSeverity.WARNING,
            message: 'Title should be at least 10 characters for clarity',
          },
          {
            type: ValidationRuleType.MAX_LENGTH,
            max: 256,
            severity: DiagnosticSeverity.ERROR,
            message: 'Title must not exceed 256 characters',
          },
        ],
      },
      {
        path: 'body',
        label: 'Description',
        rules: [
          {
            type: ValidationRuleType.REQUIRED,
            severity: DiagnosticSeverity.ERROR,
            message: 'Description is required',
          },
          {
            type: ValidationRuleType.MIN_LENGTH,
            min: 30,
            severity: DiagnosticSeverity.WARNING,
            message: 'Description should be at least 30 characters for context',
          },
        ],
      },
      {
        path: 'labels',
        label: 'Labels',
        rules: [
          {
            type: ValidationRuleType.MIN_LENGTH,
            min: 1,
            severity: DiagnosticSeverity.INFO,
            message: 'Consider adding labels for better issue categorization',
          },
        ],
      },
      {
        path: 'assignees',
        label: 'Assignees',
        rules: [
          {
            type: ValidationRuleType.MIN_LENGTH,
            min: 1,
            severity: DiagnosticSeverity.INFO,
            message: 'Consider assigning the issue to a team member',
          },
        ],
      },
      {
        path: 'state',
        label: 'State',
        rules: [
          {
            type: ValidationRuleType.ENUM,
            values: ['open', 'closed'],
            severity: DiagnosticSeverity.ERROR,
            message: 'State must be either "open" or "closed"',
          },
        ],
      },
    ],
  };
}
