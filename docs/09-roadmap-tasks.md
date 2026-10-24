# 09 — Roadmap & Tasks

> Kế hoạch làm việc cho agent: các mốc (milestone), task theo thứ tự, phụ thuộc, đầu ra và cách kiểm tra.
> **Agent chọn task tiếp theo ở đây.** Không làm task có phụ thuộc chưa xong; không làm việc ngoài danh sách khi chưa hỏi.

## 1. Cách dùng file này

1. Chọn task **chưa hoàn thành** đầu tiên có mọi phụ thuộc (`Dep`) đã xong.
2. Đọc các tài liệu ở cột `Tham chiếu` của task đó.
3. Làm trên nhánh riêng: `feat/T-xxx-ten-ngan` (hoặc `fix/`, `chore/`, `docs/`). **Một task = một PR nhỏ.**
4. Chỉ đánh dấu xong khi **mọi mục trong "Hoàn thành khi"** đạt và `typecheck`, `lint`, `test` chạy qua.
5. Cập nhật ô trạng thái `[ ]` → `[x]` trong file này ở cùng PR; ghi chú ngắn nếu có thay đổi so với kế hoạch.
6. Nếu task mơ hồ hoặc mâu thuẫn tài liệu: **dừng và hỏi** (xem `AGENTS.md` mục 11). Với câu hỏi còn mở, dùng quyết định mặc định ở `docs/10-decisions.md`; chỉ hỏi khi mục đó ghi "Cần chủ dự án".

### Kích thước ước lượng
`S` ≈ vài giờ · `M` ≈ nửa đến một ngày · `L` ≈ 1–3 ngày (với một agent làm việc có người rà soát). Chỉ là gợi ý để chia nhỏ; task `L` nên được tách thêm nếu thấy quá lớn.

### Định nghĩa "Hoàn thành" chung (áp dụng cho mọi task)
- [ ] Đáp ứng đủ tiêu chí nghiệm thu liên quan trong `docs/02-features.md`.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test` đều qua.
- [ ] Có test cho logic nghiệp vụ mới (không bắt buộc cho thuần giao diện, nhưng nên có test hành vi cho thành phần quan trọng).
- [ ] Giao diện: đủ 4 trạng thái (loading, rỗng, lỗi, thành công), dùng tokens ở `docs/08-stitch-ui-prompt.md` mục D, kiểm tra ở 1280px và 360px.
- [ ] Không có secret trong code; biến môi trường mới đã thêm vào `.env.example` và `docs/06-api-spec.md` mục 13.
- [ ] Tài liệu bị ảnh hưởng đã cập nhật (route, API, data model...).
- [ ] PR có tóm tắt: đã làm gì, thay đổi file nào, điều gì chưa làm.

## 2. Tổng quan các mốc

| Mốc | Tên | Kết quả có thể xem/chạy được | Phase |
|---|---|---|---|
| **M0** | Nền móng | Repo chạy được, CI, DB + RLS, API khung, layout + tokens | 0 |
| **M1** | Dữ liệu và khám phá | Nhập ≥ 40 địa điểm qua CSV; xem `/explore`, `/place/:slug`, `/map` bằng dữ liệu thật | 1 |
| **M2** | Lịch trình không cần AI | Wizard → sinh lịch trình bằng **thuật toán dự phòng** → xem/sửa lịch trình (nháp, khách) | 2 |
| **M3** | AI thật | Thêm LLM + kiểm tra đầu ra + giới hạn tần suất; so sánh chất lượng với dự phòng | 3 |
| **M4** | Tài khoản và chia sẻ | Đăng nhập, lưu chuyến đi, đồng bộ nháp, địa điểm đã lưu, chia sẻ link | 4 |
| **M5** | Quản trị | Trang admin, import CSV có xem trước, duyệt dữ liệu | 5 |
| **M6** | Hoàn thiện và ra mắt | SEO/OG, a11y, hiệu năng, e2e, bảo mật, giám sát, triển khai | 6 |

> **Vì sao thứ tự này:** làm **dữ liệu trước** (không có dữ liệu thì mọi thứ phía sau vô nghĩa); làm **thuật toán dự phòng trước LLM** (kiểm soát được, test được, và là lưới an toàn); làm **chia sẻ/tài khoản sau** khi luồng chính đã chạy.
> **Lưu ý song song:** việc nhập nội dung địa điểm (của chủ dự án) có thể chạy song song với mọi phase. Đây thường là nút thắt thật sự, hãy bắt đầu sớm.

## 3. Đồ thị phụ thuộc (rút gọn)

```
M0 ──► M1 ──► M2 ──► M3
 │      │       │
 │      │       └──► M4 ──► M6
 │      └──────────► M5 ──► M6
 └ (T-006..T-010 song song được sau T-005)
