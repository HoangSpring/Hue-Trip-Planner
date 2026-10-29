# Báo cáo Phase 4A — persistence RPC và API chuyến đi

> Ngày: 2026-10-29. Không push. T-034 branch `feat/T-034-trip-rpcs` · commit `e3547f3b638b341bb60cd4cbe0c880e8d5acb21a`; T-035 branch `feat/T-035-trips-api` · commit được ghi sau khi hoàn tất. Không in giá trị từ `.env.local`; không đổi `LLM_ENABLED`; không áp dụng migration và không ghi/xóa địa điểm.

## 1. Tóm tắt

- `main` là `645eff7` và roadmap đã đánh dấu T-018 → T-028 hoàn tất. Đã chạy bộ kiểm tra baseline và smoke API trên `main` trước khi làm task.
- Remote có migration 1–9; ban đầu `main` thiếu file migration 9 local dù remote đã ghi nhận. Đã khôi phục đúng file telemetry đã áp dụng, tạo migration 10 cho RPC trip và xác nhận migration 10 chỉ local, chưa áp dụng remote.
- T-035 thêm API trips dùng JWT người dùng/RLS, schemas strict, validation và test bằng repository giả. Không gọi route nào ghi dữ liệu lên Supabase thật.
- T-034 chưa đạt cổng hoàn thành: migration 10 chưa được chủ dự án áp dụng; pgTAP chưa chạy vì môi trường không có Docker. T-034 vẫn `[ ]` trong roadmap. T-035 được tick theo test API giả; `smoke:trips` chưa chạy theo yêu cầu chỉ chạy khi chủ dự án ra lệnh.

## 2. Task

| Task | Nhánh / commit | Đạt “Hoàn thành khi”? | Ghi chú |
|---|---|---|---|
| T-034 | `feat/T-034-trip-rpcs` / `e3547f3b638b341bb60cd4cbe0c880e8d5acb21a` | Chưa | Migration 10 và pgTAP đã viết; chưa áp dụng migration, Docker/pgTAP chưa chạy. Giữ `[ ]`. |
| T-035 | `feat/T-035-trips-api` / `f48fb666e8a2529abd02fa5db806d47cdb0ac388` | Có theo test tự động | GET/POST/PUT/PATCH/DELETE/duplicate; service/repository dùng JWT; 7 nhóm test app.request với Supabase giả; smoke thật chưa chạy. |

## 3. Bước 0 — baseline và migration

`main` tại `645eff7` chứa T-018 → T-028 theo `docs/09-roadmap-tasks.md`; Phase 2C report ghi trình xem/chỉnh sửa nháp. Baseline chạy trên `main`:

| Lệnh | Đầu ra thật |
|---|---|
| `pnpm typecheck` | `$ tsc --noEmit` — exit 0 |
| `pnpm lint` | `$ eslint .` — exit 0 |
| `pnpm test` | 28 files, 173 tests passed — exit 0 |
| `pnpm build` | Vite 6.4.1; `✓ 356 modules transformed`; `✓ built in 4.04s` — exit 0 |
| `pnpm smoke:api` | 7 đạt, 0 lỗi, 0 bỏ qua; 55 published; nearby trả 5; draft slug trả 404 — exit 0 |

Kết quả đọc-only của `pnpm exec supabase migration list` sau khôi phục migration 9:

```text
20261024000001 local=remote
20261024000002 local=remote
20261024000003 local=remote
20261024000004 local=remote
20261024000005 local=remote
20261024000006 local=remote
20261024000007 local=remote
20261024000008 local=remote
20261029000009 local=remote
20261029000010 local; remote chưa có
Migrations listed
```

Migration 9 là telemetry `generation_events`; migration 10 là RPC chuyến đi và policy hydrate địa điểm archived thuộc chuyến đi của chủ sở hữu. Không chạy `db push`, `db migrate`, hay `db types`.

## 4. Thay đổi

- T-034: thêm `20261029000010_trip_rpcs.sql`; cả hai hàm là `SECURITY INVOKER`, kiểm tra `auth.uid()`, create idempotent theo `(user_id, client_draft_id)`, đọc giới hạn trip từ DB setting `app.max_trips_per_user` (mặc định 50), save khóa dòng và trả `PT409 / TRIP_VERSION_CONFLICT` khi expected timestamp cũ; RLS vẫn áp dụng. `save_trip` không đổi `num_days`, đồng bộ ngày/mục và xóa các mục bị bỏ trong cùng transaction.
- Khôi phục `20261029000009_generation_events_telemetry.sql` bị thiếu khỏi `main`, đúng nội dung đã có trên remote. Không sửa migration đã áp dụng.
- Mở policy đọc `places.status='archived'` chỉ khi địa điểm đó đã nằm trong trip của `auth.uid()`, để trip cũ còn hydrate place archived.
- T-035: thêm `server/routes/trips.ts`, `server/services/tripService.ts`, `server/services/supabaseTripRepository.ts`; mount routes dưới `/api`. Mọi route requireAuth, dùng Supabase client kèm JWT, trả `private, no-store`, không dùng service role.
- Schema dùng chung strict kiểm tra UUID, ngày, số ngày, chỉ số ngày/vị trí, tối đa 8 mục/ngày, không nhận trường lạ. Service kiểm tra place published (cho phép archived nếu đã ở trip), không trùng địa điểm, max 50 theo config, làm sạch text/loại HTML và tính lại thời gian/khoảng cách từ tọa độ DB. PUT xung đột trả 409 kèm `error.details.current`; duplicate sinh ID mới, không mang `share_token` hay `clientDraftId`.
- Thêm các helper typed trong `src/lib/api.ts`, `MAX_TRIPS_PER_USER` vào env schema, và `pnpm smoke:trips` để chủ dự án chạy sau khi migration 10 đã áp dụng.

