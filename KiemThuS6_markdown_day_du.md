# KiemThuS6.xlsx -> Markdown

## Phạm vi chuyển đổi và chuẩn hóa
- Bao gồm toàn bộ 6 sheet của workbook gốc: `Phân tích yêu cầu`, `Test-plan`, `Test-design`, `Test-case`, `Test-defect`, `Report`.
- Đã mở rộng các ô gộp (merged cells) thành giá trị lặp lại trên từng dòng liên quan để không mất ngữ cảnh khi đọc Markdown.
- Đã chuẩn hóa xuống dòng cho các ô ở cột `Các bước thực hiện` và `Bộ data test` khi file gốc bị dính nội dung; phần nghĩa nghiệp vụ được giữ nguyên.
- Sheet `Test-case` trong file gốc đang bật filter theo `Kết quả test = F`; bản Markdown này đã khôi phục đầy đủ tất cả test case thay vì chỉ hiển thị các dòng fail.
- Giá trị hiển thị trong Markdown ưu tiên theo **định dạng hiển thị của Excel**, không chỉ theo giá trị thô trong ô.
- Ký hiệu kết quả test được giữ nguyên theo file nguồn: `P = Pass`, `F = Fail`.

## Lưu ý chất lượng nguồn
- Trong `Test-plan` -> `4. Kế hoạch test theo module` -> dòng `2.9 Quản lý khách hàng`, cột `Test nâng cao, tích hợp` đang hiển thị giá trị đơn `5/3/2026`, khác mẫu dải ngày của các dòng cùng bảng. Bản Markdown giữ nguyên giá trị hiển thị này và đánh dấu đây là điểm nên rà soát lại trong file nguồn.

## Tóm tắt nhanh
| Chỉ số | Giá trị |
| --- | --- |
| Tổng sheet | 6 |
| Tổng số test case | 214 |
| Đã thực hiện | 214 (100%) |
| Pass | 203 (95%) |
| Fail | 11 (5%) |

## 1. Sheet: Phân tích yêu cầu
Bảng dưới đây đã được nhóm lại theo từng mảng yêu cầu để dễ tra cứu; nội dung câu hỏi và trả lời được giữ nguyên theo file nguồn.

### Quản lí đăng nhập và phân quyền
| Câu hỏi | Trả lời |
| --- | --- |
| Hệ thống có những vai trò người dùng nào? | Hệ thống cần có 4 vai trò chính: Admin, Quản lý, Nhân viên phục vụ, Thu ngân. |
| Người dùng đăng nhập bằng cách nào? | Người dùng nội bộ đăng nhập bằng tên tài khoản và mật khẩu. |
| Các vai trò có dùng chung chức năng không hay mỗi vai trò có quyền riêng? | Mỗi vai trò có quyền riêng, chỉ được truy cập các chức năng đúng với nhiệm vụ của mình. |
| Admin được phép làm gì trong hệ thống? | Admin có toàn quyền: quản lý tài khoản, phân quyền, theo dõi lịch sử đăng nhập/đăng xuất, và truy cập toàn bộ chức năng hệ thống. |
| Quản lý được phép làm gì? | Quản lý được xem và quản lý các chức năng vận hành nhà hàng như bán hàng, bàn/khu vực, theo dõi nhân viên và báo cáo theo quyền được cấp. |
| Nhân viên phục vụ có quyền gì? | Nhân viên phục vụ được tạo đơn, chọn món, cập nhật món trước khi thanh toán, quản lý đơn theo bàn và hỗ trợ phục vụ khách. |
| Thu ngân có quyền gì? | Thu ngân được xử lý thanh toán, áp dụng giảm giá/voucher/combo, tách/gộp hóa đơn, in hóa đơn và gửi hóa đơn điện tử nếu có cấu hình. |

### Quản lí bán hàng
| Câu hỏi | Trả lời |
| --- | --- |
| Nhà hàng cần hỗ trợ những hình thức bán hàng nào? | Cần hỗ trợ 3 hình thức: ăn tại bàn, mang đi, giao hàng. |
| Khi tạo đơn, nhân viên có thể chọn món và nhập ghi chú không? | Có. Mỗi món phải nhập được số lượng và ghi chú riêng như ít đá, không cay, thêm topping... |
| Trước khi thanh toán, đơn hàng có được chỉnh sửa không? | Có. Nhân viên cần được thêm/sửa/xóa món trong đơn trước khi xác nhận thanh toán. |
| Hệ thống có cần hỗ trợ tách hóa đơn không? | Có. Cần tách hóa đơn theo bàn, theo khách hoặc theo món tùy tình huống thực tế. |
| Có cần gộp hóa đơn không? | Có. Khi khách đổi bàn hoặc thanh toán chung thì hệ thống phải cho phép gộp hóa đơn. |
| Nhà hàng áp dụng các loại khuyến mãi nào? | Hệ thống cần hỗ trợ giảm giá trực tiếp, voucher, combo khuyến mãi. |
| Các khoản tính thêm trên hóa đơn gồm những gì? | Hệ thống cần tính được thuế, phụ phí và phí dịch vụ theo cấu hình của nhà hàng. |
| Sau khi thanh toán có thể in hóa đơn không? | Có. Hệ thống phải cho phép in hóa đơn cho khách ngay sau khi thanh toán. |
| Nhà hàng có dùng hóa đơn điện tử không? | Nếu nhà hàng có cấu hình sử dụng thì hệ thống phải cho phép gửi hóa đơn điện tử cho khách. |
| Có phân quyền thao tác bán hàng theo vai trò không? | Có. Nhân viên phục vụ, thu ngân, quản lý/Admin sẽ thao tác theo quyền được cấp trong quy trình bán hàng. |

### Quản lí bàn và khu vực
| Câu hỏi | Trả lời |
| --- | --- |
| Nhà hàng có cần quản lý bàn theo từng khu vực không? | Có. Bàn phải được chia theo khu vực như tầng 1, tầng 2, phòng VIP, ngoài trời. |
| Có cần tạo, sửa, xóa bàn trên hệ thống không? | Có. Quản lý/Admin phải thực hiện được tạo/sửa/xóa bàn. |
| Mỗi bàn có cần gán vào một khu vực cụ thể không? | Có. Mỗi bàn phải thuộc về một khu vực xác định để dễ quản lý và sắp xếp. |
| Bàn cần có những trạng thái nào? | Cần có các trạng thái: trống, đang phục vụ, đã đặt trước, khóa sử dụng. |
| Có cần khóa bàn tạm thời không? | Có. Một số bàn có thể khóa sử dụng khi bảo trì, không phục vụ hoặc theo yêu cầu vận hành. |
| Mỗi bàn có cần mã QR riêng không? | Có. Mỗi bàn phải có một mã QR riêng liên kết đúng với bàn đó. |
| Có thể in hoặc tải mã QR của từng bàn không? | Có. Hệ thống phải hỗ trợ in hoặc tải QR để dán tại bàn. |
| Có cần lưu số ghế tối đa của từng bàn không? | Có. Hệ thống phải cho phép thiết lập và thay đổi số ghế tối đa của từng bàn. |
| Một bàn có thể trùng mã định danh với bàn khác không? | Không. Mỗi bàn phải có một mã định danh duy nhất. |
| Hai bàn có thể dùng chung một mã QR không? | Không. Không cho phép hai bàn dùng cùng một QR. |
| QR có bắt buộc liên kết chính xác với đúng một bàn không? | Có. Mỗi QR phải liên kết chính xác với một bàn duy nhất để tránh nhầm lẫn khi vận hành. |

### Quản lý thực đơn và món ăn
| Câu hỏi | Trả lời |
| --- | --- |
| Hệ thống có cần quản lý đầy đủ thông tin món ăn không? | Có. Hệ thống cần quản lý tên món, danh mục, giá bán, hình ảnh, mô tả và tình trạng phục vụ của từng món. |
| Có cần cho phép thêm, sửa, xóa món ăn không? | Có. Quản lý/Admin phải thao tác được thêm / sửa / xóa món ăn trong thực đơn. |
| Món ăn có cần được phân loại theo nhóm không? | Có. Món ăn cần được phân loại theo các danh mục Khai vị, Món chính, Tráng miệng, Nước uống, Combo. |
| Giá bán của món có thể thay đổi và cập nhật trên hệ thống không? | Có. Hệ thống phải cho phép cập nhật giá bán của từng món khi cần. |
| Hệ thống có cần hiển thị hình ảnh món ăn không? | Có. Mỗi món nên có hình ảnh hiển thị để khách và nhân viên dễ nhận biết. |
| Có cần nhập mô tả cho món ăn không? | Có. Hệ thống cần lưu được mô tả ngắn của món để hỗ trợ hiển thị trên menu. |
| Món ăn có cần quản lý trạng thái phục vụ không? | Có. Mỗi món phải có trạng thái còn bán / hết món / tạm ngưng. |
| Khi món hết hàng hoặc tạm ngưng, hệ thống có cần cập nhật ngay trên menu không? | Có. Hệ thống cần phản ánh đúng trạng thái món để tránh khách hoặc nhân viên chọn nhầm món không còn phục vụ. |
| Có cần cấu hình món cay hoặc không cay không? | Có. Hệ thống phải hỗ trợ thuộc tính cay / không cay cho món ăn. |
| Có cần hỗ trợ nhiều kích cỡ cho một món không? | Có. Hệ thống cần cho phép cấu hình kích cỡ nếu món có nhiều size. |
| Có cần cấu hình thêm topping cho món không? | Có. Hệ thống cần hỗ trợ topping cho các món có phát sinh lựa chọn thêm. |
| Có cần cho phép nhập ghi chú đặc biệt cho món không? | Có. Hệ thống cần hỗ trợ ghi chú đặc biệt cho từng món, ví dụ ít đá, không hành, thêm sốt... |
| Combo có được quản lý như một loại món riêng không? | Có. Combo được xem là một danh mục món và cần được quản lý như các nhóm món khác. |

### Đặt món qua QR tại bàn
| Câu hỏi | Trả lời |
| --- | --- |
| Khách hàng có cần đăng nhập để đặt món qua QR không? | Không. Khách chỉ cần quét mã QR tại bàn để truy cập trang đặt món, không cần đăng nhập. |
| Điều kiện để khách sử dụng QR đặt món là gì? | Bàn phải đã được tạo trong hệ thống, QR còn hiệu lực và bàn đang ở trạng thái cho phép phục vụ. |
| Sau khi quét QR, hệ thống có tự nhận diện đúng bàn không? | Có. Hệ thống phải tự nhận diện bàn từ QR và mở đúng menu của bàn đó. |
| Sau khi quét mã, khách sẽ thấy thông tin gì? | Hệ thống sẽ hiển thị thông tin bàn và menu khả dụng tương ứng với bàn đó. |
| Menu hiển thị qua QR có cần cập nhật theo thời gian thực không? | Có. Hệ thống phải hiển thị menu theo thời gian thực, đặc biệt với trạng thái còn món/hết món. |
| Khách có thể chọn món, số lượng, tùy chọn và ghi chú không? | Có. Khách phải chọn được món, số lượng, tùy chọn và ghi chú cho từng món. |
| Khách có thể thêm món vào giỏ rồi mới xác nhận không? | Có. Hệ thống phải cho phép thêm món vào giỏ hàng trước khi xác nhận đặt món. |
| Sau khi khách xác nhận đặt món, hệ thống xử lý thế nào? | Hệ thống sẽ ghi nhận đơn vào đúng bàn, thông báo thành công và chuyển đơn đến màn hình nhân viên hoặc bếp theo cấu hình. |
| Nhiều khách cùng một bàn có thể đặt món cùng lúc không? | Có. Hệ thống phải cho phép nhiều khách cùng một bàn cùng đặt món. |
| Các món khách gọi từ QR có được gom chung không? | Có. Hệ thống phải gom món vào cùng một phiên bàn hoặc cùng một hóa đơn theo cấu hình của nhà hàng. |
| Khách có thể gọi thêm món nhiều lần trong suốt bữa ăn không? | Có. Hệ thống phải cho phép gọi thêm món nhiều lần trong suốt thời gian bàn đang phục vụ. |
| Khách có theo dõi được trạng thái món sau khi đặt không? | Có. Hệ thống phải hiển thị các trạng thái Đã gửi / Đang chuẩn bị / Đã lên món. |
| Từ giao diện QR, khách có thể gọi nhân viên không? | Có. Hệ thống phải có nút Gọi nhân viên. |
| Khách có thể yêu cầu thêm nước, chén, khăn giấy từ giao diện QR không? | Có. Hệ thống phải hỗ trợ các yêu cầu phục vụ như xin thêm nước / chén / khăn giấy. |
| Khách có thể yêu cầu thanh toán từ giao diện QR không? | Có. Hệ thống phải có chức năng Yêu cầu thanh toán ngay trên giao diện QR. |
| Nếu QR không hợp lệ thì hệ thống xử lý thế nào? | Hệ thống phải hiển thị thông báo lỗi khi QR không hợp lệ. |
| Nếu QR đã hết hiệu lực thì sao? | Hệ thống phải thông báo QR hết hiệu lực và yêu cầu khách liên hệ nhân viên. |
| Nếu bàn đang bị khóa thì khách có vào được trang đặt món không? | Không. Nếu bàn đang khóa, hệ thống phải từ chối truy cập. |
| Nếu món vừa hết trong lúc khách đang đặt thì xử lý thế nào? | Hệ thống phải thông báo món vừa hết và yêu cầu khách chọn món khác. |
| Nếu bị mất kết nối mạng khi đang đặt món thì sao? | Hệ thống cần lưu tạm giỏ hàng cục bộ và thông báo khách thử lại khi có kết nối. |
| Một mã QR có thể gắn cho nhiều bàn cùng lúc không? | Không. Một QR chỉ được gắn với một bàn tại một thời điểm. |
| Khách có được đổi sang bàn khác từ giao diện QR không? | Không. Khách không được đổi bàn từ giao diện QR. |
| Mọi đơn phát sinh từ QR có bắt buộc gắn với đúng bàn quét mã không? | Có. Mọi đơn từ QR phải gắn với đúng bàn phát sinh. |
| Đơn từ QR có cần nhân viên xác nhận trước khi xuống bếp không? | Tùy cấu hình nhà hàng. Hệ thống phải hỗ trợ 2 phương án: nhân viên xác nhận trước khi xuống bếp hoặc tự động chuyển thẳng xuống bếp. |
| Nếu bàn đang mở hóa đơn rồi mà khách quét QR gọi thêm món thì xử lý thế nào? | Nếu bàn đang mở hóa đơn, đơn mới từ QR sẽ được cộng dồn vào hóa đơn đang mở theo cấu hình. |

### Quản lý đặt bàn
| Câu hỏi | Trả lời |
| --- | --- |
| Hệ thống có cần cho phép khách hàng đặt bàn online không? | Có. Hệ thống phải cho phép khách hàng đặt bàn online trước khi đến nhà hàng. |
| Khi đặt bàn, khách có cần chọn ngày và giờ đặt không? | Có. Khách phải chọn được ngày đặt bàn và giờ đặt bàn. |
| Khách có cần nhập số lượng người khi đặt bàn không? | Có. Hệ thống phải cho phép nhập số lượng người để nhà hàng sắp xếp bàn phù hợp. |
| Khách có được chọn khu vực mong muốn không? | Có. Hệ thống phải cho phép khách chọn khu vực mong muốn khi đặt bàn. |
| Hệ thống có cần lưu thông tin liên hệ của khách đặt bàn không? | Có. Hệ thống phải cho phép nhập thông tin liên hệ của khách khi đặt bàn. |
| Khách có thể ghi chú yêu cầu đặc biệt khi đặt bàn không? | Có. Khách có thể ghi chú các yêu cầu như bàn gần cửa sổ, ghế em bé, trang trí sinh nhật, không gian riêng. |
| Nhà hàng có cần xác nhận đặt bàn không? | Có. Hệ thống phải cho phép nhà hàng xác nhận đặt bàn sau khi nhận yêu cầu. |
| Hệ thống có cần hỗ trợ hủy đặt bàn không? | Có. Hệ thống phải cho phép hủy đặt bàn khi cần. |
| Hệ thống có cần hỗ trợ đổi lịch đặt bàn không? | Có. Hệ thống phải cho phép thay đổi lịch đặt bàn khi khách hoặc nhà hàng có nhu cầu. |
| Hệ thống có cần gửi nhắc lịch đặt bàn cho khách không? | Có. Hệ thống phải gửi thông báo nhắc lịch qua SMS hoặc email. |
| Nhân viên có cần xem danh sách bàn đã đặt theo thời gian và khu vực không? | Có. Nhân viên phải xem được danh sách bàn đã đặt theo ngày, giờ và khu vực. |

### Quản lý đơn hàng
| Câu hỏi | Trả lời |
| --- | --- |
| Hệ thống có cần quản lý toàn bộ vòng đời đơn hàng không? | Có. Hệ thống phải quản lý đầy đủ toàn bộ vòng đời của đơn hàng từ lúc tạo đến khi hoàn tất hoặc hủy. |
| Đơn hàng cần có những trạng thái nào? | Đơn hàng cần có các trạng thái: Mới tạo, Chờ xác nhận, Đã xác nhận, Đang chế biến, Đã phục vụ một phần, Hoàn tất, Đã hủy. |
| Đơn hàng có thể được tạo từ những nguồn nào? | Hệ thống phải cho phép tạo đơn từ nhân viên phục vụ, đặt món qua QR, mang đi, giao hàng. |
| Trước khi xác nhận, có được chỉnh sửa số lượng món không? | Có. Hệ thống phải cho phép chỉnh sửa số lượng món trước khi xác nhận đơn hàng. |
| Có cần hỗ trợ hủy món hoặc hủy đơn không? | Có. Hệ thống phải cho phép hủy món hoặc hủy cả đơn. |
| Khi hủy món hoặc hủy đơn có cần ghi lý do không? | Có. Việc hủy món hoặc hủy đơn phải ghi rõ lý do để tiện theo dõi và kiểm soát. |
| Hệ thống có cần tách đơn hàng không? | Có. Hệ thống phải cho phép tách đơn theo khách hoặc theo món. |
| Hệ thống có cần gộp đơn hàng không? | Có. Hệ thống phải cho phép gộp đơn nếu cần. |
| Có cần theo dõi lịch sử thay đổi của đơn hàng không? | Có. Hệ thống phải lưu và theo dõi lịch sử thay đổi đơn hàng. |

### Thanh toán và hóa đơn
| Câu hỏi | Trả lời |
| --- | --- |
| Hệ thống có cần tạo hóa đơn từ đơn hàng không? | Có. Hệ thống phải cho phép tạo hóa đơn từ đơn hàng. |
| Khi thanh toán có cần áp dụng giảm giá, voucher, khuyến mãi không? | Có. Hệ thống phải hỗ trợ áp dụng giảm giá, voucher và khuyến mãi khi thanh toán. |
| Hệ thống có cần tính VAT và phí dịch vụ không? | Có. Hệ thống phải hỗ trợ tính thuế VAT và phí dịch vụ nếu nhà hàng có áp dụng. |
| Hệ thống cần hỗ trợ những phương thức thanh toán nào? | Hệ thống cần hỗ trợ tiền mặt, thẻ, ví điện tử, chuyển khoản/QR thanh toán. |
| Sau khi thanh toán có thể in hóa đơn không? | Có. Hệ thống phải cho phép in hóa đơn cho khách. |
| Nhà hàng có thể gửi hóa đơn điện tử không? | Có. Nếu nhà hàng có cấu hình sử dụng thì hệ thống phải cho phép gửi hóa đơn điện tử. |
| Hệ thống có cần cho phép tách hóa đơn không? | Có. Hệ thống phải cho phép tách hóa đơn khi khách yêu cầu. |
| Từ giao diện QR tại bàn, khách có thể yêu cầu thanh toán không? | Có. Khách từ giao diện QR có thể bấm “Yêu cầu thanh toán”. |
| Khi khách bấm “Yêu cầu thanh toán” từ QR thì hệ thống xử lý thế nào? | Hệ thống phải gửi thông báo cho thu ngân hoặc nhân viên phục vụ để xử lý thanh toán. |
| Khách có bắt buộc phải tự thanh toán online từ giao diện QR không? | Không. Không bắt buộc cho khách tự thanh toán nếu nhà hàng chưa bật tính năng thanh toán online. |

