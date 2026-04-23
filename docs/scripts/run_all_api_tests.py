# -*- coding: utf-8 -*-
"""
Gọi lần lượt các API HotelManagement, ghi kết quả ra file Markdown + JSON.
Yêu cầu: pip install requests
Chạy API: dotnet run --project HotelManagement.Api (mặc định http://localhost:5066)

Biến môi trường:
  API_TEST_EXHAUSTIVE=1 (mặc định) — thêm ma trận: mọi query GET, GET 404, POST/PUT 400/401 tiêu biểu.
  API_TEST_EXHAUSTIVE=0 — chỉ chạy bộ test “luồng chính” (nhanh hơn).
"""
from __future__ import annotations

import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    import requests
except ImportError:
    print("Cài requests: pip install requests", file=sys.stderr)
    sys.exit(1)

BASE = os.environ.get("API_BASE_URL", "http://localhost:5066").rstrip("/")
OUT_DIR = Path(__file__).resolve().parents[1]
MD_OUT = OUT_DIR / "api_test_results.md"
JSON_OUT = OUT_DIR / "api_test_results.json"
USER = os.environ.get("API_TEST_USER", "admin")
PASSWORD = os.environ.get("API_TEST_PASSWORD", "123456")
EXHAUSTIVE = os.environ.get("API_TEST_EXHAUSTIVE", "1").lower() not in ("0", "false", "no", "off")

# ID không tồn tại (404 matrix) — int route vs long route
FAKE_INT_ID = 999_999_999
FAKE_LONG_ID = 9_999_999_999_999_999

results: list[dict[str, Any]] = []

# Điều kiện xóa mềm / ngưng hoạt động (bám theo mã Hotels/RoomTypes/Rooms/...Controller)
DELETE_CONDITIONS_MD = """
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
""".strip()


def unwrap_payload(j: Any) -> Any:
    if isinstance(j, dict) and "data" in j and "message" in j:
        return j["data"]
    return j


def extract_token(j: Any) -> str | None:
    d = unwrap_payload(j)
    if isinstance(d, dict):
        t = d.get("accessToken")
        if t:
            return t
    if isinstance(j, dict):
        t = j.get("accessToken")
        if t:
            return t
    return None


def first_id(rows: Any, *keys: str) -> Any:
    if not isinstance(rows, list) or not rows:
        return None
    row = rows[0]
    if not isinstance(row, dict):
        return None
    for k in keys:
        if k in row:
            return row[k]
    return None


def id_from_response(rec: dict[str, Any], *keys: str) -> Any:
    """Lấy id từ body JSON (hỗ trợ bọc { message, data })."""
    j = rec.get("response_json")
    if not isinstance(j, dict):
        return None
    inner = j.get("data", j)
    if isinstance(inner, dict):
        for k in keys:
            if k in inner:
                return inner[k]
    return None


def _redact_secrets(text: str, test_name: str) -> str:
    if "Login" not in test_name or "accessToken" not in text:
        return text
    try:
        o = json.loads(text)
        if isinstance(o, dict):
            d = o.get("data", o)
            if isinstance(d, dict) and "accessToken" in d:
                d["accessToken"] = "***REDACTED***"
        return json.dumps(o, ensure_ascii=False)
    except Exception:
        return "[response redacted: login token]"


def _redact_json_secrets(parsed: Any, test_name: str) -> Any:
    if parsed is None or "Login" not in test_name:
        return parsed
    if not isinstance(parsed, dict):
        return parsed
    out = json.loads(json.dumps(parsed, ensure_ascii=False))
    inner = out.get("data", out)
    if isinstance(inner, dict) and "accessToken" in inner:
        inner["accessToken"] = "***REDACTED***"
    return out


def truncate(s: str, max_len: int = 8000) -> str:
    s = s.strip()
    if len(s) > max_len:
        return s[: max_len - 20] + "\n... [truncated]"
    return s


def run_one(
    name: str,
    method: str,
    path: str,
    *,
    token: str | None = None,
    json_body: Any = None,
    params: dict | None = None,
) -> dict[str, Any]:
    url = BASE + path
    headers = {"Accept": "application/json"}
    if json_body is not None:
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    t0 = time.perf_counter()
    try:
        r = requests.request(
            method,
            url,
            headers=headers,
            json=json_body,
            params=params,
            timeout=60,
        )
        elapsed_ms = int((time.perf_counter() - t0) * 1000)
        text = r.text or ""
        body_preview = truncate(text)
        parsed: Any = None
        try:
            parsed = r.json()
        except Exception:
            parsed = None
        rec = {
            "name": name,
            "method": method,
            "url": url,
            "status_code": r.status_code,
            "elapsed_ms": elapsed_ms,
            "response_body_text": body_preview,
            "response_json": parsed,
            "error": None,
        }
    except requests.RequestException as e:
        rec = {
            "name": name,
            "method": method,
            "url": url,
            "status_code": None,
            "elapsed_ms": None,
            "response_body_text": "",
            "response_json": None,
            "error": str(e),
        }
    results.append(rec)
    return rec


