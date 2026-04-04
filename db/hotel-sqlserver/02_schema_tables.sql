-- HotelManagement DB - Schema & Tables

USE [HotelManagement];
GO

-- =========
-- 1) Security (RBAC) + Users
-- =========

IF OBJECT_ID(N'dbo.AppUser', N'U') IS NOT NULL DROP TABLE dbo.AppUser;
IF OBJECT_ID(N'dbo.AppRole', N'U') IS NOT NULL DROP TABLE dbo.AppRole;
IF OBJECT_ID(N'dbo.AppUserRole', N'U') IS NOT NULL DROP TABLE dbo.AppUserRole;
GO

CREATE TABLE dbo.AppUser (
  UserId           INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_AppUser PRIMARY KEY,
  Username         NVARCHAR(100) NOT NULL,
  PasswordHash     NVARCHAR(400) NOT NULL,
  FullName         NVARCHAR(200) NULL,
  Email            NVARCHAR(200) NULL,
  Phone            NVARCHAR(50) NULL,
  IsActive         BIT NOT NULL CONSTRAINT DF_AppUser_IsActive DEFAULT(1),
  CreatedAt        DATETIME2(0) NOT NULL CONSTRAINT DF_AppUser_CreatedAt DEFAULT (SYSUTCDATETIME()),
  UpdatedAt        DATETIME2(0) NOT NULL CONSTRAINT DF_AppUser_UpdatedAt DEFAULT (SYSUTCDATETIME())
);
GO

ALTER TABLE dbo.AppUser
ADD CONSTRAINT UQ_AppUser_Username UNIQUE (Username);
GO

CREATE TABLE dbo.AppRole (
  RoleId     INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_AppRole PRIMARY KEY,
  RoleCode   NVARCHAR(50) NOT NULL,
  RoleName   NVARCHAR(200) NOT NULL,
  IsActive   BIT NOT NULL CONSTRAINT DF_AppRole_IsActive DEFAULT(1)
);
GO

ALTER TABLE dbo.AppRole
ADD CONSTRAINT UQ_AppRole_RoleCode UNIQUE (RoleCode);
GO

CREATE TABLE dbo.AppUserRole (
  UserId INT NOT NULL,
  RoleId INT NOT NULL,
  CONSTRAINT PK_AppUserRole PRIMARY KEY (UserId, RoleId),
  CONSTRAINT FK_AppUserRole_User FOREIGN KEY (UserId) REFERENCES dbo.AppUser(UserId),
  CONSTRAINT FK_AppUserRole_Role FOREIGN KEY (RoleId) REFERENCES dbo.AppRole(RoleId)
);
GO

-- =========
-- 2) Audit Log
-- =========

IF OBJECT_ID(N'dbo.AuditLog', N'U') IS NOT NULL DROP TABLE dbo.AuditLog;
GO

CREATE TABLE dbo.AuditLog (
  AuditId        BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_AuditLog PRIMARY KEY,
  ActorUserId    INT NULL,
  Action         NVARCHAR(100) NOT NULL,
  EntityName     NVARCHAR(100) NOT NULL,
  EntityId       NVARCHAR(100) NOT NULL,
  Reason         NVARCHAR(500) NULL,
  BeforeJson     NVARCHAR(MAX) NULL,
  AfterJson      NVARCHAR(MAX) NULL,
  CreatedAt      DATETIME2(0) NOT NULL CONSTRAINT DF_AuditLog_CreatedAt DEFAULT (SYSUTCDATETIME()),
  CONSTRAINT FK_AuditLog_ActorUser FOREIGN KEY (ActorUserId) REFERENCES dbo.AppUser(UserId)
);
GO

-- =========
-- 3) Core Catalog: Hotel, RoomType, Room
-- =========

IF OBJECT_ID(N'dbo.Hotel', N'U') IS NOT NULL DROP TABLE dbo.Hotel;
IF OBJECT_ID(N'dbo.RoomType', N'U') IS NOT NULL DROP TABLE dbo.RoomType;
IF OBJECT_ID(N'dbo.Room', N'U') IS NOT NULL DROP TABLE dbo.Room;
GO

