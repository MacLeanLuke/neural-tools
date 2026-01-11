import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { License, LicenseSchema, LicenseTier } from './types';

const LICENSE_FILE = path.join(os.homedir(), '.ai-toolkit', 'license.json');

export class LicenseManager {
  private static instance: LicenseManager;
  private license: License | null = null;

  private constructor() {}

  static getInstance(): LicenseManager {
    if (!LicenseManager.instance) {
      LicenseManager.instance = new LicenseManager();
    }
    return LicenseManager.instance;
  }

  async loadLicense(): Promise<License> {
    if (this.license) {
      return this.license;
    }

    try {
      const licenseData = await fs.readFile(LICENSE_FILE, 'utf-8');
      const parsed = JSON.parse(licenseData);
      this.license = LicenseSchema.parse(parsed);

      // Check if license is expired
      if (this.license.expiresAt) {
        const expiresAt = new Date(this.license.expiresAt);
        if (expiresAt < new Date()) {
          throw new Error('License has expired');
        }
      }

      return this.license;
    } catch (error) {
      // Default to free tier if no license found
      this.license = {
        tier: LicenseTier.FREE,
        features: ['mcp-generation', 'claude-commands', 'basic-templates']
      };
      return this.license;
    }
  }

  async saveLicense(license: License): Promise<void> {
    const validated = LicenseSchema.parse(license);
    const licenseDir = path.dirname(LICENSE_FILE);

    await fs.mkdir(licenseDir, { recursive: true });
    await fs.writeFile(LICENSE_FILE, JSON.stringify(validated, null, 2), 'utf-8');

    this.license = validated;
  }

  async checkFeature(feature: string): Promise<boolean> {
    const license = await this.loadLicense();

    // Free tier features
    const freeTierFeatures = [
      'mcp-generation',
      'claude-commands',
      'basic-templates',
      'local-development'
    ];

    // Pro tier features
    const proTierFeatures = [
      ...freeTierFeatures,
      'vector-db',
      'semantic-cache',
      'fine-tuning',
      'cloud-deployment',
      'premium-templates',
      'github-automation'
    ];

    // Enterprise tier features
    const enterpriseTierFeatures = [
      ...proTierFeatures,
      'white-label',
      'custom-integrations',
      'priority-support',
      'sla-guarantee'
    ];

    switch (license.tier) {
      case LicenseTier.FREE:
        return freeTierFeatures.includes(feature) || license.features.includes(feature);
      case LicenseTier.PRO:
        return proTierFeatures.includes(feature) || license.features.includes(feature);
      case LicenseTier.ENTERPRISE:
        return enterpriseTierFeatures.includes(feature) || license.features.includes(feature);
      default:
        return freeTierFeatures.includes(feature);
    }
  }

  async requireFeature(feature: string, featureName?: string): Promise<void> {
    const hasFeature = await this.checkFeature(feature);
    if (!hasFeature) {
      const displayName = featureName || feature;
      throw new Error(
        `Feature "${displayName}" requires a Pro or Enterprise license.\n` +
        `Visit https://ai-toolkit.dev/pricing to upgrade.`
      );
    }
  }

  async getTier(): Promise<LicenseTier> {
    const license = await this.loadLicense();
    return license.tier;
  }
}

export const licenseManager = LicenseManager.getInstance();

// Convenience functions
export async function checkLicense(): Promise<License> {
  return licenseManager.loadLicense();
}

export async function checkFeature(feature: string): Promise<boolean> {
  return licenseManager.checkFeature(feature);
}

export async function requireFeature(feature: string, featureName?: string): Promise<void> {
  return licenseManager.requireFeature(feature, featureName);
}
