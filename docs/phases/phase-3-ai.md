# Phase 3 (M3) — AI thật

> Giao việc cho agent. Đọc `AGENTS.md` trước, rồi làm theo file này. Chi tiết từng task nằm ở `docs/09-roadmap-tasks.md`.

## Mục tiêu

Thêm LLM sinh lịch trình có kiểm tra đầu ra, giới hạn tần suất, cầu chì chi phí; so sánh chất lượng với dự phòng.

## Đọc trước khi làm

- docs/07-ai-itinerary-spec.md (toàn bộ)
- docs/06-api-spec.md (mục 6, 13)
- AGENTS.md mục 6, 8, 9

## Tasks (làm theo thứ tự, mỗi task một PR)

| Task | Tên | Cỡ | Phụ thuộc |
|---|---|---|---|
| T-029 | `LlmClient`, nhà cung cấp và `FakeLlmClient` | M | T-020, **chủ dự án đã chọn nhà cung cấp LLM** |
| T-030 | Prompt, làm sạch `notes`, schema đầu ra | M | T-029 |
| T-031 | Kiểm tra và sửa đầu ra LLM | L | T-030, T-019 |
| T-032 | Tích hợp LLM vào pipeline + công tắc, cầu chì, dự phòng | M | T-031, T-022 |
| T-033 | Đánh giá chất lượng và hiệu chỉnh | M | T-032, **chủ dự án tham gia chấm** |

## Thiết kế tham chiếu (Stitch)

Thư mục: `docs/stitch/stitch_file_analysis_assistant/`. Chỉ để tham chiếu; dựng lại bằng React + Tailwind theo tokens ở `docs/08` mục D. Bố cục desktop: `docs/08` mục D5.

- **S11** — màn đang tạo lịch trình: kiểm tra thông báo khi chuyển sang dự phòng: `s11_dangtaolichtrinh_mobile`

## Bỏ / không làm khi dựng giao diện

- Không có giao diện mới lớn ở phase này.
- LLM chỉ chọn địa điểm từ danh sách server đưa và viết lý do; không tự quyết giờ giấc.
- `LLM_API_KEY` chỉ ở backend.

Nếu thấy phần giao diện nào khác trong mockup mà không có trong `docs/02-features.md`: **bỏ qua và ghi vào tóm tắt PR**, hoặc hỏi chủ dự án.

## Chủ dự án cần chuẩn bị song song

- Chọn nhà cung cấp/model LLM, mở tài khoản, đặt hạn mức chi tiêu và cảnh báo chi phí (T-029 đang chờ bạn).
- Chấm 10 đầu vào mẫu cho LLM vs dự phòng (T-033).
- Kiểm tra giới hạn thời gian chạy của function trên gói Vercel đang dùng.

## Cổng kiểm tra cuối phase

LLM ngang hoặc hơn dự phòng theo chấm của chủ dự án; không có địa điểm bịa; `LLM_ENABLED=false` vẫn chạy.

Khi xong: cập nhật `[ ]` → `[x]` trong `docs/09`, ghi thay đổi (nếu có) vào nhật ký mục 7, và báo cáo: đã làm gì, chưa làm gì, điểm nghi ngờ.

## Prompt dán cho agent

```text
Đọc AGENTS.md ở gốc repo, sau đó đọc docs/phases/phase-3-ai.md và docs/09-roadmap-tasks.md.
Nhiệm vụ: hoàn thành Phase 3 (T-029 → T-033).
- Làm lần lượt từng task chưa xong có đủ phụ thuộc; mỗi task một nhánh và một PR nhỏ.
- Trước mỗi task: đọc các tài liệu ở cột "Tham chiếu" của task đó.
- Giao diện: bám docs/stitch/ nhưng BỎ các mục ở phần "Bỏ / không làm khi dựng giao diện".
- Nếu tài liệu mơ hồ, mâu thuẫn, hoặc cần thứ chủ dự án chưa chuẩn bị: dừng và hỏi.
- Không làm tính năng ngoài danh sách; không làm 3D/bảo tàng số, khẩn cấp/hỗ trợ.
- Cuối mỗi task: chạy typecheck, lint, test; tick [x] trong docs/09; tóm tắt đã làm gì, file nào đổi, điều gì chưa làm.
Bắt đầu bằng task đầu tiên chưa hoàn thành của Phase 3.
```
