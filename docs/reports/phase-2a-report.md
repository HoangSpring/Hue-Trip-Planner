# Báo cáo Phase 2A — Thuật toán lịch trình dự phòng và API

## 1. Tóm tắt

Đã hoàn thành T-018 → T-022 trên năm nhánh task riêng, commit cục bộ và không push. Luồng sinh lịch trình hiện dùng thuật toán dự phòng thuần, có bộ lọc/chấm điểm, xếp lịch, cảnh báo, API giới hạn tần suất và kiểm tra dữ liệu địa điểm đã xuất bản. Đã chạy kiểm tra API công khai và bộ đánh giá 10 đầu vào chỉ đọc dữ liệu Supabase. Không áp dụng migration và không ghi/xóa địa điểm trên Supabase.

## 2. Task đã hoàn thành

| Task | Nhánh / commit | Đã đạt “Hoàn thành khi”? | Ghi chú |
|---|---|---|---|
| T-018 | `feat/T-018-candidates` / `f1ac271` | Có | Candidate repo Supabase chỉ đọc và fixture, lọc cứng/nới lỏng, scoring, pool và test. |
| T-019 | `feat/T-019-scheduler` / `778a865` | Có | Xếp theo khung/giờ mở cửa, giới hạn 21:30, tối ưu thứ tự và test. |
| T-020 | `feat/T-020-fallback` / `cabe39f` | Có | Thuật toán dự phòng xác định theo `now`/`seed`, lý do và golden/property tests; `LLM_ENABLED=false` mặc định. |
| T-021 | `feat/T-021-warnings` / `afc0679` | Có | Đủ mã cảnh báo với test dương tính/âm tính. |
| T-022 | `feat/T-022-generate-api` / `6c99598` | Có | `POST /api/trips/generate`, optional auth, rate limit, event store, abort signal, hydrate và API tests bằng service giả. |

Commit T-022 hiện là commit mới nhất của nhánh. Không tạo PR và không push theo yêu cầu.

## 3. Task chưa xong hoặc làm một phần

| Task | Còn thiếu gì | Lý do |
|---|---|---|
| T-023 trở đi | Chưa làm | Ngoài phạm vi được giao. |
| Cổng M2 đầy đủ | Chưa đạt luồng Landing → Wizard → Lịch trình → Chỉnh sửa | T-023 → T-028 chưa được yêu cầu; báo cáo này chỉ xác nhận T-018 → T-022. |
| Đánh giá chất lượng bằng người hiểu Huế | Chưa được chấm | File eval có bảng trống để chủ dự án chấm; cần hiệu chỉnh ngưỡng/tốc độ di chuyển theo thực tế. |

## 4. Kết quả chạy lệnh

Ngày chạy: **2026-10-27**. Lệnh `pnpm` bị sandbox Windows chặn khi mở khóa store (`ERR_PNPM_STORE_DIR_OPEN_OPERATION_LOCK`, `Access is denied`); các lệnh sau đó được chạy ngoài sandbox và trả kết quả như dưới đây. Đây là lỗi môi trường, không phải lỗi mã.

### Mốc trên `main` trước khi làm T-018

| Lệnh | Đầu ra thực |
|---|---|
| `pnpm install --frozen-lockfile` | Không chạy: `package.json` và lockfile trên `main` không đổi so với mốc đã xác nhận, theo điều kiện bỏ qua install. |
| `pnpm typecheck` | `$ tsc --noEmit` — exit 0. |
| `pnpm lint` | `$ eslint .` — exit 0. |
| `pnpm test` | `Test Files 15 passed (15)`; `Tests 79 passed (79)`; exit 0. |
| `pnpm build` | `✓ 327 modules transformed`; `✓ built in 3.47s`; exit 0. Có cảnh báo Rollup về vị trí comment `@__PURE__` trong Zod dependency. |
| `pnpm smoke:api` | 6 đạt, 0 lỗi, 1 bỏ qua. Meta: 10 tag, 3 start point; 60 published; category sai 400; map 60; nearby 5 không gồm chính nó; slug sai 404. Kiểm tra draft bỏ qua vì không tìm thấy draft. |

### Kiểm tra cuối nhánh T-022

