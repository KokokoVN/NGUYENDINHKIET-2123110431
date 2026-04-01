# Nghiep vu quan ly khach san (ban mau)

## 1) Danh sach nghiep vu can co
- Quan ly phong: them/sua/xoa mem, xem trang thai.
- Dat phong: tao don dat phong, kiem tra trung lich.
- Nhan phong/tra phong: cap nhat trang thai don.
- Thanh toan: tinh tong tien theo so dem va loai phong.
- Bao cao: ty le lap day, doanh thu theo thang.

## 2) Luong dat phong co ban
1. Nhan thong tin: `roomId`, `checkInDate`, `checkOutDate`, thong tin khach.
2. Kiem tra ngay hop le: check-out phai lon hon check-in.
3. Kiem tra phong ton tai va con hoat dong.
4. Kiem tra trung lich dat phong.
5. Tinh tong tien = `soDem * giaPhong`.
6. Tao ban ghi booking.

## 3) API da tao trong project
- `GET /api/rooms`: lay danh sach phong.
- `GET /api/bookings`: lay danh sach dat phong.
- `POST /api/bookings`: tao dat phong moi.

## 4) Script SQL trong thu muc `db/hotel-sqlserver`
Chay theo thu tu:
1. `01_create_database.sql`
2. `02_schema_tables.sql`
3. `03_indexes.sql`
4. `04_views.sql`
5. `05_stored_procedures.sql`
6. `06_seed_data.sql`

## 5) Huong dan nang cap tiep
- Chuyen InMemory sang SQL Server (`UseSqlServer`).
- Them JWT dang nhap cho admin/le tan.
- Them migration va repository pattern.
- Them module khach hang, hoa don, dich vu phong.
