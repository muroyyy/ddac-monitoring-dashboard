output "instance_id" {
  description = "EC2 Instance ID"
  value       = aws_instance.main.id
}

output "public_ip" {
  description = "EC2 Public IP"
  value       = aws_instance.main.public_ip
}

output "elastic_ip" {
  description = "EC2 Elastic IP"
  value       = aws_eip.main.public_ip
}

output "security_group_id" {
  description = "EC2 Security Group ID"
  value       = aws_security_group.ec2.id
}

output "iam_role_arn" {
  description = "EC2 IAM Role ARN"
  value       = aws_iam_role.ec2_role.arn
}