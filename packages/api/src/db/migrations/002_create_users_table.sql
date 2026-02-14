-- Migration: Create users table for authentication
-- Created: 2026-02-14

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'driver', 'operator', 'customer')),
  name TEXT NOT NULL,
  phone TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);

-- Insert default admin user (password: Admin123!)
-- This should be changed immediately after first login
INSERT INTO users (id, email, password_hash, role, name, active, created_at)
VALUES (
  'usr_admin_1',
  'admin@gaztime.app',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYfQdJ7nC3m', -- Admin123!
  'admin',
  'System Administrator',
  true,
  NOW()
) ON CONFLICT (email) DO NOTHING;
