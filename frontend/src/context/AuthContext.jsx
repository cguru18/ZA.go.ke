import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            setUser(JSON.parse(userInfo));
        }
    }, []);

    const login = async (email, password) => {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const { data } = await axios.post(`${API_URL}/api/auth/login`, { email, password });
        setUser(data);
        localStorage.setItem('userInfo', JSON.stringify(data));
    };

    // Used by AdminLogin — stores a pre-authenticated user object directly
    const loginDirect = (userObject) => {
        setUser(userObject);
        localStorage.setItem('userInfo', JSON.stringify(userObject));
        
        // Securely store the encryption key in sessionStorage (dies on tab close)
        if (userObject.adminSecretKey) {
            sessionStorage.setItem('adminSecretKey', userObject.adminSecretKey);
        }
    };

    const signup = async (fullName, email, password) => {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const { data } = await axios.post(`${API_URL}/api/auth/signup`, { fullName, email, password });
        setUser(data);
        localStorage.setItem('userInfo', JSON.stringify(data));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('userInfo');
        sessionStorage.removeItem('adminSecretKey');
    };

    return (
        <AuthContext.Provider value={{ user, login, loginDirect, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
