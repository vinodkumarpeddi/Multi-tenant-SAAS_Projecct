import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const response = await api.getCurrentUser();
            if (response.success) {
                setUser(response.data);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password, tenantSubdomain) => {
        const response = await api.login({ email, password, tenantSubdomain });
        if (response.success) {
            setUser(response.data.user);
        }
        return response;
    };

    const register = async (data) => {
        const response = await api.registerTenant(data);
        if (response.success) {
            // After registration, we don't automatically log in 
            // because building the tenant might take a moment 
            // or we want them to login explicitly. 
            // In this app, the backend returns the tenant/admin info.
            // If we want auto-login, we'd need a token back.
            // Let's check api/index.js for registerTenant.
        }
        return response;
    };

    const logout = async () => {
        try {
            await api.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
            localStorage.removeItem('token');
        }
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isSuperAdmin: user?.role === 'super_admin',
        isTenantAdmin: user?.role === 'tenant_admin',
        refreshUser: checkAuth
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