### Quản lý khách hàng
| Câu hỏi | Trả lời |
| --- | --- |
| Hệ thống có cần lưu thông tin khách hàng không? | Có. Hệ thống cần lưu trữ thông tin khách hàng để phục vụ chăm sóc và marketing. |
| Có cần cho phép tạo và sửa thông tin khách hàng không? | Có. Hệ thống phải cho phép tạo và sửa thông tin khách hàng. |
| Hệ thống có cần lưu số điện thoại và tên khách không? | Có. Hệ thống phải lưu được số điện thoại và tên khách hàng. |
| Có cần lưu lịch sử dùng bữa của khách không? | Có. Hệ thống phải lưu lịch sử dùng bữa của khách hàng. |
| Có cần tích điểm thành viên cho khách không? | Có. Hệ thống phải hỗ trợ tích điểm thành viên. |

### Quản lý khuyến mãi
| Câu hỏi | Trả lời |
| --- | --- |
| Ai là người sử dụng chức năng quản lý khuyến mãi? | Các tác nhân liên quan là Quản lý/Admin và Thu ngân. |
| Hệ thống có cần cho phép tạo, sửa, xóa chương trình khuyến mãi không? | Có. Hệ thống phải cho phép tạo / sửa / xóa chương trình khuyến mãi. |
| Khuyến mãi có thể thiết lập theo những đối tượng nào? | Có thể thiết lập theo món ăn, nhóm món, combo, hóa đơn, khung giờ, ngày áp dụng. |
| Hệ thống có cần hỗ trợ nhiều hình thức khuyến mãi khác nhau không? | Có. Hệ thống phải hỗ trợ giảm theo phần trăm, giảm số tiền cố định, mua 1 tặng 1, tặng món, combo giá ưu đãi, voucher/mã giảm giá. |
| Có cần cấu hình điều kiện áp dụng khuyến mãi không? | Có. Hệ thống phải cho phép cấu hình các điều kiện như giá trị đơn tối thiểu, số lượng món tối thiểu, khung giờ cụ thể, đối tượng khách hàng cụ thể. |
| Khi áp dụng khuyến mãi, hệ thống có cần tự kiểm tra điều kiện hợp lệ không? | Có. Hệ thống phải tự động kiểm tra điều kiện hợp lệ khi áp dụng khuyến mãi. |
| Khuyến mãi có thể được áp dụng thủ công hoặc tự động không? | Có. Hệ thống phải cho phép áp dụng thủ công hoặc tự động theo cấu hình. |
| Thông tin khuyến mãi có cần hiển thị trên giao diện bán hàng không? | Có. Hệ thống phải hiển thị thông tin khuyến mãi trên giao diện bán hàng. |
| Khuyến mãi có cần hiển thị trên giao diện menu QR không? | Có, nếu nhà hàng bật tính năng này thì hệ thống phải hiển thị khuyến mãi trên menu QR. |
| Hệ thống có cần giới hạn số lần sử dụng voucher hoặc chương trình khuyến mãi không? | Có. Hệ thống phải cho phép giới hạn số lần sử dụng voucher hoặc chương trình khuyến mãi. |
| Có thể bật hoặc tắt chương trình khuyến mãi mà không cần xóa không? | Có. Hệ thống phải cho phép bật/tắt chương trình khuyến mãi mà không cần xóa. |

### Báo cáo và thống kê
| Câu hỏi | Trả lời |
| --- | --- |
| Ai được phép xem báo cáo và thống kê? | Chức năng này dành cho Quản lý/Admin. |
| Hệ thống có cần cho phép xem báo cáo theo nhiều khoảng thời gian không? | Có. Hệ thống phải cho phép xem báo cáo theo ngày, tuần, tháng, năm và khoảng thời gian tùy chọn. |
| Báo cáo doanh thu cần gồm những nội dung gì? | Hệ thống phải cung cấp báo cáo tổng doanh thu và doanh thu theo hình thức bán hàng. |
| Báo cáo đơn hàng cần thể hiện những chỉ số nào? | Hệ thống phải cung cấp báo cáo về số lượng đơn hàng, đơn đã hoàn tất, đơn bị hủy. |
| Người dùng có cần lọc và tìm kiếm dữ liệu báo cáo không? | Có. Hệ thống phải cho phép lọc và tìm kiếm báo cáo theo nhu cầu quản lý. |
| Hệ thống có cần xuất báo cáo ra file không? | Có. Hệ thống phải cho phép xuất báo cáo ra Excel hoặc PDF. |

## 2. Sheet: Test-plan
### 2.1. Tổng quan dự án
| Hạng mục | Giá trị |
| --- | --- |
| Phạm vi | Test toàn bộ module 2.1 đến 2.11 |
| Ngày bắt đầu | 19/01/2026 |
| Ngày kết thúc | 27/03/2026 |
| Tổng số ngày | 68 |
| Tổng số module | 11 |
| Tổng test case ước lượng | 365 |
| Team size | 3 |

### 2.2. Danh sách module
| Module | Tên module | TC ước lượng | Nhân lực |
| --- | --- | --- | --- |
| 2.1 | Quản lí đăng nhập và phân quyền | 25 | Hương |
| 2.2 | Quản lí bán hàng | 60 | Phúc |
| 2.3 | Quản lí bàn và khu vực | 25 | Hương |
| 2.4 | Quản lý thực đơn và món ăn | 30 | Lộc |
| 2.5 | Đặt món qua QR tại bàn | 45 | Phúc |
| 2.6 | Quản lí đặt bàn | 25 | Hương |
| 2.7 | Quản lý đơn hàng | 35 | Phúc |
| 2.8 | Thanh toán và hóa đơn | 40 | Phúc |
| 2.9 | Quản lý khách hàng | 20 | Lộc |
| 2.10 | Quản lý khuyến mãi | 35 | Hương |
| 2.11 | Báo cáo và thống kê | 25 | Lộc |

### 2.3. Các giai đoạn chính
| Giai đoạn | Bắt đầu | Kết thúc | Hương | Phúc | Lộc |
| --- | --- | --- | --- | --- | --- |
| 1. Phân tích yêu cầu & lập plan | 19/01/2026 | 24/01/2026 | phân tích 2.1,2.3, 2.6, 2.10 | phân tích 2.2,2.5, 2.7, 2.8 | phân tích module 2.4, 2.9, 2.11 |
| 2. Thiết kế test case | 25/01/2026 | 05/02/2026 | Viết test case cho các module mình phụ trách | Viết test case cho các module mình phụ trách | Viết test case cho các module mình phụ trách |
| 3. Chuẩn bị môi trường, test data | 06/02/2026 | 08/02/2026 | Chuẩn bị dữ liệu về role, bàn, khu vực, đặt bàn, khuyến mãi | Chuẩn bị dữ liệu đơn hàng, thanh toán, VAT, QR,voucher, hóa đơn | Chuẩn bị dữ liệu menu, khách hàng, báo cáo |
| 4. Test các chức năng cơ bản | 09/02/2026 | 15/02/2026 | Test đăng nhập/phân quyền và bàn/khu vực | Test luồng cơ bản của bán hàng và kiểm tra QR có vào được đúng trang không | Test thực đơn/món ăn  |
| 5. Test các nghiệp vụ chính | 16/02/2026 | 22/02/2026 | Test đặt bàn và phần cơ bản của khuyến mãi | Test sâu hơn phần bán hàng, đặt món QR, quản lý đơn hàng | Test phần cơ bản của quản lý khách hàng |
| 6. Test nâng cao, tích hợp | 23/02/2026 | 01/03/2026 | Test các trường hợp phân quyền khó, dữ liệu sai, tình huống âm của 2.3/2.6/2.10 | Test thanh toán, tách/gộp/hủy và liên kết giữa bán hàng với đơn hàng | Test QR ở các tình huống lỗi như nhiều người cùng đặt, mất mạng, giỏ hàng cục bộ |
| 7. Test luồng thực tế từ đầu đến cuối | 02/03/2026 | 08/03/2026 | Chạy luồng từ đặt bàn → vào bàn → bán hàng | Chạy luồng từ bán hàng → thanh toán → hóa đơn | Test báo cáo và chạy luồng QR → khách hàng → báo cáo |
| 8. Test lại sau khi sửa lỗi | 09/03/2026 | 24/03/2026 | Retest bug mình phụ trách và regression các chức năng ưu tiên cao | Retest bug mình phụ trách và regression các chức năng ưu tiên cao | Retest bug mình phụ trách và regression cả ưu tiên cao lẫn một phần ưu tiên vừa |
| 9. Tổng kết và chốt dự án test | 24/03/2026 | 27/03/2026 | Tổng hợp kết quả test | Tổng hợp số liệu lỗi, thống kê defect | Hoàn tất RTM, lưu bằng chứng test |

### 2.4. Kế hoạch test theo module
| Module | Thời hạn | Thiết kế TC | Test chức năng | Test nâng cao, tích hợp | Regression | Trọng tâm test | Phương thức |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2.1 Quản lí đăng nhập và phân quyền | 53 ngày | 25/01 – 29/01 | 09/02 – 11/02 | 23/02 | 09/03 – 18/03 | đăng nhập, vai trò, phân quyền, log đăng nhập/đăng xuất | Thủ công |
| 2.2 Quản lí bán hàng | 53 ngày | 25/01 – 31/01 | 09/02 – 22/02 | 24/02 – 01/03 | 09/03 – 18/03 | tạo đơn, loại phục vụ, thêm/sửa món, tách/gộp hóa đơn, khuyến mãi, thuế/phụ phí | Thủ công |
| 2.3 Quản lí bàn và khu vực | 53 ngày | 25/01 – 29/01 | 09/02 – 12/02 | 23/02 – 24/02 | 09/03 – 18/03 | CRUD bàn, trạng thái bàn, khu vực, QR riêng, số ghế | Thủ công |
| 2.4 Quản lý thực đơn và món ăn | 53 ngày | 25/01 – 30/01 | 11/02 – 15/02 | 25/02 | 09/03 – 18/03 | CRUD món, danh mục, giá, trạng thái bán, topping/size/ghi chú | Thủ công |
| 2.5 Đặt món qua QR tại bàn | 53 ngày | 31/01 – 05/02 | 16/02 – 22/02 | 23/02 – 04/03 | 09/03 – 24/03 | QR hợp lệ/hết hạn, nhiều khách cùng bàn, trạng thái món, gọi thêm, yêu cầu phục vụ | Thủ công |
| 2.6 Quản lí đặt bàn | 48 ngày | 30/01 – 01/02 | 16/02 – 18/02 | 24/02 – 25/02 | 09/03 – 18/03 | đặt bàn online, đổi lịch, hủy, xác nhận, nhắc lịch | Thủ công |
| 2.7 Quản lý đơn hàng | 46 ngày | 01/02 – 04/02 | 17/02 – 22/02 | 26/02 – 01/03 | 09/03 – 18/03 | trạng thái đơn, hủy món/đơn, lý do hủy, lịch sử thay đổi | Thủ công |
| 2.8 Thanh toán và hóa đơn | 48 ngày | 05/02 – 07/02 | 28/02 – 03/03 | 04/03 – 06/03 | 09/03 – 24/03 | hóa đơn, VAT, phí dịch vụ, đa phương thức thanh toán, QR thanh toán | Thủ công |
| 2.9 Quản lý khách hàng | 45 ngày | 02/02 – 04/02 | 19/02 – 22/02 | 5/3/2026 | 09/03 – 18/03 | CRUD khách hàng, lịch sử dùng bữa, tích điểm, phân nhóm | Thủ công |
| 2.10 Quản lý khuyến mãi | 45 ngày | 02/02 – 05/02 | 16/02 – 20/02 | 26/02 – 01/03 | 09/03 – 18/03 | rule khuyến mãi, điều kiện áp dụng, voucher, tự động/thủ công | Thủ công |
| 2.11 Báo cáo và thống kê | 48 ngày | 05/02 – 07/02 | 04/03 – 06/03 | 07/03 – 08/03 | 16/03 – 24/03 | lọc theo thời gian, doanh thu, đơn hàng, export Excel/PDF | Thủ công |

> Lưu ý nguồn: riêng dòng `2.9 Quản lý khách hàng`, cột `Test nâng cao, tích hợp` đang hiển thị `5/3/2026` thay vì một dải ngày như các dòng khác. Nội dung này được giữ nguyên theo file gốc để tránh tự suy diễn sai.

## 3. Sheet: Test-design
Nội dung được trình bày theo đúng 3 nhóm nhân sự phụ trách trong file nguồn.

### 3.1. Trần Kim Hương
**Phụ trách: 2.1, 2.3, 2.6, 2.10**

| Module | Chức năng | Tiêu chí kiểm thử | Loại kiểm thử |
| --- | --- | --- | --- |
| 2.1 Quản lí đăng nhập và phân quyền | Đăng nhập bằng tài khoản và mật khẩu | Người dùng đăng nhập thành công với tài khoản hợp lệ; báo lỗi đúng khi sai tài khoản/mật khẩu | Function |
| 2.1 Quản lí đăng nhập và phân quyền | Giao diện đăng nhập | Form hiển thị đúng trường nhập, nút đăng nhập, thông báo lỗi rõ ràng, dễ nhìn | GUI |
| 2.1 Quản lí đăng nhập và phân quyền | Phân quyền theo vai trò Admin | Admin thấy đúng các menu và thao tác quản trị được phép dùng | Function |
| 2.1 Quản lí đăng nhập và phân quyền | Phân quyền theo vai trò Quản lý | Quản lý chỉ thấy và thao tác được các chức năng thuộc quyền quản lý | Function |
| 2.1 Quản lí đăng nhập và phân quyền | Phân quyền theo vai trò Nhân viên phục vụ | Nhân viên phục vụ chỉ truy cập được chức năng phục vụ/bán hàng liên quan | Function |
| 2.1 Quản lí đăng nhập và phân quyền | Phân quyền theo vai trò Thu ngân | Thu ngân chỉ truy cập được các chức năng thanh toán/hóa đơn theo quyền | Function |
| 2.1 Quản lí đăng nhập và phân quyền | Chặn truy cập trái quyền | Người dùng không thể mở màn hình/chức năng ngoài quyền, kể cả bằng URL trực tiếp | Function + Non-function |
| 2.1 Quản lí đăng nhập và phân quyền | Ghi log đăng nhập/đăng xuất | Hệ thống lưu được thời gian đăng nhập, đăng xuất, tài khoản, trạng thái thao tác | Function |
| 2.1 Quản lí đăng nhập và phân quyền | Ổn định phiên đăng nhập | Sau đăng nhập hệ thống giữ phiên ổn định, không tự thoát bất thường | Non-function |
| 2.3 Quản lí bàn và khu vực | Tạo khu vực | Tạo mới khu vực thành công, tên khu vực hiển thị đúng trên danh sách | Function + GUI |
| 2.3 Quản lí bàn và khu vực | Tạo bàn | Tạo mới bàn thành công với mã bàn duy nhất, thuộc đúng khu vực | Function |
| 2.3 Quản lí bàn và khu vực | Sửa thông tin bàn | Sửa được tên/mã bàn, khu vực, số ghế tối đa, thông tin cập nhật đúng | Function |
| 2.3 Quản lí bàn và khu vực | Xóa bàn | Xóa bàn đúng điều kiện; hệ thống cảnh báo nếu bàn đang được sử dụng hoặc có ràng buộc | Function |
| 2.3 Quản lí bàn và khu vực | Gán bàn vào khu vực | Bàn hiển thị đúng khu vực sau khi gán/chuyển khu vực | Function |
| 2.3 Quản lí bàn và khu vực | Thiết lập trạng thái bàn | Đổi đúng các trạng thái: Trống, Đang phục vụ, Đã đặt trước, Khóa sử dụng | Function |
| 2.3 Quản lí bàn và khu vực | Hiển thị trạng thái bàn trên giao diện | Màu sắc/trạng thái bàn hiển thị rõ ràng, dễ nhận biết, đồng nhất | GUI |
| 2.3 Quản lí bàn và khu vực | Tạo/gán QR cho bàn | Mỗi bàn có đúng 1 QR, QR liên kết đúng bàn, không trùng QR giữa các bàn | Function |
| 2.3 Quản lí bàn và khu vực | In/tải QR bàn | QR in/tải được, nội dung QR quét ra đúng bàn tương ứng | Function + Non-function |
| 2.3 Quản lí bàn và khu vực | Cập nhật số ghế tối đa | Hệ thống lưu đúng số ghế tối đa và dùng được cho các chức năng liên quan | Function |
| 2.3 Quản lí bàn và khu vực | Kiểm soát tính duy nhất của bàn | Không cho phép tạo 2 bàn trùng mã định danh | Function |
| 2.6 Quản lí đặt bàn | Khách đặt bàn online | Khách tạo yêu cầu đặt bàn thành công mà không cần thao tác nội bộ | Function |
| 2.6 Quản lí đặt bàn | Chọn ngày/giờ đặt bàn | Hệ thống nhận đúng ngày, giờ; chặn thời gian không hợp lệ | Function |
| 2.6 Quản lí đặt bàn | Nhập số lượng người | Hệ thống lưu đúng số lượng người và dùng để gợi ý/xác nhận bàn phù hợp | Function |
| 2.6 Quản lí đặt bàn | Chọn khu vực mong muốn | Khu vực khách chọn được ghi nhận và hiển thị cho nhà hàng xử lý | Function |
| 2.6 Quản lí đặt bàn | Nhập thông tin liên hệ khách | Hệ thống lưu được tên, số điện thoại/email và kiểm tra định dạng cơ bản | Function + GUI |
| 2.6 Quản lí đặt bàn | Ghi chú yêu cầu đặc biệt | Ghi chú như bàn gần cửa sổ, ghế em bé, sinh nhật... được lưu đúng | Function |
| 2.6 Quản lí đặt bàn | Nhà hàng xác nhận đặt bàn | Nhân viên xác nhận được yêu cầu đặt bàn, trạng thái cập nhật đúng | Function |
| 2.6 Quản lí đặt bàn | Hủy đặt bàn | Đặt bàn bị hủy đúng quy trình, trạng thái thay đổi đúng, không giữ chỗ nữa | Function |
| 2.6 Quản lí đặt bàn | Đổi lịch đặt bàn | Cho phép dời ngày/giờ/khu vực khi hợp lệ, dữ liệu cập nhật đồng bộ | Function |
| 2.6 Quản lí đặt bàn | Nhắc lịch qua SMS/email | Thông báo nhắc lịch được tạo/gửi đúng cấu hình, đúng người nhận | Function + Non-function |
| 2.6 Quản lí đặt bàn | Xem danh sách đặt bàn theo ngày/giờ/khu vực | Nhân viên lọc và xem được danh sách bàn đặt theo điều kiện yêu cầu | Function + GUI |
| 2.10 Quản lí khuyến mãi | Tạo chương trình khuyến mãi | Tạo mới chương trình thành công, lưu đúng tên, thời gian, phạm vi áp dụng | Function |
| 2.10 Quản lí khuyến mãi | Sửa/xóa chương trình khuyến mãi | Sửa và xóa được chương trình đúng điều kiện, dữ liệu cập nhật chính xác | Function |
| 2.10 Quản lí khuyến mãi | Thiết lập khuyến mãi theo món/nhóm món/combo/hóa đơn | Hệ thống áp dụng đúng đối tượng được chọn | Function |
| 2.10 Quản lí khuyến mãi | Thiết lập theo khung giờ/ngày áp dụng | Khuyến mãi chỉ có hiệu lực trong đúng thời gian cấu hình | Function |
| 2.10 Quản lí khuyến mãi | Cấu hình loại khuyến mãi | Hỗ trợ đúng các loại: % giảm, số tiền cố định, mua 1 tặng 1, tặng món, combo, voucher | Function |
| 2.10 Quản lí khuyến mãi | Cấu hình điều kiện áp dụng | Kiểm tra đúng giá trị đơn tối thiểu, số lượng món, khung giờ, nhóm khách hàng | Function |
| 2.10 Quản lí khuyến mãi | Tự động kiểm tra hợp lệ | Khi áp dụng khuyến mãi, hệ thống tự xác định đủ/không đủ điều kiện | Function |
| 2.10 Quản lí khuyến mãi | Áp dụng thủ công hoặc tự động | Nhân viên áp dụng tay được; hệ thống cũng tự áp dụng được nếu bật cấu hình | Function |
| 2.10 Quản lí khuyến mãi | Hiển thị khuyến mãi trên giao diện bán hàng/menu QR | Thông tin khuyến mãi hiển thị rõ ràng, đúng nội dung, không gây nhầm | GUI + Function |
| 2.10 Quản lí khuyến mãi | Giới hạn số lần sử dụng voucher/chương trình | Không vượt quá số lần sử dụng đã cấu hình | Function |
| 2.10 Quản lí khuyến mãi | Bật/tắt chương trình không cần xóa | Khi tắt, chương trình không còn áp dụng; khi bật lại, áp dụng đúng | Function |