```

---

## PHASE 0 — Nền móng (M0)

### [x] T-001 · Khởi tạo repo và công cụ · `S`
- **Tham chiếu:** `AGENTS.md` mục 3, 4, 5, 7
- **Dep:** —
- **Làm:** tạo dự án Vite + React + TypeScript (`strict`), Tailwind, React Router, TanStack Query, Zod; cấu trúc thư mục theo `AGENTS.md` (gồm `server/`, `shared/`); ESLint + Prettier; Vitest; Playwright (cấu hình khung); script `pnpm dev/typecheck/lint/test/build`.
- **Hoàn thành khi:** `pnpm dev` hiển thị trang trống; mọi script chạy không lỗi; alias đường dẫn (`@/`, `@shared/`) hoạt động ở cả frontend và server.

### [ ] T-002 · CI và quy ước PR · `S`
- **Dep:** T-001
- **Làm:** GitHub Actions chạy `typecheck`, `lint`, `test` cho mỗi PR; mẫu PR (checklist "Hoàn thành chung"); `.env.example`; `.gitignore` chặn `.env*`.
- **Hoàn thành khi:** PR thử có CI xanh; commit thử có secret giả bị phát hiện/không bị đưa vào (kiểm tra `.gitignore`).

### [ ] T-003 · Thiết lập Supabase và migration nền · `M`
- **Tham chiếu:** `docs/05-data-model.md` mục 4, 5
- **Dep:** T-001
- **Làm:** tạo project Supabase; cấu hình Supabase CLI; viết **migration 1–7** (extensions, profiles + trigger, places/tags/..., trips, saved + logs, RLS, storage); seed tag (`001_tags.sql`) và mốc xuất phát (`002_start_points.sql`); script `pnpm db:migrate`.
- **Hoàn thành khi:** migration chạy sạch trên DB trống; mọi bảng đã bật RLS; sinh được kiểu TypeScript (`supabase gen types`); có **test RLS** (user A không đọc/sửa dữ liệu của user B, khách không ghi `places`, user thường không ghi `places`).

### [x] T-004 · Zod schema và kiểu dùng chung · `M`
- **Tham chiếu:** `docs/05` mục 3, 7; `docs/06` mục 3
- **Dep:** T-001
- **Làm:** tạo `shared/schemas/` cho enum (loại, slot, nhịp độ...), `TripInput`, `PlaceSummary/Detail`, `Trip/TripDraft/TripItem/TripDay`, `Warning/Notice`, định dạng lỗi API.
- **Hoàn thành khi:** schema khớp tài liệu; có test hợp lệ/không hợp lệ cho `TripInput` (giới hạn 1–5 ngày, 2–6 sở thích, `notes` ≤ 300).

### [ ] T-005 · API khung (Hono trên Vercel) · `M`
- **Tham chiếu:** `docs/06` mục 1, 2, 12, 13
- **Dep:** T-001, T-004
- **Làm:** `api/[[...route]].ts` + `server/app.ts`; middleware `requestId`, `errorHandler` (định dạng lỗi chuẩn), `auth` (xác thực JWT bằng Supabase), `requireAdmin`, `cache`; đọc/kiểm tra biến môi trường bằng Zod; `GET /api/health`; `vercel.json` (rewrite); khung gọi API ở `src/lib/api.ts` (có kiểu, xử lý lỗi chuẩn, đính kèm token).
- **Hoàn thành khi:** triển khai thử lên Vercel (preview); `/api/health` trả 200; test cho middleware (401, 403, lỗi chuẩn hóa, `X-Request-Id`); không route nào lộ stack trace.

### [ ] T-006 · Layout, router và design tokens · `M`
- **Tham chiếu:** `docs/04` mục 2, 3, 5, 6; `docs/08` mục D
- **Dep:** T-001
- **Làm:** `createBrowserRouter` với toàn bộ route trong bảng (trang tạm), lazy loading; các layout (`PublicLayout`, `FlowLayout`, `TripLayout`, `AuthLayout`, `AccountLayout`, `AdminLayout`); guard (`RequireAuth`, `RequireGuest`, `RequireAdmin`, ...); `paths.ts`; tokens Tailwind + font (subset vietnamese); `NotFoundPage`, `ErrorPage`, `ForbiddenPage`; header (desktop, bố cục chính) và thanh tab dưới (mobile).
- **Hoàn thành khi:** mọi route trong `docs/04` điều hướng được; guard chuyển hướng đúng (kèm `next` an toàn); điều hướng dùng `paths.ts`; kiểm tra ở 360px.

### [x] T-007 · Bộ component giao diện dùng chung · `M`
- **Tham chiếu:** `docs/08` mục D2, D3
- **Dep:** T-006
- **Làm:** `Button`, `Chip/ChipGroup`, `Dialog`, `BottomSheet/SidePanel`, `Toast`, `Skeleton`, `EmptyState`, `PlaceCard`; chuỗi tiếng Việt ở `src/lib/strings/vi.ts`.
- **Hoàn thành khi:** có trang demo nội bộ (ví dụ `/dev/components`, chỉ bật khi `import.meta.env.DEV`); điều hướng bàn phím và `aria-label` đạt; không dùng mã màu cứng.

### [ ] T-008 · Tích hợp Supabase Auth ở client · `S`
- **Tham chiếu:** `docs/03` FL-03; `docs/04` mục 3
- **Dep:** T-003, T-006
- **Làm:** `src/lib/supabase.ts`; hook `useSession`, `useProfile` (qua `GET /api/me` sau khi có T-005); xử lý trạng thái "đang tải phiên" không nhấp nháy chuyển hướng.
- **Hoàn thành khi:** có thể đăng nhập thử bằng tài khoản test (giao diện hoàn chỉnh ở T-040); guard đọc được phiên và vai trò.

### [x] T-009 · Thư viện hàm thuần cho lịch trình (phần 1) · `M`
- **Tham chiếu:** `docs/07` mục 9.2, 9.3; `docs/06` mục 3
- **Dep:** T-004
- **Làm:** `shared/itinerary/geo.ts` (haversine), `openHours.ts` (`isOpenAt`, thứ ISO theo múi giờ VN), `travel.ts` (ước lượng di chuyển theo phương tiện, đọc `config`), `config.ts` (hằng số ở `docs/07` mục 18).
- **Hoàn thành khi:** test đầy đủ theo `docs/07` mục 17.2 (nhóm Giờ mở cửa, Di chuyển): mốc biên `close − 30'`, qua nửa đêm, ngày nghỉ, `unknown`.

### [x] T-010 · Mẫu CSV và bộ dữ liệu test · `S`
- **Tham chiếu:** `docs/05` mục 8; `docs/07` mục 17.1
- **Dep:** T-004
- **Làm:** `supabase/seed/places.sample.csv` (≥ 20 dòng thật hoặc giả hợp lý, có cả dòng thiếu giờ mở cửa/ngày nghỉ); `tests/fixtures/places.sample.json` (~40 địa điểm).
- **Hoàn thành khi:** tệp CSV khớp đúng cột của `docs/05` mục 8; fixture đủ các loại và có ca biên (thiếu giờ, đóng thứ Hai, mở qua nửa đêm).

