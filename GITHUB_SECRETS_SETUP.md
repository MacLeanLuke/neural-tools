# GitHub Actions Secrets Setup for S3 Deployment

Quick guide to set up CI/CD for deploying your website to S3.

## Step 1: Create IAM User for GitHub Actions

### Via AWS Console

1. Go to [IAM Console](https://console.aws.amazon.com/iam/)
2. Click **Users** → **Create user**
3. Settings:
   - **User name**: `github-actions-deploy`
   - **Access type**: Access key - Programmatic access only
4. Click **Next**

### Set Permissions

1. Choose **Attach policies directly**
2. Click **Create policy**
3. Choose **JSON** tab
4. Paste this policy (replace `YOUR-BUCKET-NAME` with your actual bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3DeployAccess",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::YOUR-BUCKET-NAME",
        "arn:aws:s3:::YOUR-BUCKET-NAME/*"
      ]
    }
  ]
}
```

5. Click **Next**
6. Settings:
   - **Policy name**: `GitHubActionsS3Deploy`
   - **Description**: `Allows GitHub Actions to deploy to S3 bucket`
7. Click **Create policy**

8. Go back to the user creation tab
9. Click the refresh button and search for `GitHubActionsS3Deploy`
10. Check the box next to it
11. Click **Next** → **Create user**

### Get Access Keys

1. Click on the newly created user
2. Go to **Security credentials** tab
3. Click **Create access key**
4. Choose **Third-party service**
5. Check the confirmation box
6. Click **Next** → **Create access key**
7. **IMPORTANT**: Copy both values:
   - **Access key ID** (e.g., `AKIAIOSFODNN7EXAMPLE`)
   - **Secret access key** (e.g., `wJalrXUtnFEMI/K7MDENG/bPxRfiCY`)
8. Click **Done**

⚠️ **Save these credentials securely! You won't be able to see the secret key again.**

## Step 2: Add Secrets to GitHub

### Option A: Using GitHub Web Interface

1. Go to your repository: https://github.com/MacLeanLuke/neural-tools
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these three secrets one by one:

**Secret 1:**
- Name: `AWS_ACCESS_KEY_ID`
- Value: Your access key ID from Step 1
- Click **Add secret**

**Secret 2:**
- Name: `AWS_SECRET_ACCESS_KEY`
- Value: Your secret access key from Step 1
- Click **Add secret**

**Secret 3:**
- Name: `AWS_S3_BUCKET`
- Value: Your bucket name (e.g., `neural-tools.com`)
- Click **Add secret**

### Option B: Using GitHub CLI

```bash
# Navigate to your repo
cd /home/user/neural-tools

# Add the secrets
gh secret set AWS_ACCESS_KEY_ID
# Paste your access key ID when prompted

gh secret set AWS_SECRET_ACCESS_KEY
# Paste your secret access key when prompted

gh secret set AWS_S3_BUCKET --body "neural-tools.com"

# Verify secrets were added
gh secret list
```

Expected output:
```
AWS_ACCESS_KEY_ID       Updated 2024-01-12
AWS_SECRET_ACCESS_KEY   Updated 2024-01-12
AWS_S3_BUCKET          Updated 2024-01-12
```

## Step 3: Test the Deployment

### Option A: Push to Main Branch

The workflow will automatically run when you push changes to the `website/` directory:

```bash
# Make a test change
cd website
echo "<!-- Deployed via GitHub Actions -->" >> index.html

# Commit and push
git add index.html
git commit -m "Test GitHub Actions deployment"
git push origin main
```

### Option B: Manual Trigger

Trigger the workflow manually:

```bash
gh workflow run deploy-website.yml
```

Or via GitHub web interface:
1. Go to **Actions** tab
2. Click **Deploy Website to S3 and CloudFront**
3. Click **Run workflow**
4. Select branch (main)
5. Click **Run workflow**

## Step 4: Verify Deployment

### Check Workflow Status

```bash
# List recent workflow runs
gh run list --workflow=deploy-website.yml

# View the latest run
gh run view

