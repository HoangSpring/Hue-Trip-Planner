# Báo cáo Phase 4B — Tài khoản, lưu và chia sẻ

> Ghi nhận ngày 2026-10-30. Không có thao tác push. Không áp dụng migration mới, không sửa dữ liệu địa điểm; smoke dùng dữ liệu chuyến đi thử và đã dọn.

## 1. Tóm tắt

Đã hoàn tất phần T-036 đến T-042 trên các nhánh task tuần tự. T-042 bổ sung link chia sẻ có token ngẫu nhiên, trang chia sẻ chỉ đọc, sao chép vào tài khoản khác, dialog bật/tắt chia sẻ và kiểm thử cách ly. Migration 10 đã có trên remote trước lượt này; không tạo hay áp dụng migration mới.

Smoke `pnpm smoke:trips` kết thúc 17/17 kiểm tra đạt, bao gồm chia sẻ, sao chép chéo tài khoản, vô hiệu token cũ, cách ly A/B và dọn dữ liệu. Ảnh màn hình S12, S14–S17 chưa được chụp trong lượt này.

## 2. Task đã hoàn thành

| Task | Nhánh / commit | Đã đạt “Hoàn thành khi”? | Ghi chú |
|---|---|---|---|
| T-034 | `feat/T-034-trip-rpcs` / `e3547f3` (đã tích hợp vào main) | Có | Migration 10 đã được chủ dự án áp dụng; xác nhận local/remote và smoke. |
| T-035 | `feat/T-035-trips-api` / `ed20ff6` (đã tích hợp vào main) | Có | API chuyến đi và cách ly RLS. |
| T-036 | `feat/T-036-saved-trip-editor` / `318606b02b20995461f93d4eecc80491fa756577` | Có | Chế độ đã lưu, tự lưu và xử lý xung đột. |
| T-037 | `feat/T-037-auth-pages` / `69d222b3c106342ca9a6e6861b21468b97b1ff3e` | Có | Luồng đăng nhập email; Google không nằm trong phạm vi triển khai này. |
| T-038 | `feat/T-038-draft-sync` / `59496f447d3d86486903f0c2ae4363c0bb010218` | Có | Đồng bộ nháp và pending action sau đăng nhập. |
| T-039 | `feat/T-039-account` / `831f8da5e6dca37797c8e4344ed8a11ef17756e3` | Có | Danh sách chuyến đi và cài đặt tài khoản. |
| T-040 | `feat/T-040-saved-places` / `a0bc787` | Có | API và UI địa điểm đã lưu. |
| T-041 | `feat/T-041-add-place-to-trip` / `ccbd693` | Có | Thêm địa điểm từ trang chi tiết vào chuyến đi. |
| T-042 | `feat/T-042-trip-sharing` / commit cục bộ (hash được báo khi bàn giao) | Có | Smoke thật 17/17; chưa push. |

## 3. Task chưa xong hoặc làm một phần

| Task/phần | Còn thiếu gì | Lý do |
|---|---|---|
| Ảnh giao diện S12, S14, S15, S16, S17 tại 1440px và 390px | Chưa lưu ảnh vào `docs/reports/phase-4b-screens/` | Chưa chạy phiên chụp trình duyệt có trạng thái đăng nhập và dữ liệu chuyến đi phù hợp trong lượt này. |
| Open Graph cho link chia sẻ | Chưa có endpoint HTML bot riêng | Không nằm trong các đầu việc T-042 ở lượt triển khai này; tài liệu API có nhắc endpoint OG như một mục riêng. |

## 4. Kết quả chạy lệnh

Kết quả dưới đây lấy từ lần chạy cuối sau khi sửa middleware route và các test tương ứng. Không chạy lại cài dependency vì không thay đổi manifest/lockfile trong phần T-042.

