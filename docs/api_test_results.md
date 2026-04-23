# Kết quả test API — Hotel Management

- **Thời điểm:** 2026-04-09 01:23:26 UTC
- **Base URL:** `http://localhost:5066`
- **User test:** `admin`
- **Chế độ:** Bật (`API_TEST_EXHAUSTIVE=1`, mặc định): thêm ma trận GET (mọi query), GET 404, POST/PUT lỗi 400/404, 401.

## Điều kiện xóa (xóa mềm — không xóa cứng dòng DB)

### `DELETE /api/hotels/{id}` — Ngưng hoạt động khách sạn
- Khách sạn phải **đang active** (`IsActive = true`); nếu không → **404**.
- **Không được** xóa khi còn **phòng active** hoặc **loại phòng active** thuộc khách sạn đó → **400**  
  (`"Không thể ngưng hoạt động khách sạn khi vẫn còn phòng/loại phòng đang hoạt động."`).
- Thành công: `IsActive = false`.
- Quyền: **ADMIN, RECEPTION**.

### `DELETE /api/roomtypes/{id}` — Ngưng loại phòng
- Loại phòng phải **đang active**; không thấy → **404**.
- **Không được** khi vẫn còn **phòng active** đang gán `roomTypeId` này → **400**  
  (`"Không thể ngưng hoạt động loại phòng khi vẫn còn phòng đang gán loại này."`).
- Thành công: `IsActive = false`.
- Quyền: **ADMIN, RECEPTION**.

### `DELETE /api/rooms/{id}` — Ngưng phòng
- Phòng phải **đang active**; không thấy → **404**.
- Thành công: `IsActive = false`, `StatusCode = OUT_OF_SERVICE`.
- **Không** kiểm tra trùng khách sạn/loại ở bước xóa (chỉ cần phòng còn active).
- Quyền: **ADMIN, RECEPTION**.

### `DELETE /api/customers/{id}` — Xóa mềm khách hàng (CRM)
- Đặt `DeletedAt` (không còn trong danh sách chuẩn).
- Quyền: **ADMIN, RECEPTION**.

### `DELETE /api/guests/{id}` — Xóa mềm khách lưu trú (CCCD/hộ chiếu)
- Đặt `DeletedAt`.
- Quyền: **ADMIN, RECEPTION**.

### `DELETE /api/housekeepingtasks/{id}`
- Xóa mềm (`DeletedAt`).
- Quyền: **ADMIN, MANAGER**.

### `DELETE /api/maintenancetickets/{id}`
- Xóa mềm (`DeletedAt`).
- Quyền: **ADMIN, MANAGER**.

### Thứ tự gợi ý khi “gỡ” cả khách sạn thử nghiệm
1. Xóa / ngưng **phòng** (`DELETE /api/rooms/...`) trước.  
2. Sau đó **loại phòng** (`DELETE /api/roomtypes/...`).  
3. Cuối cùng **khách sạn** (`DELETE /api/hotels/...`).

Script test có thêm: (1) hai request DELETE **mong đợi 400** lên KS/loại phòng đang có con; (2) **chuỗi tạo KS mới → loại phòng → phòng → xóa ngược** để minh họa thành công.

## Context (ID discovery)

```json
{
  "hotelId": 5,
  "roomTypeId": 7,
  "roomId": 1,
  "roomNumberKeep": "301",
  "roomFloorKeep": "3",
  "roomTypeIdFromRoom": 1,
  "customerId": 1,
  "bookingId": 1,
  "bookingConfirmedId": 1,
  "bookingCheckedInId": 1,
  "stayId": 1,
  "invoiceId": 1,
  "paymentId": 3,
  "guestId": 1,
  "taskId": 1,
  "ticketId": 1,
  "hotelServiceId": 1,
  "userId": 1,
  "roleId": 3,
  "serviceOrderId": 1
}
```

## Từng request

### Auth — Login

- **Method:** `POST`
- **URL:** `http://localhost:5066/api/auth/login`
- **HTTP:** `200`
- **Thời gian:** 325 ms

**Response (text / JSON):**

```
{"message": "Tạo dữ liệu thành công.", "data": {"accessToken": "***REDACTED***", "expiresAtUtc": "2026-04-09T03:23:22.9731708Z", "username": "admin", "fullName": "Admin touched by api test", "role": "ADMIN"}}
```

---

### Auth — Me

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/auth/me`
- **HTTP:** `200`
- **Thời gian:** 13 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":{"userId":1,"username":"admin","fullName":"Admin touched by api test","email":null,"phone":null,"role":"ADMIN"}}
```

---

### Auth — Logout

- **Method:** `POST`
- **URL:** `http://localhost:5066/api/auth/logout`
- **HTTP:** `200`
- **Thời gian:** 5 ms

**Response (text / JSON):**

```
{"message":"Đăng xuất thành công. Hãy xóa accessToken ở phía client."}
```

---

### Hotels — List

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/hotels`
- **HTTP:** `200`
- **Thời gian:** 10 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"hotelId":5,"hotelName":"API-Test-1775696090","address":"Test","phone":"0900000000","email":"test1775696090@t.local","isActive":true},{"hotelId":2,"hotelName":"Hotel 2 (api-test touch)","address":"Q1","phone":"0900111222","email":"touch@t.local","isActive":true},{"hotelId":3,"hotelName":"Khách sạn Test Postman","address":"10 Đường ABC, Quận 1, TP.HCM","phone":"0900123456","email":"testpostman@hotel.local","isActive":true},{"hotelId":4,"hotelName":"Khách sạn Test Postman","address":"10 Đường ABC, Quận 1, TP.HCM","phone":"0900123456","email":"testpostman@hotel.local","isActive":true},{"hotelId":1,"hotelName":"Khách sạn Test Postman (đã sửa)","address":"11 Đường ABC, Quận 1, TP.HCM","phone":"0900999888","email":"updated@hotel.local","isActive":true}]}
```

---

### Hotels — ById

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/hotels/5`
- **HTTP:** `200`
- **Thời gian:** 7 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":{"hotelId":5,"hotelName":"API-Test-1775696090","address":"Test","phone":"0900000000","email":"test1775696090@t.local","isActive":true}}
```

---

### Hotels — Create (tên unique)

- **Method:** `POST`
- **URL:** `http://localhost:5066/api/hotels`
- **HTTP:** `400`
- **Thời gian:** 36 ms

**Response (text / JSON):**

```
{"message":"Số điện thoại đã được dùng cho khách sạn khác."}
```

---

### Hotels — Update

- **Method:** `PUT`
- **URL:** `http://localhost:5066/api/hotels/5`
- **HTTP:** `400`
- **Thời gian:** 24 ms

**Response (text / JSON):**

```
{"message":"Số điện thoại đã được dùng cho khách sạn khác."}
```

---

### RoomTypes — List

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/roomtypes`
- **HTTP:** `200`
- **Thời gian:** 13 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"roomTypeId":7,"hotelId":5,"roomTypeName":"RT-Test-1775696771","capacity":2,"baseRate":500000.00,"description":"api test","isActive":true},{"roomTypeId":6,"hotelId":5,"roomTypeName":"RT-Updated-6","capacity":2,"baseRate":550000.00,"description":"updated","isActive":true}]}
```

---

### RoomTypes — ById

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/roomtypes/7`
- **HTTP:** `200`
- **Thời gian:** 14 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":{"roomTypeId":7,"hotelId":5,"roomTypeName":"RT-Test-1775696771","capacity":2,"baseRate":500000.00,"description":"api test","isActive":true}}
```

---

### RoomTypes — Create

- **Method:** `POST`
- **URL:** `http://localhost:5066/api/roomtypes`
- **HTTP:** `200`
- **Thời gian:** 32 ms

**Response (text / JSON):**

```
{"message":"Thêm loại phòng thành công.","data":{"roomTypeId":8,"hotelId":5,"roomTypeName":"RT-Test-1775697803","capacity":2,"baseRate":500000,"description":"api test","isActive":true}}
```

---

### RoomTypes — Update

- **Method:** `PUT`
- **URL:** `http://localhost:5066/api/roomtypes/7`
- **HTTP:** `200`
- **Thời gian:** 27 ms

**Response (text / JSON):**

```
{"message":"Cập nhật loại phòng thành công.","data":{"roomTypeId":7,"hotelId":5,"roomTypeName":"RT-Updated-7","capacity":2,"baseRate":550000,"description":"updated","isActive":true}}
```

---

### Rooms — List

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/rooms`
- **HTTP:** `200`
- **Thời gian:** 7 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"roomId":1,"hotelId":1,"roomTypeId":1,"roomNumber":"301","statusCode":"VACANT","floor":"3","isActive":true,"roomType":null},{"roomId":2,"hotelId":1,"roomTypeId":1,"roomNumber":"302","statusCode":"VACANT","floor":"3","isActive":true,"roomType":null},{"roomId":3,"hotelId":1,"roomTypeId":1,"roomNumber":"303","statusCode":"VACANT","floor":"3","isActive":true,"roomType":null},{"roomId":4,"hotelId":1,"roomTypeId":1,"roomNumber":"305","statusCode":"VACANT","floor":"3","isActive":true,"roomType":null},{"roomId":5,"hotelId":2,"roomTypeId":4,"roomNumber":"T96090","statusCode":"VACANT","floor":"9","isActive":true,"roomType":null},{"roomId":6,"hotelId":5,"roomTypeId":6,"roomNumber":"T96771","statusCode":"VACANT","floor":"9","isActive":true,"roomType":null}]}
```

---

### Rooms — ById

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/rooms/1`
- **HTTP:** `200`
- **Thời gian:** 12 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":{"roomId":1,"hotelId":1,"roomTypeId":1,"roomNumber":"301","statusCode":"VACANT","floor":"3","isActive":true,"roomType":null}}
```

---

### Rooms — Create (số phòng unique)

- **Method:** `POST`
- **URL:** `http://localhost:5066/api/rooms`
- **HTTP:** `200`
- **Thời gian:** 32 ms

**Response (text / JSON):**

```
{"message":"Thêm phòng thành công.","data":{"roomId":7,"hotelId":5,"roomTypeId":7,"roomNumber":"T97803","statusCode":"VACANT","floor":"9","isActive":true,"roomType":null}}
```

---

### Rooms — Update (giữ số phòng hiện tại)

- **Method:** `PUT`
- **URL:** `http://localhost:5066/api/rooms/1`
- **HTTP:** `200`
- **Thời gian:** 16 ms

**Response (text / JSON):**

```
{"message":"Cập nhật phòng thành công.","data":{"roomId":1,"hotelId":1,"roomTypeId":1,"roomNumber":"301","statusCode":"VACANT","floor":"3","isActive":true,"roomType":null}}
```

---

### Customers — List

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/customers`
- **HTTP:** `200`
- **Thời gian:** 21 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[]}
```

---

### Customers — ById

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/customers/1`
- **HTTP:** `404`
- **Thời gian:** 19 ms

**Response (text / JSON):**

```
{"message":"Không tìm thấy khách hàng."}
```

---

### Customers — Loyalty

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/customers/1/loyalty`
- **HTTP:** `404`
- **Thời gian:** 13 ms

**Response (text / JSON):**

```
{"message":"Không tìm thấy khách hàng."}
```