CREATE TABLE dbo.Hotel (
  HotelId     INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Hotel PRIMARY KEY,
  HotelName   NVARCHAR(200) NOT NULL,
  Address     NVARCHAR(500) NULL,
  Phone       NVARCHAR(50) NULL,
  Email       NVARCHAR(200) NULL,
  IsActive    BIT NOT NULL CONSTRAINT DF_Hotel_IsActive DEFAULT(1),
  CreatedAt   DATETIME2(0) NOT NULL CONSTRAINT DF_Hotel_CreatedAt DEFAULT (SYSUTCDATETIME()),
  UpdatedAt   DATETIME2(0) NOT NULL CONSTRAINT DF_Hotel_UpdatedAt DEFAULT (SYSUTCDATETIME()),
  CreatedBy   INT NULL,
  UpdatedBy   INT NULL,
  DeletedAt   DATETIME2(0) NULL,
  DeletedBy   INT NULL,
  CONSTRAINT FK_Hotel_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES dbo.AppUser(UserId),
  CONSTRAINT FK_Hotel_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES dbo.AppUser(UserId),
  CONSTRAINT FK_Hotel_DeletedBy FOREIGN KEY (DeletedBy) REFERENCES dbo.AppUser(UserId)
);
GO

CREATE TABLE dbo.RoomType (
  RoomTypeId     INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_RoomType PRIMARY KEY,
  HotelId        INT NOT NULL,
  RoomTypeName   NVARCHAR(200) NOT NULL,
  Capacity       INT NOT NULL CONSTRAINT CK_RoomType_Capacity CHECK (Capacity > 0),
  BaseRate       DECIMAL(18,2) NOT NULL CONSTRAINT CK_RoomType_BaseRate CHECK (BaseRate >= 0),
  Description    NVARCHAR(500) NULL,
  IsActive       BIT NOT NULL CONSTRAINT DF_RoomType_IsActive DEFAULT(1),
  CreatedAt      DATETIME2(0) NOT NULL CONSTRAINT DF_RoomType_CreatedAt DEFAULT (SYSUTCDATETIME()),
  UpdatedAt      DATETIME2(0) NOT NULL CONSTRAINT DF_RoomType_UpdatedAt DEFAULT (SYSUTCDATETIME()),
  CreatedBy      INT NULL,
  UpdatedBy      INT NULL,
  DeletedAt      DATETIME2(0) NULL,
  DeletedBy      INT NULL,
  CONSTRAINT FK_RoomType_Hotel FOREIGN KEY (HotelId) REFERENCES dbo.Hotel(HotelId),
  CONSTRAINT FK_RoomType_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES dbo.AppUser(UserId),
  CONSTRAINT FK_RoomType_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES dbo.AppUser(UserId),
  CONSTRAINT FK_RoomType_DeletedBy FOREIGN KEY (DeletedBy) REFERENCES dbo.AppUser(UserId)
);
GO

CREATE TABLE dbo.Room (
  RoomId        INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Room PRIMARY KEY,
  HotelId       INT NOT NULL,
  RoomTypeId    INT NOT NULL,
  RoomNumber    NVARCHAR(50) NOT NULL,
  Floor         NVARCHAR(20) NULL,
  StatusCode    NVARCHAR(30) NOT NULL, -- VACANT/RESERVED/OCCUPIED/DIRTY/CLEANING/MAINTENANCE/OUT_OF_SERVICE
  IsActive      BIT NOT NULL CONSTRAINT DF_Room_IsActive DEFAULT(1),
  Notes         NVARCHAR(500) NULL,
  CreatedAt     DATETIME2(0) NOT NULL CONSTRAINT DF_Room_CreatedAt DEFAULT (SYSUTCDATETIME()),
  UpdatedAt     DATETIME2(0) NOT NULL CONSTRAINT DF_Room_UpdatedAt DEFAULT (SYSUTCDATETIME()),
  CreatedBy     INT NULL,
  UpdatedBy     INT NULL,
  DeletedAt     DATETIME2(0) NULL,
  DeletedBy     INT NULL,
  CONSTRAINT FK_Room_Hotel FOREIGN KEY (HotelId) REFERENCES dbo.Hotel(HotelId),
  CONSTRAINT FK_Room_RoomType FOREIGN KEY (RoomTypeId) REFERENCES dbo.RoomType(RoomTypeId),
  CONSTRAINT FK_Room_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES dbo.AppUser(UserId),
  CONSTRAINT FK_Room_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES dbo.AppUser(UserId),
  CONSTRAINT FK_Room_DeletedBy FOREIGN KEY (DeletedBy) REFERENCES dbo.AppUser(UserId),
  CONSTRAINT CK_Room_Status CHECK (StatusCode IN (
    N'VACANT', N'RESERVED', N'OCCUPIED', N'DIRTY', N'CLEANING', N'MAINTENANCE', N'OUT_OF_SERVICE'
  ))
);
GO

