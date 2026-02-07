import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

const ProjectDetails = () => {
    const { projectId } = useParams();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' });
    const [error, setError] = useState('');

    useEffect(() => { loadProject(); loadTasks(); }, [projectId]);

    const loadProject = async () => {
        try { const res = await api.getProject(projectId); setProject(res.data); }
        catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const loadTasks = async () => {
        try { const res = await api.getTasks(projectId); setTasks(res.data?.tasks || []); }
        catch (err) { console.error(err); }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.createTask(projectId, newTask);
            setShowModal(false);
            setNewTask({ title: '', description: '', priority: 'medium' });
            loadTasks(); loadProject();
        } catch (err) { setError(err.message); }
    };

    const handleStatusChange = async (taskId, status) => {
        try { await api.updateTaskStatus(taskId, status); loadTasks(); loadProject(); }
        catch (err) { console.error(err); }
    };

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;
    if (!project) return <div className="card"><h3>Project not found</h3><Link to="/projects" className="btn btn-primary">← Back</Link></div>;

    const progress = project.taskCount > 0 ? Math.round((project.completedTaskCount / project.taskCount) * 100) : 0;

    return (
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <Link to="/projects" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>← Back to Projects</Link>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', background: 'linear-gradient(135deg,#fff,#a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{project.name}</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>{project.description || 'No description'}</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>✨ Add Task</button>
            </div>

            {/* Progress Card */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 16, padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1rem' }}>📊 Project Progress</h3>
                    <span style={{ fontSize: '1.5rem', fontWeight: 700, background: 'linear-gradient(135deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{progress}%</span>
                </div>
                <div style={{ height: 10, background: 'rgba(255,255,255,0.1)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#8b5cf6,#22d3ee)', borderRadius: 999, transition: 'width 0.5s' }} />
                </div>
                <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ color: '#10b981' }}>✅</span><strong>{project.completedTaskCount}</strong> completed</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ color: '#f59e0b' }}>⏳</span><strong>{project.taskCount - project.completedTaskCount}</strong> pending</div>
                </div>
            </div>

            {/* Tasks */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>📋 Tasks <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400 }}>({tasks.length})</span></h3>
                </div>

                {tasks.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>No tasks yet</p>
                        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>Add First Task</button>
                    </div>
                ) : (
                    <div style={{ padding: '1rem' }}>
                        {tasks.map((task, i) => (
                            <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', marginBottom: '0.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid transparent', borderRadius: 12, transition: 'all 0.3s', animation: `slideIn 0.4s ease ${i * 0.05}s backwards` }}>
                                <div onClick={() => handleStatusChange(task.id, task.status === 'completed' ? 'todo' : 'completed')}
                                    style={{ width: 24, height: 24, borderRadius: 8, border: `2px solid ${task.status === 'completed' ? '#8b5cf6' : 'var(--border-default)'}`, background: task.status === 'completed' ? 'linear-gradient(135deg,#667eea,#764ba2)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s', color: 'white', fontSize: '0.75rem' }}>
                                    {task.status === 'completed' && '✓'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 500, marginBottom: '0.25rem', textDecoration: task.status === 'completed' ? 'line-through' : 'none', color: task.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)' }}>{task.title}</div>
                                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem' }}>
                                        <span className={`badge priority-${task.priority}`}>{task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'} {task.priority}</span>
                                        {task.dueDate && <span style={{ color: 'var(--text-secondary)' }}>📅 {new Date(task.dueDate).toLocaleDateString()}</span>}
                                    </div>
                                </div>
                                <select className="form-select" style={{ width: 'auto', padding: '0.5rem', fontSize: '0.8rem' }} value={task.status} onChange={(e) => handleStatusChange(task.id, e.target.value)}>
                                    <option value="todo">To Do</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h3 className="modal-title">✨ Add Task</h3><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
                        <form onSubmit={handleCreateTask}>
                            <div className="modal-body">
                                {error && <div className="alert alert-error">{error}</div>}
                                <div className="form-group"><label className="form-label">Title</label><input type="text" className="form-input" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} required autoFocus /></div>
                                <div className="form-group"><label className="form-label">Description</label><textarea className="form-input form-textarea" value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Priority</label><select className="form-select" value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })}><option value="low">🟢 Low</option><option value="medium">🟡 Medium</option><option value="high">🔴 High</option></select></div>
                            </div>
                            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create</button></div>
                        </form>
                    </div>
                </div>
            )}
            <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}`}</style>
        </div>
    );
};

export default ProjectDetails;
