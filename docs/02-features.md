# 02 — Features

> Danh sách chức năng của MVP, kèm quy tắc nghiệp vụ và **tiêu chí nghiệm thu (AC)**. Agent chỉ coi một tính năng là xong khi mọi AC đều đạt.
> Phạm vi tổng thể xem `docs/01-product-brief.md`.

## Quy ước

- **Mã:** `F-xx`. Dùng mã này khi đặt tên nhánh, commit, PR (ví dụ `feat(F-05): wizard bước 1`).
- **Ưu tiên:** `P0` = bắt buộc cho MVP; `P1` = nên có trong MVP nếu kịp; `P2` = giai đoạn 2.
- **Vai trò:** `Khách` (chưa đăng nhập), `User` (đã đăng nhập), `Admin`.
- Trạng thái giao diện nào cũng phải xử lý đủ: **loading, rỗng, lỗi, thành công**.

## Tổng quan

| Mã | Tính năng | Ưu tiên | Vai trò |
|---|---|---|---|
| F-01 | Landing page | P0 | Khách, User |
| F-02 | Khám phá địa điểm | P0 | Khách, User |
| F-03 | Chi tiết địa điểm | P0 | Khách, User |
| F-04 | Bản đồ | P0 | Khách, User |
| F-05 | Wizard tạo chuyến đi | P0 | Khách, User |
| F-06 | Sinh lịch trình | P0 | Khách, User |
| F-07 | Xem và chỉnh sửa lịch trình | P0 | Khách (tạm), User |
| F-08 | Đăng ký, đăng nhập | P0 | Khách |
| F-09 | Chuyến đi của tôi | P0 | User |
| F-10 | Địa điểm đã lưu | P1 | User |
| F-11 | Chia sẻ lịch trình | P1 | User (tạo), mọi người (xem) |
| F-12 | Quản trị địa điểm và import CSV | P0 | Admin |
| F-13 | Trang tĩnh | P1 | Mọi người |
| F-14 | Yêu cầu phi chức năng | P0 | — |
| F-20+ | Giai đoạn 2 | P2 | — |

---

## F-01 — Landing page (P0)

**Mục đích:** giới thiệu sản phẩm và đưa người dùng vào luồng tạo lịch trình trong một cú nhấp.

**Nội dung**
- Hero: tiêu đề, mô tả ngắn, nút chính **"Tạo lịch trình"** (đến `/plan/new`), nút phụ **"Khám phá Huế"** (đến `/explore`).
- Khối "Cách hoạt động" gồm 3 bước: chọn sở thích, nhận lịch trình, chỉnh sửa và chia sẻ.
- Khối địa điểm nổi bật (lấy 6–8 địa điểm `featured = true`).
- Khối lịch trình mẫu (tĩnh) minh họa kết quả.
- Khối câu hỏi thường gặp (miễn phí không, có cần tài khoản không...).
- Chân trang: giới thiệu, chính sách bảo mật, ghi công ảnh/bản đồ.

**Quy tắc**
- Không yêu cầu đăng nhập.
- Nếu người dùng có chuyến đi đang dở (lưu tạm) thì hiển thị thẻ "Tiếp tục chuyến đi của bạn".

**AC**
- [ ] Nút "Tạo lịch trình" dẫn đến `/plan/new` ở mọi kích thước màn hình.
- [ ] Khối địa điểm nổi bật lấy dữ liệu thật từ DB; nếu rỗng thì ẩn khối đó, không báo lỗi.
- [ ] Hiển thị tốt từ chiều rộng 360px; điểm Lighthouse Performance ≥ 80 trên mobile.
- [ ] Có thẻ meta SEO và ảnh chia sẻ (Open Graph).

---

## F-02 — Khám phá địa điểm (P0)

**Mục đích:** cho phép duyệt danh sách địa điểm trong cơ sở dữ liệu.

