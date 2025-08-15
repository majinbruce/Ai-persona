#!/bin/bash

echo "🗄️ Setting up PostgreSQL for AI Persona Chatbot"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Option 1: Install PostgreSQL locally${NC}"
echo "Run these commands in your terminal:"
echo ""
echo "# Update package list"
echo "sudo apt update"
echo ""
echo "# Install PostgreSQL"
echo "sudo apt install postgresql postgresql-contrib"
echo ""
echo "# Start PostgreSQL service"
echo "sudo service postgresql start"
echo ""
echo "# Switch to postgres user and create database"
echo "sudo -u postgres psql -c \"CREATE DATABASE persona_chatbot;\""
echo "sudo -u postgres psql -c \"CREATE USER persona_user WITH PASSWORD 'persona_password';\""
echo "sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE persona_chatbot TO persona_user;\""
echo ""

echo -e "${BLUE}Option 2: Use Docker (if available)${NC}"
echo "Run this command:"
echo ""
echo "docker run --name postgres-persona \\"
echo "  -e POSTGRES_DB=persona_chatbot \\"
echo "  -e POSTGRES_USER=persona_user \\"
echo "  -e POSTGRES_PASSWORD=persona_password \\"
echo "  -p 5432:5432 \\"
echo "  -d postgres:15"
echo ""

echo -e "${BLUE}Option 3: Use SQLite for development (simplest)${NC}"
echo "This script will set up SQLite instead of PostgreSQL"
echo ""
echo -e "${YELLOW}Setting up SQLite configuration...${NC}"

# Navigate to server directory
cd "$(dirname "$0")/server"

# Install sqlite3 for Node.js
echo "Installing SQLite dependencies..."
npm install sqlite3 sequelize

# Create SQLite configuration
cat > config/database-sqlite.js << 'EOF'
const { Sequelize } = require('sequelize');
const path = require('path');
const logger = require('../utils/logger');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'database.sqlite'),
  logging: (msg) => logger.debug(msg),
  define: {
    timestamps: true,
    underscored: true,
    paranoid: true, // Soft delete
  }
});

const connectDatabase = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ SQLite connection established successfully');
    
    // Sync models
    await sequelize.sync({ alter: true });
    logger.info('🔄 Database models synchronized');
  } catch (error) {
    logger.error('❌ Unable to connect to SQLite database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDatabase };
EOF

# Create .env file with SQLite settings
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << 'EOF'
# Server Configuration
PORT=5000
NODE_ENV=development

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Database Configuration (SQLite)
DB_TYPE=sqlite

# JWT Configuration
JWT_SECRET=super_secret_jwt_key_for_development_only_change_in_production
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=super_secret_refresh_jwt_key_for_development_only_change_in_production
JWT_REFRESH_EXPIRE=7d

# Logging Configuration
LOG_LEVEL=info

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
EOF
    echo -e "${GREEN}✅ Created .env file with SQLite configuration${NC}"
else
    echo -e "${YELLOW}⚠️ .env file already exists. Please update it manually.${NC}"
fi

echo ""
echo -e "${GREEN}🎉 SQLite setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update your OpenAI API key in server/.env"
echo "2. Run: cd server && npm run dev"
echo ""
echo "The database will be created automatically as 'database.sqlite' in the server directory."