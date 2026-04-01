-- HotelManagement DB - Indexes

USE [HotelManagement];
GO

-- AppUser
CREATE INDEX IX_AppUser_IsActive ON dbo.AppUser(IsActive);
GO

-- Room
CREATE INDEX IX_Room_StatusCode ON dbo.Room(StatusCode);
CREATE INDEX IX_Room_RoomTypeId ON dbo.Room(RoomTypeId);
GO

-- Reservation: queries by room and date range
CREATE INDEX IX_Reservation_Room_Date ON dbo.Reservation(RoomId, CheckInDate, CheckOutDate) INCLUDE (StatusCode, RatePerNight);
CREATE INDEX IX_Reservation_Status ON dbo.Reservation(StatusCode);
GO

-- Stay: queries by room and status
CREATE INDEX IX_Stay_Room_Status ON dbo.Stay(RoomId, StatusCode) INCLUDE (CheckInAt, CheckOutAt);
CREATE INDEX IX_Stay_ReservationId ON dbo.Stay(ReservationId);
GO

-- Payments
CREATE INDEX IX_Payment_StayId ON dbo.Payment(StayId);
CREATE INDEX IX_Payment_ReservationId ON dbo.Payment(ReservationId);
CREATE INDEX IX_Payment_CreatedAt ON dbo.Payment(CreatedAt);
GO

-- ServiceOrder
CREATE INDEX IX_ServiceOrder_StayId ON dbo.ServiceOrder(StayId) INCLUDE (StatusCode, ServiceCode);
GO

-- Housekeeping/Maintenance
CREATE INDEX IX_HousekeepingTask_Room_Status ON dbo.HousekeepingTask(RoomId, StatusCode);
CREATE INDEX IX_MaintenanceTicket_Room_Status ON dbo.MaintenanceTicket(RoomId, StatusCode);
GO

-- AuditLog
CREATE INDEX IX_AuditLog_Entity ON dbo.AuditLog(EntityName, EntityId);
CREATE INDEX IX_AuditLog_CreatedAt ON dbo.AuditLog(CreatedAt);
GO

