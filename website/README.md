# Neural Tools Website

Static website for Neural Tools hosted on AWS S3 with CloudFront CDN.

## Quick Start

### Option 1: Automated Setup (Recommended)

```bash
cd website
./setup-aws.sh
```

This script will:
- Create S3 bucket
- Configure static website hosting
- Create CloudFront distribution with Origin Access Control
- Deploy your website
- Provide all necessary configuration

### Option 2: GitHub Actions (CI/CD)

Push changes to the `main` branch and GitHub Actions will automatically deploy:

```bash
git add website/
git commit -m "Update website"
git push origin main
```

See [GITHUB_ACTIONS_SETUP.md](../GITHUB_ACTIONS_SETUP.md) for configuration details.

### Option 3: Manual Deployment

```bash
cd website
./deploy.sh neural-tools.com
```

## Local Development

Open `index.html` in your browser:

```bash
cd website
open index.html

# Or use a local server
python3 -m http.server 8000
```

Visit http://localhost:8000

## Deployment Options

### 1. Automated Setup Script

Complete AWS setup with one command:

```bash
cd website
export BUCKET_NAME="your-domain.com"
./setup-aws.sh
```

**See**: [AWS_SETUP_GUIDE.md](../AWS_SETUP_GUIDE.md) for detailed instructions

### 2. GitHub Actions CI/CD

Automatic deployment on every push to `main`:

```bash
# Configure GitHub secrets (one time)
gh secret set AWS_ACCESS_KEY_ID
gh secret set AWS_SECRET_ACCESS_KEY
gh secret set AWS_S3_BUCKET
gh secret set AWS_CLOUDFRONT_ID

# Deploy by pushing to main
git push origin main
```

**See**: [GITHUB_ACTIONS_SETUP.md](../GITHUB_ACTIONS_SETUP.md) for setup guide

### 3. Manual Deployment

```bash
# Deploy to S3 and invalidate CloudFront cache
cd website
./deploy.sh neural-tools.com

# Just invalidate cache (after manual S3 upload)
./invalidate-cache.sh YOUR_DISTRIBUTION_ID
```

## Project Structure

```
website/
├── index.html              # Main landing page
├── styles.css              # Styling
├── script.js               # Interactive features
├── README.md               # This file
├── deploy.sh               # Manual deployment script
├── setup-aws.sh            # Automated AWS setup
└── invalidate-cache.sh     # CloudFront cache invalidation
```

## Configuration

### Environment Variables

```bash
# S3 bucket name (usually your domain)
export BUCKET_NAME="neural-tools.com"

# AWS region
export AWS_REGION="us-east-1"

# CloudFront distribution ID
export AWS_CLOUDFRONT_ID="E1234567890ABC"
```

### AWS Resources Required

- **S3 Bucket**: Static website hosting
- **CloudFront Distribution**: CDN with HTTPS
- **ACM Certificate**: SSL/TLS (optional, for custom domain)
- **Route53 or DNS**: Domain configuration (optional)

## Cache Management

### Invalidate CloudFront Cache

```bash
# Invalidate all files
./invalidate-cache.sh YOUR_DISTRIBUTION_ID

# Invalidate specific files
./invalidate-cache.sh YOUR_DISTRIBUTION_ID "/index.html"

# Or use AWS CLI directly
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

### Cache Control Headers

Files are cached with these defaults:
- **TTL**: 1 hour (3600 seconds)
- **Policy**: `public, max-age=3600`

Customize in `deploy.sh`:
```bash
--cache-control "public, max-age=86400"  # 24 hours
```

## Monitoring & Analytics

### CloudWatch Metrics

```bash
# S3 bucket traffic
aws cloudwatch get-metric-statistics \
  --namespace AWS/S3 \
  --metric-name NumberOfObjects \
  --dimensions Name=BucketName,Value=$BUCKET_NAME \
  --statistics Average \
  --start-time 2026-01-01T00:00:00Z \
  --end-time 2026-01-31T23:59:59Z \
  --period 86400

# CloudFront requests
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name Requests \
  --dimensions Name=DistributionId,Value=$DISTRIBUTION_ID \
  --statistics Sum \
  --start-time 2026-01-01T00:00:00Z \
  --end-time 2026-01-31T23:59:59Z \
  --period 3600
```

### View Deployment Logs

```bash
# GitHub Actions logs
gh run list --workflow=deploy-website.yml
gh run view <run-id>

# CloudFront access logs (if enabled)
aws s3 ls s3://your-logs-bucket/cloudfront/
```

## Costs

Estimated monthly costs for a small website:

| Service | Usage | Cost |
|---------|-------|------|
| S3 Storage | 1 GB | $0.023 |
| S3 Requests | 10,000 | $0.004 |
| CloudFront | 10 GB transfer | $0.85 |
| ACM Certificate | N/A | FREE |
| **Total** | | **~$1-2/month** |

First 12 months includes AWS Free Tier benefits.

## Troubleshooting

### Website Not Updating

1. **Clear browser cache**: Ctrl+Shift+R (hard refresh)
2. **Invalidate CloudFront cache**: `./invalidate-cache.sh DISTRIBUTION_ID`
3. **Check S3 files**: `aws s3 ls s3://$BUCKET_NAME`

### 403 Forbidden Error

1. **Check bucket policy**: Ensure CloudFront has access
2. **Verify OAC**: Origin Access Control configured correctly
3. **Check distribution status**: `aws cloudfront get-distribution --id $DISTRIBUTION_ID`

### GitHub Actions Failing

1. **Verify secrets**: Check AWS credentials in GitHub settings
2. **Check IAM permissions**: Ensure user has S3 and CloudFront access
3. **View logs**: `gh run view` to see error details

## Security

- ✅ HTTPS enforced via CloudFront
- ✅ S3 bucket not publicly accessible (CloudFront only)
- ✅ Origin Access Control (OAC) configured
- ✅ Minimal IAM permissions for deployment
- ✅ No sensitive data in repository

## Documentation

- 📚 [AWS Setup Guide](../AWS_SETUP_GUIDE.md) - Complete AWS S3 + CloudFront setup
- 🚀 [GitHub Actions Setup](../GITHUB_ACTIONS_SETUP.md) - CI/CD configuration
- 📦 [GitHub Project Setup](../GITHUB_PROJECT_SETUP.md) - Project management

## Resources

- [AWS S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Neural Tools Main Repository](../README.md)
