# FULL CHỨC NĂNG CẦN LÀM - WEB QUẢN LÝ KHÁCH SẠN

## 1) Mục tiêu hệ thống
- Xây dựng web quản lý khách sạn cho lễ tân và quản trị.
- Quản lý xuyên suốt: phòng -> đặt phòng -> dịch vụ -> hóa đơn -> báo cáo.
- Dữ liệu lưu trên SQL Server, backend dùng ASP.NET Core Web API.

## 2) Chức năng bắt buộc (MVP)

### 2.1 Xác thực và phân quyền
- [ ] Đăng nhập tài khoản.
- [ ] Đăng xuất.
- [ ] Phân quyền vai trò: `Admin`, `LeTan`.
- [ ] Bảo vệ API bằng JWT.

### 2.2 Quản lý phòng
- [ ] Danh sách phòng.
- [ ] Thêm phòng.
- [ ] Cập nhật thông tin phòng.
- [ ] Ngưng hoạt động phòng (xóa mềm).
- [ ] Tìm phòng theo số phòng, loại phòng, trạng thái.

### 2.3 Quản lý khách hàng
- [ ] Danh sách khách hàng.
- [ ] Thêm khách hàng mới.
- [ ] Cập nhật thông tin khách hàng.
- [ ] Tra cứu khách theo số điện thoại/CCCD.

### 2.4 Quản lý đặt phòng
- [ ] Tạo đặt phòng.
- [ ] Kiểm tra trùng lịch đặt.
- [ ] Danh sách đặt phòng theo ngày/trạng thái.
- [ ] Cập nhật trạng thái: `Booked`, `CheckedIn`, `CheckedOut`, `Cancelled`.
- [ ] Hủy đặt phòng.

### 2.5 Quản lý dịch vụ
- [ ] Danh mục dịch vụ (nước, giặt ủi, ăn sáng...).
- [ ] Thêm/sửa/ngưng dịch vụ.
- [ ] Ghi nhận dịch vụ phát sinh theo từng booking.
- [ ] Tính tổng tiền dịch vụ.

### 2.6 Hóa đơn và thanh toán
- [ ] Tính tiền phòng theo số đêm.
- [ ] Cộng tiền dịch vụ phát sinh.
- [ ] Xuất hóa đơn khi trả phòng.
- [ ] Lưu phương thức thanh toán (tiền mặt/chuyển khoản).
- [ ] In/xuất thông tin hóa đơn.

### 2.7 Dashboard và báo cáo
- [ ] Tổng số phòng trống/đang sử dụng.
- [ ] Tỷ lệ lấp đầy theo ngày/tháng.
- [ ] Doanh thu theo ngày/tháng/năm.
- [ ] Top dịch vụ sử dụng nhiều.

## 3) Chức năng nâng cao (sau MVP)
- [ ] Đặt phòng online từ website khách hàng.
- [ ] Gửi email/SMS xác nhận đặt phòng.
- [ ] Quản lý khuyến mãi/voucher.
- [ ] Tách hóa đơn theo nhiều phương thức thanh toán.
- [ ] Nhật ký thao tác (audit log).
- [ ] Sao lưu và phục hồi dữ liệu.

## 4) API backend cần có

### 4.1 Auth
- [ ] `POST /api/auth/login`
- [ ] `POST /api/auth/refresh-token` (nếu có)

### 4.2 Rooms
- [ ] `GET /api/rooms`
- [ ] `GET /api/rooms/{id}`
- [ ] `POST /api/rooms`
- [ ] `PUT /api/rooms/{id}`
- [ ] `DELETE /api/rooms/{id}` (xóa mềm)

### 4.3 Customers
- [ ] `GET /api/customers`
- [ ] `GET /api/customers/{id}`
- [ ] `POST /api/customers`
- [ ] `PUT /api/customers/{id}`

### 4.4 Bookings
- [ ] `GET /api/bookings`
- [ ] `GET /api/bookings/{id}`
- [ ] `POST /api/bookings`
- [ ] `PUT /api/bookings/{id}/check-in`
- [ ] `PUT /api/bookings/{id}/check-out`
- [ ] `PUT /api/bookings/{id}/cancel`

### 4.5 Services
- [ ] `GET /api/hotelservices`
- [ ] `POST /api/hotelservices`
- [ ] `PUT /api/hotelservices/{id}`
- [ ] `POST /api/bookingservices`

### 4.6 Invoices
- [ ] `GET /api/invoices`
- [ ] `GET /api/invoices/{id}`
- [ ] `POST /api/invoices`

## 5) Giao diện frontend cần làm

### 5.1 Trang đăng nhập
- [ ] Form đăng nhập.
- [ ] Lưu token sau đăng nhập.
- [ ] Tự động chuyển trang theo quyền.

### 5.2 Trang dashboard
- [ ] Card thống kê nhanh.
- [ ] Biểu đồ doanh thu.
- [ ] Biểu đồ tỷ lệ phòng.

### 5.3 Trang quản lý phòng
- [ ] Bảng danh sách + tìm kiếm + phân trang.
- [ ] Form thêm/sửa phòng.

### 5.4 Trang quản lý khách hàng
- [ ] Danh sách khách hàng.
- [ ] Thêm/sửa khách hàng.

### 5.5 Trang đặt phòng
- [ ] Tạo booking.
- [ ] Danh sách booking theo trạng thái.
- [ ] Nút check-in/check-out/hủy.

### 5.6 Trang dịch vụ
- [ ] Danh mục dịch vụ.
- [ ] Gán dịch vụ cho booking.

### 5.7 Trang hóa đơn
- [ ] Tạo hóa đơn.
- [ ] Xem chi tiết hóa đơn.
- [ ] In hóa đơn.

## 6) Database SQL Server cần có
- [ ] Bảng: `Rooms`
- [ ] Bảng: `Customers`
- [ ] Bảng: `Bookings`
- [ ] Bảng: `HotelServices`
- [ ] Bảng: `BookingServiceUsages`
- [ ] Bảng: `Invoices`
- [ ] Index cho tra cứu phòng, ngày check-in/check-out.
- [ ] View báo cáo doanh thu.
- [ ] Stored procedure cho thống kê.

## 7) Kiểm thử cần thực hiện
- [ ] Test đặt phòng trùng lịch.
- [ ] Test check-in/check-out đúng luồng.
- [ ] Test tính tiền phòng + dịch vụ.
- [ ] Test phân quyền API.
- [ ] Test dữ liệu đầu vào (validation).
- [ ] Test lỗi kết nối database.

## 8) Kế hoạch triển khai gợi ý
- Giai đoạn 1: Hoàn thiện backend API + database.
- Giai đoạn 2: Làm frontend quản lý cơ bản.
- Giai đoạn 3: Hoàn thiện báo cáo + phân quyền + kiểm thử.
- Giai đoạn 4: Đóng gói demo và viết báo cáo đồ án.

## 9) Trạng thái hiện tại của project này
- [x] Có project ASP.NET Core Web API.
- [x] Đã kết nối SQL Server `HotelManagement`.
- [x] Có module cơ bản: phòng, booking, dịch vụ, hóa đơn.
- [ ] Chưa có module Auth JWT và phân quyền.
- [ ] Chưa có frontend hoàn chỉnh.