### 3.2. Nguyễn Sỹ Phúc
**Phụ trách: 2.2, 2.5, 2.7, 2.8**

| Module | Chức năng nhỏ trong module | Tiêu chí kiểm thử | Loại kiểm thử |
| --- | --- | --- | --- |
| 2.2 Quản lí bán hàng | Tạo đơn theo hình thức ăn tại bàn | Tạo đơn thành công, gắn đúng bàn, hiển thị đúng thông tin đơn | Function |
| 2.2 Quản lí bán hàng | Tạo đơn mang đi | Tạo đơn mang đi đúng luồng, không bắt buộc gắn bàn | Function |
| 2.2 Quản lí bán hàng | Tạo đơn giao hàng | Tạo đơn giao hàng thành công, lưu đúng thông tin giao nhận cần thiết | Function |
| 2.2 Quản lí bán hàng | Chọn món và số lượng | Thêm món vào đơn đúng món, đúng số lượng, đúng giá | Function |
| 2.2 Quản lí bán hàng | Ghi chú cho từng món | Ghi chú được lưu đúng và hiển thị cho bếp/nhân viên liên quan | Function |
| 2.2 Quản lí bán hàng | Cập nhật món trước thanh toán | Cho phép thêm/sửa/xóa món trước khi xác nhận thanh toán | Function |
| 2.2 Quản lí bán hàng | Tách hóa đơn | Tách được theo bàn/khách/món, tổng tiền sau tách đúng | Function |
| 2.2 Quản lí bán hàng | Gộp hóa đơn | Gộp hóa đơn đúng điều kiện, dữ liệu sau gộp chính xác | Function |
| 2.2 Quản lí bán hàng | Áp dụng giảm giá/voucher/combo | Khuyến mãi được áp dụng đúng điều kiện và đúng số tiền giảm | Function |
| 2.2 Quản lí bán hàng | Tính thuế/phụ phí/phí dịch vụ | Hệ thống tính đúng theo cấu hình và hiển thị rõ trong hóa đơn | Function |
| 2.2 Quản lí bán hàng | In hóa đơn | In được hóa đơn, nội dung in đúng và đầy đủ | Function + Non-function |
| 2.2 Quản lí bán hàng | Gửi hóa đơn điện tử | Gửi được hóa đơn điện tử nếu bật cấu hình, đúng người nhận | Function + Non-function |
| 2.2 Quản lí bán hàng | Giao diện bán hàng | Màn hình chọn món, giỏ hàng, tổng tiền, trạng thái thao tác dễ dùng | GUI |
| 2.5 Đặt món qua QR tại bàn | Quét QR mở đúng menu bàn | Khi quét QR, hệ thống nhận diện đúng bàn và mở đúng menu | Function |
| 2.5 Đặt món qua QR tại bàn | Truy cập menu không cần đăng nhập | Khách dùng được chức năng đặt món mà không cần tài khoản | Function |
| 2.5 Đặt món qua QR tại bàn | Hiển thị menu theo thời gian thực | Món còn bán/hết món cập nhật đúng trên giao diện QR | Function + Non-function |
| 2.5 Đặt món qua QR tại bàn | Chọn món/số lượng/tùy chọn/ghi chú | Khách thêm món đúng với tùy chọn, ghi chú được lưu đúng | Function |
| 2.5 Đặt món qua QR tại bàn | Thêm món vào giỏ hàng | Giỏ hàng cập nhật đúng số lượng, giá, danh sách món | Function |
| 2.5 Đặt món qua QR tại bàn | Xác nhận đặt món | Sau xác nhận, đơn được ghi nhận vào đúng bàn/phiên gọi món | Function |
| 2.5 Đặt món qua QR tại bàn | Nhiều khách cùng một bàn cùng đặt món | Hệ thống xử lý được nhiều người cùng thao tác mà không sai dữ liệu | Non-function + Function |
| 2.5 Đặt món qua QR tại bàn | Gom món vào cùng phiên bàn/hóa đơn | Món từ nhiều lượt gọi được cộng đúng theo cấu hình | Function |
| 2.5 Đặt món qua QR tại bàn | Gọi thêm món nhiều lần | Khách gọi thêm nhiều lượt, hệ thống vẫn ghi nhận đúng vào bàn đó | Function |
| 2.5 Đặt món qua QR tại bàn | Hiển thị trạng thái món | Trạng thái Đã gửi/Đang chuẩn bị/Đã lên món hiển thị đúng, dễ hiểu | GUI + Function |
| 2.5 Đặt món qua QR tại bàn | Gọi nhân viên / xin thêm vật dụng / yêu cầu thanh toán | Các nút yêu cầu hoạt động đúng và gửi thông báo đúng nơi nhận | Function |
| 2.5 Đặt món qua QR tại bàn | Xử lý QR không hợp lệ / hết hiệu lực / bàn khóa | Hệ thống báo lỗi đúng trường hợp, thông điệp rõ ràng | Function + GUI |
| 2.5 Đặt món qua QR tại bàn | Xử lý món vừa hết trong lúc khách đặt | Khách được thông báo và không thể đặt món đã hết | Function |
| 2.5 Đặt món qua QR tại bàn | Xử lý mất kết nối | Giỏ hàng được lưu tạm hợp lý, hệ thống thông báo thử lại | Function + Non-function |
| 2.7 Quản lý đơn hàng | Tạo đơn từ nhiều nguồn | Đơn được tạo đúng từ phục vụ, QR, mang đi, giao hàng | Function |
| 2.7 Quản lý đơn hàng | Chuyển trạng thái đơn hàng | Đơn chuyển đúng giữa Mới tạo, Chờ xác nhận, Đã xác nhận, Đang chế biến, Phục vụ một phần, Hoàn tất, Hủy | Function |
| 2.7 Quản lý đơn hàng | Chỉnh sửa số lượng món trước xác nhận | Số lượng món cập nhật đúng trước khi đơn được chốt | Function |
| 2.7 Quản lý đơn hàng | Hủy món / hủy đơn có lý do | Hệ thống bắt buộc hoặc cho phép nhập lý do đúng quy định, lưu lại đầy đủ | Function |
| 2.7 Quản lý đơn hàng | Tách đơn theo khách hoặc món | Tách đơn đúng logic, không mất dữ liệu món/tiền | Function |
| 2.7 Quản lý đơn hàng | Gộp đơn | Gộp đơn đúng điều kiện, không trùng món, không sai tổng tiền | Function |
| 2.7 Quản lý đơn hàng | Theo dõi lịch sử thay đổi đơn hàng | Hệ thống lưu lịch sử chỉnh sửa, người thao tác, thời gian thay đổi | Function |
| 2.7 Quản lý đơn hàng | Hiển thị danh sách và chi tiết đơn | Màn hình danh sách, trạng thái, chi tiết đơn rõ ràng, dễ tra cứu | GUI |
| 2.8 Thanh toán và hóa đơn | Tạo hóa đơn từ đơn hàng | Hóa đơn được tạo đúng từ đơn, dữ liệu món và tổng tiền chính xác | Function |
| 2.8 Thanh toán và hóa đơn | Áp dụng giảm giá/voucher/khuyến mãi | Giá trị giảm được tính đúng, không vượt điều kiện cấu hình | Function |
| 2.8 Thanh toán và hóa đơn | Tính VAT và phí dịch vụ | VAT/phí dịch vụ tính đúng công thức và hiển thị minh bạch | Function |
| 2.8 Thanh toán và hóa đơn | Thanh toán tiền mặt | Nhận tiền mặt, tính tiền thừa/đã thanh toán đúng | Function |
| 2.8 Thanh toán và hóa đơn | Thanh toán thẻ | Ghi nhận đúng giao dịch thanh toán thẻ, trạng thái hóa đơn cập nhật đúng | Function |
| 2.8 Thanh toán và hóa đơn | Thanh toán ví điện tử | Ghi nhận đúng giao dịch ví điện tử, kết quả thanh toán phản hồi chính xác | Function |
| 2.8 Thanh toán và hóa đơn | Thanh toán chuyển khoản/QR | Tạo và xử lý đúng QR thanh toán hoặc chuyển khoản | Function + Non-function |
| 2.8 Thanh toán và hóa đơn | In hóa đơn | In hóa đơn đúng định dạng, đủ thông tin, dễ đọc | GUI + Function |
| 2.8 Thanh toán và hóa đơn | Gửi hóa đơn điện tử | Hóa đơn điện tử được gửi đúng khi bật cấu hình | Function |
| 2.8 Thanh toán và hóa đơn | Tách hóa đơn | Tách hóa đơn đúng yêu cầu, tổng sau tách khớp với đơn gốc | Function |
| 2.8 Thanh toán và hóa đơn | Yêu cầu thanh toán từ QR | Khi khách bấm yêu cầu thanh toán, hệ thống báo đúng cho thu ngân/nhân viên | Function |
| 2.8 Thanh toán và hóa đơn | Không bắt buộc tự thanh toán online | Nếu chưa bật thanh toán online, khách vẫn chỉ gửi yêu cầu chứ không tự trả tiền | Function |

### 3.3. Nguyễn Hoàng Phước Lộc
**Phụ trách: 2.4, 2.9, 2.11**

| Module | Chức năng nhỏ trong module | Tiêu chí kiểm thử | Loại kiểm thử |
| --- | --- | --- | --- |
| 2.4 Quản lý thực đơn và món ăn | Thêm món ăn | Tạo món mới thành công với đầy đủ tên, giá, danh mục, mô tả, hình ảnh | Function |
| 2.4 Quản lý thực đơn và món ăn | Sửa món ăn | Cập nhật được thông tin món, dữ liệu mới hiển thị đúng | Function |
| 2.4 Quản lý thực đơn và món ăn | Xóa món ăn | Xóa món đúng điều kiện; hệ thống cảnh báo nếu món đang liên quan dữ liệu khác | Function |
| 2.4 Quản lý thực đơn và món ăn | Phân loại món theo danh mục | Món được gán đúng vào Khai vị, Món chính, Tráng miệng, Nước uống, Combo | Function |
| 2.4 Quản lý thực đơn và món ăn | Cập nhật giá bán | Giá mới được lưu đúng và phản ánh đúng trên bán hàng/menu QR | Function |
| 2.4 Quản lý thực đơn và món ăn | Hiển thị hình ảnh món | Ảnh món hiển thị đúng, rõ, không vỡ giao diện | GUI |
| 2.4 Quản lý thực đơn và món ăn | Quản lý trạng thái còn bán/hết món/tạm ngưng | Trạng thái món thay đổi đúng và ảnh hưởng đúng đến các màn hình sử dụng món | Function |
| 2.4 Quản lý thực đơn và món ăn | Cấu hình cay/không cay | Thuộc tính được lưu đúng và hiển thị đúng nơi cần thiết | Function |
| 2.4 Quản lý thực đơn và món ăn | Cấu hình kích cỡ | Các size hiển thị đúng, chọn đúng và tính giá đúng nếu có chênh lệch | Function |
| 2.4 Quản lý thực đơn và món ăn | Cấu hình topping | Topping thêm được, giá/tùy chọn cập nhật đúng | Function |
| 2.4 Quản lý thực đơn và món ăn | Ghi chú đặc biệt cho món | Cho phép nhập và lưu ghi chú đặc biệt khi gọi món | Function |
| 2.4 Quản lý thực đơn và món ăn | Giao diện danh sách/menu món ăn | Danh sách món, bộ lọc, hình ảnh, tên, giá hiển thị rõ ràng, dễ thao tác | GUI |
| 2.9 Quản lý khách hàng | Tạo thông tin khách hàng | Tạo mới khách hàng thành công với tên, số điện thoại và dữ liệu cơ bản | Function |
| 2.9 Quản lý khách hàng | Sửa thông tin khách hàng | Chỉnh sửa được thông tin và lưu đúng dữ liệu mới | Function |
| 2.9 Quản lý khách hàng | Lưu số điện thoại và tên | Dữ liệu khách hàng được lưu đúng định dạng, không thiếu trường bắt buộc | Function |
| 2.9 Quản lý khách hàng | Lưu lịch sử dùng bữa | Hệ thống ghi nhận được lịch sử đơn/lần dùng bữa của khách | Function |
| 2.9 Quản lý khách hàng | Tích điểm thành viên | Điểm được cộng/trừ đúng quy tắc, cập nhật đúng số dư điểm | Function |
| 2.9 Quản lý khách hàng | Phân nhóm khách hàng thân thiết | Hệ thống gán đúng nhóm khách theo điều kiện cấu hình | Function |
| 2.9 Quản lý khách hàng | Tra cứu danh sách khách hàng | Tìm kiếm/lọc khách hàng thuận tiện, hiển thị rõ thông tin chính | GUI + Function |
| 2.9 Quản lý khách hàng | Bảo vệ dữ liệu khách hàng cơ bản | Người không có quyền không xem/sửa được dữ liệu khách hàng | Non-function + Function |
| 2.11 Báo cáo và thống kê | Xem báo cáo theo ngày | Báo cáo hiển thị đúng dữ liệu trong ngày được chọn | Function |
| 2.11 Báo cáo và thống kê | Xem báo cáo theo tuần | Dữ liệu tuần được tổng hợp đúng và nhất quán | Function |
| 2.11 Báo cáo và thống kê | Xem báo cáo theo tháng | Dữ liệu tháng tính đúng, không lệch kỳ | Function |
| 2.11 Báo cáo và thống kê | Xem báo cáo theo năm | Dữ liệu năm được tổng hợp đúng theo phạm vi chọn | Function |
| 2.11 Báo cáo và thống kê | Xem báo cáo theo khoảng thời gian tùy chọn | Cho phép nhập khoảng thời gian hợp lệ và trả về dữ liệu đúng | Function |
| 2.11 Báo cáo và thống kê | Báo cáo tổng doanh thu | Tổng doanh thu khớp với dữ liệu bán hàng/thanh toán thực tế | Function |
| 2.11 Báo cáo và thống kê | Báo cáo doanh thu theo hình thức bán hàng | Phân loại đúng doanh thu ăn tại bàn, mang đi, giao hàng... | Function |
| 2.11 Báo cáo và thống kê | Báo cáo số lượng đơn hàng | Số lượng đơn được thống kê đúng theo điều kiện lọc | Function |
| 2.11 Báo cáo và thống kê | Báo cáo đơn hoàn tất / đơn hủy | Thống kê đúng số đơn hoàn tất và số đơn bị hủy | Function |
| 2.11 Báo cáo và thống kê | Lọc và tìm kiếm báo cáo | Bộ lọc hoạt động đúng, thời gian phản hồi chấp nhận được | Function + Non-function |
| 2.11 Báo cáo và thống kê | Xuất Excel | File Excel xuất ra đúng dữ liệu, đúng cột, mở được | Function + Non-function |
| 2.11 Báo cáo và thống kê | Xuất PDF | File PDF xuất ra đúng bố cục, đủ dữ liệu, đọc được | Function + Non-function |
| 2.11 Báo cáo và thống kê | Giao diện báo cáo | Dashboard/bảng số liệu rõ ràng, dễ đọc, nhãn cột đúng | GUI |

## 4. Sheet: Test-case
> Ghi chú: sheet gốc đang bật filter chỉ hiển thị các case `F`. Phần dưới đây đã khôi phục **toàn bộ 214 test case** theo đầy đủ từng module.

### 4.1. Module 2.1 - Quản lí đăng nhập và phân quyền
| STT | Mã TC | Chức năng | Mô tả | Các bước thực hiện | Bộ data test | Phương thức | Kết quả mong muốn | Độ ưu tiên | Kết quả test |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | TC_2.1_001 | Đăng nhập bằng tài khoản và mật khẩu | Kiểm tra đăng nhập thành công với tài khoản Admin hợp lệ | 1. Mở màn hình đăng nhập<br>2. Nhập username Admin<br>3. Nhập password đúng<br>4. Bấm nút Đăng nhập | Username: admin01<br>Password: Admin@123 | Manual | Đăng nhập thành công, chuyển vào hệ thống, hiển thị đúng giao diện theo vai trò Admin | High | P |
| 2 | TC_2.1_002 | Đăng nhập bằng tài khoản và mật khẩu | Kiểm tra đăng nhập thành công với tài khoản Quản lý hợp lệ | 1. Mở màn hình đăng nhập<br>2. Nhập username Quản lý<br>3. Nhập password đúng<br>4. Bấm Đăng nhập | Username: manager01<br>Password: Manager@123 | Manual | Đăng nhập thành công, hiển thị đúng giao diện theo vai trò Quản lý | High | P |
| 3 | TC_2.1_003 | Đăng nhập bằng tài khoản và mật khẩu | Kiểm tra đăng nhập thành công với tài khoản Nhân viên phục vụ hợp lệ | 1. Mở màn hình đăng nhập<br>2. Nhập username nhân viên phục vụ<br>3. Nhập password đúng<br>4. Bấm Đăng nhập | Username: waiter01<br>Password: Waiter@123 | Manual | Đăng nhập thành công, hiển thị đúng giao diện theo vai trò Nhân viên phục vụ | High | P |
| 4 | TC_2.1_004 | Đăng nhập bằng tài khoản và mật khẩu | Kiểm tra đăng nhập thành công với tài khoản Thu ngân hợp lệ | 1. Mở màn hình đăng nhập<br>2. Nhập username Thu ngân<br>3. Nhập password đúng<br>4. Bấm Đăng nhập | Username: cashier01<br>Password: Cashier@123 | Manual | Đăng nhập thành công, hiển thị đúng giao diện theo vai trò Thu ngân | High | P |
| 5 | TC_2.1_005 | Đăng nhập bằng tài khoản và mật khẩu | Kiểm tra đăng nhập thất bại khi nhập sai mật khẩu | 1. Mở màn hình đăng nhập<br>2. Nhập username hợp lệ<br>3. Nhập password sai<br>4. Bấm Đăng nhập | Username: admin01<br>Password: Sai123 | Manual | Hệ thống không cho đăng nhập, hiển thị thông báo sai tài khoản hoặc mật khẩu | High | F |
| 6 | TC_2.1_006 | Đăng nhập bằng tài khoản và mật khẩu | Kiểm tra đăng nhập thất bại khi nhập sai tên tài khoản | 1. Mở màn hình đăng nhập<br>2. Nhập username không tồn tại<br>3. Nhập password bất kỳ<br>4. Bấm Đăng nhập | Username: adminxx<br>Password: Admin@123 | Manual | Hệ thống không cho đăng nhập, hiển thị thông báo lỗi phù hợp | High | F |
| 7 | TC_2.1_007 | Đăng nhập bằng tài khoản và mật khẩu | Kiểm tra validation khi để trống cả username và password | 1. Mở màn hình đăng nhập<br>2. Để trống cả 2 trường<br>3. Bấm Đăng nhập | Username: rỗng<br>Password: rỗng | Manual | Hệ thống bắt buộc nhập dữ liệu, hiển thị thông báo yêu cầu nhập username/password | Medium | F |
| 8 | TC_2.1_008 | Đăng nhập bằng tài khoản và mật khẩu | Kiểm tra validation khi để trống username | 1. Mở màn hình đăng nhập<br>2. Để trống username<br>3. Nhập password bất kỳ<br>4. Bấm Đăng nhập | Username: rỗng<br>Password: Admin@123 | Manual | Hệ thống không cho đăng nhập, hiển thị thông báo yêu cầu nhập tên tài khoản | Medium | P |
| 9 | TC_2.1_009 | Đăng nhập bằng tài khoản và mật khẩu | Kiểm tra validation khi để trống password | 1. Mở màn hình đăng nhập<br>2. Nhập username hợp lệ<br>3. Để trống password<br>4. Bấm Đăng nhập | Username: admin01<br>Password: rỗng | Manual | Hệ thống không cho đăng nhập, hiển thị thông báo yêu cầu nhập mật khẩu | Medium | P |
| 10 | TC_2.1_010 | Giao diện đăng nhập | Kiểm tra hiển thị các thành phần trên form đăng nhập | 1. Mở màn hình đăng nhập<br>2. Quan sát giao diện | Không yêu cầu data | Manual | Form có đầy đủ trường tên tài khoản, mật khẩu, nút đăng nhập; bố cục rõ ràng, dễ thao tác | Medium | P |
| 11 | TC_2.1_011 | Ghi nhận lịch sử đăng nhập | Kiểm tra hệ thống ghi nhận log khi đăng nhập thành công | 1. Đăng nhập bằng tài khoản hợp lệ<br>2. Vào nơi xem log hoặc lịch sử đăng nhập của hệ thống | Username: admin01<br>Password: Admin@123 | Manual | Có bản ghi lịch sử đăng nhập với tài khoản, thời gian đăng nhập, trạng thái đăng nhập thành công | High | P |
| 12 | TC_2.1_012 | Đăng xuất | Kiểm tra người dùng đăng xuất thành công | 1. Đăng nhập vào hệ thống<br>2. Bấm Đăng xuất | Tài khoản bất kỳ hợp lệ | Manual | Hệ thống đăng xuất thành công, quay về màn hình đăng nhập | High | P |
| 13 | TC_2.1_013 | Ghi nhận lịch sử đăng xuất | Kiểm tra hệ thống ghi nhận log khi đăng xuất | 1. Đăng nhập hợp lệ<br>2. Thực hiện đăng xuất<br>3. Vào nơi xem log/lịch sử đăng nhập-đăng xuất | Tài khoản bất kỳ hợp lệ | Manual | Có bản ghi lịch sử đăng xuất với tài khoản và thời gian đăng xuất | High | F |
| 14 | TC_2.1_014 | Phân quyền theo vai trò | Kiểm tra Admin được truy cập các chức năng quản trị đúng quyền | 1. Đăng nhập bằng tài khoản Admin<br>2. Kiểm tra menu/chức năng hiển thị | Username: admin01<br>Password: Admin@123 | Manual | Admin thấy đúng các chức năng quản trị theo thiết kế hệ thống | High | F |
| 15 | TC_2.1_015 | Phân quyền theo vai trò | Kiểm tra Quản lý chỉ truy cập các chức năng thuộc quyền Quản lý | 1. Đăng nhập bằng tài khoản Quản lý<br>2. Kiểm tra menu/chức năng hiển thị | Username: manager01<br>Password: Manager@123 | Manual | Quản lý chỉ thấy và dùng được các chức năng thuộc quyền Quản lý, không thấy chức năng vượt quyền | High | F |
| 16 | TC_2.1_016 | Phân quyền theo vai trò | Kiểm tra Nhân viên phục vụ chỉ truy cập các chức năng thuộc quyền phục vụ | 1. Đăng nhập bằng tài khoản Nhân viên phục vụ<br>2. Kiểm tra menu/chức năng hiển thị | Username: waiter01<br>Password: Waiter@123 | Manual | Nhân viên phục vụ chỉ thấy và thao tác được chức năng được cấp quyền | High | F |
| 17 | TC_2.1_017 | Phân quyền theo vai trò | Kiểm tra Thu ngân chỉ truy cập các chức năng thuộc quyền Thu ngân | 1. Đăng nhập bằng tài khoản Thu ngân<br>2. Kiểm tra menu/chức năng hiển thị | Username: cashier01<br>Password: Cashier@123 | Manual | Thu ngân chỉ thấy và thao tác được các chức năng thanh toán/hóa đơn theo quyền | High | F |
| 18 | TC_2.1_018 | Chặn truy cập ngoài quyền | Kiểm tra người dùng không được truy cập chức năng không thuộc quyền bằng menu | 1. Đăng nhập bằng tài khoản không phải Admin<br>2. Tìm chức năng ngoài quyền trên menu | Username: waiter01 hoặc cashier01 | Manual | Chức năng ngoài quyền không hiển thị hoặc bị khóa | High | F |
| 19 | TC_2.1_019 | Chặn truy cập ngoài quyền | Kiểm tra người dùng không được truy cập chức năng không thuộc quyền bằng URL trực tiếp | 1. Đăng nhập bằng tài khoản không có quyền<br>2. Nhập trực tiếp URL của màn hình ngoài quyền | Username: waiter01<br>Password: Waiter@123<br>URL: màn hình quản trị | Manual | Hệ thống chặn truy cập, thông báo không có quyền hoặc chuyển hướng về trang phù hợp | High | F |
| 20 | TC_2.1_020 | Ghi nhận lịch sử đăng nhập, đăng xuất | Kiểm tra log lưu đúng theo từng tài khoản khác nhau | 1. Lần lượt đăng nhập/đăng xuất bằng Admin, Quản lý, Nhân viên phục vụ, Thu ngân<br>2. Kiểm tra log | 4 tài khoản hợp lệ của 4 vai trò | Manual | Log ghi nhận đúng từng tài khoản, đúng thời gian, đúng hành động đăng nhập/đăng xuất | High | F |

