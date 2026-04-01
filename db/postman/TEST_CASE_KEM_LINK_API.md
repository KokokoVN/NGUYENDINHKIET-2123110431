# TEST CASE KÈM LINK API (DÙNG NGAY)

Base URL: `http://localhost:5066`

## 1) Đăng nhập JWT

### Case 1: Login đúng (Admin)
- **API**: `POST http://localhost:5066/api/auth/login`
- **Body**
```json
{
  "username": "admin",
  "password": "123456"
}
```
- **Kỳ vọng**: `200`, có `accessToken`, `role=ADMIN`.

### Case 2: Login đúng (Lễ tân)
- **API**: `POST http://localhost:5066/api/auth/login`
- **Body**
```json
{
  "username": "letan",
  "password": "123456"
}
```
- **Kỳ vọng**: `200`, `role=RECEPTION`.

### Case 3: Sai mật khẩu
- **API**: `POST http://localhost:5066/api/auth/login`
- **Body**
```json
{
  "username": "admin",
  "password": "saimatkhau"
}
```
- **Kỳ vọng**: `401`.

## 2) Token / Phân quyền

### Case 4: Không token
- **API**: `GET http://localhost:5066/api/rooms`
- **Kỳ vọng**: `401`.

### Case 5: Token rác
- **API**: `GET http://localhost:5066/api/rooms`
- **Header**: `Authorization: Bearer abc.def.ghi`
- **Kỳ vọng**: `401`.

### Case 6: Token hợp lệ
- **API**: `GET http://localhost:5066/api/rooms`
- **Header**: `Authorization: Bearer {{token}}`
- **Kỳ vọng**: `200`.

## 3) Quản lý phòng

### Case 7: Lấy danh sách phòng
- **API**: `GET http://localhost:5066/api/rooms`
- **Header**: `Authorization: Bearer {{token}}`
- **Kỳ vọng**: `200`.

### Case 8: Tìm theo số phòng
- **API**: `GET http://localhost:5066/api/rooms?roomNumber=101`
- **Header**: `Authorization: Bearer {{token}}`
- **Kỳ vọng**: `200`.

### Case 9: Thêm phòng hợp lệ
- **API**: `POST http://localhost:5066/api/rooms`
- **Header**: `Authorization: Bearer {{token}}`
- **Body**
```json
{
  "hotelId": 1,
  "roomTypeId": 1,
  "roomNumber": "301",
  "floor": "3",
  "statusCode": "VACANT"
}
```
- **Kỳ vọng**: `200`, thông báo thêm thành công.

### Case 10: Thêm phòng trùng số
- **API**: `POST http://localhost:5066/api/rooms`
- **Header**: `Authorization: Bearer {{token}}`
- **Body**
```json
{
  "hotelId": 1,
  "roomTypeId": 1,
  "roomNumber": "301",
  "floor": "3",
  "statusCode": "VACANT"
}
```
- **Kỳ vọng**: `400`, thông báo số phòng đã tồn tại.

## 4) Khách hàng

### Case 11: Tạo khách hàng hợp lệ
- **API**: `POST http://localhost:5066/api/customers`
- **Header**: `Authorization: Bearer {{token}}`
- **Body**
```json
{
  "customerType": "INDIVIDUAL",
  "fullName": "Khach Test A",
  "phone": "0901234567",
  "email": "a@test.com",
  "notes": "Test nhanh"
}
```
- **Kỳ vọng**: `200`.

### Case 12: Thiếu tên khách
- **API**: `POST http://localhost:5066/api/customers`
- **Header**: `Authorization: Bearer {{token}}`
- **Body**
```json
{
  "customerType": "INDIVIDUAL",
  "phone": "0909999999",
  "email": "fail@test.com"
}
```
- **Kỳ vọng**: `400` (validate).

## 5) Đặt phòng

### Case 13: Đặt phòng hợp lệ
- **API**: `POST http://localhost:5066/api/bookings`
- **Header**: `Authorization: Bearer {{token}}`
- **Body**
```json
{
  "roomId": 1,
  "customerId": null,
  "checkInDate": "2026-04-20",
  "checkOutDate": "2026-04-21",
  "adults": 1,
  "children": 0,
  "specialRequest": "Phong yen tinh"
}
```
- **Kỳ vọng**: `200`.

### Case 14: Sai ngày (checkout <= checkin)
- **API**: `POST http://localhost:5066/api/bookings`
- **Header**: `Authorization: Bearer {{token}}`
- **Body**
```json
{
  "roomId": 1,
  "customerId": null,
  "checkInDate": "2026-04-20",
  "checkOutDate": "2026-04-20",
  "adults": 1,
  "children": 0,
  "specialRequest": ""
}
```
- **Kỳ vọng**: `400`.

### Case 15: Trùng lịch
- **API**: `POST http://localhost:5066/api/bookings`
- **Header**: `Authorization: Bearer {{token}}`
- **Body**
```json
{
  "roomId": 1,
  "customerId": null,
  "checkInDate": "2026-04-20",
  "checkOutDate": "2026-04-21",
  "adults": 1,
  "children": 0,
  "specialRequest": "Test trung lich"
}
```
- **Kỳ vọng**: `400`.

## 6) Trạng thái đặt phòng

### Case 16: Check-in
- **API**: `PUT http://localhost:5066/api/bookings/1/check-in`
- **Header**: `Authorization: Bearer {{token}}`
- **Kỳ vọng**: `200`.

### Case 17: Check-out
- **API**: `PUT http://localhost:5066/api/bookings/1/check-out`
- **Header**: `Authorization: Bearer {{token}}`
- **Kỳ vọng**: `200`.

### Case 18: Hủy booking không tồn tại
- **API**: `PUT http://localhost:5066/api/bookings/99999/cancel`
- **Header**: `Authorization: Bearer {{token}}`
- **Kỳ vọng**: `404`.

## 7) Hóa đơn

### Case 19: Tạo hóa đơn hợp lệ (booking đã checkout)
- **API**: `POST http://localhost:5066/api/invoices`
- **Header**: `Authorization: Bearer {{token}}`
- **Body**
```json
{
  "bookingId": 1,
  "paymentMethod": "CASH",
  "note": "Thanh toan test"
}
```
- **Kỳ vọng**: `200`.

### Case 20: Booking chưa checkout
- **API**: `POST http://localhost:5066/api/invoices`
- **Header**: `Authorization: Bearer {{token}}`
- **Body**
```json
{
  "bookingId": 2,
  "paymentMethod": "CASH",
  "note": "Booking chua checkout"
}
```
- **Kỳ vọng**: `400`.

