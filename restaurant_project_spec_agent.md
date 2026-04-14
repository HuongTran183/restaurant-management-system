# ĐẶC TẢ TRIỂN KHAI DỰ ÁN WEBSITE QUẢN LÝ NHÀ HÀNG

## 1. Mục tiêu tài liệu
Tài liệu này được biên soạn lại từ file mô tả dự án gốc theo hướng dễ triển khai cho đội phát triển và AI Agent trong IDE. Nội dung tập trung vào:
- Làm rõ nghiệp vụ cốt lõi của hệ thống quản lý nhà hàng.
- Chuẩn hóa phạm vi chức năng, vai trò người dùng, quy tắc nghiệp vụ và luồng xử lý.
- Đề xuất stack công nghệ phù hợp với yêu cầu **Java Spring Boot**.
- Định hướng kiến trúc **đơn giản, gọn, dễ triển khai**, phù hợp với một dự án nhỏ.
- Bổ sung mô hình dữ liệu, các module cần có, định hướng API và phạm vi MVP.

---

## 2. Tổng quan dự án

### 2.1. Tên dự án
**Website Quản Lý Nhà Hàng**

### 2.2. Mục tiêu hệ thống
Xây dựng một hệ thống quản lý nhà hàng chạy trên nền web, hỗ trợ toàn bộ quy trình vận hành chính:
- Quản lý bàn ăn và khu vực.
- Quản lý thực đơn và món ăn.
- Quản lý đơn hàng tại chỗ, mang đi, giao hàng.
- Hỗ trợ khách gọi món tại bàn bằng mã QR.
- Gửi món xuống bếp/bar và theo dõi trạng thái chế biến.
- Quản lý hóa đơn, thanh toán, khuyến mãi.
- Quản lý nhân viên, tài khoản và phân quyền.
- Quản lý đặt bàn trước.
- Báo cáo doanh thu, đơn hàng, hiệu suất hoạt động.

### 2.3. Định hướng triển khai
Đây là **dự án nhỏ**, vì vậy không nên thiết kế quá phức tạp như microservices hay kiến trúc phân tán. Giải pháp phù hợp là:
- **1 backend Spring Boot monolith**.
- **1 frontend web**.
- **1 cơ sở dữ liệu quan hệ**.
- Có thể bổ sung **WebSocket** cho cập nhật thời gian thực nếu cần.

Kiến trúc này đủ để triển khai nhanh, dễ bảo trì, dễ chấm điểm và dễ mở rộng vừa phải trong tương lai.

---

## 3. Phạm vi hệ thống
Hệ thống cho phép:
- Quản lý bàn ăn.
- Quản lý khu vực bàn.
- Quản lý thực đơn và món ăn.
- Quản lý đơn hàng ăn tại bàn, mang đi, giao hàng.
- Hỗ trợ khách gọi món tại bàn bằng QR.
- Gửi món xuống bếp/bar.
- Theo dõi trạng thái món và đơn hàng.
- Quản lý hóa đơn và thanh toán.
- Quản lý khách hàng.
- Quản lý khuyến mãi, voucher, combo.
- Quản lý đặt bàn trước.
- Quản lý tài khoản nhân viên và phân quyền.
- Quản lý báo cáo, thống kê.

---

## 4. Đối tượng sử dụng và phân quyền

### 4.1. Khách hàng
Khách không cần đăng nhập để sử dụng các chức năng công khai hoặc QR tại bàn.

Chức năng chính:
- Xem menu online.
- Đặt bàn online.
- Quét QR tại bàn để gọi món.
- Theo dõi trạng thái đơn.
- Gọi nhân viên.
- Gửi yêu cầu thanh toán.
- Xem/tải hóa đơn điện tử nếu được hỗ trợ.

### 4.2. Nhân viên phục vụ
Chức năng chính:
- Quản lý bàn và sơ đồ bàn.
- Hỗ trợ khách tạo đơn.
- Xác nhận đơn từ khách hoặc QR theo cấu hình.
- Chỉnh sửa món trước khi xác nhận.
- Theo dõi trạng thái phục vụ.
- Gộp bàn, tách bàn, chuyển bàn.
- Xử lý yêu cầu phát sinh từ khách tại bàn.

### 4.3. Thu ngân
Chức năng chính:
- Xử lý hóa đơn.
- Áp dụng khuyến mãi, giảm giá, voucher.
- Thanh toán nhiều phương thức.
- Tách/gộp hóa đơn.
- In hóa đơn và gửi hóa đơn điện tử.
- Xem lịch sử thanh toán.

### 4.4. Quản lý / Admin
Chức năng chính:
- Quản lý toàn bộ hệ thống.
- Quản lý menu, món ăn, bàn, khu vực, QR, nhân viên, tài khoản.
- Quản lý đặt bàn, khuyến mãi, khách hàng.
- Xem báo cáo và thống kê.
- Cấu hình luồng QR, quy tắc thanh toán, phí, thuế.