> ✅ **Cổng kiểm tra M0:** triển khai preview chạy; CI xanh; DB + RLS có test; layout/route/guard hoạt động; hàm thuần có test.

---

## PHASE 1 — Dữ liệu và khám phá (M1)

### [x] T-011 · CLI import CSV vào Supabase · `M`
- **Tham chiếu:** `docs/05` mục 8, 9; `docs/06` mục 9.5
- **Dep:** T-003, T-004, T-010
- **Làm:** `pnpm db:seed` / script `supabase/seed/importPlaces.ts`: đọc CSV (UTF-8), kiểm tra từng dòng bằng Zod, upsert theo `slug`, gắn tag + trọng số, ghi `place_audit_log` (`import`); chế độ `--dry-run`; xuất báo cáo (tạo/cập nhật/bỏ qua/lỗi) và tệp CSV các dòng lỗi.
- **Hoàn thành khi:** import `places.sample.csv` thành công; chạy lại **không tạo trùng**; dòng thiếu `image_credit` (khi có ảnh) bị báo lỗi; mặc định `draft` + `verified = false`; **không ghi đè** địa điểm đã `verified` trừ khi có cờ rõ ràng; có test cho logic phân tích/kiểm tra.

### [x] T-012 · Logic dùng chung cho đọc địa điểm (service + mapper) · `M`
- **Tham chiếu:** `docs/06` mục 5; `docs/05`
- **Dep:** T-005, T-011
- **Làm:** `server/services/placeService.ts`, `server/mappers/place.ts` (snake_case → camelCase), truy vấn lọc theo loại/tag/tìm kiếm không dấu/sắp xếp/phân trang; RPC `nearby_places` (migration 8; chỉ RPC này thuộc task T-012).
- **Hoàn thành khi:** truy vấn chạy với dữ liệu đã import; "lang tu duc" tìm ra "Lăng Tự Đức"; chỉ trả `published`.

### [x] T-013 · API đọc dữ liệu công khai · `M`
- **Tham chiếu:** `docs/06` mục 5
- **Dep:** T-012
- **Làm:** `GET /api/meta`, `/api/places`, `/api/places/map`, `/api/places/:slug` (kèm `nearby`); header `Cache-Control` công khai.
- **Hoàn thành khi:** test theo `docs/06` mục 15 (thành công, 400 với `category`/`tag` lạ, 404 slug sai hoặc chưa published); phân trang đúng.

### [ ] T-014 · Trang Landing (F-01) · `M`
- **Tham chiếu:** `docs/02` F-01; `docs/08` S01
- **Dep:** T-007, T-013
- **Làm:** hero, "Cách hoạt động", địa điểm nổi bật (dữ liệu thật, ẩn khi rỗng), lịch trình mẫu tĩnh, FAQ, chân trang có ghi công; thẻ "Tiếp tục chuyến đi" khi có `wizard_draft_v1`/`trip_draft_v1`; SEO cơ bản.
- **Hoàn thành khi:** đạt AC F-01; Lighthouse mobile Performance ≥ 80.

### [ ] T-015 · Trang Khám phá (F-02) · `M`
- **Tham chiếu:** `docs/02` F-02; `docs/04` mục 4; `docs/08` S02
- **Dep:** T-007, T-013
- **Làm:** lưới thẻ, bộ lọc loại/tag, ô tìm kiếm, sắp xếp, bộ lọc **đồng bộ query string** (kiểm tra bằng Zod), trạng thái rỗng/lỗi/skeleton, phân trang hoặc "Xem thêm".
- **Hoàn thành khi:** đạt AC F-02 (trừ phần nút tim cho khách, hoàn thiện ở T-040); mở lại URL cho cùng kết quả.

### [ ] T-016 · Trang Chi tiết địa điểm (F-03) · `M`
- **Tham chiếu:** `docs/02` F-03; `docs/08` S03
- **Dep:** T-007, T-013
- **Làm:** ảnh + ghi công, thông tin chính, mô tả, mini map, "Chỉ đường" (link tọa độ), khối "Gần đây", cảnh báo "thông tin có thể thay đổi"; ẩn trường rỗng; 404 cho slug sai; SEO (title/description riêng, dữ liệu cấu trúc).
- **Hoàn thành khi:** đạt AC F-03. (Nút "Lưu" gắn ở T-040, nút "Thêm vào chuyến đi" gắn ở T-041.)

### [ ] T-017 · Trang Bản đồ (F-04) · `M`
- **Tham chiếu:** `docs/02` F-04; `docs/08` S04
- **Dep:** T-007, T-013
- **Làm:** component `MapView` dùng chung (Leaflet/MapLibre), marker theo loại, gom cụm, thẻ xem nhanh, bộ lọc loại, ghi công OSM, chế độ đánh số (dùng lại ở trình chỉnh lịch trình), phương án thay thế khi bản đồ lỗi.
- **Hoàn thành khi:** đạt AC F-04, mượt với ≥ 200 marker; ghi công OSM luôn thấy.

> ✅ **Cổng kiểm tra M1:** ≥ 40 địa điểm thật đã nhập (có thể là bản nháp đã duyệt qua DB); `/`, `/explore`, `/place/:slug`, `/map` chạy bằng dữ liệu thật trên bản preview.

---

## PHASE 2 — Lịch trình không cần AI (M2)

### [ ] T-018 · Pipeline phần dữ liệu: ứng viên, chấm điểm, nhóm ứng viên · `M`
- **Tham chiếu:** `docs/07` mục 4, 5, 6
- **Dep:** T-009, T-012
- **Làm:** `candidates.ts` (tải, lọc cứng, nới lỏng + `Notice`), `scoring.ts` (công thức có trọng số ở `config.ts`), `pool.ts`; interface `PlacesRepo`.
- **Hoàn thành khi:** test theo `docs/07` mục 17.2 (Chấm điểm, Lọc & nới lỏng, Pool); hòa điểm theo `slug`; `NO_CANDIDATES` khi không đủ.