### 4.2. Module 2.2 - Quản lí bán hàng
| STT | Mã TC | Chức năng | Mô tả | Các bước thực hiện | Bộ data test | Phương thức | Kết quả mong muốn | Độ ưu tiên | Kết quả test |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 21 | SALE_001 | Tạo đơn theo hình thức ăn tại bàn | Kiểm tra tạo đơn ăn tại bàn thành công | 1. Đăng nhập bằng tài khoản nhân viên phục vụ<br>2. Vào màn hình bán hàng<br>3. Chọn bàn trống B01<br>4. Chọn hình thức “Ăn tại bàn”<br>5. Tạo đơn | User: waiter01<br>Bàn: B01 trạng thái Trống | Manual | Đơn được tạo thành công, gắn đúng bàn B01, trạng thái bàn chuyển sang Đang phục vụ | High | P |
| 22 | SALE_002 | Tạo đơn theo hình thức mang đi | Kiểm tra tạo đơn mang đi thành công | 1. Đăng nhập hệ thống<br>2. Vào bán hàng<br>3. Chọn hình thức “Mang đi”<br>4. Tạo đơn | User: cashier01 | Manual | Đơn mang đi được tạo thành công, không bắt buộc gắn bàn | High | P |
| 23 | SALE_003 | Tạo đơn theo hình thức giao hàng | Kiểm tra tạo đơn giao hàng thành công | 1. Đăng nhập hệ thống<br>2. Vào bán hàng<br>3. Chọn hình thức “Giao hàng”<br>4. Nhập thông tin giao hàng cần thiết<br>5. Tạo đơn | User: cashier01<br>Khách: Nguyễn A<br>SĐT: 0909000001 | Manual | Đơn giao hàng được tạo thành công và lưu đúng thông tin giao hàng | High | P |
| 24 | SALE_004 | Chọn món và số lượng | Kiểm tra thêm món vào đơn với số lượng hợp lệ | 1. Tạo đơn mới<br>2. Chọn món “Cơm gà”<br>3. Nhập số lượng 2<br>4. Thêm vào đơn | Món: Cơm gà<br>Giá: 50.000 | Manual | Món được thêm đúng vào đơn, số lượng = 2, thành tiền tính đúng | High | P |
| 25 | SALE_005 | Ghi chú cho từng món | Kiểm tra nhập ghi chú cho món | 1. Tạo hoặc mở đơn hàng<br>2. Chọn món “Bún bò”<br>3. Nhập ghi chú “Ít cay, không hành”<br>4. Lưu món | Món: Bún bò | Manual | Ghi chú được lưu đúng và hiển thị trong chi tiết món của đơn | Medium | P |
| 26 | SALE_006 | Cập nhật món trong đơn trước thanh toán | Kiểm tra sửa số lượng món trước khi xác nhận thanh toán | 1. Mở đơn chưa thanh toán<br>2. Chọn món đã thêm<br>3. Đổi số lượng từ 2 thành 3<br>4. Lưu thay đổi | Đơn có món Cơm gà số lượng 2 | Manual | Số lượng món cập nhật thành công, tổng tiền đơn thay đổi đúng | High | P |
| 27 | SALE_007 | Cập nhật món trong đơn trước thanh toán | Kiểm tra xóa món khỏi đơn trước khi thanh toán | 1. Mở đơn chưa thanh toán<br>2. Chọn 1 món trong đơn<br>3. Bấm xóa món<br>4. Xác nhận xóa | Đơn có 2 món trở lên | Manual | Món bị xóa khỏi đơn, tổng tiền cập nhật đúng | High | P |
| 28 | SALE_008 | Tách hóa đơn | Kiểm tra tách hóa đơn theo món | 1. Mở đơn có nhiều món<br>2. Chọn chức năng tách hóa đơn<br>3. Chọn 1 hoặc nhiều món để tách sang hóa đơn mới<br>4. Xác nhận | Đơn gồm: Cơm gà, Nước cam, Salad | Manual | Hóa đơn mới được tạo, các món được chuyển đúng, tổng tiền 2 hóa đơn cộng lại bằng hóa đơn gốc | High | P |
| 29 | SALE_009 | Tách hóa đơn | Kiểm tra tách hóa đơn theo khách | 1. Mở đơn có nhiều món cho nhiều khách<br>2. Chọn tách hóa đơn theo khách<br>3. Chia món cho từng khách<br>4. Xác nhận | Đơn bàn 4 người | Manual | Hóa đơn được tách đúng cho từng khách theo món được phân chia | Medium | P |
| 30 | SALE_010 | Gộp hóa đơn | Kiểm tra gộp 2 hóa đơn thành 1 | 1. Mở 2 hóa đơn hợp lệ cần gộp<br>2. Chọn chức năng gộp hóa đơn<br>3. Xác nhận gộp | HĐ1: B01<br>HĐ2: B02 hoặc 2 hóa đơn cùng bàn | Manual | 2 hóa đơn được gộp thành 1, danh sách món và tổng tiền đúng | High | P |
| 31 | SALE_011 | Áp dụng giảm giá trực tiếp | Kiểm tra áp dụng giảm giá trực tiếp cho đơn | 1. Mở đơn hàng<br>2. Chọn giảm giá trực tiếp<br>3. Nhập 10% hoặc 50.000<br>4. Xác nhận | Đơn tổng 500.000 | Manual | Hệ thống áp dụng giảm giá đúng, tổng tiền sau giảm chính xác | High | P |
| 32 | SALE_012 | Áp dụng voucher | Kiểm tra áp dụng voucher hợp lệ | 1. Mở đơn hàng<br>2. Chọn nhập mã voucher<br>3. Nhập mã hợp lệ<br>4. Xác nhận | Voucher: VC10<br>Điều kiện: đơn từ 300.000 | Manual | Voucher được áp dụng nếu đủ điều kiện, số tiền giảm đúng rule | High | P |
| 33 | SALE_013 | Áp dụng combo khuyến mãi | Kiểm tra hệ thống nhận diện và áp dụng combo khuyến mãi | 1. Tạo đơn có đủ món của combo<br>2. Kiểm tra giá combo sau khi thêm đủ món | Combo: Gà rán + Pepsi | Manual | Hệ thống tự áp dụng hoặc cho áp dụng combo đúng giá ưu đãi | High | P |
| 34 | SALE_014 | Tính thuế / phụ phí / phí dịch vụ | Kiểm tra tính VAT, phụ phí, phí dịch vụ trên đơn | 1. Mở đơn hàng<br>2. Bật cấu hình VAT/phụ phí/phí dịch vụ<br>3. Kiểm tra phần tính tiền | Đơn tổng trước thuế: 1.000.000<br>VAT: 8%<br>Phí DV: 5% | Manual | Hệ thống tính đúng từng khoản và tổng thanh toán cuối cùng | High | P |
| 35 | SALE_015 | In hóa đơn | Kiểm tra in hóa đơn thành công | 1. Hoàn tất đơn hàng<br>2. Chọn In hóa đơn | Đơn đã có món và tổng tiền | Manual | Hóa đơn được in ra đúng nội dung: món, SL, giá, giảm giá, thuế, tổng tiền | High | P |
| 36 | SALE_016 | Gửi hóa đơn điện tử | Kiểm tra gửi hóa đơn điện tử khi có cấu hình sử dụng | 1. Hoàn tất đơn hàng<br>2. Chọn gửi hóa đơn điện tử<br>3. Nhập email khách<br>4. Xác nhận | Email: khachhang@test.com<br>Config e-invoice: ON | Manual | Hóa đơn điện tử được gửi thành công đến email khách nếu hệ thống đã bật cấu hình | Medium | P |

### 4.3. Module 2.3 - Quản lí bàn và khu vực
| STT | Mã TC | Chức năng | Mô tả | Các bước thực hiện | Bộ data test | Phương thức | Kết quả mong muốn | Độ ưu tiên | Kết quả test |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 37 | TABLE_001 | Tạo bàn | Kiểm tra tạo mới bàn thành công | 1. Đăng nhập bằng Admin/Quản lý<br>2. Vào màn hình quản lý bàn<br>3. Bấm Thêm bàn<br>4. Nhập mã bàn, tên bàn, khu vực, số ghế<br>5. Lưu | Mã bàn: B01<br>Khu vực: Tầng 1<br>Số ghế: 4 | Manual | Bàn được tạo thành công và hiển thị trong đúng khu vực | High | P |
| 38 | TABLE_002 | Tạo bàn | Kiểm tra không cho tạo 2 bàn trùng mã định danh | 1. Tạo trước bàn B01<br>2. Tạo thêm 1 bàn khác nhưng dùng lại mã B01<br>3. Lưu | Mã bàn trùng: B01 | Manual | Hệ thống chặn lưu và thông báo mã bàn đã tồn tại | High | P |
| 39 | TABLE_003 | Sửa bàn | Kiểm tra sửa thông tin bàn thành công | 1. Mở bàn đã có<br>2. Sửa tên bàn hoặc số ghế tối đa<br>3. Lưu | Bàn: B01<br>Sửa số ghế từ 4 thành 6 | Manual | Thông tin bàn được cập nhật đúng sau khi lưu | High | P |
| 40 | TABLE_004 | Xóa bàn | Kiểm tra xóa bàn thành công khi bàn không có ràng buộc sử dụng | 1. Chọn 1 bàn không sử dụng<br>2. Bấm Xóa<br>3. Xác nhận | Bàn: B99 không phát sinh giao dịch | Manual | Bàn bị xóa khỏi danh sách | Medium | P |
| 41 | TABLE_005 | Gán bàn vào khu vực | Kiểm tra chuyển bàn từ khu vực này sang khu vực khác | 1. Mở thông tin bàn<br>2. Đổi khu vực từ Tầng 1 sang VIP<br>3. Lưu | Bàn: B01 | Manual | Bàn hiển thị ở khu vực mới sau khi cập nhật | Medium | P |
| 42 | TABLE_006 | Thiết lập trạng thái bàn | Kiểm tra đổi trạng thái bàn sang Trống | 1. Mở thông tin bàn<br>2. Chọn trạng thái Trống<br>3. Lưu | Bàn: B02 | Manual | Trạng thái bàn hiển thị là Trống | Medium | P |
| 43 | TABLE_007 | Thiết lập trạng thái bàn | Kiểm tra đổi trạng thái bàn sang Đang phục vụ | 1. Mở thông tin bàn<br>2. Chọn trạng thái Đang phục vụ<br>3. Lưu | Bàn: B03 | Manual | Trạng thái bàn hiển thị là Đang phục vụ | High | P |
| 44 | TABLE_008 | Thiết lập trạng thái bàn | Kiểm tra đổi trạng thái bàn sang Đã đặt trước | 1. Mở thông tin bàn<br>2. Chọn trạng thái Đã đặt trước<br>3. Lưu | Bàn: B04 | Manual | Trạng thái bàn hiển thị là Đã đặt trước | Medium | P |
| 45 | TABLE_009 | Thiết lập trạng thái bàn | Kiểm tra khóa sử dụng bàn | 1. Mở thông tin bàn<br>2. Chọn trạng thái Khóa sử dụng<br>3. Lưu | Bàn: B05 | Manual | Bàn chuyển sang trạng thái khóa và không dùng cho bán hàng/QR | High | P |
| 46 | TABLE_010 | Gán QR cho bàn | Kiểm tra gán QR riêng cho từng bàn thành công | 1. Mở bàn B01<br>2. Chọn gán/tạo QR<br>3. Lưu | Bàn: B01<br>QR: qr-b01 | Manual | Bàn được gán đúng 1 mã QR riêng, có thể xem/in/tải | High | P |
| 47 | TABLE_011 | Gán QR cho bàn | Kiểm tra không cho 2 bàn dùng cùng 1 QR | 1. Gán QR qr-b01 cho bàn B01<br>2. Mở bàn B02<br>3. Gán lại qr-b01<br>4. Lưu | B01: qr-b01<br>B02: qr-b01 | Manual | Hệ thống chặn lưu và thông báo QR đã được sử dụng cho bàn khác | High | P |
| 48 | TABLE_012 | In/tải QR của bàn | Kiểm tra in hoặc tải QR thành công | 1. Mở bàn đã có QR<br>2. Chọn In QR hoặc Tải QR | Bàn: B01 có <br>QR hợp lệ | Manual | QR được in/tải thành công, nội dung QR đúng với bàn được gán | Medium | P |
| 49 | TABLE_013 | Thay đổi số ghế tối đa | Kiểm tra cập nhật số ghế tối đa của bàn | 1. Mở bàn cần chỉnh sửa<br>2. Đổi số ghế tối đa<br>3. Lưu | Bàn: B01<br>Số ghế cũ: 4<br>Mới: 8 | Manual | Số ghế tối đa được cập nhật đúng trong hệ thống | Medium | P |

### 4.4. Module 2.4 - Quản lý thực đơn và món ăn
| STT | Mã TC | Chức năng | Mô tả | Các bước thực hiện | Bộ data test | Phương thức | Kết quả mong muốn | Độ ưu tiên | Kết quả test |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 50 | MENU_001 | Thêm món ăn | Kiểm tra thêm mới món ăn thành công | 1. Đăng nhập bằng Admin/Quản lý<br>2. Vào màn hình thực đơn<br>3. Bấm Thêm món<br>4. Nhập đầy đủ thông tin<br>5. Lưu | Tên món: Cơm gà<br>Danh mục: Món chính<br>Giá: 50.000 | Manual | Món ăn được tạo thành công và hiển thị trong danh sách thực đơn | High | P |
| 51 | MENU_002 | Sửa món ăn | Kiểm tra sửa thông tin món ăn thành công | 1. Mở món đã có<br>2. Sửa tên hoặc mô tả hoặc giá<br>3. Lưu | Món: Cơm gà → Cơm gà xối mỡ | Manual | Thông tin món được cập nhật đúng sau khi lưu | High | P |
| 52 | MENU_003 | Xóa món ăn | Kiểm tra xóa món ăn | 1. Chọn món cần xóa<br>2. Bấm Xóa<br>3. Xác nhận | Món test không dùng trong đơn hàng | Manual | Món bị xóa khỏi danh sách nếu đủ điều kiện xóa | Medium | P |
| 53 | MENU_004 | Phân loại món theo danh mục | Kiểm tra gán đúng danh mục món ăn | 1. Tạo/sửa món ăn<br>2. Chọn danh mục<br>3. Lưu | Danh mục: Khai vị / Món chính / Tráng miệng / Nước uống / Combo | Manual | Món hiển thị đúng trong danh mục đã chọn | High | P |
| 54 | MENU_005 | Cập nhật giá bán | Kiểm tra cập nhật giá bán món ăn | 1. Mở món đã có<br>2. Sửa giá bán<br>3. Lưu | Món: Nước cam<br>Giá cũ: 30.000<br>Giá mới: 35.000 | Manual | Giá bán mới được lưu đúng và hiển thị đúng trên hệ thống | High | P |
| 55 | MENU_006 | Hiển thị hình ảnh món | Kiểm tra tải lên và hiển thị hình ảnh món ăn | 1. Mở form thêm/sửa món<br>2. Upload ảnh món<br>3. Lưu<br>4. Mở lại danh sách/menu | File ảnh: com-ga.jpg | Manual | Ảnh món hiển thị đúng trên danh sách hoặc chi tiết món | Medium | P |
| 56 | MENU_007 | Cấu hình trạng thái món | Kiểm tra đặt trạng thái “Còn bán” | 1. Mở món ăn<br>2. Chọn trạng thái Còn bán<br>3. Lưu | Món: Cơm gà | Manual | Món hiển thị và chọn được trong bán hàng/menu | High | P |
| 57 | MENU_008 | Cấu hình trạng thái món | Kiểm tra đặt trạng thái “Hết món” | 1. Mở món ăn<br>2. Chọn trạng thái Hết món<br>3. Lưu | Món: Bún bò | Manual | Món hiển thị trạng thái hết món và không cho chọn đặt mới | High | P |
| 58 | MENU_009 | Cấu hình trạng thái món | Kiểm tra đặt trạng thái “Tạm ngưng” | 1. Mở món ăn<br>2. Chọn trạng thái Tạm ngưng<br>3. Lưu | Món: Trà đào | Manual | Món không còn phục vụ tạm thời theo đúng trạng thái cấu hình | Medium | P |
| 59 | MENU_010 | Thuộc tính món: Cay / không cay | Kiểm tra cấu hình thuộc tính cay hoặc không cay | 1. Mở form thêm/sửa món<br>2. Chọn thuộc tính cay hoặc không cay<br>3. Lưu | Món: Mì cay | Manual | Thuộc tính cay/không cay được lưu và hiển thị đúng | Medium | P |
| 60 | MENU_011 | Thuộc tính món: Kích cỡ | Kiểm tra cấu hình size cho món | 1. Mở form món<br>2. Thêm các kích cỡ S/M/L<br>3. Lưu | Món: Trà sữa<br>Size: S/M/L | Manual | Món hiển thị đúng các kích cỡ đã cấu hình | High | P |
| 61 | MENU_012 | Thuộc tính món: Topping | Kiểm tra cấu hình topping cho món | 1. Mở form món<br>2. Thêm topping phù hợp<br>3. Lưu | Món: Trà sữa<br>Topping: trân châu, pudding | Manual | Topping được lưu đúng và dùng được khi gọi món | High | P |
| 62 | MENU_013 | Thuộc tính món: Ghi chú đặc biệt | Kiểm tra nhập ghi chú đặc biệt cho món | 1. Mở món trong bán hàng hoặc thiết lập món<br>2. Nhập ghi chú đặc biệt<br>3. Lưu | Ví dụ ghi chú: ít đá, không đường | Manual | Ghi chú đặc biệt được chấp nhận và lưu đúng cho món | Medium | P |

