#!/bin/bash

# Script to help set up GitHub secrets after Terraform deployment
# Run this script after 'terraform apply' to get the CI/CD credentials

echo "=== DDAC Monitoring Dashboard - GitHub Secrets Setup ==="
echo ""

# Check if terraform outputs are available
if ! terraform output > /dev/null 2>&1; then
    echo "❌ Error: No terraform outputs found. Please run 'terraform apply' first."
    exit 1
fi

echo "📋 Getting CI/CD credentials from Terraform outputs..."
echo ""

# Get the credentials
ACCESS_KEY_ID=$(terraform output -raw cicd_access_key_id 2>/dev/null)
SECRET_ACCESS_KEY=$(terraform output -raw cicd_secret_access_key 2>/dev/null)
EC2_INSTANCE_ID=$(terraform output -raw ec2_instance_id 2>/dev/null)
S3_BUCKET=$(terraform output -raw s3_bucket_name 2>/dev/null)
ECR_REPOSITORY=$(terraform output -raw ecr_repository_url 2>/dev/null | cut -d'/' -f2)

if [ -z "$ACCESS_KEY_ID" ] || [ -z "$SECRET_ACCESS_KEY" ]; then
    echo "❌ Error: Could not retrieve CI/CD credentials from Terraform outputs."
    echo "Make sure the IAM module has been deployed successfully."
    exit 1
fi

echo "✅ Successfully retrieved credentials!"
echo ""
echo "🔐 Add these secrets to your GitHub repository:"
echo "   Go to: Settings → Secrets and variables → Actions → New repository secret"
echo ""
echo "Secret Name: AWS_ACCESS_KEY_ID"
echo "Secret Value: $ACCESS_KEY_ID"
echo ""
echo "Secret Name: AWS_SECRET_ACCESS_KEY"
echo "Secret Value: $SECRET_ACCESS_KEY"
echo ""
echo "📝 Update these values in your GitHub workflow files:"
echo ""
echo "In .github/workflows/frontend-deploy.yml:"
echo "  S3_BUCKET: $S3_BUCKET"
echo ""
echo "In .github/workflows/backend-deploy.yml:"
echo "  ECR_REPOSITORY: $ECR_REPOSITORY"
echo "  EC2_INSTANCE_ID: $EC2_INSTANCE_ID"
echo ""
echo "🔒 Credentials are also stored in AWS Secrets Manager:"
echo "  Secret ARN: $(terraform output -raw cicd_credentials_secret_arn)"
echo ""
echo "⚠️  SECURITY NOTE: Keep these credentials secure and rotate them regularly!"
echo ""
echo "🚀 After setting up the secrets, your GitHub Actions workflows will be ready to deploy!"