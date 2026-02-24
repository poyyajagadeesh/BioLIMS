import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('lims_token');
        const saved = localStorage.getItem('lims_user');
        if (token && saved) {
            setUser(JSON.parse(saved));
            api.get('/auth/me').then(res => {
                setUser(res.data.user);
                localStorage.setItem('lims_user', JSON.stringify(res.data.user));
            }).catch(() => {
                localStorage.removeItem('lims_token');
                localStorage.removeItem('lims_user');
                setUser(null);
            }).finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('lims_token', res.data.token);
        localStorage.setItem('lims_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('lims_token');
        localStorage.removeItem('lims_user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
