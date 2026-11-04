# Báo cáo Phase 5A — API admin và import CSV (phần server)

> Ngày chạy: 2026-11-04. Nhánh công việc bắt đầu từ `fix/T-037-auth-feedback`; chưa push. Không áp dụng migration, không chạy `smoke:admin`, không sửa dữ liệu địa điểm. Không in nội dung `.env.local`.

## 1. Tóm tắt

- Đã thêm API admin địa điểm, kiểm tra quyền ở server, schema strict, audit log, lọc/thiếu trường, trạng thái, duyệt và thao tác hàng loạt.
- Đã thêm server preview/commit CSV, dùng lại parser/validator T-011, không dùng preview token, và giữ nguyên trạng thái/verified của bản ghi cũ.
- Hai migration mới (11 và 12) chỉ được tạo; chưa áp dụng. Migration 12 giữ việc lưu địa điểm và thay tags trong một RPC `SECURITY INVOKER`.
- `smoke:api` và kiểm tra mã xanh. `smoke:trips` không qua ở bước đăng nhập tài khoản thử; không có dữ liệu smoke được tạo. Chưa kiểm tra API admin trên Supabase thật.
- Kiểm tra git cho thấy local `main`/`origin/main` chưa chứa trọn Phase 4; checkout tác vụ hiện tại có các thay đổi T-036–T-042. Theo yêu cầu Bước 0 không chặn công việc, baseline được chạy trên checkout hiện có và không tuyên bố rằng `main` đã được xác nhận.

## 2. Task

| Task | Nhánh / commit | Đạt “Hoàn thành khi”? | Ghi chú |
|---|---|---|---|
| T-043 | `feat/T-043-admin-api-import-server` / sẽ ghi hash khi bàn giao | Một phần | Routes/services/tests đã có; giữ `[ ]` vì migration 11–12 chưa áp dụng, `smoke:admin` chưa được chủ dự án cho chạy. |
| T-045 (server) | Cùng nhánh | Một phần | Preview/commit và test server có; giữ `[ ]` vì UI 3 bước chưa làm. |

## 3. Thay đổi

- Admin endpoints: list/detail/create/update/status/verify/bulk; tất cả nằm sau `requireAuth` + `requireAdmin`, dùng Supabase client mang JWT cho đọc/ghi địa điểm và dùng service role giới hạn cho audit/import sau kiểm tra quyền.
- Xuất bản thiếu trường bắt buộc trả 422 với danh sách; slug trùng 409; URL ảnh chỉ HTTPS; CHECK/FK thường gặp ánh xạ sang lỗi API tiếng Việt.
- Import preview đọc CSV UTF-8 (BOM hỗ trợ), giới hạn 2 MB, tóm tắt valid/warning/error và đối chiếu tag/slug hiện có. Commit nhận lại CSV, giữ trạng thái/verified, chặn ghi đè verified nếu chưa bật rõ, giữ tag cũ khi cột tags rỗng, trả nội dung CSV lỗi.
- Migration 11 sửa trigger chỉ chặn đổi role khi có JWT người dùng và không phải admin. Migration 12 thêm `admin_save_place_with_tags`, dùng JWT admin và transaction cho place + tags. Kiểu RPC trong `src/types/supabase.ts` được cập nhật thủ công; chưa sinh lại bằng `db:types` vì migration chưa áp dụng.
- Thêm test pgTAP cho ngữ cảnh `auth.uid() IS NULL`; chưa chạy pgTAP.
- Thêm `pnpm smoke:admin` để chủ dự án chạy sau khi migration đã áp dụng. Lệnh này chưa được thực thi.

## 4. Kết quả chạy lệnh thật

Lần chạy đầu trong sandbox bị `ERR_PNPM_STORE_DIR_OPEN_OPERATION_LOCK` / `Access is denied`; chạy lại ngoài sandbox theo hướng dẫn môi trường trong AGENTS.md.

