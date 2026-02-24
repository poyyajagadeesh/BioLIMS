import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Experiments from './pages/Experiments';
import ExperimentDetail from './pages/ExperimentDetail';
import Members from './pages/Members';
import Protocols from './pages/Protocols';
import Planner from './pages/Planner';
import Reminders from './pages/Reminders';
import Files from './pages/Files';
import Activity from './pages/Activity';

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="loading-screen"><div className="spinner" /><p>Loading BioLIMS...</p></div>;
    if (!user) return <Navigate to="/login" />;
    return children;
}

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="projects" element={<Projects />} />
                <Route path="projects/:id" element={<ProjectDetail />} />
                <Route path="experiments" element={<Experiments />} />
                <Route path="experiments/:id" element={<ExperimentDetail />} />
                <Route path="members" element={<Members />} />
                <Route path="protocols" element={<Protocols />} />
                <Route path="planner" element={<Planner />} />
                <Route path="reminders" element={<Reminders />} />
                <Route path="files" element={<Files />} />
                <Route path="activity" element={<Activity />} />
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}
