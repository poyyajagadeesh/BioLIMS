import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit2, FlaskConical, Users, Calendar, TrendingUp, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const statusColors = {
    'Planning': 'status-planning', 'Active': 'status-active', 'On Hold': 'status-on-hold',
    'Completed': 'status-completed', 'Archived': 'status-archived', 'Planned': 'status-planned',
    'In Progress': 'status-in-progress', 'Paused': 'status-paused', 'Failed': 'status-failed',
};

export default function ProjectDetail() {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('experiments');
    const navigate = useNavigate();

    useEffect(() => {
        api.get(`/projects/${id}`).then(res => setProject(res.data)).catch(() => { toast.error('Project not found'); navigate('/projects'); }).finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="page-container"><div className="loading-screen" style={{ minHeight: '50vh' }}><div className="spinner" /></div></div>;
    if (!project) return null;

    const experiments = project.experiments || [];
    const ganttData = experiments.filter(e => e.start_date).map(e => {
        const projStart = project.start_date ? new Date(project.start_date) : new Date();
        const projEnd = project.end_date ? new Date(project.end_date) : new Date(projStart.getTime() + 180 * 24 * 60 * 60 * 1000);
        const totalDays = (projEnd - projStart) / (1000 * 60 * 60 * 24);
        const expStart = new Date(e.start_date);
        const expEnd = e.end_date ? new Date(e.end_date) : new Date(expStart.getTime() + 30 * 24 * 60 * 60 * 1000);
        const left = Math.max(0, ((expStart - projStart) / (1000 * 60 * 60 * 24)) / totalDays * 100);
        const width = Math.min(100 - left, ((expEnd - expStart) / (1000 * 60 * 60 * 24)) / totalDays * 100);
        return { ...e, left, width };
    });

    return (
        <div className="page-container">
            <button className="btn btn-ghost mb-16" onClick={() => navigate('/projects')}><ArrowLeft size={16} /> Back to Projects</button>

            <div className="card" style={{ marginBottom: 24, borderLeft: `4px solid ${project.color || '#6366f1'}` }}>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-12 mb-8">
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{project.name}</h2>
                            <span className={`badge ${statusColors[project.status]}`}>{project.status}</span>
                        </div>
                        <p className="text-secondary">{project.description}</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginTop: 20 }}>
                    <div><div className="text-xs text-muted mb-8">PROGRESS</div><div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#a5b4fc' }}>{project.progress}%</div><div className="progress-bar mt-8"><div className="progress-bar-fill" style={{ width: `${project.progress}%`, background: project.color }} /></div></div>
                    <div><div className="text-xs text-muted mb-8">EXPERIMENTS</div><div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{experiments.length}</div></div>
                    <div><div className="text-xs text-muted mb-8">TEAM</div><div className="avatar-group">{project.members?.map(m => <div key={m.id} className="user-avatar" style={{ background: m.avatar_color }} title={m.name}>{m.name?.charAt(0)}</div>)}</div></div>
                    <div><div className="text-xs text-muted mb-8">TIMELINE</div><div className="text-sm">{project.start_date ? format(new Date(project.start_date), 'MMM d, yyyy') : 'TBD'} → {project.end_date ? format(new Date(project.end_date), 'MMM d, yyyy') : 'TBD'}</div></div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button className={`tab ${tab === 'experiments' ? 'active' : ''}`} onClick={() => setTab('experiments')}>Experiments ({experiments.length})</button>
                <button className={`tab ${tab === 'gantt' ? 'active' : ''}`} onClick={() => setTab('gantt')}>Timeline / Gantt</button>
                <button className={`tab ${tab === 'team' ? 'active' : ''}`} onClick={() => setTab('team')}>Team</button>
            </div>

            {tab === 'experiments' && (
                <div className="card-grid card-grid-2">
                    {experiments.map(exp => (
                        <div key={exp.id} className="experiment-card" onClick={() => navigate(`/experiments/${exp.id}`)}>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 3, background: exp.type === 'Wet-lab' ? 'var(--gradient-success)' : 'var(--gradient-cool)' }} />
                            <div className="flex items-center justify-between mb-8">
                                <span className="exp-type" style={{ color: exp.type === 'Wet-lab' ? '#6ee7b7' : '#a5b4fc' }}>{exp.type}</span>
                                <span className={`badge ${statusColors[exp.status]}`}>{exp.status}</span>
                            </div>
                            <h4>{exp.name}</h4>
                            <div className="progress-label mt-8">{exp.progress}%</div>
                            <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${exp.progress}%` }} /></div>
                            {exp.members?.length > 0 && (
                                <div className="exp-footer mt-8">
                                    <div className="avatar-group">{exp.members.map(m => <div key={m.id} className="user-avatar" style={{ background: m.avatar_color }} title={m.name}>{m.name?.charAt(0)}</div>)}</div>
                                </div>
                            )}
                        </div>
                    ))}
                    {experiments.length === 0 && <div className="empty-state"><FlaskConical size={32} /><p>No experiments yet</p></div>}
                </div>
            )}

            {tab === 'gantt' && (
                <div className="card">
                    <h3 className="mb-16">Project Timeline</h3>
                    <div className="gantt-container">
                        {ganttData.map(exp => (
                            <div key={exp.id} className="gantt-row">
                                <div className="gantt-label">{exp.name}</div>
                                <div className="gantt-track">
                                    <div className="gantt-bar" style={{ left: `${exp.left}%`, width: `${Math.max(exp.width, 3)}%`, background: exp.status === 'Completed' ? 'var(--gradient-success)' : exp.type === 'Wet-lab' ? 'var(--gradient-primary)' : 'var(--gradient-cool)' }} title={`${exp.name}: ${exp.progress}%`}>
                                        {exp.width > 8 && <span>{exp.progress}%</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {ganttData.length === 0 && <p className="text-muted text-center">No experiments with dates to show</p>}
                    </div>
                </div>
            )}

            {tab === 'team' && (
                <div className="card-grid card-grid-2">
                    {project.members?.map(m => (
                        <div key={m.id} className="member-card">
                            <div className="user-avatar" style={{ background: m.avatar_color }}>{m.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                            <div className="member-info">
                                <h4>{m.name}</h4>
                                <p>{m.role} • {m.email}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
