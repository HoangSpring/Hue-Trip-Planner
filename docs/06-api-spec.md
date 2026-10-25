# 06 — API Spec

> Đặc tả backend Node.js chạy trên Vercel. Dùng khi viết endpoint hoặc gọi API từ frontend.
> Dữ liệu và RLS: `docs/05-data-model.md` · Luồng: `docs/03-user-flows.md` · Thuật toán lịch trình: `docs/07-ai-itinerary-spec.md`.

## 1. Kiến trúc và quyết định chung

| Mục | Quyết định |
|---|---|
| Hình thức | **Một Vercel Function duy nhất** làm điểm vào cho mọi `/api/*`, bên trong dùng framework router nhẹ **Hono** |
| Lý do | Gọn, dễ test (`app.request(...)`), tránh giới hạn số function của một số gói Vercel, dùng chung middleware (xác thực, lỗi, giới hạn tần suất) |
| Điểm vào | `api/[[...route]].ts` (chỉ khởi tạo và export Hono app) |
| Mã nguồn | `server/` (route, service, itinerary, llm, middleware) |
| Dùng chung với frontend | `shared/` (Zod schema, kiểu, hàm thuần như tính khoảng cách, cảnh báo, giờ mở cửa) |
| Frontend gọi dữ liệu | **Luôn qua `/api/*`** bằng `src/lib/api.ts`. Chỉ dùng Supabase client ở frontend cho: **Auth** và **tải ảnh lên Storage (admin)** |
| Định dạng | JSON, UTF-8, tên trường **camelCase** (DB là snake_case; ánh xạ ở lớp `server/mappers/`) |
| Múi giờ | Giờ trong lịch trình (`HH:mm`) là **giờ Việt Nam**, không có múi giờ; ngày dạng `YYYY-MM-DD` |

> **Kiểm tra giới hạn hiện hành của gói Vercel** (thời gian chạy tối đa mỗi function, kích thước body) trước khi triển khai, vì việc gọi LLM có thể kéo dài. Cấu hình `maxDuration` cho function trong `vercel.json` phù hợp (mục tiêu ≥ 30s cho các endpoint gọi LLM). Nếu gói đang dùng không cho phép, báo chủ dự án.

### Cấu trúc thư mục

```
api/
  [[...route]].ts             # export default handle(app) từ hono/vercel
server/
  app.ts                      # tạo Hono app, gắn middleware, mount route
  middleware/                 # requestId, auth, requireAdmin, rateLimit, errorHandler, cache
  routes/                     # meta, places, trips, shared, saved, me, admin, system
  services/                   # nghiệp vụ (tripService, placeService, importService...)
  itinerary/                  # xem docs/07
  llm/                        # client LLM, prompt
  mappers/                    # DB row <-> DTO
  lib/                        # supabase clients, env, logger, errors
shared/
  schemas/                    # Zod: tripInput, trip, place, errors...
  itinerary/                  # geo, schedule, warnings, openHours
```

## 2. Quy ước chung

### 2.1 Xác thực

- Header: `Authorization: Bearer <supabase_access_token>`.
- Middleware `auth`: xác thực token bằng `supabase.auth.getUser(token)` (không tự giải mã JWT). Gắn `ctx.user` (`id`, `email`).
- Có 3 mức: **public** (không cần), **optionalAuth** (có token thì nhận diện, không có vẫn chạy: dùng cho `generate`), **requireAuth**, **requireAdmin** (đọc `profiles.role` bằng client của người dùng, sau đó kiểm tra).
- Với thao tác của người dùng, tạo **Supabase client kèm JWT của họ** để RLS có hiệu lực. Chỉ dùng `service role` ở các nơi được liệt kê ở mục 11.

### 2.2 Định dạng lỗi

