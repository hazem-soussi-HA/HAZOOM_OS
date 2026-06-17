#!/bin/bash

set -e

echo "🚀 Deploying Universe Map to Production..."

cd infrastructure/terraform

echo "📋 Validating Terraform configuration..."
terraform fmt -check
terraform validate

echo "🔨 Planning infrastructure changes..."
terraform plan -out=tfplan

echo "✅ Applying infrastructure changes..."
terraform apply tfplan

cd ../..

echo "🐳 Building and pushing Docker images..."
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ECR_URI>

docker build -t universe-map-backend ./backend
docker tag universe-map-backend:latest <ECR_URI>/universe-map-backend:latest
docker push <ECR_URI>/universe-map-backend:latest

docker build -t universe-map-frontend ./frontend
docker tag universe-map-frontend:latest <ECR_URI>/universe-map-frontend:latest
docker push <ECR_URI>/universe-map-frontend:latest

echo "🔄 Triggering ECS service update..."
aws ecs update-service --cluster production-universe-map --service production-backend --force-new-deployment
aws ecs update-service --cluster production-universe-map --service production-frontend --force-new-deployment

echo "⏳ Waiting for services to stabilize..."
aws ecs wait services-stable --cluster production-universe-map --services production-backend production-frontend

echo "✨ Deployment completed successfully!"
echo "🌐 Frontend URL: https://universe-map.example.com"
echo "🔌 API URL: https://api.universe-map.example.com"
