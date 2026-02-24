import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { Plus, Search, FlaskConical, X, Beaker, Cpu } from 'lucide-react';

const statusColors = {
    'Planned': 'status-planned', 'In Progress': 'status-in-progress', 'Paused': 'status-paused',
    'Completed': 'status-completed', 'Failed': 'status-failed',
};

export default function Experiments() {
    const [experiments, setExperiments] = useState([]);
    const [projects, setProjects] = useState([]);
    const [members, setMembers] = useState([]);
    const [protocols, setProtocols] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: '', type: 'Wet-lab', status: 'Planned', start_date: '', end_date: '', notes: '', project_id: '', protocol_id: '', member_ids: [] });
    const navigate = useNavigate();

    const fetchData = () => {
        Promise.all([
            api.get('/experiments', { params: { status: filter !== 'all' ? filter : undefined, type: typeFilter !== 'all' ? typeFilter : undefined, search: search || undefined } }),
            api.get('/projects'), api.get('/members'), api.get('/protocols')
        ]).then(([e, p, m, pr]) => { setExperiments(e.data); setProjects(p.data); setMembers(m.data); setProtocols(pr.data); }).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(() => { fetchData(); }, [filter, typeFilter, search]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/experiments', form);
            setExperiments(prev => [res.data, ...prev]);
            setShowModal(false);
            setForm({ name: '', type: 'Wet-lab', status: 'Planned', start_date: '', end_date: '', notes: '', project_id: '', protocol_id: '', member_ids: [] });
            toast.success('Experiment created');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to create');
        }
    };

    const toggleMember = (id) => {
        setForm(prev => ({ ...prev, member_ids: prev.member_ids.includes(id) ? prev.member_ids.filter(m => m !== id) : [...prev.member_ids, id] }));
    };

    return (
        <div className="page-container">
            <div className="flex items-center justify-between mb-24">
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Experiments</h2>
                    <p className="text-muted mt-8">Track and manage all lab experiments</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> New Experiment</button>
            </div>

            <div className="filter-bar">
                <div className="search-bar" style={{ minWidth: 240 }}>
                    <Search size={16} />
                    <input placeholder="Search experiments..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                {['all', 'In Progress', 'Planned', 'Paused', 'Completed', 'Failed'].map(s => (
                    <button key={s} className={`filter-chip ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>{s === 'all' ? 'All Status' : s}</button>
                ))}
                <div style={{ borderLeft: '1px solid var(--border-subtle)', height: 24, margin: '0 4px' }}></div>
                {['all', 'Wet-lab', 'Dry-lab', 'Computational'].map(t => (
                    <button key={t} className={`filter-chip ${typeFilter === t ? 'active' : ''}`} onClick={() => setTypeFilter(t)}>
                        {t === 'all' ? 'All Types' : t === 'Wet-lab' ? '🧫 Wet-lab' : t === 'Dry-lab' ? '💻 Dry-lab' : '🖥️ Computational'}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="loading-screen" style={{ minHeight: '40vh' }}><div className="spinner" /></div>
            ) : experiments.length === 0 ? (
                <div className="empty-state" style={{ minHeight: '40vh' }}><FlaskConical size={48} /><h3>No experiments found</h3><p>Create your first experiment to start tracking.</p></div>
            ) : (
                <div className="card-grid card-grid-3">
                    {experiments.map(exp => (
                        <div key={exp.id} className="experiment-card" onClick={() => navigate(`/experiments/${exp.id}`)}>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 3, background: exp.type === 'Wet-lab' ? 'var(--gradient-success)' : exp.type === 'Dry-lab' ? 'var(--gradient-cool)' : 'var(--gradient-primary)' }} />
                            <div className="flex items-center justify-between mb-8">
                                <span className="exp-type" style={{ color: exp.type === 'Wet-lab' ? '#6ee7b7' : exp.type === 'Dry-lab' ? '#67e8f9' : '#a5b4fc' }}>
                                    {exp.type === 'Wet-lab' ? '🧫' : exp.type === 'Dry-lab' ? '💻' : '🖥️'} {exp.type}
                                </span>
                                <span className={`badge ${statusColors[exp.status]}`}>{exp.status}</span>
                            </div>
                            <h4>{exp.name}</h4>
                            {exp.project && <p className="exp-project">📁 {exp.project.name}</p>}
                            {exp.protocol && <p className="text-xs text-muted">📋 {exp.protocol.name}</p>}
                            <div className="progress-label mt-8">{exp.progress}% complete</div>
                            <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${exp.progress}%` }} /></div>
                            <div className="exp-footer mt-8">
                                <div className="avatar-group">
                                    {exp.members?.slice(0, 3).map(m => <div key={m.id} className="user-avatar" style={{ background: m.avatar_color }} title={m.name}>{m.name?.charAt(0)}</div>)}
                                </div>
                                {exp.subtasks && <span className="text-xs text-muted">{exp.subtasks.filter(s => s.status === 'Completed').length}/{exp.subtasks.length} tasks</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Create New Experiment</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Experiment Name *</label>
                                    <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Cisplatin IC50 Determination" />
                                </div>
                                <div className="form-row form-row-3">
                                    <div className="form-group">
                                        <label>Type</label>
                                        <select className="form-control" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                            <option>Wet-lab</option><option>Dry-lab</option><option>Computational</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Status</label>
                                        <select className="form-control" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                            <option>Planned</option><option>In Progress</option><option>Paused</option><option>Completed</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Project</label>
                                        <select className="form-control" value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })}>
                                            <option value="">No project</option>
                                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row form-row-3">
                                    <div className="form-group"><label>Start Date</label><input type="date" className="form-control" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
                                    <div className="form-group"><label>End Date</label><input type="date" className="form-control" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
                                    <div className="form-group">
                                        <label>Protocol / SOP</label>
                                        <select className="form-control" value={form.protocol_id} onChange={e => setForm({ ...form, protocol_id: e.target.value })}>
                                            <option value="">None</option>
                                            {protocols.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group"><label>Notes</label><textarea className="form-control" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Experiment notes..." /></div>
                                <div className="form-group">
                                    <label>Assigned Members</label>
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
                                <button type="submit" className="btn btn-primary">Create Experiment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
