# Báo cáo Phase 1a — Import CSV và API đọc địa điểm

> Cập nhật ngày 25/10/2026. Chỉ làm T-011, T-012, T-013; chưa làm T-014 → T-017.

## 1. Tóm tắt

Đã checkout và pull `main`; `pnpm install --frozen-lockfile`, typecheck, lint, test và build nền móng đều qua. T-011 CLI đã kiểm tra file CSV mẫu và thực hiện import/upsert trên Supabase; file chỉ có dữ liệu giả lập, mọi dòng được lưu `draft` và `verified = false`. T-012 có migration 8, service, mapper và kiểu RPC; migration 8 hiện có trên remote. T-013 có API public, schema, cache, rate limit và route tests. Smoke test trên DB thật xác nhận hiện không có địa điểm `published`, endpoint meta thiếu `startPoints`; các kiểm tra phụ thuộc địa điểm published chưa thể chạy. T-012/T-013 vẫn chưa đạt tiêu chí live data. T-014 → T-017 chưa làm.

## 2. Task đã hoàn thành

| Task | Nhánh / commit | Đã đạt "Hoàn thành khi"? | Ghi chú |
|---|---|---|---|
| T-011 | `feat/T-011-csv-import` · `4f41bf5` | Có | `places.sample.csv`: dry-run 20/20 hợp lệ; lần ghi đầu tạo 20; chạy lại cập nhật 20 theo slug, không tạo thêm. Có test dòng có ảnh nhưng thiếu credit/license. 20 fixture giả lập hiện vẫn nằm trong Supabase ở trạng thái `draft`, `verified=false`. |
| T-012 | `feat/T-012-place-read` · `0eaf838`, `0437d1e` | Một phần | Migration 8 `nearby_places`, service, mapper và filter Zod đã có; migration 8 hiện có trên remote. Smoke test không thể xác minh truy vấn tìm kiếm/nearby với dữ liệu published vì DB hiện có 0 địa điểm published. T-012 vẫn `[ ]`. |
| T-013 | `feat/T-013-public-places-api` · `f7c4b73` | Một phần | API và route tests có sẵn. Smoke test thật: list/map trả 200 và rỗng; category sai trả 400; slug draft trả 404. `/api/meta` báo 10 tag nhưng không có `startPoints`; không có dữ liệu published để kiểm tra phân trang nhiều trang, detail/nearby hoặc slug 404 live. T-013 vẫn `[ ]`. |

Các nhánh xếp chồng theo phụ thuộc: T-012 bắt đầu từ T-011; T-013 bắt đầu từ T-012. Cả ba đã push để chủ dự án review. Không tạo PR.

## 3. Task chưa xong hoặc làm một phần

| Task | Còn thiếu gì | Lý do |
|---|---|---|
| T-012 | Xác minh tìm kiếm và `nearby_places` với dữ liệu published | Remote có migration 8, nhưng hiện không có địa điểm published. Không tự xuất bản dữ liệu. |
| T-013 | Bổ sung startPoints và kiểm thử API live trên published data (pagination nhiều trang, detail/nearby, slug không tồn tại) | Smoke phát hiện `/api/meta` thiếu startPoints và DB có 0 published places. Test route hiện dùng service giả. |
| T-014 → T-017 | Chưa bắt đầu | Ngoài phạm vi yêu cầu hiện tại. |

## 4. Kết quả chạy lệnh (24/10/2026)

