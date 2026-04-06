#!/bin/bash

# Deployment Script for Targeted Service Updates
# Usage: ./deploy.sh [service-name]
# Example: ./deploy.sh api-gateway

PASSWORD="2410"
SERVICE=$1

if [ -z "$SERVICE" ]; then
  echo "Usage: ./deploy.sh [service-name]"
  echo "Available services: api-gateway, auth-service, onboarding-service, school-operations-service, etc."
  exit 1
fi

echo "Deploying service: $SERVICE..."

# Use sudo with password-less pipe for docker commands
echo "$PASSWORD" | sudo -S docker-compose build "$SERVICE"
echo "$PASSWORD" | sudo -S docker-compose up -d --no-deps "$SERVICE"

echo "Service $SERVICE deployed successfully."
