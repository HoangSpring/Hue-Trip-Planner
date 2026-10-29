# Báo cáo Phase 2C — Trình xem, chỉnh sửa lịch trình nháp, gợi ý thay thế và tạo lại ngày

> Ngày cập nhật: 2026-10-29. Đã hoàn thành các task T-025, T-026, T-027, T-028 trên các nhánh task tương ứng theo thứ tự phụ thuộc, chỉ commit cục bộ và KHÔNG push theo quy tắc git. Không áp dụng migration, không ghi/xóa dữ liệu Supabase.

## 1. Tóm tắt

- Hoàn thành toàn bộ luồng giao diện và API cho Phase 2C (T-025 → T-028) cho người dùng khách ở chế độ nháp tại `/trip/draft`:
  - **T-025:** Trình xem lịch trình nháp (`TripEditorPage`) với tab chọn ngày (`?day=`), timeline phân khung giờ, huy hiệu cảnh báo không chặn, đồng bộ 2 chiều với bản đồ số thứ tự Leaflet `MapView`, banner cho khách và notice API.
  - **T-026:** Trình chỉnh sửa cục bộ dùng pure reducer (`tripEditorReducer`), hỗ trợ hoàn tác ≥ 1 bước, kéo thả đổi thứ tự trên desktop kèm nút Lên/Xuống/Chuyển ngày trên mobile, xóa mục kèm toast 5s đếm ngược hoàn tác, sửa tiêu đề/giờ/thời lượng/ghi chú tại chỗ, tự động lưu `trip_draft_v1` sau debounce ~800ms, tự động tính lại di chuyển và cảnh báo.
  - **T-027:** API gợi ý thay thế `POST /api/trips/alternatives` (rate limit 60 req/min) theo công thức chấm điểm không LLM + bottom sheet/side panel "Gợi ý thay thế" và sheet "Thêm địa điểm" có bộ tìm kiếm và chọn khung giờ.
  - **T-028:** API tạo lại ngày `POST /api/trips/regenerate-day` (rate limit khách 6/hr, user 20/hr) giữ nguyên các mục khóa (`isLocked`) và tránh trùng lặp địa điểm với các ngày khác + hộp thoại xác nhận "Tạo lại ngày này" có nút khóa nhanh/mở khóa tất cả.
- Chạy kiểm tra đo tràn ngang viewport (1440, 1024, 768, 390px) đều đạt `PASS`; đã chụp 8 ảnh màn hình lưu tại `docs/reports/phase-2c-screens/`.
- Toàn bộ suite test Vitest đạt 28/28 file, 173/173 tests pass. `typecheck`, `lint`, `build` đều sạch sẽ.

## 2. Task đã hoàn thành

| Task | Nhánh / commit | Đã đạt "Hoàn thành khi"? | Ghi chú |
|---|---|---|---|
| T-025 | `feat/T-025-trip-viewer` · `19a0c4a` | Có | Hiển thị đúng lịch trình sinh ra từ `trip_draft_v1`; bản đồ đánh số đúng thứ tự theo ngày; cảnh báo hiển thị chip không chặn; header, banner khách, notice banner, đồng bộ URL `?day=` và `?item=`; guard `RequireTripDraft` chuyển về `/plan/new` nếu chưa có nháp. |
| T-026 | `feat/T-026-trip-editor` · `d3b3070` | Có | Pure reducer quản lý toàn bộ thao tác chỉnh sửa; hoàn tác ≥ 1 bước; kéo thả desktop HTML5 + nút Lên/Xuống/Chuyển ngày trên mobile; xóa kèm toast 5s hoàn tác; sửa tiêu đề, giờ đến, thời lượng, ghi chú (≤300 ký tự văn bản thuần); khóa/mở khóa mục; debounce ~800ms ghi `trip_draft_v1`; tính lại di chuyển và cảnh báo ngay; kiểm soát không trùng lặp địa điểm trong toàn chuyến đi. |
| T-027 | `feat/T-027-alternatives` · `c2c8f0e` | Có | Endpoint `POST /api/trips/alternatives` theo `docs/07` mục 14 (lọc cứng, cùng slot/loại, khoảng cách haversine, sắp xếp điểm giảm dần); sheet Gợi ý thay thế và sheet Thêm địa điểm (tìm kiếm, chọn slot, trạng thái "Đã thêm" disabled); rate limit 60 req/phút. |
| T-028 | `feat/T-028-regenerate-day` · `2cc2c56` | Có | Endpoint `POST /api/trips/regenerate-day` (khách 6/hr, user 20/hr, ghi nhận `generation_events`), giữ nguyên slot các mục khóa `isLocked`, bổ sung món ăn trưa nếu thiếu, không trùng lặp địa điểm với các ngày khác; hộp thoại `RegenerateDayDialog` giải thích cơ chế khóa kèm nút khóa nhanh/mở khóa tất cả; cập nhật reducer và toast hoàn tác. |