**Chức năng**
- Danh sách dạng lưới thẻ: ảnh, tên, loại, tag chính, khu vực (nếu có).
- Lọc theo **loại** (di sản, ẩm thực, cà phê, dạo/ngắm cảnh, mua sắm/quà) và **tag**.
- Tìm kiếm theo tên (không phân biệt hoa thường, có thể bỏ dấu tiếng Việt).
- Sắp xếp: nổi bật (mặc định), tên A–Z.
- Phân trang hoặc cuộn vô hạn (chọn một, ghi rõ trong PR).
- Nút lưu (trái tim) trên mỗi thẻ: yêu cầu đăng nhập (xem F-10).

**Quy tắc**
- Chỉ hiển thị địa điểm có `status = published`.
- Bộ lọc và từ khóa **phản ánh trên URL** (query string) để chia sẻ và quay lại được.

**AC**
- [ ] Chọn bộ lọc cập nhật danh sách mà không tải lại toàn trang.
- [ ] Tìm "lang tu duc" vẫn ra "Lăng Tự Đức".
- [ ] URL có dạng `/explore?category=heritage&tag=river&q=...`; mở lại URL cho cùng kết quả.
- [ ] Trạng thái rỗng có thông báo và nút "Xóa bộ lọc".
- [ ] Khách bấm trái tim sẽ được mời đăng nhập, sau khi đăng nhập quay lại đúng trang.

---

## F-03 — Chi tiết địa điểm (P0)

**Route:** `/place/:slug`

**Nội dung**
- Ảnh (kèm ghi công tác giả/giấy phép), tên, loại, tag.
- Mô tả, địa chỉ, giờ mở cửa, ngày nghỉ, giá/giá vé, thời gian tham quan gợi ý, khung giờ nên đi.
- Bản đồ nhỏ và nút "Chỉ đường" (mở ứng dụng bản đồ của thiết bị bằng link tọa độ).
- Nút "Lưu" (F-10) và nút "Thêm vào chuyến đi" (nếu người dùng đang có chuyến đi, xem F-07).
- Gợi ý vài địa điểm gần đó (cùng khu vực/khoảng cách gần).
- Dòng lưu ý "Thông tin có thể thay đổi, vui lòng kiểm tra lại trước khi đến" kèm ngày cập nhật gần nhất.

**Quy tắc**
- Slug không tồn tại hoặc chưa published trả về trang 404 thân thiện.
- Trường chưa có dữ liệu thì **ẩn**, không hiển thị "null" hay khoảng trống.
- Địa điểm chưa `verified` hiển thị nhãn "Đang chờ kiểm duyệt" cho các trường do AI điền (nếu có).

**AC**
- [ ] Trang tải được bằng URL trực tiếp và có SEO (title, description riêng cho từng địa điểm).
- [ ] Ảnh luôn hiển thị ghi công nếu có `image_credit`.
- [ ] Nút "Chỉ đường" mở đúng tọa độ trên thiết bị di động.
- [ ] 404 đúng cho slug sai.

---

## F-04 — Bản đồ (P0)

**Route:** `/map`

**Chức năng**
- Hiển thị tất cả địa điểm published dưới dạng marker, màu/biểu tượng theo loại.
- Bấm marker mở thẻ xem nhanh (ảnh nhỏ, tên, loại) có liên kết đến trang chi tiết.
- Lọc theo loại, tương tự F-02.
- Gom nhóm marker (cluster) khi zoom xa.
- Hiển thị ghi công `© OpenStreetMap contributors`.

**Quy tắc**
- Khi dùng từ trang lịch trình (F-07), bản đồ hiển thị các điểm của ngày đang chọn, đánh số theo thứ tự và nối bằng đường thẳng (đường chim bay ở MVP).
- Mặc định căn giữa khu vực thành phố Huế.

**AC**
- [ ] Hiển thị mượt với ít nhất 200 marker.
- [ ] Ghi công OSM luôn hiển thị, không bị che.
- [ ] Trên mobile, thẻ xem nhanh không che toàn bộ bản đồ.
- [ ] Bản đồ trong lịch trình đánh số đúng thứ tự các điểm trong ngày.

---

## F-05 — Wizard tạo chuyến đi (P0)

**Route:** `/plan/new`

**Mục đích:** thu thập thông tin để sinh lịch trình, ngắn gọn, chia thành từng bước nhỏ.

