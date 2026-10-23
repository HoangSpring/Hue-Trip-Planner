# 04 — Routes & Pages

> Bảng route, trang tương ứng, quyền truy cập, dữ liệu, SEO và trạng thái giao diện. Dùng khi dựng router và các trang.
> Luồng người dùng: `docs/03-user-flows.md` · Tính năng: `docs/02-features.md`.

## 1. Nguyên tắc

- Router: **React Router v6.4+** (`createBrowserRouter`), tải trang theo kiểu lazy (`React.lazy` hoặc `lazy` của route) để giảm kích thước bundle ban đầu.
- Mọi trang đều phải xử lý đủ 4 trạng thái: **loading · rỗng · lỗi · thành công**.
- Quyền truy cập kiểm tra **hai lớp**: guard ở client (để điều hướng đẹp) và RLS/API ở server (để an toàn thật). Không bao giờ chỉ dựa vào guard client.
- Bộ lọc, từ khóa, tab nên **phản ánh trên URL** để chia sẻ và dùng nút Back được.
- Vercel cần rewrite mọi đường dẫn không phải `/api/*` về `index.html` (SPA). Xem mục 8.

## 2. Bảng route

**Cột quyền:** `Mọi người` · `Khách` (chỉ khi chưa đăng nhập) · `User` · `Admin`.
**Cột SEO:** `index` (cho công cụ tìm kiếm lập chỉ mục) / `noindex`.

### Công khai

| Path | Trang | Quyền | SEO | Tính năng |
|---|---|---|---|---|
| `/` | `LandingPage` | Mọi người | index | F-01 |
| `/explore` | `ExplorePage` | Mọi người | index | F-02 |
| `/place/:slug` | `PlaceDetailPage` | Mọi người | index | F-03 |
| `/map` | `MapPage` | Mọi người | index | F-04 |
| `/about` | `AboutPage` | Mọi người | index | F-13 |
| `/privacy` | `PrivacyPage` | Mọi người | index | F-13 |

### Tạo và xem lịch trình

| Path | Trang | Quyền | SEO | Tính năng |
|---|---|---|---|---|
| `/plan/new` | `TripWizardPage` | Mọi người | index (chỉ trang đầu) | F-05 |
| `/plan/generating` | `GeneratingPage` | Mọi người | noindex | F-06 |
| `/trip/draft` | `TripEditorPage` (chế độ nháp) | Mọi người (cần có `trip_draft_v1`) | noindex | F-07 |
| `/trip/:id` | `TripEditorPage` (chế độ đã lưu) | User (chủ sở hữu) | noindex | F-07 |
| `/s/:shareToken` | `SharedTripPage` | Mọi người | noindex | F-11 |

> `/trip/draft` phải được khai báo **trước** `/trip/:id` (hoặc đặt khớp cụ thể trước) để `draft` không bị hiểu là `:id`. Ngoài ra `:id` phải là UUID hợp lệ, nếu không trả 404.

### Tài khoản

| Path | Trang | Quyền | SEO | Tính năng |
|---|---|---|---|---|
| `/login` | `LoginPage` | Khách | noindex | F-08 |
| `/register` | `RegisterPage` | Khách | noindex | F-08 |
| `/forgot-password` | `ForgotPasswordPage` | Khách | noindex | F-08 |
| `/reset-password` | `ResetPasswordPage` | Có phiên khôi phục | noindex | F-08 |
| `/auth/callback` | `AuthCallbackPage` | Mọi người | noindex | F-08 |
| `/account` | Chuyển hướng → `/account/trips` | User | noindex | — |
| `/account/trips` | `MyTripsPage` | User | noindex | F-09 |
| `/account/saved` | `SavedPlacesPage` | User | noindex | F-10 |
| `/account/settings` | `AccountSettingsPage` | User | noindex | F-08, F-14 (đổi tên, xóa tài khoản) |

### Quản trị

