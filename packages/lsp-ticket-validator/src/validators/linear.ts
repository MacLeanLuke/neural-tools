import { BaseTicketValidator } from './base';
import {
  Ticket,
  LinearTicket,
  TicketingSystem,
  TicketTemplate,
  ValidationRuleType,
  DiagnosticSeverity
} from '../types';

/**
 * Linear-specific ticket validator
 * Handles Linear's flat structure and team-based organization
 */
export class LinearTicketValidator extends BaseTicketValidator {
  constructor(template: TicketTemplate) {
    super(template);
  }

  getSystemType(): TicketingSystem {
    return TicketingSystem.LINEAR;
  }

  /**
   * Transform generic ticket to Linear format
   */
  transformTicket(ticket: Ticket): LinearTicket {
    // If already in Linear format, return as-is
    if ('teamId' in ticket) {
      return ticket as LinearTicket;
    }

    // Transform generic ticket to Linear format
    const linearTicket: LinearTicket = {
      ...ticket,
      teamId: (ticket as any).teamId || '',
      title: ticket.title,
      description: ticket.description,
    };

    // Map optional fields
    if (ticket.priority) {
      linearTicket.priorityLabel = ticket.priority;
    }

    if (ticket.status) {
      linearTicket.stateId = ticket.status;
    }

    if (ticket.labels && ticket.labels.length > 0) {
      linearTicket.labelIds = ticket.labels;
    }

    // Map Linear-specific fields if present
    if ((ticket as any).estimate !== undefined) {
      linearTicket.estimate = (ticket as any).estimate;
    }

    if ((ticket as any).projectId) {
      linearTicket.projectId = (ticket as any).projectId;
    }

    if ((ticket as any).cycleId) {
      linearTicket.cycleId = (ticket as any).cycleId;
    }

    if ((ticket as any).parentId) {
      linearTicket.parentId = (ticket as any).parentId;
    }

    return linearTicket;
  }
}

/**
 * Create a default Linear ticket template
 */
export function createDefaultLinearTemplate(): TicketTemplate {
  return {
    name: 'Default Linear Template',
    description: 'Standard Linear issue validation template',
    system: TicketingSystem.LINEAR,
    fields: [
      {
        path: 'teamId',
        label: 'Team ID',
        rules: [
          {
            type: ValidationRuleType.REQUIRED,
            severity: DiagnosticSeverity.ERROR,
            message: 'Team ID is required',
          },
          {
            type: ValidationRuleType.PATTERN,
            pattern: '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$',
            severity: DiagnosticSeverity.ERROR,
            message: 'Team ID must be a valid UUID',
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
            max: 255,
            severity: DiagnosticSeverity.ERROR,
            message: 'Title must not exceed 255 characters',
          },
        ],
      },
      {
        path: 'description',
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
        path: 'priorityLabel',
        label: 'Priority',
        rules: [
          {
            type: ValidationRuleType.ENUM,
            values: ['No priority', 'Urgent', 'High', 'Medium', 'Low'],
            severity: DiagnosticSeverity.WARNING,
            message: 'Priority should be one of the standard Linear values',
          },
        ],
      },
      {
        path: 'estimate',
        label: 'Estimate',
        rules: [
          {
            type: ValidationRuleType.PATTERN,
            pattern: '^[0-9]+$',
            severity: DiagnosticSeverity.WARNING,
            message: 'Estimate should be a positive number (story points)',
          },
        ],
      },
      {
        path: 'labelIds',
        label: 'Labels',
        rules: [
          {
            type: ValidationRuleType.MIN_LENGTH,
            min: 1,
            severity: DiagnosticSeverity.INFO,
            message: 'Consider adding labels for better categorization',
          },
        ],
      },
    ],
  };
}
