# 10 — Quyết định mặc định cho các câu hỏi còn mở

> Mọi câu hỏi "còn mở" ở cuối các file `docs/` đã có một **quyết định mặc định** ở đây để agent không bị chặn. Agent **làm theo mặc định**; chỉ dừng lại hỏi ở các mục ghi **"Cần chủ dự án"**.
> Chủ dự án muốn đổi: sửa dòng tương ứng trong file này (và ghi ngày), agent sẽ theo bản mới.

## Cách đọc

- **Trạng thái:** `Mặc định` = agent tự làm theo; `Cần chủ dự án` = phải có câu trả lời trước một task cụ thể (cột "Cần trước").
- Mã `D-xx` dùng để tham chiếu trong PR và commit.

## A. Sản phẩm và nội dung

| Mã | Câu hỏi | Quyết định mặc định | Trạng thái | Cần trước |
|---|---|---|---|---|
| D-01 | Tên sản phẩm | Tên tạm **"Hue Trip Planner"**. Mockup Stitch đang ghi "Cổ Đô". **Không viết cứng**: đặt tên, slogan, logo, mô tả SEO trong `src/lib/brand.ts` để đổi một chỗ | Mặc định (không chặn) | Ra mắt (T-052) |
| D-02 | Loại địa điểm trong MVP | 5 loại: `heritage`, `food`, `cafe`, `sightseeing`, `shopping`. **Lưu trú không phải loại địa điểm**; điểm xuất phát lấy từ bảng `start_points` | Mặc định | — |
| D-03 | Phân biệt bữa sáng/trưa/tối | Giữ 4 giá trị `meal_type`: `breakfast`, `lunch`, `dinner`, `snack`. Chỉ **bữa trưa bắt buộc** trong lịch trình | Mặc định | — |
| D-04 | Giọng văn | Thân thiện, xưng "bạn", câu ngắn (xem `docs/08` mục D3) | Mặc định | — |
| D-05 | Thu thập email để gửi lịch trình | **Không** ở MVP | Mặc định | — |
| D-06 | Danh sách tag sở thích | 10 tag ở `docs/05` mục 6.1. Ảnh thẻ tag: ảnh giữ chỗ nội bộ cho đến khi có ảnh có giấy phép | Mặc định | — |
| D-07 | Cẩm nang `/hue` | **Không** có trong MVP (giai đoạn 2, F-26) | Mặc định | — |
| D-08 | Thêm địa điểm tùy ý (ngoài DB) vào lịch trình | **Không** ở MVP | Mặc định | — |
| D-09 | Dữ liệu ban đầu | 40–60 địa điểm do chủ dự án nhập qua CSV (T-011). Agent chỉ tạo file mẫu và fixture, **không tự bịa địa điểm thật** | Cần chủ dự án | M1 (T-017) |

## B. AI và lịch trình

| Mã | Câu hỏi | Quyết định mặc định | Trạng thái | Cần trước |
|---|---|---|---|---|
| D-10 | Nhà cung cấp và model LLM | **Chưa chọn.** Phase 0–2 không cần LLM. Agent chỉ viết interface `LlmClient`, `FakeLlmClient` và provider theo biến môi trường khi đã có lựa chọn | **Cần chủ dự án** | T-029 |
| D-11 | Khách (chưa đăng nhập) dùng LLM | **Có**, giới hạn 3 lần/giờ, 6 lần/ngày (`docs/06` mục 2.8); user 10 lần/giờ, 30 lần/ngày. Chỉnh bằng biến môi trường | Mặc định | — |
| D-12 | Bữa tối bắt buộc | **Không**; chỉ bắt buộc bữa trưa | Mặc định | — |
| D-13 | Địa điểm chưa `verified` | Chỉ **trừ điểm**, không loại. Xem lại sau khi chấm chất lượng (T-033) | Mặc định | — |
| D-14 | Ngưỡng/tốc độ di chuyển | Dùng bảng ở `docs/07` mục 9.3 (motorbike 25 km/h, hệ số 1,3...). Chủ dự án hiệu chỉnh khi chấm chất lượng | Mặc định, cần hiệu chỉnh | T-033 |
| D-15 | Giới hạn số chuyến đi mỗi user | 50 (`MAX_TRIPS_PER_USER`) | Mặc định | — |
| D-16 | Hoàn tác | Tối thiểu **1 bước** (reducer có thể mở rộng sau) | Mặc định | — |
| D-17 | Xuất PDF/ICS | **Không** ở MVP (giai đoạn 2, F-24) | Mặc định | — |

