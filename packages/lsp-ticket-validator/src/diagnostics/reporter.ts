import {
  Diagnostic,
  DiagnosticSeverity as LSPDiagnosticSeverity,
  Range,
  Position,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import {
  TicketValidationResult,
  FieldValidationResult,
  DiagnosticSeverity,
} from '../types';

/**
 * Convert validation severity to LSP diagnostic severity
 */
function toLSPSeverity(severity: DiagnosticSeverity): LSPDiagnosticSeverity {
  switch (severity) {
    case DiagnosticSeverity.ERROR:
      return LSPDiagnosticSeverity.Error;
    case DiagnosticSeverity.WARNING:
      return LSPDiagnosticSeverity.Warning;
    case DiagnosticSeverity.INFO:
      return LSPDiagnosticSeverity.Information;
    case DiagnosticSeverity.HINT:
      return LSPDiagnosticSeverity.Hint;
  }
}

/**
 * Find the range of a field in the document
 */
function findFieldRange(
  document: TextDocument,
  fieldPath: string,
  fieldValue?: any
): Range | undefined {
  const text = document.getText();
  const lines = text.split('\n');

  // Try to find the field by its path
  const pathParts = fieldPath.split('.');
  const fieldName = pathParts[pathParts.length - 1];

  // Search for the field in JSON
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fieldIndex = line.indexOf(`"${fieldName}"`);

    if (fieldIndex !== -1) {
      const start: Position = { line: i, character: fieldIndex };
      const end: Position = {
        line: i,
        character: fieldIndex + fieldName.length + 2, // +2 for quotes
      };

      // If we have a value, try to highlight the value instead
      if (fieldValue !== undefined) {
        const colonIndex = line.indexOf(':', fieldIndex);
        if (colonIndex !== -1) {
          // Find the value start (skip whitespace)
          let valueStart = colonIndex + 1;
          while (valueStart < line.length && /\s/.test(line[valueStart])) {
            valueStart++;
          }

          // Find the value end (before comma or closing brace)
          let valueEnd = valueStart;
          while (
            valueEnd < line.length &&
            line[valueEnd] !== ',' &&
            line[valueEnd] !== '}' &&
            line[valueEnd] !== ']'
          ) {
            valueEnd++;
          }

          return {
            start: { line: i, character: valueStart },
            end: { line: i, character: valueEnd },
          };
        }
      }

      return { start, end };
    }
  }

  // Default to first line if field not found
  return {
    start: { line: 0, character: 0 },
    end: { line: 0, character: 0 },
  };
}

/**
 * Convert validation results to LSP diagnostics
 */
export function createDiagnostics(
  validationResult: TicketValidationResult,
  document: TextDocument
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  // Combine all validation results
  const allResults = [
    ...validationResult.errors,
    ...validationResult.warnings,
    ...validationResult.info,
  ];

  for (const result of allResults) {
    const range = result.range || findFieldRange(document, result.path);

    const diagnostic: Diagnostic = {
      severity: toLSPSeverity(result.severity),
      range: range || {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 0 },
      },
      message: result.message,
      source: 'ticket-validator',
    };

    // Add code if we have a suggested fix
    if (result.suggestedFix) {
      diagnostic.code = 'fixable';
      diagnostic.data = { suggestedFix: result.suggestedFix };
    }

    diagnostics.push(diagnostic);
  }

  return diagnostics;
}

/**
 * Create a diagnostic for a parse error
 */
export function createParseErrorDiagnostic(
  error: Error,
  document: TextDocument
): Diagnostic {
  return {
    severity: LSPDiagnosticSeverity.Error,
    range: {
      start: { line: 0, character: 0 },
      end: { line: 0, character: 0 },
    },
    message: `Failed to parse ticket: ${error.message}`,
    source: 'ticket-validator',
  };
}

/**
 * Generate code action for a diagnostic with a suggested fix
 */
export function createCodeAction(
  diagnostic: Diagnostic,
  document: TextDocument
): any {
  if (!diagnostic.data?.suggestedFix) {
    return null;
  }

  return {
    title: `Fix: ${diagnostic.data.suggestedFix}`,
    kind: 'quickfix',
    diagnostics: [diagnostic],
    edit: {
      changes: {
        [document.uri]: [
          {
            range: diagnostic.range,
            newText: diagnostic.data.suggestedFix,
          },
        ],
      },
    },
  };
}
