# Báo cáo sửa T-048 — CLS/LCP — 2026-11-08

## 1. Tóm tắt

Đã đo ba route ba lần trên production preview với mô phỏng Lighthouse mobile 4G/CPU 4×, rồi xử lý các dịch chuyển có bằng chứng: skeleton Explore có cùng số thẻ với kết quả thật, skeleton trang chi tiết dành sẵn chiều cao, và bản đồ địa điểm tải trễ. CLS sau sửa là 0 trên cả ba route. LCP vẫn vượt 2.5 giây cả ba route, nên T-048 chưa đạt và không được tick.

## 2. Task đã làm

| Task | Nhánh / commit | Đã đạt hoàn thành? | Ghi chú |
|---|---|---|---|
| T-048 | `feat/T-048-a11y-performance` / commit ở cuối lượt | Một phần | CLS đạt; LCP chưa đạt. Không push. |

## 3. Task chưa xong

| Task | Còn thiếu | Lý do |
|---|---|---|
| T-048 | LCP ≤ 2.5s ở `/`, `/explore`, `/place/:slug` | Số đo Lighthouse sau sửa: 7.215s, 6.622s, 6.771s. Trang chủ LCP là ảnh hero 724 KB trong phần giao diện/ảnh đang có thay đổi của chủ dự án; chưa thay thế hoặc ghi đè. |

## 4. Trạng thái ban đầu và phân loại thay đổi

Nhánh lúc bắt đầu: `feat/T-048-a11y-performance`. `git status` ban đầu liệt kê `docs/09-roadmap-tasks.md`, `src/app/layouts/PublicLayout.test.tsx`, `src/app/layouts/PublicLayout.tsx`, `src/components/BrandMark.tsx`, `src/features/home/HomePage.tsx`, `src/styles.css`, `docs/eval/2026-11-08-fallback-v2.md`, `public/images/`.

Các thay đổi bố cục/nhận diện/ảnh trong `PublicLayout.tsx`, `BrandMark.tsx`, `HomePage.tsx`, `styles.css`, cùng `docs/09-roadmap-tasks.md`, dữ liệu eval và ảnh chưa theo dõi được phân loại là của chủ dự án hoặc lẫn với chỉnh sửa trước đó. Không revert, không stage và không commit các mục đó. Thay đổi riêng lượt này được giữ trong các file sạch trước đó: fallback route, skeleton Explore/Place, lazy map, preload kết nối font, cấu hình chunk, chuỗi loading và báo cáo.

## 5. Đầu ra lệnh thật

Đầu tiên lệnh pnpm trong sandbox báo `ERR_PNPM_STORE_DIR_OPEN_OPERATION_LOCK` / `Access is denied` khi mở store lock. Đây là lỗi môi trường theo AGENTS.md; chạy lại với quyền ngoài sandbox thành công. Không có lỗi mã ở các cổng sau.

| Lệnh | Đầu ra |
|---|---|
| `pnpm typecheck` | `$ tsc --noEmit` — exit 0 |
| `pnpm lint` | `$ eslint .` — exit 0 |
| `pnpm test -- --reporter=dot` | `Test Files 56 passed (56); Tests 328 passed (328)` — exit 0. Có cảnh báo JSDOM `Window's scrollTo()` không được triển khai. |
| `pnpm build` | Vite build thành công, 397 modules transformed. Rollup cảnh báo vị trí comment `@__PURE__` trong dependency Zod; build exit 0. MapView là chunk tải trễ 192.70 KB (55.50 KB gzip). |
| `pnpm smoke:api` | 10 đạt, 0 lỗi, 0 bỏ qua; 55 địa điểm published đã chỉ đọc. |
| `pnpm a11y:audit` | 20 tổ hợp route/viewport; critical=0, serious=0; exit 0. |

## 6. Số đo trước/sau

Production preview, Lighthouse 13.6, mô phỏng mobile mặc định, CPU 4×, ba lượt/route, trung vị:

