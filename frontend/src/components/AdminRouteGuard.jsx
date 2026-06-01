import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminRouteGuard({ children }) {
    const [verified, setVerified] = useState(null);

    useEffect(() => {
        const verifyAdmin = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                
                // Read local storage to see if we have token (fallback header)
                let token = '';
                const userInfo = localStorage.getItem('userInfo');
                if (userInfo) {
                    const parsed = JSON.parse(userInfo);
                    token = parsed.token;
                }

                // Explicit pre-flight cryptographic verification check against backend endpoint
                const { data } = await axios.get(`${API_URL}/api/admin/verify`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    withCredentials: true // send HTTP-Only cookies
                });

                if (data.success && data.user && data.user.role === 'ADMIN') {
                    setVerified(true);
                } else {
                    handleFailure();
                }
            } catch (err) {
                handleFailure();
            }
        };

        const handleFailure = () => {
            // Instantly wipe active view memory state
            setVerified(false);
            localStorage.removeItem('userInfo');
            sessionStorage.removeItem('adminSecretKey');
            
            // Hard redirection to default login screen (prevents layout cache inheritance bypass)
            window.location.replace('/login');
        };

        verifyAdmin();
    }, []);

    if (verified === null) {
        // Luxury premium loading screen matching platform aesthetic
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs text-gray-500 font-mono tracking-widest uppercase">Authenticating Secure Claims...</p>
                </div>
            </div>
        );
    }

    return verified ? children : null;
}
