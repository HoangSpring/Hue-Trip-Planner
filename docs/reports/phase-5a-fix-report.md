# Báo cáo sửa Phase 5A — Import nguyên tử và chẩn đoán smoke

> Ngày: 2026-11-05. Nhánh `feat/T-043-admin-api-import-server`. Không push, không áp dụng migration. `LLM_ENABLED` không bị thay đổi. Không in khóa, mật khẩu hay token.

## 1. Tóm tắt

- Import mỗi dòng CSV hiện đi qua một RPC `SECURITY INVOKER`: upsert place, thay tags nếu CSV có tags, ghi audit trong cùng transaction; dùng JWT admin, không dùng service role cho các thao tác này.
- Migration 13 và pgTAP mới chỉ được tạo. Migration 11–12 được xác nhận local=remote; migration 13 local-only, remote chưa có.
- Chẩn đoán đăng nhập smoke hiện in HTTP status, `error_code`, gợi ý thường gặp và tên biến môi trường thiếu; không ghi thông tin bí mật.
- `smoke:trips` thất bại do Auth trả `400 invalid_credentials`. `smoke:admin` chạy đúng một lần nhưng bỏ qua trước Auth vì thiếu hai biến admin; không tạo dữ liệu thử. Truy vấn sau đó xác nhận còn 0 địa điểm `zz-test-*`.
- Điều kiện Phase 3/T-020 trong Bước 0 không đạt: eval có 1 ngày thiếu bữa trưa trong 10 kịch bản. T-020 vẫn `[ ]`; T-043 cũng chưa tick vì smoke admin chưa đạt; T-045 giữ `[ ]` vì chưa có UI.

## 2. Task

| Task | Trạng thái | Ghi chú |
|---|---|---|
| T-043 | Chưa đạt tiêu chí smoke | Code API có; `smoke:admin` chưa vào luồng do thiếu `ADMIN_TEST_EMAIL`/`ADMIN_TEST_PASSWORD`. Không tick. |
| T-045 server | Đã triển khai, chưa hoàn tất task | Preview/commit có; commit yêu cầu migration 13. Giao diện ba bước chưa có nên giữ `[ ]`. |
| Bước 0 Phase 3 | Chưa xác nhận hoàn tất | `pnpm eval:itinerary` cho 1 ngày thiếu trưa; T-020 chưa tick. |
| Bước 0 Phase 4 | Chưa hoàn toàn đạt theo roadmap | T-034–T-036, T-038–T-042 đang `[x]`; T-037 vẫn `[ ]`. |

## 3. Thay đổi

- Migration `20261105000013_admin_import_place_atomic.sql`: thêm `admin_import_place(p_row jsonb, p_overwrite_verified boolean)`, `SECURITY INVOKER`, kiểm tra `auth.uid()` và `public.is_admin()` đầu hàm, advisory lock theo slug, ghi place + tags không rỗng + audit trong transaction. Bản mới là draft/unverified; bản cũ giữ trạng thái; verified bị bỏ qua nếu không bật ghi đè. RLS chỉ cho admin ghi audit `import` với `actor_id = auth.uid()`.
- Import service gọi một RPC qua Supabase client mang JWT cho từng dòng. Nếu RPC chưa được áp dụng/hiện trong schema cache, trả 503 với thông báo cần migration; không quay về đường ghi nhiều bước.
- Thêm test repository cho một RPC duy nhất và lỗi migration thiếu; mở rộng test import và pgTAP. pgTAP chưa chạy.
- `pnpm db:types` sinh lại `src/types/supabase.ts` từ DB sau khi xác nhận migration 11–12. Khai báo `admin_import_place` được thêm thủ công vì migration 13 chưa được áp dụng; khai báo đó chưa được DB sinh.
- `smoke:trips` và `smoke:admin` chỉ in HTTP status/mã Auth/gợi ý an toàn; thiếu biến thì ghi rõ tên biến.

