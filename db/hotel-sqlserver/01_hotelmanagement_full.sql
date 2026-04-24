/*
  HotelManagement - Standard SQL Server Script
  Purpose: one clean script for schema + essential seed data.
  Target DB: HotelManagement
*/

USE [HotelManagement];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

/* =========================
   Drop old tables (safe rerun)
   ========================= */
IF OBJECT_ID(N'[dbo].[Invoice]', N'U') IS NOT NULL DROP TABLE [dbo].[Invoice];
IF OBJECT_ID(N'[dbo].[Payment]', N'U') IS NOT NULL DROP TABLE [dbo].[Payment];
IF OBJECT_ID(N'[dbo].[ServiceOrder]', N'U') IS NOT NULL DROP TABLE [dbo].[ServiceOrder];
IF OBJECT_ID(N'[dbo].[Stay]', N'U') IS NOT NULL DROP TABLE [dbo].[Stay];
IF OBJECT_ID(N'[dbo].[Reservation]', N'U') IS NOT NULL DROP TABLE [dbo].[Reservation];
IF OBJECT_ID(N'[dbo].[Room]', N'U') IS NOT NULL DROP TABLE [dbo].[Room];
IF OBJECT_ID(N'[dbo].[RoomType]', N'U') IS NOT NULL DROP TABLE [dbo].[RoomType];
IF OBJECT_ID(N'[dbo].[HotelService]', N'U') IS NOT NULL DROP TABLE [dbo].[HotelService];
IF OBJECT_ID(N'[dbo].[Customer]', N'U') IS NOT NULL DROP TABLE [dbo].[Customer];
IF OBJECT_ID(N'[dbo].[Hotel]', N'U') IS NOT NULL DROP TABLE [dbo].[Hotel];
IF OBJECT_ID(N'[dbo].[AppUserRole]', N'U') IS NOT NULL DROP TABLE [dbo].[AppUserRole];
IF OBJECT_ID(N'[dbo].[AppRole]', N'U') IS NOT NULL DROP TABLE [dbo].[AppRole];
IF OBJECT_ID(N'[dbo].[AppUser]', N'U') IS NOT NULL DROP TABLE [dbo].[AppUser];
GO

/* =========================
   Security
   ========================= */
CREATE TABLE [dbo].[AppUser](
  [UserId] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [Username] NVARCHAR(100) NOT NULL,
  [Password] NVARCHAR(300) NOT NULL,
  [FullName] NVARCHAR(200) NULL,
  [Email] NVARCHAR(200) NULL,
  [Phone] NVARCHAR(50) NULL,
  [IsActive] BIT NOT NULL CONSTRAINT [DF_AppUser_IsActive] DEFAULT(1)
);
CREATE UNIQUE INDEX [UX_AppUser_Username] ON [dbo].[AppUser]([Username]);
GO

CREATE TABLE [dbo].[AppRole](
  [RoleId] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [RoleCode] NVARCHAR(50) NOT NULL,
  [RoleName] NVARCHAR(200) NOT NULL,
  [IsActive] BIT NOT NULL CONSTRAINT [DF_AppRole_IsActive] DEFAULT(1)
);
CREATE UNIQUE INDEX [UX_AppRole_RoleCode] ON [dbo].[AppRole]([RoleCode]);
GO

CREATE TABLE [dbo].[AppUserRole](
  [UserId] INT NOT NULL,
  [RoleId] INT NOT NULL,
  CONSTRAINT [PK_AppUserRole] PRIMARY KEY ([UserId],[RoleId]),
  CONSTRAINT [FK_AppUserRole_AppUser] FOREIGN KEY ([UserId]) REFERENCES [dbo].[AppUser]([UserId]),
  CONSTRAINT [FK_AppUserRole_AppRole] FOREIGN KEY ([RoleId]) REFERENCES [dbo].[AppRole]([RoleId])
);
GO

/* =========================
   Master data
   ========================= */
CREATE TABLE [dbo].[Hotel](
  [HotelId] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [HotelName] NVARCHAR(200) NOT NULL,
  [Address] NVARCHAR(500) NULL,
  [Phone] NVARCHAR(50) NULL,
  [Email] NVARCHAR(200) NULL,
  [IsActive] BIT NOT NULL CONSTRAINT [DF_Hotel_IsActive] DEFAULT(1)
);
GO