### 4.5. Module 2.5 -  Đặt món qua QR tại bàn
| STT | Mã TC | Chức năng | Mô tả | Các bước thực hiện | Bộ data test | Phương thức | Kết quả mong muốn | Độ ưu tiên | Kết quả test |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 63 | QR_001 | Quét QR mở đúng menu bàn | Khi quét QR, hệ thống nhận diện đúng bàn và mở đúng menu | 1. Chuẩn bị bàn B01 đã được tạo trong hệ thống<br>2. Đảm bảo QR của bàn B01 còn hiệu lực<br>3. Dùng điện thoại quét QR tại bàn B01<br>4. Quan sát màn hình mở ra | Bàn: B01<br>QR: qr-b01<br>Trạng thái bàn: cho phép phục vụ | Manual | Hệ thống mở đúng trang menu của bàn B01, hiển thị đúng thông tin bàn và menu khả dụng | High | P |
| 64 | QR_002 | Truy cập menu không cần đăng nhập | Khách dùng được chức năng đặt món mà không cần tài khoản | 1. Quét QR bàn hợp lệ<br>2. Kiểm tra hệ thống có yêu cầu đăng nhập hay không<br>3. Thử vào menu và thao tác đặt món | Bàn: B01<br>QR hợp lệ | Manual | Khách truy cập được menu và thao tác đặt món mà không cần đăng nhập | High | P |
| 65 | QR_003 | Hiển thị menu theo thời gian thực | Món còn bán/hết món cập nhật đúng trên giao diện QR | 1. Quét QR vào menu bàn B01<br>2. Ở màn hình quản trị, đổi trạng thái món “Trà đào” từ Còn bán sang Hết món<br>3. Quan sát màn hình QR hoặc làm mới trang | Món: Trà đào<br>Trạng thái trước: Còn bán<br>Trạng thái sau: Hết món | Manual | Giao diện QR cập nhật đúng trạng thái món, món hết hàng không còn đặt được | High | P |
| 66 | QR_004 | Chọn món/số lượng/tùy chọn/ghi chú | Khách thêm món đúng với tùy chọn, ghi chú được lưu đúng | 1. Quét QR bàn hợp lệ<br>2. Chọn món “Trà sữa”<br>3. Chọn size L<br>4. Chọn topping trân châu<br>5. Nhập ghi chú “Ít đá”<br>6. Chọn số lượng 2 | Món: Trà sữa<br>Size: L<br>Topping: trân châu<br>Ghi chú: Ít đá | Manual | Món được chọn đúng với số lượng, tùy chọn và ghi chú đã nhập | High | P |
| 67 | QR_005 | Thêm món vào giỏ hàng | Giỏ hàng cập nhật đúng số lượng, giá, danh sách món | 1. Chọn món từ menu QR<br>2. Bấm Thêm vào giỏ hàng<br>3. Mở giỏ hàng kiểm tra | Món: Cơm gà x1, Trà sữa x2 | Manual | Giỏ hàng hiển thị đúng tên món, số lượng, giá từng món và tổng tạm tính | High | P |
| 68 | QR_006 | Xác nhận đặt món | Sau xác nhận, đơn được ghi nhận vào đúng bàn/phiên gọi món | 1. Tạo giỏ hàng có ít nhất 1 món<br>2. Bấm Xác nhận đặt món<br>3. Kiểm tra thông báo thành công<br>4. Kiểm tra phía nhân viên hoặc màn hình đơn hàng | Bàn: B01Giỏ hàng có 2 món | Manual | Đơn được tạo hoặc cập nhật đúng vào phiên gọi món của bàn B01, hệ thống thông báo thành công | High | P |
| 69 | QR_007 | Nhiều khách cùng một bàn cùng đặt món | Hệ thống xử lý được nhiều người cùng thao tác mà không sai dữ liệu | 1. Dùng 2 điện thoại cùng quét QR của bàn B01<br>2. Điện thoại 1 chọn món A, điện thoại 2 chọn món B<br>3. Cả 2 cùng xác nhận gần như đồng thời<br>4. Kiểm tra đơn ở phía nhân viên | Thiết bị 1: món Cơm gà<br>Thiết bị 2: món Nước cam | Manual | Hệ thống ghi nhận đúng cả 2 lượt gọi món, không mất món, không ghi sai bàn, không trùng lỗi dữ liệu | High | P |
| 70 | QR_008 | Gom món vào cùng phiên bàn/hóa đơn | Món từ nhiều lượt gọi được cộng đúng theo cấu hình | 1. Quét QR bàn B01 và đặt lượt 1: món A<br>2. Đặt tiếp lượt 2: món B<br>3. Kiểm tra phía đơn hàng/hóa đơn của bàn | Bàn: B01<br>Cấu hình: gom vào cùng phiên bàn hoặc cùng hóa đơn | Manual | Các món từ nhiều lượt gọi được cộng đúng vào cùng phiên hoặc cùng hóa đơn theo cấu hình | High | P |
| 71 | QR_009 | Gọi thêm món nhiều lần | Khách gọi thêm nhiều lượt, hệ thống vẫn ghi nhận đúng vào bàn đó | 1. Quét QR bàn B01<br>2. Đặt món lần 1<br>3. Sau vài phút, gọi thêm món lần 2<br>4. Kiểm tra danh sách món của bàn | Bàn: B01<br>Lượt 1: Cơm gà<br>Lượt 2: Nước cam | Manual | Hệ thống cho phép gọi thêm nhiều lần và mọi món đều gắn đúng vào bàn B01 | High | P |
| 72 | QR_010 | Hiển thị trạng thái món | Trạng thái Đã gửi hiển thị đúng, dễ hiểu | 1. Đặt món từ QR thành công<br>2. Kiểm tra màn hình theo dõi trạng thái món phía khách | Đơn vừa xác nhận từ QR | Manual | Món hiển thị trạng thái Đã gửi sau khi gửi đơn thành công | Medium | P |
| 73 | QR_011 | Hiển thị trạng thái món | Trạng thái Đang chuẩn bị hiển thị đúng, dễ hiểu | 1. Tạo đơn từ QR<br>2. Ở phía nhân viên/bếp đổi trạng thái món sang Đang chuẩn bị<br>3. Kiểm tra màn hình QR của khách | Đơn của bàn B01 | Manual | Món hiển thị đúng trạng thái Đang chuẩn bị trên giao diện khách | Medium | P |
| 74 | QR_012 | Hiển thị trạng thái món | Trạng thái Đã lên món hiển thị đúng, dễ hiểu | 1. Tạo đơn từ QR<br>2. Ở phía nhân viên/bếp đổi trạng thái món sang Đã lên món<br>3. Kiểm tra màn hình QR của khách | Đơn của bàn B01 | Manual | Món hiển thị đúng trạng thái Đã lên món trên giao diện khách | Medium | P |
| 75 | QR_013 | Gọi nhân viên | Nút gọi nhân viên hoạt động đúng và gửi thông báo đúng nơi nhận | 1. Quét QR bàn B01<br>2. Bấm nút Gọi nhân viên<br>3. Kiểm tra phía nhân viên nhận thông báo | Bàn: B01 | Manual | Hệ thống gửi yêu cầu gọi nhân viên đúng bàn B01 đến màn hình/thiết bị nhận thông báo | High | P |
| 76 | QR_014 | Xin thêm nước/chén/khăn giấy | Nút yêu cầu thêm vật dụng hoạt động đúng và gửi thông báo đúng nơi nhận | 1. Quét QR bàn B01<br>2. Bấm yêu cầu thêm nước hoặc chén hoặc khăn giấy<br>3. Kiểm tra phía nhân viên nhận thông báo | Bàn: B01<br>Yêu cầu: thêm chén | Manual | Hệ thống ghi nhận đúng yêu cầu phục vụ và gửi đúng cho nhân viên | Medium | P |
| 77 | QR_015 | Yêu cầu thanh toán | Nút yêu cầu thanh toán hoạt động đúng và gửi thông báo đúng nơi nhận | 1. Quét QR bàn B01<br>2. Bấm Yêu cầu thanh toán<br>3. Kiểm tra phía thu ngân/nhân viên phục vụ | Bàn: B01 đang có đơn mở | Manual | Hệ thống gửi thông báo yêu cầu thanh toán đúng đến thu ngân/nhân viên phục vụ | High | P |
| 78 | QR_016 | Xử lý QR không hợp lệ | Hệ thống báo lỗi đúng trường hợp QR không hợp lệ, thông điệp rõ ràng | 1. Dùng QR giả hoặc QR sai cấu trúc<br>2. Quét bằng điện thoại | QR không hợp lệ | Manual | Hệ thống không mở menu, hiển thị thông báo lỗi rõ ràng về QR không hợp lệ | High | P |
| 79 | QR_017 | Xử lý QR hết hiệu lực | Hệ thống báo đúng khi QR hết hiệu lực | 1. Dùng QR của bàn đã bị hết hiệu lực<br>2. Quét bằng điện thoại | QR hết hiệu lực | Manual | Hệ thống hiển thị thông báo QR hết hiệu lực và yêu cầu liên hệ nhân viên | High | P |
| 80 | QR_018 | Xử lý bàn khóa | Hệ thống từ chối truy cập khi bàn đang khóa | 1. Đặt bàn B05 ở trạng thái Khóa sử dụng<br>2. Quét QR của bàn B05 | Bàn: B05<br>Trạng thái: Khóa sử dụng | Manual | Hệ thống không cho vào menu, hiển thị thông báo bàn đang khóa/không phục vụ | High | P |
| 81 | QR_019 | Xử lý món vừa hết trong lúc khách đặt | Khách được thông báo và không thể đặt món đã hết | 1. Khách mở trang QR và chọn món “Bún bò” vào giỏ<br>2. Trước khi xác nhận, phía quản trị đổi món này sang Hết món<br>3. Khách bấm xác nhận đặt món | Món: Bún bò<br>Trạng thái thay đổi sang Hết món trước khi xác nhận | Manual | Hệ thống chặn đặt món đã hết, hiển thị thông báo yêu cầu chọn món khác hoặc cập nhật lại giỏ hàng | High | P |
| 82 | QR_020 | Xử lý mất kết nối | Giỏ hàng được lưu tạm hợp lý, hệ thống thông báo thử lại | 1. Khách chọn nhiều món vào giỏ<br>2. Ngắt mạng điện thoại trước khi xác nhận<br>3. Kiểm tra phản hồi hệ thống<br>4. Kết nối lại mạng và mở lại trang | Giỏ hàng gồm 2–3 món | Manual | Hệ thống thông báo mất kết nối, giỏ hàng được lưu tạm hợp lý và cho phép thử lại sau khi có mạng | High | P |
| 83 | QR_021 | Khách không được đổi bàn từ giao diện QR | Hệ thống không cho phép khách thay đổi bàn phát sinh từ QR | 1. Quét QR của bàn B01<br>2. Thử sửa tham số URL hoặc thao tác chuyển sang bàn B02 từ giao diện QR | B01, B02 đã tồn tại | Manual | Khách không thể đổi bàn từ giao diện QR; mọi thao tác vẫn gắn với bàn phát sinh ban đầu | High | P |
| 84 | QR_022 | Đơn QR cần nhân viên xác nhận trước khi xuống bếp | Hệ thống xử lý đúng khi bật cấu hình cần nhân viên xác nhận | 1. Bật cấu hình “Đơn QR cần nhân viên xác nhận trước khi xuống bếp”<br>2. Khách đặt món qua QR<br>3. Kiểm tra trạng thái đơn ở phía nhân viên/bếp | Config xác nhận thủ công: ON | Manual | Đơn được ghi nhận nhưng chưa chuyển xuống bếp ngay; chờ nhân viên xác nhận theo cấu hình | High | P |
| 85 | QR_023 | Đơn QR tự động chuyển thẳng xuống bếp | Hệ thống xử lý đúng khi bật cấu hình tự động chuyển bếp | 1. Bật cấu hình “Đơn QR tự động chuyển xuống bếp”<br>2. Khách đặt món qua QR<br>3. Kiểm tra phía bếp hoặc màn hình nhân viên | Config tự động chuyển bếp: ON | Manual | Sau khi khách xác nhận, đơn tự động được chuyển xuống bếp hoặc màn hình nhân viên theo cấu hình | High | P |
| 86 | QR_024 | Đơn mới từ QR cộng dồn vào hóa đơn đang mở | Nếu một bàn đang mở hóa đơn, đơn mới từ QR được cộng dồn đúng theo cấu hình | 1. Tạo trước một hóa đơn đang mở cho bàn B01<br>2. Khách quét QR bàn B01 và đặt thêm món<br>3. Kiểm tra hóa đơn/đơn hiện tại của bàn | Bàn: B01 đang có hóa đơn mở | Manual | Món gọi mới từ QR được cộng dồn đúng vào hóa đơn đang mở của bàn B01 theo cấu hình | High | P |

### 4.6. Module 2.6 - Quản lí đặt bàn
| STT | Mã TC | Chức năng | Mô tả | Các bước thực hiện | Bộ data test | Phương thức | Kết quả mong muốn | Độ ưu tiên | Kết quả test |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 87 | RES_001 | Khách đặt bàn online | Khách tạo yêu cầu đặt bàn thành công mà không cần thao tác nội bộ | 1. Mở trang đặt bàn online<br>2. Chọn ngày/giờ đặt bàn<br>3. Nhập số lượng người<br>4. Chọn khu vực mong muốn<br>5. Nhập thông tin liên hệ<br>6. Bấm gửi yêu cầu đặt bàn | Ngày: 20/03/2026<br>Giờ: 19:00<br>Số người: 4<br>Khu vực: VIP<br>Tên: Nguyễn Văn A<br>SĐT: 0909000001 | Manual | Hệ thống tạo yêu cầu đặt bàn thành công, sinh mã đặt bàn hoặc thông báo thành công mà không cần nhân viên thao tác nội bộ | High | P |
| 88 | RES_002 | Chọn ngày/giờ đặt bàn | Hệ thống nhận đúng ngày, giờ hợp lệ khi khách đặt bàn | 1. Mở form đặt bàn online<br>2. Chọn ngày hợp lệ trong tương lai<br>3. Chọn giờ hợp lệ trong khung giờ phục vụ<br>4. Điền các thông tin còn lại và gửi yêu cầu | Ngày: 21/03/2026<br>Giờ: 18:30 | Manual | Hệ thống lưu đúng ngày, giờ khách chọn và tiếp tục cho gửi yêu cầu đặt bàn | High | P |
| 89 | RES_003 | Chọn ngày/giờ đặt bàn | Hệ thống chặn thời gian đặt bàn không hợp lệ | 1. Mở form đặt bàn online<br>2. Chọn ngày/giờ không hợp lệ (quá khứ hoặc ngoài giờ phục vụ)<br>3. Bấm gửi yêu cầu | Ngày: 10/01/2026 hoặc giờ: 02:00 | Manual | Hệ thống không cho gửi yêu cầu, hiển thị thông báo thời gian đặt bàn không hợp lệ | High | P |
| 90 | RES_004 | Nhập số lượng người | Hệ thống lưu đúng số lượng người và dùng để gợi ý/xác nhận bàn phù hợp | 1. Mở form đặt bàn<br>2. Nhập số lượng người<br>3. Hoàn tất thông tin và gửi yêu cầu<br>4. Kiểm tra thông tin đặt bàn phía nhà hàng | Số người: 6 | Manual | Hệ thống lưu đúng số lượng người, thông tin này hiển thị cho nhà hàng để bố trí bàn phù hợp | High | P |
| 91 | RES_005 | Chọn khu vực mong muốn | Khu vực khách chọn được ghi nhận và hiển thị cho nhà hàng xử lý | 1. Mở form đặt bàn<br>2. Chọn khu vực mong muốn<br>3. Hoàn tất thông tin và gửi yêu cầu<br>4. Kiểm tra phía danh sách đặt bàn của nhà hàng | Khu vực: Tầng 2 / VIP / Ngoài trời | Manual | Hệ thống lưu đúng khu vực khách chọn và hiển thị cho nhân viên xử lý | Medium | P |
| 92 | RES_006 | Nhập thông tin liên hệ khách | Hệ thống lưu được tên, số điện thoại/email hợp lệ | 1. Mở form đặt bàn<br>2. Nhập tên khách<br>3. Nhập số điện thoại/email hợp lệ<br>4. Gửi yêu cầu | Tên: Trần Thị B<br>SĐT: 0911222333<br>Email: b@test.com | Manual | Hệ thống lưu đúng thông tin liên hệ của khách và tạo yêu cầu thành công | High | P |
| 93 | RES_007 | Nhập thông tin liên hệ khách | Hệ thống kiểm tra định dạng cơ bản của số điện thoại/email không hợp lệ | 1. Mở form đặt bàn<br>2. Nhập tên khách<br>3. Nhập số điện thoại hoặc email sai định dạng<br>4. Bấm gửi yêu cầu | SĐT: 09abc123<br>Email: abc@ | Manual | Hệ thống không cho gửi yêu cầu, hiển thị thông báo lỗi định dạng số điện thoại/email | High | P |
| 94 | RES_008 | Ghi chú yêu cầu đặc biệt | Ghi chú như bàn gần cửa sổ, ghế em bé, sinh nhật... được lưu đúng | 1. Mở form đặt bàn<br>2. Nhập đầy đủ thông tin<br>3. Nhập ghi chú yêu cầu đặc biệt<br>4. Gửi yêu cầu | Ghi chú: Bàn gần cửa sổ, có ghế em bé, trang trí sinh nhật | Manual | Hệ thống lưu đúng ghi chú đặc biệt và hiển thị cho nhà hàng xử lý | Medium | P |
| 95 | RES_009 | Nhà hàng xác nhận đặt bàn | Nhân viên xác nhận được yêu cầu đặt bàn, trạng thái cập nhật đúng | 1. Đăng nhập bằng tài khoản nhân viên/quản lý<br>2. Mở danh sách đặt bàn<br>3. Chọn yêu cầu chờ xác nhận<br>4. Bấm Xác nhận | Đơn đặt bàn trạng thái: Chờ xác nhận | Manual | Yêu cầu đặt bàn được xác nhận thành công, trạng thái đổi sang Đã xác nhận | High | P |
| 96 | RES_010 | Hủy đặt bàn | Đặt bàn bị hủy đúng quy trình, trạng thái thay đổi đúng, không giữ chỗ nữa | 1. Mở danh sách đặt bàn<br>2. Chọn một yêu cầu đã tạo hoặc đã xác nhận<br>3. Bấm Hủy đặt bàn<br>4. Xác nhận thao tác | Mã đặt bàn: RES0001 | Manual | Đặt bàn được hủy thành công, trạng thái chuyển sang Đã hủy, không tiếp tục giữ chỗ cho khung giờ đó | High | P |
| 97 | RES_011 | Đổi lịch đặt bàn | Cho phép dời ngày/giờ/khu vực khi hợp lệ, dữ liệu cập nhật đồng bộ | 1. Mở yêu cầu đặt bàn đã tồn tại<br>2. Chọn Đổi lịch<br>3. Sửa ngày/giờ hoặc khu vực<br>4. Lưu thay đổi | Ngày cũ: 20/03/2026 19:00<br>Ngày mới: 21/03/2026 20:00<br>Khu vực mới: VIP | Manual | Hệ thống cập nhật đúng ngày/giờ/khu vực mới, dữ liệu hiển thị đồng bộ ở danh sách đặt bàn | High | P |
| 98 | RES_012 | Nhắc lịch qua SMS/email | Thông báo nhắc lịch được tạo/gửi đúng cấu hình, đúng người nhận | 1. Tạo hoặc chọn một đặt bàn đã xác nhận<br>2. Đảm bảo cấu hình nhắc lịch đang bật<br>3. Chờ hoặc kích hoạt gửi nhắc lịch<br>4. Kiểm tra tin nhắn/email người nhận | Kênh: SMS hoặc Email<br>SĐT: 0911222333<br>Email: b@test.com | Manual | Hệ thống tạo/gửi thông báo nhắc lịch đúng cấu hình, đúng người nhận, đúng nội dung cơ bản | Medium | P |
| 99 | RES_013 | Xem danh sách đặt bàn theo ngày/giờ/khu vực | Nhân viên lọc và xem được danh sách bàn đặt theo điều kiện yêu cầu | 1. Đăng nhập bằng tài khoản nhân viên/quản lý<br>2. Mở màn hình danh sách đặt bàn<br>3. Lọc theo ngày, giờ hoặc khu vực<br>4. Kiểm tra kết quả hiển thị | Ngày: 21/03/2026<br>Giờ: 19:00<br>Khu vực: VIP | Manual | Hệ thống hiển thị đúng danh sách đặt bàn theo điều kiện lọc, thông tin dễ theo dõi và đối chiếu | High | P |

