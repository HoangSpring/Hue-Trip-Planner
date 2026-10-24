# AGENTS.md

> File này là điểm bắt đầu cho mọi AI agent làm việc trong repo. **Đọc hết file này trước khi viết bất kỳ dòng code nào**, sau đó đọc các file trong `docs/` liên quan đến task của bạn.

## 1. Dự án là gì

**Tên tạm:** `hue-trip-planner` (có thể đổi, xem mục TODO cuối file).

Website giúp du khách **lên lịch trình du lịch Huế**: người dùng nhập thông tin chuyến đi và sở thích, hệ thống gợi ý lịch trình theo từng ngày (kèm lý do ghé từng nơi), cho phép chỉnh sửa, lưu và chia sẻ.

Dự án lấy cảm hứng từ hue4u.com nhưng **gọn hơn**:
- Có: khám phá địa điểm, bản đồ, tạo/sửa/lưu/chia sẻ lịch trình, đăng nhập, trang admin nhập liệu.
- **Không làm:** trải nghiệm 3D/bảo tàng số, trang khẩn cấp & hỗ trợ. Không tự thêm các tính năng này.

**Hướng thiết kế: desktop-first, vẫn responsive tốt trên mobile.** Ưu tiên trải nghiệm trên màn hình rộng (≥ 1024px); mobile vẫn phải dùng được trọn vẹn, đặc biệt trang chia sẻ lịch trình (`/s/:token`) và trình chỉnh lịch trình vì du khách mở chúng trên điện thoại khi đang ở Huế.

Ngôn ngữ giao diện MVP: **tiếng Việt**. Thiết kế DB và code sẵn sàng cho đa ngôn ngữ sau này (xem `docs/05-data-model.md`).

## 2. Tài liệu cần đọc

| File | Dùng khi |
|---|---|
| `docs/01-product-brief.md` | Cần hiểu mục tiêu, phạm vi, điều gì ngoài phạm vi |
| `docs/02-features.md` | Bắt đầu làm một tính năng (có tiêu chí nghiệm thu) |
| `docs/03-user-flows.md` | Làm UI/logic nhiều bước, nhánh lỗi, khóa localStorage |
| `docs/04-routes-and-pages.md` | Dựng router, trang, guard, phân quyền, SEO |
| `docs/05-data-model.md` | Tạo bảng, RLS, migration, định dạng CSV import |
| `docs/06-api-spec.md` | Viết/gọi API: endpoint, lỗi, giới hạn tần suất, quyền |
| `docs/07-ai-itinerary-spec.md` | Làm tính năng sinh lịch trình: pipeline, LLM, thuật toán dự phòng, cảnh báo |
| `docs/08-stitch-ui-prompt.md` | Design tokens, component, quy tắc giao diện (mục D); thiết kế tham chiếu nằm trong `docs/stitch/stitch_file_analysis_assistant/` (xem mục 13) |
| `docs/10-decisions.md` | **Quyết định mặc định** cho mọi câu hỏi còn mở (tên sản phẩm, LLM, bản đồ, phân trang...). Đọc trước khi hỏi chủ dự án |
| `docs/09-roadmap-tasks.md` | **Chọn task tiếp theo** (mốc M0–M6, phụ thuộc, tiêu chí hoàn thành) |

Nếu một file chưa tồn tại mà task cần thông tin đó: **hỏi người dùng**, đừng tự đoán rồi làm.

## 3. Tech stack

