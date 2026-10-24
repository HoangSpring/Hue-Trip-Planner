# Phase 0 (M0) — Nền móng

> Giao việc cho agent. Đọc `AGENTS.md` trước, rồi làm theo file này. Chi tiết từng task nằm ở `docs/09-roadmap-tasks.md`.

## Mục tiêu

Repo chạy được với CI, database + RLS, API khung, layout/router và design tokens, bộ component dùng chung.

## Đọc trước khi làm

- AGENTS.md (toàn bộ)
- docs/01-product-brief.md
- docs/05-data-model.md
- docs/06-api-spec.md (mục 1–5, 13)
- docs/04-routes-and-pages.md
- docs/08-stitch-ui-prompt.md (mục D)

## Tasks (làm theo thứ tự, mỗi task một PR)

| Task | Tên | Cỡ | Phụ thuộc |
|---|---|---|---|
| T-001 | Khởi tạo repo và công cụ | S | — |
| T-002 | CI và quy ước PR | S | T-001 |
| T-003 | Thiết lập Supabase và migration nền | M | T-001 |
| T-004 | Zod schema và kiểu dùng chung | M | T-001 |
| T-005 | API khung (Hono trên Vercel) | M | T-001, T-004 |
| T-006 | Layout, router và design tokens | M | T-001 |
| T-007 | Bộ component giao diện dùng chung | M | T-006 |
| T-008 | Tích hợp Supabase Auth ở client | S | T-003, T-006 |
| T-009 | Thư viện hàm thuần cho lịch trình (phần 1) | M | T-004 |
| T-010 | Mẫu CSV và bộ dữ liệu test | S | T-004 |

## Thiết kế tham chiếu (Stitch)

Thư mục: `docs/stitch/stitch_file_analysis_assistant/`. Chỉ để tham chiếu; dựng lại bằng React + Tailwind theo tokens ở `docs/08` mục D. Bố cục desktop: `docs/08` mục D5.

- Design system: `docs/stitch/stitch_file_analysis_assistant/hue_imperial_editorial/DESIGN.md`
- **S21** — trang lỗi 404/500/403 cho `NotFoundPage`, `ErrorPage`, `ForbiddenPage`: `s21_trangthaihethong_trangtinh_desktop`

## Bỏ / không làm khi dựng giao diện

- Không dựng trang nghiệp vụ nào (chỉ trang tạm).
- Tokens lấy từ DESIGN.md (phông tiêu đề Source Serif 4, không phải Lora).

Nếu thấy phần giao diện nào khác trong mockup mà không có trong `docs/02-features.md`: **bỏ qua và ghi vào tóm tắt PR**, hoặc hỏi chủ dự án.

## Chủ dự án cần chuẩn bị song song

- Tạo project Supabase và cung cấp URL + khóa (T-003).
- Chốt tên sản phẩm/logo (cần trước T-006). Tên tạm: `hue-trip-planner`; mockup đang ghi "Cố Đô — Hue Trip Planner".

## Cổng kiểm tra cuối phase

Mọi route trong `docs/04` điều hướng được (trang tạm); CI xanh; test RLS qua; `pnpm dev` chạy.

Khi xong: cập nhật `[ ]` → `[x]` trong `docs/09`, ghi thay đổi (nếu có) vào nhật ký mục 7, và báo cáo: đã làm gì, chưa làm gì, điểm nghi ngờ.

## Prompt dán cho agent

```text
Đọc AGENTS.md ở gốc repo, sau đó đọc docs/phases/phase-0-foundation.md và docs/09-roadmap-tasks.md.
Nhiệm vụ: hoàn thành Phase 0 (T-001 → T-010).
- Làm lần lượt từng task chưa xong có đủ phụ thuộc; mỗi task một nhánh và một PR nhỏ.
- Trước mỗi task: đọc các tài liệu ở cột "Tham chiếu" của task đó.
- Giao diện: bám docs/stitch/ nhưng BỎ các mục ở phần "Bỏ / không làm khi dựng giao diện".
- Nếu tài liệu mơ hồ, mâu thuẫn, hoặc cần thứ chủ dự án chưa chuẩn bị: dừng và hỏi.
- Không làm tính năng ngoài danh sách; không làm 3D/bảo tàng số, khẩn cấp/hỗ trợ.
- Cuối mỗi task: chạy typecheck, lint, test; tick [x] trong docs/09; tóm tắt đã làm gì, file nào đổi, điều gì chưa làm.
- Khi xong cả phase (hoặc khi phải dừng giữa chừng): tạo `docs/reports/phase-0-report.md` theo mẫu `docs/reports/_template.md`, kèm đầu ra THẬT của typecheck, lint, test, build. Không ghi đã chạy nếu chưa chạy.
Bắt đầu bằng task đầu tiên chưa hoàn thành của Phase 0.
```
