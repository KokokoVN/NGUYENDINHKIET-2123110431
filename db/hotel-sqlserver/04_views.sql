-- HotelManagement DB - Views

USE [HotelManagement];
GO

IF OBJECT_ID(N'dbo.vw_RoomAvailability', N'V') IS NOT NULL DROP VIEW dbo.vw_RoomAvailability;
GO

CREATE VIEW dbo.vw_RoomAvailability
AS
SELECT
  r.RoomId,
  r.HotelId,
  r.RoomNumber,
  r.Floor,
  r.StatusCode AS CurrentStatus,
  rt.RoomTypeId,
  rt.RoomTypeName,
  rt.Capacity,
  rt.BaseRate
FROM dbo.Room r
JOIN dbo.RoomType rt ON rt.RoomTypeId = r.RoomTypeId;
GO

IF OBJECT_ID(N'dbo.vw_StayBalance', N'V') IS NOT NULL DROP VIEW dbo.vw_StayBalance;
GO

CREATE VIEW dbo.vw_StayBalance
AS
SELECT
  s.StayId,
  s.HotelId,
  s.RoomId,
  s.ReservationId,
  s.StatusCode,
  s.CheckInAt,
  s.CheckOutAt,
  s.DepositAmount,
  ISNULL(so.ServiceTotal, 0) AS ServiceTotal,
  ISNULL(p.PaymentsTotal, 0) AS PaymentsTotal
FROM dbo.Stay s
OUTER APPLY (
  SELECT SUM(CASE WHEN StatusCode = N'ACTIVE' THEN Quantity * UnitPrice ELSE 0 END) AS ServiceTotal
  FROM dbo.ServiceOrder x
  WHERE x.StayId = s.StayId
) so
OUTER APPLY (
  SELECT SUM(CASE WHEN StatusCode = N'PAID' THEN Amount ELSE 0 END) AS PaymentsTotal
  FROM dbo.Payment p
  WHERE p.StayId = s.StayId
) p;
GO

