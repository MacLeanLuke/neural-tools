import { BaseTicketValidator } from './base';
import {
  Ticket,
  JiraTicket,
  TicketingSystem,
  TicketTemplate,
  ValidationRuleType,
  DiagnosticSeverity
} from '../types';

/**
 * Jira-specific ticket validator
 * Handles Jira's nested field structure and specific requirements
 */
export class JiraTicketValidator extends BaseTicketValidator {
  constructor(template: TicketTemplate) {
    super(template);
  }

  getSystemType(): TicketingSystem {
    return TicketingSystem.JIRA;
  }

  /**
   * Transform generic ticket to Jira format
   */
  transformTicket(ticket: Ticket): JiraTicket {
    // If already in Jira format, return as-is
    if ('fields' in ticket && typeof ticket.fields === 'object') {
      return ticket as JiraTicket;
    }

    // Transform generic ticket to Jira format
    const jiraTicket: JiraTicket = {
      ...ticket,
      project: (ticket as any).project || '',
      issueType: (ticket as any).issueType || 'Task',
      fields: {
        summary: ticket.title,
        description: ticket.description,
        issuetype: {
          name: (ticket as any).issueType || 'Task',
        },
        project: {
          key: (ticket as any).project || '',
        },
      },
    };

    // Map optional fields
    if (ticket.priority) {
      jiraTicket.fields.priority = { name: ticket.priority };
    }

    if (ticket.assignee) {
      jiraTicket.fields.assignee = { accountId: ticket.assignee };
    }

    if (ticket.labels && ticket.labels.length > 0) {
      jiraTicket.fields.labels = ticket.labels;
    }

    // Map any additional fields
    Object.keys(ticket).forEach((key) => {
      if (!['title', 'description', 'status', 'priority', 'assignee', 'labels', 'id'].includes(key)) {
        jiraTicket.fields[key] = ticket[key];
      }
    });

    return jiraTicket;
  }

  /**
   * Override field value extraction for Jira's nested structure
   */
  protected getFieldValue(ticket: any, path: string): any {
    // Handle Jira-specific field mappings
    const jiraFieldMappings: Record<string, string> = {
      title: 'fields.summary',
      description: 'fields.description',
      project: 'fields.project.key',
      issueType: 'fields.issuetype.name',
      priority: 'fields.priority.name',
      assignee: 'fields.assignee.accountId',
      labels: 'fields.labels',
      components: 'fields.components',
      fixVersions: 'fields.fixVersions',
    };

    // If path matches a mapping, use the Jira-specific path
    const mappedPath = jiraFieldMappings[path] || path;

    return super.getFieldValue(ticket, mappedPath);
  }
}

/**
 * Create a default Jira ticket template
 */
export function createDefaultJiraTemplate(): TicketTemplate {
  return {
    name: 'Default Jira Template',
    description: 'Standard Jira ticket validation template',
    system: TicketingSystem.JIRA,
    fields: [
      {
        path: 'fields.summary',
        label: 'Summary',
        rules: [
          {
            type: ValidationRuleType.REQUIRED,
            severity: DiagnosticSeverity.ERROR,
            message: 'Summary is required',
          },
          {
            type: ValidationRuleType.MIN_LENGTH,
            min: 10,
            severity: DiagnosticSeverity.WARNING,
            message: 'Summary should be at least 10 characters for clarity',
          },
          {
            type: ValidationRuleType.MAX_LENGTH,
            max: 255,
            severity: DiagnosticSeverity.ERROR,
            message: 'Summary must not exceed 255 characters',
          },
        ],
      },
      {
        path: 'fields.description',
        label: 'Description',
        rules: [
          {
            type: ValidationRuleType.REQUIRED,
            severity: DiagnosticSeverity.ERROR,
            message: 'Description is required',
          },
          {
            type: ValidationRuleType.MIN_LENGTH,
            min: 50,
            severity: DiagnosticSeverity.WARNING,
            message: 'Description should be at least 50 characters for proper context',
          },
        ],
      },
      {
        path: 'fields.project.key',
        label: 'Project Key',
        rules: [
          {
            type: ValidationRuleType.REQUIRED,
            severity: DiagnosticSeverity.ERROR,
            message: 'Project key is required',
          },
          {
            type: ValidationRuleType.PATTERN,
            pattern: '^[A-Z]{2,10}$',
            severity: DiagnosticSeverity.ERROR,
            message: 'Project key must be 2-10 uppercase letters',
          },
        ],
      },
      {
        path: 'fields.issuetype.name',
        label: 'Issue Type',
        rules: [
          {
            type: ValidationRuleType.REQUIRED,
            severity: DiagnosticSeverity.ERROR,
            message: 'Issue type is required',
          },
          {
            type: ValidationRuleType.ENUM,
            values: ['Task', 'Bug', 'Story', 'Epic', 'Subtask'],
            severity: DiagnosticSeverity.ERROR,
            message: 'Issue type must be one of the standard types',
          },
        ],
      },
      {
        path: 'fields.priority.name',
        label: 'Priority',
        rules: [
          {
            type: ValidationRuleType.ENUM,
            values: ['Highest', 'High', 'Medium', 'Low', 'Lowest'],
            severity: DiagnosticSeverity.WARNING,
            message: 'Priority should be one of the standard values',
          },
        ],
      },
      {
        path: 'fields.labels',
        label: 'Labels',
        rules: [
          {
            type: ValidationRuleType.MIN_LENGTH,
            min: 1,
            severity: DiagnosticSeverity.INFO,
            message: 'Consider adding labels for better organization',
          },
        ],
      },
    ],
  };
}
