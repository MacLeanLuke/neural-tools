#!/usr/bin/env node

import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  DidChangeConfigurationNotification,
  TextDocumentSyncKind,
  InitializeResult,
  CodeActionKind,
  Hover,
  MarkupKind,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadConfig, getTemplate } from './config';
import { createValidator } from './validators';
import { createDiagnostics, createParseErrorDiagnostic, createCodeAction } from './diagnostics';
import { LSPConfig, Ticket, TicketValidationResult } from './types';

// Create a connection for the server
const connection = createConnection(ProposedFeatures.all);

// Create a text document manager
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

// Global configuration
let globalConfig: LSPConfig;

// Store validation results per document
const validationCache = new Map<string, TicketValidationResult>();

connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities;

  // Check client capabilities
  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );
  hasDiagnosticRelatedInformationCapability = !!(
    capabilities.textDocument &&
    capabilities.textDocument.publishDiagnostics &&
    capabilities.textDocument.publishDiagnostics.relatedInformation
  );

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      hoverProvider: true,
      codeActionProvider: {
        codeActionKinds: [CodeActionKind.QuickFix],
      },
    },
  };

  if (hasWorkspaceFolderCapability) {
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true,
      },
    };
  }

  return result;
});

connection.onInitialized(() => {
  if (hasConfigurationCapability) {
    connection.client.register(DidChangeConfigurationNotification.type, undefined);
  }

  // Load initial configuration
  try {
    globalConfig = loadConfig();
    connection.console.log('Ticket LSP server initialized with configuration');
  } catch (error) {
    connection.console.error(`Failed to load configuration: ${error}`);
    globalConfig = loadConfig(); // Will return default config
  }
});

// Configuration changed
connection.onDidChangeConfiguration((change) => {
  try {
    // Reload configuration
    globalConfig = loadConfig();
    connection.console.log('Configuration reloaded');

    // Revalidate all open documents
    documents.all().forEach(validateTextDocument);
  } catch (error) {
    connection.console.error(`Failed to reload configuration: ${error}`);
  }
});

// Document content changed
documents.onDidChangeContent((change) => {
  validateTextDocument(change.document);
});

// Validate a text document
async function validateTextDocument(textDocument: TextDocument): Promise<void> {
  try {
    // Parse document as JSON
    const text = textDocument.getText();
    let ticket: Ticket;

    try {
      ticket = JSON.parse(text);
    } catch (error) {
      // Send parse error diagnostic
      const diagnostics = [createParseErrorDiagnostic(error as Error, textDocument)];
      connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
      return;
    }

    // Determine which template to use
    // Look for a "template" field in the ticket, or use default
    const templateName = (ticket as any).template || globalConfig.defaultTemplate;
    const template = getTemplate(globalConfig, templateName);

    // Create validator and validate
    const validator = createValidator(template);
    const validationResult = validator.validate(ticket);

    // Cache validation result
    validationCache.set(textDocument.uri, validationResult);

    // Convert to LSP diagnostics
    const diagnostics = createDiagnostics(validationResult, textDocument);

    // Send diagnostics to client
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });

    // Log feedback for debugging
    const feedback = validator.generateFeedback(validationResult);
    connection.console.log(`Validation feedback:\n${feedback}`);
  } catch (error) {
    connection.console.error(`Validation error: ${error}`);

    // Send error diagnostic
    const diagnostics = [
      createParseErrorDiagnostic(error as Error, textDocument),
    ];
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
  }
}

// Hover provider
connection.onHover((params) => {
  if (!globalConfig.enableHover) {
    return null;
  }

  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return null;
  }

  const validationResult = validationCache.get(params.textDocument.uri);
  if (!validationResult) {
    return null;
  }

  // Find if we're hovering over a field with validation issues
  const position = params.position;
  const line = document.getText({
    start: { line: position.line, character: 0 },
    end: { line: position.line + 1, character: 0 },
  });

  // Simple hover: show validation status
  const hover: Hover = {
    contents: {
      kind: MarkupKind.Markdown,
      value: [
        '### Ticket Validation',
        '',
        `**Template:** ${validationResult.template}`,
        `**Status:** ${validationResult.valid ? '✓ Valid' : '✗ Invalid'}`,
        '',
        validationResult.errors.length > 0
          ? `**Errors:** ${validationResult.errors.length}`
          : '',
        validationResult.warnings.length > 0
          ? `**Warnings:** ${validationResult.warnings.length}`
          : '',
        '',
        '---',
        '',
        'Validation checks the ticket against configured rules for the ticketing system.',
      ]
        .filter((s) => s !== '')
        .join('\n'),
    },
  };

  return hover;
});

// Code action provider
connection.onCodeAction((params) => {
  if (!globalConfig.enableCodeActions) {
    return [];
  }

  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return [];
  }

  const codeActions = [];

  // Create code actions for diagnostics with suggested fixes
  for (const diagnostic of params.context.diagnostics) {
    if (diagnostic.data?.suggestedFix) {
      const action = createCodeAction(diagnostic, document);
      if (action) {
        codeActions.push(action);
      }
    }
  }

  return codeActions;
});

// Document closed
documents.onDidClose((e) => {
  validationCache.delete(e.document.uri);
});

// Make the text document manager listen on the connection
documents.listen(connection);

// Listen on the connection
connection.listen();

console.log('Ticket LSP server started');
