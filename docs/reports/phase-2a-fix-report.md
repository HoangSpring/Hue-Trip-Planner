# Báo cáo sửa chất lượng Phase 2A — T-020

## 1. Tóm tắt

Đã sửa phép tính ngày theo lịch Việt Nam, áp dụng ngày nghỉ theo từng ngày, bổ sung làm đầy lịch theo điểm số và thông báo thiếu ứng viên theo ngày. Đã sửa lý do theo category trước tag, tổng hợp `MISSING_HOURS` theo địa điểm, thêm kiểm thử property/regression và eval có `--explain`.

T-020 vẫn **chưa đạt**: eval V2 có một ngày thiếu mục trưa (V4 ngày 4), trong khi dữ liệu có 17 địa điểm food với `meal_type` lunch hoặc rỗng. Dù kết quả có `LUNCH_MISSING`, hiện chưa chứng minh được ngày đó thực sự không còn ứng viên xếp hợp lệ; do đó không tick lại T-020.

Không dùng LLM, không ghi dữ liệu Supabase, không chạy migration. Nhánh: `fix/T-020-fallback-quality`; không push.

## 2. Task

| Task | Trạng thái | Ghi chú |
|---|---|---|
| T-020 | Một phần, chưa đạt | R7 đạt trong 10 kịch bản eval và property test. R1 còn một ngày chưa có trưa, nguyên nhân cuối chưa được chứng minh. Giữ `[ ]` trong `docs/09-roadmap-tasks.md`. |

## 3. Thay đổi

- `shared/itinerary/calendar.ts`: ngày lịch dùng phép tính UTC date-only; ngày hiện tại lấy rõ múi giờ `Asia/Ho_Chi_Minh`.
- `server/itinerary/scheduler.ts`: kiểm tra ngày nghỉ theo ngày đã offset cho từng ngày.
- `server/itinerary/fallback.ts`: đặt trước các bữa trưa, lấp mục thiếu theo điểm số và luật cứng, phát `FEW_CANDIDATES` theo ngày khi thiếu; `LUNCH_MISSING` khi không xếp được trưa.
- `server/itinerary/reasons.ts`: mẫu theo category trước; 3 biến thể/category; tag chỉ thêm sau; không dùng lý do ăn uống cho shopping.
- `shared/itinerary/warnings.ts`: `MISSING_HOURS` có `itemId` và chỉ phát một lần mỗi địa điểm.
- `scripts/evalItinerary.ts`: thêm `--explain`, ghi V2 riêng, bảng V1→V2 và danh sách địa điểm thiếu giờ không lặp; chỉ đọc dữ liệu Supabase.
- Tests: ngày qua tháng/năm, ngày nghỉ, R1/R7, V2/V3/V6/V7/V8, reasons và warning dedupe; fast-check chạy 20 lượt.

## 4. Kết quả lệnh thật (2026-10-27)

`pnpm typecheck` — exit 0; đầu ra: `$ tsc --noEmit`.

`pnpm lint` — exit 0; đầu ra: `$ eslint .`.

`pnpm test` — exit 0; **20 test files passed, 117 tests passed**. Bộ property dùng 20 lượt.

`pnpm build` — exit 0; Vite build hoàn tất, 327 modules transformed. Có cảnh báo Rollup về vị trí annotation `@__PURE__` trong dependency Zod; build vẫn thành công.

`pnpm smoke:api` — **6 đạt, 0 lỗi, 1 bỏ qua**:

```text
| GET /api/meta: 10 tag và startPoints | PASS | HTTP 200; tags=10; startPoints=3 |
| GET /api/places: 200, phân trang và chỉ published | PASS | HTTP 200; total published=60; page 1=2; trang 2 hợp lệ |
| GET /api/places?category=<sai>: 400 | PASS | HTTP 400 |
| GET /api/places/map: schema dữ liệu nhẹ | PASS | HTTP 200; items=60; chỉ có trường DTO map |
| GET /api/places/:slug: nearby RPC hoạt động, không có chính nó | PASS | HTTP 200; nearby=5; không có chính nó |
| GET /api/places/:slug không tồn tại: 404 | PASS | HTTP 404 |
| GET draft slug: 404, không lộ dữ liệu | SKIP | Không tìm thấy draft để kiểm tra |
Tổng: 6 đạt, 0 lỗi, 1 bỏ qua.
```

`pnpm eval:itinerary --explain` — exit 0; ghi `docs/eval/2026-10-27-fallback-v2.md`:

```text
Đã ghi 10 kịch bản vào docs/eval/2026-10-27-fallback-v2.md.
Dữ liệu: 60 published, 60 đủ điều kiện, 0 bị loại vì dữ liệu bắt buộc.
So sánh V1 → V2: thiếu trưa 11 → 1; dưới sàn 12 → 0; cảnh báo 80 → 89.
```

Eval V2 cho biết 17 địa điểm food có meal type `lunch` hoặc rỗng; 0 địa điểm thiếu tọa độ/thời lượng; 53 địa điểm thiếu một trong `open_time`/`close_time` (không loại). V4 ngày 4 (2026-11-04) chưa có trưa; `--explain` ghi 19 ứng viên đã dùng trước ngày đó, 5 quá xa và 15 bị scheduler loại. Hiện diagnostics chưa tách được lý do của từng ứng viên food chưa dùng, vì thế chưa đủ bằng chứng kết luận không còn quán hợp lệ.

Ngày trong eval tăng đúng: 2026-11-01, 02, 03, 04 cho V4. V2 không còn ngày nào dưới sàn, nhưng nếu thiếu thì code phát `FEW_CANDIDATES` có ngày và lý do.

`pnpm install` không chạy vì không đổi package/lockfile. Lỗi mở pnpm store bị sandbox chặn trong phiên trước (`ERR_PNPM_STORE_DIR_OPEN_OPERATION_LOCK`, Access is denied) là lỗi môi trường theo `AGENTS.md`; các lệnh trên đã chạy được ngoài sandbox. Không in nội dung `.env.local`.

## 5. Khác biệt và điểm còn nghi ngờ

- Chỉ số cảnh báo tăng 80 → 89; đây là số cảnh báo V2 tính lại, với `MISSING_HOURS` được gộp một lần/địa điểm, nhưng các cảnh báo khác phát sinh theo các ngày/địa điểm V2 mới xếp.
- Một bữa trưa chưa được đảm bảo dù có 17 nhà hàng đủ điều kiện trên toàn bộ DB. Cần sửa thuật toán gán trưa hoặc diagnostics để chứng minh tính khả thi theo ngày và tránh `LUNCH_MISSING` sai.
- `smoke:api` không tìm thấy draft để kiểm tra 404; đây là SKIP vì không có dữ liệu draft, không phải lỗi.
- Không chấm thủ công chất lượng đường đi/lý do; bảng đánh giá trong eval vẫn để trống cho chủ dự án.

## 6. Cần chủ dự án

Không cần thay đổi Supabase. T-020 chưa tick; cần xử lý ngày thiếu trưa của V4, chạy lại eval và đạt 0 ngày thiếu trưa khi còn lựa chọn hợp lệ trước khi hoàn tất.

## 7. Cách kiểm tra

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm smoke:api
pnpm eval:itinerary --explain
```

Eval dùng anon client chỉ đọc published places/start points, không cập nhật dữ liệu.