## 3. Task chưa xong hoặc làm một phần

| Task | Còn thiếu gì | Lý do |
|---|---|---|
| Lưu lên tài khoản / Chia sẻ link | Chưa lưu DB / Supabase | Thuộc Phase 4 (M4) theo roadmap. Ở phase này, nút "Lưu lịch trình" và "Chia sẻ" mở modal thông báo yêu cầu đăng nhập. |
| Sinh lịch trình bằng LLM | Chưa gọi LLM | Thuộc Phase 3 (M3) theo roadmap. Phase 2 dùng thuật toán dự phòng rule-based thuần. |

## 4. Kết quả chạy lệnh (2026-10-29)

### 4.1. `pnpm typecheck`
```text
$ tsc --noEmit
Exit code: 0
```

### 4.2. `pnpm lint`
```text
$ eslint .
Exit code: 0
```

### 4.3. `pnpm test`
```text
$ vitest run --passWithNoTests

 RUN  v3.2.4 D:/Hue Trip Planner

 ✓ src/components/ui/PlaceCard.test.tsx (3 tests) 59ms
 ✓ src/features/explore/ExploreFilters.test.tsx (1 test) 58ms
 ✓ server/itinerary/candidates.test.ts (6 tests) 38ms
 ✓ server/itinerary/scheduler.test.ts (7 tests) 42ms
 ✓ src/features/trip-wizard/GeneratingPage.test.tsx (5 tests) 359ms
 ✓ server/itinerary/fallback.test.ts (12 tests) 273ms
 ✓ src/features/trip-wizard/TripWizardPage.test.tsx (9 tests) 524ms
 ✓ server/routes/publicPlaces.test.ts (7 tests) 62ms
 ✓ server/routes/regenerateDay.test.ts (6 tests) 83ms
 ✓ server/middleware/auth.test.ts (4 tests) 37ms
 ✓ server/services/placeCsv.test.ts (6 tests) 46ms
 ✓ src/features/trip-editor/TripEditorPage.test.tsx (12 tests) 1502ms
 ✓ src/features/trip-wizard/storage.test.ts (8 tests) 28ms
 ✓ shared/itinerary/sampleData.test.ts (2 tests) 23ms
 ✓ server/mappers/place.test.ts (2 tests) 20ms
 ✓ server/routes/alternatives.test.ts (2 tests) 31ms
 ✓ server/middleware/publicReadRateLimit.test.ts (1 test) 26ms
 ✓ shared/schemas/tripInput.test.ts (7 tests) 17ms
 ✓ src/features/trip-editor/tripEditorReducer.test.ts (10 tests) 21ms
 ✓ shared/itinerary/warnings.test.ts (8 tests) 16ms
 ✓ server/routes/generateTrip.test.ts (6 tests) 98ms
 ✓ src/features/explore/query.test.ts (3 tests) 12ms
 ✓ server/itinerary/alternatives.test.ts (3 tests) 6ms
 ✓ shared/itinerary/itinerary.test.ts (6 tests) 6ms
 ✓ server/services/placeService.test.ts (1 test) 5ms
 ✓ src/features/home/HomePage.test.tsx (1 test) 7ms
 ✓ src/app/paths.test.ts (2 tests) 4ms
 ✓ src/app/router.test.tsx (33 tests) 9457ms

 Test Files  28 passed (28)
      Tests  173 passed (173)
   Duration  40.47s
Exit code: 0
```