## C. Kỹ thuật

| Mã | Câu hỏi | Quyết định mặc định | Trạng thái | Cần trước |
|---|---|---|---|---|
| D-18 | Gói quản lý package, Node | `pnpm`; Node bản LTS hiện hành (ghi trong `package.json` `engines` và `.nvmrc`) | Mặc định | — |
| D-19 | Thư viện bản đồ | **Leaflet** (`react-leaflet`) + gom cụm marker. URL tile đặt trong `VITE_MAP_TILE_URL` (có mặc định để chạy dev). Luôn hiển thị ghi công OSM | Mặc định | — |
| D-20 | Nhà cung cấp tile cho production | **Chưa chọn.** Kiểm tra chính sách sử dụng tile của OpenStreetMap trước khi ra mắt; nếu lưu lượng không phù hợp thì chọn nhà cung cấp tile khác | **Cần chủ dự án** | T-052 |
| D-21 | Đăng nhập Google | Email + mật khẩu là **bắt buộc**; Google làm ở T-037 nếu cấu hình được, không chặn các task khác | Mặc định | — |
| D-22 | Xác nhận email khi đăng ký | **Bật** (mặc định Supabase); giao diện có màn "Kiểm tra email" | Mặc định | — |
| D-23 | Phân trang `/explore` | **Phân trang theo trang** (`?page=`), 24 địa điểm/trang. Nếu thiết kế dùng nút "Xem thêm" thì làm theo thiết kế nhưng vẫn đồng bộ `page` trên URL | Mặc định | — |
| D-24 | Meta cho bot mạng xã hội | **Vercel function** (rewrite theo user-agent, `docs/06` mục 12), không dùng prerender | Mặc định | T-046 |
| D-25 | PostGIS | **Không** ở MVP; dùng công thức Haversine và RPC `nearby_places` | Mặc định | — |
| D-26 | Lưu `previewToken` khi import CSV | **Gửi lại CSV khi commit** (≤ 2 MB) và kiểm tra lại từ đầu; không thêm hạ tầng | Mặc định | — |
| D-27 | Tài khoản admin đầu tiên | Gán thủ công `role = 'admin'` bằng SQL sau khi chủ dự án đăng ký tài khoản | **Cần chủ dự án** | T-052 |

## D. Kế hoạch

| Mã | Câu hỏi | Quyết định mặc định | Trạng thái | Cần trước |
|---|---|---|---|---|
| D-28 | Thứ tự M4 và M5 | Giữ **M4 trước M5**. CLI import (T-011) đủ để nhập dữ liệu trong lúc chờ trang admin | Mặc định | — |
| D-29 | Demo cho người dùng thử | **Có**, ngay sau cổng M2 (chưa cần LLM, chưa cần đăng nhập) | Mặc định | — |
| D-30 | Ngày ra mắt / cắt giảm | Chưa đặt ngày. Nếu cần cắt: F-10, F-11, F-13 trước | Mặc định | — |
| D-31 | Phạm vi desktop trong thiết kế | Đã có bản desktop cho S01–S04, S07, S12, S15, S17, S18–S21; màn còn lại dựng responsive từ bản mobile | Đã chốt | — |

## Nhật ký thay đổi quyết định

| Ngày | Mã | Thay đổi | Lý do |
|---|---|---|---|
| | | | |
