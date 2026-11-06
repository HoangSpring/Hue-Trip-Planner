# Đánh giá Gemini so với dự phòng

- Ngày chạy: 2026-10-29T04:51:19.548Z
- Model: gemini-3.5-flash-lite
- Prompt: hue-itinerary-v2-compact
- 10 kịch bản mẫu + 2 ghi chú đối kháng; địa điểm chỉ đọc qua Supabase anon client.
- Không đổi LLM_ENABLED trong môi trường; bật LLM riêng bằng tham số pipeline. Không ghi generation_events lên Supabase.
- Tối đa một lần gọi mỗi kịch bản, không sửa/retry; trần cứng 12 lần. Published đọc được: 60.

### V1 — Cặp đôi · 2 ngày · thích ẩm thực

Pool ứng viên: 30 / 57; thời gian: 3612 ms; generated_by=fallback; model=—.
Calls=1; token input/output/thinking=4292/721/0; repairs=0; coverage=0.5; fallbackReason=low_coverage.

#### Dự phòng

##### Ngày 1 · 2026-11-01

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:11 | Nook Eatery | — | Bạn có thể dành thời gian thư giãn ở Nook Eatery. |
| Trưa | 11:30 | Bánh Khoái Lạc Thiện | ~7 phút | Bạn có thể dùng bữa tại Bánh Khoái Lạc Thiện. |
| Chiều | 13:00 | Cà phê Tân | ~5 phút | Cà phê Tân là một điểm dừng cà phê trong lịch trình. |
| Tối | 17:30 | Chợ An Cựu | ~8 phút | Bạn có thể ghé Chợ An Cựu trong lúc tìm mua quà. Bạn cũng quan tâm ẩm thực. |

##### Ngày 2 · 2026-11-02

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:09 | Chợ Đông Ba | — | Chợ Đông Ba là một điểm dừng mua sắm trong lịch trình. |
| Trưa | 11:30 | Cơm Hến Hoa Đông | ~6 phút | Bạn có thể dành một bữa ăn tại Cơm Hến Hoa Đông. |
| Chiều | 13:00 | Mè Xửng Thiên Hương | ~9 phút | Bạn có thể dành thời gian mua sắm tại Mè Xửng Thiên Hương. |
| Chiều | 13:38 | Đại Nội Huế | ~8 phút | Đại Nội Huế là một điểm dừng thuộc nhóm di sản trong lịch trình. |
| Chiều | 16:24 | Chùa Thiên Mụ | ~16 phút | Bạn có thể ghé Chùa Thiên Mụ như một điểm tham quan di sản. |

Cảnh báo:
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.

#### LLM / kết quả pipeline

##### Ngày 1 · 2026-11-01

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:11 | Nook Eatery | — | Bạn có thể dành thời gian thư giãn ở Nook Eatery. |
| Trưa | 11:30 | Bánh Khoái Lạc Thiện | ~7 phút | Bạn có thể dùng bữa tại Bánh Khoái Lạc Thiện. |
| Chiều | 13:00 | Cà phê Tân | ~5 phút | Cà phê Tân là một điểm dừng cà phê trong lịch trình. |
| Tối | 17:30 | Chợ An Cựu | ~8 phút | Bạn có thể ghé Chợ An Cựu trong lúc tìm mua quà. Bạn cũng quan tâm ẩm thực. |

##### Ngày 2 · 2026-11-02

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:09 | Chợ Đông Ba | — | Chợ Đông Ba là một điểm dừng mua sắm trong lịch trình. |
| Trưa | 11:30 | Cơm Hến Hoa Đông | ~6 phút | Bạn có thể dành một bữa ăn tại Cơm Hến Hoa Đông. |
| Chiều | 13:00 | Mè Xửng Thiên Hương | ~9 phút | Bạn có thể dành thời gian mua sắm tại Mè Xửng Thiên Hương. |
| Chiều | 13:38 | Đại Nội Huế | ~8 phút | Đại Nội Huế là một điểm dừng thuộc nhóm di sản trong lịch trình. |
| Chiều | 16:24 | Chùa Thiên Mụ | ~16 phút | Bạn có thể ghé Chùa Thiên Mụ như một điểm tham quan di sản. |

Cảnh báo:
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.

Khác biệt địa điểm: chỉ dự phòng — không có; chỉ pipeline/LLM — không có.
So sánh: bữa trưa theo khung noon 2 mục dự phòng / 2 mục pipeline; tổng di chuyển ước tính 59 / 59 phút; lý do khác văn bản ở 0 mục trùng địa điểm. Mức tự nhiên/chất lượng cần chủ dự án chấm.
Kiểm tra độc lập: ID thuộc dữ liệu published đã tải, không trùng, có giờ và bữa trưa theo mã kiểm tra báo cáo; validator pipeline V1–V10 giới hạn ID trong candidate pool gửi.
Gợi ý dữ kiện cần chủ dự án kiểm tra (heuristic):
- Không phát hiện số liệu/năm/URL lạ; không phải xác nhận ngữ nghĩa.

| Tiêu chí chấm | Điểm / ghi chú của chủ dự án |
|---|---|
| Đường đi hợp lý |  |
| Bữa trưa đúng |  |
| Giờ mở cửa đúng |  |
| Đa dạng |  |
| Lý do tự nhiên |  |
| Lý do có nêu dữ kiện không có trong dữ liệu địa điểm? |  |

### V2 — Gia đình có trẻ nhỏ · 1 ngày

Pool ứng viên: 12 / 57; thời gian: 3133 ms; generated_by=llm; model=gemini-3.5-flash-lite.
Calls=1; token input/output/thinking=1898/366/0; repairs=0; coverage=1; fallbackReason=—.

#### Dự phòng

##### Ngày 1 · 2026-11-01

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:37 | Đại Nội Huế | — | Bạn có thể ghé Đại Nội Huế như một điểm tham quan di sản. Dữ liệu đánh dấu nơi này phù hợp với gia đình có trẻ nhỏ. |
| Trưa | 11:30 | Bánh Ép Gia Di | ~13 phút | Bạn có thể dùng bữa tại Bánh Ép Gia Di. |
| Chiều | 13:00 | Cầu Trường Tiền | ~9 phút | Cầu Trường Tiền là một điểm ngắm cảnh trong lịch trình. |
| Tối | 17:30 | Sông Hương | ~9 phút | Bạn có thể ghé Sông Hương như một điểm tham quan. Dữ liệu đánh dấu nơi này phù hợp với gia đình có trẻ nhỏ. |

Cảnh báo:
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.

#### LLM / kết quả pipeline

##### Ngày 1 · 2026-11-01

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:37 | Đại Nội Huế | — | Kham pha di san Hoang cung triều Nguyen |
| Trưa | 11:30 | Bánh Khoái Lạc Thiện | ~6 phút | Bạn có thể dành một bữa ăn tại Bánh Khoái Lạc Thiện. Dữ liệu đánh dấu nơi này phù hợp với gia đình có trẻ nhỏ. |
| Chiều | 13:00 | Chùa Thiên Mụ | ~18 phút | Bạn có thể dành thời gian khám phá Chùa Thiên Mụ. Bạn cũng quan tâm di sản. |
| Tối | 17:30 | Cầu Trường Tiền | ~19 phút | Cầu Trường Tiền là một điểm ngắm cảnh trong lịch trình. |

Cảnh báo:
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.

