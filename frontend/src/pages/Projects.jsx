import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const Projects = () => {
    const { isTenantAdmin, isSuperAdmin } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '' });
    const [error, setError] = useState('');

    useEffect(() => { loadProjects(); }, []);

    const loadProjects = async () => {
        try {
            const res = await api.getProjects();
            setProjects(res.data?.projects || []);
        } catch (err) { console.error('Failed to load projects:', err); }
        finally { setLoading(false); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.createProject(newProject);
            setShowModal(false);
            setNewProject({ name: '', description: '' });
            loadProjects();
        } catch (err) { setError(err.message); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this project?')) return;
        try { await api.deleteProject(id); loadProjects(); }
        catch (err) { alert('Failed: ' + err.message); }
    };

    const icons = ['🎯', '⚡', '🔥', '💎', '🌟', '🚀', '💡', '🎨'];
    const colors = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a'];

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">📁 Projects</h1>
                    <p className="page-subtitle">{projects.length} projects</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>✨ New Project</button>
            </div>

            {projects.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📁</div>
                    <h3>No projects yet</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Create your first project</p>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>🚀 Create Project</button>
                </div>
            ) : (
                <div className="projects-grid">
                    {projects.map((p, i) => (
                        <div key={p.id} className="project-card" style={{ animation: `cardIn 0.5s ease ${i * 0.1}s backwards` }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: colors[i % 5], borderRadius: '16px 16px 0 0' }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{ width: 48, height: 48, borderRadius: 12, background: `linear-gradient(135deg,${colors[i % 5]},${colors[(i + 1) % 5]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>{icons[i % 8]}</div>
                                <div>
                                    <Link to={`/projects/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}><h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>{p.name}</h3></Link>
                                    <span className={`badge status-${p.status}`}>{p.status}</span>
                                </div>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>{p.description || 'No description'}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
                                    <span>📝 <strong>{p.taskCount}</strong> tasks</span>
                                    <span>✅ <strong>{p.completedTaskCount}</strong> done</span>
                                </div>
                                {(isTenantAdmin || isSuperAdmin) && <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>🗑️</button>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">✨ New Project</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body">
                                {error && <div className="alert alert-error">{error}</div>}
                                <div className="form-group">
                                    <label className="form-label">Project Name</label>
                                    <input type="text" className="form-input" value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} required autoFocus />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea className="form-input form-textarea" value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">🚀 Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <style>{`@keyframes cardIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    );
};

export default Projects;
