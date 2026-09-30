#!/bin/bash
# ShipNex Production Deployment Script
# This script deploys ShipNex with HTTPS support

set -e

# Configuration
DOMAIN=${DOMAIN:-"yourdomain.com"}
EMAIL=${EMAIL:-"admin@yourdomain.com"}
# This is the PRODUCTION stack: TLS terminator (nginx.prod.conf), Supabase document
# storage, 512 MB caps, health-gated startup and log rotation. The dev stack
# (docker-compose.yml) has no TLS and stores uploads in a local volume.
COMPOSE_FILE=${COMPOSE_FILE:-"docker-compose.prod.yml"}
# Set by CI to a ghcr.io sha tag so the release deploys the exact image that
# passed the pipeline instead of rebuilding from source on the server.
export SHIPNEX_IMAGE=${SHIPNEX_IMAGE:-""}

echo "=========================================="
echo "  ShipNex Production Deployment"
echo "=========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# Check if Docker Compose is installed
if ! docker compose version &> /dev/null; then
    echo "Docker Compose is not installed. Installing..."
    apt-get update && apt-get install -y docker-compose-plugin
fi

# Create necessary directories
mkdir -p logs
mkdir -p uploads
mkdir -p ssl

# Generate SSL certificates with Let's Encrypt (if certbot is available)
if command -v certbot &> /dev/null; then
    echo "Generating SSL certificates with Let's Encrypt..."
    certbot certonly --standalone -d $DOMAIN --email $EMAIL --agree-tos --non-interactive
    
    # Copy certificates for Nginx
    cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/cert.pem
    cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ssl/key.pem
    # Issuer chain for `ssl_stapling_verify` in nginx.prod.conf.
    cp /etc/letsencrypt/live/$DOMAIN/chain.pem ssl/chain.pem
else
    echo "Certbot not found. Generating self-signed SSL certificates..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/key.pem \
        -out ssl/cert.pem \
        -subj "/CN=$DOMAIN"
    # Self-signed: the certificate is its own chain, so stapling is not applicable.
    cp ssl/cert.pem ssl/chain.pem
fi

chmod 644 ssl/cert.pem ssl/chain.pem
chmod 600 ssl/key.pem

# Verify the certificates exist - nginx exits immediately on a missing/broken cert,
# which is far easier to diagnose here than from a container that keeps restarting.
if [ ! -s ssl/cert.pem ] || [ ! -s ssl/key.pem ]; then
    echo "✗ SSL certificate or key missing in ./ssl - nginx cannot start."
    exit 1
fi

# No nginx.conf patching is needed here: the production stack already mounts
# nginx.prod.conf, which has TLS, the security headers and the upload limit
# configured in the repository. (The dev nginx.conf keeps its HTTPS block
# commented out for local work.) We only verify the certificates are present,
# because nginx refuses to start without them.

# Set proper environment variables
export DB_PASSWORD=${DB_PASSWORD:-$(openssl rand -base64 32)}
export JWT_SECRET=${JWT_SECRET:-$(openssl rand -base64 64)}

echo ""
echo "Environment variables:"
echo "  DB_PASSWORD: ${DB_PASSWORD:0:8}..."
echo "  JWT_SECRET: ${JWT_SECRET:0:8}..."
echo ""

# Build and start containers
echo "Building and starting containers..."
# A CI release sets SHIPNEX_IMAGE, so pull the exact image that passed the
# pipeline; a manual deploy builds it from the checked-out source.
if [ -n "$SHIPNEX_IMAGE" ]; then
    echo "Pulling release image: $SHIPNEX_IMAGE"
    docker compose -f "$COMPOSE_FILE" pull backend
else
    docker compose -f "$COMPOSE_FILE" build backend
fi
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

# Wait for services to become healthy rather than sleeping a fixed 10s, which
# races with the API's first-boot schema creation.
echo "Waiting for services to start..."
for i in $(seq 1 60); do
    backend_health=$(docker inspect -f '{{.State.Health.Status}}' shipnex-backend 2>/dev/null || echo "starting")
    if [ "$backend_health" = "healthy" ]; then
        echo "Backend container reports healthy after ${i}0s"
        break
    fi
    if [ "$i" = "60" ]; then
        echo "✗ Backend did not become healthy in time"
        docker compose -f "$COMPOSE_FILE" logs backend | tail -50
        exit 1
    fi
    sleep 10
done

# Check backend health
# The production stack does NOT publish the API port (it is `expose`d to the
# compose network only, for security), so the probe must go through the nginx
# entrypoint exactly as a browser or customer would.
echo "Checking backend health..."
if curl -fsS -o /dev/null "https://$DOMAIN/health/ready"; then
    echo "✓ Backend is healthy (readiness probe passed via https://$DOMAIN)"
else
    echo "✗ Backend health check failed"
    docker compose -f "$COMPOSE_FILE" logs backend | tail -50
    exit 1
fi

# Check frontend
echo "Checking frontend..."
if curl -fsS -o /dev/null "https://$DOMAIN/"; then
    echo "✓ Frontend is accessible"
else
    echo "✗ Frontend check failed"
    docker compose -f "$COMPOSE_FILE" logs nginx | tail -50
    exit 1
fi

echo ""
echo "=========================================="
echo "  Deployment Complete!"
echo "=========================================="
echo ""
echo "Your ShipNex instance is now running at:"
echo "  https://$DOMAIN"
echo ""
echo "To view logs: docker compose -f $COMPOSE_FILE logs -f"
echo "To stop: docker compose -f $COMPOSE_FILE down"
echo ""