---

### Customers — Loyalty adjust

- **Method:** `POST`
- **URL:** `http://localhost:5066/api/customers/1/loyalty/adjust`
- **HTTP:** `404`
- **Thời gian:** 11 ms

**Response (text / JSON):**

```
{"message":"Không tìm thấy khách hàng."}
```

---

### Customers — Create

- **Method:** `POST`
- **URL:** `http://localhost:5066/api/customers`
- **HTTP:** `200`
- **Thời gian:** 25 ms

**Response (text / JSON):**

```
{"message":"Tạo dữ liệu thành công.","data":{"customerId":4,"customerType":"INDIVIDUAL","fullName":"KhachTest 1775697803","companyName":null,"taxCode":null,"phone":"0900999888","email":null,"notes":null,"loyaltyPoints":0,"loyaltyTier":"BRONZE","deletedAt":null}}
```

---

### Customers — Update

- **Method:** `PUT`
- **URL:** `http://localhost:5066/api/customers/1`
- **HTTP:** `404`
- **Thời gian:** 11 ms

**Response (text / JSON):**

```
{"message":"Không tìm thấy khách hàng."}
```

---

### Guests — List

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/guests`
- **HTTP:** `200`
- **Thời gian:** 17 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[]}
```

---

### Guests — ById

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/guests/1`
- **HTTP:** `404`
- **Thời gian:** 15 ms

**Response (text / JSON):**

```
{"message":"Không tìm thấy khách."}
```

---

### Guests — Create

- **Method:** `POST`
- **URL:** `http://localhost:5066/api/guests`
- **HTTP:** `200`
- **Thời gian:** 18 ms

**Response (text / JSON):**

```
{"message":"Tạo dữ liệu thành công.","data":{"guestId":4,"fullName":"Guest 1775697803","phone":"0912345678","email":null,"idType":null,"idNumber":null,"dateOfBirth":null,"nationality":null,"createdAt":"2026-04-09T01:23:23.7034308Z","updatedAt":"2026-04-09T01:23:23.7034308Z","deletedAt":null}}
```

---

### Guests — Update

- **Method:** `PUT`
- **URL:** `http://localhost:5066/api/guests/1`
- **HTTP:** `404`
- **Thời gian:** 27 ms

**Response (text / JSON):**

```
{"message":"Không tìm thấy khách."}
```

---

### Bookings — List

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/bookings`
- **HTTP:** `200`
- **Thời gian:** 22 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"reservationId":1,"hotelId":1,"roomId":1,"customerId":1,"statusCode":"CHECKED_OUT","checkInDate":"2026-12-01","checkOutDate":"2026-12-03","adults":1,"children":0,"ratePerNight":600000.00,"specialRequest":null,"room":{"roomId":1,"hotelId":1,"roomTypeId":1,"roomNumber":"301","statusCode":"VACANT","floor":"3","isActive":true,"roomType":null},"customer":{"customerId":1,"customerType":"INDIVIDUAL","fullName":"Khach cap nhat API test","companyName":null,"taxCode":null,"phone":"0900888777","email":null,"notes":null,"loyaltyPoints":12,"loyaltyTier":"BRONZE","deletedAt":"2026-04-09T00:54:54"},"stay":null}]}
```

---

### Bookings — ById

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/bookings/1`
- **HTTP:** `200`
- **Thời gian:** 16 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":{"reservationId":1,"hotelId":1,"roomId":1,"customerId":1,"statusCode":"CHECKED_OUT","checkInDate":"2026-12-01","checkOutDate":"2026-12-03","adults":1,"children":0,"ratePerNight":600000.00,"specialRequest":null,"room":{"roomId":1,"hotelId":1,"roomTypeId":1,"roomNumber":"301","statusCode":"VACANT","floor":"3","isActive":true,"roomType":null},"customer":{"customerId":1,"customerType":"INDIVIDUAL","fullName":"Khach cap nhat API test","companyName":null,"taxCode":null,"phone":"0900888777","email":null,"notes":null,"loyaltyPoints":12,"loyaltyTier":"BRONZE","deletedAt":"2026-04-09T00:54:54"},"stay":null}}
```

---

### Bookings — Create

- **Method:** `POST`
- **URL:** `http://localhost:5066/api/bookings`
- **HTTP:** `400`
- **Thời gian:** 16 ms

**Response (text / JSON):**

```
{"message":"Khách hàng không tồn tại hoặc đã bị xóa."}
```

---

### Bookings — Check-in

- **Method:** `PUT`
- **URL:** `http://localhost:5066/api/bookings/1/check-in`
- **HTTP:** `400`
- **Thời gian:** 9 ms

**Response (text / JSON):**

```
{"message":"Chỉ nhận phòng khi đơn đang ở trạng thái CONFIRMED."}
```

---

### Bookings — Check-out

- **Method:** `PUT`
- **URL:** `http://localhost:5066/api/bookings/1/check-out`
- **HTTP:** `400`
- **Thời gian:** 7 ms

**Response (text / JSON):**

```
{"message":"Chỉ trả phòng khi đơn đang ở trạng thái CHECKED_IN."}
```

---

### Stays — List

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/stays`
- **HTTP:** `200`
- **Thời gian:** 41 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"stayId":1,"hotelId":1,"roomId":1,"reservationId":1,"statusCode":"CHECKED_OUT","checkInAt":"2026-04-09T00:54:52","checkOutAt":"2026-04-09T00:54:52","depositAmount":0.00,"notes":null,"createdAt":"2026-04-09T00:54:52","updatedAt":"2026-04-09T00:54:52","booking":{"reservationId":1,"hotelId":1,"roomId":1,"customerId":1,"statusCode":"CHECKED_OUT","checkInDate":"2026-12-01","checkOutDate":"2026-12-03","adults":1,"children":0,"ratePerNight":600000.00,"specialRequest":null,"room":null,"customer":null,"stay":null},"serviceOrders":[]}]}
```

---

### Stays — ById

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/stays/1`
- **HTTP:** `200`
- **Thời gian:** 37 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":{"stayId":1,"hotelId":1,"roomId":1,"reservationId":1,"statusCode":"CHECKED_OUT","checkInAt":"2026-04-09T00:54:52","checkOutAt":"2026-04-09T00:54:52","depositAmount":0.00,"notes":null,"createdAt":"2026-04-09T00:54:52","updatedAt":"2026-04-09T00:54:52","booking":{"reservationId":1,"hotelId":1,"roomId":1,"customerId":1,"statusCode":"CHECKED_OUT","checkInDate":"2026-12-01","checkOutDate":"2026-12-03","adults":1,"children":0,"ratePerNight":600000.00,"specialRequest":null,"room":null,"customer":null,"stay":null},"serviceOrders":[]}}
```

---

### HotelServices — List

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/hotelservices`
- **HTTP:** `200`
- **Thời gian:** 13 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"hotelServiceId":1,"hotelId":1,"serviceCode":"BREAKFAST","serviceName":"Updated svc","defaultUnitPrice":12000.00,"isActive":true,"createdAt":"2026-04-04T15:33:15","updatedAt":"2026-04-09T01:06:12"},{"hotelServiceId":4,"hotelId":1,"serviceCode":"EXTRA_BED","serviceName":"Giuong phu","defaultUnitPrice":200000.00,"isActive":true,"createdAt":"2026-04-04T15:33:15","updatedAt":"2026-04-04T15:33:15"},{"hotelServiceId":3,"hotelId":1,"serviceCode":"LAUNDRY","serviceName":"Giat ui","defaultUnitPrice":60000.00,"isActive":true,"createdAt":"2026-04-04T15:33:15","updatedAt":"2026-04-04T15:33:15"},{"hotelServiceId":2,"hotelId":1,"serviceCode":"MINIBAR","serviceName":"Minibar","defaultUnitPrice":50000.00,"isActive":true,"createdAt":"2026-04-04T15:33:15","updatedAt":"2026-04-04T15:33:15"},{"hotelServiceId":5,"hotelId":1,"serviceCode":"OTHER","serviceName":"Dich vu khac","defaultUnitPrice":0.00,"isActive":true,"createdAt":"2026-04-04T15:33:15","updatedAt":"2026-04-04T15:33:15"},{"hotelServiceId":6,"hotelId":2,"serviceCode":"TST6090","serviceName":"Test service","defaultUnitPrice":10000.00,"isActive":true,"createdAt":"2026-04-09T00:54:52","updatedAt":"2026-04-09T00:54:52"},{"hotelServiceId":7,"hotelId":5,"serviceCode":"TST6156","serviceName":"Test service","defaultUnitPrice":10000.00,"isActive":true,"createdAt":"2026-04-09T00:55:57","updatedAt":"2026-04-09T00:55:57"},{"hotelServiceId":8,"hotelId":5,"serviceCode":"TST6771","serviceName":"Test service","defaultUnitPrice":10000.00,"isActive":true,"createdAt":"2026-04-09T01:06:12","updatedAt":"2026-04-09T01:06:12"}]}
```

---

### HotelServices — ById

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/hotelservices/1`
- **HTTP:** `200`
- **Thời gian:** 25 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":{"hotelServiceId":1,"hotelId":1,"serviceCode":"BREAKFAST","serviceName":"Updated svc","defaultUnitPrice":12000.00,"isActive":true,"createdAt":"2026-04-04T15:33:15","updatedAt":"2026-04-09T01:06:12"}}
```

---

### HotelServices — Create

- **Method:** `POST`
- **URL:** `http://localhost:5066/api/hotelservices`
- **HTTP:** `200`
- **Thời gian:** 37 ms

**Response (text / JSON):**

```
{"message":"Tạo dữ liệu thành công.","data":{"hotelServiceId":9,"hotelId":5,"serviceCode":"TST7803","serviceName":"Test service","defaultUnitPrice":10000,"isActive":true,"createdAt":"2026-04-09T01:23:23.9625817Z","updatedAt":"2026-04-09T01:23:23.9625817Z"}}
```

---

### HotelServices — Update

- **Method:** `PUT`
- **URL:** `http://localhost:5066/api/hotelservices/1`
- **HTTP:** `200`
- **Thời gian:** 27 ms

**Response (text / JSON):**

```
{"message":"Cập nhật dữ liệu thành công.","data":{"hotelServiceId":1,"hotelId":1,"serviceCode":"BREAKFAST","serviceName":"Updated svc","defaultUnitPrice":12000,"isActive":true,"createdAt":"2026-04-04T15:33:15","updatedAt":"2026-04-09T01:23:23.9920006Z"}}
```

---

### ServiceOrders — List

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/serviceorders`
- **HTTP:** `200`
- **Thời gian:** 15 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[]}
```

---

### ServiceOrders — Create

- **Method:** `POST`
- **URL:** `http://localhost:5066/api/serviceorders`
- **HTTP:** `400`
- **Thời gian:** 8 ms

**Response (text / JSON):**

```
{"message":"Không tìm thấy lưu trú đang ở (IN_HOUSE). Chỉ thêm dịch vụ sau khi khách đã check-in."}
```

---

### ServiceOrders — Cancel

- **Method:** `PUT`
- **URL:** `http://localhost:5066/api/serviceorders/1/cancel`
- **HTTP:** `404`
- **Thời gian:** 6 ms