Mọi lỗi trả về cùng một cấu trúc:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "details": [{ "path": "input.numDays", "message": "Phải từ 1 đến 5" }],
    "requestId": "req_8f3a..."
  }
}
```

- `message`: tiếng Việt, thân thiện, **không** lộ chi tiết nội bộ, stack trace hay câu SQL.
- `details`: tùy chọn, chủ yếu cho lỗi kiểm tra dữ liệu.
- Lỗi không lường trước: `500 INTERNAL_ERROR`, ghi log chi tiết kèm `requestId` ở server.

| HTTP | `code` | Khi nào |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Dữ liệu sai định dạng/giá trị (Zod) |
| 401 | `UNAUTHENTICATED` | Thiếu hoặc sai token |
| 403 | `FORBIDDEN` | Có đăng nhập nhưng không đủ quyền |
| 404 | `NOT_FOUND` | Không có tài nguyên (hoặc không thuộc về người dùng, **không phân biệt** hai trường hợp) |
| 409 | `CONFLICT` | Xung đột phiên bản (`expectedUpdatedAt` lệch) |
| 413 | `PAYLOAD_TOO_LARGE` | Body vượt giới hạn |
| 422 | `NO_CANDIDATES` | Không đủ địa điểm để tạo lịch trình |
| 422 | `BUSINESS_RULE_VIOLATION` | Vi phạm quy tắc nghiệp vụ (ví dụ trùng địa điểm trong chuyến đi) |
| 429 | `RATE_LIMITED` | Vượt giới hạn tần suất (kèm `Retry-After`) |
| 500 | `INTERNAL_ERROR` | Lỗi không lường trước |
| 503 | `SERVICE_UNAVAILABLE` | Phụ thuộc ngoài lỗi (ví dụ Supabase) |

### 2.3 Header chung

| Header | Hướng | Ý nghĩa |
|---|---|---|
| `X-Request-Id` | Response | Mã yêu cầu (nhận từ client nếu có, nếu không thì server sinh) |
| `Retry-After` | Response (429) | Số giây chờ |
| `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` | Response (endpoint có giới hạn) | Thông tin hạn mức |
| `Cache-Control` | Response | Xem mục 2.5 |

### 2.4 Phân trang

Query: `page` (bắt đầu 1, mặc định 1), `pageSize` (mặc định 24, tối đa 60).
Response: `{ "items": [...], "page": 1, "pageSize": 24, "total": 48 }`.

### 2.5 Bộ nhớ đệm (cache)

| Loại | `Cache-Control` |
|---|---|
| Dữ liệu công khai ít thay đổi (`/meta`, `/places*`) | `public, s-maxage=300, stale-while-revalidate=3600` |
| Dữ liệu cá nhân (`/trips*`, `/saved`, `/me`, `/admin/*`) | `private, no-store` |
| `/shared/:token` | `no-store` (để tắt chia sẻ có hiệu lực ngay) |
| `/trips/generate`, `regenerate-day`, `alternatives` | `no-store` |

### 2.6 Giới hạn kích thước

- Body JSON tối đa **256 KB** (trừ import CSV: tối đa **2 MB**, gửi dạng `text/csv`).
- Chuỗi tự do: `notes` ≤ 300, `title` ≤ 100, ghi chú mục ≤ 300 ký tự.
- Tối đa **5 ngày**, **8 mục mỗi ngày** trong một chuyến đi (kiểm tra ở server).
- Từ chối body có trường lạ ở các endpoint ghi (`strict()` trong Zod) để tránh ghi đè trường không mong muốn.

### 2.7 CORS

Frontend và API cùng origin (cùng dự án Vercel) → **không bật CORS rộng**. Nếu cần origin khác (preview), dùng danh sách trắng theo biến môi trường.

### 2.8 Giới hạn tần suất

Cấu hình ở `server/itinerary/config.ts` (đọc từ biến môi trường, có mặc định):

| Hành động | Khách | User |
|---|---|---|
| `POST /trips/generate` | 3 / giờ, 6 / ngày | 10 / giờ, 30 / ngày |
| `POST /trips/regenerate-day` | 6 / giờ | 20 / giờ |
| `POST /trips/alternatives` (không dùng LLM) | 60 / phút | 60 / phút |
| Các endpoint đọc công khai | 120 / phút / IP | 240 / phút |
| Đăng nhập/đăng ký | do Supabase Auth xử lý | — |

- Nhận diện khách: `client_key = HMAC-SHA256(IP + User-Agent, RATE_LIMIT_SALT)` (không lưu IP thô). User: theo `user_id`.
- Đếm dựa trên bảng `generation_events` (đã có ở `docs/05-data-model.md`) cho các endpoint LLM; endpoint khác dùng bộ đếm trong bộ nhớ hoặc dịch vụ giới hạn của Vercel. Chấp nhận sai số nhỏ khi nhiều yêu cầu song song ở MVP.
- Khi chạm giới hạn: ghi `generation_events` với `status = 'rate_limited'` và trả `429` kèm `Retry-After`.
- **Công tắc khẩn cấp:** `LLM_ENABLED=false` → hệ thống dùng thuật toán dự phòng cho mọi yêu cầu. **Ngân sách ngày:** `LLM_DAILY_CALL_CAP` (số lần gọi LLM tối đa mỗi ngày); vượt thì tự dùng dự phòng.

## 3. Kiểu dữ liệu dùng chung (DTO)

> Nguồn sự thật là Zod trong `shared/schemas/`. Phần dưới chỉ để đọc nhanh.

```ts
type UUID = string;
type Slot = 'morning' | 'noon' | 'afternoon' | 'evening';
type Category = 'heritage' | 'food' | 'cafe' | 'sightseeing' | 'shopping';

interface PlaceSummary {
  id: UUID; slug: string; name: string; category: Category;
  shortDescription: string | null; area: string | null;
  lat: number; lng: number;
  coverImageUrl: string | null; coverImageAlt: string | null;
  imageCredit: string | null; imageLicense: string | null; imageSourceUrl: string | null;
  tags: { slug: string; name: string }[];
  verified: boolean;
  status?: 'published' | 'archived';   // 'archived' chỉ xuất hiện khi địa điểm nằm trong chuyến đi cũ
}

interface PlaceDetail extends PlaceSummary {
  description: string | null; address: string | null;
  openTime: string | null; closeTime: string | null;   // "HH:mm"
  closedDays: number[];                                // ISO 1=Thứ Hai ... 7=Chủ Nhật
  openingNote: string | null;
  visitDurationMin: number | null; priceLevel: 0|1|2|3 | null;
  ticketPriceVnd: number | null; priceNote: string | null;
  bestTime: Slot[]; mealType: ('breakfast'|'lunch'|'dinner'|'snack')[];
  suitableFor: string[]; walkingIntensity: 1|2|3 | null;
  phone: string | null; website: string | null;
  images: { url: string; alt: string | null; credit: string; license: string; sourceUrl: string | null }[];
  lastVerifiedAt: string | null;                       // ISO datetime
}

interface TripInput {                                  // đúng như docs/05 mục 7
  numDays: number; startDate: string | null;
  companion: 'solo'|'couple'|'family_kids'|'friends'|'seniors';
  groupSize: number | null; interests: string[];
  pace: 'relaxed'|'moderate'|'packed';
  budget: 'budget'|'mid'|'comfortable' | null;
  transport: 'motorbike'|'taxi'|'walk_bike'|'tour' | null;
  start: { label: string; lat: number; lng: number } | null;
  notes: string | null;
}

interface TripItem {
  id: UUID;                                            // do client sinh (uuid v4) để upsert
  placeId: UUID;
  place?: PlaceSummary;                                // server điền khi trả về; bỏ qua khi nhận
  position: number;                                    // 0..n-1 trong ngày
  slot: Slot;
  startTime: string | null;                            // "HH:mm"
  durationMin: number | null;
  travelMinFromPrev: number | null;
  travelDistanceM: number | null;
  reason: string | null;                               // ≤ 240 ký tự, văn bản thuần
  note: string | null;                                 // ≤ 300 ký tự
  isLocked: boolean;
  addedBy: 'ai' | 'fallback' | 'user';
}

interface TripDay {
  id: UUID; dayIndex: number; date: string | null; note: string | null;
  items: TripItem[];
}

interface Trip {
  id: UUID;                                            // chỉ có khi đã lưu
  clientDraftId: UUID | null;
  title: string; startDate: string | null; numDays: number;
  input: TripInput;
  generatedBy: 'llm' | 'fallback' | 'manual'; llmModel: string | null;
  start: { label: string; lat: number; lng: number } | null;
  isShared: boolean; shareToken: string | null;
  days: TripDay[];
  createdAt: string; updatedAt: string;
}

type TripDraft = Omit<Trip, 'id' | 'isShared' | 'shareToken' | 'createdAt' | 'updatedAt'> & { clientDraftId: UUID };

interface Warning {                                    // tính bằng shared/itinerary/warnings.ts
  code: 'CLOSED_ON_DAY'|'CLOSED_AT_TIME'|'MISSING_HOURS'|'TOO_FAR'|'TOO_MANY_ITEMS'
      |'TIME_OVERLAP'|'PLACE_ARCHIVED'|'LUNCH_MISSING';
  itemId: UUID | null; dayIndex: number; message: string;
}
interface Notice { code: 'FALLBACK_USED'|'FEW_CANDIDATES'|'FILTER_RELAXED'|'LLM_DISABLED'; message: string }
```

## 4. Danh sách endpoint

| # | Method | Path | Quyền | Mục đích | Tính năng |
|---|---|---|---|---|---|
| 1 | GET | `/api/meta` | public | Tag sở thích + mốc xuất phát | F-05 |
| 2 | GET | `/api/places` | public | Danh sách địa điểm (lọc, tìm, phân trang) | F-01, F-02 |
| 3 | GET | `/api/places/map` | public | Dữ liệu nhẹ cho bản đồ | F-04 |
| 4 | GET | `/api/places/:slug` | public | Chi tiết địa điểm + gần đây | F-03 |
| 5 | POST | `/api/trips/generate` | optionalAuth | Sinh lịch trình nháp | F-06 |
| 6 | POST | `/api/trips/regenerate-day` | optionalAuth | Tạo lại một ngày | F-07 |
| 7 | POST | `/api/trips/alternatives` | optionalAuth | Gợi ý thay thế một điểm | F-07 |
| 8 | GET | `/api/trips` | requireAuth | Danh sách chuyến đi của tôi | F-09 |
| 9 | POST | `/api/trips` | requireAuth | Lưu chuyến đi từ bản nháp | F-06, F-08 |
| 10 | GET | `/api/trips/:id` | requireAuth | Chi tiết chuyến đi | F-07 |
| 11 | PUT | `/api/trips/:id` | requireAuth | Lưu toàn bộ nội dung (tự động lưu) | F-07 |
| 12 | PATCH | `/api/trips/:id` | requireAuth | Đổi tên / ngày bắt đầu | F-09 |
| 13 | DELETE | `/api/trips/:id` | requireAuth | Xóa chuyến đi | F-09 |
| 14 | POST | `/api/trips/:id/duplicate` | requireAuth | Nhân bản | F-09 |
| 15 | PUT | `/api/trips/:id/share` | requireAuth | Bật/tắt chia sẻ | F-11 |
| 16 | GET | `/api/shared/:token` | public | Xem lịch trình chia sẻ (chỉ đọc) | F-11 |
| 17 | POST | `/api/shared/:token/copy` | requireAuth | Sao chép thành chuyến đi riêng | F-11 |
| 18 | GET | `/api/saved` | requireAuth | Địa điểm đã lưu | F-10 |
| 19 | PUT | `/api/saved/:placeId` | requireAuth | Lưu địa điểm (idempotent) | F-10 |
| 20 | DELETE | `/api/saved/:placeId` | requireAuth | Bỏ lưu | F-10 |
| 21 | GET | `/api/me` | requireAuth | Hồ sơ của tôi | F-08 |
| 22 | PATCH | `/api/me` | requireAuth | Đổi tên hiển thị | F-08 |
| 23 | DELETE | `/api/me` | requireAuth | Xóa tài khoản | F-14 |
| 24 | GET | `/api/admin/places` | requireAdmin | Danh sách quản trị | F-12 |
| 25 | POST | `/api/admin/places` | requireAdmin | Tạo địa điểm | F-12 |
| 26 | GET | `/api/admin/places/:id` | requireAdmin | Chi tiết quản trị | F-12 |
| 27 | PUT | `/api/admin/places/:id` | requireAdmin | Sửa địa điểm | F-12 |
| 28 | POST | `/api/admin/places/:id/status` | requireAdmin | Xuất bản/gỡ/lưu trữ | F-12 |
| 29 | POST | `/api/admin/places/:id/verify` | requireAdmin | Duyệt thông tin | F-12 |
| 30 | POST | `/api/admin/import/preview` | requireAdmin | Xem trước CSV | F-12 |
| 31 | POST | `/api/admin/import/commit` | requireAdmin | Ghi dữ liệu import | F-12 |
| 32 | GET | `/api/health` | public | Kiểm tra sống | — |
| 33 | GET | `/api/sitemap.xml` | public | Sitemap | F-14 |
| 34 | GET | `/api/og/place/:slug` | public | HTML meta cho bot | F-14 |
| 35 | GET | `/api/og/share/:token` | public | HTML meta cho bot | F-11 |

## 5. Chi tiết: dữ liệu công khai

### 5.1 `GET /api/meta`
**Response 200**
```json
{
  "tags": [{ "slug": "heritage", "name": "Di sản & cung đình", "icon": "castle", "imageUrl": "https://..." }],
  "startPoints": [{ "slug": "dai-noi", "name": "Gần Đại Nội", "lat": 0, "lng": 0 }],
  "categories": [{ "slug": "heritage", "name": "Di sản" }]
}
```
- `tags`: chỉ `kind = 'interest'`, sắp theo `sort_order`.

### 5.2 `GET /api/places`
**Query:** `category`, `tag` (lặp được), `q`, `sort` (`featured` | `name`), `featured` (`true`), `page`, `pageSize`.
- `q` tìm theo `search_text` (không dấu, không phân biệt hoa thường) bằng `ILIKE`/trigram trên `f_unaccent(lower(q))`.
- Khi lặp nhiều `tag`, một địa điểm khớp nếu có **ít nhất một** tag đã chọn (OR).
- Chỉ trả `status = 'published'`.
- Giá trị `category`/`tag` lạ → `400 VALIDATION_ERROR` (không im lặng bỏ qua).

**Response 200:** `Paginated<PlaceSummary>`.

### 5.3 `GET /api/places/map`
**Query:** `category` (tùy chọn). **Response 200:** `{ "items": [{ "id","slug","name","category","lat","lng","coverImageUrl" }] }` (không phân trang, trả trường nhẹ).

### 5.4 `GET /api/places/:slug`
**Response 200:** `{ "place": PlaceDetail, "nearby": PlaceSummary[] }`
- `nearby`: tối đa 5 địa điểm `published` gần nhất từ RPC `nearby_places` (Haversine), **không** gồm chính nó.
- Slug không tồn tại hoặc chưa published → `404 NOT_FOUND`.

## 6. Chi tiết: sinh lịch trình

> Các endpoint này **không ghi DB**. Chúng nhận và trả lịch trình **nháp**. Việc lưu do `POST /api/trips` đảm nhiệm.

### 6.1 `POST /api/trips/generate`

**Request**
```json
{ "input": { /* TripInput */ }, "clientDraftId": "uuid-optional" }
```
- `clientDraftId`: nếu không gửi, server sinh mới và trả lại.
- `input` kiểm tra bằng Zod (`tripInputSchema`); `interests` phải thuộc `tags` loại `interest`; `numDays` 1–5; `notes` ≤ 300 ký tự và được làm sạch (mục 11 của `docs/07`).

**Response 200**
```json
{
  "draft": { /* TripDraft, items đã hydrate "place" */ },
  "warnings": [ /* Warning[] */ ],
  "notices": [ { "code": "FALLBACK_USED", "message": "Lịch trình được tạo theo cách đơn giản hơn." } ],
  "generation": { "by": "llm", "model": "xxx", "durationMs": 8123 }
}
```

**Lỗi:** `400 VALIDATION_ERROR` · `422 NO_CANDIDATES` (gần như không có địa điểm nào dùng được) · `429 RATE_LIMITED`.

**Hành vi bắt buộc**
1. Kiểm tra giới hạn tần suất **trước** khi làm việc nặng.
2. Chạy pipeline ở `docs/07-ai-itinerary-spec.md`. LLM lỗi/trả sai/quá thời gian → **tự chạy fallback**, vẫn trả `200` kèm `notice FALLBACK_USED`.
3. Mọi `placeId` trong kết quả **phải** tồn tại và `published` (kiểm tra lại ở bước cuối).
4. Ghi `generation_events` (service role) cho mọi lần gọi, thành công hay thất bại.
5. Hỗ trợ hủy: nếu client ngắt kết nối, dừng gọi LLM càng sớm càng tốt (dùng `AbortSignal`).
6. Tổng thời gian mục tiêu p90 ≤ 15s; **thời gian chờ cứng** cho phần LLM theo `docs/07`.

### 6.2 `POST /api/trips/regenerate-day`

**Request**
```json
{
  "input": { /* TripInput */ },
  "dayIndex": 2,
  "date": "2025-12-21",
  "lockedItems": [ { "placeId": "uuid", "slot": "afternoon" } ],
  "excludePlaceIds": ["uuid", "uuid"]
}
```
- `excludePlaceIds`: địa điểm đã dùng ở **các ngày khác** (client gửi, **server không tin mù quáng**: vẫn kiểm tra tồn tại).
- `lockedItems`: giữ nguyên tại khung giờ đó.

**Response 200:** `{ "day": TripDay, "warnings": Warning[], "notices": Notice[], "generation": {...} }`
**Lỗi:** như 6.1.

### 6.3 `POST /api/trips/alternatives`

**Request**
```json
{
  "placeId": "uuid",
  "slot": "afternoon",
  "date": "2025-12-21",
  "excludePlaceIds": ["uuid"],
  "limit": 5,
  "input": { /* TripInput (để chấm điểm hợp gu), tùy chọn */ }
}
```
**Response 200:** `{ "items": [ { "place": PlaceSummary, "distanceM": 2100, "reasonTag": "Cùng loại: lăng tẩm" } ] }`
- **Không dùng LLM**, thuật toán xác định (xem `docs/07` mục 12).
- Không có phương án → `items: []` (không phải lỗi).

## 7. Chi tiết: chuyến đi của người dùng

### 7.1 `GET /api/trips`
**Response 200:** `{ "items": [ { "id","title","numDays","startDate","isShared","coverImageUrl","updatedAt" } ] }` (mới cập nhật nhất lên đầu). `coverImageUrl` lấy từ địa điểm đầu tiên.

### 7.2 `POST /api/trips`  (lưu từ bản nháp)

**Request:** `TripDraft` (đã có `clientDraftId`).
**Response:** `201` + `Trip` nếu tạo mới; **`200` + `Trip` hiện có** nếu đã tồn tại bản ghi cùng `(user, clientDraftId)` (**idempotent**, xem `docs/03` FL-03).

**Quy tắc kiểm tra (server)**
- Mọi `placeId` tồn tại; không lặp địa điểm trong chuyến đi (`BUSINESS_RULE_VIOLATION`).
- `days.length === numDays`; `dayIndex` liên tục từ 1; mỗi ngày ≤ 8 mục; `position` liên tục từ 0.
- Mọi `item.id` và `day.id` là UUID do client sinh (server từ chối trùng với bản ghi của người khác bằng cách tạo lại id nếu trùng).
- `reason`, `note`, `title` được làm sạch (cắt khoảng trắng, loại ký tự điều khiển, **không** chấp nhận HTML).
- Tính lại `travelMinFromPrev`, `travelDistanceM` ở server (không tin client).
- Ghi trong **một transaction** (RPC `save_trip`, xem mục 10).
- Giới hạn số chuyến đi mỗi user: `MAX_TRIPS_PER_USER` (mặc định 50), vượt → `422 BUSINESS_RULE_VIOLATION`.

### 7.3 `GET /api/trips/:id`
**Response 200:** `Trip` (items đã hydrate `place`, kể cả địa điểm `archived` với `place.status = 'archived'`).
Không thuộc về người dùng hoặc không tồn tại → `404`.

### 7.4 `PUT /api/trips/:id`  (tự động lưu)

**Request**
```json
{
  "expectedUpdatedAt": "2025-10-23T09:00:00.000Z",
  "title": "Huế 2 ngày cho cặp đôi",
  "startDate": "2025-12-20",
  "days": [ { "id": "uuid", "dayIndex": 1, "date": "2025-12-20", "note": null, "items": [ /* TripItem[] */ ] } ]
}
```
**Hành vi**
- Thay toàn bộ nội dung ngày và mục theo `id` (upsert + xóa mục/ngày không còn trong request) trong một transaction.
- **Kiểm soát xung đột:** nếu `expectedUpdatedAt` khác `updated_at` hiện tại → `409 CONFLICT` kèm bản hiện tại trong `error.details.current`; client hỏi "Lịch trình đã thay đổi ở nơi khác. Tải lại?".
- Áp dụng các kiểm tra như 7.2.
- Không cho đổi `numDays` ở endpoint này trong MVP (muốn thêm/bớt ngày: tạo chuyến đi mới).

**Response 200:** `{ "trip": Trip, "warnings": Warning[] }` (có `updatedAt` mới để client dùng cho lần lưu kế tiếp).

### 7.5 `PATCH /api/trips/:id`
**Request:** `{ "title"?: string, "startDate"?: string|null }` (strict). Đổi `startDate` cập nhật `date` của các ngày. **Response 200:** `Trip`.

### 7.6 `DELETE /api/trips/:id`
**Response 204.** Cascade ngày/mục; link chia sẻ vô hiệu.

### 7.7 `POST /api/trips/:id/duplicate`
**Response 201:** `Trip` mới, tên `"<Tên> (bản sao)"`, `isShared = false`, `shareToken = null`, `clientDraftId = null`, **id mới** cho ngày và mục.

### 7.8 `PUT /api/trips/:id/share`
**Request:** `{ "enabled": true }`.
**Response 200:** `{ "isShared": true, "shareToken": "x7Kq...", "shareUrl": "https://<domain>/s/x7Kq..." }`
- Bật: tạo `share_token` **mới ngẫu nhiên** (≥ 128 bit entropy, URL-safe, ví dụ 22 ký tự base64url từ `crypto.randomBytes(16)`).
- Tắt: `is_shared = false` và **xóa** `share_token` (link cũ vô hiệu hoàn toàn); bật lại tạo token mới.

## 8. Chi tiết: chia sẻ, đã lưu, tài khoản

### 8.1 `GET /api/shared/:token`
- Dùng **service role** tra theo `share_token` và `is_shared = true`.
- **Response 200:** `SharedTripView` = `Trip` đã lược bỏ: `id`, `clientDraftId`, `input.notes`, `shareToken`, mọi thông tin chủ sở hữu. Giữ: `title`, `numDays`, `startDate`, `days` (kèm `place`), `start`.
- Token sai/đã tắt → `404 NOT_FOUND` (cùng một thông báo cho cả hai trường hợp).
- Header `X-Robots-Tag: noindex`.
- Giới hạn tần suất theo IP để chống dò token.

### 8.2 `POST /api/shared/:token/copy`
Tạo chuyến đi mới cho người gọi từ lịch trình được chia sẻ (như duplicate nhưng khác chủ). **Response 201:** `Trip`. Tính vào `MAX_TRIPS_PER_USER`.

### 8.3 Địa điểm đã lưu
- `GET /api/saved?category=...` → `{ "items": PlaceSummary[] }` (chỉ địa điểm published).
- `PUT /api/saved/:placeId` → `204` (đã lưu rồi vẫn `204`); placeId không tồn tại/không published → `404`.
- `DELETE /api/saved/:placeId` → `204` (chưa lưu vẫn `204`).

### 8.4 Tài khoản
- `GET /api/me` → `{ "id","email","displayName","avatarUrl","role" }`.
- `PATCH /api/me` → `{ "displayName": "..." }` (1–60 ký tự). Không nhận `role`.
- `DELETE /api/me` → yêu cầu body `{ "confirm": "XOA" }`; xóa `auth.users` bằng service role (cascade theo `docs/05` mục 11). **204.** Đây là thao tác không thể hoàn tác: ghi log (chỉ `user_id`, thời điểm).

## 9. Chi tiết: quản trị (Admin)

Mọi endpoint `requireAdmin`; ghi `place_audit_log` (service role) cho mỗi thay đổi.

### 9.1 `GET /api/admin/places`
**Query:** `status`, `verified` (`true/false`), `category`, `q`, `missing` (`hours|duration|image|coords`), `page`, `pageSize`.
**Response 200:** `Paginated<AdminPlaceRow>`: `PlaceSummary` + `status`, `verified`, `updatedAt`, `missingFields: string[]`.

### 9.2 `POST /api/admin/places` · `PUT /api/admin/places/:id`
- Body: toàn bộ trường của địa điểm (camelCase theo `PlaceDetail` + `tags: [{slug, weight}]`, `status`).
- Kiểm tra bằng Zod; các ràng buộc DB (ở `docs/05`) là lớp bảo vệ thứ hai: chuyển lỗi `CHECK` thành `400 VALIDATION_ERROR` có thông báo tiếng Việt cụ thể.
- Xuất bản mà thiếu trường bắt buộc → `422 BUSINESS_RULE_VIOLATION` kèm danh sách trường thiếu: `details: [{path:"visitDurationMin", message:"Thiếu thời gian tham quan"}]`.
- Có `coverImageUrl` mà thiếu `imageCredit`/`imageLicense` → `400`.
- Slug trùng → `409 CONFLICT`.

### 9.3 `POST /api/admin/places/:id/status`
Body: `{ "status": "published" | "draft" | "archived" }`. Áp dụng quy tắc vòng đời ở `docs/03` FL-08.3.

### 9.4 `POST /api/admin/places/:id/verify`
Body: `{ "verified": true }`. Ghi `verified_by`, `verified_at`, `last_verified_at = now()`, và xóa `ai_filled_fields` đã được xác nhận (hoặc cho phép gửi danh sách trường được xác nhận: `confirmedFields`).

### 9.5 Import CSV
- `POST /api/admin/import/preview`, `Content-Type: text/csv`, body là nội dung CSV (≤ 2 MB).
  **Response 200:**
  ```json
  {
    "summary": { "total": 55, "valid": 48, "warnings": 5, "errors": 2 },
    "rows": [
      { "line": 2, "slug": "dai-noi-hue", "status": "valid", "action": "create", "messages": [] },
      { "line": 7, "slug": "quan-abc", "status": "error", "action": "skip",
        "messages": ["Thiếu image_credit"] }
    ],
    "previewToken": "opaque-string"
  }
  ```
  - `previewToken`: định danh bản xem trước (lưu tạm, hết hạn sau 30 phút), để `commit` không phải gửi lại cả tệp.
- `POST /api/admin/import/commit` body `{ "previewToken": "...", "overwriteVerified": false }`
  **Response 200:** `{ "created": 40, "updated": 8, "skipped": 2, "errors": [ { "line": 7, "message": "..." } ], "errorCsv": "data:text/csv;..." }`
- Quy tắc nội dung CSV: `docs/05-data-model.md` mục 8. Upsert theo `slug`; mọi bản ghi `draft` + `verified = false`; **không ghi đè** trường của địa điểm đã `verified` trừ khi `overwriteVerified = true`.
- Lưu `previewToken` ở đâu: bảng tạm `import_previews` hoặc bộ nhớ đệm dùng chung (Vercel KV/Upstash). Do function không giữ trạng thái giữa các lần gọi, **không** lưu trong biến toàn cục. Nếu chưa muốn thêm hạ tầng, cho phép `commit` nhận lại nội dung CSV (≤ 2 MB) và kiểm tra lại từ đầu.

## 10. Hàm cơ sở dữ liệu (RPC) cần tạo

Các hàm được chia theo task để migration theo đúng thứ tự:

- Migration 8, task T-012: `nearby_places`.
- Migration 9, task T-034: `save_trip` và `create_trip_from_payload`.

| Hàm | Mục đích |
|---|---|
| `nearby_places(p_lat float8, p_lng float8, p_limit int, p_exclude uuid[])` | Migration 8 · T-012. Trả địa điểm published theo khoảng cách (Haversine), giới hạn 1–20 (mặc định 5), dùng cho `nearby` và thay thế. |
| `save_trip(p_trip_id uuid, p_payload jsonb, p_expected_updated_at timestamptz)` | Migration 9 · T-034. Trong một transaction: khóa dòng `trips`, kiểm tra phiên bản, upsert `trip_days`, upsert/xóa `trip_items`, cập nhật `updated_at`. `SECURITY INVOKER` để RLS vẫn áp dụng |
| `create_trip_from_payload(p_payload jsonb)` | Migration 9 · T-034. Tạo mới `trips` + ngày + mục; xử lý idempotent theo `(user_id, client_draft_id)` |

> Lỗi phiên bản ném `exception` có mã riêng để server ánh xạ sang `409 CONFLICT`.

## 11. Chỗ được dùng `service role`

Chỉ những nơi sau; mỗi nơi phải **tự kiểm tra quyền** trước khi truy vấn:

1. `GET /api/shared/:token` và `POST /api/shared/:token/copy` (tra theo token).
2. Ghi `generation_events` và `place_audit_log`.
3. `DELETE /api/me` (xóa `auth.users`).
4. Các endpoint import (ghi hàng loạt, sau khi đã xác nhận `requireAdmin`).
5. `/api/sitemap.xml`, `/api/og/*` (đọc dữ liệu công khai, có thể dùng anon key).

Mọi nơi còn lại dùng client kèm JWT người dùng (hoặc anon key cho dữ liệu công khai).

## 12. Endpoint hệ thống

### `GET /api/health`
`{ "status": "ok", "time": "..." }`. Không truy cập DB (hoặc chỉ truy vấn rất nhẹ nếu thêm `?deep=1`).

### `GET /api/sitemap.xml`
Liệt kê `/`, `/explore`, `/map`, `/about`, `/privacy` và `/place/:slug` của mọi địa điểm published (`lastmod = updated_at`). `Cache-Control: public, s-maxage=3600`.

### `GET /api/og/place/:slug`, `GET /api/og/share/:token`
Trả HTML tối giản chứa thẻ `<title>`, `description`, Open Graph (`og:title`, `og:description`, `og:image`, `og:url`) cho bot mạng xã hội. Dùng `vercel.json` để chỉ chuyển bot sang các endpoint này. Ví dụ (kiểm tra cú pháp theo tài liệu Vercel hiện hành):

```json
{
  "rewrites": [
    {
      "source": "/place/:slug",
      "has": [{ "type": "header", "key": "user-agent",
        "value": "(?i).*(facebookexternalhit|Zalo|Twitterbot|Slackbot|LinkedInBot|Googlebot|bingbot).*" }],
      "destination": "/api/og/place/:slug"
    },
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
- Trang `/s/:token` cho bot **không** lộ nội dung chi tiết; chỉ tiêu đề và ảnh bìa. Nhớ `noindex` và `Cache-Control: no-store` để tắt chia sẻ có hiệu lực ngay.

## 13. Biến môi trường backend

| Biến | Ý nghĩa | Mặc định |
|---|---|---|
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Kết nối Supabase | — |
| `SUPABASE_SERVICE_ROLE_KEY` | Chỉ backend | — |
| `LLM_API_KEY`, `LLM_MODEL` | Gọi LLM | — |
| `LLM_ENABLED` | Công tắc khẩn cấp | `true` |
| `LLM_TIMEOUT_MS` | Thời gian chờ mỗi lần gọi LLM | `12000` |
| `LLM_DAILY_CALL_CAP` | Trần số lần gọi LLM mỗi ngày | `500` |
| `RATE_LIMIT_SALT` | Muối để băm `client_key` | — (bắt buộc) |
| `RATE_LIMIT_GUEST_GENERATE_PER_HOUR` | Hạn mức khách | `3` |
| `RATE_LIMIT_USER_GENERATE_PER_HOUR` | Hạn mức user | `10` |
| `MAX_TRIPS_PER_USER` | Số chuyến đi tối đa | `50` |
| `APP_BASE_URL` | Dùng tạo `shareUrl`, sitemap, Open Graph | — |

Cập nhật `.env.example` mỗi khi thêm biến. Kiểm tra biến bắt buộc ngay khi khởi động bằng Zod (`server/lib/env.ts`), thiếu thì báo lỗi rõ ràng.

## 14. Bảo mật, log và quan sát

- Không log: token, email, `notes` của người dùng, nội dung prompt/phản hồi LLM đầy đủ (chỉ log số token, thời lượng, mã lỗi, và **băm** của input nếu cần gỡ lỗi).
- Mỗi log có `requestId`, `route`, `status`, `durationMs`, `userId` (nếu có).
- Theo dõi: tỷ lệ dùng fallback, thời lượng sinh (p50/p90), số 429, số lỗi 5xx, lượng token LLM theo ngày (từ `generation_events`).
- Trả lỗi 4xx/5xx **không** kèm stack trace. Ở môi trường phát triển có thể bật chi tiết bằng cờ rõ ràng.
- Mọi chuỗi từ người dùng/LLM hiển thị lên giao diện là **văn bản thuần** (React tự escape; cấm `dangerouslySetInnerHTML`).
- Kiểm tra `Content-Type: application/json` ở endpoint ghi (trừ import).

## 15. Yêu cầu kiểm thử API

Mỗi endpoint có test (Vitest + `app.request`) tối thiểu cho:

- [ ] Trường hợp thành công.
- [ ] Dữ liệu sai (`400`), thiếu token (`401`), sai quyền (`403`), không tồn tại (`404`).
- [ ] **Cách ly dữ liệu:** user A không đọc/sửa/xóa được chuyến đi/địa điểm đã lưu của user B (kỳ vọng `404`).
- [ ] `PUT /trips/:id`: xung đột phiên bản → `409`; lưu lặp lại không nhân đôi dữ liệu.
- [ ] `POST /trips`: gọi hai lần cùng `clientDraftId` chỉ tạo một bản ghi.
- [ ] `generate`: LLM giả trả id sai/trùng/JSON hỏng/timeout → vẫn `200` với kết quả hợp lệ và `FALLBACK_USED`.
- [ ] Giới hạn tần suất: vượt hạn mức → `429` kèm `Retry-After`.
- [ ] `shared/:token`: token đã tắt không trả dữ liệu; không lộ trường bị lược bỏ.
- [ ] Endpoint admin: user thường nhận `403`.
- [ ] Import: file mẫu hợp lệ, file có dòng lỗi, import lặp không tạo trùng.

## 16. Checklist cho agent khi thêm/sửa endpoint

- [ ] Thêm vào bảng mục 4 và mô tả chi tiết ở file này.
- [ ] Zod schema ở `shared/schemas/` dùng chung client/server; không định nghĩa trùng lặp.
- [ ] Gắn đúng middleware quyền; kiểm tra quyền ở server, không tin dữ liệu client.
- [ ] Dùng client Supabase đúng loại (JWT người dùng / anon / service role) theo mục 11.
- [ ] Trả lỗi đúng định dạng mục 2.2; thông báo tiếng Việt.
- [ ] Đặt `Cache-Control` đúng mục 2.5.
- [ ] Có test theo mục 15 và cập nhật `src/lib/api.ts` (hàm gọi có kiểu).

## Câu hỏi còn mở

- [ ] Nhà cung cấp LLM và model cụ thể (ảnh hưởng `LLM_TIMEOUT_MS`, chi phí, và cách dùng structured output).
- [ ] Lưu `previewToken` của import ở đâu (bảng tạm, Vercel KV, hay gửi lại CSV khi commit)?
- [ ] Hạn mức cho khách có giữ ở mức 3 lần/giờ không, hay chỉ cho khách dùng thuật toán dự phòng (không LLM)?
- [ ] Có cần endpoint xuất lịch trình (PDF, ICS) ở MVP không? (hiện thuộc giai đoạn 2)
