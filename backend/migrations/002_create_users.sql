-- Migration: 002_create_users.sql
-- Creates the users table with tenant association

-- UP Migration
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'tenant_admin', 'user')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Email unique per tenant (super_admin has NULL tenant_id, so global unique for them)
    CONSTRAINT unique_email_per_tenant UNIQUE (tenant_id, email)
);

-- Create index on tenant_id for fast tenant-scoped queries
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);

-- Create index on email for login lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create index on role for role-based filtering
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- DOWN Migration (for rollback)
-- DROP TABLE IF EXISTS users CASCADE;