| Lệnh | Kết quả thực | Ghi chú |
|---|---|---|
| `git checkout main` / `git pull` | `Already on 'main'`; `Your branch is up to date with 'origin/main'`; `Already up to date.` | Main có merge commit Phase 0 `5a038e2`. |
| `pnpm install --frozen-lockfile` | `Already up to date`; `Done in 597ms using pnpm v11.25.0` | Chạy trên `main` trước khi tạo nhánh task. |
| `pnpm typecheck` | `$ tsc --noEmit`; exit 0 | Đã chạy lại trên T-013. |
| `pnpm lint` | `$ eslint .`; exit 0 | Đã chạy lại trên T-013. |
| `pnpm test` | `Test Files 11 passed (11)`; `Tests 71 passed (71)`; exit 0 | Có test API public, rate limit, importer, mapper, router và các test trước đó. |
| `pnpm build` | `✓ 268 modules transformed`; `✓ built in 5.94s`; exit 0 | Entry `index-BLkXVBPl.js` 25.23 kB (gzip 8.40 kB). Còn 2 cảnh báo `@__PURE__` trong Zod. |
| `pnpm db:seed -- --dry-run ...` | `totalRows:20`, `validRows:20`, `plannedCreates:20`, `invalidRows:0`, `failedRows:0`; exit 0 | Đọc cấu hình `.env.local` nhưng không in giá trị. Dry-run không ghi DB. |
| `pnpm db:seed -- ...` | `created:20`, `updated:0`, `invalidRows:0`, `failedRows:0`; exit 0 | Dùng fixture giả lập; ghi thành draft. |
| Chạy lại `pnpm db:seed -- ...` | `plannedCreates:0`, `plannedUpdates:20`, `created:0`, `updated:20`; exit 0 | Xác nhận upsert theo slug, không tạo trùng. |
| `docker version --format ...` | `docker: The term 'docker' is not recognized ...` | Không chạy được Supabase DB local. |
| `pnpm exec supabase migration list` | Exit 1, CLI báo `EPERM` khi ghi `C:\Users\Admin\.supabase\telemetry.json.tmp...` | Không xác minh được trạng thái migration remote trong lượt này. Không chạy `db push`/không áp dụng migration remote. |

Vitest/Vite bị Windows báo `spawn EPERM` khi chạy trong sandbox; chạy lại ngoài sandbox thành công. Không có giá trị nào trong `.env.local` được ghi vào log/báo cáo.

## 5. Cổng kiểm tra Phase 1

- [ ] Có ít nhất 40 địa điểm thật: chưa đạt; CSV hiện chỉ có 20 fixture giả lập.
- [ ] `/`, `/explore`, `/place/:slug`, `/map` chạy với dữ liệu thật trên preview: chưa làm các trang T-014 → T-017.
- [x] T-011: CLI dry-run, ghi fixture, chạy lại idempotent và bộ kiểm tra CSV đã chạy.
- [ ] T-012: migration 8 và truy vấn `nearby_places` chưa chạy trên DB.
- [x] T-013: route test qua bằng `app.request`; kiểm tra 400/404/pagination/rate-limit.
- [ ] Không áp dụng migration remote khi chưa được chủ dự án cho phép.

## 6. Khác biệt so với tài liệu

- Mẫu CSV dùng dữ liệu giả lập có sẵn; đã để trống tag `sample` không tồn tại trong bảng `tags`, không thêm địa điểm thật.
- Nhiều tag trong query được hiểu theo OR; đã ghi rõ trong `docs/06-api-spec.md` để hành vi dễ kiểm tra.
- `nearby` dùng RPC `nearby_places` như phần migration 8 của `docs/05`/`docs/06`; `docs/06` được cập nhật để bỏ mô tả cũ dùng công thức client-side.
- Cập nhật trạng thái T-011/T-012/T-013 trong `docs/09-roadmap-tasks.md`; T-012 chưa tick hoàn tất do thiếu xác nhận live DB.

## 7. Điểm nghi ngờ, rủi ro, nợ kỹ thuật

- Migration 8 chưa chạy trên DB. Kiểu RPC trong `src/types/supabase.ts` được thêm thủ công để code typecheck trước khi sinh lại types sau khi migration được áp dụng.
- Route `/api/places/:slug` trả lỗi dịch vụ nếu RPC `nearby_places` chưa có trên DB.
- Rate limit dùng bộ nhớ của một instance; deploy nhiều instance có thể không chia sẻ bộ đếm, như giới hạn đã ghi trong `docs/06`.
- Đã ghi 20 fixture giả lập thành draft trên Supabase và chạy lại để kiểm tra upsert; chưa xóa fixture sau test.
- Ranh giới cảnh báo tọa độ Huế trong CLI là vùng ước tính 16.0–16.8°N, 107.0–108.0°E; cảnh báo không chặn import.

