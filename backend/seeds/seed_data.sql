-- Seed Data for Multi-Tenant SaaS Application
-- This file contains initial data for testing and development

-- ============================================
-- 1. SUPER ADMIN (no tenant association)
-- ============================================
-- Password: Admin@123 (bcrypt hashed with 10 rounds)
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    NULL,
    'superadmin@system.com',
    '$2b$10$rQZQXEMZZJ1qVuvJGX.O0.5V5y5S5v5V5y5S5v5V5y5S5v5V5y5S5',
    'System Super Admin',
    'super_admin',
    true
) ON CONFLICT DO NOTHING;

-- ============================================
-- 2. DEMO TENANT (Pro Plan)
-- ============================================
INSERT INTO tenants (id, name, subdomain, status, subscription_plan, max_users, max_projects)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'Demo Company',
    'demo',
    'active',
    'pro',
    25,
    15
) ON CONFLICT DO NOTHING;

-- ============================================
-- 3. DEMO TENANT USERS
-- ============================================
-- Tenant Admin - Password: Demo@123
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
VALUES (
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'admin@demo.com',
    '$2b$10$rQZQXEMZZJ1qVuvJGX.O0.5V5y5S5v5V5y5S5v5V5y5S5v5V5y5S5',
    'Demo Admin',
    'tenant_admin',
    true
) ON CONFLICT DO NOTHING;

-- User 1 - Password: User@123
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
VALUES (
    'c0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000001',
    'user1@demo.com',
    '$2b$10$rQZQXEMZZJ1qVuvJGX.O0.5V5y5S5v5V5y5S5v5V5y5S5v5V5y5S5',
    'Demo User One',
    'user',
    true
) ON CONFLICT DO NOTHING;

-- User 2 - Password: User@123
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
VALUES (
    'c0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000001',
    'user2@demo.com',
    '$2b$10$rQZQXEMZZJ1qVuvJGX.O0.5V5y5S5v5V5y5S5v5V5y5S5v5V5y5S5',
    'Demo User Two',
    'user',
    true
) ON CONFLICT DO NOTHING;

-- ============================================
-- 4. DEMO PROJECTS
-- ============================================
INSERT INTO projects (id, tenant_id, name, description, status, created_by)
VALUES (
    'd0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Project Alpha',
    'First demo project for testing the multi-tenant SaaS platform',
    'active',
    'c0000000-0000-0000-0000-000000000001'
) ON CONFLICT DO NOTHING;

INSERT INTO projects (id, tenant_id, name, description, status, created_by)
VALUES (
    'd0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000001',
    'Project Beta',
    'Second demo project with multiple tasks',
    'active',
    'c0000000-0000-0000-0000-000000000001'
) ON CONFLICT DO NOTHING;

-- ============================================
-- 5. DEMO TASKS
-- ============================================
-- Project Alpha Tasks
INSERT INTO tasks (id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date)
VALUES (
    'e0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Design database schema',
    'Create the initial database schema for the project',
    'completed',
    'high',
    'c0000000-0000-0000-0000-000000000002',
    '2026-02-15'
) ON CONFLICT DO NOTHING;

INSERT INTO tasks (id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date)
VALUES (
    'e0000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Implement authentication',
    'Build JWT-based authentication system',
    'in_progress',
    'high',
    'c0000000-0000-0000-0000-000000000002',
    '2026-02-20'
) ON CONFLICT DO NOTHING;

INSERT INTO tasks (id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date)
VALUES (
    'e0000000-0000-0000-0000-000000000003',
    'd0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Write API documentation',
    'Document all API endpoints with examples',
    'todo',
    'medium',
    'c0000000-0000-0000-0000-000000000003',
    '2026-02-25'
) ON CONFLICT DO NOTHING;

-- Project Beta Tasks
INSERT INTO tasks (id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date)
VALUES (
    'e0000000-0000-0000-0000-000000000004',
    'd0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000001',
    'Setup frontend project',
    'Initialize React project with Vite',
    'completed',
    'high',
    'c0000000-0000-0000-0000-000000000003',
    '2026-02-10'
) ON CONFLICT DO NOTHING;

INSERT INTO tasks (id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date)
VALUES (
    'e0000000-0000-0000-0000-000000000005',
    'd0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000001',
    'Create dashboard layout',
    'Design and implement the main dashboard UI',
    'in_progress',
    'medium',
    'c0000000-0000-0000-0000-000000000002',
    '2026-02-28'
) ON CONFLICT DO NOTHING;

-- ============================================
-- 6. SAMPLE AUDIT LOGS
-- ============================================
INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, ip_address)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'CREATE_PROJECT',
    'project',
    'd0000000-0000-0000-0000-000000000001',
    '127.0.0.1'
) ON CONFLICT DO NOTHING;

INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, ip_address)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'CREATE_PROJECT',
    'project',
    'd0000000-0000-0000-0000-000000000002',
    '127.0.0.1'
) ON CONFLICT DO NOTHING;