| Path | Trang | Quyền | SEO | Tính năng |
|---|---|---|---|---|
| `/admin` | Chuyển hướng → `/admin/places` | Admin | noindex | — |
| `/admin/places` | `AdminPlaceListPage` | Admin | noindex | F-12 |
| `/admin/places/new` | `AdminPlaceFormPage` (tạo) | Admin | noindex | F-12 |
| `/admin/places/:id` | `AdminPlaceFormPage` (sửa) | Admin | noindex | F-12 |
| `/admin/import` | `AdminImportPage` | Admin | noindex | F-12 |

### Hệ thống

| Path | Trang | Ghi chú |
|---|---|---|
| `*` | `NotFoundPage` | 404 thân thiện, có nút về trang chủ và "Tạo lịch trình" |
| (error boundary) | `ErrorPage` | Lỗi render bất ngờ, nút "Thử lại" và "Về trang chủ" |
| `/403` (hoặc render tại chỗ) | `ForbiddenPage` | Khi có phiên nhưng không đủ quyền |

## 3. Guard và chuyển hướng

| Guard | Điều kiện | Khi không đạt |
|---|---|---|
| `RequireAuth` | Có phiên Supabase | Chuyển `/login?next=<đường dẫn hiện tại>` |
| `RequireGuest` | Chưa đăng nhập | Chuyển đến `next` (nếu hợp lệ) hoặc `/account/trips` |
| `RequireAdmin` | `profiles.role = 'admin'` | Hiển thị `ForbiddenPage` |
| `RequireWizardDraft` | Có `wizard_draft_v1` hợp lệ (cho `/plan/generating`) | Chuyển `/plan/new` |
| `RequireTripDraft` | Có `trip_draft_v1` hợp lệ (cho `/trip/draft`) | Chuyển `/plan/new` kèm toast "Chưa có lịch trình nào" |

**Quy tắc `next`:** chỉ nhận đường dẫn nội bộ: bắt đầu bằng `/`, không bắt đầu bằng `//`, không chứa `://`. Nếu không hợp lệ thì dùng mặc định.

**Trong lúc chưa biết trạng thái đăng nhập** (đang tải phiên): hiển thị khung xương/loading, **không** chuyển hướng vội để tránh nhấp nháy sang `/login`.

## 4. Chi tiết từng trang

### `/` — LandingPage
- **Dữ liệu:** 6–8 địa điểm `featured = true` (published).
- **Thành phần:** Hero, CTA kép, "Cách hoạt động" 3 bước, địa điểm nổi bật, lịch trình mẫu (tĩnh), FAQ, chân trang.
- **Trạng thái:** nếu không có địa điểm nổi bật thì ẩn khối; nếu có `trip_draft_v1` hoặc `wizard_draft_v1` thì hiện thẻ "Tiếp tục chuyến đi của bạn".
- **SEO:** title, description, Open Graph.

### `/explore` — ExplorePage
- **Query string:**

| Tham số | Giá trị | Ví dụ |
|---|---|---|
| `category` | `heritage`, `food`, `cafe`, `sightseeing`, `shopping` | `?category=food` |
| `tag` | slug tag, có thể lặp | `?tag=river&tag=history` |
| `q` | từ khóa tìm kiếm | `?q=lang tu duc` |
| `sort` | `featured` (mặc định), `name` | `?sort=name` |
| `page` | số trang (nếu phân trang) | `?page=2` |

- **Dữ liệu:** `places` published, lọc/sắp xếp/phân trang theo tham số.
- **Trạng thái:** loading dạng khung xương thẻ; rỗng có nút "Xóa bộ lọc"; lỗi có nút "Thử lại".
- **SEO:** chỉ `index` trang không có tham số; các biến thể có tham số dùng `canonical` về `/explore`.