**Response (text / JSON):**

```
{"message":"Không tìm thấy dịch vụ."}
```

---

### Invoices — List

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/invoices`
- **HTTP:** `200`
- **Thời gian:** 17 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"id":1,"bookingId":1,"roomAmount":1200000.00,"serviceAmount":0.00,"totalAmount":1200000.00,"paidAt":"2026-04-09T00:54:53","paymentMethod":"CASH","note":"api test","booking":{"reservationId":1,"hotelId":1,"roomId":1,"customerId":1,"statusCode":"CHECKED_OUT","checkInDate":"2026-12-01","checkOutDate":"2026-12-03","adults":1,"children":0,"ratePerNight":600000.00,"specialRequest":null,"room":null,"customer":null,"stay":null}}]}
```

---

### Invoices — ById

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/invoices/1`
- **HTTP:** `200`
- **Thời gian:** 10 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":{"id":1,"bookingId":1,"roomAmount":1200000.00,"serviceAmount":0.00,"totalAmount":1200000.00,"paidAt":"2026-04-09T00:54:53","paymentMethod":"CASH","note":"api test","booking":{"reservationId":1,"hotelId":1,"roomId":1,"customerId":1,"statusCode":"CHECKED_OUT","checkInDate":"2026-12-01","checkOutDate":"2026-12-03","adults":1,"children":0,"ratePerNight":600000.00,"specialRequest":null,"room":null,"customer":null,"stay":null}}}
```

---

### Invoices — Create

- **Method:** `POST`
- **URL:** `http://localhost:5066/api/invoices`
- **HTTP:** `400`
- **Thời gian:** 13 ms

**Response (text / JSON):**

```
{"message":"Đặt phòng này đã có hóa đơn."}
```

---

### Payments — List

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/payments`
- **HTTP:** `200`
- **Thời gian:** 8 ms

**Response (text / JSON):**

```
{"message":"Lấy danh sách thanh toán thành công.","data":[{"paymentId":3,"stayId":null,"reservationId":1,"paymentType":"CHARGE","methodCode":"CASH","amount":100000.00,"statusCode":"PAID","referenceNo":null,"note":"api test","createdAt":"2026-04-09T01:06:12","updatedAt":"2026-04-09T01:06:12"},{"paymentId":2,"stayId":null,"reservationId":1,"paymentType":"CHARGE","methodCode":"CASH","amount":100000.00,"statusCode":"VOID","referenceNo":null,"note":"api test","createdAt":"2026-04-09T00:55:57","updatedAt":"2026-04-09T01:06:12"},{"paymentId":1,"stayId":null,"reservationId":1,"paymentType":"CHARGE","methodCode":"CASH","amount":100000.00,"statusCode":"VOID","referenceNo":null,"note":"api test","createdAt":"2026-04-09T00:54:53","updatedAt":"2026-04-09T00:54:53"}]}
```

---

### Payments — ById

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/payments/3`
- **HTTP:** `200`
- **Thời gian:** 9 ms

**Response (text / JSON):**

```
{"message":"Lấy chi tiết thanh toán thành công.","data":{"paymentId":3,"stayId":null,"reservationId":1,"paymentType":"CHARGE","methodCode":"CASH","amount":100000.00,"statusCode":"PAID","referenceNo":null,"note":"api test","createdAt":"2026-04-09T01:06:12","updatedAt":"2026-04-09T01:06:12"}}
```

---

### Payments — Create

- **Method:** `POST`
- **URL:** `http://localhost:5066/api/payments`
- **HTTP:** `200`
- **Thời gian:** 37 ms

**Response (text / JSON):**

```
{"message":"Tạo thanh toán thành công.","data":{"paymentId":4,"stayId":null,"reservationId":1,"paymentType":"CHARGE","methodCode":"CASH","amount":100000,"statusCode":"PAID","referenceNo":null,"note":"api test","createdAt":"2026-04-09T01:23:24.1084831Z","updatedAt":"2026-04-09T01:23:24.1084831Z"}}
```

---

### Payments — Void

- **Method:** `PUT`
- **URL:** `http://localhost:5066/api/payments/3/void`
- **HTTP:** `200`
- **Thời gian:** 17 ms

**Response (text / JSON):**

```
{"message":"Hủy giao dịch thành công.","data":{"paymentId":3,"stayId":null,"reservationId":1,"paymentType":"CHARGE","methodCode":"CASH","amount":100000.00,"statusCode":"VOID","referenceNo":null,"note":"api test","createdAt":"2026-04-09T01:06:12","updatedAt":"2026-04-09T01:23:24.1329835Z"}}
```

---

### Housekeeping — List

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/housekeepingtasks`
- **HTTP:** `200`
- **Thời gian:** 13 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[]}
```

---

### Housekeeping — ById

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/housekeepingtasks/1`
- **HTTP:** `404`
- **Thời gian:** 14 ms

**Response (text / JSON):**

```
{"message":"Không tìm thấy công việc buồng phòng."}
```

---

### Housekeeping — Create

- **Method:** `POST`
- **URL:** `http://localhost:5066/api/housekeepingtasks`
- **HTTP:** `200`
- **Thời gian:** 23 ms

**Response (text / JSON):**

```
{"message":"Tạo dữ liệu thành công.","data":{"taskId":4,"roomId":1,"assignedTo":null,"statusCode":"OPEN","note":"api test","createdAt":"2026-04-09T01:23:24.179107Z","updatedAt":"2026-04-09T01:23:24.179107Z","deletedAt":null}}
```

---

### Housekeeping — Update

- **Method:** `PUT`
- **URL:** `http://localhost:5066/api/housekeepingtasks/1`
- **HTTP:** `404`
- **Thời gian:** 35 ms

**Response (text / JSON):**

```
{"message":"Không tìm thấy công việc buồng phòng."}
```

---

### Maintenance — List

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/maintenancetickets`
- **HTTP:** `200`
- **Thời gian:** 12 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[]}
```

---

### Maintenance — ById

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/maintenancetickets/1`
- **HTTP:** `404`
- **Thời gian:** 23 ms

**Response (text / JSON):**

```
{"message":"Không tìm thấy ticket kỹ thuật."}
```

---

### Maintenance — Create

- **Method:** `POST`
- **URL:** `http://localhost:5066/api/maintenancetickets`
- **HTTP:** `200`
- **Thời gian:** 20 ms

**Response (text / JSON):**

```
{"message":"Tạo dữ liệu thành công.","data":{"ticketId":4,"roomId":1,"assignedTo":null,"title":"Ticket 1775697803","description":"api test","statusCode":"OPEN","cancelReason":null,"createdAt":"2026-04-09T01:23:24.277678Z","updatedAt":"2026-04-09T01:23:24.277678Z","deletedAt":null}}
```

---

### Maintenance — Update

- **Method:** `PUT`
- **URL:** `http://localhost:5066/api/maintenancetickets/1`
- **HTTP:** `404`
- **Thời gian:** 8 ms

**Response (text / JSON):**

```
{"message":"Không tìm thấy ticket kỹ thuật."}
```

---

### Reports — Dashboard

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/reports/dashboard`
- **HTTP:** `200`
- **Thời gian:** 63 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":{"period":{"fromUtc":"2026-03-10T01:23:24.3038563Z","toUtc":"2026-04-09T01:23:24.3038638Z"},"rooms":{"totalActive":7,"vacant":7,"occupied":0,"byStatus":[{"status":"VACANT","count":7}]},"bookings":{"byStatus":[{"status":"CHECKED_OUT","count":1}]},"invoices":{"count":1,"revenueTotal":1200000.00},"topServices":[]}}
```

---

### AuditLogs — List

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/auditlogs`
- **HTTP:** `200`
- **Thời gian:** 14 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"auditId":451,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/reports/dashboard","reason":"GET 200 49ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/reports/dashboard\",\"query\":\"\",\"statusCode\":200,\"elapsedMs\":49,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:24"},{"auditId":450,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/maintenancetickets/1","reason":"PUT 404 4ms","beforeJson":null,"afterJson":"{\"method\":\"PUT\",\"path\":\"/api/maintenancetickets/1\",\"query\":\"\",\"statusCode\":404,\"elapsedMs\":4,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:24"},{"auditId":449,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/maintenancetickets","reason":"POST 200 14ms","beforeJson":null,"afterJson":"{\"method\":\"POST\",\"path\":\"/api/maintenancetickets\",\"query\":\"\",\"statusCode\":200,\"elapsedMs\":14,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:24"},{"auditId":448,"actorUserId":1,"action":"MAINTENANCE_CREATE","entityName":"MaintenanceTicket","entityId":"4","reason":null,"beforeJson":null,"afterJson":"{\"TicketId\":4,\"RoomId\":1,\"AssignedTo\":null,\"Title\":\"Ticket 1775697803\",\"Description\":\"api test\",\"StatusCode\":\"OPEN\",\"CancelReason\":null,\"CreatedAt\":\"2026-04-09T01:23:24.277678Z\",\"UpdatedAt\":\"2026-04-09T01:23:24.277678Z\",\"DeletedAt\":null}","createdAt":"2026-04-09T08:23:24"},{"auditId":447,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/maintenancetickets/1","reason":"GET 404 4ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/maintenancetickets/1\",\"query\":\"\",\"statusCode\":404,\"elapsedMs\":4,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:24"},{"auditId":446,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/maintenancetickets","reason":"GET 200 5ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/maintenancetickets\",\"query\":\"\",\"statusCode\":200,\"elapsedMs\":5,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:24"},{"auditId":445,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/housekeepingtasks/1","reason":"PUT 404 5ms","beforeJson":null,"afterJson":"{\"method\":\"PUT\",\"path\":\"/api/housekeepingtasks/1\",\"query\":\"\",\"statusCode\":404,\"elapsedMs\":5,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:24"},{"auditId":444,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/housekeepingtasks","reason":"POST 200 16ms","beforeJson":null,"afterJson":"{\"method\":\"POST\",\"path\":\"/api/housekeepingtasks\",\"query\":\"\",\"statusCode\":200,\"elapsedMs\":16,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:24"},{"auditId":443,"actorUserId":1,"action":"HOUSEKEEPING_CREATE","entityName":"HousekeepingTask","entityId":"4","reason":null,"beforeJson":null,"afterJson":"{\"TaskId\":4,\"RoomId\":1,\"AssignedTo\":null,\"StatusCode\":\"OPEN\",\"Note\":\"api test\",\"CreatedAt\":\"2026-04-09T01:23:24.179107Z\",\"UpdatedAt\":\"2026-04-09T01:23:24.179107Z\",\"DeletedAt\":null}","createdAt":"2026-04-09T08:23:24"},{"auditId":442,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/housekeepingtasks/1","reason":"GET 404 6ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/housekeepingtasks/1\",\"query\":\"\",\"statusCode\":404,\"elapsedMs\":6,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:24"},{"auditId":441,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/housekeepingtasks","reason":"GET 200 5ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/housekeepingtasks\",\"query\":\"\",\"statusCode\":200,\"elapsedMs\":5,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:24"},{"auditId":440,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/payments/3/void","reason":"PUT 200 13ms","beforeJson":null,"afterJson":"{\"method\":\"PUT\",\"path\":\"/api/payments/3/void\",\"query\":\"\",\"statusCode\":200,\"elapsedMs\":13,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:24"},{"auditId":439,"actorUserId":1,"action":"PAYMENT_VOID","entityName":"Payment","entityId":"3","reason":null,"beforeJson":"{\"StatusCode\":\"PAID\"}","afterJson":"{\"StatusCode\":\"VOID\"}","createdAt":"2026-04-09T08:23:24"},{"auditId":438,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/payments","reason":"POST 200 18ms","beforeJson":null,"afterJson":"{\"method\":\"POST\",\"path\":\"/api/payments\",\"query\":\"\",\"statusCode\":200,\"elapsedMs\":18,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:24"},{"auditId":437,"actorUserId":1,"action":"PAYMENT_CREATE","entityName":"Payment","entityId":"4","reason":null,"beforeJson":null,"afterJson":"{\"StayId\":null,\"ReservationId\":1,\"PaymentType\":\"CHARGE\",\"MethodCode\":\"CASH\",\"Amount\":100000}","createdAt":"2026-04-09T08:23:24"},{"auditId":436,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/payments/3","reason":"GET 200 4ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/payments/3\",\"query\":\"\",\"statusCode\":200,\"elapsedMs\":4,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:24"},{"auditId":435,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/payments","reason":"GET 200 3ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/payments\",\"query\":\"\",\"statusCode\":200,\"elapsedMs\":3,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:24"},{"auditId":434,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/invoices","reason":"POST 400 9ms","beforeJson":null,"afterJson":"{\"method\":\"POST\",\"path\":\"/api/invoices\",\"query\":\"\",\"statusCode\":400,\"elapsedMs\":9,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:24"},{"auditId":433,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/invoices/1","reason":"GET 200 6ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/invoices/1\",\"query\":\"\",\"statusCode\":200,\"elapsedMs\":6,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:24"},{"auditId":432,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/invoices","reason":"GET 200 6ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/invoices\",\"query\":\"\",\"statusCode\":200,\"elapsedMs\":6,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:24"}]}
```