CREATE TABLE [dbo].[RoomType](
  [RoomTypeId] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [HotelId] INT NOT NULL,
  [RoomTypeName] NVARCHAR(200) NOT NULL,
  [Capacity] INT NOT NULL CONSTRAINT [DF_RoomType_Capacity] DEFAULT(2),
  [BaseRate] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_RoomType_BaseRate] DEFAULT(0),
  [Description] NVARCHAR(500) NULL,
  [IsActive] BIT NOT NULL CONSTRAINT [DF_RoomType_IsActive] DEFAULT(1),
  CONSTRAINT [FK_RoomType_Hotel] FOREIGN KEY ([HotelId]) REFERENCES [dbo].[Hotel]([HotelId]),
  CONSTRAINT [CK_RoomType_Capacity] CHECK ([Capacity] >= 1),
  CONSTRAINT [CK_RoomType_BaseRate] CHECK ([BaseRate] >= 0)
);
CREATE UNIQUE INDEX [UX_RoomType_HotelId_RoomTypeName_Active]
ON [dbo].[RoomType]([HotelId],[RoomTypeName]) WHERE [IsActive] = 1;
GO

CREATE TABLE [dbo].[Room](
  [RoomId] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [HotelId] INT NOT NULL,
  [RoomTypeId] INT NOT NULL,
  [RoomNumber] NVARCHAR(50) NOT NULL,
  [StatusCode] NVARCHAR(30) NOT NULL CONSTRAINT [DF_Room_StatusCode] DEFAULT(N'VACANT'),
  [Floor] NVARCHAR(20) NULL,
  [IsActive] BIT NOT NULL CONSTRAINT [DF_Room_IsActive] DEFAULT(1),
  CONSTRAINT [FK_Room_Hotel] FOREIGN KEY ([HotelId]) REFERENCES [dbo].[Hotel]([HotelId]),
  CONSTRAINT [FK_Room_RoomType] FOREIGN KEY ([RoomTypeId]) REFERENCES [dbo].[RoomType]([RoomTypeId])
);
CREATE UNIQUE INDEX [UX_Room_HotelId_RoomNumber_Active]
ON [dbo].[Room]([HotelId],[RoomNumber]) WHERE [IsActive] = 1;
GO

CREATE TABLE [dbo].[Customer](
  [CustomerId] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [CustomerType] NVARCHAR(20) NOT NULL CONSTRAINT [DF_Customer_CustomerType] DEFAULT(N'INDIVIDUAL'),
  [FullName] NVARCHAR(200) NULL,
  [CompanyName] NVARCHAR(200) NULL,
  [IdType] NVARCHAR(50) NULL,
  [IdNumber] NVARCHAR(50) NULL,
  [DateOfBirth] DATE NULL,
  [Nationality] NVARCHAR(100) NULL,
  [Phone] NVARCHAR(50) NULL,
  [Email] NVARCHAR(200) NULL,
  [Notes] NVARCHAR(500) NULL,
  [LoyaltyPoints] INT NOT NULL CONSTRAINT [DF_Customer_LoyaltyPoints] DEFAULT(0),
  [LoyaltyTier] NVARCHAR(20) NOT NULL CONSTRAINT [DF_Customer_LoyaltyTier] DEFAULT(N'BRONZE'),
  [DeletedAt] DATETIME2(7) NULL
);
GO

CREATE TABLE [dbo].[HotelService](
  [HotelServiceId] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [HotelId] INT NOT NULL,
  [ServiceCode] NVARCHAR(50) NOT NULL,
  [ServiceName] NVARCHAR(200) NOT NULL,
  [DefaultUnitPrice] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_HotelService_DefaultUnitPrice] DEFAULT(0),
  [IsActive] BIT NOT NULL CONSTRAINT [DF_HotelService_IsActive] DEFAULT(1),
  [CreatedAt] DATETIME2(7) NOT NULL CONSTRAINT [DF_HotelService_CreatedAt] DEFAULT(SYSUTCDATETIME()),
  [UpdatedAt] DATETIME2(7) NOT NULL CONSTRAINT [DF_HotelService_UpdatedAt] DEFAULT(SYSUTCDATETIME()),
  CONSTRAINT [FK_HotelService_Hotel] FOREIGN KEY ([HotelId]) REFERENCES [dbo].[Hotel]([HotelId]),
  CONSTRAINT [CK_HotelService_DefaultUnitPrice] CHECK ([DefaultUnitPrice] >= 0)
);
CREATE UNIQUE INDEX [UX_HotelService_HotelId_ServiceCode] ON [dbo].[HotelService]([HotelId],[ServiceCode]);
GO