**Các bước và trường dữ liệu**

| Bước | Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|---|
| 1. Thời gian | Số ngày | 1–5 | Có | Mặc định 2 |
| | Ngày bắt đầu | Ngày | Không | Dùng để xét ngày nghỉ của địa điểm |
| 2. Người đi | Đi cùng ai | Một mình / Cặp đôi / Gia đình có trẻ nhỏ / Nhóm bạn / Người lớn tuổi | Có | Ảnh hưởng gợi ý và tốc độ |
| | Số người | Số nguyên ≥ 1 | Không | |
| 3. Sở thích | Tag sở thích | Chọn nhiều (tối thiểu 2, tối đa 6) | Có | Dạng thẻ có ảnh, có thể vuốt/chọn |
| 4. Phong cách | Nhịp độ | Thong thả / Vừa phải / Dày | Có | Mặc định "Vừa phải" |
| | Ngân sách | Tiết kiệm / Vừa / Thoải mái | Không | |
| | Phương tiện | Xe máy / Taxi-Grab / Đi bộ-xe đạp / Xe tour | Không | Ảnh hưởng thời gian di chuyển |
| 5. Xuất phát | Nơi lưu trú hoặc điểm xuất phát | Chọn từ danh sách mốc hoặc ghim bản đồ | Không | Mặc định trung tâm thành phố |
| | Ghi chú thêm | Văn bản ≤ 300 ký tự | Không | Ví dụ "mẹ đi lại khó khăn" |
| 6. Xác nhận | Tóm tắt toàn bộ lựa chọn | | | Nút "Tạo lịch trình" |

**Quy tắc**
- Có thể quay lại bước trước mà không mất dữ liệu.
- Tiến trình wizard được **lưu tạm** (localStorage/sessionStorage) để tải lại trang không mất.
- Khách chưa đăng nhập **vẫn dùng được toàn bộ wizard** và tạo lịch trình.
- Dữ liệu gửi lên server phải qua kiểm tra (Zod) cả ở client và server.
- Ghi chú thêm là văn bản tự do: coi là **dữ liệu không đáng tin**, không được đưa vào prompt như chỉ thị hệ thống (xem `docs/07-ai-itinerary-spec.md`).

**AC**
- [ ] Không thể sang bước sau khi chưa đủ trường bắt buộc; hiển thị lỗi cụ thể bằng tiếng Việt.
- [ ] Tải lại trang giữa chừng vẫn giữ nguyên các lựa chọn đã nhập.
- [ ] Chọn ít hơn 2 hoặc nhiều hơn 6 sở thích bị chặn kèm thông báo.
- [ ] Hoàn thành wizard trên mobile mà không phải cuộn ngang.
- [ ] Bấm "Tạo lịch trình" chuyển sang F-06.

---

## F-06 — Sinh lịch trình (P0)

**Route:** `/plan/generating` (màn hình chờ) rồi chuyển sang `/trip/:id` (user) hoặc `/trip/draft` (khách).

**Mục đích:** biến dữ liệu wizard thành lịch trình theo ngày, gồm các địa điểm có thật trong DB.

**Luồng cấp cao** (chi tiết trong `docs/07-ai-itinerary-spec.md`)
1. Backend lọc và chấm điểm ứng viên từ `places` theo sở thích, ngân sách, giờ mở cửa, ngày nghỉ, độ phù hợp với nhóm đi cùng.
2. Gửi danh sách ứng viên (có id) cho LLM, yêu cầu JSON theo schema cố định.
3. Backend kiểm tra kết quả: id hợp lệ, không trùng, đủ số điểm, thời gian hợp lý.
4. Nếu LLM lỗi/không hợp lệ: chạy thuật toán rule-based dự phòng.
5. Trả về **lịch trình nháp** (chưa ghi DB). Nếu đã đăng nhập, client lưu ngay thành `trips`, `trip_days`, `trip_items` qua `POST /api/trips` rồi mở `/trip/:id`. Nếu là khách, lịch trình được lưu tạm trên trình duyệt (`trip_draft_v1`) và mở `/trip/draft`.