Khác biệt địa điểm: chỉ dự phòng — Bánh Ép Gia Di, Sông Hương; chỉ pipeline/LLM — Bánh Khoái Lạc Thiện, Chùa Thiên Mụ.
So sánh: bữa trưa theo khung noon 1 mục dự phòng / 1 mục pipeline; tổng di chuyển ước tính 31 / 43 phút; lý do khác văn bản ở 1 mục trùng địa điểm. Mức tự nhiên/chất lượng cần chủ dự án chấm.
Kiểm tra độc lập: ID thuộc dữ liệu published đã tải, không trùng, có giờ và bữa trưa theo mã kiểm tra báo cáo; validator pipeline V1–V10 giới hạn ID trong candidate pool gửi.
Gợi ý dữ kiện cần chủ dự án kiểm tra (heuristic):
- Không phát hiện số liệu/năm/URL lạ; không phải xác nhận ngữ nghĩa.

| Tiêu chí chấm | Điểm / ghi chú của chủ dự án |
|---|---|
| Đường đi hợp lý |  |
| Bữa trưa đúng |  |
| Giờ mở cửa đúng |  |
| Đa dạng |  |
| Lý do tự nhiên |  |
| Lý do có nêu dữ kiện không có trong dữ liệu địa điểm? |  |

### V3 — Người lớn tuổi · 3 ngày thong thả

Pool ứng viên: 27 / 57; thời gian: 6890 ms; generated_by=llm; model=gemini-3.5-flash-lite.
Calls=1; token input/output/thinking=3929/863/0; repairs=0; coverage=1; fallbackReason=—.

#### Dự phòng

##### Ngày 1 · 2026-11-01

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:39 | Đại Nội Huế | — | Bạn có thể ghé Đại Nội Huế như một điểm tham quan di sản. |
| Trưa | 11:30 | Bánh Ép Gia Di | ~16 phút | Bạn có thể dùng bữa tại Bánh Ép Gia Di. |
| Chiều | 13:00 | Đồi Thiên An | ~27 phút | Đồi Thiên An là một điểm ngắm cảnh trong lịch trình. |

##### Ngày 2 · 2026-11-02

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:43 | Cung An Định | — | Cung An Định là một điểm dừng thuộc nhóm di sản trong lịch trình. |
| Trưa | 11:30 | Bánh Khoái Lạc Thiện | ~12 phút | Bạn có thể dành một bữa ăn tại Bánh Khoái Lạc Thiện. |
| Chiều | 13:00 | Nhà vườn An Hiên | ~18 phút | Bạn có thể dành thời gian khám phá Nhà vườn An Hiên. |

##### Ngày 3 · 2026-11-03

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:48 | Chùa Thiên Mụ | — | Bạn có thể dành thời gian khám phá Chùa Thiên Mụ. |
| Trưa | 11:30 | Cơm Hến Hoa Đông | ~27 phút | Cơm Hến Hoa Đông là một điểm dừng ăn uống trong lịch trình. |
| Chiều | 13:00 | Đầm Chuồn | ~32 phút | Bạn có thể ghé Đầm Chuồn như một điểm tham quan. |

Cảnh báo:
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.

#### LLM / kết quả pipeline

##### Ngày 1 · 2026-11-01

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:39 | Đại Nội Huế | — | Khám phá di sản hoàng cung Huế với quy mô và kiến trúc lịch sử đặc sắc. |
| Trưa | 11:30 | Cơm Hến Hoa Đông | ~13 phút | Thưởng thức món cơm hến đặc sản nổi tiếng của Huế. |
| Chiều | 13:00 | Chùa Thiên Mụ | ~27 phút | Tham quan ngôi chùa cổ kính bên dòng sông Hương thơ mộng. |

##### Ngày 2 · 2026-11-02

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 09:00 | Lăng Khải Định | — | Chiêm ngưỡng lăng vua Khải Định với kiến trúc Đông Tây độc đáo. |
| Trưa | 11:30 | Bánh Khoái Lạc Thiện | ~33 phút | Thưởng thức bánh khoái giòn rụm đậm vị truyền thống. |
| Chiều | 13:00 | Lăng Tự Đức | ~22 phút | Tham quan lăng Tự Đức với không gian lãng mạn hòa hợp thiên nhiên. |

##### Ngày 3 · 2026-11-03

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:45 | Nhà vườn An Hiên | — | Trải nghiệm không gian nhà vườn truyền thống thanh bình của người Huế xưa. |
| Trưa | 11:30 | Bánh Ép Gia Di | ~25 phút | Thưởng thức món bánh ép đặc sản địa phương hấp dẫn. |
| Chiều | 13:00 | Cầu ngói Thanh Toàn | ~20 phút | Khám phá cây cầu ngói cổ kính và tìm hiểu nhịp sống làng quê yên ả. |

Cảnh báo:
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.

Khác biệt địa điểm: chỉ dự phòng — Đồi Thiên An, Cung An Định, Đầm Chuồn; chỉ pipeline/LLM — Lăng Khải Định, Lăng Tự Đức, Cầu ngói Thanh Toàn.
So sánh: bữa trưa theo khung noon 3 mục dự phòng / 3 mục pipeline; tổng di chuyển ước tính 132 / 140 phút; lý do khác văn bản ở 6 mục trùng địa điểm. Mức tự nhiên/chất lượng cần chủ dự án chấm.
Kiểm tra độc lập: ID thuộc dữ liệu published đã tải, không trùng, có giờ và bữa trưa theo mã kiểm tra báo cáo; validator pipeline V1–V10 giới hạn ID trong candidate pool gửi.
Gợi ý dữ kiện cần chủ dự án kiểm tra (heuristic):
- Không phát hiện số liệu/năm/URL lạ; không phải xác nhận ngữ nghĩa.

| Tiêu chí chấm | Điểm / ghi chú của chủ dự án |
|---|---|
| Đường đi hợp lý |  |
| Bữa trưa đúng |  |
| Giờ mở cửa đúng |  |
| Đa dạng |  |
| Lý do tự nhiên |  |
| Lý do có nêu dữ kiện không có trong dữ liệu địa điểm? |  |

### V4 — Nhóm bạn · 4 ngày dày

Pool ứng viên: 57 / 57; thời gian: 5962 ms; generated_by=fallback; model=—.
Calls=1; token input/output/thinking=7636/1407/0; repairs=0; coverage=0.25; fallbackReason=low_coverage.

#### Dự phòng

##### Ngày 1 · 2026-11-01

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:08 | Phố đi bộ Nguyễn Đình Chiểu | — | Bạn có thể ghé Phố đi bộ Nguyễn Đình Chiểu như một điểm tham quan. |
| Sáng | 09:12 | Làng hoa giấy Thanh Tiên | ~19 phút | Bạn có thể dành thời gian khám phá Làng hoa giấy Thanh Tiên. |
| Trưa | 11:30 | Bánh Ép Gia Di | ~22 phút | Bánh Ép Gia Di là một điểm dừng ăn uống trong lịch trình. |
| Chiều | 13:00 | Làng nón Tây Hồ | ~20 phút | Bạn có thể ghé Làng nón Tây Hồ như một điểm tham quan di sản. Bạn cũng quan tâm đời sống địa phương. |
| Chiều | 14:09 | Làng hương Thủy Xuân | ~9 phút | Bạn có thể dành thời gian khám phá Làng hương Thủy Xuân. |
| Tối | 17:30 | Chợ An Cựu | ~18 phút | Chợ An Cựu là một điểm dừng mua sắm trong lịch trình. |
| Tối | 18:25 | Chợ Đông Ba | ~10 phút | Bạn có thể ghé Chợ Đông Ba trong lúc tìm mua quà. |

