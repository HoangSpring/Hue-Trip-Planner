# Phase 4 (M4) — Tài khoản, lưu và chia sẻ

> Giao việc cho agent. Đọc `AGENTS.md` trước, rồi làm theo file này. Chi tiết từng task nằm ở `docs/09-roadmap-tasks.md`.

## Mục tiêu

Đăng nhập, lưu chuyến đi, đồng bộ nháp, địa điểm đã lưu, chia sẻ link.

## Đọc trước khi làm

- docs/02-features.md (F-08 → F-11)
- docs/03-user-flows.md (FL-02, FL-03, FL-05 → FL-07)
- docs/05-data-model.md (RLS, RPC)
- docs/06-api-spec.md (mục 7, 8)

## Tasks (làm theo thứ tự, mỗi task một PR)

| Task | Tên | Cỡ | Phụ thuộc |
|---|---|---|---|
| T-034 | Migration RPC lưu chuyến đi | M | T-003 |
| T-035 | API chuyến đi của người dùng | L | T-034, T-005 |
| T-036 | Lưu chuyến đi từ trình chỉnh sửa (chế độ đã lưu) | L | T-035, T-026, T-008 |
| T-037 | Trang Đăng nhập/Đăng ký/Quên mật khẩu (F-08) | M | T-008, T-007 |
| T-038 | Đồng bộ nháp khi đăng nhập | M | T-035, T-037 |
| T-039 | Chuyến đi của tôi (F-09) và Cài đặt tài khoản | M | T-035, T-037 |
| T-040 | Địa điểm đã lưu (F-10) | M | T-005, T-015, T-016, T-037 |
| T-041 | "Thêm vào chuyến đi" từ trang địa điểm | S | T-016, T-026, T-036 |
| T-042 | Chia sẻ lịch trình (F-11) | M | T-036 |

## Thiết kế tham chiếu (Stitch)

Thư mục: `docs/stitch/stitch_file_analysis_assistant/`. Chỉ để tham chiếu; dựng lại bằng React + Tailwind theo tokens ở `docs/08` mục D. Bố cục desktop: `docs/08` mục D5.

- **S14** — đăng nhập/đăng ký (mobile; làm khung giữa trang trên desktop): `s14_dangnhap_dangky_mobile`
- **S15** — chuyến đi của tôi: `s15_chuyendicuatoi_desktop`
- **S16** — đã lưu & cài đặt: `s16_daluu_caidat_mobile`
- **S17** — lịch trình được chia sẻ (chỉ đọc): `s17_lichtrinhduochiase_desktop`
- **S12** — chế độ đã lưu: `s12_trinhchinhlichtrinh_desktop`

## Bỏ / không làm khi dựng giao diện

- S15: thanh tiến độ "Đã hoàn thành…" (tính năng theo dõi tiến độ không có trong tài liệu).
- S16/S03: chuông thông báo (không có tính năng thông báo).
- Chia sẻ: token ngẫu nhiên ≥ 128 bit, trang `noindex`, lược bỏ dữ liệu cá nhân.
- S17 và S12 phải dùng tốt trên điện thoại.

Nếu thấy phần giao diện nào khác trong mockup mà không có trong `docs/02-features.md`: **bỏ qua và ghi vào tóm tắt PR**, hoặc hỏi chủ dự án.

## Chủ dự án cần chuẩn bị song song

- Cấu hình Auth trên Supabase (nhà cung cấp Google, URL chuyển hướng, email).

## Cổng kiểm tra cuối phase

Khách → đăng nhập → lưu → chia sẻ link → người khác xem/sao chép; test cách ly dữ liệu xanh.

Khi xong: cập nhật `[ ]` → `[x]` trong `docs/09`, ghi thay đổi (nếu có) vào nhật ký mục 7, và báo cáo: đã làm gì, chưa làm gì, điểm nghi ngờ.

## Prompt dán cho agent

```text
Đọc AGENTS.md ở gốc repo, sau đó đọc docs/phases/phase-4-accounts-share.md và docs/09-roadmap-tasks.md.
Nhiệm vụ: hoàn thành Phase 4 (T-034 → T-042).
- Làm lần lượt từng task chưa xong có đủ phụ thuộc; mỗi task một nhánh và một PR nhỏ.
- Trước mỗi task: đọc các tài liệu ở cột "Tham chiếu" của task đó.
- Giao diện: bám docs/stitch/ nhưng BỎ các mục ở phần "Bỏ / không làm khi dựng giao diện".
- Nếu tài liệu mơ hồ, mâu thuẫn, hoặc cần thứ chủ dự án chưa chuẩn bị: dừng và hỏi.
- Không làm tính năng ngoài danh sách; không làm 3D/bảo tàng số, khẩn cấp/hỗ trợ.
- Cuối mỗi task: chạy typecheck, lint, test; tick [x] trong docs/09; tóm tắt đã làm gì, file nào đổi, điều gì chưa làm.
- Khi xong cả phase (hoặc khi phải dừng giữa chừng): tạo `docs/reports/phase-4-report.md` theo mẫu `docs/reports/_template.md`, kèm đầu ra THẬT của typecheck, lint, test, build. Không ghi đã chạy nếu chưa chạy.
Bắt đầu bằng task đầu tiên chưa hoàn thành của Phase 4.
```
