# IAM User for CI/CD
resource "aws_iam_user" "cicd_user" {
  name = "${var.project_name}-${var.environment}-cicd-user"
  path = "/"

  tags = {
    Name        = "${var.project_name}-${var.environment}-cicd-user"
    Environment = var.environment
    Purpose     = "CI/CD Deployments"
  }
}

# Access Keys for CI/CD User
resource "aws_iam_access_key" "cicd_user" {
  user = aws_iam_user.cicd_user.name
}

# IAM Policy for S3 Frontend Deployment
resource "aws_iam_policy" "s3_frontend_policy" {
  name        = "${var.project_name}-${var.environment}-s3-frontend-policy"
  description = "Policy for frontend deployment to S3"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket",
          "s3:PutObjectAcl"
        ]
        Resource = [
          var.frontend_bucket_arn,
          "${var.frontend_bucket_arn}/*"
        ]
      }
    ]
  })
}

# IAM Policy for ECR and EC2 Backend Deployment
resource "aws_iam_policy" "backend_deployment_policy" {
  name        = "${var.project_name}-${var.environment}-backend-deployment-policy"
  description = "Policy for backend deployment to ECR and EC2"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage"
        ]
        Resource = [
          var.ecr_repository_arn,
          "arn:aws:ecr:${var.aws_region}:${data.aws_caller_identity.current.account_id}:repository/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:SendCommand",
          "ssm:GetCommandInvocation",
          "ssm:DescribeInstanceInformation",
          "ssm:ListCommandInvocations"
        ]
        Resource = [
          "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:instance/${var.ec2_instance_id}",
          "arn:aws:ssm:${var.aws_region}::document/AWS-RunShellScript"
        ]
      }
    ]
  })
}

# Attach S3 policy to user
resource "aws_iam_user_policy_attachment" "s3_frontend_attachment" {
  user       = aws_iam_user.cicd_user.name
  policy_arn = aws_iam_policy.s3_frontend_policy.arn
}

# Attach backend deployment policy to user
resource "aws_iam_user_policy_attachment" "backend_deployment_attachment" {
  user       = aws_iam_user.cicd_user.name
  policy_arn = aws_iam_policy.backend_deployment_policy.arn
}

# Data source for current AWS account ID
data "aws_caller_identity" "current" {}

# Store CI/CD credentials in Secrets Manager
resource "aws_secretsmanager_secret" "cicd_credentials" {
  name        = "${var.project_name}-${var.environment}-cicd-credentials"
  description = "CI/CD user credentials for GitHub Actions"

  tags = {
    Name        = "${var.project_name}-${var.environment}-cicd-credentials"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "cicd_credentials" {
  secret_id = aws_secretsmanager_secret.cicd_credentials.id
  secret_string = jsonencode({
    access_key_id     = aws_iam_access_key.cicd_user.id
    secret_access_key = aws_iam_access_key.cicd_user.secret
    user_name         = aws_iam_user.cicd_user.name
    user_arn          = aws_iam_user.cicd_user.arn
  })
}