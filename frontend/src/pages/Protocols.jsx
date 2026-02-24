import { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { Plus, Search, BookOpen, X } from 'lucide-react';

const categories = ['All', 'Cell Culture', 'Western Blot', 'qPCR', 'NGS', 'Microscopy', 'Animal Work', 'Bioinformatics', 'Other'];
const catColors = { 'Cell Culture': 'badge-emerald', 'Western Blot': 'badge-violet', 'qPCR': 'badge-orange', 'NGS': 'badge-cyan', 'Microscopy': 'badge-pink', 'Animal Work': 'badge-amber', 'Bioinformatics': 'badge-blue', 'Other': 'badge-gray' };

export default function Protocols() {
    const [protocols, setProtocols] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState({ name: '', category: 'Other', description: '', content: '', version: '1.0', tags: '' });

    useEffect(() => {
        api.get('/protocols', { params: { category: filter !== 'All' ? filter : undefined, search: search || undefined } })
            .then(res => setProtocols(res.data)).catch(console.error).finally(() => setLoading(false));
    }, [filter, search]);

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
                        <div key={p.id} className="protocol-card" onClick={() => setSelected(selected?.id === p.id ? null : p)}>
                            <div className={`protocol-category badge ${catColors[p.category] || 'badge-gray'}`}>{p.category}</div>
                            <h4>{p.name}</h4>
                            <p className="protocol-desc">{p.description}</p>
                            <div className="protocol-meta">
                                <span>v{p.version}</span>
                                {p.creator && <span>by {p.creator.name}</span>}
                            </div>
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
                    ))}
                </div>
            )}

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
        </div>
    );
}
