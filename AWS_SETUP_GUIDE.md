# AWS S3 + CloudFront Setup Guide for Neural Tools Website

Complete guide for hosting your static website on AWS S3 with CloudFront CDN.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [S3 Bucket Setup](#s3-bucket-setup)
3. [CloudFront Distribution Setup](#cloudfront-distribution-setup)
4. [SSL Certificate Setup](#ssl-certificate-setup)
5. [DNS Configuration](#dns-configuration)
6. [GitHub Actions CI/CD](#github-actions-cicd)
7. [Testing & Validation](#testing--validation)

## Prerequisites

### 1. Install AWS CLI

```bash
# macOS
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Verify installation
aws --version
```

### 2. Configure AWS CLI

```bash
# Configure with your credentials
aws configure

# You'll need:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region: us-east-1 (recommended for CloudFront)
# - Default output format: json
```

### 3. Set Environment Variables

```bash
export BUCKET_NAME="neural-tools.com"  # Replace with your domain
export CLOUDFRONT_COMMENT="Neural Tools Website"
export AWS_REGION="us-east-1"
```

## S3 Bucket Setup

### Step 1: Create S3 Bucket

```bash
# Create the bucket
aws s3 mb s3://$BUCKET_NAME --region $AWS_REGION

# Verify bucket was created
aws s3 ls | grep $BUCKET_NAME
```

### Step 2: Enable Static Website Hosting

```bash
# Enable static website hosting
aws s3 website s3://$BUCKET_NAME \
  --index-document index.html \
  --error-document index.html
```

### Step 3: Configure Bucket Policy

When using CloudFront with Origin Access Control (OAC), you'll update this policy later. For now, we'll set it up for CloudFront access:

```bash
# Create bucket policy file
cat > bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::YOUR_ACCOUNT_ID:distribution/YOUR_DISTRIBUTION_ID"
        }
      }
    }
  ]
}
EOF

# Note: We'll update this after creating CloudFront distribution
```

### Step 4: Block Public Access Settings

Since we're using CloudFront, we should keep the bucket private:

```bash
# Block public access (CloudFront will access via OAC)
aws s3api put-public-access-block \
  --bucket $BUCKET_NAME \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

## CloudFront Distribution Setup

### Step 1: Create Origin Access Control (OAC)

```bash
# Create OAC configuration
cat > oac-config.json <<EOF
{
  "Name": "neural-tools-oac",
  "Description": "OAC for Neural Tools website",
  "SigningProtocol": "sigv4",
  "SigningBehavior": "always",
  "OriginAccessControlOriginType": "s3"
}
EOF

# Create OAC
aws cloudfront create-origin-access-control \
  --origin-access-control-config file://oac-config.json

# Save the OAC ID from the output
export OAC_ID="<your-oac-id>"
```

### Step 2: Create CloudFront Distribution

```bash
# Create distribution configuration
cat > cloudfront-config.json <<EOF
{
  "CallerReference": "neural-tools-$(date +%s)",
  "Comment": "$CLOUDFRONT_COMMENT",
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-$BUCKET_NAME",
        "DomainName": "$BUCKET_NAME.s3.$AWS_REGION.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        },
        "OriginAccessControlId": "$OAC_ID"
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-$BUCKET_NAME",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
    "Compress": true,
    "MinTTL": 0,
    "DefaultTTL": 3600,
    "MaxTTL": 86400
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  },
  "PriceClass": "PriceClass_100",
  "ViewerCertificate": {
    "CloudFrontDefaultCertificate": true,
    "MinimumProtocolVersion": "TLSv1.2_2021"
  }
}
EOF

# Create distribution
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json

# Save the distribution ID from output
export DISTRIBUTION_ID="<your-distribution-id>"
```

### Step 3: Update S3 Bucket Policy for CloudFront

Get your AWS Account ID:

```bash
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
```

Update bucket policy:

```bash
cat > bucket-policy-cloudfront.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::$AWS_ACCOUNT_ID:distribution/$DISTRIBUTION_ID"
        }
      }
    }
  ]
}
EOF

aws s3api put-bucket-policy \
  --bucket $BUCKET_NAME \
  --policy file://bucket-policy-cloudfront.json
```

## SSL Certificate Setup

### Step 1: Request Certificate in ACM

**IMPORTANT**: Certificate must be in us-east-1 region for CloudFront

```bash
# Request certificate
aws acm request-certificate \
  --domain-name $BUCKET_NAME \
  --subject-alternative-names "www.$BUCKET_NAME" \
  --validation-method DNS \
  --region us-east-1

# Save certificate ARN from output
export CERTIFICATE_ARN="<your-certificate-arn>"

# Get validation records
aws acm describe-certificate \
  --certificate-arn $CERTIFICATE_ARN \
  --region us-east-1
```

### Step 2: Validate Certificate via DNS

Add the CNAME records shown in the certificate details to your DNS provider.

```bash
# Check certificate status
aws acm describe-certificate \
  --certificate-arn $CERTIFICATE_ARN \
  --region us-east-1 \
  --query 'Certificate.Status' \
  --output text

# Wait for status to be "ISSUED"
```

### Step 3: Update CloudFront to Use SSL Certificate

```bash
# Get current distribution config
aws cloudfront get-distribution-config \
  --id $DISTRIBUTION_ID \
  --output json > dist-config.json

