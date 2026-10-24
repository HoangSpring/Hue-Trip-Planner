# Báo cáo Phase 0 — Nền móng

> Cập nhật ngày 24/10/2026, sau khi kiểm tra lại working tree và chạy lại các lệnh. Phase 0 chưa đạt cổng cuối; không bắt đầu Phase 1.

## 1. Tóm tắt

Đã sửa harness của router test để mô phỏng điều hướng createMemoryRouter trong jsdom; toàn bộ 52 test hiện qua, gồm 31 trường hợp router cho các route và guard trong docs/04. Typecheck, lint và build cũng qua. Đã rà soát tĩnh bảy migration, seed và bộ pgTAP; chúng khớp phần lớn docs/05 nhưng còn thiếu migration 8 được liệt kê trong tài liệu. CLI tìm thấy project Supabase nhưng chưa link; DB password vắng mặt và DB local không nghe cổng 54322. Vì vậy migration, sinh kiểu từ DB và RLS chưa được chạy thật; T-003 và T-008 vẫn chưa hoàn tất.

## 2. Task đã hoàn thành hoặc làm một phần

| Task | Nhánh / PR / commit | Đã đạt "Hoàn thành khi"? | Ghi chú |
|---|---|---|---|
| T-001 | feat/T-001-bootstrap · 3416b7e · đã push | Có (theo trạng thái đã có) | Scaffold React/Vite, TypeScript strict, Tailwind, router/query/Zod và scripts. |
| T-004 | feat/T-004-shared-schemas · f70b11f · đã push | Có (theo trạng thái đã có) | Zod schema dùng chung và test TripInput. |
| T-006 | feat/T-010-sample-place-data (nhánh hiện tại) | Một phần | Memory router kiểm tra tất cả route/guard theo docs/04; 360px chưa được xem trực quan. Error boundary chưa được kích hoạt riêng trong test. |
| T-007 | feat/T-007-ui-components · 6cc8f6b · đã push | Có (theo trạng thái đã có) | Component dùng chung và gallery nội bộ. |
| T-009 | feat/T-009-itinerary-utils · 397e9f6 · đã push | Có (theo trạng thái đã có) | Hàm lịch trình thuần và test. |
| T-010 | feat/T-010-sample-place-data · a6dc2d1 · đã push | Có (theo trạng thái đã có) | CSV và fixture giả lập. |
| T-002 | feat/T-010-sample-place-data (nhánh hiện tại) | Một phần | Workflow CI có trong repo nhưng không xác nhận được run xanh trên GitHub từ lượt này. Các lệnh cục bộ đều chạy qua. |
| T-003 | feat/T-010-sample-place-data (nhánh hiện tại) | Không | CLI/config, migration 1–7, seed và pgTAP đã có trong working tree; lệnh áp dụng bị chặn vì project chưa link, chưa sinh kiểu từ DB. |
| T-005 | feat/T-010-sample-place-data (nhánh hiện tại) | Một phần | API khung cục bộ đã có; chưa chạy Vercel preview hoặc kiểm tra endpoint trên deployment. Không triển khai Vercel. |
| T-008 | feat/T-010-sample-place-data (nhánh hiện tại) | Không | Supabase Auth client/hooks/guards đã viết; kiểm tra dùng phiên giả trong memory router, chưa đăng nhập bằng phiên hosted thật và chưa xác minh profile thật trên DB. |

## 3. Task chưa xong hoặc làm một phần

