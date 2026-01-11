import { logger, licenseManager, LicenseTier } from '@neural-tools/core';

export async function statusCommand(): Promise<void> {
  logger.header('AI Toolkit Status');

  try {
    const license = await licenseManager.loadLicense();

    logger.section('License Information', [
      `Tier: ${license.tier.toUpperCase()}`,
      `Email: ${license.email || 'N/A'}`,
      `Status: ${license.expiresAt ? checkExpiration(license.expiresAt) : 'Active'}`
    ]);

    // Check available features
    const features = [
      { name: 'MCP Generation', key: 'mcp-generation' },
      { name: 'Claude Commands', key: 'claude-commands' },
      { name: 'Vector Database', key: 'vector-db' },
      { name: 'Semantic Cache', key: 'semantic-cache' },
      { name: 'Fine-tuning', key: 'fine-tuning' },
      { name: 'Cloud Deployment', key: 'cloud-deployment' },
      { name: 'GitHub Automation', key: 'github-automation' }
    ];

    const featureStatus = await Promise.all(
      features.map(async (feature) => {
        const available = await licenseManager.checkFeature(feature.key);
        return `${available ? '✓' : '✗'} ${feature.name}`;
      })
    );

    logger.section('Feature Availability', featureStatus);

    if (license.tier === LicenseTier.FREE) {
      logger.newline();
      logger.info('Unlock more features with Pro or Enterprise:');
      logger.info('https://ai-toolkit.dev/pricing');
    }

    logger.newline();
    logger.section('Quick Start', [
      'Generate an MCP server:',
      '  ai-toolkit generate mcp github',
      '',
      'Generate a Claude command:',
      '  ai-toolkit generate command search-kb',
      '',
      'View all commands:',
      '  ai-toolkit --help'
    ]);
  } catch (error: any) {
    logger.error('Failed to load license information');
    logger.newline();
    logger.info('Run "ai-toolkit login" to activate your license');
    logger.info('Or continue with free tier features');
  }
}

function checkExpiration(expiresAt: string): string {
  const expirationDate = new Date(expiresAt);
  const now = new Date();

  if (expirationDate < now) {
    return 'Expired';
  }

  const daysUntilExpiration = Math.ceil(
    (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiration <= 30) {
    return `Active (expires in ${daysUntilExpiration} days)`;
  }

  return 'Active';
}