# Watch live logs
gh run watch
```

### View in GitHub

1. Go to **Actions** tab in your repository
2. Click on the latest workflow run
3. You should see:
   - ✅ All steps completed successfully
   - Deployment summary with your S3 website URL

### Test Your Website

Visit your S3 website endpoint:
```
http://YOUR-BUCKET-NAME.s3-website-us-east-1.amazonaws.com
```

Example:
```
http://neural-tools.com.s3-website-us-east-1.amazonaws.com
```

## Troubleshooting

### Error: "The security token included in the request is invalid"

**Problem**: Wrong AWS credentials

**Solution**:
1. Verify the IAM access key is correct
2. Check you copied the entire secret key (no spaces)
3. Recreate the access key if needed
4. Update GitHub secrets

### Error: "Access Denied" or "403 Forbidden"

**Problem**: IAM user lacks S3 permissions

**Solution**:
1. Check the IAM policy is attached to the user
2. Verify bucket name in policy matches your actual bucket
3. Ensure the policy has all required actions:
   - `s3:PutObject`
   - `s3:GetObject`
   - `s3:DeleteObject`
   - `s3:ListBucket`

### Error: "Bucket does not exist"

**Problem**: Wrong bucket name in secret

**Solution**:
```bash
# Update the secret with correct bucket name
gh secret set AWS_S3_BUCKET --body "your-correct-bucket-name"
```

### Workflow Not Triggering

**Problem**: Changes not in `website/` directory

**Solution**: The workflow only runs on changes to files in the `website/` directory. Make sure your changes are in:
- `website/index.html`
- `website/styles.css`
- `website/script.js`
- etc.

Or trigger manually:
```bash
gh workflow run deploy-website.yml
```

## What Happens on Each Push

When you push to `main` branch with changes in `website/`:

1. ✅ GitHub Actions checks out your code
2. ✅ Configures AWS credentials
3. ✅ Syncs all files in `website/` to your S3 bucket
4. ✅ Deletes files from S3 that no longer exist locally
5. ✅ Sets cache headers (1 hour)
6. ✅ Skips CloudFront steps (since you don't have CloudFront)
7. ✅ Shows deployment summary with S3 URL

## Security Best Practices

### 1. Least Privilege Policy

The IAM policy only grants the minimum permissions needed:
- Only access to your specific bucket
- Only the operations required for deployment
- No admin or account-level permissions

### 2. Rotate Access Keys

Rotate your access keys every 90 days:

```bash
# Create new access key
# (In AWS Console: IAM → Users → Security credentials → Create access key)

# Update GitHub secrets with new keys
gh secret set AWS_ACCESS_KEY_ID
gh secret set AWS_SECRET_ACCESS_KEY

# Delete old access key from AWS Console
```

### 3. Monitor Usage

Check CloudWatch for unusual activity:
- Go to CloudWatch → Metrics → S3
- Monitor PutObject, GetObject metrics
- Set up alarms for unexpected spikes

## Adding CloudFront Later

If you want to add CloudFront in the future:

1. Create CloudFront distribution (see `AWS_SETUP_GUIDE.md`)
2. Get the distribution ID
3. Add one more secret:
```bash
gh secret set AWS_CLOUDFRONT_ID --body "E1234567890ABC"
```

4. Update IAM policy to include CloudFront permissions:
```json
{
  "Sid": "CloudFrontInvalidation",
  "Effect": "Allow",
  "Action": [
    "cloudfront:CreateInvalidation",
    "cloudfront:GetInvalidation",
    "cloudfront:GetDistribution"
  ],
  "Resource": "*"
}
```

The workflow will automatically start using CloudFront!

## Quick Reference

### Required Secrets (S3-only)

```
AWS_ACCESS_KEY_ID       - IAM user access key
AWS_SECRET_ACCESS_KEY   - IAM user secret key
AWS_S3_BUCKET          - S3 bucket name
```

### Optional Secrets (with CloudFront)

```
AWS_CLOUDFRONT_ID      - CloudFront distribution ID
```

### Deploy Commands

```bash
# Automatic (on push to main)
git push origin main

# Manual trigger
gh workflow run deploy-website.yml

# View status
gh run list --workflow=deploy-website.yml
gh run watch
```

### IAM Policy Template

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::YOUR-BUCKET-NAME",
        "arn:aws:s3:::YOUR-BUCKET-NAME/*"
      ]
    }
  ]
}
```

## Next Steps

1. ✅ IAM user created
2. ✅ GitHub secrets configured
3. ✅ Test deployment successful
4. ✅ Website accessible via S3 endpoint
5. 🔄 Make changes and push to deploy automatically!

## Support

- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **AWS IAM Docs**: https://docs.aws.amazon.com/iam/
- **Full Setup Guide**: See `GITHUB_ACTIONS_SETUP.md`
