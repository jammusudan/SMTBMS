import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasAccess } from '../utils/roles';

const ProtectedRoute = ({ children, roles }) => {
    const { user, loading } = useAuth();

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-[#f5f7fa]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-600"></div>
        </div>
    );

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (roles && !hasAccess(user.role, roles)) {
        return <Navigate to="/" />;
    }

    return children;
};

export default ProtectedRoute;
