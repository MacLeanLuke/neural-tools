# GitHub Actions Deployment Troubleshooting

Quick fixes for common deployment failures.

## Step 1: Check the Error Message

```bash
# View the failed workflow logs
gh run view --log-failed
```

Look for which step failed. Common failure points:

### Error at "Verify AWS credentials"
**Problem**: Invalid AWS access keys

**Fix**:
1. Verify you copied the keys correctly (no extra spaces)
2. Check the keys are for the right IAM user
3. Regenerate keys if needed:
   ```bash
   # In AWS Console: IAM → Users → github-actions-deploy → Security credentials → Create access key

   # Update GitHub secrets
   gh secret set AWS_ACCESS_KEY_ID
   gh secret set AWS_SECRET_ACCESS_KEY
   ```

### Error at "Sync website to S3"
**Common errors and fixes:**

#### "Access Denied" or "403 Forbidden"
**Problem**: IAM user lacks S3 permissions

**Fix**:
1. Go to AWS IAM Console
2. Find user: `github-actions-deploy`
3. Check attached policies
4. Verify the policy has this (replace `YOUR-BUCKET-NAME`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::YOUR-BUCKET-NAME",
        "arn:aws:s3:::YOUR-BUCKET-NAME/*"
      ]
    }
  ]
}
```

5. Make sure `YOUR-BUCKET-NAME` matches exactly!

#### "NoSuchBucket" or "The specified bucket does not exist"
**Problem**: Wrong bucket name in secret

**Fix**:
```bash
# Check your bucket exists
aws s3 ls | grep neural-tools

# Update the secret with correct name
gh secret set AWS_S3_BUCKET --body "your-correct-bucket-name"
```

#### "Region mismatch"
**Problem**: Bucket is in different region than workflow expects

**Fix**: Edit `.github/workflows/deploy-website.yml` and change:
```yaml
env:
  AWS_REGION: us-west-2  # Change to your bucket's region
```

## Step 2: Verify Your GitHub Secrets

```bash
# List secrets (won't show values, just names)
gh secret list
```

You should see:
```
AWS_ACCESS_KEY_ID       Updated 2024-XX-XX
AWS_SECRET_ACCESS_KEY   Updated 2024-XX-XX
AWS_S3_BUCKET          Updated 2024-XX-XX
```

If any are missing, add them:
```bash
gh secret set AWS_ACCESS_KEY_ID
gh secret set AWS_SECRET_ACCESS_KEY
gh secret set AWS_S3_BUCKET --body "your-bucket-name"
```

## Step 3: Test IAM Permissions Locally

Test if your IAM user can access the bucket:

```bash
# Configure AWS CLI with your IAM user credentials
aws configure --profile github-test
# Enter the same access key and secret you added to GitHub

# Test listing bucket
aws s3 ls s3://your-bucket-name --profile github-test

# Test uploading a file
echo "test" > test.txt
aws s3 cp test.txt s3://your-bucket-name/test.txt --profile github-test

# Test deleting
aws s3 rm s3://your-bucket-name/test.txt --profile github-test
rm test.txt
```

If any of these fail, your IAM permissions need to be fixed.

## Step 4: Check Bucket Policy

Your bucket needs to allow public read access for website hosting:

1. Go to S3 Console → Your bucket → Permissions
2. Check "Bucket policy" has this:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

3. Check "Block public access" settings:
   - Should be OFF for static website hosting

## Step 5: Retry the Deployment

After fixing the issue, trigger a new deployment:

```bash
# Option 1: Make a small change and push
cd website
echo "<!-- Fixed deployment -->" >> index.html
git add index.html
git commit -m "Fix deployment"
git push origin main

# Option 2: Manually trigger workflow
gh workflow run deploy-website.yml
```

## Common Error Messages & Solutions

### "The security token included in the request is invalid"
- **Cause**: Wrong AWS access key or secret
- **Fix**: Regenerate keys and update secrets

### "Access Denied"
- **Cause**: IAM user lacks permissions
- **Fix**: Update IAM policy with S3 permissions

### "NoSuchBucket"
- **Cause**: Bucket name typo or doesn't exist
- **Fix**: Verify bucket exists: `aws s3 ls`

### "A conflicting conditional operation is currently in progress"
- **Cause**: Multiple deployments running simultaneously
- **Fix**: Wait for previous deployment to finish, then retry

### "Request has expired"
- **Cause**: Server time mismatch or old access key
- **Fix**: Check system time, regenerate access key

## Quick Checklist

- [ ] AWS IAM user created: `github-actions-deploy`
- [ ] IAM policy attached with S3 permissions
- [ ] Policy has correct bucket name (no typos)
- [ ] Access key created for IAM user
- [ ] GitHub secrets set correctly:
  - [ ] `AWS_ACCESS_KEY_ID`
  - [ ] `AWS_SECRET_ACCESS_KEY`
  - [ ] `AWS_S3_BUCKET`
- [ ] Bucket name in secret matches actual bucket
- [ ] Bucket exists in AWS
- [ ] Bucket has static website hosting enabled
- [ ] Bucket has public read policy
- [ ] Block public access is OFF

## Still Having Issues?

### Check the full error log

```bash
# Get detailed logs
gh run view --log

# Or view in browser
gh run view --web
```

### Verify bucket region

```bash
# Check which region your bucket is in
aws s3api get-bucket-location --bucket your-bucket-name
```

If it's not `us-east-1`, update the workflow:

```yaml
env:
  AWS_REGION: us-west-2  # Or your bucket's region
```

### Test with a simple workflow

Create `.github/workflows/test-aws.yml`:

```yaml
name: Test AWS Connection
on: workflow_dispatch

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Test credentials
        run: aws sts get-caller-identity

      - name: List bucket
        run: aws s3 ls s3://${{ secrets.AWS_S3_BUCKET }}
```

Run it:
```bash
gh workflow run test-aws.yml
gh run watch
```

This will help isolate where the problem is.

## Contact Info

If you're still stuck, share the error message from:
```bash
gh run view --log-failed
```

Common places to get help:
- GitHub Actions Docs: https://docs.github.com/en/actions
- AWS IAM Troubleshooting: https://docs.aws.amazon.com/IAM/latest/UserGuide/troubleshoot.html
