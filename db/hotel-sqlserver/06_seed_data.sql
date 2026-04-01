-- HotelManagement DB - Seed Data (demo)

USE [HotelManagement];
GO

-- Roles
INSERT INTO dbo.AppRole(RoleCode, RoleName)
SELECT v.RoleCode, v.RoleName
FROM (VALUES
  (N'ADMIN', N'Quản trị hệ thống'),
  (N'RECEPTION', N'Lễ tân'),
  (N'ACCOUNTANT', N'Kế toán/Thu ngân'),
  (N'HOUSEKEEPING', N'Buồng phòng'),
  (N'MAINTENANCE', N'Kỹ thuật'),
  (N'MANAGER', N'Quản lý')
) v(RoleCode, RoleName)
WHERE NOT EXISTS (SELECT 1 FROM dbo.AppRole r WHERE r.RoleCode = v.RoleCode);
GO

-- Demo admin user (PasswordHash is placeholder - app should store real hash)
IF NOT EXISTS (SELECT 1 FROM dbo.AppUser WHERE Username = N'admin')
BEGIN
  INSERT INTO dbo.AppUser(Username, PasswordHash, FullName, Email, IsActive)
  VALUES (N'admin', N'REPLACE_WITH_HASH', N'Admin', N'admin@hotel.local', 1);
END
GO

-- Assign admin role
DECLARE @AdminUserId INT = (SELECT TOP 1 UserId FROM dbo.AppUser WHERE Username = N'admin');
DECLARE @AdminRoleId INT = (SELECT TOP 1 RoleId FROM dbo.AppRole WHERE RoleCode = N'ADMIN');
IF @AdminUserId IS NOT NULL AND @AdminRoleId IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM dbo.AppUserRole WHERE UserId = @AdminUserId AND RoleId = @AdminRoleId)
BEGIN
  INSERT INTO dbo.AppUserRole(UserId, RoleId) VALUES (@AdminUserId, @AdminRoleId);
END
GO

-- Hotel
IF NOT EXISTS (SELECT 1 FROM dbo.Hotel WHERE HotelName = N'Khách sạn Demo')
BEGIN
  INSERT INTO dbo.Hotel(HotelName, Address, Phone, Email)
  VALUES (N'Khách sạn Demo', N'1 Đường Demo, Quận 1, TP.HCM', N'0900000000', N'demo@hotel.local');
END
GO

DECLARE @HotelId INT = (SELECT TOP 1 HotelId FROM dbo.Hotel WHERE HotelName = N'Khách sạn Demo');

-- Room types
IF @HotelId IS NOT NULL
BEGIN
  IF NOT EXISTS (SELECT 1 FROM dbo.RoomType WHERE HotelId=@HotelId AND RoomTypeName=N'Standard')
    INSERT INTO dbo.RoomType(HotelId, RoomTypeName, Capacity, BaseRate, Description)
    VALUES (@HotelId, N'Standard', 2, 600000, N'Phòng tiêu chuẩn');

  IF NOT EXISTS (SELECT 1 FROM dbo.RoomType WHERE HotelId=@HotelId AND RoomTypeName=N'Deluxe')
    INSERT INTO dbo.RoomType(HotelId, RoomTypeName, Capacity, BaseRate, Description)
    VALUES (@HotelId, N'Deluxe', 2, 900000, N'Phòng deluxe');
END
GO

DECLARE @StandardId INT = (SELECT TOP 1 RoomTypeId FROM dbo.RoomType WHERE HotelId=@HotelId AND RoomTypeName=N'Standard');
DECLARE @DeluxeId   INT = (SELECT TOP 1 RoomTypeId FROM dbo.RoomType WHERE HotelId=@HotelId AND RoomTypeName=N'Deluxe');

-- Rooms
IF @HotelId IS NOT NULL AND @StandardId IS NOT NULL
BEGIN
  IF NOT EXISTS (SELECT 1 FROM dbo.Room WHERE HotelId=@HotelId AND RoomNumber=N'101')
    INSERT INTO dbo.Room(HotelId, RoomTypeId, RoomNumber, Floor, StatusCode) VALUES (@HotelId, @StandardId, N'101', N'1', N'VACANT');

  IF NOT EXISTS (SELECT 1 FROM dbo.Room WHERE HotelId=@HotelId AND RoomNumber=N'102')
    INSERT INTO dbo.Room(HotelId, RoomTypeId, RoomNumber, Floor, StatusCode) VALUES (@HotelId, @StandardId, N'102', N'1', N'VACANT');
END
GO

IF @HotelId IS NOT NULL AND @DeluxeId IS NOT NULL
BEGIN
  IF NOT EXISTS (SELECT 1 FROM dbo.Room WHERE HotelId=@HotelId AND RoomNumber=N'201')
    INSERT INTO dbo.Room(HotelId, RoomTypeId, RoomNumber, Floor, StatusCode) VALUES (@HotelId, @DeluxeId, N'201', N'2', N'VACANT');
END
GO