##### Ngày 2 · 2026-11-02

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:25 | Cầu ngói Thanh Toàn | — | Cầu ngói Thanh Toàn là một điểm dừng thuộc nhóm di sản trong lịch trình. |
| Sáng | 09:35 | Nhà hát Sông Hương | ~25 phút | Bạn có thể ghé Nhà hát Sông Hương như một điểm tham quan. |
| Trưa | 11:30 | Bánh Khoái Lạc Thiện | ~8 phút | Bạn có thể dùng bữa tại Bánh Khoái Lạc Thiện. |
| Chiều | 13:00 | Nook Eatery | ~7 phút | Nook Eatery là một điểm dừng cà phê trong lịch trình. Bạn cũng quan tâm ẩm thực. |
| Chiều | 14:34 | Nhà vườn An Hiên | ~19 phút | Bạn có thể ghé Nhà vườn An Hiên như một điểm tham quan di sản. |
| Tối | 17:30 | Cầu Trường Tiền | ~16 phút | Bạn có thể dành thời gian tham quan Cầu Trường Tiền. |

##### Ngày 3 · 2026-11-03

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:13 | Sông Hương | — | Bạn có thể dành thời gian tham quan Sông Hương. |
| Sáng | 09:24 | Cầu gỗ Lim | ~11 phút | Cầu gỗ Lim là một điểm ngắm cảnh trong lịch trình. |
| Trưa | 11:30 | Cơm Hến Hoa Đông | ~10 phút | Bạn có thể dành một bữa ăn tại Cơm Hến Hoa Đông. |
| Chiều | 13:00 | Đồi Vọng Cảnh | ~24 phút | Bạn có thể dành thời gian tham quan Đồi Vọng Cảnh. |
| Chiều | 13:57 | Đồi Thiên An | ~12 phút | Đồi Thiên An là một điểm ngắm cảnh trong lịch trình. |
| Tối | 17:30 | Hồ Thủy Tiên | ~6 phút | Bạn có thể ghé Hồ Thủy Tiên như một điểm tham quan. |
| Tối | 18:24 | Điện Hòn Chén | ~9 phút | Bạn có thể dành thời gian khám phá Điện Hòn Chén. |

##### Ngày 4 · 2026-11-04

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:07 | Đại Nội Huế | — | Bạn có thể ghé Đại Nội Huế như một điểm tham quan di sản. |
| Sáng | 10:54 | Lăng Tự Đức | ~17 phút | Bạn có thể dành thời gian khám phá Lăng Tự Đức. |
| Chiều | 13:00 | Quán Hến Bà Cam | ~25 phút | Quán Hến Bà Cam là một điểm dừng ăn uống trong lịch trình. |
| Chiều | 14:09 | Đầm Chuồn | ~24 phút | Bạn có thể ghé Đầm Chuồn như một điểm tham quan. |
| Chiều | 16:35 | Biển Hải Dương | ~26 phút | Bạn có thể dành thời gian tham quan Biển Hải Dương. |
| Tối | 18:27 | Biển Thuận An | ~22 phút | Biển Thuận An là một điểm ngắm cảnh trong lịch trình. |

Cảnh báo:
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- LUNCH_MISSING: Ngày này chưa có địa điểm ăn trưa.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.

#### LLM / kết quả pipeline

##### Ngày 1 · 2026-11-01

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:08 | Phố đi bộ Nguyễn Đình Chiểu | — | Bạn có thể ghé Phố đi bộ Nguyễn Đình Chiểu như một điểm tham quan. |
| Sáng | 09:12 | Làng hoa giấy Thanh Tiên | ~19 phút | Bạn có thể dành thời gian khám phá Làng hoa giấy Thanh Tiên. |
| Trưa | 11:30 | Bánh Ép Gia Di | ~22 phút | Bánh Ép Gia Di là một điểm dừng ăn uống trong lịch trình. |
| Chiều | 13:00 | Làng nón Tây Hồ | ~20 phút | Bạn có thể ghé Làng nón Tây Hồ như một điểm tham quan di sản. Bạn cũng quan tâm đời sống địa phương. |
| Chiều | 14:09 | Làng hương Thủy Xuân | ~9 phút | Bạn có thể dành thời gian khám phá Làng hương Thủy Xuân. |
| Tối | 17:30 | Chợ An Cựu | ~18 phút | Chợ An Cựu là một điểm dừng mua sắm trong lịch trình. |
| Tối | 18:25 | Chợ Đông Ba | ~10 phút | Bạn có thể ghé Chợ Đông Ba trong lúc tìm mua quà. |

##### Ngày 2 · 2026-11-02

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:25 | Cầu ngói Thanh Toàn | — | Cầu ngói Thanh Toàn là một điểm dừng thuộc nhóm di sản trong lịch trình. |
| Sáng | 09:35 | Nhà hát Sông Hương | ~25 phút | Bạn có thể ghé Nhà hát Sông Hương như một điểm tham quan. |
| Trưa | 11:30 | Bánh Khoái Lạc Thiện | ~8 phút | Bạn có thể dùng bữa tại Bánh Khoái Lạc Thiện. |
| Chiều | 13:00 | Nook Eatery | ~7 phút | Nook Eatery là một điểm dừng cà phê trong lịch trình. Bạn cũng quan tâm ẩm thực. |
| Chiều | 14:34 | Nhà vườn An Hiên | ~19 phút | Bạn có thể ghé Nhà vườn An Hiên như một điểm tham quan di sản. |
| Tối | 17:30 | Cầu Trường Tiền | ~16 phút | Bạn có thể dành thời gian tham quan Cầu Trường Tiền. |

##### Ngày 3 · 2026-11-03

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:13 | Sông Hương | — | Bạn có thể dành thời gian tham quan Sông Hương. |
| Sáng | 09:24 | Cầu gỗ Lim | ~11 phút | Cầu gỗ Lim là một điểm ngắm cảnh trong lịch trình. |
| Trưa | 11:30 | Cơm Hến Hoa Đông | ~10 phút | Bạn có thể dành một bữa ăn tại Cơm Hến Hoa Đông. |
| Chiều | 13:00 | Đồi Vọng Cảnh | ~24 phút | Bạn có thể dành thời gian tham quan Đồi Vọng Cảnh. |
| Chiều | 13:57 | Đồi Thiên An | ~12 phút | Đồi Thiên An là một điểm ngắm cảnh trong lịch trình. |
| Tối | 17:30 | Hồ Thủy Tiên | ~6 phút | Bạn có thể ghé Hồ Thủy Tiên như một điểm tham quan. |
| Tối | 18:24 | Điện Hòn Chén | ~9 phút | Bạn có thể dành thời gian khám phá Điện Hòn Chén. |

##### Ngày 4 · 2026-11-04

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:07 | Đại Nội Huế | — | Bạn có thể ghé Đại Nội Huế như một điểm tham quan di sản. |
| Sáng | 10:54 | Lăng Tự Đức | ~17 phút | Bạn có thể dành thời gian khám phá Lăng Tự Đức. |
| Chiều | 13:00 | Quán Hến Bà Cam | ~25 phút | Quán Hến Bà Cam là một điểm dừng ăn uống trong lịch trình. |
| Chiều | 14:09 | Đầm Chuồn | ~24 phút | Bạn có thể ghé Đầm Chuồn như một điểm tham quan. |
| Chiều | 16:35 | Biển Hải Dương | ~26 phút | Bạn có thể dành thời gian tham quan Biển Hải Dương. |
| Tối | 18:27 | Biển Thuận An | ~22 phút | Biển Thuận An là một điểm ngắm cảnh trong lịch trình. |

Cảnh báo:
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- LUNCH_MISSING: Ngày này chưa có địa điểm ăn trưa.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.

Khác biệt địa điểm: chỉ dự phòng — không có; chỉ pipeline/LLM — không có.
So sánh: bữa trưa theo khung noon 3 mục dự phòng / 3 mục pipeline; tổng di chuyển ước tính 359 / 359 phút; lý do khác văn bản ở 0 mục trùng địa điểm. Mức tự nhiên/chất lượng cần chủ dự án chấm.
Kiểm tra tự động: Ngày 4 không có đúng một bữa trưa.
Gợi ý dữ kiện cần chủ dự án kiểm tra (heuristic):
- Không phát hiện số liệu/năm/URL lạ; không phải xác nhận ngữ nghĩa.

