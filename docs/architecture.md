# System Architecture Document
## Multi-Tenant SaaS Platform

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   Browser    │  │   Browser    │  │   Browser    │                  │
│  │  (Tenant A)  │  │  (Tenant B)  │  │ (Super Admin)│                  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                  │
└─────────┼─────────────────┼─────────────────┼───────────────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Port 3000)                            │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                    React Application (Vite)                     │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │    │
│  │  │  Auth Pages │  │  Dashboard  │  │  Projects/Tasks/Users   │ │    │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘ │    │
│  └────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP/REST
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND API (Port 5000)                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                    Node.js / Express.js                         │    │
│  │  ┌──────────────────────────────────────────────────────────┐  │    │
│  │  │                     MIDDLEWARE                            │  │    │
│  │  │  ┌─────────┐  ┌─────────────┐  ┌───────────────────────┐ │  │    │
│  │  │  │  CORS   │  │    Auth     │  │  Tenant Isolation     │ │  │    │
│  │  │  └─────────┘  └─────────────┘  └───────────────────────┘ │  │    │
│  │  └──────────────────────────────────────────────────────────┘  │    │
│  │  ┌──────────────────────────────────────────────────────────┐  │    │
│  │  │                      ROUTES                               │  │    │
│  │  │  /api/auth  /api/tenants  /api/users  /api/projects      │  │    │
│  │  │  /api/tasks  /api/health                                  │  │    │
│  │  └──────────────────────────────────────────────────────────┘  │    │
│  │  ┌──────────────────────────────────────────────────────────┐  │    │
│  │  │                   CONTROLLERS                             │  │    │
│  │  │  AuthController  TenantController  UserController        │  │    │
│  │  │  ProjectController  TaskController                        │  │    │
│  │  └──────────────────────────────────────────────────────────┘  │    │
│  │  ┌──────────────────────────────────────────────────────────┐  │    │
│  │  │                     MODELS                                │  │    │
│  │  │  Tenant  User  Project  Task  AuditLog                   │  │    │
│  │  └──────────────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ TCP/5432
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        DATABASE (Port 5432)                             │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                      PostgreSQL 15                              │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │    │
│  │  │ tenants  │ │  users   │ │ projects │ │  tasks   │          │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │    │
│  │  ┌──────────────────────────────────────────────────┐          │    │
│  │  │                  audit_logs                       │          │    │
│  │  └──────────────────────────────────────────────────┘          │    │
│  └────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Architecture Diagram

![System Architecture](images/system-architecture.png)

---

## 2. Database Schema

### 2.1 Entity Relationship Diagram

```
┌──────────────────────┐
│       tenants        │
├──────────────────────┤
│ PK  id               │
│     name             │
│     subdomain (UQ)   │
│     status           │
│     subscription_plan│
│     max_users        │
│     max_projects     │
│     created_at       │
│     updated_at       │
└──────────┬───────────┘
           │
           │ 1:N
           ▼
┌──────────────────────┐       ┌──────────────────────┐
│        users         │       │      audit_logs      │
├──────────────────────┤       ├──────────────────────┤
│ PK  id               │       │ PK  id               │
│ FK  tenant_id ───────┼───────┤ FK  tenant_id        │
│     email            │       │ FK  user_id ─────────┤
│     password_hash    │       │     action           │
│     full_name        │       │     entity_type      │
│     role             │       │     entity_id        │
│     is_active        │       │     ip_address       │
│     created_at       │       │     created_at       │
│     updated_at       │       └──────────────────────┘
└──────────┬───────────┘
           │
           │ 1:N (created_by)
           ▼
┌──────────────────────┐
│       projects       │
├──────────────────────┤
│ PK  id               │
│ FK  tenant_id ───────┼───── (from tenants)
│     name             │
│     description      │
│     status           │
│ FK  created_by ──────┼───── (from users)
│     created_at       │
│     updated_at       │
└──────────┬───────────┘
           │
           │ 1:N
           ▼
┌──────────────────────┐
│        tasks         │
├──────────────────────┤
│ PK  id               │
│ FK  project_id ──────┼───── (from projects)
│ FK  tenant_id ───────┼───── (from tenants)
│     title            │
│     description      │
│     status           │
│     priority         │
│ FK  assigned_to ─────┼───── (from users, nullable)
│     due_date         │
│     created_at       │
│     updated_at       │
└──────────────────────┘
```

