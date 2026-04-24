SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRANSACTION;
BEGIN TRY
    DECLARE @now DATETIME2(7) = GETUTCDATE();

    ;WITH ServiceCatalog AS (
        SELECT 'LAUNDRY' AS ServiceCode, N'Giat ui nhanh' AS ServiceName, CAST(80000 AS DECIMAL(18,2)) AS DefaultUnitPrice
        UNION ALL SELECT 'SPA', N'Spa thu gian', CAST(450000 AS DECIMAL(18,2))
        UNION ALL SELECT 'AIRPORT_PICKUP', N'Dua don san bay', CAST(320000 AS DECIMAL(18,2))
        UNION ALL SELECT 'BUFFET_BREAKFAST', N'An sang buffet', CAST(180000 AS DECIMAL(18,2))
        UNION ALL SELECT 'MINIBAR', N'Nuoc uong minibar', CAST(45000 AS DECIMAL(18,2))
        UNION ALL SELECT 'LATE_CHECKOUT', N'Late check-out', CAST(220000 AS DECIMAL(18,2))
        UNION ALL SELECT 'EARLY_CHECKIN', N'Early check-in', CAST(180000 AS DECIMAL(18,2))
        UNION ALL SELECT 'MEETING_ROOM', N'Phong hop', CAST(700000 AS DECIMAL(18,2))
        UNION ALL SELECT 'BABY_CRIB', N'Noi em be', CAST(120000 AS DECIMAL(18,2))
        UNION ALL SELECT 'EXTRA_BED', N'Giuong phu', CAST(300000 AS DECIMAL(18,2))
        UNION ALL SELECT 'CITY_TOUR', N'Tour thanh pho', CAST(550000 AS DECIMAL(18,2))
        UNION ALL SELECT 'BIKE_RENTAL', N'Thue xe dap', CAST(90000 AS DECIMAL(18,2))
    )
    INSERT INTO dbo.HotelService (HotelId, ServiceCode, ServiceName, DefaultUnitPrice, IsActive, CreatedAt, UpdatedAt)
    SELECT
        h.HotelId,
        c.ServiceCode,
        c.ServiceName,
        c.DefaultUnitPrice,
        1,
        @now,
        @now
    FROM dbo.Hotel h
    CROSS JOIN ServiceCatalog c
    WHERE h.IsActive = 1
      AND NOT EXISTS (
          SELECT 1
          FROM dbo.HotelService hs
          WHERE hs.HotelId = h.HotelId
            AND hs.ServiceCode = c.ServiceCode
      );

    COMMIT TRANSACTION;
    PRINT N'Done: added more services for active hotels.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
