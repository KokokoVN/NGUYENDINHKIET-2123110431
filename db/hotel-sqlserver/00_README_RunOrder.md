# Hotel Management DB (SQL Server) – Run Order

Chạy theo thứ tự:

1. `01_create_database.sql`
2. `02_schema_tables.sql`
3. `03_indexes.sql`
4. `04_views.sql`
5. `05_stored_procedures.sql`
6. `06_seed_data.sql`
7. `07_invoice_hotel_service.sql` (bảng `Invoice`, `HotelService` — cần cho API hóa đơn & danh mục dịch vụ)
8. `08_customer_loyalty.sql` (cột `LoyaltyPoints`, `LoyaltyTier` trên `Customer` — tích điểm / hạng)

Gợi ý:
- Dùng SSMS hoặc Azure Data Studio.
- Nếu bạn muốn đổi tên DB, sửa trong `01_create_database.sql` và các dòng `USE ...` ở các file sau.

