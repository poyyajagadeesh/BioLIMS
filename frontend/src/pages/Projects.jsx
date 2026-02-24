import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { Plus, Search, FolderKanban, X, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';

const statusColors = {
    'Planning': 'status-planning', 'Active': 'status-active', 'On Hold': 'status-on-hold',
    'Completed': 'status-completed', 'Archived': 'status-archived',
};

const projectColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#f59e0b'];

export default function Projects() {
    const [projects, setProjects] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: '', description: '', status: 'Planning', start_date: '', end_date: '', color: '#6366f1', member_ids: [] });
    const navigate = useNavigate();

    useEffect(() => {
        Promise.all([
            api.get('/projects', { params: { status: filter !== 'all' ? filter : undefined, search: search || undefined } }),
            api.get('/members')
        ]).then(([p, m]) => { setProjects(p.data); setMembers(m.data); }).catch(console.error).finally(() => setLoading(false));
    }, [filter, search]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/projects', form);
            setProjects(prev => [res.data, ...prev]);
            setShowModal(false);
            setForm({ name: '', description: '', status: 'Planning', start_date: '', end_date: '', color: '#6366f1', member_ids: [] });
            toast.success('Project created');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to create project');
        }
    };

    const toggleMember = (id) => {
        setForm(prev => ({
            ...prev,
            member_ids: prev.member_ids.includes(id) ? prev.member_ids.filter(m => m !== id) : [...prev.member_ids, id]
        }));
    };

    return (
        <div className="page-container">
            <div className="flex items-center justify-between mb-24">
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Projects</h2>
                    <p className="text-muted mt-8">Manage your research projects</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> New Project</button>
            </div>

            {/* Filters */}
            <div className="filter-bar">
                <div className="search-bar" style={{ minWidth: 240 }}>
                    <Search size={16} />
                    <input placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                {['all', 'Active', 'Planning', 'On Hold', 'Completed', 'Archived'].map(s => (
                    <button key={s} className={`filter-chip ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
                        {s === 'all' ? 'All' : s}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="loading-screen" style={{ minHeight: '40vh' }}><div className="spinner" /></div>
            ) : projects.length === 0 ? (
                <div className="empty-state" style={{ minHeight: '40vh' }}><FolderKanban size={48} /><h3>No projects found</h3><p>Create your first research project to get started.</p></div>
            ) : (
                <div className="card-grid card-grid-3">
                    {projects.map(project => (
                        <div key={project.id} className="project-card" onClick={() => navigate(`/projects/${project.id}`)}>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: project.color || '#6366f1', borderRadius: '16px 0 0 16px' }} />
                            <div className="flex items-center justify-between mb-8">
                                <span className={`badge ${statusColors[project.status]}`}>{project.status}</span>
                                {project.tags?.length > 0 && <span className="badge badge-gray">{project.tags[0]}</span>}
                            </div>
                            <h3>{project.name}</h3>
                            <p className="project-desc">{project.description}</p>
                            <div className="progress-label">{project.progress}% complete</div>
                            <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${project.progress}%`, background: project.color || 'var(--gradient-primary)' }} /></div>
                            <div className="project-meta">
                                <div className="avatar-group">
                                    {project.members?.slice(0, 4).map(m => (
                                        <div key={m.id} className="user-avatar" style={{ background: m.avatar_color }} title={m.name}>{m.name?.charAt(0)}</div>
                                    ))}
                                    {(project.members?.length || 0) > 4 && <div className="user-avatar" style={{ background: '#475569' }}>+{project.members.length - 4}</div>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {project.experiments && <span className="text-xs text-muted">{project.experiments.length} exp</span>}
                                    {project.start_date && <span className="text-xs text-muted">📅 {format(new Date(project.start_date), 'MMM d')}</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Create New Project</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Project Name *</label>
                                    <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Cancer Drug Resistance Study" />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea className="form-control" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the project objectives..." rows={3} />
                                </div>
                                <div className="form-row form-row-3">
                                    <div className="form-group">
                                        <label>Status</label>
                                        <select className="form-control" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                            {['Planning', 'Active', 'On Hold', 'Completed'].map(s => <option key={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Start Date</label>
                                        <input type="date" className="form-control" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>End Date</label>
                                        <input type="date" className="form-control" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Color</label>
                                    <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
                                        {projectColors.map(c => (
                                            <div key={c} onClick={() => setForm({ ...form, color: c })} style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: form.color === c ? '3px solid white' : '3px solid transparent', transition: 'all 0.15s' }} />
                                        ))}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Team Members</label>
                                    <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
                                        {members.map(m => (
                                            <div key={m.id} onClick={() => toggleMember(m.id)} className={`filter-chip ${form.member_ids.includes(m.id) ? 'active' : ''}`}>
                                                <div className="user-avatar" style={{ width: 20, height: 20, fontSize: '0.6rem', background: m.avatar_color }}>{m.name?.charAt(0)}</div>
                                                {m.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Project</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
