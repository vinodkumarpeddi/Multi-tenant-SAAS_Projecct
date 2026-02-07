import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const Users = () => {
    const { user, isTenantAdmin } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newUser, setNewUser] = useState({ email: '', fullName: '', password: '', role: 'user' });
    const [error, setError] = useState('');

    useEffect(() => { if (user?.tenantId) loadUsers(); else setLoading(false); }, [user]);

    const loadUsers = async () => {
        try { const res = await api.getUsers(user.tenantId); setUsers(res.data?.users || []); }
        catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setError('');
        try { await api.createUser(user.tenantId, newUser); setShowModal(false); setNewUser({ email: '', fullName: '', password: '', role: 'user' }); loadUsers(); }
        catch (err) { setError(err.message); }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Delete this user?')) return;
        try { await api.deleteUser(userId); loadUsers(); } catch (err) { alert(err.message); }
    };

    const handleToggle = async (userId, isActive) => {
        try { await api.updateUser(userId, { isActive: !isActive }); loadUsers(); } catch (err) { alert(err.message); }
    };

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;
    if (!user?.tenantId) return <div className="card"><h3>Access Denied</h3></div>;

    return (
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <div className="page-header">
                <div><h1 className="page-title">👥 Team Members</h1><p className="page-subtitle">{users.length} users in your organization</p></div>
                {isTenantAdmin && <button className="btn btn-primary" onClick={() => setShowModal(true)}>✨ Add User</button>}
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 16, overflow: 'hidden' }}>
                {users.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👥</div>
                        <h3>No users found</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Add team members to your organization</p>
                        {isTenantAdmin && <button className="btn btn-primary" onClick={() => setShowModal(true)}>Add User</button>}
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table">
                            <thead><tr><th>Member</th><th>Role</th><th>Status</th><th>Joined</th>{isTenantAdmin && <th>Actions</th>}</tr></thead>
                            <tbody>
                                {users.map((u, i) => (
                                    <tr key={u.id} style={{ animation: `slideIn 0.4s ease ${i * 0.05}s backwards` }}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '1rem' }}>{u.fullName?.charAt(0).toUpperCase()}</div>
                                                <div><div style={{ fontWeight: 500 }}>{u.fullName}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{u.email}</div></div>
                                            </div>
                                        </td>
                                        <td><span className={`badge ${u.role === 'tenant_admin' ? 'badge-primary' : 'badge-secondary'}`}>{u.role === 'tenant_admin' ? '👑' : ''} {u.role.replace('_', ' ')}</span></td>
                                        <td><span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>{u.isActive ? '🟢 Active' : '🔴 Inactive'}</span></td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                                        {isTenantAdmin && (
                                            <td>
                                                {u.id !== user.id && (
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button className="btn btn-secondary btn-sm" onClick={() => handleToggle(u.id, u.isActive)}>{u.isActive ? 'Deactivate' : 'Activate'}</button>
                                                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}>🗑️</button>
                                                    </div>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h3 className="modal-title">✨ Add User</h3><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body">
                                {error && <div className="alert alert-error">{error}</div>}
                                <div className="form-group"><label className="form-label">Full Name</label><input type="text" className="form-input" value={newUser.fullName} onChange={e => setNewUser({ ...newUser, fullName: e.target.value })} required /></div>
                                <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-input" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required /></div>
                                <div className="form-group"><label className="form-label">Password</label><input type="password" className="form-input" placeholder="Min. 8 characters" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required minLength={8} /></div>
                                <div className="form-group"><label className="form-label">Role</label><select className="form-select" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}><option value="user">👤 User</option><option value="tenant_admin">👑 Admin</option></select></div>
                            </div>
                            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">Add User</button></div>
                        </form>
                    </div>
                </div>
            )}
            <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}`}</style>
        </div>
    );
};

export default Users;
