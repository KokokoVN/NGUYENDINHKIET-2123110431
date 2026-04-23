import { createCrudService } from './crudFactory';

export const hotelService = createCrudService('/api/hotels');
export const roomTypeService = createCrudService('/api/room-types');
export const roomService = createCrudService('/api/rooms');
