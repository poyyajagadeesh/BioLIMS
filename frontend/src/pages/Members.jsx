import { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { Plus, X, Users, Mail, Phone, Shield } from 'lucide-react';

const roleColors = { Admin: 'badge-blue', PI: 'badge-violet', Senior: 'badge-indigo', Researcher: 'badge-teal', Student: 'badge-emerald' };
const expertiseOptions = ['Cell Culture', 'Molecular Biology', 'Animal Work', 'Bioinformatics', 'Western Blot', 'qPCR', 'NGS', 'Microscopy', 'Flow Cytometry', 'CRISPR', 'Data Analysis', 'Python', 'R'];

export default function Members() {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', password: 'password123', role: 'Researcher', mobile: '', expertise: [] });

    const fetchMembers = () => api.get('/members').then(res => setMembers(res.data)).catch(console.error).finally(() => setLoading(false));
    useEffect(() => { fetchMembers(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/register', form);
            fetchMembers();
            setShowModal(false);
            setForm({ name: '', email: '', password: 'password123', role: 'Researcher', mobile: '', expertise: [] });
            toast.success('Member added');
        } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    };

    const toggleExpertise = (exp) => {
        setForm(prev => ({ ...prev, expertise: prev.expertise.includes(exp) ? prev.expertise.filter(e => e !== exp) : [...prev.expertise, exp] }));
    };

    return (
        <div className="page-container">
            <div className="flex items-center justify-between mb-24">
                <div><h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Lab Members</h2><p className="text-muted mt-8">Manage your research team</p></div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Add Member</button>
            </div>

            {loading ? <div className="loading-screen" style={{ minHeight: '40vh' }}><div className="spinner" /></div> : (
                <div className="card-grid card-grid-2">
                    {members.map(m => (
                        <div key={m.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setSelected(selected?.id === m.id ? null : m)}>
                            <div className="flex items-center gap-16">
                                <div className="user-avatar" style={{ width: 52, height: 52, fontSize: '1.1rem', background: m.avatar_color }}>
                                    {m.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div className="flex items-center gap-8 mb-8"><h3 style={{ fontSize: '1.05rem' }}>{m.name}</h3><span className={`badge ${roleColors[m.role]}`}>{m.role}</span></div>
                                    <div className="flex items-center gap-12 text-sm text-muted">
                                        <span className="flex items-center gap-8"><Mail size={13} /> {m.email}</span>
                                        {m.mobile && <span className="flex items-center gap-8"><Phone size={13} /> {m.mobile}</span>}
                                    </div>
                                </div>
                            </div>

                            {m.expertise?.length > 0 && (
                                <div className="flex gap-8 mt-16" style={{ flexWrap: 'wrap' }}>
                                    {m.expertise.map(e => <span key={e} className="badge badge-indigo">{e}</span>)}
                                </div>
                            )}

                            {selected?.id === m.id && (
                                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                                    <div className="flex gap-16">
                                        <div><div className="text-xs text-muted mb-8">PROJECTS</div><div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{m.projects?.length || 0}</div></div>
                                        <div><div className="text-xs text-muted mb-8">EXPERIMENTS</div><div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{m.experiments?.length || 0}</div></div>
                                    </div>
                                    {m.projects?.length > 0 && (
                                        <div className="mt-16">
                                            <div className="text-xs text-muted mb-8">ASSIGNED PROJECTS</div>
                                            {m.projects.map(p => <div key={p.id} className="badge badge-violet" style={{ margin: '0 4px 4px 0' }}>{p.name}</div>)}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>Add Lab Member</h2><button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button></div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body">
                                <div className="form-row form-row-2">
                                    <div className="form-group"><label>Full Name *</label><input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                                    <div className="form-group"><label>Email *</label><input type="email" className="form-control" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
                                </div>
                                <div className="form-row form-row-3">
                                    <div className="form-group"><label>Role</label><select className="form-control" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>{['Admin', 'PI', 'Senior', 'Researcher', 'Student'].map(r => <option key={r}>{r}</option>)}</select></div>
                                    <div className="form-group"><label>Mobile</label><input className="form-control" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} /></div>
                                    <div className="form-group"><label>Password</label><input className="form-control" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
                                </div>
                                <div className="form-group">
                                    <label>Expertise</label>
                                    <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
                                        {expertiseOptions.map(exp => <button type="button" key={exp} className={`filter-chip ${form.expertise.includes(exp) ? 'active' : ''}`} onClick={() => toggleExpertise(exp)}>{exp}</button>)}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">Add Member</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
