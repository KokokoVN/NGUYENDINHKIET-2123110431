# TEST CASE API + JWT (HotelManagement)

## 0) Điều kiện trước khi test
- API đang chạy: `http://localhost:5066`
- Database: `HotelManagement` trên `KOKOKOVN\SQLEXPRESS`
- Tài khoản test (đã tạo trong SQL Server):
  - **Admin**: `admin` / `123456` (Role: `ADMIN`)
  - **Lễ tân**: `letan` / `123456` (Role: `RECEPTION`)

> Gợi ý: test bằng Postman, hoặc PowerShell (có sẵn lệnh mẫu bên dưới).

## 1) Nhóm test: Đăng nhập JWT

### TC-AUTH-01: Đăng nhập đúng (admin)
- **Bước test**: gọi `POST /api/auth/login` với user/pass đúng.
- **Kỳ vọng**:
  - HTTP `200`
  - Trả về `accessToken`
  - `role = ADMIN`

PowerShell:
```powershell
$body = @{ username='admin'; password='123456' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "http://localhost:5066/api/auth/login" -ContentType "application/json" -Body $body
```

### TC-AUTH-02: Đăng nhập đúng (lễ tân)
- **Kỳ vọng**: HTTP `200`, `role = RECEPTION`

```powershell
$body = @{ username='letan'; password='123456' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "http://localhost:5066/api/auth/login" -ContentType "application/json" -Body $body
```

### TC-AUTH-03: Sai mật khẩu
- **Kỳ vọng**: HTTP `401 Unauthorized`

```powershell
$body = @{ username='admin'; password='sai_mat_khau' } | ConvertTo-Json
try {
  Invoke-RestMethod -Method Post -Uri "http://localhost:5066/api/auth/login" -ContentType "application/json" -Body $body
} catch { $_.Exception.Response.StatusCode.value__ }
```

### TC-AUTH-04: User không tồn tại
- **Kỳ vọng**: HTTP `401 Unauthorized`

```powershell
$body = @{ username='khongtonTai'; password='123456' } | ConvertTo-Json
try {
  Invoke-RestMethod -Method Post -Uri "http://localhost:5066/api/auth/login" -ContentType "application/json" -Body $body
} catch { $_.Exception.Response.StatusCode.value__ }
```

## 2) Nhóm test: Gọi API có/không token

### TC-AUTHZ-01: Gọi `GET /api/rooms` không có token
- **Kỳ vọng**: HTTP `401`

```powershell
try { Invoke-RestMethod -Uri "http://localhost:5066/api/rooms" } catch { $_.Exception.Response.StatusCode.value__ }
```

### TC-AUTHZ-02: Gọi `GET /api/rooms` có token admin
- **Kỳ vọng**: HTTP `200` (có thể list rỗng nếu DB chưa có phòng)

```powershell
$login = Invoke-RestMethod -Method Post -Uri "http://localhost:5066/api/auth/login" -ContentType "application/json" -Body (@{username='admin';password='123456'}|ConvertTo-Json)
$headers = @{ Authorization = "Bearer $($login.accessToken)" }
Invoke-RestMethod -Method Get -Uri "http://localhost:5066/api/rooms" -Headers $headers
```

## 3) Nhóm test: Phân quyền theo Role

> Hiện tại project đang gắn role ở một số endpoint:
> - `POST /api/customers`: `ADMIN,RECEPTION`
> - `POST /api/bookings` + checkin/checkout/cancel: `ADMIN,RECEPTION`

### TC-ROLE-01: Lễ tân tạo khách hàng
- **Kỳ vọng**: HTTP `200`

```powershell
$login = Invoke-RestMethod -Method Post -Uri "http://localhost:5066/api/auth/login" -ContentType "application/json" -Body (@{username='letan';password='123456'}|ConvertTo-Json)
$headers = @{ Authorization = "Bearer $($login.accessToken)" }

$customer = @{
  customerType = "INDIVIDUAL"
  fullName = "Khach Test"
  phone = "0900000009"
  email = "test@email.com"
  notes = "Tao tu test case"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://localhost:5066/api/customers" -Headers $headers -ContentType "application/json" -Body $customer
```

### TC-ROLE-02: Gọi API bằng token rác/không hợp lệ
- **Kỳ vọng**: HTTP `401`

```powershell
$headers = @{ Authorization = "Bearer abc.def.ghi" }
try { Invoke-RestMethod -Method Get -Uri "http://localhost:5066/api/rooms" -Headers $headers } catch { $_.Exception.Response.StatusCode.value__ }
```

## 4) Nhóm test: Đặt phòng (Reservation)

### TC-BOOK-01: Tạo đặt phòng hợp lệ
- **Điều kiện**: DB có `RoomId` hợp lệ (ví dụ 1 phòng).
- **Kỳ vọng**: HTTP `200`, trả dữ liệu reservation.

```powershell
$login = Invoke-RestMethod -Method Post -Uri "http://localhost:5066/api/auth/login" -ContentType "application/json" -Body (@{username='admin';password='123456'}|ConvertTo-Json)
$headers = @{ Authorization = "Bearer $($login.accessToken)" }

$booking = @{
  roomId = 1
  customerId = $null
  checkInDate = "2026-04-02"
  checkOutDate = "2026-04-03"
  adults = 1
  children = 0
  specialRequest = "Phong gan thang may"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://localhost:5066/api/bookings" -Headers $headers -ContentType "application/json" -Body $booking
```

### TC-BOOK-02: Check-out <= Check-in
- **Kỳ vọng**: HTTP `400`

```powershell
$login = Invoke-RestMethod -Method Post -Uri "http://localhost:5066/api/auth/login" -ContentType "application/json" -Body (@{username='admin';password='123456'}|ConvertTo-Json)
$headers = @{ Authorization = "Bearer $($login.accessToken)" }

$booking = @{
  roomId = 1
  checkInDate = "2026-04-03"
  checkOutDate = "2026-04-03"
  adults = 1
  children = 0
} | ConvertTo-Json

try {
  Invoke-RestMethod -Method Post -Uri "http://localhost:5066/api/bookings" -Headers $headers -ContentType "application/json" -Body $booking
} catch { $_.Exception.Response.StatusCode.value__ }
```

## 5) Ghi chú quan trọng
- Nếu `GET /api/rooms` trả list rỗng: DB của bạn chưa seed phòng, hoặc seed vào bảng `dbo.Room` chưa có dữ liệu.
- Khi cần seed demo theo script: chạy `db/hotel-sqlserver/06_seed_data.sql`.

