#!/bin/bash
set -e

echo "Starting backend deployment..."

# Variables
ECR_REGISTRY="908103136245.dkr.ecr.ap-southeast-5.amazonaws.com"
ECR_REPOSITORY="ddac-monitoring-dev-backend"
CONTAINER_NAME="ddac-monitoring-backend"
PORT="5000"

# Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region ap-southeast-5 | docker login --username AWS --password-stdin $ECR_REGISTRY

# Pull latest image
echo "Pulling latest image from ECR..."
docker pull $ECR_REGISTRY/$ECR_REPOSITORY:latest

# Stop and remove existing container
echo "Stopping existing container..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# Run new container
echo "Starting new container..."
docker run -d \
  --name $CONTAINER_NAME \
  --restart unless-stopped \
  -p $PORT:8080 \
  -e ASPNETCORE_ENVIRONMENT=Production \
  -e ASPNETCORE_URLS=http://+:8080 \
  $ECR_REGISTRY/$ECR_REPOSITORY:latest

# Wait for container to start
sleep 5

# Check if container is running
if docker ps | grep -q $CONTAINER_NAME; then
  echo "✅ Backend deployment successful!"
  docker ps | grep $CONTAINER_NAME
else
  echo "❌ Backend deployment failed!"
  docker logs $CONTAINER_NAME
  exit 1
fi
