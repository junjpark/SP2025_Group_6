# Configuration Management

## Secrets

The `secrets.yaml` file contains default values for development. For production, you should create secrets using kubectl:

```bash
kubectl create secret generic app-secrets \
  --from-literal=POSTGRES_USER=your_username \
  --from-literal=POSTGRES_PASSWORD=your_password \
  --from-literal=POSTGRES_DB=your_database
```

Or edit the secrets.yaml file and apply it:

```bash
kubectl apply -f k8s/config/secrets.yaml
```

**Note:** The secrets.yaml file contains plain text values. In production, use `kubectl create secret` or encrypt the file.

## ConfigMap

The ConfigMap contains non-sensitive configuration values. Edit `configmap.yaml` and apply:

```bash
kubectl apply -f k8s/config/configmap.yaml
```