**Quy tắc nghiệp vụ**

| Quy tắc | Giá trị |
|---|---|
| Khung giờ | Sáng 08:00–11:30, Trưa 11:30–13:30 (ưu tiên ăn), Chiều 13:30–17:30, Tối 17:30–21:00 |
| Số điểm mỗi ngày | Thong thả 3–4, Vừa phải 4–5, Dày 6–7 (đã gồm bữa ăn) |
| Mỗi ngày | Tối thiểu 1 điểm ăn uống cho bữa trưa |
| Không lặp địa điểm | Một địa điểm không xuất hiện hai lần trong cùng chuyến đi |
| Giờ mở cửa | Không xếp địa điểm vào lúc đóng cửa hoặc ngày nghỉ (nếu đã biết ngày) |
| Gom cụm | Ưu tiên các điểm gần nhau trong cùng ngày |
| Nhóm có trẻ nhỏ/người lớn tuổi | Giảm số điểm, hạn chế điểm cần đi bộ nhiều |
| Lý do gợi ý | Mỗi điểm có 1–2 câu liên hệ với sở thích người dùng |
| Dữ liệu | Ưu tiên địa điểm `verified = true` |

**Trường hợp đặc biệt**
- Không đủ ứng viên: vẫn tạo lịch trình với số điểm ít hơn và hiển thị thông báo rõ ràng.
- LLM timeout: dùng fallback, gắn cờ `generated_by = 'fallback'` (không cần báo lỗi cho người dùng, nhưng có thể hiển thị lưu ý nhẹ).
- Chạm giới hạn tần suất: hiển thị thông báo thân thiện và thời gian thử lại.

**AC**
- [ ] 100% địa điểm trong lịch trình tồn tại trong bảng `places` (có test tự động với phản hồi LLM giả có id sai).
- [ ] Không có địa điểm trùng trong cùng chuyến đi.
- [ ] Khi tắt LLM (giả lập lỗi), vẫn nhận được lịch trình hợp lệ từ fallback.
- [ ] Số điểm mỗi ngày nằm trong khoảng của nhịp độ đã chọn.
- [ ] Không có điểm nào xếp ngoài giờ mở cửa đã biết.
- [ ] Màn hình chờ hiển thị trạng thái tiến trình và cho phép hủy.
- [ ] Thời gian sinh p90 ≤ 15 giây trong điều kiện bình thường.
- [ ] Vượt giới hạn tần suất trả về mã lỗi phù hợp và giao diện hiển thị thông báo, không treo.

---

## F-07 — Xem và chỉnh sửa lịch trình (P0)

**Route:** `/trip/:id`

**Hiển thị**
- Tiêu đề chuyến đi (có thể sửa), số ngày, ngày bắt đầu.
- Tab hoặc thanh chọn ngày; mỗi ngày là danh sách theo khung giờ.
- Mỗi mục: ảnh nhỏ, tên, loại, giờ dự kiến, thời lượng, thời gian di chuyển từ điểm trước, lý do gợi ý, ghi chú riêng.
- Bản đồ của ngày đang chọn (xem F-04), đánh số theo thứ tự.

**Thao tác chỉnh sửa**
- Kéo thả đổi thứ tự trong ngày và chuyển sang ngày khác (trên mobile có nút lên/xuống).
- Xóa một điểm.
- **Thay thế** một điểm: hệ thống gợi ý 3–5 phương án tương tự (cùng loại/tag, gần vị trí).
- **Thêm** địa điểm từ danh sách/tìm kiếm vào một ngày.
- **Tạo lại một ngày** (giữ nguyên các ngày khác, có thể khóa những điểm muốn giữ).
- Sửa giờ dự kiến, ghi chú cho từng điểm.
- Hoàn tác thao tác gần nhất (ít nhất 1 bước).

