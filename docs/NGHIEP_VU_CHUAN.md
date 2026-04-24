# TAI LIEU NGHIEP VU CHUAN - HOTEL MANAGEMENT

Cap nhat: 2026-04-24  
Pham vi: Backend `HotelManagement.Api` + Frontend `hotel-management-web` + SQL Server `HotelManagement`.

## 1) Muc tieu he thong

He thong quan ly khach san ho tro day du luong:
- Danh muc: Khach san, loai phong, phong, dich vu.
- Van hanh: Khach hang, dat phong, check-in, check-out.
- Tai chinh: Thanh toan, hoa don, xuat PDF hoa don.
- Quan tri: phan quyen, xoa mem/ngung hoat dong, khoi phuc.

## 2) Vai tro va quyen chinh

- `ADMIN`: Toan quyen quan tri.
- `RECEPTION`: Van hanh dat phong, luu tru, danh muc co ban.
- `ACCOUNTANT`: Hoa don, thanh toan, void giao dich.
- `MANAGER`: Theo doi va bao cao (tuy module).

## 3) Quy tac nghiep vu cot loi

### 3.1 Khach san - Loai phong - Phong (quan he cha/con)

- Khach san, loai phong, phong su dung co che **xoa mem** (`IsActive`).
- Khi ngung thuc the cha:
  - He thong kiem tra du lieu con dang hoat dong.
  - Neu con du lieu con thi tra ve yeu cau xac nhan (`requiresConfirmation`).
  - Neu nguoi dung xac nhan (`cascadeChildren=true`) thi ngung toan bo con.

Ap dung hien tai:
- `DELETE /api/hotels/{id}`: co the ngung kem `Room`, `RoomType`, `HotelService`.
- `DELETE /api/roomtypes/{id}`: co the ngung kem toan bo `Room` thuoc loai phong.

### 3.2 Dat phong - Luu tru

- Dat phong phai hop le theo phong/lich/trang thai phong.
- Check-in tao `Stay` dang `IN_HOUSE`.
- Check-out chi khi stay hop le, cap nhat trang thai don va stay.

### 3.3 Thanh toan (cap nhat moi)

`POST /api/payments` da duoc chuan hoa:
- Chi nhan `stayId` hop le.
- Chi cho thanh toan khi `Stay` da `CHECKED_OUT`.
- Chi nhan **tien mat** (`MethodCode = CASH`).
- So tien **tu dong tinh**: `Tien phong + Tien dich vu ACTIVE`.
- Khong cho thanh toan trung cho cung 1 stay da `PAID`.

### 3.4 Hoa don (cap nhat moi)

- `GET /api/invoices` chi lay **hoa don da thanh toan thanh cong**.
- Hoa don chi tao duoc sau khi don dat phong da `CHECKED_OUT`.
- Moi booking chi co 1 hoa don.
- Ho tro xuat file PDF:
  - `GET /api/invoices/{id}/pdf`
  - Frontend co nut `Xuat PDF` tai trang chi tiet hoa don.

## 4) Luong nghiep vu chuan (de van hanh)

1. Tao danh muc co ban: Khach san -> Loai phong -> Phong -> Dich vu.  
2. Tao/quan ly khach hang.  
3. Tao dat phong.  
4. Check-in -> tao stay.  
5. Ghi nhan su dung dich vu (ServiceOrder).  
6. Check-out stay.  
7. Tao thanh toan (theo stay, tien mat, tu dong tinh).  
8. Tao/quan ly hoa don va xuat PDF.

## 5) Quy dinh du lieu va trang thai

- Trang thai thanh toan chinh: `PAID`, `VOID`.
- Trang thai stay quan trong: `IN_HOUSE`, `CHECKED_OUT`.
- Trang thai phong lien quan: `VACANT`, `OCCUPIED`, `OUT_OF_SERVICE`, `MAINTENANCE`.

## 6) Yeu cau UI/UX da chuan hoa

- Khi ngung cha co con: bat buoc hien hop thoai xac nhan lan 2.
- Neu xac nhan cascade: thong bao ro so luong ban ghi con bi ngung.
- Form tao/sua uu tien bo cuc ro tung nhom thong tin, thong bao loi field-level.

## 7) Tieu chi nghiem thu nhanh

- [ ] `DELETE /api/hotels/{id}`: co con -> tra `409` + `requiresConfirmation=true`.
- [ ] Xac nhan cascade tren UI -> hotel va toan bo con deu `IsActive=false`.
- [ ] `POST /api/payments` khong nhap amount van thanh cong neu stay da check-out.
- [ ] `GET /api/invoices` khong tra hoa don chua co thanh toan `PAID`.
- [ ] Nut `Xuat PDF` tai chi tiet hoa don tai duoc file `.pdf`.

## 8) Ghi chu van hanh

- Neu da sua code backend nhung UI van hien logic cu:
  - Kiem tra process API cu dang chay.
  - Restart API de nap lai binary moi.
  - Hard refresh frontend (`Ctrl + F5`).
