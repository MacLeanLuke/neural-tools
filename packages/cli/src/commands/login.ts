import { logger, licenseManager, LicenseTier } from '@neural-tools/core';
import inquirer from 'inquirer';

interface LoginOptions {
  key?: string;
}

export async function loginCommand(options: LoginOptions): Promise<void> {
  logger.header('AI Toolkit License Management');

  let licenseKey = options.key;

  if (!licenseKey) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'licenseKey',
        message: 'Enter your license key:',
        validate: (input: string) => {
          if (!input || input.trim().length === 0) {
            return 'License key is required';
          }
          return true;
        }
      }
    ]);
    licenseKey = answers.licenseKey;
  }

  if (!licenseKey) {
    logger.error('License key is required');
    return;
  }

  logger.startSpinner('Validating license...');

  try {
    // TODO: Validate license key with backend API
    // For now, parse the key format: tier-email-signature
    const parts = licenseKey.split('-');

    if (parts.length < 2) {
      throw new Error('Invalid license key format');
    }

    const tier = parts[0] as LicenseTier;
    const email = parts[1];

    // Validate tier
    if (!Object.values(LicenseTier).includes(tier)) {
      throw new Error('Invalid license tier');
    }

    // Save license
    await licenseManager.saveLicense({
      tier,
      email,
      key: licenseKey,
      features: []
    });

    logger.succeedSpinner('License activated successfully!');

    const license = await licenseManager.loadLicense();

    logger.section('License Details', [
      `Tier: ${license.tier.toUpperCase()}`,
      `Email: ${license.email || 'N/A'}`,
      `Status: Active`
    ]);

    // Show all available features (everything is free)
    const features = getAllFeatures();

    logger.section('Available Features', features);

    logger.success('✨ Ready to build!');
  } catch (error: any) {
    logger.failSpinner('License validation failed');
    logger.error(error.message || 'Invalid license key');
    logger.newline();
    logger.info('All features are available for free - no license required!');
  }
}

function getAllFeatures(): string[] {
  return [
    '✓ MCP generation',
    '✓ Claude commands',
    '✓ Claude agents',
    '✓ Vector database integration',
    '✓ Semantic caching',
    '✓ Fine-tuning workflows',
    '✓ Cloud deployment (AWS/GCP)',
    '✓ GitHub automation',
    '✓ All templates'
  ];
}