## 5. Kết quả chạy lệnh cuối nhánh T-035

| Lệnh | Đầu ra thật | Kết quả |
|---|---|---|
| `pnpm install --frozen-lockfile` | `Already up to date` · `Done in 83ms using pnpm v11.25.0` | exit 0 |
| `pnpm typecheck` | `$ tsc --noEmit` | exit 0 |
| `pnpm lint` | `$ eslint .` | exit 0 |
| `pnpm test` | `Test Files 29 passed (29)` · `Tests 180 passed (180)` · `Duration 14.97s` | exit 0; wizard tests in jsdom ghi stderr `Window.scrollTo() not implemented`, không làm test fail |
| `pnpm build` | Vite 6.4.1 · `✓ 356 modules transformed` · `✓ built in 4.08s` | exit 0; có cảnh báo Rollup về annotation `@__PURE__` trong dependency Zod |
| `pnpm smoke:api` | 7 đạt, 0 lỗi, 0 bỏ qua; 55 published; metadata 10 tags/3 start points; place+nearby 5 | exit 0; chỉ GET dữ liệu |
| `pnpm exec supabase migration list` | migration 1–9 local=remote; migration 10 local và remote trống | exit 0; chỉ đọc |
| `docker info --format '{{.ServerVersion}}'` | `docker: The term 'docker' is not recognized ...` | exit 1; lỗi môi trường, không phải lỗi mã |
| `pnpm db:test:rls` | Chưa chạy | Không có Docker CLI để khởi động DB local; không thử pgTAP trên remote |
| `pnpm smoke:trips` | Chưa chạy | Script chỉ chạy khi chủ dự án ra lệnh; migration 10 cũng chưa áp dụng remote |

Test API mới chạy qua `app.request` và repository giả: 7 tests bao phủ auth 401, create 201/idempotent 200, GET/list, isolation A/B 404, malformed/strict/duplicate/HTML 400/422, archived place cũ, save lặp, 409 kèm current, PATCH, duplicate IDs/token, DELETE 204, và MAX_TRIPS_PER_USER. Test không ghi Supabase.

## 6. Cổng cuối phase/task

- [x] T-035 API và kiểm thử bằng Supabase giả; test cách ly user và archived place.
- [ ] T-034 migration 10 đã áp dụng và kiểm tra RLS/transaction qua pgTAP hoặc smoke thật — chờ chủ dự án.
- [x] Không ghi/xóa địa điểm và không áp dụng migration remote.
- [x] Không chạy `smoke:trips`; chỉ chạy theo lệnh riêng của chủ dự án.

## 7. Khác biệt, nghi ngờ và rủi ro

- Số migration RPC trong tài liệu cũ là 9 nhưng migration 9 đã dùng cho telemetry; tài liệu 05/06/09 được sửa để RPC là migration 10.
- Migration 9 có trên remote nhưng file không nằm trong `main`; file lịch sử đã được phục hồi đúng nội dung để CLI nhận ra chuỗi migration.
- Chưa kiểm chứng cú pháp/hành vi SQL trên Postgres local do Docker không cài. Migration 10 chưa được chạy ở bất kỳ DB nào.
- Smoke API baseline truy vấn DB thật ở chế độ đọc; cuối nhánh cũng chỉ gọi GET. Không gọi API tạo chuyến đi, không sinh generation event, không thay đổi dữ liệu địa điểm hoặc trip thật.
- `smoke:trips` cần test users A/B, server API local và migration 10 đã áp dụng; script tự cleanup trip tạo ra trong `finally`, nhưng chưa được thực thi.

## 8. Cần chủ dự án

1. Review migration [20261029000010_trip_rpcs.sql](../../supabase/migrations/20261029000010_trip_rpcs.sql); sau khi duyệt, tự chạy `pnpm db:migrate`.
2. Cài/bật Docker để chạy `pnpm db:test:rls` trên local database.
3. Sau khi migration 10 đã có trên remote, cấu hình `TEST_USER_A_EMAIL`, `TEST_USER_A_PASSWORD`, `TEST_USER_B_EMAIL`, `TEST_USER_B_PASSWORD` trong môi trường local rồi ra lệnh chạy `pnpm smoke:trips`.

## 9. Cách chạy thử

- Unit/API giả: `pnpm test`.
- Sau khi review/apply migration 10: `pnpm db:test:rls`.
- Chạy API cục bộ bằng `pnpm dev:api`; khi migration 10 đã được xác nhận trên remote và test users đã cấu hình, chủ dự án mới yêu cầu chạy `pnpm smoke:trips`.
- Không chia sẻ nội dung `.env.local`; lệnh smoke chỉ in trạng thái và kết quả, không in token/mật khẩu.