| Lệnh | Kết quả thật | Ghi chú |
|---|---|---|
| `pnpm typecheck` | Exit 0 — `$ tsc --noEmit` | Đạt. |
| `pnpm lint` | Exit 0 — `$ eslint .` | Đạt. |
| `pnpm test -- --reporter=dot` | `Test Files 38 passed (38)`; `Tests 208 passed (208)`; duration `36.48s` | Có cảnh báo jsdom `window.scrollTo not implemented` và cảnh báo anchor lồng nhau trong test router/login; không làm test thất bại. |
| `pnpm build` | Exit 0; `✓ 375 modules transformed`; `✓ built in 6.85s` | Có cảnh báo Rollup annotation từ dependency Zod. |
| `pnpm smoke:api` | 7 đạt, 0 lỗi, 0 bỏ qua | API công khai, nearby và 404 draft đã được kiểm tra trên DB thật. |
| `pnpm smoke:trips` (đầu ra do chủ dự án cung cấp trước lượt này) | 11 đạt, 0 lỗi, 0 bỏ qua | Cổng Phase 4A: lưu, đọc, PUT lặp, conflict, duplicate, cách ly A/B và cleanup. |
| `pnpm smoke:trips` (sau khi thêm kiểm tra chia sẻ) | 17 đạt, 0 lỗi, 0 bỏ qua | Bao gồm migration 10 remote, Auth A/B, saved-place idempotency, chia sẻ/copy, token cũ bị vô hiệu, cách ly và dọn dữ liệu. |
| `git diff --check` | Exit 0, không có đầu ra | Không có whitespace error. |
| Bundle scan biến secret | `Bundle secret-variable-name scan: no matches.` | Chỉ quét tên biến trong `dist/assets`; không đọc/in giá trị bí mật. |

Smoke phát cảnh báo Node `[DEP0190]` do kiểm tra migration dùng tiến trình con với `shell: true`; toàn bộ kiểm tra vẫn đạt. Đây là cảnh báo deprecation, không phải lỗi mã làm smoke thất bại.

## 5. Cổng kiểm tra cuối phase

- [x] Khách có thể đăng nhập, lưu chuyến đi, chia sẻ link, người khác xem/sao chép.
- [x] Kiểm thử cách ly dữ liệu giữa hai người dùng đạt; user B nhận 404 khi thử đọc/sửa/xóa trip của A.
- [ ] Ảnh kiểm tra S12, S14–S17 ở desktop/mobile được lưu trong báo cáo.
- [x] Dữ liệu thử do smoke tạo đã được dọn; không thay đổi dữ liệu địa điểm.

## 6. Khác biệt so với tài liệu

- Các router con trước đây gắn middleware auth/cache cho mọi đường dẫn con, khiến endpoint chia sẻ công khai bị 401 khi mount. Đã giới hạn middleware theo route riêng tư; các route chia sẻ công khai giữ đúng quyền truy cập và bộ nhớ đệm quy định.
- `GET /api/shared/:token` trả đúng projection đã nêu ở API spec, bỏ trip ID, client draft ID, input/notes, share token, thông tin chủ sở hữu và ID ngày/mục. Có `Cache-Control: no-store`, `X-Robots-Tag: noindex` và giới hạn dò token bằng HMAC.
- Bật lại chia sẻ sinh token mới; token cũ không còn đọc được. Sao chép tạo chuyến đi riêng của người nhận.
- Không thêm các mục mockup ngoài phạm vi. Chưa triển khai endpoint Open Graph riêng.

## 7. Điểm nghi ngờ, rủi ro, nợ kỹ thuật

- Bộ giới hạn dò token được giữ trong bộ nhớ tiến trình; trên môi trường nhiều instance, hạn mức không chia sẻ giữa instance.
- Chưa có ảnh chụp để xác nhận trực quan các bố cục S12/S14–S17 ở hai kích thước yêu cầu.
- Test suite có cảnh báo môi trường jsdom và cảnh báo cấu trúc anchor; cần xử lý riêng nếu muốn log test sạch hoàn toàn.

## 8. Cần chủ dự án

- Xem nhánh `feat/T-042-trip-sharing` và tự push/merge theo quy trình của dự án.
- Nếu cần preview card mạng xã hội cho URL chia sẻ, triển khai endpoint Open Graph ở task tương ứng.

## 9. Cách chạy thử

```powershell
pnpm dev
pnpm dev:api
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm smoke:api
pnpm smoke:trips
```

`pnpm smoke:trips` dùng Supabase Auth và API cục bộ, cần cấu hình tài khoản thử trong `.env.local` cùng migration 10 đã được áp dụng. Script không in khóa, mật khẩu hoặc token và dọn trip thử khi hoàn tất.