---

## 5. Luồng nghiệp vụ tổng quát

### 5.1. Luồng phục vụ tại bàn
1. Khách đến nhà hàng và được sắp xếp bàn.
2. Bàn được chuyển sang trạng thái phù hợp.
3. Khách có thể gọi món qua nhân viên hoặc quét QR tại bàn.
4. Đơn được tạo theo bàn hoặc theo phiên sử dụng bàn.
5. Món được gửi xuống bếp/bar.
6. Bếp/bar cập nhật trạng thái món.
7. Nhân viên phục vụ theo dõi và lên món.
8. Khách có thể gọi thêm món nhiều lần trong cùng một phiên bàn.
9. Khách yêu cầu thanh toán.
10. Thu ngân xử lý hóa đơn và thanh toán.
11. Sau khi hoàn tất, phiên bàn được đóng/reset.

### 5.2. Luồng đặt món qua QR tại bàn
1. Khách quét QR trên bàn.
2. Hệ thống nhận diện đúng bàn.
3. Hệ thống hiển thị menu khả dụng.
4. Khách chọn món, tùy chọn, số lượng, ghi chú.
5. Khách gửi đơn.
6. Hệ thống tạo mới hoặc cập nhật phiên bàn hiện tại.
7. Đơn được chuyển tới nhân viên hoặc bếp theo cấu hình.
8. Khách theo dõi trạng thái món.
9. Khách có thể gọi thêm món hoặc yêu cầu thanh toán.

### 5.3. Luồng đặt bàn trước
1. Khách truy cập website và đặt bàn online.
2. Khách nhập thời gian, số người, khu vực mong muốn và thông tin liên hệ.
3. Hệ thống ghi nhận yêu cầu đặt bàn.
4. Nhà hàng xác nhận, đổi lịch hoặc hủy booking.
5. Hệ thống gửi thông báo cho khách.
6. Khi khách đến, nhân viên check-in và gán bàn thực tế.

### 5.4. Luồng bán hàng mang đi / giao hàng
1. Nhân viên tạo đơn mang đi hoặc giao hàng.
2. Chọn món, ghi chú, thông tin khách.
3. Hệ thống tính tiền, áp dụng khuyến mãi nếu có.
4. Đơn được theo dõi theo trạng thái.
5. Thu ngân thu tiền và xuất hóa đơn.

---

## 6. Yêu cầu chức năng chi tiết

## 6.1. Quản lý đăng nhập và phân quyền
### Mục tiêu
Cho phép người dùng nội bộ đăng nhập và sử dụng chức năng đúng theo vai trò.

### Yêu cầu
- Đăng nhập bằng tài khoản và mật khẩu.
- Hỗ trợ phân quyền theo vai trò: Admin, Quản lý, Nhân viên phục vụ, Thu ngân.
- Ghi nhận lịch sử đăng nhập và đăng xuất.
- Hỗ trợ quên mật khẩu / đặt lại mật khẩu.
- Bảo vệ các API và màn hình quản trị theo vai trò.

### Gợi ý triển khai
- Sử dụng **Spring Security + JWT**.
- Dùng **RBAC (Role-Based Access Control)**.
- Có thể lưu lịch sử truy cập trong bảng `audit_logs` hoặc `login_histories`.

---

## 6.2. Quản lý bán hàng / POS
### Mục tiêu
Hỗ trợ toàn bộ quy trình tạo đơn, chọn món, áp dụng ưu đãi, tính tiền và xuất hóa đơn.

### Yêu cầu
- Tạo đơn theo 3 hình thức:
  - Ăn tại bàn.
  - Mang đi.
  - Giao hàng.
- Chọn món, số lượng, ghi chú.
- Sửa món trong đơn trước khi xác nhận thanh toán.
- Tách hóa đơn theo bàn, khách hoặc món.
- Gộp hóa đơn khi cần.
- Áp dụng giảm giá trực tiếp, voucher, combo.
- Tính thuế, phụ phí, phí dịch vụ.
- In hóa đơn.
- Gửi hóa đơn điện tử nếu có cấu hình.

---

## 6.3. Quản lý bàn và khu vực
### Mục tiêu
Quản lý danh sách bàn theo khu vực và trạng thái hoạt động thực tế.

### Yêu cầu
- CRUD khu vực.
- CRUD bàn.
- Gán bàn vào khu vực.
- Quản lý trạng thái bàn:
  - Trống.
  - Đang phục vụ.
  - Đã đặt trước.
  - Chờ dọn.
  - Khóa sử dụng.
- Gán mã QR riêng cho từng bàn.
- In / tải QR cho từng bàn.
- Cập nhật số ghế tối đa của bàn.

