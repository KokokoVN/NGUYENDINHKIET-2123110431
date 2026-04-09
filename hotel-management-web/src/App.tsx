import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { BookingsPage } from './pages/BookingsPage';
import { CustomersPage } from './pages/CustomersPage';
import { DashboardPage } from './pages/DashboardPage';
import { HotelsPage } from './pages/HotelsPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { LoginPage } from './pages/LoginPage';
import { RoomTypesPage } from './pages/RoomTypesPage';
import { RoomsPage } from './pages/RoomsPage';
import { UsersPage } from './pages/UsersPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="hotels" element={<HotelsPage />} />
          <Route path="room-types" element={<RoomTypesPage />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="users" element={<UsersPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
