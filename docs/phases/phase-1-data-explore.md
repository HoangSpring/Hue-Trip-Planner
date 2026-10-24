# Phase 1 (M1) — Dữ liệu và khám phá

> Giao việc cho agent. Đọc `AGENTS.md` trước, rồi làm theo file này. Chi tiết từng task nằm ở `docs/09-roadmap-tasks.md`.

## Mục tiêu

Nhập ≥ 40 địa điểm qua CSV; xem `/`, `/explore`, `/place/:slug`, `/map` bằng dữ liệu thật.

## Đọc trước khi làm

- docs/02-features.md (F-01 → F-04)
- docs/05-data-model.md (mục 4–6, 8 (định dạng CSV))
- docs/06-api-spec.md (API đọc công khai)
- docs/04-routes-and-pages.md
- docs/08-stitch-ui-prompt.md (mục D)

## Tasks (làm theo thứ tự, mỗi task một PR)

| Task | Tên | Cỡ | Phụ thuộc |
|---|---|---|---|
| T-011 | CLI import CSV vào Supabase | M | T-003, T-004, T-010 |
| T-012 | Logic dùng chung cho đọc địa điểm (service + mapper) | M | T-005, T-011 |
| T-013 | API đọc dữ liệu công khai | M | T-012 |
| T-014 | Trang Landing (F-01) | M | T-007, T-013 |
| T-015 | Trang Khám phá (F-02) | M | T-007, T-013 |
| T-016 | Trang Chi tiết địa điểm (F-03) | M | T-007, T-013 |
| T-017 | Trang Bản đồ (F-04) | M | T-007, T-013 |

## Thiết kế tham chiếu (Stitch)

Thư mục: `docs/stitch/stitch_file_analysis_assistant/`. Chỉ để tham chiếu; dựng lại bằng React + Tailwind theo tokens ở `docs/08` mục D. Bố cục desktop: `docs/08` mục D5.

- **S01** — landing: `s01_landing_page_desktop`
- **S02** — khám phá: `s02_khampha_desktop`
- **S03** — chi tiết địa điểm: `s03_chitietdiadiem_desktop`
- **S04** — bản đồ: `s04_bando_desktop`

## Bỏ / không làm khi dựng giao diện

- S01: thanh tiến độ "Đã hoàn thành x/y địa điểm" (không có trong F-01); thẻ "Tiếp tục chuyến đi" chỉ cần tên chuyến đi + nút mở.
- Mọi ảnh trong mockup là ảnh giữ chỗ; dùng ảnh từ dữ liệu địa điểm kèm ghi công.
- Tên quán/địa điểm trong mockup (ví dụ "Quán Bún Bò Bà Tuyết") chỉ là mẫu, không đưa vào dữ liệu thật.
- S04: bản đồ trong mockup là hình vẽ; dùng bản đồ OSM thật (Leaflet/MapLibre), giữ ghi công OSM.
- Không thêm đánh giá sao, đặt vé, thanh toán, 3D.

Nếu thấy phần giao diện nào khác trong mockup mà không có trong `docs/02-features.md`: **bỏ qua và ghi vào tóm tắt PR**, hoặc hỏi chủ dự án.

## Chủ dự án cần chuẩn bị song song

- Nhập 40–60 địa điểm vào Google Sheet theo mẫu CSV (nút thắt lớn nhất, làm song song ngay từ đầu).
- Ảnh có giấy phép + ghi công cho từng địa điểm.

## Cổng kiểm tra cuối phase

≥ 40 địa điểm thật; 4 trang chạy bằng dữ liệu thật trên bản preview.

Khi xong: cập nhật `[ ]` → `[x]` trong `docs/09`, ghi thay đổi (nếu có) vào nhật ký mục 7, và báo cáo: đã làm gì, chưa làm gì, điểm nghi ngờ.

## Prompt dán cho agent

```text
Đọc AGENTS.md ở gốc repo, sau đó đọc docs/phases/phase-1-data-explore.md và docs/09-roadmap-tasks.md.
Nhiệm vụ: hoàn thành Phase 1 (T-011 → T-017).
- Làm lần lượt từng task chưa xong có đủ phụ thuộc; mỗi task một nhánh và một PR nhỏ.
- Trước mỗi task: đọc các tài liệu ở cột "Tham chiếu" của task đó.
- Giao diện: bám docs/stitch/ nhưng BỎ các mục ở phần "Bỏ / không làm khi dựng giao diện".
- Nếu tài liệu mơ hồ, mâu thuẫn, hoặc cần thứ chủ dự án chưa chuẩn bị: dừng và hỏi.
- Không làm tính năng ngoài danh sách; không làm 3D/bảo tàng số, khẩn cấp/hỗ trợ.
- Cuối mỗi task: chạy typecheck, lint, test; tick [x] trong docs/09; tóm tắt đã làm gì, file nào đổi, điều gì chưa làm.
- Khi xong cả phase (hoặc khi phải dừng giữa chừng): tạo `docs/reports/phase-1-report.md` theo mẫu `docs/reports/_template.md`, kèm đầu ra THẬT của typecheck, lint, test, build. Không ghi đã chạy nếu chưa chạy.
Bắt đầu bằng task đầu tiên chưa hoàn thành của Phase 1.
```