/* =========================
   Booking / Stay / Service / Billing
   ========================= */
CREATE TABLE [dbo].[Reservation](
  [ReservationId] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [HotelId] INT NOT NULL,
  [RoomId] INT NOT NULL,
  [CustomerId] BIGINT NULL,
  [StatusCode] NVARCHAR(30) NOT NULL CONSTRAINT [DF_Reservation_StatusCode] DEFAULT(N'CONFIRMED'),
  [CheckInDate] DATE NOT NULL,
  [CheckOutDate] DATE NOT NULL,
  [Adults] INT NOT NULL CONSTRAINT [DF_Reservation_Adults] DEFAULT(1),
  [Children] INT NOT NULL CONSTRAINT [DF_Reservation_Children] DEFAULT(0),
  [RatePerNight] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_Reservation_RatePerNight] DEFAULT(0),
  [SpecialRequest] NVARCHAR(500) NULL,
  CONSTRAINT [FK_Reservation_Hotel] FOREIGN KEY ([HotelId]) REFERENCES [dbo].[Hotel]([HotelId]),
  CONSTRAINT [FK_Reservation_Room] FOREIGN KEY ([RoomId]) REFERENCES [dbo].[Room]([RoomId]),
  CONSTRAINT [FK_Reservation_Customer] FOREIGN KEY ([CustomerId]) REFERENCES [dbo].[Customer]([CustomerId]) ON DELETE SET NULL,
  CONSTRAINT [CK_Reservation_Dates] CHECK ([CheckInDate] < [CheckOutDate])
);
GO

CREATE TABLE [dbo].[Stay](
  [StayId] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [HotelId] INT NOT NULL,
  [RoomId] INT NOT NULL,
  [ReservationId] BIGINT NULL,
  [StatusCode] NVARCHAR(30) NOT NULL CONSTRAINT [DF_Stay_StatusCode] DEFAULT(N'IN_HOUSE'),
  [CheckInAt] DATETIME2(7) NOT NULL,
  [CheckOutAt] DATETIME2(7) NULL,
  [DepositAmount] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_Stay_DepositAmount] DEFAULT(0),
  [Notes] NVARCHAR(500) NULL,
  [CreatedAt] DATETIME2(7) NOT NULL CONSTRAINT [DF_Stay_CreatedAt] DEFAULT(SYSUTCDATETIME()),
  [UpdatedAt] DATETIME2(7) NOT NULL CONSTRAINT [DF_Stay_UpdatedAt] DEFAULT(SYSUTCDATETIME()),
  CONSTRAINT [FK_Stay_Hotel] FOREIGN KEY ([HotelId]) REFERENCES [dbo].[Hotel]([HotelId]),
  CONSTRAINT [FK_Stay_Room] FOREIGN KEY ([RoomId]) REFERENCES [dbo].[Room]([RoomId]),
  CONSTRAINT [FK_Stay_Reservation] FOREIGN KEY ([ReservationId]) REFERENCES [dbo].[Reservation]([ReservationId]) ON DELETE SET NULL
);
GO

CREATE TABLE [dbo].[ServiceOrder](
  [ServiceOrderId] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [StayId] BIGINT NOT NULL,
  [ServiceCode] NVARCHAR(50) NOT NULL,
  [Description] NVARCHAR(300) NULL,
  [Quantity] INT NOT NULL CONSTRAINT [DF_ServiceOrder_Quantity] DEFAULT(1),
  [UnitPrice] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_ServiceOrder_UnitPrice] DEFAULT(0),
  [StatusCode] NVARCHAR(30) NOT NULL CONSTRAINT [DF_ServiceOrder_StatusCode] DEFAULT(N'ACTIVE'),
  [CancelReason] NVARCHAR(300) NULL,
  [CreatedAt] DATETIME2(7) NOT NULL CONSTRAINT [DF_ServiceOrder_CreatedAt] DEFAULT(SYSUTCDATETIME()),
  [UpdatedAt] DATETIME2(7) NOT NULL CONSTRAINT [DF_ServiceOrder_UpdatedAt] DEFAULT(SYSUTCDATETIME()),
  CONSTRAINT [FK_ServiceOrder_Stay] FOREIGN KEY ([StayId]) REFERENCES [dbo].[Stay]([StayId])
);
GO

