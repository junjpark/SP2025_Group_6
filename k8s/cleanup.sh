#!/bin/bash

set -e

echo "🧹 Cleaning up Kubernetes resources..."

# Delete deployments and services
kubectl delete deployment frontend backend postgres --ignore-not-found=true
kubectl delete service frontend backend postgres --ignore-not-found=true
kubectl delete job flyway-migration --ignore-not-found=true

# Delete PVCs (this will delete the data!)
read -p "Delete database persistent volume? This will delete all data! (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    kubectl delete pvc postgres-pvc --ignore-not-found=true
fi

read -p "Delete backend uploads persistent volume? This will delete all uploaded videos! (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    kubectl delete pvc backend-uploads-pvc --ignore-not-found=true
fi

# Delete config and secrets
kubectl delete configmap app-config --ignore-not-found=true
kubectl delete secret app-secrets --ignore-not-found=true

echo "✅ Cleanup complete!"

