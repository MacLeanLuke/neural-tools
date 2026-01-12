# Neural Tools Website

Static website for Neural Tools. Hosted on AWS S3.

## Local Development

Open `index.html` in your browser:

```bash
cd website
open index.html
# or use a local server
python3 -m http.server 8000
```

Visit http://localhost:8000

## Deploy to AWS S3

### Prerequisites

- AWS CLI installed and configured
- S3 bucket created
- Bucket configured for static website hosting

### Create S3 Bucket

```bash
# Set your bucket name (use your domain)
BUCKET_NAME="neural-tools.com"  # Replace with your domain

# Create bucket
aws s3 mb s3://$BUCKET_NAME --region us-east-1

# Enable static website hosting
aws s3 website s3://$BUCKET_NAME \
  --index-document index.html \
  --error-document index.html

# Set bucket policy for public read access
cat > bucket-policy.json <<EOF
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
  --policy file://bucket-policy.json
```

### Deploy

```bash
# Deploy website
./deploy.sh

# Or manually:
aws s3 sync . s3://$BUCKET_NAME \
  --exclude "*.md" \
  --exclude "*.sh" \
  --exclude ".git/*" \
  --cache-control "public, max-age=3600"
```

### Configure CloudFront (Optional but Recommended)

For HTTPS and better performance:

1. Create CloudFront distribution pointing to your S3 bucket
2. Request SSL certificate in AWS Certificate Manager
3. Update CloudFront to use your certificate
4. Point your domain to CloudFront distribution

```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name $BUCKET_NAME.s3-website-us-east-1.amazonaws.com \
  --default-root-object index.html
```

### DNS Configuration

Point your domain to S3 or CloudFront:

**For S3 only:**
- Create CNAME record: `www` → `neural-tools.com.s3-website-us-east-1.amazonaws.com`
- Create A record for apex domain (depends on DNS provider)

**For CloudFront:**
- Create CNAME record: `www` → `d1234567890.cloudfront.net`
- Create A record (alias) for apex → CloudFront distribution

## Files

- `index.html` - Main landing page
- `styles.css` - Styling
- `script.js` - Interactive features
- `deploy.sh` - Deployment script

## Cache Control

Files are cached for 1 hour. To force immediate update:

```bash
# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

## Monitoring

View website stats:

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
```