### 2.2 Table Specifications

#### tenants
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | VARCHAR(255) | NOT NULL | Organization name |
| subdomain | VARCHAR(100) | UNIQUE, NOT NULL | Tenant subdomain |
| status | ENUM | DEFAULT 'active' | active, suspended, trial |
| subscription_plan | ENUM | DEFAULT 'free' | free, pro, enterprise |
| max_users | INTEGER | DEFAULT 5 | User limit |
| max_projects | INTEGER | DEFAULT 3 | Project limit |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update time |

#### users
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| tenant_id | UUID | FK → tenants(id), NULL for super_admin | Tenant reference |
| email | VARCHAR(255) | NOT NULL | User email |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hash |
| full_name | VARCHAR(255) | NOT NULL | Display name |
| role | ENUM | NOT NULL | super_admin, tenant_admin, user |
| is_active | BOOLEAN | DEFAULT true | Account status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update time |

**Constraints**: UNIQUE(tenant_id, email)

#### projects
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| tenant_id | UUID | FK → tenants(id) ON DELETE CASCADE | Tenant reference |
| name | VARCHAR(255) | NOT NULL | Project name |
| description | TEXT | NULL | Project description |
| status | ENUM | DEFAULT 'active' | active, archived, completed |
| created_by | UUID | FK → users(id) | Creator reference |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update time |

#### tasks
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| project_id | UUID | FK → projects(id) ON DELETE CASCADE | Project reference |
| tenant_id | UUID | FK → tenants(id) ON DELETE CASCADE | Tenant reference |
| title | VARCHAR(255) | NOT NULL | Task title |
| description | TEXT | NULL | Task description |
| status | ENUM | DEFAULT 'todo' | todo, in_progress, completed |
| priority | ENUM | DEFAULT 'medium' | low, medium, high |
| assigned_to | UUID | FK → users(id) SET NULL | Assignee reference |
| due_date | DATE | NULL | Due date |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update time |

#### audit_logs
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| tenant_id | UUID | FK → tenants(id) | Tenant reference |
| user_id | UUID | FK → users(id) NULL | Actor reference |
| action | VARCHAR(100) | NOT NULL | Action type |
| entity_type | VARCHAR(50) | NULL | Entity type |
| entity_id | VARCHAR(255) | NULL | Entity ID |
| ip_address | VARCHAR(45) | NULL | Client IP |
| created_at | TIMESTAMP | DEFAULT NOW() | Action time |

![Database ERD](images/database-erd.png)

---

## 3. API Architecture

### 3.1 API Endpoints Summary

| # | Module | Method | Endpoint | Auth | Role | Description |
|---|--------|--------|----------|------|------|-------------|
| 1 | Auth | POST | /api/auth/register-tenant | None | - | Register new tenant |
| 2 | Auth | POST | /api/auth/login | None | - | User login |
| 3 | Auth | GET | /api/auth/me | Required | Any | Get current user |
| 4 | Auth | POST | /api/auth/logout | Required | Any | Logout |
| 5 | Tenant | GET | /api/tenants | Required | Super Admin | List all tenants |
| 6 | Tenant | GET | /api/tenants/:id | Required | Tenant Member/Super Admin | Get tenant details |
| 7 | Tenant | PUT | /api/tenants/:id | Required | Tenant Admin/Super Admin | Update tenant |
| 8 | User | POST | /api/tenants/:id/users | Required | Tenant Admin | Add user |
| 9 | User | GET | /api/tenants/:id/users | Required | Tenant Member | List users |
| 10 | User | PUT | /api/users/:id | Required | Admin/Self | Update user |
| 11 | User | DELETE | /api/users/:id | Required | Tenant Admin | Delete user |
| 12 | Project | POST | /api/projects | Required | Any | Create project |
| 13 | Project | GET | /api/projects | Required | Any | List projects |
| 14 | Project | PUT | /api/projects/:id | Required | Admin/Creator | Update project |
| 15 | Project | DELETE | /api/projects/:id | Required | Admin/Creator | Delete project |
| 16 | Task | POST | /api/projects/:id/tasks | Required | Any | Create task |
| 17 | Task | GET | /api/projects/:id/tasks | Required | Any | List tasks |
| 18 | Task | PATCH | /api/tasks/:id/status | Required | Any | Update status |
| 19 | Task | PUT | /api/tasks/:id | Required | Any | Update task |
| 20 | Health | GET | /api/health | None | - | Health check |