### Quy tắc nghiệp vụ
- Mỗi bàn có một mã định danh duy nhất.
- Mỗi QR chỉ liên kết với một bàn tại một thời điểm.
- Không cho phép hai bàn dùng cùng một QR.

---

## 6.4. Quản lý thực đơn và món ăn
### Mục tiêu
Quản lý toàn bộ món ăn, giá, hình ảnh, thuộc tính và tình trạng phục vụ.

### Yêu cầu
- CRUD món ăn.
- CRUD danh mục món ăn.
- Phân loại món theo danh mục:
  - Khai vị.
  - Món chính.
  - Tráng miệng.
  - Nước uống.
  - Combo.
- Cập nhật giá bán.
- Hiển thị hình ảnh, mô tả.
- Cấu hình món còn bán / hết món / tạm ngưng.
- Cấu hình thuộc tính món:
  - Mức cay.
  - Kích cỡ.
  - Topping.
  - Ghi chú đặc biệt.

### Gợi ý triển khai
- Tách `categories`, `menu_items`, `menu_item_options`, `menu_item_option_values` nếu cần cấu hình linh hoạt.
- Ảnh món ăn có thể upload lên local storage hoặc cloud storage tùy phạm vi dự án.

---

## 6.5. Đặt món qua QR tại bàn
### Mục tiêu
Cho phép khách dùng điện thoại quét mã QR và gọi món trực tiếp mà không cần đăng nhập.

### Tiền điều kiện
- Bàn đã tồn tại trong hệ thống.
- QR của bàn còn hiệu lực.
- Bàn đang ở trạng thái cho phép phục vụ.

### Hậu điều kiện
- Đơn hàng được tạo mới hoặc cộng dồn vào phiên bàn đang mở.
- Món được chuyển tới nhân viên hoặc bếp theo cấu hình hệ thống.

### Luồng chính
1. Khách quét QR trên bàn.
2. Hệ thống mở menu tương ứng với bàn.
3. Hiển thị thông tin bàn và menu khả dụng.
4. Khách chọn món, số lượng, tùy chọn, ghi chú.
5. Khách thêm món vào giỏ.
6. Khách xác nhận đặt món.
7. Hệ thống ghi nhận đơn hàng cho đúng bàn.
8. Hệ thống thông báo thành công.
9. Đơn được đẩy đến màn hình nhân viên/bếp.

### Luồng ngoại lệ
- QR không hợp lệ -> báo lỗi.
- QR hết hiệu lực -> yêu cầu liên hệ nhân viên.
- Bàn đang khóa -> từ chối truy cập.
- Món vừa hết hàng -> yêu cầu chọn món khác.
- Mất kết nối mạng -> lưu tạm giỏ hàng cục bộ và cho phép gửi lại.

### Yêu cầu chi tiết
- Truy cập menu bằng QR không cần đăng nhập.
- Tự nhận diện bàn từ QR.
- Hiển thị menu theo thời gian thực.
- Nhiều khách cùng một bàn có thể cùng đặt món.
- Gom món vào cùng phiên bàn hoặc cùng hóa đơn theo cấu hình.
- Cho phép khách ghi chú theo từng món.
- Khách có thể gọi thêm món nhiều lần.
- Hiển thị trạng thái món:
  - Đã gửi.
  - Đang chuẩn bị.
  - Đã lên món.
- Cho phép khách gửi yêu cầu:
  - Gọi nhân viên.
  - Xin thêm nước / chén / khăn giấy.
  - Yêu cầu thanh toán.

### Quy tắc nghiệp vụ
- Một QR chỉ được gắn với một bàn tại một thời điểm.
- Khách không được đổi bàn từ giao diện QR.
- Mọi đơn từ QR phải gắn với bàn phát sinh.
- Có thể cấu hình:
  - Đơn QR cần nhân viên xác nhận trước khi xuống bếp.
  - Hoặc đơn QR tự động chuyển thẳng xuống bếp.
- Nếu bàn đang mở hóa đơn, đơn mới từ QR sẽ được cộng dồn theo cấu hình.

### Gợi ý triển khai
- Dùng QR dạng URL có token bàn hoặc mã bàn.
- Dùng **WebSocket/STOMP** để cập nhật trạng thái đơn, yêu cầu thanh toán, gọi nhân viên theo thời gian thực.

---

## 6.6. Quản lý đặt bàn
### Mục tiêu
Cho phép khách đặt bàn online và nhà hàng xác nhận, điều chỉnh hoặc hủy booking.

### Yêu cầu
- Khách đặt bàn online.
- Chọn ngày, giờ, số lượng người, khu vực mong muốn.
- Nhập thông tin liên hệ.
- Ghi chú yêu cầu đặc biệt.
- Nhà hàng xác nhận / hủy / đổi lịch.
- Gửi nhắc lịch qua email hoặc SMS nếu có.
- Nhân viên xem danh sách bàn đã đặt theo ngày, giờ, khu vực.
- Check-in khi khách đến và gán bàn thực tế.

