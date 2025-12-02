#!/bin/bash

set -e

echo "🚀 Starting Kubernetes deployment..."

# Check if minikube is running
if ! minikube status > /dev/null 2>&1; then
    echo "Starting minikube..."
    minikube start
fi

# Kill any existing port-forward processes
echo "Cleaning up existing port-forward processes..."
pkill -f "kubectl port-forward service/frontend" || true
pkill -f "kubectl port-forward service/backend" || true
sleep 1

# Ensure PVCs exist
kubectl apply -f k8s/backend/uploads-pvc.yaml || true

# Scale all deployments back to 1 replica
kubectl scale deployment postgres --replicas=1
kubectl scale deployment backend --replicas=1
kubectl scale deployment frontend --replicas=1

echo "Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/postgres
kubectl wait --for=condition=available --timeout=300s deployment/backend
kubectl wait --for=condition=available --timeout=300s deployment/frontend

# Set up port forwarding
echo "Setting up port forwarding..."
kubectl port-forward service/frontend 5173:5173 > /dev/null 2>&1 &
kubectl port-forward service/backend 8000:8000 > /dev/null 2>&1 &
sleep 2

echo "✅ All deployments started!"
echo ""
echo "Access the application at:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8000"
echo ""
echo "Port forwarding is running in the background."
echo "To stop port forwarding, run: ./k8s/stop.sh"

