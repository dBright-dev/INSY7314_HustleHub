// client/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Dashboard from './pages/Dashboard';
import BrowseGigs from './pages/BrowseGigs';
import MyGigs from './pages/MyGigs';
import MyBookings from './pages/MyBookings';
import IncomeSummary from './pages/IncomeSummary';
import Profile from './pages/Profile';

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<LoginForm />} />
                    <Route path="/register" element={<RegisterForm />} />

                    {/* Protected routes */}
                    <Route element={<ProtectedRoute />}>
                        <Route element={<AppShell />}>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/browse-gigs" element={<BrowseGigs />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route element={<ProtectedRoute allowedRoles={['Client']} />}>
                                <Route path="/my-bookings" element={<MyBookings />} />
                            </Route>
                            <Route element={<ProtectedRoute allowedRoles={['Freelancer']} />}>
                                <Route path="/my-gigs" element={<MyGigs />} />
                                <Route path="/incoming-bookings" element={<MyBookings />} />
                                <Route path="/income" element={<IncomeSummary />} />
                            </Route>
                        </Route>
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

// AppShell = Sidebar + main content area (Outlet)
import { Outlet } from 'react-router-dom';
function AppShell() {
    return (
        <div className="app-shell">
            <Sidebar />
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}