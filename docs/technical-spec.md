# Technical Specification Document
## Multi-Tenant SaaS Platform

---

## 1. Project Structure

### 1.1 Complete Directory Structure

```
Multi_SAAS/
├── docker-compose.yml          # Docker orchestration
├── README.md                   # Project documentation
├── submission.json             # Test credentials
│
├── docs/                       # Documentation
│   ├── research.md
│   ├── PRD.md
│   ├── architecture.md
│   ├── technical-spec.md
│   ├── API.md
│   └── images/
│       ├── system-architecture.png
│       └── database-erd.png
│
├── backend/                    # Backend API
│   ├── Dockerfile
│   ├── package.json
│   ├── .env.example
│   ├── src/
│   │   ├── index.js           # Entry point
│   │   ├── app.js             # Express setup
│   │   ├── config/
│   │   │   ├── database.js    # DB connection pool
│   │   │   └── jwt.js         # JWT configuration
│   │   ├── middleware/
│   │   │   ├── auth.js        # JWT verification
│   │   │   ├── authorize.js   # Role-based access
│   │   │   └── errorHandler.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── tenantController.js
│   │   │   ├── userController.js
│   │   │   ├── projectController.js
│   │   │   └── taskController.js
│   │   ├── models/
│   │   │   ├── tenantModel.js
│   │   │   ├── userModel.js
│   │   │   ├── projectModel.js
│   │   │   ├── taskModel.js
│   │   │   └── auditModel.js
│   │   ├── routes/
│   │   │   ├── index.js       # Route aggregator
│   │   │   ├── authRoutes.js
│   │   │   ├── tenantRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── projectRoutes.js
│   │   │   └── taskRoutes.js
│   │   └── utils/
│   │       ├── responseHelper.js
│   │       ├── auditLogger.js
│   │       └── validators.js
│   ├── migrations/
│   │   ├── 001_create_tenants.sql
│   │   ├── 002_create_users.sql
│   │   ├── 003_create_projects.sql
│   │   ├── 004_create_tasks.sql
│   │   └── 005_create_audit_logs.sql
│   ├── seeds/
│   │   └── seed_data.sql
│   └── scripts/
│       └── init-db.sh         # Startup script
│
└── frontend/                   # Frontend App
    ├── Dockerfile
    ├── nginx.conf             # Production server
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx           # Entry point
        ├── App.jsx            # Root component
        ├── App.css            # Global styles
        ├── api/
        │   └── index.js       # API client
        ├── context/
        │   └── AuthContext.jsx
        ├── components/
        │   ├── Layout/
        │   │   ├── Navbar.jsx
        │   │   └── Sidebar.jsx
        │   ├── ProtectedRoute.jsx
        │   ├── LoadingSpinner.jsx
        │   └── common/
        │       ├── Button.jsx
        │       ├── Modal.jsx
        │       ├── Card.jsx
        │       └── Table.jsx
        ├── pages/
        │   ├── Register.jsx
        │   ├── Login.jsx
        │   ├── Dashboard.jsx
        │   ├── Projects.jsx
        │   ├── ProjectDetails.jsx
        │   └── Users.jsx
        └── utils/
            └── helpers.js
```

### 1.2 Folder Purposes

| Folder | Purpose |
|--------|---------|
| `backend/src/config` | Database and JWT configuration files |
| `backend/src/middleware` | Express middleware (auth, error handling) |
| `backend/src/controllers` | Request handlers, business logic |
| `backend/src/models` | Database query functions |
| `backend/src/routes` | API route definitions |
| `backend/src/utils` | Helper functions, validators |
| `backend/migrations` | SQL migration files |
| `backend/seeds` | Initial data scripts |
| `frontend/src/api` | Axios API client configuration |
| `frontend/src/context` | React Context providers |
| `frontend/src/components` | Reusable UI components |
| `frontend/src/pages` | Page-level components |

---

## 2. Development Setup Guide

### 2.1 Prerequisites

| Requirement | Minimum Version | Recommended |
|-------------|----------------|-------------|
| Node.js | 18.x | 20.x LTS |
| npm | 9.x | 10.x |
| Docker | 24.x | Latest |
| Docker Compose | 2.x | Latest |
| PostgreSQL | 15.x | 15.x (via Docker) |
| Git | 2.x | Latest |

### 2.2 Quick Start (Docker - Recommended)

```bash
# 1. Clone repository
git clone <repository-url>
cd Multi_SAAS

# 2. Start all services
docker-compose up -d

# 3. Wait for services to be healthy (about 30 seconds)
docker-compose ps

# 4. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# Health check: http://localhost:5000/api/health
```

### 2.3 Local Development Setup

#### Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your local PostgreSQL settings

# Start PostgreSQL (if not using Docker)
# Ensure PostgreSQL is running on port 5432

# Run migrations
npm run migrate

# Seed database
npm run seed