### [ ] T-019 · Bộ xếp giờ (scheduler) · `M`
- **Tham chiếu:** `docs/07` mục 7, 9.1
- **Dep:** T-009, T-018
- **Làm:** `scheduler.ts`: giờ bắt đầu ngày, đồng bộ khung giờ, dời đến giờ mở cửa, không quá 21:30, xử lý mục không xếp được (hoán khung/thay thế/bỏ), tối ưu thứ tự trong khung (láng giềng gần nhất).
- **Hoàn thành khi:** test nhóm Scheduler; không mục nào ngoài giờ mở cửa đã biết; `position` liên tục từ 0.

### [ ] T-020 · Thuật toán dự phòng + lý do mẫu · `L`
- **Tham chiếu:** `docs/07` mục 7, 11
- **Dep:** T-018, T-019
- **Làm:** `fallback.ts`, `reasons.ts`; hàm `generateTrip` chạy **chỉ bằng dự phòng** (cờ `LLM_ENABLED=false` mặc định ở giai đoạn này) trả `TripDraft` + `Warning` + `Notice`.
- **Hoàn thành khi:** golden test (cùng đầu vào → cùng kết quả); thỏa R1–R8 trên ≥ 10 đầu vào; property test (`docs/07` mục 17.3): không trùng địa điểm, mọi `placeId` thuộc DB, số mục/ngày đúng khoảng, không kết thúc sau 21:30.

### [ ] T-021 · Hàm cảnh báo và `computeWarnings` · `S`
- **Tham chiếu:** `docs/07` mục 15
- **Dep:** T-009
- **Làm:** `shared/itinerary/warnings.ts` đủ các mã; tính lại di chuyển khi thay đổi thứ tự.
- **Hoàn thành khi:** mỗi mã cảnh báo có test dương tính và âm tính.

### [ ] T-022 · API `POST /api/trips/generate` (chạy dự phòng) + giới hạn tần suất · `M`
- **Tham chiếu:** `docs/06` mục 2.8, 6.1; `docs/07` mục 16
- **Dep:** T-020, T-021, T-005
- **Làm:** endpoint `optionalAuth`; kiểm tra `TripInput`; giới hạn tần suất (băm `client_key` bằng `RATE_LIMIT_SALT`); ghi `generation_events`; hỗ trợ `AbortSignal`; `422 NO_CANDIDATES`; hydrate `place` trong kết quả.
- **Hoàn thành khi:** test theo `docs/06` mục 15 (400/422/429 kèm `Retry-After`); mọi `placeId` kết quả tồn tại và published; không log `notes`.

### [ ] T-023 · Wizard `/plan/new` (F-05) · `L`
- **Tham chiếu:** `docs/02` F-05; `docs/03` FL-01; `docs/04` mục 4; `docs/08` S05–S10
- **Dep:** T-007, T-013 (cho `/api/meta`), T-004
- **Làm:** 6 bước, `step` trên URL, React Hook Form + Zod, tự lưu `wizard_draft_v1` (kiểm tra Zod khi đọc), bước tóm tắt có thể quay lại sửa; chọn điểm xuất phát (preset + ghim bản đồ).
- **Hoàn thành khi:** đạt AC F-05; tải lại trang giữa chừng vẫn giữ dữ liệu; không cuộn ngang ở 360px; hộp "Tiếp tục / Làm lại".

### [ ] T-024 · Màn hình `/plan/generating` và lưu nháp cục bộ · `M`
- **Tham chiếu:** `docs/03` FL-01; `docs/04` mục 4; `docs/08` S11
- **Dep:** T-022, T-023
- **Làm:** gọi `generate` (hủy được), các trạng thái lỗi/429/mất mạng, ghi `trip_draft_v1` (kèm `clientDraftId`), điều hướng `replace` sang `/trip/draft`; xử lý localStorage không dùng được.
- **Hoàn thành khi:** luồng wizard → sinh → mở `/trip/draft` chạy end-to-end với dự phòng; nút Back không quay lại màn hình chờ.

### [ ] T-025 · Trình xem lịch trình (chế độ nháp) · `L`
- **Tham chiếu:** `docs/02` F-07; `docs/03` FL-04.1; `docs/08` S12
- **Dep:** T-017, T-024, T-021
- **Làm:** `TripEditorPage` chế độ `draft`: tab ngày, timeline theo khung giờ, thẻ mục (lý do, di chuyển, cảnh báo), bản đồ đánh số theo ngày, ngăn xem nhanh; bố cục mobile/desktop; `day` và `item` trên URL.
- **Hoàn thành khi:** hiển thị đúng lịch trình sinh ra; bản đồ đánh số đúng thứ tự; cảnh báo hiển thị không chặn.

### [ ] T-026 · Chỉnh sửa lịch trình (cục bộ) · `L`
- **Tham chiếu:** `docs/03` FL-04.2–4.7; `docs/07` mục 14, 15
- **Dep:** T-025
- **Làm:** quản lý state chỉnh sửa (reducer + hoàn tác ≥ 1 bước); đổi thứ tự/chuyển ngày (kéo thả desktop, nút lên/xuống mobile); xóa + hoàn tác; sửa tiêu đề/giờ/ghi chú; khóa mục; tính lại di chuyển và cảnh báo; ghi `trip_draft_v1` (debounce).
- **Hoàn thành khi:** AC F-07 phần chỉnh sửa đạt trên nháp; test cho reducer (đổi thứ tự, xóa, hoàn tác, không trùng địa điểm).

