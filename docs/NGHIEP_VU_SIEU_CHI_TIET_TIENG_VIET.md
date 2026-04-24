# TÀI LIỆU NGHIỆP VỤ SIÊU CHI TIẾT - HỆ THỐNG QUẢN LÝ KHÁCH SẠN

Ngày cập nhật: 24/04/2026  
Phạm vi: `HotelManagement.Api` + `hotel-management-web` + SQL Server `HotelManagement`

---

## 1. Mục tiêu tài liệu

Tài liệu này dùng làm chuẩn nghiệp vụ chi tiết cho:
- Bàn giao hệ thống.
- Kiểm thử chức năng.
- Đồng bộ giữa Backend, Frontend, QA.
- Làm baseline mở rộng tính năng.

---

## 2. Mô hình nghiệp vụ tổng thể

Chuỗi nghiệp vụ chuẩn:
1. Khởi tạo danh mục (Khách sạn -> Loại phòng -> Phòng -> Dịch vụ).
2. Tạo khách hàng.
3. Tạo đặt phòng.
4. Nhận phòng (Check-in) tạo Stay.
5. Phát sinh dịch vụ trong lưu trú (ServiceOrder).
6. Trả phòng (Check-out).
7. Thanh toán theo Stay (CASH, tự tính tiền).
8. Xuất hóa đơn và xuất PDF.

---

## 3. Vai trò và phân quyền

- `ADMIN`: toàn quyền.
- `RECEPTION`: vận hành đặt phòng, check-in/out, danh mục vận hành.
- `ACCOUNTANT`: nghiệp vụ thanh toán, hóa đơn, void giao dịch.
- `MANAGER`: theo dõi báo cáo/tổng quan.

### Nguyên tắc bảo mật
- API yêu cầu JWT Bearer.
- Không đủ quyền trả 403.
- Không có token hoặc token hết hạn trả 401.

---

## 4. Mô tả dữ liệu chính và ý nghĩa

### 4.1 Hotel
- Mục đích: đơn vị vận hành cao nhất.
- Trường chính:
  - `HotelId`
  - `HotelName`
  - `Phone`, `Email`
  - `IsActive`

### 4.2 RoomType
- Mục đích: chuẩn phân loại phòng trong 1 hotel.
- Trường chính:
  - `RoomTypeId`, `HotelId`
  - `RoomTypeName`
  - `Capacity`, `BaseRate`
  - `IsActive`

### 4.3 Room
- Mục đích: phòng thực tế bán được.
- Trường chính:
  - `RoomId`, `HotelId`, `RoomTypeId`
  - `RoomNumber`
  - `StatusCode`
  - `IsActive`

### 4.4 Customer
- Mục đích: thông tin khách sử dụng dịch vụ.
- Trường chính:
  - `CustomerType` (INDIVIDUAL/COMPANY)
  - `FullName` hoặc `CompanyName`
  - `Phone`, `Email`
  - `LoyaltyPoints`, `LoyaltyTier`
  - `DeletedAt` (xóa mềm)

### 4.5 Reservation (Booking)
- Mục đích: đơn đặt phòng.
- Trường chính:
  - `ReservationId`, `HotelId`, `RoomId`, `CustomerId`
  - `CheckInDate`, `CheckOutDate`
  - `RatePerNight`
  - `StatusCode` (CONFIRMED/CHECKED_IN/CHECKED_OUT/CANCELLED)

### 4.6 Stay
- Mục đích: kỳ lưu trú thực tế.
- Trường chính:
  - `StayId`, `ReservationId`
  - `CheckInAt`, `CheckOutAt`
  - `StatusCode` (IN_HOUSE/CHECKED_OUT)

### 4.7 HotelService & ServiceOrder
- `HotelService`: danh mục dịch vụ theo khách sạn.
- `ServiceOrder`: dòng dịch vụ phát sinh theo Stay.
- Chỉ `ServiceOrder.StatusCode = ACTIVE` được tính vào thanh toán/hóa đơn.

### 4.8 Payment
- Mục đích: ghi nhận giao dịch tiền.
- Trường chính:
  - `PaymentId`, `StayId`, `ReservationId`
  - `MethodCode` (chuẩn hiện tại: CASH)
  - `Amount`
  - `StatusCode` (PAID/VOID)