**Quy tắc**
- Khi chỉnh sửa, hệ thống **cảnh báo** (không chặn) nếu: điểm vào lúc đóng cửa, trùng giờ, di chuyển quá xa, quá nhiều điểm trong một ngày.
- Tính lại thời gian di chuyển mỗi khi thứ tự thay đổi.
- Khách chưa đăng nhập: chuyến đi lưu tạm trên trình duyệt; hiển thị lời mời đăng nhập để lưu lâu dài.
- User: thay đổi được lưu lên server (tự động lưu, có chỉ báo "Đang lưu / Đã lưu").
- Chỉ chủ sở hữu mới sửa được. Người khác truy cập `/trip/:id` sẽ không có quyền (xem F-11 cho bản chỉ đọc).

**AC**
- [ ] Mọi thao tác chỉnh sửa cập nhật lại danh sách và bản đồ ngay lập tức.
- [ ] Thay đổi của User được lưu; tải lại trang vẫn giữ nguyên.
- [ ] Cảnh báo giờ mở cửa hiển thị đúng khi chuyển điểm vào khung đã đóng cửa.
- [ ] Tạo lại một ngày không làm thay đổi các ngày khác và không tạo trùng địa điểm với ngày khác.
- [ ] Người không phải chủ sở hữu bị chặn ở cả giao diện lẫn API (RLS).
- [ ] Có thể dùng thuận tiện trên mobile (không phụ thuộc hoàn toàn vào kéo thả).

---

## F-08 — Đăng ký, đăng nhập (P0)

**Routes:** `/login`, `/register`, `/auth/callback`

**Chức năng**
- Đăng ký/đăng nhập bằng email + mật khẩu và/hoặc **Google** (qua Supabase Auth).
- Đăng xuất.
- Quên mật khẩu (nếu dùng email + mật khẩu).
- Sau khi đăng nhập, quay lại trang trước đó (tham số `next`).
- **Đồng bộ chuyến đi tạm:** khi khách đăng nhập, chuyến đi lưu tạm trên trình duyệt được chuyển lên tài khoản.

**Quy tắc**
- Hồ sơ `profiles` được tạo tự động khi có user mới.
- Vai trò mặc định `user`; `admin` chỉ gán thủ công trong DB.
- Các route cần đăng nhập chuyển hướng đến `/login?next=...` khi chưa đăng nhập.

**AC**
- [ ] Đăng nhập xong quay lại đúng trang đang xem.
- [ ] Chuyến đi tạm không bị mất và không bị trùng sau khi đăng nhập.
- [ ] Lỗi đăng nhập hiển thị tiếng Việt, không lộ thông tin kỹ thuật.
- [ ] User thường không truy cập được `/admin/*` (chặn cả giao diện và server).

---

## F-09 — Chuyến đi của tôi (P0)

**Route:** `/account/trips`

**Chức năng**
- Danh sách chuyến đi của user: tiêu đề, số ngày, ngày bắt đầu, ảnh bìa (từ điểm đầu tiên), cập nhật lần cuối.
- Mở, đổi tên, nhân bản, xóa chuyến đi (xóa có xác nhận).
- Nút "Tạo chuyến đi mới".

**AC**
- [ ] Chỉ thấy chuyến đi của chính mình.
- [ ] Xóa có hộp thoại xác nhận và không thể phục hồi (hoặc ghi rõ nếu dùng xóa mềm).
- [ ] Nhân bản tạo bản sao độc lập, không dùng chung `share_token`.
- [ ] Trạng thái rỗng có hướng dẫn tạo chuyến đi đầu tiên.

---

## F-10 — Địa điểm đã lưu (P1)

**Route:** `/account/saved`

**Chức năng**
- Bấm trái tim ở F-02, F-03, F-04 để lưu/bỏ lưu địa điểm.
- Danh sách địa điểm đã lưu, lọc theo loại.
- Từ danh sách có thể thêm địa điểm vào một chuyến đi.

**Quy tắc**
- Yêu cầu đăng nhập; khách bấm sẽ được mời đăng nhập.
- Địa điểm bị gỡ/ẩn khỏi hệ thống không hiển thị trong danh sách nhưng không gây lỗi.

**AC**
- [ ] Trạng thái trái tim đồng nhất giữa các trang.
- [ ] Cập nhật lạc quan (optimistic) và hoàn lại nếu lỗi.
- [ ] Chỉ chủ tài khoản đọc/ghi được dữ liệu lưu (RLS).