### [ ] T-027 · API gợi ý thay thế + sheet Thay thế/Thêm · `M`
- **Tham chiếu:** `docs/07` mục 14; `docs/06` mục 6.3; `docs/03` FL-04.4–4.5; `docs/08` S13
- **Dep:** T-018, T-026
- **Làm:** `alternatives.ts` + `POST /api/trips/alternatives`; bottom sheet "Gợi ý thay thế" và "Thêm địa điểm" (tìm kiếm, chọn khung giờ, trạng thái "Đã thêm").
- **Hoàn thành khi:** test: không trả chính nó, không trả địa điểm trong `excludePlaceIds`, tôn trọng giờ mở cửa; giao diện có trạng thái rỗng.

### [ ] T-028 · Tạo lại một ngày (dự phòng) · `M`
- **Tham chiếu:** `docs/07` mục 13; `docs/06` mục 6.2; `docs/03` FL-04.6
- **Dep:** T-020, T-026
- **Làm:** `regenerateDay` (dùng dự phòng ở giai đoạn này) + `POST /api/trips/regenerate-day`; hộp thoại khóa mục; thay nội dung một ngày, có hoàn tác.
- **Hoàn thành khi:** các ngày khác không đổi; không tạo trùng địa điểm với ngày khác; mục khóa giữ nguyên slot.

> ✅ **Cổng kiểm tra M2 (quan trọng):** người dùng **khách** đi trọn luồng Landing → Wizard → Lịch trình → Chỉnh sửa **không cần AI và không cần đăng nhập**. Chủ dự án chạy bộ **10 đầu vào mẫu** (`docs/07` mục 17.4) và chấm chất lượng thuật toán dự phòng. Đây là mốc đầu tiên đáng để cho người thật dùng thử.

---

## PHASE 3 — AI thật (M3)

### [ ] T-029 · `LlmClient`, nhà cung cấp và `FakeLlmClient` · `M`
- **Tham chiếu:** `docs/07` mục 8.1, 17.1; `docs/06` mục 13
- **Dep:** T-020, **chủ dự án đã chọn nhà cung cấp LLM**
- **Làm:** interface `LlmClient`; một provider thật (đọc `LLM_API_KEY`, `LLM_MODEL`); `FakeLlmClient` có các kịch bản lỗi (id sai, trùng, thiếu ngày, không có bữa trưa, JSON hỏng, timeout, quá dài, URL/HTML trong `reason`); ghi nhận token từ phản hồi.
- **Hoàn thành khi:** gọi thử thành công ở môi trường phát triển; timeout hoạt động bằng `AbortSignal`; không log nội dung prompt/phản hồi.

### [ ] T-030 · Prompt, làm sạch `notes`, schema đầu ra · `M`
- **Tham chiếu:** `docs/07` mục 8, 12
- **Dep:** T-029
- **Làm:** `prompt.ts` (system prompt có `PROMPT_VERSION`, user message là JSON), `sanitizeNotes`, `shared/schemas/llmItinerary.ts`, dữ liệu ứng viên rút gọn (tọa độ làm tròn, `summary` ≤ 160 ký tự).
- **Hoàn thành khi:** snapshot test của user message; `notes` không bao giờ nối vào system prompt; test `sanitizeNotes`.

### [ ] T-031 · Kiểm tra và sửa đầu ra LLM · `L`
- **Tham chiếu:** `docs/07` mục 10
- **Dep:** T-030, T-019
- **Làm:** `validate.ts` thực hiện V1–V10; tính `coverage`; quyết định "đủ tốt" (≥ 0.7); lượt gọi sửa lỗi tối đa 1 lần (nếu < 8 giây); thứ tự trong khung.
- **Hoàn thành khi:** mỗi kịch bản của `FakeLlmClient` cho kết quả đúng như bảng V1–V10; không bao giờ có `placeId` ngoài nhóm ứng viên đã gửi.

### [ ] T-032 · Tích hợp LLM vào pipeline + công tắc, cầu chì, dự phòng · `M`
- **Tham chiếu:** `docs/07` mục 2, 10.2, 16; `docs/06` mục 2.8, 6.1
- **Dep:** T-031, T-022
- **Làm:** `pipeline.ts`: LLM → kiểm tra → dự phòng khi cần; `LLM_ENABLED`, `LLM_DAILY_CALL_CAP`; ghi `fallbackReason`, `repairs`, `coverage`, `PROMPT_VERSION`, token; `regenerateDay` dùng LLM trước, dự phòng sau; `notice FALLBACK_USED`.
- **Hoàn thành khi:** test pipeline (LLM tắt/timeout/hỏng/`coverage` thấp → dự phòng, vẫn `200`); test an toàn với `notes` độc hại; p90 ≤ 15 giây trong thử nghiệm thực tế.

### [ ] T-033 · Đánh giá chất lượng và hiệu chỉnh · `M`
- **Tham chiếu:** `docs/07` mục 17.4, 18
- **Dep:** T-032, **chủ dự án tham gia chấm**
- **Làm:** chạy bộ 10 đầu vào mẫu với dự phòng và với LLM; ghi kết quả `docs/eval/<ngày>-<PROMPT_VERSION>.md`; điều chỉnh trọng số, ngưỡng, prompt nếu cần.
- **Hoàn thành khi:** có báo cáo so sánh; chủ dự án quyết định mặc định (LLM hay chỉ dự phòng cho khách).

> ✅ **Cổng kiểm tra M3:** lịch trình do LLM sinh vượt hoặc ngang dự phòng theo chấm điểm của chủ dự án; **không có** địa điểm bịa; tắt LLM bằng cờ vẫn chạy.

---

## PHASE 4 — Tài khoản, lưu và chia sẻ (M4)

### [ ] T-034 · Migration RPC lưu chuyến đi · `M`
- **Tham chiếu:** `docs/06` mục 10; `docs/05` mục 5.4
- **Dep:** T-003
- **Làm:** migration 9: `save_trip`, `create_trip_from_payload` (idempotent theo `(user_id, client_draft_id)`); bảo đảm `SECURITY INVOKER`, giữ RLS. Migration 8 `nearby_places` thuộc T-012.
- **Hoàn thành khi:** test: lưu hai lần cùng `clientDraftId` chỉ tạo một bản ghi; `p_expected_updated_at` lệch → lỗi phiên bản; user B không ghi được vào chuyến đi của A.

