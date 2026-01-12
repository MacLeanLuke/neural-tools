#!/bin/bash

# Quick diagnostic script for GitHub Actions deployment failure
# Run this locally to test if your AWS setup will work

set -e

echo "🔍 Diagnosing GitHub Actions Setup..."
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not installed"
    exit 1
fi
echo "✅ AWS CLI installed"

# Prompt for values (these should match your GitHub secrets)
read -p "Enter AWS_ACCESS_KEY_ID: " AWS_KEY
read -s -p "Enter AWS_SECRET_ACCESS_KEY: " AWS_SECRET
echo ""
read -p "Enter AWS_S3_BUCKET: " S3_BUCKET

echo ""
echo "Testing configuration..."
echo ""

# Test 1: Verify credentials
echo "Test 1: Verifying AWS credentials..."
if AWS_ACCESS_KEY_ID="$AWS_KEY" AWS_SECRET_ACCESS_KEY="$AWS_SECRET" aws sts get-caller-identity 2>&1; then
    echo "✅ AWS credentials valid"
else
    echo "❌ AWS credentials invalid - check your access key and secret"
    exit 1
fi
echo ""

# Test 2: Check bucket exists
echo "Test 2: Checking if bucket exists..."
if AWS_ACCESS_KEY_ID="$AWS_KEY" AWS_SECRET_ACCESS_KEY="$AWS_SECRET" aws s3 ls "s3://$S3_BUCKET" 2>&1; then
    echo "✅ Bucket exists and is accessible"
else
    echo "❌ Cannot access bucket - check bucket name and permissions"
    exit 1
fi
echo ""

# Test 3: Test upload permission
echo "Test 3: Testing upload permission..."
echo "test" > /tmp/gh-actions-test.txt
if AWS_ACCESS_KEY_ID="$AWS_KEY" AWS_SECRET_ACCESS_KEY="$AWS_SECRET" aws s3 cp /tmp/gh-actions-test.txt "s3://$S3_BUCKET/gh-actions-test.txt" 2>&1; then
    echo "✅ Upload permission works"
else
    echo "❌ Cannot upload to bucket - check IAM permissions"
    rm /tmp/gh-actions-test.txt
    exit 1
fi
echo ""

# Test 4: Test delete permission
echo "Test 4: Testing delete permission..."
if AWS_ACCESS_KEY_ID="$AWS_KEY" AWS_SECRET_ACCESS_KEY="$AWS_SECRET" aws s3 rm "s3://$S3_BUCKET/gh-actions-test.txt" 2>&1; then
    echo "✅ Delete permission works"
else
    echo "❌ Cannot delete from bucket - check IAM permissions"
fi
rm /tmp/gh-actions-test.txt
echo ""

# Test 5: Test sync (what the workflow does)
echo "Test 5: Testing sync operation..."
cd website
if AWS_ACCESS_KEY_ID="$AWS_KEY" AWS_SECRET_ACCESS_KEY="$AWS_SECRET" aws s3 sync . "s3://$S3_BUCKET" \
  --exclude "*.md" \
  --exclude "*.sh" \
  --exclude ".git/*" \
  --exclude ".DS_Store" \
  --cache-control "public, max-age=3600" \
  --dryrun 2>&1; then
    echo "✅ Sync operation would work (dry-run)"
else
    echo "❌ Sync operation failed"
    exit 1
fi
cd ..
echo ""

echo "✅ All tests passed! Your GitHub Actions should work."
echo ""
echo "If GitHub Actions is still failing, check:"
echo "1. GitHub Secrets are set correctly (no extra spaces)"
echo "2. Secret names match exactly: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET"
echo "3. Workflow is running on 'main' branch"
