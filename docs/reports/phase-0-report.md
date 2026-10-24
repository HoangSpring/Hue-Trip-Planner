# Báo cáo Phase 0 — Nền móng

> Cập nhật ngày 24/10/2026. Báo cáo dừng giữa phase vì chưa có project Supabase và quyền GitHub integration không cho tạo PR.

## 1. Tóm tắt

Đã dựng scaffold React/Vite, CI, schema Zod dùng chung, API Hono khung, router/layout/tokens, component UI, thư viện lịch trình thuần và dữ liệu mẫu CSV/JSON. Typecheck, lint, 21 test và production build đều qua; Vite chạy cục bộ và trả 200 cho `/` và `/dev/components`. Phase chưa đạt cổng cuối do chưa có Supabase để tạo/chạy migration và test RLS, chưa tích hợp Supabase Auth, CI chưa được xác nhận trên PR, và API chưa triển khai Vercel preview. Các task đã làm nằm trên nhánh riêng và đã push; tạo PR trả lỗi GitHub API 403.

## 2. Task đã hoàn thành

| Task | Nhánh / PR / commit | Đã đạt "Hoàn thành khi"? | Ghi chú |
|---|---|---|---|
| T-001 | `feat/T-001-bootstrap` · `3416b7e` · đã push | Có | Scaffold React/Vite, TypeScript strict, Tailwind, router/query/Zod, scripts, alias, cấu trúc, Vitest/Playwright config. |
| T-004 | `feat/T-004-shared-schemas` · `f70b11f` · đã push | Có | Zod schema dùng chung và test giới hạn TripInput. |
| T-006 | `feat/T-006-router-layout` · `26428a1` · đã push | Một phần | Route/layout/guard và tokens đã dựng; còn thiếu kiểm tra điều hướng mọi route và rà soát 360px trên trình duyệt. |
| T-007 | `feat/T-007-ui-components` · `6cc8f6b` · đã push | Có | Component dùng chung, chuỗi tiếng Việt và gallery chỉ bật trong dev. |
| T-009 | `feat/T-009-itinerary-utils` · `397e9f6` · đã push | Có | Haversine, giờ mở cửa VN, qua nửa đêm, travel estimate và test. |
| T-010 | `feat/T-010-sample-place-data` · `a6dc2d1` · đã push | Có | CSV 20 dòng giả lập, fixture 40 dòng giả lập, test schema/edge cases. Không chứa địa điểm thật được xác minh. |

## 3. Task chưa xong hoặc làm một phần

| Task | Còn thiếu gì | Lý do |
|---|---|---|
| T-002 | CI xanh trên một PR thử; xác nhận thử nghiệm secret giả | Không tạo được PR qua GitHub integration (403). File workflow và PR template đã có; `.gitignore` loại trừ `.env*` thật. |
| T-003 | Project/CLI, migration 1–7, seed SQL, migrate/types và test RLS | Chủ dự án xác nhận chưa tạo project Supabase và yêu cầu tiếp tục các task độc lập. Không có DB để chạy nghiệm thu. |
| T-005 | Vercel preview và kiểm tra `/api/health` trên preview | Chưa triển khai Vercel. API khung và test middleware cục bộ đã có. |
| T-008 | Supabase client, `useSession`, `useProfile` và đăng nhập bằng tài khoản test | Phụ thuộc T-003 chưa xong và thiếu Supabase project. |

Các PR chưa được tạo. GitHub API trả `403 Resource not accessible by integration` khi tạo PR; nhánh task đã push thành công để review thủ công hoặc tạo PR sau khi quyền integration được khắc phục. T-002 đến T-010 là các nhánh nối tiếp theo thứ tự dependency; T-003/T-008 không có nhánh vì chưa thể bắt đầu phần phụ thuộc dịch vụ.

## 4. Kết quả chạy lệnh

Ngày chạy cuối: 24/10/2026, khoảng 09:29–09:30 giờ Việt Nam.

