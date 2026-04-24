# TAI LIEU NGHIEP VU CHI TIET DAY DU - HOTEL MANAGEMENT

Cap nhat: 2026-04-24  
Muc dich: Tai lieu nghiep vu day du de ban giao, kiem thu, bao ve do an.

## 1. Tong quan he thong

He thong Hotel Management phuc vu quy trinh van hanh khach san tu dau den cuoi:
- Quan ly danh muc (Hotel, RoomType, Room, HotelService).
- Quan ly khach hang, dat phong, luu tru (check-in/check-out).
- Quan ly su dung dich vu, thanh toan, hoa don, xuat PDF.
- Quan ly xoa mem/ngung hoat dong co rang buoc cha-con.
- Ho tro bao cao tong quan va van hanh giao dien web quan tri.

He thong gom:
- Backend: ASP.NET Core Web API (`HotelManagement.Api`)
- Frontend: React + Vite (`hotel-management-web`)
- Database: SQL Server (`HotelManagement`)

## 2. Vai tro nguoi dung va phan quyen

- `ADMIN`: toan quyen.
- `RECEPTION`: thao tac van hanh dat phong, check-in/out, danh muc co ban.
- `ACCOUNTANT`: nghiep vu thanh toan, hoa don, void giao dich.
- `MANAGER`: giam sat, bao cao (tuy endpoint duoc cap quyen).

Tat ca API duoc bao ve bang JWT Bearer (tru login).

## 3. Thuat ngu va doi tuong nghiep vu

- `Hotel`: Khach san.
- `RoomType`: Loai phong (Deluxe, Suite...).
- `Room`: Phong cu the.
- `Customer`: Khach hang (ca nhan/cong ty).
- `Reservation` (Booking): Don dat phong.
- `Stay`: Ky luu tru thuc te sau check-in.
- `HotelService`: Danh muc dich vu theo khach san.
- `ServiceOrder`: Dong su dung dich vu trong ky luu tru.
- `Payment`: Giao dich thanh toan.
- `Invoice`: Hoa don tong ket.

## 4. Quy tac danh muc va rang buoc du lieu

### 4.1 Hotel
- Co `IsActive` de xoa mem.
- Cho phep khoi phuc (`restore`) neu hop le.
- Ten/phone/email khong trung voi hotel active khac (theo logic backend).

### 4.2 RoomType
- Thuoc mot Hotel.
- Co `Capacity`, `BaseRate`, `IsActive`.
- Khong cho trung ten loai phong active trong cung hotel.

### 4.3 Room
- Thuoc `Hotel` va `RoomType`.
- `RoomNumber` duy nhat trong cung hotel (voi ban ghi active).
- Trang thai thuong gap:
  - `VACANT`: trong
  - `OCCUPIED`: dang co khach
  - `OUT_OF_SERVICE`: ngung phuc vu
  - `MAINTENANCE`: bao tri

## 5. Quy trinh dat phong - luu tru

### 5.1 Tao dat phong
- Dau vao: room, customer, ngay check-in/out, so nguoi, gia dem.
- Rang buoc:
  - khong trung lich voi booking dang hieu luc.
  - phong phai hop le va dang phuc vu.
- Trang thai ban dau thuong la `CONFIRMED`.

### 5.2 Check-in
- Chi check-in duoc khi booking hop le.
- Tao `Stay` o trang thai `IN_HOUSE`.

### 5.3 Check-out
- Dong stay va cap nhat booking sang `CHECKED_OUT`.
- Sau check-out moi duoc thanh toan/xuat hoa don theo quy tac moi.

## 6. Quy trinh dich vu

### 6.1 Danh muc dich vu
- Quan ly theo tung hotel (`HotelService`).
- Moi service co `ServiceCode`, `ServiceName`, `DefaultUnitPrice`, `IsActive`.

### 6.2 Su dung dich vu
- Tao `ServiceOrder` theo `Stay`.
- Tinh thanh tien theo `Quantity * UnitPrice`.
- Chi cac dong `ACTIVE` duoc tinh vao thanh toan/hoa don.

## 7. Quy trinh thanh toan (Cap nhat theo yeu cau moi)

`POST /api/payments` da chuan hoa:
- Dau vao: chi can `stayId` (+ ghi chu, ma tham chieu neu co).
- Khong nhap tay `amount`.
- He thong tu tinh:
  - `RoomAmount` = so dem * rate per night.
  - `ServiceAmount` = tong ServiceOrder ACTIVE cua stay.
  - `Total` = RoomAmount + ServiceAmount.
- Phuong thuc co dinh: `CASH`.
- Dieu kien:
  - Stay phai ton tai.
  - Stay phai da `CHECKED_OUT`.
  - Khong cho thanh toan trung (neu da co payment `PAID`).

Trang thai:
- `PAID`: thanh toan thanh cong.
- `VOID`: huy giao dich (theo quyen).

## 8. Quy trinh hoa don (Cap nhat theo yeu cau moi)

### 8.1 Tao hoa don
- Chi tao duoc khi booking `CHECKED_OUT`.
- Moi booking chi co 1 hoa don.
- Co thong tin:
  - room amount
  - service amount
  - total amount
  - payment method
  - paid at

