# Nghiệp vụ quản lý khách sạn (bản đầy đủ)

## 1) Các phân hệ đã có trong project
- Quản lý phòng.
- Quản lý khách hàng.
- Đặt phòng và kiểm tra trùng lịch.
- Nhận phòng / trả phòng / hủy đặt phòng.
- Quản lý dịch vụ phát sinh theo từng booking.
- Xuất hóa đơn sau khi trả phòng.

## 2) Luồng nghiệp vụ chính
1. Tạo khách hàng (`Customers`).
2. Tạo đặt phòng (`Bookings`) với kiểm tra trùng lịch.
3. Khi khách đến: chuyển trạng thái sang `CheckedIn`.
4. Trong lúc ở: thêm dịch vụ phát sinh (`BookingServices`).
5. Khi khách trả: chuyển trạng thái sang `CheckedOut`.
6. Xuất hóa đơn (`Invoices`) để chốt thanh toán.

## 3) API hiện có
- **Phòng**
  - `GET /api/rooms`
- **Khách hàng**
  - `GET /api/customers`
  - `POST /api/customers`
- **Đặt phòng**
  - `GET /api/bookings`
  - `POST /api/bookings`
  - `PUT /api/bookings/{id}/check-in`
  - `PUT /api/bookings/{id}/check-out`
  - `PUT /api/bookings/{id}/cancel`
- **Dịch vụ khách sạn**
  - `GET /api/hotelservices`
  - `POST /api/hotelservices`
- **Dịch vụ theo đơn đặt phòng**
  - `POST /api/bookingservices`
- **Hóa đơn**
  - `GET /api/invoices`
  - `POST /api/invoices`

## 4) Kết nối SQL Server
- Database: `HotelManagement`
- SQL Server: `KOKOKOVN\SQLEXPRESS`
- Cấu hình nằm ở: `HotelManagement.Api/appsettings.json`

## 5) Script SQL trong thư mục `db/hotel-sqlserver`
Chạy theo thứ tự:
1. `01_create_database.sql`
2. `02_schema_tables.sql`
3. `03_indexes.sql`
4. `04_views.sql`
5. `05_stored_procedures.sql`
6. `06_seed_data.sql`

## 6) Gợi ý hoàn thiện web đầy đủ
- Thêm đăng nhập JWT + phân quyền (Admin, Lễ tân).
- Thêm module nhân viên, ca làm, báo cáo doanh thu.
- Tạo frontend (React/Angular hoặc Razor Pages).
- Tạo migration thay cho `EnsureCreated()` khi lên production.