---

## 6.7. Quản lý đơn hàng
### Mục tiêu
Quản lý toàn bộ vòng đời của đơn hàng từ lúc tạo đến lúc hoàn tất/hủy.

### Trạng thái đơn hàng đề xuất
- Mới tạo.
- Chờ xác nhận.
- Đã xác nhận.
- Đang chế biến.
- Đã phục vụ một phần.
- Hoàn tất.
- Đã hủy.

### Yêu cầu
- Tạo đơn từ:
  - Nhân viên phục vụ.
  - Đặt món qua QR.
  - Mang đi.
  - Giao hàng.
- Chỉnh sửa số lượng món trước khi xác nhận.
- Hủy món / hủy đơn có ghi lý do.
- Tách đơn theo khách hoặc theo món.
- Gộp đơn nếu cần.
- Theo dõi lịch sử thay đổi đơn hàng.

### Gợi ý triển khai
- Nên tách trạng thái `order_status` và `order_item_status` để quản lý chi tiết hơn ở mức món.
- Có bảng `order_histories` để lưu vết thay đổi.

---

## 6.8. Thanh toán và hóa đơn
### Mục tiêu
Hỗ trợ thanh toán cho từng đơn hoặc từng bàn theo nhiều phương thức.

### Yêu cầu
- Tạo hóa đơn từ đơn hàng.
- Áp dụng giảm giá, voucher, khuyến mãi.
- Tính VAT, phí dịch vụ, phụ phí.
- Hỗ trợ thanh toán:
  - Tiền mặt.
  - Thẻ.
  - Ví điện tử.
  - Chuyển khoản / QR thanh toán.
- In hóa đơn.
- Gửi hóa đơn điện tử nếu có cấu hình.
- Cho phép tách hóa đơn.

### Liên quan QR bàn
- Khách từ giao diện QR có thể bấm **Yêu cầu thanh toán**.
- Hệ thống gửi thông báo cho nhân viên/thu ngân.
- Không bắt buộc khách tự thanh toán online nếu tính năng này chưa bật.

---

## 6.9. Quản lý khách hàng
### Mục tiêu
Lưu trữ thông tin khách hàng phục vụ chăm sóc khách hàng và marketing.

### Yêu cầu
- CRUD khách hàng.
- Lưu tên, số điện thoại, email (nếu có), lịch sử dùng bữa.
- Tích điểm thành viên.
- Phân nhóm khách hàng thân thiết.

---

## 6.10. Quản lý khuyến mãi
### Mục tiêu
Cho phép cấu hình và áp dụng các chương trình khuyến mãi linh hoạt.

### Yêu cầu
- CRUD chương trình khuyến mãi.
- Thiết lập khuyến mãi theo:
  - Món ăn.
  - Nhóm món.
  - Combo.
  - Hóa đơn.
  - Khung giờ.
  - Ngày áp dụng.
- Hình thức khuyến mãi:
  - Giảm theo phần trăm.
  - Giảm theo số tiền cố định.
  - Mua 1 tặng 1.
  - Tặng món.
  - Combo giá ưu đãi.
  - Voucher / mã giảm giá.
- Cấu hình điều kiện áp dụng:
  - Giá trị đơn tối thiểu.
  - Số lượng món tối thiểu.
  - Khung giờ.
  - Đối tượng khách hàng.
- Tự động kiểm tra điều kiện hợp lệ.
- Cho phép áp dụng tự động hoặc thủ công.
- Hiển thị khuyến mãi tại POS và giao diện menu QR nếu được bật.
- Giới hạn số lần sử dụng.
- Bật/tắt chương trình mà không cần xóa.

---

## 6.11. Báo cáo và thống kê
### Mục tiêu
Cung cấp số liệu hỗ trợ quản lý vận hành và doanh thu.

### Yêu cầu
- Xem báo cáo theo:
  - Ngày.
  - Tuần.
  - Tháng.
  - Năm.
  - Khoảng thời gian tùy chọn.
- Báo cáo doanh thu:
  - Tổng doanh thu.
  - Doanh thu theo hình thức bán hàng.
- Báo cáo đơn hàng:
  - Tổng số đơn.
  - Đơn hoàn tất.
  - Đơn hủy.
- Lọc, tìm kiếm, xuất báo cáo ra Excel/PDF.

---

