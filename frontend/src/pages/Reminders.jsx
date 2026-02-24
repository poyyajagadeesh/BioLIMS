import { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { Plus, X, Bell, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const typeColors = { Incubation: 'badge-orange', Passage: 'badge-emerald', Treatment: 'badge-pink', Experiment: 'badge-cyan', Project: 'badge-violet', Custom: 'badge-gray' };
const priorityColors = { Low: 'badge-gray', Medium: 'badge-blue', High: 'badge-orange', Critical: 'badge-rose' };

export default function Reminders() {
    const [reminders, setReminders] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', type: 'Custom', due_date: '', priority: 'Medium', user_id: '' });

    const fetchReminders = () => {
        const params = {};
        if (filter === 'overdue') { params.range = 'overdue'; params.completed = 'false'; }
        else if (filter === 'today') { params.range = 'today'; }
        else if (filter === 'week') { params.range = 'week'; }
        else if (filter === 'completed') { params.completed = 'true'; }
        else if (filter !== 'all') { params.completed = 'false'; }
        api.get('/reminders', { params }).then(res => setReminders(res.data)).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(() => { fetchReminders(); api.get('/members').then(r => setMembers(r.data)); }, [filter]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/reminders', { ...form, due_date: new Date(form.due_date).toISOString() });
            fetchReminders();
            setShowModal(false);
            setForm({ title: '', description: '', type: 'Custom', due_date: '', priority: 'Medium', user_id: '' });
            toast.success('Reminder created');
        } catch (err) { toast.error('Failed'); }
    };

    const toggleComplete = async (id) => {
        try { await api.put(`/reminders/${id}/complete`); fetchReminders(); } catch { toast.error('Failed'); }
    };

    const deleteReminder = async (id) => {
        try { await api.delete(`/reminders/${id}`); setReminders(prev => prev.filter(r => r.id !== id)); toast.success('Deleted'); } catch { toast.error('Failed'); }
    };

    return (
        <div className="page-container">
            <div className="flex items-center justify-between mb-24">
                <div><h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Reminders & Alerts</h2><p className="text-muted mt-8">Never miss a deadline</p></div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Add Reminder</button>
            </div>

            <div className="filter-bar">
                {['all', 'overdue', 'today', 'week', 'completed'].map(f => (
                    <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                        {f === 'all' ? '🔔 All' : f === 'overdue' ? '⚠️ Overdue' : f === 'today' ? '📅 Today' : f === 'week' ? '📆 This Week' : '✅ Completed'}
                    </button>
                ))}
            </div>

            {loading ? <div className="loading-screen" style={{ minHeight: '40vh' }}><div className="spinner" /></div> : reminders.length === 0 ? (
                <div className="empty-state" style={{ minHeight: '40vh' }}><Bell size={48} /><h3>No reminders</h3></div>
            ) : (
                <div>
                    {reminders.map(r => {
                        const isOverdue = !r.is_completed && new Date(r.due_date) < new Date();
                        return (
                            <div key={r.id} className="reminder-item" style={{ borderColor: isOverdue ? 'rgba(239,68,68,0.3)' : undefined, opacity: r.is_completed ? 0.6 : 1 }}>
                                <div className={`task-checkbox ${r.is_completed ? 'checked' : ''}`} onClick={() => toggleComplete(r.id)} style={{ cursor: 'pointer' }}>
                                    {r.is_completed && <CheckCircle size={14} color="white" />}
                                </div>
                                <div className="reminder-icon" style={{ background: isOverdue ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.15)' }}>
                                    {isOverdue ? <AlertTriangle size={16} color="#ef4444" /> : <Bell size={16} color="#6366f1" />}
                                </div>
                                <div className="reminder-content" style={{ flex: 1 }}>
                                    <h4 style={{ textDecoration: r.is_completed ? 'line-through' : 'none' }}>{r.title}</h4>
                                    <p>{r.description}</p>
                                    <div className="flex gap-8 mt-8">
                                        <span className={`badge ${typeColors[r.type]}`}>{r.type}</span>
                                        <span className={`badge ${priorityColors[r.priority]}`}>{r.priority}</span>
                                        {r.user && <span className="text-xs text-muted">👤 {r.user.name}</span>}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div className="reminder-time" style={{ color: isOverdue ? '#fca5a5' : 'var(--text-muted)' }}>
                                        {format(new Date(r.due_date), 'MMM d, h:mm a')}
                                    </div>
                                    <div className="text-xs" style={{ color: isOverdue ? '#fca5a5' : 'var(--text-muted)', marginTop: 4 }}>
                                        {formatDistanceToNow(new Date(r.due_date), { addSuffix: true })}
                                    </div>
                                </div>
                                <button className="btn btn-ghost btn-icon" onClick={() => deleteReminder(r.id)} style={{ color: '#ef4444' }}><X size={14} /></button>
                            </div>
                        );
                    })}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>Add Reminder</h2><button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button></div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body">
                                <div className="form-group"><label>Title *</label><input className="form-control" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
                                <div className="form-group"><label>Description</label><textarea className="form-control" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
                                <div className="form-row form-row-3">
                                    <div className="form-group"><label>Type</label><select className="form-control" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>{['Incubation', 'Passage', 'Treatment', 'Experiment', 'Project', 'Custom'].map(t => <option key={t}>{t}</option>)}</select></div>
                                    <div className="form-group"><label>Priority</label><select className="form-control" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>{['Low', 'Medium', 'High', 'Critical'].map(p => <option key={p}>{p}</option>)}</select></div>
                                    <div className="form-group"><label>Assign To</label><select className="form-control" value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })}><option value="">Me</option>{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
                                </div>
                                <div className="form-group"><label>Due Date *</label><input type="datetime-local" className="form-control" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} required /></div>
                            </div>
                            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create Reminder</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
