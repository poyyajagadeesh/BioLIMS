import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Search, X, PenTool, CheckCircle, Trash2, Save, Upload, Download, File, Shield, Eye, EyeOff, Lock } from 'lucide-react';
import { format } from 'date-fns';

const statusColors = {
    'Idea': 'status-planned', 'Outlining': 'status-planned', 'Drafting': 'status-in-progress',
    'Internal Review': 'status-in-progress', 'Revision': 'status-paused', 'Submitted': 'status-active',
    'Under Review': 'status-active', 'Accepted': 'status-completed', 'Published': 'status-completed',
};

const statusEmojis = {
    'Idea': '💡', 'Outlining': '📝', 'Drafting': '✍️', 'Internal Review': '👀',
    'Revision': '🔄', 'Submitted': '📤', 'Under Review': '⏳', 'Accepted': '✅', 'Published': '🎉',
};

const sectionColors = {
    'Introduction': '#6366f1', 'Methods': '#10b981', 'Results': '#f97316', 'Discussion': '#ec4899',
    'References': '#8b5cf6', 'Figures': '#14b8a6', 'Supplementary': '#f59e0b', 'Other': '#64748b',
};

const visibilityOptions = [
    { value: 'public', label: '🌐 Public', color: '#10b981' },
    { value: 'restricted', label: '👥 Restricted', color: '#f59e0b' },
    { value: 'private', label: '🔒 Private', color: '#ef4444' },
];

