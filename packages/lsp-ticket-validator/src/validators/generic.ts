import { BaseTicketValidator } from './base';
import {
  Ticket,
  TicketingSystem,
  TicketTemplate,
  ValidationRuleType,
  DiagnosticSeverity
} from '../types';

/**
 * Generic ticket validator
 * Works with any ticketing system using a flat structure
 */
export class GenericTicketValidator extends BaseTicketValidator {
  constructor(template: TicketTemplate) {
    super(template);
  }

  getSystemType(): TicketingSystem {
    return TicketingSystem.GENERIC;
  }

  /**
   * For generic validator, tickets are used as-is
   */
  transformTicket(ticket: Ticket): Ticket {
    return ticket;
  }
}

/**
 * Create a minimal generic ticket template
 */
export function createDefaultGenericTemplate(): TicketTemplate {
  return {
    name: 'Default Generic Template',
    description: 'Basic ticket validation template for any system',
    system: TicketingSystem.GENERIC,
    fields: [
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
            min: 5,
            severity: DiagnosticSeverity.WARNING,
            message: 'Title should be at least 5 characters',
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
            min: 20,
            severity: DiagnosticSeverity.WARNING,
            message: 'Description should be at least 20 characters',
          },
        ],
      },
    ],
  };
}
