# Multi-Tenant SaaS Platform - Research Document

## 1. Multi-Tenancy Architecture Analysis

Multi-tenancy is a software architecture where a single instance of an application serves multiple customers (tenants). Each tenant's data must be completely isolated from other tenants while sharing the same infrastructure.

### 1.1 Approach Comparison

| Approach | Description | Pros | Cons |
|----------|-------------|------|------|
| **Shared Database + Shared Schema** | All tenants share the same database and tables with a `tenant_id` column for isolation | Cost-effective, easy maintenance, simple backup/restore, efficient resource usage | Complex isolation logic, risk of data leaks if queries aren't filtered, shared performance impact |
| **Shared Database + Separate Schema** | Each tenant has their own schema within the same database | Better isolation than shared schema, easier per-tenant backup, clearer data boundaries | Schema management complexity, migration challenges, connection pool management |
| **Separate Databases** | Each tenant has their own dedicated database | Maximum isolation, independent scaling, per-tenant customization | Highest cost, complex infrastructure, difficult cross-tenant analytics |

### 1.2 Chosen Approach: Shared Database + Shared Schema

For this project, we implement the **Shared Database with Shared Schema (tenant_id column)** approach for the following reasons:

1. **Cost Efficiency**: Single database instance reduces infrastructure costs, making it ideal for SaaS startups and small-to-medium scale applications.

2. **Development Simplicity**: Uniform schema across all tenants simplifies development, testing, and maintenance. No need to manage multiple database connections or schemas.

3. **Easier Onboarding**: New tenants can be provisioned instantly by simply creating a tenant record, without database provisioning delays.

4. **Efficient Resource Utilization**: Shared connection pools and caching mechanisms work across all tenants, reducing memory footprint.

5. **Simplified Migrations**: Schema changes apply to all tenants simultaneously through a single migration path.

6. **Suitable Scale**: For applications expecting hundreds to low thousands of tenants, this approach provides the best balance of isolation and efficiency.

### 1.3 Implementation Strategy

To ensure proper data isolation in the shared schema approach:

- **Mandatory tenant_id**: Every data table (except system tables) includes a `tenant_id` foreign key
- **Middleware Enforcement**: Authentication middleware extracts tenant context from JWT and injects it into all queries
- **Query Filtering**: All database queries automatically filter by `tenant_id`
- **Composite Unique Constraints**: Email uniqueness is per-tenant using `UNIQUE(tenant_id, email)`
- **Super Admin Exception**: Super admin users have `tenant_id = NULL` and can access all tenant data

### 1.4 Data Isolation Guarantees

The system ensures isolation through multiple layers:

1. **API Layer**: JWT tokens contain tenant_id; middleware validates tenant access before processing requests
2. **Business Logic Layer**: Services automatically filter queries by tenant_id from request context
3. **Database Layer**: Foreign key constraints and indexes on tenant_id ensure data integrity

---

## 2. Technology Stack Justification

### 2.1 Backend: Node.js with Express.js

**Chosen**: Node.js 20.x with Express.js 4.x

**Justification**:
- **JavaScript Ecosystem**: Unified language across frontend and backend reduces context switching
- **Async Performance**: Event-driven, non-blocking I/O is ideal for API servers handling many concurrent requests
- **NPM Ecosystem**: Rich package ecosystem (bcrypt, jsonwebtoken, pg) accelerates development
- **Express Maturity**: Battle-tested framework with extensive middleware support and community resources
- **Easy Containerization**: Lightweight runtime creates smaller Docker images

**Alternatives Considered**:
- *Python/FastAPI*: Excellent for async APIs but would require team to work in two languages
- *Java/Spring Boot*: Enterprise-grade but heavier footprint and longer development cycles
- *Go/Gin*: Superior performance but steeper learning curve and smaller ecosystem

### 2.2 Frontend: React with Vite

**Chosen**: React 18 with Vite 5.x

**Justification**:
- **Component Architecture**: React's component model enables reusable UI elements
- **Virtual DOM**: Efficient rendering for dynamic dashboards with frequent updates
- **Vite Speed**: Lightning-fast HMR (Hot Module Replacement) improves development experience
- **Rich Ecosystem**: Extensive libraries for routing (React Router), state management, and UI components
- **Industry Standard**: Most widely used frontend library with excellent hiring pool and documentation

**Alternatives Considered**:
- *Vue.js*: Gentler learning curve but smaller ecosystem
- *Angular*: Full framework but opinionated and heavier
- *Next.js*: Server-side rendering not required for this SPA application

### 2.3 Database: PostgreSQL 15

**Chosen**: PostgreSQL 15

**Justification**:
- **ACID Compliance**: Full transactional support crucial for multi-tenant data integrity
- **JSON Support**: JSONB type allows flexible data storage where needed
- **Performance**: Excellent query optimizer, indexing options, and connection pooling
- **Mature Ecosystem**: pg library for Node.js is well-maintained and performant
- **Enterprise Features**: Row-level security, partitioning, and full-text search available if needed