def run_exhaustive_api_matrix(token: str, ctx: dict[str, Any]) -> None:
    """
    Bổ sung: mọi biến thể query (GET), GET by id 404, lỗi validation POST/PUT, 401.
    Không thể liệt kê vô hạn tổ hợp ngày/trạng thái; đây là bao phủ có chủ đích theo từng tham số API.
    """
    h = ctx["hotelId"]
    r = ctx["roomId"]
    rt = ctx["roomTypeId"]
    c = ctx["customerId"]
    b = ctx["bookingId"]
    st = ctx["stayId"]
    uid = ctx.get("userId", 1)

    def mg(label: str, path: str, params: dict | None = None) -> None:
        run_one(label, "GET", path, token=token, params=params)

    run_one("Matrix — 401 GET /api/hotels (không token)", "GET", "/api/hotels", token=None)
    run_one("Matrix — 401 GET /api/auth/me (không token)", "GET", "/api/auth/me", token=None)
    run_one(
        "Matrix — 401 POST /api/auth/login (sai mật khẩu)",
        "POST",
        "/api/auth/login",
        token=None,
        json_body={"username": USER, "password": "__wrong_password__"},
    )

    mg("Matrix GET /api/rooms — không query", "/api/rooms", {})
    mg("Matrix GET /api/rooms — roomNumber", "/api/rooms", {"roomNumber": "3"})
    mg("Matrix GET /api/rooms — statusCode=VACANT", "/api/rooms", {"statusCode": "VACANT"})
    mg("Matrix GET /api/rooms — roomTypeId", "/api/rooms", {"roomTypeId": rt})
    mg(
        "Matrix GET /api/rooms — roomTypeId + statusCode",
        "/api/rooms",
        {"roomTypeId": rt, "statusCode": "VACANT"},
    )

    mg("Matrix GET /api/roomtypes — hotelId", "/api/roomtypes", {"hotelId": h})
    mg("Matrix GET /api/roomtypes — hotelId không tồn tại", "/api/roomtypes", {"hotelId": 999_999})

    mg("Matrix GET /api/customers — search", "/api/customers", {"search": "Ng"})

    mg("Matrix GET /api/guests — search", "/api/guests", {"search": "a"})
    mg("Matrix GET /api/guests — idNumber", "/api/guests", {"idNumber": "0"})

    mg("Matrix GET /api/bookings — hotelId", "/api/bookings", {"hotelId": h})
    mg("Matrix GET /api/bookings — roomId", "/api/bookings", {"roomId": r})
    mg("Matrix GET /api/bookings — customerId", "/api/bookings", {"customerId": c})
    mg("Matrix GET /api/bookings — statusCode=CONFIRMED", "/api/bookings", {"statusCode": "CONFIRMED"})
    mg(
        "Matrix GET /api/bookings — checkInFrom/checkOutTo",
        "/api/bookings",
        {"checkInFrom": "2020-01-01", "checkOutTo": "2030-12-31"},
    )
    mg(
        "Matrix GET /api/bookings — checkInFrom+checkInTo",
        "/api/bookings",
        {"checkInFrom": "2026-01-01", "checkInTo": "2026-12-31"},
    )
    mg(
        "Matrix GET /api/bookings — checkOutFrom+checkOutTo",
        "/api/bookings",
        {"checkOutFrom": "2026-01-01", "checkOutTo": "2026-12-31"},
    )

    mg("Matrix GET /api/stays — reservationId", "/api/stays", {"reservationId": b})
    mg("Matrix GET /api/stays — roomId", "/api/stays", {"roomId": r})
    mg("Matrix GET /api/stays — hotelId", "/api/stays", {"hotelId": h})
    mg("Matrix GET /api/stays — statusCode=IN_HOUSE", "/api/stays", {"statusCode": "IN_HOUSE"})
    mg(
        "Matrix GET /api/stays — reservationId + statusCode",
        "/api/stays",
        {"reservationId": b, "statusCode": "IN_HOUSE"},
    )

    mg("Matrix GET /api/serviceorders — không query", "/api/serviceorders", {})
    mg("Matrix GET /api/serviceorders — stayId", "/api/serviceorders", {"stayId": st})
    mg("Matrix GET /api/serviceorders — reservationId", "/api/serviceorders", {"reservationId": b})
    mg(
        "Matrix GET /api/serviceorders — stayId + reservationId",
        "/api/serviceorders",
        {"stayId": st, "reservationId": b},
    )

    mg("Matrix GET /api/payments — không query", "/api/payments", {})
    mg("Matrix GET /api/payments — stayId", "/api/payments", {"stayId": st})
    mg("Matrix GET /api/payments — reservationId", "/api/payments", {"reservationId": b})
    mg("Matrix GET /api/payments — statusCode=PAID", "/api/payments", {"statusCode": "PAID"})
    mg(
        "Matrix GET /api/payments — reservationId + statusCode",
        "/api/payments",
        {"reservationId": b, "statusCode": "PAID"},
    )

    mg("Matrix GET /api/housekeepingtasks — không query", "/api/housekeepingtasks", {})
    mg("Matrix GET /api/housekeepingtasks — roomId", "/api/housekeepingtasks", {"roomId": r})
    mg("Matrix GET /api/housekeepingtasks — statusCode=OPEN", "/api/housekeepingtasks", {"statusCode": "OPEN"})
    mg(
        "Matrix GET /api/housekeepingtasks — roomId + statusCode",
        "/api/housekeepingtasks",
        {"roomId": r, "statusCode": "OPEN"},
    )
    mg(
        "Matrix GET /api/housekeepingtasks — assignedTo",
        "/api/housekeepingtasks",
        {"assignedTo": uid},
    )

    mg("Matrix GET /api/maintenancetickets — không query", "/api/maintenancetickets", {})
    mg("Matrix GET /api/maintenancetickets — roomId", "/api/maintenancetickets", {"roomId": r})
    mg(
        "Matrix GET /api/maintenancetickets — statusCode=OPEN",
        "/api/maintenancetickets",
        {"statusCode": "OPEN"},
    )
    mg(
        "Matrix GET /api/maintenancetickets — assignedTo",
        "/api/maintenancetickets",
        {"assignedTo": uid},
    )

    mg("Matrix GET /api/hotelservices — không query", "/api/hotelservices", {})
    mg("Matrix GET /api/hotelservices — hotelId", "/api/hotelservices", {"hotelId": h})
    mg(
        "Matrix GET /api/hotelservices — hotelId + includeInactive=true",
        "/api/hotelservices",
        {"hotelId": h, "includeInactive": "true"},
    )

    mg("Matrix GET /api/auditlogs — action=API", "/api/auditlogs", {"action": "API", "take": 10})
    mg(
        "Matrix GET /api/auditlogs — entityName=Endpoint",
        "/api/auditlogs",
        {"entityName": "Endpoint", "take": 10},
    )
    mg("Matrix GET /api/auditlogs — take=1", "/api/auditlogs", {"take": 1})
    mg("Matrix GET /api/auditlogs — take=500 (max)", "/api/auditlogs", {"take": 500})

    mg("Matrix GET /api/roles — includeInactive=true", "/api/roles", {"includeInactive": "true"})

    # GET by id — 404
    run_one("Matrix 404 GET /api/hotels/{id}", "GET", f"/api/hotels/{FAKE_INT_ID}", token=token)
    run_one("Matrix 404 GET /api/roomtypes/{id}", "GET", f"/api/roomtypes/{FAKE_INT_ID}", token=token)
    run_one("Matrix 404 GET /api/rooms/{id}", "GET", f"/api/rooms/{FAKE_INT_ID}", token=token)
    run_one("Matrix 404 GET /api/customers/{id}", "GET", f"/api/customers/{FAKE_LONG_ID}", token=token)
    run_one("Matrix 404 GET /api/guests/{id}", "GET", f"/api/guests/{FAKE_LONG_ID}", token=token)
    run_one("Matrix 404 GET /api/bookings/{id}", "GET", f"/api/bookings/{FAKE_LONG_ID}", token=token)
    run_one("Matrix 404 GET /api/stays/{id}", "GET", f"/api/stays/{FAKE_LONG_ID}", token=token)
    run_one("Matrix 404 GET /api/invoices/{id}", "GET", f"/api/invoices/{FAKE_INT_ID}", token=token)
    run_one("Matrix 404 GET /api/payments/{id}", "GET", f"/api/payments/{FAKE_LONG_ID}", token=token)
    run_one("Matrix 404 GET /api/hotelservices/{id}", "GET", f"/api/hotelservices/{FAKE_INT_ID}", token=token)
    run_one(
        "Matrix 404 GET /api/housekeepingtasks/{id}",
        "GET",
        f"/api/housekeepingtasks/{FAKE_LONG_ID}",
        token=token,
    )
    run_one(
        "Matrix 404 GET /api/maintenancetickets/{id}",
        "GET",
        f"/api/maintenancetickets/{FAKE_LONG_ID}",
        token=token,
    )
    run_one("Matrix 404 GET /api/users/{id}", "GET", f"/api/users/{FAKE_INT_ID}", token=token)

    # PUT / POST — validation & nghiệp vụ lỗi tiêu biểu
    run_one(
        "Matrix 400 POST /api/serviceorders — cả stayId và reservationId",
        "POST",
        "/api/serviceorders",
        token=token,
        json_body={
            "stayId": st,
            "reservationId": b,
            "serviceCode": "OTHER",
            "quantity": 1,
            "unitPrice": 1000,
        },
    )
    run_one(
        "Matrix 400 POST /api/serviceorders — không stayId/reservationId",
        "POST",
        "/api/serviceorders",
        token=token,
        json_body={"serviceCode": "OTHER", "quantity": 1, "unitPrice": 1000},
    )
    run_one(
        "Matrix 404 PUT /api/serviceorders/{id}/cancel",
        "PUT",
        f"/api/serviceorders/{FAKE_LONG_ID}/cancel",
        token=token,
        json_body={"reason": "matrix"},
    )

    run_one(
        "Matrix 400 POST /api/payments — cả stayId và reservationId",
        "POST",
        "/api/payments",
        token=token,
        json_body={
            "stayId": st,
            "reservationId": b,
            "paymentType": "CHARGE",
            "methodCode": "CASH",
            "amount": 1000,
        },
    )
    run_one(
        "Matrix 400 POST /api/payments — không stayId/reservationId",
        "POST",
        "/api/payments",
        token=token,
        json_body={"paymentType": "CHARGE", "methodCode": "CASH", "amount": 1000},
    )
    run_one(
        "Matrix 400 POST /api/payments — stayId không tồn tại",
        "POST",
        "/api/payments",
        token=token,
        json_body={
            "stayId": FAKE_LONG_ID,
            "paymentType": "CHARGE",
            "methodCode": "CASH",
            "amount": 1000,
        },
    )
    run_one(
        "Matrix 400 POST /api/payments — reservationId không tồn tại",
        "POST",
        "/api/payments",
        token=token,
        json_body={
            "reservationId": FAKE_LONG_ID,
            "paymentType": "CHARGE",
            "methodCode": "CASH",
            "amount": 1000,
        },
    )

    run_one(
        "Matrix 404 PUT /api/payments/{id}/void",
        "PUT",
        f"/api/payments/{FAKE_LONG_ID}/void",
        token=token,
    )

    run_one(
        "Matrix 404 PUT /api/bookings/{id}/check-in",
        "PUT",
        f"/api/bookings/{FAKE_LONG_ID}/check-in",
        token=token,
    )
    run_one(
        "Matrix 404 PUT /api/bookings/{id}/check-out",
        "PUT",
        f"/api/bookings/{FAKE_LONG_ID}/check-out",
        token=token,
    )
    run_one(
        "Matrix 404 PUT /api/bookings/{id}/cancel",
        "PUT",
        f"/api/bookings/{FAKE_LONG_ID}/cancel",
        token=token,
    )

    run_one(
        "Matrix 404 PUT /api/users/{id}/status",
        "PUT",
        f"/api/users/{FAKE_INT_ID}/status",
        token=token,
        json_body={"isActive": False},
    )
    run_one(
        "Matrix 404 PUT /api/users/{id}/roles",
        "PUT",
        f"/api/users/{FAKE_INT_ID}/roles",
        token=token,
        json_body={"roleCodes": ["RECEPTION"]},
    )

    run_one("Matrix 404 DELETE /api/rooms/{id}", "DELETE", f"/api/rooms/{FAKE_INT_ID}", token=token)
    run_one(
        "Matrix 404 DELETE /api/roomtypes/{id}",
        "DELETE",
        f"/api/roomtypes/{FAKE_INT_ID}",
        token=token,
    )
    run_one("Matrix 404 DELETE /api/hotels/{id}", "DELETE", f"/api/hotels/{FAKE_INT_ID}", token=token)

    run_one(
        "Matrix 404 POST /api/customers/{id}/loyalty/adjust",
        "POST",
        f"/api/customers/{FAKE_LONG_ID}/loyalty/adjust",
        token=token,
        json_body={"pointsDelta": 1, "reason": "matrix"},
    )
    run_one(
        "Matrix 404 PUT /api/roles/{id}",
        "PUT",
        f"/api/roles/{FAKE_INT_ID}",
        token=token,
        json_body={"roleCode": "X", "roleName": "Y", "isActive": True},
    )


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass
    print(f"Base URL: {BASE}")
    print(f"Exhaustive matrix: {EXHAUSTIVE} (API_TEST_EXHAUSTIVE)")
    # Login
    run_one(
        "Auth — Login",
        "POST",
        "/api/auth/login",
        token=None,
        json_body={"username": USER, "password": PASSWORD},
    )
    login_rec = results[-1]
    if login_rec.get("error") or login_rec.get("status_code") != 200:
        print("LOGIN FAILED — không test tiếp được. Kiểm tra API đã chạy chưa.", file=sys.stderr)
        write_outputs({})
        return 1
    token = extract_token(login_rec.get("response_json"))
    if not token:
        print("Không đọc được accessToken từ login.", file=sys.stderr)
        write_outputs({})
        return 1

    ctx: dict[str, Any] = {}

    def get_json(path: str, params=None) -> Any:
        r = requests.get(
            BASE + path,
            headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
            params=params,
            timeout=60,
        )
        try:
            return r.json()
        except Exception:
            return None

    # Discovery
    hotels = unwrap_payload(get_json("/api/hotels"))
    ctx["hotelId"] = first_id(hotels, "hotelId") or 1
    roomtypes = unwrap_payload(
        get_json("/api/roomtypes", params={"hotelId": ctx["hotelId"]})
    )
    ctx["roomTypeId"] = first_id(roomtypes, "roomTypeId") or 1
    rooms = unwrap_payload(get_json("/api/rooms"))
    ctx["roomId"] = first_id(rooms, "roomId") or 1
    room_one = unwrap_payload(get_json(f"/api/rooms/{ctx['roomId']}"))
    if isinstance(room_one, dict):
        ctx["roomNumberKeep"] = room_one.get("roomNumber") or "101"
        ctx["roomFloorKeep"] = room_one.get("floor") or "1"
        ctx["roomTypeIdFromRoom"] = room_one.get("roomTypeId") or ctx["roomTypeId"]
    else:
        ctx["roomNumberKeep"] = "101"
        ctx["roomFloorKeep"] = "1"
        ctx["roomTypeIdFromRoom"] = ctx["roomTypeId"]
    customers = unwrap_payload(get_json("/api/customers"))
    ctx["customerId"] = first_id(customers, "customerId") or 1
    bookings = unwrap_payload(get_json("/api/bookings"))
    ctx["bookingId"] = first_id(bookings, "reservationId") or 1
    for b in bookings or []:
        if isinstance(b, dict) and b.get("statusCode") == "CONFIRMED":
            ctx["bookingConfirmedId"] = b.get("reservationId")
            break
    else:
        ctx["bookingConfirmedId"] = ctx["bookingId"]
    for b in bookings or []:
        if isinstance(b, dict) and b.get("statusCode") == "CHECKED_IN":
            ctx["bookingCheckedInId"] = b.get("reservationId")
            break
    ctx.setdefault("bookingCheckedInId", ctx["bookingId"])
    stays = unwrap_payload(get_json("/api/stays"))
    ctx["stayId"] = first_id(stays, "stayId") or 1
    invoices = unwrap_payload(get_json("/api/invoices"))
    ctx["invoiceId"] = first_id(invoices, "id", "Id") or 1
    payments = unwrap_payload(get_json("/api/payments"))
    ctx["paymentId"] = first_id(payments, "paymentId") or 1
    guests = unwrap_payload(get_json("/api/guests"))
    ctx["guestId"] = first_id(guests, "guestId") or 1
    htasks = unwrap_payload(get_json("/api/housekeepingtasks"))
    ctx["taskId"] = first_id(htasks, "taskId") or 1
    mtickets = unwrap_payload(get_json("/api/maintenancetickets"))
    ctx["ticketId"] = first_id(mtickets, "ticketId") or 1
    hservices = unwrap_payload(get_json("/api/hotelservices"))
    ctx["hotelServiceId"] = first_id(hservices, "hotelServiceId") or 1
    users = unwrap_payload(get_json("/api/users"))
    ctx["userId"] = first_id(users, "userId") or 1
    role_rows = unwrap_payload(get_json("/api/roles"))
    role_rows = role_rows if isinstance(role_rows, list) else []
    ctx["roleId"] = first_id(role_rows, "roleId") or 1
    first_role = role_rows[0] if role_rows and isinstance(role_rows[0], dict) else {}
    sorders = unwrap_payload(get_json("/api/serviceorders", params={"stayId": ctx["stayId"]}))
    ctx["serviceOrderId"] = first_id(sorders, "serviceOrderId") or 1

    # --- Còn lại: gọi theo danh sách (một số đã có login) ---
    tests: list[tuple[str, str, str, dict | None, Any]] = [
        ("Auth — Me", "GET", "/api/auth/me", None, None),
        ("Auth — Logout", "POST", "/api/auth/logout", None, None),
        ("Hotels — List", "GET", "/api/hotels", None, None),
        ("Hotels — ById", "GET", f"/api/hotels/{ctx['hotelId']}", None, None),
        (
            "Hotels — Create (tên unique)",
            "POST",
            "/api/hotels",
            None,
            {
                "hotelName": f"API-Test-{int(time.time())}",
                "address": "Test",
                "phone": "0900000000",
                "email": f"test{int(time.time())}@t.local",
                "isActive": True,
            },
        ),
        (
            "Hotels — Update",
            "PUT",
            f"/api/hotels/{ctx['hotelId']}",
            None,
            {
                "hotelName": f"Hotel {ctx['hotelId']} (api-test touch)",
                "address": "Q1",
                "phone": "0900111222",
                "email": "touch@t.local",
                "isActive": True,
            },
        ),
        ("RoomTypes — List", "GET", "/api/roomtypes", {"hotelId": ctx["hotelId"]}, None),
        ("RoomTypes — ById", "GET", f"/api/roomtypes/{ctx['roomTypeId']}", None, None),
        (
            "RoomTypes — Create",
            "POST",
            "/api/roomtypes",
            None,
            {
                "hotelId": ctx["hotelId"],
                "roomTypeName": f"RT-Test-{int(time.time())}",
                "capacity": 2,
                "baseRate": 500000,
                "description": "api test",
                "isActive": True,
            },
        ),
        (
            "RoomTypes — Update",
            "PUT",
            f"/api/roomtypes/{ctx['roomTypeId']}",
            None,
            {
                "roomTypeName": f"RT-Updated-{ctx['roomTypeId']}",
                "capacity": 2,
                "baseRate": 550000,
                "description": "updated",
                "isActive": True,
            },
        ),
        ("Rooms — List", "GET", "/api/rooms", None, None),
        ("Rooms — ById", "GET", f"/api/rooms/{ctx['roomId']}", None, None),
        (
            "Rooms — Create (số phòng unique)",
            "POST",
            "/api/rooms",
            None,
            {
                "hotelId": ctx["hotelId"],
                "roomTypeId": ctx["roomTypeId"],
                "roomNumber": f"T{int(time.time()) % 100000}",
                "floor": "9",
                "statusCode": "VACANT",
            },
        ),
        (
            "Rooms — Update (giữ số phòng hiện tại)",
            "PUT",
            f"/api/rooms/{ctx['roomId']}",
            None,
            {
                "roomTypeId": ctx["roomTypeIdFromRoom"],
                "roomNumber": ctx["roomNumberKeep"],
                "floor": ctx["roomFloorKeep"],
                "statusCode": "VACANT",
            },
        ),
        ("Customers — List", "GET", "/api/customers", None, None),
        ("Customers — ById", "GET", f"/api/customers/{ctx['customerId']}", None, None),
        ("Customers — Loyalty", "GET", f"/api/customers/{ctx['customerId']}/loyalty", None, None),
        (
            "Customers — Loyalty adjust",
            "POST",
            f"/api/customers/{ctx['customerId']}/loyalty/adjust",
            None,
            {"pointsDelta": 1, "reason": "api test"},
        ),
        (
            "Customers — Create",
            "POST",
            "/api/customers",
            None,
            {
                "customerType": "INDIVIDUAL",
                "fullName": f"KhachTest {int(time.time())}",
                "phone": "0900999888",
            },
        ),
        (
            "Customers — Update",
            "PUT",
            f"/api/customers/{ctx['customerId']}",
            None,
            {
                "customerType": "INDIVIDUAL",
                "fullName": "Khach cap nhat API test",
                "phone": "0900888777",
            },
        ),
        ("Guests — List", "GET", "/api/guests", None, None),
        ("Guests — ById", "GET", f"/api/guests/{ctx['guestId']}", None, None),
        (
            "Guests — Create",
            "POST",
            "/api/guests",
            None,
            {"fullName": f"Guest {int(time.time())}", "phone": "0912345678"},
        ),
        (
            "Guests — Update",
            "PUT",
            f"/api/guests/{ctx['guestId']}",
            None,
            {"fullName": "Guest updated", "phone": "0912000111"},
        ),
        ("Bookings — List", "GET", "/api/bookings", None, None),
        ("Bookings — ById", "GET", f"/api/bookings/{ctx['bookingId']}", None, None),
        (
            "Bookings — Create",
            "POST",
            "/api/bookings",
            None,
            {
                "roomId": ctx["roomId"],
                "customerId": ctx["customerId"],
                "checkInDate": "2026-12-01",
                "checkOutDate": "2026-12-03",
                "adults": 1,
                "children": 0,
            },
        ),
        (
            "Bookings — Check-in",
            "PUT",
            f"/api/bookings/{ctx['bookingConfirmedId']}/check-in",
            None,
            None,
        ),
        (
            "Bookings — Check-out",
            "PUT",
            f"/api/bookings/{ctx['bookingCheckedInId']}/check-out",
            None,
            None,
        ),
        ("Stays — List", "GET", "/api/stays", None, None),
        ("Stays — ById", "GET", f"/api/stays/{ctx['stayId']}", None, None),
        ("HotelServices — List", "GET", "/api/hotelservices", None, None),
        ("HotelServices — ById", "GET", f"/api/hotelservices/{ctx['hotelServiceId']}", None, None),
        (
            "HotelServices — Create",
            "POST",
            "/api/hotelservices",
            None,
            {
                "hotelId": ctx["hotelId"],
                "serviceCode": f"TST{int(time.time()) % 10000}",
                "serviceName": "Test service",
                "defaultUnitPrice": 10000,
                "isActive": True,
            },
        ),
        (
            "HotelServices — Update",
            "PUT",
            f"/api/hotelservices/{ctx['hotelServiceId']}",
            None,
            {
                "serviceName": "Updated svc",
                "defaultUnitPrice": 12000,
                "isActive": True,
            },
        ),
        ("ServiceOrders — List", "GET", "/api/serviceorders", {"stayId": ctx["stayId"]}, None),
        (
            "ServiceOrders — Create",
            "POST",
            "/api/serviceorders",
            None,
            {
                "stayId": ctx["stayId"],
                "serviceCode": "OTHER",
                "description": "api test",
                "quantity": 1,
                "unitPrice": 50000,
            },
        ),
        (
            "ServiceOrders — Cancel",
            "PUT",
            f"/api/serviceorders/{ctx['serviceOrderId']}/cancel",
            None,
            {"reason": "api test cancel"},
        ),
        ("Invoices — List", "GET", "/api/invoices", None, None),
        ("Invoices — ById", "GET", f"/api/invoices/{ctx['invoiceId']}", None, None),
        (
            "Invoices — Create",
            "POST",
            "/api/invoices",
            None,
            {
                "bookingId": ctx["bookingId"],
                "paymentMethod": "CASH",
                "note": "api test",
            },
        ),
        ("Payments — List", "GET", "/api/payments", None, None),
        ("Payments — ById", "GET", f"/api/payments/{ctx['paymentId']}", None, None),
        (
            "Payments — Create",
            "POST",
            "/api/payments",
            None,
            {
                "reservationId": ctx["bookingId"],
                "paymentType": "CHARGE",
                "methodCode": "CASH",
                "amount": 100000,
                "note": "api test",
            },
        ),
        (
            "Payments — Void",
            "PUT",
            f"/api/payments/{ctx['paymentId']}/void",
            None,
            None,
        ),
        ("Housekeeping — List", "GET", "/api/housekeepingtasks", None, None),
        ("Housekeeping — ById", "GET", f"/api/housekeepingtasks/{ctx['taskId']}", None, None),
        (
            "Housekeeping — Create",
            "POST",
            "/api/housekeepingtasks",
            None,
            {
                "roomId": ctx["roomId"],
                "statusCode": "OPEN",
                "note": "api test",
            },
        ),
        (
            "Housekeeping — Update",
            "PUT",
            f"/api/housekeepingtasks/{ctx['taskId']}",
            None,
            {"statusCode": "IN_PROGRESS", "note": "progress"},
        ),
        ("Maintenance — List", "GET", "/api/maintenancetickets", None, None),
        ("Maintenance — ById", "GET", f"/api/maintenancetickets/{ctx['ticketId']}", None, None),
        (
            "Maintenance — Create",
            "POST",
            "/api/maintenancetickets",
            None,
            {
                "roomId": ctx["roomId"],
                "title": f"Ticket {int(time.time())}",
                "description": "api test",
                "statusCode": "OPEN",
            },
        ),
        (
            "Maintenance — Update",
            "PUT",
            f"/api/maintenancetickets/{ctx['ticketId']}",
            None,
            {
                "title": "Updated ticket",
                "description": "upd",
                "statusCode": "IN_PROGRESS",
            },
        ),
        ("Reports — Dashboard", "GET", "/api/reports/dashboard", None, None),
        ("AuditLogs — List", "GET", "/api/auditlogs", {"take": 20}, None),
        ("Users — List", "GET", "/api/users", None, None),
        (
            "Users — Create",
            "POST",
            "/api/users",
            None,
            {
                "username": f"apitest{int(time.time()) % 100000}",
                "password": "123456",
                "fullName": "Api Test User",
                "isActive": True,
                "roleCode": "RECEPTION",
            },
        ),
        (
            "Users — Update",
            "PUT",
            f"/api/users/{ctx['userId']}",
            None,
            {"fullName": "Admin touched by api test"},
        ),
        (
            "Users — Status",
            "PUT",
            f"/api/users/{ctx['userId']}/status",
            None,
            {"isActive": True},
        ),
        ("Roles — List", "GET", "/api/roles", None, None),
        (
            "Roles — Create",
            "POST",
            "/api/roles",
            None,
            {
                "roleCode": f"RT{int(time.time()) % 100000}",
                "roleName": "Role test",
                "isActive": True,
            },
        ),
        (
            "Roles — Update",
            "PUT",
            f"/api/roles/{ctx['roleId']}",
            None,
            {
                "roleCode": first_role.get("roleCode", "ADMIN"),
                "roleName": first_role.get("roleName", "Administrator"),
                "isActive": True,
            },
        ),
    ]

    for name, method, path, params, body in tests:
        run_one(name, method, path, token=token, json_body=body, params=params)

    if EXHAUSTIVE:
        run_exhaustive_api_matrix(token, ctx)

    # --- Điều kiện xóa: DELETE bị chặn (thường mong đợi 400) ---
    run_one(
        "Delete rules — Hotel blocked (còn phòng/loại phòng active)",
        "DELETE",
        f"/api/hotels/{ctx['hotelId']}",
        token=token,
    )
    run_one(
        "Delete rules — RoomType blocked (còn phòng active gán loại này)",
        "DELETE",
        f"/api/roomtypes/{ctx['roomTypeId']}",
        token=token,
    )

    # --- Chuỗi hợp lệ: KS mới → loại phòng → phòng → xóa room → roomtype → hotel ---
    ts = int(time.time())
    run_one(
        "Delete chain — Create hotel",
        "POST",
        "/api/hotels",
        token=token,
        json_body={
            "hotelName": f"DelChain-Hotel-{ts}",
            "address": "API delete chain",
            "phone": "0900000000",
            "email": f"delchain{ts}@test.local",
            "isActive": True,
        },
    )
    chain_hotel = None
    if results[-1].get("status_code") == 200:
        chain_hotel = id_from_response(results[-1], "hotelId")
    chain_rt = None
    chain_room = None
    if chain_hotel:
        run_one(
            "Delete chain — Create roomType",
            "POST",
            "/api/roomtypes",
            token=token,
            json_body={
                "hotelId": chain_hotel,
                "roomTypeName": f"DelChain-RT-{ts}",
                "capacity": 2,
                "baseRate": 400000,
                "description": "for delete",
                "isActive": True,
            },
        )
        if results[-1].get("status_code") == 200:
            chain_rt = id_from_response(results[-1], "roomTypeId")
    if chain_hotel and chain_rt:
        run_one(
            "Delete chain — Create room",
            "POST",
            "/api/rooms",
            token=token,
            json_body={
                "hotelId": chain_hotel,
                "roomTypeId": chain_rt,
                "roomNumber": f"DC{ts % 100000}",
                "floor": "9",
                "statusCode": "VACANT",
            },
        )
        if results[-1].get("status_code") == 200:
            chain_room = id_from_response(results[-1], "roomId")
    if chain_room:
        run_one(
            "Delete chain — DELETE room (OK)",
            "DELETE",
            f"/api/rooms/{chain_room}",
            token=token,
        )
    if chain_rt:
        run_one(
            "Delete chain — DELETE roomType (OK)",
            "DELETE",
            f"/api/roomtypes/{chain_rt}",
            token=token,
        )
    if chain_hotel:
        run_one(
            "Delete chain — DELETE hotel (OK)",
            "DELETE",
            f"/api/hotels/{chain_hotel}",
            token=token,
        )

    # --- Cleanup / bổ sung theo id vừa tạo ---
    for r in results:
        if r.get("name") == "Bookings — Create" and r.get("status_code") == 200:
            bid = id_from_response(r, "reservationId")
            if bid:
                run_one(
                    "Bookings — Cancel (đơn vừa tạo)",
                    "PUT",
                    f"/api/bookings/{bid}/cancel",
                    token=token,
                )
            break

    for r in results:
        if r.get("name") == "Guests — Create" and r.get("status_code") == 200:
            gid = id_from_response(r, "guestId")
            if gid:
                run_one(
                    "Guests — Delete (cleanup)",
                    "DELETE",
                    f"/api/guests/{gid}",
                    token=token,
                )
            break

    for r in results:
        if r.get("name") == "Customers — Create" and r.get("status_code") == 200:
            cid = id_from_response(r, "customerId")
            if cid:
                run_one(
                    "Customers — Delete (cleanup)",
                    "DELETE",
                    f"/api/customers/{cid}",
                    token=token,
                )
            break

    new_uid = None
    for r in results:
        if r.get("name") == "Users — Create" and r.get("status_code") == 200:
            new_uid = id_from_response(r, "userId")
            break
    if new_uid:
        run_one(
            "Users — Set roles (user vừa tạo)",
            "PUT",
            f"/api/users/{new_uid}/roles",
            token=token,
            json_body={"roleCodes": ["RECEPTION"]},
        )

    new_task_id = None
    for r in results:
        if r.get("name") == "Housekeeping — Create" and r.get("status_code") == 200:
            new_task_id = id_from_response(r, "taskId")
            break
    if new_task_id:
        run_one(
            "Housekeeping — Update (task vừa tạo)",
            "PUT",
            f"/api/housekeepingtasks/{new_task_id}",
            token=token,
            json_body={"statusCode": "IN_PROGRESS", "note": "cleanup chain"},
        )
        run_one(
            "Housekeeping — Delete (cleanup)",
            "DELETE",
            f"/api/housekeepingtasks/{new_task_id}",
            token=token,
        )

    new_ticket_id = None
    for r in results:
        if r.get("name") == "Maintenance — Create" and r.get("status_code") == 200:
            new_ticket_id = id_from_response(r, "ticketId")
            break
    if new_ticket_id:
        run_one(
            "Maintenance — Update (ticket vừa tạo)",
            "PUT",
            f"/api/maintenancetickets/{new_ticket_id}",
            token=token,
            json_body={
                "title": "Updated after create",
                "description": "cleanup",
                "statusCode": "IN_PROGRESS",
            },
        )
        run_one(
            "Maintenance — Delete (cleanup)",
            "DELETE",
            f"/api/maintenancetickets/{new_ticket_id}",
            token=token,
        )

    write_outputs(ctx)
    ok = sum(1 for r in results if r.get("status_code") and 200 <= r["status_code"] < 300)
    print(f"Hoàn tất: {ok}/{len(results)} request trả mã 2xx (một số 4xx là bình thường tùy dữ liệu).")
    print(f"Markdown: {MD_OUT}")
    print(f"JSON:     {JSON_OUT}")
    return 0


