# WWW Redirect Setup for Neural Tools

## Problem

Currently, `https://neural-tools.com/` does not redirect to `https://www.neural-tools.com/`. This document explains how to fix this using a CloudFront Function.

## Solution Overview

We'll use a **CloudFront Function** to handle the redirect at the CDN edge. This is the most cost-effective solution:

- ✅ **Free**: First 2 million invocations/month
- ✅ **Fast**: Runs at CloudFront edge locations worldwide
- ✅ **Simple**: No additional infrastructure needed
- ✅ **Preserves**: Query strings and URL paths

## Files Created

1. **`cloudfront-function-redirect.js`** - The CloudFront Function code that performs the redirect
2. **`setup-www-redirect.sh`** - Automated deployment script
3. **`WWW_REDIRECT_SETUP.md`** - This documentation

## Quick Setup (Automated)

### Prerequisites

- AWS CLI installed and configured
- Permissions to modify CloudFront distributions
- Access to distribution ID: `E17ZYFBZN45OZ7`

### Run the Setup Script

```bash
cd website
./setup-www-redirect.sh
```

This script will:
1. Create/update the CloudFront Function
2. Publish the function
3. Attach it to your CloudFront distribution
4. Configure it to run on viewer requests

Wait 5-15 minutes for CloudFront to deploy the changes.

## Manual Setup

If you prefer to set this up manually or the script fails:

### Step 1: Create CloudFront Function

```bash
# Navigate to website directory
cd website

# Create the function
aws cloudfront create-function \
  --name "neural-tools-www-redirect" \
  --function-config Comment="Redirect apex domain to www subdomain",Runtime=cloudfront-js-2.0 \
  --function-code fileb://cloudfront-function-redirect.js

# Save the FunctionARN from the output
```

### Step 2: Publish the Function

```bash
# Get the ETag from the previous output
ETAG="<etag-from-create-output>"

# Publish the function
aws cloudfront publish-function \
  --name "neural-tools-www-redirect" \
  --if-match "$ETAG"
```

### Step 3: Attach to CloudFront Distribution

```bash
DISTRIBUTION_ID="E17ZYFBZN45OZ7"
FUNCTION_ARN="<function-arn-from-create-output>"

# Get current distribution config
aws cloudfront get-distribution-config \
  --id "$DISTRIBUTION_ID" \
  --output json > dist-config.json

# Extract ETag and config
DIST_ETAG=$(jq -r '.ETag' dist-config.json)

# Update the config to add function association
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
' dist-config.json | jq '.DistributionConfig' > dist-config-updated.json

# Apply the update
aws cloudfront update-distribution \
  --id "$DISTRIBUTION_ID" \
  --distribution-config file://dist-config-updated.json \
  --if-match "$DIST_ETAG"
```

### Step 4: Wait for Deployment

```bash
# Check deployment status
aws cloudfront get-distribution \
  --id "$DISTRIBUTION_ID" \
  --query 'Distribution.Status' \
  --output text

# Wait until it shows "Deployed" (5-15 minutes)
```

## Using AWS Console (Alternative)

If you prefer using the AWS Console:

### Step 1: Create CloudFront Function