| Lớp | Công nghệ |
|---|---|
| Frontend | React 18 + Vite + TypeScript, React Router, Tailwind CSS |
| Server state | TanStack Query |
| Bản đồ | Leaflet (`react-leaflet`), URL tile cấu hình qua `VITE_MAP_TILE_URL`, tile từ OpenStreetMap (phải ghi công); chi tiết ở `docs/10-decisions.md` D-19, D-20 |
| Backend | Node.js + TypeScript + **Hono**, chạy dưới dạng **một Vercel Function** (`api/[[...route]].ts`), mã nguồn ở `server/` (không có server riêng). Frontend luôn gọi dữ liệu qua `/api/*`; Supabase client ở frontend chỉ dùng cho Auth và tải ảnh admin |
| Database, Auth, Storage | Supabase (Postgres + RLS + Supabase Auth + Storage) |
| AI | Gọi LLM **từ backend**, trả JSON theo schema cố định |
| Validation | Zod (dùng chung schema cho client và server) |
| Test | Vitest (unit), Playwright (e2e, các luồng chính) |
| Deploy | Vercel |

## 4. Cấu trúc thư mục

```
/
├─ AGENTS.md
├─ docs/                      # tài liệu nghiệp vụ và kỹ thuật
├─ api/
│  └─ [[...route]].ts         # điểm vào duy nhất của Vercel Function (export Hono app)
├─ server/                    # backend: app, middleware, routes, services, itinerary, llm, mappers, lib
├─ src/                       # frontend
│  ├─ app/                    # router, layout, providers
│  ├─ features/               # mỗi tính năng một thư mục
│  │  ├─ explore/
│  │  ├─ place/
│  │  ├─ map/
│  │  ├─ trip-wizard/
│  │  ├─ trip-editor/
│  │  ├─ auth/
│  │  └─ admin/
│  ├─ components/             # component dùng chung
│  ├─ lib/                    # supabase client, api client, tiện ích
│  └─ types/
├─ shared/                    # Zod schema và type dùng chung client + server
├─ supabase/
│  ├─ migrations/             # SQL migration, đặt tên theo thời gian
│  └─ seed/                   # dữ liệu mẫu, script import CSV
└─ tests/
```

Mỗi feature trong `src/features/<tên>/` gồm: `components/`, `hooks/`, `api.ts`, `index.ts`.

## 5. Lệnh thường dùng

> Dùng `pnpm`. Nếu repo chưa cấu hình, hãy tạo các script sau trong `package.json`.

```bash
pnpm install
pnpm dev            # chạy frontend (Vite)
pnpm dev:api        # chạy Vercel Functions cục bộ (vercel dev)
pnpm typecheck      # tsc --noEmit
pnpm lint
pnpm test           # Vitest
pnpm test:e2e       # Playwright
pnpm build
pnpm db:migrate     # áp dụng migration lên Supabase
pnpm db:seed        # import dữ liệu địa điểm từ CSV
```

**Trước khi báo hoàn thành một task**, phải chạy và vượt qua: `typecheck`, `lint`, `test`.

## 6. Biến môi trường

Tạo `.env.local` từ `.env.example`. **Không bao giờ commit file `.env*` thật.**

| Biến | Dùng ở | Ghi chú |
|---|---|---|
| `VITE_SUPABASE_URL` | Frontend | Công khai |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Công khai, bị giới hạn bởi RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | **Chỉ backend** | Tuyệt đối không đưa vào frontend |
| `LLM_API_KEY` | **Chỉ backend** | Tuyệt đối không đưa vào frontend |
| `LLM_MODEL` | Backend | Tên model, cấu hình được |
| `LLM_ENABLED`, `LLM_TIMEOUT_MS`, `LLM_DAILY_CALL_CAP` | Backend | Công tắc khẩn cấp, thời gian chờ, trần số lần gọi mỗi ngày |
| `RATE_LIMIT_SALT` | Backend | Muối để băm định danh khách khi giới hạn tần suất (bắt buộc) |
| `APP_BASE_URL` | Backend | Dùng tạo link chia sẻ, sitemap, Open Graph |

Danh sách đầy đủ kèm giá trị mặc định: `docs/06-api-spec.md` mục 13.

Biến có tiền tố `VITE_` sẽ lộ ra trình duyệt. Chỉ đặt giá trị công khai vào đó.

## 7. Quy ước code

