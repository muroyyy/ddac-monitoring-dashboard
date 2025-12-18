#!/bin/bash

# Update system
apt-get update -y
apt-get upgrade -y

# Install basic packages
apt-get install -y curl zip unzip wget gnupg lsb-release ca-certificates

# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install
rm -rf aws awscliv2.zip

# Install MySQL client
apt-get install -y mysql-client-core-8.0

# Install Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Add ubuntu user to docker group
usermod -aG docker ubuntu

# Install CloudWatch Agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
dpkg -i -E ./amazon-cloudwatch-agent.deb
rm amazon-cloudwatch-agent.deb

# Create CloudWatch Agent config
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
  "agent": {
    "metrics_collection_interval": 60,
    "run_as_user": "cwagent"
  },
  "metrics": {
    "namespace": "CWAgent",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          "cpu_usage_idle",
          "cpu_usage_iowait",
          "cpu_usage_user",
          "cpu_usage_system"
        ],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": [
          "used_percent"
        ],
        "metrics_collection_interval": 60,
        "resources": [
          "*"
        ]
      },
      "diskio": {
        "measurement": [
          "io_time"
        ],
        "metrics_collection_interval": 60,
        "resources": [
          "*"
        ]
      },
      "mem": {
        "measurement": [
          "mem_used_percent"
        ],
        "metrics_collection_interval": 60
      },
      "netstat": {
        "measurement": [
          "tcp_established",
          "tcp_time_wait"
        ],
        "metrics_collection_interval": 60
      },
      "swap": {
        "measurement": [
          "swap_used_percent"
        ],
        "metrics_collection_interval": 60
      }
    }
  }
}
EOF

# Start CloudWatch Agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

# Create Docker cleanup script
cat > /usr/local/bin/docker-cleanup.sh << 'EOF'
#!/bin/bash

# Keep only the 5 most recent images
IMAGES_TO_KEEP=5

# Get all images sorted by creation date (newest first)
IMAGES=$(docker images --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}" | tail -n +2 | sort -k2 -r)

# Count total images
TOTAL_IMAGES=$(echo "$IMAGES" | wc -l)

if [ $TOTAL_IMAGES -gt $IMAGES_TO_KEEP ]; then
    echo "Found $TOTAL_IMAGES images, keeping $IMAGES_TO_KEEP most recent"
    
    # Get images to remove (skip the first 5)
    IMAGES_TO_REMOVE=$(echo "$IMAGES" | tail -n +$((IMAGES_TO_KEEP + 1)) | awk '{print $1}')
    
    if [ ! -z "$IMAGES_TO_REMOVE" ]; then
        echo "Removing old images:"
        echo "$IMAGES_TO_REMOVE"
        echo "$IMAGES_TO_REMOVE" | xargs docker rmi -f
    fi
fi

# Remove dangling images
docker image prune -f

# Remove unused containers
docker container prune -f

echo "Docker cleanup completed"
EOF

chmod +x /usr/local/bin/docker-cleanup.sh

# Create cron job for Docker cleanup (runs daily at 2 AM)
echo "0 2 * * * root /usr/local/bin/docker-cleanup.sh >> /var/log/docker-cleanup.log 2>&1" >> /etc/crontab

# Create deployment script
cat > /home/ubuntu/deploy-backend.sh << 'EOF'
#!/bin/bash

PROJECT_NAME="${project_name}"
ENVIRONMENT="${environment}"
ECR_REPO="$PROJECT_NAME-$ENVIRONMENT-backend"
AWS_REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region)
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Pull latest image
docker pull $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest

# Stop existing container
docker stop ddac-backend 2>/dev/null || true
docker rm ddac-backend 2>/dev/null || true

# Run new container
docker run -d \
  --name ddac-backend \
  --restart unless-stopped \
  -p 8080:8080 \
  -e AWS_DEFAULT_REGION=$AWS_REGION \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest

# Cleanup old images
/usr/local/bin/docker-cleanup.sh

echo "Backend deployment completed"
EOF

chmod +x /home/ubuntu/deploy-backend.sh
chown ubuntu:ubuntu /home/ubuntu/deploy-backend.sh

# Install SSM Agent (should be pre-installed on Ubuntu 22.04, but ensure it's running)
systemctl start amazon-ssm-agent
systemctl enable amazon-ssm-agent

echo "User data script completed" > /var/log/user-data.log