## 4. Kết quả chạy lệnh thật

Các lần chạy trong sandbox ban đầu gặp `ERR_PNPM_STORE_DIR_OPEN_OPERATION_LOCK` / `Access is denied`; lệnh được chạy lại ngoài sandbox theo mục “Lỗi môi trường” trong AGENTS.md.

### Bước 0 và migration

| Lệnh | Kết quả thật |
|---|---|
| `pnpm exec supabase migration list` | Các migration 1–12 đều có `local` và `remote` bằng nhau; cụ thể `20261104000011` và `20261104000012` đều hiện diện ở cả hai cột. Sau khi tạo migration 13, lần kiểm tra mới nhất cho `20261105000013`: local=`20261105000013`, remote rỗng. Không áp dụng migration. |
| `pnpm db:types` | `$ supabase gen types typescript --linked --schema public > src/types/supabase.ts` — exit 0. Supabase CLI chỉ báo có phiên bản mới. |
| `src/types/supabase.ts` | So với bản sửa tay đã commit, hàm migration 12 chỉ khác cách xuống dòng/format. Hàm migration 13 được khai báo thủ công vì chưa có trên remote. |
| `pnpm eval:itinerary` | `Đã ghi 10 kịch bản vào docs/eval/2026-11-05-fallback-v2.md.`; `Dữ liệu: 55 published, 55 đủ điều kiện, 0 bị loại vì dữ liệu bắt buộc.`; `So sánh V1 → V2: thiếu trưa 11 → 1; dưới sàn 12 → 0; cảnh báo 80 → 89.` |
| Roadmap | T-018, T-019, T-021–T-028 và T-034–T-036, T-038–T-042 được đánh `[x]`; T-020 và T-037 còn `[ ]`. Phase 5A code và migrations 11–12 có trong checkout hiện tại. |

Trong eval, kịch bản nhóm bạn 4 ngày, ngày 4 không có mục slot trưa; Quán Hến Bà Cam được xếp ở slot chiều và kết quả có `LUNCH_MISSING`. Đây là lỗi nghiệm thu còn lại; không sửa thuật toán lịch trình trong lượt admin này.

### Kiểm tra cuối

| Lệnh | Đầu ra thật |
|---|---|
| `pnpm typecheck` | `$ tsc --noEmit` — exit 0. Có một lượt trước đó báo lỗi test gọi thừa tham số và import type không dùng; đã sửa rồi chạy lại đạt. |
| `pnpm lint` | `$ eslint .` — exit 0. Lượt đầu cũng bắt đúng import không dùng; đã sửa và chạy lại đạt. |
| `pnpm test -- --reporter=dot` | `Test Files 43 passed (43)`; `Tests 232 passed (232)`; exit 0. Có warning jsdom `window.scrollTo() not implemented` trong test wizard. |
| Test admin/import tập trung | `Test Files 4 passed (4)`; `Tests 19 passed (19)`; exit 0. |
| `pnpm build` | Vite 6.4.1; `✓ 378 modules transformed`; `✓ built in 4.47s`; exit 0. Rollup cảnh báo annotation trong dependency Zod. |
| `pnpm smoke:api` | 7 đạt, 0 lỗi, 0 bỏ qua; tags=10, startPoints=3, 55 địa điểm published, map items=55, nearby=5; exit 0. |
| `pnpm smoke:trips` | Migration 10 PASS; API local PASS; Auth FAIL: `HTTP 400, error_code=invalid_credentials`; tổng 2 đạt, 1 lỗi, 0 bỏ qua; exit 1. Không có trip được tạo vì dừng ở đăng nhập. Node in warning `DEP0190` về `shell: true` khi gọi child process; đây là cảnh báo script/runtime. |
| `pnpm smoke:admin` | Đúng một lần: `Cấu hình smoke | SKIP | Thiếu biến: ADMIN_TEST_EMAIL, ADMIN_TEST_PASSWORD; chưa gọi Auth/API.`; tổng 0 đạt, 0 lỗi, 1 bỏ qua; exit 1. Không tạo place. |
| Đếm dữ liệu thử sau smoke | Truy vấn Supabase read-only bằng service role: `Remaining zz-test-* places: 0`. |
| `git diff --check` | Exit 0, không có đầu ra. |
| pgTAP / `pnpm db:test:rls` | Chưa chạy. Migration 13 chưa áp dụng; không chạy test DB sẽ phụ thuộc migration chưa áp dụng. |