| Route | LCP trước → sau | CLS trước → sau | TBT trước → sau | Byte trước → sau | Request trước → sau |
|---|---:|---:|---:|---:|---:|
| `/` | 7,521 → 7,215 ms | 0 → 0 | 155 → 105 ms | 3,392,921 → 3,333,680 | 35 → 33 |
| `/explore` | 1,987 → 6,622 ms | 0.0283 → 0 | 52 → 280 ms | 3,704,130 → 3,644,890 | 35 → 33 |
| `/place/bun-bo-ba-tuyet` | 2,147 → 6,771 ms | 0.5786 → 0 | 144 → 166 ms | 3,515,482 → 3,226,212 | 48 → 32 |

LCP sau sửa:

- `/`: `div.min-h-screen > section.relative > div.absolute > img.hero-zoom-out`, `/images/dai-noi-hue-hero.jpg`, 724,147 byte.
- `/explore`: `div.relative > div.flex > div.max-w-3xl > p.mt-3`, đoạn mô tả tĩnh.
- `/place/bun-bo-ba-tuyet`: `div.mt-7 > div.min-w-0 > section.space-y-4 > h1.mt-4`, tiêu đề skeleton “Thông tin địa điểm Huế”.

Lighthouse JSON không kèm chi tiết `largest-contentful-paint-element` cho các lần sau; selector và URL lấy từ element trace quan sát được khi đo. Không có layout-shift sources trong 9 báo cáo sau sửa. Nguồn trước sửa: Explore có footer `body > div#root > div.min-h-screen > footer.relative` (CLS 0.677357 ở lần 1; không phát sinh ở lần 2) và skeleton/filter `main.min-h-screen > section.mx-auto > div.rounded-2xl > div.mt-4` (0.02834 ở lần 3). Place có footer `body > div#root > div.min-h-screen > footer.relative` với shift score 0.441607 và 0.137026. Home không có source dịch chuyển.

Lighthouse trace đồng thời ghi observed LCP khoảng 659 ms và FCP khoảng 1.8s, khác đáng kể metric LCP mô phỏng 6.6–7.2s/breakdown. Dùng metric LCP Lighthouse chuẩn trong bảng và coi đây là sai khác cần đối chiếu lại bằng Vercel.

## 7. Thay đổi và khác biệt

- Explore fallback dựng đúng 24 thẻ skeleton thay vì 8; chuyển fallback route sang skeleton theo cấu trúc trang.
- Place có skeleton cấu trúc và chiều cao dành trước; bản đồ mini chỉ tải khi gần viewport.
- Chia chunk để Leaflet không tải ban đầu trên trang không cần bản đồ; MapView là chunk độc lập tải trễ.
- Thêm preconnect tới Google Fonts.
- Không đổi dữ liệu, không migration, không ghi Supabase. `LLM_ENABLED` không bị thay đổi.
- Mục tiêu LCP thất bại. Home LCP nằm trên ảnh hero trong file giao diện/ảnh có thay đổi chủ dự án; không thể đổi nguồn ảnh hoặc kích thước asset mà không sửa nội dung thuộc quyền chủ dự án. Explore/Place báo cáo LCP mô phỏng chậm dù phần tử LCP là chữ tĩnh; cần xem trace Lighthouse/hosting thực tế trước khi tối ưu thêm.

## 8. Cần chủ dự án

- Review các diff có sẵn trong `PublicLayout.tsx`, `BrandMark.tsx`, `HomePage.tsx`, `styles.css`, `PublicLayout.test.tsx`, `docs/09-roadmap-tasks.md`, ảnh và eval; chúng vẫn chưa commit.
- Với trang chủ, duyệt việc tạo ảnh hero thumbnail/WebP/AVIF được ghi công hoặc thay nguồn ảnh để giảm tải 724 KB.
- Tự đo lại trên Vercel; chỉ tick T-048 khi LCP và CLS đạt đủ trên cả ba trang.

## 9. Cách chạy thử

`pnpm build`, `pnpm preview`, `pnpm dev:api`; mở `http://127.0.0.1:4173/`, `/explore`, `/place/bun-bo-ba-tuyet`. Đo bằng Lighthouse mobile simulated, CPU slowdown 4×, ba lần mỗi route. Chạy thêm `pnpm a11y:audit`.
