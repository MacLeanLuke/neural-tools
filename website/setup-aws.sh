#!/bin/bash

# Setup AWS S3 + CloudFront for Neural Tools Website
# This script automates the complete setup process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BUCKET_NAME="${BUCKET_NAME:-neural-tools.com}"
AWS_REGION="${AWS_REGION:-us-east-1}"
CLOUDFRONT_COMMENT="Neural Tools Website"

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  AWS S3 + CloudFront Setup for Neural Tools   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed${NC}"
    echo "Install it with:"
    echo "  macOS:  brew install awscli"
    echo "  Linux:  See https://aws.amazon.com/cli/"
    exit 1
fi

echo -e "${GREEN}✓${NC} AWS CLI found: $(aws --version)"

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    echo "Run: aws configure"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✓${NC} AWS Account: $ACCOUNT_ID"
echo ""

# Confirm setup
echo -e "${YELLOW}Configuration:${NC}"
echo "  Bucket Name: $BUCKET_NAME"
echo "  Region: $AWS_REGION"
echo "  Account: $ACCOUNT_ID"
echo ""
read -p "Continue with this configuration? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled"
    exit 1
fi

# Step 1: Create S3 Bucket
echo ""
echo -e "${BLUE}Step 1: Creating S3 Bucket${NC}"
if aws s3 ls "s3://$BUCKET_NAME" 2>&1 > /dev/null; then
    echo -e "${YELLOW}⚠${NC} Bucket already exists"
else
    aws s3 mb "s3://$BUCKET_NAME" --region $AWS_REGION
    echo -e "${GREEN}✓${NC} Bucket created"
fi

# Step 2: Enable static website hosting
echo ""
echo -e "${BLUE}Step 2: Enabling Static Website Hosting${NC}"
aws s3 website "s3://$BUCKET_NAME" \
  --index-document index.html \
  --error-document index.html
echo -e "${GREEN}✓${NC} Static website hosting enabled"

# Step 3: Block public access (we'll use CloudFront)
echo ""
echo -e "${BLUE}Step 3: Configuring Bucket Security${NC}"
aws s3api put-public-access-block \
  --bucket $BUCKET_NAME \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
echo -e "${GREEN}✓${NC} Public access blocked (will use CloudFront)"

# Step 4: Create Origin Access Control
echo ""
echo -e "${BLUE}Step 4: Creating CloudFront Origin Access Control${NC}"

# Check if OAC already exists
OAC_NAME="neural-tools-oac"
OAC_ID=$(aws cloudfront list-origin-access-controls \
  --query "OriginAccessControlList.Items[?Name=='$OAC_NAME'].Id" \
  --output text 2>/dev/null || echo "")

if [ -z "$OAC_ID" ] || [ "$OAC_ID" = "None" ]; then
    cat > /tmp/oac-config.json <<EOF
{
  "Name": "$OAC_NAME",
  "Description": "OAC for Neural Tools website",
  "SigningProtocol": "sigv4",
  "SigningBehavior": "always",
  "OriginAccessControlOriginType": "s3"
}
EOF

    OAC_OUTPUT=$(aws cloudfront create-origin-access-control \
      --origin-access-control-config file:///tmp/oac-config.json)
    OAC_ID=$(echo $OAC_OUTPUT | jq -r '.OriginAccessControl.Id')
    rm /tmp/oac-config.json
    echo -e "${GREEN}✓${NC} OAC created: $OAC_ID"
else
    echo -e "${YELLOW}⚠${NC} OAC already exists: $OAC_ID"
fi

# Step 5: Create CloudFront Distribution
echo ""
echo -e "${BLUE}Step 5: Creating CloudFront Distribution${NC}"
echo "This may take 10-15 minutes..."

cat > /tmp/cloudfront-config.json <<EOF
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
    "Compress": true,
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
    "MinTTL": 0,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    }
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

