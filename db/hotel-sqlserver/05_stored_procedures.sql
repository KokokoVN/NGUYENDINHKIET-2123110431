-- HotelManagement DB - Stored Procedures (basic)
-- Note: business logic in app is recommended; SPs here help avoid race conditions for room booking.

USE [HotelManagement];
GO

-- Helper: check overlap between [CheckInDate, CheckOutDate)
-- Overlap condition: existing.CheckIn < new.CheckOut AND existing.CheckOut > new.CheckIn

IF OBJECT_ID(N'dbo.sp_CreateReservation', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_CreateReservation;
GO

CREATE PROCEDURE dbo.sp_CreateReservation
  @HotelId        INT,
  @RoomId         INT,
  @CustomerId     BIGINT = NULL,
  @CheckInDate    DATE,
  @CheckOutDate   DATE,
  @Adults         INT = 1,
  @Children       INT = 0,
  @RatePerNight   DECIMAL(18,2),
  @SpecialRequest NVARCHAR(500) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  IF @CheckOutDate <= @CheckInDate
    THROW 50001, 'CheckOutDate must be greater than CheckInDate.', 1;

  BEGIN TRAN;

  -- lock the room row to reduce race when reserving
  DECLARE @status NVARCHAR(30);
  SELECT @status = StatusCode
  FROM dbo.Room WITH (UPDLOCK, ROWLOCK)
  WHERE RoomId = @RoomId AND HotelId = @HotelId;

  IF @status IS NULL
  BEGIN
    ROLLBACK;
    THROW 50002, 'Room not found.', 1;
  END

  IF @status IN (N'MAINTENANCE', N'OUT_OF_SERVICE')
  BEGIN
    ROLLBACK;
    THROW 50003, 'Room is not available (maintenance/out of service).', 1;
  END

  -- check overlap reservations that are still effective
  IF EXISTS (
    SELECT 1
    FROM dbo.Reservation WITH (UPDLOCK, HOLDLOCK)
    WHERE RoomId = @RoomId
      AND StatusCode IN (N'CONFIRMED', N'CHECKED_IN')
      AND CheckInDate < @CheckOutDate
      AND CheckOutDate > @CheckInDate
  )
  BEGIN
    ROLLBACK;
    THROW 50004, 'Room already reserved/occupied for selected dates.', 1;
  END

  INSERT INTO dbo.Reservation(
    HotelId, RoomId, CustomerId, StatusCode,
    CheckInDate, CheckOutDate, Adults, Children, RatePerNight, SpecialRequest
  )
  VALUES (
    @HotelId, @RoomId, @CustomerId, N'CONFIRMED',
    @CheckInDate, @CheckOutDate, @Adults, @Children, @RatePerNight, @SpecialRequest
  );

  DECLARE @ReservationId BIGINT = SCOPE_IDENTITY();

  -- optional: mark room as RESERVED immediately (simple approach)
  UPDATE dbo.Room
  SET StatusCode = N'RESERVED',
      UpdatedAt = SYSUTCDATETIME()
  WHERE RoomId = @RoomId AND StatusCode = N'VACANT';

  COMMIT;

  SELECT @ReservationId AS ReservationId;
END
GO

IF OBJECT_ID(N'dbo.sp_CheckIn', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_CheckIn;
GO

CREATE PROCEDURE dbo.sp_CheckIn
  @HotelId        INT,
  @RoomId         INT,
  @ReservationId  BIGINT = NULL,
  @DepositAmount  DECIMAL(18,2) = 0,
  @CheckInAt      DATETIME2(0) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  IF @CheckInAt IS NULL SET @CheckInAt = SYSUTCDATETIME();

  BEGIN TRAN;

  -- lock room
  DECLARE @roomStatus NVARCHAR(30);
  SELECT @roomStatus = StatusCode
  FROM dbo.Room WITH (UPDLOCK, ROWLOCK)
  WHERE RoomId = @RoomId AND HotelId = @HotelId;

  IF @roomStatus IS NULL
  BEGIN
    ROLLBACK;
    THROW 50011, 'Room not found.', 1;
  END

  IF @roomStatus IN (N'MAINTENANCE', N'OUT_OF_SERVICE')
  BEGIN
    ROLLBACK;
    THROW 50012, 'Room not available.', 1;
  END

  IF @ReservationId IS NOT NULL
  BEGIN
    DECLARE @resStatus NVARCHAR(30);
    SELECT @resStatus = StatusCode
    FROM dbo.Reservation WITH (UPDLOCK, ROWLOCK)
    WHERE ReservationId = @ReservationId AND HotelId = @HotelId AND RoomId = @RoomId;

    IF @resStatus IS NULL
    BEGIN
      ROLLBACK;
      THROW 50013, 'Reservation not found for this room.', 1;
    END

    IF @resStatus = N'CANCELLED'
    BEGIN
      ROLLBACK;
      THROW 50014, 'Cannot check-in a cancelled reservation.', 1;
    END

    UPDATE dbo.Reservation
    SET StatusCode = N'CHECKED_IN',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ReservationId = @ReservationId;
  END

  INSERT INTO dbo.Stay(HotelId, RoomId, ReservationId, StatusCode, CheckInAt, DepositAmount)
  VALUES(@HotelId, @RoomId, @ReservationId, N'IN_HOUSE', @CheckInAt, @DepositAmount);

  DECLARE @StayId BIGINT = SCOPE_IDENTITY();

  UPDATE dbo.Room
  SET StatusCode = N'OCCUPIED',
      UpdatedAt = SYSUTCDATETIME()
  WHERE RoomId = @RoomId;

  COMMIT;

  SELECT @StayId AS StayId;
END
GO

IF OBJECT_ID(N'dbo.sp_CheckOut', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_CheckOut;
GO

CREATE PROCEDURE dbo.sp_CheckOut
  @StayId       BIGINT,
  @CheckOutAt   DATETIME2(0) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  IF @CheckOutAt IS NULL SET @CheckOutAt = SYSUTCDATETIME();

  BEGIN TRAN;

  DECLARE @RoomId INT, @HotelId INT, @Status NVARCHAR(30), @ReservationId BIGINT;
  SELECT @RoomId = RoomId, @HotelId = HotelId, @Status = StatusCode, @ReservationId = ReservationId
  FROM dbo.Stay WITH (UPDLOCK, ROWLOCK)
  WHERE StayId = @StayId;

  IF @RoomId IS NULL
  BEGIN
    ROLLBACK;
    THROW 50021, 'Stay not found.', 1;
  END

  IF @Status <> N'IN_HOUSE'
  BEGIN
    ROLLBACK;
    THROW 50022, 'Stay is not in-house.', 1;
  END

  UPDATE dbo.Stay
  SET StatusCode = N'CHECKED_OUT',
      CheckOutAt = @CheckOutAt
  WHERE StayId = @StayId;

  IF @ReservationId IS NOT NULL
  BEGIN
    UPDATE dbo.Reservation
    SET StatusCode = N'CHECKED_OUT',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ReservationId = @ReservationId;
  END

  -- Room becomes DIRTY after checkout
  UPDATE dbo.Room
  SET StatusCode = N'DIRTY',
      UpdatedAt = SYSUTCDATETIME()
  WHERE RoomId = @RoomId;

  COMMIT;

  SELECT @HotelId AS HotelId, @RoomId AS RoomId;
END
GO

