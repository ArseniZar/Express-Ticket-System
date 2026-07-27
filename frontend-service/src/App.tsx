import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';  
import Navbar from './components/Navbar';
import AuthPage from './client/pages/AuthPage';
import EventCatalogPage from './client/pages/EventCatalogPage';
import BookingPage from './client/pages/BookingPage';
import CheckoutPage from './client/pages/CheckoutPage'; 
import ProfilePage from './client/pages/ProfilePage';
import AdminEventsPage from './admin/pages/AdminEventsPage'; 
import AuditLogPage from './admin/pages/AdminAuditLogsPage';
import AdminUserManagementPage from './admin/pages/AdminUserManagementPage';

export default function App() {
  return (
    <AuthProvider> { }
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<AuthPage />} />
              <Route path="/events" element={<EventCatalogPage />} />
              <Route path="/booking/:eventId" element={<BookingPage />} />
              <Route path="/checkout/:bookingId" element={<CheckoutPage />} /> 
              <Route path="/profile" element={<ProfilePage />} />
              
              <Route path="/admin" element={<AdminEventsPage />} />         
              <Route path="/admin/users" element={<AdminUserManagementPage />} /> 
              <Route path="/admin/audit" element={<AuditLogPage />} />       
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}