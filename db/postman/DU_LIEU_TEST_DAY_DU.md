# DỮ LIỆU TEST ĐẦY ĐỦ CÁC TRƯỜNG HỢP (API HOTEL)

Base URL:
`http://localhost:5066`

---

## DANH SÁCH ĐƯỜNG LINK API

### Auth
- `POST http://localhost:5066/api/auth/login`

### Rooms
- `GET http://localhost:5066/api/rooms`

### Customers
- `GET http://localhost:5066/api/customers`
- `POST http://localhost:5066/api/customers`

### Bookings
- `GET http://localhost:5066/api/bookings`
- `POST http://localhost:5066/api/bookings`
- `PUT http://localhost:5066/api/bookings/{id}/check-in`
- `PUT http://localhost:5066/api/bookings/{id}/check-out`
- `PUT http://localhost:5066/api/bookings/{id}/cancel`

### Hotel Services
- `GET http://localhost:5066/api/hotelservices`
- `POST http://localhost:5066/api/hotelservices`

### Booking Services
- `POST http://localhost:5066/api/bookingservices`

### Invoices
- `GET http://localhost:5066/api/invoices`
- `POST http://localhost:5066/api/invoices`

---

## 1) AUTH - Đăng nhập

### 1.1 Đăng nhập đúng (Admin)
```json
{
  "username": "admin",
  "password": "123456"
}
```

### 1.2 Đăng nhập đúng (Lễ tân)
```json
{
  "username": "letan",
  "password": "123456"
}
```

### 1.3 Sai mật khẩu
```json
{
  "username": "admin",
  "password": "saimatkhau"
}
```

### 1.4 User không tồn tại
```json
{
  "username": "khong_ton_tai",
  "password": "123456"
}
```

---

## 2) TOKEN TEST

### 2.1 Không token
- Header Authorization: **không gửi**

### 2.2 Token rác
- Header:
`Authorization: Bearer abc.def.ghi`

### 2.3 Token hết hạn (giả lập)
- Dùng token cũ đã quá hạn.

---

## 3) CUSTOMERS - Tạo khách hàng

### 3.1 Hợp lệ
```json
{
  "customerType": "INDIVIDUAL",
  "fullName": "Nguyen Van A",
  "companyName": null,
  "taxCode": null,
  "phone": "0901111111",
  "email": "a@gmail.com",
  "notes": "Khach le"
}
```

### 3.2 Hợp lệ (Công ty)
```json
{
  "customerType": "COMPANY",
  "fullName": "Dai dien Cong ty ABC",
  "companyName": "Cong ty ABC",
  "taxCode": "0312345678",
  "phone": "0902222222",
  "email": "abc@company.com",
  "notes": "Khach doanh nghiep"
}
```

### 3.3 Thiếu `fullName` (lỗi validate)
```json
{
  "customerType": "INDIVIDUAL",
  "phone": "0903333333",
  "email": "test@gmail.com",
  "notes": "Thieu ten"
}
```

### 3.4 Email sai format
```json
{
  "customerType": "INDIVIDUAL",
  "fullName": "Khach Sai Email",
  "phone": "0904444444",
  "email": "email-sai-format",
  "notes": "Sai email"
}
```

---

## 4) BOOKINGS - Tạo đặt phòng

### 4.1 Hợp lệ
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

### 4.2 Hợp lệ có `customerId`
```json
{
  "roomId": 1,
  "customerId": 1,
  "checkInDate": "2026-04-22",
  "checkOutDate": "2026-04-23",
  "adults": 2,
  "children": 1,
  "specialRequest": "Them khan tam"
}
```

### 4.3 Lỗi ngày (checkOut = checkIn)
```json
{
  "roomId": 1,
  "customerId": null,
  "checkInDate": "2026-04-25",
  "checkOutDate": "2026-04-25",
  "adults": 1,
  "children": 0,
  "specialRequest": ""
}
```

### 4.4 Lỗi ngày (checkOut < checkIn)
```json
{
  "roomId": 1,
  "customerId": null,
  "checkInDate": "2026-04-26",
  "checkOutDate": "2026-04-24",
  "adults": 1,
  "children": 0,
  "specialRequest": ""
}
```

### 4.5 Room không tồn tại
```json
{
  "roomId": 9999,
  "customerId": null,
  "checkInDate": "2026-04-27",
  "checkOutDate": "2026-04-28",
  "adults": 1,
  "children": 0,
  "specialRequest": ""
}
```

### 4.6 Customer không tồn tại
```json
{
  "roomId": 1,
  "customerId": 99999,
  "checkInDate": "2026-04-29",
  "checkOutDate": "2026-04-30",
  "adults": 1,
  "children": 0,
  "specialRequest": ""
}
```

### 4.7 Trùng lịch (dùng lại đúng ngày của booking đã tạo trước đó)
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

---

## 5) BOOKING STATUS

### 5.1 Check-in
- Method: `PUT`
- URL: `/api/bookings/{id}/check-in`
- Ví dụ id: `1`

### 5.2 Check-out
- Method: `PUT`
- URL: `/api/bookings/{id}/check-out`
- Ví dụ id: `1`

### 5.3 Cancel
- Method: `PUT`
- URL: `/api/bookings/{id}/cancel`
- Ví dụ id: `1`

### 5.4 ID không tồn tại
- Test với id: `99999`

---

## 6) BOOKING SERVICES - Thêm dịch vụ

### 6.1 Hợp lệ
```json
{
  "stayId": 1,
  "serviceCode": "MINIBAR",
  "description": "Dịch vụ test",
  "quantity": 2,
  "unitPrice": 10000
}
```

### 6.2 Booking không tồn tại
```json
{
  "stayId": 99999,
  "serviceCode": "MINIBAR",
  "quantity": 1
}
```

### 6.3 Service không tồn tại
```json
{
  "stayId": 1,
  "serviceCode": "",
  "description": "Test service code rỗng",
  "quantity": 1,
  "unitPrice": 10000
}
```

### 6.4 Quantity = 0 (lỗi validate)
```json
{
  "stayId": 1,
  "serviceCode": "MINIBAR",
  "quantity": 0,
  "unitPrice": 10000
}
```

---

## 7) INVOICES - Tạo hóa đơn

### 7.1 Hợp lệ (booking đã CHECKED_OUT)
```json
{
  "reservationId": 1,
  "methodCode": "CASH",
  "amountOverride": null,
  "note": "Thanh toán test"
}
```

### 7.2 Booking chưa check-out
```json
{
  "reservationId": 2,
  "methodCode": "BANK_TRANSFER",
  "amountOverride": null,
  "note": "Reservation chưa check-out"
}
```

### 7.3 Booking không tồn tại
```json
{
  "reservationId": 99999,
  "methodCode": "CASH",
  "amountOverride": null,
  "note": "Reservation không tồn tại"
}
```

---

## 8) ROLE TEST NHANH

### 8.1 ADMIN token
- Login bằng `admin/123456`
- Thử:
  - `GET /api/rooms`
  - `POST /api/customers`
  - `POST /api/bookings`

### 8.2 RECEPTION token
- Login bằng `letan/123456`
- Thử:
  - `GET /api/rooms`
  - `POST /api/customers`
  - `POST /api/bookings`

### 8.3 Không token
- Gọi `GET /api/rooms`
- Kỳ vọng: `401`

---

## 9) Header mẫu cho Postman
- Key: `Authorization`
- Value: `Bearer {{token}}`

