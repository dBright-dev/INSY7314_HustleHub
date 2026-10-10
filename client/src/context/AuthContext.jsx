// client/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest, saveAuth, clearAuth, getSavedUser } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const saved = getSavedUser();
        if (saved) setUser(saved);
        setLoading(false);
    }, []);

    const register = async (userData) => {
        const data = await apiRequest('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
        const { token, user: registeredUser } = data.data || data;
        saveAuth(token, registeredUser);
        setUser(registeredUser);
        return registeredUser;
    };

    const login = async (email, password) => {
        const data = await apiRequest('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        const { token, user: loggedUser } = data.data || data;
        saveAuth(token, loggedUser);
        setUser(loggedUser);
        return loggedUser;
    };

    const logout = () => {
        clearAuth();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}