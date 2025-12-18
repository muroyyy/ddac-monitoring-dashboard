# DDAC Monitoring Dashboard - Infrastructure

## Overview

This directory contains Terraform configurations for deploying the DDAC Monitoring Dashboard infrastructure on AWS.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend     │    │   Database      │
│   (S3 + CF)     │    │   (EC2 + ECR)   │    │     (RDS)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │       VPC       │
                    │  192.168.0.0/24 │
                    └─────────────────┘
```

## Infrastructure Components

### 1. **VPC Module** (`modules/vpc/`)
- Custom VPC with CIDR `192.168.0.0/24`
- Public subnets for EC2 instances
- Private subnets for RDS
- Internet Gateway and Route Tables

### 2. **EC2 Module** (`modules/ec2/`)
- Ubuntu 22.04 LTS instance
- 20GB encrypted EBS storage
- Elastic IP attachment
- Security groups (ports 22, 80, 3000, 8080)
- IAM role with CloudWatch and SSM permissions
- User data script with:
  - AWS CLI v2
  - Docker + Docker Compose
  - MySQL client
  - CloudWatch Agent
  - Automated Docker cleanup (keeps 5 images max)

### 3. **RDS Module** (`modules/rds/`)
- MySQL 8.0 database
- Encrypted storage
- Private subnet deployment
- Security group allowing EC2 access on port 3306
- Credentials stored in AWS Secrets Manager
- CloudWatch logs enabled

### 4. **S3 Module** (`modules/s3/`)
- Terraform state bucket with versioning
- DynamoDB table for state locking
- Frontend hosting bucket with static website configuration

### 5. **ECR Module** (`modules/ecr/`)
- Container registry for backend Docker images
- Lifecycle policy (keeps 10 tagged, 5 untagged images)
- Vulnerability scanning enabled

## Prerequisites

1. **AWS CLI** configured with appropriate permissions
2. **Terraform** >= 1.0 installed
3. **EC2 Key Pair** created in target region

## Deployment Steps

### 1. Bootstrap Remote State (First Time Only)

```bash
# Create S3 bucket and DynamoDB table for remote state
cd infra/bootstrap
terraform init
terraform apply

# Get backend configuration
terraform output backend_config
```

### 2. Initialize Main Infrastructure

```bash
# Return to main infra directory
cd ..
terraform init
```

### 3. Configure Variables

```bash
# Copy and customize variables
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your values:
# - key_pair_name: Your EC2 key pair name
# - aws_region: Target AWS region
# - Other customizations as needed
```

### 4. Deploy Infrastructure

```bash
# Plan deployment
terraform plan

# Apply infrastructure
terraform apply
```

### 5. Verify Deployment

```bash
# Get outputs
terraform output

# Connect to EC2 via SSM
aws ssm start-session --target $(terraform output -raw ec2_instance_id)
```

## Post-Deployment Configuration

### 1. **RDS Database Setup**

```bash
# Get RDS credentials from Secrets Manager
aws secretsmanager get-secret-value \
  --secret-id $(terraform output -raw rds_secret_arn) \
  --query SecretString --output text | jq .

# Connect to database
mysql -h $(terraform output -raw rds_endpoint | cut -d: -f1) \
  -u admin -p monitoringdb
```

### 2. **Backend Deployment**

The EC2 instance includes a deployment script at `/home/ubuntu/deploy-backend.sh`:

```bash
# SSH to EC2 instance
aws ssm start-session --target $(terraform output -raw ec2_instance_id)

# Run deployment script
sudo su - ubuntu
./deploy-backend.sh
```

### 3. **Frontend Deployment**

Frontend is deployed via GitHub Actions to the S3 bucket:

```bash
# Get S3 bucket name
terraform output frontend_bucket_name

# Manual deployment (if needed)
cd frontend
npm run build
aws s3 sync dist/ s3://$(terraform output -raw s3_bucket_name)
```

## GitHub Actions Setup

### Required Secrets

After deploying infrastructure, get CI/CD credentials:

```bash
# Run the setup script to get credentials
./setup-github-secrets.sh

# Or manually get from Terraform outputs
terraform output cicd_access_key_id
terraform output cicd_secret_access_key
```

Add these secrets to your GitHub repository:
- Go to: Settings → Secrets and variables → Actions
- Add: `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`

### Update Workflow Variables

Edit `.github/workflows/backend-deploy.yml`:

```yaml
env:
  EC2_INSTANCE_ID: i-1234567890abcdef0  # Replace with actual instance ID from terraform output
```

## Monitoring Setup

### 1. **CloudWatch Agent**

The EC2 instance automatically installs and configures CloudWatch Agent for:
- CPU metrics
- Memory metrics  
- Disk metrics
- Network metrics

### 2. **Application Monitoring**

Configure the backend application to use:
- RDS endpoint from Secrets Manager
- CloudWatch metrics collection
- SSM Parameter Store for configuration

## Security Features

- **Encrypted Storage**: All EBS volumes and RDS storage encrypted
- **Private Subnets**: Database in private subnets only
- **Security Groups**: Restrictive inbound rules
- **IAM Roles**: Least privilege access
- **Secrets Manager**: Database credentials securely stored
- **VPC**: Isolated network environment

## Cost Optimization

- **Instance Types**: t3.micro/medium for development
- **Storage**: GP3 volumes for better price/performance
- **RDS**: db.t3.micro for development workloads
- **ECR**: Lifecycle policies to manage image storage
- **Docker Cleanup**: Automated cleanup prevents storage bloat

## Troubleshooting

### Common Issues

1. **Terraform State Lock**
   ```bash
   # Force unlock if needed
   terraform force-unlock LOCK_ID
   ```

2. **EC2 Connection Issues**
   ```bash
   # Check SSM agent status
   aws ssm describe-instance-information --filters "Key=InstanceIds,Values=i-xxxxx"
   ```

3. **Docker Issues on EC2**
   ```bash
   # Check Docker status
   sudo systemctl status docker
   
   # View deployment logs
   sudo journalctl -u docker -f
   ```

4. **RDS Connection Issues**
   ```bash
   # Test connectivity from EC2
   telnet rds-endpoint 3306
   ```

## Cleanup

```bash
# Destroy all infrastructure
terraform destroy

# Note: S3 buckets with content may need manual deletion
```

## Module Structure

```
infra/
├── main.tf                 # Main configuration
├── variables.tf            # Input variables
├── outputs.tf             # Output values
├── terraform.tfvars.example # Example variables
├── bootstrap/             # Remote state setup
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
└── modules/
    ├── vpc/               # VPC and networking
    ├── ec2/               # EC2 instance and security
    ├── rds/               # RDS database
    ├── s3/                # Frontend hosting bucket
    ├── ecr/               # Container registry
    └── iam/               # CI/CD user and policies
```

Each module is self-contained with its own variables, outputs, and resources for maximum reusability and maintainability.