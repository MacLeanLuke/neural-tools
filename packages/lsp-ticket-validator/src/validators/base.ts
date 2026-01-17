import {
  Ticket,
  TicketTemplate,
  TicketValidationResult,
  FieldValidationResult,
  DiagnosticSeverity,
  ValidationRule,
  ValidationRuleType,
  RequiredRule,
  PatternRule,
  MinLengthRule,
  MaxLengthRule,
  EnumRule,
  CustomRule,
  NestedRule,
  TicketingSystem,
} from '../types';

/**
 * Abstract base class for ticket validators
 * All ticket system-specific validators should extend this class
 */
export abstract class BaseTicketValidator {
  protected template: TicketTemplate;
  protected customValidators: Map<string, (value: any) => boolean | string>;

  constructor(template: TicketTemplate) {
    this.template = template;
    this.customValidators = new Map();

    // Register custom validators if provided
    if (template.customValidators) {
      Object.entries(template.customValidators).forEach(([name, fn]) => {
        this.customValidators.set(name, fn as (value: any) => boolean | string);
      });
    }
  }

  /**
   * Get the ticketing system type this validator supports
   */
  abstract getSystemType(): TicketingSystem;

  /**
   * Transform generic ticket to system-specific format
   */
  abstract transformTicket(ticket: Ticket): any;

