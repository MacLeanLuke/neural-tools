#!/bin/bash

# Invalidate CloudFront Cache
# Usage: ./invalidate-cache.sh [distribution-id] [paths]

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get distribution ID from argument or environment
DISTRIBUTION_ID="${1:-$AWS_CLOUDFRONT_ID}"

if [ -z "$DISTRIBUTION_ID" ]; then
    echo -e "${YELLOW}Usage: ./invalidate-cache.sh <distribution-id> [paths]${NC}"
    echo ""
    echo "Examples:"
    echo "  ./invalidate-cache.sh E1234567890ABC"
    echo "  ./invalidate-cache.sh E1234567890ABC '/index.html' '/styles.css'"
    echo "  AWS_CLOUDFRONT_ID=E1234567890ABC ./invalidate-cache.sh"
    echo ""
    echo "Or set AWS_CLOUDFRONT_ID environment variable:"
    echo "  export AWS_CLOUDFRONT_ID=E1234567890ABC"
    exit 1
fi

# Get paths from arguments or default to all files
PATHS="${2:-/*}"

echo -e "${BLUE}🔄 CloudFront Cache Invalidation${NC}"
echo ""
echo "Distribution ID: $DISTRIBUTION_ID"
echo "Paths: $PATHS"
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not installed"
    exit 1
fi

# Create invalidation
echo "Creating invalidation..."
INVALIDATION_OUTPUT=$(aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "$PATHS" 2>&1)

if [ $? -eq 0 ]; then
    INVALIDATION_ID=$(echo "$INVALIDATION_OUTPUT" | jq -r '.Invalidation.Id')
    STATUS=$(echo "$INVALIDATION_OUTPUT" | jq -r '.Invalidation.Status')

    echo -e "${GREEN}✓${NC} Invalidation created successfully!"
    echo ""
    echo "Invalidation ID: $INVALIDATION_ID"
    echo "Status: $STATUS"
    echo ""
    echo "Monitor progress:"
    echo "  aws cloudfront get-invalidation --distribution-id $DISTRIBUTION_ID --id $INVALIDATION_ID"
    echo ""
    echo "Note: Invalidations typically complete in 1-3 minutes"
else
    echo "❌ Failed to create invalidation"
    echo "$INVALIDATION_OUTPUT"
    exit 1
fi
