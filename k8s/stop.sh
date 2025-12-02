#!/bin/bash

set -e

echo "🛑 Stopping Kubernetes deployment..."

# Kill port-forward processes
echo "Stopping port-forward processes..."
pkill -f "kubectl port-forward service/frontend" || true
pkill -f "kubectl port-forward service/backend" || true

# Stop all deployments (this stops the pods but keeps the resources)
kubectl scale deployment --all --replicas=0

echo "✅ All deployments scaled to 0 replicas"
echo "✅ Port forwarding stopped"
echo ""
echo "To completely remove resources, run: ./k8s/cleanup.sh"
echo "To stop minikube, run: minikube stop"