ALTER TABLE dbo.Room
ADD CONSTRAINT UQ_Room_Hotel_RoomNumber UNIQUE (HotelId, RoomNumber);
GO

-- =========
-- 4) Customer & Guest
-- =========

IF OBJECT_ID(N'dbo.Customer', N'U') IS NOT NULL DROP TABLE dbo.Customer;
IF OBJECT_ID(N'dbo.Guest', N'U') IS NOT NULL DROP TABLE dbo.Guest;
GO

CREATE TABLE dbo.Customer (
  CustomerId     BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Customer PRIMARY KEY,
  CustomerType   NVARCHAR(20) NOT NULL, -- INDIVIDUAL/COMPANY/AGENCY
  FullName       NVARCHAR(200) NULL,
  CompanyName    NVARCHAR(200) NULL,
  TaxCode        NVARCHAR(50) NULL,
  Email          NVARCHAR(200) NULL,
  Phone          NVARCHAR(50) NULL,
  Notes          NVARCHAR(500) NULL,
  CreatedAt      DATETIME2(0) NOT NULL CONSTRAINT DF_Customer_CreatedAt DEFAULT (SYSUTCDATETIME()),
  UpdatedAt      DATETIME2(0) NOT NULL CONSTRAINT DF_Customer_UpdatedAt DEFAULT (SYSUTCDATETIME()),
  CreatedBy      INT NULL,
  UpdatedBy      INT NULL,
  DeletedAt      DATETIME2(0) NULL,
  DeletedBy      INT NULL,
  CONSTRAINT CK_Customer_Type CHECK (CustomerType IN (N'INDIVIDUAL', N'COMPANY', N'AGENCY')),
  CONSTRAINT FK_Customer_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES dbo.AppUser(UserId),
  CONSTRAINT FK_Customer_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES dbo.AppUser(UserId),
  CONSTRAINT FK_Customer_DeletedBy FOREIGN KEY (DeletedBy) REFERENCES dbo.AppUser(UserId)
);
GO

CREATE TABLE dbo.Guest (
  GuestId          BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Guest PRIMARY KEY,
  FullName         NVARCHAR(200) NOT NULL,
  Phone            NVARCHAR(50) NULL,
  Email            NVARCHAR(200) NULL,
  IdType           NVARCHAR(30) NULL, -- CCCD/PASSPORT/OTHER
  IdNumber         NVARCHAR(50) NULL,
  DateOfBirth      DATE NULL,
  Nationality      NVARCHAR(100) NULL,
  CreatedAt        DATETIME2(0) NOT NULL CONSTRAINT DF_Guest_CreatedAt DEFAULT (SYSUTCDATETIME()),
  UpdatedAt        DATETIME2(0) NOT NULL CONSTRAINT DF_Guest_UpdatedAt DEFAULT (SYSUTCDATETIME()),
  CreatedBy        INT NULL,
  UpdatedBy        INT NULL,
  DeletedAt        DATETIME2(0) NULL,
  DeletedBy        INT NULL,
  CONSTRAINT FK_Guest_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES dbo.AppUser(UserId),
  CONSTRAINT FK_Guest_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES dbo.AppUser(UserId),
  CONSTRAINT FK_Guest_DeletedBy FOREIGN KEY (DeletedBy) REFERENCES dbo.AppUser(UserId)
);
GO

-- =========
-- 5) Reservation (v1: 1 reservation = 1 room)
-- =========

IF OBJECT_ID(N'dbo.Reservation', N'U') IS NOT NULL DROP TABLE dbo.Reservation;
GO

