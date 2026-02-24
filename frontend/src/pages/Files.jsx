import { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { Upload, Search, HardDrive, File, FileText, Image, Trash2, Download, X } from 'lucide-react';
import { format } from 'date-fns';

function formatSize(bytes) {
    if (!bytes) return '—';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileIcon(mime) {
    if (mime?.startsWith('image/')) return <Image size={20} color="#ec4899" />;
    if (mime?.includes('pdf')) return <FileText size={20} color="#ef4444" />;
    return <File size={20} color="#6366f1" />;
}

export default function Files() {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [uploading, setUploading] = useState(false);

    const fetchFiles = () => {
        const params = {};
        if (search) params.search = search;
        if (filter !== 'all') params.entity_type = filter;
        api.get('/files', { params }).then(res => setFiles(res.data)).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(() => { fetchFiles(); }, [search, filter]);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('entity_type', 'general');
        try {
            await api.post('/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            fetchFiles();
            toast.success('File uploaded');
        } catch (err) { toast.error('Upload failed'); }
        finally { setUploading(false); e.target.value = ''; }
    };

    const deleteFile = async (id) => {
        try { await api.delete(`/files/${id}`); setFiles(prev => prev.filter(f => f.id !== id)); toast.success('Deleted'); } catch { toast.error('Failed'); }
    };

    return (
        <div className="page-container">
            <div className="flex items-center justify-between mb-24">
                <div><h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>File Repository</h2><p className="text-muted mt-8">Reports, datasets, presentations & more</p></div>
                <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
                    <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload File'}
                    <input type="file" hidden onChange={handleUpload} disabled={uploading} />
                </label>
            </div>

            <div className="filter-bar">
                <div className="search-bar" style={{ minWidth: 240 }}><Search size={16} /><input placeholder="Search files..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                {['all', 'project', 'experiment', 'protocol', 'general'].map(f => (
                    <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}</button>
                ))}
            </div>

            {loading ? <div className="loading-screen" style={{ minHeight: '40vh' }}><div className="spinner" /></div> : files.length === 0 ? (
                <div className="empty-state" style={{ minHeight: '40vh' }}><HardDrive size={48} /><h3>No files uploaded yet</h3></div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead><tr><th>File</th><th>Type</th><th>Size</th><th>Category</th><th>Uploaded</th><th style={{ width: 80 }}>Actions</th></tr></thead>
                        <tbody>
                            {files.map(f => (
                                <tr key={f.id}>
                                    <td><div className="flex items-center gap-12">{getFileIcon(f.mime_type)}<div><div style={{ fontWeight: 500 }}>{f.original_name}</div>{f.tags?.length > 0 && <div className="flex gap-8 mt-8">{f.tags.map(t => <span key={t} className="badge badge-gray">{t}</span>)}</div>}</div></div></td>
                                    <td><span className="text-sm text-muted">{f.mime_type?.split('/')[1]?.toUpperCase() || '—'}</span></td>
                                    <td><span className="text-sm text-muted">{formatSize(f.size)}</span></td>
                                    <td><span className="badge badge-indigo">{f.entity_type}</span></td>
                                    <td><span className="text-sm text-muted">{format(new Date(f.createdAt), 'MMM d, yyyy')}</span></td>
                                    <td>
                                        <div className="flex gap-8">
                                            <a href={`/api/files/${f.id}/download`} className="btn btn-ghost btn-icon" title="Download"><Download size={14} /></a>
                                            <button className="btn btn-ghost btn-icon" onClick={() => deleteFile(f.id)} style={{ color: '#ef4444' }}><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