### 8.2 Danh sach hoa don
- `GET /api/invoices` chi tra ve hoa don da co thanh toan `PAID`.

### 8.3 Xuat PDF hoa don
- Endpoint: `GET /api/invoices/{id}/pdf`.
- Frontend co nut `Xuat PDF` tai trang chi tiet hoa don.
- File tai ve dang `invoice-{id}.pdf`.

## 9. Nghiep vu ngung hoat dong co xac nhan cha-con

## 9.1 Hotel -> RoomType/Room/HotelService
- Khi ngung Hotel:
  - Neu con ban ghi con active thi backend tra `409`, kem:
    - `requiresConfirmation = true`
    - so luong con dang active.
  - Frontend hien hop thoai xac nhan lan 2.
  - Neu nguoi dung dong y: goi lai voi `cascadeChildren=true`.
  - Backend se ngung toan bo con roi moi ngung Hotel.

### 9.2 RoomType -> Room
- Co logic y het:
  - co con -> tra yeu cau xac nhan
  - dong y -> cascade ngung toan bo phong con.

## 10. API chinh theo module

### 10.1 Auth
- `POST /api/auth/login`
- `GET /api/auth/me`

### 10.2 Hotels
- `GET /api/hotels`
- `GET /api/hotels/{id}`
- `POST /api/hotels`
- `PUT /api/hotels/{id}`
- `DELETE /api/hotels/{id}` (`cascadeChildren`)
- `PUT /api/hotels/{id}/restore`

### 10.3 RoomTypes
- `GET /api/roomtypes`
- `GET /api/roomtypes/{id}`
- `POST /api/roomtypes`
- `PUT /api/roomtypes/{id}`
- `DELETE /api/roomtypes/{id}` (`cascadeChildren`)
- `PUT /api/roomtypes/{id}/restore`

### 10.4 Rooms
- `GET /api/rooms`
- `GET /api/rooms/available`
- `GET /api/rooms/{id}`
- `POST /api/rooms`
- `PUT /api/rooms/{id}`
- `DELETE /api/rooms/{id}`
- `PUT /api/rooms/{id}/restore`

### 10.5 Customers
- `GET /api/customers`
- `GET /api/customers/{id}`
- `POST /api/customers`
- `PUT /api/customers/{id}`
- `DELETE /api/customers/{id}` (xoa mem)

### 10.6 Bookings/Stays
- `GET/POST /api/bookings`
- `PUT /api/bookings/{id}/check-in`
- `PUT /api/bookings/{id}/check-out`
- `PUT /api/bookings/{id}/cancel`
- `GET /api/stays`
- `GET /api/stays/{id}`

### 10.7 Services/ServiceOrders
- `GET/POST/PUT /api/hotelservices`
- `GET/POST /api/service-orders`
- `PUT /api/service-orders/{id}/cancel`

### 10.8 Payments/Invoices
- `GET/POST /api/payments`
- `PUT /api/payments/{id}/void`
- `GET/POST /api/invoices`
- `GET /api/invoices/{id}`
- `GET /api/invoices/{id}/pdf`

## 11. UI/UX hien tai da chuan hoa

- Form tao khach hang da nang cap bo cuc section.
- Cac man danh sach co phan trang, search, thong bao loi/thanh cong.
- Cac thao tac nguy hiem co `ConfirmDialog`.
- Luong ngung cha-con co xac nhan lan 2 ro rang.

## 12. Du lieu mau va seed

Da co script trong `docs/scripts` de:
- reset seed tong hop
- seed du lieu tuong thich schema hien tai
- bo sung them nhieu dich vu theo hotel

Khuyen nghi:
- moi lan test nghiep vu lon nen reset va seed lai de du lieu nhat quan.

## 13. Kiem thu nghiep vu (test checklist)

- [ ] Tao hotel -> roomtype -> room thanh cong.
- [ ] Khong cho tao room trung so trong cung hotel.
- [ ] Dat phong khong bi overlap lich.
- [ ] Check-in tao stay.
- [ ] Check-out chuyen trang thai dung.
- [ ] Payment chi thanh cong khi stay da check-out.
- [ ] Payment tu dong tinh tien, method la CASH.
- [ ] Invoice list chi hien hoa don da paid.
- [ ] Xuat PDF hoa don tai file thanh cong.
- [ ] Ngung hotel co con -> yeu cau xac nhan.
- [ ] Xac nhan cascade -> toan bo con cung ngung.

## 14. Quan tri van hanh

Neu thay UI van hien logic cu sau khi da sua backend:
- dung process API cu (file DLL dang lock),
- build lai backend,
- chay lai API,
- hard refresh frontend (`Ctrl + F5`).

## 15. Huong mo rong tiep theo

- Bo sung dashboard chuyen sau (doanh thu theo ngay, ADR, occupancy).
- Them luong hoan tien mot phan.
- Tich hop in hoa don co logo/chu ky.
- Bo sung notification realtime cho check-in/check-out.

## 16. Ket luan

Tai lieu nay la phien ban day du, co the dung de:
- bao ve do an,
- huan luyen nguoi su dung,
- ban giao ky thuat cho nhom van hanh,
- lam baseline cho giai doan nang cap tiep theo.
