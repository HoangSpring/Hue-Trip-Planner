# Báo cáo sửa API deployment Vercel — 2026-11-09

## 1. Tóm tắt

Lỗi đầu tiên là Node ESM không resolve được import extensionless; bundle ESM được thêm trong commit `50fe4b2`. Sau deploy commit đó, Runtime Logs mới cho thấy Vercel bỏ qua `Response` được trả về từ default function và request timeout. Nguyên nhân tiếp theo là chữ ký của `hono/vercel` không phù hợp Vercel Function thường.

API entry hiện dùng Web Handler `default { fetch(request) }`, bundle vẫn được build từ source. Smoke gọi trực tiếp Web Handler thành công cho health và API. Vercel CLI không có trong môi trường này, nên production chưa được xác nhận; cần deploy commit follow-up rồi kiểm tra endpoint.

## 2. Task

| Task | Nhánh / commit | Đạt hoàn thành? | Ghi chú |
|---|---|---|---|
| Vercel API ESM module resolution | `fix/vercel-api-esm-bundle` / xem hash commit sau cùng | Một phần | Bundle local và smoke bundle đạt; chưa có Vercel CLI hoặc xác minh trên deployment thật. |
| Vercel Web Handler signature | `fix/vercel-web-handler` / xem hash commit sau cùng | Một phần | Handler và smoke qua; chưa xác minh trên deployment thật. |

## 3. Nguyên nhân gốc và bằng chứng

- `api/[[...route]].ts` trước đây import `../server/app` không có phần mở rộng. `server/app.ts` tồn tại, nên đường dẫn thư mục tương đối là đúng; vấn đề không phải viết sai `../server`.
- Repo khai báo `"type": "module"`. Trong Node ESM, relative specifier `../server/app` không tự thử `app.js` hay `app.ts`. Chạy `node --input-type=module -e "import('./server/app')..."` trên repo cho đầu ra `ERR_MODULE_NOT_FOUND: file:///D:/Hue%20Trip%20Planner/server/app`.
- Log Vercel có cùng dạng resolution: importer là `/var/task/api/[[...route]].js`, module URL tìm là `/var/task/server/app`. Điều đó xác nhận entry function đã được chuyển thành `.js` nhưng import backend không có phần mở rộng ESM hợp lệ.
- `includeFiles: "server/**"` chỉ chỉ định thêm file runtime; nó không biên dịch TypeScript hoặc sửa specifier extensionless. Vì thế việc chép thư mục `server` không làm được `server/app.ts` thành một module `server/app` mà ESM có thể nạp.
- Không dùng `@hono/node-server` trong function Vercel. Không dùng `hono/vercel` adapter cho API directory Function thường; adapter đó trả Response từ default function và không ghi vào Node `res`.

## 4. Thay đổi

- `vite.server.config.ts` build `server/app.ts` thành `api/_server.generated/app.js` dạng SSR ESM. Import nội bộ từ `server/` và `shared/` được đóng vào bundle; kiểm tra bundle cho kết quả 0 import cục bộ (`./`, `../`, `@shared`, `@/`). Import ngoài còn lại là package runtime (`hono`, `zod`, `@supabase/supabase-js`, `node:crypto`).
- `api/[[...route]].ts` import bundle với phần mở rộng rõ ràng `./_server.generated/app.js` rồi tiếp tục dùng `hono/vercel`.
- `pnpm build` hiện chạy thêm `pnpm build:api`; `vercel.json` khai báo rõ Vite, `pnpm build`, `dist`, và include bundle API được tạo. File bundle JS được ignore vì sinh trong build; declaration cho TypeScript được lưu trong source.
- `scripts/smokeApi.ts` hỗ trợ chạy cùng bộ smoke trên bundle được build; thêm script `pnpm smoke:vercel-api`.
- Không thêm deep health check: health hiện tại không thể chạy khi module import đã thất bại; endpoint health không sửa được lỗi này và có thể gây chẩn đoán nhầm. Không thay đổi DB, migration, dữ liệu hay cờ `LLM_ENABLED`.

