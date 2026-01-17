import { z } from 'zod';

/**
 * Supported ticketing systems
 */
export enum TicketingSystem {
  JIRA = 'jira',
  LINEAR = 'linear',
  GITHUB = 'github',
  GENERIC = 'generic',
}

/**
 * Severity levels for validation diagnostics
 */
export enum DiagnosticSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  HINT = 'hint',
}

/**
 * Field validation rule types
 */
export enum ValidationRuleType {
  REQUIRED = 'required',
  PATTERN = 'pattern',
  MIN_LENGTH = 'min_length',
  MAX_LENGTH = 'max_length',
  ENUM = 'enum',
  CUSTOM = 'custom',
  NESTED = 'nested',
}

/**
 * Base validation rule schema
 */
export const ValidationRuleSchema = z.object({
  type: z.nativeEnum(ValidationRuleType),
  severity: z.nativeEnum(DiagnosticSeverity).default(DiagnosticSeverity.ERROR),
  message: z.string().optional(),
});

/**
 * Required field rule
 */
export const RequiredRuleSchema = ValidationRuleSchema.extend({
  type: z.literal(ValidationRuleType.REQUIRED),
});

/**
 * Pattern matching rule (regex)
 */
export const PatternRuleSchema = ValidationRuleSchema.extend({
  type: z.literal(ValidationRuleType.PATTERN),
  pattern: z.string(),
  flags: z.string().optional(),
});

/**
 * Length validation rules
 */
export const MinLengthRuleSchema = ValidationRuleSchema.extend({
  type: z.literal(ValidationRuleType.MIN_LENGTH),
  min: z.number().positive(),
});

export const MaxLengthRuleSchema = ValidationRuleSchema.extend({
  type: z.literal(ValidationRuleType.MAX_LENGTH),
  max: z.number().positive(),
});

/**
 * Enum validation rule
 */
export const EnumRuleSchema = ValidationRuleSchema.extend({
  type: z.literal(ValidationRuleType.ENUM),
  values: z.array(z.string()),
});

/**
 * Custom validation function rule
 */
export const CustomRuleSchema = ValidationRuleSchema.extend({
  type: z.literal(ValidationRuleType.CUSTOM),
  validator: z.string(), // Name of the custom validator function
});

/**
 * Nested field validation
 */
export const NestedRuleSchema = ValidationRuleSchema.extend({
  type: z.literal(ValidationRuleType.NESTED),
  fields: z.record(z.array(z.any())), // Recursive field rules
});

/**
 * Union of all rule types
 */
export const AnyValidationRuleSchema = z.union([
  RequiredRuleSchema,
  PatternRuleSchema,
  MinLengthRuleSchema,
  MaxLengthRuleSchema,
  EnumRuleSchema,
  CustomRuleSchema,
  NestedRuleSchema,
]);

/**
 * Field configuration with validation rules
 */
export const FieldConfigSchema = z.object({
  path: z.string(), // JSONPath to the field (e.g., "title", "fields.description", "labels[*]")
  label: z.string().optional(), // Human-readable field name
  rules: z.array(AnyValidationRuleSchema),
});

/**
 * Ticket template configuration
 */
export const TicketTemplateSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  system: z.nativeEnum(TicketingSystem),
  fields: z.array(FieldConfigSchema),
  customValidators: z.record(z.function()).optional(), // Custom validator functions
});

/**
 * LSP server configuration
 */
export const LSPConfigSchema = z.object({
  templates: z.array(TicketTemplateSchema),
  defaultTemplate: z.string().optional(),
  enableCodeActions: z.boolean().default(true),
  enableCompletion: z.boolean().default(true),
  enableHover: z.boolean().default(true),
});

/**
 * TypeScript types derived from schemas
 */
export type ValidationRule = z.infer<typeof AnyValidationRuleSchema>;
export type RequiredRule = z.infer<typeof RequiredRuleSchema>;
export type PatternRule = z.infer<typeof PatternRuleSchema>;
export type MinLengthRule = z.infer<typeof MinLengthRuleSchema>;
export type MaxLengthRule = z.infer<typeof MaxLengthRuleSchema>;
export type EnumRule = z.infer<typeof EnumRuleSchema>;
export type CustomRule = z.infer<typeof CustomRuleSchema>;
export type NestedRule = z.infer<typeof NestedRuleSchema>;
export type FieldConfig = z.infer<typeof FieldConfigSchema>;
export type TicketTemplate = z.infer<typeof TicketTemplateSchema>;
export type LSPConfig = z.infer<typeof LSPConfigSchema>;

/**
 * Validation result for a single field
 */
export interface FieldValidationResult {
  field: string;
  path: string;
  severity: DiagnosticSeverity;
  message: string;
  range?: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
  suggestedFix?: string;
}

/**
 * Complete ticket validation result
 */
export interface TicketValidationResult {
  valid: boolean;
  errors: FieldValidationResult[];
  warnings: FieldValidationResult[];
  info: FieldValidationResult[];
  template: string;
}

/**
 * Ticket data structure (generic)
 */
export interface Ticket {
  id?: string;
  title: string;
  description: string;
  status?: string;
  priority?: string;
  assignee?: string;
  labels?: string[];
  [key: string]: any; // Allow additional fields
}

/**
 * Jira-specific ticket structure
 */
export interface JiraTicket extends Ticket {
  project: string;
  issueType: string;
  fields: {
    summary: string;
    description: string;
    issuetype: { name: string };
    project: { key: string };
    priority?: { name: string };
    assignee?: { accountId: string };
    labels?: string[];
    components?: Array<{ name: string }>;
    fixVersions?: Array<{ name: string }>;
    [key: string]: any;
  };
}

/**
 * Linear-specific ticket structure
 */
export interface LinearTicket extends Ticket {
  teamId: string;
  stateId?: string;
  priorityLabel?: string;
  estimate?: number;
  projectId?: string;
  cycleId?: string;
  parentId?: string;
  labelIds?: string[];
}

/**
 * GitHub Issue-specific structure
 */
export interface GitHubIssue extends Ticket {
  owner: string;
  repo: string;
  milestone?: number;
  assignees?: string[];
  labels?: string[];
  state?: 'open' | 'closed';
  body: string;
}
