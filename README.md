# Multi-Tenant SaaS Platform

A production-ready multi-tenant SaaS application for project and task management with role-based access control and subscription plan enforcement.

## Features

- **Multi-Tenancy**: Shared database with tenant isolation via tenant_id
- **Authentication**: JWT-based authentication with 24-hour token expiry
- **Role-Based Access Control (RBAC)**: super_admin, tenant_admin, user roles
- **Subscription Plans**: free, pro, enterprise with resource limits
- **Project Management**: Create, update, archive projects
- **Task Management**: Full task lifecycle with status tracking
- **Audit Logging**: Track important actions for compliance

## Tech Stack

- **Backend**: Node.js 20 + Express.js 4
- **Frontend**: React 18 + Vite 5
- **Database**: PostgreSQL 15
- **Containerization**: Docker + Docker Compose

## Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
cd Multi_SAAS

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

Services will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Database**: localhost:5432

### Manual Setup

#### Prerequisites
- Node.js 20+
- PostgreSQL 15+

#### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Update .env with your database credentials
npm run dev
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Default Accounts

After running the seed data, these accounts are available:

| Role | Email | Password | Tenant |
|------|-------|----------|--------|
| Super Admin | superadmin@system.com | SuperAdmin123! | - |
| Tenant Admin | admin@demo.com | AdminPass123! | demo |
| User | user1@demo.com | UserPass123! | demo |

## API Endpoints

### Authentication
- `POST /api/auth/register-tenant` - Register new tenant
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Tenants
- `GET /api/tenants` - List all tenants (super_admin)
- `GET /api/tenants/:id` - Get tenant details
- `PUT /api/tenants/:id` - Update tenant

### Users
- `POST /api/tenants/:tenantId/users` - Create user
- `GET /api/tenants/:tenantId/users` - List tenant users
- `PUT /api/users/:userId` - Update user
- `DELETE /api/users/:userId` - Delete user

### Projects
- `POST /api/projects` - Create project
- `GET /api/projects` - List projects
- `GET /api/projects/:projectId` - Get project details
- `PUT /api/projects/:projectId` - Update project
- `DELETE /api/projects/:projectId` - Delete project

### Tasks
- `POST /api/projects/:projectId/tasks` - Create task
- `GET /api/projects/:projectId/tasks` - List project tasks
- `PUT /api/tasks/:taskId` - Update task
- `PATCH /api/tasks/:taskId/status` - Update task status

## Project Structure

```
Multi_SAAS/
├── backend/
│   ├── src/
│   │   ├── config/          # Database and JWT config
│   │   ├── controllers/     # API controllers
│   │   ├── middleware/      # Auth and error handling
│   │   ├── routes/          # Express routes
│   │   ├── utils/           # Helpers and validators
│   │   └── index.js         # Entry point
│   ├── migrations/          # SQL migrations
│   └── seeds/               # Seed data
├── frontend/
│   ├── src/
│   │   ├── api/             # API client
│   │   ├── components/      # React components
│   │   ├── context/         # Auth context
│   │   ├── pages/           # Page components
│   │   └── App.jsx          # Main app
│   └── index.html
├── docs/                    # Documentation
├── docker/                  # Docker scripts
└── docker-compose.yml
```

## Subscription Plans

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Max Users | 5 | 25 | 100 |
| Max Projects | 3 | 15 | 50 |
| Support | Community | Email | Priority |

## Security Features

- Password hashing with bcrypt
- JWT authentication
- Tenant data isolation
- Input validation
- CORS configuration
- Audit logging

## License

MIT