| Lệnh | Đầu ra thực |
|---|---|
| `pnpm typecheck` | `$ tsc --noEmit` — exit 0. |
| `pnpm lint` | `$ eslint .` — exit 0. |
| `pnpm test` | `Test Files 20 passed (20)`; `Tests 107 passed (107)`; exit 0. Trong đó API generate có 6 test, router có 33 test. |
| `pnpm build` | `✓ 327 modules transformed`; `✓ built in 3.56s`; exit 0. Có cảnh báo Rollup về comment `@__PURE__` trong Zod dependency; không có lỗi build. |
| `pnpm smoke:api` | `GET /api/meta`: PASS (10 tags, 3 startPoints); `GET /api/places`: PASS (60 published; page 1=2, page 2 hợp lệ); category sai: PASS (400); map: PASS (60); place detail + nearby: PASS (5, không gồm chính nó); slug không tồn tại: PASS (404); draft slug: SKIP (không tìm thấy draft). Tổng: **6 đạt, 0 lỗi, 1 bỏ qua**. Đây là các endpoint đọc; không ghi DB. |
| `pnpm eval:itinerary` | `Đã ghi 10 kịch bản vào docs/eval/2026-10-27-fallback.md.`; `Dữ liệu: 60 published, 60 đủ điều kiện, 0 bị loại vì thiếu dữ liệu bắt buộc.` Exit 0. Chỉ đọc Supabase, không ghi địa điểm hay generation event. |

`pnpm install` không chạy lại trên nhánh task: không thêm dependency mới ở T-022; `fast-check` đã được thêm cùng lockfile ở T-020 để chạy property tests.

## 5. Cổng kiểm tra cuối phase

- [ ] Khách đi trọn luồng không cần AI/đăng nhập — chưa đạt trong phạm vi này; cần T-023 → T-028.
- [x] T-018 → T-022 — hoàn thành theo tiêu chí từng task trong roadmap.
- [x] Không ghi/xóa dữ liệu địa điểm hoặc áp dụng migration trên Supabase.
- [x] `LLM_ENABLED=false` mặc định; T-022 không gọi LLM.

## 6. Khác biệt so với tài liệu

- `docs/06-api-spec.md` đã ghi rõ T-022 trong Phase 2 chạy fallback hoàn toàn; cập nhật ví dụ response sang `by: fallback`, `model: null`, mô tả hủy truy vấn bằng `AbortSignal` và bổ sung hạn mức user/guest theo giờ/ngày.
- T-022 thêm script `pnpm eval:itinerary` và file kết quả cho 10 đầu vào như yêu cầu.
- Kiểm tra live `smoke:api` không tìm thấy địa điểm draft nên ca kiểm tra draft trả 404 được bỏ qua, không tự tạo hoặc đổi trạng thái dữ liệu.

## 7. Điểm nghi ngờ, rủi ro, nợ kỹ thuật

- Trong 60 địa điểm published đọc được, 60 đủ tọa độ và `visit_duration_min`; không địa điểm nào bị loại vì thiếu hai điều kiện bắt buộc này.
- **53/60 địa điểm thiếu `open_time` hoặc `close_time`**. Các trường này không loại địa điểm, nhưng làm giảm độ tin cậy khi xếp giờ và tạo cảnh báo `MISSING_HOURS`. Số thiếu `best_time`, `suitable_for`, `price_level` lần lượt là 0, 0, 0 theo lần chạy eval.
- Tất cả 10 kịch bản có output cấu trúc, nhưng bộ chấm điểm thủ công trong eval còn trống. Đặc biệt, lịch trình gia đình có thể không có bữa trưa nếu bộ lọc dữ liệu/nhịp độ không tìm được ứng viên ăn trưa; cảnh báo `LUNCH_MISSING` được trả thay vì bịa địa điểm.
- Smoke không xác minh được nhánh draft do DB hiện không có draft để thử. Endpoint generate được kiểm thử với repo/store giả, không gọi POST đến Supabase thật để tránh ghi `generation_events`.
- Build có cảnh báo dependency Zod/Rollup đã có ở baseline; build vẫn thành công.
- Bản sửa `AGENTS.md` có sẵn trước khi làm task vẫn để ngoài commit.

## 8. Cần chủ dự án

- Chấm các lịch trình trong [báo cáo eval](../eval/2026-10-27-fallback.md), nhất là tính hợp lý tuyến đường, bữa trưa và giờ mở cửa.
- Bổ sung/kiểm chứng giờ mở cửa cho 53 địa điểm đang thiếu giờ.
- Có thể cung cấp một draft đã tồn tại để chạy lại ca smoke kiểm tra draft; không cần thiết để xác nhận các ca đọc khác.
- Tự push/merge các nhánh sau khi xem xét. Agent chưa push.

## 9. Cách chạy thử

- Kiểm thử cục bộ: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.
- Bộ đánh giá đọc dữ liệu thật: `pnpm eval:itinerary`; kết quả tạo tại `docs/eval/<ngày>-fallback.md`.
- Smoke API đọc dữ liệu: `pnpm smoke:api`.
- POST generate có thể gọi qua `/api/trips/generate` khi server API đang chạy và đã cấu hình Supabase, `SUPABASE_SERVICE_ROLE_KEY`, `RATE_LIMIT_SALT`. Endpoint ghi `generation_events`; không gọi endpoint này trên DB thật nếu chưa muốn tạo event. Các test hiện tại dùng `app.request` với store/repo giả.
- Không áp dụng migration, không thực hiện thao tác ghi/xóa dữ liệu địa điểm.
