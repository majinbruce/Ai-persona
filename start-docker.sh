#!/bin/bash

# AI Persona Chatbot - Docker Startup Script
echo "🚀 Starting AI Persona Chatbot with Docker"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️ .env file not found. Creating from template...${NC}"
    cp .env.docker .env
    echo -e "${GREEN}✅ Created .env file. Please update it with your OpenAI API key.${NC}"
    echo -e "${BLUE}Edit the .env file and add your OPENAI_API_KEY${NC}"
    read -p "Press enter when you've updated the .env file..."
fi

# Check if OpenAI API key is set
if grep -q "your_openai_api_key_here" .env; then
    echo -e "${RED}❌ Please update your OpenAI API key in the .env file${NC}"
    exit 1
fi

# Create logs directory
mkdir -p server/logs

# Start the containers
echo -e "${BLUE}🐳 Starting Docker containers...${NC}"
docker-compose up --build -d

# Wait for services to be healthy
echo -e "${BLUE}⏳ Waiting for services to start...${NC}"
sleep 10

# Check service status
echo -e "${BLUE}📊 Checking service status...${NC}"

# Check PostgreSQL
if docker-compose exec -T postgres pg_isready -U persona_user -d persona_chatbot > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
else
    echo -e "${RED}❌ PostgreSQL is not ready${NC}"
fi

# Check Backend
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running on http://localhost:5000${NC}"
else
    echo -e "${RED}❌ Backend is not ready${NC}"
fi

# Check Frontend
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is running on http://localhost:3000${NC}"
else
    echo -e "${RED}❌ Frontend is not ready${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo -e "${BLUE}Access your application:${NC}"
echo "• Frontend: http://localhost:3000"
echo "• Backend API: http://localhost:5000/api"
echo "• Health Check: http://localhost:5000/api/health"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "• View logs: docker-compose logs -f"
echo "• Stop services: docker-compose down"
echo "• Restart services: docker-compose restart"
echo "• View running containers: docker-compose ps"
echo ""
echo -e "${BLUE}Database access:${NC}"
echo "• Connect to PostgreSQL: docker-compose exec postgres psql -U persona_user -d persona_chatbot"
echo ""

# Show container status
echo -e "${BLUE}📋 Container Status:${NC}"
docker-compose ps