### [ ] T-035 · API chuyến đi của người dùng · `L`
- **Tham chiếu:** `docs/06` mục 7
- **Dep:** T-034, T-005
- **Làm:** `GET/POST /api/trips`, `GET/PUT/PATCH/DELETE /api/trips/:id`, `POST /:id/duplicate`; kiểm tra quy tắc (không trùng địa điểm, số ngày/mục, làm sạch chuỗi, tính lại di chuyển); `409 CONFLICT`; `MAX_TRIPS_PER_USER`.
- **Hoàn thành khi:** toàn bộ test `docs/06` mục 15 cho nhóm này; cách ly dữ liệu giữa hai user; địa điểm `archived` vẫn hiển thị trong chuyến đi cũ.

### [ ] T-036 · Lưu chuyến đi từ trình chỉnh sửa (chế độ đã lưu) · `L`
- **Tham chiếu:** `docs/03` FL-02, FL-04; `docs/04` (trang `/trip/:id`)
- **Dep:** T-035, T-026, T-008
- **Làm:** `TripEditorPage` chế độ `saved`: tải từ API, **tự động lưu** (debounce ~800 ms) qua `PUT`, chỉ báo "Đang lưu / Đã lưu", xử lý `409` ("Tải lại?"), cập nhật lạc quan + hoàn lại khi lỗi; `/plan/generating` lưu ngay khi đã đăng nhập (FL-02) và xử lý lưu lỗi (giữ nháp, banner "Lưu lại").
- **Hoàn thành khi:** AC F-07 phần lưu đạt; tải lại trang giữ nguyên thay đổi; người không phải chủ nhận 404.

### [ ] T-037 · Trang Đăng nhập/Đăng ký/Quên mật khẩu (F-08) · `M`
- **Tham chiếu:** `docs/02` F-08; `docs/03` FL-03; `docs/08` S14
- **Dep:** T-008, T-007
- **Làm:** `/login`, `/register`, `/forgot-password`, `/reset-password`, `/auth/callback`; email + mật khẩu và Google (nếu đã chốt); giữ `next` an toàn; thông báo lỗi tiếng Việt, không tiết lộ email có tồn tại.
- **Hoàn thành khi:** đạt AC F-08 (trừ đồng bộ nháp, làm ở T-038).

### [ ] T-038 · Đồng bộ nháp khi đăng nhập · `M`
- **Tham chiếu:** `docs/03` FL-03
- **Dep:** T-035, T-037
- **Làm:** sau đăng nhập: nếu có `trip_draft_v1` thì `POST /api/trips` (idempotent), xóa nháp, mở `/trip/:id`; xử lý `pending_action`; xử lý lỗi (giữ nháp + banner thử lại).
- **Hoàn thành khi:** nháp không mất, không bị nhân đôi dù tải lại hoặc gọi hai lần; test e2e đăng nhập giữa luồng.

### [ ] T-039 · Chuyến đi của tôi (F-09) và Cài đặt tài khoản · `M`
- **Tham chiếu:** `docs/02` F-09; `docs/06` mục 7.1, 8.4; `docs/08` S15, S16B
- **Dep:** T-035, T-037
- **Làm:** `/account/trips` (mở, đổi tên, nhân bản, xóa có xác nhận), `/account/settings` (đổi tên, đăng xuất, xóa tài khoản hai bước); `GET/PATCH/DELETE /api/me`.
- **Hoàn thành khi:** đạt AC F-09; xóa tài khoản xóa sạch dữ liệu liên quan (kiểm tra cascade); nhân bản không kế thừa `share_token`.

### [ ] T-040 · Địa điểm đã lưu (F-10) · `M`
- **Tham chiếu:** `docs/02` F-10; `docs/06` mục 8.3; `docs/08` S16A
- **Dep:** T-005, T-015, T-016, T-037
- **Làm:** API `GET/PUT/DELETE /api/saved`; nút tim (optimistic + hoàn lại khi lỗi) ở thẻ, chi tiết, bản đồ; trang `/account/saved`; khách bấm tim → mời đăng nhập với `pending_action`; "Thêm vào chuyến đi" từ danh sách.
- **Hoàn thành khi:** đạt AC F-10; trạng thái tim đồng nhất giữa các trang; hoàn thành nốt AC còn thiếu ở F-02 (khách bấm tim).

### [ ] T-041 · "Thêm vào chuyến đi" từ trang địa điểm · `S`
- **Tham chiếu:** `docs/03` FL-04.5
- **Dep:** T-016, T-026, T-036
- **Làm:** nút ở `/place/:slug`: chọn chuyến đi (user) hoặc dùng nháp (khách), chọn ngày/khung giờ; chặn địa điểm đã có.
- **Hoàn thành khi:** đạt phần liên quan trong AC F-03/F-07.

### [ ] T-042 · Chia sẻ lịch trình (F-11) · `M`
- **Tham chiếu:** `docs/02` F-11; `docs/06` mục 7.8, 8.1, 8.2; `docs/08` S17
- **Dep:** T-036
- **Làm:** `PUT /api/trips/:id/share` (token ngẫu nhiên ≥ 128 bit, tắt xóa token), `GET /api/shared/:token` (service role, lược bỏ dữ liệu cá nhân, `no-store`, `noindex`, giới hạn tần suất theo IP), `POST /api/shared/:token/copy`; sheet chia sẻ; trang `/s/:shareToken` chỉ đọc; trạng thái "không còn được chia sẻ".
- **Hoàn thành khi:** đạt AC F-11; test: token đã tắt không trả dữ liệu, không lộ trường bị lược bỏ; bật lại tạo token mới.

> ✅ **Cổng kiểm tra M4:** luồng khách → đăng nhập → lịch trình được lưu → chia sẻ link → người khác xem/sao chép chạy trọn vẹn; test cách ly dữ liệu xanh.

