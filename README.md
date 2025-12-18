# DDAC Monitoring Dashboard

## Project Structure

This project is organized into separate directories:

- `frontend/` - React/TypeScript frontend application
- `backend/` - Backend services and APIs
- `infra/` - Infrastructure as Code (IaC) files

## Frontend Development

**Use your preferred IDE**

The frontend is a React application built with Vite. To work on the frontend locally:

Requirement: Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the frontend directory.
cd <YOUR_PROJECT_NAME>/frontend

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
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
