/*
  HotelManagement - Cleanup old data only (keep schema)
  Safe order delete with transaction + identity reseed.
*/

USE [HotelManagement];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

BEGIN TRY
    BEGIN TRAN;

    /* Business data */
    DELETE FROM [dbo].[Invoice];
    DELETE FROM [dbo].[Payment];
    DELETE FROM [dbo].[ServiceOrder];
    DELETE FROM [dbo].[Stay];
    DELETE FROM [dbo].[Reservation];
    DELETE FROM [dbo].[Customer];

    /* Optional: clear room/service master data too */
    DELETE FROM [dbo].[HotelService];
    DELETE FROM [dbo].[Room];
    DELETE FROM [dbo].[RoomType];
    DELETE FROM [dbo].[Hotel];

    /* Keep AppUser/AppRole/AppUserRole for login */

    /* Reseed identity */
    DBCC CHECKIDENT ('[dbo].[Invoice]', RESEED, 0) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('[dbo].[Payment]', RESEED, 0) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('[dbo].[ServiceOrder]', RESEED, 0) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('[dbo].[Stay]', RESEED, 0) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('[dbo].[Reservation]', RESEED, 0) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('[dbo].[Customer]', RESEED, 0) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('[dbo].[HotelService]', RESEED, 0) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('[dbo].[Room]', RESEED, 0) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('[dbo].[RoomType]', RESEED, 0) WITH NO_INFOMSGS;
    DBCC CHECKIDENT ('[dbo].[Hotel]', RESEED, 0) WITH NO_INFOMSGS;

    COMMIT TRAN;
    PRINT N'Cleanup old data completed successfully.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;

    DECLARE @Err NVARCHAR(4000) = ERROR_MESSAGE();
    RAISERROR(N'Cleanup failed: %s', 16, 1, @Err);
END CATCH;
GO