---

## PHASE 5 — Quản trị (M5)

### [ ] T-043 · API quản trị địa điểm · `L`
- **Tham chiếu:** `docs/06` mục 9.1–9.4
- **Dep:** T-012, T-005
- **Làm:** `GET/POST /api/admin/places`, `GET/PUT /:id`, `POST /:id/status`, `POST /:id/verify`; kiểm tra bằng Zod + chuyển lỗi `CHECK` của DB sang thông báo tiếng Việt; ghi `place_audit_log`; `missingFields`.
- **Hoàn thành khi:** user thường nhận `403` ở mọi endpoint; xuất bản thiếu trường bắt buộc → `422` kèm danh sách; slug trùng → `409`.

### [ ] T-044 · Trang quản trị: danh sách và form địa điểm · `L`
- **Tham chiếu:** `docs/02` F-12; `docs/03` FL-08.1; `docs/08` S18, S19
- **Dep:** T-043, T-006
- **Làm:** `/admin/places` (bộ lọc, bảng, thao tác hàng loạt), `/admin/places/new|:id` (form theo nhóm, ghim bản đồ, tải ảnh lên Storage, **bắt buộc** ghi công + giấy phép ảnh, gán tag + trọng số, nút Duyệt riêng).
- **Hoàn thành khi:** đạt AC F-12 phần tạo/sửa; địa điểm vừa xuất bản hiện ở `/explore`; không lưu được ảnh khi thiếu ghi công.

### [ ] T-045 · Import CSV có xem trước (giao diện + API) · `L`
- **Tham chiếu:** `docs/06` mục 9.5; `docs/03` FL-08.2; `docs/08` S20
- **Dep:** T-043, T-011
- **Làm:** `POST /api/admin/import/preview|commit` (tái dùng logic ở T-011), quyết định lưu `previewToken` (bảng tạm / KV / gửi lại CSV), trang `/admin/import` 3 bước, tải tệp CSV dòng lỗi.
- **Hoàn thành khi:** đạt AC F-12 phần import; import lại không tạo trùng; không ghi đè địa điểm `verified` nếu không chọn rõ.

> ✅ **Cổng kiểm tra M5:** người không rành kỹ thuật có thể thêm/sửa/duyệt địa điểm và import CSV mà không đụng DB.

---

## PHASE 6 — Hoàn thiện và ra mắt (M6)

### [ ] T-046 · SEO, Open Graph và sitemap · `M`
- **Tham chiếu:** `docs/04` mục 7; `docs/06` mục 12
- **Dep:** T-014, T-016, T-042
- **Làm:** quản lý `<title>`/meta phía client; `/api/og/place/:slug`, `/api/og/share/:token` và rewrite theo user-agent bot; `sitemap.xml`; `robots.txt` (chặn `/admin`, `/account`, `/trip`, `/s`, `/plan/generating`, `/api`); `noindex` đúng trang.
- **Hoàn thành khi:** thử bằng công cụ xem trước chia sẻ (Facebook/Zalo) ra đúng tiêu đề/ảnh; sitemap liệt kê mọi địa điểm published; trang `/s/:token` không lộ chi tiết cho bot.

### [ ] T-047 · Trang tĩnh (F-13) · `S`
- **Dep:** T-006
- **Làm:** `/about`, `/privacy` (nêu rõ việc dữ liệu chuyến đi có thể gửi đến nhà cung cấp LLM, quyền xóa dữ liệu, bên thứ ba), ghi công ảnh/bản đồ.
- **Hoàn thành khi:** đạt AC F-13; chủ dự án duyệt nội dung chính sách.

### [ ] T-048 · Rà soát truy cập (a11y) và hiệu năng · `M`
- **Tham chiếu:** `docs/02` F-14; `docs/08` mục D3
- **Dep:** M2 trở đi
- **Làm:** kiểm tra bàn phím, focus, `aria-label`, tương phản AA; tối ưu ảnh (WebP/AVIF, lazy, kích thước), tách bundle, kiểm tra LCP ≤ 2.5s trên mobile 4G ở trang chính; `prefers-reduced-motion`.
- **Hoàn thành khi:** báo cáo Lighthouse/axe lưu lại; không có lỗi a11y mức nghiêm trọng ở luồng chính.

### [ ] T-049 · Kiểm thử end-to-end (Playwright) · `M`
- **Dep:** M4
- **Làm:** kịch bản: khách tạo lịch trình trọn luồng; chỉnh sửa (xóa/thay/thêm/tạo lại ngày); đăng nhập giữa chừng và đồng bộ nháp; lưu + tải lại; chia sẻ + xem link + sao chép; địa điểm đã lưu; admin thêm địa điểm và import. Chạy trên viewport mobile (390×844) và desktop.
- **Hoàn thành khi:** chạy ổn định trong CI; dùng LLM giả (`LLM_ENABLED=false` hoặc `FakeLlmClient`) để kết quả xác định.

### [ ] T-050 · Rà soát bảo mật · `M`
- **Tham chiếu:** `AGENTS.md` mục 9; `docs/05` mục 5.6; `docs/06` mục 11, 14
- **Dep:** M4, M5
- **Làm:** kiểm tra RLS mọi bảng bằng test tự động; xác nhận không có `service role`/`LLM_API_KEY` trong bundle frontend; kiểm tra `next` chống chuyển hướng độc hại; kiểm tra giới hạn tần suất; kiểm tra token chia sẻ; thử prompt injection qua `notes`; kiểm tra log không chứa dữ liệu cá nhân; `npm audit`/`pnpm audit`.
- **Hoàn thành khi:** danh sách kiểm tra được điền đầy đủ trong `docs/security-review.md`; mọi phát hiện mức cao đã xử lý.

