-- Initialize PostgreSQL extensions and schemas
-- This runs on first database creation

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search

-- Create schemas for organization
CREATE SCHEMA IF NOT EXISTS content;    -- Static 5e content
CREATE SCHEMA IF NOT EXISTS analytics;  -- Event tracking

-- Grant permissions
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA content TO postgres;
GRANT ALL ON SCHEMA analytics TO postgres;

-- Create read-only user for analytics (optional)
-- CREATE USER analytics_reader WITH PASSWORD 'analytics_password';
-- GRANT USAGE ON SCHEMA analytics TO analytics_reader;
-- GRANT SELECT ON ALL TABLES IN SCHEMA analytics TO analytics_reader;

-- Log initialization
DO $$
BEGIN
  RAISE NOTICE 'Database initialized successfully';
END $$;