## 7. Quy tắc nghiệp vụ trọng yếu
- Mỗi bàn phải có mã QR duy nhất.
- QR chỉ được dùng cho đúng bàn được cấu hình.
- Đơn từ QR phải gắn với bàn đang quét.
- Món hết hàng không được đặt mới.
- Mọi thao tác chỉnh sửa đơn hàng phải được lưu lịch sử.
- Hủy món sau khi bếp đã chế biến cần quyền cao hơn.
- Khi bàn thanh toán xong, phiên QR của bàn phải được đóng hoặc reset.
- Một bàn có thể có nhiều lần gọi món trong cùng một lần dùng bữa.
- Một bàn có thể mở phiên phục vụ, nhưng cách cộng dồn đơn phải theo đúng cấu hình nghiệp vụ.
- Nếu nhà hàng yêu cầu xác nhận đơn QR trước khi xuống bếp thì đơn không được tự động gửi bếp trước bước xác nhận.

---

## 8. Yêu cầu giao diện

## 8.1. Nhóm giao diện khách hàng
### 8.1.1. Trang chủ nhà hàng
- Giới thiệu nhà hàng.
- Điều hướng đến menu online.
- Đặt bàn online.
- Xem khuyến mãi.
- Liên hệ.
- Điều hướng đến trang quét QR/đặt món nếu có.

### 8.1.2. Trang menu online công khai
- Danh mục món.
- Tên món, giá, ảnh, mô tả.
- Lọc theo danh mục.
- Tìm kiếm món.
- Hiển thị món nổi bật / khuyến mãi.
- Trạng thái còn món / hết món.

### 8.1.3. Trang đặt bàn online
- Nhập thông tin khách.
- Chọn ngày giờ.
- Chọn số người.
- Chọn khu vực.
- Ghi chú.
- Gửi yêu cầu đặt bàn.
- Thông báo thành công / thất bại.

### 8.1.4. Trang xác nhận đặt bàn
- Hiển thị mã đặt bàn.
- Hiển thị thông tin booking.
- Trạng thái chờ xác nhận / đã xác nhận.
- Hướng dẫn liên hệ khi cần thay đổi.

### 8.1.5. Trang tra cứu / đổi / hủy đặt bàn
- Tra cứu theo mã đặt bàn hoặc số điện thoại.
- Xem trạng thái.
- Hủy booking.
- Đổi ngày giờ.
- Cập nhật ghi chú.

### 8.1.6. Trang landing page theo QR bàn
- Nhận diện mã bàn.
- Hiển thị tên/số bàn.
- Hiển thị trạng thái bàn.
- Điều hướng vào menu gọi món.
- Báo lỗi nếu QR không hợp lệ / hết hiệu lực.

### 8.1.7. Trang menu đặt món theo QR
- Hiển thị menu theo danh mục.
- Tìm kiếm món.
- Xem chi tiết món.
- Chọn số lượng, thuộc tính, ghi chú.
- Thêm vào giỏ.
- Hiển thị combo / món khuyến mãi / món hết hàng.

### 8.1.8. Trang chi tiết món
- Hình ảnh.
- Giá.
- Mô tả.
- Size / topping / mức cay.
- Ghi chú riêng.
- Chọn số lượng.
- Thêm vào giỏ.

### 8.1.9. Trang giỏ hàng
- Danh sách món đã chọn.
- Sửa số lượng.
- Xóa món.
- Sửa ghi chú.
- Hiển thị tạm tính.
- Áp dụng voucher nếu cho phép.
- Gửi đơn.

### 8.1.10. Trang xác nhận đặt món thành công
- Hiển thị mã đơn / mã phiên.
- Hiển thị danh sách món đã gửi.
- Hiển thị trạng thái đơn.
- Quay lại menu để gọi thêm.

### 8.1.11. Trang theo dõi trạng thái đơn
- Danh sách món đã gọi.
- Trạng thái từng món.
- Thời gian gọi món.
- Tổng đơn đã gọi.
- Gọi thêm món.

### 8.1.12. Trang yêu cầu thanh toán
- Gửi yêu cầu thanh toán.
- Xác nhận yêu cầu.
- Hiển thị trạng thái đã tiếp nhận.
- Hiển thị tạm tính nếu được bật.

### 8.1.13. Trang thanh toán online
- Hiển thị chi tiết hóa đơn.
- Chọn phương thức thanh toán.
- Nhập mã giảm giá.
- Xác nhận thanh toán.
- Hiển thị kết quả.

### 8.1.14. Trang hóa đơn điện tử cho khách
- Hiển thị thông tin hóa đơn.
- Tải hóa đơn.
- Gửi hóa đơn qua email.
- Xem chi tiết món, thuế, phụ phí, giảm giá.

## 8.2. Nhóm giao diện hệ thống nội bộ
### 8.2.1. Đăng nhập nhân viên
- Nhập tài khoản.
- Nhập mật khẩu.
- Đăng nhập.
- Quên mật khẩu.
- Thông báo lỗi.