**Alternatives Considered**:
- *MySQL*: Good alternative but PostgreSQL has superior JSON support and advanced features
- *MongoDB*: NoSQL flexibility not needed; relational model better suits multi-tenant isolation
- *SQLite*: Not suitable for production multi-user applications

### 2.4 Authentication: JWT (JSON Web Tokens)

**Chosen**: JWT with 24-hour expiry

**Justification**:
- **Stateless**: No server-side session storage required, enabling horizontal scaling
- **Self-Contained**: Token contains user identity and tenant context, reducing database lookups
- **Standard**: Industry-standard format with libraries available in all languages
- **Secure**: Cryptographically signed to prevent tampering

**Implementation Details**:
- Algorithm: HS256 (HMAC with SHA-256)
- Payload: `{ userId, tenantId, role }`
- Expiry: 24 hours
- Storage: Client-side (localStorage or secure cookie)

### 2.5 Containerization: Docker with Docker Compose

**Chosen**: Docker 24.x with Docker Compose 2.x

**Justification**:
- **Environment Consistency**: Identical environments from development to production
- **Easy Deployment**: Single command (`docker-compose up -d`) starts entire stack
- **Service Orchestration**: Dependencies and health checks handled declaratively
- **Isolation**: Each service runs in its own container with defined resources

---

## 3. Security Considerations

### 3.1 Authentication Security

1. **Password Hashing**: All passwords hashed using bcrypt with salt rounds of 10-12. Never store plain text passwords.

2. **JWT Security**:
   - Secret key minimum 256 bits
   - Short expiration (24 hours)
   - Tokens transmitted only via HTTPS headers
   - No sensitive data in payload (only IDs and role)

3. **Login Protection**:
   - Verify tenant exists and is active before authentication
   - Return generic "Invalid credentials" message (don't reveal if email exists)
   - Consider rate limiting for brute force protection

### 3.2 Authorization Security

4. **Role-Based Access Control (RBAC)**:
   - Three distinct roles: super_admin, tenant_admin, user
   - Middleware verifies role before accessing protected endpoints
   - Principle of least privilege: users only access what they need

5. **Tenant Isolation Enforcement**:
   - Every API request validates tenant_id from JWT against requested resources
   - Cross-tenant access attempts return 403 Forbidden
   - Super admin bypasses tenant checks but is restricted to system role

### 3.3 Data Protection

6. **SQL Injection Prevention**:
   - Parameterized queries for all database operations
   - Never concatenate user input into SQL strings
   - Use ORM/query builder with built-in escaping

7. **Input Validation**:
   - Validate all request body fields (type, format, length)
   - Sanitize inputs to prevent XSS
   - Reject requests with unexpected fields

### 3.4 API Security

8. **CORS Configuration**:
   - Restrict allowed origins to known frontend domains
   - Configure allowed methods and headers explicitly
   - Enable credentials only when necessary

9. **Error Handling**:
   - Return generic error messages to clients
   - Log detailed errors server-side
   - Never expose stack traces or internal details

### 3.5 Audit and Monitoring

10. **Audit Logging**:
    - Log all authentication events (login, logout, failed attempts)
    - Track data modifications (create, update, delete)
    - Record IP address, user ID, timestamp, and action type
    - Audit logs help detect breaches and meet compliance requirements

---

## 4. Subscription Management Strategy

### 4.1 Plan Limits

| Plan | Max Users | Max Projects | Features |
|------|-----------|--------------|----------|
| Free | 5 | 3 | Basic project management |
| Pro | 25 | 15 | Extended limits |
| Enterprise | 100 | 50 | Full features |

### 4.2 Enforcement Strategy

- **Pre-creation Checks**: Before creating users/projects, query current count and compare against plan limits
- **Graceful Denial**: Return 403 with clear message about upgrading plan
- **Default Plan**: New tenants start on 'free' plan automatically

---

## 5. Scalability Considerations

### 5.1 Database Indexing

- Index on `tenant_id` for all tenant-specific tables
- Composite indexes for common query patterns (e.g., `tenant_id, status`)
- Foreign key indexes for join performance

### 5.2 Connection Pooling

- Use pg-pool for database connection management
- Configure pool size based on expected concurrent users
- Implement connection retry logic for resilience

### 5.3 Future Enhancements

- **Caching**: Redis for session storage and frequently accessed data
- **Rate Limiting**: Protect APIs from abuse
- **Horizontal Scaling**: Stateless JWT allows multiple backend instances
- **Database Read Replicas**: Scale read operations if needed

---

## 6. Conclusion

This architecture provides a solid foundation for a multi-tenant SaaS application that balances security, performance, and development efficiency. The shared database approach with tenant_id isolation, combined with JWT authentication and proper RBAC, ensures data security while maintaining cost effectiveness. The chosen technology stack (Node.js, React, PostgreSQL, Docker) represents industry-standard tools with excellent documentation and community support.
