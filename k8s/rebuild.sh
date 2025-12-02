#!/bin/bash

set -e

echo "🔄 Rebuilding and redeploying with local changes..."

# Get the script directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Change to project root
cd "$PROJECT_ROOT"

# Check if minikube is running
if ! minikube status > /dev/null 2>&1; then
    echo "❌ Minikube is not running. Start it with: minikube start"
    exit 1
fi

# Set docker environment to use minikube's docker daemon
eval $(minikube docker-env)

# Check if VITE_CLIENT_ID is set (needed for Google OAuth)
if [ -z "$VITE_CLIENT_ID" ]; then
    echo "⚠️  Warning: VITE_CLIENT_ID not set. Google OAuth may not work."
    echo "   Set it with: export VITE_CLIENT_ID='your-client-id'"
fi

# Build backend image
echo "📦 Building backend image..."
cd "$PROJECT_ROOT/backend"
docker build -f docker/Dockerfile -t cory-backend:latest .
if [ $? -ne 0 ]; then
    echo "❌ Backend image build failed!"
    exit 1
fi

# Build frontend image (with VITE_CLIENT_ID if set)
echo "📦 Building frontend image..."
cd "$PROJECT_ROOT/cory"
if [ ! -z "$VITE_CLIENT_ID" ]; then
    echo "Building with VITE_CLIENT_ID from environment..."
    docker build -f docker/Dockerfile --build-arg VITE_CLIENT_ID="$VITE_CLIENT_ID" -t cory-frontend:latest .
else
    docker build -f docker/Dockerfile -t cory-frontend:latest .
fi
if [ $? -ne 0 ]; then
    echo "❌ Frontend image build failed!"
    exit 1
fi

# Restart deployments to use new images
echo "🔄 Restarting deployments..."
kubectl rollout restart deployment/backend
kubectl rollout restart deployment/frontend

# Wait for deployments to be ready
echo "⏳ Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/backend
kubectl wait --for=condition=available --timeout=300s deployment/frontend

# Ensure port forwarding is running
"$SCRIPT_DIR/ensure-port-forward.sh"

echo "✅ Rebuild complete! Your changes should now be live."
echo ""
echo "Access the application at:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8000"

