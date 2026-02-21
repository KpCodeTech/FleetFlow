import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Trips from './pages/Trips';
import DispatchForm from './pages/DispatchForm';
import Maintenance from './pages/Maintenance';
import Expenses from './pages/Expenses';
import FinancialAnalytics from './pages/FinancialAnalytics';

// RBAC: which roles can access which paths
const ROLE_ROUTES = {
  MANAGER:        ['/', '/vehicles', '/drivers', '/trips', '/dispatch', '/maintenance', '/expenses', '/analytics'],
  DISPATCHER:     ['/', '/vehicles', '/drivers', '/trips', '/dispatch', '/expenses'],
  SAFETY_OFFICER: ['/', '/drivers', '/trips', '/vehicles'],
  FINANCE:        ['/', '/analytics', '/expenses', '/trips'],
};

const getUser = () => {
  try { return JSON.parse(localStorage.getItem('fleetflow_user') || '{}'); }
  catch { return {}; }
};

function PrivateRoute({ children, path }) {
  const user = getUser();
  if (!localStorage.getItem('fleetflow_token')) return <Navigate to="/login" replace />;
  const allowed = ROLE_ROUTES[user.role] || [];
  if (path && !allowed.includes(path)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="vehicles"    element={<PrivateRoute path="/vehicles"><Vehicles /></PrivateRoute>} />
          <Route path="drivers"     element={<PrivateRoute path="/drivers"><Drivers /></PrivateRoute>} />
          <Route path="trips"       element={<PrivateRoute path="/trips"><Trips /></PrivateRoute>} />
          <Route path="dispatch"    element={<PrivateRoute path="/dispatch"><DispatchForm /></PrivateRoute>} />
          <Route path="maintenance" element={<PrivateRoute path="/maintenance"><Maintenance /></PrivateRoute>} />
          <Route path="expenses"    element={<PrivateRoute path="/expenses"><Expenses /></PrivateRoute>} />
          <Route path="analytics"   element={<PrivateRoute path="/analytics"><FinancialAnalytics /></PrivateRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}