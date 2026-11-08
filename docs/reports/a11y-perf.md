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