| Task | Còn thiếu gì | Lý do |
|---|---|---|
| T-002 | Xác nhận CI run xanh trên GitHub | Không có gh CLI; GitHub Actions run không xác minh được trong lượt này. |
| T-003 | Áp dụng migration trên DB trống; chạy pgTAP trên DB; supabase gen types | CLI liệt kê được project Hue-Trip-Planner ở trạng thái ACTIVE_HEALTHY nhưng project chưa link. Lệnh link/push cần mật khẩu Postgres; .env.local không có DB password hoặc DATABASE_URL. Database local cũng không nghe tại 127.0.0.1:54322. Chỉ kiểm tra tên biến .env.local, không in giá trị. |
| T-005 | Vercel preview và /api/health trên preview | Chưa được triển khai; user đã yêu cầu chỉ triển khai khi được bảo. |
| T-006 | Kiểm tra trực quan ở 360px và thực thi riêng error boundary | Chưa kiểm tra bằng trình duyệt/viewport. Điều hướng route/guard đã được test qua createMemoryRouter. |
| T-008 | Đăng nhập hosted thật, xác thực profile/role từ Supabase DB | Không có tài khoản thử/phiên thật đã cấp cho kiểm thử; test hiện dùng Supabase Session giả và response /api/me giả. |

### T-005 — phần đã có / chưa làm

- Đã có: middleware requestId, errorHandler, auth/requireAdmin và cache; GET /api/health; api/[[...route]].ts cho Hono/Vercel; vercel.json có rewrite SPA/API; src/lib/api.ts có xử lý schema/error và bearer token.
- Chưa làm: triển khai Vercel, preview deployment, kiểm tra HTTP /api/health trên deployment. Không triển khai theo yêu cầu của user.

## 4. Kết quả chạy lệnh

Ngày chạy: 24/10/2026, giờ Việt Nam khoảng 15:27–15:34.

| Lệnh | Kết quả | Đầu ra thật |
|---|---|---|
| pnpm typecheck | Qua | $ tsc --noEmit · exit code 0 |
| pnpm lint | Qua | $ eslint . · exit code 0 |
| pnpm test | Qua | Test Files 6 passed (6) · Tests 52 passed (52) · exit code 0. Có cảnh báo Node về localStorage không khả dụng và React test warning về act(...); test vẫn qua. |
| pnpm build | Qua | ✓ 265 modules transformed. · ✓ built in 3.01s · exit code 0. Rollup bỏ hai annotation @__PURE__ trong Zod; bundle cảnh báo chunk JS chính 619.67 kB vượt 500 kB. |
| pnpm exec supabase --version | Qua | 2.121.0 |
| pnpm exec supabase projects list | Qua | CLI thấy project Hue-Trip-Planner (ACTIVE_HEALTHY); linked: false. |
| gh run list --branch feat/T-010-sample-place-data --limit 5 | Không chạy được | gh CLI unavailable. |
| pnpm exec supabase test db --local supabase/tests | Không chạy được | Connecting to local database... · DbConnectError · failed to connect to postgres ... 127.0.0.1:54322 · ECONNREFUSED · CLI hướng dẫn khởi động Docker/Supabase local. |
| pnpm db:migrate | Thất bại trước khi kết nối DB | $ supabase db push --yes · ProjectRefNotLinkedError · Cannot find project ref. Have you run supabase link? · exit code 1. Không gửi truy vấn thay đổi nào lên project hosted. |
| pnpm db:types | Chưa chạy | Project chưa được link; chưa có kết quả supabase gen types --linked từ DB. |

## 5. Rà soát migration và RLS

- Migration 20261024000001–...00007 có 12 bảng được docs/05 mô tả: profiles, places, place_images, tags, place_tags, start_points, trips, trip_days, trip_items, saved_places, place_audit_log, generation_events.
- RLS được bật cho đủ 12 bảng. generation_events cố ý không có client policy, phù hợp với docs/05; các bảng còn lại có policy tương ứng cho quyền chủ sở hữu, đọc công khai/published và admin.
- Có trigger cập nhật updated_at cho profiles, places, trips, trip_items; trigger tạo profile, chặn tự đổi role và kiểm tra nhất quán trip_items.trip_id/trip_days.trip_id.
- Migration storage tạo public bucket place-images cùng policy đọc công khai và policy ghi/sửa/xóa dành cho admin.
- Seed có 10 tag theo docs/05 và một mốc trung tâm thành phố lấy qua OSM Nominatim, có ghi nguồn trong comment.
- Khác biệt tài liệu: docs/05 mục 4 liệt kê thêm migration 8 rpc_functions.sql (RPC save_trip, create_trip_from_payload, nearby_places); repo chưa có file này. T-003 đang yêu cầu migrations 1–7, nhưng cần xử lý điểm thiếu đó trước khi những RPC tương ứng được triển khai.
- Điểm cần xác nhận khi chạy migration thật: migration đặt pgcrypto, unaccent, pg_trgm trong schema extensions và tham chiếu extensions.gin_trgm_ops; nếu project đã cài một extension trong schema khác từ trước thì CREATE EXTENSION IF NOT EXISTS không tự chuyển schema, có thể làm migration lỗi.
- supabase/tests/rls.test.sql có bốn kiểm tra: user A không đọc trip B; user A update trip B ảnh hưởng 0 dòng; anon insert places bị từ chối với SQLSTATE 42501; user thường insert places bị từ chối với SQLSTATE 42501. Fixture users/trip nằm trong transaction và được rollback. Đây là rà soát mã SQL; chưa xác nhận thực thi thành công trên DB.

