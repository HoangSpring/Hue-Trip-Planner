# Báo cáo Phase 1b — Khám phá và giao diện địa điểm

> Cập nhật 26/10/2026. Đã làm T-015 → T-017 và phần giao diện T-014; T-014 chưa được đánh dấu hoàn tất vì chưa chạy Lighthouse mobile để xác nhận Performance ≥ 80. Không làm T-018 trở đi. Không áp dụng migration, không ghi/xóa dữ liệu Supabase.

## 1. Tóm tắt

- Xác nhận `main` có T-011, T-012, T-013 và `pnpm smoke:api`; smoke với Supabase thật đạt 7/7, có 46 địa điểm published.
- Thêm `pnpm dev:api` ở cổng 8787 và Vite proxy `/api` từ cổng 5173; kiểm tra GET `/api/health` qua cả hai cổng.
- Làm trang Khám phá, MapView và trang Bản đồ, Chi tiết địa điểm, Landing bằng dữ liệu API qua TanStack Query và schema Zod.
- Đã chụp 8 ảnh cho 4 route ở 1440px và 390px. Đã kiểm tra tràn ngang ở 1440, 1024, 768 và 390px.
- T-015, T-016, T-017 đạt tiêu chí task và được tick. T-014 còn thiếu phép đo Lighthouse; cổng M1 chưa đạt vì chưa có preview được triển khai.

## 2. Task đã hoàn thành

| Task | Nhánh / commit | Đã đạt “Hoàn thành khi”? | Ghi chú |
|---|---|---|---|
| T-015 | `feat/T-015-explore` · `9b255ca`, `84b0a70` | Có | Lọc loại/tag, tìm kiếm, sort, trang 24 mục; query string được Zod kiểm tra; trạng thái tải/rỗng/lỗi; có test logic và component bộ lọc. Nút tim được để ở T-040 theo roadmap. |
| T-017 | `feat/T-017-map` · `2233132` | Có | Leaflet + markercluster, marker theo loại, bộ lọc, thẻ xem nhanh, chế độ đánh số cho `MapView`, ghi công OSM và danh sách thay thế khi tile lỗi. Trình duyệt render 200 marker tổng hợp trong 1.441 ms, không có lỗi trang. |
| T-016 | `feat/T-016-place-detail` · `9facd76` | Có | Nội dung, trường rỗng được ẩn, 404, title/description riêng, liên kết bản đồ theo tọa độ, nearby và mini map dùng chung. Credit/license/source link hiển thị cạnh ảnh. |
| T-014 | `feat/T-014-landing` · xem commit cuối của nhánh | Một phần | Đã làm landing, featured lấy từ API và ẩn nếu rỗng, lịch trình mẫu, FAQ, SEO/OG và thẻ tiếp tục nháp đã kiểm tra Zod. Chưa có Lighthouse mobile Performance ≥ 80 nên giữ `[ ]`. |

T-012/T-013 được tick `[x]` ở `docs/09-roadmap-tasks.md` sau khi smoke thật trên main đạt 7/7. Kết quả này được ghi bổ sung trong `docs/reports/phase-1a-report.md`.

## 3. Task chưa xong hoặc làm một phần

| Task / cổng | Còn thiếu gì | Lý do |
|---|---|---|
| T-014 | Lighthouse mobile Performance ≥ 80 | Chưa chạy Lighthouse; không ghi nhận suy đoán là kết quả đo. |
| Cổng M1 | Xem 4 trang trên preview | 46 địa điểm thật đã published và các trang chạy cục bộ qua API thật, nhưng chưa triển khai preview. |
| Phase 1 tổng | Nhập ít nhất 40 địa điểm có nguồn/ảnh được chủ dự án xác minh | API hiện trả 46 published; tính xác thực/độ đầy đủ nguồn ảnh thực tế cần chủ dự án review. Không có dữ liệu nào được xuất bản trong lượt này. |

## 4. Kết quả chạy lệnh

### Kiểm tra trên `main` trước giao diện

| Lệnh | Đầu ra thật |
|---|---|
| `pnpm install --frozen-lockfile` | `Already up to date`; `Done in 62ms using pnpm v11.25.0`; exit 0. |
| `pnpm typecheck` | `$ tsc --noEmit`; exit 0. |
| `pnpm lint` | `$ eslint .`; exit 0. |
| `pnpm test` | `Test Files 11 passed (11)`; `Tests 71 passed (71)`; exit 0. |
| `pnpm build` | `✓ 268 modules transformed`; `✓ built in 2.88s`; exit 0. Hai cảnh báo Rollup về annotation `@__PURE__` trong Zod. |
| `pnpm smoke:api` | `Tổng: 7 đạt, 0 lỗi, 0 bỏ qua.`; exit 0. GET meta: tags=10/startPoints=3; places: total=46, pagination hợp lệ; map=46; nearby=5; invalid category=400; slug thiếu và draft=404. |

### Kiểm tra cuối trên nhánh `feat/T-014-landing`

