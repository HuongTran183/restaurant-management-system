# Manual Test Checklist — WebSocket, KDS, Auth-Gated Reservation & Auto-Cancel

> **Phiên kiểm thử thủ công trên UI** cho 4 tính năng mới.  
> Chuẩn bị: Backend đang chạy (`mvnw spring-boot:run`), Frontend dev server (`npm run dev`), MySQL sẵn sàng.  
> Tài khoản mặc định (Demo Bootstrap): `admin/admin123`, `waiter1/waiter123`, `customer1/customer123`.

---

## Mục lục

1. [Feature 1 — Auth-Gated Reservation (CUSTOMER only)](#feature-1--auth-gated-reservation-customer-only)
2. [Feature 2 — Auto-Cancel Reservation sau 15 phút](#feature-2--auto-cancel-reservation-sau-15-phút)
3. [Feature 3 — WebSocket Real-Time Updates](#feature-3--websocket-real-time-updates)
4. [Feature 4 — Kitchen Display System (KDS)](#feature-4--kitchen-display-system-kds)
5. [Regression Checks](#regression-checks)

---

## Feature 1 — Auth-Gated Reservation (CUSTOMER only)

Mục tiêu: Hệ thống có **2 luồng** tạo reservation:
- **Public** (`POST /api/public/reservations`): Chỉ `CUSTOMER` — `@PreAuthorize("hasRole('CUSTOMER')")`
- **Staff** (`POST /api/reservations`): Chỉ `ADMIN/MANAGER/WAITER` — `@PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAITER')")`

### Preconditions
- Có tài khoản CUSTOMER (ví dụ: `customer1/customer123`)
- Có tài khoản ADMIN hoặc WAITER (ví dụ: `admin/admin123`, `waiter1/waiter123`)

### Test Cases

| # | Mô tả | Bước thực hiện | Kết quả mong đợi | Pass? |
|---|--------|----------------|-------------------|-------|
| 1.1 | CUSTOMER tạo reservation qua public endpoint | 1. Đăng nhập bằng `customer1/customer123`<br>2. Vào trang Reservation (/book)<br>3. Điền thông tin (ngày, giờ, số khách)<br>4. Nhấn "Đặt bàn" | `POST /api/public/reservations` → 200, trạng thái PENDING | ☐ |
| 1.2 | ADMIN bị từ chối trên public endpoint | 1. Đăng nhập bằng `admin/admin123`<br>2. Gọi API `POST /api/public/reservations` (Postman)<br>3. Gửi body hợp lệ | Response `403 Forbidden` (không có role CUSTOMER) | ☐ |
| 1.3 | WAITER bị từ chối trên public endpoint | 1. Đăng nhập bằng `waiter1/waiter123`<br>2. Gọi API `POST /api/public/reservations`<br>3. Gửi body hợp lệ | Response `403 Forbidden` | ☐ |
| 1.4 | Unauthenticated user bị từ chối | 1. Không đăng nhập (không có token)<br>2. Gọi API `POST /api/public/reservations` | Response `401 Unauthorized` | ☐ |
| 1.5 | Staff tạo reservation qua staff endpoint | 1. Đăng nhập `admin/admin123`<br>2. Vào Staff Dashboard → New Reservation<br>3. Điền thông tin, nhấn Create | `POST /api/reservations` → 200, tạo thành công | ☐ |
| 1.6 | CUSTOMER bị từ chối trên staff endpoint | 1. Đăng nhập `customer1/customer123`<br>2. Gọi API `POST /api/reservations` (Postman) | Response `403 Forbidden` | ☐ |
| 1.7 | Staff xem/confirm/cancel reservation | 1. Đăng nhập `admin/admin123`<br>2. `GET /api/reservations` — xem danh sách<br>3. `POST /api/reservations/{id}/confirm` — confirm | 200 OK cho cả hai | ☐ |

---

## Feature 2 — Auto-Cancel Reservation sau 15 phút

Mục tiêu: Reservation trạng thái CONFIRMED mà quá giờ đặt bàn 15 phút sẽ tự động bị cancel.

### Preconditions
- Tạo một reservation với thời gian đặt bàn **trong quá khứ** (15+ phút trước) hoặc đợi 15 phút.
- Scheduler chạy mỗi 60 giây.

### Test Cases

| # | Mô tả | Bước thực hiện | Kết quả mong đợi | Pass? |
|---|--------|----------------|-------------------|-------|
| 2.1 | Reservation CONFIRMED quá hạn bị auto-cancel | 1. Tạo reservation với `reservationTime` = now - 20 phút (qua API/DB)<br>2. Confirm reservation (`POST .../confirm`)<br>3. Đợi tối đa 60s cho scheduler chạy<br>4. Kiểm tra trạng thái reservation | Trạng thái = `CANCELLED`, lý do auto-cancel | ☐ |
| 2.2 | Reservation PENDING không bị auto-cancel | 1. Tạo reservation với `reservationTime` = now - 20 phút<br>2. **Không** confirm (giữ PENDING)<br>3. Đợi 60s | Trạng thái vẫn = `PENDING` | ☐ |
| 2.3 | Reservation CONFIRMED chưa quá hạn không bị cancel | 1. Tạo reservation với `reservationTime` = now + 30 phút<br>2. Confirm reservation<br>3. Đợi 60s | Trạng thái vẫn = `CONFIRMED` | ☐ |
| 2.4 | Reservation đã CHECK_IN không bị cancel | 1. Tạo + confirm + check-in reservation (thời gian quá khứ)<br>2. Đợi 60s | Trạng thái vẫn = `CHECKED_IN` | ☐ |

---

## Feature 3 — WebSocket Real-Time Updates

Mục tiêu: Khi có thay đổi (order, reservation, table), tất cả client đang mở sẽ nhận notification real-time và tự refresh data.

### Preconditions
- Mở 2 tab/browser cùng lúc trên Staff Dashboard
- Mở DevTools → Network → WS tab để quan sát WebSocket messages

### Test Cases

| # | Mô tả | Bước thực hiện | Kết quả mong đợi | Pass? |
|---|--------|----------------|-------------------|-------|
| 3.1 | WebSocket kết nối thành công | 1. Đăng nhập staff dashboard<br>2. Mở DevTools → Network → WS<br>3. Kiểm tra connection tới `/ws` | Thấy WebSocket connection OPEN, STOMP CONNECTED frame | ☐ |
| 3.2 | Staff Dashboard auto-refresh khi tạo order mới | 1. Tab A: Mở Staff Dashboard<br>2. Tab B: Tạo order mới (qua QR hoặc staff)<br>3. Quan sát Tab A | Tab A tự động hiển thị order mới **không cần F5** | ☐ |
| 3.3 | Staff Dashboard auto-refresh khi confirm order | 1. Tab A: Mở Staff Dashboard<br>2. Tab B: Confirm một order<br>3. Quan sát Tab A | Tab A cập nhật trạng thái order → CONFIRMED | ☐ |
| 3.4 | Staff Dashboard auto-refresh khi tạo reservation | 1. Tab A: Mở Staff Dashboard<br>2. Tab B hoặc Postman: Customer tạo reservation mới<br>3. Quan sát Tab A | Tab A hiện reservation mới trong danh sách | ☐ |
| 3.5 | Staff Dashboard auto-refresh khi cancel order | 1. Tab A: Mở Staff Dashboard<br>2. Tab B: Cancel một order<br>3. Quan sát Tab A | Tab A cập nhật trạng thái → CANCELLED | ☐ |
| 3.6 | Reconnect sau khi mất kết nối | 1. Mở Staff Dashboard<br>2. Tắt backend server vài giây<br>3. Bật lại backend<br>4. Quan sát DevTools WS | Client tự động reconnect (STOMP tự retry) | ☐ |

---

## Feature 4 — Kitchen Display System (KDS)

Mục tiêu: Trang KDS hiển thị các món cần chế biến, cho phép chuyển trạng thái: CONFIRMED → PREPARING → READY → SERVED.

### Preconditions
- Đăng nhập với role ADMIN, MANAGER hoặc WAITER
- Có ít nhất 1 order đã CONFIRMED với các order items

### Test Cases

| # | Mô tả | Bước thực hiện | Kết quả mong đợi | Pass? |
|---|--------|----------------|-------------------|-------|
| 4.1 | Truy cập trang KDS | 1. Đăng nhập `waiter1/waiter123`<br>2. Vào URL `/staff/kitchen` | Trang KDS hiện ra, header "Kitchen Display" | ☐ |
| 4.2 | Hiển thị danh sách món chờ chế biến | 1. Tạo order + confirm order<br>2. Vào trang KDS | Các món hiện ra nhóm theo order, trạng thái CONFIRMED | ☐ |
| 4.3 | Bắt đầu chế biến (Start Preparing) | 1. Trên trang KDS, tìm món trạng thái CONFIRMED<br>2. Nhấn nút "Start" (hoặc "Bắt đầu")<br>3. Quan sát | Trạng thái đổi → PREPARING, viền đổi màu (amber) | ☐ |
| 4.4 | Đánh dấu sẵn sàng (Mark Ready) | 1. Tìm món trạng thái PREPARING<br>2. Nhấn nút "Ready" (hoặc "Sẵn sàng") | Trạng thái đổi → READY, món biến mất khỏi KDS (hoặc di chuyển vùng) | ☐ |
| 4.5 | Bộ đếm thời gian (Elapsed Timer) | 1. Quan sát một order card trên KDS<br>2. Đợi vài giây | Hiển thị thời gian đã qua (ví dụ: "2m 30s"), tự tăng | ☐ |
| 4.6 | KDS auto-refresh qua WebSocket | 1. Mở KDS trên Tab A<br>2. Tab B: Confirm thêm 1 order mới<br>3. Quan sát Tab A | Món mới tự hiện trên KDS **không cần F5** | ☐ |
| 4.7 | Order card nhóm đúng theo order | 1. Tạo order có 3+ món<br>2. Confirm order<br>3. Xem KDS | Tất cả món cùng order nằm chung 1 card, hiện mã order + bàn | ☐ |
| 4.8 | CUSTOMER không truy cập được KDS API | 1. Đăng nhập `customer1/customer123`<br>2. Gọi `GET /api/kitchen/queue` | Response `403 Forbidden` | ☐ |
| 4.9 | Trạng thái SERVED removed from KDS | 1. Mark một món READY<br>2. Gọi `POST /api/kitchen/items/{id}/served`<br>3. Refresh KDS | Món đã SERVED không còn hiện trên KDS | ☐ |
| 4.10 | Nhiều order hiển thị đồng thời | 1. Tạo + confirm 3 order khác nhau<br>2. Vào KDS | 3 order cards riêng biệt, sắp xếp theo thời gian | ☐ |

---

## Regression Checks

Kiểm tra các tính năng cũ vẫn hoạt động bình thường sau khi thêm WebSocket + KDS.

| # | Mô tả | Bước thực hiện | Kết quả mong đợi | Pass? |
|---|--------|----------------|-------------------|-------|
| R.1 | Login/Logout vẫn hoạt động | 1. Đăng nhập<br>2. Đăng xuất<br>3. Đăng nhập lại | Tất cả thành công | ☐ |
| R.2 | CRUD Menu Items | 1. Tạo menu item mới<br>2. Sửa<br>3. Xóa | Hoạt động bình thường | ☐ |
| R.3 | QR ordering flow | 1. Scan QR → mở trang gọi món<br>2. Thêm món vào order<br>3. Gửi order | Order tạo thành công | ☐ |
| R.4 | Staff Dashboard load | 1. Đăng nhập staff<br>2. Vào Dashboard | Hiển thị tổng quan: orders, tables, reservations | ☐ |
| R.5 | Invoice/Billing | 1. Tạo order → confirm → tạo invoice<br>2. Kiểm tra tổng tiền | Invoice tạo đúng | ☐ |

---

## Ghi chú thực hiện

1. **Thứ tự test**: Feature 1 → Feature 2 → Feature 4 → Feature 3 (WebSocket cần test cuối vì phụ thuộc các feature khác).
2. **Môi trường**: Dùng profile `local` (`application-local.yml`), database MySQL chạy local hoặc Docker.
3. **Tools hỗ trợ**: Postman collection có sẵn trong `postman/` folder, DevTools Network tab cho WebSocket.
4. **Nếu test WebSocket thất bại**: Kiểm tra `/ws` endpoint có accessible không (`http://localhost:8080/ws/info`), kiểm tra CORS config.
5. **Nếu auto-cancel không hoạt động**: Kiểm tra `@EnableScheduling` đã có, scheduler log trong console mỗi 60s.