| Lệnh | Đầu ra thật |
|---|---|
| `pnpm typecheck` | `$ tsc --noEmit` — exit 0 |
| `pnpm lint` | `$ eslint .` — exit 0 |
| `pnpm test -- --reporter=dot` | `Test Files 42 passed (42)`; `Tests 229 passed (229)`; exit 0. Có cảnh báo jsdom `window.scrollTo() not implemented` từ test wizard. |
| `pnpm build` | Vite 6.4.1; `✓ 378 modules transformed`; `✓ built in 29.92s`; exit 0. Rollup cảnh báo annotation trong dependency Zod. |
| `pnpm smoke:api` | 7 đạt, 0 lỗi, 0 bỏ qua; 10 tag, 3 start points, 55 địa điểm published, nearby=5; exit 0. |
| Test tập trung admin/import | `Test Files 3 passed (3)`; `Tests 16 passed (16)`; exit 0. |
| `pnpm smoke:trips` (bước nền) | Migration 10 và API local qua; Auth thử nghiệm thất bại với mã tổng quát `test_login_failed`; không có trip nào được tạo. Không retry. |
| `pnpm smoke:admin` | Chưa chạy theo chỉ thị chỉ chạy khi chủ dự án cho phép. |
| `pnpm db:test:rls` | Chưa chạy; pgTAP cần môi trường Docker/local Supabase và lượt này không áp dụng migration. |
| `git diff --check` | Exit 0, không có đầu ra. |

## 5. Trạng thái nghiệm thu

- [ ] T-043 — chờ migration 11–12 được chủ dự án xem xét/áp dụng và smoke admin thật.
- [ ] T-045 — phần server có test; UI preview/import ba bước chưa làm.
- [ ] pgTAP trên DB local.
- [ ] `smoke:admin`.

## 6. Khác biệt so với tài liệu

- T-045 được giới hạn đúng phần server trong lượt này; không dựng giao diện.
- API endpoint index được đánh lại để tránh trùng số sau khi thêm bulk/import commit. Mô tả `errorCsv` sửa thành CSV UTF-8 thô.
- CSV import dùng parser/validator hiện có trong `server/services/placeCsv.ts` (được chia sẻ với CLI T-011), không sao chép bộ phân tích CSV.

## 7. Điểm nghi ngờ, rủi ro, nợ kỹ thuật

- Migration 11–12 chưa chạy trên Postgres; cú pháp SQL, trigger, quyền RPC và transaction đổi tags chưa được xác nhận bằng DB thật.
- Import commit hiện thực hiện từng bản ghi qua service role sau `requireAdmin`; việc upsert place, thay tags và audit của một dòng chưa nằm trong cùng transaction. Nếu thao tác giữa chừng lỗi, bản ghi có thể đã được ghi trước khi dòng bị báo lỗi. Nên cân nhắc RPC import nguyên tử trước khi dùng rộng.
- `smoke:trips` thất bại ở đăng nhập tài khoản thử; đây là lỗi cấu hình/credential hoặc Auth environment cho đến khi có status cụ thể. Không có bằng chứng lỗi mã từ kết quả tổng quát này.
- `scripts/testLogin.ts` là tệp chưa theo dõi có sẵn trong workspace của người dùng; không được đưa vào commit.

## 8. Cần chủ dự án

- Xem xét migration 11–12; tự áp dụng khi chấp thuận. Agent chưa áp dụng migration.
- Khi migration đã áp dụng và API local sẵn sàng, ra lệnh rõ ràng nếu muốn chạy `pnpm smoke:admin`; cần `ADMIN_TEST_EMAIL/PASSWORD` và `TEST_USER_A_EMAIL/PASSWORD` trong `.env.local`.
- Xác nhận credentials/Auth của smoke trips nếu muốn điều tra lại lỗi đăng nhập.
- T-045 cần giao diện ở task tiếp theo trước khi tick hoàn tất.

## 9. Cách chạy thử

```powershell
pnpm dev:api
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm smoke:api
```

Sau khi migration 11–12 được áp dụng và có chỉ thị chạy smoke:

```powershell
pnpm smoke:admin
```

Mặc định API local dùng `http://127.0.0.1:8787`. Smoke admin tạo các slug ngẫu nhiên `zz-test-*` và có bước dọn dữ liệu cuối; không chạy cho đến khi được chủ dự án yêu cầu.
