# Giao diện quản lý khách sạn (React + Vite)

Kết nối **HotelManagement.Api** qua REST + JWT.

## Chạy development

1. Chạy API (port **5066**):

   ```bash
   cd HotelManagement.Api
   dotnet run --launch-profile http
   ```

2. Cài dependency và chạy web (port **5173**):

   ```bash
   cd hotel-management-web
   npm install
   npm run dev
   ```

3. Mở trình duyệt: `http://localhost:5173` — đăng nhập (ví dụ `admin` / mật khẩu trong DB seed).

Vite **proxy** mọi request `/api/*` sang `http://localhost:5066`, không cần cấu hình thêm khi dev.

## Build production

```bash
npm run build
```

Thư mục `dist/` có thể phục vụ tĩnh; khi đó đặt `VITE_API_URL` trỏ tới URL API (API đã bật CORS cho `localhost:5173`; thêm origin khác trong `Program.cs` nếu cần).

## Trang có sẵn

- Đăng nhập / đăng xuất (JWT lưu `localStorage`)
- Tổng quan (báo cáo dashboard)
- Khách sạn, loại phòng, phòng
- Khách hàng (có hiển thị điểm / hạng nếu API trả về)
- Đặt phòng, nhận / trả / hủy
- Hóa đơn
- Người dùng (chỉ **ADMIN**)
