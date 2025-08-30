import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useClientAuth } from '../context/ClientAuthContext';

const ClientProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useClientAuth();
    const location = useLocation();

    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
                <div className="spinner-border text-pink" role="status">
                    <span className="visually-hidden">Chargement...</span>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/client/login" state={{ from: location }} replace />;
    }

    // Render children if authenticated
    return children;
};

export default ClientProtectedRoute;