### [ ] T-051 · Giám sát và vận hành · `S`
- **Tham chiếu:** `docs/06` mục 14; `docs/07` mục 16
- **Dep:** T-032
- **Làm:** log có `requestId`; bảng/truy vấn xem tỷ lệ dùng dự phòng, p50/p90, số 429, token/ngày từ `generation_events`; job dọn `generation_events` > 90 ngày; cảnh báo lỗi 5xx (dịch vụ giám sát lỗi do chủ dự án chọn).
- **Hoàn thành khi:** có cách xem các chỉ số trên; job dọn dẹp chạy thử thành công.

### [ ] T-052 · Triển khai production · `M`
- **Dep:** T-046 → T-051 xong
- **Làm:** project Vercel + biến môi trường production; Supabase production (migration, seed tag/mốc, tài khoản admin đầu tiên gán thủ công); cấu hình Auth (URL chuyển hướng, nhà cung cấp Google, email); tên miền và HTTPS; kiểm tra giới hạn gói Vercel (thời gian chạy tối đa, kích thước body) khớp `maxDuration` đã đặt; sao lưu DB.
- **Hoàn thành khi:** chạy trọn luồng chính trên domain thật; checklist ra mắt (mục 5) hoàn tất.

---

## 4. Việc không thuộc task kỹ thuật (chủ dự án)

| Việc | Cần trước | Ghi chú |
|---|---|---|
| Chốt tên sản phẩm, logo, bảng màu (Stitch) | T-006 | Ảnh hưởng tokens và tiêu đề trang |
| Thiết kế giao diện bằng Stitch theo `docs/08` | T-014 trở đi | **Đã đủ**: S01–S21 trong `docs/stitch/`, gồm bản desktop cho S01–S04, S07, S12, S15, S17 |
| **Nhập 40–60 địa điểm** (Google Sheet → CSV) | T-011 | Nút thắt lớn nhất; làm sớm và song song |
| Ảnh có giấy phép + ghi công cho từng địa điểm | M1 | Wikimedia Commons, Pexels hoặc ảnh tự chụp |
| Chọn nhà cung cấp LLM, mở tài khoản, đặt hạn mức chi tiêu | T-029 | Đặt cảnh báo chi phí |
| Chấm chất lượng bộ 10 đầu vào mẫu | T-033 | Cần người hiểu Huế |
| Hiệu chỉnh tốc độ/ngưỡng di chuyển theo thực tế Huế | T-033 | `docs/07` mục 9.3 |
| Duyệt nội dung chính sách bảo mật | T-047 | Có thể cần tư vấn pháp lý |
| Danh sách tài khoản admin ban đầu | T-052 | Gán `role = 'admin'` thủ công |

## 5. Checklist ra mắt (T-052)

- [ ] Toàn bộ AC của F-01 → F-14 (mục P0 và P1) đạt trên bản production.
- [ ] ≥ 40 địa điểm `published`; địa điểm dùng cho lịch trình đều có `visit_duration_min`, giờ mở cửa (nếu có), ảnh có ghi công.
- [ ] Tỷ lệ địa điểm `verified` đạt mức chủ dự án chấp nhận (khuyến nghị 100% cho địa điểm nổi bật).
- [ ] RLS đã kiểm tra tự động; không có secret trong bundle; `.env` không nằm trong repo.
- [ ] Giới hạn tần suất và cầu chì LLM (`LLM_DAILY_CALL_CAP`) đã bật; đã đặt cảnh báo chi phí ở nhà cung cấp LLM.
- [ ] Công tắc `LLM_ENABLED=false` đã được thử: hệ thống vẫn tạo được lịch trình.
- [ ] Chính sách bảo mật đã duyệt; có cách xóa tài khoản và dữ liệu.
- [ ] Ghi công OSM, ảnh hiển thị đúng.
- [ ] Open Graph hiển thị đúng khi chia sẻ qua Zalo/Facebook/Messenger.
- [ ] Đã thử trên điện thoại thật (iOS Safari, Android Chrome).
- [ ] Có kế hoạch sao lưu DB và cách quay lui triển khai.

## 6. Sau MVP (giai đoạn 2, chưa lên task chi tiết)

Theo thứ tự đề xuất, quyết định lại dựa trên dữ liệu sử dụng thực tế:

1. **Huế bên tôi** (`/nearby`, F-20) và **Hôm nay** (F-21), cần thêm PostGIS và dữ liệu sự kiện.
2. **Đa ngôn ngữ** (F-22): bảng `*_translations`, bộ chuỗi giao diện đã tách sẵn.
3. **Xuất PDF / thêm vào lịch** (F-24).
4. **Chỉ đường thật** (thay ước lượng đường chim bay), có thể dùng dịch vụ chỉ đường mã nguồn mở.
5. **Chat AI hỏi đáp** giới hạn trong dữ liệu của hệ thống (F-23).
6. Cẩm nang Huế (F-26), bản đồ offline (F-25).

> **Không có trong kế hoạch:** trải nghiệm 3D/bảo tàng số, trang khẩn cấp.

## 7. Nhật ký thay đổi kế hoạch

> Agent ghi ngắn gọn khi tách/gộp/đổi task so với kế hoạch này (ngày · task · thay đổi · lý do).

| Ngày | Task | Thay đổi | Lý do |
|---|---|---|---|
| 2026-10-24 | T-010 | Đặt kiểm tra fixture tại `shared/itinerary/` để Vitest hiện có thu thập được; fixture JSON vẫn ở `tests/fixtures/`. | Vitest chỉ include `src/`, `shared/`, `server/`. |

## Câu hỏi còn mở

- [ ] Thứ tự giữa **M4 (tài khoản)** và **M5 (admin)**: nếu việc nhập liệu bằng CLI/CSV là nút thắt, có thể làm M5 sớm hơn.
- [ ] Có cần bản demo cho người dùng thử ngay sau M2 (trước khi có LLM và đăng nhập) không?
- [ ] Ngày mục tiêu ra mắt (để cắt bớt P1 nếu cần: F-10, F-11, F-13 là các ứng viên cắt giảm).