## 8. Cần chủ dự án

- Cho phép áp dụng migration 8 lên Supabase remote khi bạn đã review nhánh T-012/T-013.
- Cung cấp/nhập CSV 40–60 địa điểm có nguồn và ảnh có license/credit; hiện không tự tạo địa điểm thật.
- Quyết định có muốn xóa 20 dòng fixture draft đã import để test hay giữ lại trong DB.

## 9. Cách chạy thử

1. `pnpm db:seed -- --csv=supabase/seed/places.sample.csv --dry-run` để kiểm tra mà không ghi DB.
2. `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.
3. Sau khi chủ dự án cho phép áp dụng migration 8: chạy migration theo quy trình dự án, sau đó thử `GET /api/meta`, `/api/places`, `/api/places/map`, `/api/places/:slug` trên môi trường có Supabase.
4. Chưa làm T-014 → T-017.

## Cập nhật smoke API trên `chore/smoke-api` (25/10/2026)

Đã thêm `pnpm smoke:api` (`tsx scripts/smokeApi.ts`), gọi trực tiếp Hono `app.request` và dùng cấu hình Supabase từ `.env.local`. Script không in biến môi trường và chỉ dùng truy vấn đọc; không xuất bản hay ghi địa điểm. T-012/T-013 trong roadmap được để `[ ]` theo điều kiện chỉ đánh dấu hoàn thành khi smoke đạt trên dữ liệu thật.

### Đầu ra thật

`pnpm smoke:api`:

```text
Kết quả smoke:api
| Kiểm tra | Kết quả | Chi tiết |
|---|---|---|
| GET /api/meta: 10 tag và startPoints | FAIL | tags=10; startPoints=0 |
| GET /api/places: 200, phân trang và chỉ published | PASS | HTTP 200; 0 published; danh sách rỗng như mong đợi |
| GET /api/places pagination: trang kế tiếp | SKIP | Không có published data để kiểm tra phân trang |
| GET /api/places?category=<sai>: 400 | PASS | HTTP 400 |
| GET /api/places/map: schema dữ liệu nhẹ | PASS | HTTP 200; items=0; chỉ có trường DTO nhẹ |
| GET /api/places/:slug: nearby RPC hoạt động, không có chính nó | SKIP | Không có địa điểm published để kiểm tra |
| GET /api/places/:slug không tồn tại: 404 | PASS | HTTP 404 |
| GET draft slug: 404, không lộ dữ liệu | PASS | HTTP 404 |

Tổng: 5 đạt, 1 lỗi, 2 bỏ qua.
exit code 1
```

Các lệnh tiếp theo chạy trên nhánh này:

| Lệnh | Đầu ra thật |
|---|---|
| `pnpm typecheck` | `$ tsc --noEmit`; exit 0. |
| `pnpm lint` | `$ eslint .`; exit 0. |
| `pnpm test` | `Test Files 11 passed (11)`; `Tests 71 passed (71)`; `Duration 19.56s`; exit 0. |
| `pnpm build` | `✓ 268 modules transformed`; `✓ built in 5.61s`; exit 0. Có 2 cảnh báo `@__PURE__` từ Zod. |
| `supabase migration list` | Các migration `20261024000001` đến `20261024000008` đều có `local` và `remote` khớp; exit 0. |

Smoke chưa đạt nên T-012/T-013 không được đánh dấu hoàn tất. Cần nạp startPoints và dữ liệu địa điểm đã được chủ dự án kiểm chứng/xuất bản trước khi chạy lại các kiểm tra phụ thuộc published. Không có giá trị `.env.local` trong đầu ra/báo cáo.
