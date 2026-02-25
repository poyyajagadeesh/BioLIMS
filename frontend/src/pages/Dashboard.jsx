import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import {
    FolderKanban, FlaskConical, Users, CheckCircle, Clock, AlertTriangle,
    Plus, ArrowRight, Bell, Activity as ActivityIcon, TrendingUp
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const statusColors = {
    'Active': 'status-active', 'In Progress': 'status-in-progress', 'Planned': 'status-planned',
    'Planning': 'status-planning', 'Completed': 'status-completed', 'Pending': 'status-pending',
    'On Hold': 'status-on-hold', 'Paused': 'status-paused', 'Failed': 'status-failed', 'Archived': 'status-archived',
};

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/dashboard').then(res => setData(res.data)).catch(console.error).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="page-container"><div className="loading-screen" style={{ minHeight: '60vh' }}><div className="spinner" /><p>Loading dashboard...</p></div></div>;
    if (!data) return null;

    const { stats, todayTasks, activeExperiments, reminders, memberProgress, recentActivity } = data;
    const totalReminders = (reminders.today?.length || 0) + (reminders.overdue?.length || 0);

    return (
        <div className="page-container">
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
                    Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
                </h2>
                <p className="text-secondary" style={{ marginTop: 4 }}>{format(new Date(), 'EEEE, MMMM d, yyyy')} — Here's your lab overview</p>
            </div>

            {/* Stats */}
            <div className="card-grid card-grid-4" style={{ marginBottom: 24 }}>
                <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/projects')}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 3, background: 'var(--gradient-primary)' }} />
                    <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}><FolderKanban size={22} color="#6366f1" /></div>
                    <div className="stat-content">
                        <h4 style={{ color: '#a5b4fc' }}>{stats.activeProjects}<span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/{stats.totalProjects}</span></h4>
                        <p>Active Projects</p>
                    </div>
                </div>
                <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/experiments')}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 3, background: 'var(--gradient-success)' }} />
                    <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}><FlaskConical size={22} color="#10b981" /></div>
                    <div className="stat-content">
                        <h4 style={{ color: '#6ee7b7' }}>{stats.completedExperiments}<span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/{stats.totalExperiments}</span></h4>
                        <p>Experiments Done</p>
                    </div>
                </div>
                <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/members')}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 3, background: 'linear-gradient(135deg, #ec4899, #f43f5e)' }} />
                    <div className="stat-icon" style={{ background: 'rgba(236,72,153,0.15)' }}><Users size={22} color="#ec4899" /></div>
                    <div className="stat-content">
                        <h4 style={{ color: '#f9a8d4' }}>{stats.totalMembers}</h4>
                        <p>Lab Members</p>
                    </div>
                </div>
                <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/planner')}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 3, background: 'linear-gradient(135deg, #f97316, #f59e0b)' }} />
                    <div className="stat-icon" style={{ background: 'rgba(249,115,22,0.15)' }}><Clock size={22} color="#f97316" /></div>
                    <div className="stat-content">
                        <h4 style={{ color: '#fdba74' }}>{stats.pendingTasks}</h4>
                        <p>Pending Today</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-12" style={{ marginBottom: 24 }}>
                <button className="btn btn-primary" onClick={() => navigate('/projects')}><Plus size={16} /> New Project</button>
                <button className="btn btn-secondary" onClick={() => navigate('/experiments')}><FlaskConical size={16} /> New Experiment</button>
                <button className="btn btn-secondary" onClick={() => navigate('/protocols')}><Plus size={16} /> Add Protocol</button>
            </div>

            {/* Main Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
                {/* Left Column */}
                <div>
                    {/* Today's Schedule */}
                    <div className="card" style={{ marginBottom: 20 }}>
                        <div className="card-header">
                            <h3>📋 Today's Lab Work</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/planner')}>View All <ArrowRight size={14} /></button>
                        </div>
                        {todayTasks.length === 0 ? (
                            <div className="empty-state" style={{ padding: 24 }}><Clock size={32} /><p>No tasks scheduled for today</p></div>
                        ) : (
                            todayTasks.map(task => (
                                <div key={task.id} className={`task-item ${task.status === 'Completed' ? 'completed' : ''}`}>
                                    <div className={`task-checkbox ${task.status === 'Completed' ? 'checked' : ''}`}>
                                        {task.status === 'Completed' && <CheckCircle size={14} color="white" />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div className="task-title">{task.title}</div>
                                        <div className="task-meta">
                                            {task.user && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <div className="user-avatar" style={{ width: 18, height: 18, fontSize: '0.55rem', background: task.user.avatar_color }}>{task.user.name?.charAt(0)}</div>
                                                {task.user.name}
                                            </span>}
                                            {task.experiment && <span>• {task.experiment.name}</span>}
                                        </div>
                                    </div>
                                    <span className={`badge ${statusColors[task.status] || 'badge-gray'}`}>{task.status}</span>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Active Experiments */}
                    <div className="card" style={{ marginBottom: 20 }}>
                        <div className="card-header">
                            <h3>🧪 Experiments In Progress</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/experiments')}>View All <ArrowRight size={14} /></button>
                        </div>
                        {activeExperiments.length === 0 ? (
                            <div className="empty-state" style={{ padding: 24 }}><FlaskConical size={32} /><p>No active experiments</p></div>
                        ) : (
                            <div className="card-grid card-grid-2">
                                {activeExperiments.slice(0, 4).map(exp => (
                                    <div key={exp.id} className="experiment-card" onClick={() => navigate(`/experiments/${exp.id}`)}>
                                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 3, background: exp.type === 'Wet-lab' ? 'var(--gradient-success)' : 'var(--gradient-cool)' }} />
                                        <div className="exp-type" style={{ color: exp.type === 'Wet-lab' ? '#6ee7b7' : '#a5b4fc' }}>{exp.type}</div>
                                        <h4>{exp.name}</h4>
                                        {exp.project && <div className="exp-project">📁 {exp.project.name}</div>}
                                        <div className="progress-label">{exp.progress}% complete</div>
                                        <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${exp.progress}%` }} /></div>
                                        <div className="exp-footer">
                                            <div className="avatar-group">
                                                {exp.members?.slice(0, 3).map(m => (
                                                    <div key={m.id} className="user-avatar" style={{ background: m.avatar_color }} title={m.name}>{m.name?.charAt(0)}</div>
                                                ))}
                                            </div>
                                            <span className={`badge ${statusColors[exp.status]}`}>{exp.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Member Progress */}
                    <div className="card">
                        <div className="card-header">
                            <h3>👥 Team Overview</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/members')}>View All <ArrowRight size={14} /></button>
                        </div>
                        {memberProgress.map(member => {
                            const taskCount = member.dailyTasks?.length || 0;
                            const done = member.dailyTasks?.filter(t => t.status === 'Completed').length || 0;
                            return (
                                <div key={member.id} className="member-card" style={{ marginBottom: 8 }} onClick={() => navigate('/members')}>
                                    <div className="user-avatar" style={{ background: member.avatar_color }}>{member.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                                    <div className="member-info" style={{ flex: 1 }}>
                                        <h4>{member.name}</h4>
                                        <p>{member.role} {member.expertise?.length > 0 && `• ${member.expertise.slice(0, 2).join(', ')}`}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: taskCount > 0 ? '#a5b4fc' : 'var(--text-muted)' }}>
                                            {done}/{taskCount} tasks
                                        </div>
                                        {taskCount > 0 && (
                                            <div className="progress-bar" style={{ width: 80, marginTop: 4 }}>
                                                <div className="progress-bar-fill" style={{ width: `${taskCount > 0 ? (done / taskCount * 100) : 0}%` }} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Column */}
                <div>
                    {/* Reminders */}
                    <div className="card" style={{ marginBottom: 20 }}>
                        <div className="card-header">
                            <h3>🔔 Reminders {totalReminders > 0 && <span className="badge badge-rose">{totalReminders}</span>}</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/reminders')}>All <ArrowRight size={14} /></button>
                        </div>

                        {reminders.overdue?.length > 0 && (
                            <div style={{ marginBottom: 12 }}>
                                <div className="text-xs text-muted mb-8" style={{ fontWeight: 600, textTransform: 'uppercase', color: '#fca5a5' }}>⚠️ Overdue</div>
                                {reminders.overdue.map(r => (
                                    <div key={r.id} className="reminder-item" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
                                        <div className="reminder-icon" style={{ background: 'rgba(239,68,68,0.15)' }}><AlertTriangle size={16} color="#ef4444" /></div>
                                        <div className="reminder-content">
                                            <h4>{r.title}</h4>
                                            <p>{r.description}</p>
                                        </div>
                                        <div className="reminder-time" style={{ color: '#fca5a5' }}>{formatDistanceToNow(new Date(r.due_date), { addSuffix: true })}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {reminders.today?.length > 0 && (
                            <div style={{ marginBottom: 12 }}>
                                <div className="text-xs text-muted mb-8" style={{ fontWeight: 600, textTransform: 'uppercase' }}>Today</div>
                                {reminders.today.map(r => (
                                    <div key={r.id} className="reminder-item">
                                        <div className="reminder-icon" style={{ background: 'rgba(99,102,241,0.15)' }}><Bell size={16} color="#6366f1" /></div>
                                        <div className="reminder-content">
                                            <h4>{r.title}</h4>
                                            <p>{r.description}</p>
                                        </div>
                                        <div className="reminder-time">{format(new Date(r.due_date), 'h:mm a')}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {reminders.week?.length > 0 && (
                            <div>
                                <div className="text-xs text-muted mb-8" style={{ fontWeight: 600, textTransform: 'uppercase' }}>This Week</div>
                                {reminders.week.slice(0, 4).map(r => (
                                    <div key={r.id} className="reminder-item">
                                        <div className="reminder-icon" style={{ background: 'rgba(20,184,166,0.15)' }}><Clock size={16} color="#14b8a6" /></div>
                                        <div className="reminder-content">
                                            <h4>{r.title}</h4>
                                            <p>{r.description}</p>
                                        </div>
                                        <div className="reminder-time">{format(new Date(r.due_date), 'EEE, MMM d')}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {totalReminders === 0 && reminders.week?.length === 0 && (
                            <div className="empty-state" style={{ padding: 20 }}><Bell size={28} /><p>No upcoming reminders</p></div>
                        )}
                    </div>

                    {/* Recent Activity */}
                    <div className="card">
                        <div className="card-header">
                            <h3>📝 Recent Activity</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/activity')}>All <ArrowRight size={14} /></button>
                        </div>
                        <div className="timeline">
                            {recentActivity.slice(0, 8).map(act => (
                                <div key={act.id} className="timeline-item">
                                    <div className="time">{formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}</div>
                                    <div className="content">
                                        <strong>{act.user?.name || 'System'}</strong> {act.action}
                                        {act.entity_name && <> — <em>{act.entity_name}</em></>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