## 6. Cổng kiểm tra cuối phase

- [x] pnpm typecheck, pnpm lint, pnpm test, pnpm build chạy qua tại local.
- [ ] Mọi route trong docs/04 điều hướng được và kiểm tra viewport 360px. Router test đã đi qua route/guard; 360px và error boundary chưa kiểm tra trực quan/thực thi riêng.
- [ ] CI xanh trên GitHub.
- [ ] Migration áp dụng trên DB, sinh types và test RLS qua trên DB thật.
- [ ] Supabase Auth đăng nhập bằng phiên hosted thật; xác minh profile/role thật.
- [ ] Vercel preview chạy /api/health (chưa triển khai theo chỉ dẫn của user).

## 7. Khác biệt so với tài liệu

- Thêm test route bằng createMemoryRouter, bao gồm route công khai, route có guard, redirect next, kiểm tra admin và manifest route.
- Thêm vitest.setup.ts cung cấp Request tương thích jsdom/Node cho redirect navigation; Node Request mặc định từ undici không nhận AbortSignal khác realm.
- Migration hiện dừng ở 1–7 như task T-003, trong khi docs/05 còn liệt kê migration 8 RPC.

## 8. Điểm nghi ngờ, rủi ro, nợ kỹ thuật

- SQL migration chưa được PostgreSQL chạy thử; lỗi cú pháp hoặc khác biệt extension/schema vẫn có thể tồn tại.
- Cần xác nhận schema hiện tại của pg_trgm/unaccent trên project trước khi áp dụng migration.
- Auth guard đã test với session/profile giả, không chứng minh phiên Supabase hosted hoặc RLS thực tế.
- Test suite có cảnh báo React act(...); dù 52 test qua, nên dọn cảnh báo khi chỉnh tiếp router test.
- Build hiện có chunk JS chính 619.67 kB trước gzip; chưa tối ưu chia chunk trong Phase 0.
- Chưa xác minh hiển thị 360px.

## 9. Cần chủ dự án

- Để hoàn tất T-003: link project bằng supabase link --project-ref ... sau khi cung cấp DB password qua CLI an toàn; sau đó chạy migration, sinh types và RLS test. CLI hiện đã có session xem project list nhưng project chưa link.
- Để hoàn tất T-008: cung cấp tài khoản/phiên test Auth hosted qua môi trường an toàn (không gửi secret trong chat) để xác minh đăng nhập và profile thật.
- Quyết định cách xử lý RPC migration 8 đã liệt kê trong docs/05 khi triển khai RPC liên quan.
- Chưa triển khai Vercel theo yêu cầu; cần chỉ thị riêng trước khi triển khai.

## 10. Cách chạy thử

1. pnpm typecheck
2. pnpm lint
3. $env:CI='true'; pnpm test
4. pnpm build
5. Khi local Supabase chạy và CLI đã cấu hình an toàn: pnpm db:migrate, pnpm db:types, pnpm db:test:rls.

Không có giá trị nào từ .env.local được ghi vào báo cáo hoặc in ra màn hình.
