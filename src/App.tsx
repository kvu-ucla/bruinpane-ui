import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Routes, Route, Navigate, HashRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SystemsList } from './pages/SystemsList';
import { SystemDetail } from './pages/SystemDetail';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { useAuth } from './hooks/useAuth';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

export const App = () => {
    const { isAuthenticated, loading, isForbidden } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <QueryClientProvider client={queryClient}>
            <HashRouter>
                <Routes>
                    <Route path="/unauthorized" element={isAuthenticated && !isForbidden ? <Navigate to="/" replace /> : <UnauthorizedPage />} />
                    <Route path="/" element={<Layout />}>
                        {isAuthenticated && (
                            <Route element={<ProtectedRoute />}>
                                <Route index element={<Navigate to="/systems" replace />} />
                                <Route path="systems" element={<SystemsList />} />
                                <Route path="systems/:id" element={<SystemDetail />} />
                                <Route path="modules" element={<PlaceholderPage title="Modules" />} />
                                <Route path="zones" element={<PlaceholderPage title="Zones" />} />
                                <Route path="drivers" element={<PlaceholderPage title="Drivers" />} />
                                <Route path="repositories" element={<PlaceholderPage title="Repositories" />} />
                                <Route path="triggers" element={<PlaceholderPage title="Triggers" />} />
                                <Route path="alerts" element={<PlaceholderPage title="Alerts" />} />
                                <Route path="metrics" element={<PlaceholderPage title="Metrics" />} />
                                <Route path="users" element={<PlaceholderPage title="Users" />} />
                                <Route path="domains" element={<PlaceholderPage title="Domains" />} />
                                <Route path="manage" element={<PlaceholderPage title="Manage Instance" />} />
                            </Route>
                        )}
                    </Route>
                </Routes>
            </HashRouter>

            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}

