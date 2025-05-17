# IOT-Edge Backend Context

## Overview

The IOT-Edge backend is a comprehensive IoT platform built with Next.js and MySQL, providing real-time data processing, device management, and monitoring capabilities. This document focuses on production deployment and best practices.

## Core Technologies

- **Server Framework**: Next.js + Express.js
- **Database**: MySQL with connection pooling and replication
- **Authentication**: JWT-based authentication with refresh tokens
- **API**: RESTful API design pattern with rate limiting
- **Real-time Communication**: WebSocket and Server-Sent Events (SSE)
- **Caching**: Redis for session management and real-time features
- **Monitoring**: Prometheus metrics and Grafana dashboards
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)

## Production Architecture

```
[Load Balancer] → [Application Servers] → [Database Cluster]
      ↑                ↑                        ↑
      └────────────────┴────────────────────────┘
                      ↓
              [Redis Cluster]
                      ↓
              [Monitoring Stack]
```

## Project Structure

```
backend/
├── api/              # API routes and endpoints
│   ├── production/   # Production-specific configs
│   └── staging/      # Staging environment configs
├── config/           # Configuration files
├── docs/             # Documentation
├── k8s/              # Kubernetes configuration files
│   ├── production/   # Production K8s configs
│   └── staging/      # Staging K8s configs
├── middleware/       # Custom middleware
├── monitoring/       # Monitoring configurations
│   ├── prometheus/   # Prometheus rules
│   └── grafana/      # Grafana dashboards
├── scripts/          # Utility scripts
│   ├── deploy/       # Deployment scripts
│   └── maintenance/  # Maintenance scripts
├── utils/            # Utility functions
├── .env.production   # Production environment variables
├── .env.staging      # Staging environment variables
├── API_DOCUMENTATION.md
├── SYSTEM_DOCUMENTATION.md
├── deploy.sh         # Production deployment script
├── docker-compose.prod.yml
├── Dockerfile.prod   # Production Dockerfile
├── next.config.js
├── package.json
└── tsconfig.json
```

## Production Prerequisites

- Node.js >= 18.20.8 LTS
- npm >= 10.8.2
- MySQL >= 8.0 with replication
- Redis >= 7.0 with clustering
- Kubernetes >= 1.24
- Helm >= 3.0
- Prometheus & Grafana
- ELK Stack for logging
- SSL certificates
- Load balancer (e.g., Nginx, HAProxy)

## Production Environment Variables

```env
# Database Configuration
DB_HOST=db-cluster.internal
DB_USER=iotedge_prod
DB_PASSWORD=<secure-password>
DB_NAME=iotedge_prod
DB_REPLICA_HOST=db-replica.internal
DB_POOL_SIZE=20
DB_CONNECTION_TIMEOUT=30000

# Server Configuration
PORT=5000
NODE_ENV=production
API_URL=https://api.iot-edge.example.com
FRONTEND_URL=https://iot-edge.example.com

# JWT Configuration
JWT_SECRET=<secure-secret>
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
JWT_REFRESH_SECRET=<secure-refresh-secret>

# Redis Configuration
REDIS_HOST=redis-cluster.internal
REDIS_PORT=6379
REDIS_PASSWORD=<secure-password>
REDIS_TLS=true
REDIS_CLUSTER=true

# API Configuration
API_RATE_LIMIT=1000
API_RATE_WINDOW=15m
API_TIMEOUT=30000
CORS_ORIGINS=https://iot-edge.example.com

# Monitoring Configuration
ENABLE_MONITORING=true
MONITORING_INTERVAL=30
PROMETHEUS_METRICS=true
GRAFANA_DASHBOARDS=true

# Logging Configuration
LOG_LEVEL=info
ELASTICSEARCH_URL=http://elasticsearch.internal:9200
LOGSTASH_URL=http://logstash.internal:5044

# Security Configuration
SSL_CERT_PATH=/etc/ssl/certs/iot-edge.crt
SSL_KEY_PATH=/etc/ssl/private/iot-edge.key
ENABLE_2FA=true
PASSWORD_POLICY=strong
```

## Production Setup