DIST_OUTPUT=$(aws cloudfront create-distribution --distribution-config file:///tmp/cloudfront-config.json)
DISTRIBUTION_ID=$(echo $DIST_OUTPUT | jq -r '.Distribution.Id')
CLOUDFRONT_DOMAIN=$(echo $DIST_OUTPUT | jq -r '.Distribution.DomainName')
rm /tmp/cloudfront-config.json

echo -e "${GREEN}✓${NC} CloudFront distribution created"
echo "  Distribution ID: $DISTRIBUTION_ID"
echo "  Domain: $CLOUDFRONT_DOMAIN"

# Step 6: Update S3 Bucket Policy
echo ""
echo -e "${BLUE}Step 6: Updating S3 Bucket Policy for CloudFront${NC}"

cat > /tmp/bucket-policy.json <<EOF
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
          "AWS:SourceArn": "arn:aws:cloudfront::$ACCOUNT_ID:distribution/$DISTRIBUTION_ID"
        }
      }
    }
  ]
}
EOF

aws s3api put-bucket-policy \
  --bucket $BUCKET_NAME \
  --policy file:///tmp/bucket-policy.json
rm /tmp/bucket-policy.json

echo -e "${GREEN}✓${NC} Bucket policy updated"

# Step 7: Deploy website
echo ""
echo -e "${BLUE}Step 7: Deploying Website${NC}"

aws s3 sync . "s3://$BUCKET_NAME" \
  --exclude "*.md" \
  --exclude "*.sh" \
  --exclude ".git/*" \
  --exclude ".DS_Store" \
  --cache-control "public, max-age=3600" \
  --delete

echo -e "${GREEN}✓${NC} Website deployed to S3"

# Summary
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║            Setup Complete! 🎉                  ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Important Information:${NC}"
echo ""
echo "📦 S3 Bucket: $BUCKET_NAME"
echo "🌐 CloudFront Distribution ID: $DISTRIBUTION_ID"
echo "🔗 CloudFront Domain: https://$CLOUDFRONT_DOMAIN"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1. Wait for CloudFront deployment (10-15 minutes)"
echo "   Check status: aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.Status'"
echo ""
echo "2. Test your website:"
echo "   https://$CLOUDFRONT_DOMAIN"
echo ""
echo "3. (Optional) Set up SSL certificate:"
echo "   - Request certificate in ACM (us-east-1 region)"
echo "   - Update CloudFront to use your certificate"
echo "   See: AWS_SETUP_GUIDE.md"
echo ""
echo "4. (Optional) Configure custom domain:"
echo "   - Add CNAME record: $BUCKET_NAME -> $CLOUDFRONT_DOMAIN"
echo "   See: AWS_SETUP_GUIDE.md"
echo ""
echo "5. Set up GitHub Actions secrets:"
echo "   AWS_ACCESS_KEY_ID"
echo "   AWS_SECRET_ACCESS_KEY"
echo "   AWS_S3_BUCKET=$BUCKET_NAME"
echo "   AWS_CLOUDFRONT_ID=$DISTRIBUTION_ID"
echo ""
echo -e "${BLUE}📚 Full documentation: AWS_SETUP_GUIDE.md${NC}"
echo ""

# Save configuration
cat > /tmp/neural-tools-aws-config.txt <<EOF
# Neural Tools AWS Configuration
# Generated: $(date)

AWS_ACCOUNT_ID=$ACCOUNT_ID
AWS_REGION=$AWS_REGION
AWS_S3_BUCKET=$BUCKET_NAME
AWS_CLOUDFRONT_ID=$DISTRIBUTION_ID
CLOUDFRONT_DOMAIN=$CLOUDFRONT_DOMAIN
OAC_ID=$OAC_ID

# CloudFront URL
https://$CLOUDFRONT_DOMAIN

# Use these values for GitHub Secrets
EOF

echo -e "${GREEN}✓${NC} Configuration saved to: /tmp/neural-tools-aws-config.txt"
echo ""
cat /tmp/neural-tools-aws-config.txt