### `/place/:slug` — PlaceDetailPage
- **Dữ liệu:** một `place` theo slug (published) + ảnh + tag + 3–5 địa điểm gần đó.
- **Hành động:** Lưu (F-10), Thêm vào chuyến đi, Chỉ đường (mở link bản đồ theo tọa độ).
- **Trạng thái:** slug không tồn tại hoặc chưa published → render `NotFoundPage` (HTTP-style 404 ở mức giao diện).
- **SEO:** title/description riêng; Open Graph dùng ảnh bìa; dữ liệu cấu trúc `schema.org/TouristAttraction` hoặc `Restaurant` tùy loại (nên có).

### `/map` — MapPage
- **Query string:** `category` (như `/explore`), `focus=<slug>` (căn bản đồ vào một địa điểm).
- **Dữ liệu:** toàn bộ địa điểm published (chỉ trường nhẹ: id, slug, tên, loại, lat/lng, ảnh nhỏ).
- **Thành phần:** bản đồ, bộ lọc loại, thẻ xem nhanh, ghi công OSM.
- **Trạng thái:** lỗi tải tile/bản đồ → hiển thị danh sách thay thế và thông báo.

### `/plan/new` — TripWizardPage
- **Query string:** `step=1..6` (đồng bộ với bước hiện tại, để Back/Forward của trình duyệt hoạt động).
- **State:** form wizard (React Hook Form + Zod) → ghi `wizard_draft_v1` mỗi lần đổi.
- **Dữ liệu tải:** danh sách tag sở thích (`tags.kind = 'interest'`), danh sách mốc xuất phát (`start_points`).
- **Điều hướng:** Hoàn thành → `/plan/generating`.

### `/plan/generating` — GeneratingPage
- Gọi `POST /api/trips/generate` khi vào trang (hủy được bằng `AbortController`).
- Thành công → ghi `trip_draft_v1`; nếu đã đăng nhập thì gọi `POST /api/trips` rồi `replace` sang `/trip/:id`; nếu là khách thì `replace` sang `/trip/draft`.
- Lỗi → hiển thị lỗi tại chỗ với nút "Thử lại" và "Quay lại chỉnh thông tin" (về `/plan/new?step=6`).
- Dùng `replace` (không `push`) khi rời trang để nút Back không quay lại màn hình chờ.

### `/trip/draft` và `/trip/:id` — TripEditorPage
- **Hai chế độ**, dùng chung giao diện:

| | `draft` (khách hoặc chưa lưu) | `saved` (user) |
|---|---|---|
| Nguồn dữ liệu | `trip_draft_v1` | `GET /api/trips/:id` |
| Lưu thay đổi | Ghi localStorage | Tự động lưu lên server |
| Banner | "Đăng nhập để lưu và chia sẻ" | Chỉ báo "Đang lưu / Đã lưu" |
| Chia sẻ | Mời đăng nhập | Bật/tắt chia sẻ |

- **Query string:** `day=1..N` (ngày đang xem), `item=<id>` (mục đang chọn/mở ngăn xem nhanh).
- **Bố cục:** desktop = hai cột (danh sách 380px bên trái, bản đồ chiếm phần còn lại); mobile = danh sách + bản đồ thu gọn (có nút "Xem bản đồ" mở toàn màn hình).
- **Trạng thái đặc biệt:** `/trip/:id` không thuộc về user hoặc không tồn tại → 404 (không tiết lộ tồn tại hay không); chưa đăng nhập → `/login?next=...`.

### `/s/:shareToken` — SharedTripPage
- **Dữ liệu:** `GET /api/shared/:token` (server dùng service role, trả về dữ liệu đã lược bỏ thông tin cá nhân).
- **Chỉ đọc**: không có thao tác sửa. Có nút "Tạo bản sao của tôi".
- **Token sai/đã tắt:** trang "Lịch trình không còn được chia sẻ".
- **SEO:** `noindex`, nhưng có Open Graph (tiêu đề, ảnh bìa) để xem trước khi gửi qua chat. Lưu ý: bản xem trước khi chia sẻ qua chat cần server render thẻ meta; xem mục 7.

