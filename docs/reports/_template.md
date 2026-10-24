# Báo cáo Phase N — <tên phase>

> Agent điền file này khi xong phase (hoặc khi phải dừng giữa chừng) và lưu thành `docs/reports/phase-N-report.md`.
> Chủ dự án gửi file này (cùng mã nguồn hoặc đường dẫn PR) để kiểm tra phase đã đạt chưa.
> **Chỉ ghi điều có thật.** Không ghi "đã chạy" nếu chưa chạy; dán đầu ra lệnh thật.

## 1. Tóm tắt (3–5 dòng)

## 2. Task đã hoàn thành

| Task | Nhánh / PR / commit | Đã đạt "Hoàn thành khi"? | Ghi chú |
|---|---|---|---|
| T-xxx | | Có / Một phần / Không | |

## 3. Task chưa xong hoặc làm một phần

| Task | Còn thiếu gì | Lý do (thiếu thông tin, phụ thuộc, lỗi...) |
|---|---|---|

## 4. Kết quả chạy lệnh (dán đầu ra rút gọn, kèm ngày giờ)

| Lệnh | Kết quả | Ghi chú |
|---|---|---|
| `pnpm install` | | |
| `pnpm typecheck` | | |
| `pnpm lint` | | |
| `pnpm test` | (số test qua/tổng) | |
| `pnpm build` | | |
| Lệnh khác theo phase (ví dụ test RLS, `pnpm db:migrate`) | | |

## 5. Cổng kiểm tra cuối phase

Chép các mục "Cổng kiểm tra cuối phase" của file phase và đánh dấu từng mục:

- [ ] ...

## 6. Khác biệt so với tài liệu

Chỗ nào đã làm khác `docs/` (và vì sao); tài liệu nào đã cập nhật.

## 7. Điểm nghi ngờ, rủi ro, nợ kỹ thuật

## 8. Cần chủ dự án

Việc chủ dự án phải làm hoặc quyết định (khóa, tài khoản, nội dung...).

## 9. Cách chạy thử

Các bước để chủ dự án tự kiểm tra (lệnh, địa chỉ, tài khoản thử nếu có).
