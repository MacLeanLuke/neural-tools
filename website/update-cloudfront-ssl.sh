#!/bin/bash

# Update CloudFront with Custom Domain and SSL Certificate
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
DISTRIBUTION_ID="E17ZYFBZN45OZ7"
CERTIFICATE_ARN="arn:aws:acm:us-east-1:868368992932:certificate/eb60ea1e-7f46-4e89-b947-2e90128754e4"

echo -e "${BLUE}Updating CloudFront Distribution${NC}"
echo "Distribution ID: $DISTRIBUTION_ID"
echo ""

# Step 1: Get current configuration
echo -e "${BLUE}Step 1: Fetching current distribution config${NC}"
aws cloudfront get-distribution-config \
  --id $DISTRIBUTION_ID \
  --output json > /tmp/cloudfront-config.json

ETAG=$(jq -r '.ETag' /tmp/cloudfront-config.json)
echo "Current ETag: $ETAG"

# Step 2: Extract and modify the config
echo -e "${BLUE}Step 2: Updating configuration${NC}"
jq '.DistributionConfig' /tmp/cloudfront-config.json > /tmp/cloudfront-config-only.json

# Update with custom domains and SSL certificate
jq --arg cert "$CERTIFICATE_ARN" '.Aliases = {
  "Quantity": 2,
  "Items": ["neural-tools.com", "www.neural-tools.com"]
} | .ViewerCertificate = {
  "ACMCertificateArn": $cert,
  "SSLSupportMethod": "sni-only",
  "MinimumProtocolVersion": "TLSv1.2_2021",
  "Certificate": $cert,
  "CertificateSource": "acm"
}' /tmp/cloudfront-config-only.json > /tmp/cloudfront-config-updated.json

echo -e "${GREEN}✓${NC} Custom domains: neural-tools.com, www.neural-tools.com"
echo -e "${GREEN}✓${NC} SSL certificate attached"

# Step 3: Update the distribution
echo -e "${BLUE}Step 3: Applying changes to CloudFront${NC}"
echo "This may take a few minutes..."

aws cloudfront update-distribution \
  --id $DISTRIBUTION_ID \
  --distribution-config file:///tmp/cloudfront-config-updated.json \
  --if-match $ETAG \
  --output json > /tmp/cloudfront-update-result.json

echo -e "${GREEN}✓${NC} Distribution updated successfully!"

# Step 4: Get distribution status
echo ""
echo -e "${BLUE}Distribution Status:${NC}"
STATUS=$(aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.Status' --output text)
echo "Status: $STATUS"

# Cleanup
rm -f /tmp/cloudfront-config.json /tmp/cloudfront-config-only.json /tmp/cloudfront-config-updated.json

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         CloudFront Update Complete! 🎉         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1. Wait for CloudFront to deploy (5-15 minutes)"
echo "   Check status: aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.Status'"
echo ""
echo "2. Update Squarespace DNS:"
echo ""
echo "   For ROOT domain (neural-tools.com):"
echo "   - Squarespace doesn't support CNAME on root"
echo "   - Option A: Use domain forwarding neural-tools.com → www.neural-tools.com"
echo "   - Option B: Check if Squarespace supports ALIAS/ANAME records"
echo ""
echo "   The www CNAME is already set up ✓"
echo ""
echo "3. Test your site:"
echo "   - https://www.neural-tools.com (should work once DNS propagates)"
echo "   - https://neural-tools.com (after setting up root domain redirect)"
echo ""
echo -e "${BLUE}Your site will be live with HTTPS once CloudFront finishes deploying!${NC}"
echo ""
