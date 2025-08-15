-- AI Persona Chatbot Database Schema for Supabase
-- Run this SQL in Supabase SQL Editor after creating your project

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    refresh_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) DEFAULT 'New Conversation',
    persona VARCHAR(20) CHECK (persona IN ('hitesh', 'piyush')) NOT NULL DEFAULT 'hitesh',
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{
        "messageCount": 0,
        "lastPersona": "hitesh",
        "tags": []
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
    content TEXT NOT NULL,
    persona VARCHAR(20) CHECK (persona IN ('hitesh', 'piyush')),
    metadata JSONB DEFAULT '{
        "tokensUsed": 0,
        "responseTime": 0,
        "model": "gpt-4o"
    }'::jsonb,
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_persona ON conversations(persona);
CREATE INDEX IF NOT EXISTS idx_conversations_is_active ON conversations(is_active);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);
CREATE INDEX IF NOT EXISTS idx_messages_persona ON messages(persona);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional - for testing)
-- You can remove this section if you don't want sample data

-- Sample user (password is 'password123' hashed with bcrypt)
INSERT INTO users (username, email, password_hash) VALUES 
('testuser', 'test@example.com', '$2b$10$rQZ9QmSTx/0HkJmMfJQOHOhD7CG6YgZfkKCjzLTJjlLQqYjGQJYWG')
ON CONFLICT (email) DO NOTHING;

-- Sample conversation
INSERT INTO conversations (user_id, title, persona) 
SELECT id, 'Welcome to AI Personas', 'hitesh' 
FROM users WHERE email = 'test@example.com' LIMIT 1
ON CONFLICT DO NOTHING;

-- Sample messages
WITH conv AS (
    SELECT c.id as conv_id FROM conversations c 
    JOIN users u ON c.user_id = u.id 
    WHERE u.email = 'test@example.com' LIMIT 1
)
INSERT INTO messages (conversation_id, role, content, persona) 
SELECT conv_id, 'user', 'Hello! What can you help me with?', null FROM conv
UNION ALL
SELECT conv_id, 'assistant', 'Namaste! Main Hitesh Choudhary hun. Aapko programming mein kaise help kar sakta hun? Chai ready hai? ☕', 'hitesh' FROM conv
ON CONFLICT DO NOTHING;

-- Display table information
SELECT 
    'Database schema created successfully!' as status,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM conversations) as total_conversations,
    (SELECT COUNT(*) FROM messages) as total_messages;