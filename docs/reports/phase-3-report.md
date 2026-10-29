# Báo cáo Phase 3 — AI thật (phạm vi hoàn thành đến T-031)

> Cập nhật 2026-10-29 sau khi chủ dự án chọn Google Gemini. T-029 đạt sau ping thật; chưa làm T-032/T-033.

## 1. Tóm tắt

Đã làm T-030/T-031 và provider Google Gemini Interactions API. Provider đặt `thinking_level=low`, không gửi `temperature`, dành 3500 output tokens (bao gồm thinking), phân loại timeout/auth/quota/quota-zero/model-not-found/bad-request/network/bad-JSON, và trả usage input/output/thinking cùng HTTP status. D-10 ghi model hiện cấu hình và đã thử thành công là `gemini-3.5-flash-lite`. Lần ping cũ timeout ở 12 giây; lần chạy được chủ dự án cho phép sau đó thành công: ping nhỏ + mẫu cỡ thật 40 ứng viên/2 ngày, tổng 2 calls và 10,172 token phản hồi. T-029 đạt; T-032/T-033 chưa làm; `LLM_ENABLED=false` giữ nguyên.

## 2. Task đã hoàn thành

| Task | Nhánh / commit cục bộ | Đã đạt "Hoàn thành khi"? | Ghi chú |
|---|---|---|---|
| T-029 | `fix/T-029-gemini-thinking` | Có | Provider Gemini, thinking thấp, schema, usage; HTTP mock tests; ping thật + mẫu 40 ứng viên/2 ngày thành công. |
| T-030 | `feat/T-030-itinerary-prompt` / `64bba9f` | Có | Prompt phiên bản hóa, schema strict, notes sạch và user-message snapshot. |
| T-031 | `feat/T-031-llm-validation` | Có | V1–V10, coverage, tối đa một lần repair dưới 8 giây, xếp trong slot, test Fake. |

## 3. Task chưa xong hoặc làm một phần

| Task | Còn thiếu gì | Lý do |
|---|---|---|
| T-029 | — | Hoàn thành theo tiêu chí ping/schema; ping timeout cũ vẫn được tính vào tổng số calls. |
| T-032 | Tích hợp LLM/fallback, cap, generation events, regenerateDay | Phụ thuộc T-031 và credential/provider. |
| T-033 | Đánh giá 10 đầu vào LLM vs fallback | Chưa chạy vì ping provider chưa thành công; tiếp tục theo yêu cầu sau. |

## 4. Kết quả chạy lệnh

Lệnh được chạy ngày 2026-10-29. Ban đầu pnpm trong sandbox bị `ERR_PNPM_STORE_DIR_OPEN_OPERATION_LOCK` / `Access is denied` khi khóa store; chạy lại ngoài sandbox thành công, đây là lỗi quyền môi trường chứ không phải lỗi mã.

| Lệnh | Kết quả thật | Ghi chú |
|---|---|---|
| `pnpm install --frozen-lockfile` | Chưa chạy | Không đổi `package.json` hoặc lockfile; quy tắc môi trường trong AGENTS.md yêu cầu bỏ qua install khi lockfile không đổi. |
| `pnpm typecheck` | Đạt | Đầu ra: `$ tsc --noEmit` (exit 0). |
| `pnpm lint` | Đạt | Đầu ra: `$ eslint .` (exit 0). |
| `pnpm test` | Đạt: 32 file, 213 test | 32 test files passed; 213 tests passed. Có stderr `Not implemented: Window's scrollTo()` từ wizard tests; toàn bộ test qua. |
| `pnpm build` | Đạt | Vite build thành công. Rollup báo 2 cảnh báo annotation comment trong dependency Zod; build vẫn thành công. |
| `pnpm smoke:api` | Đạt: 6 PASS, 0 lỗi, 1 SKIP | `meta` 10 tags/3 start points; published 60; category sai 400; map 60; nearby 5 không tự tham chiếu; slug thiếu 404. Draft check SKIP vì không tìm thấy draft. |
| `pnpm exec vitest run server/llm/providers/gemini.test.ts server/llm/fake.test.ts` | Đạt: 25 test | 2 file; 25 tests passed; HTTP giả, không có request mạng trong test. |
| `pnpm llm:ping` (lần cũ) | Thất bại: timeout khoảng 12 giây | Không nhận HTTP status/usage. Tính là 1 lần gọi thật; không retry tự động. |
| `pnpm llm:ping` (lần được phép tiếp theo) | Đạt; 2 calls | `model=gemini-3.5-flash-lite`; ping: 1597 ms, HTTP 200, schema PASS, input=30/output=14/thinking=0/total=44. Mẫu cỡ thật: 40 candidates, 2 ngày, 2830 ms, HTTP 200, schema PASS, candidate IDs PASS; input=9444/output=684/thinking=0/total=10128. Tổng lượt này 10,172 tokens. Không in khóa. |
| `pnpm eval:itinerary` (LLM so với fallback) | Chưa chạy | T-033 chưa làm; không tạo kết quả đánh giá giả. |

