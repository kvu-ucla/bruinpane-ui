import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { PlaceOSProvider } from '../PlaceOSContext';

export const ProtectedRoute = () => {
    const auth = useAuth();
    if (auth?.isForbidden) return <Navigate to="/unauthorized" replace />;
    return (
        <PlaceOSProvider>
            <Outlet />
        </PlaceOSProvider>
    );
};