---

### Users — List

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/users`
- **HTTP:** `200`
- **Thời gian:** 14 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"userId":1,"username":"admin","fullName":"Admin touched by api test","email":null,"phone":null,"isActive":true,"roleCode":"ADMIN","roleName":"Quản trị hệ thống"},{"userId":3,"username":"apitest96090","fullName":"Api Test User","email":null,"phone":null,"isActive":true,"roleCode":"RECEPTION","roleName":"Lễ tân"},{"userId":4,"username":"apitest96156","fullName":"Api Test User","email":null,"phone":null,"isActive":true,"roleCode":"RECEPTION","roleName":"Lễ tân"},{"userId":5,"username":"apitest96771","fullName":"Api Test User","email":null,"phone":null,"isActive":true,"roleCode":"RECEPTION","roleName":"Lễ tân"},{"userId":2,"username":"letan","fullName":"Lễ tân","email":null,"phone":null,"isActive":true,"roleCode":"RECEPTION","roleName":"Lễ tân"}]}
```

---

### Users — Create

- **Method:** `POST`
- **URL:** `http://localhost:5066/api/users`
- **HTTP:** `200`
- **Thời gian:** 26 ms

**Response (text / JSON):**

```
{"message":"Tạo tài khoản thành công.","data":{"userId":6,"username":"apitest97803","fullName":"Api Test User","email":null,"phone":null,"isActive":true,"roleCode":"RECEPTION","roleName":"Lễ tân"}}
```

---

### Users — Update

- **Method:** `PUT`
- **URL:** `http://localhost:5066/api/users/1`
- **HTTP:** `200`
- **Thời gian:** 15 ms

**Response (text / JSON):**

```
{"message":"Cập nhật thông tin tài khoản thành công.","data":{"userId":1,"username":"admin","fullName":"Admin touched by api test","email":null,"phone":null,"isActive":true}}
```

---

### Users — Status

- **Method:** `PUT`
- **URL:** `http://localhost:5066/api/users/1/status`
- **HTTP:** `200`
- **Thời gian:** 10 ms

**Response (text / JSON):**

```
{"message":"Cập nhật trạng thái tài khoản thành công."}
```

---

### Roles — List

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/roles`
- **HTTP:** `200`
- **Thời gian:** 6 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"roleId":3,"roleCode":"ACCOUNTANT","roleName":"Kế toán/Thu ngân","isActive":true},{"roleId":1,"roleCode":"ADMIN","roleName":"Quản trị hệ thống","isActive":true},{"roleId":4,"roleCode":"HOUSEKEEPING","roleName":"Buồng phòng","isActive":true},{"roleId":5,"roleCode":"MAINTENANCE","roleName":"Kỹ thuật","isActive":true},{"roleId":6,"roleCode":"MANAGER","roleName":"Quản lý","isActive":true},{"roleId":2,"roleCode":"RECEPTION","roleName":"Lễ tân","isActive":true},{"roleId":7,"roleCode":"RT96090","roleName":"Role test","isActive":true},{"roleId":8,"roleCode":"RT96156","roleName":"Role test","isActive":true},{"roleId":9,"roleCode":"RT96771","roleName":"Role test","isActive":true}]}
```

---

### Roles — Create

- **Method:** `POST`
- **URL:** `http://localhost:5066/api/roles`
- **HTTP:** `200`
- **Thời gian:** 9 ms

**Response (text / JSON):**

```
{"message":"Tạo dữ liệu thành công.","data":{"roleId":10,"roleCode":"RT97803","roleName":"Role test","isActive":true}}
```

---

### Roles — Update

- **Method:** `PUT`
- **URL:** `http://localhost:5066/api/roles/3`
- **HTTP:** `200`
- **Thời gian:** 6 ms

**Response (text / JSON):**

```
{"message":"Cập nhật dữ liệu thành công.","data":{"roleId":3,"roleCode":"ACCOUNTANT","roleName":"Kế toán/Thu ngân","isActive":true}}
```

---

### Matrix — 401 GET /api/hotels (không token)

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/hotels`
- **HTTP:** `401`
- **Thời gian:** 25 ms

**Response (text / JSON):**

```
(empty)
```

---

### Matrix — 401 GET /api/auth/me (không token)

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/auth/me`
- **HTTP:** `401`
- **Thời gian:** 2 ms

**Response (text / JSON):**

```
(empty)
```

---

### Matrix — 401 POST /api/auth/login (sai mật khẩu)

- **Method:** `POST`
- **URL:** `http://localhost:5066/api/auth/login`
- **HTTP:** `401`
- **Thời gian:** 6 ms

**Response (text / JSON):**

```
{"message":"Ten dang nhap hoac mat khau khong dung."}
```

---

### Matrix GET /api/rooms — không query

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/rooms`
- **HTTP:** `200`
- **Thời gian:** 8 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"roomId":1,"hotelId":1,"roomTypeId":1,"roomNumber":"301","statusCode":"VACANT","floor":"3","isActive":true,"roomType":null},{"roomId":2,"hotelId":1,"roomTypeId":1,"roomNumber":"302","statusCode":"VACANT","floor":"3","isActive":true,"roomType":null},{"roomId":3,"hotelId":1,"roomTypeId":1,"roomNumber":"303","statusCode":"VACANT","floor":"3","isActive":true,"roomType":null},{"roomId":4,"hotelId":1,"roomTypeId":1,"roomNumber":"305","statusCode":"VACANT","floor":"3","isActive":true,"roomType":null},{"roomId":5,"hotelId":2,"roomTypeId":4,"roomNumber":"T96090","statusCode":"VACANT","floor":"9","isActive":true,"roomType":null},{"roomId":6,"hotelId":5,"roomTypeId":6,"roomNumber":"T96771","statusCode":"VACANT","floor":"9","isActive":true,"roomType":null},{"roomId":7,"hotelId":5,"roomTypeId":7,"roomNumber":"T97803","statusCode":"VACANT","floor":"9","isActive":true,"roomType":null}]}
```

---

### Matrix GET /api/rooms — roomNumber

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/rooms`
- **HTTP:** `200`
- **Thời gian:** 53 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"roomId":1,"hotelId":1,"roomTypeId":1,"roomNumber":"301","statusCode":"VACANT","floor":"3","isActive":true,"roomType":null},{"roomId":2,"hotelId":1,"roomTypeId":1,"roomNumber":"302","statusCode":"VACANT","floor":"3","isActive":true,"roomType":null},{"roomId":3,"hotelId":1,"roomTypeId":1,"roomNumber":"303","statusCode":"VACANT","floor":"3","isActive":true,"roomType":null},{"roomId":4,"hotelId":1,"roomTypeId":1,"roomNumber":"305","statusCode":"VACANT","floor":"3","isActive":true,"roomType":null},{"roomId":7,"hotelId":5,"roomTypeId":7,"roomNumber":"T97803","statusCode":"VACANT","floor":"9","isActive":true,"roomType":null}]}
```

---

### Matrix GET /api/rooms — statusCode=VACANT

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/rooms`
- **HTTP:** `200`
- **Thời gian:** 17 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"roomId":1,"hotelId":1,"roomTypeId":1,"roomNumber":"301","statusCode":"VACANT","floor":"3","isActive":true,"roomType":null},{"roomId":2,"hotelId":1,"roomTypeId":1,"roomNumber":"302","statusCode":"VACANT","floor":"3","isActive":true,"roomType":null},{"roomId":3,"hotelId":1,"roomTypeId":1,"roomNumber":"303","statusCode":"VACANT","floor":"3","isActive":true,"roomType":null},{"roomId":4,"hotelId":1,"roomTypeId":1,"roomNumber":"305","statusCode":"VACANT","floor":"3","isActive":true,"roomType":null},{"roomId":5,"hotelId":2,"roomTypeId":4,"roomNumber":"T96090","statusCode":"VACANT","floor":"9","isActive":true,"roomType":null},{"roomId":6,"hotelId":5,"roomTypeId":6,"roomNumber":"T96771","statusCode":"VACANT","floor":"9","isActive":true,"roomType":null},{"roomId":7,"hotelId":5,"roomTypeId":7,"roomNumber":"T97803","statusCode":"VACANT","floor":"9","isActive":true,"roomType":null}]}
```

---

### Matrix GET /api/rooms — roomTypeId

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/rooms`
- **HTTP:** `200`
- **Thời gian:** 19 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"roomId":7,"hotelId":5,"roomTypeId":7,"roomNumber":"T97803","statusCode":"VACANT","floor":"9","isActive":true,"roomType":null}]}
```

---

### Matrix GET /api/rooms — roomTypeId + statusCode

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/rooms`
- **HTTP:** `200`
- **Thời gian:** 27 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"roomId":7,"hotelId":5,"roomTypeId":7,"roomNumber":"T97803","statusCode":"VACANT","floor":"9","isActive":true,"roomType":null}]}
```

---

### Matrix GET /api/roomtypes — hotelId

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/roomtypes`
- **HTTP:** `200`
- **Thời gian:** 18 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"roomTypeId":8,"hotelId":5,"roomTypeName":"RT-Test-1775697803","capacity":2,"baseRate":500000.00,"description":"api test","isActive":true},{"roomTypeId":6,"hotelId":5,"roomTypeName":"RT-Updated-6","capacity":2,"baseRate":550000.00,"description":"updated","isActive":true},{"roomTypeId":7,"hotelId":5,"roomTypeName":"RT-Updated-7","capacity":2,"baseRate":550000.00,"description":"updated","isActive":true}]}
```