CREATE TABLE dbo.Reservation (
  ReservationId    BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Reservation PRIMARY KEY,
  HotelId          INT NOT NULL,
  RoomId           INT NOT NULL,
  CustomerId       BIGINT NULL,
  StatusCode       NVARCHAR(30) NOT NULL, -- CONFIRMED/CANCELLED/NO_SHOW/CHECKED_IN/CHECKED_OUT
  CheckInDate      DATE NOT NULL,
  CheckOutDate     DATE NOT NULL,
  Adults           INT NOT NULL CONSTRAINT DF_Reservation_Adults DEFAULT(1),
  Children         INT NOT NULL CONSTRAINT DF_Reservation_Children DEFAULT(0),
  RatePerNight     DECIMAL(18,2) NOT NULL CONSTRAINT CK_Reservation_Rate CHECK (RatePerNight >= 0),
  SpecialRequest   NVARCHAR(500) NULL,
  CreatedAt        DATETIME2(0) NOT NULL CONSTRAINT DF_Reservation_CreatedAt DEFAULT (SYSUTCDATETIME()),
  UpdatedAt        DATETIME2(0) NOT NULL CONSTRAINT DF_Reservation_UpdatedAt DEFAULT (SYSUTCDATETIME()),
  CreatedBy        INT NULL,
  UpdatedBy        INT NULL,
  DeletedAt        DATETIME2(0) NULL,
  DeletedBy        INT NULL,
  CONSTRAINT FK_Reservation_Hotel FOREIGN KEY (HotelId) REFERENCES dbo.Hotel(HotelId),
  CONSTRAINT FK_Reservation_Room FOREIGN KEY (RoomId) REFERENCES dbo.Room(RoomId),
  CONSTRAINT FK_Reservation_Customer FOREIGN KEY (CustomerId) REFERENCES dbo.Customer(CustomerId),
  CONSTRAINT FK_Reservation_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES dbo.AppUser(UserId),
  CONSTRAINT FK_Reservation_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES dbo.AppUser(UserId),
  CONSTRAINT FK_Reservation_DeletedBy FOREIGN KEY (DeletedBy) REFERENCES dbo.AppUser(UserId),
  CONSTRAINT CK_Reservation_Status CHECK (StatusCode IN (
    N'CONFIRMED', N'CANCELLED', N'NO_SHOW', N'CHECKED_IN', N'CHECKED_OUT'
  )),
  CONSTRAINT CK_Reservation_Dates CHECK (CheckOutDate > CheckInDate)
);
GO

-- =========
-- 6) Stay (actual occupancy)
-- =========

IF OBJECT_ID(N'dbo.Stay', N'U') IS NOT NULL DROP TABLE dbo.Stay;
IF OBJECT_ID(N'dbo.StayGuest', N'U') IS NOT NULL DROP TABLE dbo.StayGuest;
GO

CREATE TABLE dbo.Stay (
  StayId            BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Stay PRIMARY KEY,
  HotelId           INT NOT NULL,
  RoomId            INT NOT NULL,
  ReservationId     BIGINT NULL,
  StatusCode        NVARCHAR(30) NOT NULL, -- IN_HOUSE/CHECKED_OUT
  CheckInAt         DATETIME2(0) NOT NULL,
  CheckOutAt        DATETIME2(0) NULL,
  DepositAmount     DECIMAL(18,2) NOT NULL CONSTRAINT DF_Stay_Deposit DEFAULT(0),
  Notes             NVARCHAR(500) NULL,
  CreatedAt         DATETIME2(0) NOT NULL CONSTRAINT DF_Stay_CreatedAt DEFAULT (SYSUTCDATETIME()),
  UpdatedAt         DATETIME2(0) NOT NULL CONSTRAINT DF_Stay_UpdatedAt DEFAULT (SYSUTCDATETIME()),
  CreatedBy         INT NULL,
  UpdatedBy         INT NULL,
  DeletedAt         DATETIME2(0) NULL,
  DeletedBy         INT NULL,
  CONSTRAINT FK_Stay_Hotel FOREIGN KEY (HotelId) REFERENCES dbo.Hotel(HotelId),
  CONSTRAINT FK_Stay_Room FOREIGN KEY (RoomId) REFERENCES dbo.Room(RoomId),
  CONSTRAINT FK_Stay_Reservation FOREIGN KEY (ReservationId) REFERENCES dbo.Reservation(ReservationId),
  CONSTRAINT FK_Stay_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES dbo.AppUser(UserId),
  CONSTRAINT FK_Stay_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES dbo.AppUser(UserId),
  CONSTRAINT FK_Stay_DeletedBy FOREIGN KEY (DeletedBy) REFERENCES dbo.AppUser(UserId),
  CONSTRAINT CK_Stay_Status CHECK (StatusCode IN (N'IN_HOUSE', N'CHECKED_OUT'))
);
GO

CREATE TABLE dbo.StayGuest (
  StayId    BIGINT NOT NULL,
  GuestId   BIGINT NOT NULL,
  IsPrimary BIT NOT NULL CONSTRAINT DF_StayGuest_IsPrimary DEFAULT(0),
  CONSTRAINT PK_StayGuest PRIMARY KEY (StayId, GuestId),
  CONSTRAINT FK_StayGuest_Stay FOREIGN KEY (StayId) REFERENCES dbo.Stay(StayId),
  CONSTRAINT FK_StayGuest_Guest FOREIGN KEY (GuestId) REFERENCES dbo.Guest(GuestId)
);
GO