---

## F-11 — Chia sẻ lịch trình (P1)

**Routes:** `/s/:shareToken` (xem), nút "Chia sẻ" trong `/trip/:id`.

**Chức năng**
- Chủ chuyến đi bật/tắt chia sẻ; khi bật, hệ thống tạo `share_token` ngẫu nhiên.
- Nút sao chép link; trên mobile có thể mở hộp chia sẻ của thiết bị.
- Trang chia sẻ **chỉ đọc**: hiển thị lịch trình theo ngày và bản đồ.
- Nút "Tạo bản sao của tôi" (yêu cầu đăng nhập) để người xem sao chép thành chuyến đi riêng.

**Quy tắc**
- Tắt chia sẻ làm link cũ **vô hiệu**; bật lại tạo token mới.
- Không hiển thị thông tin cá nhân của chủ chuyến đi (email, tên) trên trang chia sẻ, trừ khi có tùy chọn rõ ràng sau này.
- Trang chia sẻ có thẻ Open Graph (tiêu đề, ảnh bìa) để đẹp khi gửi qua chat.

**AC**
- [ ] Người không đăng nhập mở được link chia sẻ đang bật.
- [ ] Link bị tắt trả về trang "Lịch trình không còn được chia sẻ".
- [ ] Người xem không sửa được lịch trình (chặn cả ở API).
- [ ] Sao chép tạo chuyến đi mới độc lập cho người xem.

---

## F-12 — Quản trị địa điểm và import CSV (P0)

**Routes:** `/admin/places`, `/admin/places/new`, `/admin/places/:id`, `/admin/import`

**Chức năng**
- Danh sách địa điểm: lọc theo trạng thái (`draft`, `published`), `verified`, loại; tìm kiếm.
- Tạo/sửa/xóa địa điểm với đủ trường (xem `docs/05-data-model.md`).
- Tải ảnh lên Supabase Storage; bắt buộc nhập `image_credit` và `image_license`.
- Gán tag; đánh dấu `featured`.
- Nút **Duyệt** (`verified = true`) và ghi lại người duyệt, thời điểm.
- **Import CSV:** tải file, xem trước, kiểm tra lỗi từng dòng, xác nhận rồi mới ghi vào DB.
- Hiển thị cảnh báo cho dòng thiếu dữ liệu quan trọng (`lat`, `lng`, `visit_duration_min`, giờ mở cửa).

**Quy tắc**
- Chỉ `admin` truy cập; kiểm tra ở server.
- Import theo cơ chế **upsert theo `slug`**, không tạo bản ghi trùng.
- Dữ liệu import mặc định `status = draft`, `verified = false`.
- Ghi nhật ký thay đổi cơ bản (ai sửa, khi nào).

**AC**
- [ ] Admin tạo địa điểm mới và nó xuất hiện ở `/explore` sau khi chuyển sang `published`.
- [ ] Import file CSV mẫu (≥ 50 dòng) hoạt động; dòng lỗi được liệt kê rõ lý do, dòng hợp lệ vẫn import được sau khi xác nhận.
- [ ] Import lại cùng file không tạo bản ghi trùng.
- [ ] Không thể lưu ảnh nếu thiếu thông tin ghi công/giấy phép.
- [ ] User thường gọi API admin nhận lỗi 403.

---

## F-13 — Trang tĩnh (P1)

**Routes:** `/about`, `/privacy`

- **Giới thiệu:** mục tiêu dự án, nguồn dữ liệu, cách hoạt động của gợi ý lịch trình, thông tin liên hệ.
- **Chính sách bảo mật:** dữ liệu thu thập (email, chuyến đi, địa điểm đã lưu), mục đích, thời gian lưu, quyền xóa tài khoản và dữ liệu, bên thứ ba (Supabase, Vercel, nhà cung cấp LLM, OpenStreetMap).
- Ghi công ảnh và bản đồ.

**AC**
- [ ] Hai trang truy cập được từ chân trang.
- [ ] Chính sách bảo mật nêu rõ việc dữ liệu chuyến đi có thể được gửi đến nhà cung cấp LLM để sinh lịch trình.