def _export_row(r: dict[str, Any]) -> dict[str, Any]:
    """Bản ghi an toàn khi ghi file (ẩn JWT login)."""
    name = r.get("name") or ""
    out = {**r}
    out["response_body_text"] = _redact_secrets(str(r.get("response_body_text") or ""), name)
    out["response_json"] = _redact_json_secrets(r.get("response_json"), name)
    return out


def write_outputs(ctx: dict | None = None) -> None:
    ctx = ctx or {}
    when = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    export_rows = [_export_row(r) for r in results]
    ex_note = (
        "Bật (`API_TEST_EXHAUSTIVE=1`, mặc định): thêm ma trận GET (mọi query), GET 404, POST/PUT lỗi 400/404, 401."
        if EXHAUSTIVE
        else "Tắt ma trận (`API_TEST_EXHAUSTIVE=0`) — chỉ luồng chính + delete chain."
    )
    lines = [
        f"# Kết quả test API — Hotel Management",
        "",
        f"- **Thời điểm:** {when}",
        f"- **Base URL:** `{BASE}`",
        f"- **User test:** `{USER}`",
        f"- **Chế độ:** {ex_note}",
        "",
        DELETE_CONDITIONS_MD,
        "",
        "## Context (ID discovery)",
        "",
        "```json",
        json.dumps(ctx, ensure_ascii=False, indent=2),
        "```",
        "",
        "## Từng request",
        "",
    ]
    for r in export_rows:
        lines.append(f"### {r['name']}")
        lines.append("")
        lines.append(f"- **Method:** `{r['method']}`")
        lines.append(f"- **URL:** `{r['url']}`")
        sc = r.get("status_code")
        lines.append(f"- **HTTP:** `{sc}`" if sc is not None else "- **HTTP:** *(lỗi kết nối)*")
        if r.get("elapsed_ms") is not None:
            lines.append(f"- **Thời gian:** {r['elapsed_ms']} ms")
        if r.get("error"):
            lines.append(f"- **Lỗi:** `{r['error']}`")
        lines.append("")
        lines.append("**Response (text / JSON):**")
        lines.append("")
        lines.append("```")
        lines.append(r.get("response_body_text") or "(empty)")
        lines.append("```")
        lines.append("")
        lines.append("---")
        lines.append("")

    MD_OUT.write_text("\n".join(lines), encoding="utf-8")

    JSON_OUT.write_text(
        json.dumps(
            {
                "generatedAtUtc": when,
                "baseUrl": BASE,
                "testUser": USER,
                "exhaustiveMatrix": EXHAUSTIVE,
                "deleteConditionsMarkdown": DELETE_CONDITIONS_MD,
                "discovery": ctx,
                "results": export_rows,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )


if __name__ == "__main__":
    raise SystemExit(main())
