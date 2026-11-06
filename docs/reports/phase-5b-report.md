# Báo cáo Phase 5B — Giao diện quản trị địa điểm và import CSV

> Ngày: 2026-11-06. Không push. Không chạy migration và không ghi/xóa dữ liệu địa điểm trong lượt này. Không in thông tin trong `.env.local`.

## 1. Tóm tắt

- T-044: đã làm UI danh sách, lọc, bulk, form tạo/sửa, ghim bản đồ kéo được, tải ảnh Storage, ghi công, xác nhận duyệt và lịch sử audit. Giữ `[ ]` vì chưa xác minh trên trình duyệt rằng địa điểm vừa xuất bản xuất hiện ở `/explore`.
- T-045: hoàn thành giao diện import CSV ba bước, dùng API preview/commit hiện có, tải CSV mẫu và tải CSV dòng lỗi.
- UI admin nằm sau `RequireAdmin`; API vẫn dùng `requireAdmin`. Ảnh chỉ nhận HTTPS, và thiếu tác giả/giấy phép thì schema chặn lưu.
- Hai nhánh và commit cục bộ: T-044 `feat/T-044-admin-places-ui` / `65f0c703a6b67026f4efc1108dd9b3fd81dabcf4`; T-045 `feat/T-045-admin-import-ui` / sẽ được ghi ở commit bàn giao. Không push.

## 2. Task

| Task | Trạng thái | Ghi chú |
|---|---|---|
| T-044 | Một phần — giữ `[ ]` | UI và test đã có. Cần kiểm tra thủ công một địa điểm mới xuất bản hiện ở `/explore`; chưa thực hiện ghi địa điểm thật để xác minh. |
| T-045 | Đạt — `[x]` | Ba bước upload/preview/commit, cờ ghi đè mặc định tắt, phân loại kết quả và tải CSV lỗi; test UI và service đã có. |

## 3. Thay đổi

- `/admin/places`: bộ lọc trạng thái, duyệt, loại, từ khóa, trường thiếu; bảng có ghi công ảnh, chọn nhiều, kết quả bulk theo từng dòng và phân trang.
- `/admin/places/new` và `/admin/places/:id`: form nhóm theo nội dung, vị trí, giờ/chi phí, tag và trọng số, ảnh/ghi công, nguồn; ghim có thể kéo trong `MapView`; cảnh báo giờ, bữa trưa, tọa độ và khoảng cách; lưu nháp, xuất bản, duyệt có xác nhận; audit read-only.
- Thêm `GET /api/admin/places/:id/audit`, bảo vệ bằng middleware admin, trả tối đa 50 sự kiện mới nhất. Service role chỉ dùng sau kiểm tra quyền.
- `/admin/import`: chọn/kéo CSV, tải file mẫu, xem trước dòng và tóm tắt, bật ghi đè verified bằng lựa chọn riêng, commit gửi lại CSV, báo kết quả và tải CSV lỗi.
- Các trang admin đặt `noindex, nofollow`. Không thêm thống kê, dashboard hay migration.
- Không làm thư viện ảnh phụ `place_images`.

## 4. Đầu ra lệnh thật

Lần chạy đầu `pnpm typecheck`/`git add` bị `ERR_PNPM_STORE_DIR_OPEN_OPERATION_LOCK` hoặc `Permission denied` khi truy cập lock ngoài workspace. Đã chạy lại lệnh cần thiết ngoài sandbox; đó là lỗi quyền môi trường theo AGENTS.md, không phải lỗi mã.

| Lệnh | Đầu ra |
|---|---|
| `pnpm typecheck` | `$ tsc --noEmit` — exit 0. |
| `pnpm lint` | `$ eslint .` — exit 0. |
| `pnpm test -- --reporter=dot` | `Test Files 51 passed (51)`; `Tests 315 passed (315)`; exit 0. Có cảnh báo test wizard hiện hữu `Window.scrollTo() not implemented`. |
| `pnpm build` | Vite 6.4.1; `✓ 385 modules transformed`; `✓ built in 5.57s`; exit 0. Có cảnh báo annotation `@__PURE__` trong Zod dependency. Admin pages được tách chunk riêng. |
| `pnpm smoke:api` | 7 đạt, 0 lỗi, 0 bỏ qua; meta 10 tag/3 start points, 55 published, map 55, nearby=5, lỗi category 400, slug/draft 404. Exit 0. Đây là kiểm tra chỉ đọc. |
| `pnpm smoke:admin` | **Đầu ra do chủ dự án cung cấp**, không chạy lại: 8 đạt, 0 lỗi, 0 bỏ qua. Migration 11–12 hiện diện local/remote; Auth admin/user đạt; user thường 403; tạo draft và chặn publish thiếu ảnh; preview/commit ba dòng import nguyên tử; dọn sạch còn 0 dòng `zz-test-*`. |
| `pnpm install` | Không chạy; không thay `package.json` hoặc lockfile. |
| `pnpm smoke:trips` | Không chạy trong Phase 5B. |
| `pnpm db:migrate` | Không chạy. |

## 5. Kiểm thử và xác minh còn thiếu

- Test mới: cảnh báo form (bữa trưa/khung trưa, thiếu giờ, ngoài vùng, xa ga), URL ảnh HTTPS và tác giả/giấy phép, định dạng/kích thước ảnh, luồng giao diện import preview → commit → báo kết quả.
- Test sẵn có tiếp tục xác nhận guard admin/user/guest, kết quả bulk từng dòng, import và giữ nguyên địa điểm verified khi không bật ghi đè.
- Chưa chụp S18–S20. Chưa kiểm tra trực quan thủ công ở 1440, 1024 và 768 px; bố cục dùng bảng cuộn ngang trên màn hẹp và form/nav responsive.
- Chưa chạy UI với phiên admin thật; `smoke:admin` do chủ dự án gửi kiểm tra API, không kiểm tra trình duyệt.

## 6. Khác biệt so với tài liệu

- Bổ sung endpoint read-only `GET /api/admin/places/:id/audit` vì API trước đó chưa có điểm tải lịch sử cần cho form. Endpoint không làm thay đổi schema.
- T-044 chưa tick hoàn tất vì smoke hiện tại chưa chứng minh địa điểm vừa xuất bản xuất hiện trong `/explore`. Không ghi dữ liệu thật để tự tạo bằng chứng.
- T-045 đã tick theo tiêu chí giao diện/API, các test verified và đầu ra smoke admin do chủ dự án cung cấp.

## 7. Điểm nghi ngờ, nợ kỹ thuật

- Cần trình duyệt thật xác nhận ảnh Storage, thao tác kéo ghim Leaflet và cập nhật danh sách public sau khi xuất bản.
- API preview/commit được gọi bằng JWT admin, commit dùng RPC migration 13 như đã triển khai; migration không bị chỉnh sửa hay áp dụng trong task này.
- Không có ảnh phụ/thư viện nhiều ảnh.

## 8. Cần chủ dự án

- Mở nhánh `feat/T-044-admin-places-ui` trên trình duyệt: tạo địa điểm đủ ảnh/ghi công, xuất bản và xác nhận xuất hiện ở `/explore`; khi đạt mới tick T-044.
- Thử UI import với CSV staging trên môi trường bạn kiểm soát. Smoke admin đã dọn sạch dữ liệu `zz-test-*` theo đầu ra bạn gửi.

## 9. Cách chạy thử

1. `pnpm dev:api` và `pnpm dev`.
2. Đăng nhập tài khoản admin đã được cấp role.
3. Mở `/admin/places`, `/admin/places/new` hoặc `/admin/import`.
4. Chạy kiểm tra: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.