### 3.2 Authentication Flow

```
┌────────────┐        ┌──────────────┐        ┌──────────────┐
│   Client   │        │   Backend    │        │   Database   │
└─────┬──────┘        └──────┬───────┘        └──────┬───────┘
      │                      │                       │
      │  POST /api/auth/login│                       │
      │  {email, password,   │                       │
      │   tenantSubdomain}   │                       │
      │─────────────────────>│                       │
      │                      │                       │
      │                      │  Find tenant by       │
      │                      │  subdomain            │
      │                      │──────────────────────>│
      │                      │<──────────────────────│
      │                      │                       │
      │                      │  Find user by email   │
      │                      │  and tenant_id        │
      │                      │──────────────────────>│
      │                      │<──────────────────────│
      │                      │                       │
      │                      │  Verify password      │
      │                      │  (bcrypt.compare)     │
      │                      │                       │
      │                      │  Generate JWT         │
      │                      │  {userId, tenantId,   │
      │                      │   role}               │
      │                      │                       │
      │  {token, user, exp}  │                       │
      │<─────────────────────│                       │
      │                      │                       │
      │  GET /api/projects   │                       │
      │  Authorization:      │                       │
      │  Bearer <token>      │                       │
      │─────────────────────>│                       │
      │                      │                       │
      │                      │  Verify JWT           │
      │                      │  Extract tenantId     │
      │                      │                       │
      │                      │  SELECT * FROM        │
      │                      │  projects WHERE       │
      │                      │  tenant_id = ?        │
      │                      │──────────────────────>│
      │                      │<──────────────────────│
      │                      │                       │
      │  {projects: [...]}   │                       │
      │<─────────────────────│                       │
```

### 3.3 Tenant Isolation Flow

```
                    ┌─────────────────────────────────────┐
                    │          Incoming Request           │
                    │  GET /api/projects                  │
                    │  Authorization: Bearer <token>      │
                    └─────────────────┬───────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │        Auth Middleware              │
                    │  1. Extract JWT from header         │
                    │  2. Verify signature & expiry       │
                    │  3. Decode payload                  │
                    │  4. Attach to req.user:             │
                    │     {userId, tenantId, role}        │
                    └─────────────────┬───────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │     Tenant Isolation Middleware     │
                    │  If role !== 'super_admin':         │
                    │    - All queries filter by          │
                    │      tenant_id from JWT             │
                    │    - Requests for other tenants     │
                    │      return 403 Forbidden           │
                    └─────────────────┬───────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │          Controller                 │
                    │  Query: SELECT * FROM projects      │
                    │         WHERE tenant_id = ?         │
                    │         (tenant_id from req.user)   │
                    └─────────────────────────────────────┘
```

---

## 4. Docker Architecture

### 4.1 Container Orchestration

```yaml
services:
  database:       # PostgreSQL 15
    ports: 5432:5432
    volumes: db_data
    healthcheck: pg_isready

  backend:        # Node.js/Express
    ports: 5000:5000
    depends_on: database (healthy)
    environment: DB_*, JWT_*, FRONTEND_URL

  frontend:       # React/Vite (nginx)
    ports: 3000:3000
    depends_on: backend (healthy)
```

### 4.2 Network Communication

- Frontend → Backend: `http://backend:5000/api`
- Backend → Database: `postgresql://database:5432/saas_db`
- External access: `localhost:3000` (frontend), `localhost:5000` (API)
