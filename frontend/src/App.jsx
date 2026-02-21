import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Trips from './pages/Trips';
import DispatchForm from './pages/DispatchForm';
import Maintenance from './pages/Maintenance';
import FinancialAnalytics from './pages/FinancialAnalytics';

const isLoggedIn = () => !!localStorage.getItem('fleetflow_token');

function PrivateRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
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
          <Route path="vehicles"   element={<Vehicles />} />
          <Route path="drivers"    element={<Drivers />} />
          <Route path="trips"      element={<Trips />} />
          <Route path="dispatch"   element={<DispatchForm />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="analytics"  element={<FinancialAnalytics />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}