# S3 Static Website Hosting - AWS Console Setup

Simple guide to host your Neural Tools website on AWS S3 using the AWS Console.

## Step 1: Create S3 Bucket

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/s3/)
2. Click **"Create bucket"**
3. Configure bucket:
   - **Bucket name**: `neural-tools.com` (use your domain, must be globally unique)
   - **AWS Region**: `us-east-1` (or your preferred region)
   - **Object Ownership**: ACLs disabled (recommended)
   - **Block Public Access settings**: **UNCHECK** "Block all public access"
     - ⚠️ Check the acknowledgment box that appears
   - Leave other settings as default
4. Click **"Create bucket"**

## Step 2: Enable Static Website Hosting

1. Click on your newly created bucket name
2. Go to the **"Properties"** tab
3. Scroll down to **"Static website hosting"**
4. Click **"Edit"**
5. Configure:
   - **Static website hosting**: Enable
   - **Hosting type**: Host a static website
   - **Index document**: `index.html`
   - **Error document**: `index.html` (or `404.html` if you have one)
6. Click **"Save changes"**
7. **Note the endpoint URL** (e.g., `http://neural-tools.com.s3-website-us-east-1.amazonaws.com`)

## Step 3: Set Bucket Policy for Public Read Access

1. Go to the **"Permissions"** tab
2. Scroll to **"Bucket policy"**
3. Click **"Edit"**
4. Paste this policy (replace `YOUR-BUCKET-NAME`):

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

**Example** (for bucket named `neural-tools.com`):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::neural-tools.com/*"
    }
  ]
}
```

5. Click **"Save changes"**

## Step 4: Upload Website Files

### Option A: Via Console (For First Upload)

1. Go to the **"Objects"** tab
2. Click **"Upload"**
3. Click **"Add files"** and select:
   - `index.html`
   - `styles.css`
   - `script.js`
   - Any other assets (images, fonts, etc.)
4. Click **"Upload"**
5. Wait for upload to complete
6. Click **"Close"**

### Option B: Via AWS CLI (For Updates)

```bash
cd website
aws s3 sync . s3://neural-tools.com \
  --exclude "*.md" \
  --exclude "*.sh" \
  --exclude ".git/*" \
  --exclude ".DS_Store" \
  --delete
```

## Step 5: Test Your Website

1. Go back to **Properties** → **Static website hosting**
2. Copy the **Bucket website endpoint**
3. Open it in your browser

**Example URL**: `http://neural-tools.com.s3-website-us-east-1.amazonaws.com`

## Setting Up GitHub Actions for S3-Only Deployment

Update your GitHub Secrets with just these values:

```
AWS_ACCESS_KEY_ID       - Your AWS access key
AWS_SECRET_ACCESS_KEY   - Your AWS secret key
AWS_S3_BUCKET          - Your bucket name (e.g., neural-tools.com)
```

The GitHub Actions workflow will automatically skip CloudFront invalidation if `AWS_CLOUDFRONT_ID` is not set.

## Manual Deployment Script

Use the existing `deploy.sh` script:

```bash
cd website
./deploy.sh neural-tools.com
```

## Costs

S3-only hosting is very cheap:

| Item | Cost |
|------|------|
| Storage (1 GB) | $0.023/month |
| Requests (10,000 GET) | $0.004/month |
| Data Transfer (1 GB out) | $0.09/month |
| **Total** | **~$0.12/month** |

## Limitations of S3-Only Hosting

- ❌ No HTTPS (HTTP only)
- ❌ No custom domain without Route53 ALIAS
- ❌ Slower performance (no CDN)
- ❌ No edge caching

**When to add CloudFront:**
- You need HTTPS
- You want better performance
- You have a custom domain
- You have global users

## Updating Your Website

### Via AWS Console

1. Go to your bucket → **Objects** tab
2. Select the file to update
3. Click **"Upload"** → **"Add files"**
4. Select the updated file
5. Click **"Upload"** (this will overwrite)

### Via AWS CLI

```bash
cd website
./deploy.sh neural-tools.com
```

### Via GitHub Actions

Just push to `main` branch:

```bash
git add website/
git commit -m "Update website"
git push origin main
```

## Custom Domain (Optional)

If you want to use your own domain without CloudFront:

### If your bucket name matches your domain:

**Example**: Bucket named `neural-tools.com`

1. Go to your DNS provider
2. Add a CNAME record:
   - **Name**: `www`
   - **Value**: `neural-tools.com.s3-website-us-east-1.amazonaws.com`
   - **TTL**: 300

3. For the apex domain (`neural-tools.com`):
   - Use Route53 ALIAS record, OR
   - Use DNS provider's ALIAS/ANAME record, OR
   - Use a CNAME record with `www` redirect

**Note**: This only works with HTTP, not HTTPS. For HTTPS, you need CloudFront.

## Troubleshooting

### 403 Forbidden Error

**Problem**: Can't access website

**Solutions**:
1. Check bucket policy is applied (Step 3)
2. Verify "Block Public Access" is OFF
3. Ensure files are uploaded
4. Check the bucket name in the policy matches your bucket

### 404 Not Found Error

**Problem**: Website loads but pages not found

**Solutions**:
1. Verify `index.html` exists in the bucket root
2. Check file names are correct (case-sensitive)
3. Verify static website hosting is enabled

### Objects Not Showing

**Problem**: Files uploaded but not visible

**Solutions**:
1. Click the refresh button in the console
2. Check you're in the right region
3. Clear your browser cache

## Next Steps

Once your S3 website is working, you can optionally add:

1. **CloudFront CDN** - For HTTPS and better performance
   - See: `AWS_SETUP_GUIDE.md`

2. **Custom Domain with HTTPS** - Use CloudFront + ACM
   - See: `AWS_SETUP_GUIDE.md` (SSL Certificate Setup)

3. **Monitoring** - CloudWatch metrics for traffic
   - S3 Console → Metrics tab

4. **Access Logging** - Track visitor analytics
   - S3 Console → Properties → Server access logging

## Quick Reference

**Bucket Website Endpoint Format**:
```
http://BUCKET-NAME.s3-website-REGION.amazonaws.com
```

**Example**:
```
http://neural-tools.com.s3-website-us-east-1.amazonaws.com
```

**Deploy Command**:
```bash
cd website && ./deploy.sh neural-tools.com
```

**List Bucket Contents**:
```bash
aws s3 ls s3://neural-tools.com
```

**Delete All Files**:
```bash
aws s3 rm s3://neural-tools.com --recursive
```

## Resources

- [AWS S3 Static Website Hosting Documentation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [S3 Pricing](https://aws.amazon.com/s3/pricing/)
- [S3 Console](https://s3.console.aws.amazon.com/s3/)
