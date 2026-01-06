# Agentic IDE - Deployment Guide

## Overview

This guide covers deploying Agentic IDE in various environments:
- Local development
- Docker containerization
- Cloud deployment (AWS, GCP, Azure)
- Kubernetes orchestration
- CI/CD integration

---

## 📋 Prerequisites

- Node.js 22+ or Docker
- npm or pnpm
- Git
- Your LLM endpoint (LM Studio, Ollama, OpenAI, etc.)

---

## 🚀 Local Development

### Installation

```bash
cd /home/ubuntu/agentic-ide
npm install
npm run compile
npm run dev
```

### Configuration

Create `.env` file:

```env
NODE_ENV=development
PORT=3000
LLM_ENDPOINT=http://localhost:8000/v1
LLM_API_KEY=sk-default
LLM_MODEL=mistral
DEBUG=agentic:*
```

### Running

```bash
npm run dev
```

Access at `http://localhost:3000`

---

## 🐳 Docker Deployment

### Build Image

```bash
docker build -t agentic-ide:latest .
```

### Run Container

```bash
docker run -d \
  --name agentic-ide \
  -p 3000:3000 \
  -e LLM_ENDPOINT=http://host.docker.internal:8000/v1 \
  -e LLM_API_KEY=sk-default \
  -e LLM_MODEL=mistral \
  -v agentic-data:/app/data \
  agentic-ide:latest
```

### Docker Compose

```bash
docker-compose up -d
```

With LM Studio:

```bash
docker-compose --profile with-lm-studio up -d
```

---

## ☁️ Cloud Deployment

### AWS Deployment

#### Using EC2

```bash
# Launch EC2 instance (Ubuntu 22.04)
# SSH into instance

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Clone and deploy
git clone https://github.com/yourusername/agentic-ide.git
cd agentic-ide
docker-compose up -d
```

#### Using ECS

```bash
# Create ECS task definition
aws ecs register-task-definition \
  --cli-input-json file://task-definition.json

# Create ECS service
aws ecs create-service \
  --cluster agentic-cluster \
  --service-name agentic-ide \
  --task-definition agentic-ide:1 \
  --desired-count 1
```

#### Using Lambda

```bash
# Package for Lambda
npm run build:lambda

# Deploy
aws lambda create-function \
  --function-name agentic-ide \
  --runtime nodejs22.x \
  --role arn:aws:iam::ACCOUNT:role/lambda-role \
  --handler index.handler \
  --zip-file fileb://dist/lambda.zip
```

### Google Cloud Deployment

#### Using Cloud Run

```bash
# Build image
gcloud builds submit --tag gcr.io/PROJECT_ID/agentic-ide

# Deploy
gcloud run deploy agentic-ide \
  --image gcr.io/PROJECT_ID/agentic-ide \
  --platform managed \
  --region us-central1 \
  --set-env-vars LLM_ENDPOINT=YOUR_ENDPOINT,LLM_API_KEY=YOUR_KEY
```

#### Using Compute Engine

```bash
# Create instance
gcloud compute instances create agentic-ide \
  --image-family ubuntu-2204-lts \
  --image-project ubuntu-os-cloud \
  --machine-type e2-medium

# SSH and deploy
gcloud compute ssh agentic-ide
# Then follow Docker deployment steps
```

### Azure Deployment

#### Using Container Instances

```bash
az container create \
  --resource-group myResourceGroup \
  --name agentic-ide \
  --image agentic-ide:latest \
  --environment-variables LLM_ENDPOINT=YOUR_ENDPOINT
```

#### Using App Service

```bash
# Create App Service
az appservice plan create \
  --name agentic-plan \
  --resource-group myResourceGroup \
  --sku B1 --is-linux

# Deploy
az webapp create \
  --resource-group myResourceGroup \
  --plan agentic-plan \
  --name agentic-ide \
  --deployment-container-image-name agentic-ide:latest
```

---

## 🐙 Kubernetes Deployment

### Create Deployment

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agentic-ide
spec:
  replicas: 3
  selector:
    matchLabels:
      app: agentic-ide
  template:
    metadata:
      labels:
        app: agentic-ide
    spec:
      containers:
      - name: agentic-ide
        image: agentic-ide:latest
        ports:
        - containerPort: 3000
        env:
        - name: LLM_ENDPOINT
          valueFrom:
            configMapKeyRef:
              name: agentic-config
              key: llm-endpoint
        - name: LLM_API_KEY
          valueFrom:
            secretKeyRef:
              name: agentic-secrets
              key: api-key
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Create Service

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: agentic-ide-service
spec:
  selector:
    app: agentic-ide
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

