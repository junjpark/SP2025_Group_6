# Kubernetes Deployment Guide

This guide explains how to deploy the Cory application to Kubernetes using minikube for class demo purposes.

## Prerequisites

- Docker installed and running
- kubectl installed (comes with minikube)
- minikube installed (`brew install minikube`)

## Quick Start

### 1. Start Minikube

```bash
minikube start
```

Verify minikube is running:
```bash
minikube status
kubectl get nodes
```

### 2. Configure Google OAuth (Required for Login)

Before deploying, you need to add your Google OAuth Client ID to the secrets:

1. Get your Client ID from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Edit `k8s/config/secrets.yaml` and uncomment/add:
   ```yaml
   VITE_CLIENT_ID: "your-client-id.apps.googleusercontent.com"
   ```
3. Apply the updated secret:
   ```bash
   kubectl apply -f k8s/config/secrets.yaml
   ```

### 3. Deploy All Services

Run the deployment script:
```bash
./k8s/deploy.sh
```

This script will:
- Build Docker images for backend and frontend
- Deploy all Kubernetes resources in the correct order
- Wait for services to be ready

**Note:** If you add VITE_CLIENT_ID after deployment, you'll need to restart the frontend:
```bash
kubectl rollout restart deployment/frontend
```

### 3. Access the Application

The deployment script automatically sets up port forwarding. Access the application at:

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000

Port forwarding runs in the background automatically. You don't need to set it up manually.

**Alternative access methods:**

Using minikube service (opens browser):
```bash
minikube service frontend
```

Get the URL without opening browser:
```bash
minikube service frontend --url
```

## Manual Deployment Steps

If you prefer to deploy manually:

### 1. Set Docker Environment

```bash
eval $(minikube docker-env)
```

This allows you to use minikube's Docker daemon to build images.

### 2. Build Images

```bash
# Build backend
cd backend
docker build -f docker/Dockerfile -t cory-backend:latest .
cd ..

# Build frontend
cd cory
docker build -f docker/Dockerfile -t cory-frontend:latest .
cd ..
```

### 3. Deploy in Order

```bash
# 1. Config and Secrets
kubectl apply -f k8s/config/configmap.yaml
kubectl apply -f k8s/config/secrets.yaml

# 2. Database
kubectl apply -f k8s/database/postgres-pvc.yaml
kubectl apply -f k8s/database/postgres-deployment.yaml
kubectl apply -f k8s/database/postgres-service.yaml

# Wait for database
kubectl wait --for=condition=available --timeout=300s deployment/postgres

# 3. Flyway Migration
kubectl apply -f k8s/flyway/flyway-job.yaml
kubectl wait --for=condition=complete --timeout=300s job/flyway-migration

# 4. Backend
kubectl apply -f k8s/backend/backend-deployment.yaml
kubectl apply -f k8s/backend/backend-service.yaml

# Wait for backend
kubectl wait --for=condition=available --timeout=300s deployment/backend

# 5. Frontend
kubectl apply -f k8s/frontend/frontend-deployment.yaml
kubectl apply -f k8s/frontend/frontend-service.yaml
```

## Useful Commands

### View Pods

```bash
kubectl get pods
```

### View Services

```bash
kubectl get services
```

### View Logs

```bash
# Frontend logs
kubectl logs -f deployment/frontend

# Backend logs
kubectl logs -f deployment/backend

# Database logs
kubectl logs -f deployment/postgres

# Flyway migration logs
kubectl logs job/flyway-migration
```

### Describe Resources

```bash
kubectl describe deployment frontend
kubectl describe service frontend
kubectl describe pod <pod-name>
```

### Execute Commands in Pods

```bash
# Get shell access to a pod
kubectl exec -it <pod-name> -- /bin/sh

# Example: Connect to database
kubectl exec -it deployment/postgres -- psql -U postgres -d cory
```

### Port Forwarding

Port forwarding is automatically set up by `deploy.sh` and `start.sh`. The scripts run:
- `kubectl port-forward service/frontend 5173:5173` (background)
- `kubectl port-forward service/backend 8000:8000` (background)

**Manual port forwarding** (if needed):
```bash
# Forward frontend port
kubectl port-forward service/frontend 5173:5173

# Forward backend port
kubectl port-forward service/backend 8000:8000

# Forward database port
kubectl port-forward service/postgres 5432:5432
```

**Note:** The `stop.sh` script automatically kills port-forward processes when stopping the deployment.

## Stop and Start

### Quick Stop (keeps resources, just stops pods)

```bash
./k8s/stop.sh
```

This scales all deployments to 0 replicas, stopping all pods but keeping the configuration.

### Quick Start (restarts stopped pods)

```bash
./k8s/start.sh
```

This starts minikube if needed, scales all deployments back to 1 replica, and automatically sets up port forwarding. Access the app at:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000

### Stop Minikube (pauses the cluster)

```bash
minikube stop
```

This pauses the minikube VM but keeps all resources. To resume:

```bash
minikube start
```

## Cleanup

To completely remove all deployed resources:

```bash
./k8s/cleanup.sh
```

Or manually:

```bash
kubectl delete deployment frontend backend postgres
kubectl delete service frontend backend postgres
kubectl delete job flyway-migration
kubectl delete pvc postgres-pvc
kubectl delete configmap app-config
kubectl delete secret app-secrets
```

To delete minikube cluster completely (removes everything):

```bash
minikube delete
```

## Troubleshooting

### Pods Not Starting

Check pod status:
```bash
kubectl get pods
kubectl describe pod <pod-name>
```

Common issues:
- Image pull errors: Make sure you've built images with `eval $(minikube docker-env)` first
- Database not ready: Wait for postgres deployment to be available
- Volume mount issues: Check that host paths exist

### Services Not Accessible

Check service endpoints:
```bash
kubectl get endpoints
```

Verify service selector matches pod labels:
```bash
kubectl get pods --show-labels
kubectl describe service <service-name>
```

### Database Connection Issues

Test database connectivity:
```bash
kubectl exec -it deployment/backend -- nc -z postgres 5432
```

Check database logs:
```bash
kubectl logs deployment/postgres
```

### Rebuild and Redeploy

If you make code changes:

1. Rebuild images:
```bash
eval $(minikube docker-env)
cd backend && docker build -f docker/Dockerfile -t cory-backend:latest . && cd ..
cd cory && docker build -f docker/Dockerfile -t cory-frontend:latest . && cd ..
```

2. Restart deployments:
```bash
kubectl rollout restart deployment/backend
kubectl rollout restart deployment/frontend
```

## Architecture

The deployment consists of:

- **PostgreSQL Database**: Persistent storage with PVC
- **Flyway Job**: One-time database migration
- **Backend Service**: Python FastAPI application
- **Frontend Service**: React/Vite application

Services communicate via Kubernetes service names:
- Frontend → Backend: `http://backend:8000`
- Backend → Database: `postgres:5432`
- Flyway → Database: `postgres:5432`

## Notes for Demo

- The deployment uses hostPath volumes for code mounting (development setup)
- Images are built locally and not pulled from a registry
- Secrets contain default values (change for production)
- NodePort service is used for easy access without LoadBalancer
- All services run with 1 replica (can be scaled for production)

## Production Considerations

For production deployment, consider:

- Using a container registry (Docker Hub, ECR, GCR)
- Using ConfigMaps and Secrets properly (no hardcoded values)
- Setting resource limits and requests
- Using proper storage classes (not hostPath)
- Setting up ingress controllers
- Using secrets management (Vault, AWS Secrets Manager)
- Setting up monitoring and logging
- Using HorizontalPodAutoscaler for scaling

