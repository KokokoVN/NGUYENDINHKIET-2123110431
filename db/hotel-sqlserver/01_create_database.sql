-- HotelManagement DB - Create Database
-- SQL Server 2017+ recommended

IF DB_ID(N'HotelManagement') IS NULL
BEGIN
  CREATE DATABASE [HotelManagement];
END
GO

ALTER DATABASE [HotelManagement] SET READ_COMMITTED_SNAPSHOT ON;
GO

