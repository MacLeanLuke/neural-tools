#!/bin/bash

# Setup CloudFront Function to redirect apex domain to www
# This script creates and deploys a CloudFront Function that redirects
# https://neural-tools.com/* to https://www.neural-tools.com/*

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DISTRIBUTION_ID="E17ZYFBZN45OZ7"
FUNCTION_NAME="neural-tools-www-redirect"
FUNCTION_FILE="cloudfront-function-redirect.js"

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    Setup WWW Redirect for Neural Tools        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Check if function file exists
if [ ! -f "$FUNCTION_FILE" ]; then
    echo -e "${RED}❌ Function file not found: $FUNCTION_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Function file found: $FUNCTION_FILE"

# Step 1: Check if function already exists
echo ""
echo -e "${BLUE}Step 1: Checking for existing function${NC}"
FUNCTION_ARN=$(aws cloudfront list-functions \
  --query "FunctionList.Items[?Name=='$FUNCTION_NAME'].FunctionMetadata.FunctionARN" \
  --output text 2>/dev/null || echo "")

if [ -z "$FUNCTION_ARN" ]; then
    echo -e "${YELLOW}⚠${NC}  Function does not exist, creating new function..."

    # Create new function
    CREATE_OUTPUT=$(aws cloudfront create-function \
      --name "$FUNCTION_NAME" \
      --function-config Comment="Redirect apex domain to www subdomain",Runtime=cloudfront-js-2.0 \
      --function-code fileb://$FUNCTION_FILE)

    FUNCTION_ARN=$(echo "$CREATE_OUTPUT" | jq -r '.FunctionSummary.FunctionMetadata.FunctionARN')
    ETAG=$(echo "$CREATE_OUTPUT" | jq -r '.ETag')

    echo -e "${GREEN}✓${NC} Function created: $FUNCTION_ARN"
else
    echo -e "${YELLOW}⚠${NC}  Function exists, updating..."

    # Get current ETag
    DESCRIBE_OUTPUT=$(aws cloudfront describe-function --name "$FUNCTION_NAME")
    ETAG=$(echo "$DESCRIBE_OUTPUT" | jq -r '.ETag')

    # Update function code
    UPDATE_OUTPUT=$(aws cloudfront update-function \
      --name "$FUNCTION_NAME" \
      --function-config Comment="Redirect apex domain to www subdomain",Runtime=cloudfront-js-2.0 \
      --function-code fileb://$FUNCTION_FILE \
      --if-match "$ETAG")

    ETAG=$(echo "$UPDATE_OUTPUT" | jq -r '.ETag')

    echo -e "${GREEN}✓${NC} Function updated: $FUNCTION_ARN"
fi

# Step 2: Publish the function
echo ""
echo -e "${BLUE}Step 2: Publishing function${NC}"
PUBLISH_OUTPUT=$(aws cloudfront publish-function \
  --name "$FUNCTION_NAME" \
  --if-match "$ETAG")

ETAG=$(echo "$PUBLISH_OUTPUT" | jq -r '.ETag')
echo -e "${GREEN}✓${NC} Function published"

# Step 3: Get current CloudFront distribution config
echo ""
echo -e "${BLUE}Step 3: Fetching CloudFront distribution config${NC}"
aws cloudfront get-distribution-config \
  --id "$DISTRIBUTION_ID" \
  --output json > /tmp/cloudfront-dist-config.json

DIST_ETAG=$(jq -r '.ETag' /tmp/cloudfront-dist-config.json)
echo "Distribution ETag: $DIST_ETAG"

# Step 4: Update distribution to attach function
echo ""
echo -e "${BLUE}Step 4: Attaching function to distribution${NC}"

# Extract config and add function association
jq --arg func_arn "$FUNCTION_ARN" '
  .DistributionConfig.DefaultCacheBehavior.FunctionAssociations = {
    "Quantity": 1,
    "Items": [
      {
        "FunctionARN": $func_arn,
        "EventType": "viewer-request"
      }
    ]
  }
' /tmp/cloudfront-dist-config.json | jq '.DistributionConfig' > /tmp/cloudfront-dist-config-updated.json

# Update the distribution
aws cloudfront update-distribution \
  --id "$DISTRIBUTION_ID" \
  --distribution-config file:///tmp/cloudfront-dist-config-updated.json \
  --if-match "$DIST_ETAG" \
  --output json > /tmp/cloudfront-update-result.json

echo -e "${GREEN}✓${NC} Function attached to distribution"

# Step 5: Check deployment status
echo ""
echo -e "${BLUE}Step 5: Checking deployment status${NC}"
STATUS=$(aws cloudfront get-distribution --id "$DISTRIBUTION_ID" --query 'Distribution.Status' --output text)
echo "Status: $STATUS"

# Cleanup temp files
rm -f /tmp/cloudfront-dist-config.json /tmp/cloudfront-dist-config-updated.json /tmp/cloudfront-update-result.json

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           WWW Redirect Setup Complete! 🎉      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}What was configured:${NC}"
echo ""
echo "✓ CloudFront Function: $FUNCTION_NAME"
echo "✓ Function ARN: $FUNCTION_ARN"
echo "✓ Attached to Distribution: $DISTRIBUTION_ID"
echo "✓ Event Type: viewer-request"
echo ""
echo -e "${YELLOW}How it works:${NC}"
echo ""
echo "• Requests to https://neural-tools.com/* will be redirected"
echo "• Redirect target: https://www.neural-tools.com/*"
echo "• HTTP Status: 301 Moved Permanently"
echo "• Query strings and paths are preserved"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1. Wait for CloudFront to deploy the changes (5-15 minutes)"
echo "   Check: aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.Status'"
echo ""
echo "2. Test the redirect:"
echo "   curl -I https://neural-tools.com"
echo "   # Should return: HTTP/2 301"
echo "   # Location: https://www.neural-tools.com/"
echo ""
echo "3. Test in browser:"
echo "   https://neural-tools.com → should redirect to https://www.neural-tools.com"
echo ""
echo -e "${BLUE}📚 CloudFront Functions are free for the first 2 million invocations/month!${NC}"
echo ""