  /**
   * Extract field value using JSONPath-like syntax
   */
  protected getFieldValue(ticket: any, path: string): any {
    const parts = path.split('.');
    let value = ticket;

    for (const part of parts) {
      // Handle array notation like "labels[*]"
      if (part.includes('[')) {
        const [field, indexPart] = part.split('[');
        value = value[field];

        if (!value) return undefined;

        // Handle [*] for all array elements
        if (indexPart === '*]') {
          return value;
        }

        // Handle specific index
        const index = parseInt(indexPart.replace(']', ''));
        if (!isNaN(index)) {
          value = value[index];
        }
      } else {
        value = value[part];
      }

      if (value === undefined) {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Validate a single field against its rules
   */
  protected validateField(
    ticket: any,
    fieldPath: string,
    rules: ValidationRule[],
    fieldLabel?: string
  ): FieldValidationResult[] {
    const results: FieldValidationResult[] = [];
    const value = this.getFieldValue(ticket, fieldPath);
    const label = fieldLabel || fieldPath;

    for (const rule of rules) {
      const result = this.validateRule(value, rule, label, fieldPath);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Validate a value against a single rule
   */
  protected validateRule(
    value: any,
    rule: ValidationRule,
    label: string,
    path: string
  ): FieldValidationResult | null {
    switch (rule.type) {
      case ValidationRuleType.REQUIRED:
        return this.validateRequired(value, rule as RequiredRule, label, path);

      case ValidationRuleType.PATTERN:
        return this.validatePattern(value, rule as PatternRule, label, path);

      case ValidationRuleType.MIN_LENGTH:
        return this.validateMinLength(value, rule as MinLengthRule, label, path);

      case ValidationRuleType.MAX_LENGTH:
        return this.validateMaxLength(value, rule as MaxLengthRule, label, path);

      case ValidationRuleType.ENUM:
        return this.validateEnum(value, rule as EnumRule, label, path);

      case ValidationRuleType.CUSTOM:
        return this.validateCustom(value, rule as CustomRule, label, path);

      case ValidationRuleType.NESTED:
        return this.validateNested(value, rule as NestedRule, label, path);

      default:
        return null;
    }
  }

  /**
   * Validate required field
   */
  protected validateRequired(
    value: any,
    rule: RequiredRule,
    label: string,
    path: string
  ): FieldValidationResult | null {
    if (value === undefined || value === null || value === '') {
      return {
        field: label,
        path,
        severity: rule.severity,
        message: rule.message || `${label} is required`,
      };
    }
    return null;
  }

  /**
   * Validate pattern match
   */
  protected validatePattern(
    value: any,
    rule: PatternRule,
    label: string,
    path: string
  ): FieldValidationResult | null {
    if (value === undefined || value === null) {
      return null; // Skip pattern validation if value is missing
    }

    const regex = new RegExp(rule.pattern, rule.flags);
    const stringValue = String(value);

    if (!regex.test(stringValue)) {
      return {
        field: label,
        path,
        severity: rule.severity,
        message: rule.message || `${label} does not match required pattern: ${rule.pattern}`,
      };
    }

    return null;
  }

  /**
   * Validate minimum length
   */
  protected validateMinLength(
    value: any,
    rule: MinLengthRule,
    label: string,
    path: string
  ): FieldValidationResult | null {
    if (value === undefined || value === null) {
      return null;
    }

    const length = Array.isArray(value) ? value.length : String(value).length;

    if (length < rule.min) {
      return {
        field: label,
        path,
        severity: rule.severity,
        message: rule.message || `${label} must be at least ${rule.min} characters (current: ${length})`,
        suggestedFix: `Minimum length: ${rule.min}`,
      };
    }

    return null;
  }

  /**
   * Validate maximum length
   */
  protected validateMaxLength(
    value: any,
    rule: MaxLengthRule,
    label: string,
    path: string
  ): FieldValidationResult | null {
    if (value === undefined || value === null) {
      return null;
    }

    const length = Array.isArray(value) ? value.length : String(value).length;

    if (length > rule.max) {
      return {
        field: label,
        path,
        severity: rule.severity,
        message: rule.message || `${label} exceeds maximum length of ${rule.max} characters (current: ${length})`,
        suggestedFix: `Maximum length: ${rule.max}`,
      };
    }

    return null;
  }

  /**
   * Validate enum values
   */
  protected validateEnum(
    value: any,
    rule: EnumRule,
    label: string,
    path: string
  ): FieldValidationResult | null {
    if (value === undefined || value === null) {
      return null;
    }

    const stringValue = String(value);

    if (!rule.values.includes(stringValue)) {
      return {
        field: label,
        path,
        severity: rule.severity,
        message: rule.message || `${label} must be one of: ${rule.values.join(', ')}`,
        suggestedFix: `Valid values: ${rule.values.join(', ')}`,
      };
    }

    return null;
  }

  /**
   * Validate using custom validator function
   */
  protected validateCustom(
    value: any,
    rule: CustomRule,
    label: string,
    path: string
  ): FieldValidationResult | null {
    const validator = this.customValidators.get(rule.validator);

    if (!validator) {
      return {
        field: label,
        path,
        severity: DiagnosticSeverity.ERROR,
        message: `Custom validator '${rule.validator}' not found`,
      };
    }

    const result = validator(value);

    if (typeof result === 'string') {
      // Validator returned error message
      return {
        field: label,
        path,
        severity: rule.severity,
        message: result,
      };
    }

    if (result === false) {
      // Validation failed
      return {
        field: label,
        path,
        severity: rule.severity,
        message: rule.message || `${label} failed custom validation`,
      };
    }

    return null;
  }

  /**
   * Validate nested fields
   */
  protected validateNested(
    value: any,
    rule: NestedRule,
    label: string,
    path: string
  ): FieldValidationResult | null {
    if (value === undefined || value === null || typeof value !== 'object') {
      return {
        field: label,
        path,
        severity: rule.severity,
        message: `${label} must be an object`,
      };
    }

    // Nested validation would be handled by validateField recursively
    // This is a placeholder for nested object validation
    return null;
  }

  /**
   * Main validation method
   */
  public validate(ticket: Ticket): TicketValidationResult {
    const errors: FieldValidationResult[] = [];
    const warnings: FieldValidationResult[] = [];
    const info: FieldValidationResult[] = [];

    // Transform ticket to system-specific format
    const transformedTicket = this.transformTicket(ticket);

    // Validate each field in the template
    for (const fieldConfig of this.template.fields) {
      const results = this.validateField(
        transformedTicket,
        fieldConfig.path,
        fieldConfig.rules,
        fieldConfig.label
      );

      // Categorize results by severity
      for (const result of results) {
        switch (result.severity) {
          case DiagnosticSeverity.ERROR:
            errors.push(result);
            break;
          case DiagnosticSeverity.WARNING:
            warnings.push(result);
            break;
          case DiagnosticSeverity.INFO:
          case DiagnosticSeverity.HINT:
            info.push(result);
            break;
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      info,
      template: this.template.name,
    };
  }

  /**
   * Generate human-readable feedback for model iteration
   */
  public generateFeedback(validationResult: TicketValidationResult): string {
    const lines: string[] = [];

    lines.push(`Ticket Validation Feedback for template: ${validationResult.template}`);
    lines.push('');

    if (validationResult.valid) {
      lines.push('✓ All required fields are valid!');

      if (validationResult.warnings.length > 0) {
        lines.push('');
        lines.push('Warnings:');
        for (const warning of validationResult.warnings) {
          lines.push(`  - ${warning.message}`);
          if (warning.suggestedFix) {
            lines.push(`    Suggestion: ${warning.suggestedFix}`);
          }
        }
      }
    } else {
      lines.push('✗ Validation failed. Please fix the following errors:');
      lines.push('');

      if (validationResult.errors.length > 0) {
        lines.push('Errors:');
        for (const error of validationResult.errors) {
          lines.push(`  - ${error.message}`);
          if (error.suggestedFix) {
            lines.push(`    Fix: ${error.suggestedFix}`);
          }
        }
      }

      if (validationResult.warnings.length > 0) {
        lines.push('');
        lines.push('Warnings:');
        for (const warning of validationResult.warnings) {
          lines.push(`  - ${warning.message}`);
          if (warning.suggestedFix) {
            lines.push(`    Suggestion: ${warning.suggestedFix}`);
          }
        }
      }
    }

    if (validationResult.info.length > 0) {
      lines.push('');
      lines.push('Information:');
      for (const inf of validationResult.info) {
        lines.push(`  - ${inf.message}`);
      }
    }

    return lines.join('\n');
  }
}
