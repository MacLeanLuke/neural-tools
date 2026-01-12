#!/bin/bash

# Deploy Neural Tools website to AWS S3
# Usage: ./deploy.sh [bucket-name]

set -e

# Configuration
BUCKET_NAME="${1:-neural-tools.com}"  # Use argument or default
REGION="us-east-1"

echo "🚀 Deploying Neural Tools website to S3..."
echo "Bucket: $BUCKET_NAME"
echo "Region: $REGION"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Install it first:"
    echo "   brew install awscli  # macOS"
    echo "   pip install awscli   # Python"
    exit 1
fi

# Check if bucket exists
if ! aws s3 ls "s3://$BUCKET_NAME" 2>&1 > /dev/null; then
    echo "⚠️  Bucket does not exist. Create it? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo "Creating bucket..."
        aws s3 mb "s3://$BUCKET_NAME" --region $REGION

        echo "Enabling static website hosting..."
        aws s3 website "s3://$BUCKET_NAME" \
          --index-document index.html \
          --error-document index.html

        echo "Setting bucket policy for public read..."
        cat > /tmp/bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
EOF
        aws s3api put-bucket-policy \
          --bucket $BUCKET_NAME \
          --policy file:///tmp/bucket-policy.json

        rm /tmp/bucket-policy.json
        echo "✅ Bucket created and configured"
    else
        echo "❌ Deployment cancelled"
        exit 1
    fi
fi

# Sync files to S3
echo "📦 Uploading files..."
aws s3 sync . "s3://$BUCKET_NAME" \
  --exclude "*.md" \
  --exclude "*.sh" \
  --exclude ".git/*" \
  --exclude ".DS_Store" \
  --cache-control "public, max-age=3600" \
  --delete

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📍 Website URL:"
echo "   http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
echo ""
echo "💡 Next steps:"
echo "   1. Configure CloudFront for HTTPS (recommended)"
echo "   2. Point your domain DNS to S3 or CloudFront"
echo "   3. Request SSL certificate in ACM"
echo ""
