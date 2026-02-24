import { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { Plus, X, CheckCircle, Clock, PlayCircle, ChevronLeft, ChevronRight, LogIn, LogOut } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';

const statusColors = { 'Pending': 'status-pending', 'In Progress': 'status-in-progress', 'Completed': 'status-completed' };

export default function Planner() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [tasks, setTasks] = useState([]);
    const [members, setMembers] = useState([]);
    const [experiments, setExperiments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', user_id: '', experiment_id: '' });

    const fetchData = () => {
        Promise.all([api.get('/planner', { params: { date } }), api.get('/members'), api.get('/experiments')])
            .then(([t, m, e]) => { setTasks(t.data); setMembers(m.data); setExperiments(e.data); })
            .catch(console.error).finally(() => setLoading(false));
    };

    useEffect(() => { fetchData(); }, [date]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/planner', { ...form, date });
            setTasks(prev => [...prev, res.data]);
            setShowModal(false);
            setForm({ title: '', description: '', user_id: '', experiment_id: '' });
            toast.success('Task added');
        } catch (err) { toast.error('Failed'); }
    };

    const checkIn = async (id) => {
        try { await api.put(`/planner/${id}/checkin`); fetchData(); toast.success('Checked in'); } catch { toast.error('Failed'); }
    };

    const checkOut = async (id) => {
        try { await api.put(`/planner/${id}/checkout`); fetchData(); toast.success('Task completed'); } catch { toast.error('Failed'); }
    };

    const deleteTask = async (id) => {
        try { await api.delete(`/planner/${id}`); setTasks(prev => prev.filter(t => t.id !== id)); toast.success('Deleted'); } catch { toast.error('Failed'); }
    };

    // Group tasks by member
    const grouped = {};
    tasks.forEach(t => {
        const key = t.user?.name || 'Unassigned';
        if (!grouped[key]) grouped[key] = { user: t.user, tasks: [] };
        grouped[key].tasks.push(t);
    });

    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="page-container">
            <div className="flex items-center justify-between mb-24">
                <div><h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Daily Planner</h2><p className="text-muted mt-8">Who is doing what today</p></div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Add Task</button>
            </div>

            {/* Date Selector */}
            <div className="flex items-center gap-16 mb-24">
                <button className="btn btn-ghost btn-icon" onClick={() => setDate(subDays(new Date(date), 1).toISOString().split('T')[0])}><ChevronLeft size={18} /></button>
                <div style={{ textAlign: 'center' }}>
                    <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} style={{ textAlign: 'center', minWidth: 200 }} />
                    {date === today && <span className="badge badge-indigo mt-8" style={{ display: 'inline-block' }}>Today</span>}
                </div>
                <button className="btn btn-ghost btn-icon" onClick={() => setDate(addDays(new Date(date), 1).toISOString().split('T')[0])}><ChevronRight size={18} /></button>
                {date !== today && <button className="btn btn-secondary btn-sm" onClick={() => setDate(today)}>Go to Today</button>}
            </div>

            {loading ? <div className="loading-screen" style={{ minHeight: '40vh' }}><div className="spinner" /></div> : (
                <div>
                    {/* Summary */}
                    <div className="card-grid card-grid-3 mb-24">
                        <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(59,130,246,0.15)' }}><Clock size={20} color="#3b82f6" /></div><div className="stat-content"><h4 style={{ color: '#93c5fd' }}>{tasks.filter(t => t.status === 'Pending').length}</h4><p>Pending</p></div></div>
                        <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(249,115,22,0.15)' }}><PlayCircle size={20} color="#f97316" /></div><div className="stat-content"><h4 style={{ color: '#fdba74' }}>{tasks.filter(t => t.status === 'In Progress').length}</h4><p>In Progress</p></div></div>
                        <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}><CheckCircle size={20} color="#10b981" /></div><div className="stat-content"><h4 style={{ color: '#6ee7b7' }}>{tasks.filter(t => t.status === 'Completed').length}</h4><p>Completed</p></div></div>
                    </div>

                    {/* Tasks by Member */}
                    {Object.keys(grouped).length === 0 ? (
                        <div className="empty-state" style={{ minHeight: '30vh' }}><Clock size={48} /><h3>No tasks for this day</h3><p>Add tasks to plan the lab work</p></div>
                    ) : (
                        Object.entries(grouped).map(([name, { user, tasks: memberTasks }]) => (
                            <div key={name} className="card mb-16">
                                <div className="flex items-center gap-12 mb-16">
                                    <div className="user-avatar" style={{ background: user?.avatar_color || '#475569' }}>{name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                                    <div><h3 style={{ fontSize: '1rem' }}>{name}</h3><p className="text-xs text-muted">{memberTasks.length} task{memberTasks.length !== 1 ? 's' : ''}</p></div>
                                </div>
                                {memberTasks.map(task => (
                                    <div key={task.id} className={`task-item ${task.status === 'Completed' ? 'completed' : ''}`}>
                                        <div className={`task-checkbox ${task.status === 'Completed' ? 'checked' : ''}`}>
                                            {task.status === 'Completed' && <CheckCircle size={14} color="white" />}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div className="task-title">{task.title}</div>
                                            <div className="task-meta">
                                                {task.experiment && <span>🧪 {task.experiment.name}</span>}
                                                {task.check_in_time && <span>In: {format(new Date(task.check_in_time), 'h:mm a')}</span>}
                                                {task.check_out_time && <span>Out: {format(new Date(task.check_out_time), 'h:mm a')}</span>}
                                            </div>
                                        </div>
                                        <span className={`badge ${statusColors[task.status]}`}>{task.status}</span>
                                        <div className="flex gap-8">
                                            {task.status === 'Pending' && <button className="btn btn-ghost btn-sm" onClick={() => checkIn(task.id)} title="Check In"><LogIn size={14} /></button>}
                                            {task.status === 'In Progress' && <button className="btn btn-success btn-sm" onClick={() => checkOut(task.id)} title="Complete"><LogOut size={14} /></button>}
                                            <button className="btn btn-ghost btn-sm" onClick={() => deleteTask(task.id)} style={{ color: '#ef4444' }}><X size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))
                    )}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>Add Daily Task</h2><button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button></div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body">
                                <div className="form-group"><label>Task Title *</label><input className="form-control" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
                                <div className="form-group"><label>Description</label><textarea className="form-control" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
                                <div className="form-row form-row-2">
                                    <div className="form-group"><label>Assign To</label><select className="form-control" value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })}><option value="">Unassigned</option>{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
                                    <div className="form-group"><label>Experiment</label><select className="form-control" value={form.experiment_id} onChange={e => setForm({ ...form, experiment_id: e.target.value })}><option value="">None</option>{experiments.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}</select></div>
                                </div>
                            </div>
                            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">Add Task</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