### 4.7. Module 2.7 - Quản lý đơn hàng
| STT | Mã TC | Chức năng | Mô tả | Các bước thực hiện | Bộ data test | Phương thức | Kết quả mong muốn | Độ ưu tiên | Kết quả test |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 100 | ORDER_001 | Tạo đơn từ nhiều nguồn | Đơn được tạo đúng từ phục vụ tại bàn | 1. Đăng nhập bằng tài khoản nhân viên phục vụ<br>2. Chọn bàn B01<br>3. Tạo đơn mới<br>4. Thêm 1 món vào đơn | User: waiter01<br>Bàn: B01<br>Món: Cơm gà | Manual | Đơn được tạo thành công, nguồn tạo đơn là phục vụ tại bàn, gắn đúng bàn B01 | High | P |
| 101 | ORDER_002 | Tạo đơn từ nhiều nguồn | Đơn được tạo đúng từ QR | 1. Quét QR bàn B01<br>2. Chọn món<br>3. Xác nhận đặt món<br>4. Kiểm tra ở màn hình quản lý đơn | Bàn: B01<br>Món: Trà sữa | Manual | Hệ thống tạo đúng đơn từ nguồn QR và gắn đúng bàn phát sinh | High | P |
| 102 | ORDER_003 | Tạo đơn từ nhiều nguồn | Đơn được tạo đúng từ mang đi | 1. Đăng nhập hệ thống<br>2. Chọn hình thức mang đi<br>3. Tạo đơn<br>4. Thêm món | User: cashier01<br>Món: Bún bò | Manual | Đơn mang đi được tạo thành công, không gắn bàn | High | P |
| 103 | ORDER_004 | Tạo đơn từ nhiều nguồn | Đơn được tạo đúng từ giao hàng | 1. Chọn hình thức giao hàng<br>2. Nhập thông tin khách nhận<br>3. Thêm món<br>4. Lưu đơn | Khách: Nguyễn A<br>SĐT: 0909000001<br>Món: Pizza | Manual | Đơn giao hàng được tạo thành công, lưu đúng thông tin giao hàng | High | P |
| 104 | ORDER_005 | Chuyển trạng thái đơn hàng | Đơn chuyển từ Mới tạo sang Chờ xác nhận đúng | 1. Tạo đơn mới<br>2. Bấm lưu hoặc gửi xác nhận theo luồng | Đơn mới tạo | Manual | Trạng thái đơn chuyển đúng sang Chờ xác nhận | High | P |
| 105 | ORDER_006 | Chuyển trạng thái đơn hàng | Đơn chuyển từ Chờ xác nhận sang Đã xác nhận đúng | 1. Mở đơn trạng thái Chờ xác nhận<br>2. Bấm Xác nhận đơn | Đơn trạng thái Chờ xác nhận | Manual | Trạng thái đơn chuyển sang Đã xác nhận | High | P |
| 106 | ORDER_007 | Chuyển trạng thái đơn hàng | Đơn chuyển từ Đã xác nhận sang Đang chế biến đúng | 1. Mở đơn đã xác nhận<br>2. Chuyển trạng thái qua bếp/chế biến | Đơn đã xác nhận | Manual | Trạng thái đơn chuyển sang Đang chế biến | High | P |
| 107 | ORDER_008 | Chuyển trạng thái đơn hàng | Đơn chuyển sang Đã phục vụ một phần đúng | 1. Mở đơn có nhiều món<br>2. Đánh dấu một phần món đã phục vụ | Đơn gồm 3 món | Manual | Trạng thái đơn chuyển sang Đã phục vụ một phần | Medium | P |
| 108 | ORDER_009 | Chuyển trạng thái đơn hàng | Đơn chuyển sang Hoàn tất đúng | 1. Mở đơn đã phục vụ xong<br>2. Thực hiện hoàn tất đơn | Đơn đã phục vụ đủ món | Manual | Trạng thái đơn chuyển sang Hoàn tất | High | P |
| 109 | ORDER_010 | Chuyển trạng thái đơn hàng | Đơn chuyển sang Hủy đúng | 1. Mở đơn chưa hoàn tất<br>2. Chọn Hủy đơn<br>3. Nhập lý do | Đơn trạng thái Chờ xác nhận | Manual | Trạng thái đơn chuyển sang Đã hủy và lưu lý do hủy | High | P |
| 110 | ORDER_011 | Chỉnh sửa số lượng món trước xác nhận | Số lượng món cập nhật đúng trước khi đơn được chốt | 1. Mở đơn chưa xác nhận<br>2. Chọn món trong đơn<br>3. Sửa số lượng<br>4. Lưu | Món: Cơm gà từ 1 thành 3 | Manual | Số lượng món cập nhật đúng, tổng tiền thay đổi đúng | High | P |
| 111 | ORDER_012 | Chỉnh sửa số lượng món trước xác nhận | Không cho sửa số lượng món sau khi đơn đã chốt nếu không đúng quyền/luồng | 1. Mở đơn đã xác nhận hoặc đang chế biến<br>2. Thử sửa số lượng món | Đơn đã xác nhận | Manual | Hệ thống chặn hoặc yêu cầu đúng quy trình/quyền hạn trước khi sửa | Medium | P |
| 112 | ORDER_013 | Hủy món / hủy đơn có lý do | Hủy món có nhập lý do và lưu đầy đủ | 1. Mở đơn có nhiều món<br>2. Chọn 1 món<br>3. Bấm Hủy món<br>4. Nhập lý do | Món: Nước cam<br>Lý do: khách đổi món | Manual | Món bị hủy đúng, lý do hủy được lưu | High | P |
| 113 | ORDER_014 | Hủy món / hủy đơn có lý do | Hủy đơn có nhập lý do và lưu đầy đủ | 1. Mở đơn hợp lệ<br>2. Bấm Hủy đơn<br>3. Nhập lý do<br>4. Xác nhận | Lý do: khách hủy bàn | Manual | Đơn bị hủy đúng, trạng thái cập nhật và lý do được lưu đầy đủ | High | P |
| 114 | ORDER_015 | Tách đơn theo khách hoặc món | Tách đơn theo món đúng logic, không mất dữ liệu món/tiền | 1. Mở đơn có nhiều món<br>2. Chọn Tách đơn<br>3. Chọn 1 số món sang đơn mới<br>4. Xác nhận | Đơn: Cơm gà, Salad, Nước cam | Manual | Đơn mới được tạo, món được tách đúng, tổng tiền 2 đơn khớp với đơn gốc | High | P |
| 115 | ORDER_016 | Tách đơn theo khách hoặc món | Tách đơn theo khách đúng logic, không mất dữ liệu món/tiền | 1. Mở đơn bàn nhiều khách<br>2. Chọn Tách theo khách<br>3. Phân món cho từng khách<br>4. Xác nhận | Bàn 4 người, nhiều món | Manual | Đơn được tách đúng theo khách, không mất dữ liệu | Medium | P |
| 116 | ORDER_017 | Gộp đơn | Gộp đơn đúng điều kiện, không trùng món, không sai tổng tiền | 1. Mở 2 đơn hợp lệ<br>2. Chọn Gộp đơn<br>3. Xác nhận gộp | Đơn 1 và Đơn 2 cùng loại phục vụ phù hợp | Manual | Hệ thống gộp đơn đúng, danh sách món và tổng tiền chính xác, không trùng sai dữ liệu | High | P |
| 117 | ORDER_018 | Theo dõi lịch sử thay đổi đơn hàng | Hệ thống lưu lịch sử chỉnh sửa, người thao tác, thời gian thay đổi | 1. Tạo đơn<br>2. Sửa số lượng món<br>3. Hủy 1 món<br>4. Mở lịch sử đơn | User: waiter01 | Manual | Lịch sử thay đổi ghi rõ hành động, người thao tác, thời gian | High | P |
| 118 | ORDER_019 | Hiển thị danh sách và chi tiết đơn | Màn hình danh sách đơn hiển thị rõ trạng thái, nguồn tạo, thời gian | 1. Mở màn hình danh sách đơn<br>2. Quan sát các cột thông tin<br>3. Thử lọc hoặc tìm đơn | Có nhiều đơn từ nhiều nguồn | Manual | Danh sách đơn hiển thị rõ ràng, dễ tra cứu, trạng thái đúng | Medium | P |
| 119 | ORDER_020 | Hiển thị danh sách và chi tiết đơn | Màn hình chi tiết đơn hiển thị đầy đủ món, số lượng, ghi chú, trạng thái | 1. Mở 1 đơn cụ thể<br>2. Kiểm tra phần chi tiết đơn | Đơn có nhiều món và ghi chú | Manual | Chi tiết đơn hiển thị đầy đủ, đúng dữ liệu, dễ theo dõi | Medium | P |

### 4.8. Module 2.8 - Thanh toán và hóa đơn
| STT | Mã TC | Chức năng | Mô tả | Các bước thực hiện | Bộ data test | Phương thức | Kết quả mong muốn | Độ ưu tiên | Kết quả test |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 120 | PAY_001 | Tạo hóa đơn từ đơn hàng | Hóa đơn được tạo đúng từ đơn, dữ liệu món và tổng tiền chính xác | 1. Mở đơn hàng đã sẵn sàng thanh toán<br>2. Bấm Tạo hóa đơn | Đơn có 3 món, tổng tiền 250.000 | Manual | Hóa đơn được tạo từ đúng đơn hàng, danh sách món và tổng tiền khớp | High | P |
| 121 | PAY_002 | Áp dụng giảm giá/voucher/khuyến mãi | Giảm giá trực tiếp được tính đúng | 1. Mở hóa đơn<br>2. Chọn giảm giá trực tiếp<br>3. Nhập % hoặc số tiền<br>4. Xác nhận | Hóa đơn: 500.000<br>Giảm 10% | Manual | Giá trị giảm được tính đúng, tổng thanh toán sau giảm chính xác | High | P |
| 122 | PAY_003 | Áp dụng giảm giá/voucher/khuyến mãi | Voucher hợp lệ được áp dụng đúng | 1. Mở hóa đơn<br>2. Nhập mã voucher hợp lệ<br>3. Xác nhận | Voucher: VC50K<br>Điều kiện đơn tối thiểu: 300.000 | Manual | Voucher được áp dụng nếu đủ điều kiện, số tiền giảm đúng cấu hình | High | P |
| 123 | PAY_004 | Áp dụng giảm giá/voucher/khuyến mãi | Voucher không hợp lệ hoặc không đủ điều kiện bị từ chối | 1. Mở hóa đơn<br>2. Nhập voucher không hợp lệ hoặc đơn không đủ điều kiện<br>3. Xác nhận | Voucher: VC50K<br>Đơn: 200.000 | Manual | Hệ thống không áp dụng voucher, hiển thị thông báo phù hợp | High | P |
| 124 | PAY_005 | Tính VAT và phí dịch vụ | VAT và phí dịch vụ tính đúng công thức và hiển thị minh bạch | 1. Mở hóa đơn<br>2. Kiểm tra các khoản VAT/phí dịch vụ | Tiền hàng: 1.000.000<br>VAT: 8%<br>Phí DV: 5% | Manual | VAT/phí dịch vụ được tính đúng và hiển thị rõ trên hóa đơn | High | P |
| 125 | PAY_006 | Thanh toán tiền mặt | Nhận tiền mặt và tính tiền thừa đúng | 1. Mở hóa đơn cần thanh toán<br>2. Chọn thanh toán tiền mặt<br>3. Nhập số tiền khách đưa<br>4. Xác nhận | Tổng hóa đơn: 180.000<br>Khách đưa: 200.000 | Manual | Hệ thống ghi nhận thanh toán thành công và tính tiền thừa = 20.000 | High | P |
| 126 | PAY_007 | Thanh toán tiền mặt | Trường hợp khách đưa thiếu tiền được xử lý đúng | 1. Mở hóa đơn<br>2. Chọn thanh toán tiền mặt<br>3. Nhập số tiền nhỏ hơn tổng hóa đơn<br>4. Xác nhận | Tổng hóa đơn: 180.000<br>Khách đưa: 150.000 | Manual | Hệ thống cảnh báo chưa đủ tiền hoặc không cho hoàn tất thanh toán | High | P |
| 127 | PAY_008 | Thanh toán thẻ | Ghi nhận đúng giao dịch thanh toán thẻ, trạng thái hóa đơn cập nhật đúng | 1. Mở hóa đơn<br>2. Chọn thanh toán thẻ<br>3. Xác nhận giao dịch | Tổng hóa đơn: 350.000 | Manual | Giao dịch thanh toán thẻ được ghi nhận đúng, hóa đơn chuyển trạng thái đã thanh toán | High | P |
| 128 | PAY_009 | Thanh toán ví điện tử | Ghi nhận đúng giao dịch ví điện tử, kết quả phản hồi chính xác | 1. Mở hóa đơn<br>2. Chọn thanh toán ví điện tử<br>3. Xác nhận giao dịch thành công | Ví điện tử: MoMo/ZaloPay mock | Manual | Hệ thống ghi nhận giao dịch thành công và cập nhật trạng thái hóa đơn đúng | High | P |
| 129 | PAY_010 | Thanh toán chuyển khoản/QR | Tạo và xử lý đúng QR thanh toán hoặc chuyển khoản | 1. Mở hóa đơn<br>2. Chọn thanh toán chuyển khoản/QR<br>3. Hiển thị mã QR<br>4. Xác nhận thanh toán thành công | Tổng hóa đơn: 420.000 | Manual | Hệ thống tạo đúng QR thanh toán/chuyển khoản và cập nhật hóa đơn khi thanh toán thành công | High | P |
| 130 | PAY_011 | In hóa đơn | In hóa đơn đúng định dạng, đủ thông tin, dễ đọc | 1. Mở hóa đơn đã thanh toán hoặc sẵn sàng in<br>2. Bấm In hóa đơn | Hóa đơn có món, giảm giá, VAT | Manual | Hóa đơn in ra đúng định dạng, đủ món, SL, giá, tổng tiền, thuế/phí | High | P |
| 131 | PAY_012 | Gửi hóa đơn điện tử | Hóa đơn điện tử được gửi đúng khi bật cấu hình | 1. Bật cấu hình hóa đơn điện tử<br>2. Mở hóa đơn<br>3. Nhập email khách<br>4. Bấm Gửi | Email: khach@test.com<br>Config e-invoice: ON | Manual | Hóa đơn điện tử được gửi thành công tới email đã nhập | Medium | P |
| 132 | PAY_013 | Gửi hóa đơn điện tử | Không gửi hóa đơn điện tử khi chưa bật cấu hình | 1. Tắt cấu hình hóa đơn điện tử<br>2. Mở hóa đơn<br>3. Thử gửi hóa đơn điện tử | Config e-invoice: OFF | Manual | Hệ thống không cho gửi hoặc thông báo chưa bật cấu hình hóa đơn điện tử | Medium | P |
| 133 | PAY_014 | Tách hóa đơn | Tách hóa đơn theo món đúng yêu cầu, tổng sau tách khớp đơn gốc | 1. Mở hóa đơn có nhiều món<br>2. Chọn Tách hóa đơn<br>3. Chọn 1 số món sang hóa đơn mới<br>4. Xác nhận | Hóa đơn gồm 4 món | Manual | Hóa đơn mới được tạo, món tách đúng, tổng 2 hóa đơn khớp hóa đơn gốc | High | P |
| 134 | PAY_015 | Tách hóa đơn | Tách hóa đơn theo khách đúng yêu cầu | 1. Mở hóa đơn của bàn nhiều khách<br>2. Chọn Tách theo khách<br>3. Phân món cho từng khách<br>4. Xác nhận | Bàn 4 khách | Manual | Hóa đơn được tách đúng theo phần món của từng khách | Medium | P |
| 135 | PAY_016 | Yêu cầu thanh toán từ QR | Khi khách bấm yêu cầu thanh toán, hệ thống báo đúng cho thu ngân/nhân viên | 1. Quét QR tại bàn đang có đơn mở<br>2. Bấm Yêu cầu thanh toán<br>3. Kiểm tra phía nhân viên/thu ngân | Bàn: B01 đang có hóa đơn mở | Manual | Hệ thống gửi thông báo yêu cầu thanh toán đúng bàn, đúng nơi nhận | High | P |
| 136 | PAY_017 | Không bắt buộc tự thanh toán online | Nếu chưa bật thanh toán online, khách chỉ gửi yêu cầu chứ không tự trả tiền | 1. Tắt cấu hình thanh toán online<br>2. Vào giao diện QR của bàn<br>3. Kiểm tra chức năng thanh toán | Config online payment: OFF | Manual | Khách chỉ thấy/yêu cầu thanh toán, không thực hiện tự thanh toán online được | High | P |
| 137 | PAY_018 | Không bắt buộc tự thanh toán online | Nếu bật thanh toán online, khách có thể thực hiện thanh toán theo cấu hình | 1. Bật cấu hình thanh toán online<br>2. Vào giao diện QR<br>3. Chọn thanh toán online | Config online payment: ON | Manual | Hệ thống cho phép khách tự thanh toán online theo cấu hình nhà hàng | Medium | P |
| 138 | PAY_019 | Tạo hóa đơn từ đơn hàng | Không cho tạo hóa đơn từ đơn không hợp lệ/chưa đủ điều kiện thanh toán | 1. Mở đơn chưa xác nhận hoặc đã hủy<br>2. Thử tạo hóa đơn | Đơn trạng thái: Chờ xác nhận hoặc Đã hủy | Manual | Hệ thống chặn tạo hóa đơn và hiển thị thông báo phù hợp | High | P |
| 139 | PAY_020 | Áp dụng giảm giá/voucher/khuyến mãi | Không cho giá trị giảm vượt điều kiện cấu hình | 1. Mở hóa đơn<br>2. Nhập mức giảm vượt giá trị cho phép<br>3. Xác nhận | Hóa đơn: 100.000<br>Giảm trực tiếp: 150.000 | Manual | Hệ thống không cho áp dụng mức giảm sai, hiển thị cảnh báo hợp lệ | High | P |

