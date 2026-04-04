-- HotelManagement DB - Invoice + Danh mục dịch vụ (bổ sung sau 02_schema_tables)

USE [HotelManagement];
GO

-- ========= Invoice (hóa đơn ứng dụng — một đặt phòng một hóa đơn) =========

IF OBJECT_ID(N'dbo.Invoice', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Invoice (
    Id               INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Invoice PRIMARY KEY,
    BookingId        BIGINT NOT NULL,
    RoomAmount       DECIMAL(18,2) NOT NULL CONSTRAINT CK_Invoice_Room CHECK (RoomAmount >= 0),
    ServiceAmount    DECIMAL(18,2) NOT NULL CONSTRAINT CK_Invoice_Service CHECK (ServiceAmount >= 0),
    TotalAmount      DECIMAL(18,2) NOT NULL CONSTRAINT CK_Invoice_Total CHECK (TotalAmount >= 0),
    PaidAt           DATETIME2(0) NOT NULL CONSTRAINT DF_Invoice_PaidAt DEFAULT (SYSUTCDATETIME()),
    PaymentMethod    NVARCHAR(50) NOT NULL,
    Note             NVARCHAR(500) NULL,
    CONSTRAINT FK_Invoice_Booking FOREIGN KEY (BookingId) REFERENCES dbo.Reservation(ReservationId),
    CONSTRAINT UQ_Invoice_Booking UNIQUE (BookingId)
  );
END
GO

-- ========= Danh mục dịch vụ theo khách sạn (giá gợi ý khi ghi ServiceOrder) =========

IF OBJECT_ID(N'dbo.HotelService', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.HotelService (
    HotelServiceId    INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_HotelService PRIMARY KEY,
    HotelId           INT NOT NULL,
    ServiceCode       NVARCHAR(50) NOT NULL,
    ServiceName       NVARCHAR(200) NOT NULL,
    DefaultUnitPrice  DECIMAL(18,2) NOT NULL CONSTRAINT DF_HotelService_Price DEFAULT(0),
    IsActive          BIT NOT NULL CONSTRAINT DF_HotelService_Active DEFAULT(1),
    CreatedAt         DATETIME2(0) NOT NULL CONSTRAINT DF_HotelService_CreatedAt DEFAULT (SYSUTCDATETIME()),
    UpdatedAt         DATETIME2(0) NOT NULL CONSTRAINT DF_HotelService_UpdatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_HotelService_Hotel FOREIGN KEY (HotelId) REFERENCES dbo.Hotel(HotelId),
    CONSTRAINT UQ_HotelService_Hotel_Code UNIQUE (HotelId, ServiceCode)
  );
END
GO

DECLARE @H INT = (SELECT TOP 1 HotelId FROM dbo.Hotel ORDER BY HotelId);
IF @H IS NOT NULL AND OBJECT_ID(N'dbo.HotelService', N'U') IS NOT NULL
BEGIN
  IF NOT EXISTS (SELECT 1 FROM dbo.HotelService WHERE HotelId = @H AND ServiceCode = N'BREAKFAST')
    INSERT INTO dbo.HotelService (HotelId, ServiceCode, ServiceName, DefaultUnitPrice, IsActive)
    VALUES
      (@H, N'BREAKFAST', N'An sang', 80000, 1),
      (@H, N'MINIBAR', N'Minibar', 50000, 1),
      (@H, N'LAUNDRY', N'Giat ui', 60000, 1),
      (@H, N'EXTRA_BED', N'Giuong phu', 200000, 1),
      (@H, N'OTHER', N'Dich vu khac', 0, 1);
END
GO
