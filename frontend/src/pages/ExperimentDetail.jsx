import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, X, CheckCircle, Beaker, Cpu, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const statusColors = {
    'Planned': 'status-planned', 'In Progress': 'status-in-progress', 'Paused': 'status-paused',
    'Completed': 'status-completed', 'Failed': 'status-failed', 'Pending': 'status-pending',
};

export default function ExperimentDetail() {
    const { id } = useParams();
    const [exp, setExp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('overview');
    const [showSubtaskForm, setShowSubtaskForm] = useState(false);
    const [subtaskForm, setSubtaskForm] = useState({ title: '', description: '', due_date: '' });
    const navigate = useNavigate();

    const fetchExp = () => api.get(`/experiments/${id}`).then(res => setExp(res.data)).catch(() => { toast.error('Not found'); navigate('/experiments'); }).finally(() => setLoading(false));

    useEffect(() => { fetchExp(); }, [id]);

    const addSubtask = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/experiments/${id}/subtasks`, subtaskForm);
            setSubtaskForm({ title: '', description: '', due_date: '' });
            setShowSubtaskForm(false);
            fetchExp();
            toast.success('Subtask added');
        } catch (err) { toast.error('Failed'); }
    };

    const toggleSubtask = async (subtask) => {
        const newStatus = subtask.status === 'Completed' ? 'Pending' : 'Completed';
        try {
            await api.put(`/experiments/${id}/subtasks/${subtask.id}`, { status: newStatus });
            fetchExp();
        } catch (err) { toast.error('Failed'); }
    };

    const deleteSubtask = async (sid) => {
        try { await api.delete(`/experiments/${id}/subtasks/${sid}`); fetchExp(); toast.success('Deleted'); } catch { toast.error('Failed'); }
    };

    if (loading) return <div className="page-container"><div className="loading-screen" style={{ minHeight: '50vh' }}><div className="spinner" /></div></div>;
    if (!exp) return null;

    const wet = exp.wetLabDetail;
    const dry = exp.dryLabDetail;

    return (
        <div className="page-container">
            <button className="btn btn-ghost mb-16" onClick={() => navigate('/experiments')}><ArrowLeft size={16} /> Back to Experiments</button>

            {/* Header Card */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 3, background: exp.type === 'Wet-lab' ? 'var(--gradient-success)' : 'var(--gradient-cool)', borderRadius: '16px 16px 0 0' }} />
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-12">
                        <span style={{ fontSize: '1.6rem' }}>{exp.type === 'Wet-lab' ? '🧫' : '💻'}</span>
                        <div>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{exp.name}</h2>
                            <p className="text-muted">{exp.type} Experiment {exp.project && <>• 📁 {exp.project.name}</>}</p>
                        </div>
                    </div>
                    <span className={`badge ${statusColors[exp.status]}`} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>{exp.status}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginTop: 16 }}>
                    <div><div className="text-xs text-muted mb-8">PROGRESS</div><div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#a5b4fc' }}>{exp.progress}%</div><div className="progress-bar mt-8"><div className="progress-bar-fill" style={{ width: `${exp.progress}%` }} /></div></div>
                    <div><div className="text-xs text-muted mb-8">SUBTASKS</div><div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{exp.subtasks?.filter(s => s.status === 'Completed').length || 0}/{exp.subtasks?.length || 0}</div></div>
                    <div><div className="text-xs text-muted mb-8">TEAM</div><div className="avatar-group">{exp.members?.map(m => <div key={m.id} className="user-avatar" style={{ background: m.avatar_color }} title={m.name}>{m.name?.charAt(0)}</div>)}</div></div>
                    <div><div className="text-xs text-muted mb-8">DATES</div><div className="text-sm">{exp.start_date ? format(new Date(exp.start_date), 'MMM d') : 'TBD'} → {exp.end_date ? format(new Date(exp.end_date), 'MMM d, yyyy') : 'TBD'}</div></div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button className={`tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>Overview</button>
                <button className={`tab ${tab === 'subtasks' ? 'active' : ''}`} onClick={() => setTab('subtasks')}>Subtasks ({exp.subtasks?.length || 0})</button>
                {exp.type === 'Wet-lab' && <button className={`tab ${tab === 'wetlab' ? 'active' : ''}`} onClick={() => setTab('wetlab')}>Wet-lab Details</button>}
                {(exp.type === 'Dry-lab' || exp.type === 'Computational') && <button className={`tab ${tab === 'drylab' ? 'active' : ''}`} onClick={() => setTab('drylab')}>Dry-lab Details</button>}
            </div>

            {/* Overview */}
            {tab === 'overview' && (
                <div className="card">
                    {exp.notes && <div className="detail-section"><h3>📝 Notes</h3><p className="text-secondary">{exp.notes}</p></div>}
                    {exp.observations && <div className="detail-section"><h3>🔬 Observations</h3><p className="text-secondary">{exp.observations}</p></div>}
                    {exp.protocol && <div className="detail-section"><h3>📋 Protocol</h3><p className="text-secondary">{exp.protocol.name} (v{exp.protocol.version}) — {exp.protocol.category}</p></div>}
                    {exp.members?.length > 0 && (
                        <div className="detail-section"><h3>👥 Assigned Members</h3><div className="flex gap-12" style={{ flexWrap: 'wrap' }}>{exp.members.map(m => (
                            <div key={m.id} className="member-card" style={{ minWidth: 200 }}>
                                <div className="user-avatar" style={{ background: m.avatar_color }}>{m.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                                <div className="member-info"><h4>{m.name}</h4><p>{m.role}</p></div>
                            </div>
                        ))}</div></div>
                    )}
                </div>
            )}

            {/* Subtasks */}
            {tab === 'subtasks' && (
                <div className="card">
                    <div className="flex items-center justify-between mb-16">
                        <h3>Subtasks</h3>
                        <button className="btn btn-primary btn-sm" onClick={() => setShowSubtaskForm(true)}><Plus size={14} /> Add Subtask</button>
                    </div>

                    {showSubtaskForm && (
                        <form onSubmit={addSubtask} style={{ marginBottom: 16, padding: 16, background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-primary)' }}>
                            <div className="form-row form-row-2">
                                <div className="form-group"><label>Title *</label><input className="form-control" value={subtaskForm.title} onChange={e => setSubtaskForm({ ...subtaskForm, title: e.target.value })} required placeholder="What needs to be done?" /></div>
                                <div className="form-group"><label>Due Date</label><input type="date" className="form-control" value={subtaskForm.due_date} onChange={e => setSubtaskForm({ ...subtaskForm, due_date: e.target.value })} /></div>
                            </div>
                            <div className="flex gap-8"><button type="submit" className="btn btn-primary btn-sm">Add</button><button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowSubtaskForm(false)}>Cancel</button></div>
                        </form>
                    )}

                    {exp.subtasks?.length === 0 ? (
                        <div className="empty-state" style={{ padding: 24 }}><CheckCircle size={32} /><p>No subtasks yet. Add subtasks to track experiment progress.</p></div>
                    ) : (
                        exp.subtasks?.map(st => (
                            <div key={st.id} className={`task-item ${st.status === 'Completed' ? 'completed' : ''}`}>
                                <div className={`task-checkbox ${st.status === 'Completed' ? 'checked' : ''}`} onClick={() => toggleSubtask(st)}>
                                    {st.status === 'Completed' && <CheckCircle size={14} color="white" />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div className="task-title">{st.title}</div>
                                    <div className="task-meta">
                                        {st.assignee && <span>{st.assignee.name}</span>}
                                        {st.due_date && <span>Due: {format(new Date(st.due_date), 'MMM d')}</span>}
                                    </div>
                                </div>
                                <span className={`badge ${statusColors[st.status]}`}>{st.status}</span>
                                <button className="btn btn-ghost btn-icon" onClick={() => deleteSubtask(st.id)}><Trash2 size={14} /></button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Wet-lab */}
            {tab === 'wetlab' && wet && (
                <div className="card">
                    <h3 className="mb-16">🧫 Wet-Lab Details</h3>
                    <div className="detail-grid">
                        <div className="detail-item"><label>Cell Line</label><div className="value">{wet.cell_line || '—'}</div></div>
                        <div className="detail-item"><label>Source</label><div className="value">{wet.cell_source || '—'}</div></div>
                        <div className="detail-item"><label>Passage #</label><div className="value">{wet.passage_number || '—'}</div></div>
                        <div className="detail-item"><label>Seeding Density</label><div className="value">{wet.seeding_density || '—'}</div></div>
                        <div className="detail-item"><label>FBS %</label><div className="value">{wet.fbs_percentage != null ? `${wet.fbs_percentage}%` : '—'}</div></div>
                        <div className="detail-item"><label>Antibiotics</label><div className="value">{wet.antibiotics || '—'}</div></div>
                    </div>
                    {wet.media_recipe && <div className="detail-section mt-16"><h3>Media Recipe</h3><p className="text-secondary">{wet.media_recipe}</p></div>}
                    {wet.treatment_drug && (
                        <div className="detail-section mt-16">
                            <h3>💊 Treatment</h3>
                            <div className="detail-grid">
                                <div className="detail-item"><label>Drug</label><div className="value">{wet.treatment_drug}</div></div>
                                <div className="detail-item"><label>Concentration</label><div className="value">{wet.treatment_concentration}</div></div>
                                <div className="detail-item"><label>Duration</label><div className="value">{wet.treatment_duration}</div></div>
                            </div>
                        </div>
                    )}
                    <div className="detail-section mt-16">
                        <h3>🌡️ Incubation Conditions</h3>
                        <div className="detail-grid">
                            <div className="detail-item"><label>Temperature</label><div className="value">{wet.incubation_temp != null ? `${wet.incubation_temp}°C` : '—'}</div></div>
                            <div className="detail-item"><label>CO₂</label><div className="value">{wet.incubation_co2 != null ? `${wet.incubation_co2}%` : '—'}</div></div>
                            <div className="detail-item"><label>Humidity</label><div className="value">{wet.incubation_humidity != null ? `${wet.incubation_humidity}%` : '—'}</div></div>
                        </div>
                    </div>
                    {wet.morphology_observations && <div className="detail-section mt-16"><h3>🔬 Morphology Observations</h3><p className="text-secondary">{wet.morphology_observations}</p></div>}
                </div>
            )}
            {tab === 'wetlab' && !wet && <div className="card"><div className="empty-state"><Beaker size={32} /><p>No wet-lab details recorded yet</p></div></div>}

            {/* Dry-lab */}
            {tab === 'drylab' && dry && (
                <div className="card">
                    <h3 className="mb-16">💻 Dry-Lab / Computational Details</h3>
                    <div className="detail-grid">
                        <div className="detail-item"><label>Algorithm</label><div className="value">{dry.algorithm_name || '—'}</div></div>
                        <div className="detail-item"><label>Script Version</label><div className="value">{dry.script_version || '—'}</div></div>
                        <div className="detail-item"><label>Git Reference</label><div className="value" style={{ fontFamily: 'monospace' }}>{dry.git_reference || '—'}</div></div>
                    </div>
                    {dry.dataset_description && <div className="detail-section mt-16"><h3>📊 Dataset</h3><p className="text-secondary">{dry.dataset_description}</p></div>}
                    {dry.parameters && Object.keys(dry.parameters).length > 0 && (
                        <div className="detail-section mt-16">
                            <h3>⚙️ Parameters</h3>
                            <div className="detail-grid">{Object.entries(dry.parameters).map(([k, v]) => <div key={k} className="detail-item"><label>{k}</label><div className="value">{String(v)}</div></div>)}</div>
                        </div>
                    )}
                    {dry.input_files?.length > 0 && <div className="detail-section mt-16"><h3>📥 Input Files</h3>{dry.input_files.map((f, i) => <span key={i} className="badge badge-cyan" style={{ margin: '0 4px 4px 0' }}>{f}</span>)}</div>}
                    {dry.output_files?.length > 0 && <div className="detail-section mt-16"><h3>📤 Output Files</h3>{dry.output_files.map((f, i) => <span key={i} className="badge badge-emerald" style={{ margin: '0 4px 4px 0' }}>{f}</span>)}</div>}
                    {dry.logs && <div className="detail-section mt-16"><h3>📜 Logs</h3><pre style={{ background: 'var(--bg-primary)', padding: 14, borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', overflowX: 'auto' }}>{dry.logs}</pre></div>}
                </div>
            )}
            {tab === 'drylab' && !dry && <div className="card"><div className="empty-state"><Cpu size={32} /><p>No dry-lab details recorded yet</p></div></div>}
        </div>
    );
}
