import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <NavLink to="/dashboard" className="navbar-brand">
                <div className="navbar-logo">
                    <span>⚡</span>
                </div>
                <span className="brand-text">
                    <span className="brand-primary">Saas</span>
                    <span className="brand-secondary">Hub</span>
                </span>
            </NavLink>

            <div className="navbar-user">
                <div className="user-avatar">
                    {user?.fullName?.charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                    <div className="user-name">{user?.fullName}</div>
                    <div className="user-role">{user?.role?.replace('_', ' ')}</div>
                </div>
                <button onClick={handleLogout} className="btn btn-secondary btn-sm logout-btn">
                    <span className="logout-icon">🚪</span>
                    <span>Logout</span>
                </button>
            </div>

            <style>{`
        .brand-text {
          display: flex;
          gap: 0.125rem;
        }
        
        .brand-primary {
          background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .brand-secondary {
          color: var(--text-secondary);
          font-weight: 500;
        }
        
        .user-avatar {
          width: 42px;
          height: 42px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.1rem;
          box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
        }
        
        .logout-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .logout-icon {
          font-size: 1rem;
        }
        
        @media (max-width: 768px) {
          .logout-btn span:not(.logout-icon) {
            display: none;
          }
        }
      `}</style>
        </nav>
    );
};

const Sidebar = () => {
    const { isSuperAdmin, isTenantAdmin } = useAuth();

    const navItems = [
        { to: '/dashboard', icon: '🏠', label: 'Dashboard', emoji: true },
        { to: '/projects', icon: '📁', label: 'Projects', emoji: true },
        ...(isTenantAdmin || isSuperAdmin ? [{ to: '/users', icon: '👥', label: 'Team', emoji: true }] : []),
        ...(isSuperAdmin ? [{ to: '/tenants', icon: '🏢', label: 'Tenants', emoji: true }] : [])
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-section">
                <span className="sidebar-section-title">Navigation</span>
                <nav className="sidebar-nav">
                    {navItems.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                        >
                            <span className="sidebar-icon">{item.icon}</span>
                            <span className="sidebar-label">{item.label}</span>
                            <span className="sidebar-arrow">→</span>
                        </NavLink>
                    ))}
                </nav>
            </div>

            <div className="sidebar-footer">
                <div className="sidebar-help">
                    <span className="help-icon">💡</span>
                    <div className="help-content">
                        <span className="help-title">Need Help?</span>
                        <span className="help-text">Check our docs</span>
                    </div>
                </div>
            </div>

            <style>{`
        .sidebar-section {
          padding: 0 0.75rem;
        }
        
        .sidebar-section-title {
          display: block;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          padding: 0 1rem;
          margin-bottom: 0.75rem;
        }
        
        .sidebar-link {
          position: relative;
        }
        
        .sidebar-arrow {
          margin-left: auto;
          opacity: 0;
          transform: translateX(-10px);
          transition: all 0.3s ease;
          color: var(--primary-400);
        }
        
        .sidebar-link:hover .sidebar-arrow,
        .sidebar-link.active .sidebar-arrow {
          opacity: 1;
          transform: translateX(0);
        }
        
        .sidebar-footer {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 1.5rem;
          border-top: 1px solid var(--border-subtle);
        }
        
        .sidebar-help {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 1rem;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(34, 211, 238, 0.05) 100%);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .sidebar-help:hover {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(34, 211, 238, 0.08) 100%);
          transform: translateY(-2px);
        }
        
        .help-icon {
          font-size: 1.5rem;
        }
        
        .help-content {
          display: flex;
          flex-direction: column;
        }
        
        .help-title {
          font-weight: 600;
          font-size: 0.875rem;
        }
        
        .help-text {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
      `}</style>
        </aside>
    );
};

const Layout = ({ children }) => {
    return (
        <div className="app-container">
            <Navbar />
            <div className="main-layout">
                <Sidebar />
                <main className="main-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