### 4.9. Module 2.9 - Quản lý khách hàng
| STT | Mã TC | Chức năng | Mô tả | Các bước thực hiện | Bộ data test | Phương thức | Kết quả mong muốn | Độ ưu tiên | Kết quả test |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 140 | CUS_001 | Tạo thông tin khách hàng | Tạo mới khách hàng thành công với tên, số điện thoại và dữ liệu cơ bản | 1. Đăng nhập bằng tài khoản có quyền<br>2. Vào màn hình Khách hàng<br>3. Bấm Thêm mới<br>4. Nhập tên, số điện thoại và thông tin cơ bản<br>5. Lưu | Tên: Nguyễn Văn A<br>SĐT: 0909000001 | Manual | Khách hàng được tạo thành công và hiển thị trong danh sách | High | P |
| 141 | CUS_002 | Tạo thông tin khách hàng | Tạo mới khách hàng với đầy đủ thông tin mở rộng | 1. Mở form thêm khách hàng<br>2. Nhập tên, SĐT, email, ghi chú<br>3. Lưu | Tên: Trần Thị B<br>SĐT: 0911222333<br>Email: b@test.com<br>Ghi chú: khách quen | Manual | Hệ thống lưu đầy đủ thông tin khách hàng, không mất dữ liệu | Medium | P |
| 142 | CUS_003 | Tạo thông tin khách hàng | Không cho tạo khách hàng khi thiếu trường bắt buộc | 1. Mở form thêm khách hàng<br>2. Để trống tên hoặc số điện thoại<br>3. Bấm Lưu | Tên: rỗng<br>SĐT: rỗng hoặc thiếu 1 trong 2 | Manual | Hệ thống chặn lưu và hiển thị thông báo thiếu trường bắt buộc | High | P |
| 143 | CUS_004 | Lưu số điện thoại và tên | Dữ liệu tên và số điện thoại được lưu đúng định dạng hợp lệ | 1. Thêm mới khách hàng<br>2. Nhập tên và SĐT hợp lệ<br>3. Lưu<br>4. Mở lại chi tiết khách hàng | Tên: Lê Anh C<br>SĐT: 0988666555 | Manual | Tên và số điện thoại được lưu đúng, hiển thị đúng khi xem lại | High | P |
| 144 | CUS_005 | Lưu số điện thoại và tên | Kiểm tra số điện thoại sai định dạng bị chặn | 1. Mở form thêm/sửa khách hàng<br>2. Nhập số điện thoại sai định dạng<br>3. Bấm Lưu | SĐT: 09abc123 hoặc 123 | Manual | Hệ thống không cho lưu, hiển thị lỗi định dạng số điện thoại | High | P |
| 145 | CUS_006 | Lưu số điện thoại và tên | Kiểm tra tên khách hàng không hợp lệ hoặc để trống bị chặn | 1. Mở form thêm khách hàng<br>2. Để trống tên hoặc nhập ký tự không phù hợp theo rule<br>3. Bấm Lưu | Tên: rỗng | Manual | Hệ thống chặn lưu và báo lỗi trường tên khách hàng | High | P |
| 146 | CUS_007 | Tạo thông tin khách hàng | Không cho tạo trùng khách hàng theo số điện thoại nếu hệ thống quy định duy nhất | 1. Tạo khách hàng với SĐT 0909000001<br>2. Tạo tiếp khách hàng khác dùng lại SĐT này<br>3. Lưu | KH1: 0909000001<br>KH2: 0909000001 | Manual | Hệ thống chặn trùng hoặc cảnh báo trùng theo quy định | Medium | P |
| 147 | CUS_008 | Sửa thông tin khách hàng | Chỉnh sửa tên khách hàng và lưu đúng dữ liệu mới | 1. Mở chi tiết khách hàng<br>2. Chọn Sửa<br>3. Đổi tên khách hàng<br>4. Lưu | Tên cũ: Nguyễn Văn A<br>Tên mới: Nguyễn Văn An | Manual | Tên mới được cập nhật đúng trong danh sách và chi tiết khách hàng | High | P |
| 148 | CUS_009 | Sửa thông tin khách hàng | Chỉnh sửa số điện thoại khách hàng và lưu đúng dữ liệu mới | 1. Mở chi tiết khách hàng<br>2. Chọn Sửa<br>3. Đổi số điện thoại<br>4. Lưu | SĐT cũ: 0909000001<br>SĐT mới: 0909000002 | Manual | Số điện thoại được cập nhật đúng, không lỗi dữ liệu | High | P |
| 149 | CUS_010 | Sửa thông tin khách hàng | Chỉnh sửa email/ghi chú và lưu đúng | 1. Mở chi tiết khách hàng<br>2. Sửa email hoặc ghi chú<br>3. Lưu | Email mới: new@test.com<br>Ghi chú: khách VIP | Manual | Thông tin mới được lưu đúng và hiển thị khi xem lại | Medium | P |
| 150 | CUS_011 | Lưu lịch sử dùng bữa | Hệ thống ghi nhận lịch sử dùng bữa sau khi khách phát sinh đơn hoàn tất | 1. Tạo đơn hàng gắn với khách hàng<br>2. Hoàn tất đơn<br>3. Mở hồ sơ khách hàng<br>4. Xem lịch sử dùng bữa | KH: Nguyễn Văn A<br>Đơn: hoàn tất 1 hóa đơn | Manual | Lịch sử dùng bữa của khách được cập nhật với đơn vừa hoàn tất | High | P |
| 151 | CUS_012 | Lưu lịch sử dùng bữa | Lịch sử dùng bữa hiển thị đúng thông tin đơn/lần dùng bữa | 1. Mở hồ sơ khách hàng đã có lịch sử<br>2. Kiểm tra các thông tin hiển thị | KH đã có 2–3 đơn trước đó | Manual | Hiển thị đúng ngày dùng bữa, mã đơn/hóa đơn, giá trị đơn hoặc thông tin chính theo thiết kế | Medium | P |
| 152 | CUS_013 | Lưu lịch sử dùng bữa | Không ghi nhận sai lịch sử cho khách hàng khác | 1. Tạo đơn cho khách A<br>2. Hoàn tất đơn<br>3. Mở hồ sơ khách B | KH A: 0909000001<br>KH B: 0911222333 | Manual | Lịch sử đơn chỉ cập nhật cho đúng khách phát sinh, không gắn nhầm khách | High | P |
| 153 | CUS_014 | Tích điểm thành viên | Điểm được cộng đúng quy tắc sau khi hoàn tất đơn hàng | 1. Gắn khách hàng vào đơn<br>2. Hoàn tất thanh toán<br>3. Mở hồ sơ khách hàng kiểm tra điểm | Rule ví dụ: 10.000 = 1 điểm<br>Đơn: 250.000 | Manual | Điểm được cộng đúng theo quy tắc cấu hình, số dư điểm cập nhật chính xác | High | P |
| 154 | CUS_015 | Tích điểm thành viên | Điểm được trừ đúng khi khách sử dụng điểm | 1. Mở đơn của khách có sẵn điểm<br>2. Chọn dùng điểm khi thanh toán<br>3. Hoàn tất giao dịch<br>4. Mở hồ sơ khách | KH có sẵn 100 điểm | Manual | Số điểm bị trừ đúng theo số điểm đã sử dụng, số dư còn lại chính xác | High | P |
| 155 | CUS_016 | Tích điểm thành viên | Không cho sử dụng điểm vượt số dư hiện có | 1. Mở đơn của khách<br>2. Chọn dùng số điểm lớn hơn số dư<br>3. Xác nhận | KH có 20 điểmDùng 50 điểm | Manual | Hệ thống chặn thao tác hoặc cảnh báo không đủ điểm | High | P |
| 156 | CUS_017 | Tích điểm thành viên | Điểm không thay đổi khi đơn bị hủy hoặc thanh toán không thành công | 1. Tạo đơn cho khách<br>2. Hủy đơn hoặc fail thanh toán<br>3. Kiểm tra điểm khách hàng | KH có 50 điểm ban đầu | Manual | Hệ thống không cộng/trừ điểm sai khi đơn không hoàn tất hợp lệ | Medium | P |
| 157 | CUS_018 | Phân nhóm khách hàng thân thiết | Hệ thống gán nhóm khách đúng theo điều kiện cấu hình | 1. Tạo/chuẩn bị khách hàng đạt điều kiện nhóm<br>2. Chạy cập nhật nhóm hoặc mở lại hồ sơ khách | Rule ví dụ: tổng chi tiêu > 5.000.000 = VIP | Manual | Khách hàng được gán đúng nhóm theo cấu hình | High | P |
| 158 | CUS_019 | Phân nhóm khách hàng thân thiết | Hệ thống cập nhật lại nhóm khách khi điều kiện thay đổi | 1. Chuẩn bị khách hàng đang ở nhóm thường<br>2. Phát sinh thêm đơn đạt điều kiện VIP<br>3. Kiểm tra nhóm khách | KH từ Regular lên VIP | Manual | Nhóm khách được cập nhật đúng theo điều kiện mới | Medium | P |
| 159 | CUS_020 | Tra cứu danh sách khách hàng | Tìm kiếm khách hàng theo tên hoạt động đúng | 1. Vào danh sách khách hàng<br>2. Nhập tên vào ô tìm kiếm<br>3. Kiểm tra kết quả | Từ khóa: Nguyễn | Manual | Danh sách trả về đúng các khách hàng phù hợp với tên tìm kiếm | High | P |
| 160 | CUS_021 | Tra cứu danh sách khách hàng | Tìm kiếm khách hàng theo số điện thoại hoạt động đúng | 1. Mở danh sách khách hàng<br>2. Nhập số điện thoại vào ô tìm kiếm | SĐT: 0909000001 | Manual | Hệ thống trả đúng khách hàng có số điện thoại tương ứng | High | P |
| 161 | CUS_022 | Tra cứu danh sách khách hàng | Lọc danh sách khách hàng theo nhóm thân thiết hoạt động đúng | 1. Mở danh sách khách hàng<br>2. Chọn bộ lọc nhóm khách hàng<br>3. Kiểm tra kết quả hiển thị | Nhóm: VIP | Manual | Danh sách hiển thị đúng các khách thuộc nhóm được chọn | Medium | P |
| 162 | CUS_023 | Tra cứu danh sách khách hàng | Danh sách khách hàng hiển thị rõ thông tin chính | 1. Mở màn hình danh sách khách hàng<br>2. Quan sát các cột chính | Có sẵn dữ liệu nhiều khách hàng | Manual | Danh sách hiển thị rõ tên, SĐT, nhóm khách, điểm hoặc thông tin chính theo thiết kế | Medium | P |
| 163 | CUS_024 | Bảo vệ dữ liệu khách hàng cơ bản | Người không có quyền không xem được dữ liệu khách hàng | 1. Đăng nhập bằng tài khoản không có quyền phù hợp<br>2. Mở màn hình khách hàng hoặc truy cập trực tiếp URL | User không có quyền xem khách hàng | Manual | Hệ thống chặn truy cập và hiển thị thông báo không có quyền | High | P |
| 164 | CUS_025 | Bảo vệ dữ liệu khách hàng cơ bản | Người không có quyền không sửa được dữ liệu khách hàng | 1. Đăng nhập bằng tài khoản không có quyền sửa<br>2. Mở chi tiết khách hàng<br>3. Thử chỉnh sửa và lưu | User không có quyền sửa | Manual | Hệ thống không cho sửa/lưu dữ liệu khách hàng nếu người dùng không có quyền | High | P |

### 4.10. Module 2.10 – Quản lí khuyến mãi
| STT | Mã TC | Chức năng | Mô tả | Các bước thực hiện | Bộ data test | Phương thức | Kết quả mong muốn | Độ ưu tiên | Kết quả test |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 165 | PROMO_001 | Tạo chương trình khuyến mãi | Tạo mới chương trình thành công, lưu đúng tên, thời gian, phạm vi áp dụng | 1. Đăng nhập bằng tài khoản Quản lý/Admin<br>2. Vào màn hình khuyến mãi<br>3. Chọn Tạo mới<br>4. Nhập tên, thời gian áp dụng, phạm vi áp dụng<br>5. Lưu | Tên CTKM: Happy Hour 20%<br>Ngày áp dụng: 01/04/2026 - 30/04/2026 | Manual | Chương trình khuyến mãi được tạo thành công và hiển thị trong danh sách | High | P |
| 166 | PROMO_002 | Tạo chương trình khuyến mãi | Không cho tạo chương trình khi thiếu trường bắt buộc | 1. Mở form tạo khuyến mãi<br>2. Để trống tên hoặc thời gian áp dụng<br>3. Bấm Lưu | Tên: rỗng<br>Ngày áp dụng: rỗng | Manual | Hệ thống chặn lưu, hiển thị thông báo thiếu trường bắt buộc | High | P |
| 167 | PROMO_003 | Sửa/xóa chương trình khuyến mãi | Sửa chương trình khuyến mãi đúng điều kiện, dữ liệu cập nhật chính xác | 1. Mở chương trình đã tạo<br>2. Chọn Sửa<br>3. Thay đổi tên hoặc thời gian áp dụng<br>4. Lưu | Tên cũ: Happy Hour 20%<br>Tên mới: Happy Hour 25% | Manual | Chương trình được cập nhật đúng thông tin mới | High | P |
| 168 | PROMO_004 | Sửa/xóa chương trình khuyến mãi | Xóa chương trình khuyến mãi đúng điều kiện | 1. Mở chương trình chưa dùng hoặc được phép xóa<br>2. Bấm Xóa<br>3. Xác nhận | CTKM test chưa áp dụng | Manual | Chương trình bị xóa khỏi danh sách hoặc chuyển trạng thái xóa theo thiết kế | Medium | P |
| 169 | PROMO_005 | Thiết lập khuyến mãi theo món/nhóm món/combo/hóa đơn | Hệ thống áp dụng đúng cho 1 món cụ thể | 1. Tạo CTKM áp dụng cho món “Cơm gà”<br>2. Tạo đơn có món Cơm gà và món khác<br>3. Kiểm tra kết quả áp dụng | Món áp dụng: Cơm gà | Manual | Khuyến mãi chỉ áp dụng cho đúng món đã chọn, không áp dụng sai sang món khác | High | P |
| 170 | PROMO_006 | Thiết lập khuyến mãi theo món/nhóm món/combo/hóa đơn | Hệ thống áp dụng đúng theo nhóm món | 1. Tạo CTKM cho nhóm “Nước uống”<br>2. Tạo đơn có món nước và món chính<br>3. Kiểm tra khuyến mãi | Nhóm món: Nước uống | Manual | Khuyến mãi áp dụng đúng cho các món thuộc nhóm đã cấu hình | High | P |
| 171 | PROMO_007 | Thiết lập khuyến mãi theo món/nhóm món/combo/hóa đơn | Hệ thống áp dụng đúng cho combo | 1. Tạo CTKM cho combo xác định<br>2. Tạo đơn có đủ thành phần combo<br>3. Kiểm tra giá sau áp dụng | Combo: Gà rán + Pepsi | Manual | Khuyến mãi áp dụng đúng cho combo được chọn | High | P |
| 172 | PROMO_008 | Thiết lập khuyến mãi theo món/nhóm món/combo/hóa đơn | Hệ thống áp dụng đúng theo hóa đơn | 1. Tạo CTKM áp dụng theo toàn hóa đơn<br>2. Tạo đơn hợp lệ<br>3. Kiểm tra tổng giảm | Hóa đơn từ 500.000 | Manual | Khuyến mãi áp dụng ở mức hóa đơn, tổng tiền giảm đúng | High | P |
| 173 | PROMO_009 | Thiết lập theo khung giờ/ngày áp dụng | Khuyến mãi có hiệu lực đúng trong khoảng thời gian cấu hình | 1. Tạo CTKM áp dụng 14:00–17:00<br>2. Tạo đơn trong khung giờ này<br>3. Kiểm tra áp dụng | Khung giờ: 14:00–17:00 | Manual | Khuyến mãi được áp dụng đúng khi đơn phát sinh trong thời gian hợp lệ | High | P |
| 174 | PROMO_010 | Thiết lập theo khung giờ/ngày áp dụng | Khuyến mãi không áp dụng ngoài thời gian cấu hình | 1. Tạo CTKM theo khung giờ/ngày xác định<br>2. Tạo đơn ngoài thời gian đó<br>3. Kiểm tra kết quả | CTKM áp dụng ngày 01/04/2026 hoặc giờ 14:00–17:00 | Manual | Khuyến mãi không được áp dụng khi ngoài ngày/giờ cấu hình | High | P |
| 175 | PROMO_011 | Cấu hình loại khuyến mãi | Hỗ trợ loại khuyến mãi giảm theo phần trăm | 1. Tạo CTKM loại giảm %<br>2. Tạo đơn phù hợp<br>3. Kiểm tra số tiền giảm | Giảm 10% | Manual | Hệ thống tính đúng giá trị giảm theo % cấu hình | High | P |
| 176 | PROMO_012 | Cấu hình loại khuyến mãi | Hỗ trợ loại giảm theo số tiền cố định | 1. Tạo CTKM giảm số tiền cố định<br>2. Tạo đơn phù hợp<br>3. Kiểm tra số tiền giảm | Giảm cố định 50.000 | Manual | Hệ thống giảm đúng số tiền cố định, không tính sai tổng | High | P |
| 177 | PROMO_013 | Cấu hình loại khuyến mãi | Hỗ trợ loại mua 1 tặng 1 | 1. Tạo CTKM mua 1 tặng 1 cho món cụ thể<br>2. Tạo đơn đủ điều kiện<br>3. Kiểm tra số lượng/giá trị miễn phí | Món: Trà sữa | Manual | Hệ thống áp dụng đúng logic mua 1 tặng 1 | High | P |
| 178 | PROMO_014 | Cấu hình loại khuyến mãi | Hỗ trợ loại tặng món | 1. Tạo CTKM tặng món khi đạt điều kiện<br>2. Tạo đơn hợp lệ<br>3. Kiểm tra món tặng | Điều kiện: hóa đơn từ 300.000<br>Món tặng: Nước ngọt | Manual | Hệ thống thêm/ghi nhận đúng món tặng theo cấu hình | Medium | P |
| 179 | PROMO_015 | Cấu hình loại khuyến mãi | Hỗ trợ loại combo giá ưu đãi | 1. Tạo CTKM combo giá ưu đãi<br>2. Tạo đơn có đủ món combo<br>3. Kiểm tra giá sau áp dụng | Combo ưu đãi: Pizza + Pepsi = 199.000 | Manual | Hệ thống áp dụng đúng giá combo ưu đãi | High | P |
| 180 | PROMO_016 | Cấu hình loại khuyến mãi | Hỗ trợ voucher / mã giảm giá | 1. Tạo voucher mã VC10<br>2. Tạo đơn hợp lệ<br>3. Nhập mã voucher và áp dụng | Voucher: VC10 | Manual | Voucher được nhận diện và áp dụng đúng theo cấu hình | High | P |
| 181 | PROMO_017 | Cấu hình điều kiện áp dụng | Kiểm tra điều kiện giá trị đơn tối thiểu | 1. Tạo CTKM yêu cầu đơn từ 500.000<br>2. Tạo đơn 450.000 và 550.000<br>3. Kiểm tra kết quả | Đơn 1: 450.000<br>Đơn 2: 550.000 | Manual | CTKM chỉ áp dụng cho đơn đủ giá trị tối thiểu | High | P |
| 182 | PROMO_018 | Cấu hình điều kiện áp dụng | Kiểm tra điều kiện số lượng món tối thiểu | 1. Tạo CTKM yêu cầu tối thiểu 3 món<br>2. Tạo đơn với 2 món và 3 món<br>3. Kiểm tra áp dụng | Đơn 1: 2 món<br>Đơn 2: 3 món | Manual | Hệ thống chỉ áp dụng khuyến mãi khi đạt số lượng món tối thiểu | Medium | P |
| 183 | PROMO_019 | Cấu hình điều kiện áp dụng | Kiểm tra điều kiện theo nhóm khách hàng | 1. Tạo CTKM áp dụng cho khách VIP<br>2. Tạo đơn cho khách VIP và khách thường<br>3. Kiểm tra kết quả | Nhóm khách: VIP / Regular | Manual | Khuyến mãi chỉ áp dụng đúng cho nhóm khách đã cấu hình | High | P |
| 184 | PROMO_020 | Tự động kiểm tra hợp lệ | Khi áp dụng khuyến mãi, hệ thống tự xác định đủ điều kiện | 1. Tạo CTKM có điều kiện rõ ràng<br>2. Tạo đơn thỏa điều kiện<br>3. Kiểm tra hệ thống tự xác định hợp lệ | Đơn đủ điều kiện | Manual | Hệ thống tự nhận diện đơn hợp lệ và cho áp dụng đúng | High | P |
| 185 | PROMO_021 | Tự động kiểm tra hợp lệ | Khi áp dụng khuyến mãi, hệ thống tự xác định không đủ điều kiện | 1. Dùng CTKM có điều kiện<br>2. Tạo đơn không đủ điều kiện<br>3. Kiểm tra phản hồi hệ thống | Đơn không đạt ngưỡng | Manual | Hệ thống từ chối áp dụng và thông báo không đủ điều kiện | High | P |
| 186 | PROMO_022 | Áp dụng thủ công hoặc tự động | Nhân viên có thể áp dụng thủ công khi được phép | 1. Tạo CTKM ở chế độ áp dụng thủ công<br>2. Mở đơn phù hợp<br>3. Nhân viên chọn áp dụng khuyến mãi | User: cashier01 | Manual | Nhân viên áp dụng tay được, hệ thống tính đúng giá trị giảm | High | P |
| 187 | PROMO_023 | Áp dụng thủ công hoặc tự động | Hệ thống tự động áp dụng khi bật cấu hình tự động | 1. Tạo CTKM ở chế độ tự động<br>2. Tạo đơn đủ điều kiện<br>3. Kiểm tra khuyến mãi có tự áp dụng không | Config auto apply: ON | Manual | Khuyến mãi được tự động áp dụng mà không cần thao tác tay | High | P |
| 188 | PROMO_024 | Hiển thị khuyến mãi trên giao diện bán hàng/menu QR | Thông tin khuyến mãi hiển thị rõ ràng trên giao diện bán hàng | 1. Tạo CTKM đang hiệu lực<br>2. Mở giao diện bán hàng<br>3. Kiểm tra khu vực hiển thị khuyến mãi | CTKM đang hoạt động | Manual | Giao diện bán hàng hiển thị đúng tên/nội dung khuyến mãi, không gây nhầm lẫn | Medium | P |
| 189 | PROMO_025 | Hiển thị khuyến mãi trên giao diện bán hàng/menu QR | Thông tin khuyến mãi hiển thị đúng trên menu QR khi được bật | 1. Bật hiển thị CTKM trên menu QR<br>2. Quét QR bàn<br>3. Kiểm tra menu khách thấy khuyến mãi | Config hiển thị <br>QR: ON | Manual | Menu QR hiển thị đúng thông tin khuyến mãi theo cấu hình | Medium | P |
| 190 | PROMO_026 | Giới hạn số lần sử dụng voucher/chương trình | Không vượt quá số lần sử dụng đã cấu hình | 1. Tạo voucher giới hạn 2 lần dùng<br>2. Áp dụng lần 1 và lần 2 thành công<br>3. Thử áp dụng lần 3 | Voucher: VC2USE<br>Limit: 2 | Manual | Lần vượt giới hạn bị từ chối, hệ thống thông báo đã hết lượt sử dụng | High | P |
| 191 | PROMO_027 | Bật/tắt chương trình không cần xóa | Khi tắt, chương trình không còn áp dụng; khi bật lại, áp dụng đúng | 1. Tạo CTKM đang hoạt động<br>2. Tắt chương trình<br>3. Tạo đơn kiểm tra không áp dụng<br>4. Bật lại chương trình<br>5. Tạo đơn kiểm tra lại | CTKM test bật/tắt | Manual | Khi tắt, CTKM không được áp dụng; khi bật lại, CTKM áp dụng đúng như cấu hình | High | P |