### 4.9 Invoice
- Mục đích: chứng từ tổng hợp cuối kỳ.
- Trường chính:
  - `Id`, `BookingId`
  - `RoomAmount`, `ServiceAmount`, `TotalAmount`
  - `PaidAt`, `PaymentMethod`

---

## 5. Quy tắc nghiệp vụ chi tiết theo module

## 5.1 Hotels
- Danh sách mặc định chỉ lấy `IsActive=true` nếu không bật includeInactive.
- Không cho trùng thông tin định danh với bản ghi active (theo logic API).
- Ngưng hoạt động là xóa mềm (`IsActive=false`).

### Quy tắc mới: xác nhận cha/con khi ngưng Hotel
- Nếu Hotel còn dữ liệu con active (`Room`, `RoomType`, `HotelService`):
  - API trả `409` + `requiresConfirmation = true`.
  - Frontend hiển thị hộp xác nhận lần 2.
- Nếu người dùng đồng ý:
  - Gọi `DELETE /api/hotels/{id}?cascadeChildren=true`.
  - Hệ thống ngưng toàn bộ con trước khi ngưng Hotel.

## 5.2 RoomTypes
- Không cho trùng `RoomTypeName` active trong cùng hotel.
- Có restore nếu hotel cha vẫn active.

### Quy tắc mới: xác nhận cha/con khi ngưng RoomType
- Nếu RoomType còn Room active:
  - Trả `409` + `requiresConfirmation=true`.
- Xác nhận cascade:
  - `DELETE /api/roomtypes/{id}?cascadeChildren=true`
  - Ngưng toàn bộ phòng con.

## 5.3 Rooms
- `RoomNumber` duy nhất trong 1 hotel (với room active).
- Ngưng room sẽ chuyển `StatusCode` về `OUT_OF_SERVICE`.
- Restore room chỉ khi hotel và roomtype cha còn active.

## 5.4 Customers
- Cá nhân bắt buộc họ tên hợp lệ.
- Công ty bắt buộc tên công ty hợp lệ.
- Frontend có validate trùng cục bộ theo tên/sđt/email để giảm lỗi submit.

## 5.5 Bookings / Stays
- Không cho booking trùng lịch phòng theo khoảng ngày.
- Check-in tạo Stay.
- Check-out đóng stay, là điều kiện bắt buộc cho thanh toán mới.

## 5.6 Services
- Mỗi hotel có danh mục dịch vụ riêng.
- Có thể thêm hàng loạt dịch vụ mẫu.
- ServiceOrder chỉ tính tiền khi ACTIVE.

## 5.7 Payments (đã chuẩn hóa theo yêu cầu mới)
- Chỉ dùng `stayId`.
- Chỉ thanh toán khi stay `CHECKED_OUT`.
- Method cố định: `CASH`.
- Amount tự tính từ hệ thống, không cho nhập tay.
- Không cho tạo payment PAID trùng cùng stay.

## 5.8 Invoices
- Danh sách invoice chỉ lấy hóa đơn có payment thành công (`PAID`).
- Tạo invoice sau check-out.
- Xuất PDF bằng endpoint riêng.

---

## 6. Luồng trạng thái (State Transition)

### 6.1 Booking
- `CONFIRMED -> CHECKED_IN -> CHECKED_OUT`
- `CONFIRMED -> CANCELLED`

### 6.2 Stay
- `IN_HOUSE -> CHECKED_OUT`

### 6.3 Payment
- `PAID -> VOID`

### 6.4 Room (tham chiếu vận hành)
- `VACANT <-> OCCUPIED`
- `OUT_OF_SERVICE` / `MAINTENANCE` là trạng thái không bán.

---

## 7. Danh mục API quan trọng (tham chiếu nhanh)

- Auth: `/api/auth/login`, `/api/auth/me`
- Hotels: `/api/hotels`, `/api/hotels/{id}`, `/api/hotels/{id}/restore`
- RoomTypes: `/api/roomtypes`, `/api/roomtypes/{id}`, `/api/roomtypes/{id}/restore`
- Rooms: `/api/rooms`, `/api/rooms/available`, `/api/rooms/{id}/restore`
- Customers: `/api/customers`
- Bookings: `/api/bookings`, `/api/bookings/{id}/check-in`, `/api/bookings/{id}/check-out`
- Stays: `/api/stays`
- Services: `/api/hotelservices`, `/api/service-orders`
- Payments: `/api/payments`, `/api/payments/{id}/void`
- Invoices: `/api/invoices`, `/api/invoices/{id}`, `/api/invoices/{id}/pdf`