### 8.2.2. Quên mật khẩu / đặt lại mật khẩu
- Nhập email / số điện thoại / tài khoản.
- Gửi mã xác nhận.
- Nhập mật khẩu mới.
- Xác nhận đổi mật khẩu.

### 8.2.3. Dashboard tổng quan
- Số bàn đang phục vụ.
- Số đơn đang chờ.
- Số món đang chế biến.
- Doanh thu trong ngày.
- Đơn từ QR.
- Cảnh báo booking sắp đến giờ.
- Biểu đồ nhanh.

## 8.3. Nhóm giao diện quản lý bàn và phục vụ
### 8.3.1. Sơ đồ bàn / danh sách bàn
- Hiển thị bàn theo khu vực.
- Màu trạng thái bàn.
- Tìm kiếm bàn.
- Chọn bàn để xem đơn / tạo đơn.
- Chuyển bàn.
- Gộp bàn.
- Tách bàn.

### 8.3.2. Quản lý QR bàn
- Tạo QR.
- Xem QR.
- Tải / in QR.
- Tạo lại QR.
- Khóa / đổi hiệu lực QR.

### 8.3.3. Danh sách đặt bàn
- Xem booking theo ngày.
- Tìm theo tên / số điện thoại.
- Lọc trạng thái.
- Xác nhận / hủy / đổi lịch.
- Check-in.
- Gán bàn thực tế.

### 8.3.4. Chi tiết đặt bàn
- Thông tin khách.
- Thời gian đặt.
- Số lượng người.
- Khu vực yêu cầu.
- Ghi chú.
- Xác nhận / hủy / đổi lịch.
- Gửi lại thông báo.

## 8.4. Nhóm giao diện quản lý bán hàng / POS
### 8.4.1. Trang tạo đơn hàng
- Chọn loại đơn.
- Chọn bàn hoặc khách hàng.
- Thêm món.
- Chọn số lượng.
- Ghi chú món.
- Gắn khách hàng.
- Tạo đơn.

### 8.4.2. Trang chi tiết đơn hàng
- Danh sách món.
- Thêm / xóa / sửa món.
- Cập nhật ghi chú.
- Xem trạng thái đơn.
- Hủy món / hủy đơn.
- Xác nhận đơn.
- Gửi xuống bếp.
- Xem lịch sử thao tác.

### 8.4.3. Trang danh sách đơn hàng
- Lọc theo trạng thái.
- Lọc theo loại đơn.
- Lọc theo bàn.
- Tìm theo mã đơn.
- Xem chi tiết.
- Xác nhận / hủy.
- Theo dõi đơn từ QR.

### 8.4.4. Trang thanh toán hóa đơn
- Chi tiết hóa đơn.
- Tính thuế.
- Tính phí dịch vụ.
- Tính phụ phí.
- Áp dụng giảm giá.
- Chọn phương thức thanh toán.
- Xác nhận thanh toán.

### 8.4.5. Trang in hóa đơn
- Xem trước hóa đơn.
- In hóa đơn tạm tính.
- In hóa đơn chính thức.
- In lại nếu có quyền.

### 8.4.6. Trang gửi hóa đơn điện tử
- Nhập email / thông tin nhận hóa đơn.
- Gửi hóa đơn điện tử.
- Kiểm tra trạng thái gửi.
- Gửi lại hóa đơn.

### 8.4.7. Trang lịch sử thanh toán
- Tìm theo mã hóa đơn.
- Lọc theo ngày.
- Lọc theo phương thức thanh toán.
- Xem chi tiết giao dịch.
- In lại / gửi lại hóa đơn.

## 8.5. Nhóm giao diện quản lý menu và món ăn
### 8.5.1. Danh sách món ăn
- Xem danh sách.
- Tìm kiếm.
- Lọc theo danh mục.
- Lọc theo trạng thái.
- Thêm món mới.
- Sửa món.
- Ẩn món / ngưng bán.

### 8.5.2. Tạo / sửa món ăn
- Tên món.
- Mã món.
- Danh mục.
- Giá.
- Ảnh.
- Mô tả.
- Topping / size / thuộc tính.
- Trạng thái bán.

### 8.5.3. Danh mục món ăn
- Tạo danh mục.
- Sửa danh mục.
- Xóa danh mục.
- Sắp xếp thứ tự hiển thị.

---

## 9. Mô hình dữ liệu đề xuất
Dưới đây là danh sách entity cốt lõi nên có. Với dự án nhỏ, không cần tách quá nhiều bảng phức tạp nếu không thật sự cần.

### 9.1. Nhóm tài khoản và phân quyền
- `users`
- `roles`
- `user_roles`
- `login_histories`
- `audit_logs`

### 9.2. Nhóm nhà hàng và bàn
- `areas`
- `tables`
- `table_qrs`
- `table_sessions`