---

## F-14 — Yêu cầu phi chức năng (P0)

| Hạng mục | Yêu cầu |
|---|---|
| Hiệu năng | LCP ≤ 2.5s trên mobile 4G ở các trang chính; ảnh dùng WebP/AVIF, lazy-load, có kích thước phù hợp |
| Responsive | Thiết kế desktop-first (chuẩn 1440×900, nội dung tối đa 1200px), thu gọn đẹp xuống tablet và mobile từ 360px; `/s/:token` và trình chỉnh lịch trình phải dùng tốt trên mobile |
| Truy cập (a11y) | Điều hướng bàn phím, nhãn cho form và nút biểu tượng, độ tương phản đạt WCAG AA |
| SEO | Title/description riêng; Open Graph; sitemap cho `/place/:slug`; trang người dùng/lịch trình riêng tư gắn `noindex` |
| Bảo mật | RLS mọi bảng; xác thực JWT ở backend; không lộ secret; giới hạn tần suất endpoint LLM |
| Độ tin cậy | Có fallback khi LLM lỗi; xử lý lỗi mạng với thông báo thân thiện; có error boundary |
| Quyền riêng tư | Thu thập tối thiểu; cho phép người dùng xóa chuyến đi và tài khoản |
| Quan sát | Ghi log lỗi server (không chứa dữ liệu cá nhân); ghi nhận số lần dùng fallback và thời gian sinh lịch trình |
| Trình duyệt | Hai phiên bản mới nhất của Chrome, Safari, Edge, Firefox; Safari iOS và Chrome Android |
| Ngôn ngữ | Tiếng Việt; chuỗi giao diện tách riêng để dễ dịch sau |

---

## Giai đoạn 2 (P2) — chưa làm, chỉ ghi nhận

| Mã | Tính năng | Ghi chú |
|---|---|---|
| F-20 | Huế bên tôi (gần vị trí) | Dùng GPS hoặc mốc chọn sẵn, bán kính 100m–5km, lọc theo loại |
| F-21 | Hôm nay | Sự kiện, lễ hội, thời tiết, gợi ý theo ngày |
| F-22 | Đa ngôn ngữ | Anh, Pháp, Trung, Hàn; bảng `*_translations` |
| F-23 | Chat AI hỏi đáp du lịch | Giới hạn trong dữ liệu của hệ thống |
| F-24 | Xuất PDF / thêm vào lịch | |
| F-25 | Bản đồ offline | |
| F-26 | Cẩm nang Huế | Bài viết tĩnh: ăn uống, giao thông, văn hóa |

> **Không có trong kế hoạch:** trải nghiệm 3D, bảo tàng số, trang khẩn cấp.

---

## Ma trận quyền truy cập (tóm tắt)

| Hành động | Khách | User | Admin |
|---|:-:|:-:|:-:|
| Xem địa điểm, bản đồ | ✅ | ✅ | ✅ |
| Tạo lịch trình (wizard + sinh) | ✅ (giới hạn tần suất chặt hơn) | ✅ | ✅ |
| Chỉnh sửa chuyến đi tạm trên trình duyệt | ✅ | — | — |
| Lưu chuyến đi lên tài khoản | ❌ | ✅ | ✅ |
| Lưu địa điểm yêu thích | ❌ | ✅ | ✅ |
| Chia sẻ chuyến đi | ❌ | ✅ | ✅ |
| Xem link chia sẻ | ✅ | ✅ | ✅ |
| Quản trị địa điểm, import CSV | ❌ | ❌ | ✅ |

## Câu hỏi còn mở

- [ ] Khách có được gọi LLM hay chỉ chạy thuật toán rule-based? (ảnh hưởng chi phí và giới hạn tần suất)
- [ ] Đăng nhập Google có bắt buộc cho MVP hay chỉ email + mật khẩu?
- [ ] Phân trang hay cuộn vô hạn ở `/explore`?
- [ ] Có cho phép người dùng **thêm địa điểm tùy ý** (không có trong DB) vào lịch trình không? (mặc định MVP: không)