### Deploy to Kubernetes

```bash
# Create ConfigMap
kubectl create configmap agentic-config \
  --from-literal=llm-endpoint=http://llm-service:8000/v1

# Create Secret
kubectl create secret generic agentic-secrets \
  --from-literal=api-key=sk-default

# Deploy
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml

# Check status
kubectl get pods
kubectl get services
```

---

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy Agentic IDE

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build Docker image
        run: docker build -t agentic-ide:${{ github.sha }} .
      
      - name: Push to registry
        run: |
          docker tag agentic-ide:${{ github.sha }} agentic-ide:latest
          docker push agentic-ide:latest
      
      - name: Deploy to production
        run: |
          kubectl set image deployment/agentic-ide \
            agentic-ide=agentic-ide:${{ github.sha }}
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - build
  - test
  - deploy

build:
  stage: build
  script:
    - docker build -t agentic-ide:$CI_COMMIT_SHA .
    - docker push agentic-ide:$CI_COMMIT_SHA

test:
  stage: test
  script:
    - npm install
    - npm test

deploy:
  stage: deploy
  script:
    - kubectl set image deployment/agentic-ide agentic-ide=agentic-ide:$CI_COMMIT_SHA
```

---

## 📊 Scaling Configuration

### Horizontal Scaling

```bash
# Kubernetes
kubectl scale deployment agentic-ide --replicas=5

# Docker Swarm
docker service scale agentic-ide=5
```

### Load Balancing

```nginx
# nginx.conf
upstream agentic_backend {
    server agentic-ide-1:3000;
    server agentic-ide-2:3000;
    server agentic-ide-3:3000;
}

server {
    listen 80;
    server_name api.agentic-ide.com;

    location / {
        proxy_pass http://agentic_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🔐 Security Configuration

### Environment Variables

```bash
# .env.production
NODE_ENV=production
PORT=3000
LLM_ENDPOINT=https://your-llm-endpoint
LLM_API_KEY=your-secure-api-key
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=https://your-domain.com
```

### SSL/TLS

```bash
# Using Let's Encrypt
certbot certonly --standalone -d api.agentic-ide.com

# Configure nginx
server {
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/api.agentic-ide.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.agentic-ide.com/privkey.pem;
}
```

### API Authentication

```typescript
// Add authentication middleware
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || !isValidApiKey(apiKey)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
});
```

---

## 📈 Monitoring & Logging

### Prometheus Metrics

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'agentic-ide'
    static_configs:
      - targets: ['localhost:3000']
```

### ELK Stack

```bash
# Deploy ELK
docker-compose -f docker-compose.elk.yml up -d

# Configure logging
# Logs automatically sent to Elasticsearch
```

### CloudWatch (AWS)

```bash
# Configure CloudWatch agent
aws logs create-log-group --log-group-name /agentic-ide/app
aws logs create-log-stream --log-group-name /agentic-ide/app --log-stream-name production
```

---

## 🔧 Troubleshooting

### Container won't start

```bash
# Check logs
docker logs agentic-ide

# Check environment variables
docker inspect agentic-ide

# Rebuild image
docker build --no-cache -t agentic-ide:latest .
```

### High memory usage

```bash
# Check memory
docker stats agentic-ide

# Increase limits
docker update --memory 1g agentic-ide

# Optimize code
npm run profile
```

### Connection issues

```bash
# Check network
docker network inspect bridge

# Test connectivity
docker exec agentic-ide curl http://llm-service:8000/health

# Check DNS
docker exec agentic-ide nslookup llm-service
```

---

## 📋 Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] SSL/TLS certificates ready
- [ ] Database migrations completed
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Logging configured
- [ ] Security scans completed
- [ ] Performance tested
- [ ] Documentation updated

---

## 🚀 Deployment Commands

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Docker
```bash
docker build -t agentic-ide:latest .
docker run -d -p 3000:3000 agentic-ide:latest
```

### Kubernetes
```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

### Cloud Deploy
```bash
# AWS
aws deploy create-deployment --application-name agentic-ide

# GCP
gcloud app deploy

# Azure
az webapp deployment source config-zip --resource-group myGroup --name myApp --src-path app.zip
```

---

## 📞 Support

For deployment issues:
1. Check logs: `docker logs agentic-ide`
2. Check health: `curl http://localhost:3000/health`
3. Check configuration: Review `.env` file
4. Check network: Verify LLM endpoint accessibility

---

**Agentic IDE Deployment Guide** - Complete & Ready for Production