### 9.3. Nhóm menu và món ăn
- `categories`
- `menu_items`
- `menu_item_images`
- `menu_item_option_groups`
- `menu_item_option_values`

### 9.4. Nhóm khách hàng và đặt bàn
- `customers`
- `reservations`
- `reservation_histories`

### 9.5. Nhóm đơn hàng
- `orders`
- `order_items`
- `order_item_options`
- `order_histories`
- `service_requests` (gọi nhân viên, xin thêm nước, yêu cầu thanh toán)

### 9.6. Nhóm thanh toán và hóa đơn
- `invoices`
- `invoice_items`
- `payments`

### 9.7. Nhóm khuyến mãi
- `promotions`
- `promotion_rules`
- `vouchers`
- `voucher_usages`

### 9.8. Nhóm báo cáo / cấu hình
- `settings`
- `notification_logs`

### Ghi chú thiết kế
- Không nên thiết kế quá rời rạc ngay từ đầu.
- Với dự án nhỏ, có thể gom các cấu hình đơn giản vào bảng `settings`.
- Nếu chưa làm bếp/bar riêng, có thể quản lý trạng thái trực tiếp ở `order_items`.

---

## 10. Công nghệ đề xuất

## 10.1. Backend bắt buộc
### Ngôn ngữ / Framework
- **Java 17 hoặc Java 21**
- Với repo hiện tại, nên chốt **Java 21 LTS** để đồng bộ môi trường build và tránh lỗi biên dịch do đặt target cao hơn JDK đang cài.
- **Spring Boot 3.x**

### Các thành phần nên dùng
- **Spring Web**: xây dựng REST API.
- **Spring Security**: xác thực và phân quyền.
- **Spring Data JPA / Hibernate**: truy cập dữ liệu.
- **Spring Validation**: validate request.
- **Lombok**: giảm code lặp.
- **Springdoc OpenAPI / Swagger**: tài liệu API.

### Cơ sở dữ liệu
Ưu tiên một trong hai lựa chọn:
- **PostgreSQL**: ổn định, mạnh, dễ mở rộng.
- **MySQL**: phổ biến, dễ dùng, phù hợp với bài tập.

Khuyến nghị: **PostgreSQL** nếu nhóm quen dùng; nếu không thì **MySQL** vẫn rất phù hợp.

### Công nghệ bổ sung hợp lý
- **JWT** cho xác thực API.
- **WebSocket + STOMP** cho cập nhật thời gian thực:
  - trạng thái bàn,
  - trạng thái món,
  - đơn từ QR,
  - yêu cầu thanh toán,
  - gọi nhân viên.
- **Flyway** hoặc **Liquibase** để quản lý migration DB.
- **MapStruct** hoặc mapping thủ công cho DTO.
- **Redis** chỉ dùng nếu thật sự cần cache/session/queue đơn giản; không bắt buộc.
- **JavaMailSender** để gửi email đặt bàn / hóa đơn điện tử.
- **ZXing** để sinh QR code.
- **Apache POI** hoặc thư viện export file để xuất Excel/PDF nếu cần.

## 10.2. Frontend đề xuất
Do yêu cầu chính xoay quanh Java Spring Boot, frontend nên chọn giải pháp dễ làm, dễ tích hợp:

### Phương án 1 - Khuyên dùng cho dự án nhỏ
- **React + Vite**
- **Axios**
- **React Router**
- **Bootstrap** hoặc **Tailwind CSS**

Lý do:
- Tách frontend rõ ràng khỏi backend.
- Dễ làm dashboard, POS, trang QR, booking.
- Dễ gọi API REST từ Spring Boot.

### Phương án 2 - Đơn giản hơn nhưng ít linh hoạt hơn
- **Thymeleaf** trong Spring Boot

Phù hợp nếu nhóm muốn gom toàn bộ vào một dự án Java duy nhất. Tuy nhiên với nhiều màn hình động như QR order, POS, dashboard, React vẫn hợp lý hơn.

## 10.3. Công nghệ file / ảnh / mã QR
- Upload ảnh món ăn.
- Tạo và lưu QR code theo bàn.
- Có thể lưu file local ở môi trường dev.
- Nếu muốn tốt hơn, có thể cấu hình cloud storage sau.

---

## 11. Kiến trúc dự án đề xuất

## 11.1. Kiến trúc tổng thể
- **Backend**: Spring Boot REST API.
- **Frontend**: React web app.
- **Database**: PostgreSQL/MySQL.
- **Tùy chọn realtime**: WebSocket.

## 11.2. Nguyên tắc kiến trúc
- Không dùng microservices.
- Không chia module quá vụn.
- Tách theo module nghiệp vụ rõ ràng.
- Ưu tiên dễ hiểu, dễ code, dễ bảo trì.

