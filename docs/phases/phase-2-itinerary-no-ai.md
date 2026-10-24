# Phase 2 (M2) — Lịch trình không cần AI

> Giao việc cho agent. Đọc `AGENTS.md` trước, rồi làm theo file này. Chi tiết từng task nằm ở `docs/09-roadmap-tasks.md`.

## Mục tiêu

Khách đi trọn luồng Landing → Wizard → Lịch trình → Chỉnh sửa bằng thuật toán dự phòng, không cần AI, không cần đăng nhập.

## Đọc trước khi làm

- docs/07-ai-itinerary-spec.md (toàn bộ, trừ phần LLM)
- docs/02-features.md (F-05 → F-07)
- docs/03-user-flows.md (FL-01, FL-04)
- docs/06-api-spec.md (mục 6)
- docs/05-data-model.md (mục 7)

## Tasks (làm theo thứ tự, mỗi task một PR)

| Task | Tên | Cỡ | Phụ thuộc |
|---|---|---|---|
| T-018 | Pipeline phần dữ liệu: ứng viên, chấm điểm, nhóm ứng viên | M | T-009, T-012 |
| T-019 | Bộ xếp giờ (scheduler) | M | T-009, T-018 |
| T-020 | Thuật toán dự phòng + lý do mẫu | L | T-018, T-019 |
| T-021 | Hàm cảnh báo và `computeWarnings` | S | T-009 |
| T-022 | API `POST /api/trips/generate` (chạy dự phòng) + giới hạn tần suất | M | T-020, T-021, T-005 |
| T-023 | Wizard `/plan/new` (F-05) | L | T-007, T-013 (cho `/api/meta`), T-004 |
| T-024 | Màn hình `/plan/generating` và lưu nháp cục bộ | M | T-022, T-023 |
| T-025 | Trình xem lịch trình (chế độ nháp) | L | T-017, T-024, T-021 |
| T-026 | Chỉnh sửa lịch trình (cục bộ) | L | T-025 |
| T-027 | API gợi ý thay thế + sheet Thay thế/Thêm | M | T-018, T-026 |
| T-028 | Tạo lại một ngày (dự phòng) | M | T-020, T-026 |

## Thiết kế tham chiếu (Stitch)

Thư mục: `docs/stitch/stitch_file_analysis_assistant/`. Chỉ để tham chiếu; dựng lại bằng React + Tailwind theo tokens ở `docs/08` mục D. Bố cục desktop: `docs/08` mục D5.

- **S05–S10** — wizard 6 bước (S07 có bản desktop, còn lại là mobile: dùng chung khung wizard giữa trang ~720px): `s05_buoc1_thoigian_mobile`, `s06_buoc2_nguoidi_mobile`, `s07_buoc3_sothich_desktop`, `s08_buoc4_phongcach_mobile`, `s09_buoc5_xuatphat_mobile`, `s10_buoc6_xacnhan_mobile`
- **S11** — đang tạo lịch trình: `s11_dangtaolichtrinh_mobile`
- **S12** — trình chỉnh lịch trình (màn quan trọng nhất): `s12_trinhchinhlichtrinh_desktop`
- **S13** — bottom sheet Thay thế/Thêm; trên desktop làm `SidePanel`: `s13_bottom_sheet_thaythe_mobile`

## Bỏ / không làm khi dựng giao diện

- S12: nút "+ Thêm ngày" (MVP không đổi số ngày sau khi tạo, xem `docs/06` mục 7.4).
- S12: nút "Xuất file PDF" (F-24, giai đoạn 2).
- S12: thẻ "Thời tiết Huế hôm nay" (F-21, giai đoạn 2).
- S12: nút "Chỉ đường Google Maps" và nhãn "Giờ cao điểm": chỉ làm nếu có trong `docs/02`; nếu không thì hỏi chủ dự án.
- Lý do ghé từng nơi trong bản dự phòng đến từ mẫu câu (`reasons.ts`), không gọi LLM ở phase này.
- Kéo thả trên desktop, nhưng phải có nút lên/xuống trên mobile.

Nếu thấy phần giao diện nào khác trong mockup mà không có trong `docs/02-features.md`: **bỏ qua và ghi vào tóm tắt PR**, hoặc hỏi chủ dự án.

## Chủ dự án cần chuẩn bị song song

- Chạy bộ 10 đầu vào mẫu (`docs/07` mục 17.4) và chấm chất lượng thuật toán dự phòng.
- Nhờ người am hiểu Huế xem lại ngưỡng/tốc độ di chuyển ở `docs/07`.

## Cổng kiểm tra cuối phase

Cổng M2 trong `docs/09`: khách đi trọn luồng không cần AI/đăng nhập. Đây là mốc đầu tiên cho người thật dùng thử.

Khi xong: cập nhật `[ ]` → `[x]` trong `docs/09`, ghi thay đổi (nếu có) vào nhật ký mục 7, và báo cáo: đã làm gì, chưa làm gì, điểm nghi ngờ.

## Prompt dán cho agent

```text
Đọc AGENTS.md ở gốc repo, sau đó đọc docs/phases/phase-2-itinerary-no-ai.md và docs/09-roadmap-tasks.md.
Nhiệm vụ: hoàn thành Phase 2 (T-018 → T-028).
- Làm lần lượt từng task chưa xong có đủ phụ thuộc; mỗi task một nhánh và một PR nhỏ.
- Trước mỗi task: đọc các tài liệu ở cột "Tham chiếu" của task đó.
- Giao diện: bám docs/stitch/ nhưng BỎ các mục ở phần "Bỏ / không làm khi dựng giao diện".
- Nếu tài liệu mơ hồ, mâu thuẫn, hoặc cần thứ chủ dự án chưa chuẩn bị: dừng và hỏi.
- Không làm tính năng ngoài danh sách; không làm 3D/bảo tàng số, khẩn cấp/hỗ trợ.
- Cuối mỗi task: chạy typecheck, lint, test; tick [x] trong docs/09; tóm tắt đã làm gì, file nào đổi, điều gì chưa làm.
- Khi xong cả phase (hoặc khi phải dừng giữa chừng): tạo `docs/reports/phase-2-report.md` theo mẫu `docs/reports/_template.md`, kèm đầu ra THẬT của typecheck, lint, test, build. Không ghi đã chạy nếu chưa chạy.
Bắt đầu bằng task đầu tiên chưa hoàn thành của Phase 2.
```