### `/login`, `/register`, `/forgot-password`, `/reset-password`, `/auth/callback`
- Form kiểm tra bằng Zod; thông báo lỗi tiếng Việt, không lộ chi tiết kỹ thuật.
- Tham số `next` được giữ qua các trang (đăng nhập ⇄ đăng ký).
- `/auth/callback`: xử lý phiên từ OAuth/email, sau đó thực hiện **đồng bộ** theo FL-03 rồi chuyển đến `next`.

### `/account/trips` — MyTripsPage
- **Dữ liệu:** danh sách `trips` của user (sắp xếp `updated_at` giảm dần), kèm ảnh bìa.
- **Hành động:** Mở, Đổi tên, Nhân bản, Chia sẻ, Xóa; nút "Tạo chuyến đi mới" → `/plan/new`.

### `/account/saved` — SavedPlacesPage
- **Query string:** `category`.
- **Dữ liệu:** `saved_places` join `places` published.

### `/account/settings` — AccountSettingsPage
- Đổi tên hiển thị, xem email, đăng xuất, **xóa tài khoản** (xác nhận hai bước: gõ lại "XOA" hoặc email).

### `/admin/*`
- **`/admin/places`:** bảng địa điểm; bộ lọc `status`, `verified`, `category`, `q`; phân trang; thao tác hàng loạt (xuất bản, gỡ, duyệt).
- **`/admin/places/new`, `/admin/places/:id`:** form theo nhóm (xem FL-08.1), tải ảnh lên Storage.
- **`/admin/import`:** tải CSV → xem trước → xác nhận → báo cáo (FL-08.2).
- Giao diện quản trị ưu tiên **desktop**, nhưng không được vỡ trên tablet.

## 5. Điều hướng và bố cục

### Layout

| Layout | Dùng cho | Thành phần |
|---|---|---|
| `PublicLayout` | `/`, `/explore`, `/place/*`, `/map`, `/about`, `/privacy` | Header, nội dung, Footer; mobile (< 768px) có thanh tab dưới |
| `FlowLayout` | `/plan/*` | Header rút gọn (logo + nút đóng/thoát), không footer, thanh tiến trình |
| `TripLayout` | `/trip/*`, `/s/*` | Header rút gọn, vùng làm việc toàn chiều cao |
| `AuthLayout` | `/login`, `/register`, ... | Khung giữa trang, logo |
| `AccountLayout` | `/account/*` | Header + điều hướng phụ (Chuyến đi · Đã lưu · Cài đặt) |
| `AdminLayout` | `/admin/*` | Thanh bên + vùng nội dung |

### Menu chính

- **Desktop (header, bố cục chính):** Logo · Khám phá · Bản đồ · **[Tạo lịch trình]** (nút nổi bật) · Chuyến đi của tôi · Đăng nhập / Avatar.
- **Mobile (< 768px, thanh tab dưới, 4–5 mục):** Trang chủ · Khám phá · **Tạo lịch trình** (nút giữa nổi bật) · Bản đồ · Tôi.
  - "Tôi" → `/account/trips` nếu đã đăng nhập, ngược lại `/login`.
- Ẩn thanh tab dưới ở `FlowLayout`, `TripLayout` và `AdminLayout` để dành chỗ cho nội dung.
- Avatar menu: Chuyến đi của tôi · Đã lưu · Cài đặt · (Quản trị nếu là admin) · Đăng xuất.

### Điều hướng giữa các trang liên quan

```
Landing ─► /plan/new ─► /plan/generating ─► /trip/draft ──(đăng nhập)──► /trip/:id
   │                                              │                          │
   └─► /explore ─► /place/:slug ──(thêm vào)──────┘                          ├─► /s/:token (chia sẻ)
                       │                                                     └─► /account/trips
                       └──(lưu)──► /account/saved
```

## 6. Cấu trúc code tương ứng

