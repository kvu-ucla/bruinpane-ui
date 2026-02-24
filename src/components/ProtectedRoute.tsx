import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PlaceOSProvider } from '../PlaceOSContext';

export const ProtectedRoute = () => {
    const { isForbidden } = useAuth();
    if (isForbidden) return <Navigate to="/unauthorized" replace />;
    return (
        <PlaceOSProvider>
            <Outlet />
        </PlaceOSProvider>
    );
};
