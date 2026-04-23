import { createCrudService } from './crudFactory';

export const customerService = createCrudService('/api/customers');
export const bookingService = createCrudService('/api/bookings');
export const stayService = createCrudService('/api/stays');
export const hotelServiceCatalogService = createCrudService('/api/hotel-services');
export const serviceOrderService = createCrudService('/api/service-orders');
export const invoiceService = createCrudService('/api/invoices');
export const paymentService = createCrudService('/api/payments');
