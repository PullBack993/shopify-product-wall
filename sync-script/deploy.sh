#!/bin/bash

# STOFFEYA Shopify Sync Service Deployment Script
# This script helps deploy and manage the sync service on Ugreen NAS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    log_success "Docker and Docker Compose are installed."
}

# Check if .env file exists
check_env() {
    if [ ! -f "$SCRIPT_DIR/.env" ]; then
        log_warning ".env file not found. Please create it from the template."
        if [ -f "$SCRIPT_DIR/env.template" ]; then
            log_info "Copying env.template to .env..."
            cp "$SCRIPT_DIR/env.template" "$SCRIPT_DIR/.env"
            log_warning "Please edit .env file with your Shopify credentials before deploying."
            exit 1
        else
            log_error "env.template not found. Please create .env file manually."
            exit 1
        fi
    fi
    
    # Check if required variables are set
    if ! grep -q "SHOPIFY_STORE_URL=" "$SCRIPT_DIR/.env" || ! grep -q "SHOPIFY_ACCESS_TOKEN=" "$SCRIPT_DIR/.env"; then
        log_error "Required environment variables are not set in .env file."
        log_info "Please set SHOPIFY_STORE_URL and SHOPIFY_ACCESS_TOKEN in .env file."
        exit 1
    fi
    
    log_success ".env file is configured."
}

# Create necessary directories
create_directories() {
    log_info "Creating necessary directories..."
    
    mkdir -p "$SCRIPT_DIR/data"
    mkdir -p "$SCRIPT_DIR/logs"
    mkdir -p "$SCRIPT_DIR/../public/data"
    mkdir -p "$SCRIPT_DIR/../public/products"
    
    log_success "Directories created."
}

# Build and start the service
deploy() {
    log_info "Building and starting STOFFEYA Shopify Sync Service..."
    
    cd "$SCRIPT_DIR"
    
    # Build the Docker image
    log_info "Building Docker image..."
    docker-compose build --no-cache
    
    # Start the service
    log_info "Starting the service..."
    docker-compose up -d
    
    log_success "Service deployed successfully!"
    
    # Show service status
    show_status
}

# Show service status
show_status() {
    log_info "Service Status:"
    docker-compose ps
    
    log_info "Service Logs (last 20 lines):"
    docker-compose logs --tail=20
}

# Stop the service
stop() {
    log_info "Stopping STOFFEYA Shopify Sync Service..."
    docker-compose down
    log_success "Service stopped."
}

# Restart the service
restart() {
    log_info "Restarting STOFFEYA Shopify Sync Service..."
    docker-compose restart
    log_success "Service restarted."
}

# Show logs
show_logs() {
    log_info "Showing service logs..."
    docker-compose logs -f
}

# Manual sync trigger
manual_sync() {
    log_info "Triggering manual sync..."
    docker-compose exec shopify-sync node sync-products.js
}

# Update service
update() {
    log_info "Updating STOFFEYA Shopify Sync Service..."
    
    # Pull latest changes (if using git)
    if [ -d "$SCRIPT_DIR/.git" ]; then
        log_info "Pulling latest changes..."
        git pull
    fi
    
    # Rebuild and restart
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    
    log_success "Service updated successfully!"
}

# Cleanup
cleanup() {
    log_info "Cleaning up..."
    docker-compose down --volumes --remove-orphans
    docker system prune -f
    log_success "Cleanup completed."
}

# Show help
show_help() {
    echo "STOFFEYA Shopify Sync Service Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  deploy      Build and deploy the service"
    echo "  start       Start the service"
    echo "  stop        Stop the service"
    echo "  restart     Restart the service"
    echo "  status      Show service status"
    echo "  logs        Show service logs"
    echo "  sync        Trigger manual sync"
    echo "  update      Update and redeploy the service"
    echo "  cleanup     Stop service and cleanup resources"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy       # First time deployment"
    echo "  $0 status       # Check service status"
    echo "  $0 logs         # View live logs"
    echo "  $0 sync         # Run manual sync"
}

# Main script
main() {
    case "${1:-}" in
        deploy)
            check_docker
            check_env
            create_directories
            deploy
            ;;
        start)
            check_docker
            docker-compose up -d
            log_success "Service started."
            ;;
        stop)
            stop
            ;;
        restart)
            restart
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs
            ;;
        sync)
            manual_sync
            ;;
        update)
            update
            ;;
        cleanup)
            cleanup
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "Invalid command: ${1:-}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@" 