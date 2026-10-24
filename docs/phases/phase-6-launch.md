# Phase 6 (M6) — Hoàn thiện và ra mắt

> Giao việc cho agent. Đọc `AGENTS.md` trước, rồi làm theo file này. Chi tiết từng task nằm ở `docs/09-roadmap-tasks.md`.

## Mục tiêu

SEO/Open Graph, trang tĩnh, a11y, hiệu năng, e2e, bảo mật, giám sát, triển khai production.

## Đọc trước khi làm

- docs/02-features.md (F-13, F-14, mục phi chức năng)
- docs/04-routes-and-pages.md (SEO)
- docs/09-roadmap-tasks.md (mục 5, checklist ra mắt)
- AGENTS.md mục 9

## Tasks (làm theo thứ tự, mỗi task một PR)

| Task | Tên | Cỡ | Phụ thuộc |
|---|---|---|---|
| T-046 | SEO, Open Graph và sitemap | M | T-014, T-016, T-042 |
| T-047 | Trang tĩnh (F-13) | S | T-006 |
| T-048 | Rà soát truy cập (a11y) và hiệu năng | M | M2 trở đi |
| T-049 | Kiểm thử end-to-end (Playwright) | M | M4 |
| T-050 | Rà soát bảo mật | M | M4, M5 |
| T-051 | Giám sát và vận hành | S | T-032 |
| T-052 | Triển khai production | M | T-046 → T-051 xong |

## Thiết kế tham chiếu (Stitch)

Thư mục: `docs/stitch/stitch_file_analysis_assistant/`. Chỉ để tham chiếu; dựng lại bằng React + Tailwind theo tokens ở `docs/08` mục D. Bố cục desktop: `docs/08` mục D5.

- **S21** — trang tĩnh, trạng thái hệ thống: `s21_trangthaihethong_trangtinh_desktop`

## Bỏ / không làm khi dựng giao diện

- Không thêm trang khẩn cấp/hỗ trợ.
- Nội dung chính sách bảo mật do chủ dự án duyệt; agent chỉ dựng khung và bản nháp.

Nếu thấy phần giao diện nào khác trong mockup mà không có trong `docs/02-features.md`: **bỏ qua và ghi vào tóm tắt PR**, hoặc hỏi chủ dự án.

## Chủ dự án cần chuẩn bị song song

- Duyệt chính sách bảo mật (có thể cần tư vấn pháp lý).
- Tên miền, tài khoản Vercel/Supabase production.
- Thử trên điện thoại thật (iOS Safari, Android Chrome).

## Cổng kiểm tra cuối phase

Checklist ra mắt (`docs/09` mục 5) hoàn tất; luồng chính chạy trên domain thật.

Khi xong: cập nhật `[ ]` → `[x]` trong `docs/09`, ghi thay đổi (nếu có) vào nhật ký mục 7, và báo cáo: đã làm gì, chưa làm gì, điểm nghi ngờ.

## Prompt dán cho agent

```text
Đọc AGENTS.md ở gốc repo, sau đó đọc docs/phases/phase-6-launch.md và docs/09-roadmap-tasks.md.
Nhiệm vụ: hoàn thành Phase 6 (T-046 → T-052).
- Làm lần lượt từng task chưa xong có đủ phụ thuộc; mỗi task một nhánh và một PR nhỏ.
- Trước mỗi task: đọc các tài liệu ở cột "Tham chiếu" của task đó.
- Giao diện: bám docs/stitch/ nhưng BỎ các mục ở phần "Bỏ / không làm khi dựng giao diện".
- Nếu tài liệu mơ hồ, mâu thuẫn, hoặc cần thứ chủ dự án chưa chuẩn bị: dừng và hỏi.
- Không làm tính năng ngoài danh sách; không làm 3D/bảo tàng số, khẩn cấp/hỗ trợ.
- Cuối mỗi task: chạy typecheck, lint, test; tick [x] trong docs/09; tóm tắt đã làm gì, file nào đổi, điều gì chưa làm.
- Khi xong cả phase (hoặc khi phải dừng giữa chừng): tạo `docs/reports/phase-6-report.md` theo mẫu `docs/reports/_template.md`, kèm đầu ra THẬT của typecheck, lint, test, build. Không ghi đã chạy nếu chưa chạy.
Bắt đầu bằng task đầu tiên chưa hoàn thành của Phase 6.
```
