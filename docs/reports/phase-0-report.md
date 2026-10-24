# Báo cáo Phase 0 — Nền móng

> Cập nhật ngày 24/10/2026 sau khi kiểm tra trạng thái git và project Supabase. Chưa chuyển sang Phase 1.

## 1. Tóm tắt

Nhánh làm việc là feat/T-010-sample-place-data. Remote migration list xác nhận cả 7 migration local đều đã áp dụng trên project Supabase. Lệnh sinh types chạy thành công; kết quả khớp với file types đã có trong repo. Đã bổ sung 5 kiểm tra RLS, trang phát triển /dev/auth, làm sạch warning router tests và chia vendor chunks: entry bundle giảm từ 619.67 kB xuống 24.46 kB. Toàn bộ 54 unit tests, typecheck, lint và build qua.

T-003 vẫn chưa hoàn tất vì bộ pgTAP 9 assertions chưa chạy được: máy không có Docker CLI và database local từ chối kết nối. T-008 cần chủ dự án tự đăng nhập thử ở /dev/auth để xác nhận phiên và GET /api/me. CI sẽ chạy trên nhánh sau khi push; GitHub Actions chưa được xác minh từ môi trường này.

## 2. Task và commit

| Task | Commit | Kết quả |
|---|---|---|
| T-003 | ce0eaea test: expand supabase rls coverage; d3c973e fix: normalize generated supabase types | Migration 1–7 hiện đồng bộ với remote; types được sinh thành công; RLS test có 9 assertion nhưng chưa chạy do thiếu Docker/local DB. T-003 chưa tick x. |
| T-008 | 0f1babc feat: add dev auth verification page | Có /dev/auth chỉ được gắn route trong DEV; cho phép đăng nhập email/mật khẩu và xem kết quả GET /api/me. Chưa xác nhận bằng tài khoản thật; T-008 chưa tick x. |
| T-006 | f96d81d perf: split vendor bundles and clean router tests | Mọi route docs/04 và guard được thử qua memory router; test dọn cảnh báo act/localStorage. Chưa kiểm tra viewport 360px; T-006 còn một phần. |
| T-002 | Commit CI trên nhánh hiện tại | Workflow chạy build cùng typecheck/lint/test trên push mọi branch. Chưa có kết quả GitHub Actions; kiểm tra sau khi push nhánh. |
| T-005 | Không đổi trong lượt này | Vẫn chưa triển khai Vercel theo chỉ dẫn trước đó. |

Các commit trên cùng nhánh hiện tại để giữ đúng base của working tree và cho phép xem Actions trên nhánh đó.

## 3. Supabase: kết quả thật

Lệnh supabase migration list trả về local và remote khớp cho từng phiên bản: 20261024000001, 20261024000002, 20261024000003, 20261024000004, 20261024000005, 20261024000006, 20261024000007. Project Hue-Trip-Planner đang ACTIVE_HEALTHY.

pnpm db:types chạy thành công với lệnh supabase gen types typescript --linked --schema public. File đầu ra src/types/supabase.ts là 22,599 bytes và nội dung trùng với types đã có; script db:types đã được trỏ về file này để tránh bản types trùng.

RLS test hiện có 9 assertion:

1. User A không đọc trip của B.
2. User A không sửa trip của B.
3. User A không xóa trip của B.
4. User thường không tự đổi role thành admin.
5. User thường không đọc place_audit_log.
6. Insert auth.users kích hoạt trigger tạo profiles.
7. Anon không đọc place draft.
8. Anon không ghi places.
9. User thường không ghi places.

Đã thử pnpm db:test:rls. Lệnh dừng khi kết nối database local, chưa chạy bất kỳ assertion nào. Docker CLI không có và PostgreSQL tại 127.0.0.1:54322 trả ECONNREFUSED. Không đánh dấu RLS đã qua.

## 4. Route loading và dev auth

- Các route nghiệp vụ hiện là placeholder; chúng dùng React.lazy để tải PlaceholderPage. Trang thư viện component và trang dev auth cũng dùng dynamic import.
- Route /dev/auth chỉ được thêm khi import.meta.env.DEV. Trang dùng supabase.auth.signInWithPassword, hiển thị phiên hiện tại và profile trả về từ hook useProfile gọi GET /api/me bằng access token.
- Cấu hình manualChunks tách React, React Router, TanStack Query, Supabase và dependencies còn lại. Build mới ghi entry chunk 24.46 kB thay vì 619.67 kB; Supabase được tách thành chunk tải riêng.
- Bộ route test kiểm tra 33 trường hợp ở router, gồm paths trong docs/04, redirect/guard, vai trò admin và dev routes. Chưa kiểm tra trực quan 360px.

## 5. Tài liệu migration RPC

- docs/05-data-model.md: migration 8 là nearby_places (T-012); migration 9 là save_trip và create_trip_from_payload (T-034).
- docs/06-api-spec.md mục 10: ghi rõ hàm nào thuộc migration/task nào.
- docs/09-roadmap-tasks.md: cập nhật T-012 và T-034 tương ứng.
- Chưa tạo các migration RPC 8/9; đây là task tương lai, không triển khai trong Phase 0.

## 6. Kết quả chạy lệnh

Thời gian chạy: 24/10/2026, giờ Việt Nam khoảng 16:10.

| Lệnh | Đầu ra thực |
|---|---|
| pnpm exec supabase migration list | Mỗi migration 20261024000001–20261024000007 có local và remote cùng phiên bản; message: Migrations listed. |
| pnpm db:types | $ supabase gen types typescript --linked --schema public; exit code 0. |
| pnpm db:test:rls | Connecting to local database...; DbConnectError; connect ECONNREFUSED 127.0.0.1:54322; exit code 1. |
| docker version | docker CLI unavailable. |
| pnpm typecheck | $ tsc --noEmit; exit code 0. |
| pnpm lint | $ eslint .; exit code 0. |
| pnpm test | Test Files 6 passed (6); Tests 54 passed (54); Duration 12.51s; exit code 0. Không còn warning act/localStorage trong đầu ra test. |
| pnpm build | ✓ 266 modules transformed; ✓ built in 2.79s; exit code 0. Entry JS 24.46 kB, gzip 8.21 kB; vendor chunks riêng. Rollup còn cảnh báo 2 annotation @__PURE__ trong Zod. |
| gh run list --branch feat/T-010-sample-place-data --limit 5 | Không chạy được: gh CLI unavailable. |

## 7. Cổng Phase 0

- [x] Migration 1–7 đã có trên DB remote và types đã sinh.
- [ ] RLS test chạy qua trên DB; chưa chạy do Docker/local DB không có.
- [ ] T-008 đăng nhập bằng tài khoản thử và xác minh GET /api/me thật; công cụ tự kiểm tra đã sẵn sàng nhưng chưa được dùng với tài khoản.
- [ ] Mọi route docs/04 đã có test điều hướng/guard; viewport 360px chưa kiểm tra.
- [ ] CI xanh trên GitHub; workflow sẽ chạy sau khi push, chưa có run status.
- [ ] Vercel preview và /api/health; không triển khai theo chỉ dẫn của chủ dự án.

## 8. Bảo mật và giới hạn

- Không có giá trị nào trong .env.local được in ra màn hình hoặc ghi vào báo cáo.
- /dev/auth chỉ được đăng ký trong development. Không dùng service-role key ở frontend.
- Không chạy RLS test trên hosted DB vì bộ test tạo fixture dữ liệu; chỉ dự kiến chạy local như yêu cầu.
- Chưa chuyển sang Phase 1.