| Tiêu chí chấm | Điểm / ghi chú của chủ dự án |
|---|---|
| Đường đi hợp lý |  |
| Bữa trưa đúng |  |
| Giờ mở cửa đúng |  |
| Đa dạng |  |
| Lý do tự nhiên |  |
| Lý do có nêu dữ kiện không có trong dữ liệu địa điểm? |  |

### V5 — Một mình · 1 ngày · di sản và cà phê

Pool ứng viên: 15 / 57; thời gian: 4216 ms; generated_by=llm; model=gemini-3.5-flash-lite.
Calls=1; token input/output/thinking=2310/289/0; repairs=0; coverage=1; fallbackReason=—.

#### Dự phòng

##### Ngày 1 · 2026-11-01

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:07 | Đại Nội Huế | — | Bạn có thể ghé Đại Nội Huế như một điểm tham quan di sản. |
| Trưa | 11:30 | Cơm Hến Hoa Đông | ~10 phút | Bạn có thể dùng bữa tại Cơm Hến Hoa Đông. |
| Chiều | 13:00 | Cà phê Tân | ~9 phút | Cà phê Tân là một điểm dừng cà phê trong lịch trình. |
| Tối | 17:30 | Cung An Định | ~8 phút | Bạn có thể ghé Cung An Định như một điểm tham quan di sản. Bạn cũng quan tâm di sản. |

Cảnh báo:
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.

#### LLM / kết quả pipeline

##### Ngày 1 · 2026-11-01

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:07 | Đại Nội Huế | — | Khám phá di sản hoàng cung Huế |
| Sáng | 10:49 | Cung An Định | ~12 phút | Cung An Định là một điểm dừng thuộc nhóm di sản trong lịch trình. |
| Trưa | 12:00 | Cơm Hến Hoa Đông | ~11 phút | Thưởng thức cơm hến đặc sản |
| Chiều | 13:00 | Cà phê Tân | ~9 phút | Thư giãn tại quán cà phê địa phương |

Cảnh báo:
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.

Khác biệt địa điểm: chỉ dự phòng — không có; chỉ pipeline/LLM — không có.
So sánh: bữa trưa theo khung noon 1 mục dự phòng / 1 mục pipeline; tổng di chuyển ước tính 27 / 32 phút; lý do khác văn bản ở 4 mục trùng địa điểm. Mức tự nhiên/chất lượng cần chủ dự án chấm.
Kiểm tra độc lập: ID thuộc dữ liệu published đã tải, không trùng, có giờ và bữa trưa theo mã kiểm tra báo cáo; validator pipeline V1–V10 giới hạn ID trong candidate pool gửi.
Gợi ý dữ kiện cần chủ dự án kiểm tra (heuristic):
- Không phát hiện số liệu/năm/URL lạ; không phải xác nhận ngữ nghĩa.

| Tiêu chí chấm | Điểm / ghi chú của chủ dự án |
|---|---|
| Đường đi hợp lý |  |
| Bữa trưa đúng |  |
| Giờ mở cửa đúng |  |
| Đa dạng |  |
| Lý do tự nhiên |  |
| Lý do có nêu dữ kiện không có trong dữ liệu địa điểm? |  |

### V6 — Cặp đôi · 3 ngày · sông nước và ảnh

Pool ứng viên: 45 / 57; thời gian: 6119 ms; generated_by=fallback; model=—.
Calls=1; token input/output/thinking=6204/1067/0; repairs=0; coverage=0.3333333333333333; fallbackReason=low_coverage.

#### Dự phòng

##### Ngày 1 · 2026-11-01

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:15 | Cầu gỗ Lim | — | Bạn có thể ghé Cầu gỗ Lim như một điểm tham quan. |
| Trưa | 11:30 | Bánh Khoái Lạc Thiện | ~9 phút | Bạn có thể dùng bữa tại Bánh Khoái Lạc Thiện. |
| Chiều | 13:00 | Bảo tàng Mỹ thuật Cung đình Huế | ~7 phút | Bảo tàng Mỹ thuật Cung đình Huế là một điểm dừng thuộc nhóm di sản trong lịch trình. |
| Chiều | 14:30 | Sông Hương | ~30 phút | Bạn có thể ghé Sông Hương như một điểm tham quan. Bạn cũng quan tâm cảnh sông nước. |
| Tối | 17:30 | Nook Eatery | ~26 phút | Bạn có thể nghỉ chân tại quán cà phê Nook Eatery. |

##### Ngày 2 · 2026-11-02

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:24 | Cầu Trường Tiền | — | Cầu Trường Tiền là một điểm ngắm cảnh trong lịch trình. |
| Sáng | 08:58 | Phố đi bộ Nguyễn Đình Chiểu | ~4 phút | Bạn có thể ghé Phố đi bộ Nguyễn Đình Chiểu như một điểm tham quan. |
| Trưa | 11:30 | Cơm Hến Hoa Đông | ~23 phút | Bạn có thể dùng bữa tại Cơm Hến Hoa Đông. |
| Chiều | 13:00 | Cà phê Tân | ~26 phút | Cà phê Tân là một điểm dừng cà phê trong lịch trình. |
| Tối | 17:30 | Nhà hát Sông Hương | ~23 phút | Bạn có thể ghé Nhà hát Sông Hương như một điểm tham quan. |

##### Ngày 3 · 2026-11-03

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:18 | Đại Nội Huế | — | Bạn có thể dành thời gian khám phá Đại Nội Huế. |
| Sáng | 11:07 | Bảo tàng Hồ Chí Minh Huế | ~19 phút | Bảo tàng Hồ Chí Minh Huế là một điểm dừng thuộc nhóm di sản trong lịch trình. |
| Chiều | 13:00 | Chợ Đông Ba | ~26 phút | Bạn có thể ghé Chợ Đông Ba trong lúc tìm mua quà. |
| Chiều | 14:28 | Quán Hến Bà Cam | ~28 phút | Bạn có thể dùng bữa tại Quán Hến Bà Cam. |

Cảnh báo:
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- LUNCH_MISSING: Ngày này chưa có địa điểm ăn trưa.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.

#### LLM / kết quả pipeline

##### Ngày 1 · 2026-11-01

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:15 | Cầu gỗ Lim | — | Bạn có thể ghé Cầu gỗ Lim như một điểm tham quan. |
| Trưa | 11:30 | Bánh Khoái Lạc Thiện | ~9 phút | Bạn có thể dùng bữa tại Bánh Khoái Lạc Thiện. |
| Chiều | 13:00 | Bảo tàng Mỹ thuật Cung đình Huế | ~7 phút | Bảo tàng Mỹ thuật Cung đình Huế là một điểm dừng thuộc nhóm di sản trong lịch trình. |
| Chiều | 14:30 | Sông Hương | ~30 phút | Bạn có thể ghé Sông Hương như một điểm tham quan. Bạn cũng quan tâm cảnh sông nước. |
| Tối | 17:30 | Nook Eatery | ~26 phút | Bạn có thể nghỉ chân tại quán cà phê Nook Eatery. |

