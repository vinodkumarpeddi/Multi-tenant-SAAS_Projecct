const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * API Client for Multi-Tenant SaaS
 */
class ApiClient {
    constructor() {
        this.baseUrl = API_URL;
    }

    getToken() {
        return localStorage.getItem('token');
    }

    setToken(token) {
        localStorage.setItem('token', token);
    }

    removeToken() {
        localStorage.removeItem('token');
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const token = this.getToken();

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
                ...options.headers,
            },
            ...options,
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    this.removeToken();
                    window.location.href = '/login';
                }
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            throw error;
        }
    }

    // Auth endpoints
    async registerTenant(data) {
        return this.request('/auth/register-tenant', {
            method: 'POST',
            body: data,
        });
    }

    async login(data) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: data,
        });
        if (response.success && response.data.token) {
            this.setToken(response.data.token);
        }
        return response;
    }

    async getCurrentUser() {
        return this.request('/auth/me');
    }

    async logout() {
        try {
            await this.request('/auth/logout', { method: 'POST' });
        } finally {
            this.removeToken();
        }
    }

    // Tenant endpoints
    async getTenants(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/tenants${query ? `?${query}` : ''}`);
    }

    async getTenant(id) {
        return this.request(`/tenants/${id}`);
    }

    async updateTenant(id, data) {
        return this.request(`/tenants/${id}`, {
            method: 'PUT',
            body: data,
        });
    }

    // User endpoints
    async getUsers(tenantId, params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/tenants/${tenantId}/users${query ? `?${query}` : ''}`);
    }

    async createUser(tenantId, data) {
        return this.request(`/tenants/${tenantId}/users`, {
            method: 'POST',
            body: data,
        });
    }

    async updateUser(userId, data) {
        return this.request(`/users/${userId}`, {
            method: 'PUT',
            body: data,
        });
    }

    async deleteUser(userId) {
        return this.request(`/users/${userId}`, {
            method: 'DELETE',
        });
    }

    // Project endpoints
    async getProjects(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/projects${query ? `?${query}` : ''}`);
    }

    async getProject(id) {
        return this.request(`/projects/${id}`);
    }

    async createProject(data) {
        return this.request('/projects', {
            method: 'POST',
            body: data,
        });
    }

    async updateProject(id, data) {
        return this.request(`/projects/${id}`, {
            method: 'PUT',
            body: data,
        });
    }

    async deleteProject(id) {
        return this.request(`/projects/${id}`, {
            method: 'DELETE',
        });
    }

    // Task endpoints
    async getTasks(projectId, params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/projects/${projectId}/tasks${query ? `?${query}` : ''}`);
    }

    async createTask(projectId, data) {
        return this.request(`/projects/${projectId}/tasks`, {
            method: 'POST',
            body: data,
        });
    }

    async updateTask(taskId, data) {
        return this.request(`/tasks/${taskId}`, {
            method: 'PUT',
            body: data,
        });
    }

    async updateTaskStatus(taskId, status) {
        return this.request(`/tasks/${taskId}/status`, {
            method: 'PATCH',
            body: { status },
        });
    }
}

export const api = new ApiClient();
export default api;
