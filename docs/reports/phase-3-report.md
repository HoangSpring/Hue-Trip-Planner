# Báo cáo Phase 3 — AI thật (phạm vi hoàn thành đến T-031)

> Ngày 2026-10-29. Đây là báo cáo dừng giữa phase theo yêu cầu: chưa cấu hình provider và chưa gọi LLM thật.

## 1. Tóm tắt

Đã làm T-030 và T-031; T-029 mới hoàn thành interface trung lập và FakeLlmClient với 11 kịch bản. Provider thật chưa thể viết/chạy vì D-10 yêu cầu chủ dự án chọn nhà cung cấp/model, và `.env.local` không có `LLM_API_KEY` hoặc `LLM_MODEL` (chỉ kiểm tra có/không, không đọc/in giá trị). T-032/T-033 chưa làm. Không có lần gọi LLM thật, không phát sinh token/chi phí LLM.

## 2. Task đã hoàn thành

| Task | Nhánh / commit cục bộ | Đã đạt "Hoàn thành khi"? | Ghi chú |
|---|---|---|---|
| T-029 | `feat/T-029-llm-client` / `7b02b10` | Một phần | Interface, usage contract, timeout fake và 11 kịch bản đã có; provider thật và gọi thử đang chờ lựa chọn D-10 + credentials. Giữ `[ ]`. |
| T-030 | `feat/T-030-itinerary-prompt` / `64bba9f` | Có | Prompt phiên bản hóa, schema strict, notes sạch và user-message snapshot. |
| T-031 | `feat/T-031-llm-validation` | Có | V1–V10, coverage, tối đa một lần repair dưới 8 giây, xếp trong slot, test Fake. |

## 3. Task chưa xong hoặc làm một phần

| Task | Còn thiếu gì | Lý do |
|---|---|---|
| T-029 | Provider thật và gọi thử có AbortSignal | D-10 ghi rõ cần chủ dự án chọn provider/model; `LLM_API_KEY` và `LLM_MODEL` đều chưa có. |
| T-032 | Tích hợp LLM/fallback, cap, generation events, regenerateDay | Phụ thuộc T-031 và credential/provider. |
| T-033 | Đánh giá 10 đầu vào LLM vs fallback | Chưa có provider/credential; không gọi LLM thật. |

## 4. Kết quả chạy lệnh

Lệnh được chạy ngày 2026-10-29. Ban đầu pnpm trong sandbox bị `ERR_PNPM_STORE_DIR_OPEN_OPERATION_LOCK` / `Access is denied` khi khóa store; đây là lỗi quyền môi trường. Chạy lại ngoài sandbox thành công, không phải lỗi mã.

| Lệnh | Kết quả thật | Ghi chú |
|---|---|---|
| `pnpm install --frozen-lockfile` | Chưa chạy | Không đổi `package.json` hoặc lockfile; quy tắc môi trường trong AGENTS.md yêu cầu bỏ qua install khi lockfile không đổi. |
| `pnpm typecheck` | Đạt | `tsc --noEmit` kết thúc thành công. |
| `pnpm lint` | Đạt | `eslint .` kết thúc thành công. |
| `pnpm test` | Đạt: 31 file, 199 test | Có stderr `Not implemented: Window's scrollTo()` từ các test wizard hiện có; toàn bộ test qua. |
| `pnpm build` | Đạt | Vite build thành công. Rollup báo 2 cảnh báo annotation comment trong dependency Zod; build vẫn thành công. |
| `pnpm smoke:api` | Đạt: 6 PASS, 0 lỗi, 1 SKIP | `meta` 10 tags/3 start points; published 60; category sai 400; map 60; nearby 5 không tự tham chiếu; slug thiếu 404. Draft check SKIP vì không tìm thấy draft. |
| `pnpm eval:itinerary` (LLM) | Chưa chạy | T-033 chưa làm; thiếu provider/credentials. Không tạo kết quả eval giả. |

## 5. Cổng kiểm tra cuối phase

- [ ] LLM ngang hoặc hơn fallback theo đánh giá của chủ dự án.
- [x] Không thể dùng địa điểm ngoài candidate set trong validator T-031.
- [ ] `LLM_ENABLED=false` tiếp tục chạy toàn pipeline — T-032 chưa tích hợp.

## 6. Khác biệt so với tài liệu

- T-029 giữ `[ ]`; roadmap ghi chú rõ phần interface/Fake đã có và phần provider đang chờ quyết định D-10 cùng cấu hình môi trường.
- T-030 và T-031 được đánh dấu `[x]` trong roadmap.
- Fake mở rộng đủ 11 trường hợp bao gồm `extra_field`, ngoài các lỗi liệt kê rút gọn ở roadmap.
- Không tạo provider mặc định vì quyết định D-10 vẫn là “Chưa chọn”. Không gọi mạng LLM hoặc sửa dữ liệu Supabase.

## 7. Điểm nghi ngờ, rủi ro, nợ kỹ thuật

- Validator trả trạng thái `accepted/coverage/issues`; pipeline T-032 chưa tiêu thụ kết quả này. Các ngày không thể schedule hoặc thiếu lunch khiến kết quả bị từ chối để pipeline sau này dùng fallback.
- Test smoke không tìm thấy draft để kiểm tra riêng đường 404 draft; đây là SKIP dữ liệu, không phải lỗi API.
- Build hiện có cảnh báo annotation từ Zod; không ảnh hưởng kết quả build.
- Các số p50/p90, tỷ lệ fallback, token và chi phí chỉ có thể đo khi chạy T-032/T-033. Hiện: LLM thật 0 lần; input/output tokens 0/0; chi phí ước tính 0; p50/p90 và tỷ lệ fallback chưa đo.

## 8. Cần chủ dự án

- Chọn nhà cung cấp/model LLM theo D-10.
- Cấu hình `LLM_API_KEY` và `LLM_MODEL` trong `.env.local` (không gửi secret trong chat).
- Bảng chấm `docs/eval/2026-10-27-fallback-v2.md` vẫn để trống; vui lòng chấm trước hoặc song song với T-033.

## 9. Cách chạy thử

```powershell
pnpm exec vitest run server/llm/fake.test.ts server/itinerary/prompt.test.ts server/itinerary/validate.test.ts
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm smoke:api
```

Không có endpoint gọi LLM ở phạm vi này; chưa có thao tác chạy provider thật.
