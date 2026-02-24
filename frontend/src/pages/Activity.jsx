import { useState, useEffect } from 'react';
import api from '../api';
import { Activity as ActivityIcon } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const actionIcons = {
    'Created project': '📁', 'Updated project': '📝', 'Archived project': '🗄️',
    'Created experiment': '🧪', 'Updated experiment': '✏️', 'Deleted experiment': '🗑️',
    'Completed subtask': '✅', 'Started experiment': '▶️', 'Completed experiment': '🎉',
    'Created protocol': '📋', 'Updated protocol': '📝', 'Deleted protocol': '🗑️',
    'Uploaded file': '📎', 'Created daily task': '📅',
    'Created member': '👤', 'Updated member': '✏️', 'Deactivated member': '🚫',
};

export default function Activity() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        api.get('/activity', { params: { limit: 100, entity_type: filter || undefined } })
            .then(res => setLogs(res.data)).catch(console.error).finally(() => setLoading(false));
    }, [filter]);

    return (
        <div className="page-container">
            <div className="flex items-center justify-between mb-24">
                <div><h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Activity Log</h2><p className="text-muted mt-8">Track all changes and updates</p></div>
            </div>

            <div className="filter-bar mb-24">
                {['', 'Project', 'Experiment', 'Protocol', 'File', 'DailyTask', 'User', 'Subtask'].map(f => (
                    <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                        {f || 'All'}
                    </button>
                ))}
            </div>

            {loading ? <div className="loading-screen" style={{ minHeight: '40vh' }}><div className="spinner" /></div> : logs.length === 0 ? (
                <div className="empty-state" style={{ minHeight: '40vh' }}><ActivityIcon size={48} /><h3>No activity logged</h3></div>
            ) : (
                <div className="card">
                    <div className="timeline" style={{ paddingLeft: 32 }}>
                        {logs.map(log => (
                            <div key={log.id} className="timeline-item">
                                <div className="flex items-center gap-12">
                                    <span style={{ fontSize: '1.1rem' }}>{actionIcons[log.action] || '📝'}</span>
                                    <div style={{ flex: 1 }}>
                                        <div className="content">
                                            <strong>{log.user?.name || 'System'}</strong>{' '}
                                            <span className="text-secondary">{log.action}</span>
                                            {log.entity_name && <>{' — '}<em style={{ color: 'var(--text-accent)' }}>{log.entity_name}</em></>}
                                        </div>
                                        <div className="time" style={{ marginTop: 2 }}>
                                            {format(new Date(log.createdAt), 'MMM d, yyyy h:mm a')} · {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                        </div>
                                    </div>
                                    {log.user && (
                                        <div className="user-avatar" style={{ width: 28, height: 28, fontSize: '0.65rem', background: log.user.avatar_color }}>
                                            {log.user.name?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