# Start development server
npm run dev
# Server runs on http://localhost:5000
```

#### Frontend Setup

```bash
# Navigate to frontend (in new terminal)
cd frontend

# Install dependencies
npm install

# Create environment file
echo "VITE_API_URL=http://localhost:5000/api" > .env

# Start development server
npm run dev
# App runs on http://localhost:3000
```

### 2.4 Environment Variables

#### Backend (.env)

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=saas_db
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=your-super-secret-key-minimum-32-characters
JWT_EXPIRES_IN=24h

# Server
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 3. Database Setup

### 3.1 Running Migrations

```bash
# From backend directory
npm run migrate

# Or manually with psql
psql -U postgres -d saas_db -f migrations/001_create_tenants.sql
psql -U postgres -d saas_db -f migrations/002_create_users.sql
psql -U postgres -d saas_db -f migrations/003_create_projects.sql
psql -U postgres -d saas_db -f migrations/004_create_tasks.sql
psql -U postgres -d saas_db -f migrations/005_create_audit_logs.sql
```

### 3.2 Seeding Data

```bash
# From backend directory
npm run seed

# Or manually
psql -U postgres -d saas_db -f seeds/seed_data.sql
```

### 3.3 Docker Auto-Initialization

When using Docker, migrations and seeds run automatically on container startup via the `init-db.sh` entrypoint script.

---

## 4. Running Tests

### 4.1 Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- --grep "auth"
```

### 4.2 API Testing with curl

```bash
# Health check
curl http://localhost:5000/api/health

# Register tenant
curl -X POST http://localhost:5000/api/auth/register-tenant \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName": "Test Company",
    "subdomain": "testco",
    "adminEmail": "admin@testco.com",
    "adminPassword": "TestPass@123",
    "adminFullName": "Test Admin"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@demo.com",
    "password": "Demo@123",
    "tenantSubdomain": "demo"
  }'

# Authenticated request (replace TOKEN with actual JWT)
curl http://localhost:5000/api/projects \
  -H "Authorization: Bearer TOKEN"
```

---

## 5. Docker Configuration

### 5.1 Building Images

```bash
# Build all images
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend
```

### 5.2 Container Management

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend

# Stop all services
docker-compose down

# Stop and remove volumes (reset database)
docker-compose down -v

# Restart a service
docker-compose restart backend
```

### 5.3 Accessing Containers

```bash
# Backend shell
docker exec -it backend sh

# Database shell
docker exec -it database psql -U postgres -d saas_db

# View database tables
docker exec -it database psql -U postgres -d saas_db -c "\dt"
```

---

## 6. Code Conventions

### 6.1 Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | camelCase | `authController.js` |
| React Components | PascalCase | `ProjectDetails.jsx` |
| CSS Classes | kebab-case | `.project-card` |
| Database Tables | snake_case | `audit_logs` |
| Environment Variables | UPPER_SNAKE | `DB_HOST` |
| API Endpoints | kebab-case | `/api/projects/:projectId/tasks` |

### 6.2 Response Format

All API responses follow this structure:

```javascript
// Success
{
  "success": true,
  "message": "Optional success message",
  "data": { ... }
}

// Error
{
  "success": false,
  "message": "Error description"
}

// Paginated
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "total": 47,
      "limit": 10
    }
  }
}
```

### 6.3 HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success (GET, PUT, PATCH, DELETE) |
| 201 | Created (POST) |
| 400 | Bad Request (validation errors) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 500 | Internal Server Error |

---

## 7. Security Implementation

### 7.1 Authentication Flow

1. User sends credentials to `/api/auth/login`
2. Server validates tenant, user, and password
3. Server generates JWT with `{ userId, tenantId, role }`
4. Client stores token and includes in subsequent requests
5. Auth middleware validates token on protected routes

### 7.2 Authorization Middleware

```javascript
// Example usage in routes
router.get('/tenants', authenticate, authorize('super_admin'), listTenants);
router.post('/users', authenticate, authorize('tenant_admin'), createUser);
router.get('/projects', authenticate, listProjects); // any authenticated user
```

### 7.3 Tenant Isolation

- All queries filter by `tenant_id` from JWT
- Super admin bypasses tenant filter
- Cross-tenant access returns 403

---

## 8. Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Port already in use | Stop other services using 3000, 5000, or 5432 |
| Database connection failed | Ensure PostgreSQL is running and credentials are correct |
| CORS errors | Check `FRONTEND_URL` in backend `.env` |
| JWT invalid | Token may be expired; login again |
| Container won't start | Check logs: `docker-compose logs <service>` |

### Useful Commands

```bash
# Check service status
docker-compose ps

# View container logs
docker-compose logs -f backend

# Reset everything
docker-compose down -v && docker-compose up -d

# Verify database
docker exec -it database psql -U postgres -d saas_db -c "SELECT * FROM tenants;"
```
