import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { BookingNewPage } from './pages/bookings/BookingNewPage';
import { BookingShowPage } from './pages/bookings/BookingShowPage';
import { BookingsListPage } from './pages/bookings/BookingsListPage';
import { DashboardPage } from './pages/DashboardPage';
import { InvoiceNewPage } from './pages/invoices/InvoiceNewPage';
import { InvoiceShowPage } from './pages/invoices/InvoiceShowPage';
import { InvoicesListPage } from './pages/invoices/InvoicesListPage';
import { LoginPage } from './pages/LoginPage';
import { CustomerEditPage } from './pages/customers/CustomerEditPage';
import { CustomersListPage } from './pages/customers/CustomersListPage';
import { CustomerNewPage } from './pages/customers/CustomerNewPage';
import { CustomerShowPage } from './pages/customers/CustomerShowPage';
import { HotelEditPage } from './pages/hotels/HotelEditPage';
import { HotelsListPage } from './pages/hotels/HotelsListPage';
import { HotelNewPage } from './pages/hotels/HotelNewPage';
import { HotelShowPage } from './pages/hotels/HotelShowPage';
import { PaymentNewPage } from './pages/payments/PaymentNewPage';
import { PaymentShowPage } from './pages/payments/PaymentShowPage';
import { PaymentsListPage } from './pages/payments/PaymentsListPage';
import { ServiceEditPage } from './pages/services/ServiceEditPage';
import { ServiceNewPage } from './pages/services/ServiceNewPage';
import { ServiceShowPage } from './pages/services/ServiceShowPage';
import { ServicesListPage } from './pages/services/ServicesListPage';
import { ServiceOrderNewPage } from './pages/service-orders/ServiceOrderNewPage';
import { ServiceOrderShowPage } from './pages/service-orders/ServiceOrderShowPage';
import { ServiceOrdersListPage } from './pages/service-orders/ServiceOrdersListPage';
import { StayShowPage } from './pages/stays/StayShowPage';
import { StaysListPage } from './pages/stays/StaysListPage';
import { RoomEditPage } from './pages/rooms/RoomEditPage';
import { RoomsListPage } from './pages/rooms/RoomsListPage';
import { RoomNewPage } from './pages/rooms/RoomNewPage';
import { RoomShowPage } from './pages/rooms/RoomShowPage';
import { RoomTypeEditPage } from './pages/room-types/RoomTypeEditPage';
import { RoomTypesListPage } from './pages/room-types/RoomTypesListPage';
import { RoomTypeNewPage } from './pages/room-types/RoomTypeNewPage';
import { RoomTypeShowPage } from './pages/room-types/RoomTypeShowPage';

export default function App() {
  return (
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
  );
}