## 5. Đầu ra kiểm tra thật

Thời gian: 2026-11-09, múi giờ Asia/Saigon. Ổ C: báo 0 byte trống; Vitest được chạy với thư mục tạm riêng trên ổ D. Lần test đầu dùng temp trên C: gặp `ENOSPC`; chạy lại trên D: thành công. Pnpm cũng có lần bị chặn mở store lock bởi `Access is denied` trong sandbox; chạy lại có quyền phù hợp. Đây là lỗi môi trường, không phải test/code failure.

| Lệnh | Đầu ra |
|---|---|
| Node ESM reproduction | `ERR_MODULE_NOT_FOUND: file:///D:/Hue%20Trip%20Planner/server/app` |
| `pnpm typecheck` | `$ tsc --noEmit` — exit 0 |
| `pnpm lint` | `$ eslint .` — exit 0 |
| `pnpm test -- --reporter=dot` | `Test Files 56 passed (56); Tests 328 passed (328)` — exit 0. Có cảnh báo JSDOM `Window's scrollTo()` không được triển khai. |
| `pnpm build` | Vite frontend thành công; API SSR bundle: `api/_server.generated/app.js`, 243.27 kB, 72 modules transformed. Có warning Rollup `@__PURE__` trong Zod dependency; exit 0. |
| Import bundle bằng Node ESM + `app.request('/api/health')` | `generated bundle load: PASS; health=200`; import không báo lỗi module. |
| Kiểm tra import nội bộ bundle | `0` import cục bộ/alias; chỉ còn import package và `node:`. |
| `pnpm smoke:api` | 10 đạt, 0 lỗi, 0 bỏ qua; đọc 55 địa điểm published. |
| `pnpm smoke:vercel-api` | 10 đạt, 0 lỗi, 0 bỏ qua; cùng smoke chạy qua bundle production-style. |
| `vercel build` | Chưa chạy: Vercel CLI không có trong PATH hoặc `node_modules/.bin`; `.vercel/output` không tồn tại. Không cài CLI trong lượt này. |

## 6. Cấu hình Vercel và giới hạn xác minh

