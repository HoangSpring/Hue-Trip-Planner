# Phase 5 (M5) — Quản trị

> Giao việc cho agent. Đọc `AGENTS.md` trước, rồi làm theo file này. Chi tiết từng task nằm ở `docs/09-roadmap-tasks.md`.

## Mục tiêu

Trang admin quản lý địa điểm và import CSV có xem trước.

## Đọc trước khi làm

- docs/02-features.md (F-12)
- docs/03-user-flows.md (FL-08)
- docs/06-api-spec.md (mục 9)
- docs/05-data-model.md (mục 8 định dạng CSV, RLS)

## Tasks (làm theo thứ tự, mỗi task một PR)

| Task | Tên | Cỡ | Phụ thuộc |
|---|---|---|---|
| T-043 | API quản trị địa điểm | L | T-012, T-005 |
| T-044 | Trang quản trị: danh sách và form địa điểm | L | T-043, T-006 |
| T-045 | Import CSV có xem trước (giao diện + API) | L | T-043, T-011 |

## Thiết kế tham chiếu (Stitch)

Thư mục: `docs/stitch/stitch_file_analysis_assistant/`. Chỉ để tham chiếu; dựng lại bằng React + Tailwind theo tokens ở `docs/08` mục D. Bố cục desktop: `docs/08` mục D5.

- **S18** — danh sách địa điểm: `s18_admin_quanlydiadiem_desktop`
- **S19** — form địa điểm: `s19_admin_form_diadiem_desktop`
- **S20** — import CSV 3 bước: `s20_admin_import_csv_desktop`

## Bỏ / không làm khi dựng giao diện

- Bỏ mục "Thống kê & Lịch trình" và "Cài đặt hệ thống" ở thanh bên.
- Bỏ chỉ báo "Hệ thống: Trực tuyến", chuông thông báo, các thẻ thống kê.
- Giữ: danh sách, bộ lọc, thao tác hàng loạt, form địa điểm, tải ảnh, import CSV.
- Không ghi đè địa điểm `verified` nếu không chọn rõ.

Nếu thấy phần giao diện nào khác trong mockup mà không có trong `docs/02-features.md`: **bỏ qua và ghi vào tóm tắt PR**, hoặc hỏi chủ dự án.

## Chủ dự án cần chuẩn bị song song

- Danh sách email tài khoản admin ban đầu (gán `role = 'admin'` thủ công).

## Cổng kiểm tra cuối phase

Người không rành kỹ thuật thêm/sửa/duyệt địa điểm và import CSV mà không đụng DB.

Khi xong: cập nhật `[ ]` → `[x]` trong `docs/09`, ghi thay đổi (nếu có) vào nhật ký mục 7, và báo cáo: đã làm gì, chưa làm gì, điểm nghi ngờ.

## Prompt dán cho agent

```text
Đọc AGENTS.md ở gốc repo, sau đó đọc docs/phases/phase-5-admin.md và docs/09-roadmap-tasks.md.
Nhiệm vụ: hoàn thành Phase 5 (T-043 → T-045).
- Làm lần lượt từng task chưa xong có đủ phụ thuộc; mỗi task một nhánh và một PR nhỏ.
- Trước mỗi task: đọc các tài liệu ở cột "Tham chiếu" của task đó.
- Giao diện: bám docs/stitch/ nhưng BỎ các mục ở phần "Bỏ / không làm khi dựng giao diện".
- Nếu tài liệu mơ hồ, mâu thuẫn, hoặc cần thứ chủ dự án chưa chuẩn bị: dừng và hỏi.
- Không làm tính năng ngoài danh sách; không làm 3D/bảo tàng số, khẩn cấp/hỗ trợ.
- Cuối mỗi task: chạy typecheck, lint, test; tick [x] trong docs/09; tóm tắt đã làm gì, file nào đổi, điều gì chưa làm.
- Khi xong cả phase (hoặc khi phải dừng giữa chừng): tạo `docs/reports/phase-5-report.md` theo mẫu `docs/reports/_template.md`, kèm đầu ra THẬT của typecheck, lint, test, build. Không ghi đã chạy nếu chưa chạy.
Bắt đầu bằng task đầu tiên chưa hoàn thành của Phase 5.
```