1. Go to [CloudFront Console](https://console.aws.amazon.com/cloudfront/v3/home)
2. Click **Functions** in the left sidebar
3. Click **Create function**
4. Name: `neural-tools-www-redirect`
5. Runtime: `cloudfront-js-2.0`
6. Copy the code from `cloudfront-function-redirect.js`
7. Click **Create function**

### Step 2: Publish the Function

1. In the function details page, click **Publish**
2. Wait for publish to complete

### Step 3: Associate with Distribution

1. Go to **Distributions** in CloudFront Console
2. Select distribution `E17ZYFBZN45OZ7`
3. Go to **Behaviors** tab
4. Select the **Default (*)** behavior
5. Click **Edit**
6. Scroll to **Function associations**
7. Under **Viewer request**, select your function:
   - Type: `CloudFront Functions`
   - Function: `neural-tools-www-redirect`
8. Click **Save changes**

### Step 4: Wait for Deployment

Wait 5-15 minutes for CloudFront to deploy. Status will change from "In Progress" to "Deployed".

## Testing

After deployment completes, test the redirect:

### Using curl

```bash
# Test the redirect
curl -I https://neural-tools.com

# Expected output:
# HTTP/2 301
# location: https://www.neural-tools.com/

# Test with a specific page
curl -I https://neural-tools.com/docs/

# Expected:
# HTTP/2 301
# location: https://www.neural-tools.com/docs/
```

### Using Browser

1. Open `https://neural-tools.com` in your browser
2. It should automatically redirect to `https://www.neural-tools.com`
3. Check the browser's developer tools (Network tab) to see the 301 redirect

### Test Query String Preservation

```bash
curl -I "https://neural-tools.com/search?q=test"

# Expected:
# HTTP/2 301
# location: https://www.neural-tools.com/search?q=test
```

## How It Works

The CloudFront Function runs on every viewer request **before** it reaches the origin:

1. **Request arrives** at CloudFront edge location
2. **Function checks** the `Host` header
3. **If host is `neural-tools.com`**:
   - Constructs redirect URL: `https://www.neural-tools.com` + path + query
   - Returns `301 Moved Permanently` response with `Location` header
4. **If host is `www.neural-tools.com`**:
   - Request continues normally to origin (S3 bucket)

### Function Code Explanation

```javascript
function handler(event) {
    var request = event.request;
    var host = request.headers.host.value;

    // Check if request is to apex domain
    if (host === 'neural-tools.com') {
        // Build redirect URL with path and query string
        var redirectUrl = 'https://www.neural-tools.com' + request.uri;

        // Add query string if present
        if (request.querystring && Object.keys(request.querystring).length > 0) {
            // ... query string handling ...
            redirectUrl += '?' + queryParams.join('&');
        }

        // Return 301 redirect
        return {
            statusCode: 301,
            statusDescription: 'Moved Permanently',
            headers: {
                'location': { value: redirectUrl },
                'cache-control': { value: 'max-age=3600' }
            }
        };
    }

    // Continue with normal request
    return request;
}
```

## Costs

CloudFront Functions pricing:

- **First 2 million invocations/month**: FREE
- **Additional invocations**: $0.10 per 1 million

For a typical website, you'll stay well within the free tier.

## Troubleshooting

### Redirect Not Working

1. **Check deployment status**:
   ```bash
   aws cloudfront get-distribution --id E17ZYFBZN45OZ7 --query 'Distribution.Status'
   ```
   Must show "Deployed"

2. **Verify function is attached**:
   ```bash
   aws cloudfront get-distribution --id E17ZYFBZN45OZ7 \
     --query 'Distribution.DistributionConfig.DefaultCacheBehavior.FunctionAssociations'
   ```

3. **Check function is published**:
   ```bash
   aws cloudfront describe-function --name neural-tools-www-redirect
   ```
   Look for `Stage: "LIVE"`

4. **Clear browser cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Function Error

View function logs in CloudWatch:

```bash
aws logs tail /aws/cloudfront/function/neural-tools-www-redirect --follow
```

### DNS Issues

Verify both domains point to CloudFront:

```bash
# Check DNS resolution
dig neural-tools.com
dig www.neural-tools.com

# Both should point to CloudFront distribution
```

## Alternative Solutions (Not Recommended)

### Option 1: Two CloudFront Distributions

Create separate distributions for apex and www. More complex and costly.

### Option 2: Lambda@Edge

More powerful but more expensive than CloudFront Functions. Overkill for simple redirects.

### Option 3: DNS-Level Redirect

Some DNS providers (like Cloudflare) offer HTTP redirects. Requires changing DNS provider.

### Option 4: S3 Redirect Bucket

Create second S3 bucket configured for redirect. Requires managing two buckets.

## Recommended: CloudFront Function ✅

CloudFront Functions are the best choice for this use case:
- ✅ Most cost-effective (free tier covers typical usage)
- ✅ Simplest to implement and maintain
- ✅ Fastest (runs at edge)
- ✅ No additional infrastructure

## Resources

- [CloudFront Functions Documentation](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cloudfront-functions.html)
- [CloudFront Functions Examples](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/functions-example-code.html)
- [CloudFront Functions Pricing](https://aws.amazon.com/cloudfront/pricing/)

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review CloudFront distribution logs
3. Check CloudWatch Logs for function errors
4. Verify AWS IAM permissions for CloudFront management