##### Ngày 2 · 2026-11-02

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:24 | Cầu Trường Tiền | — | Cầu Trường Tiền là một điểm ngắm cảnh trong lịch trình. |
| Sáng | 08:58 | Phố đi bộ Nguyễn Đình Chiểu | ~4 phút | Bạn có thể ghé Phố đi bộ Nguyễn Đình Chiểu như một điểm tham quan. |
| Trưa | 11:30 | Cơm Hến Hoa Đông | ~23 phút | Bạn có thể dùng bữa tại Cơm Hến Hoa Đông. |
| Chiều | 13:00 | Cà phê Tân | ~26 phút | Cà phê Tân là một điểm dừng cà phê trong lịch trình. |
| Tối | 17:30 | Nhà hát Sông Hương | ~23 phút | Bạn có thể ghé Nhà hát Sông Hương như một điểm tham quan. |

##### Ngày 3 · 2026-11-03

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:18 | Đại Nội Huế | — | Bạn có thể dành thời gian khám phá Đại Nội Huế. |
| Sáng | 11:07 | Bảo tàng Hồ Chí Minh Huế | ~19 phút | Bảo tàng Hồ Chí Minh Huế là một điểm dừng thuộc nhóm di sản trong lịch trình. |
| Chiều | 13:00 | Chợ Đông Ba | ~26 phút | Bạn có thể ghé Chợ Đông Ba trong lúc tìm mua quà. |
| Chiều | 14:28 | Quán Hến Bà Cam | ~28 phút | Bạn có thể dùng bữa tại Quán Hến Bà Cam. |

Cảnh báo:
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- LUNCH_MISSING: Ngày này chưa có địa điểm ăn trưa.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.

Khác biệt địa điểm: chỉ dự phòng — không có; chỉ pipeline/LLM — không có.
So sánh: bữa trưa theo khung noon 2 mục dự phòng / 2 mục pipeline; tổng di chuyển ước tính 221 / 221 phút; lý do khác văn bản ở 0 mục trùng địa điểm. Mức tự nhiên/chất lượng cần chủ dự án chấm.
Kiểm tra tự động: Ngày 3 không có đúng một bữa trưa.
Gợi ý dữ kiện cần chủ dự án kiểm tra (heuristic):
- Không phát hiện số liệu/năm/URL lạ; không phải xác nhận ngữ nghĩa.

| Tiêu chí chấm | Điểm / ghi chú của chủ dự án |
|---|---|
| Đường đi hợp lý |  |
| Bữa trưa đúng |  |
| Giờ mở cửa đúng |  |
| Đa dạng |  |
| Lý do tự nhiên |  |
| Lý do có nêu dữ kiện không có trong dữ liệu địa điểm? |  |

### V7 — Gia đình · 2 ngày · di sản và ẩm thực

Pool ứng viên: 18 / 57; thời gian: 2926 ms; generated_by=fallback; model=—.
Calls=1; token input/output/thinking=2744/547/0; repairs=0; coverage=0.5; fallbackReason=low_coverage.

#### Dự phòng

##### Ngày 1 · 2026-11-01

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:37 | Đại Nội Huế | — | Bạn có thể ghé Đại Nội Huế như một điểm tham quan di sản. Dữ liệu đánh dấu nơi này phù hợp với gia đình có trẻ nhỏ. |
| Trưa | 11:30 | Bánh Ép Gia Di | ~13 phút | Bạn có thể dùng bữa tại Bánh Ép Gia Di. |
| Chiều | 13:00 | Nhà vườn An Hiên | ~20 phút | Nhà vườn An Hiên là một điểm dừng thuộc nhóm di sản trong lịch trình. |

##### Ngày 2 · 2026-11-02

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:45 | Chùa Thiên Mụ | — | Chùa Thiên Mụ là một điểm dừng thuộc nhóm di sản trong lịch trình. |
| Trưa | 11:30 | Bánh Khoái Lạc Thiện | ~18 phút | Bạn có thể dành một bữa ăn tại Bánh Khoái Lạc Thiện. Dữ liệu đánh dấu nơi này phù hợp với gia đình có trẻ nhỏ. |
| Chiều | 13:00 | Cung An Định | ~10 phút | Bạn có thể dành thời gian khám phá Cung An Định. |

Cảnh báo:
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.

#### LLM / kết quả pipeline

##### Ngày 1 · 2026-11-01

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:37 | Đại Nội Huế | — | Bạn có thể ghé Đại Nội Huế như một điểm tham quan di sản. Dữ liệu đánh dấu nơi này phù hợp với gia đình có trẻ nhỏ. |
| Trưa | 11:30 | Bánh Ép Gia Di | ~13 phút | Bạn có thể dùng bữa tại Bánh Ép Gia Di. |
| Chiều | 13:00 | Nhà vườn An Hiên | ~20 phút | Nhà vườn An Hiên là một điểm dừng thuộc nhóm di sản trong lịch trình. |

##### Ngày 2 · 2026-11-02

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:45 | Chùa Thiên Mụ | — | Chùa Thiên Mụ là một điểm dừng thuộc nhóm di sản trong lịch trình. |
| Trưa | 11:30 | Bánh Khoái Lạc Thiện | ~18 phút | Bạn có thể dành một bữa ăn tại Bánh Khoái Lạc Thiện. Dữ liệu đánh dấu nơi này phù hợp với gia đình có trẻ nhỏ. |
| Chiều | 13:00 | Cung An Định | ~10 phút | Bạn có thể dành thời gian khám phá Cung An Định. |

Cảnh báo:
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.

Khác biệt địa điểm: chỉ dự phòng — không có; chỉ pipeline/LLM — không có.
So sánh: bữa trưa theo khung noon 2 mục dự phòng / 2 mục pipeline; tổng di chuyển ước tính 61 / 61 phút; lý do khác văn bản ở 0 mục trùng địa điểm. Mức tự nhiên/chất lượng cần chủ dự án chấm.
Kiểm tra độc lập: ID thuộc dữ liệu published đã tải, không trùng, có giờ và bữa trưa theo mã kiểm tra báo cáo; validator pipeline V1–V10 giới hạn ID trong candidate pool gửi.
Gợi ý dữ kiện cần chủ dự án kiểm tra (heuristic):
- Không phát hiện số liệu/năm/URL lạ; không phải xác nhận ngữ nghĩa.

| Tiêu chí chấm | Điểm / ghi chú của chủ dự án |
|---|---|
| Đường đi hợp lý |  |
| Bữa trưa đúng |  |
| Giờ mở cửa đúng |  |
| Đa dạng |  |
| Lý do tự nhiên |  |
| Lý do có nêu dữ kiện không có trong dữ liệu địa điểm? |  |

### V8 — Người lớn tuổi · 2 ngày · tâm linh và thiên nhiên

Pool ứng viên: 18 / 57; thời gian: 5087 ms; generated_by=fallback; model=—.
Calls=1; token input/output/thinking=2726/709/0; repairs=0; coverage=0.5; fallbackReason=low_coverage.

#### Dự phòng

##### Ngày 1 · 2026-11-01

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:47 | Chùa Thiên Mụ | — | Bạn có thể ghé Chùa Thiên Mụ như một điểm tham quan di sản. |
| Trưa | 11:30 | Bánh Ép Gia Di | ~25 phút | Bạn có thể dùng bữa tại Bánh Ép Gia Di. |
| Chiều | 13:00 | Điện Hòn Chén | ~25 phút | Điện Hòn Chén là một điểm dừng thuộc nhóm di sản trong lịch trình. |

##### Ngày 2 · 2026-11-02

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:52 | Đồi Thiên An | — | Đồi Thiên An là một điểm ngắm cảnh trong lịch trình. |
| Trưa | 11:30 | Bánh Khoái Lạc Thiện | ~25 phút | Bạn có thể dành một bữa ăn tại Bánh Khoái Lạc Thiện. |
| Chiều | 13:00 | Đầm Chuồn | ~33 phút | Bạn có thể dành thời gian tham quan Đầm Chuồn. |

Cảnh báo:
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.

#### LLM / kết quả pipeline