## 5. Cổng kiểm tra cuối phase

- [ ] LLM ngang hoặc hơn fallback theo đánh giá của chủ dự án.
- [x] Không thể dùng địa điểm ngoài candidate set trong validator T-031.
- [ ] `LLM_ENABLED=false` tiếp tục chạy toàn pipeline — T-032 chưa tích hợp.

## 6. Khác biệt so với tài liệu

- T-029 được tick `[x]` sau ping/schema thành công. D-10 hiện chọn Google Gemini API và model `gemini-3.5-flash-lite` đã thử thành công.
- T-030 và T-031 được đánh dấu `[x]` trong roadmap.
- Fake mở rộng đủ 11 trường hợp bao gồm `extra_field`, ngoài các lỗi liệt kê rút gọn ở roadmap.
- Provider dùng Gemini Interactions API hiện hành: POST `/v1beta/interactions`, `system_instruction`, `response_format` JSON schema, `generation_config.max_output_tokens`, `generation_config.thinking_level=low`, `x-goog-api-key`; lưu request phía dịch vụ tắt bằng `store=false`. Không gửi `temperature`.
- `pnpm llm:ping` mặc định timeout 40 giây, hỗ trợ `--timeout=<ms>` và `--model=<name>`. Ping thành công sẽ gửi thêm một mẫu cỡ thật; không tự retry 429. Lần chạy mới thực hiện 2 calls. Không migration hoặc ghi/xóa dữ liệu Supabase.

## 7. Điểm nghi ngờ, rủi ro, nợ kỹ thuật

- Validator trả trạng thái `accepted/coverage/issues`; pipeline T-032 chưa tiêu thụ kết quả này. Các ngày không thể schedule hoặc thiếu lunch khiến kết quả bị từ chối để pipeline sau này dùng fallback.
- Test smoke không tìm thấy draft để kiểm tra riêng đường 404 draft; đây là SKIP dữ liệu, không phải lỗi API.
- Build hiện có cảnh báo annotation từ Zod; không ảnh hưởng kết quả build.
- Tổng phase đến nay có 3 calls LLM thật: 1 lần timeout trước đó và 2 lần ở ping mới. Token usage trả về của các thành công là 10,172 (input 9,474; output 698; thinking 0); lần timeout không trả usage nên token/chi phí của nó không xác định. p50/p90 và tỷ lệ fallback chưa đo vì T-032/T-033 chưa làm.
- Mẫu 40 ứng viên dùng các fixture hiện có, không truy cập Supabase. Không bật LLM cho người dùng và không ghi dữ liệu.

## 8. Cần chủ dự án

- Gói Free chỉ dùng với dữ liệu giả/dev theo D-10; cần bật billing trước khi phục vụ người dùng thật.
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

`pnpm llm:ping` là công cụ gọi thật; lần chạy thành công dùng 2 calls. Tài liệu chính thức đã đối chiếu: [Gemini Interactions API](https://ai.google.dev/api/interactions-api), [Gemini thinking levels và token nghĩ](https://ai.google.dev/gemini-api/docs/thinking/), [Gemini 3.8 Flash capabilities](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash), [billing và Free tier](https://ai.google.dev/gemini-api/docs/billing), [structured outputs](https://ai.google.dev/gemini-api/docs/structured-output).
