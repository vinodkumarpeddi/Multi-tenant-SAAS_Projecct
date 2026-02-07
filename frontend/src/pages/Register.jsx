import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();

    const [formData, setFormData] = useState({
        tenantName: '',
        subdomain: '',
        adminName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const validateStep1 = () => {
        if (!formData.tenantName || formData.tenantName.length < 2) {
            setError('Organization name must be at least 2 characters');
            return false;
        }
        if (!formData.subdomain || formData.subdomain.length < 3) {
            setError('Subdomain must be at least 3 characters');
            return false;
        }
        if (!/^[a-z0-9-]+$/.test(formData.subdomain)) {
            setError('Subdomain can only contain lowercase letters, numbers, and hyphens');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (!formData.adminName || formData.adminName.length < 2) {
            setError('Full name must be at least 2 characters');
            return false;
        }
        if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
            setError('Please enter a valid email address');
            return false;
        }
        if (!formData.password || formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        return true;
    };

    const nextStep = () => {
        if (step === 1 && validateStep1()) {
            setStep(2);
        }
    };

    const prevStep = () => {
        setStep(1);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep2()) return;

        setError('');
        setLoading(true);

        try {
            const response = await register({
                tenantName: formData.tenantName,
                subdomain: formData.subdomain,
                adminFullName: formData.adminName,
                adminEmail: formData.email,
                adminPassword: formData.password
            });

            if (response.success) {
                navigate('/login', { state: { message: 'Organization created successfully! Please sign in.' } });
            }
        } catch (err) {
            setError(err.message || 'Registration failed');
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

            <div className="auth-card register-card">
                <div className="auth-header">
                    <div className="auth-logo">
                        <span>🚀</span>
                    </div>
                    <h1 className="auth-title">Create Your Workspace</h1>
                    <p className="auth-subtitle">Set up your organization in just 2 steps</p>
                </div>

                {/* Step Indicator */}
                <div className="step-indicator">
                    <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                        <div className="step-number">{step > 1 ? '✓' : '1'}</div>
                        <span className="step-label">Organization</span>
                    </div>
                    <div className="step-line"></div>
                    <div className={`step ${step >= 2 ? 'active' : ''}`}>
                        <div className="step-number">2</div>
                        <span className="step-label">Admin Account</span>
                    </div>
                </div>

                {error && (
                    <div className="alert alert-error">
                        <span className="alert-icon">⚠️</span>
                        {error}
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
                    {step === 1 && (
                        <div className="form-step form-step-active">
                            <div className="form-group">
                                <label className="form-label">
                                    <span className="label-icon">🏢</span>
                                    Organization Name
                                </label>
                                <input
                                    type="text"
                                    name="tenantName"
                                    className="form-input"
                                    placeholder="Acme Corporation"
                                    value={formData.tenantName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    <span className="label-icon">🌐</span>
                                    Workspace URL
                                </label>
                                <div className="input-group">
                                    <input
                                        type="text"
                                        name="subdomain"
                                        className="form-input"
                                        placeholder="acme"
                                        value={formData.subdomain}
                                        onChange={handleChange}
                                        required
                                    />
                                    <span className="input-suffix">.saashub.io</span>
                                </div>
                                <span className="form-hint">Choose a unique subdomain for your workspace</span>
                            </div>

                            <button type="button" className="btn btn-primary auth-submit" onClick={nextStep}>
                                <span>Continue</span>
                                <span className="btn-arrow">→</span>
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="form-step form-step-active">
                            <div className="form-group">
                                <label className="form-label">
                                    <span className="label-icon">👤</span>
                                    Your Full Name
                                </label>
                                <input
                                    type="text"
                                    name="adminName"
                                    className="form-input"
                                    placeholder="John Doe"
                                    value={formData.adminName}
                                    onChange={handleChange}
                                    required
                                />
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
                                    placeholder="john@acme.com"
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
                                    placeholder="Min. 8 characters"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    <span className="label-icon">🔐</span>
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    className="form-input"
                                    placeholder="Repeat your password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="btn-group">
                                <button type="button" className="btn btn-secondary" onClick={prevStep}>
                                    <span>← Back</span>
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <span className="btn-spinner"></span>
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <span>Create Workspace</span>
                                            <span className="btn-arrow">🚀</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </form>

                <div className="auth-divider">
                    <span>Already have an account?</span>
                </div>

                <div className="auth-footer">
                    <Link to="/login" className="auth-link">
                        Sign in to your workspace →
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
          background: radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%);
          top: 40%;
          left: 20%;
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
        
        .register-card {
          max-width: 500px;
        }
        
        .auth-logo span {
          font-size: 2rem;
        }
        
        .step-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2rem;
          padding: 0 1rem;
        }
        
        .step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        
        .step-number {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          border: 2px solid var(--border-default);
          background: var(--bg-glass);
          color: var(--text-secondary);
          transition: all 0.4s ease;
        }
        
        .step.active .step-number {
          border-color: var(--primary-500);
          background: linear-gradient(135deg, var(--primary-600), var(--primary-500));
          color: white;
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
        }
        
        .step.completed .step-number {
          border-color: var(--success);
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
        }
        
        .step-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        
        .step.active .step-label {
          color: var(--text-primary);
        }
        
        .step-line {
          width: 60px;
          height: 2px;
          background: var(--border-default);
          margin: 0 0.75rem;
          margin-bottom: 1.5rem;
          position: relative;
          overflow: hidden;
        }
        
        .step-line::after {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 0;
          background: var(--gradient-primary);
          transition: width 0.5s ease;
        }
        
        .step:first-child.completed ~ .step-line::after {
          width: 100%;
        }
        
        .form-step {
          animation: slideIn 0.4s ease;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .input-group {
          display: flex;
          align-items: stretch;
        }
        
        .input-group .form-input {
          border-radius: 12px 0 0 12px;
          border-right: none;
        }
        
        .input-suffix {
          display: flex;
          align-items: center;
          padding: 0 1rem;
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid var(--border-default);
          border-left: none;
          border-radius: 0 12px 12px 0;
          color: var(--text-secondary);
          font-size: 0.875rem;
          white-space: nowrap;
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
        
        .btn-group {
          display: flex;
          gap: 1rem;
        }
        
        .btn-group .btn {
          flex: 1;
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

export default Register;
