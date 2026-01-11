import { logger, licenseManager, LicenseTier } from '@ai-toolkit/core';
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

    // Show available features based on tier
    const features = getFeaturesByTier(tier);

    logger.section('Available Features', features);

    if (tier === LicenseTier.FREE) {
      logger.newline();
      logger.info('Upgrade to Pro for advanced features:');
      logger.info('https://ai-toolkit.dev/pricing');
    }

    logger.success('✨ Ready to build!');
  } catch (error: any) {
    logger.failSpinner('License validation failed');
    logger.error(error.message || 'Invalid license key');
    logger.newline();
    logger.info('Get a license at: https://ai-toolkit.dev/pricing');
    logger.info('Or continue with free tier features');
  }
}

function getFeaturesByTier(tier: LicenseTier): string[] {
  const freeTier = [
    '✓ MCP generation',
    '✓ Claude commands',
    '✓ Basic templates',
    '✓ Local development'
  ];

  const proTier = [
    ...freeTier,
    '✓ Vector database integration',
    '✓ Semantic caching',
    '✓ Fine-tuning workflows',
    '✓ Cloud deployment (AWS/GCP)',
    '✓ Premium templates',
    '✓ GitHub automation'
  ];

  const enterpriseTier = [
    ...proTier,
    '✓ White-label support',
    '✓ Custom integrations',
    '✓ Priority support',
    '✓ SLA guarantee',
    '✓ Team collaboration features'
  ];

  switch (tier) {
    case LicenseTier.FREE:
      return freeTier;
    case LicenseTier.PRO:
      return proTier;
    case LicenseTier.ENTERPRISE:
      return enterpriseTier;
    default:
      return freeTier;
  }
}
