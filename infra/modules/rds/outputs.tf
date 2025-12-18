output "endpoint" {
  description = "RDS Endpoint"
  value       = aws_db_instance.main.endpoint
}

output "address" {
  description = "RDS Address"
  value       = aws_db_instance.main.address
}

output "port" {
  description = "RDS Port"
  value       = aws_db_instance.main.port
}

output "db_name" {
  description = "Database name"
  value       = aws_db_instance.main.db_name
}

output "username" {
  description = "Database username"
  value       = aws_db_instance.main.username
  sensitive   = true
}

output "secret_arn" {
  description = "Secrets Manager ARN for RDS credentials"
  value       = aws_secretsmanager_secret.rds_credentials.arn
}