### 4.4. `pnpm build`
```text
$ vite build
vite v6.4.1 building for production...
✓ 356 modules transformed.
dist/index.html                                 1.45 kB │ gzip:  0.54 kB
dist/assets/MapView-PlqXQvpS.css                0.70 kB │ gzip:  0.33 kB
dist/assets/vendor-BTrKGrB8.css                16.23 kB │ gzip:  6.60 kB
dist/assets/index-Dg3V83GP.css                 45.96 kB │ gzip:  8.85 kB
dist/assets/Dialog-BvNy_WZ5.js                  0.72 kB │ gzip:  0.45 kB
dist/assets/Button-BgyKZn51.js                  0.98 kB │ gzip:  0.54 kB
dist/assets/PlaceholderPage-B5vUGuv3.js         1.26 kB │ gzip:  0.69 kB
dist/assets/storage-DblLyAsv.js                 2.25 kB │ gzip:  0.84 kB
dist/assets/MapPage-DnkwPgNz.js                 2.85 kB │ gzip:  1.24 kB
dist/assets/DevAuthPage-CgrJlsf3.js             2.88 kB │ gzip:  1.13 kB
dist/assets/PlaceCard-Cp1FlfnI.js               3.02 kB │ gzip:  1.43 kB
dist/assets/MapView-DdmPxhqw.js                 4.01 kB │ gzip:  2.04 kB
dist/assets/ComponentGalleryPage-p2p5fAta.js    5.40 kB │ gzip:  1.77 kB
dist/assets/ExplorePage-DSobif2c.js             6.24 kB │ gzip:  2.14 kB
dist/assets/GeneratingPage-CKH-vyka.js          6.99 kB │ gzip:  2.46 kB
dist/assets/PlacePage-Dsr5g0OL.js               7.07 kB │ gzip:  2.59 kB
dist/assets/HomePage-DZVFpxpO.js                8.02 kB │ gzip:  2.52 kB
dist/assets/query-vendor-DDmTx9Vk.js           37.94 kB │ gzip: 11.44 kB
dist/assets/TripWizardPage-8uN9TqLw.js         40.86 kB │ gzip:  9.34 kB
dist/assets/index-D6nEtBPn.js                  44.98 kB │ gzip: 15.03 kB
dist/assets/TripEditorPage-Y1_l1oez.js         58.90 kB │ gzip: 15.19 kB
dist/assets/router-vendor-D95WC2Ot.js          93.52 kB │ gzip: 31.61 kB
dist/assets/react-vendor-BTjJNZCU.js          143.35 kB │ gzip: 45.97 kB
dist/assets/supabase-vendor-Be3faAhV.js       220.97 kB │ gzip: 57.52 kB
dist/assets/vendor-awTXMIve.js                286.39 kB │ gzip: 81.22 kB
✓ built in 7.85s
Exit code: 0
```

### 4.5. `pnpm smoke:api`
```text
$ tsx scripts/smokeApi.ts

Kết quả smoke:api
| Kiểm tra | Kết quả | Chi tiết |
|---|---|---|
| GET /api/meta: 10 tag và startPoints | PASS | HTTP 200; tags=10; startPoints=3 |
| GET /api/places: 200, phân trang và chỉ published | PASS | HTTP 200; total published=60; page 1=2; trang 2 hợp lệ |
| GET /api/places?category=<sai>: 400 | PASS | HTTP 400 |
| GET /api/places/map: schema dữ liệu nhẹ | PASS | HTTP 200; items=60; chỉ có trường DTO map |
| GET /api/places/:slug: nearby RPC hoạt động, không có chính nó | PASS | HTTP 200; nearby=5; không có chính nó |
| GET /api/places/:slug không tồn tại: 404 | PASS | HTTP 404 |
| GET draft slug: 404, không lộ dữ liệu | SKIP | Không tìm thấy draft để kiểm tra |

Tổng: 6 đạt, 0 lỗi, 1 bỏ qua.
Exit code: 0
```

### 4.6. Kiểm tra Responsive & Tràn ngang Viewport
Đo qua Playwright Chromium tại `http://localhost:4173/trip/draft`:
- Viewport 1440px: `document.documentElement.scrollWidth <= window.innerWidth` → **PASS**
- Viewport 1024px: `document.documentElement.scrollWidth <= window.innerWidth` → **PASS**
- Viewport 768px: `document.documentElement.scrollWidth <= window.innerWidth` → **PASS**
- Viewport 390px: `document.documentElement.scrollWidth <= window.innerWidth` → **PASS**

### 4.7. Danh mục ảnh chụp màn hình (`docs/reports/phase-2c-screens/`)
- `trip-draft-1440.png`: Màn hình soạn thảo lịch trình nháp desktop (2 cột: timeline + Leaflet map cố định bên phải).
- `trip-draft-390.png`: Màn hình soạn thảo lịch trình nháp mobile (timeline + nút xem bản đồ nổi).
- `alternatives-1440.png`: Modal/SidePanel "Gợi ý thay thế" trên desktop.
- `alternatives-390.png`: Bottom sheet "Gợi ý thay thế" trên mobile.
- `add-place-1440.png`: Modal "Thêm địa điểm vào ngày" có tìm kiếm và chọn khung giờ trên desktop.
- `add-place-390.png`: Bottom sheet "Thêm địa điểm vào ngày" trên mobile.
- `regenerate-dialog-1440.png`: Hộp thoại "Tạo lại lịch trình Ngày X" kèm danh sách khóa mục trên desktop.
- `regenerate-dialog-390.png`: Hộp thoại "Tạo lại lịch trình Ngày X" trên mobile.

