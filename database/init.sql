-- Database initialization script for AI Persona Chatbot
-- This script runs when PostgreSQL container starts for the first time

-- Create database if it doesn't exist (handled by POSTGRES_DB env var)
-- CREATE DATABASE IF NOT EXISTS persona_chatbot;

-- Connect to the database
\c persona_chatbot;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for performance
-- Note: Tables will be created by Sequelize, but we can add additional indexes here

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Grant permissions to the user
GRANT ALL PRIVILEGES ON DATABASE persona_chatbot TO persona_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO persona_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO persona_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO persona_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO persona_user;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Database initialization completed successfully!';
END $$;