##### Ngày 1 · 2026-11-01

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:47 | Chùa Thiên Mụ | — | Bạn có thể ghé Chùa Thiên Mụ như một điểm tham quan di sản. |
| Trưa | 11:30 | Bánh Ép Gia Di | ~25 phút | Bạn có thể dùng bữa tại Bánh Ép Gia Di. |
| Chiều | 13:00 | Điện Hòn Chén | ~25 phút | Điện Hòn Chén là một điểm dừng thuộc nhóm di sản trong lịch trình. |

##### Ngày 2 · 2026-11-02

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:52 | Đồi Thiên An | — | Đồi Thiên An là một điểm ngắm cảnh trong lịch trình. |
| Trưa | 11:30 | Bánh Khoái Lạc Thiện | ~25 phút | Bạn có thể dành một bữa ăn tại Bánh Khoái Lạc Thiện. |
| Chiều | 13:00 | Đầm Chuồn | ~33 phút | Bạn có thể dành thời gian tham quan Đầm Chuồn. |

Cảnh báo:
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.

Khác biệt địa điểm: chỉ dự phòng — không có; chỉ pipeline/LLM — không có.
So sánh: bữa trưa theo khung noon 2 mục dự phòng / 2 mục pipeline; tổng di chuyển ước tính 108 / 108 phút; lý do khác văn bản ở 0 mục trùng địa điểm. Mức tự nhiên/chất lượng cần chủ dự án chấm.
Kiểm tra độc lập: ID thuộc dữ liệu published đã tải, không trùng, có giờ và bữa trưa theo mã kiểm tra báo cáo; validator pipeline V1–V10 giới hạn ID trong candidate pool gửi.
Gợi ý dữ kiện cần chủ dự án kiểm tra (heuristic):
- Không phát hiện số liệu/năm/URL lạ; không phải xác nhận ngữ nghĩa.

| Tiêu chí chấm | Điểm / ghi chú của chủ dự án |
|---|---|
| Đường đi hợp lý |  |
| Bữa trưa đúng |  |
| Giờ mở cửa đúng |  |
| Đa dạng |  |
| Lý do tự nhiên |  |
| Lý do có nêu dữ kiện không có trong dữ liệu địa điểm? |  |

### V9 — Nhóm bạn · 2 ngày · cà phê và mua sắm

Pool ứng viên: 42 / 57; thời gian: 8137 ms; generated_by=fallback; model=—.
Calls=1; token input/output/thinking=5833/724/0; repairs=0; coverage=0.5; fallbackReason=low_coverage.

#### Dự phòng

##### Ngày 1 · 2026-11-01

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:11 | Nook Eatery | — | Bạn có thể dành thời gian thư giãn ở Nook Eatery. |
| Sáng | 09:33 | Cà phê Tân | ~7 phút | Bạn có thể nghỉ chân tại quán cà phê Cà phê Tân. |
| Trưa | 11:30 | Bánh Ép Gia Di | ~8 phút | Bánh Ép Gia Di là một điểm dừng ăn uống trong lịch trình. |
| Chiều | 13:00 | Mè Xửng Thiên Hương | ~8 phút | Bạn có thể ghé Mè Xửng Thiên Hương trong lúc tìm mua quà. Bạn cũng quan tâm mua sắm. |
| Chiều | 13:50 | Làng hoa giấy Thanh Tiên | ~20 phút | Bạn có thể dành thời gian khám phá Làng hoa giấy Thanh Tiên. |
| Tối | 17:30 | Làng nón Tây Hồ | ~26 phút | Làng nón Tây Hồ là một điểm dừng thuộc nhóm di sản trong lịch trình. |

##### Ngày 2 · 2026-11-02

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:13 | Làng hương Thủy Xuân | — | Làng hương Thủy Xuân là một điểm dừng thuộc nhóm di sản trong lịch trình. |
| Sáng | 09:16 | Chợ An Cựu | ~18 phút | Bạn có thể ghé Chợ An Cựu trong lúc tìm mua quà. |
| Trưa | 11:30 | Bánh Khoái Lạc Thiện | ~10 phút | Bạn có thể dùng bữa tại Bánh Khoái Lạc Thiện. |
| Chiều | 13:00 | Chợ Đông Ba | ~5 phút | Chợ Đông Ba là một điểm dừng mua sắm trong lịch trình. Bạn cũng quan tâm mua sắm. |
| Chiều | 14:07 | Đại Nội Huế | ~7 phút | Bạn có thể ghé Đại Nội Huế như một điểm tham quan di sản. |
| Tối | 17:30 | Cầu Trường Tiền | ~7 phút | Bạn có thể dành thời gian tham quan Cầu Trường Tiền. |
| Tối | 18:04 | Phố đi bộ Nguyễn Đình Chiểu | ~4 phút | Phố đi bộ Nguyễn Đình Chiểu là một điểm ngắm cảnh trong lịch trình. |

Cảnh báo:
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.

#### LLM / kết quả pipeline

##### Ngày 1 · 2026-11-01

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:11 | Nook Eatery | — | Bạn có thể dành thời gian thư giãn ở Nook Eatery. |
| Sáng | 09:33 | Cà phê Tân | ~7 phút | Bạn có thể nghỉ chân tại quán cà phê Cà phê Tân. |
| Trưa | 11:30 | Bánh Ép Gia Di | ~8 phút | Bánh Ép Gia Di là một điểm dừng ăn uống trong lịch trình. |
| Chiều | 13:00 | Mè Xửng Thiên Hương | ~8 phút | Bạn có thể ghé Mè Xửng Thiên Hương trong lúc tìm mua quà. Bạn cũng quan tâm mua sắm. |
| Chiều | 13:50 | Làng hoa giấy Thanh Tiên | ~20 phút | Bạn có thể dành thời gian khám phá Làng hoa giấy Thanh Tiên. |
| Tối | 17:30 | Làng nón Tây Hồ | ~26 phút | Làng nón Tây Hồ là một điểm dừng thuộc nhóm di sản trong lịch trình. |

##### Ngày 2 · 2026-11-02

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:13 | Làng hương Thủy Xuân | — | Làng hương Thủy Xuân là một điểm dừng thuộc nhóm di sản trong lịch trình. |
| Sáng | 09:16 | Chợ An Cựu | ~18 phút | Bạn có thể ghé Chợ An Cựu trong lúc tìm mua quà. |
| Trưa | 11:30 | Bánh Khoái Lạc Thiện | ~10 phút | Bạn có thể dùng bữa tại Bánh Khoái Lạc Thiện. |
| Chiều | 13:00 | Chợ Đông Ba | ~5 phút | Chợ Đông Ba là một điểm dừng mua sắm trong lịch trình. Bạn cũng quan tâm mua sắm. |
| Chiều | 14:07 | Đại Nội Huế | ~7 phút | Bạn có thể ghé Đại Nội Huế như một điểm tham quan di sản. |
| Tối | 17:30 | Cầu Trường Tiền | ~7 phút | Bạn có thể dành thời gian tham quan Cầu Trường Tiền. |
| Tối | 18:04 | Phố đi bộ Nguyễn Đình Chiểu | ~4 phút | Phố đi bộ Nguyễn Đình Chiểu là một điểm ngắm cảnh trong lịch trình. |

Cảnh báo:
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.

Khác biệt địa điểm: chỉ dự phòng — không có; chỉ pipeline/LLM — không có.
So sánh: bữa trưa theo khung noon 2 mục dự phòng / 2 mục pipeline; tổng di chuyển ước tính 120 / 120 phút; lý do khác văn bản ở 0 mục trùng địa điểm. Mức tự nhiên/chất lượng cần chủ dự án chấm.
Kiểm tra độc lập: ID thuộc dữ liệu published đã tải, không trùng, có giờ và bữa trưa theo mã kiểm tra báo cáo; validator pipeline V1–V10 giới hạn ID trong candidate pool gửi.
Gợi ý dữ kiện cần chủ dự án kiểm tra (heuristic):
- Không phát hiện số liệu/năm/URL lạ; không phải xác nhận ngữ nghĩa.