## 5. Cổng kiểm tra cuối phase

- [x] Khách đi trọn luồng Landing → Wizard (`/plan/new`) → Chờ (`/plan/generating`) → Lịch trình & Chỉnh sửa (`/trip/draft`) không cần AI và không cần đăng nhập.
- [x] Bản đồ đánh số đúng thứ tự theo ngày đang chọn và đồng bộ 2 chiều với timeline.
- [x] Chỉnh sửa cục bộ lưu tự động vào `trip_draft_v1` (debounced ~800ms) có hoàn tác ≥ 1 bước.
- [x] Thao tác di chuyển mục hỗ trợ kéo thả trên desktop và nút bấm Lên/Xuống/Chuyển ngày trên mobile.
- [x] Cảnh báo tính toán tức thì (`computeWarnings`) và hiển thị chip không chặn thao tác.
- [x] Gợi ý thay thế (`POST /api/trips/alternatives`) và tạo lại ngày (`POST /api/trips/regenerate-day`) hoạt động chuẩn xác, giữ nguyên các mục khóa và không trùng lặp địa điểm.
- [x] Không áp dụng migration và không can thiệp ghi/xóa dữ liệu bảng `places` trên Supabase.

## 6. Khác biệt so với tài liệu

- Cảnh báo Rollup về comment `@__PURE__` trong gói `zod` là do dependency bên ngoài, hoàn toàn vô hại và build production vẫn thành công 100%.
- Để đảm bảo trải nghiệm tốt nhất trên cả desktop và mobile, các sheet "Gợi ý thay thế" và "Thêm địa điểm" hiển thị dạng bottom sheet bo góc trượt từ dưới lên trên màn hình < 640px và dạng modal căn giữa nổi bật trên màn hình ≥ 640px.

## 7. Điểm nghi ngờ, rủi ro, nợ kỹ thuật

- `trip_draft_v1` hiện lưu hoàn toàn ở client `localStorage`. Nếu người dùng xóa cache trình duyệt hoặc đổi thiết bị trước khi có tính năng đăng nhập ở Phase 4, dữ liệu nháp sẽ bị mất. Hệ thống đã có cơ chế cảnh báo và giữ nháp trong bộ nhớ phiên khi localStorage bị chặn.

## 8. Cần chủ dự án

1. Review và merge lần lượt 4 nhánh task cục bộ vào `main`:
   - `feat/T-025-trip-viewer` (commit `19a0c4a`)
   - `feat/T-026-trip-editor` (commit `d3b3070`)
   - `feat/T-027-alternatives` (commit `c2c8f0e`)
   - `feat/T-028-regenerate-day` (commit `2cc2c56`)
2. Chuẩn bị nhà cung cấp LLM và API key cho Phase 3 (`T-029`).

## 9. Cách chạy thử

1. Mở terminal khởi động API: `pnpm dev:api` (cổng 8787).
2. Mở terminal khởi động giao diện: `pnpm dev` (cổng 5173).
3. Truy cập `http://localhost:5173/`:
   - Nhấn "Bắt đầu lên lịch trình" để mở Wizard 6 bước tại `/plan/new`.
   - Chọn số ngày, người đi, sở thích, nhịp độ, điểm xuất phát và nhấn "Tạo lịch trình".
   - Màn hình chờ `/plan/generating` tự động gọi API sinh lịch trình và chuyển tiếp sang `/trip/draft`.
   - Tại `/trip/draft`:
     - Nhấn đổi thứ tự hoặc kéo thả các thẻ địa điểm.
     - Thử nhấn nút "Thay thế" trên một địa điểm để mở danh sách gợi ý.
     - Thử nhấn "+ Thêm địa điểm" để tìm kiếm và thêm địa điểm mới vào ngày.
     - Thử nhấn biểu tượng ổ khóa để khóa một điểm, sau đó nhấn "Tạo lại ngày này" để xem điểm khóa được giữ nguyên.
     - Thử xóa một địa điểm và bấm "Hoàn tác" trên toast xuất hiện ở góc dưới.