1. Infrastructure Setup:
```bash
# Create Kubernetes cluster
kops create cluster --name=iot-edge.k8s.local \
  --state=s3://iot-edge-state \
  --zones=us-west-2a \
  --node-count=3 \
  --node-size=t3.large \
  --master-size=t3.medium

# Deploy infrastructure components
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install mysql bitnami/mysql --values k8s/production/mysql-values.yaml
helm install redis bitnami/redis --values k8s/production/redis-values.yaml
helm install prometheus prometheus-community/kube-prometheus-stack \
  --values k8s/production/monitoring-values.yaml
```

2. Database Setup:
```bash
# Initialize production database
mysql -h db-cluster.internal -u root -p < schema.sql

# Set up replication
mysql -h db-cluster.internal -u root -p << EOF
CREATE USER 'repl'@'%' IDENTIFIED BY '<secure-password>';
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'%';
FLUSH PRIVILEGES;
EOF
```

3. Application Deployment:
```bash
# Build production Docker image
docker build -t iot-edge-backend:prod -f Dockerfile.prod .

# Push to container registry
docker tag iot-edge-backend:prod registry.example.com/iot-edge-backend:prod
docker push registry.example.com/iot-edge-backend:prod

# Deploy to Kubernetes
kubectl apply -f k8s/production/
```

## Production API Endpoints

### Authentication (HTTPS Required)

- `POST /api/auth/login` - Login with rate limiting
- `POST /api/auth/logout` - Secure logout
- `POST /api/auth/refresh` - Token refresh
- `GET /api/auth/status` - Status check
- `POST /api/auth/2fa/enable` - Enable 2FA
- `POST /api/auth/2fa/verify` - Verify 2FA

### Health & Monitoring

- `GET /api/health` - Health check with detailed status
- `GET /api/health/database` - Database cluster health
- `GET /api/health/queues` - Message queue status
- `GET /api/metrics` - Prometheus metrics
- `GET /api/logs` - Application logs (admin only)

### Devices (Rate Limited)

- `GET /api/devices` - List with pagination
- `GET /api/devices/:deviceId/twin` - Device twin
- `POST /api/devices/:deviceId/methods/:methodName` - Method invocation
- `GET /api/devices/:deviceId/telemetry` - Device telemetry
- `POST /api/devices/:deviceId/commands` - Device commands

### Sensor Data (Optimized)

- `POST /api/sensor-data` - Batch data submission
- `GET /api/sensor-data/latest` - Latest readings
- `GET /api/sensor-data/history` - Historical data
- `GET /api/sensor-data/aggregated` - Aggregated data

## Production Scripts

```bash
# Deployment
npm run deploy:prod    # Deploy to production
npm run rollback      # Rollback to previous version
npm run scale:up      # Scale up resources
npm run scale:down    # Scale down resources

# Maintenance
npm run backup:db     # Database backup
npm run restore:db    # Database restore
npm run cleanup:logs  # Log rotation
npm run verify:ssl    # SSL certificate verification

# Monitoring
npm run check:health  # Health check
npm run check:metrics # Metrics verification
npm run check:logs    # Log analysis
```

## Production Deployment

### Kubernetes Deployment

1. Create production namespace:
```bash
kubectl create namespace iot-edge-prod
```

2. Apply production configurations:
```bash
kubectl apply -f k8s/production/namespace.yaml
kubectl apply -f k8s/production/configmap.yaml
kubectl apply -f k8s/production/secrets.yaml
kubectl apply -f k8s/production/deployment.yaml
kubectl apply -f k8s/production/service.yaml
kubectl apply -f k8s/production/ingress.yaml
```

3. Verify deployment:
```bash
kubectl get pods -n iot-edge-prod
kubectl get services -n iot-edge-prod
kubectl get ingress -n iot-edge-prod
```

### Production Security

1. **Network Security**
   - VPC with private subnets
   - Security groups and network policies
   - WAF integration
   - DDoS protection

2. **Application Security**
   - SSL/TLS encryption
   - API key authentication
   - Rate limiting
   - Input validation
   - SQL injection prevention
   - XSS protection
   - CSRF protection

3. **Data Security**
   - Encrypted data at rest
   - Encrypted data in transit
   - Regular security audits
   - Access control lists
   - Audit logging

## Production Monitoring

### Metrics Collection

```yaml
# prometheus-rules.yaml
groups:
  - name: iot-edge
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
      - alert: HighLatency
        expr: http_request_duration_seconds{quantile="0.9"} > 1
        for: 5m
        labels:
          severity: warning
```