-- =========
-- 7) Service Orders (incidental charges)
-- =========

IF OBJECT_ID(N'dbo.ServiceOrder', N'U') IS NOT NULL DROP TABLE dbo.ServiceOrder;
GO

CREATE TABLE dbo.ServiceOrder (
  ServiceOrderId   BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ServiceOrder PRIMARY KEY,
  StayId           BIGINT NOT NULL,
  ServiceCode      NVARCHAR(50) NOT NULL,  -- MINIBAR/LAUNDRY/BREAKFAST/EXTRA_BED/OTHER
  Description      NVARCHAR(300) NULL,
  Quantity         INT NOT NULL CONSTRAINT DF_ServiceOrder_Qty DEFAULT(1),
  UnitPrice        DECIMAL(18,2) NOT NULL CONSTRAINT CK_ServiceOrder_UnitPrice CHECK (UnitPrice >= 0),
  StatusCode       NVARCHAR(30) NOT NULL,  -- ACTIVE/CANCELLED
  CreatedAt        DATETIME2(0) NOT NULL CONSTRAINT DF_ServiceOrder_CreatedAt DEFAULT (SYSUTCDATETIME()),
  UpdatedAt        DATETIME2(0) NOT NULL CONSTRAINT DF_ServiceOrder_UpdatedAt DEFAULT (SYSUTCDATETIME()),
  CreatedBy        INT NULL,
  UpdatedBy        INT NULL,
  DeletedAt        DATETIME2(0) NULL,
  DeletedBy        INT NULL,
  CancelReason     NVARCHAR(300) NULL,
  CONSTRAINT FK_ServiceOrder_Stay FOREIGN KEY (StayId) REFERENCES dbo.Stay(StayId),
  CONSTRAINT FK_ServiceOrder_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES dbo.AppUser(UserId),
  CONSTRAINT FK_ServiceOrder_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES dbo.AppUser(UserId),
  CONSTRAINT FK_ServiceOrder_DeletedBy FOREIGN KEY (DeletedBy) REFERENCES dbo.AppUser(UserId),
  CONSTRAINT CK_ServiceOrder_Status CHECK (StatusCode IN (N'ACTIVE', N'CANCELLED'))
);
GO

-- =========
-- 8) Payments (cashflow)
-- =========

IF OBJECT_ID(N'dbo.Payment', N'U') IS NOT NULL DROP TABLE dbo.Payment;
GO

CREATE TABLE dbo.Payment (
  PaymentId        BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Payment PRIMARY KEY,
  StayId           BIGINT NULL,
  ReservationId    BIGINT NULL,
  PaymentType      NVARCHAR(20) NOT NULL, -- CHARGE/DEPOSIT/REFUND
  MethodCode       NVARCHAR(30) NOT NULL, -- CASH/BANK_TRANSFER/CARD/OTHER
  Amount           DECIMAL(18,2) NOT NULL CONSTRAINT CK_Payment_Amount CHECK (Amount >= 0),
  StatusCode       NVARCHAR(20) NOT NULL, -- PAID/VOID
  ReferenceNo      NVARCHAR(100) NULL,
  Note             NVARCHAR(300) NULL,
  CreatedAt        DATETIME2(0) NOT NULL CONSTRAINT DF_Payment_CreatedAt DEFAULT (SYSUTCDATETIME()),
  UpdatedAt        DATETIME2(0) NOT NULL CONSTRAINT DF_Payment_UpdatedAt DEFAULT (SYSUTCDATETIME()),
  CreatedBy        INT NULL,
  UpdatedBy        INT NULL,
  DeletedAt        DATETIME2(0) NULL,
  DeletedBy        INT NULL,
  CONSTRAINT FK_Payment_Stay FOREIGN KEY (StayId) REFERENCES dbo.Stay(StayId),
  CONSTRAINT FK_Payment_Reservation FOREIGN KEY (ReservationId) REFERENCES dbo.Reservation(ReservationId),
  CONSTRAINT FK_Payment_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES dbo.AppUser(UserId),
  CONSTRAINT FK_Payment_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES dbo.AppUser(UserId),
  CONSTRAINT FK_Payment_DeletedBy FOREIGN KEY (DeletedBy) REFERENCES dbo.AppUser(UserId),
  CONSTRAINT CK_Payment_Type CHECK (PaymentType IN (N'CHARGE', N'DEPOSIT', N'REFUND')),
  CONSTRAINT CK_Payment_Method CHECK (MethodCode IN (N'CASH', N'BANK_TRANSFER', N'CARD', N'OTHER')),
  CONSTRAINT CK_Payment_Status CHECK (StatusCode IN (N'PAID', N'VOID')),
  CONSTRAINT CK_Payment_Target CHECK (StayId IS NOT NULL OR ReservationId IS NOT NULL)
);
GO

