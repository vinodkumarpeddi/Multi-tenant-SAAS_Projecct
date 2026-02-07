import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    tenantSubdomain: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';
  const successMessage = location.state?.message;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(
        formData.email,
        formData.password,
        formData.tenantSubdomain
      );

      if (response.success) {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Animated Background Elements */}
      <div className="auth-bg-elements">
        <div className="bg-circle circle-1"></div>
        <div className="bg-circle circle-2"></div>
        <div className="bg-circle circle-3"></div>
        <div className="bg-grid"></div>
      </div>

      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span>⚡</span>
          </div>
          <h1 className="auth-title">Welcome Back!</h1>
          <p className="auth-subtitle">Sign in to continue to your dashboard</p>
        </div>

        {successMessage && (
          <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
            <span className="alert-icon">✅</span>
            {successMessage}
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">🏢</span>
              Organization Subdomain
            </label>
            <input
              type="text"
              name="tenantSubdomain"
              className="form-input"
              placeholder="your-company"
              value={formData.tenantSubdomain}
              onChange={handleChange}
            />
            <span className="form-hint">Leave empty for super admin access</span>
          </div>

          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">✉️</span>
              Email Address
            </label>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="you@company.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">🔒</span>
              Password
            </label>
            <input
              type="password"
              name="password"
              className="form-input"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? (
              <>
                <span className="btn-spinner"></span>
                Signing in...
              </>
            ) : (
              <>
                <span>Sign In</span>
                <span className="btn-arrow">→</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>New to our platform?</span>
        </div>

        <div className="auth-footer">
          <Link to="/register" className="auth-link">
            Create an organization →
          </Link>
        </div>
      </div>

      <style>{`
        .auth-bg-elements {
          position: fixed;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }
        
        .bg-circle {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
        }
        
        .circle-1 {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%);
          top: -20%;
          right: -10%;
          animation: float1 15s ease-in-out infinite;
        }
        
        .circle-2 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(34, 211, 238, 0.25) 0%, transparent 70%);
          bottom: -10%;
          left: -10%;
          animation: float2 12s ease-in-out infinite;
        }
        
        .circle-3 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, transparent 70%);
          top: 50%;
          left: 30%;
          animation: float3 18s ease-in-out infinite;
        }
        
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-50px, 30px) scale(1.1); }
        }
        
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -40px) scale(1.05); }
        }
        
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-30px, 30px) scale(0.95); }
        }
        
        .bg-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
        }
        
        .auth-card {
          position: relative;
          z-index: 1;
        }
        
        .auth-logo span {
          font-size: 2rem;
        }
        
        .label-icon {
          margin-right: 0.5rem;
        }
        
        .form-hint {
          display: block;
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        
        .auth-submit {
          width: 100%;
          padding: 1rem;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }
        
        .btn-arrow {
          transition: transform 0.3s ease;
        }
        
        .auth-submit:hover .btn-arrow {
          transform: translateX(4px);
        }
        
        .btn-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .auth-divider {
          text-align: center;
          margin: 1.5rem 0;
          color: var(--text-muted);
          font-size: 0.875rem;
          position: relative;
        }
        
        .auth-divider::before,
        .auth-divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 30%;
          height: 1px;
          background: var(--border-default);
        }
        
        .auth-divider::before { left: 0; }
        .auth-divider::after { right: 0; }
        
        .auth-link {
          display: block;
          text-align: center;
          color: var(--primary-400);
          text-decoration: none;
          font-weight: 600;
          padding: 0.75rem;
          border: 1px solid var(--border-accent);
          border-radius: 12px;
          transition: all 0.3s ease;
        }
        
        .auth-link:hover {
          background: rgba(139, 92, 246, 0.1);
          transform: translateY(-2px);
        }
        
        .alert-icon {
          margin-right: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default Login;
