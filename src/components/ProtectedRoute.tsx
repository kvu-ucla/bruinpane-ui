import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export const ProtectedRoute = () => {
    const auth = useAuth();
    if (auth?.isForbidden) return <Navigate to="/forbidden" replace />;
    return <Outlet />;
};
