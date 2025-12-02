#!/bin/bash

set -e

# Script to ensure port forwarding is running
# Kills existing port-forwards and starts fresh ones

echo "🔌 Ensuring port forwarding is active..."

# Kill existing port-forward processes
echo "Killing existing port-forward processes..."
pkill -f "kubectl port-forward service/frontend" || true
pkill -f "kubectl port-forward service/backend" || true
sleep 2

# Wait for services to be ready
echo "⏳ Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/frontend || {
    echo "❌ Frontend deployment not ready"
    exit 1
}
kubectl wait --for=condition=available --timeout=300s deployment/backend || {
    echo "❌ Backend deployment not ready"
    exit 1
}

# Wait a bit more for pods to be fully running
echo "⏳ Waiting for pods to be fully running..."
sleep 3

# Get pod names to verify they exist
FRONTEND_POD=$(kubectl get pods -l app=frontend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
BACKEND_POD=$(kubectl get pods -l app=backend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

if [ -z "$FRONTEND_POD" ] || [ -z "$BACKEND_POD" ]; then
    echo "❌ Could not find running pods"
    kubectl get pods
    exit 1
fi

echo "Found pods: frontend=$FRONTEND_POD, backend=$BACKEND_POD"

# Start port forwarding
echo "Starting port forwarding..."
# Use nohup and redirect to log files
nohup kubectl port-forward service/frontend 5173:5173 > /tmp/k8s-frontend-pf.log 2>&1 &
FRONTEND_PF_PID=$!
nohup kubectl port-forward service/backend 8000:8000 > /tmp/k8s-backend-pf.log 2>&1 &
BACKEND_PF_PID=$!

# Wait for port-forward to establish
echo "Waiting for port-forward to establish..."
sleep 5

# Verify port forwarding is actually working by testing connectivity
MAX_RETRIES=10
RETRY_COUNT=0
FRONTEND_OK=false
BACKEND_OK=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    # Check if processes are still running
    if ! ps -p $FRONTEND_PF_PID > /dev/null 2>&1; then
        echo "⚠️  Frontend port-forward died, restarting..."
        nohup kubectl port-forward service/frontend 5173:5173 > /tmp/k8s-frontend-pf.log 2>&1 &
        FRONTEND_PF_PID=$!
        sleep 2
    fi
    
    if ! ps -p $BACKEND_PF_PID > /dev/null 2>&1; then
        echo "⚠️  Backend port-forward died, restarting..."
        nohup kubectl port-forward service/backend 8000:8000 > /tmp/k8s-backend-pf.log 2>&1 &
        BACKEND_PF_PID=$!
        sleep 2
    fi
    
    # Test connectivity
    if [ "$FRONTEND_OK" = false ]; then
        FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 2>/dev/null || echo "000")
        if [ "$FRONTEND_STATUS" = "200" ] || [ "$FRONTEND_STATUS" = "302" ]; then
            FRONTEND_OK=true
        fi
    fi
    
    if [ "$BACKEND_OK" = false ]; then
        BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/docs 2>/dev/null || echo "000")
        if [ "$BACKEND_STATUS" = "200" ] || [ "$BACKEND_STATUS" = "302" ]; then
            BACKEND_OK=true
        fi
    fi
    
    if [ "$FRONTEND_OK" = true ] && [ "$BACKEND_OK" = true ]; then
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    sleep 1
done

if [ "$FRONTEND_OK" = true ] && [ "$BACKEND_OK" = true ]; then
    echo "✅ Port forwarding is active and verified"
    echo "   Frontend: http://localhost:5173"
    echo "   Backend:  http://localhost:8000"
else
    echo "❌ Port forwarding verification failed"
    echo "   Frontend OK: $FRONTEND_OK"
    echo "   Backend OK: $BACKEND_OK"
    echo ""
    echo "Checking logs..."
    echo "Frontend log:"
    tail -10 /tmp/k8s-frontend-pf.log 2>/dev/null || echo "No log file"
    echo ""
    echo "Backend log:"
    tail -10 /tmp/k8s-backend-pf.log 2>/dev/null || echo "No log file"
    exit 1
fi