---

### Matrix GET /api/roomtypes — hotelId không tồn tại

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/roomtypes`
- **HTTP:** `200`
- **Thời gian:** 11 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[]}
```

---

### Matrix GET /api/customers — search

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/customers`
- **HTTP:** `200`
- **Thời gian:** 42 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[]}
```

---

### Matrix GET /api/guests — search

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/guests`
- **HTTP:** `200`
- **Thời gian:** 25 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[]}
```

---

### Matrix GET /api/guests — idNumber

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/guests`
- **HTTP:** `200`
- **Thời gian:** 26 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[]}
```

---

### Matrix GET /api/bookings — hotelId

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/bookings`
- **HTTP:** `200`
- **Thời gian:** 33 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[]}
```

---

### Matrix GET /api/bookings — roomId

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/bookings`
- **HTTP:** `200`
- **Thời gian:** 26 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"reservationId":1,"hotelId":1,"roomId":1,"customerId":1,"statusCode":"CHECKED_OUT","checkInDate":"2026-12-01","checkOutDate":"2026-12-03","adults":1,"children":0,"ratePerNight":600000.00,"specialRequest":null,"room":{"roomId":1,"hotelId":1,"roomTypeId":1,"roomNumber":"301","statusCode":"VACANT","floor":"3","isActive":true,"roomType":null},"customer":{"customerId":1,"customerType":"INDIVIDUAL","fullName":"Khach cap nhat API test","companyName":null,"taxCode":null,"phone":"0900888777","email":null,"notes":null,"loyaltyPoints":12,"loyaltyTier":"BRONZE","deletedAt":"2026-04-09T00:54:54"},"stay":null}]}
```

---

### Matrix GET /api/bookings — customerId

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/bookings`
- **HTTP:** `200`
- **Thời gian:** 47 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"reservationId":1,"hotelId":1,"roomId":1,"customerId":1,"statusCode":"CHECKED_OUT","checkInDate":"2026-12-01","checkOutDate":"2026-12-03","adults":1,"children":0,"ratePerNight":600000.00,"specialRequest":null,"room":{"roomId":1,"hotelId":1,"roomTypeId":1,"roomNumber":"301","statusCode":"VACANT","floor":"3","isActive":true,"roomType":null},"customer":{"customerId":1,"customerType":"INDIVIDUAL","fullName":"Khach cap nhat API test","companyName":null,"taxCode":null,"phone":"0900888777","email":null,"notes":null,"loyaltyPoints":12,"loyaltyTier":"BRONZE","deletedAt":"2026-04-09T00:54:54"},"stay":null}]}
```

---

### Matrix GET /api/bookings — statusCode=CONFIRMED

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/bookings`
- **HTTP:** `200`
- **Thời gian:** 21 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[]}
```

---

### Matrix GET /api/bookings — checkInFrom/checkOutTo

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/bookings`
- **HTTP:** `200`
- **Thời gian:** 35 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"reservationId":1,"hotelId":1,"roomId":1,"customerId":1,"statusCode":"CHECKED_OUT","checkInDate":"2026-12-01","checkOutDate":"2026-12-03","adults":1,"children":0,"ratePerNight":600000.00,"specialRequest":null,"room":{"roomId":1,"hotelId":1,"roomTypeId":1,"roomNumber":"301","statusCode":"VACANT","floor":"3","isActive":true,"roomType":null},"customer":{"customerId":1,"customerType":"INDIVIDUAL","fullName":"Khach cap nhat API test","companyName":null,"taxCode":null,"phone":"0900888777","email":null,"notes":null,"loyaltyPoints":12,"loyaltyTier":"BRONZE","deletedAt":"2026-04-09T00:54:54"},"stay":null}]}
```

---

### Matrix GET /api/bookings — checkInFrom+checkInTo

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/bookings`
- **HTTP:** `200`
- **Thời gian:** 41 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"reservationId":1,"hotelId":1,"roomId":1,"customerId":1,"statusCode":"CHECKED_OUT","checkInDate":"2026-12-01","checkOutDate":"2026-12-03","adults":1,"children":0,"ratePerNight":600000.00,"specialRequest":null,"room":{"roomId":1,"hotelId":1,"roomTypeId":1,"roomNumber":"301","statusCode":"VACANT","floor":"3","isActive":true,"roomType":null},"customer":{"customerId":1,"customerType":"INDIVIDUAL","fullName":"Khach cap nhat API test","companyName":null,"taxCode":null,"phone":"0900888777","email":null,"notes":null,"loyaltyPoints":12,"loyaltyTier":"BRONZE","deletedAt":"2026-04-09T00:54:54"},"stay":null}]}
```

---

### Matrix GET /api/bookings — checkOutFrom+checkOutTo

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/bookings`
- **HTTP:** `200`
- **Thời gian:** 30 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"reservationId":1,"hotelId":1,"roomId":1,"customerId":1,"statusCode":"CHECKED_OUT","checkInDate":"2026-12-01","checkOutDate":"2026-12-03","adults":1,"children":0,"ratePerNight":600000.00,"specialRequest":null,"room":{"roomId":1,"hotelId":1,"roomTypeId":1,"roomNumber":"301","statusCode":"VACANT","floor":"3","isActive":true,"roomType":null},"customer":{"customerId":1,"customerType":"INDIVIDUAL","fullName":"Khach cap nhat API test","companyName":null,"taxCode":null,"phone":"0900888777","email":null,"notes":null,"loyaltyPoints":12,"loyaltyTier":"BRONZE","deletedAt":"2026-04-09T00:54:54"},"stay":null}]}
```

---

### Matrix GET /api/stays — reservationId

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/stays`
- **HTTP:** `200`
- **Thời gian:** 51 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"stayId":1,"hotelId":1,"roomId":1,"reservationId":1,"statusCode":"CHECKED_OUT","checkInAt":"2026-04-09T00:54:52","checkOutAt":"2026-04-09T00:54:52","depositAmount":0.00,"notes":null,"createdAt":"2026-04-09T00:54:52","updatedAt":"2026-04-09T00:54:52","booking":{"reservationId":1,"hotelId":1,"roomId":1,"customerId":1,"statusCode":"CHECKED_OUT","checkInDate":"2026-12-01","checkOutDate":"2026-12-03","adults":1,"children":0,"ratePerNight":600000.00,"specialRequest":null,"room":null,"customer":null,"stay":null},"serviceOrders":[]}]}
```

---

### Matrix GET /api/stays — roomId

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/stays`
- **HTTP:** `200`
- **Thời gian:** 41 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"stayId":1,"hotelId":1,"roomId":1,"reservationId":1,"statusCode":"CHECKED_OUT","checkInAt":"2026-04-09T00:54:52","checkOutAt":"2026-04-09T00:54:52","depositAmount":0.00,"notes":null,"createdAt":"2026-04-09T00:54:52","updatedAt":"2026-04-09T00:54:52","booking":{"reservationId":1,"hotelId":1,"roomId":1,"customerId":1,"statusCode":"CHECKED_OUT","checkInDate":"2026-12-01","checkOutDate":"2026-12-03","adults":1,"children":0,"ratePerNight":600000.00,"specialRequest":null,"room":null,"customer":null,"stay":null},"serviceOrders":[]}]}
```

---

### Matrix GET /api/stays — hotelId

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/stays`
- **HTTP:** `200`
- **Thời gian:** 32 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[]}
```

---

### Matrix GET /api/stays — statusCode=IN_HOUSE

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/stays`
- **HTTP:** `200`
- **Thời gian:** 30 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[]}
```

---

### Matrix GET /api/stays — reservationId + statusCode

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/stays`
- **HTTP:** `200`
- **Thời gian:** 31 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[]}
```

---

### Matrix GET /api/serviceorders — không query

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/serviceorders`
- **HTTP:** `200`
- **Thời gian:** 20 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[]}
```

---

### Matrix GET /api/serviceorders — stayId

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/serviceorders`
- **HTTP:** `200`
- **Thời gian:** 26 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[]}
```

---

### Matrix GET /api/serviceorders — reservationId

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/serviceorders`
- **HTTP:** `200`
- **Thời gian:** 38 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[]}
```

---

### Matrix GET /api/serviceorders — stayId + reservationId

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/serviceorders`
- **HTTP:** `200`
- **Thời gian:** 26 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[]}
```

---

### Matrix GET /api/payments — không query

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/payments`
- **HTTP:** `200`
- **Thời gian:** 6 ms

**Response (text / JSON):**

```
{"message":"Lấy danh sách thanh toán thành công.","data":[{"paymentId":4,"stayId":null,"reservationId":1,"paymentType":"CHARGE","methodCode":"CASH","amount":100000.00,"statusCode":"PAID","referenceNo":null,"note":"api test","createdAt":"2026-04-09T01:23:24","updatedAt":"2026-04-09T01:23:24"},{"paymentId":3,"stayId":null,"reservationId":1,"paymentType":"CHARGE","methodCode":"CASH","amount":100000.00,"statusCode":"VOID","referenceNo":null,"note":"api test","createdAt":"2026-04-09T01:06:12","updatedAt":"2026-04-09T01:23:24"},{"paymentId":2,"stayId":null,"reservationId":1,"paymentType":"CHARGE","methodCode":"CASH","amount":100000.00,"statusCode":"VOID","referenceNo":null,"note":"api test","createdAt":"2026-04-09T00:55:57","updatedAt":"2026-04-09T01:06:12"},{"paymentId":1,"stayId":null,"reservationId":1,"paymentType":"CHARGE","methodCode":"CASH","amount":100000.00,"statusCode":"VOID","referenceNo":null,"note":"api test","createdAt":"2026-04-09T00:54:53","updatedAt":"2026-04-09T00:54:53"}]}
```

---

### Matrix GET /api/payments — stayId

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/payments`
- **HTTP:** `200`
- **Thời gian:** 42 ms

**Response (text / JSON):**

```
{"message":"Lấy danh sách thanh toán thành công.","data":[]}
```

---

### Matrix GET /api/payments — reservationId

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/payments`
- **HTTP:** `200`
- **Thời gian:** 18 ms

**Response (text / JSON):**

```
{"message":"Lấy danh sách thanh toán thành công.","data":[{"paymentId":4,"stayId":null,"reservationId":1,"paymentType":"CHARGE","methodCode":"CASH","amount":100000.00,"statusCode":"PAID","referenceNo":null,"note":"api test","createdAt":"2026-04-09T01:23:24","updatedAt":"2026-04-09T01:23:24"},{"paymentId":3,"stayId":null,"reservationId":1,"paymentType":"CHARGE","methodCode":"CASH","amount":100000.00,"statusCode":"VOID","referenceNo":null,"note":"api test","createdAt":"2026-04-09T01:06:12","updatedAt":"2026-04-09T01:23:24"},{"paymentId":2,"stayId":null,"reservationId":1,"paymentType":"CHARGE","methodCode":"CASH","amount":100000.00,"statusCode":"VOID","referenceNo":null,"note":"api test","createdAt":"2026-04-09T00:55:57","updatedAt":"2026-04-09T01:06:12"},{"paymentId":1,"stayId":null,"reservationId":1,"paymentType":"CHARGE","methodCode":"CASH","amount":100000.00,"statusCode":"VOID","referenceNo":null,"note":"api test","createdAt":"2026-04-09T00:54:53","updatedAt":"2026-04-09T00:54:53"}]}
```

---

### Matrix GET /api/payments — statusCode=PAID

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/payments`
- **HTTP:** `200`
- **Thời gian:** 18 ms