```
src/app/router.tsx                 # định nghĩa route, guard, lazy loading
src/app/layouts/                   # PublicLayout, FlowLayout, TripLayout, AuthLayout, AccountLayout, AdminLayout
src/app/guards/                    # RequireAuth, RequireGuest, RequireAdmin, RequireWizardDraft, RequireTripDraft
src/features/explore/              # ExplorePage + components
src/features/place/                # PlaceDetailPage
src/features/map/                  # MapPage
src/features/trip-wizard/          # TripWizardPage, GeneratingPage
src/features/trip-editor/          # TripEditorPage, SharedTripPage
src/features/auth/                 # Login, Register, ForgotPassword, ResetPassword, AuthCallback
src/features/account/              # MyTripsPage, SavedPlacesPage, AccountSettingsPage
src/features/admin/                # AdminPlaceListPage, AdminPlaceFormPage, AdminImportPage
src/features/static/               # AboutPage, PrivacyPage, NotFoundPage, ErrorPage
```

Hằng số đường dẫn đặt tập trung ở `src/app/paths.ts` (ví dụ `paths.place(slug)`); **không** viết cứng chuỗi đường dẫn rải rác trong component.

## 7. SEO và chia sẻ cho một SPA

- SPA thuần không có thẻ meta riêng khi bot (Facebook, Zalo, Messenger) tải trang. Giải pháp MVP, chọn một và ghi rõ trong PR:
  1. **Vercel Edge/Serverless function** trả HTML có thẻ meta (Open Graph) cho `/place/:slug` và `/s/:token` khi phát hiện bot, còn người dùng thường nhận SPA.
  2. Hoặc dùng dịch vụ prerender.
- Dùng `react-helmet-async` (hoặc tương đương) để cập nhật `<title>` và meta khi điều hướng phía client.
- Tạo `sitemap.xml` (script chạy khi build hoặc function) cho `/`, `/explore`, `/map`, `/about`, `/privacy` và mọi `/place/:slug` published.
- `robots.txt` chặn `/admin`, `/account`, `/trip`, `/s`, `/plan/generating`, `/api`.
- Trang `noindex` dùng `<meta name="robots" content="noindex">`.

## 8. Cấu hình Vercel (`vercel.json`)

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

> Nếu chọn giải pháp meta cho bot ở mục 7, thêm rewrite có điều kiện cho `/place/:slug` và `/s/:token` trỏ tới function tương ứng.

## 9. Mã lỗi và trang tương ứng

| Tình huống | Trang/Hành vi |
|---|---|
| Đường dẫn không khớp route | `NotFoundPage` |
| `:slug` / `:id` / `:shareToken` không tồn tại | `NotFoundPage` (nội dung phù hợp từng loại) |
| Có phiên nhưng không đủ quyền admin | `ForbiddenPage` |
| Chưa đăng nhập vào trang cần quyền | Chuyển `/login?next=...` |
| Lỗi mạng khi tải dữ liệu trang | Khối lỗi tại chỗ + "Thử lại" (không đổi sang trang khác) |
| Lỗi render | `ErrorPage` qua error boundary |

## 10. Checklist cho agent khi thêm route mới

- [ ] Đã thêm vào bảng ở mục 2 của file này (path, trang, quyền, SEO, tính năng).
- [ ] Đã dùng `paths.ts`, không viết cứng đường dẫn.
- [ ] Đã gắn guard đúng, **và** có kiểm tra quyền ở API/RLS tương ứng.
- [ ] Đã xử lý loading, rỗng, lỗi, thành công.
- [ ] Đã đặt layout phù hợp (có/không thanh tab dưới).
- [ ] Đã đặt `title`, `description`, `robots` đúng.
- [ ] Tham số URL (query string) được kiểm tra bằng Zod, giá trị lạ không làm hỏng trang.

## Câu hỏi còn mở

- [ ] Chọn cách làm meta cho bot (mục 7): function trên Vercel hay prerender?
- [ ] `/explore` dùng phân trang hay cuộn vô hạn? (ảnh hưởng tham số `page`)
- [ ] Có cần trang `/hue` (cẩm nang) ngay trong MVP không? (hiện thuộc giai đoạn 2, mã F-26)
