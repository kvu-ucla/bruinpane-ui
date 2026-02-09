import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import SystemsList from './pages/SystemsList';
import SystemDetail from './pages/SystemDetail';
import PlaceholderPage from './pages/PlaceholderPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/systems" replace />} />
          <Route path="systems" element={<SystemsList />} />
          {/*<Route path="systems/:id" element={<SystemDetail />} />*/}
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
