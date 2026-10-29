# Báo cáo Phase 3 — AI thật (phạm vi hoàn thành đến T-031)

> Cập nhật 2026-10-29 sau khi chủ dự án chọn Google Gemini. Phase vẫn dừng ở T-029; chưa làm T-032/T-033.

## 1. Tóm tắt

Đã làm T-030/T-031 và triển khai provider Google Gemini Interactions API cùng test HTTP giả. D-10 ghi Google Gemini API và model lấy từ `LLM_MODEL`. `pnpm llm:ping` đã chạy đúng một lần và timeout sau khoảng 12 giây; không có status HTTP hay usage token trả về. T-029 vẫn `[ ]` đến khi ping thành công. T-032/T-033 chưa làm; `LLM_ENABLED=false` giữ nguyên.

## 2. Task đã hoàn thành

| Task | Nhánh / commit cục bộ | Đã đạt "Hoàn thành khi"? | Ghi chú |
|---|---|---|---|
| T-029 | `feat/T-029-gemini-provider` | Một phần | Gemini Interactions API provider, JSON schema, usage, abort/timeout, phân loại HTTP errors và HTTP-mocked tests. Ping thật timeout một lần; giữ `[ ]`. |
| T-030 | `feat/T-030-itinerary-prompt` / `64bba9f` | Có | Prompt phiên bản hóa, schema strict, notes sạch và user-message snapshot. |
| T-031 | `feat/T-031-llm-validation` | Có | V1–V10, coverage, tối đa một lần repair dưới 8 giây, xếp trong slot, test Fake. |

## 3. Task chưa xong hoặc làm một phần

| Task | Còn thiếu gì | Lý do |
|---|---|---|
| T-029 | Cần ping thật thành công để xác nhận khóa, model và JSON structured output | Một lần ping timeout ở 12 giây; chưa biết request có được xử lý phía dịch vụ hay không. Không retry. |
| T-032 | Tích hợp LLM/fallback, cap, generation events, regenerateDay | Phụ thuộc T-031 và credential/provider. |
| T-033 | Đánh giá 10 đầu vào LLM vs fallback | Chưa chạy vì ping provider chưa thành công; tiếp tục theo yêu cầu sau. |

## 4. Kết quả chạy lệnh

Lệnh được chạy ngày 2026-10-29. Ban đầu pnpm trong sandbox bị `ERR_PNPM_STORE_DIR_OPEN_OPERATION_LOCK` / `Access is denied` khi khóa store; đây là lỗi quyền môi trường. Chạy lại ngoài sandbox thành công, không phải lỗi mã.

| Lệnh | Kết quả thật | Ghi chú |
|---|---|---|
| `pnpm install --frozen-lockfile` | Chưa chạy | Không đổi `package.json` hoặc lockfile; quy tắc môi trường trong AGENTS.md yêu cầu bỏ qua install khi lockfile không đổi. |
| `pnpm typecheck` | Đạt | `tsc --noEmit` kết thúc thành công. |
| `pnpm lint` | Đạt | `eslint .` kết thúc thành công. |
| `pnpm test` | Đạt: 32 file, 208 test | Có stderr `Not implemented: Window's scrollTo()` từ các test wizard hiện có; toàn bộ test qua. |
| `pnpm build` | Đạt | Vite build thành công. Rollup báo 2 cảnh báo annotation comment trong dependency Zod; build vẫn thành công. |
| `pnpm smoke:api` | Đạt: 6 PASS, 0 lỗi, 1 SKIP | `meta` 10 tags/3 start points; published 60; category sai 400; map 60; nearby 5 không tự tham chiếu; slug thiếu 404. Draft check SKIP vì không tìm thấy draft. |
| `pnpm exec vitest run server/llm/providers/gemini.test.ts` | Đạt: 9 test | HTTP giả; không có request tới mạng trong test. |
| `pnpm llm:ping` | Thất bại do timeout: `Gemini LLM ping: FAIL; kind=timeout; elapsed_ms=12013; calls=1` | Đã chạy đúng một lần. Không nhận HTTP status hay usage metadata; không thử lại. |
| `pnpm eval:itinerary` (LLM) | Chưa chạy | T-033 chưa làm; ping chưa thành công. Không tạo kết quả eval giả. |

## 5. Cổng kiểm tra cuối phase

- [ ] LLM ngang hoặc hơn fallback theo đánh giá của chủ dự án.
- [x] Không thể dùng địa điểm ngoài candidate set trong validator T-031.
- [ ] `LLM_ENABLED=false` tiếp tục chạy toàn pipeline — T-032 chưa tích hợp.

## 6. Khác biệt so với tài liệu

- T-029 giữ `[ ]` vì ping chưa xác nhận thành công. D-10 hiện chọn Google Gemini API/model từ môi trường.
- T-030 và T-031 được đánh dấu `[x]` trong roadmap.
- Fake mở rộng đủ 11 trường hợp bao gồm `extra_field`, ngoài các lỗi liệt kê rút gọn ở roadmap.
- Provider dùng Gemini Interactions API hiện hành: POST `/v1beta/interactions`, `system_instruction`, `response_format` JSON schema, `generation_config.max_output_tokens`, `x-goog-api-key`; lưu request phía dịch vụ tắt bằng `store=false`. Tài liệu API Interactions hiện hành không công bố `temperature` trong `generation_config`, nên provider không gửi trường đó.
- `pnpm llm:ping` tạo đúng một request thật; không lặp lại sau timeout. Không migration hoặc ghi/xóa dữ liệu Supabase.

## 7. Điểm nghi ngờ, rủi ro, nợ kỹ thuật

- Validator trả trạng thái `accepted/coverage/issues`; pipeline T-032 chưa tiêu thụ kết quả này. Các ngày không thể schedule hoặc thiếu lunch khiến kết quả bị từ chối để pipeline sau này dùng fallback.
- Test smoke không tìm thấy draft để kiểm tra riêng đường 404 draft; đây là SKIP dữ liệu, không phải lỗi API.
- Build hiện có cảnh báo annotation từ Zod; không ảnh hưởng kết quả build.
- Các số p50/p90, tỷ lệ fallback, token và chi phí chỉ có thể đo khi chạy T-032/T-033. Hiện: 1 request LLM thật đã thử; usage metadata không về nên số token và chi phí thực tế chưa xác định. `0` token được báo từ response không đồng nghĩa request chưa được xử lý. p50/p90 và tỷ lệ fallback chưa đo.

## 8. Cần chủ dự án

- Điều tra timeout ping (mạng, model khả dụng, quota) rồi yêu cầu chạy ping lại khi sẵn sàng. Lần trước chỉ có một request và không được retry.
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

`pnpm llm:ping` là công cụ gọi thử thật, đã chạy đúng một lần trong lượt này. Tài liệu tham khảo: [Gemini Interactions API](https://ai.google.dev/api/interactions-api), [structured outputs](https://ai.google.dev/gemini-api/docs/structured-output), [token usage](https://ai.google.dev/gemini-api/docs/generate-content/tokens).