### Logging Configuration

```yaml
# logstash.conf
input {
  beats {
    port => 5044
  }
}

filter {
  if [type] == "iot-edge" {
    json {
      source => "message"
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "iot-edge-%{+YYYY.MM.dd}"
  }
}
```

## Production Maintenance

### Database Maintenance

```bash
# Daily backup
mysqldump -h db-cluster.internal -u backup -p iotedge_prod | gzip > backup/iotedge_$(date +%Y%m%d).sql.gz

# Weekly optimization
mysql -h db-cluster.internal -u admin -p << EOF
OPTIMIZE TABLE sensor_data;
ANALYZE TABLE sensor_data;
EOF

# Monthly cleanup
mysql -h db-cluster.internal -u admin -p << EOF
DELETE FROM sensor_data WHERE timestamp < DATE_SUB(NOW(), INTERVAL 1 YEAR);
OPTIMIZE TABLE sensor_data;
EOF
```

### Application Maintenance

```bash
# Log rotation
find /var/log/iot-edge -name "*.log" -mtime +7 -exec gzip {} \;
find /var/log/iot-edge -name "*.gz" -mtime +30 -delete

# Certificate renewal
certbot renew --deploy-hook "kubectl create secret tls iot-edge-tls --cert=/etc/letsencrypt/live/iot-edge.example.com/fullchain.pem --key=/etc/letsencrypt/live/iot-edge.example.com/privkey.pem -n iot-edge-prod --dry-run=client"

# Cache cleanup
redis-cli -h redis-cluster.internal FLUSHALL
```

## Disaster Recovery

### Backup Strategy

1. **Database Backups**
   - Daily full backups
   - Hourly incremental backups
   - Point-in-time recovery enabled
   - Cross-region replication

2. **Application Backups**
   - Configuration backups
   - SSL certificates
   - User data
   - Custom scripts

### Recovery Procedures

1. **Database Recovery**
```bash
# Restore from backup
gunzip -c backup/iotedge_20240314.sql.gz | mysql -h db-cluster.internal -u admin -p iotedge_prod

# Verify data integrity
mysql -h db-cluster.internal -u admin -p << EOF
CHECK TABLE sensor_data;
REPAIR TABLE sensor_data;
EOF
```

2. **Application Recovery**
```bash
# Restore from backup
kubectl apply -f backup/k8s-prod-20240314/

# Verify deployment
kubectl rollout status deployment/iot-edge-backend -n iot-edge-prod
```

## Performance Optimization

### Database Optimization

