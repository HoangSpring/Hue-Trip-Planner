# Báo cáo Phase 6A — Hoàn thiện và ra mắt

Ngày kiểm tra: 2026-11-08 (Asia/Saigon).

## 1. Tóm tắt

Đã triển khai metadata SEO/OG/sitemap/robots cho T-046 và hai trang tĩnh cho T-047 trên các commit riêng. T-048 có audit axe và một vòng tối ưu ảnh/tương phản, nhưng chưa đạt ngưỡng Lighthouse; cả ba task vẫn chưa đủ điều kiện nghiệm thu nên checkbox trong roadmap được giữ nguyên.

Không áp dụng migration, không ghi dữ liệu Supabase, không push.

## 2. Task

| Task | Nhánh / commit | Trạng thái nghiệm thu | Ghi chú |
|---|---|---|---|
| T-046 | `feat/T-046-seo-sitemap` / `6a19167` | Một phần | Sitemap và metadata có; cần xác nhận preview Facebook/Zalo trên deployment thật. |
| T-047 | `feat/T-047-static-pages` / `953b0c3` | Một phần | Trang About/Privacy có; bản chính sách cần chủ dự án duyệt và cần cấu hình đầu mối liên hệ. |
| T-048 | `feat/T-048-a11y-performance` | Một phần | Axe không còn lỗi critical/serious theo audit; chưa đạt Lighthouse và còn thiếu kiểm tra bàn phím thủ công. |

## 3. Chưa hoàn thành

| Task | Còn thiếu | Lý do |
|---|---|---|
| T-046 | Kiểm tra preview Facebook/Zalo và bot rewrite trên deployment | Không deploy trong phạm vi lượt này. |
| T-047 | Chủ dự án duyệt nội dung pháp lý; cung cấp contact channel | Nội dung chính sách còn là dự thảo; contact chưa cấu hình. |
| T-048 | LCP mobile trang chủ ≤ 2.5s, CLS ≤ 0.1 trên các trang đo; bàn phím/focus audit | Số đo Lighthouse còn vượt ngưỡng; kiểm tra bàn phím thủ công chưa thực hiện. |

## 4. Lệnh và kết quả thật

Các lệnh dưới đây đã chạy trong phiên làm việc; pnpm store lock từng trả `ERR_PNPM_STORE_DIR_OPEN_OPERATION_LOCK` / `Access is denied` trong sandbox. Chạy lại ngoài sandbox theo hướng dẫn AGENTS.md đã cho kết quả thực tế bên dưới. Đây là lỗi môi trường, không phải lỗi mã.

| Lệnh | Đầu ra rút gọn |
|---|---|
| `pnpm install --frozen-lockfile` | `Already up to date; Done in 195ms` |
| `pnpm typecheck` | `$ tsc --noEmit` — exit 0 |
| `pnpm lint` | `$ eslint .` — exit 0 |
| `pnpm test -- --reporter=dot` | `56 files passed; 328 tests passed` — exit 0. Có cảnh báo JSDOM `Window's scrollTo()` không được triển khai. |
| `pnpm build` | Vite build thành công; có cảnh báo Rollup về vị trí comment `@__PURE__` trong dependency Zod. |
| `pnpm smoke:api` | 10 đạt, 0 lỗi, 0 bỏ qua; bao gồm meta, phân trang places, category sai, map, nearby, slug thiếu, sitemap, OG place, share token không hợp lệ, draft 404. Dữ liệu đọc: 55 published. |
| `pnpm eval:itinerary` | 10 kịch bản; 55 published, 55 đủ điều kiện, 0 bị loại do thiếu trường bắt buộc. So sánh fallback V1→V2: thiếu trưa 11→0; dưới sàn 12→0; cảnh báo 80→86. |
| `pnpm smoke:trips` | 17 đạt, 0 lỗi, 0 bỏ qua; dữ liệu trip thử đã được dọn. |
| `pnpm smoke:admin` | Không chạy trong lượt này vì có thao tác ghi/xóa địa điểm. Chủ dự án cung cấp đầu ra lần chạy: 8 đạt, 0 lỗi, 0 bỏ qua; cuối lượt còn 0 dòng `zz-test-*`. |
| `pnpm a11y:audit` | Lần chạy cuối exit 0: 20 tổ hợp desktop/mobile, `critical=0; serious=0`. |

Lighthouse chi tiết được lưu trong [a11y-perf.md](a11y-perf.md). Kết quả cho thấy ngưỡng T-048 chưa đạt.

## 5. Cổng phase

- [ ] Preview SEO/OG được xác nhận bằng Facebook/Zalo trên deployment.
- [ ] Chính sách quyền riêng tư được chủ dự án duyệt.
- [ ] Không còn lỗi a11y nghiêm trọng trong audit đã chạy; cần hoàn tất kiểm tra bàn phím.
- [ ] Ngưỡng LCP/CLS của T-048 đạt.
- [x] Không deploy, không áp dụng migration trong lượt này.

## 6. Khác biệt so với tài liệu

Không thay đổi phạm vi tính năng. Audit hiện dùng route đại diện ở hai kích thước; route cần đăng nhập hoặc token hợp lệ chuyển về trang an toàn, do đó chưa chứng minh accessibility của trạng thái authenticated.

## 7. Điểm nghi ngờ và nợ kỹ thuật

- Trang chủ mobile LCP 7.673s dù ảnh hero đã preload và chuyển động ảnh đã bỏ; chưa xác định chính xác nguyên nhân.
- CLS trang chi tiết địa điểm: 0.580 mobile, 0.200 desktop; Explore desktop: 0.380.
- Rewrite bot trong `vercel.json` cần xác minh trên deployment thật; `vercel dev` không mô phỏng điều kiện header `has` đầy đủ.
- Thay đổi T-048 có phần nằm trong các file giao diện đang chứa chỉnh sửa người dùng từ trước; các chỉnh sửa đó được giữ nguyên và không được xem là commit T-048 nếu chưa được stage riêng.

## 8. Cần chủ dự án

- Duyệt nội dung trang quyền riêng tư và cung cấp địa chỉ/kênh liên hệ.
- Sau deployment, xác nhận OG bằng Facebook Sharing Debugger và Zalo.
- Chạy lại audit Lighthouse sau khi xử lý CLS và LCP; tự tick roadmap theo kết quả nghiệm thu.

## 9. Cách chạy thử

- `pnpm dev` và `pnpm dev:api` để thử cục bộ.
- `pnpm smoke:api`, `pnpm a11y:audit`.
- `pnpm build` rồi `pnpm preview` để thử production preview.
- Dùng URL deployment trên Facebook Sharing Debugger/Zalo để kiểm tra OG.
