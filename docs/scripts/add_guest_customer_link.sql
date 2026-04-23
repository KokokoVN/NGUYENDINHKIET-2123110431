SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRANSACTION;
BEGIN TRY
    IF COL_LENGTH('dbo.Guest', 'CustomerId') IS NULL
    BEGIN
        ALTER TABLE dbo.Guest
        ADD CustomerId BIGINT NULL;
    END;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = 'IX_Guest_CustomerId'
          AND object_id = OBJECT_ID('dbo.Guest')
    )
    BEGIN
        CREATE INDEX IX_Guest_CustomerId ON dbo.Guest(CustomerId);
    END;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.foreign_keys
        WHERE name = 'FK_Guest_Customer_CustomerId'
    )
    BEGIN
        ALTER TABLE dbo.Guest
        ADD CONSTRAINT FK_Guest_Customer_CustomerId
            FOREIGN KEY (CustomerId) REFERENCES dbo.Customer(CustomerId)
            ON DELETE SET NULL;
    END;

    COMMIT TRANSACTION;
    PRINT N'Done: Guest.CustomerId link added.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
