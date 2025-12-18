# Bootstrap - Remote State Management

This directory contains Terraform configuration to set up remote state management for the main infrastructure.

## Purpose

Creates the S3 bucket and DynamoDB table required for Terraform remote state storage and locking.

## Usage

### 1. Initialize and Deploy Bootstrap

```bash
cd bootstrap
terraform init
terraform plan
terraform apply
```

### 2. Get Backend Configuration

```bash
terraform output backend_config
```

### 3. Update Main Configuration

Copy the backend configuration to the main `main.tf` file:

```hcl
terraform {
  backend "s3" {
    bucket         = "ddac-monitoring-terraform-state"
    key            = "monitoring-dashboard/terraform.tfstate"
    region         = "ap-southeast-5"
    dynamodb_table = "ddac-monitoring-terraform-locks"
    encrypt        = true
  }
}
```

### 4. Initialize Main Infrastructure

```bash
cd ..
terraform init
terraform apply
```

## Resources Created

- **S3 Bucket**: `ddac-monitoring-terraform-state`
  - Versioning enabled
  - Server-side encryption
  - Public access blocked

- **DynamoDB Table**: `ddac-monitoring-terraform-locks`
  - Pay-per-request billing
  - Used for state locking

## Security

- S3 bucket is private with public access blocked
- Server-side encryption enabled
- DynamoDB table uses AWS managed encryption