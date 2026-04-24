import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';

const BookingNewPage = lazy(() => import('./pages/bookings/BookingNewPage').then((m) => ({ default: m.BookingNewPage })));
const BookingShowPage = lazy(() => import('./pages/bookings/BookingShowPage').then((m) => ({ default: m.BookingShowPage })));
const BookingsListPage = lazy(() => import('./pages/bookings/BookingsListPage').then((m) => ({ default: m.BookingsListPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const InvoiceNewPage = lazy(() => import('./pages/invoices/InvoiceNewPage').then((m) => ({ default: m.InvoiceNewPage })));
const InvoiceShowPage = lazy(() => import('./pages/invoices/InvoiceShowPage').then((m) => ({ default: m.InvoiceShowPage })));
const InvoicesListPage = lazy(() => import('./pages/invoices/InvoicesListPage').then((m) => ({ default: m.InvoicesListPage })));
const CustomerEditPage = lazy(() => import('./pages/customers/CustomerEditPage').then((m) => ({ default: m.CustomerEditPage })));
const CustomersListPage = lazy(() => import('./pages/customers/CustomersListPage').then((m) => ({ default: m.CustomersListPage })));
const CustomerNewPage = lazy(() => import('./pages/customers/CustomerNewPage').then((m) => ({ default: m.CustomerNewPage })));
const CustomerShowPage = lazy(() => import('./pages/customers/CustomerShowPage').then((m) => ({ default: m.CustomerShowPage })));
const HotelEditPage = lazy(() => import('./pages/hotels/HotelEditPage').then((m) => ({ default: m.HotelEditPage })));
const HotelsListPage = lazy(() => import('./pages/hotels/HotelsListPage').then((m) => ({ default: m.HotelsListPage })));
const HotelNewPage = lazy(() => import('./pages/hotels/HotelNewPage').then((m) => ({ default: m.HotelNewPage })));
const HotelShowPage = lazy(() => import('./pages/hotels/HotelShowPage').then((m) => ({ default: m.HotelShowPage })));
const PaymentNewPage = lazy(() => import('./pages/payments/PaymentNewPage').then((m) => ({ default: m.PaymentNewPage })));
const PaymentShowPage = lazy(() => import('./pages/payments/PaymentShowPage').then((m) => ({ default: m.PaymentShowPage })));
const PaymentsListPage = lazy(() => import('./pages/payments/PaymentsListPage').then((m) => ({ default: m.PaymentsListPage })));
const ServiceEditPage = lazy(() => import('./pages/services/ServiceEditPage').then((m) => ({ default: m.ServiceEditPage })));
const ServiceNewPage = lazy(() => import('./pages/services/ServiceNewPage').then((m) => ({ default: m.ServiceNewPage })));
const ServiceShowPage = lazy(() => import('./pages/services/ServiceShowPage').then((m) => ({ default: m.ServiceShowPage })));
const ServicesListPage = lazy(() => import('./pages/services/ServicesListPage').then((m) => ({ default: m.ServicesListPage })));
const ServiceOrderNewPage = lazy(() => import('./pages/service-orders/ServiceOrderNewPage').then((m) => ({ default: m.ServiceOrderNewPage })));
const ServiceOrderShowPage = lazy(() => import('./pages/service-orders/ServiceOrderShowPage').then((m) => ({ default: m.ServiceOrderShowPage })));
const ServiceOrdersListPage = lazy(() => import('./pages/service-orders/ServiceOrdersListPage').then((m) => ({ default: m.ServiceOrdersListPage })));
const StayShowPage = lazy(() => import('./pages/stays/StayShowPage').then((m) => ({ default: m.StayShowPage })));
const StaysListPage = lazy(() => import('./pages/stays/StaysListPage').then((m) => ({ default: m.StaysListPage })));
const RoomEditPage = lazy(() => import('./pages/rooms/RoomEditPage').then((m) => ({ default: m.RoomEditPage })));
const RoomsListPage = lazy(() => import('./pages/rooms/RoomsListPage').then((m) => ({ default: m.RoomsListPage })));
const RoomNewPage = lazy(() => import('./pages/rooms/RoomNewPage').then((m) => ({ default: m.RoomNewPage })));
const RoomShowPage = lazy(() => import('./pages/rooms/RoomShowPage').then((m) => ({ default: m.RoomShowPage })));
const RoomTypeEditPage = lazy(() => import('./pages/room-types/RoomTypeEditPage').then((m) => ({ default: m.RoomTypeEditPage })));
const RoomTypesListPage = lazy(() => import('./pages/room-types/RoomTypesListPage').then((m) => ({ default: m.RoomTypesListPage })));
const RoomTypeNewPage = lazy(() => import('./pages/room-types/RoomTypeNewPage').then((m) => ({ default: m.RoomTypeNewPage })));
const RoomTypeShowPage = lazy(() => import('./pages/room-types/RoomTypeShowPage').then((m) => ({ default: m.RoomTypeShowPage })));

export default function App() {
  return (
    <Suspense fallback={<div style={{ padding: '1rem' }}>Đang tải...</div>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="hotels" element={<HotelsListPage />} />
            <Route path="hotels/new" element={<HotelNewPage />} />
            <Route path="hotels/:id" element={<HotelShowPage />} />
            <Route path="hotels/:id/edit" element={<HotelEditPage />} />
            <Route path="room-types" element={<RoomTypesListPage />} />
            <Route path="room-types/new" element={<RoomTypeNewPage />} />
            <Route path="room-types/:id" element={<RoomTypeShowPage />} />
            <Route path="room-types/:id/edit" element={<RoomTypeEditPage />} />
            <Route path="rooms" element={<RoomsListPage />} />
            <Route path="rooms/new" element={<RoomNewPage />} />
            <Route path="rooms/:id" element={<RoomShowPage />} />
            <Route path="rooms/:id/edit" element={<RoomEditPage />} />
            <Route path="customers" element={<CustomersListPage />} />
            <Route path="customers/new" element={<CustomerNewPage />} />
            <Route path="customers/:id" element={<CustomerShowPage />} />
            <Route path="customers/:id/edit" element={<CustomerEditPage />} />
            <Route path="bookings" element={<BookingsListPage />} />
            <Route path="bookings/new" element={<BookingNewPage />} />
            <Route path="bookings/:id" element={<BookingShowPage />} />
            <Route path="invoices" element={<InvoicesListPage />} />
            <Route path="invoices/new" element={<InvoiceNewPage />} />
            <Route path="invoices/:id" element={<InvoiceShowPage />} />
            <Route path="services" element={<ServicesListPage />} />
            <Route path="services/new" element={<ServiceNewPage />} />
            <Route path="services/:id" element={<ServiceShowPage />} />
            <Route path="services/:id/edit" element={<ServiceEditPage />} />
            <Route path="payments" element={<PaymentsListPage />} />
            <Route path="payments/new" element={<PaymentNewPage />} />
            <Route path="payments/:id" element={<PaymentShowPage />} />
            <Route path="service-orders" element={<ServiceOrdersListPage />} />
            <Route path="service-orders/new" element={<ServiceOrderNewPage />} />
            <Route path="service-orders/:id" element={<ServiceOrderShowPage />} />
            <Route path="stays" element={<StaysListPage />} />
            <Route path="stays/:id" element={<StayShowPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
