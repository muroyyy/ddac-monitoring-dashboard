output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "ec2_instance_id" {
  description = "EC2 Instance ID"
  value       = module.ec2.instance_id
}

output "ec2_public_ip" {
  description = "EC2 Public IP"
  value       = module.ec2.public_ip
}

output "ec2_elastic_ip" {
  description = "EC2 Elastic IP"
  value       = module.ec2.elastic_ip
}

output "rds_endpoint" {
  description = "RDS Endpoint"
  value       = module.rds.endpoint
  sensitive   = true
}

output "rds_secret_arn" {
  description = "RDS Secret ARN in Secrets Manager"
  value       = module.rds.secret_arn
}

output "s3_bucket_name" {
  description = "S3 Bucket for frontend deployment"
  value       = module.s3.frontend_bucket_name
}

output "ecr_repository_url" {
  description = "ECR Repository URL"
  value       = module.ecr.repository_url
}

output "cicd_user_name" {
  description = "CI/CD IAM user name"
  value       = module.iam.cicd_user_name
}

output "cicd_access_key_id" {
  description = "CI/CD user access key ID"
  value       = module.iam.cicd_access_key_id
  sensitive   = true
}

output "cicd_secret_access_key" {
  description = "CI/CD user secret access key"
  value       = module.iam.cicd_secret_access_key
  sensitive   = true
}

output "cicd_credentials_secret_arn" {
  description = "Secrets Manager ARN for CI/CD credentials"
  value       = module.iam.cicd_credentials_secret_arn
}