import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Search, BookOpen, X, Edit2, Trash2, Clock, User, History, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

const categories = ['All', 'Cell Culture', 'Western Blot', 'qPCR', 'NGS', 'Microscopy', 'Animal Work', 'Bioinformatics', 'Other'];
const catColors = { 'Cell Culture': 'badge-emerald', 'Western Blot': 'badge-violet', 'qPCR': 'badge-orange', 'NGS': 'badge-cyan', 'Microscopy': 'badge-pink', 'Animal Work': 'badge-amber', 'Bioinformatics': 'badge-blue', 'Other': 'badge-gray' };

export default function Protocols() {
    const { user } = useAuth();
    const [protocols, setProtocols] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState({ name: '', category: 'Other', description: '', content: '', version: '1.0', tags: '' });

    // Edit mode state
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    // History panel
    const [showHistory, setShowHistory] = useState(null);

    const isAdmin = user?.role === 'Admin' || user?.role === 'PI';

    const fetchProtocols = () => {
        api.get('/protocols', { params: { category: filter !== 'All' ? filter : undefined, search: search || undefined } })
            .then(res => setProtocols(res.data)).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(() => { fetchProtocols(); }, [filter, search]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) };
            const res = await api.post('/protocols', payload);
            setProtocols(prev => [res.data, ...prev]);
            setShowModal(false);
            setForm({ name: '', category: 'Other', description: '', content: '', version: '1.0', tags: '' });
            toast.success('Protocol created');
        } catch (err) { toast.error('Failed'); }
    };

    const startEdit = (p) => {
        setEditingId(p.id);
        setEditForm({
            name: p.name,
            category: p.category,
            description: p.description || '',
            content: p.content || '',
            version: p.version || '1.0',
            tags: (p.tags || []).join(', '),
        });
    };

    const saveEdit = async () => {
        try {
            const payload = { ...editForm, tags: editForm.tags.split(',').map(t => t.trim()).filter(Boolean) };
            const res = await api.put(`/protocols/${editingId}`, payload);
            setProtocols(prev => prev.map(p => p.id === editingId ? res.data : p));
            setEditingId(null);
            setEditForm({});
            toast.success('Protocol updated');
        } catch (err) { toast.error(err.response?.data?.error || 'Failed to update'); }
    };

    const deleteProtocol = async (id) => {
        if (!confirm('Are you sure you want to delete this protocol?')) return;
        try {
            await api.delete(`/protocols/${id}`);
            setProtocols(prev => prev.filter(p => p.id !== id));
            toast.success('Protocol deleted');
        } catch (err) { toast.error('Failed to delete'); }
    };

    return (
        <div className="page-container">
            <div className="flex items-center justify-between mb-24">
                <div><h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Protocols & SOPs</h2><p className="text-muted mt-8">Your lab's standard operating procedures</p></div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Add Protocol</button>
            </div>

            <div className="filter-bar">
                <div className="search-bar" style={{ minWidth: 240 }}><Search size={16} /><input placeholder="Search protocols..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                {categories.map(c => <button key={c} className={`filter-chip ${filter === c ? 'active' : ''}`} onClick={() => setFilter(c)}>{c}</button>)}
            </div>

            {loading ? <div className="loading-screen" style={{ minHeight: '40vh' }}><div className="spinner" /></div> : protocols.length === 0 ? (
                <div className="empty-state" style={{ minHeight: '40vh' }}><BookOpen size={48} /><h3>No protocols found</h3></div>
            ) : (
                <div className="card-grid card-grid-3">
                    {protocols.map(p => (
                        <div key={p.id} className="protocol-card" style={{ position: 'relative' }}>
                            {/* Action buttons */}
                            <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 4, zIndex: 2 }}>
                                <button className="btn btn-ghost btn-icon" onClick={(e) => { e.stopPropagation(); startEdit(p); }} title="Edit Protocol" style={{ width: 28, height: 28 }}>
                                    <Edit2 size={13} />
                                </button>
                                <button className="btn btn-ghost btn-icon" onClick={(e) => { e.stopPropagation(); setShowHistory(showHistory === p.id ? null : p.id); }} title="Edit History" style={{ width: 28, height: 28 }}>
                                    <History size={13} />
                                </button>
                                {isAdmin && (
                                    <button className="btn btn-ghost btn-icon" onClick={(e) => { e.stopPropagation(); deleteProtocol(p.id); }} title="Delete Protocol" style={{ width: 28, height: 28, color: '#ef4444' }}>
                                        <Trash2 size={13} />
                                    </button>
                                )}
                            </div>

                            <div onClick={() => setSelected(selected?.id === p.id ? null : p)}>
                                <div className={`protocol-category badge ${catColors[p.category] || 'badge-gray'}`}>{p.category}</div>
                                <h4>{p.name}</h4>
                                <p className="protocol-desc">{p.description}</p>
                                <div className="protocol-meta">
                                    <span>v{p.version}</span>
                                    {p.creator && <span>by {p.creator.name}</span>}
                                </div>

                                {/* Last edited info */}
                                {p.last_edited_at && (
                                    <div style={{ marginTop: 8, padding: '6px 10px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-xs)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                        <Clock size={10} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                        Last edited by <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{p.lastEditor?.name || 'Unknown'}</span>
                                        {' '}on {format(new Date(p.last_edited_at), 'MMM d, yyyy h:mm a')}
                                    </div>
                                )}

                                {p.tags?.length > 0 && (
                                    <div className="flex gap-8 mt-8" style={{ flexWrap: 'wrap' }}>
                                        {p.tags.map(t => <span key={t} className="badge badge-gray">{t}</span>)}
                                    </div>
                                )}

                                {selected?.id === p.id && p.content && (
                                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                                        <div className="text-xs text-muted mb-8" style={{ fontWeight: 600 }}>PROCEDURE</div>
                                        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{p.content}</pre>
                                    </div>
                                )}
                            </div>

                            {/* Edit History Panel */}
                            {showHistory === p.id && (
                                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }} onClick={e => e.stopPropagation()}>
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="text-xs text-muted" style={{ fontWeight: 600 }}>
                                            <History size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                            EDIT HISTORY
                                        </div>
                                        <button className="btn btn-ghost btn-icon" onClick={() => setShowHistory(null)} style={{ width: 22, height: 22 }}>
                                            <X size={12} />
                                        </button>
                                    </div>
                                    {(!p.edit_history || p.edit_history.length === 0) ? (
                                        <p className="text-xs text-muted" style={{ padding: '8px 0' }}>No edit history yet</p>
                                    ) : (
                                        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                                            {p.edit_history.map((entry, idx) => (
                                                <div key={idx} style={{
                                                    padding: '8px 10px',
                                                    marginBottom: 6,
                                                    background: 'var(--bg-primary)',
                                                    borderRadius: 'var(--radius-xs)',
                                                    fontSize: '0.75rem',
                                                    borderLeft: '3px solid var(--accent-primary)',
                                                }}>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                                                        <User size={10} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                                        {entry.edited_by_name || 'Unknown User'}
                                                    </div>
                                                    <div style={{ color: 'var(--text-muted)' }}>
                                                        <Clock size={10} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                                        {format(new Date(entry.edited_at), 'MMM d, yyyy h:mm a')}
                                                    </div>
                                                    <div style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
                                                        Changed: <span style={{ fontWeight: 500 }}>{entry.changes}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>Add Protocol / SOP</h2><button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button></div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body">
                                <div className="form-group"><label>Protocol Name *</label><input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                                <div className="form-row form-row-3">
                                    <div className="form-group"><label>Category</label><select className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{categories.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}</select></div>
                                    <div className="form-group"><label>Version</label><input className="form-control" value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} /></div>
                                    <div className="form-group"><label>Tags (comma-separated)</label><input className="form-control" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="viability, MTT" /></div>
                                </div>
                                <div className="form-group"><label>Description</label><textarea className="form-control" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
                                <div className="form-group"><label>Procedure / Content</label><textarea className="form-control" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={8} placeholder="Step by step procedure..." /></div>
                            </div>
                            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create Protocol</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingId && (
                <div className="modal-overlay" onClick={() => setEditingId(null)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ maxHeight: '85vh', overflow: 'auto' }}>
                        <div className="modal-header">
                            <h2><Edit2 size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />Edit Protocol / SOP</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setEditingId(null)}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group"><label>Protocol Name *</label><input className="form-control" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required /></div>
                            <div className="form-row form-row-3">
                                <div className="form-group">
                                    <label>Category</label>
                                    <select className="form-control" value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })}>
                                        {categories.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="form-group"><label>Version</label><input className="form-control" value={editForm.version} onChange={e => setEditForm({ ...editForm, version: e.target.value })} /></div>
                                <div className="form-group"><label>Tags (comma-separated)</label><input className="form-control" value={editForm.tags} onChange={e => setEditForm({ ...editForm, tags: e.target.value })} placeholder="viability, MTT" /></div>
                            </div>
                            <div className="form-group"><label>Description</label><textarea className="form-control" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={2} /></div>
                            <div className="form-group"><label>Procedure / Content</label><textarea className="form-control" value={editForm.content} onChange={e => setEditForm({ ...editForm, content: e.target.value })} rows={8} placeholder="Step by step procedure..." /></div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={saveEdit}><Save size={14} /> Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
