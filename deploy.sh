#!/bin/bash
# ShipNex Production Deployment Script
# This script deploys ShipNex with HTTPS support

set -e

# Configuration
DOMAIN=${DOMAIN:-"yourdomain.com"}
EMAIL=${EMAIL:-"admin@yourdomain.com"}
COMPOSE_FILE="docker-compose.yml"

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
else
    echo "Certbot not found. Generating self-signed SSL certificates..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/key.pem \
        -out ssl/cert.pem \
        -subj "/CN=$DOMAIN"
fi

# Update nginx.conf to enable HTTPS
echo "Configuring Nginx for HTTPS..."
sed -i 's/# return 301/return 301/' nginx.conf
sed -i 's/# listen 443/listen 443/' nginx.conf
sed -i 's/# ssl_certificate/ssl_certificate/' nginx.conf
sed -i 's/# ssl_certificate_key/ssl_certificate_key/' nginx.conf
sed -i 's/# ssl_protocols/ssl_protocols/' nginx.conf
sed -i 's/# ssl_ciphers/ssl_ciphers/' nginx.conf

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
docker compose -f $COMPOSE_FILE build --no-cache
docker compose -f $COMPOSE_FILE up -d

# Wait for services to be healthy
echo "Waiting for services to start..."
sleep 10

# Check backend health
echo "Checking backend health..."
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo "✓ Backend is healthy"
else
    echo "✗ Backend health check failed"
    docker compose -f $COMPOSE_FILE logs backend
    exit 1
fi

# Check frontend
echo "Checking frontend..."
if curl -f http://localhost > /dev/null 2>&1; then
    echo "✓ Frontend is accessible"
else
    echo "✗ Frontend check failed"
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
