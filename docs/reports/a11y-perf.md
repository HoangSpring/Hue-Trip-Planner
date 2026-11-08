# Báo cáo rà soát truy cập và hiệu năng — 2026-11-08

## Phạm vi

Audit axe chạy qua 10 route công khai/đại diện ở desktop (1440×1000) và mobile (390×844), tổng cộng 20 tổ hợp. Một số route cần phiên đăng nhập hoặc token hợp lệ tự chuyển về trang an toàn; audit không bao phủ trạng thái người dùng đã đăng nhập.

## Kết quả axe

| Kết quả | Số lượng |
|---|---:|
| Tổ hợp route/kích thước | 20 |
| Lỗi critical | 0 |
| Lỗi serious | 0 |

Lần audit cuối `pnpm a11y:audit` thoát 0: 20 tổ hợp, tất cả đều `critical=0; serious=0`. Các sửa đổi gồm tên truy cập của logo dựa trên nội dung hiển thị, nhóm điều khiển bộ lọc có role phù hợp, bỏ nhãn ghi đè không khớp chữ hiển thị, tăng tương phản trên Explore/Map/Place, và liên kết bỏ qua đến nội dung chính.

## Lighthouse

Đo trên production preview bằng Lighthouse với preset desktop/mobile. Ngưỡng dự án: LCP ≤ 2.5 giây trên mobile 4G, CLS ≤ 0.1, performance mobile ≥ 80.

| Route | Thiết bị | Performance | LCP | CLS | FCP | TBT |
|---|---|---:|---:|---:|---:|---:|
| Trang chủ | Mobile | 73 | 7.673 s | 0.000 | 1.990 s | 144 ms |
| Khám phá | Mobile | 94 | 2.405 s | 0.000 | 2.405 s | 118 ms |
| Chi tiết địa điểm | Mobile | 74 | 1.958 s | 0.580 | 1.958 s | 112 ms |
| Trang chủ | Desktop | 96 | 1.419 s | 0.000 | 0.632 s | 44 ms |
| Khám phá | Desktop | 77 | 1.435 s | 0.380 | 0.664 s | 0 ms |
| Chi tiết địa điểm | Desktop | 84 | 1.579 s | 0.200 | 0.664 s | 0 ms |

Trang chủ mobile chưa đạt LCP và điểm performance mục tiêu. CLS ở trang chi tiết địa điểm còn cao trên cả hai kích thước; Explore desktop cũng còn CLS cao. Đã thêm preload ảnh hero, khai báo kích thước ảnh và bỏ chuyển động phóng ảnh hero. Các thay đổi chưa giải quyết được số đo nêu trên; nguyên nhân chính xác của LCP trang chủ mobile chưa được xác định.

## Giới hạn

- Chưa hoàn thành kiểm tra bàn phím thủ công và focus trap trong modal.
- Preview cục bộ không mô phỏng đầy đủ rewrite bot của Vercel; cần kiểm tra OG bằng Facebook Sharing Debugger và công cụ preview Zalo sau deploy.
- Các điểm hiệu năng chưa đạt cần xử lý trước khi đánh dấu T-048 hoàn thành.
- Audit được chạy trên working tree. Một số thay đổi liên quan trong `PublicLayout.tsx`, `BrandMark.tsx`, `HomePage.tsx` và `styles.css` còn lẫn với chỉnh sửa giao diện người dùng và chưa được đưa vào commit T-048; cần review/tách riêng trước khi merge.

## Đo lại T-048 — 2026-11-08

Đo trên `pnpm build` + `pnpm preview`, API cục bộ nối dữ liệu Supabase chỉ đọc. Lighthouse 13.6, mobile, `--throttling-method=simulate`, CPU slowdown 4×; mỗi route chạy ba lần, lấy trung vị. Đầu ra JSON thô nằm trong thư mục temp của máy đo (`hue-lh-final2-*.json`), không được commit.

| Route | LCP trước → sau | CLS trước → sau | TBT trước → sau | Tổng byte trước → sau | Request trước → sau |
|---|---:|---:|---:|---:|---:|
| `/` | 7,521 → 7,215 ms | 0 → 0 | 155 → 105 ms | 3,392,921 → 3,333,680 | 35 → 33 |
| `/explore` | 1,987 → 6,622 ms | 0.0283 → 0 | 52 → 280 ms | 3,704,130 → 3,644,890 | 35 → 33 |
| `/place/bun-bo-ba-tuyet` | 2,147 → 6,771 ms | 0.5786 → 0 | 144 → 166 ms | 3,515,482 → 3,226,212 | 48 → 32 |

LCP sau sửa theo phần tử được Lighthouse ghi nhận: trang chủ `div.min-h-screen > section.relative > div.absolute > img.hero-zoom-out`, ảnh `/images/dai-noi-hue-hero.jpg` (724,147 byte); Explore là đoạn mô tả tĩnh `div.relative > div.flex > div.max-w-3xl > p.mt-3`; trang chi tiết là tiêu đề skeleton tĩnh `div.mt-7 > div.min-w-0 > section.space-y-4 > h1.mt-4` (“Thông tin địa điểm Huế”). Hai phần tử chữ không có URL ảnh. Lighthouse không trả `largest-contentful-paint-element` detail cho các file JSON sau sửa; selector/nhãn trên lấy từ element trace đã quan sát ở lần chạy tương ứng. Không có layout-shift sources trong cả chín lần đo sau sửa (CLS 0). Trước sửa, các source có ghi nhận là footer `body > div#root > div.min-h-screen > footer.relative` (Explore/Place; lần Place 0.441607 và 0.137026) và skeleton/khu lọc `main.min-h-screen > section.mx-auto > div.rounded-2xl > div.mt-4` (Explore 0.02834). Home không có source dịch chuyển trước sửa.

CLS đạt mục tiêu trên cả ba route; LCP không đạt ở bất cứ route nào. Việc giảm byte/request không đủ bù thời gian LCP mô phỏng. Điểm cần lưu ý: `observedLargestContentfulPaint`/FCP trong Lighthouse trace thấp hơn đáng kể (~659 ms/~1.8 s) so với metric LCP mô phỏng 6.6–7.2 s và LCP breakdown; báo cáo vẫn dùng metric Lighthouse chuẩn theo yêu cầu. Cần xác minh lại trên Vercel và kiểm tra trace khi triển khai.