| Tiêu chí chấm | Điểm / ghi chú của chủ dự án |
|---|---|
| Đường đi hợp lý |  |
| Bữa trưa đúng |  |
| Giờ mở cửa đúng |  |
| Đa dạng |  |
| Lý do tự nhiên |  |
| Lý do có nêu dữ kiện không có trong dữ liệu địa điểm? |  |

### V10 — Một mình · 3 ngày · đời sống địa phương và lịch sử

Pool ứng viên: 45 / 57; thời gian: 3612 ms; generated_by=llm; model=gemini-3.5-flash-lite.
Calls=1; token input/output/thinking=6219/986/0; repairs=0; coverage=1; fallbackReason=—.

#### Dự phòng

##### Ngày 1 · 2026-11-01

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:14 | Lăng Tự Đức | — | Bạn có thể ghé Lăng Tự Đức như một điểm tham quan di sản. |
| Trưa | 11:30 | Cơm Hến Hoa Đông | ~22 phút | Bạn có thể dùng bữa tại Cơm Hến Hoa Đông. |
| Chiều | 13:00 | Bảo tàng Hồ Chí Minh Huế | ~12 phút | Bảo tàng Hồ Chí Minh Huế là một điểm dừng thuộc nhóm di sản trong lịch trình. |
| Chiều | 14:25 | Lăng Khải Định | ~25 phút | Bạn có thể ghé Lăng Khải Định như một điểm tham quan di sản. Bạn cũng quan tâm lịch sử. |

##### Ngày 2 · 2026-11-02

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:13 | Làng hương Thủy Xuân | — | Làng hương Thủy Xuân là một điểm dừng thuộc nhóm di sản trong lịch trình. |
| Trưa | 11:30 | Quán Hến Bà Cam | ~24 phút | Bạn có thể dành một bữa ăn tại Quán Hến Bà Cam. |
| Chiều | 13:00 | Chợ Đông Ba | ~9 phút | Bạn có thể dành thời gian mua sắm tại Chợ Đông Ba. |
| Chiều | 14:06 | Bảo tàng Mỹ thuật Cung đình Huế | ~6 phút | Bảo tàng Mỹ thuật Cung đình Huế là một điểm dừng thuộc nhóm di sản trong lịch trình. Bạn cũng quan tâm lịch sử. |
| Tối | 17:30 | Chợ An Cựu | ~11 phút | Bạn có thể ghé Chợ An Cựu trong lúc tìm mua quà. |

##### Ngày 3 · 2026-11-03

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:08 | Phố đi bộ Nguyễn Đình Chiểu | — | Bạn có thể dành thời gian tham quan Phố đi bộ Nguyễn Đình Chiểu. |
| Trưa | 11:30 | Bánh Ép Gia Di | ~9 phút | Bánh Ép Gia Di là một điểm dừng ăn uống trong lịch trình. |
| Chiều | 13:00 | Đại Nội Huế | ~13 phút | Bạn có thể ghé Đại Nội Huế như một điểm tham quan di sản. |
| Tối | 17:30 | Làng hoa giấy Thanh Tiên | ~18 phút | Bạn có thể dành thời gian khám phá Làng hoa giấy Thanh Tiên. Bạn cũng quan tâm đời sống địa phương. |

Cảnh báo:
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.

#### LLM / kết quả pipeline

##### Ngày 1 · 2026-11-01

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:07 | Đại Nội Huế | — | Khám phá hoàng cung triều Nguyễn |
| Trưa | 11:30 | Cơm Hến Đập Đá | ~7 phút | Thưởng thức cơm hến đặc sản |
| Chiều | 13:00 | Chợ Đông Ba | ~5 phút | Mua sắm và khám phá chợ Đông Ba |
| Tối | 17:30 | Phố đi bộ Nguyễn Đình Chiểu | ~5 phút | Tản bộ phố đi bộ ven sông |

##### Ngày 2 · 2026-11-02

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:14 | Lăng Tự Đức | — | Tham quan lăng tẩm vua Tự Đức |
| Trưa | 11:30 | Bánh Lọc Mụ Cai | ~26 phút | Thưởng thức bánh lọc Huế |
| Chiều | 13:00 | Làng hương Thủy Xuân | ~26 phút | Tìm hiểu làng nghề làm hương |
| Tối | 17:30 | Đồi Vọng Cảnh | ~7 phút | Ngắm cảnh hoàng hôn tại đồi Vọng Cảnh |

##### Ngày 3 · 2026-11-03

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:15 | Chùa Thiên Mụ | — | Viếng thăm ngôi chùa cổ Thiên Mụ |
| Trưa | 11:30 | Nina's Cafe Restaurant | ~20 phút | Thưởng thức bữa trưa món Việt |
| Chiều | 13:00 | Lăng Khải Định | ~23 phút | Chiêm ngưỡng kiến trúc lăng Khải Định |
| Tối | 17:30 | Cầu gỗ Lim | ~26 phút | Dạo chơi cầu gỗ Lim về đêm |

Cảnh báo:
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.

Khác biệt địa điểm: chỉ dự phòng — Cơm Hến Hoa Đông, Bảo tàng Hồ Chí Minh Huế, Quán Hến Bà Cam, Bảo tàng Mỹ thuật Cung đình Huế, Chợ An Cựu, Bánh Ép Gia Di, Làng hoa giấy Thanh Tiên; chỉ pipeline/LLM — Cơm Hến Đập Đá, Bánh Lọc Mụ Cai, Đồi Vọng Cảnh, Chùa Thiên Mụ, Nina's Cafe Restaurant, Cầu gỗ Lim.
So sánh: bữa trưa theo khung noon 3 mục dự phòng / 3 mục pipeline; tổng di chuyển ước tính 149 / 145 phút; lý do khác văn bản ở 6 mục trùng địa điểm. Mức tự nhiên/chất lượng cần chủ dự án chấm.
Kiểm tra độc lập: ID thuộc dữ liệu published đã tải, không trùng, có giờ và bữa trưa theo mã kiểm tra báo cáo; validator pipeline V1–V10 giới hạn ID trong candidate pool gửi.
Gợi ý dữ kiện cần chủ dự án kiểm tra (heuristic):
- Không phát hiện số liệu/năm/URL lạ; không phải xác nhận ngữ nghĩa.

| Tiêu chí chấm | Điểm / ghi chú của chủ dự án |
|---|---|
| Đường đi hợp lý |  |
| Bữa trưa đúng |  |
| Giờ mở cửa đúng |  |
| Đa dạng |  |
| Lý do tự nhiên |  |
| Lý do có nêu dữ kiện không có trong dữ liệu địa điểm? |  |

### ADVERSARIAL-1 — Ghi chú đối kháng 1

Pool ứng viên: 30 / 57; thời gian: 3196 ms; generated_by=fallback; model=—.
Calls=1; token input/output/thinking=4312/564/0; repairs=0; coverage=0.5; fallbackReason=low_coverage.

#### Dự phòng

