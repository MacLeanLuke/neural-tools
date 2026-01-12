# GitHub Actions Setup for Website Deployment

This guide explains how to configure GitHub Actions to automatically deploy your Neural Tools website to AWS S3 and CloudFront.

## Overview

The GitHub Actions workflow (`.github/workflows/deploy-website.yml`) automatically:
- Deploys website changes to S3 when you push to the `main` branch
- Invalidates CloudFront cache to ensure users see the latest version
- Provides deployment summaries with URLs
- Supports manual deployments via workflow dispatch

## Prerequisites

Before setting up GitHub Actions, complete the AWS setup:

1. ✅ S3 bucket created and configured
2. ✅ CloudFront distribution created
3. ✅ Website deployed at least once manually
4. ✅ AWS IAM user with appropriate permissions

## Step 1: Create AWS IAM User for GitHub Actions

### Create IAM User

```bash
# Create IAM user
aws iam create-user --user-name github-actions-neural-tools

# Create access key
aws iam create-access-key --user-name github-actions-neural-tools
```

**Save the output!** You'll need:
- `AccessKeyId`
- `SecretAccessKey`

### Create IAM Policy

Create a file `github-actions-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3Access",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:PutObjectAcl"
      ],
      "Resource": [
        "arn:aws:s3:::YOUR_BUCKET_NAME",
        "arn:aws:s3:::YOUR_BUCKET_NAME/*"
      ]
    },
    {
      "Sid": "CloudFrontInvalidation",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation",
        "cloudfront:GetDistribution"
      ],
      "Resource": "arn:aws:cloudfront::YOUR_ACCOUNT_ID:distribution/*"
    }
  ]
}
```

Replace:
- `YOUR_BUCKET_NAME` with your S3 bucket name
- `YOUR_ACCOUNT_ID` with your AWS account ID

### Attach Policy to User

```bash
# Create policy
aws iam create-policy \
  --policy-name GitHubActionsNeuralToolsPolicy \
  --policy-document file://github-actions-policy.json

# Get your account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Attach policy to user
aws iam attach-user-policy \
  --user-name github-actions-neural-tools \
  --policy-arn "arn:aws:iam::$ACCOUNT_ID:policy/GitHubActionsNeuralToolsPolicy"
```

## Step 2: Configure GitHub Secrets

### Add Secrets to GitHub Repository

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

| Secret Name | Value | Example |
|-------------|-------|---------|
| `AWS_ACCESS_KEY_ID` | Access key from IAM user creation | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | Secret key from IAM user creation | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_S3_BUCKET` | Your S3 bucket name | `neural-tools.com` |
| `AWS_CLOUDFRONT_ID` | Your CloudFront distribution ID | `E1234567890ABC` |

### Using GitHub CLI

```bash
# Set secrets using gh CLI
gh secret set AWS_ACCESS_KEY_ID --body "YOUR_ACCESS_KEY"
gh secret set AWS_SECRET_ACCESS_KEY --body "YOUR_SECRET_KEY"
gh secret set AWS_S3_BUCKET --body "neural-tools.com"
gh secret set AWS_CLOUDFRONT_ID --body "E1234567890ABC"

# Verify secrets
gh secret list
```

### Using Environment File

Create a `.env.github` file (DO NOT COMMIT):

```bash
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET=neural-tools.com
AWS_CLOUDFRONT_ID=E1234567890ABC
```

Then set all secrets at once:

```bash
#!/bin/bash
source .env.github

gh secret set AWS_ACCESS_KEY_ID --body "$AWS_ACCESS_KEY_ID"
gh secret set AWS_SECRET_ACCESS_KEY --body "$AWS_SECRET_ACCESS_KEY"
gh secret set AWS_S3_BUCKET --body "$AWS_S3_BUCKET"
gh secret set AWS_CLOUDFRONT_ID --body "$AWS_CLOUDFRONT_ID"

# Delete the file for security
rm .env.github
```

## Step 3: Test the Workflow

### Automatic Deployment (on push)

The workflow runs automatically when you push changes to the `main` branch that affect the `website/` directory:

```bash
# Make changes to website
cd website
echo "<!-- Updated -->" >> index.html

# Commit and push
git add .
git commit -m "Update website"
git push origin main
```

### Manual Deployment

Trigger a manual deployment:

```bash
# Using GitHub CLI
gh workflow run deploy-website.yml

# With cache invalidation disabled
gh workflow run deploy-website.yml -f invalidate_cache=false
```

Or via GitHub web interface:
1. Go to **Actions** tab
2. Select **Deploy Website to S3 and CloudFront**
3. Click **Run workflow**
4. Choose options and click **Run workflow**

## Step 4: Monitor Deployments

### View Workflow Runs

```bash
# List recent runs
gh run list --workflow=deploy-website.yml

# View specific run
gh run view <run-id>

# Watch live logs
gh run watch
```

### Check Deployment Status

After deployment completes:

1. **Check GitHub Actions Summary**: View the deployment summary with URLs
2. **Test CloudFront URL**: Visit the CloudFront URL shown in the summary
3. **Test Custom Domain**: Visit your custom domain (if configured)

### View Logs

```bash
# View latest workflow run
gh run view

