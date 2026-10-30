# Báo cáo sửa lỗi Phase 4B — Supabase Auth và PlaceCard

> Ngày chạy: 2026-10-30. Làm trên nhánh `fix/T-037-auth-feedback`. Không push, không sửa dữ liệu, không tạo migration. `LLM_ENABLED` không bị thay đổi.

## 1. Tóm tắt

- PlaceCard hiển thị ghi công ảnh dưới dạng văn bản, không còn source link nằm bên trong liên kết toàn thẻ; liên kết nguồn vẫn được giữ trên trang chi tiết.
- Lỗi Supabase Auth được ánh xạ sang thông báo tiếng Việt theo `code`/`error_code`; nội dung không tiết lộ email có tồn tại hay không. Khi `import.meta.env.DEV`, log chỉ có mã lỗi và HTTP status.
- Hướng dẫn Auth development/production được thêm vào README và D-22. Checklist T-052 có bước bật lại xác nhận email và cấu hình SMTP riêng.
- T-037 được để `[ ]` chờ chủ dự án xác nhận đăng ký và đăng nhập trực tiếp trên trình duyệt.

## 2. Task

| Task | Nhánh / commit | Trạng thái | Ghi chú |
|---|---|---|---|
| Sửa lỗi Auth/ghi công của T-037 | `fix/T-037-auth-feedback` / commit cục bộ (hash được báo khi bàn giao) | Đạt về mã và test; chờ xác nhận trình duyệt | Không tự tick T-037 theo yêu cầu. |

## 3. Thay đổi chính

- Thêm `src/features/auth/authError.ts` để map `email_address_not_authorized`, `over_email_send_rate_limit`, `weak_password`, `signup_disabled`, `invalid_credentials`, `email_not_confirmed`, network errors và lỗi chung. Đọc cả `code` lẫn `error_code`.
- Trang đăng ký/đăng nhập dùng thông báo trên và trong DEV chỉ gọi `console.warn` với `{ code, status }`; không log object lỗi đầy đủ, email, mật khẩu hay token.
- PlaceCard bỏ URL nguồn khỏi `ImageCredit`, đồng thời thêm test xác nhận không có selector `a a`. Khung Auth cũng bỏ link ngoài bọc `BrandMark` vốn đã là một liên kết.
- Thêm unit tests cho từng mã lỗi, lỗi mạng, thông báo không chứa email, form `/register` và `/login`, và `next` độc hại quay về đường dẫn nội bộ. Giữ kiểm thử `safeNextPath` hiện có.
- Test `SharedTripPage` trước đó dùng khoảng chờ cố định 20ms, đôi lúc race trong full suite; đổi sang chờ trạng thái query thành công để chạy ổn định.

## 4. Đầu ra thật của lệnh

Các lệnh mặc định trong sandbox ban đầu không khởi động được do `ERR_PNPM_STORE_DIR_OPEN_OPERATION_LOCK` / `Access is denied`. Theo hướng dẫn lỗi môi trường trong AGENTS.md, đã chạy lại ngoài sandbox; các kết quả dưới đây là lần chạy cuối.

| Lệnh | Đầu ra / kết quả |
|---|---|
| `pnpm typecheck` | Exit 0 — `$ tsc --noEmit` |
| `pnpm lint` | Exit 0 — `$ eslint .` |
| `pnpm test -- --reporter=dot` | `Test Files 40 passed (40)`; `Tests 219 passed (219)`; `Duration 18.24s` |
| `pnpm build` | Exit 0 — `✓ 376 modules transformed`; `✓ built in 4.43s` |
| `pnpm exec vitest run src/components/ui/PlaceCard.test.tsx src/features/auth/authError.test.ts src/features/auth/pages/AuthPages.test.tsx src/app/paths.test.ts --reporter=dot` | `Test Files 4 passed (4)`; `Tests 16 passed (16)` |
| `pnpm exec vitest run src/features/share/SharedTripPage.test.tsx --reporter=dot` | `Test Files 1 passed (1)`; `Tests 1 passed (1)` |
| `git diff --check` | Exit 0, không có đầu ra |

Build phát cảnh báo Rollup không diễn giải được annotation trong dependency Zod; build vẫn thành công. Full suite còn các cảnh báo jsdom `window.scrollTo not implemented` từ test wizard, không liên quan thay đổi Auth.

Lần chạy full suite đầu tiên sau khi sửa mã có `Test Files 1 failed | 39 passed (40)` và `Tests 1 failed | 218 passed (219)`: test `SharedTripPage` đọc trạng thái trước khi query hoàn tất do timing race. Test đã được làm deterministic; lần chạy cuối đạt 219/219. Đây là lỗi độ ổn định của test harness, không phải lỗi xác thực hay lỗi ứng dụng.

## 5. Tài liệu và trạng thái nghiệm thu

- README ghi cách tắt **Confirm email** ở Supabase development, thêm đủ hai Redirect URLs `127.0.0.1` và `localhost`, và yêu cầu bật lại cùng SMTP riêng trước launch.
- D-22 được cập nhật với cùng quy tắc; checklist T-052 bổ sung kiểm tra cấu hình Auth production.
- T-037 trong `docs/09-roadmap-tasks.md` đang là `[ ]`. Chỉ chủ dự án tick sau khi tự đăng ký và đăng nhập thành công trong trình duyệt.

## 6. Điểm còn lại / cần chủ dự án

- Thử đăng ký và đăng nhập trên trình duyệt với cấu hình Supabase development đã nêu trong README. Nếu vẫn lỗi, chia sẻ `code` và `status` hiển thị trong console DEV (không gửi email, mật khẩu, token hay khóa).
- Trước khi ra mắt, bật lại Confirm email và cấu hình SMTP riêng đã xác minh.
- Chưa thực hiện bất kỳ request Auth thật nào hoặc thao tác DB trong lượt sửa này.