# Edit the config to add your certificate
# Update the ViewerCertificate section:
# {
#   "ACMCertificateArn": "$CERTIFICATE_ARN",
#   "SSLSupportMethod": "sni-only",
#   "MinimumProtocolVersion": "TLSv1.2_2021"
# }

# Get the ETag
export ETAG=$(jq -r '.ETag' dist-config.json)

# Update distribution
aws cloudfront update-distribution \
  --id $DISTRIBUTION_ID \
  --distribution-config file://dist-config-updated.json \
  --if-match $ETAG
```

## DNS Configuration

### Point Your Domain to CloudFront

Get your CloudFront domain name:

```bash
aws cloudfront get-distribution \
  --id $DISTRIBUTION_ID \
  --query 'Distribution.DomainName' \
  --output text
```

Add these DNS records to your domain registrar:

```
Type: CNAME
Name: www
Value: d1234567890.cloudfront.net (your CloudFront domain)
TTL: 300

Type: A (Alias if available) or CNAME
Name: @ (or apex domain)
Value: d1234567890.cloudfront.net
TTL: 300
```

**Note**: For apex domain (@), use Route53 or a DNS provider that supports ALIAS records pointing to CloudFront.

## GitHub Actions CI/CD

The GitHub Actions workflow is configured in `.github/workflows/deploy-website.yml`.

### Required GitHub Secrets

Add these secrets in your GitHub repository settings (Settings → Secrets → Actions):

```
AWS_ACCESS_KEY_ID       - Your AWS access key
AWS_SECRET_ACCESS_KEY   - Your AWS secret key
AWS_S3_BUCKET          - Your S3 bucket name (e.g., neural-tools.com)
AWS_CLOUDFRONT_ID      - Your CloudFront distribution ID
```

### Manual Deployment

You can also deploy manually:

```bash
# From the website directory
cd website
./deploy.sh neural-tools.com

# Or using the GitHub workflow
gh workflow run deploy-website.yml
```

## Testing & Validation

### Test S3 Upload

```bash
# Upload a test file
echo "Test" > test.html
aws s3 cp test.html s3://$BUCKET_NAME/
aws s3 rm s3://$BUCKET_NAME/test.html
```

### Test CloudFront Distribution

```bash
# Get distribution status
aws cloudfront get-distribution \
  --id $DISTRIBUTION_ID \
  --query 'Distribution.Status' \
  --output text

# Should show "Deployed"
```

### Test Website Access

```bash
# Test CloudFront URL
curl -I https://d1234567890.cloudfront.net

# Test custom domain (after DNS propagation)
curl -I https://neural-tools.com
```

### Invalidate CloudFront Cache

After deploying updates:

```bash
# Invalidate all files
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"

# Invalidate specific files
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/index.html" "/styles.css"
```

## Monitoring & Costs

### Enable CloudFront Logging

```bash
# Create logging bucket
aws s3 mb s3://neural-tools-logs --region $AWS_REGION

# Update CloudFront distribution to enable logging
# (Use AWS Console or update distribution config)
```

### Monitor Costs

```bash
# Check current month costs
aws ce get-cost-and-usage \
  --time-period Start=$(date -d "$(date +%Y-%m-01)" +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics UnblendedCost \
  --group-by Type=SERVICE
```

### Expected Costs

- **S3 Storage**: ~$0.023/GB/month
- **S3 Requests**: ~$0.0004 per 1,000 GET requests
- **CloudFront**: First 1 TB free for 12 months, then ~$0.085/GB
- **Data Transfer**: First 1 GB/month free
- **ACM Certificate**: FREE

**Estimated monthly cost for small site**: $1-5/month

## Troubleshooting

### Issue: 403 Forbidden Error

```bash
# Check bucket policy
aws s3api get-bucket-policy --bucket $BUCKET_NAME

# Check CloudFront OAC
aws cloudfront get-origin-access-control --id $OAC_ID
```

### Issue: CloudFront Serving Stale Content

```bash
# Clear cache
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

### Issue: DNS Not Resolving

```bash
# Check DNS propagation
dig neural-tools.com
nslookup neural-tools.com

# Check CloudFront distribution status
aws cloudfront get-distribution --id $DISTRIBUTION_ID
```

## Security Best Practices

1. ✅ Use HTTPS only (redirect HTTP to HTTPS)
2. ✅ Enable CloudFront Origin Access Control (OAC)
3. ✅ Block direct S3 bucket access
4. ✅ Use least-privilege IAM policies
5. ✅ Enable CloudFront logging
6. ✅ Rotate AWS access keys regularly
7. ✅ Use AWS Secrets Manager for sensitive data

## Quick Reference Commands

```bash
# Deploy website
cd website && ./deploy.sh neural-tools.com

# Invalidate cache
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"

# Check distribution status
aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.Status'

# View CloudFront domain
aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.DomainName'

# List S3 files
aws s3 ls s3://$BUCKET_NAME --recursive

# Sync local to S3
aws s3 sync website/ s3://$BUCKET_NAME --delete
```

## Resources

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [ACM Documentation](https://docs.aws.amazon.com/acm/)
- [AWS CLI Reference](https://docs.aws.amazon.com/cli/)