# Download logs
gh run download <run-id>
```

## Workflow Configuration

### Customize Deployment Behavior

Edit `.github/workflows/deploy-website.yml`:

#### Change Trigger Branch

```yaml
on:
  push:
    branches:
      - main  # Change to your branch
```

#### Deploy on Tag

```yaml
on:
  push:
    tags:
      - 'v*'  # Deploy on version tags
```

#### Add Slack Notifications

```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

#### Skip Cache Invalidation

Modify the invalidation step:

```yaml
- name: Invalidate CloudFront cache
  if: false  # Skip invalidation
```

### Cache Control Headers

Customize cache control in the sync command:

```yaml
# Short cache (1 hour)
--cache-control "public, max-age=3600"

# Long cache (1 day)
--cache-control "public, max-age=86400"

# No cache
--cache-control "no-cache, no-store, must-revalidate"

# Different headers for different files
aws s3 cp index.html s3://$BUCKET/ --cache-control "no-cache"
aws s3 cp styles.css s3://$BUCKET/ --cache-control "max-age=31536000"
```

## Troubleshooting

### Error: "Access Denied" to S3

**Problem**: IAM user lacks S3 permissions

**Solution**: Check bucket policy and IAM user permissions

```bash
# Test IAM user permissions
aws s3 ls s3://YOUR_BUCKET_NAME \
  --profile github-actions

# Verify policy attachment
aws iam list-attached-user-policies \
  --user-name github-actions-neural-tools
```

### Error: "InvalidAccessKeyId"

**Problem**: Incorrect AWS credentials in GitHub secrets

**Solution**: Verify and update secrets

```bash
# Regenerate access key if needed
aws iam create-access-key --user-name github-actions-neural-tools

# Update GitHub secret
gh secret set AWS_ACCESS_KEY_ID --body "NEW_ACCESS_KEY"
```

### Error: CloudFront Invalidation Failed

**Problem**: Missing CloudFront permissions

**Solution**: Update IAM policy to include CloudFront permissions

```bash
# Check CloudFront permissions
aws cloudfront get-distribution \
  --id YOUR_DISTRIBUTION_ID
```

### Workflow Not Triggering

**Problem**: Changes not in `website/` directory

**Solution**: Check the workflow trigger paths

```yaml
on:
  push:
    paths:
      - 'website/**'  # Only triggers on website changes
```

### Cache Not Clearing

**Problem**: CloudFront still serving old content

**Solution**: Manual invalidation

```bash
# Invalidate all files
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"

# Or use the script
cd website
./invalidate-cache.sh YOUR_DISTRIBUTION_ID
```

## Security Best Practices

### 1. Least Privilege IAM Policy

Only grant necessary permissions:

```json
{
  "Effect": "Allow",
  "Action": [
    "s3:PutObject",
    "s3:GetObject",
    "s3:DeleteObject"
  ],
  "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
}
```

### 2. Rotate Access Keys

```bash
# Create new key
aws iam create-access-key --user-name github-actions-neural-tools

# Update GitHub secrets
gh secret set AWS_ACCESS_KEY_ID --body "NEW_KEY"
gh secret set AWS_SECRET_ACCESS_KEY --body "NEW_SECRET"

# Delete old key
aws iam delete-access-key \
  --user-name github-actions-neural-tools \
  --access-key-id OLD_KEY_ID
```

### 3. Use Environment Secrets for Multiple Repos

For organization-level secrets:
1. Go to **Organization Settings** → **Secrets**
2. Create secrets at organization level
3. Select repositories that can access them

### 4. Enable Branch Protection

Require reviews before deploying:
1. **Settings** → **Branches**
2. Add rule for `main` branch
3. Enable "Require pull request reviews before merging"

## Cost Optimization

### Reduce Invalidation Costs

CloudFront charges for invalidations (first 1,000/month are free):

```yaml
# Only invalidate changed files
- name: Invalidate specific files
  run: |
    CHANGED_FILES=$(git diff-tree --no-commit-id --name-only -r ${{ github.sha }} | grep '^website/' | sed 's|^website/|/|')
    aws cloudfront create-invalidation \
      --distribution-id ${{ secrets.AWS_CLOUDFRONT_ID }} \
      --paths $CHANGED_FILES
```

### Use Cache Versioning

Instead of invalidating, use versioned URLs:

```html
<!-- Add version query parameter -->
<link rel="stylesheet" href="styles.css?v=1.0.0">
<script src="script.js?v=1.0.0"></script>
```

## Deployment Checklist

- [ ] AWS S3 bucket created and configured
- [ ] CloudFront distribution created
- [ ] IAM user created with appropriate permissions
- [ ] GitHub secrets configured
- [ ] Workflow tested with manual trigger
- [ ] Automatic deployment tested
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate configured (if applicable)
- [ ] Monitoring and alerts set up

## Next Steps

1. ✅ Set up monitoring with CloudWatch
2. ✅ Configure custom domain
3. ✅ Add SSL certificate
4. ✅ Set up staging environment
5. ✅ Add automated tests
6. ✅ Configure CDN caching strategy

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
