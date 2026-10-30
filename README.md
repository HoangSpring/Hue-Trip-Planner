# Hue Trip Planner

Website giúp du khách **lên lịch trình du lịch Huế** theo sở thích: trả lời một wizard ngắn, nhận lịch trình theo ngày (kèm lý do gợi ý), chỉnh sửa trên bản đồ, lưu và chia sẻ bằng link.

> Tên sản phẩm là tên tạm, xem `docs/10-decisions.md` (D-01).

## Công nghệ

React + Vite + TypeScript + Tailwind · Hono trên Vercel Functions · Supabase (Postgres, Auth, Storage) · LLM gọi từ backend.

## Chạy Supabase Auth khi phát triển

Trong project Supabase dành cho development, mở **Authentication → Providers → Email** và tắt **Confirm email** để đăng ký/đăng nhập thử không phụ thuộc email xác nhận. Trong **Authentication → URL Configuration → Redirect URLs**, thêm cả hai địa chỉ:

- `http://127.0.0.1:5173/auth/callback`
- `http://localhost:5173/auth/callback`

Trước khi ra mắt, bật lại **Confirm email** và cấu hình SMTP riêng đã xác minh cho môi trường production. Chỉ khai báo domain production trong danh sách redirect production; giữ hai địa chỉ localhost cho development.

## Bắt đầu với AI agent

1. Đưa agent toàn bộ repo này. Agent đọc **`AGENTS.md`** đầu tiên.
2. Làm theo từng phase trong [`docs/phases/`](docs/phases/README.md): mỗi file có danh sách task, tài liệu cần đọc, phần thiết kế phải bỏ và **prompt dán sẵn**.
3. Chi tiết từng task, phụ thuộc và tiêu chí hoàn thành: [`docs/09-roadmap-tasks.md`](docs/09-roadmap-tasks.md).
4. Câu hỏi còn mở đã có quyết định mặc định: [`docs/10-decisions.md`](docs/10-decisions.md).

## Bản đồ tài liệu

| File | Nội dung |
|---|---|
| `AGENTS.md` | Quy tắc cho agent: stack, cấu trúc, lệnh, quy ước, bảo mật |
| `docs/01-product-brief.md` | Mục tiêu, đối tượng, phạm vi MVP |
| `docs/02-features.md` | Chức năng và tiêu chí nghiệm thu |
| `docs/03-user-flows.md` | Luồng người dùng |
| `docs/04-routes-and-pages.md` | Route, trang, phân quyền, SEO |
| `docs/05-data-model.md` | Bảng Supabase, RLS, CSV import |
| `docs/06-api-spec.md` | Đặc tả API |
| `docs/07-ai-itinerary-spec.md` | Thuật toán và AI sinh lịch trình |
| `docs/08-stitch-ui-prompt.md` | Tokens, component, quy tắc giao diện, prompt Stitch |
| `docs/09-roadmap-tasks.md` | 52 task theo mốc M0–M6 |
| `docs/10-decisions.md` | Quyết định mặc định |
| `docs/phases/` | Bàn giao theo phase (kèm prompt) |
| `docs/reports/` | Báo cáo của agent sau mỗi phase (mẫu: `_template.md`) |
| `docs/stitch/` | Thiết kế tham chiếu từ Stitch (HTML + ảnh) |

## Ngoài phạm vi

Trải nghiệm 3D/bảo tàng số và trang khẩn cấp/hỗ trợ **không làm**.