Vercel entry không gọi Node server riêng. Rewrite API vẫn đứng trước bot rewrites và SPA catch-all. Thư mục output `dist` phù hợp build Vite. `maxDuration: 30` được giữ nguyên. Theo tài liệu Vercel, build cần bundle app code và `includeFiles` dùng để thêm file cần có khi runtime; các chức năng này không thay thế lẫn nhau: [Vercel Functions và file tracing](https://vercel.com/kb/guide/how-can-i-use-files-in-serverless-functions), [Vite trên Vercel](https://vercel.com/docs/frameworks/frontend/vite), [cấu hình `vercel.json`](https://vercel.com/docs/project-configuration/vercel-json).

Giới hạn: không có CLI nên không kiểm tra được adapter/builder Vercel tạo artifact `.func` thật hoặc cách `includeFiles` đóng gói trong deployment. Kiểm tra bundle hiện là Vite SSR output + Node ESM load + API smoke, không phải kết quả `vercel build` hay production deployment. Vì vậy chưa kết luận lỗi production đã hết.

## 7. Các bước xác minh sau deploy

Sau khi merge/deploy commit:

1. Kiểm tra Runtime Logs không còn `ERR_MODULE_NOT_FOUND` cho `/var/task/server/app`.
2. Gọi `GET /api/health` phải trả 200 và `GET /api/places` phải trả 200 cùng danh sách published.
3. Gọi `/api/me` không token phải trả lỗi xác thực API có cấu trúc (`401`), không phải function crash; sau đó kiểm tra lại trong phiên đăng nhập để xác nhận `200`.
4. Mở `/explore`, `/map`, `/place/<slug>` và trang tài khoản để xác nhận các route gọi API hoạt động.

Không ghi hoặc xóa dữ liệu Supabase trong lượt này. Không in biến môi trường hoặc secret.

## 8. Điều tra follow-up: Vercel bỏ qua Response — 2026-11-09

### Nguyên nhân

Production log cảnh báo `default export returned a Response` và nêu rằng chữ ký function mặc định là `(req, res) => void`. Kiểm tra mã đang cài cho thấy `hono@4.13.13` trong `node_modules/hono/dist/adapter/vercel/handler.js` định nghĩa `handle = (app) => (req) => app.fetch(req)`. Adapter trả một hàm một tham số với kết quả `Response`; trong Vercel API directory dạng Node Function, default function đó bị nhận diện như handler callback-style và giá trị trả về bị bỏ qua. Vì response không được gửi, runtime chờ đến giới hạn 30 giây rồi timeout. Đây giải thích đồng nhất `/api/health`, `/api/meta`, `/api/places`; lỗi xuất hiện trước khi cần kết luận Supabase hỏng.

`GET /api/health` đã có trong `server/app.ts`, chạy `requestIdMiddleware` và `publicCache`, rồi trả JSON tĩnh. `publicCache` chỉ `await next()` và gắn header; route không tạo client hoặc gọi Supabase. Do đó health là route kiểm tra tối thiểu phù hợp. Không thêm truy vấn sâu hoặc dữ liệu giả.

### Bản sửa

- `api/[[...route]].ts` bỏ `hono/vercel`, export default object có `fetch(request: Request)` và trả `await app.fetch(request)`; đây là Web Handler của Vercel Node.js Functions.
- `pnpm smoke:vercel-api` giờ import API entry thật và gọi `default.fetch(new Request(...))`; test health chạy trước các lần đọc Supabase. Bộ smoke còn lại chạy qua cùng handler.
- Chưa thêm log Supabase: vì lỗi trực tiếp là chữ ký handler; sau bản sửa local, cả places và meta đều trả về. Nếu deployment mới trả health 200 nhưng route đọc dữ liệu còn timeout, khi đó mới thêm log từng bước có requestId/status và không chứa request data/secrets.

### Đầu ra thật ở commit follow-up

| Lệnh | Đầu ra |
|---|---|
| `pnpm typecheck` | Ban đầu có lỗi kiểu do `app.fetch` có kiểu `Response | Promise<Response>`; đổi wrapper sang `async` và chạy lại thành công: `$ tsc --noEmit`, exit 0. |
| `pnpm lint` | `$ eslint .`, exit 0. |
| `pnpm test -- --reporter=dot` | `Test Files 56 passed (56); Tests 328 passed (328)`, exit 0; chỉ cảnh báo JSDOM `scrollTo` như trước. |
| `pnpm build` | Frontend Vite thành công; API SSR bundle 243.27 kB, 72 module. Warning Rollup `@__PURE__` trong Zod dependency, exit 0. |
| `pnpm smoke:api` | Health + 10 endpoint assertions: tổng 11 đạt, 0 lỗi, 0 bỏ qua; 55 published được đọc. |
| `pnpm smoke:vercel-api` | Cùng 11 assertions nhưng đi qua `default.fetch` của API entry: 11 đạt, 0 lỗi, 0 bỏ qua. Health xác nhận HTTP 200 và không truy cập Supabase. |
| `vercel build` | Chưa chạy; Vercel CLI không có sẵn và không được cài theo yêu cầu. Production chưa được xác nhận. |

Lần đầu chạy typecheck trên wrapper đồng bộ thất bại do kiểu trả về chưa chuẩn hóa; đây là lỗi mã đã sửa, không phải lỗi môi trường. Không có thao tác DB/migration; `LLM_ENABLED` giữ nguyên.

### Xác nhận sau deploy

Deploy commit follow-up, rồi xác nhận Runtime Logs không còn cảnh báo bỏ `Response`, `/api/health` trả 200 nhanh, `/api/meta` và `/api/places` trả 200. Chỉ khi các phản hồi production thật đạt mới xem incident đã được khắc phục. Nếu health đạt nhưng API đọc dữ liệu timeout, thêm chẩn đoán an toàn quanh repository query trước khi thay đổi timeout.
