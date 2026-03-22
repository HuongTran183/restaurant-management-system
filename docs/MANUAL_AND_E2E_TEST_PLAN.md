# Kế hoạch kiểm thử thủ công và E2E (topology chuẩn)

## Cách tiếp cận

Dùng **compose mode** với bộ port đã chuẩn hóa để test thủ công và E2E trên cùng một topology. Thứ tự ưu tiên:

1. Smoke check
2. Happy path khách hàng (public)
3. Flow staff và thanh toán (chuỗi dễ kéo lỗi dây chuyền)

## Scope

**In:** test UI thủ công, regression i18n, reservation, QR ordering, staff POS, invoice/payment, trạng thái lỗi không treo vô hạn.

**Out:** load test, cross-browser matrix, profiling backend sâu, audit bảo mật.

## Action items (vận hành)

1. Khởi động stack theo compose mode (tránh lệch port):

   ```powershell
   docker compose --env-file frontend/.env.compose -f compose.full.yaml up -d --build
   ```

2. Xác nhận môi trường sống đúng cổng:

   - Frontend: `http://127.0.0.1:15173`
   - Backend health: `http://127.0.0.1:18080/actuator/health`

3. Smoke thủ công qua UI: app render, i18n đổi được, staff đăng nhập được.

4. Flow khách hàng (thủ công): reservation → reservation lookup → QR order → request bill.

5. Flow staff (thủ công): login → open floor workspace → resolve request → confirm order → create invoice → record payment.

6. Regression gần đây: đổi ngôn ngữ không reload; workbench không bị chặn toàn bộ khi menu lỗi; thông báo lỗi thay vì treo.

7. Kiểm tra nhanh tự động (từ thư mục `frontend`):

   ```powershell
   cd frontend
   npm run build
   npm test
   npm run test:e2e
   ```

   Thứ tự các journey được **cố định trong** `frontend/playwright.config.ts` (projects + `dependencies`), không phụ thuộc thứ tự file trên CLI.

8. Khi có lỗi: lưu mã `RES-*`, `ORD-*`, `PAY-*`, ảnh màn hình, URL hiện tại, request lỗi trong tab Network.

## Test UI thủ công

### TC1 – Smoke + i18n

- Mở `/`, `/book`, `/staff/login`.
- Đổi ngôn ngữ `vi` ↔ `en` ↔ `vi`.
- **Kỳ vọng:** text đổi ngay, không cần reload; không còn key thô hoặc chuỗi tiếng Anh sót ở vùng staff chính.

### TC2 – Đặt chỗ và hủy

- Vào `/book`, tạo reservation mới; thấy mã `RES-*`, trạng thái Đang chờ; hủy.
- **Kỳ vọng:** trạng thái Đã hủy; form không treo.

### TC3 – Tra cứu đặt chỗ

- Tạo reservation, copy mã, reload trang, tra cứu theo mã, rồi hủy.
- **Kỳ vọng:** lookup đúng bản ghi vừa tạo.

### TC4 – QR order

- Dùng QR bàn demo **T-01** (xem seed trong README: `DEMO-HALL`, landing `/qr/<token>`).
- Tăng số lượng món, gửi đơn QR, bấm Yêu cầu hóa đơn.
- **Kỳ vọng:** thấy `ORD-*`, trạng thái đơn hoạt động, thông báo đã gửi yêu cầu phục vụ.

### TC5 – Staff floor workspace

- Đăng nhập staff: `admin` / `Admin@123456`.
- Mở luồng sàn hoặc walk-in.
- **Kỳ vọng:** workbench hiện, có session tập trung, thấy order hoặc nút tạo order.

### TC6 – Staff xử lý order đến thanh toán

- Từ order QR vừa tạo: Xử lý → (nếu có) Xác nhận → (nếu chưa có) Tạo hóa đơn → mở invoice → Ghi nhận thanh toán.
- **Kỳ vọng:** `PAY-*`, trạng thái Đã thanh toán.

### TC7 – Hồi quy menu treo

- Tắt backend hoặc làm `/api/public/menu` lỗi có chủ đích.
- **Kỳ vọng:** UI báo lỗi tải menu; lane staff không đứng vô hạn; workbench không sập toàn bộ.

### TC8 – Hồi quy layout staff

- Kiểm tra header reservation queue và form thêm món trong cashier workbench.
- **Kỳ vọng:** không chồng lấn, không co méo (desktop + mobile hẹp).

## Thứ tự chạy E2E (Playwright)

Lý do: ba flow đầu xác nhận public/customer; `staff-pos` smoke lane staff; `staff-resolve-service-invoice-payment` flow staff UI; `customer-qr-billing-payment` gate mạnh (UI + persistence qua API).

1. `customer-reservation.spec.ts`
2. `customer-reservation-lookup.spec.ts`
3. `customer-qr.spec.ts`
4. `staff-pos.spec.ts`
5. `staff-resolve-service-invoice-payment.spec.ts`
6. `customer-qr-billing-payment.spec.ts`

Chạy:

```powershell
cd frontend
npm run test:e2e
```

Cấu hình URL mặc định: `frontend/tests/e2e/runtime.ts` (đọc `APP_FRONTEND_PORT` / `APP_BACKEND_PORT` từ env frontend, mặc định `15173` / `18080`).
