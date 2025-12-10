#!/bin/bash

# Subdomain Deployment Script for Mitsuki JPY Quiz System
# This script helps you deploy the quiz system with subdomain support

set -e

echo "=================================="
echo "Mitsuki JPY Quiz - Subdomain Setup"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run this script as root"
    exit 1
fi

# Step 1: Build the application
echo ""
echo "Step 1: Building application..."
cd "/home/lainlain/Desktop/Go Lang /quiz"

if [ ! -d "bin" ]; then
    mkdir bin
fi

go build -o bin/quiz-server cmd/server/main.go
if [ $? -eq 0 ]; then
    print_success "Application built successfully"
else
    print_error "Build failed"
    exit 1
fi

# Step 2: Test the binary
echo ""
echo "Step 2: Testing binary..."
if [ -f "bin/quiz-server" ]; then
    chmod +x bin/quiz-server
    print_success "Binary is ready"
else
    print_error "Binary not found"
    exit 1
fi

# Step 3: Install Nginx (if not installed)
echo ""
echo "Step 3: Checking Nginx installation..."
if ! command -v nginx &> /dev/null; then
    print_info "Nginx not found. Installing..."
    sudo apt update
    sudo apt install -y nginx
    print_success "Nginx installed"
else
    print_success "Nginx is already installed"
fi

# Step 4: Copy Nginx configuration
echo ""
echo "Step 4: Configuring Nginx..."
NGINX_CONFIG="/etc/nginx/sites-available/mitsukijp.com"

if [ -f "$NGINX_CONFIG" ]; then
    print_info "Nginx config already exists. Creating backup..."
    sudo cp "$NGINX_CONFIG" "${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
fi

sudo cp nginx-subdomain.conf "$NGINX_CONFIG"
print_success "Nginx configuration copied"

# Enable site
if [ ! -L "/etc/nginx/sites-enabled/mitsukijp.com" ]; then
    sudo ln -s "$NGINX_CONFIG" /etc/nginx/sites-enabled/
    print_success "Nginx site enabled"
fi

# Test Nginx configuration
echo ""
echo "Testing Nginx configuration..."
sudo nginx -t
if [ $? -eq 0 ]; then
    print_success "Nginx configuration is valid"
else
    print_error "Nginx configuration has errors"
    exit 1
fi

# Step 5: Install systemd service
echo ""
echo "Step 5: Installing systemd service..."
sudo cp mitsukijp-quiz.service /etc/systemd/system/
sudo systemctl daemon-reload
print_success "Systemd service installed"

# Step 6: Start services
echo ""
echo "Step 6: Starting services..."

# Start application
sudo systemctl start mitsukijp-quiz
sleep 2

if sudo systemctl is-active --quiet mitsukijp-quiz; then
    print_success "Quiz application is running"
else
    print_error "Failed to start quiz application"
    sudo journalctl -u mitsukijp-quiz -n 20 --no-pager
    exit 1
fi

# Enable auto-start
sudo systemctl enable mitsukijp-quiz
print_success "Quiz application will start on boot"

# Restart Nginx
sudo systemctl restart nginx
print_success "Nginx restarted"

# Step 7: Configure firewall
echo ""
echo "Step 7: Configuring firewall..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 80/tcp comment 'HTTP'
    sudo ufw allow 443/tcp comment 'HTTPS'
    print_success "Firewall configured"
else
    print_info "UFW not found, skipping firewall configuration"
fi

# Step 8: Display status
echo ""
echo "=================================="
echo "Deployment Summary"
echo "=================================="
echo ""

echo "Application Status:"
sudo systemctl status mitsukijp-quiz --no-pager | head -5

echo ""
echo "Nginx Status:"
sudo systemctl status nginx --no-pager | head -5

echo ""
echo "=================================="
echo "Next Steps:"
echo "=================================="
echo ""
print_info "1. Configure DNS records for:"
echo "   - admin.mitsukijp.com"
echo "   - quiz.mitsukijp.com"
echo "   - register.mitsukijp.com"
echo ""
print_info "2. Install SSL certificate (recommended):"
echo "   sudo apt install certbot python3-certbot-nginx"
echo "   sudo certbot --nginx -d admin.mitsukijp.com -d quiz.mitsukijp.com -d register.mitsukijp.com"
echo ""
print_info "3. Test your subdomains:"
echo "   http://admin.mitsukijp.com"
echo "   http://quiz.mitsukijp.com"
echo "   http://register.mitsukijp.com"
echo ""
print_info "4. View application logs:"
echo "   sudo journalctl -u mitsukijp-quiz -f"
echo ""
print_info "5. View Nginx logs:"
echo "   sudo tail -f /var/log/nginx/admin.mitsukijp.access.log"
echo "   sudo tail -f /var/log/nginx/quiz.mitsukijp.access.log"
echo "   sudo tail -f /var/log/nginx/register.mitsukijp.access.log"
echo ""
print_success "Deployment completed successfully!"
echo ""
