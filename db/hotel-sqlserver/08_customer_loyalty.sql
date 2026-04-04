-- Tích điểm & hạng khách hàng (bổ sung cột dbo.Customer)

USE [HotelManagement];
GO

IF COL_LENGTH('dbo.Customer', 'LoyaltyPoints') IS NULL
BEGIN
  ALTER TABLE dbo.Customer
  ADD LoyaltyPoints INT NOT NULL CONSTRAINT DF_Customer_LoyaltyPoints DEFAULT (0);
END
GO

IF COL_LENGTH('dbo.Customer', 'LoyaltyTier') IS NULL
BEGIN
  ALTER TABLE dbo.Customer
  ADD LoyaltyTier NVARCHAR(20) NOT NULL CONSTRAINT DF_Customer_LoyaltyTier DEFAULT (N'BRONZE');
END
GO