| Lệnh | Đầu ra thật |
|---|---|
| `pnpm install --frozen-lockfile` | `Already up to date`; `Done in 55ms using pnpm v11.25.0`; exit 0. |
| `pnpm typecheck` | `$ tsc --noEmit`; exit 0. |
| `pnpm lint` | `$ eslint .`; exit 0. |
| `pnpm test` | `Test Files 15 passed (15)`; `Tests 79 passed (79)`; `Duration 14.40s`; exit 0. |
| `pnpm build` | `✓ 327 modules transformed`; `✓ built in 3.72s`; exit 0. Hai cảnh báo `@__PURE__` trong Zod vẫn còn. Main JS chunk `32.48 kB` (gzip `10.82 kB`); các trang tải thành chunk lazy riêng. |
| `pnpm smoke:api` | `Tổng: 7 đạt, 0 lỗi, 0 bỏ qua.`; exit 0. Chỉ GET/đọc qua API. |
| `supabase migration list` | Exit 0; migration `20261024000001` → `20261024000008` local/remote khớp. Chỉ liệt kê, không áp dụng migration. CLI báo có bản mới `v2.122.0`; đang dùng `v2.121.0`. |
| Kiểm tra local API | `pnpm dev:api` → `Local API listening at http://127.0.0.1:8787`; GET `/api/health` qua cổng 8787 và proxy Vite 5173 đều trả `{"status":"ok"}`. |
| Responsive | `/`, `/explore`, `/place/cau-truong-tien`, `/map` tại 1440/1024/768/390px: 16/16 lần đo `document.scrollWidth` và `body.scrollWidth` bằng viewport, đều `PASS`. |
| Markercluster | API mock trong trình duyệt, 200 marker tổng hợp: `rendered icons=15; 1441ms; page errors=0`; dữ liệu tổng hợp không ghi vào Supabase. |
| Screenshots | Playwright + Chrome chụp thành công `home`, `explore`, `place-cau-truong-tien`, `map` ở 1440px và 390px; xem `docs/reports/phase-1b-screens/`. Bản 390px là ảnh viewport để giữ đúng vị trí bottom navigation. |
| Lighthouse | Chưa chạy; không có đầu ra để báo cáo. |

## 5. Cổng kiểm tra cuối phase

Theo `docs/phases/phase-1-data-explore.md`:

- [x] Có ≥ 40 địa điểm thật trong API; smoke đọc được 46 địa điểm `published`.
- [ ] `/`, `/explore`, `/place/:slug`, `/map` chạy trên preview với dữ liệu thật; đã xác nhận cục bộ, chưa triển khai preview.

## 6. Khác biệt so với tài liệu

- API summary DTO có thêm `imageSourceUrl`; `nearby_places` được bổ sung truy vấn chỉ đọc để chuyển tiếp source URL cho ảnh gần đây. Cập nhật `docs/06-api-spec.md` và schema Zod. Không sửa migration.
- Ảnh địa điểm có `image_credit`, `image_license` và liên kết `image_source_url` khi có. URL ảnh bị lỗi sẽ chuyển sang SVG giữ chỗ nội bộ; không dùng `image_source_url` làm `src` và không dùng ảnh `lh3.googleusercontent.com`.
- Hero Landing được dựng bằng CSS/SVG nội bộ; lịch trình mẫu là nội dung tĩnh. Không sao chép `code.html` của Stitch và không thêm mục ngoài phạm vi.
- Leaflet dùng `react-leaflet@4.2.1` tương thích React 18 hiện tại, `leaflet@1.9.4` và `leaflet.markercluster@1.5.3`; `react-leaflet@5` bị loại vì yêu cầu React 19.

## 7. Điểm nghi ngờ, rủi ro, nợ kỹ thuật

- Hai cảnh báo bundle của Zod (`@__PURE__`) còn lại từ dependency; build vẫn exit 0.
- Lighthouse chưa đo; T-014 vẫn chưa hoàn tất theo tiêu chí roadmap.
- Tile OpenStreetMap cần kết nối mạng. Khi tile lỗi, `MapView` hiển thị danh sách địa điểm và attribution OSM vẫn hiện.
- Một số URL ảnh trong dữ liệu hiện tại không tải được ở Chrome khi chụp; ảnh được thay bằng placeholder nội bộ, trong khi credit/license/source gốc vẫn hiển thị để chủ dự án kiểm tra.
- Chưa triển khai preview và chưa tạo PR. Các nhánh đã tạo cục bộ để review.

## 8. Cần chủ dự án

- Review các nhánh `feat/T-015-explore`, `feat/T-017-map`, `feat/T-016-place-detail`, `feat/T-014-landing` theo thứ tự phụ thuộc; tự merge.
- Nếu cần đánh dấu T-014 hoàn tất, chạy Lighthouse mobile và xác nhận Performance ≥ 80.
- Review nguồn/giấy phép ảnh của các địa điểm; các API và UI hiển thị metadata hiện có nhưng không xác minh bản quyền thay chủ dự án.

## 9. Cách chạy thử

1. `pnpm install --frozen-lockfile`
2. Mở hai terminal: `pnpm dev:api` (API tại `http://127.0.0.1:8787`) và `pnpm dev` (frontend tại `http://127.0.0.1:5173`; Vite proxy `/api`).
3. Mở `/`, `/explore`, `/place/cau-truong-tien`, `/map`.
4. Lọc thử `/explore?category=heritage&tag=river&q=lang+tu+duc&page=1`; query sai được bỏ qua an toàn theo schema.
5. `pnpm smoke:api` chỉ đọc dữ liệu API thật. Không chạy `pnpm db:migrate` trong bước kiểm tra này.
