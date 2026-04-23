-- HotelManagement DB - Seed Data (v2 aligned with current API)
-- Assumes schema is created by 02_schema_tables_v2_api.sql

USE [HotelManagement];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRANSACTION;
BEGIN TRY
  /* Roles */
  INSERT INTO dbo.AppRole(RoleCode, RoleName)
  SELECT v.RoleCode, v.RoleName
  FROM (VALUES
    (N'ADMIN', N'Quản trị hệ thống'),
    (N'RECEPTION', N'Lễ tân'),
    (N'ACCOUNTANT', N'Kế toán/Thu ngân'),
    (N'MANAGER', N'Quản lý')
  ) v(RoleCode, RoleName)
  WHERE NOT EXISTS (SELECT 1 FROM dbo.AppRole r WHERE r.RoleCode = v.RoleCode);

  /* Admin user */
  IF NOT EXISTS (SELECT 1 FROM dbo.AppUser WHERE Username = N'admin')
  BEGIN
    INSERT INTO dbo.AppUser(Username, Password, FullName, Email, Phone, IsActive)
    VALUES (N'admin', N'8D969EEF6ECAD3C29A3A629280E686CF0C3F5D5A86AFF3CA12020C923ADC6C92', N'Quản trị', N'admin@hotel.local', N'0900000000', 1);
  END
  ELSE
  BEGIN
    UPDATE dbo.AppUser
    SET Password = N'8D969EEF6ECAD3C29A3A629280E686CF0C3F5D5A86AFF3CA12020C923ADC6C92'
    WHERE Username = N'admin';
  END

  DECLARE @AdminUserId INT = (SELECT TOP 1 UserId FROM dbo.AppUser WHERE Username = N'admin');
  DECLARE @AdminRoleId INT = (SELECT TOP 1 RoleId FROM dbo.AppRole WHERE RoleCode = N'ADMIN');
  IF @AdminUserId IS NOT NULL AND @AdminRoleId IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM dbo.AppUserRole WHERE UserId = @AdminUserId AND RoleId = @AdminRoleId)
  BEGIN
    INSERT INTO dbo.AppUserRole(UserId, RoleId) VALUES (@AdminUserId, @AdminRoleId);
  END

  /* Hotels */
  INSERT INTO dbo.Hotel(HotelName, Address, Phone, Email, IsActive)
  VALUES
    (N'Khách sạn Sông Sài Gòn', N'12 Nguyễn Huệ, Quận 1, TP.HCM', N'02838220001', N'contact@songsai-gon.local', 1),
    (N'Khách sạn Biển Xanh', N'88 Trần Phú, Nha Trang, Khánh Hòa', N'02583550002', N'hello@bienxanh.local', 1);

  DECLARE @H1 INT = (SELECT MIN(HotelId) FROM dbo.Hotel);
  DECLARE @H2 INT = (SELECT MAX(HotelId) FROM dbo.Hotel);

  /* Room types */
  INSERT INTO dbo.RoomType(HotelId, RoomTypeName, Capacity, BaseRate, Description, IsActive)
  VALUES
    (@H1, N'Standard', 2, 650000, N'Phòng tiêu chuẩn', 1),
    (@H1, N'Deluxe',   2, 950000, N'Phòng deluxe', 1),
    (@H2, N'Standard', 2, 720000, N'Phòng tiêu chuẩn', 1),
    (@H2, N'Deluxe',   2, 1120000, N'Phòng deluxe', 1);

  DECLARE @RT1 INT = (SELECT TOP 1 RoomTypeId FROM dbo.RoomType WHERE HotelId=@H1 AND RoomTypeName=N'Standard');
  DECLARE @RT2 INT = (SELECT TOP 1 RoomTypeId FROM dbo.RoomType WHERE HotelId=@H1 AND RoomTypeName=N'Deluxe');
  DECLARE @RT3 INT = (SELECT TOP 1 RoomTypeId FROM dbo.RoomType WHERE HotelId=@H2 AND RoomTypeName=N'Standard');
  DECLARE @RT4 INT = (SELECT TOP 1 RoomTypeId FROM dbo.RoomType WHERE HotelId=@H2 AND RoomTypeName=N'Deluxe');

  /* Rooms */
  INSERT INTO dbo.Room(HotelId, RoomTypeId, RoomNumber, Floor, StatusCode, IsActive)
  VALUES
    (@H1, @RT1, N'101', N'1', N'VACANT', 1),
    (@H1, @RT1, N'102', N'1', N'VACANT', 1),
    (@H1, @RT2, N'201', N'2', N'VACANT', 1),
    (@H2, @RT3, N'1101', N'11', N'VACANT', 1),
    (@H2, @RT4, N'1201', N'12', N'VACANT', 1);

  /* Customers (INDIVIDUAL only, matching current booking rules) */
  INSERT INTO dbo.Customer(CustomerType, FullName, IdType, IdNumber, DateOfBirth, Nationality, Phone, Email, Notes, LoyaltyPoints, LoyaltyTier, DeletedAt)
  VALUES
    (N'INDIVIDUAL', N'Nguyễn Minh Anh', N'CCCD', N'079203001234', '1998-04-12', N'Việt Nam', N'0912345678', N'minhanh@example.com', N'Ưu tiên phòng yên tĩnh', 120, N'BRONZE', NULL),
    (N'INDIVIDUAL', N'Trần Quốc Huy',   N'CCCD', N'079176005555', '1992-01-22', N'Việt Nam', N'0987654321', N'quochuy@example.com', N'Có trẻ em đi cùng', 320, N'SILVER', NULL);

  DECLARE @C1 BIGINT = (SELECT TOP 1 CustomerId FROM dbo.Customer WHERE IdNumber=N'079203001234');
  DECLARE @C2 BIGINT = (SELECT TOP 1 CustomerId FROM dbo.Customer WHERE IdNumber=N'079176005555');

  /* Hotel services */
  INSERT INTO dbo.HotelService(HotelId, ServiceCode, ServiceName, DefaultUnitPrice, IsActive)
  VALUES
    (@H1, N'BREAKFAST', N'Ăn sáng', 90000, 1),
    (@H1, N'LAUNDRY', N'Giặt ủi', 65000, 1),
    (@H1, N'MINIBAR', N'Minibar', 55000, 1),
    (@H2, N'BREAKFAST', N'Ăn sáng', 80000, 1);

  /* Booking 1: confirmed (future) */
  DECLARE @Room101 INT = (SELECT TOP 1 RoomId FROM dbo.Room WHERE HotelId=@H1 AND RoomNumber=N'101');
  INSERT INTO dbo.Reservation(HotelId, RoomId, CustomerId, StatusCode, CheckInDate, CheckOutDate, Adults, Children, RatePerNight, SpecialRequest)
  VALUES (@H1, @Room101, @C1, N'CONFIRMED', DATEADD(DAY, 2, CAST(GETDATE() AS DATE)), DATEADD(DAY, 4, CAST(GETDATE() AS DATE)), 1, 0, 650000, N'Check-in muộn');
  DECLARE @B1 BIGINT = SCOPE_IDENTITY();

  /* Booking 2: checked out + stay + service orders + payment + invoice */
  DECLARE @Room201 INT = (SELECT TOP 1 RoomId FROM dbo.Room WHERE HotelId=@H1 AND RoomNumber=N'201');
  INSERT INTO dbo.Reservation(HotelId, RoomId, CustomerId, StatusCode, CheckInDate, CheckOutDate, Adults, Children, RatePerNight, SpecialRequest)
  VALUES (@H1, @Room201, @C2, N'CHECKED_OUT', DATEADD(DAY, -3, CAST(GETDATE() AS DATE)), DATEADD(DAY, -1, CAST(GETDATE() AS DATE)), 2, 0, 950000, NULL);
  DECLARE @B2 BIGINT = SCOPE_IDENTITY();

  DECLARE @stayIn DATETIME2(0) = DATEADD(DAY, -3, SYSUTCDATETIME());
  DECLARE @stayOut DATETIME2(0) = DATEADD(DAY, -1, SYSUTCDATETIME());
  INSERT INTO dbo.Stay(HotelId, RoomId, ReservationId, StatusCode, CheckInAt, CheckOutAt, DepositAmount, Notes, CreatedAt, UpdatedAt)
  VALUES (@H1, @Room201, @B2, N'CHECKED_OUT', @stayIn, @stayOut, 0, N'Lưu trú mẫu', @stayIn, @stayOut);
  DECLARE @S2 BIGINT = SCOPE_IDENTITY();

  INSERT INTO dbo.ServiceOrder(StayId, ServiceCode, Description, Quantity, UnitPrice, StatusCode, CreatedAt, UpdatedAt)
  VALUES
    (@S2, N'BREAKFAST', N'Ăn sáng ngày 1', 2, 90000, N'ACTIVE', @stayIn, @stayIn),
    (@S2, N'LAUNDRY',   N'Giặt ủi',       1, 65000, N'ACTIVE', @stayIn, @stayIn);

  DECLARE @serviceAmount DECIMAL(18,2) =
    (SELECT SUM(CAST(Quantity AS DECIMAL(18,2)) * UnitPrice) FROM dbo.ServiceOrder WHERE StayId=@S2 AND StatusCode=N'ACTIVE');
  DECLARE @nights INT = (SELECT DATEDIFF(DAY, CheckInDate, CheckOutDate) FROM dbo.Reservation WHERE ReservationId=@B2);
  DECLARE @rate DECIMAL(18,2) = (SELECT RatePerNight FROM dbo.Reservation WHERE ReservationId=@B2);
  DECLARE @roomAmount DECIMAL(18,2) = @nights * @rate;
  DECLARE @totalAmount DECIMAL(18,2) = @roomAmount + ISNULL(@serviceAmount, 0);

  INSERT INTO dbo.Payment(StayId, ReservationId, PaymentType, MethodCode, Amount, StatusCode, ReferenceNo, Note, CreatedAt, UpdatedAt)
  VALUES (@S2, @B2, N'CHARGE', N'CASH', @totalAmount, N'PAID', N'REF0001', N'Thanh toán hóa đơn', SYSUTCDATETIME(), SYSUTCDATETIME());

  INSERT INTO dbo.Invoice(BookingId, RoomAmount, ServiceAmount, TotalAmount, PaidAt, PaymentMethod, Note)
  VALUES (@B2, @roomAmount, ISNULL(@serviceAmount,0), @totalAmount, SYSUTCDATETIME(), N'CASH', N'Hóa đơn mẫu');

  COMMIT TRANSACTION;
  PRINT N'Done: seeded v2 data aligned with API.';
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
GO