```sql
-- Index optimization
CREATE INDEX idx_sensor_data_timestamp ON sensor_data(timestamp);
CREATE INDEX idx_sensor_data_sensor_id ON sensor_data(sensor_id);

-- Partitioning
ALTER TABLE sensor_data
PARTITION BY RANGE (UNIX_TIMESTAMP(timestamp)) (
    PARTITION p_2024_01 VALUES LESS THAN (UNIX_TIMESTAMP('2024-02-01 00:00:00')),
    PARTITION p_2024_02 VALUES LESS THAN (UNIX_TIMESTAMP('2024-03-01 00:00:00')),
    PARTITION p_2024_03 VALUES LESS THAN (UNIX_TIMESTAMP('2024-04-01 00:00:00')),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

### Application Optimization

```javascript
// Connection pooling
const pool = mysql.createPool({
  connectionLimit: 20,
  queueLimit: 0,
  waitForConnections: true,
  connectionTimeout: 30000,
  acquireTimeout: 30000,
  timeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Redis caching
const redis = new Redis.Cluster([
  { host: 'redis-1.internal', port: 6379 },
  { host: 'redis-2.internal', port: 6379 },
  { host: 'redis-3.internal', port: 6379 }
], {
  redisOptions: {
    password: process.env.REDIS_PASSWORD,
    tls: true
  }
});
```

## Additional Documentation

- [Production Deployment Guide](./docs/PRODUCTION_DEPLOYMENT.md)
- [Security Best Practices](./docs/SECURITY.md)
- [Monitoring Guide](./docs/MONITORING.md)
- [Disaster Recovery Plan](./docs/DISASTER_RECOVERY.md)
- [Performance Tuning Guide](./docs/PERFORMANCE.md)
- [Scaling Guide](./docs/SCALING.md)
- [Backup and Recovery Guide](./docs/BACKUP_RECOVERY.md)
- [Security Hardening Guide](./docs/SECURITY_HARDENING.md)

## Advanced Production Security

### Network Security

1. **VPC Configuration**
```yaml
# vpc-config.yaml
vpc:
  cidr: 10.0.0.0/16
  subnets:
    - name: private-1
      cidr: 10.0.1.0/24
      az: us-west-2a
    - name: private-2
      cidr: 10.0.2.0/24
      az: us-west-2b
    - name: public-1
      cidr: 10.0.3.0/24
      az: us-west-2a
    - name: public-2
      cidr: 10.0.4.0/24
      az: us-west-2b
```

2. **Security Groups**
```yaml
# security-groups.yaml
securityGroups:
  - name: iot-edge-api
    rules:
      - port: 443
        source: 0.0.0.0/0
        description: HTTPS
      - port: 80
        source: 0.0.0.0/0
        description: HTTP
  - name: iot-edge-internal
    rules:
      - port: 3306
        source: 10.0.0.0/16
        description: MySQL
      - port: 6379
        source: 10.0.0.0/16
        description: Redis
```

### Advanced Authentication

1. **JWT Configuration**
```javascript
// auth/jwt.config.js
const jwtConfig = {
  accessToken: {
    secret: process.env.JWT_SECRET,
    expiresIn: '1h',
    algorithm: 'RS256',
    audience: 'iot-edge-api',
    issuer: 'iot-edge-auth'
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '7d',
    algorithm: 'RS256'
  },
  mfa: {
    issuer: 'IOT-Edge',
    algorithm: 'SHA1',
    digits: 6,
    period: 30
  }
};
```

2. **Rate Limiting**
```javascript
// middleware/rate-limit.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

const limiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rate-limit:'
  }),
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});
```

## Advanced Scaling Strategies

### Horizontal Pod Autoscaling

```yaml
# k8s/production/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: iot-edge-backend
  namespace: iot-edge-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: iot-edge-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
    scaleUp:
      stabilizationWindowSeconds: 60
```

### Database Scaling

1. **Read Replicas**
```sql
-- Setup read replica
CHANGE MASTER TO
  MASTER_HOST='db-master.internal',
  MASTER_USER='repl',
  MASTER_PASSWORD='<secure-password>',
  MASTER_LOG_FILE='mysql-bin.000001',
  MASTER_LOG_POS=123;

START SLAVE;
```

2. **Connection Pooling**
```javascript
// config/database.js
const pool = mysql.createPool({
  connectionLimit: 20,
  queueLimit: 0,
  waitForConnections: true,
  connectionTimeout: 30000,
  acquireTimeout: 30000,
  timeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  multipleStatements: false,
  namedPlaceholders: true,
  dateStrings: true,
  timezone: 'Z',
  charset: 'utf8mb4'
});
```

## Advanced Monitoring

### Prometheus Rules

```yaml
# monitoring/prometheus/rules.yaml
groups:
  - name: iot-edge
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: High error rate detected
          description: Error rate is {{ $value }} for the last 5 minutes

      - alert: HighLatency
        expr: http_request_duration_seconds{quantile="0.9"} > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High latency detected
          description: 90th percentile latency is {{ $value }}s

      - alert: DatabaseConnections
        expr: mysql_global_status_threads_connected > 100
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High database connections
          description: {{ $value }} active database connections

      - alert: RedisMemoryUsage
        expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High Redis memory usage
          description: Redis memory usage is at {{ $value | humanizePercentage }}
```

### Grafana Dashboards

```json
// monitoring/grafana/dashboards/api.json
{
  "dashboard": {
    "id": null,
    "title": "IOT-Edge API Dashboard",
    "tags": ["iot-edge", "api"],
    "timezone": "browser",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{path}}"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "{{path}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])",
            "legendFormat": "{{path}}"
          }
        ]
      }
    ]
  }
}
```

## Advanced Logging

### ELK Stack Configuration

1. **Logstash Pipeline**
```yaml
# logging/logstash/pipeline.conf
input {
  beats {
    port => 5044
    ssl => true
    ssl_certificate => "/etc/logstash/certs/logstash.crt"
    ssl_key => "/etc/logstash/certs/logstash.key"
  }
}

