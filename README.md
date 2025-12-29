# DDAC Monitoring Dashboard

> A comprehensive AWS CloudWatch monitoring dashboard for real-time infrastructure monitoring and metrics visualization.

## Overview

DDAC Monitoring Dashboard is a full-stack cloud monitoring solution that provides real-time insights into AWS infrastructure. Built as part of a cloud computing project, it demonstrates modern DevOps practices including Infrastructure as Code, CI/CD pipelines, and secure authentication.

## Features

### Monitoring Capabilities
- **EC2 Metrics**: CPU utilization, memory usage, disk usage, network I/O
- **RDS Database**: CPU, memory, connections, IOPS monitoring
- **Lambda Functions**: Invocations, errors, duration, throttles
- **API Gateway**: Request counts, latency, 4xx/5xx errors
- **Route53 DNS**: Query logs with source IP, query name/type, response codes, edge locations
- **Health Dashboard**: Real-time status indicators for all services
- **Auto-refresh**: Metrics update every 30 seconds

### Security & Authentication
- Secure login system with session management
- Password reset functionality with email verification
- MySQL database for user management
- AWS Secrets Manager integration for credentials
- Protected routes and session validation

### Infrastructure
- **Automated Deployment**: CI/CD pipelines with GitHub Actions
- **Infrastructure as Code**: Terraform for AWS resource provisioning
- **Containerized Backend**: Docker + ECR + EC2 deployment
- **Static Frontend**: S3 bucket hosting with CloudFront-ready setup
- **Database**: RDS MySQL with automated backups

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   S3 + CF   │─────▶│  EC2 + API   │─────▶│ RDS MySQL   │
│  (Frontend) │      │  (Backend)   │      │ (Database)  │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  CloudWatch  │
                     │   Metrics    │
                     └──────────────┘
```

## Project Structure

```
ddac-monitoring-dashboard/
├── frontend/          # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── .env          # API configuration
├── backend/          # .NET 8 Web API
│   ├── Controllers/
│   ├── Services/
│   ├── Models/
│   └── database/     # SQL setup scripts
├── infra/            # Terraform IaC
│   ├── modules/
│   │   ├── vpc/
│   │   ├── ec2/
│   │   ├── rds/
│   │   ├── s3/
│   │   ├── ecr/
│   │   └── iam/
│   └── main.tf
└── .github/workflows/ # CI/CD pipelines
```

## Technologies Used

### Frontend
- **Vite** - Build tool and development server
- **TypeScript** - Type-safe JavaScript
- **React** - UI framework
- **shadcn-ui** - Component library
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Charts and data visualization

### Backend
- AWS services integration
- CloudWatch metrics collection

### Infrastructure
- AWS CloudFormation/CDK
- Infrastructure as Code

## Project Features

This is an AWS CloudWatch monitoring dashboard that provides:

- Real-time monitoring of EC2 instances
- RDS database metrics
- Lambda function performance
- API Gateway statistics
- Health status indicators
- Automated data refresh every 30 seconds