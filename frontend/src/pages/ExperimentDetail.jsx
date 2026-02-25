import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, X, CheckCircle, Beaker, Cpu, Edit2, Trash2, Upload, Download, FileText, BookOpen, Save, Link2, File, Shield, Eye, EyeOff, Lock, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

const statusColors = {
    'Planned': 'status-planned', 'In Progress': 'status-in-progress', 'Paused': 'status-paused',
    'Completed': 'status-completed', 'Failed': 'status-failed', 'Pending': 'status-pending',
};

function formatSize(bytes) {
    if (!bytes) return '—';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const visibilityOptions = [
    { value: 'public', label: '🌐 Public — All members', color: '#10b981' },
    { value: 'restricted', label: '👥 Restricted — Assigned only', color: '#f59e0b' },
    { value: 'private', label: '🔒 Private — Admin/PI only', color: '#ef4444' },
];

export default function ExperimentDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const [exp, setExp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('overview');
    const [showSubtaskForm, setShowSubtaskForm] = useState(false);
    const [subtaskForm, setSubtaskForm] = useState({ title: '', description: '', due_date: '' });
    const navigate = useNavigate();

    // Edit mode state
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [projects, setProjects] = useState([]);
    const [members, setMembers] = useState([]);
    const [protocols, setProtocols] = useState([]);

    // References state
    const [showRefForm, setShowRefForm] = useState(false);
    const [refForm, setRefForm] = useState({ title: '', authors: '', journal: '', year: '', doi: '', url: '' });

    // Results state
    const [editingResults, setEditingResults] = useState(false);
    const [resultsText, setResultsText] = useState('');

    // Progress drag state
    const [draggingProgress, setDraggingProgress] = useState(false);
    const [hoverProgress, setHoverProgress] = useState(null);
    const progressBarRef = useRef(null);
    const isDragging = useRef(false);

    // File upload state
    const [uploading, setUploading] = useState(false);

    // Wet-lab form state
    const [editingWetLab, setEditingWetLab] = useState(false);
    const [wetLabForm, setWetLabForm] = useState({
        cell_line: '', cell_source: '', passage_number: '', seeding_density: '',
        fbs_percentage: '', antibiotics: '', media_recipe: '', additives: '',
        treatment_drug: '', treatment_concentration: '', treatment_duration: '',
        incubation_temp: '37', incubation_co2: '5', incubation_humidity: '95',
        morphology_observations: '',
    });

    // Dry-lab form state
    const [editingDryLab, setEditingDryLab] = useState(false);
    const [dryLabForm, setDryLabForm] = useState({
        algorithm_name: '', script_version: '', git_reference: '',
        dataset_description: '', parameters_text: '', logs: '',
        input_files_text: '', output_files_text: '',
    });

    // Quick assign protocol state
    const [showAssignProtocol, setShowAssignProtocol] = useState(false);
    const [assignProtocolId, setAssignProtocolId] = useState('');
    const [allProtocols, setAllProtocols] = useState([]);

    const isAdmin = user?.role === 'Admin' || user?.role === 'PI';

    const fetchExp = () => api.get(`/experiments/${id}`).then(res => {
        setExp(res.data);
        setResultsText(res.data.results_outcome || '');
    }).catch(() => { toast.error('Not found'); navigate('/experiments'); }).finally(() => setLoading(false));

    useEffect(() => { fetchExp(); }, [id]);

    // Fetch data for edit mode
    const startEditing = () => {
        Promise.all([api.get('/projects'), api.get('/members'), api.get('/protocols')])
            .then(([p, m, pr]) => { setProjects(p.data); setMembers(m.data); setProtocols(pr.data); });
        setEditForm({
            name: exp.name, type: exp.type, status: exp.status,
            start_date: exp.start_date || '', end_date: exp.end_date || '',
            notes: exp.notes || '', observations: exp.observations || '',
            project_id: exp.project_id || '', protocol_id: exp.protocol_id || '',
            visibility: exp.visibility || 'public',
            member_ids: exp.members?.map(m => m.id) || [],
        });
        setEditing(true);
    };

    const saveEdit = async () => {
        try {
            await api.put(`/experiments/${id}`, editForm);
            setEditing(false);
            fetchExp();
            toast.success('Experiment updated');
        } catch (err) { toast.error(err.response?.data?.error || 'Failed to save'); }
    };

    const toggleEditMember = (mid) => {
        setEditForm(prev => ({
            ...prev,
            member_ids: prev.member_ids.includes(mid) ? prev.member_ids.filter(m => m !== mid) : [...prev.member_ids, mid],
        }));
    };

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

    // References handlers
    const addReference = async (e) => {
        e.preventDefault();
        try {
            const refs = [...(exp.references || []), refForm];
            await api.put(`/experiments/${id}/references`, { references: refs });
            setRefForm({ title: '', authors: '', journal: '', year: '', doi: '', url: '' });
            setShowRefForm(false);
            fetchExp();
            toast.success('Reference added');
        } catch { toast.error('Failed'); }
    };

    const removeReference = async (index) => {
        try {
            const refs = (exp.references || []).filter((_, i) => i !== index);
            await api.put(`/experiments/${id}/references`, { references: refs });
            fetchExp();
            toast.success('Reference removed');
        } catch { toast.error('Failed'); }
    };

    // Results handlers
    const saveResults = async () => {
        try {
            await api.put(`/experiments/${id}/results`, { results_outcome: resultsText });
            setEditingResults(false);
            fetchExp();
            toast.success('Results saved');
        } catch { toast.error('Failed'); }
    };

    // File upload handlers
    const handleFileUpload = async (e, fileType) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('entity_type', fileType);
        formData.append('entity_id', id);
        try {
            await api.post('/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            fetchExp();
            toast.success('File uploaded');
        } catch { toast.error('Upload failed'); }
        finally { setUploading(false); e.target.value = ''; }
    };

    const deleteFile = async (fileId) => {
        try { await api.delete(`/files/${fileId}`); fetchExp(); toast.success('File deleted'); } catch { toast.error('Failed'); }
    };

    // Wet-lab handlers
    const saveWetLab = async () => {
        try {
            const payload = { ...wetLabForm };
            if (payload.passage_number) payload.passage_number = parseInt(payload.passage_number);
            if (payload.fbs_percentage) payload.fbs_percentage = parseFloat(payload.fbs_percentage);
            if (payload.incubation_temp) payload.incubation_temp = parseFloat(payload.incubation_temp);
            if (payload.incubation_co2) payload.incubation_co2 = parseFloat(payload.incubation_co2);
            if (payload.incubation_humidity) payload.incubation_humidity = parseFloat(payload.incubation_humidity);
            await api.put(`/experiments/${id}`, { wetLabDetail: payload });
            setEditingWetLab(false);
            fetchExp();
            toast.success('Wet-lab details saved');
        } catch (err) { toast.error(err.response?.data?.error || 'Failed to save'); }
    };

    const startEditWetLab = (existing) => {
        if (existing) {
            setWetLabForm({
                cell_line: existing.cell_line || '', cell_source: existing.cell_source || '',
                passage_number: existing.passage_number?.toString() || '', seeding_density: existing.seeding_density || '',
                fbs_percentage: existing.fbs_percentage?.toString() || '', antibiotics: existing.antibiotics || '',
                media_recipe: existing.media_recipe || '', additives: existing.additives || '',
                treatment_drug: existing.treatment_drug || '', treatment_concentration: existing.treatment_concentration || '',
                treatment_duration: existing.treatment_duration || '',
                incubation_temp: existing.incubation_temp?.toString() || '37',
                incubation_co2: existing.incubation_co2?.toString() || '5',
                incubation_humidity: existing.incubation_humidity?.toString() || '95',
                morphology_observations: existing.morphology_observations || '',
            });
        }
        setEditingWetLab(true);
    };

    // Quick assign protocol
    const assignProtocol = async () => {
        try {
            await api.put(`/experiments/${id}`, { protocol_id: assignProtocolId || null });
            setShowAssignProtocol(false);
            fetchExp();
            toast.success(assignProtocolId ? 'Protocol assigned' : 'Protocol removed');
        } catch (err) { toast.error('Failed to assign protocol'); }
    };

    const openAssignProtocol = () => {
        api.get('/protocols').then(res => setAllProtocols(res.data)).catch(console.error);
        setAssignProtocolId(exp.protocol_id || '');
        setShowAssignProtocol(true);
    };

    // Dry-lab handlers
    const saveDryLab = async () => {
        try {
            const payload = {
                algorithm_name: dryLabForm.algorithm_name,
                script_version: dryLabForm.script_version,
                git_reference: dryLabForm.git_reference,
                dataset_description: dryLabForm.dataset_description,
                logs: dryLabForm.logs,
                input_files: dryLabForm.input_files_text ? dryLabForm.input_files_text.split(',').map(s => s.trim()).filter(Boolean) : [],
                output_files: dryLabForm.output_files_text ? dryLabForm.output_files_text.split(',').map(s => s.trim()).filter(Boolean) : [],
                parameters: {},
            };
            // Parse parameters from key=value lines
            if (dryLabForm.parameters_text) {
                dryLabForm.parameters_text.split('\n').forEach(line => {
                    const [k, ...v] = line.split('=');
                    if (k && v.length > 0) payload.parameters[k.trim()] = v.join('=').trim();
                });
            }
            await api.put(`/experiments/${id}`, { dryLabDetail: payload });
            setEditingDryLab(false);
            fetchExp();
            toast.success('Dry-lab details saved');
        } catch (err) { toast.error(err.response?.data?.error || 'Failed to save'); }
    };

    const startEditDryLab = (existing) => {
        if (existing) {
            setDryLabForm({
                algorithm_name: existing.algorithm_name || '',
                script_version: existing.script_version || '',
                git_reference: existing.git_reference || '',
                dataset_description: existing.dataset_description || '',
                logs: existing.logs || '',
                input_files_text: (existing.input_files || []).join(', '),
                output_files_text: (existing.output_files || []).join(', '),
                parameters_text: existing.parameters ? Object.entries(existing.parameters).map(([k, v]) => `${k}=${v}`).join('\n') : '',
            });
        }
        setEditingDryLab(true);
    };

    // Progress drag handler — supports both mouse and touch
    const calcProgress = useCallback((e) => {
        if (!progressBarRef.current) return 0;
        const rect = progressBarRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX : e.clientX;
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        return Math.round((x / rect.width) * 100 / 5) * 5; // snap to 5%
    }, []);

    const handleProgressStart = (e) => {
        e.preventDefault();
        isDragging.current = true;
        setDraggingProgress(true);
        setHoverProgress(calcProgress(e));

        const isTouch = e.type === 'touchstart';
        const moveEvent = isTouch ? 'touchmove' : 'mousemove';
        const endEvent = isTouch ? 'touchend' : 'mouseup';

        const onMove = (ev) => {
            if (isDragging.current) setHoverProgress(calcProgress(ev));
        };
        const onUp = async (ev) => {
            isDragging.current = false;
            setDraggingProgress(false);
            const val = calcProgress(ev);
            setHoverProgress(null);
            window.removeEventListener(moveEvent, onMove);
            window.removeEventListener(endEvent, onUp);
            try {
                const res = await api.put(`/experiments/${id}/progress`, { progress: val });
                fetchExp();
                toast.success(`Progress → ${res.data.progress}%`);
            } catch (err) { toast.error('Failed to update progress'); }
        };
        window.addEventListener(moveEvent, onMove, { passive: false });
        window.addEventListener(endEvent, onUp);
    };

    const handleBarHover = (e) => {
        if (!isDragging.current) setHoverProgress(calcProgress(e));
    };


    if (loading) return <div className="page-container"><div className="loading-screen" style={{ minHeight: '50vh' }}><div className="spinner" /></div></div>;
    if (!exp) return null;

    const wet = exp.wetLabDetail;
    const dry = exp.dryLabDetail;
    const rawDataFiles = (exp.files || []).filter(f => f.entity_type === 'raw_data');
    const resultFiles = (exp.files || []).filter(f => f.entity_type === 'result');
    const generalFiles = (exp.files || []).filter(f => f.entity_type === 'experiment');

    const visInfo = visibilityOptions.find(v => v.value === (exp.visibility || 'public'));

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
                            <div className="flex items-center gap-8">
                                <p className="text-muted">{exp.type} Experiment {exp.project && <>• 📁 {exp.project.name}</>}</p>
                                <span className="badge" style={{ background: `${visInfo?.color}20`, color: visInfo?.color, fontSize: '0.68rem' }}>
                                    {exp.visibility === 'private' ? <Lock size={10} /> : exp.visibility === 'restricted' ? <EyeOff size={10} /> : <Eye size={10} />}
                                    {' '}{exp.visibility || 'public'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-8 items-center">
                        <button className="btn btn-secondary btn-sm" onClick={startEditing}><Edit2 size={14} /> Edit</button>
                        <span className={`badge ${statusColors[exp.status]}`} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>{exp.status}</span>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginTop: 16 }}>
                    <div style={{ position: 'relative' }}>
                        <div className="text-xs text-muted mb-8" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>PROGRESS <TrendingUp size={10} /> <span style={{ fontSize: '0.6rem', color: 'var(--accent-primary)', opacity: 0.7 }}>drag to set</span></div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: draggingProgress ? '#818cf8' : '#a5b4fc', transition: 'color 0.15s' }}>
                            {hoverProgress !== null ? hoverProgress : exp.progress}%
                        </div>
                        <div
                            ref={progressBarRef}
                            onMouseDown={handleProgressStart}
                            onTouchStart={handleProgressStart}
                            onMouseMove={handleBarHover}
                            onMouseLeave={() => { if (!isDragging.current) setHoverProgress(null); }}
                            className="progress-drag-bar"
                            style={{ position: 'relative', height: 14, background: 'var(--bg-tertiary)', borderRadius: 10, marginTop: 8, cursor: 'pointer', overflow: 'hidden', transition: 'height 0.15s', touchAction: 'none' }}
                        >
                            {/* Actual progress */}
                            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${exp.progress}%`, background: 'var(--gradient-primary)', borderRadius: 10, transition: draggingProgress ? 'none' : 'width 0.3s', opacity: hoverProgress !== null ? 0.3 : 1 }} />
                            {/* Hover/drag preview */}
                            {hoverProgress !== null && (
                                <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${hoverProgress}%`, background: hoverProgress >= 75 ? 'linear-gradient(90deg, #10b981, #34d399)' : hoverProgress >= 25 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'var(--gradient-primary)', borderRadius: 10, transition: draggingProgress ? 'none' : 'width 0.1s' }} />
                            )}
                            {/* Drag handle indicator */}
                            {hoverProgress !== null && (
                                <div style={{ position: 'absolute', top: -1, left: `${hoverProgress}%`, transform: 'translateX(-50%)', width: 4, height: 16, background: '#fff', borderRadius: 4, boxShadow: '0 0 6px rgba(99,102,241,0.6)' }} />
                            )}
                        </div>
                    </div>
                    <div><div className="text-xs text-muted mb-8">SUBTASKS</div><div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{exp.subtasks?.filter(s => s.status === 'Completed').length || 0}/{exp.subtasks?.length || 0}</div></div>
                    <div><div className="text-xs text-muted mb-8">TEAM</div><div className="avatar-group">{exp.members?.map(m => <div key={m.id} className="user-avatar" style={{ background: m.avatar_color }} title={m.name}>{m.name?.charAt(0)}</div>)}</div></div>
                    <div><div className="text-xs text-muted mb-8">DATES</div><div className="text-sm">{exp.start_date ? format(new Date(exp.start_date), 'MMM d') : 'TBD'} → {exp.end_date ? format(new Date(exp.end_date), 'MMM d, yyyy') : 'TBD'}</div></div>
                </div>
            </div>

            {/* Edit Modal */}
            {editing && (
                <div className="modal-overlay" onClick={() => setEditing(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ maxHeight: '85vh', overflow: 'auto' }}>
                        <div className="modal-header">
                            <h2>Edit Experiment</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setEditing(false)}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group"><label>Experiment Name *</label><input className="form-control" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required /></div>
                            <div className="form-row form-row-3">
                                <div className="form-group"><label>Type</label><select className="form-control" value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })}><option>Wet-lab</option><option>Dry-lab</option></select></div>
                                <div className="form-group"><label>Status</label><select className="form-control" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}><option>Planned</option><option>In Progress</option><option>Paused</option><option>Completed</option><option>Failed</option></select></div>
                                <div className="form-group"><label>Project</label><select className="form-control" value={editForm.project_id} onChange={e => setEditForm({ ...editForm, project_id: e.target.value })}><option value="">No project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                            </div>
                            <div className="form-row form-row-3">
                                <div className="form-group"><label>Start Date</label><input type="date" className="form-control" value={editForm.start_date} onChange={e => setEditForm({ ...editForm, start_date: e.target.value })} /></div>
                                <div className="form-group"><label>End Date</label><input type="date" className="form-control" value={editForm.end_date} onChange={e => setEditForm({ ...editForm, end_date: e.target.value })} /></div>
                                <div className="form-group"><label>Protocol / SOP</label><select className="form-control" value={editForm.protocol_id} onChange={e => setEditForm({ ...editForm, protocol_id: e.target.value })}><option value="">None</option>{protocols.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                            </div>
                            {isAdmin && (
                                <div className="form-group">
                                    <label><Shield size={14} style={{ verticalAlign: 'middle' }} /> Access Control</label>
                                    <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
                                        {visibilityOptions.map(v => (
                                            <div key={v.value} onClick={() => setEditForm({ ...editForm, visibility: v.value })}
                                                className={`filter-chip ${editForm.visibility === v.value ? 'active' : ''}`}
                                                style={{ borderColor: editForm.visibility === v.value ? v.color : undefined }}>
                                                {v.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="form-group"><label>Notes</label><textarea className="form-control" value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} rows={2} /></div>
                            <div className="form-group"><label>Observations</label><textarea className="form-control" value={editForm.observations} onChange={e => setEditForm({ ...editForm, observations: e.target.value })} rows={2} /></div>
                            <div className="form-group">
                                <label>Assigned Members</label>
                                <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
                                    {members.map(m => (
                                        <div key={m.id} onClick={() => toggleEditMember(m.id)} className={`filter-chip ${editForm.member_ids?.includes(m.id) ? 'active' : ''}`}>
                                            <div className="user-avatar" style={{ width: 20, height: 20, fontSize: '0.6rem', background: m.avatar_color }}>{m.name?.charAt(0)}</div>
                                            {m.name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={saveEdit}><Save size={14} /> Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="tabs">
                <button className={`tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>Overview</button>
                <button className={`tab ${tab === 'subtasks' ? 'active' : ''}`} onClick={() => setTab('subtasks')}>Subtasks ({exp.subtasks?.length || 0})</button>
                {exp.type === 'Wet-lab' && <button className={`tab ${tab === 'wetlab' ? 'active' : ''}`} onClick={() => setTab('wetlab')}>Wet-lab Details</button>}
                {exp.type === 'Dry-lab' && <button className={`tab ${tab === 'drylab' ? 'active' : ''}`} onClick={() => setTab('drylab')}>Dry-lab Details</button>}
                <button className={`tab ${tab === 'results' ? 'active' : ''}`} onClick={() => setTab('results')}>Results & Outcome</button>
                <button className={`tab ${tab === 'references' ? 'active' : ''}`} onClick={() => setTab('references')}>References ({exp.references?.length || 0})</button>
                <button className={`tab ${tab === 'files' ? 'active' : ''}`} onClick={() => setTab('files')}>Files & Data</button>
            </div>

            {/* Overview */}
            {tab === 'overview' && (
                <div className="card">
                    {exp.notes && <div className="detail-section"><h3>📝 Notes</h3><p className="text-secondary">{exp.notes}</p></div>}
                    {exp.observations && <div className="detail-section"><h3>🔬 Observations</h3><p className="text-secondary">{exp.observations}</p></div>}
                    {exp.results_outcome && <div className="detail-section"><h3>📊 Results & Outcome</h3><p className="text-secondary" style={{ whiteSpace: 'pre-wrap' }}>{exp.results_outcome}</p></div>}
                    <div className="detail-section">
                        <div className="flex items-center justify-between">
                            <h3>📋 Protocol / SOP</h3>
                            <button className="btn btn-secondary btn-sm" onClick={openAssignProtocol}>
                                <BookOpen size={14} /> {exp.protocol ? 'Change Protocol' : 'Assign Protocol'}
                            </button>
                        </div>
                        {exp.protocol ? (
                            <p className="text-secondary mt-8">{exp.protocol.name} (v{exp.protocol.version}) — {exp.protocol.category}</p>
                        ) : (
                            <p className="text-muted mt-8" style={{ fontSize: '0.85rem' }}>No protocol assigned yet. Click "Assign Protocol" to link one.</p>
                        )}
                    </div>
                    {exp.references?.length > 0 && (
                        <div className="detail-section">
                            <h3>📚 References ({exp.references.length})</h3>
                            <div className="text-secondary">{exp.references.slice(0, 3).map((r, i) => <div key={i} style={{ marginBottom: 4, fontSize: '0.85rem' }}>• {r.authors} ({r.year}). <em>{r.title}</em>. {r.journal}</div>)}</div>
                        </div>
                    )}
                    {exp.members?.length > 0 && (
                        <div className="detail-section"><h3>👥 Assigned Members</h3><div className="flex gap-12" style={{ flexWrap: 'wrap' }}>{exp.members.map(m => (
                            <div key={m.id} className="member-card" style={{ minWidth: 200 }}>
                                <div className="user-avatar" style={{ background: m.avatar_color }}>{m.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                                <div className="member-info"><h4>{m.name}</h4><p>{m.role}</p></div>
                            </div>
                        ))}</div></div>
                    )}
                    {!exp.notes && !exp.observations && !exp.results_outcome && !exp.protocol && (!exp.references || exp.references.length === 0) && (!exp.members || exp.members.length === 0) && (
                        <div className="empty-state" style={{ padding: 40 }}>
                            <FileText size={36} />
                            <h3>No details yet</h3>
                            <p>Click "Edit" to add experiment details.</p>
                        </div>
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

            {/* Results & Outcome */}
            {tab === 'results' && (
                <div className="card">
                    <div className="flex items-center justify-between mb-16">
                        <h3>📊 Results & Outcome</h3>
                        <div className="flex gap-8">
                            {editingResults ? (
                                <>
                                    <button className="btn btn-primary btn-sm" onClick={saveResults}><Save size={14} /> Save</button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => { setEditingResults(false); setResultsText(exp.results_outcome || ''); }}>Cancel</button>
                                </>
                            ) : (
                                <button className="btn btn-secondary btn-sm" onClick={() => setEditingResults(true)}><Edit2 size={14} /> Edit</button>
                            )}
                        </div>
                    </div>
                    {editingResults ? (
                        <textarea className="form-control" value={resultsText} onChange={e => setResultsText(e.target.value)} rows={12}
                            placeholder={"Document the results and outcomes of this experiment here...\n\nInclude:\n• Key findings\n• Statistical analysis\n• Conclusions\n• Next steps"}
                            style={{ fontFamily: 'inherit', lineHeight: 1.6 }} />
                    ) : (
                        exp.results_outcome ? (
                            <div className="text-secondary" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, padding: '12px 0' }}>{exp.results_outcome}</div>
                        ) : (
                            <div className="empty-state" style={{ padding: 40 }}><FileText size={36} /><h3>No results recorded yet</h3><p>Click "Edit" to document your experiment results and outcomes.</p></div>
                        )
                    )}
                    <div style={{ marginTop: 24, borderTop: '1px solid var(--border-subtle)', paddingTop: 20 }}>
                        <div className="flex items-center justify-between mb-12">
                            <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>📎 Result Files</h4>
                            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}><Upload size={14} /> Upload Result<input type="file" hidden onChange={e => handleFileUpload(e, 'result')} disabled={uploading} /></label>
                        </div>
                        {resultFiles.length === 0 ? (<p className="text-muted text-sm">No result files uploaded yet.</p>) : (
                            resultFiles.map(f => (
                                <div key={f.id} className="task-item" style={{ padding: '8px 12px' }}>
                                    <File size={16} color="#10b981" />
                                    <div style={{ flex: 1 }}><div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{f.original_name}</div><div className="text-xs text-muted">{formatSize(f.size)} • {format(new Date(f.createdAt), 'MMM d, yyyy')}</div></div>
                                    <a href={`/api/files/${f.id}/download`} className="btn btn-ghost btn-icon" title="Download"><Download size={14} /></a>
                                    <button className="btn btn-ghost btn-icon" onClick={() => deleteFile(f.id)} style={{ color: '#ef4444' }}><Trash2 size={14} /></button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* References */}
            {tab === 'references' && (
                <div className="card">
                    <div className="flex items-center justify-between mb-16">
                        <h3>📚 Reference Publications</h3>
                        <button className="btn btn-primary btn-sm" onClick={() => setShowRefForm(true)}><Plus size={14} /> Add Reference</button>
                    </div>
                    {showRefForm && (
                        <form onSubmit={addReference} style={{ marginBottom: 20, padding: 16, background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-primary)' }}>
                            <div className="form-group"><label>Title *</label><input className="form-control" value={refForm.title} onChange={e => setRefForm({ ...refForm, title: e.target.value })} required placeholder="Publication title" /></div>
                            <div className="form-row form-row-2">
                                <div className="form-group"><label>Authors *</label><input className="form-control" value={refForm.authors} onChange={e => setRefForm({ ...refForm, authors: e.target.value })} required placeholder="Smith J, Doe A, et al." /></div>
                                <div className="form-group"><label>Journal</label><input className="form-control" value={refForm.journal} onChange={e => setRefForm({ ...refForm, journal: e.target.value })} placeholder="Nature, Science, etc." /></div>
                            </div>
                            <div className="form-row form-row-3">
                                <div className="form-group"><label>Year</label><input className="form-control" value={refForm.year} onChange={e => setRefForm({ ...refForm, year: e.target.value })} placeholder="2024" /></div>
                                <div className="form-group"><label>DOI</label><input className="form-control" value={refForm.doi} onChange={e => setRefForm({ ...refForm, doi: e.target.value })} placeholder="10.1038/..." /></div>
                                <div className="form-group"><label>URL</label><input className="form-control" value={refForm.url} onChange={e => setRefForm({ ...refForm, url: e.target.value })} placeholder="https://..." /></div>
                            </div>
                            <div className="flex gap-8"><button type="submit" className="btn btn-primary btn-sm">Add Reference</button><button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowRefForm(false)}>Cancel</button></div>
                        </form>
                    )}
                    {(!exp.references || exp.references.length === 0) ? (
                        <div className="empty-state" style={{ padding: 40 }}><BookOpen size={36} /><h3>No references added</h3><p>Add reference publications related to this experiment.</p></div>
                    ) : (
                        <div>{exp.references.map((ref, idx) => (
                            <div key={idx} className="task-item" style={{ alignItems: 'flex-start', padding: '14px 12px' }}>
                                <div style={{ marginTop: 2 }}><BookOpen size={18} color="#a5b4fc" /></div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>{ref.title}</div>
                                    <div className="text-sm text-muted" style={{ marginBottom: 2 }}>{ref.authors}{ref.year && ` (${ref.year})`}</div>
                                    {ref.journal && <div className="text-sm" style={{ color: '#a5b4fc', fontStyle: 'italic' }}>{ref.journal}</div>}
                                    <div className="flex gap-8 mt-8">
                                        {ref.doi && <a href={`https://doi.org/${ref.doi}`} target="_blank" rel="noreferrer" className="badge badge-indigo" style={{ cursor: 'pointer', textDecoration: 'none' }}>DOI: {ref.doi}</a>}
                                        {ref.url && <a href={ref.url} target="_blank" rel="noreferrer" className="badge badge-cyan" style={{ cursor: 'pointer', textDecoration: 'none' }}><Link2 size={10} /> Link</a>}
                                    </div>
                                </div>
                                <button className="btn btn-ghost btn-icon" onClick={() => removeReference(idx)} style={{ color: '#ef4444' }}><Trash2 size={14} /></button>
                            </div>
                        ))}</div>
                    )}
                </div>
            )}

            {/* Files & Data */}
            {tab === 'files' && (
                <div>
                    <div className="card" style={{ marginBottom: 20 }}>
                        <div className="flex items-center justify-between mb-16"><h3>🗄️ Raw Data</h3>
                            <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}><Upload size={14} /> Upload Raw Data<input type="file" hidden onChange={e => handleFileUpload(e, 'raw_data')} disabled={uploading} /></label>
                        </div>
                        {rawDataFiles.length === 0 ? (
                            <div className="empty-state" style={{ padding: 32 }}><Upload size={32} /><p>No raw data files uploaded yet.</p><p className="text-xs text-muted">Upload sequencing data, images, spreadsheets, etc.</p></div>
                        ) : (rawDataFiles.map(f => (
                            <div key={f.id} className="task-item" style={{ padding: '10px 12px' }}>
                                <File size={18} color="#f97316" />
                                <div style={{ flex: 1 }}><div style={{ fontWeight: 500, fontSize: '0.88rem' }}>{f.original_name}</div><div className="text-xs text-muted">{formatSize(f.size)} • {f.mime_type?.split('/')[1]?.toUpperCase() || 'File'} • {format(new Date(f.createdAt), 'MMM d, yyyy h:mm a')}</div></div>
                                <span className="badge badge-orange">Raw Data</span>
                                <a href={`/api/files/${f.id}/download`} className="btn btn-ghost btn-icon" title="Download"><Download size={14} /></a>
                                <button className="btn btn-ghost btn-icon" onClick={() => deleteFile(f.id)} style={{ color: '#ef4444' }}><Trash2 size={14} /></button>
                            </div>
                        )))}
                    </div>
                    <div className="card">
                        <div className="flex items-center justify-between mb-16"><h3>📎 Experiment Files</h3>
                            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}><Upload size={14} /> Upload File<input type="file" hidden onChange={e => handleFileUpload(e, 'experiment')} disabled={uploading} /></label>
                        </div>
                        {generalFiles.length === 0 ? (
                            <div className="empty-state" style={{ padding: 32 }}><FileText size={32} /><p>No experiment files uploaded yet.</p></div>
                        ) : (generalFiles.map(f => (
                            <div key={f.id} className="task-item" style={{ padding: '10px 12px' }}>
                                <File size={18} color="#6366f1" />
                                <div style={{ flex: 1 }}><div style={{ fontWeight: 500, fontSize: '0.88rem' }}>{f.original_name}</div><div className="text-xs text-muted">{formatSize(f.size)} • {format(new Date(f.createdAt), 'MMM d, yyyy')}</div></div>
                                <a href={`/api/files/${f.id}/download`} className="btn btn-ghost btn-icon" title="Download"><Download size={14} /></a>
                                <button className="btn btn-ghost btn-icon" onClick={() => deleteFile(f.id)} style={{ color: '#ef4444' }}><Trash2 size={14} /></button>
                            </div>
                        )))}
                    </div>
                </div>
            )}

            {/* Wet-lab */}
            {tab === 'wetlab' && !editingWetLab && wet && (
                <div className="card">
                    <div className="flex items-center justify-between mb-16">
                        <h3>🧫 Wet-Lab Details</h3>
                        <button className="btn btn-secondary btn-sm" onClick={() => startEditWetLab(wet)}><Edit2 size={14} /> Edit</button>
                    </div>
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
                        <div className="detail-section mt-16"><h3>💊 Treatment</h3>
                            <div className="detail-grid">
                                <div className="detail-item"><label>Drug</label><div className="value">{wet.treatment_drug}</div></div>
                                <div className="detail-item"><label>Concentration</label><div className="value">{wet.treatment_concentration}</div></div>
                                <div className="detail-item"><label>Duration</label><div className="value">{wet.treatment_duration}</div></div>
                            </div>
                        </div>
                    )}
                    <div className="detail-section mt-16"><h3>🌡️ Incubation Conditions</h3>
                        <div className="detail-grid">
                            <div className="detail-item"><label>Temperature</label><div className="value">{wet.incubation_temp != null ? `${wet.incubation_temp}°C` : '—'}</div></div>
                            <div className="detail-item"><label>CO₂</label><div className="value">{wet.incubation_co2 != null ? `${wet.incubation_co2}%` : '—'}</div></div>
                            <div className="detail-item"><label>Humidity</label><div className="value">{wet.incubation_humidity != null ? `${wet.incubation_humidity}%` : '—'}</div></div>
                        </div>
                    </div>
                    {wet.morphology_observations && <div className="detail-section mt-16"><h3>🔬 Morphology Observations</h3><p className="text-secondary">{wet.morphology_observations}</p></div>}
                </div>
            )}
            {tab === 'wetlab' && !editingWetLab && !wet && (
                <div className="card">
                    <div className="empty-state" style={{ padding: 40 }}>
                        <Beaker size={36} />
                        <h3>No wet-lab details recorded yet</h3>
                        <p>Add cell culture, treatment, and incubation details for this experiment.</p>
                        <button className="btn btn-primary mt-16" onClick={() => startEditWetLab(null)}><Plus size={14} /> Add Wet-Lab Details</button>
                    </div>
                </div>
            )}
            {tab === 'wetlab' && editingWetLab && (
                <div className="card">
                    <div className="flex items-center justify-between mb-16">
                        <h3>🧫 {wet ? 'Edit' : 'Add'} Wet-Lab Details</h3>
                        <div className="flex gap-8">
                            <button className="btn btn-primary btn-sm" onClick={saveWetLab}><Save size={14} /> Save</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditingWetLab(false)}>Cancel</button>
                        </div>
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>🧬 CELL CULTURE</div>
                    <div className="form-row form-row-3">
                        <div className="form-group"><label>Cell Line</label><input className="form-control" value={wetLabForm.cell_line} onChange={e => setWetLabForm({ ...wetLabForm, cell_line: e.target.value })} placeholder="e.g. HeLa, MCF-7" /></div>
                        <div className="form-group"><label>Cell Source</label><input className="form-control" value={wetLabForm.cell_source} onChange={e => setWetLabForm({ ...wetLabForm, cell_source: e.target.value })} placeholder="e.g. ATCC" /></div>
                        <div className="form-group"><label>Passage Number</label><input className="form-control" type="number" value={wetLabForm.passage_number} onChange={e => setWetLabForm({ ...wetLabForm, passage_number: e.target.value })} placeholder="e.g. 12" /></div>
                    </div>
                    <div className="form-row form-row-3">
                        <div className="form-group"><label>Seeding Density</label><input className="form-control" value={wetLabForm.seeding_density} onChange={e => setWetLabForm({ ...wetLabForm, seeding_density: e.target.value })} placeholder="e.g. 5x10⁴ cells/well" /></div>
                        <div className="form-group"><label>FBS %</label><input className="form-control" type="number" step="0.1" value={wetLabForm.fbs_percentage} onChange={e => setWetLabForm({ ...wetLabForm, fbs_percentage: e.target.value })} placeholder="e.g. 10" /></div>
                        <div className="form-group"><label>Antibiotics</label><input className="form-control" value={wetLabForm.antibiotics} onChange={e => setWetLabForm({ ...wetLabForm, antibiotics: e.target.value })} placeholder="e.g. 1% Pen/Strep" /></div>
                    </div>
                    <div className="form-group"><label>Media Recipe</label><textarea className="form-control" value={wetLabForm.media_recipe} onChange={e => setWetLabForm({ ...wetLabForm, media_recipe: e.target.value })} rows={2} placeholder="e.g. DMEM + 10% FBS + 1% Pen/Strep" /></div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', margin: '16px 0 12px' }}>💊 TREATMENT</div>
                    <div className="form-row form-row-3">
                        <div className="form-group"><label>Drug / Compound</label><input className="form-control" value={wetLabForm.treatment_drug} onChange={e => setWetLabForm({ ...wetLabForm, treatment_drug: e.target.value })} placeholder="e.g. Cisplatin" /></div>
                        <div className="form-group"><label>Concentration</label><input className="form-control" value={wetLabForm.treatment_concentration} onChange={e => setWetLabForm({ ...wetLabForm, treatment_concentration: e.target.value })} placeholder="e.g. 10 µM" /></div>
                        <div className="form-group"><label>Duration</label><input className="form-control" value={wetLabForm.treatment_duration} onChange={e => setWetLabForm({ ...wetLabForm, treatment_duration: e.target.value })} placeholder="e.g. 24 hours" /></div>
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', margin: '16px 0 12px' }}>🌡️ INCUBATION CONDITIONS</div>
                    <div className="form-row form-row-3">
                        <div className="form-group"><label>Temperature (°C)</label><input className="form-control" type="number" step="0.1" value={wetLabForm.incubation_temp} onChange={e => setWetLabForm({ ...wetLabForm, incubation_temp: e.target.value })} /></div>
                        <div className="form-group"><label>CO₂ (%)</label><input className="form-control" type="number" step="0.1" value={wetLabForm.incubation_co2} onChange={e => setWetLabForm({ ...wetLabForm, incubation_co2: e.target.value })} /></div>
                        <div className="form-group"><label>Humidity (%)</label><input className="form-control" type="number" step="0.1" value={wetLabForm.incubation_humidity} onChange={e => setWetLabForm({ ...wetLabForm, incubation_humidity: e.target.value })} /></div>
                    </div>
                    <div className="form-group"><label>Morphology Observations</label><textarea className="form-control" value={wetLabForm.morphology_observations} onChange={e => setWetLabForm({ ...wetLabForm, morphology_observations: e.target.value })} rows={3} placeholder="Describe cell morphology, confluence, etc." /></div>
                </div>
            )}

            {/* Dry-lab */}
            {tab === 'drylab' && !editingDryLab && dry && (
                <div className="card">
                    <div className="flex items-center justify-between mb-16">
                        <h3>💻 Dry-Lab Details</h3>
                        <button className="btn btn-secondary btn-sm" onClick={() => startEditDryLab(dry)}><Edit2 size={14} /> Edit</button>
                    </div>
                    <div className="detail-grid">
                        <div className="detail-item"><label>Algorithm / Software</label><div className="value">{dry.algorithm_name || '—'}</div></div>
                        <div className="detail-item"><label>Script Version</label><div className="value">{dry.script_version || '—'}</div></div>
                        <div className="detail-item"><label>Git Reference / URL</label><div className="value" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{dry.git_reference ? (<a href={dry.git_reference.startsWith('http') ? dry.git_reference : undefined} target="_blank" rel="noreferrer" style={{ color: '#a5b4fc', textDecoration: 'none' }}>{dry.git_reference}</a>) : '—'}</div></div>
                    </div>
                    {dry.dataset_description && <div className="detail-section mt-16"><h3>📊 Dataset Description</h3><p className="text-secondary" style={{ whiteSpace: 'pre-wrap' }}>{dry.dataset_description}</p></div>}
                    {dry.parameters && Object.keys(dry.parameters).length > 0 && (
                        <div className="detail-section mt-16"><h3>⚙️ Parameters</h3><div className="detail-grid">{Object.entries(dry.parameters).map(([k, v]) => <div key={k} className="detail-item"><label>{k}</label><div className="value" style={{ fontFamily: 'monospace' }}>{String(v)}</div></div>)}</div></div>
                    )}
                    {dry.input_files?.length > 0 && <div className="detail-section mt-16"><h3>📥 Input Files</h3>{dry.input_files.map((f, i) => <span key={i} className="badge badge-cyan" style={{ margin: '0 4px 4px 0' }}>{f}</span>)}</div>}
                    {dry.output_files?.length > 0 && <div className="detail-section mt-16"><h3>📤 Output Files</h3>{dry.output_files.map((f, i) => <span key={i} className="badge badge-emerald" style={{ margin: '0 4px 4px 0' }}>{f}</span>)}</div>}
                    {dry.logs && <div className="detail-section mt-16"><h3>📜 Logs / Notes</h3><pre style={{ background: 'var(--bg-primary)', padding: 14, borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', overflowX: 'auto' }}>{dry.logs}</pre></div>}
                </div>
            )}
            {tab === 'drylab' && !editingDryLab && !dry && (
                <div className="card">
                    <div className="empty-state" style={{ padding: 40 }}>
                        <Cpu size={36} />
                        <h3>No dry-lab details recorded yet</h3>
                        <p>Add software versions, URLs, parameters, and dataset info for this experiment.</p>
                        <button className="btn btn-primary mt-16" onClick={() => startEditDryLab(null)}><Plus size={14} /> Add Dry-Lab Details</button>
                    </div>
                </div>
            )}
            {tab === 'drylab' && editingDryLab && (
                <div className="card">
                    <div className="flex items-center justify-between mb-16">
                        <h3>💻 {dry ? 'Edit' : 'Add'} Dry-Lab Details</h3>
                        <div className="flex gap-8">
                            <button className="btn btn-primary btn-sm" onClick={saveDryLab}><Save size={14} /> Save</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditingDryLab(false)}>Cancel</button>
                        </div>
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>🖥️ SOFTWARE & VERSION</div>
                    <div className="form-row form-row-3">
                        <div className="form-group"><label>Algorithm / Software Name</label><input className="form-control" value={dryLabForm.algorithm_name} onChange={e => setDryLabForm({ ...dryLabForm, algorithm_name: e.target.value })} placeholder="e.g. DESeq2, STAR, BWA" /></div>
                        <div className="form-group"><label>Script / Software Version</label><input className="form-control" value={dryLabForm.script_version} onChange={e => setDryLabForm({ ...dryLabForm, script_version: e.target.value })} placeholder="e.g. v2.1.0, R 4.3.1" /></div>
                        <div className="form-group"><label>Git Reference / URL</label><input className="form-control" value={dryLabForm.git_reference} onChange={e => setDryLabForm({ ...dryLabForm, git_reference: e.target.value })} placeholder="e.g. https://github.com/repo or commit hash" /></div>
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', margin: '16px 0 12px' }}>📊 DATASET & FILES</div>
                    <div className="form-group"><label>Dataset Description</label><textarea className="form-control" value={dryLabForm.dataset_description} onChange={e => setDryLabForm({ ...dryLabForm, dataset_description: e.target.value })} rows={3} placeholder="Describe the dataset: source, size, format, preprocessing steps..." /></div>
                    <div className="form-row form-row-2">
                        <div className="form-group"><label>Input Files (comma-separated)</label><input className="form-control" value={dryLabForm.input_files_text} onChange={e => setDryLabForm({ ...dryLabForm, input_files_text: e.target.value })} placeholder="e.g. reads_R1.fastq.gz, reads_R2.fastq.gz" /></div>
                        <div className="form-group"><label>Output Files (comma-separated)</label><input className="form-control" value={dryLabForm.output_files_text} onChange={e => setDryLabForm({ ...dryLabForm, output_files_text: e.target.value })} placeholder="e.g. counts.csv, results.xlsx" /></div>
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', margin: '16px 0 12px' }}>⚙️ PARAMETERS</div>
                    <div className="form-group"><label>Parameters (one per line: key=value)</label><textarea className="form-control" value={dryLabForm.parameters_text} onChange={e => setDryLabForm({ ...dryLabForm, parameters_text: e.target.value })} rows={4} placeholder={"threads=8\nmin_mapq=30\ngenome=hg38\npadj_threshold=0.05"} style={{ fontFamily: 'monospace', fontSize: '0.85rem' }} /></div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', margin: '16px 0 12px' }}>📜 LOGS & NOTES</div>
                    <div className="form-group"><label>Logs / Execution Notes</label><textarea className="form-control" value={dryLabForm.logs} onChange={e => setDryLabForm({ ...dryLabForm, logs: e.target.value })} rows={4} placeholder="Paste run logs, execution notes, or any relevant output..." style={{ fontFamily: 'monospace', fontSize: '0.85rem' }} /></div>
                </div>
            )}

            {/* Assign Protocol Modal */}
            {showAssignProtocol && (
                <div className="modal-overlay" onClick={() => setShowAssignProtocol(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
                        <div className="modal-header">
                            <h2><BookOpen size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />Assign Protocol / SOP</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowAssignProtocol(false)}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Select Protocol</label>
                                <select className="form-control" value={assignProtocolId} onChange={e => setAssignProtocolId(e.target.value)}>
                                    <option value="">None (remove protocol)</option>
                                    {allProtocols.map(p => <option key={p.id} value={p.id}>{p.name} (v{p.version}) — {p.category}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowAssignProtocol(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={assignProtocol}><Save size={14} /> Assign</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