## 5. Trạng thái cổng

- [x] Migration 11–12 hiện diện local và remote.
- [x] `pnpm db:types` chạy thành công.
- [ ] Eval không còn ngày thiếu bữa trưa — còn 1 ngày.
- [ ] `smoke:trips` — Supabase Auth thử trả `400 invalid_credentials`.
- [ ] `smoke:admin` đạt — chưa chạy các bước Auth/API vì thiếu cấu hình admin.
- [ ] Migration 13 — chỉ tạo file, chưa áp dụng theo chỉ thị.
- [ ] T-043 — không tick cho tới khi `smoke:admin` đạt.
- [ ] T-045 — giữ chưa hoàn tất tới khi UI import ba bước được làm.

## 6. Khác biệt so với tài liệu

- Migration 13 được thêm sau migration 12; số migration tiếp theo là 13. Không có schema nào được áp dụng từ agent.
- Service role không còn dùng để ghi place/tag/audit trong import; migration 13 thêm policy audit chỉ cho `action='import'`, admin hiện tại và actor là `auth.uid()`.
- `docs/05-data-model.md`, `docs/06-api-spec.md`, `docs/09-roadmap-tasks.md` mô tả transaction import, migration 13 và trạng thái task.

## 7. Điểm nghi ngờ, rủi ro, nợ kỹ thuật

- SQL migration 13 và test pgTAP chưa được thực thi trên Postgres; cần áp dụng migration sau khi chủ dự án xem xét, rồi chạy test DB.
- Migration 13 RPC có quyền ghi audit import cho admin qua JWT. Các thao tác admin CRUD khác tiếp tục ghi audit qua service role theo API spec.
- Smoke admin không kiểm tra quyền thực tế do thiếu cấu hình tài khoản admin; không được suy luận rằng endpoint đã qua end-to-end trên remote.
- Phase 3 vẫn có một ngày thiếu trưa; T-020 giữ `[ ]`. T-037 cũng chưa được chủ dự án xác nhận trên trình duyệt.
- `scripts/testLogin.ts` là file untracked có sẵn của người dùng; không đưa vào commit.

## 8. Cần chủ dự án

- Cung cấp `ADMIN_TEST_EMAIL` và `ADMIN_TEST_PASSWORD` trong `.env.local`, rồi ra lệnh mới nếu muốn chạy lại `pnpm smoke:admin` (lượt được phép hiện tại đã dùng, nhưng chưa gọi Auth/API do thiếu cấu hình).
- Điều tra/tự sửa tài khoản thử đăng nhập của `smoke:trips`; lỗi hiện thấy là `invalid_credentials`.
- Xem xét và tự áp dụng migration 13. Sau đó chạy `pnpm db:types` để thay khai báo RPC thủ công, rồi chạy `pnpm db:test:rls`.
- Xem ngày thiếu bữa trưa trong [eval](../eval/2026-11-05-fallback-v2.md) và tiếp tục sửa T-020 riêng.
- T-045 cần UI ở giai đoạn sau; T-043 chưa tick.

## 9. Cách chạy thử

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm smoke:api
pnpm eval:itinerary
```

`pnpm smoke:admin` cần API local ở `http://127.0.0.1:8787`, migration 11–12 trên remote, cùng biến tài khoản admin/user thử. Smoke admin được phép trong lượt này nhưng dừng trước Auth do thiếu hai biến admin; không có dữ liệu thử nào được tạo.