- TypeScript `strict: true`. **Không dùng `any`**; nếu bắt buộc phải có comment giải thích.
- Component React dạng function, đặt tên `PascalCase`; hook bắt đầu bằng `use`; file util `camelCase`.
- Mọi dữ liệu từ bên ngoài (request body, phản hồi LLM, CSV import) **phải qua Zod** trước khi dùng.
- Gọi API từ frontend qua `src/lib/api.ts` và hook TanStack Query, không `fetch` rải rác trong component.
- Mọi bảng mới có migration SQL kèm **RLS bật sẵn** (xem `docs/05-data-model.md`).
- Nội dung hiển thị cho người dùng dùng tiếng Việt, đặt trong file hằng/chuỗi riêng để dễ dịch sau này, không hard-code rải rác.
- Commit nhỏ, theo dạng `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`.
- Một task = một nhánh = một PR nhỏ. Không trộn nhiều tính năng vào một PR.

## 8. Quy tắc nghiệp vụ không được vi phạm

1. **AI không được bịa địa điểm.** Lịch trình chỉ gồm địa điểm có trong bảng `places`. Backend phải kiểm tra lại `place_id` do LLM trả về. Chi tiết trong `docs/07-ai-itinerary-spec.md`.
2. **Luôn có phương án dự phòng.** Nếu LLM lỗi/timeout, dùng thuật toán rule-based để người dùng vẫn nhận được lịch trình.
3. **Ưu tiên địa điểm `verified = true`.** Dữ liệu do AI điền chưa duyệt không được hiển thị như thông tin chắc chắn.
4. **Ảnh và dữ liệu phải có nguồn.** Mỗi ảnh có `image_credit` và `image_license`. Hiển thị ghi công OpenStreetMap trên bản đồ.
5. **Không lưu nội dung từ Google Maps/Places** (tên, mô tả, đánh giá, ảnh, giờ mở cửa) vào DB. Chỉ được lưu `place_id` nếu cần. Nguồn dữ liệu hợp lệ: nhập tay, OpenStreetMap, nguồn có giấy phép rõ ràng.
6. **Khách chưa đăng nhập vẫn tạo được lịch trình**; muốn lưu lâu dài/chia sẻ thì phải đăng nhập.

## 9. Bảo mật

- RLS bật trên **mọi** bảng. Người dùng chỉ đọc/sửa dữ liệu của mình. `places` công khai đọc, chỉ admin ghi.
- Endpoint backend phải xác thực JWT của Supabase khi cần quyền người dùng; kiểm tra vai trò admin ở server, không tin dữ liệu từ client.
- Endpoint gọi LLM phải có **giới hạn tần suất** (theo user hoặc IP/session) và giới hạn kích thước input.
- Không đưa dữ liệu cá nhân hoặc secret vào log.
- Link chia sẻ dùng `share_token` ngẫu nhiên, khó đoán; chỉ đọc.

## 10. Việc agent được và không được làm

**Được làm mà không cần hỏi**
- Viết/sửa code, test, migration trong phạm vi task.
- Sửa lỗi lint/type liên quan đến thay đổi của mình.
- Cập nhật tài liệu trong `docs/` khi thay đổi hành vi (ghi rõ trong PR).

**Phải hỏi trước**
- Thêm thư viện lớn hoặc đổi công nghệ trong stack.
- Đổi cấu trúc bảng đã có dữ liệu, hoặc xóa cột/bảng.
- Thêm tính năng không có trong `docs/02-features.md`.
- Thay đổi chi phí đáng kể (ví dụ gọi LLM nhiều hơn, đổi sang model đắt hơn).

**Không bao giờ làm**
- Thêm tính năng 3D/bảo tàng số hoặc trang khẩn cấp.
- Commit secret, tắt RLS, hoặc dùng `service_role` ở frontend.
- Cào dữ liệu hàng loạt từ Google Maps hoặc trang web vi phạm điều khoản sử dụng.
- Sửa các file trong `supabase/migrations/` đã được áp dụng (tạo migration mới thay vì sửa).