function formatSize(bytes) {
    if (!bytes) return '—';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function Manuscripts() {
    const { user } = useAuth();
    const [manuscripts, setManuscripts] = useState([]);
    const [projects, setProjects] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showDetail, setShowDetail] = useState(null);
    const [form, setForm] = useState({ title: '', description: '', status: 'Idea', target_journal: '', submission_deadline: '', abstract: '', keywords: [], notes: '', project_id: '', visibility: 'public', author_ids: [] });
    const [keywordInput, setKeywordInput] = useState('');
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [taskForm, setTaskForm] = useState({ title: '', section: 'Other', due_date: '', assigned_to: '' });
    const [uploading, setUploading] = useState(false);

    const isAdmin = user?.role === 'Admin' || user?.role === 'PI';

    const fetchData = () => {
        Promise.all([
            api.get('/manuscripts', { params: { status: filter !== 'all' ? filter : undefined, search: search || undefined } }),
            api.get('/projects'), api.get('/members'),
        ]).then(([m, p, mem]) => { setManuscripts(m.data); setProjects(p.data); setMembers(mem.data); }).catch(console.error).finally(() => setLoading(false));
    };

    const fetchDetail = (id) => {
        api.get(`/manuscripts/${id}`).then(res => setShowDetail(res.data)).catch(() => toast.error('Failed to load'));
    };

    useEffect(() => { fetchData(); }, [filter, search]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/manuscripts', form);
            setManuscripts(prev => [res.data, ...prev]);
            setShowModal(false);
            setForm({ title: '', description: '', status: 'Idea', target_journal: '', submission_deadline: '', abstract: '', keywords: [], notes: '', project_id: '', visibility: 'public', author_ids: [] });
            toast.success('Manuscript created');
        } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this manuscript?')) return;
        try { await api.delete(`/manuscripts/${id}`); setManuscripts(prev => prev.filter(m => m.id !== id)); setShowDetail(null); toast.success('Deleted'); } catch { toast.error('Failed'); }
    };

    const updateVisibility = async (vis) => {
        try {
            await api.put(`/manuscripts/${showDetail.id}`, { visibility: vis });
            fetchDetail(showDetail.id);
            toast.success('Visibility updated');
        } catch { toast.error('Failed'); }
    };

    const addKeyword = () => {
        if (keywordInput.trim() && !form.keywords.includes(keywordInput.trim())) {
            setForm(prev => ({ ...prev, keywords: [...prev.keywords, keywordInput.trim()] }));
            setKeywordInput('');
        }
    };

    const toggleAuthor = (id) => {
        setForm(prev => ({ ...prev, author_ids: prev.author_ids.includes(id) ? prev.author_ids.filter(a => a !== id) : [...prev.author_ids, id] }));
    };

    const addTask = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/manuscripts/${showDetail.id}/tasks`, taskForm);
            setTaskForm({ title: '', section: 'Other', due_date: '', assigned_to: '' });
            setShowTaskForm(false);
            fetchDetail(showDetail.id);
            toast.success('Task added');
        } catch { toast.error('Failed'); }
    };

    const toggleTask = async (task) => {
        const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
        try { await api.put(`/manuscripts/${showDetail.id}/tasks/${task.id}`, { status: newStatus }); fetchDetail(showDetail.id); } catch { toast.error('Failed'); }
    };

    const deleteTask = async (tid) => {
        try { await api.delete(`/manuscripts/${showDetail.id}/tasks/${tid}`); fetchDetail(showDetail.id); toast.success('Deleted'); } catch { toast.error('Failed'); }
    };

    // File handlers
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('entity_type', 'manuscript');
        formData.append('entity_id', showDetail.id);
        try {
            await api.post('/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            fetchDetail(showDetail.id);
            toast.success('File uploaded');
        } catch { toast.error('Upload failed'); }
        finally { setUploading(false); e.target.value = ''; }
    };

    const deleteFile = async (fileId) => {
        try { await api.delete(`/files/${fileId}`); fetchDetail(showDetail.id); toast.success('File deleted'); } catch { toast.error('Failed'); }
    };

    return (
        <div className="page-container">
            <div className="flex items-center justify-between mb-24">
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Manuscript Writing</h2>
                    <p className="text-muted mt-8">Track manuscript preparation and submission</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> New Manuscript</button>
            </div>

            <div className="filter-bar">
                <div className="search-bar" style={{ minWidth: 240 }}><Search size={16} /><input placeholder="Search manuscripts..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                {['all', 'Idea', 'Drafting', 'Internal Review', 'Submitted', 'Under Review', 'Published'].map(s => (
                    <button key={s} className={`filter-chip ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>{s === 'all' ? 'All' : `${statusEmojis[s] || ''} ${s}`}</button>
                ))}
            </div>

            {loading ? (
                <div className="loading-screen" style={{ minHeight: '40vh' }}><div className="spinner" /></div>
            ) : manuscripts.length === 0 ? (
                <div className="empty-state" style={{ minHeight: '40vh' }}><PenTool size={48} /><h3>No manuscripts yet</h3><p>Start tracking your manuscript writing progress.</p></div>
            ) : (
                <div className="card-grid card-grid-3">
                    {manuscripts.map(ms => (
                        <div key={ms.id} className="experiment-card" onClick={() => fetchDetail(ms.id)}>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 3, background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }} />
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-8">
                                    <span style={{ fontSize: '1.2rem' }}>{statusEmojis[ms.status] || '📄'}</span>
                                    {ms.visibility && ms.visibility !== 'public' && (
                                        <span className="badge" style={{ background: ms.visibility === 'private' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: ms.visibility === 'private' ? '#fca5a5' : '#fcd34d', fontSize: '0.65rem', padding: '1px 6px' }}>
                                            {ms.visibility === 'private' ? <Lock size={8} /> : <EyeOff size={8} />} {ms.visibility}
                                        </span>
                                    )}
                                </div>
                                <span className={`badge ${statusColors[ms.status] || 'badge-gray'}`}>{ms.status}</span>
                            </div>
                            <h4>{ms.title}</h4>
                            {ms.target_journal && <p className="text-xs text-muted" style={{ marginTop: 4 }}>📰 {ms.target_journal}</p>}
                            {ms.project && <p className="exp-project">📁 {ms.project.name}</p>}
                            <div className="progress-label mt-8">{ms.progress || 0}% complete</div>
                            <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${ms.progress || 0}%` }} /></div>
                            <div className="exp-footer mt-8">
                                <div className="avatar-group">
                                    {ms.authors?.slice(0, 3).map(a => <div key={a.id} className="user-avatar" style={{ background: a.avatar_color }} title={a.name}>{a.name?.charAt(0)}</div>)}
                                </div>
                                {ms.tasks && <span className="text-xs text-muted">{ms.tasks.filter(t => t.status === 'Completed').length}/{ms.tasks.length} tasks</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Detail Drawer */}
            {showDetail && (
                <div className="modal-overlay" onClick={() => setShowDetail(null)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ maxHeight: '85vh', overflow: 'auto' }}>
                        <div className="modal-header">
                            <div>
                                <h2>{showDetail.title}</h2>
                                <p className="text-muted">{showDetail.target_journal ? `📰 ${showDetail.target_journal}` : 'No target journal set'}</p>
                            </div>
                            <div className="flex gap-8">
                                <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(showDetail.id)} style={{ color: '#ef4444' }}><Trash2 size={16} /></button>
                                <button className="btn btn-ghost btn-icon" onClick={() => setShowDetail(null)}><X size={18} /></button>
                            </div>
                        </div>
                        <div className="modal-body">
                            <div className="flex items-center gap-8 mb-16" style={{ flexWrap: 'wrap' }}>
                                <span className={`badge ${statusColors[showDetail.status]}`} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>{statusEmojis[showDetail.status]} {showDetail.status}</span>
                                <span className="text-sm text-muted">{showDetail.progress || 0}% complete</span>
                                {/* Visibility control for admin */}
                                {isAdmin && (
                                    <div className="flex items-center gap-4" style={{ marginLeft: 'auto' }}>
                                        <Shield size={14} color="#64748b" />
                                        {visibilityOptions.map(v => (
                                            <button key={v.value} onClick={() => updateVisibility(v.value)}
                                                className={`badge`}
                                                style={{
                                                    background: (showDetail.visibility || 'public') === v.value ? `${v.color}30` : 'transparent',
                                                    color: (showDetail.visibility || 'public') === v.value ? v.color : '#64748b',
                                                    border: `1px solid ${(showDetail.visibility || 'public') === v.value ? v.color : 'transparent'}`,
                                                    cursor: 'pointer', fontSize: '0.68rem', padding: '3px 8px',
                                                }}>{v.label}</button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {showDetail.abstract && (
                                <div className="detail-section mb-16">
                                    <h3>📋 Abstract</h3>
                                    <p className="text-secondary" style={{ lineHeight: 1.7 }}>{showDetail.abstract}</p>
                                </div>
                            )}

                            {showDetail.keywords?.length > 0 && (
                                <div className="flex gap-8 mb-16" style={{ flexWrap: 'wrap' }}>
                                    {showDetail.keywords.map((k, i) => <span key={i} className="badge badge-indigo">{k}</span>)}
                                </div>
                            )}

                            {showDetail.authors?.length > 0 && (
                                <div className="detail-section mb-16">
                                    <h3>👥 Authors</h3>
                                    <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
                                        {showDetail.authors.map((a, i) => (
                                            <div key={a.id} className="member-card" style={{ minWidth: 180 }}>
                                                <div className="user-avatar" style={{ background: a.avatar_color }}>{a.name?.charAt(0)}</div>
                                                <div className="member-info"><h4>{a.name}</h4><p>{i === 0 ? 'Corresponding' : `Author ${i + 1}`}</p></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Files Section */}
                            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16, marginBottom: 16 }}>
                                <div className="flex items-center justify-between mb-12">
                                    <h3>📎 Manuscript Files</h3>
                                    <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
                                        <Upload size={14} /> Upload File
                                        <input type="file" hidden onChange={handleFileUpload} disabled={uploading} />
                                    </label>
                                </div>
                                {(!showDetail.files || showDetail.files.length === 0) ? (
                                    <div style={{ padding: '16px 0', textAlign: 'center' }}>
                                        <p className="text-muted text-sm">No files uploaded yet. Upload drafts, figures, supplementary materials, etc.</p>
                                    </div>
                                ) : (
                                    showDetail.files.map(f => (
                                        <div key={f.id} className="task-item" style={{ padding: '8px 12px' }}>
                                            <File size={16} color="#8b5cf6" />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{f.original_name}</div>
                                                <div className="text-xs text-muted">{formatSize(f.size)} • {format(new Date(f.createdAt), 'MMM d, yyyy')}</div>
                                            </div>
                                            <a href={`/api/files/${f.id}/download`} className="btn btn-ghost btn-icon" title="Download"><Download size={14} /></a>
                                            <button className="btn btn-ghost btn-icon" onClick={() => deleteFile(f.id)} style={{ color: '#ef4444' }}><Trash2 size={14} /></button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Tasks */}
                            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
                                <div className="flex items-center justify-between mb-12">
                                    <h3>✅ Writing Tasks</h3>
                                    <button className="btn btn-primary btn-sm" onClick={() => setShowTaskForm(true)}><Plus size={14} /> Add Task</button>
                                </div>

                                {showTaskForm && (
                                    <form onSubmit={addTask} style={{ marginBottom: 16, padding: 12, background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-primary)' }}>
                                        <div className="form-row form-row-2">
                                            <div className="form-group"><label>Task *</label><input className="form-control" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required placeholder="Write introduction paragraph" /></div>
                                            <div className="form-group"><label>Section</label><select className="form-control" value={taskForm.section} onChange={e => setTaskForm({ ...taskForm, section: e.target.value })}>
                                                {['Introduction', 'Methods', 'Results', 'Discussion', 'References', 'Figures', 'Supplementary', 'Other'].map(s => <option key={s}>{s}</option>)}
                                            </select></div>
                                        </div>
                                        <div className="form-row form-row-2">
                                            <div className="form-group"><label>Assign To</label><select className="form-control" value={taskForm.assigned_to} onChange={e => setTaskForm({ ...taskForm, assigned_to: e.target.value })}><option value="">Unassigned</option>{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
                                            <div className="form-group"><label>Due Date</label><input type="date" className="form-control" value={taskForm.due_date} onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })} /></div>
                                        </div>
                                        <div className="flex gap-8"><button type="submit" className="btn btn-primary btn-sm">Add</button><button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowTaskForm(false)}>Cancel</button></div>
                                    </form>
                                )}

                                {(!showDetail.tasks || showDetail.tasks.length === 0) ? (
                                    <p className="text-muted text-sm" style={{ padding: '16px 0' }}>No writing tasks yet.</p>
                                ) : (
                                    showDetail.tasks.map(task => (
                                        <div key={task.id} className={`task-item ${task.status === 'Completed' ? 'completed' : ''}`}>
                                            <div className={`task-checkbox ${task.status === 'Completed' ? 'checked' : ''}`} onClick={() => toggleTask(task)}>
                                                {task.status === 'Completed' && <CheckCircle size={14} color="white" />}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div className="task-title">{task.title}</div>
                                                <div className="task-meta">
                                                    <span className="badge" style={{ background: `${sectionColors[task.section]}20`, color: sectionColors[task.section], fontSize: '0.7rem', padding: '2px 8px' }}>{task.section}</span>
                                                    {task.assignee && <span>{task.assignee.name}</span>}
                                                    {task.due_date && <span>Due: {format(new Date(task.due_date), 'MMM d')}</span>}
                                                </div>
                                            </div>
                                            <button className="btn btn-ghost btn-icon" onClick={() => deleteTask(task.id)}><Trash2 size={14} /></button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>New Manuscript</h2><button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button></div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body">
                                <div className="form-group"><label>Title *</label><input className="form-control" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="Manuscript title" /></div>
                                <div className="form-row form-row-3">
                                    <div className="form-group"><label>Status</label><select className="form-control" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                        {['Idea', 'Outlining', 'Drafting', 'Internal Review', 'Revision', 'Submitted', 'Under Review', 'Accepted', 'Published'].map(s => <option key={s}>{s}</option>)}
                                    </select></div>
                                    <div className="form-group"><label>Target Journal</label><input className="form-control" value={form.target_journal} onChange={e => setForm({ ...form, target_journal: e.target.value })} placeholder="Nature, Science..." /></div>
                                    <div className="form-group"><label>Submission Deadline</label><input type="date" className="form-control" value={form.submission_deadline} onChange={e => setForm({ ...form, submission_deadline: e.target.value })} /></div>
                                </div>
                                <div className="form-row form-row-2">
                                    <div className="form-group"><label>Project (optional)</label><select className="form-control" value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })}><option value="">None</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                                    {isAdmin && (
                                        <div className="form-group">
                                            <label><Shield size={14} style={{ verticalAlign: 'middle' }} /> Access Control</label>
                                            <select className="form-control" value={form.visibility} onChange={e => setForm({ ...form, visibility: e.target.value })}>
                                                <option value="public">🌐 Public — All members</option>
                                                <option value="restricted">👥 Restricted — Authors only</option>
                                                <option value="private">🔒 Private — Admin/PI only</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                                <div className="form-group"><label>Abstract</label><textarea className="form-control" value={form.abstract} onChange={e => setForm({ ...form, abstract: e.target.value })} rows={3} placeholder="Manuscript abstract..." /></div>
                                <div className="form-group">
                                    <label>Keywords</label>
                                    <div className="flex gap-8 items-center">
                                        <input className="form-control" value={keywordInput} onChange={e => setKeywordInput(e.target.value)} placeholder="Add keyword" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeyword())} style={{ flex: 1 }} />
                                        <button type="button" className="btn btn-secondary btn-sm" onClick={addKeyword}>Add</button>
                                    </div>
                                    {form.keywords.length > 0 && <div className="flex gap-8 mt-8" style={{ flexWrap: 'wrap' }}>{form.keywords.map((k, i) => <span key={i} className="badge badge-indigo" style={{ cursor: 'pointer' }} onClick={() => setForm(prev => ({ ...prev, keywords: prev.keywords.filter((_, j) => j !== i) }))}>{k} ×</span>)}</div>}
                                </div>
                                <div className="form-group"><label>Notes</label><textarea className="form-control" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Additional notes..." /></div>
                                <div className="form-group">
                                    <label>Authors</label>
                                    <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
                                        {members.map(m => (
                                            <div key={m.id} onClick={() => toggleAuthor(m.id)} className={`filter-chip ${form.author_ids.includes(m.id) ? 'active' : ''}`}>
                                                <div className="user-avatar" style={{ width: 20, height: 20, fontSize: '0.6rem', background: m.avatar_color }}>{m.name?.charAt(0)}</div>
                                                {m.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create Manuscript</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