### 4.11. Module 2.11 – Báo cáo và thống kê
| STT | Mã TC | Chức năng | Mô tả | Các bước thực hiện | Bộ data test | Phương thức | Kết quả mong muốn | Độ ưu tiên | Kết quả test |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 192 | RPT_001 | Xem báo cáo theo ngày | Báo cáo hiển thị đúng dữ liệu trong ngày được chọn | 1. Đăng nhập bằng tài khoản Quản lý/Admin<br>2. Vào màn hình Báo cáo<br>3. Chọn bộ lọc Theo ngày<br>4. Chọn ngày cần xem<br>5. Bấm Xem báo cáo | Ngày có phát sinh đơn: 21/03/2026 | Manual | Hệ thống hiển thị đúng dữ liệu báo cáo trong ngày đã chọn | High | P |
| 193 | RPT_002 | Xem báo cáo theo ngày | Báo cáo theo ngày không hiển thị sai dữ liệu của ngày khác | 1. Chọn báo cáo theo ngày<br>2. Chọn ngày A<br>3. Đối chiếu với dữ liệu đơn hàng/thanh toán ngày đó | Ngày A: 21/03/2026<br>Ngày B: 22/03/2026 | Manual | Báo cáo chỉ hiển thị dữ liệu của đúng ngày A, không lẫn dữ liệu ngày B | High | P |
| 194 | RPT_003 | Xem báo cáo theo tuần | Dữ liệu tuần được tổng hợp đúng và nhất quán | 1. Vào báo cáo<br>2. Chọn bộ lọc Theo tuần<br>3. Chọn tuần cần xem<br>4. Kiểm tra số liệu | Tuần 12 năm 2026 | Manual | Hệ thống tổng hợp đúng dữ liệu trong tuần được chọn | High | P |
| 195 | RPT_004 | Xem báo cáo theo tháng | Dữ liệu tháng tính đúng, không lệch kỳ | 1. Chọn bộ lọc Theo tháng<br>2. Chọn tháng cần xem<br>3. Kiểm tra tổng doanh thu/số đơn | Tháng 03/2026 | Manual | Báo cáo tháng hiển thị đúng dữ liệu trong toàn bộ tháng, không thiếu hoặc lệch kỳ | High | P |
| 196 | RPT_005 | Xem báo cáo theo năm | Dữ liệu năm được tổng hợp đúng theo phạm vi chọn | 1. Chọn bộ lọc Theo năm<br>2. Chọn năm cần xem<br>3. Kiểm tra số liệu tổng hợp | Năm 2026 | Manual | Hệ thống hiển thị đúng báo cáo của năm được chọn | Medium | P |
| 197 | RPT_006 | Xem báo cáo theo khoảng thời gian tùy chọn | Cho phép nhập khoảng thời gian hợp lệ và trả về dữ liệu đúng | 1. Chọn bộ lọc Khoảng thời gian tùy chọn<br>2. Nhập ngày bắt đầu và kết thúc hợp lệ<br>3. Bấm Xem báo cáo | Từ 01/03/2026 đến 15/03/2026 | Manual | Hệ thống trả về đúng dữ liệu trong khoảng thời gian đã chọn | High | P |
| 198 | RPT_007 | Xem báo cáo theo khoảng thời gian tùy chọn | Chặn khoảng thời gian không hợp lệ | 1. Chọn khoảng thời gian tùy chọn<br>2. Nhập ngày bắt đầu lớn hơn ngày kết thúc<br>3. Bấm Xem báo cáo | Từ 20/03/2026 đến 10/03/2026 | Manual | Hệ thống không cho xem báo cáo, hiển thị thông báo thời gian không hợp lệ | High | P |
| 199 | RPT_008 | Báo cáo tổng doanh thu | Tổng doanh thu khớp với dữ liệu bán hàng/thanh toán thực tế | 1. Mở báo cáo tổng doanh thu theo khoảng thời gian có dữ liệu<br>2. Đối chiếu với tổng tiền từ đơn/hóa đơn đã thanh toán | Khoảng thời gian có 5 hóa đơn đã thanh toán | Manual | Tổng doanh thu trên báo cáo khớp với tổng dữ liệu thanh toán thực tế | High | P |
| 200 | RPT_009 | Báo cáo tổng doanh thu | Không tính vào doanh thu các đơn chưa thanh toán hoặc đã hủy | 1. Chuẩn bị dữ liệu gồm đơn đã thanh toán, chưa thanh toán, đã hủy<br>2. Mở báo cáo doanh thu | 2 đơn thanh toán, 1 đơn chờ thanh toán, 1 đơn hủy | Manual | Báo cáo chỉ cộng đúng doanh thu từ các đơn hợp lệ theo quy tắc hệ thống | High | P |
| 201 | RPT_010 | Báo cáo doanh thu theo hình thức bán hàng | Phân loại đúng doanh thu ăn tại bàn | 1. Tạo dữ liệu đơn ăn tại bàn đã thanh toán<br>2. Mở báo cáo doanh thu theo hình thức bán hàng | 3 đơn ăn tại bàn | Manual | Doanh thu ăn tại bàn được thống kê đúng ở đúng nhóm | High | P |
| 202 | RPT_011 | Báo cáo doanh thu theo hình thức bán hàng | Phân loại đúng doanh thu mang đi | 1. Tạo dữ liệu đơn mang đi đã thanh toán<br>2. Mở báo cáo doanh thu theo hình thức bán hàng | 2 đơn mang đi | Manual | Doanh thu mang đi được thống kê đúng | High | P |
| 203 | RPT_012 | Báo cáo doanh thu theo hình thức bán hàng | Phân loại đúng doanh thu giao hàng | 1. Tạo dữ liệu đơn giao hàng đã thanh toán<br>2. Mở báo cáo doanh thu theo hình thức bán hàng | 2 đơn giao hàng | Manual | Doanh thu giao hàng được thống kê đúng | High | P |
| 204 | RPT_013 | Báo cáo số lượng đơn hàng | Số lượng đơn được thống kê đúng theo điều kiện lọc | 1. Chọn khoảng thời gian có sẵn số lượng đơn biết trước<br>2. Mở báo cáo số lượng đơn hàng | Khoảng thời gian có 10 đơn | Manual | Hệ thống hiển thị đúng tổng số lượng đơn theo điều kiện lọc | High | P |
| 205 | RPT_014 | Báo cáo đơn hoàn tất / đơn hủy | Thống kê đúng số đơn hoàn tất | 1. Chuẩn bị dữ liệu có đơn hoàn tất<br>2. Mở báo cáo trạng thái đơn | 7 đơn hoàn tất | Manual | Báo cáo hiển thị đúng số lượng đơn hoàn tất | High | P |
| 206 | RPT_015 | Báo cáo đơn hoàn tất / đơn hủy | Thống kê đúng số đơn bị hủy | 1. Chuẩn bị dữ liệu có đơn bị hủy<br>2. Mở báo cáo trạng thái đơn | 3 đơn hủy | Manual | Báo cáo hiển thị đúng số lượng đơn bị hủy | High | P |
| 207 | RPT_016 | Lọc và tìm kiếm báo cáo | Bộ lọc hoạt động đúng khi kết hợp nhiều điều kiện | 1. Vào màn hình báo cáo<br>2. Chọn thời gian + hình thức bán hàng + trạng thái đơn<br>3. Bấm lọc | Thời gian: 01/03–31/03/2026<br>Hình thức: Ăn tại bàn | Manual | Kết quả trả về đúng theo tổ hợp điều kiện lọc đã chọn | High | P |
| 208 | RPT_017 | Lọc và tìm kiếm báo cáo | Tìm kiếm báo cáo phản hồi trong thời gian chấp nhận được | 1. Mở báo cáo có lượng dữ liệu lớn<br>2. Áp dụng bộ lọc<br>3. Quan sát thời gian phản hồi | Dữ liệu 3 tháng | Manual | Hệ thống phản hồi trong thời gian chấp nhận được, không treo màn hình | Medium | P |
| 209 | RPT_018 | Xuất Excel | File Excel xuất ra đúng dữ liệu, đúng cột, mở được | 1. Mở báo cáo đã có dữ liệu<br>2. Bấm Xuất Excel<br>3. Mở file vừa xuất | Báo cáo doanh thu tháng 03/2026 | Manual | File Excel được tải xuống thành công, mở được, dữ liệu và cột đúng với báo cáo | High | P |
| 210 | RPT_019 | Xuất Excel | File Excel giữ đúng dữ liệu sau khi áp dụng bộ lọc | 1. Áp dụng bộ lọc báo cáo<br>2. Bấm Xuất Excel<br>3. Đối chiếu file với dữ liệu trên màn hình | Lọc theo ngày + hình thức bán hàng | Manual | File Excel chỉ chứa đúng dữ liệu đang được lọc trên màn hình | High | P |
| 211 | RPT_020 | Xuất PDF | File PDF xuất ra đúng bố cục, đủ dữ liệu, đọc được | 1. Mở báo cáo có dữ liệu<br>2. Bấm Xuất PDF<br>3. Mở file PDF | Báo cáo tổng doanh thu | Manual | File PDF được tạo thành công, đọc được, bố cục rõ ràng, không lỗi font | High | P |
| 212 | RPT_021 | Xuất PDF | File PDF phản ánh đúng dữ liệu sau khi lọc báo cáo | 1. Áp dụng bộ lọc cho báo cáo<br>2. Bấm Xuất PDF<br>3. Đối chiếu dữ liệu trong file | Lọc theo tuần hoặc tháng | Manual | File PDF chứa đúng dữ liệu theo bộ lọc đã chọn | Medium | P |
| 213 | RPT_022 | Giao diện báo cáo | Dashboard/bảng số liệu rõ ràng, dễ đọc, nhãn cột đúng | 1. Mở màn hình báo cáo<br>2. Quan sát bố cục dashboard, bảng số liệu, nhãn cột | Không yêu cầu data riêng | Manual | Giao diện báo cáo rõ ràng, dễ đọc, các nhãn cột/chỉ số đúng nội dung | Medium | P |
| 214 | RPT_023 | Giao diện báo cáo | Số liệu trên dashboard và bảng chi tiết nhất quán với nhau | 1. Mở báo cáo có dashboard và bảng chi tiết<br>2. Đối chiếu chỉ số tổng với dữ liệu chi tiết | Báo cáo có tổng doanh thu và danh sách chi tiết | Manual | Số liệu tổng hợp và chi tiết khớp nhau, không mâu thuẫn | High | P |

## 5. Sheet: Test-defect
Đây là danh sách các test case đang có kết quả `F` trong file nguồn.

| STT | Mã TC | Chức năng | Mô tả | Các bước thực hiện | Bộ data test | Phương thức | Kết quả mong muốn | Độ ưu tiên | Kết quả test |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 5 | TC_2.1_005 |  | Kiểm tra đăng nhập thất bại khi nhập sai mật khẩu | 1. Mở màn hình đăng nhập<br>2. Nhập username hợp lệ<br>3. Nhập password sai<br>4. Bấm Đăng nhập | Username: admin01<br>Password: Sai123 | Manual | Hệ thống không cho đăng nhập, hiển thị thông báo sai tài khoản hoặc mật khẩu | High | F |
| 6 | TC_2.1_006 |  | Kiểm tra đăng nhập thất bại khi nhập sai tên tài khoản | 1. Mở màn hình đăng nhập<br>2. Nhập username không tồn tại<br>3. Nhập password bất kỳ<br>4. Bấm Đăng nhập | Username: adminxx<br>Password: Admin@123 | Manual | Hệ thống không cho đăng nhập, hiển thị thông báo lỗi phù hợp | High | F |
| 7 | TC_2.1_007 |  | Kiểm tra validation khi để trống cả username và password | 1. Mở màn hình đăng nhập<br>2. Để trống cả 2 trường<br>3. Bấm Đăng nhập | Username: rỗng<br>Password: rỗng | Manual | Hệ thống bắt buộc nhập dữ liệu, hiển thị thông báo yêu cầu nhập username/password | Medium | F |
| 13 | TC_2.1_013 | Ghi nhận lịch sử đăng xuất | Kiểm tra hệ thống ghi nhận log khi đăng xuất | 1. Đăng nhập hợp lệ<br>2. Thực hiện đăng xuất<br>3. Vào nơi xem log/lịch sử đăng nhập-đăng xuất | Tài khoản bất kỳ hợp lệ | Manual | Có bản ghi lịch sử đăng xuất với tài khoản và thời gian đăng xuất | High | F |
| 14 | TC_2.1_014 | Phân quyền theo vai trò | Kiểm tra Admin được truy cập các chức năng quản trị đúng quyền | 1. Đăng nhập bằng tài khoản Admin<br>2. Kiểm tra menu/chức năng hiển thị | Username: admin01<br>Password: Admin@123 | Manual | Admin thấy đúng các chức năng quản trị theo thiết kế hệ thống | High | F |
| 15 | TC_2.1_015 | Phân quyền theo vai trò | Kiểm tra Quản lý chỉ truy cập các chức năng thuộc quyền Quản lý | 1. Đăng nhập bằng tài khoản Quản lý<br>2. Kiểm tra menu/chức năng hiển thị | Username: manager01<br>Password: Manager@123 | Manual | Quản lý chỉ thấy và dùng được các chức năng thuộc quyền Quản lý, không thấy chức năng vượt quyền | High | F |
| 16 | TC_2.1_016 | Phân quyền theo vai trò | Kiểm tra Nhân viên phục vụ chỉ truy cập các chức năng thuộc quyền phục vụ | 1. Đăng nhập bằng tài khoản Nhân viên phục vụ<br>2. Kiểm tra menu/chức năng hiển thị | Username: waiter01<br>Password: Waiter@123 | Manual | Nhân viên phục vụ chỉ thấy và thao tác được chức năng được cấp quyền | High | F |
| 17 | TC_2.1_017 | Phân quyền theo vai trò | Kiểm tra Thu ngân chỉ truy cập các chức năng thuộc quyền Thu ngân | 1. Đăng nhập bằng tài khoản Thu ngân<br>2. Kiểm tra menu/chức năng hiển thị | Username: cashier01<br>Password: Cashier@123 | Manual | Thu ngân chỉ thấy và thao tác được các chức năng thanh toán/hóa đơn theo quyền | High | F |
| 18 | TC_2.1_018 | Chặn truy cập ngoài quyền | Kiểm tra người dùng không được truy cập chức năng không thuộc quyền bằng menu | 1. Đăng nhập bằng tài khoản không phải Admin<br>2. Tìm chức năng ngoài quyền trên menu | Username: waiter01 hoặc cashier01 | Manual | Chức năng ngoài quyền không hiển thị hoặc bị khóa | High | F |
| 19 | TC_2.1_019 | Chặn truy cập ngoài quyền | Kiểm tra người dùng không được truy cập chức năng không thuộc quyền bằng URL trực tiếp | 1. Đăng nhập bằng tài khoản không có quyền<br>2. Nhập trực tiếp URL của màn hình ngoài quyền | Username: waiter01<br>Password: Waiter@123<br>URL: màn hình quản trị | Manual | Hệ thống chặn truy cập, thông báo không có quyền hoặc chuyển hướng về trang phù hợp | High | F |
| 20 | TC_2.1_020 | Ghi nhận lịch sử đăng nhập, đăng xuất | Kiểm tra log lưu đúng theo từng tài khoản khác nhau | 1. Lần lượt đăng nhập/đăng xuất bằng Admin, Quản lý, Nhân viên phục vụ, Thu ngân<br>2. Kiểm tra log | 4 tài khoản hợp lệ của 4 vai trò | Manual | Log ghi nhận đúng từng tài khoản, đúng thời gian, đúng hành động đăng nhập/đăng xuất | High | F |

## 6. Sheet: Report
Bảng dưới đây ghi lại **cả giá trị hiển thị** và **công thức gốc** của sheet báo cáo.

| Hạng mục | Số lượng (hiển thị) | Tỷ lệ (hiển thị) | Công thức số lượng | Công thức tỷ lệ |
| --- | --- | --- | --- | --- |
| Tổng số test case | 214 | 100% |  |  |
| Đã thực hiện | 214 | 100% | `=COUNTIF('Test-case'!J7:J231,"P")+COUNTIF('Test-case'!J7:J231,"F")` | `=C6/$C$5` |
| Pass | 203 | 95% | `=COUNTIF('Test-case'!J7:J231,"P")` | `=C7/$C$5` |
| Fail | 11 | 5% | `=COUNTIF('Test-case'!J7:J231,"F")` | `=C8/$C$5` |

**Biểu đồ trên sheet:** `Test case`

| Thuộc tính | Nội dung |
| --- | --- |
| Tiêu đề | Test case |
| Nhãn nguồn | Report!$B$7:$B$8 |
| Giá trị nguồn | Report!$C$7:$C$8 |
| Ý nghĩa | Biểu đồ tròn tổng hợp Pass/Fail từ dữ liệu báo cáo |