filter {
  if [type] == "iot-edge" {
    json {
      source => "message"
    }
    date {
      match => [ "timestamp", "ISO8601" ]
      target => "@timestamp"
    }
    mutate {
      add_field => {
        "[@metadata][target_index]" => "iot-edge-%{+YYYY.MM.dd}"
      }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "%{[@metadata][target_index]}"
    ssl => true
    ssl_certificate_verification => true
    user => "${ELASTIC_USER}"
    password => "${ELASTIC_PASSWORD}"
  }
}
```

2. **Kibana Index Patterns**
```json
// logging/kibana/index-patterns.json
{
  "index_patterns": [
    {
      "title": "iot-edge-*",
      "timeFieldName": "@timestamp",
      "fields": [
        {
          "name": "level",
          "type": "string",
          "analyzed": true
        },
        {
          "name": "message",
          "type": "string",
          "analyzed": true
        },
        {
          "name": "timestamp",
          "type": "date"
        }
      ]
    }
  ]
}
```

## Advanced Backup Strategies

### Database Backup

```bash
#!/bin/bash
# scripts/backup/database-backup.sh

# Configuration
BACKUP_DIR="/backup/database"
RETENTION_DAYS=30
DB_HOST="db-cluster.internal"
DB_USER="backup"
DB_NAME="iotedge_prod"

# Create backup directory
mkdir -p $BACKUP_DIR

# Full backup
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD \
  --single-transaction \
  --master-data=2 \
  --triggers \
  --routines \
  --events \
  $DB_NAME | gzip > $BACKUP_DIR/full_$(date +%Y%m%d_%H%M%S).sql.gz

# Incremental backup
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -e "FLUSH LOGS;"
cp /var/lib/mysql/mysql-bin.* $BACKUP_DIR/

# Cleanup old backups
find $BACKUP_DIR -name "full_*.sql.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "mysql-bin.*" -mtime +$RETENTION_DAYS -delete
```

### Application Backup

```bash
#!/bin/bash
# scripts/backup/application-backup.sh

# Configuration
BACKUP_DIR="/backup/application"
RETENTION_DAYS=30
K8S_NAMESPACE="iot-edge-prod"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup Kubernetes resources
kubectl get all -n $K8S_NAMESPACE -o yaml > $BACKUP_DIR/k8s_$(date +%Y%m%d_%H%M%S).yaml

# Backup ConfigMaps
kubectl get configmaps -n $K8S_NAMESPACE -o yaml > $BACKUP_DIR/configmaps_$(date +%Y%m%d_%H%M%S).yaml

# Backup Secrets (encrypted)
kubectl get secrets -n $K8S_NAMESPACE -o yaml | \
  kubectl encrypt -o yaml > $BACKUP_DIR/secrets_$(date +%Y%m%d_%H%M%S).yaml

# Cleanup old backups
find $BACKUP_DIR -name "*.yaml" -mtime +$RETENTION_DAYS -delete
```

## Advanced Performance Tuning

### Database Optimization

```sql
-- Optimize tables
OPTIMIZE TABLE sensor_data;
ANALYZE TABLE sensor_data;

-- Add indexes for common queries
CREATE INDEX idx_sensor_data_timestamp ON sensor_data(timestamp);
CREATE INDEX idx_sensor_data_sensor_id ON sensor_data(sensor_id);
CREATE INDEX idx_sensor_data_type ON sensor_data(type);

-- Partition large tables
ALTER TABLE sensor_data
PARTITION BY RANGE (UNIX_TIMESTAMP(timestamp)) (
    PARTITION p_2024_01 VALUES LESS THAN (UNIX_TIMESTAMP('2024-02-01 00:00:00')),
    PARTITION p_2024_02 VALUES LESS THAN (UNIX_TIMESTAMP('2024-03-01 00:00:00')),
    PARTITION p_2024_03 VALUES LESS THAN (UNIX_TIMESTAMP('2024-04-01 00:00:00')),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- Optimize query cache
SET GLOBAL query_cache_size = 67108864;
SET GLOBAL query_cache_limit = 2097152;
```

### Application Optimization

```javascript
// config/optimization.js
const optimizationConfig = {
  // Connection pooling
  database: {
    pool: {
      min: 5,
      max: 20,
      idleTimeoutMillis: 30000,
      acquireTimeoutMillis: 30000
    }
  },
  
  // Redis caching
  redis: {
    cluster: {
      nodes: [
        { host: 'redis-1.internal', port: 6379 },
        { host: 'redis-2.internal', port: 6379 },
        { host: 'redis-3.internal', port: 6379 }
      ],
      options: {
        maxRedirections: 16,
        retryDelayOnFailover: 100,
        enableReadyCheck: true
      }
    },
    cache: {
      ttl: 3600,
      maxSize: 1000
    }
  },
  
  // API optimization
  api: {
    compression: true,
    etag: true,
    cors: {
      origin: ['https://iot-edge.example.com'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 1000
    }
  }
};
```

## Additional Documentation

- [Production Deployment Guide](./docs/PRODUCTION_DEPLOYMENT.md)
- [Security Best Practices](./docs/SECURITY.md)
- [Monitoring Guide](./docs/MONITORING.md)
- [Disaster Recovery Plan](./docs/DISASTER_RECOVERY.md)
- [Performance Tuning Guide](./docs/PERFORMANCE.md)
- [Scaling Guide](./docs/SCALING.md)
- [Backup and Recovery Guide](./docs/BACKUP_RECOVERY.md)
- [Security Hardening Guide](./docs/SECURITY_HARDENING.md)

## Kubernetes Production Deployment

### Ingress Configuration

```yaml
# k8s/production/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: iot-edge-ingress
  namespace: iot-edge-prod
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "300"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "300"
spec:
  tls:
  - hosts:
    - api.iot-edge.example.com
    secretName: iot-edge-tls
  rules:
  - host: api.iot-edge.example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: iot-edge-api
            port:
              number: 80
      - path: /health
        pathType: Prefix
        backend:
          service:
            name: iot-edge-health
            port:
              number: 80
```

### Service Mesh Integration (Istio)

```yaml
# k8s/production/istio/virtual-service.yaml
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: iot-edge-vs
  namespace: iot-edge-prod
spec:
  hosts:
  - "api.iot-edge.example.com"
  gateways:
  - iot-edge-gateway
  http:
  - match:
    - uri:
        prefix: /api
    route:
    - destination:
        host: iot-edge-api
        port:
          number: 80
      weight: 90
    - destination:
        host: iot-edge-api-canary
        port:
          number: 80
      weight: 10
    retries:
      attempts: 3
      perTryTimeout: 2s
    timeout: 5s
    fault:
      delay:
        percentage:
          value: 0.1
        fixedDelay: 5s
```

### Service Configuration

```yaml
# k8s/production/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: iot-edge-api
  namespace: iot-edge-prod
  labels:
    app: iot-edge
    component: api
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 5000
    protocol: TCP
    name: http
  selector:
    app: iot-edge
    component: api
---
apiVersion: v1
kind: Service
metadata:
  name: iot-edge-health
  namespace: iot-edge-prod
  labels:
    app: iot-edge
    component: health
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 8080
    protocol: TCP
    name: http
  selector:
    app: iot-edge
    component: health
```

### Deployment Configuration

```yaml
# k8s/production/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: iot-edge-api
  namespace: iot-edge-prod
  labels:
    app: iot-edge
    component: api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: iot-edge
      component: api
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: iot-edge
        component: api
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "5000"
        prometheus.io/path: "/metrics"
    spec:
      containers:
      - name: iot-edge-api
        image: registry.example.com/iot-edge-backend:prod
        imagePullPolicy: Always
        ports:
        - containerPort: 5000
          name: http
        - containerPort: 9090
          name: metrics
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: iot-edge-secrets
              key: db-host
        resources:
          requests:
            cpu: "500m"
            memory: "512Mi"
          limits:
            cpu: "1000m"
            memory: "1Gi"
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
        volumeMounts:
        - name: config
          mountPath: /app/config
        - name: logs
          mountPath: /app/logs
      volumes:
      - name: config
        configMap:
          name: iot-edge-config
      - name: logs
        emptyDir: {}
```

### ConfigMap and Secrets

```yaml
# k8s/production/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: iot-edge-config
  namespace: iot-edge-prod
data:
  NODE_ENV: "production"
  API_RATE_LIMIT: "1000"
  API_RATE_WINDOW: "15m"
  LOG_LEVEL: "info"
  ENABLE_MONITORING: "true"
  PROMETHEUS_METRICS: "true"
---
# k8s/production/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: iot-edge-secrets
  namespace: iot-edge-prod
type: Opaque
data:
  db-host: <base64-encoded>
  db-user: <base64-encoded>
  db-password: <base64-encoded>
  jwt-secret: <base64-encoded>
  redis-password: <base64-encoded>
```

### Network Policies

```yaml
# k8s/production/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: iot-edge-network-policy
  namespace: iot-edge-prod
spec:
  podSelector:
    matchLabels:
      app: iot-edge
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 80
    - protocol: TCP
      port: 443
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: database
    ports:
    - protocol: TCP
      port: 3306
  - to:
    - namespaceSelector:
        matchLabels:
          name: redis
    ports:
    - protocol: TCP
      port: 6379
```

### Resource Quotas

```yaml
# k8s/production/resource-quota.yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: iot-edge-quota
  namespace: iot-edge-prod
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 8Gi
    limits.cpu: "8"
    limits.memory: 16Gi
    pods: "10"
    services: "5"
    persistentvolumeclaims: "5"
```

### Pod Disruption Budget

```yaml
# k8s/production/pdb.yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: iot-edge-pdb
  namespace: iot-edge-prod
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: iot-edge
      component: api
```

## Deployment Scripts

### Production Deployment

```bash
#!/bin/bash
# scripts/deploy/production-deploy.sh

# Configuration
NAMESPACE="iot-edge-prod"
REGISTRY="registry.example.com"
IMAGE_TAG="prod-$(date +%Y%m%d-%H%M%S)"

# Build and push Docker image
docker build -t $REGISTRY/iot-edge-backend:$IMAGE_TAG -f Dockerfile.prod .
docker push $REGISTRY/iot-edge-backend:$IMAGE_TAG

# Update deployment
kubectl set image deployment/iot-edge-api \
  iot-edge-api=$REGISTRY/iot-edge-backend:$IMAGE_TAG \
  -n $NAMESPACE

# Verify deployment
kubectl rollout status deployment/iot-edge-api -n $NAMESPACE

# Run post-deployment checks
./scripts/health-check.sh
./scripts/metrics-verify.sh
```

### Health Check Script

```bash
#!/bin/bash
# scripts/health-check.sh

# Configuration
API_URL="https://api.iot-edge.example.com"
HEALTH_ENDPOINTS=(
  "/health"
  "/health/database"
  "/health/queues"
)

# Check each endpoint
for endpoint in "${HEALTH_ENDPOINTS[@]}"; do
  response=$(curl -s -o /dev/null -w "%{http_code}" $API_URL$endpoint)
  if [ "$response" != "200" ]; then
    echo "Health check failed for $endpoint: $response"
    exit 1
  fi
done

echo "All health checks passed"
```

### Metrics Verification

```bash
#!/bin/bash
# scripts/metrics-verify.sh

# Configuration
PROMETHEUS_URL="http://prometheus:9090"
METRICS=(
  "http_requests_total"
  "http_request_duration_seconds"
  "mysql_connections"
  "redis_connected_clients"
)

# Check each metric
for metric in "${METRICS[@]}"; do
  result=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=$metric")
  if [ "$(echo $result | jq '.status')" != "success" ]; then
    echo "Metric verification failed for $metric"
    exit 1
  fi
done

echo "All metrics verified"
```

## Additional Documentation

- [Production Deployment Guide](./docs/PRODUCTION_DEPLOYMENT.md)
- [Security Best Practices](./docs/SECURITY.md)
- [Monitoring Guide](./docs/MONITORING.md)
- [Disaster Recovery Plan](./docs/DISASTER_RECOVERY.md)
- [Performance Tuning Guide](./docs/PERFORMANCE.md)
- [Scaling Guide](./docs/SCALING.md)
- [Backup and Recovery Guide](./docs/BACKUP_RECOVERY.md)
- [Security Hardening Guide](./docs/SECURITY_HARDENING.md)
- [Kubernetes Deployment Guide](./docs/KUBERNETES_DEPLOYMENT.md)
- [Service Mesh Guide](./docs/SERVICE_MESH.md)
- [Network Policies Guide](./docs/NETWORK_POLICIES.md) 