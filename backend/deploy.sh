#!/bin/bash
# Deployment script for IoT Edge backend application

# Variables
NAMESPACE="iot-edge"
ACR_NAME="your-acr-name"  # Replace with your Azure Container Registry name
VERSION=$(date +"%Y%m%d%H%M")

# Check for required tools
if ! command -v kubectl &> /dev/null; then
    echo "kubectl is required but not installed. Aborting."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "docker is required but not installed. Aborting."
    exit 1
fi

if ! command -v az &> /dev/null; then
    echo "Azure CLI is required but not installed. Aborting."
    exit 1
fi

# Ensure authenticated with Azure
az account show > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Not logged in to Azure. Please run 'az login' first."
    exit 1
fi

# Create namespace if it doesn't exist
kubectl get namespace $NAMESPACE > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Creating namespace $NAMESPACE..."
    kubectl create namespace $NAMESPACE
fi

# Build and push Docker image
echo "Building and pushing Docker image to Azure Container Registry..."
docker build -t $ACR_NAME.azurecr.io/iot-edge-backend:$VERSION -t $ACR_NAME.azurecr.io/iot-edge-backend:latest .
az acr login --name $ACR_NAME
docker push $ACR_NAME.azurecr.io/iot-edge-backend:$VERSION
docker push $ACR_NAME.azurecr.io/iot-edge-backend:latest

# Apply Kubernetes secrets (if not already applied)
echo "Checking if secrets exist..."
kubectl get secret iot-edge-secrets -n $NAMESPACE > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Secrets not found. Please create them:"
    echo "kubectl apply -f k8s/secrets.yaml"
    exit 1
fi

# Update Kubernetes resources
echo "Updating Kubernetes resources..."
kubectl apply -f k8s/mysql.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/backend-service.yaml

# Replace ACR_NAME in deployment file and apply
sed "s/\${ACR_NAME}/$ACR_NAME/g" k8s/backend-deployment.yaml | kubectl apply -f -
kubectl apply -f k8s/backend-ingress.yaml

echo "Checking deployment status..."
kubectl rollout status deployment/iot-edge-backend -n $NAMESPACE

echo "Deployment completed successfully!"
echo "API should be available at: https://api.iot-edge.digital-edge.sa/api"