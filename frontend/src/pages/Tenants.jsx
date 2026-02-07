import { useState, useEffect } from 'react';
import api from '../api';

const Tenants = () => {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadTenants(); }, []);

    const loadTenants = async () => {
        try { const res = await api.getTenants(); setTenants(res.data?.tenants || []); }
        catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleUpdatePlan = async (id, plan) => {
        try { await api.updateTenant(id, { subscriptionPlan: plan }); loadTenants(); }
        catch (err) { alert(err.message); }
    };

    const handleToggle = async (id, status) => {
        try { await api.updateTenant(id, { status: status === 'active' ? 'suspended' : 'active' }); loadTenants(); }
        catch (err) { alert(err.message); }
    };

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

    return (
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <div className="page-header">
                <div><h1 className="page-title">🏢 Tenants</h1><p className="page-subtitle">{tenants.length} organizations</p></div>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 16, overflow: 'hidden' }}>
                {tenants.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center' }}><h3>No tenants found</h3></div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table">
                            <thead><tr><th>Organization</th><th>Plan</th><th>Users</th><th>Projects</th><th>Status</th><th>Actions</th></tr></thead>
                            <tbody>
                                {tenants.map((t, i) => (
                                    <tr key={t.id} style={{ animation: `slideIn 0.4s ease ${i * 0.05}s backwards` }}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem' }}>{t.name?.charAt(0).toUpperCase()}</div>
                                                <div><div style={{ fontWeight: 500 }}>{t.name}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t.subdomain}.saashub.io</div></div>
                                            </div>
                                        </td>
                                        <td>
                                            <select className="form-select" style={{ width: 'auto', padding: '0.5rem', fontSize: '0.8rem', background: t.subscriptionPlan === 'enterprise' ? 'rgba(139,92,246,0.2)' : t.subscriptionPlan === 'pro' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)' }} value={t.subscriptionPlan} onChange={e => handleUpdatePlan(t.id, e.target.value)}>
                                                <option value="free">🆓 Free</option>
                                                <option value="pro">⭐ Pro</option>
                                                <option value="enterprise">💎 Enterprise</option>
                                            </select>
                                        </td>
                                        <td><span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>👥 {t.totalUsers}</span></td>
                                        <td><span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>📁 {t.totalProjects}</span></td>
                                        <td><span className={`badge status-${t.status}`}>{t.status === 'active' ? '🟢' : '🔴'} {t.status}</span></td>
                                        <td><button className={`btn btn-sm ${t.status === 'active' ? 'btn-danger' : 'btn-secondary'}`} onClick={() => handleToggle(t.id, t.status)}>{t.status === 'active' ? 'Suspend' : 'Activate'}</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}`}</style>
        </div>
    );
};

export default Tenants;
