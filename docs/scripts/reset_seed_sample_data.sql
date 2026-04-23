SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRANSACTION;

BEGIN TRY
    -- Keep AppUser/AppRole/AppUserRole data intact.
    DELETE FROM dbo.AuditLog;
    DELETE FROM dbo.MaintenanceTicket;
    DELETE FROM dbo.HousekeepingTask;
    DELETE FROM dbo.Invoice;
    DELETE FROM dbo.Payment;
    DELETE FROM dbo.ServiceOrder;
    DELETE FROM dbo.Stay;
    DELETE FROM dbo.Reservation;
    DELETE FROM dbo.Guest;
    DELETE FROM dbo.Customer;
    DELETE FROM dbo.HotelService;
    DELETE FROM dbo.Room;
    DELETE FROM dbo.RoomType;
    DELETE FROM dbo.Hotel;

    DBCC CHECKIDENT ('dbo.Hotel', RESEED, 0);
    DBCC CHECKIDENT ('dbo.RoomType', RESEED, 0);
    DBCC CHECKIDENT ('dbo.Room', RESEED, 0);
    DBCC CHECKIDENT ('dbo.Customer', RESEED, 0);
    DBCC CHECKIDENT ('dbo.Guest', RESEED, 0);
    DBCC CHECKIDENT ('dbo.Reservation', RESEED, 0);
    DBCC CHECKIDENT ('dbo.Stay', RESEED, 0);
    DBCC CHECKIDENT ('dbo.ServiceOrder', RESEED, 0);
    DBCC CHECKIDENT ('dbo.Payment', RESEED, 0);
    DBCC CHECKIDENT ('dbo.Invoice', RESEED, 0);
    DBCC CHECKIDENT ('dbo.HousekeepingTask', RESEED, 0);
    DBCC CHECKIDENT ('dbo.MaintenanceTicket', RESEED, 0);
    DBCC CHECKIDENT ('dbo.HotelService', RESEED, 0);
    DBCC CHECKIDENT ('dbo.AuditLog', RESEED, 0);

    DECLARE @i INT = 1;
    DECLARE @today DATE = CAST(GETDATE() AS DATE);

    WHILE @i <= 20
    BEGIN
        INSERT INTO dbo.Hotel (HotelName, Address, Phone, Email, IsActive)
        VALUES (
            CONCAT(N'Khách sạn mẫu ', @i),
            CONCAT(N'Số ', @i, N' Đường Demo, Quận ', ((@i - 1) % 5) + 1),
            CONCAT('090', RIGHT(CONCAT('0000000', @i), 7)),
            CONCAT('hotel', @i, '@example.com'),
            1
        );

        INSERT INTO dbo.RoomType (HotelId, RoomTypeName, Capacity, BaseRate, Description, IsActive)
        VALUES (
            @i,
            CONCAT(N'Loại phòng mẫu ', @i),
            ((@i - 1) % 4) + 1,
            CAST(350000 + (@i * 50000) AS DECIMAL(18,2)),
            CONCAT(N'Mô tả loại phòng mẫu ', @i),
            1
        );

        INSERT INTO dbo.Room (HotelId, RoomTypeId, RoomNumber, StatusCode, Floor, IsActive)
        VALUES (
            @i,
            @i,
            CONCAT('R', RIGHT(CONCAT('000', @i), 3)),
            CASE WHEN @i % 3 = 0 THEN 'OCCUPIED' ELSE 'VACANT' END,
            CAST(((@i - 1) % 10) + 1 AS NVARCHAR(10)),
            1
        );

        INSERT INTO dbo.Customer (CustomerType, FullName, CompanyName, TaxCode, Phone, Email, Notes, LoyaltyPoints, LoyaltyTier, DeletedAt)
        VALUES (
            CASE WHEN @i % 3 = 0 THEN 'COMPANY' ELSE 'INDIVIDUAL' END,
            CONCAT(N'Khách hàng ', @i),
            CASE WHEN @i % 3 = 0 THEN CONCAT(N'Công ty mẫu ', @i) ELSE NULL END,
            CASE WHEN @i % 3 = 0 THEN CONCAT('TAX', RIGHT(CONCAT('000000', @i), 6)) ELSE NULL END,
            CONCAT('091', RIGHT(CONCAT('0000000', @i), 7)),
            CONCAT('customer', @i, '@example.com'),
            CONCAT(N'Ghi chú khách hàng mẫu ', @i),
            @i * 10,
            CASE
                WHEN @i * 10 >= 1000 THEN 'PLATINUM'
                WHEN @i * 10 >= 500 THEN 'GOLD'
                WHEN @i * 10 >= 200 THEN 'SILVER'
                ELSE 'BRONZE'
            END,
            NULL
        );

        INSERT INTO dbo.Guest (FullName, Phone, Email, IdType, IdNumber, DateOfBirth, Nationality, CreatedAt, UpdatedAt, DeletedAt)
        VALUES (
            CONCAT(N'Khách lưu trú ', @i),
            CONCAT('092', RIGHT(CONCAT('0000000', @i), 7)),
            CONCAT('guest', @i, '@example.com'),
            'CCCD',
            CONCAT('079', RIGHT(CONCAT('000000000', @i), 9)),
            DATEADD(YEAR, -20 - (@i % 15), @today),
            N'Việt Nam',
            DATEADD(DAY, -@i, GETUTCDATE()),
            GETUTCDATE(),
            NULL
        );

        INSERT INTO dbo.Reservation (HotelId, RoomId, CustomerId, StatusCode, CheckInDate, CheckOutDate, Adults, Children, RatePerNight, SpecialRequest)
        VALUES (
            @i,
            @i,
            @i,
            CASE WHEN @i % 5 = 0 THEN 'CHECKED_OUT' WHEN @i % 4 = 0 THEN 'CHECKED_IN' ELSE 'CONFIRMED' END,
            DATEADD(DAY, @i, @today),
            DATEADD(DAY, @i + 2, @today),
            1 + (@i % 3),
            @i % 2,
            CAST(400000 + (@i * 60000) AS DECIMAL(18,2)),
            CONCAT(N'Yêu cầu mẫu ', @i)
        );

        INSERT INTO dbo.Stay (HotelId, RoomId, ReservationId, StatusCode, CheckInAt, CheckOutAt, DepositAmount, Notes, CreatedAt, UpdatedAt)
        VALUES (
            @i,
            @i,
            @i,
            CASE WHEN @i % 5 = 0 THEN 'CHECKED_OUT' ELSE 'IN_HOUSE' END,
            DATEADD(DAY, -(@i % 5), GETUTCDATE()),
            CASE WHEN @i % 5 = 0 THEN GETUTCDATE() ELSE NULL END,
            CAST(100000 + (@i * 10000) AS DECIMAL(18,2)),
            CONCAT(N'Lưu trú mẫu ', @i),
            GETUTCDATE(),
            GETUTCDATE()
        );

        INSERT INTO dbo.HotelService (HotelId, ServiceCode, ServiceName, DefaultUnitPrice, IsActive, CreatedAt, UpdatedAt)
        VALUES (
            @i,
            CONCAT('SERVICE_', RIGHT(CONCAT('00', @i), 2)),
            CONCAT(N'Dịch vụ mẫu ', @i),
            CAST(30000 + (@i * 5000) AS DECIMAL(18,2)),
            1,
            GETUTCDATE(),
            GETUTCDATE()
        );

        INSERT INTO dbo.ServiceOrder (StayId, ServiceCode, Description, Quantity, UnitPrice, StatusCode, CancelReason, CreatedAt, UpdatedAt)
        VALUES (
            @i,
            CONCAT('SERVICE_', RIGHT(CONCAT('00', @i), 2)),
            CONCAT(N'Sử dụng dịch vụ mẫu ', @i),
            1 + (@i % 3),
            CAST(30000 + (@i * 5000) AS DECIMAL(18,2)),
            CASE WHEN @i % 6 = 0 THEN 'CANCELLED' ELSE 'ACTIVE' END,
            CASE WHEN @i % 6 = 0 THEN N'Khách hủy' ELSE NULL END,
            GETUTCDATE(),
            GETUTCDATE()
        );

        INSERT INTO dbo.Payment (StayId, ReservationId, PaymentType, MethodCode, Amount, StatusCode, ReferenceNo, Note, CreatedAt, UpdatedAt)
        VALUES (
            CASE WHEN @i <= 10 THEN @i ELSE NULL END,
            CASE WHEN @i > 10 THEN @i ELSE NULL END,
            'CHARGE',
            CASE WHEN @i % 2 = 0 THEN 'CASH' ELSE 'BANK_TRANSFER' END,
            CAST(300000 + (@i * 75000) AS DECIMAL(18,2)),
            CASE WHEN @i % 7 = 0 THEN 'VOID' ELSE 'PAID' END,
            CONCAT('REF', RIGHT(CONCAT('0000', @i), 4)),
            CONCAT(N'Thanh toán mẫu ', @i),
            GETUTCDATE(),
            GETUTCDATE()
        );

        INSERT INTO dbo.Invoice (BookingId, RoomAmount, ServiceAmount, TotalAmount, PaidAt, PaymentMethod, Note)
        VALUES (
            @i,
            CAST(800000 + (@i * 65000) AS DECIMAL(18,2)),
            CAST(50000 + (@i * 7000) AS DECIMAL(18,2)),
            CAST((800000 + (@i * 65000)) + (50000 + (@i * 7000)) AS DECIMAL(18,2)),
            GETUTCDATE(),
            CASE WHEN @i % 2 = 0 THEN 'CASH' ELSE 'BANK_TRANSFER' END,
            CONCAT(N'Hóa đơn mẫu ', @i)
        );

        INSERT INTO dbo.HousekeepingTask (RoomId, AssignedTo, StatusCode, Note, CreatedAt, UpdatedAt, DeletedAt)
        VALUES (
            @i,
            NULL,
            CASE WHEN @i % 4 = 0 THEN 'DONE' ELSE 'OPEN' END,
            CONCAT(N'Công việc buồng phòng mẫu ', @i),
            GETUTCDATE(),
            GETUTCDATE(),
            NULL
        );

        INSERT INTO dbo.MaintenanceTicket (RoomId, AssignedTo, Title, Description, StatusCode, CancelReason, CreatedAt, UpdatedAt, DeletedAt)
        VALUES (
            @i,
            NULL,
            CONCAT(N'Ticket kỹ thuật mẫu ', @i),
            CONCAT(N'Mô tả ticket kỹ thuật mẫu ', @i),
            CASE WHEN @i % 5 = 0 THEN 'IN_PROGRESS' ELSE 'OPEN' END,
            NULL,
            GETUTCDATE(),
            GETUTCDATE(),
            NULL
        );

        INSERT INTO dbo.AuditLog (ActorUserId, Action, EntityName, EntityId, Reason, BeforeJson, AfterJson, CreatedAt)
        VALUES (
            NULL,
            'SEED_SAMPLE',
            'System',
            CAST(@i AS NVARCHAR(20)),
            CONCAT(N'Khởi tạo dữ liệu mẫu lần ', @i),
            NULL,
            NULL,
            GETUTCDATE()
        );

        SET @i += 1;
    END

    COMMIT TRANSACTION;
    PRINT N'Done: reset + seeded 20 rows per business table (kept user tables).';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