-- =========
-- 9) Housekeeping & Maintenance Tickets
-- =========

IF OBJECT_ID(N'dbo.HousekeepingTask', N'U') IS NOT NULL DROP TABLE dbo.HousekeepingTask;
IF OBJECT_ID(N'dbo.MaintenanceTicket', N'U') IS NOT NULL DROP TABLE dbo.MaintenanceTicket;
GO

CREATE TABLE dbo.HousekeepingTask (
  TaskId        BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_HousekeepingTask PRIMARY KEY,
  RoomId        INT NOT NULL,
  AssignedTo    INT NULL, -- AppUser
  StatusCode    NVARCHAR(20) NOT NULL, -- OPEN/IN_PROGRESS/DONE/CANCELLED
  CreatedAt     DATETIME2(0) NOT NULL CONSTRAINT DF_HK_CreatedAt DEFAULT (SYSUTCDATETIME()),
  UpdatedAt     DATETIME2(0) NOT NULL CONSTRAINT DF_HK_UpdatedAt DEFAULT (SYSUTCDATETIME()),
  CreatedBy     INT NULL,
  UpdatedBy     INT NULL,
  DeletedAt     DATETIME2(0) NULL,
  DeletedBy     INT NULL,
  Note          NVARCHAR(300) NULL,
  CONSTRAINT FK_HK_Room FOREIGN KEY (RoomId) REFERENCES dbo.Room(RoomId),
  CONSTRAINT FK_HK_AssignedTo FOREIGN KEY (AssignedTo) REFERENCES dbo.AppUser(UserId),
  CONSTRAINT FK_HK_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES dbo.AppUser(UserId),
  CONSTRAINT FK_HK_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES dbo.AppUser(UserId),
  CONSTRAINT FK_HK_DeletedBy FOREIGN KEY (DeletedBy) REFERENCES dbo.AppUser(UserId),
  CONSTRAINT CK_HK_Status CHECK (StatusCode IN (N'OPEN', N'IN_PROGRESS', N'DONE', N'CANCELLED'))
);
GO

CREATE TABLE dbo.MaintenanceTicket (
  TicketId      BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_MaintenanceTicket PRIMARY KEY,
  RoomId        INT NOT NULL,
  AssignedTo    INT NULL,
  Title         NVARCHAR(200) NOT NULL,
  Description   NVARCHAR(500) NULL,
  StatusCode    NVARCHAR(20) NOT NULL, -- OPEN/IN_PROGRESS/DONE/CANCELLED
  CreatedAt     DATETIME2(0) NOT NULL CONSTRAINT DF_MT_CreatedAt DEFAULT (SYSUTCDATETIME()),
  UpdatedAt     DATETIME2(0) NOT NULL CONSTRAINT DF_MT_UpdatedAt DEFAULT (SYSUTCDATETIME()),
  CreatedBy     INT NULL,
  UpdatedBy     INT NULL,
  DeletedAt     DATETIME2(0) NULL,
  DeletedBy     INT NULL,
  CancelReason  NVARCHAR(300) NULL,
  CONSTRAINT FK_MT_Room FOREIGN KEY (RoomId) REFERENCES dbo.Room(RoomId),
  CONSTRAINT FK_MT_AssignedTo FOREIGN KEY (AssignedTo) REFERENCES dbo.AppUser(UserId),
  CONSTRAINT FK_MT_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES dbo.AppUser(UserId),
  CONSTRAINT FK_MT_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES dbo.AppUser(UserId),
  CONSTRAINT FK_MT_DeletedBy FOREIGN KEY (DeletedBy) REFERENCES dbo.AppUser(UserId),
  CONSTRAINT CK_MT_Status CHECK (StatusCode IN (N'OPEN', N'IN_PROGRESS', N'DONE', N'CANCELLED'))
);
GO