| Lệnh | Kết quả | Đầu ra thật |
|---|---|---|
| `pnpm install --frozen-lockfile --offline` | Qua | `Already up to date` · `Done in 1.1s using pnpm v11.25.0` |
| `pnpm typecheck` | Qua | `$ tsc --noEmit` · exit code 0 |
| `pnpm lint` | Qua | `$ eslint .` · exit code 0 |
| `pnpm test` | Qua | `Test Files 5 passed (5)` · `Tests 21 passed (21)` · exit code 0 |
| `pnpm build` | Qua | `✓ 217 modules transformed.` · `✓ built in 13.29s` · exit code 0. Rollup cảnh báo hai comment `@__PURE__` trong Zod sẽ bị bỏ; build vẫn thành công. |
| `pnpm dev --host 127.0.0.1 --port 5173` | Qua | `VITE v6.4.1 ready in 756 ms` · `Local: http://127.0.0.1:5173/` |
| HTTP smoke `/` và `/dev/components` | Qua | Cả hai trả `200` bằng `Invoke-WebRequest`. |
| Supabase migration/RLS | Chưa chạy | Không có project Supabase. |
| Vercel preview / CI trên GitHub PR | Chưa chạy | Không có PR; GitHub API từ chối tạo PR với HTTP 403. |

## 5. Cổng kiểm tra cuối phase

- [x] Repo cài dependency theo lockfile, `pnpm dev` chạy và trang chính phản hồi 200.
- [x] Typecheck, lint, test và build cục bộ qua.
- [ ] Mọi route được kiểm tra điều hướng trên preview; đã khai báo route và trang placeholder, nhưng chưa có lượt E2E/preview xác nhận tất cả.
- [ ] CI xanh trên PR.
- [ ] Database/migration và test RLS qua.
- [ ] Tích hợp Supabase Auth hoàn chỉnh.
- [ ] API chạy trên Vercel preview và `/api/health` trả 200.

## 6. Khác biệt so với tài liệu

- T-010 dùng tên và mô tả giả lập, không gán thông tin giả cho địa điểm Huế có thật; phù hợp D-09.
- Kiểm tra fixture đặt ở `shared/itinerary/sampleData.test.ts` vì cấu hình Vitest hiện chỉ thu thập test trong `src/`, `shared/`, `server/`; tệp dữ liệu vẫn ở `tests/fixtures/places.sample.json`. Ghi chú đã thêm vào nhật ký mục 7 của `docs/09-roadmap-tasks.md`.
- Tên sản phẩm dùng giá trị tạm tập trung trong `src/lib/brand.ts` theo D-01; chưa có logo chính thức.
- Không dựng trang nghiệp vụ hoặc phần mockup ngoài phạm vi Phase 0.

## 7. Điểm nghi ngờ, rủi ro, nợ kỹ thuật

- Các nhánh T-004 trở đi được xếp nối tiếp để đáp ứng dependency; khi tạo PR thủ công, dùng nhánh task ngay trước làm base để mỗi diff chỉ chứa task tương ứng.
- Auth provider hiện là stub khách ẩn danh cho router/guard; cần thay bằng Supabase Auth ở T-008.
- Hằng số tốc độ và giới hạn chặng đi theo tài liệu mặc định, cần người địa phương hiệu chỉnh như D-14.
- Đã kiểm tra HTTP 200 ở trang gốc và gallery; chưa chạy E2E trình duyệt cho tất cả route hoặc rà soát trực quan toàn bộ layout ở 360px.

## 8. Cần chủ dự án

- Tạo project Supabase và cấu hình URL/anon key trong `.env.local`; không gửi service-role key qua chat. Sau đó mới có thể hoàn tất T-003, T-008, migration/RLS và đăng nhập thử.
- Khắc phục quyền GitHub integration để agent có thể tạo các PR riêng từ nhánh đã push.
- Chọn logo chính thức trước giai đoạn ra mắt; tên tạm hiện không chặn Phase 0.

## 9. Cách chạy thử

1. Cài dependency: `pnpm install --frozen-lockfile`.
2. Kiểm tra mã: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.
3. Chạy frontend: `pnpm dev`; mở `http://localhost:5173/`.
4. Khi dùng dev server, mở `/dev/components` để xem gallery component.
5. Không chạy migration/Auth trước khi project Supabase được cấu hình.
