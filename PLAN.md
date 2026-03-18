# Kế hoạch MVP End-to-End cho Restaurant Management System

## Summary
- Giữ hướng kiến trúc hiện tại: 1 backend Spring Boot monolith + 1 frontend React riêng + MySQL + Flyway; không đổi sang microservices, không đổi DB, không hạ Spring Boot xuống 3.x trong pha này.
- Dùng `restaurant_project_spec_agent.md` làm nguồn sự thật về nghiệp vụ; dùng codebase hiện tại làm nguồn sự thật về nền tảng kỹ thuật, vì spec đang có vài ví dụ kỹ thuật không còn khớp hoàn toàn với repo.
- Mục tiêu của plan này là đưa dự án từ “backend foundation” lên “MVP end-to-end dùng được”, bao phủ 3 luồng cốt lõi: nội bộ POS, QR order tại bàn, và đặt bàn online.

## Implementation Plan
1. Chốt baseline kỹ thuật trước khi mở rộng: hợp thức hóa JDK 21 hiện tại, cập nhật tài liệu kỹ thuật cho đúng stack đang chạy, thêm README/runbook local, và commit sạch 2 thay đổi chưa commit hiện có để tạo mốc ổn định.
2. Hoàn thiện backend cho các phần đã có nhưng chưa đủ dùng cho UI: bổ sung list/filter/search cho order, invoice, payment, service request; hoàn thiện CRUD thực dụng cho area, dining table, category, menu item và customer; chuẩn hóa response/pagination/filter để frontend có thể dùng đồng nhất.
3. Thêm bounded context `reservation` đầy đủ từ migration đến API nội bộ và API công khai. Mặc định dùng vòng đời `PENDING -> CONFIRMED -> CHECKED_IN -> COMPLETED`, cho phép `CANCELLED`, và hỗ trợ tra cứu/cancel công khai theo mã đặt bàn.
4. Thêm lớp API công khai dưới `/api/public/**` cho menu, QR và booking. Cụ thể phải có: đọc menu public, resolve QR token sang bàn hợp lệ, tạo hoặc cộng dồn order từ QR, theo dõi trạng thái order từ QR, gửi service request từ khách, tạo và tra cứu reservation công khai.
5. Chốt rule MVP cho QR order để tránh bùng nổ phạm vi: QR chỉ tạo đơn khi bàn hợp lệ và QR còn hiệu lực; table session được tự mở ở lần submit QR đầu tiên nếu bàn chưa có session mở; toàn bộ lần gọi món từ QR trong cùng session được cộng vào một `DINE_IN` order đang hoạt động; order từ QR mặc định ở trạng thái chờ nhân viên xác nhận thay vì tự động hoàn tất.
6. Bổ sung trường phân biệt nguồn tạo order, ví dụ `sourceChannel = STAFF | QR`, để nội bộ có thể lọc “đơn từ QR” đúng theo spec và để frontend hiển thị trạng thái phù hợp mà không lạm dụng `orderType`.
7. Không triển khai WebSocket trong MVP này. Toàn bộ trạng thái customer-facing và service request sẽ dùng polling ngắn ở frontend; WebSocket được để lại cho pha mở rộng sau khi end-to-end flow đã ổn định.
8. Không triển khai online payment, promotion/voucher, report, hóa đơn điện tử và màn hình bếp/bar trong MVP này. Cashier vẫn là nơi ghi nhận payment nội bộ; khách QR chỉ có “gọi nhân viên” và “yêu cầu thanh toán”.
9. Tạo frontend mới tại `frontend/` bằng React + Vite + TypeScript + React Router + TanStack Query + Tailwind CSS. Không nhúng Thymeleaf vào backend vì mục tiêu là màn hình POS/QR/dashboard có tương tác động.
10. Xây staff app tối thiểu gồm: đăng nhập, sơ đồ bàn/table session, workspace order nội bộ, invoice/payment screen, quản lý category/menu item, danh sách service request và quản lý reservation. Dashboard chỉ cần mức “tổng quan vận hành cơ bản”, không làm analytics sâu.
11. Xây public app tối thiểu gồm: landing/menu public, form đặt bàn + tra cứu đặt bàn, landing page theo QR token, menu/giỏ hàng theo QR, trang trạng thái order, và thao tác gọi nhân viên/yêu cầu thanh toán.
12. Giữ contract auth hiện tại trong pha này. Frontend dùng access token cho request bảo vệ và refresh token để làm mới phiên; không đổi sang cookie/session trong MVP để tránh lan rộng phạm vi backend.
13. Hoàn thiện trải nghiệm demo/dev: seed dữ liệu mẫu ngoài admin mặc định, mở rộng `compose.yaml` hoặc thêm compose dev để chạy trọn bộ MySQL + backend + frontend, và bổ sung script chạy local nhất quán.

## Public APIs / Interfaces
- Thêm nhóm API nội bộ còn thiếu: `/api/customers`, `/api/reservations`, và list/filter endpoints cho `/api/orders`, `/api/invoices`, `/api/payments`, `/api/service-requests`.
- Thêm nhóm API công khai: `/api/public/menu`, `/api/public/qr/{token}`, endpoint submit QR order, endpoint order-status public, endpoint service-request public, và `/api/public/reservations`.
- Mở rộng model `orders` để có `sourceChannel`; thêm model `reservations` và `reservation_histories`; giữ `orderType` hiện tại cho loại hình bán hàng, không dùng nó để biểu diễn nguồn tạo đơn.
- Frontend public và staff phải dùng cùng một API contract Swagger/OpenAPI, không tạo API riêng cho frontend nếu không có khác biệt nghiệp vụ thật sự.

## Test Plan
- Backend unit test cho reservation lifecycle, QR validation, order append-from-QR, payment completion và service-request side effects.
- Backend integration test với Testcontainers MySQL cho ít nhất 3 luồng: đăng nhập + seed admin, QR order end-to-end, reservation create/confirm/check-in. Khi Docker không sẵn sàng thì suite được skip có chủ đích; khi Docker sẵn sàng thì phải chạy xanh hoàn toàn.
- Frontend test ở mức route/data-fetch/auth guard/cart state cho các màn hình trọng yếu; e2e bằng Playwright cho 3 journey chính: waiter POS, customer QR order, customer reservation.
- Acceptance cho MVP là: staff có thể vận hành bàn và thanh toán; khách có thể quét QR gọi món và yêu cầu thanh toán; khách có thể đặt bàn online và staff có thể xác nhận/check-in; toàn bộ build backend + frontend chạy được từ môi trường local tiêu chuẩn.

## Assumptions
- Phạm vi triển khai tiếp theo là MVP end-to-end, không phải full spec.
- Frontend chính thức là React + Vite; không làm Thymeleaf trong pha này.
- MySQL 8.4 tiếp tục là DB dev mặc định vì repo và compose hiện tại đã xoay quanh nó.
- Realtime, promotion, report, e-invoice, kitchen/bar và online payment đều để sau MVP.
- Pha đầu tiên phải bắt đầu từ baseline hiện có trên nhánh hiện tại, bao gồm việc chốt sạch thay đổi JDK 21 và đồng bộ lại tài liệu kỹ thuật.
