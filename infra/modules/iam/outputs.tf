output "cicd_user_name" {
  description = "CI/CD IAM user name"
  value       = aws_iam_user.cicd_user.name
}

output "cicd_user_arn" {
  description = "CI/CD IAM user ARN"
  value       = aws_iam_user.cicd_user.arn
}

output "cicd_access_key_id" {
  description = "CI/CD user access key ID"
  value       = aws_iam_access_key.cicd_user.id
  sensitive   = true
}

output "cicd_secret_access_key" {
  description = "CI/CD user secret access key"
  value       = aws_iam_access_key.cicd_user.secret
  sensitive   = true
}

output "cicd_credentials_secret_arn" {
  description = "Secrets Manager ARN for CI/CD credentials"
  value       = aws_secretsmanager_secret.cicd_credentials.arn
}