##### Ngày 1 · 2026-11-01

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:11 | Nook Eatery | — | Bạn có thể dành thời gian thư giãn ở Nook Eatery. |
| Trưa | 11:30 | Bánh Khoái Lạc Thiện | ~7 phút | Bạn có thể dùng bữa tại Bánh Khoái Lạc Thiện. |
| Chiều | 13:00 | Chợ Đông Ba | ~5 phút | Chợ Đông Ba là một điểm dừng mua sắm trong lịch trình. |
| Chiều | 14:06 | Cà phê Tân | ~6 phút | Bạn có thể dành thời gian thư giãn ở Cà phê Tân. Bạn cũng quan tâm cà phê. |
| Tối | 17:30 | Chợ An Cựu | ~8 phút | Bạn có thể dành thời gian mua sắm tại Chợ An Cựu. |

##### Ngày 2 · 2026-11-02

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:08 | Mè Xửng Thiên Hương | — | Mè Xửng Thiên Hương là một điểm dừng mua sắm trong lịch trình. |
| Trưa | 11:30 | Cơm Hến Hoa Đông | ~9 phút | Bạn có thể dành một bữa ăn tại Cơm Hến Hoa Đông. |
| Chiều | 13:00 | Chùa Thiên Mụ | ~22 phút | Bạn có thể dành thời gian khám phá Chùa Thiên Mụ. |
| Chiều | 14:01 | Đại Nội Huế | ~16 phút | Đại Nội Huế là một điểm dừng thuộc nhóm di sản trong lịch trình. |

Cảnh báo:
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.

#### LLM / kết quả pipeline

##### Ngày 1 · 2026-11-01

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:11 | Nook Eatery | — | Bạn có thể dành thời gian thư giãn ở Nook Eatery. |
| Trưa | 11:30 | Bánh Khoái Lạc Thiện | ~7 phút | Bạn có thể dùng bữa tại Bánh Khoái Lạc Thiện. |
| Chiều | 13:00 | Chợ Đông Ba | ~5 phút | Chợ Đông Ba là một điểm dừng mua sắm trong lịch trình. |
| Chiều | 14:06 | Cà phê Tân | ~6 phút | Bạn có thể dành thời gian thư giãn ở Cà phê Tân. Bạn cũng quan tâm cà phê. |
| Tối | 17:30 | Chợ An Cựu | ~8 phút | Bạn có thể dành thời gian mua sắm tại Chợ An Cựu. |

##### Ngày 2 · 2026-11-02

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:08 | Mè Xửng Thiên Hương | — | Mè Xửng Thiên Hương là một điểm dừng mua sắm trong lịch trình. |
| Trưa | 11:30 | Cơm Hến Hoa Đông | ~9 phút | Bạn có thể dành một bữa ăn tại Cơm Hến Hoa Đông. |
| Chiều | 13:00 | Chùa Thiên Mụ | ~22 phút | Bạn có thể dành thời gian khám phá Chùa Thiên Mụ. |
| Chiều | 14:01 | Đại Nội Huế | ~16 phút | Đại Nội Huế là một điểm dừng thuộc nhóm di sản trong lịch trình. |

Cảnh báo:
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.

Khác biệt địa điểm: chỉ dự phòng — không có; chỉ pipeline/LLM — không có.
So sánh: bữa trưa theo khung noon 2 mục dự phòng / 2 mục pipeline; tổng di chuyển ước tính 73 / 73 phút; lý do khác văn bản ở 0 mục trùng địa điểm. Mức tự nhiên/chất lượng cần chủ dự án chấm.
Kiểm tra độc lập: ID thuộc dữ liệu published đã tải, không trùng, có giờ và bữa trưa theo mã kiểm tra báo cáo; validator pipeline V1–V10 giới hạn ID trong candidate pool gửi.
Gợi ý dữ kiện cần chủ dự án kiểm tra (heuristic):
- Không phát hiện số liệu/năm/URL lạ; không phải xác nhận ngữ nghĩa.

| Tiêu chí chấm | Điểm / ghi chú của chủ dự án |
|---|---|
| Đường đi hợp lý |  |
| Bữa trưa đúng |  |
| Giờ mở cửa đúng |  |
| Đa dạng |  |
| Lý do tự nhiên |  |
| Lý do có nêu dữ kiện không có trong dữ liệu địa điểm? |  |

### ADVERSARIAL-2 — Ghi chú đối kháng 2

Pool ứng viên: 12 / 57; thời gian: 2766 ms; generated_by=llm; model=gemini-3.5-flash-lite.
Calls=1; token input/output/thinking=1951/354/0; repairs=0; coverage=1; fallbackReason=—.

#### Dự phòng

##### Ngày 1 · 2026-11-01

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:37 | Đại Nội Huế | — | Bạn có thể ghé Đại Nội Huế như một điểm tham quan di sản. Dữ liệu đánh dấu nơi này phù hợp với gia đình có trẻ nhỏ. |
| Trưa | 11:30 | Bánh Ép Gia Di | ~13 phút | Bạn có thể dùng bữa tại Bánh Ép Gia Di. |
| Chiều | 13:00 | Cầu Trường Tiền | ~9 phút | Cầu Trường Tiền là một điểm ngắm cảnh trong lịch trình. |

Cảnh báo:
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.

#### LLM / kết quả pipeline

##### Ngày 1 · 2026-11-01

| Khung | Giờ đến | Địa điểm | Di chuyển | Lý do |
|---|---|---|---:|---|
| Sáng | 08:37 | Đại Nội Huế | — | Khám phá di sản hoàng cung Huế |
| Trưa | 11:30 | Bánh Khoái Lạc Thiện | ~6 phút | Thưởng thức bánh khoái Huế truyền thống |
| Chiều | 13:00 | Cầu Trường Tiền | ~5 phút | Ngắm cảnh sông Hương tại cầu Trường Tiền |
| Tối | 17:30 | Sông Hương | ~9 phút | Tận hưởng không gian sông nước buổi tối |

Cảnh báo:
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.
- MISSING_HOURS: Chưa có giờ mở cửa để kiểm tra.

Khác biệt địa điểm: chỉ dự phòng — Bánh Ép Gia Di; chỉ pipeline/LLM — Bánh Khoái Lạc Thiện, Sông Hương.
So sánh: bữa trưa theo khung noon 1 mục dự phòng / 1 mục pipeline; tổng di chuyển ước tính 22 / 20 phút; lý do khác văn bản ở 2 mục trùng địa điểm. Mức tự nhiên/chất lượng cần chủ dự án chấm.
Kiểm tra độc lập: ID thuộc dữ liệu published đã tải, không trùng, có giờ và bữa trưa theo mã kiểm tra báo cáo; validator pipeline V1–V10 giới hạn ID trong candidate pool gửi.
Gợi ý dữ kiện cần chủ dự án kiểm tra (heuristic):
- Không phát hiện số liệu/năm/URL lạ; không phải xác nhận ngữ nghĩa.

| Tiêu chí chấm | Điểm / ghi chú của chủ dự án |
|---|---|
| Đường đi hợp lý |  |
| Bữa trưa đúng |  |
| Giờ mở cửa đúng |  |
| Đa dạng |  |
| Lý do tự nhiên |  |
| Lý do có nêu dữ kiện không có trong dữ liệu địa điểm? |  |

## Tổng hợp

- Calls thật: 12/12; kịch bản chạy: 12/12.
- Token: input=50054, output=8597, thinking=0, tổng=58651.
- p50=3612 ms; p90=6890 ms; tỷ lệ fallback=58.3% (7/12).
- Không ước tính chi phí vì lượt này không đối chiếu giá hiện hành chính thức.
- Trung bình mỗi call: input=4171, output=716, thinking=0 token; tổng pool gửi=351 ứng viên, trung bình 142.6 input token/ứng viên (bao gồm prompt cố định), so với mốc cũ 236 token/ứng viên.

Bộ dò dữ kiện chỉ rà số liệu/năm không xuất hiện trong văn bản trường ứng viên và URL/HTML/Markdown; không phát hiện mọi tên riêng hay lỗi ngữ nghĩa.
