# 01 — Product Brief

> Tài liệu này mô tả **vì sao** và **cho ai** chúng ta làm sản phẩm, và ranh giới của MVP. Khi có xung đột giữa các file, file này quyết định về phạm vi.

## 1. Tóm tắt

Một website giúp du khách **lên lịch trình du lịch Huế** nhanh và đúng gu: người dùng trả lời vài câu hỏi về chuyến đi và sở thích, hệ thống gợi ý lịch trình theo ngày, kèm lý do vì sao nên ghé từng nơi. Người dùng có thể chỉnh sửa, lưu, xem trên bản đồ và chia sẻ cho người đi cùng.

**Câu mô tả một dòng:** *"Nói cho chúng tôi bạn thích gì và đi mấy ngày, chúng tôi sắp lịch trình Huế cho bạn."*

## 2. Vấn đề cần giải quyết

Du khách đến Huế thường gặp các khó khăn sau:

1. **Thông tin phân tán:** di sản, quán ăn, cà phê nằm rải rác trên nhiều blog, mạng xã hội và bản đồ, khó tổng hợp.
2. **Khó sắp xếp hợp lý:** không biết nên đi điểm nào trước, điểm nào gần nhau, giờ mở cửa ra sao, mỗi nơi nên ở bao lâu.
3. **Lịch trình mẫu không hợp gu:** bài viết "Huế 3 ngày 2 đêm" áp dụng chung cho mọi người, không tính đến sở thích, ngân sách, nhịp độ hay người đi cùng.
4. **Tốn thời gian:** lên kế hoạch thủ công có thể mất hàng giờ.

## 3. Mục tiêu

### Mục tiêu sản phẩm
- Tạo được một lịch trình Huế **dùng được ngay** trong vài phút, chỉ cần trả lời một wizard ngắn.
- Lịch trình **hợp lý về thực tế:** giờ mở cửa, khoảng cách di chuyển, số điểm mỗi ngày phù hợp nhịp độ.
- Mỗi điểm trong lịch trình có **lý do gợi ý** gắn với sở thích người dùng.
- Cho phép **chỉnh sửa tự do** thay vì bắt người dùng chấp nhận nguyên bản.

### Mục tiêu kỹ thuật
- Chi phí vận hành thấp (Vercel + Supabase gói miễn phí/giá rẻ, gọi LLM có kiểm soát).
- Kiến trúc đủ gọn để AI agent có thể xây dựng và bảo trì theo tài liệu.
- Dữ liệu địa điểm **chính xác, có nguồn, có kiểm duyệt**.

### Chỉ số thành công (MVP)

| Chỉ số | Mục tiêu ban đầu |
|---|---|
| Tỷ lệ người bắt đầu wizard và tạo xong lịch trình | ≥ 60% |
| Thời gian từ vào trang đến có lịch trình | ≤ 3 phút |
| Thời gian sinh lịch trình (từ lúc bấm nút) | ≤ 15 giây (p90) |
| Tỷ lệ lịch trình được lưu hoặc chia sẻ | ≥ 25% (trong số người đã đăng nhập hoặc đăng ký) |
| Tỷ lệ lịch trình có lỗi dữ liệu (địa điểm sai/không tồn tại) | 0% |
| Tỷ lệ sinh lịch trình phải dùng phương án dự phòng | theo dõi, không có ngưỡng cứng |

> Các con số là mục tiêu tham khảo, chủ dự án điều chỉnh khi có dữ liệu thực tế.

## 4. Đối tượng người dùng

### Persona A — "Sắp đến Huế" (trọng tâm MVP)
- **Ai:** du khách nội địa hoặc quốc tế đang lên kế hoạch cho chuyến đi vài ngày.
- **Cần:** lịch trình rõ ràng theo ngày, biết đi đâu, ăn gì, đi thế nào.
- **Hành vi:** dùng máy tính hoặc điện thoại để lên kế hoạch trước chuyến đi; có thể chia sẻ cho bạn bè/gia đình.