## 11.3. Cấu trúc backend gợi ý
```text
src/main/java/com/restaurant
├── common
│   ├── config
│   ├── exception
│   ├── response
│   ├── security
│   └── utils
├── modules
│   ├── auth
│   ├── user
│   ├── area
│   ├── diningtable
│   ├── tableqr
│   ├── category
│   ├── menuitem
│   ├── reservation
│   ├── customer
│   ├── order
│   ├── invoice
│   ├── payment
│   ├── promotion
│   ├── report
│   └── notification
└── RestaurantApplication.java
```

### Cấu trúc mỗi module
```text
module-name
├── controller
├── service
├── repository
├── entity
├── dto
└── mapper
```

## 11.4. Cấu trúc frontend gợi ý
```text
src
├── api
├── app
├── components
├── layouts
├── pages
│   ├── public
│   ├── qr
│   ├── admin
│   ├── waiter
│   └── cashier
├── routes
├── hooks
├── store
├── utils
└── types
```

---

## 12. Định hướng API
Hệ thống nên xây theo **RESTful API**.

### Nhóm API chính
- `/api/auth`
- `/api/users`
- `/api/roles`
- `/api/areas`
- `/api/tables`
- `/api/table-qrs`
- `/api/categories`
- `/api/menu-items`
- `/api/customers`
- `/api/reservations`
- `/api/orders`
- `/api/order-items`
- `/api/invoices`
- `/api/payments`
- `/api/promotions`
- `/api/vouchers`
- `/api/reports`
- `/api/public/menu`
- `/api/public/reservations`
- `/api/public/qr/{token}`

### Một số nguyên tắc
- Trả dữ liệu theo JSON.
- Có phân trang với danh sách lớn.
- Có chuẩn response chung.
- Có mã lỗi rõ ràng.
- Các API quản trị phải có xác thực và phân quyền.
- API công khai cho menu/booking/QR chỉ mở đúng phạm vi cần thiết.

---

## 13. Yêu cầu phi chức năng
- Giao diện dễ dùng, rõ ràng, không cần quá cầu kỳ.
- Thời gian phản hồi thao tác thông thường nên nhanh.
- Dữ liệu đơn hàng, hóa đơn, thanh toán phải chính xác.
- Có log lỗi và log thao tác quan trọng.
- Mật khẩu phải mã hóa.
- API cần validate dữ liệu đầu vào.
- Cần có cơ chế chống truy cập trái phép vào chức năng quản trị.
- Dễ chạy local bằng file cấu hình môi trường.

---

## 14. MVP đề xuất
Nếu cần triển khai theo thứ tự ưu tiên, nên làm theo MVP như sau:

### Giai đoạn 1 - Nền tảng
- Đăng nhập / phân quyền.
- CRUD khu vực, bàn, danh mục, món ăn.
- Upload ảnh món ăn.
- Tạo QR cho bàn.

### Giai đoạn 2 - Bán hàng cốt lõi
- Tạo đơn tại bàn / mang đi / giao hàng.
- Chi tiết đơn hàng.
- Trạng thái đơn.
- Thanh toán và hóa đơn.

### Giai đoạn 3 - QR và booking
- Menu public.
- Đặt món qua QR.
- Gọi nhân viên / yêu cầu thanh toán.
- Đặt bàn online.

### Giai đoạn 4 - Mở rộng
- Khuyến mãi / voucher.
- Báo cáo thống kê.
- Hóa đơn điện tử.
- WebSocket realtime.

---

## 15. Tiêu chí hoàn thành hệ thống
Hệ thống được xem là đạt yêu cầu khi:
- Có backend **Java Spring Boot** hoạt động đúng chức năng.
- Có database và dữ liệu được tổ chức hợp lý.
- Có frontend thao tác được với API backend.
- Có đăng nhập và phân quyền.
- Có CRUD cho các entity chính.
- Có luồng order, billing, payment hoạt động.
- Có quản lý bàn, menu, booking, QR theo đúng nghiệp vụ.
- Có xử lý file cơ bản cho ảnh món ăn / QR / hóa đơn nếu áp dụng.
- Có tài liệu API hoặc Swagger.
- Cấu trúc source code rõ ràng, dễ hiểu, phù hợp dự án nhỏ.

---

## 16. Kết luận
Đây là một hệ thống quản lý nhà hàng có phạm vi khá đầy đủ nhưng vẫn phù hợp để triển khai bằng mô hình **Spring Boot monolith + frontend web + database quan hệ**. Trọng tâm của dự án không nằm ở kiến trúc phức tạp, mà ở việc:
- hiểu đúng nghiệp vụ,
- tách module hợp lý,
- xây API rõ ràng,
- xử lý chuẩn các luồng order, bàn, QR, booking, thanh toán,
- và làm giao diện đủ để bao phủ chức năng.

Tài liệu này nên được dùng làm **spec triển khai chính** cho cả người phát triển và AI Agent.
