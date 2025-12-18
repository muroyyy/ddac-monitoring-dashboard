terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket         = "ddac-monitoring-terraform-state"
    key            = "monitoring-dashboard/terraform.tfstate"
    region         = "ap-southeast-5"
    dynamodb_table = "ddac-monitoring-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = "DDAC-Monitoring-Dashboard"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"
  
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  environment         = var.environment
  project_name        = var.project_name
}

# EC2 Module
module "ec2" {
  source = "./modules/ec2"
  
  vpc_id              = module.vpc.vpc_id
  public_subnet_ids   = module.vpc.public_subnet_ids
  environment         = var.environment
  project_name        = var.project_name
  key_pair_name       = var.key_pair_name
  instance_type       = var.instance_type
}

# RDS Module
module "rds" {
  source = "./modules/rds"
  
  vpc_id               = module.vpc.vpc_id
  private_subnet_ids   = module.vpc.private_subnet_ids
  ec2_security_group_id = module.ec2.security_group_id
  environment          = var.environment
  project_name         = var.project_name
  db_instance_class    = var.db_instance_class
  db_allocated_storage = var.db_allocated_storage
}

# S3 Module for Remote State
module "s3" {
  source = "./modules/s3"
  
  environment  = var.environment
  project_name = var.project_name
}

# ECR Module
module "ecr" {
  source = "./modules/ecr"
  
  environment  = var.environment
  project_name = var.project_name
}

# IAM Module for CI/CD
module "iam" {
  source = "./modules/iam"
  
  environment          = var.environment
  project_name         = var.project_name
  aws_region          = var.aws_region
  frontend_bucket_arn = module.s3.frontend_bucket_arn
  ecr_repository_arn  = module.ecr.repository_arn
  ec2_instance_id     = module.ec2.instance_id
}