### Persona B — "Đang ở Huế"
- **Ai:** du khách đã đến Huế, muốn điều chỉnh kế hoạch hoặc biết ngày mai đi đâu.
- **Cần:** mở lại lịch trình đã lưu trên điện thoại, xem bản đồ, điều chỉnh nhanh.
- **Ghi chú:** tính năng "gần tôi" và "hôm nay" thuộc giai đoạn 2. MVP chỉ phục vụ nhóm này qua việc xem lại và sửa lịch trình đã lưu.

### Persona C — Quản trị viên nội dung
- **Ai:** chủ dự án hoặc cộng tác viên nhập/sửa dữ liệu địa điểm.
- **Cần:** thêm, sửa, duyệt địa điểm, import CSV, mà không cần đụng vào cơ sở dữ liệu trực tiếp.

## 5. Giá trị cốt lõi và điểm khác biệt

1. **Cá nhân hóa theo gu:** lịch trình sinh từ sở thích, ngân sách, nhịp độ và người đi cùng.
2. **Có lý do:** mỗi điểm đều giải thích tại sao được chọn.
3. **Đáng tin:** chỉ dùng địa điểm trong cơ sở dữ liệu đã tuyển chọn; AI không tự bịa.
4. **Chỉnh sửa dễ:** đổi chỗ, xóa, thay thế, tạo lại một ngày mà không phải làm lại từ đầu.
5. **Không rào cản:** dùng thử không cần tài khoản.

## 6. Phạm vi MVP

### Trong phạm vi (làm)
- Landing page giới thiệu và lối vào tạo lịch trình.
- Khám phá địa điểm: danh sách, lọc, tìm kiếm, trang chi tiết.
- Bản đồ địa điểm.
- Wizard tạo chuyến đi.
- Sinh lịch trình bằng kết hợp thuật toán và AI, kèm lý do gợi ý.
- Xem và chỉnh sửa lịch trình (theo ngày, theo khung giờ).
- Đăng nhập/đăng ký; lưu chuyến đi; lưu địa điểm yêu thích.
- Chia sẻ lịch trình bằng đường link chỉ đọc.
- Trang quản trị địa điểm và import CSV.
- Trang tĩnh: giới thiệu, chính sách bảo mật.

### Ngoài phạm vi (không làm trong MVP)
| Hạng mục | Lý do / ghi chú |
|---|---|
| Trải nghiệm số 3D, bảo tàng, hiện vật | **Loại bỏ theo quyết định của chủ dự án** |
| Trang khẩn cấp & hỗ trợ | **Loại bỏ theo quyết định của chủ dự án** |
| Đặt vé, đặt phòng, thanh toán | Không nằm trong định hướng |
| Gần tôi (theo GPS) | Giai đoạn 2 |
| Hôm nay (lễ hội, thời tiết, gợi ý trong ngày) | Giai đoạn 2 |
| Đa ngôn ngữ (Anh, Pháp, Trung, Hàn) | Giai đoạn 2; DB thiết kế sẵn để mở rộng |
| Chat AI hỏi đáp du lịch | Giai đoạn 2 |
| Xuất PDF, bản đồ offline, app di động | Giai đoạn 2 trở đi |
| Đánh giá, bình luận của người dùng | Chưa có kế hoạch |
| Mạng xã hội, theo dõi người dùng khác | Chưa có kế hoạch |

> **Quy tắc:** agent không được tự thêm tính năng ngoài danh sách "trong phạm vi". Nếu thấy cần, hãy đề xuất và chờ chủ dự án đồng ý.

## 7. Nguyên tắc sản phẩm

1. **Chính xác hơn nhiều, không phải nhiều hơn:** 50 địa điểm đã kiểm chứng tốt hơn 1.000 địa điểm chưa rõ độ tin cậy.
2. **Luôn có kết quả:** dù AI lỗi vẫn có lịch trình dự phòng.
3. **Mobile trước:** phần lớn du khách dùng điện thoại; giao diện ưu tiên màn hình nhỏ.
4. **Minh bạch nguồn:** ghi rõ nguồn ảnh, nguồn bản đồ, và đánh dấu thông tin chưa được kiểm duyệt.
5. **Đơn giản trước, mở rộng sau:** thêm tính năng chỉ khi luồng chính đã chạy ổn.
6. **Tôn trọng người dùng:** thu thập ít dữ liệu cá nhân nhất có thể.

