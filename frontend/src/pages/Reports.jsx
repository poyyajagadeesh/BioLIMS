import { useState, useEffect, useRef } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { FileText, Download, Calendar, User, Clock, FlaskConical, FolderKanban, PenTool, CheckCircle, Printer } from 'lucide-react';
import { format } from 'date-fns';

export default function Reports() {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);
    const [reportType, setReportType] = useState('monthly');
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [selectedMember, setSelectedMember] = useState('');
    const reportRef = useRef(null);

    useEffect(() => {
        api.get('/members').then(res => setMembers(res.data)).catch(console.error);
    }, []);

    const generateReport = async () => {
        setLoading(true);
        try {
            const params = { type: reportType };
            if (reportType === 'monthly') params.month = selectedMonth;
            else params.year = selectedYear;
            if (selectedMember) params.member_id = selectedMember;
            const res = await api.get('/reports/generate', { params });
            setReport(res.data);
            toast.success('Report generated');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to generate report');
        } finally { setLoading(false); }
    };

    const printReport = () => {
        window.print();
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    return (
        <div className="page-container">
            <div className="flex items-center justify-between mb-24 no-print">
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Reports</h2>
                    <p className="text-muted mt-8">Generate PDF reports for lab activity</p>
                </div>
            </div>

            {/* Report Configuration */}
            <div className="card mb-24 no-print">
                <h3 className="mb-16">📊 Configure Report</h3>
                <div className="form-row form-row-2" style={{ marginBottom: 16 }}>
                    <div className="form-group">
                        <label>Report Type</label>
                        <select className="form-control" value={reportType} onChange={e => setReportType(e.target.value)}>
                            <option value="monthly">Monthly Report</option>
                            <option value="sixmonth">Six-Month Report</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Filter by Member (optional)</label>
                        <select className="form-control" value={selectedMember} onChange={e => setSelectedMember(e.target.value)}>
                            <option value="">All Members</option>
                            {members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.role})</option>)}
                        </select>
                    </div>
                </div>
                <div className="form-row form-row-2" style={{ marginBottom: 16 }}>
                    {reportType === 'monthly' ? (
                        <div className="form-group">
                            <label>Month</label>
                            <input type="month" className="form-control" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
                        </div>
                    ) : (
                        <div className="form-group">
                            <label>Year</label>
                            <select className="form-control" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    )}
                    <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button className="btn btn-primary" onClick={generateReport} disabled={loading} style={{ width: '100%' }}>
                            {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Generating...</> : <><FileText size={16} /> Generate Report</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Report Output */}
            {report && (
                <div>
                    <div className="flex items-center justify-between mb-16 no-print">
                        <h3>📄 Report Preview</h3>
                        <button className="btn btn-primary" onClick={printReport}><Printer size={16} /> Print / Save as PDF</button>
                    </div>

                    <div ref={reportRef} className="card report-container" id="report-content">
                        {/* Report Header */}
                        <div style={{ textAlign: 'center', marginBottom: 28, paddingBottom: 20, borderBottom: '2px solid var(--border-primary)' }}>
                            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>🧬 BioLIMS Lab Report</h1>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#a5b4fc', marginBottom: 8 }}>{report.period}</h2>
                            {report.member && <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Member: <strong>{report.member.name}</strong> ({report.member.role})</p>}
                            <p className="text-xs text-muted" style={{ marginTop: 8 }}>Generated: {format(new Date(report.generated_at), 'MMMM d, yyyy h:mm a')}</p>
                        </div>

                        {/* Summary Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
                            <div style={{ padding: 16, borderRadius: 'var(--radius-sm)', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <FolderKanban size={20} color="#6366f1" />
                                    <div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#a5b4fc' }}>{report.summary.total_projects}</div>
                                        <div className="text-xs text-muted">Projects</div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ padding: 16, borderRadius: 'var(--radius-sm)', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <FlaskConical size={20} color="#10b981" />
                                    <div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#6ee7b7' }}>{report.summary.experiments_completed}/{report.summary.total_experiments}</div>
                                        <div className="text-xs text-muted">Experiments (Done/Total)</div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ padding: 16, borderRadius: 'var(--radius-sm)', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <CheckCircle size={20} color="#f97316" />
                                    <div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fdba74' }}>{report.summary.task_completion_rate}%</div>
                                        <div className="text-xs text-muted">Task Completion Rate</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Projects */}
                        {report.projects.length > 0 && (
                            <div style={{ marginBottom: 28 }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)' }}>📁 Projects</h3>
                                <div className="table-container">
                                    <table>
                                        <thead><tr><th>Project</th><th>Status</th><th>Progress</th><th>Experiments</th><th>Dates</th></tr></thead>
                                        <tbody>
                                            {report.projects.map((p, i) => (
                                                <tr key={i}>
                                                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                                                    <td><span className="badge badge-indigo">{p.status}</span></td>
                                                    <td>{p.progress}%</td>
                                                    <td>{p.experiment_count}</td>
                                                    <td className="text-sm text-muted">{p.start_date || '—'} → {p.end_date || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Experiments */}
                        {report.experiments.length > 0 && (
                            <div style={{ marginBottom: 28 }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)' }}>🧪 Experiments</h3>
                                <div className="table-container">
                                    <table>
                                        <thead><tr><th>Experiment</th><th>Type</th><th>Status</th><th>Progress</th><th>Project</th><th>Subtasks</th></tr></thead>
                                        <tbody>
                                            {report.experiments.map((e, i) => (
                                                <tr key={i}>
                                                    <td style={{ fontWeight: 500 }}>{e.name}</td>
                                                    <td><span className={`badge ${e.type === 'Wet-lab' ? 'badge-emerald' : 'badge-cyan'}`}>{e.type}</span></td>
                                                    <td><span className="badge badge-indigo">{e.status}</span></td>
                                                    <td>{e.progress}%</td>
                                                    <td className="text-sm text-muted">{e.project}</td>
                                                    <td>{e.subtasks_completed}/{e.subtasks_total}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Task Summary */}
                        <div style={{ marginBottom: 28 }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)' }}>📋 Daily Tasks Summary</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                                <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', textAlign: 'center' }}><div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{report.daily_tasks.total}</div><div className="text-xs text-muted">Total</div></div>
                                <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', textAlign: 'center' }}><div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#6ee7b7' }}>{report.daily_tasks.completed}</div><div className="text-xs text-muted">Completed</div></div>
                                <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', textAlign: 'center' }}><div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fdba74' }}>{report.daily_tasks.in_progress}</div><div className="text-xs text-muted">In Progress</div></div>
                                <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', textAlign: 'center' }}><div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#93c5fd' }}>{report.daily_tasks.pending}</div><div className="text-xs text-muted">Pending</div></div>
                            </div>
                        </div>

                        {/* Manuscripts */}
                        {report.manuscripts.length > 0 && (
                            <div style={{ marginBottom: 28 }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)' }}>✍️ Manuscripts</h3>
                                <div className="table-container">
                                    <table>
                                        <thead><tr><th>Title</th><th>Status</th><th>Target Journal</th><th>Progress</th></tr></thead>
                                        <tbody>
                                            {report.manuscripts.map((m, i) => (
                                                <tr key={i}>
                                                    <td style={{ fontWeight: 500 }}>{m.title}</td>
                                                    <td><span className="badge badge-indigo">{m.status}</span></td>
                                                    <td className="text-sm text-muted">{m.target_journal || '—'}</td>
                                                    <td>{m.progress}%</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Recent Activities */}
                        {report.activities.length > 0 && (
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)' }}>📝 Activity Log (Recent {Math.min(report.activities.length, 20)})</h3>
                                <div className="table-container">
                                    <table>
                                        <thead><tr><th>Date</th><th>User</th><th>Action</th><th>Item</th></tr></thead>
                                        <tbody>
                                            {report.activities.slice(0, 20).map((a, i) => (
                                                <tr key={i}>
                                                    <td className="text-sm text-muted">{format(new Date(a.date), 'MMM d, h:mm a')}</td>
                                                    <td>{a.user}</td>
                                                    <td>{a.action}</td>
                                                    <td className="text-sm text-muted">{a.entity_name || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div style={{ marginTop: 32, paddingTop: 16, borderTop: '2px solid var(--border-primary)', textAlign: 'center' }}>
                            <p className="text-xs text-muted">BioLIMS — Lab Information & Experiment Management System</p>
                            <p className="text-xs text-muted">Report generated on {format(new Date(report.generated_at), 'MMMM d, yyyy')}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