**Response (text / JSON):**

```
{"message":"Lấy danh sách thanh toán thành công.","data":[{"paymentId":4,"stayId":null,"reservationId":1,"paymentType":"CHARGE","methodCode":"CASH","amount":100000.00,"statusCode":"PAID","referenceNo":null,"note":"api test","createdAt":"2026-04-09T01:23:24","updatedAt":"2026-04-09T01:23:24"}]}
```

---

### Matrix GET /api/payments — reservationId + statusCode

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/payments`
- **HTTP:** `200`
- **Thời gian:** 17 ms

**Response (text / JSON):**

```
{"message":"Lấy danh sách thanh toán thành công.","data":[{"paymentId":4,"stayId":null,"reservationId":1,"paymentType":"CHARGE","methodCode":"CASH","amount":100000.00,"statusCode":"PAID","referenceNo":null,"note":"api test","createdAt":"2026-04-09T01:23:24","updatedAt":"2026-04-09T01:23:24"}]}
```

---

### Matrix GET /api/housekeepingtasks — không query

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/housekeepingtasks`
- **HTTP:** `200`
- **Thời gian:** 32 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"taskId":4,"roomId":1,"assignedTo":null,"statusCode":"OPEN","note":"api test","createdAt":"2026-04-09T01:23:24","updatedAt":"2026-04-09T01:23:24","deletedAt":null}]}
```

---

### Matrix GET /api/housekeepingtasks — roomId

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/housekeepingtasks`
- **HTTP:** `200`
- **Thời gian:** 14 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"taskId":4,"roomId":1,"assignedTo":null,"statusCode":"OPEN","note":"api test","createdAt":"2026-04-09T01:23:24","updatedAt":"2026-04-09T01:23:24","deletedAt":null}]}
```

---

### Matrix GET /api/housekeepingtasks — statusCode=OPEN

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/housekeepingtasks`
- **HTTP:** `200`
- **Thời gian:** 14 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"taskId":4,"roomId":1,"assignedTo":null,"statusCode":"OPEN","note":"api test","createdAt":"2026-04-09T01:23:24","updatedAt":"2026-04-09T01:23:24","deletedAt":null}]}
```

---

### Matrix GET /api/housekeepingtasks — roomId + statusCode

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/housekeepingtasks`
- **HTTP:** `200`
- **Thời gian:** 20 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"taskId":4,"roomId":1,"assignedTo":null,"statusCode":"OPEN","note":"api test","createdAt":"2026-04-09T01:23:24","updatedAt":"2026-04-09T01:23:24","deletedAt":null}]}
```

---

### Matrix GET /api/housekeepingtasks — assignedTo

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/housekeepingtasks`
- **HTTP:** `200`
- **Thời gian:** 19 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[]}
```

---

### Matrix GET /api/maintenancetickets — không query

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/maintenancetickets`
- **HTTP:** `200`
- **Thời gian:** 27 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"ticketId":4,"roomId":1,"assignedTo":null,"title":"Ticket 1775697803","description":"api test","statusCode":"OPEN","cancelReason":null,"createdAt":"2026-04-09T01:23:24","updatedAt":"2026-04-09T01:23:24","deletedAt":null}]}
```

---

### Matrix GET /api/maintenancetickets — roomId

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/maintenancetickets`
- **HTTP:** `200`
- **Thời gian:** 33 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"ticketId":4,"roomId":1,"assignedTo":null,"title":"Ticket 1775697803","description":"api test","statusCode":"OPEN","cancelReason":null,"createdAt":"2026-04-09T01:23:24","updatedAt":"2026-04-09T01:23:24","deletedAt":null}]}
```

---

### Matrix GET /api/maintenancetickets — statusCode=OPEN

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/maintenancetickets`
- **HTTP:** `200`
- **Thời gian:** 41 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"ticketId":4,"roomId":1,"assignedTo":null,"title":"Ticket 1775697803","description":"api test","statusCode":"OPEN","cancelReason":null,"createdAt":"2026-04-09T01:23:24","updatedAt":"2026-04-09T01:23:24","deletedAt":null}]}
```

---

### Matrix GET /api/maintenancetickets — assignedTo

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/maintenancetickets`
- **HTTP:** `200`
- **Thời gian:** 21 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[]}
```

---

### Matrix GET /api/hotelservices — không query

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/hotelservices`
- **HTTP:** `200`
- **Thời gian:** 20 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"hotelServiceId":1,"hotelId":1,"serviceCode":"BREAKFAST","serviceName":"Updated svc","defaultUnitPrice":12000.00,"isActive":true,"createdAt":"2026-04-04T15:33:15","updatedAt":"2026-04-09T01:23:24"},{"hotelServiceId":4,"hotelId":1,"serviceCode":"EXTRA_BED","serviceName":"Giuong phu","defaultUnitPrice":200000.00,"isActive":true,"createdAt":"2026-04-04T15:33:15","updatedAt":"2026-04-04T15:33:15"},{"hotelServiceId":3,"hotelId":1,"serviceCode":"LAUNDRY","serviceName":"Giat ui","defaultUnitPrice":60000.00,"isActive":true,"createdAt":"2026-04-04T15:33:15","updatedAt":"2026-04-04T15:33:15"},{"hotelServiceId":2,"hotelId":1,"serviceCode":"MINIBAR","serviceName":"Minibar","defaultUnitPrice":50000.00,"isActive":true,"createdAt":"2026-04-04T15:33:15","updatedAt":"2026-04-04T15:33:15"},{"hotelServiceId":5,"hotelId":1,"serviceCode":"OTHER","serviceName":"Dich vu khac","defaultUnitPrice":0.00,"isActive":true,"createdAt":"2026-04-04T15:33:15","updatedAt":"2026-04-04T15:33:15"},{"hotelServiceId":6,"hotelId":2,"serviceCode":"TST6090","serviceName":"Test service","defaultUnitPrice":10000.00,"isActive":true,"createdAt":"2026-04-09T00:54:52","updatedAt":"2026-04-09T00:54:52"},{"hotelServiceId":7,"hotelId":5,"serviceCode":"TST6156","serviceName":"Test service","defaultUnitPrice":10000.00,"isActive":true,"createdAt":"2026-04-09T00:55:57","updatedAt":"2026-04-09T00:55:57"},{"hotelServiceId":8,"hotelId":5,"serviceCode":"TST6771","serviceName":"Test service","defaultUnitPrice":10000.00,"isActive":true,"createdAt":"2026-04-09T01:06:12","updatedAt":"2026-04-09T01:06:12"},{"hotelServiceId":9,"hotelId":5,"serviceCode":"TST7803","serviceName":"Test service","defaultUnitPrice":10000.00,"isActive":true,"createdAt":"2026-04-09T01:23:24","updatedAt":"2026-04-09T01:23:24"}]}
```

---

### Matrix GET /api/hotelservices — hotelId

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/hotelservices`
- **HTTP:** `200`
- **Thời gian:** 34 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"hotelServiceId":7,"hotelId":5,"serviceCode":"TST6156","serviceName":"Test service","defaultUnitPrice":10000.00,"isActive":true,"createdAt":"2026-04-09T00:55:57","updatedAt":"2026-04-09T00:55:57"},{"hotelServiceId":8,"hotelId":5,"serviceCode":"TST6771","serviceName":"Test service","defaultUnitPrice":10000.00,"isActive":true,"createdAt":"2026-04-09T01:06:12","updatedAt":"2026-04-09T01:06:12"},{"hotelServiceId":9,"hotelId":5,"serviceCode":"TST7803","serviceName":"Test service","defaultUnitPrice":10000.00,"isActive":true,"createdAt":"2026-04-09T01:23:24","updatedAt":"2026-04-09T01:23:24"}]}
```

---

### Matrix GET /api/hotelservices — hotelId + includeInactive=true

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/hotelservices`
- **HTTP:** `200`
- **Thời gian:** 13 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"hotelServiceId":7,"hotelId":5,"serviceCode":"TST6156","serviceName":"Test service","defaultUnitPrice":10000.00,"isActive":true,"createdAt":"2026-04-09T00:55:57","updatedAt":"2026-04-09T00:55:57"},{"hotelServiceId":8,"hotelId":5,"serviceCode":"TST6771","serviceName":"Test service","defaultUnitPrice":10000.00,"isActive":true,"createdAt":"2026-04-09T01:06:12","updatedAt":"2026-04-09T01:06:12"},{"hotelServiceId":9,"hotelId":5,"serviceCode":"TST7803","serviceName":"Test service","defaultUnitPrice":10000.00,"isActive":true,"createdAt":"2026-04-09T01:23:24","updatedAt":"2026-04-09T01:23:24"}]}
```

---

### Matrix GET /api/auditlogs — action=API

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/auditlogs`
- **HTTP:** `200`
- **Thời gian:** 15 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"auditId":508,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/hotelservices","reason":"GET 200 8ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/hotelservices\",\"query\":\"?hotelId=5\\u0026includeInactive=true\",\"statusCode\":200,\"elapsedMs\":8,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:26"},{"auditId":507,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/hotelservices","reason":"GET 200 9ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/hotelservices\",\"query\":\"?hotelId=5\",\"statusCode\":200,\"elapsedMs\":9,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:26"},{"auditId":506,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/hotelservices","reason":"GET 200 4ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/hotelservices\",\"query\":\"\",\"statusCode\":200,\"elapsedMs\":4,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:26"},{"auditId":505,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/maintenancetickets","reason":"GET 200 13ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/maintenancetickets\",\"query\":\"?assignedTo=1\",\"statusCode\":200,\"elapsedMs\":13,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:26"},{"auditId":504,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/maintenancetickets","reason":"GET 200 12ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/maintenancetickets\",\"query\":\"?statusCode=OPEN\",\"statusCode\":200,\"elapsedMs\":12,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:26"},{"auditId":503,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/maintenancetickets","reason":"GET 200 22ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/maintenancetickets\",\"query\":\"?roomId=1\",\"statusCode\":200,\"elapsedMs\":22,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:26"},{"auditId":502,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/maintenancetickets","reason":"GET 200 4ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/maintenancetickets\",\"query\":\"\",\"statusCode\":200,\"elapsedMs\":4,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:26"},{"auditId":501,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/housekeepingtasks","reason":"GET 200 13ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/housekeepingtasks\",\"query\":\"?assignedTo=1\",\"statusCode\":200,\"elapsedMs\":13,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:25"},{"auditId":500,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/housekeepingtasks","reason":"GET 200 10ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/housekeepingtasks\",\"query\":\"?roomId=1\\u0026statusCode=OPEN\",\"statusCode\":200,\"elapsedMs\":10,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:25"},{"auditId":499,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/housekeepingtasks","reason":"GET 200 10ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/housekeepingtasks\",\"query\":\"?statusCode=OPEN\",\"statusCode\":200,\"elapsedMs\":10,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:25"}]}
```

---

### Matrix GET /api/auditlogs — entityName=Endpoint

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/auditlogs`
- **HTTP:** `200`
- **Thời gian:** 20 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"auditId":509,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/auditlogs","reason":"GET 200 10ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/auditlogs\",\"query\":\"?action=API\\u0026take=10\",\"statusCode\":200,\"elapsedMs\":10,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:26"},{"auditId":508,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/hotelservices","reason":"GET 200 8ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/hotelservices\",\"query\":\"?hotelId=5\\u0026includeInactive=true\",\"statusCode\":200,\"elapsedMs\":8,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:26"},{"auditId":507,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/hotelservices","reason":"GET 200 9ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/hotelservices\",\"query\":\"?hotelId=5\",\"statusCode\":200,\"elapsedMs\":9,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:26"},{"auditId":506,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/hotelservices","reason":"GET 200 4ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/hotelservices\",\"query\":\"\",\"statusCode\":200,\"elapsedMs\":4,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:26"},{"auditId":505,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/maintenancetickets","reason":"GET 200 13ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/maintenancetickets\",\"query\":\"?assignedTo=1\",\"statusCode\":200,\"elapsedMs\":13,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:26"},{"auditId":504,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/maintenancetickets","reason":"GET 200 12ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/maintenancetickets\",\"query\":\"?statusCode=OPEN\",\"statusCode\":200,\"elapsedMs\":12,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:26"},{"auditId":503,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/maintenancetickets","reason":"GET 200 22ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/maintenancetickets\",\"query\":\"?roomId=1\",\"statusCode\":200,\"elapsedMs\":22,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:26"},{"auditId":502,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/maintenancetickets","reason":"GET 200 4ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/maintenancetickets\",\"query\":\"\",\"statusCode\":200,\"elapsedMs\":4,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:26"},{"auditId":501,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/housekeepingtasks","reason":"GET 200 13ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/housekeepingtasks\",\"query\":\"?assignedTo=1\",\"statusCode\":200,\"elapsedMs\":13,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:25"},{"auditId":500,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/housekeepingtasks","reason":"GET 200 10ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/housekeepingtasks\",\"query\":\"?roomId=1\\u0026statusCode=OPEN\",\"statusCode\":200,\"elapsedMs\":10,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:25"}]}
```

---

### Matrix GET /api/auditlogs — take=1

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/auditlogs`
- **HTTP:** `200`
- **Thời gian:** 9 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"auditId":510,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/auditlogs","reason":"GET 200 10ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/auditlogs\",\"query\":\"?entityName=Endpoint\\u0026take=10\",\"statusCode\":200,\"elapsedMs\":10,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:26"}]}
```

---

### Matrix GET /api/auditlogs — take=500 (max)

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/auditlogs`
- **HTTP:** `200`
- **Thời gian:** 29 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"auditId":511,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/auditlogs","reason":"GET 200 2ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/auditlogs\",\"query\":\"?take=1\",\"statusCode\":200,\"elapsedMs\":2,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:26"},{"auditId":510,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/auditlogs","reason":"GET 200 10ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/auditlogs\",\"query\":\"?entityName=Endpoint\\u0026take=10\",\"statusCode\":200,\"elapsedMs\":10,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:26"},{"auditId":509,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/auditlogs","reason":"GET 200 10ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/auditlogs\",\"query\":\"?action=API\\u0026take=10\",\"statusCode\":200,\"elapsedMs\":10,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:26"},{"auditId":508,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/hotelservices","reason":"GET 200 8ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/hotelservices\",\"query\":\"?hotelId=5\\u0026includeInactive=true\",\"statusCode\":200,\"elapsedMs\":8,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:26"},{"auditId":507,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/hotelservices","reason":"GET 200 9ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/hotelservices\",\"query\":\"?hotelId=5\",\"statusCode\":200,\"elapsedMs\":9,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:26"},{"auditId":506,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/hotelservices","reason":"GET 200 4ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/hotelservices\",\"query\":\"\",\"statusCode\":200,\"elapsedMs\":4,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:26"},{"auditId":505,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/maintenancetickets","reason":"GET 200 13ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/maintenancetickets\",\"query\":\"?assignedTo=1\",\"statusCode\":200,\"elapsedMs\":13,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:26"},{"auditId":504,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/maintenancetickets","reason":"GET 200 12ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/maintenancetickets\",\"query\":\"?statusCode=OPEN\",\"statusCode\":200,\"elapsedMs\":12,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:26"},{"auditId":503,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/maintenancetickets","reason":"GET 200 22ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/maintenancetickets\",\"query\":\"?roomId=1\",\"statusCode\":200,\"elapsedMs\":22,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:26"},{"auditId":502,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/maintenancetickets","reason":"GET 200 4ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/maintenancetickets\",\"query\":\"\",\"statusCode\":200,\"elapsedMs\":4,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:26"},{"auditId":501,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/housekeepingtasks","reason":"GET 200 13ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/housekeepingtasks\",\"query\":\"?assignedTo=1\",\"statusCode\":200,\"elapsedMs\":13,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:25"},{"auditId":500,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/housekeepingtasks","reason":"GET 200 10ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/housekeepingtasks\",\"query\":\"?roomId=1\\u0026statusCode=OPEN\",\"statusCode\":200,\"elapsedMs\":10,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:25"},{"auditId":499,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/housekeepingtasks","reason":"GET 200 10ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/housekeepingtasks\",\"query\":\"?statusCode=OPEN\",\"statusCode\":200,\"elapsedMs\":10,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:25"},{"auditId":498,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/housekeepingtasks","reason":"GET 200 9ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/housekeepingtasks\",\"query\":\"?roomId=1\",\"statusCode\":200,\"elapsedMs\":9,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:25"},{"auditId":497,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/housekeepingtasks","reason":"GET 200 5ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/housekeepingtasks\",\"query\":\"\",\"statusCode\":200,\"elapsedMs\":5,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:25"},{"auditId":496,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/payments","reason":"GET 200 12ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/payments\",\"query\":\"?reservationId=1\\u0026statusCode=PAID\",\"statusCode\":200,\"elapsedMs\":12,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:25"},{"auditId":495,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/payments","reason":"GET 200 12ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/payments\",\"query\":\"?statusCode=PAID\",\"statusCode\":200,\"elapsedMs\":12,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:25"},{"auditId":494,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/payments","reason":"GET 200 11ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/payments\",\"query\":\"?reservationId=1\",\"statusCode\":200,\"elapsedMs\":11,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:25"},{"auditId":493,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/payments","reason":"GET 200 16ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/payments\",\"query\":\"?stayId=1\",\"statusCode\":200,\"elapsedMs\":16,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:25"},{"auditId":492,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/payments","reason":"GET 200 3ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/payments\",\"query\":\"\",\"statusCode\":200,\"elapsedMs\":3,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:25"},{"auditId":491,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/serviceorders","reason":"GET 200 19ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/serviceorders\",\"query\":\"?stayId=1\\u0026reservationId=1\",\"statusCode\":200,\"elapsedMs\":19,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:25"},{"auditId":490,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/serviceorders","reason":"GET 200 26ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/serviceorders\",\"query\":\"?reservationId=1\",\"statusCode\":200,\"elapsedMs\":26,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:25"},{"auditId":489,"actorUserId":1,"action":"API_REQUEST","entityName":"Endpoint","entityId":"/api/serviceorders","reason":"GET 200 5ms","beforeJson":null,"afterJson":"{\"method\":\"GET\",\"path\":\"/api/serviceorders\",\"query\":\"?stayId=1\",\"statusCode\":200,\"elapsedMs\":5,\"username\":\"admin\"}","createdAt":"2026-04-09T08:23:25"},{"auditId":488,"actorUserId":1,"action":"API_REQ
... [truncated]
```

---

### Matrix GET /api/roles — includeInactive=true

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/roles`
- **HTTP:** `200`
- **Thời gian:** 24 ms

**Response (text / JSON):**

```
{"message":"Lấy dữ liệu thành công.","data":[{"roleId":3,"roleCode":"ACCOUNTANT","roleName":"Kế toán/Thu ngân","isActive":true},{"roleId":1,"roleCode":"ADMIN","roleName":"Quản trị hệ thống","isActive":true},{"roleId":4,"roleCode":"HOUSEKEEPING","roleName":"Buồng phòng","isActive":true},{"roleId":5,"roleCode":"MAINTENANCE","roleName":"Kỹ thuật","isActive":true},{"roleId":6,"roleCode":"MANAGER","roleName":"Quản lý","isActive":true},{"roleId":2,"roleCode":"RECEPTION","roleName":"Lễ tân","isActive":true},{"roleId":7,"roleCode":"RT96090","roleName":"Role test","isActive":true},{"roleId":8,"roleCode":"RT96156","roleName":"Role test","isActive":true},{"roleId":9,"roleCode":"RT96771","roleName":"Role test","isActive":true},{"roleId":10,"roleCode":"RT97803","roleName":"Role test","isActive":true}]}
```

---

### Matrix 404 GET /api/hotels/{id}

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/hotels/999999999`
- **HTTP:** `404`
- **Thời gian:** 34 ms

**Response (text / JSON):**

```
{"message":"Không tìm thấy khách sạn."}
```

---

### Matrix 404 GET /api/roomtypes/{id}

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/roomtypes/999999999`
- **HTTP:** `404`
- **Thời gian:** 17 ms

**Response (text / JSON):**

```
{"message":"Không tìm thấy loại phòng."}
```

---

### Matrix 404 GET /api/rooms/{id}

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/rooms/999999999`
- **HTTP:** `404`
- **Thời gian:** 25 ms

**Response (text / JSON):**

```
{"message":"Không tìm thấy phòng."}
```

---

### Matrix 404 GET /api/customers/{id}

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/customers/9999999999999999`
- **HTTP:** `404`
- **Thời gian:** 19 ms

**Response (text / JSON):**

```
{"message":"Không tìm thấy khách hàng."}
```

---

### Matrix 404 GET /api/guests/{id}

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/guests/9999999999999999`
- **HTTP:** `404`
- **Thời gian:** 30 ms

**Response (text / JSON):**

```
{"message":"Không tìm thấy khách."}
```

---

### Matrix 404 GET /api/bookings/{id}

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/bookings/9999999999999999`
- **HTTP:** `404`
- **Thời gian:** 18 ms

**Response (text / JSON):**

```
{"message":"Không tìm thấy đơn đặt phòng."}
```

---

### Matrix 404 GET /api/stays/{id}

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/stays/9999999999999999`
- **HTTP:** `404`
- **Thời gian:** 23 ms

**Response (text / JSON):**

```
{"message":"Không tìm thấy lưu trú (stay)."}
```

---

### Matrix 404 GET /api/invoices/{id}

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/invoices/999999999`
- **HTTP:** `404`
- **Thời gian:** 24 ms

**Response (text / JSON):**

```
{"message":"Không tìm thấy hóa đơn."}
```

---

### Matrix 404 GET /api/payments/{id}

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/payments/9999999999999999`
- **HTTP:** `404`
- **Thời gian:** 5 ms

**Response (text / JSON):**

```
{"message":"Không tìm thấy thanh toán."}
```

---

### Matrix 404 GET /api/hotelservices/{id}

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/hotelservices/999999999`
- **HTTP:** `404`
- **Thời gian:** 7 ms

**Response (text / JSON):**

```
{"message":"Không tìm thấy dịch vụ trong danh mục."}
```

---

### Matrix 404 GET /api/housekeepingtasks/{id}

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/housekeepingtasks/9999999999999999`
- **HTTP:** `404`
- **Thời gian:** 7 ms

**Response (text / JSON):**

```
{"message":"Không tìm thấy công việc buồng phòng."}
```

---

### Matrix 404 GET /api/maintenancetickets/{id}

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/maintenancetickets/9999999999999999`
- **HTTP:** `404`
- **Thời gian:** 8 ms

**Response (text / JSON):**

```
{"message":"Không tìm thấy ticket kỹ thuật."}
```

---

### Matrix 404 GET /api/users/{id}

- **Method:** `GET`
- **URL:** `http://localhost:5066/api/users/999999999`
- **HTTP:** `405`
- **Thời gian:** 20 ms

**Response (text / JSON):**

```
{"message":"Ph\u01B0\u01A1ng th\u1EE9c g\u1ECDi API kh\u00F4ng \u0111\u01B0\u1EE3c h\u1ED7 tr\u1EE3.","statusCode":405,"traceId":"0HNKLQACBH4GN:00000001"}
```

---

### Matrix 400 POST /api/serviceorders — cả stayId và reservationId

- **Method:** `POST`
- **URL:** `http://localhost:5066/api/serviceorders`
- **HTTP:** `400`
- **Thời gian:** 9 ms

**Response (text / JSON):**

```
{"message":"Cần gửi đúng một trong hai: stayId hoặc reservationId."}
```

---

### Matrix 400 POST /api/serviceorders — không stayId/reservationId

- **Method:** `POST`
- **URL:** `http://localhost:5066/api/serviceorders`
- **HTTP:** `400`
- **Thời gian:** 7 ms

**Response (text / JSON):**

```
{"message":"Cần gửi đúng một trong hai: stayId hoặc reservationId."}
```

---

### Matrix 404 PUT /api/serviceorders/{id}/cancel

- **Method:** `PUT`
- **URL:** `http://localhost:5066/api/serviceorders/9999999999999999/cancel`
- **HTTP:** `404`
- **Thời gian:** 11 ms

**Response (text / JSON):**

```
{"message":"Không tìm thấy dịch vụ."}
```

---

### Matrix 400 POST /api/payments — cả stayId và reservationId

- **Method:** `POST`
- **URL:** `http://localhost:5066/api/payments`
- **HTTP:** `400`
- **Thời gian:** 18 ms

**Response (text / JSON):**

```
{"message":"Cần gửi đúng một trong hai: stayId hoặc reservationId."}
```

---

### Matrix 400 POST /api/payments — không stayId/reservationId

- **Method:** `POST`
- **URL:** `http://localhost:5066/api/payments`
- **HTTP:** `400`
- **Thời gian:** 41 ms

**Response (text / JSON):**

```
{"message":"Cần gửi đúng một trong hai: stayId hoặc reservationId."}
```

---

### Matrix 400 POST /api/payments — stayId không tồn tại

- **Method:** `POST`
- **URL:** `http://localhost:5066/api/payments`
- **HTTP:** `400`
- **Thời gian:** 14 ms

**Response (text / JSON):**

```
{"message":"Stay không tồn tại."}
```

---

### Matrix 400 POST /api/payments — reservationId không tồn tại

- **Method:** `POST`
- **URL:** `http://localhost:5066/api/payments`
- **HTTP:** `400`
- **Thời gian:** 11 ms

**Response (text / JSON):**

```
{"message":"Đặt phòng không tồn tại."}
```

---

### Matrix 404 PUT /api/payments/{id}/void

- **Method:** `PUT`
- **URL:** `http://localhost:5066/api/payments/9999999999999999/void`
- **HTTP:** `404`
- **Thời gian:** 10 ms

**Response (text / JSON):**

```
{"message":"Không tìm thấy thanh toán."}
```

---

### Matrix 404 PUT /api/bookings/{id}/check-in

- **Method:** `PUT`
- **URL:** `http://localhost:5066/api/bookings/9999999999999999/check-in`
- **HTTP:** `404`
- **Thời gian:** 14 ms

**Response (text / JSON):**

```
{"message":"Không tìm thấy đơn đặt phòng."}
```

---

### Matrix 404 PUT /api/bookings/{id}/check-out

- **Method:** `PUT`
- **URL:** `http://localhost:5066/api/bookings/9999999999999999/check-out`
- **HTTP:** `404`
- **Thời gian:** 22 ms

**Response (text / JSON):**

```
{"message":"Không tìm thấy đơn đặt phòng."}
```

---

### Matrix 404 PUT /api/bookings/{id}/cancel

- **Method:** `PUT`
- **URL:** `http://localhost:5066/api/bookings/9999999999999999/cancel`
- **HTTP:** `404`
- **Thời gian:** 12 ms

**Response (text / JSON):**

```
{"message":"Không tìm thấy đơn đặt phòng."}
```

---

### Matrix 404 PUT /api/users/{id}/status

- **Method:** `PUT`
- **URL:** `http://localhost:5066/api/users/999999999/status`
- **HTTP:** `404`
- **Thời gian:** 20 ms

**Response (text / JSON):**

```
{"message":"Không tìm thấy tài khoản."}
```

---

### Matrix 404 PUT /api/users/{id}/roles

- **Method:** `PUT`
- **URL:** `http://localhost:5066/api/users/999999999/roles`
- **HTTP:** `404`
- **Thời gian:** 14 ms

**Response (text / JSON):**

```
{"message":"Không tìm thấy tài khoản."}
```

---

### Matrix 404 DELETE /api/rooms/{id}

- **Method:** `DELETE`
- **URL:** `http://localhost:5066/api/rooms/999999999`
- **HTTP:** `404`
- **Thời gian:** 34 ms

**Response (text / JSON):**

```
{"message":"Không tìm thấy phòng để ngưng hoạt động."}
```

---

### Matrix 404 DELETE /api/roomtypes/{id}

- **Method:** `DELETE`
- **URL:** `http://localhost:5066/api/roomtypes/999999999`
- **HTTP:** `404`
- **Thời gian:** 15 ms

**Response (text / JSON):**

```
{"message":"Không tìm thấy loại phòng để ngưng hoạt động."}
```

---

### Matrix 404 DELETE /api/hotels/{id}

- **Method:** `DELETE`
- **URL:** `http://localhost:5066/api/hotels/999999999`
- **HTTP:** `404`
- **Thời gian:** 19 ms

**Response (text / JSON):**

```
{"message":"Không tìm thấy khách sạn để ngưng hoạt động."}
```

---

### Matrix 404 POST /api/customers/{id}/loyalty/adjust

- **Method:** `POST`
- **URL:** `http://localhost:5066/api/customers/9999999999999999/loyalty/adjust`
- **HTTP:** `404`
- **Thời gian:** 7 ms

**Response (text / JSON):**

```
{"message":"Không tìm thấy khách hàng."}
```

---

### Matrix 404 PUT /api/roles/{id}

- **Method:** `PUT`
- **URL:** `http://localhost:5066/api/roles/999999999`
- **HTTP:** `404`
- **Thời gian:** 6 ms

**Response (text / JSON):**

```
{"message":"Không tìm thấy vai trò."}
```

---

### Delete rules — Hotel blocked (còn phòng/loại phòng active)

- **Method:** `DELETE`
- **URL:** `http://localhost:5066/api/hotels/5`
- **HTTP:** `400`
- **Thời gian:** 20 ms

**Response (text / JSON):**

```
{"message":"Không thể ngưng hoạt động khách sạn khi vẫn còn phòng/loại phòng đang hoạt động."}
```

---

### Delete rules — RoomType blocked (còn phòng active gán loại này)

- **Method:** `DELETE`
- **URL:** `http://localhost:5066/api/roomtypes/7`
- **HTTP:** `400`
- **Thời gian:** 15 ms

**Response (text / JSON):**

```
{"message":"Không thể ngưng hoạt động loại phòng khi vẫn còn phòng đang gán loại này."}
```

---

### Delete chain — Create hotel

- **Method:** `POST`
- **URL:** `http://localhost:5066/api/hotels`
- **HTTP:** `400`
- **Thời gian:** 18 ms

**Response (text / JSON):**

```
{"message":"Số điện thoại đã được dùng cho khách sạn khác."}
```

---

### Guests — Delete (cleanup)

- **Method:** `DELETE`
- **URL:** `http://localhost:5066/api/guests/4`
- **HTTP:** `200`
- **Thời gian:** 20 ms

**Response (text / JSON):**

```
{"message":"Đã xóa mềm khách lưu trú."}
```

---

### Customers — Delete (cleanup)

- **Method:** `DELETE`
- **URL:** `http://localhost:5066/api/customers/4`
- **HTTP:** `200`
- **Thời gian:** 20 ms

**Response (text / JSON):**

```
{"message":"Đã xóa mềm khách hàng."}
```

---

### Users — Set roles (user vừa tạo)

- **Method:** `PUT`
- **URL:** `http://localhost:5066/api/users/6/roles`
- **HTTP:** `200`
- **Thời gian:** 16 ms

**Response (text / JSON):**

```
{"message":"Cập nhật vai trò thành công.","data":{"userId":6,"username":"apitest97803","roleCodes":["RECEPTION"]}}
```

---

### Housekeeping — Update (task vừa tạo)

- **Method:** `PUT`
- **URL:** `http://localhost:5066/api/housekeepingtasks/4`
- **HTTP:** `200`
- **Thời gian:** 8 ms

**Response (text / JSON):**

```
{"message":"Cập nhật dữ liệu thành công.","data":{"taskId":4,"roomId":1,"assignedTo":null,"statusCode":"IN_PROGRESS","note":"cleanup chain","createdAt":"2026-04-09T01:23:24","updatedAt":"2026-04-09T01:23:26.4622657Z","deletedAt":null}}
```

---

### Housekeeping — Delete (cleanup)

- **Method:** `DELETE`
- **URL:** `http://localhost:5066/api/housekeepingtasks/4`
- **HTTP:** `200`
- **Thời gian:** 8 ms

**Response (text / JSON):**

```
{"message":"Đã xóa mềm công việc."}
```

---

### Maintenance — Update (ticket vừa tạo)

- **Method:** `PUT`
- **URL:** `http://localhost:5066/api/maintenancetickets/4`
- **HTTP:** `200`
- **Thời gian:** 9 ms

**Response (text / JSON):**

```
{"message":"Cập nhật dữ liệu thành công.","data":{"ticketId":4,"roomId":1,"assignedTo":null,"title":"Updated after create","description":"cleanup","statusCode":"IN_PROGRESS","cancelReason":null,"createdAt":"2026-04-09T01:23:24","updatedAt":"2026-04-09T01:23:26.4797Z","deletedAt":null}}
```

---

### Maintenance — Delete (cleanup)

- **Method:** `DELETE`
- **URL:** `http://localhost:5066/api/maintenancetickets/4`
- **HTTP:** `200`
- **Thời gian:** 8 ms

**Response (text / JSON):**

```
{"message":"Đã xóa mềm ticket."}
```

---