## 8. Dữ liệu và nội dung

- **Nguồn chính:** danh sách tuyển chọn (khoảng 40–60 địa điểm ban đầu) nhập tay qua Google Sheet/CSV rồi import.
- **Nguồn bổ trợ:** OpenStreetMap (tọa độ, địa chỉ), có ghi công theo giấy phép ODbL.
- **Mô tả và ảnh:** tự viết hoặc AI soạn nháp rồi người duyệt; ảnh tự chụp hoặc có giấy phép rõ ràng (Wikimedia Commons, Pexels), lưu kèm tên tác giả và giấy phép.
- **Không** lưu hàng loạt nội dung từ Google Maps/Places vào cơ sở dữ liệu.
- **Cờ `verified`:** dữ liệu AI điền (tag, thời gian tham quan, mức giá) chỉ được coi là đáng tin sau khi quản trị viên duyệt.

Chi tiết cấu trúc: `docs/05-data-model.md`.

## 9. Rủi ro và giả định

| Rủi ro / giả định | Cách xử lý |
|---|---|
| LLM trả lời sai, bịa địa điểm | Chỉ cho LLM chọn trong danh sách ứng viên có id; backend kiểm tra lại |
| LLM chậm, lỗi, hoặc tốn chi phí | Timeout, fallback rule-based, giới hạn tần suất, giới hạn kích thước input |
| Dữ liệu giờ mở cửa, giá thay đổi | Cột `last_verified_at`, hiển thị lưu ý "thông tin có thể thay đổi", admin cập nhật |
| Vi phạm giấy phép dữ liệu/ảnh | Chỉ dùng nguồn hợp lệ, lưu nguồn và giấy phép từng bản ghi |
| Ít dữ liệu làm lịch trình nghèo nàn | Ưu tiên chất lượng; mở rộng dần theo khu vực; hiển thị thông báo khi không đủ ứng viên |
| Lạm dụng endpoint gọi LLM | Rate limit theo user/IP/session |
| Giả định: du khách chủ yếu đi 1–4 ngày | Giới hạn wizard tối đa 5 ngày trong MVP |
| Giả định: phương tiện di chuyển chủ yếu xe máy/taxi/đi bộ trong nội thành | Tính khoảng cách đường chim bay kèm hệ số hiệu chỉnh ở MVP |

## 10. Thuật ngữ

| Thuật ngữ | Ý nghĩa |
|---|---|
| **Place / Địa điểm** | Một điểm có thể ghé: di sản, quán ăn, cà phê, điểm dạo, quà... |
| **Trip / Chuyến đi** | Một lịch trình gồm nhiều ngày do người dùng tạo |
| **Trip day** | Một ngày trong chuyến đi |
| **Trip item** | Một địa điểm được xếp vào một khung giờ của một ngày |
| **Khung giờ (slot)** | Sáng, trưa, chiều, tối |
| **Tag / Sở thích** | Nhãn mô tả địa điểm và gu người dùng (di sản, ẩm thực, cà phê, sông nước...) |
| **Nhịp độ** | Thong thả / vừa phải / dày; quyết định số điểm mỗi ngày |
| **Verified** | Địa điểm/trường dữ liệu đã được quản trị viên kiểm duyệt |
| **Fallback** | Thuật toán rule-based dùng khi LLM không khả dụng |
| **Share token** | Chuỗi ngẫu nhiên dùng làm link chia sẻ chỉ đọc |

## 11. Câu hỏi còn mở (chủ dự án cần quyết)

- [ ] Tên chính thức của sản phẩm.
- [ ] Danh sách chính xác các loại địa điểm trong MVP (di sản, ẩm thực, cà phê, dạo/ngắm cảnh, mua sắm/quà, lưu trú?). Lưu trú có đưa vào lịch trình không hay chỉ dùng làm điểm xuất phát?
- [ ] Có cần phân biệt điểm ăn sáng, ăn trưa, ăn tối trong dữ liệu không.
- [ ] Giọng văn thương hiệu (thân thiện, trang trọng, hay trẻ trung).
- [ ] Có thu thập email để gửi lịch trình không (ảnh hưởng chính sách bảo mật).