## 11. Cách làm việc với một task

1. Đọc `AGENTS.md` (file này) và file docs liên quan.
2. Xác nhận tiêu chí nghiệm thu của tính năng trong `docs/02-features.md`.
3. Nếu yêu cầu mơ hồ hoặc mâu thuẫn giữa các file, **hỏi lại**, không tự chọn.
4. Làm theo từng bước nhỏ; viết test cho logic nghiệp vụ (đặc biệt phần sinh lịch trình).
5. Chạy `typecheck`, `lint`, `test`.
6. Tóm tắt cuối task: đã làm gì, file nào thay đổi, điều gì chưa làm/còn nghi ngờ.
7. Khi xong một phase (hoặc phải dừng giữa chừng): viết báo cáo `docs/reports/phase-N-report.md` theo mẫu `docs/reports/_template.md`, dán đầu ra thật của các lệnh kiểm tra. Báo cáo là nơi ghi kết quả; **không** ghi báo cáo vào `README.md`.

## 12. Câu hỏi còn mở

Các câu hỏi "còn mở" rải ở cuối từng file docs đã có **quyết định mặc định** trong `docs/10-decisions.md`. Làm theo mặc định đó; chỉ hỏi chủ dự án với các mục ghi **"Cần chủ dự án"** (ví dụ chọn nhà cung cấp LLM trước T-029, nhà cung cấp tile bản đồ và tài khoản admin trước T-052).

## 13. Thiết kế tham chiếu (Stitch)

- Thư mục: `docs/stitch/stitch_file_analysis_assistant/`. Mỗi màn có `screen.png` và `code.html`; `hue_imperial_editorial/DESIGN.md` là **design system đã duyệt** (tokens, font, bố cục, đổ bóng). Tokens trong `docs/08` mục D1 đã đồng bộ với file này.
- **Bản desktop đã có** cho S01–S04, S07, S12, S15, S17 và S18–S21 (thư mục `*_desktop`); các màn còn lại chỉ có bản mobile (`*_mobile`). Với màn chỉ có bản mobile, dựng responsive từ bản mobile và khung desktop ở `docs/08` mục D5, **không** kéo giãn thành một cột.
- `code.html` dùng Tailwind CDN và ảnh giữ chỗ (`lh3.googleusercontent.com`): chỉ để tham chiếu. **Dựng lại thành component React**, không sao chép nguyên mã, không đưa ảnh giữ chỗ vào sản phẩm.
- Tên địa điểm/quán trong mockup (ví dụ "Quán Bún Bò Bà Tuyết") chỉ là dữ liệu mẫu, không đưa vào dữ liệu thật khi chưa kiểm chứng.
- Không làm các mục ngoài phạm vi xuất hiện trong mockup admin: "Thống kê & Lịch trình", "Cài đặt hệ thống", chỉ báo "Hệ thống: Trực tuyến", chuông thông báo, thẻ thống kê; và thanh tiến độ "Đã hoàn thành x/y địa điểm" ở S01 (thẻ "Tiếp tục chuyến đi" chỉ cần tên chuyến đi và nút mở). Admin chỉ gồm danh sách, bộ lọc, thao tác hàng loạt, form địa điểm và import CSV (F-12).
- Các mục thừa ở bản desktop cũng **bỏ**: nút "+ Thêm ngày" ở S12 (MVP không đổi số ngày sau khi tạo), "Xuất file PDF", thẻ "Thời tiết Huế hôm nay", liên kết chân trang "Điều khoản sử dụng" (MVP chỉ có `/about`, `/privacy`), nhãn "Giờ cao điểm"/"Mẹo" khi không có dữ liệu thật.
- Tên thương hiệu trong mockup ("Cổ Đô") chỉ là tạm. Không viết cứng tên sản phẩm; dùng `src/lib/brand.ts` (xem `docs/10-decisions.md` D-01).
