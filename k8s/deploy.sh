#!/bin/bash

set -e

echo "🚀 Deploying Cory application to Kubernetes..."

# Check if minikube is running
if ! minikube status > /dev/null 2>&1; then
    echo "Starting minikube..."
    minikube start
fi

# Set docker environment to use minikube's docker daemon
eval $(minikube docker-env)

echo "📦 Building Docker images..."

# Check if VITE_CLIENT_ID is set (needed for Google OAuth)
if [ -z "$VITE_CLIENT_ID" ]; then
    echo "⚠️  Warning: VITE_CLIENT_ID not set. Google OAuth may not work."
    echo "   Set it with: export VITE_CLIENT_ID='your-client-id'"
    echo "   Or add it to k8s/config/secrets.yaml and rebuild"
fi

# Build backend image
echo "Building backend image..."
cd backend
docker build -f docker/Dockerfile -t cory-backend:latest .
if [ $? -ne 0 ]; then
    echo "❌ Backend image build failed!"
    exit 1
fi
cd ..

# Build frontend image (with VITE_CLIENT_ID if set)
echo "Building frontend image..."
cd cory
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
cd ..

echo "📝 Applying Kubernetes manifests..."

# Apply config and secrets first
echo "Applying ConfigMap and Secrets..."
kubectl apply -f k8s/config/configmap.yaml
kubectl apply -f k8s/config/secrets.yaml
kubectl apply -f k8s/config/flyway-configmap.yaml

# Create SQL files ConfigMap from directory
if [ -d "sql" ] && [ "$(ls -A sql/*.sql 2>/dev/null)" ]; then
    echo "Creating SQL files ConfigMap..."
    kubectl create configmap sql-files-config --from-file=sql/ --dry-run=client -o yaml | kubectl apply -f -
else
    echo "⚠️  Warning: SQL directory not found or empty. Flyway migration may fail."
fi

# Apply database
echo "Deploying database..."
kubectl apply -f k8s/database/postgres-pvc.yaml
kubectl apply -f k8s/database/postgres-deployment.yaml
kubectl apply -f k8s/database/postgres-service.yaml

# Wait for database to be ready
echo "Waiting for database to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/postgres

# Run flyway migration
echo "Running database migrations..."
kubectl apply -f k8s/flyway/flyway-job.yaml
kubectl wait --for=condition=complete --timeout=300s job/flyway-migration || true

# Deploy backend
echo "Deploying backend..."
kubectl apply -f k8s/backend/uploads-pvc.yaml
kubectl apply -f k8s/backend/backend-deployment.yaml
kubectl apply -f k8s/backend/backend-service.yaml

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/backend

# Deploy frontend
echo "Deploying frontend..."
kubectl apply -f k8s/frontend/frontend-deployment.yaml
kubectl apply -f k8s/frontend/frontend-service.yaml

# Wait for frontend to be ready
echo "Waiting for frontend to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/frontend

# Set up port forwarding
echo "Setting up port forwarding..."
pkill -f "kubectl port-forward service/frontend" || true
pkill -f "kubectl port-forward service/backend" || true
sleep 1
kubectl port-forward service/frontend 5173:5173 > /dev/null 2>&1 &
kubectl port-forward service/backend 8000:8000 > /dev/null 2>&1 &
sleep 2

echo "✅ Deployment complete!"
echo ""
echo "Access the application at:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8000"
echo ""
echo "Port forwarding is running in the background."
echo "To stop: ./k8s/stop.sh"
echo ""
echo "To view logs:"
echo "  kubectl logs -f deployment/frontend"
echo "  kubectl logs -f deployment/backend"
echo "  kubectl logs -f deployment/postgres"

