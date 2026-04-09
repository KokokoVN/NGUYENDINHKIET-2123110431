# -*- coding: utf-8 -*-
"""
Gọi lần lượt các API HotelManagement, ghi kết quả ra file Markdown + JSON.
Yêu cầu: pip install requests
Chạy API: dotnet run --project HotelManagement.Api (mặc định http://localhost:5066)
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

results: list[dict[str, Any]] = []


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


def main() -> int:
    print(f"Base URL: {BASE}")
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
        (
            "Bookings — Cancel",
            "PUT",
            f"/api/bookings/{ctx['bookingConfirmedId']}/cancel",
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
            {"fullName": "Admin touched by api test", "email": None, "phone": None},
        ),
        (
            "Users — Status",
            "PUT",
            f"/api/users/{ctx['userId']}/status",
            None,
            {"isActive": True},
        ),
        (
            "Users — Set roles",
            "PUT",
            f"/api/users/{ctx['userId']}/roles",
            None,
            {"roleCodes": ["ADMIN"]},
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
                "roleCode": roles[0]["roleCode"] if roles and isinstance(roles[0], dict) else "ADMIN",
                "roleName": roles[0].get("roleName", "Admin") if roles and isinstance(roles[0], dict) else "Admin",
                "isActive": True,
            },
        ),
    ]

    for name, method, path, params, body in tests:
        run_one(name, method, path, token=token, json_body=body, params=params)

    write_outputs(ctx)
    ok = sum(1 for r in results if r.get("status_code") and 200 <= r["status_code"] < 300)
    print(f"Hoàn tất: {ok}/{len(results)} request trả mã 2xx (một số 4xx là bình thường tùy dữ liệu).")
    print(f"Markdown: {MD_OUT}")
    print(f"JSON:     {JSON_OUT}")
    return 0


def write_outputs(ctx: dict | None = None) -> None:
    ctx = ctx or {}
    when = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    lines = [
        f"# Kết quả test API — Hotel Management",
        "",
        f"- **Thời điểm:** {when}",
        f"- **Base URL:** `{BASE}`",
        f"- **User test:** `{USER}`",
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
    for r in results:
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
                "discovery": ctx,
                "results": results,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )


if __name__ == "__main__":
    raise SystemExit(main())