CREATE TABLE [dbo].[Payment](
  [PaymentId] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [StayId] BIGINT NULL,
  [ReservationId] BIGINT NULL,
  [PaymentType] NVARCHAR(20) NOT NULL CONSTRAINT [DF_Payment_PaymentType] DEFAULT(N'CHARGE'),
  [MethodCode] NVARCHAR(30) NOT NULL CONSTRAINT [DF_Payment_MethodCode] DEFAULT(N'CASH'),
  [Amount] DECIMAL(18,2) NOT NULL,
  [StatusCode] NVARCHAR(30) NOT NULL CONSTRAINT [DF_Payment_StatusCode] DEFAULT(N'PAID'),
  [ReferenceNo] NVARCHAR(100) NULL,
  [Note] NVARCHAR(300) NULL,
  [CreatedAt] DATETIME2(7) NOT NULL CONSTRAINT [DF_Payment_CreatedAt] DEFAULT(SYSUTCDATETIME()),
  [UpdatedAt] DATETIME2(7) NOT NULL CONSTRAINT [DF_Payment_UpdatedAt] DEFAULT(SYSUTCDATETIME()),
  CONSTRAINT [FK_Payment_Stay] FOREIGN KEY ([StayId]) REFERENCES [dbo].[Stay]([StayId]),
  CONSTRAINT [FK_Payment_Reservation] FOREIGN KEY ([ReservationId]) REFERENCES [dbo].[Reservation]([ReservationId])
);
GO

CREATE TABLE [dbo].[Invoice](
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [BookingId] BIGINT NOT NULL,
  [RoomAmount] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_Invoice_RoomAmount] DEFAULT(0),
  [ServiceAmount] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_Invoice_ServiceAmount] DEFAULT(0),
  [TotalAmount] DECIMAL(18,2) NOT NULL CONSTRAINT [DF_Invoice_TotalAmount] DEFAULT(0),
  [PaidAt] DATETIME2(7) NOT NULL CONSTRAINT [DF_Invoice_PaidAt] DEFAULT(SYSUTCDATETIME()),
  [PaymentMethod] NVARCHAR(30) NOT NULL CONSTRAINT [DF_Invoice_PaymentMethod] DEFAULT(N'CASH'),
  [Note] NVARCHAR(250) NULL,
  CONSTRAINT [FK_Invoice_Reservation] FOREIGN KEY ([BookingId]) REFERENCES [dbo].[Reservation]([ReservationId])
);
CREATE UNIQUE INDEX [UX_Invoice_BookingId] ON [dbo].[Invoice]([BookingId]);
GO

/* =========================
   Essential seed
   ========================= */
INSERT INTO [dbo].[AppRole]([RoleCode],[RoleName],[IsActive]) VALUES
(N'ADMIN',N'Quản trị hệ thống',1),
(N'RECEPTION',N'Lễ tân',1),
(N'ACCOUNTANT',N'Kế toán/Thu ngân',1),
(N'MANAGER',N'Quản lý',1);

INSERT INTO [dbo].[AppUser]([Username],[Password],[FullName],[Email],[Phone],[IsActive])
VALUES (N'admin',N'8D969EEF6ECAD3C29A3A629280E686CF0C3F5D5A86AFF3CA12020C923ADC6C92',N'Quản trị',N'admin@hotel.local',N'0900000000',1);

INSERT INTO [dbo].[AppUserRole]([UserId],[RoleId])
SELECT u.UserId, r.RoleId FROM [dbo].[AppUser] u CROSS JOIN [dbo].[AppRole] r
WHERE u.Username = N'admin' AND r.RoleCode = N'ADMIN';
GO

PRINT N'HotelManagement standard SQL executed successfully.';
GO

