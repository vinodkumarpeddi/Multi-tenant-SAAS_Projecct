import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0
    });
    const [recentProjects, setRecentProjects] = useState([]);
    const [myTasks, setMyTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const projectsRes = await api.getProjects({ limit: 5 });
            const projects = projectsRes.data?.projects || [];
            setRecentProjects(projects);

            let totalTasks = 0;
            let completedTasks = 0;
            projects.forEach(p => {
                totalTasks += p.taskCount || 0;
                completedTasks += p.completedTaskCount || 0;
            });

            setStats({
                totalProjects: projectsRes.data?.total || 0,
                totalTasks,
                completedTasks,
                pendingTasks: totalTasks - completedTasks
            });

            if (projects.length > 0) {
                const tasksRes = await api.getTasks(projects[0].id, { limit: 5 });
                setMyTasks(tasksRes.data?.tasks || []);
            }
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return '🌅 Good morning';
        if (hour < 18) return '☀️ Good afternoon';
        return '🌙 Good evening';
    };

    if (loading) {
        return (
            <div className="loading-container" style={{ height: '60vh' }}>
                <div className="spinner"></div>
                <p>Loading your dashboard...</p>
            </div>
        );
    }

    return (
        <div className="dashboard">
            {/* Welcome Section */}
            <div className="welcome-section">
                <div className="welcome-content">
                    <h1 className="welcome-title">
                        {getGreeting()}, <span className="highlight">{user?.fullName?.split(' ')[0]}</span>! ✨
                    </h1>
                    <p className="welcome-subtitle">
                        {user?.tenant
                            ? `${user.tenant.name} • ${user.tenant.subscriptionPlan.toUpperCase()} Plan`
                            : '🔑 System Administrator'}
                    </p>
                </div>
                <Link to="/projects" className="btn btn-primary">
                    <span>+ New Project</span>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon purple">📁</div>
                    <div className="stat-content">
                        <h3>{stats.totalProjects}</h3>
                        <p>Active Projects</p>
                    </div>
                    <div className="stat-trend positive">
                        <span>↗ Active</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon blue">📝</div>
                    <div className="stat-content">
                        <h3>{stats.totalTasks}</h3>
                        <p>Total Tasks</p>
                    </div>
                    <div className="stat-trend">
                        <span>All time</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon green">✅</div>
                    <div className="stat-content">
                        <h3>{stats.completedTasks}</h3>
                        <p>Completed</p>
                    </div>
                    <div className="stat-trend positive">
                        <span>↗ {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon orange">⏳</div>
                    <div className="stat-content">
                        <h3>{stats.pendingTasks}</h3>
                        <p>In Progress</p>
                    </div>
                    <div className="stat-trend warning">
                        <span>Pending</span>
                    </div>
                </div>
            </div>

            {/* Progress Overview */}
            {stats.totalTasks > 0 && (
                <div className="progress-section">
                    <div className="progress-card">
                        <div className="progress-header">
                            <h3>📊 Overall Progress</h3>
                            <span className="progress-percentage">
                                {Math.round((stats.completedTasks / stats.totalTasks) * 100)}%
                            </span>
                        </div>
                        <div className="progress-bar-container">
                            <div
                                className="progress-bar-fill"
                                style={{ width: `${(stats.completedTasks / stats.totalTasks) * 100}%` }}
                            />
                        </div>
                        <p className="progress-text">
                            <span className="completed">{stats.completedTasks}</span> of <span className="total">{stats.totalTasks}</span> tasks completed
                        </p>
                    </div>
                </div>
            )}

            {/* Content Grid */}
            <div className="dashboard-grid">
                {/* Recent Projects */}
                <div className="dashboard-card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <span className="card-icon">📁</span>
                            Recent Projects
                        </h3>
                        <Link to="/projects" className="btn btn-secondary btn-sm">View All →</Link>
                    </div>

                    {recentProjects.length === 0 ? (
                        <div className="empty-state" style={{ padding: '3rem' }}>
                            <div className="empty-state-icon">🚀</div>
                            <h3>No projects yet</h3>
                            <p>Create your first project to get started</p>
                            <Link to="/projects" className="btn btn-primary mt-2">Create Project</Link>
                        </div>
                    ) : (
                        <div className="project-list">
                            {recentProjects.map((project, index) => (
                                <Link
                                    key={project.id}
                                    to={`/projects/${project.id}`}
                                    className="project-list-item"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className="project-list-content">
                                        <div className="project-list-icon">
                                            {['🎯', '⚡', '🔥', '💎', '🌟'][index % 5]}
                                        </div>
                                        <div className="project-list-info">
                                            <h4>{project.name}</h4>
                                            <p>{project.taskCount} tasks • {project.completedTaskCount} done</p>
                                        </div>
                                    </div>
                                    <div className="project-list-right">
                                        <span className={`badge status-${project.status}`}>{project.status}</span>
                                        <div className="project-progress">
                                            <div
                                                className="project-progress-fill"
                                                style={{
                                                    width: project.taskCount > 0
                                                        ? `${(project.completedTaskCount / project.taskCount) * 100}%`
                                                        : '0%'
                                                }}
                                            />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Tasks */}
                <div className="dashboard-card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <span className="card-icon">📋</span>
                            Recent Tasks
                        </h3>
                    </div>

                    {myTasks.length === 0 ? (
                        <div className="empty-state" style={{ padding: '3rem' }}>
                            <div className="empty-state-icon">📝</div>
                            <h3>No tasks yet</h3>
                            <p>Create a project to add tasks</p>
                        </div>
                    ) : (
                        <div className="task-list">
                            {myTasks.map((task, index) => (
                                <div
                                    key={task.id}
                                    className="task-list-item"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className={`task-status-indicator ${task.status}`} />
                                    <div className="task-list-content">
                                        <h4 className={task.status === 'completed' ? 'completed' : ''}>
                                            {task.title}
                                        </h4>
                                        <div className="task-list-meta">
                                            <span className={`badge priority-${task.priority}`}>
                                                {task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'} {task.priority}
                                            </span>
                                            {task.dueDate && (
                                                <span className="task-due">
                                                    📅 {new Date(task.dueDate).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`badge status-${task.status}`}>
                                        {task.status.replace('_', ' ')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
        .dashboard {
          animation: fadeInUp 0.6s ease;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .welcome-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2.5rem;
          padding: 2rem 2.5rem;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(34, 211, 238, 0.05) 100%);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 20px;
          position: relative;
          overflow: hidden;
        }
        
        .welcome-section::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%);
          filter: blur(40px);
        }
        
        .welcome-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          letter-spacing: -0.02em;
        }
        
        .welcome-title .highlight {
          background: linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .welcome-subtitle {
          color: var(--text-secondary);
          font-size: 1rem;
        }
        
        .stat-card {
          position: relative;
        }
        
        .stat-trend {
          position: absolute;
          top: 1rem;
          right: 1rem;
          font-size: 0.75rem;
          padding: 0.25rem 0.625rem;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-secondary);
        }
        
        .stat-trend.positive {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }
        
        .stat-trend.warning {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
        }
        
        .progress-section {
          margin-bottom: 2.5rem;
        }
        
        .progress-card {
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: 16px;
          padding: 2rem;
        }
        
        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
        }
        
        .progress-header h3 {
          font-size: 1.1rem;
          font-weight: 600;
        }
        
        .progress-percentage {
          font-size: 1.75rem;
          font-weight: 700;
          background: linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .progress-bar-container {
          height: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 999px;
          overflow: hidden;
          margin-bottom: 1rem;
        }
        
        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #8b5cf6 0%, #22d3ee 100%);
          border-radius: 999px;
          transition: width 1s ease;
          position: relative;
        }
        
        .progress-bar-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
          animation: shimmer 2s infinite;
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .progress-text {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }
        
        .progress-text .completed {
          color: #10b981;
          font-weight: 600;
        }
        
        .progress-text .total {
          color: var(--text-primary);
          font-weight: 600;
        }
        
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.75rem;
        }
        
        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
          
          .welcome-section {
            flex-direction: column;
            text-align: center;
            gap: 1.5rem;
          }
        }
        
        .dashboard-card {
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: 16px;
          overflow: hidden;
        }
        
        .card-icon {
          font-size: 1.25rem;
        }
        
        .project-list, .task-list {
          padding: 0 1.5rem 1.5rem;
        }
        
        .project-list-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem;
          margin-bottom: 0.75rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid transparent;
          border-radius: 12px;
          text-decoration: none;
          color: inherit;
          transition: all 0.3s ease;
          animation: slideIn 0.4s ease backwards;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .project-list-item:hover {
          background: rgba(139, 92, 246, 0.08);
          border-color: rgba(139, 92, 246, 0.2);
          transform: translateX(8px);
        }
        
        .project-list-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .project-list-icon {
          width: 44px;
          height: 44px;
          background: rgba(139, 92, 246, 0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
        }
        
        .project-list-info h4 {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        
        .project-list-info p {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        
        .project-list-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.5rem;
        }
        
        .project-progress {
          width: 80px;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 999px;
          overflow: hidden;
        }
        
        .project-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #8b5cf6, #22d3ee);
          border-radius: 999px;
        }
        
        .task-list-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.25rem;
          margin-bottom: 0.75rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid transparent;
          border-radius: 12px;
          transition: all 0.3s ease;
          animation: slideIn 0.4s ease backwards;
        }
        
        .task-list-item:hover {
          background: rgba(139, 92, 246, 0.08);
          border-color: rgba(139, 92, 246, 0.2);
        }
        
        .task-status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        
        .task-status-indicator.todo {
          background: #71717a;
        }
        
        .task-status-indicator.in_progress {
          background: #3b82f6;
          animation: pulse 2s infinite;
        }
        
        .task-status-indicator.completed {
          background: #10b981;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .task-list-content {
          flex: 1;
        }
        
        .task-list-content h4 {
          font-weight: 500;
          margin-bottom: 0.375rem;
          transition: all 0.3s;
        }
        
        .task-list-content h4.completed {
          text-decoration: line-through;
          color: var(--text-muted);
        }
        
        .task-list-meta {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.8rem;
        }
        
        .task-due {
          color: var(--text-secondary);
        }
      `}</style>
        </div>
    );
};

export default Dashboard;
