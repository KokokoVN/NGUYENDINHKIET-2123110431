SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRANSACTION;
BEGIN TRY
    DELETE FROM dbo.Invoice;
    DELETE FROM dbo.Payment;
    DELETE FROM dbo.ServiceOrder;
    DELETE FROM dbo.Stay;
    DELETE FROM dbo.Reservation;
    DELETE FROM dbo.Customer;
    DELETE FROM dbo.HotelService;
    DELETE FROM dbo.Room;
    DELETE FROM dbo.RoomType;
    DELETE FROM dbo.Hotel;

    DBCC CHECKIDENT ('dbo.Hotel', RESEED, 0);
    DBCC CHECKIDENT ('dbo.RoomType', RESEED, 0);
    DBCC CHECKIDENT ('dbo.Room', RESEED, 0);
    DBCC CHECKIDENT ('dbo.Customer', RESEED, 0);
    DBCC CHECKIDENT ('dbo.Reservation', RESEED, 0);
    DBCC CHECKIDENT ('dbo.Stay', RESEED, 0);
    DBCC CHECKIDENT ('dbo.ServiceOrder', RESEED, 0);
    DBCC CHECKIDENT ('dbo.Payment', RESEED, 0);
    DBCC CHECKIDENT ('dbo.Invoice', RESEED, 0);
    DBCC CHECKIDENT ('dbo.HotelService', RESEED, 0);

    DECLARE @i INT = 1;
    DECLARE @today DATE = CAST(GETDATE() AS DATE);
    DECLARE @hotelName NVARCHAR(200);
    DECLARE @hotelAddress NVARCHAR(500);
    DECLARE @customerName NVARCHAR(200);
    DECLARE @serviceName NVARCHAR(200);

    WHILE @i <= 20
    BEGIN
        SET @hotelName = CASE @i
            WHEN 1 THEN N'Khach san Rex Sai Gon'
            WHEN 2 THEN N'Khach san Caravelle Sai Gon'
            WHEN 3 THEN N'Khach san New World Sai Gon'
            WHEN 4 THEN N'Khach san Majestic Sai Gon'
            WHEN 5 THEN N'Khach san Sheraton Sai Gon'
            WHEN 6 THEN N'Khach san Sofitel Legend Metropole Ha Noi'
            WHEN 7 THEN N'Khach san Melia Ha Noi'
            WHEN 8 THEN N'Khach san Lotte Ha Noi'
            WHEN 9 THEN N'Khach san InterContinental Ha Noi Westlake'
            WHEN 10 THEN N'Khach san Novotel Ha Long Bay'
            WHEN 11 THEN N'Khach san Vinpearl Da Nang'
            WHEN 12 THEN N'Khach san Furama Da Nang'
            WHEN 13 THEN N'Khach san Pullman Da Nang Beach'
            WHEN 14 THEN N'Khach san Mường Thanh Luxury Da Nang'
            WHEN 15 THEN N'Khach san TTC Imperial Hue'
            WHEN 16 THEN N'Khach san Ana Mandara Da Lat'
            WHEN 17 THEN N'Khach san Dalat Palace Heritage'
            WHEN 18 THEN N'Khach san Vinpearl Nha Trang'
            WHEN 19 THEN N'Khach san TTC Can Tho'
            ELSE N'Khach san Vinpearl Phu Quoc'
        END;

        SET @hotelAddress = CASE @i
            WHEN 1 THEN N'141 Nguyen Hue, Quan 1, TP.HCM'
            WHEN 2 THEN N'19-23 Lam Son Square, Quan 1, TP.HCM'
            WHEN 3 THEN N'76 Le Lai, Quan 1, TP.HCM'
            WHEN 4 THEN N'01 Dong Khoi, Quan 1, TP.HCM'
            WHEN 5 THEN N'88 Dong Khoi, Quan 1, TP.HCM'
            WHEN 6 THEN N'15 Ngo Quyen, Hoan Kiem, Ha Noi'
            WHEN 7 THEN N'44B Ly Thuong Kiet, Hoan Kiem, Ha Noi'
            WHEN 8 THEN N'54 Lieu Giai, Ba Dinh, Ha Noi'
            WHEN 9 THEN N'5 Tu Hoa, Tay Ho, Ha Noi'
            WHEN 10 THEN N'160 Ha Long, Bai Chay, Quang Ninh'
            WHEN 11 THEN N'Truong Sa, Ngu Hanh Son, Da Nang'
            WHEN 12 THEN N'105 Vo Nguyen Giap, Ngu Hanh Son, Da Nang'
            WHEN 13 THEN N'101 Vo Nguyen Giap, Da Nang'
            WHEN 14 THEN N'270 Vo Nguyen Giap, Da Nang'
            WHEN 15 THEN N'08 Hung Vuong, TP. Hue'
            WHEN 16 THEN N'Le Lai, TP. Da Lat'
            WHEN 17 THEN N'02 Tran Phu, TP. Da Lat'
            WHEN 18 THEN N'Hon Tre, TP. Nha Trang'
            WHEN 19 THEN N'02 Hai Ba Trung, Ninh Kieu, Can Tho'
            ELSE N'Bai Dai, Ganh Dau, Phu Quoc'
        END;

        SET @customerName = CASE @i
            WHEN 1 THEN N'Nguyen Van An'
            WHEN 2 THEN N'Tran Thi Mai'
            WHEN 3 THEN N'Le Quang Huy'
            WHEN 4 THEN N'Pham Thu Trang'
            WHEN 5 THEN N'Hoang Minh Duc'
            WHEN 6 THEN N'Vo Ngoc Lan'
            WHEN 7 THEN N'Dang Gia Bao'
            WHEN 8 THEN N'Bui Thanh Tam'
            WHEN 9 THEN N'Doan Khac Nam'
            WHEN 10 THEN N'Phan Bao Chau'
            WHEN 11 THEN N'Ngo Thi Ha'
            WHEN 12 THEN N'Ly Tuan Kiet'
            WHEN 13 THEN N'Nguyen Thi Kim Oanh'
            WHEN 14 THEN N'Truong Hai Dang'
            WHEN 15 THEN N'Cao Minh Tri'
            WHEN 16 THEN N'Ha Gia Linh'
            WHEN 17 THEN N'Nguyen Phuong Vy'
            WHEN 18 THEN N'Pham Gia Han'
            WHEN 19 THEN N'Le Thi My Duyen'
            ELSE N'Tran Quoc Viet'
        END;

        SET @serviceName = CASE ((@i - 1) % 6) + 1
            WHEN 1 THEN N'Giat ui nhanh'
            WHEN 2 THEN N'Spa thu gian'
            WHEN 3 THEN N'Dua don san bay'
            WHEN 4 THEN N'An sang buffet'
            WHEN 5 THEN N'Nuoc uong minibar'
            ELSE N'Late check-out'
        END;

        INSERT INTO dbo.Hotel (HotelName, Address, Phone, Email, IsActive, CreatedAt, UpdatedAt)
        VALUES (
            @hotelName,
            @hotelAddress,
            CONCAT('090', RIGHT(CONCAT('0000000', @i), 7)),
            CONCAT('contact', @i, '@hotel.vn'),
            1,
            GETUTCDATE(),
            GETUTCDATE()
        );

        INSERT INTO dbo.RoomType (HotelId, RoomTypeName, Capacity, BaseRate, Description, IsActive, CreatedAt, UpdatedAt)
        VALUES (
            @i,
            CASE ((@i - 1) % 4) + 1
                WHEN 1 THEN N'Deluxe'
                WHEN 2 THEN N'Suite'
                WHEN 3 THEN N'Premier'
                ELSE N'Family'
            END,
            ((@i - 1) % 4) + 1,
            CAST(400000 + (@i * 50000) AS DECIMAL(18,2)),
            N'Phong tieu chuan cao cap, day du tien nghi.',
            1,
            GETUTCDATE(),
            GETUTCDATE()
        );

        INSERT INTO dbo.Room (HotelId, RoomTypeId, RoomNumber, Floor, StatusCode, IsActive, Notes, CreatedAt, UpdatedAt)
        VALUES (
            @i,
            @i,
            CONCAT(CASE WHEN @i < 10 THEN '10' ELSE '20' END, RIGHT(CONCAT('0', @i), 2)),
            CAST(((@i - 1) % 10) + 1 AS NVARCHAR(20)),
            CASE WHEN @i % 5 = 0 THEN 'OCCUPIED' ELSE 'VACANT' END,
            1,
            N'Phong huong thanh pho',
            GETUTCDATE(),
            GETUTCDATE()
        );

        INSERT INTO dbo.Customer (CustomerType, FullName, CompanyName, IdType, IdNumber, DateOfBirth, Nationality, Phone, Email, Notes, LoyaltyPoints, LoyaltyTier, DeletedAt)
        VALUES (
            CASE WHEN @i % 3 = 0 THEN 'COMPANY' ELSE 'INDIVIDUAL' END,
            @customerName,
            CASE WHEN @i % 3 = 0 THEN CONCAT(N'Cong ty Du lich ', @i) ELSE NULL END,
            'CCCD',
            CONCAT('079', RIGHT(CONCAT('000000000', @i), 9)),
            DATEADD(YEAR, -20 - (@i % 15), @today),
            N'Viet Nam',
            CONCAT('091', RIGHT(CONCAT('0000000', @i), 7)),
            CONCAT('guest', @i, '@mail.vn'),
            N'Khach uu tien dich vu nhanh',
            @i * 10,
            CASE WHEN @i >= 15 THEN 'GOLD' WHEN @i >= 8 THEN 'SILVER' ELSE 'BRONZE' END,
            NULL
        );

        INSERT INTO dbo.Reservation (HotelId, RoomId, CustomerId, StatusCode, CheckInDate, CheckOutDate, Adults, Children, RatePerNight, SpecialRequest)
        VALUES (
            @i,
            @i,
            @i,
            CASE WHEN @i % 4 = 0 THEN 'CHECKED_OUT' WHEN @i % 3 = 0 THEN 'CHECKED_IN' ELSE 'CONFIRMED' END,
            DATEADD(DAY, -(@i % 6 + 2), @today),
            DATEADD(DAY, -(@i % 6), @today),
            1 + (@i % 2),
            @i % 2,
            CAST(500000 + (@i * 60000) AS DECIMAL(18,2)),
            CONCAT(N'Yeu cau mau ', @i)
        );

        INSERT INTO dbo.Stay (HotelId, RoomId, ReservationId, StatusCode, CheckInAt, CheckOutAt, DepositAmount, Notes, CreatedAt, UpdatedAt)
        VALUES (
            @i,
            @i,
            @i,
            CASE WHEN @i % 4 = 0 THEN 'CHECKED_OUT' ELSE 'IN_HOUSE' END,
            DATEADD(DAY, -(@i % 6 + 2), GETUTCDATE()),
            CASE WHEN @i % 4 = 0 THEN DATEADD(DAY, -(@i % 6), GETUTCDATE()) ELSE NULL END,
            CAST(100000 + (@i * 10000) AS DECIMAL(18,2)),
            CONCAT(N'Luu tru mau ', @i),
            GETUTCDATE(),
            GETUTCDATE()
        );

        INSERT INTO dbo.HotelService (HotelId, ServiceCode, ServiceName, DefaultUnitPrice, IsActive, CreatedAt, UpdatedAt)
        VALUES (
            @i,
            CONCAT('SV', RIGHT(CONCAT('00', @i), 2)),
            @serviceName,
            CAST(30000 + (@i * 3000) AS DECIMAL(18,2)),
            1,
            GETUTCDATE(),
            GETUTCDATE()
        );

        INSERT INTO dbo.ServiceOrder (StayId, ServiceCode, Description, Quantity, UnitPrice, StatusCode, CancelReason, CreatedAt, UpdatedAt)
        VALUES (
            @i,
            CONCAT('SV', RIGHT(CONCAT('00', @i), 2)),
            CONCAT(N'Su dung ', @serviceName),
            1 + (@i % 3),
            CAST(30000 + (@i * 3000) AS DECIMAL(18,2)),
            CASE WHEN @i % 6 = 0 THEN 'CANCELLED' ELSE 'ACTIVE' END,
            CASE WHEN @i % 6 = 0 THEN N'Khach huy' ELSE NULL END,
            GETUTCDATE(),
            GETUTCDATE()
        );

        IF @i % 4 = 0
        BEGIN
            DECLARE @roomAmount DECIMAL(18,2) = CAST((2 * (500000 + (@i * 60000))) AS DECIMAL(18,2));
            DECLARE @serviceAmount DECIMAL(18,2) =
                (SELECT ISNULL(SUM(CAST(Quantity * UnitPrice AS DECIMAL(18,2))), 0)
                 FROM dbo.ServiceOrder
                 WHERE StayId = @i AND StatusCode = 'ACTIVE');

            INSERT INTO dbo.Payment (StayId, ReservationId, PaymentType, MethodCode, Amount, StatusCode, ReferenceNo, Note, CreatedAt, UpdatedAt)
            VALUES (
                @i,
                @i,
                'CHARGE',
                'CASH',
                @roomAmount + @serviceAmount,
                'PAID',
                CONCAT('REF', RIGHT(CONCAT('0000', @i), 4)),
                N'Thanh toan tai quay',
                GETUTCDATE(),
                GETUTCDATE()
            );

            INSERT INTO dbo.Invoice (BookingId, RoomAmount, ServiceAmount, TotalAmount, PaidAt, PaymentMethod, Note)
            VALUES (
                @i,
                @roomAmount,
                @serviceAmount,
                @roomAmount + @serviceAmount,
                GETUTCDATE(),
                'CASH',
                N'Hoa don da thanh toan thanh cong'
            );
        END

        SET @i += 1;
    END

    COMMIT TRANSACTION;
    PRINT N'Done: seeded realistic Vietnamese sample data.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