---

## 8. Nghiệp vụ UI/UX

- Danh sách có filter + paging.
- Các thao tác nguy hiểm đều qua `ConfirmDialog`.
- Trường hợp ngưng cha có con:
  - Cảnh báo số lượng con.
  - Xác nhận lần 2 để cascade.
- Form tạo khách hàng đã nâng cấp:
  - Chia section.
  - Hiển thị lỗi theo field.

---

## 9. Dữ liệu mẫu và script SQL

Các script chính:
- Reset + seed dữ liệu mẫu tương thích schema.
- Bổ sung nhiều dịch vụ theo hotel.
- Dọn dữ liệu cũ theo thứ tự an toàn quan hệ.

Khuyến nghị:
- Trước kiểm thử tổng thể, chạy reset/seed để tránh dữ liệu bẩn.

---

## 10. Kịch bản kiểm thử chi tiết (UAT)

### 10.1 Thanh toán theo stay
- Bước:
  1) Chọn stay chưa check-out -> submit payment.
  2) Kỳ vọng: báo lỗi không cho thanh toán.
  3) Check-out stay, submit lại.
  4) Kỳ vọng: tạo PAID, amount tự tính, method CASH.

### 10.2 Invoice chỉ hiển thị đã PAID
- Bước:
  1) Tạo invoice cho booking có payment PAID.
  2) Tạo invoice khác chưa có payment PAID.
  3) Mở danh sách invoice.
  4) Kỳ vọng: chỉ thấy hóa đơn có PAID.

### 10.3 Ngưng Hotel có dữ liệu con
- Bước:
  1) Chọn hotel còn room/roomtype/service active.
  2) Bấm Ngưng HĐ.
  3) Kỳ vọng: hiện xác nhận lần 2.
  4) Đồng ý ngưng tất cả.
  5) Kỳ vọng: cha và toàn bộ con chuyển inactive.

### 10.4 Xuất PDF hóa đơn
- Bước:
  1) Vào chi tiết invoice.
  2) Bấm Xuất PDF.
  3) Kỳ vọng: tải file `invoice-{id}.pdf`, mở được.

---

## 11. Ngoại lệ và xử lý lỗi

- 400: dữ liệu không hợp lệ, sai điều kiện nghiệp vụ.
- 401: chưa đăng nhập / token hết hạn.
- 403: không đủ quyền.
- 404: không tìm thấy dữ liệu.
- 409: xung đột nghiệp vụ (điển hình: cần xác nhận cascade).

---

## 12. Checklist trước khi demo / bàn giao

- [ ] API backend chạy bản mới nhất.
- [ ] Frontend hard refresh (Ctrl + F5).
- [ ] Seed dữ liệu đầy đủ.
- [ ] Test đủ 4 luồng chính:
  - [ ] Booking -> Stay -> Payment
  - [ ] Invoice list chỉ PAID
  - [ ] Cascade deactivate cha/con
  - [ ] Export PDF
- [ ] Có tài liệu Word tiếng Việt có dấu đầy đủ.

---

## 13. Vận hành và xử lý sự cố

Nếu thấy hành vi cũ sau khi đã sửa:
1. Dừng process API cũ (DLL bị lock).
2. Build lại backend.
3. Chạy lại API.
4. Hard refresh frontend.
5. Kiểm tra đúng base URL frontend trỏ về API mới.

---

## 14. Định hướng nâng cấp tiếp theo

- Chuẩn hóa mã lỗi nghiệp vụ theo từng code riêng.
- Bổ sung báo cáo doanh thu theo kỳ và occupancy.
- Cải tiến mẫu PDF có logo, chữ ký, footer chuẩn doanh nghiệp.
- Mở rộng phân quyền chi tiết đến từng action.

---

## 15. Kết luận

Đây là phiên bản tài liệu nghiệp vụ mức chi tiết cao, phù hợp để:
- nộp báo cáo,
- trình bày bảo vệ,
- bàn giao kỹ thuật,
- làm chuẩn kiểm thử UAT.
