# Báo cáo Phase 3b — T-032/T-033

> Ngày chạy: 2026-10-29. Không push. T-032 commit nằm trên nhánh phụ thuộc; T-033 đang ở nhánh hiện tại.

## 1. Tóm tắt

Đã tích hợp LLM → V1–V10 validator → thuật toán dự phòng cho generate và regenerateDay; LLM_ENABLED vẫn false. Đã chạy 10 mẫu + 2 ghi chú đối kháng với Gemini, đúng 12 calls tối đa, chỉ đọc địa điểm published. p50 3,612 ms, p90 6,890 ms; pipeline trả kết quả LLM ở 5/12 trường hợp và fallback ở 7/12. Chưa tick T-032 vì schema DB không lưu thinking_tokens và metadata pipeline; T-033 chờ chủ dự án chấm và quyết định mặc định.

## 2. Task đã hoàn thành

| Task | Nhánh / commit cục bộ | Đã đạt "Hoàn thành khi"? | Ghi chú |
|---|---|---|---|
| T-032 | feat/T-032-llm-pipeline / 4c2f50b | Một phần | Pipeline, công tắc, cap, fallback, regenerateDay, mock/property/API tests hoàn tất. Chưa tick vì generation_events thiếu cột cho thinking token và metadata; không tạo migration theo yêu cầu. |
| T-033 | feat/T-033-llm-evaluation / xem hash ở trạng thái git | Một phần | Báo cáo so sánh thật có 12 calls và bảng chấm trống; chưa đạt vì chủ dự án chưa chấm/chọn mặc định. |

## 3. Task chưa xong hoặc làm một phần

| Task | Còn thiếu gì | Lý do |
|---|---|---|
| T-020 (được yêu cầu bỏ qua) | Bữa trưa/chất lượng fallback chưa được xác nhận lại | Không sửa trong lượt này theo chỉ dẫn mới nhất; vẫn [ ] trong roadmap. |
| T-032 | Lưu thinking_tokens, PROMPT_VERSION, poolSize, repairs, coverage, fallbackReason vào generation_events | Migration bị cấm. Bản ghi hiện lưu status, generated_by, model, input/output tokens, duration, error_code; telemetry ứng dụng chỉ ghi số liệu tổng hợp an toàn, không ghi notes/prompt/output. |
| T-033 | Chủ dự án chấm lịch trình và quyết định mặc định LLM hay fallback | Bảng chấm còn trống theo yêu cầu. |

## 4. Kết quả chạy lệnh

PnPM ban đầu gặp ERR_PNPM_STORE_DIR_OPEN_OPERATION_LOCK / Access is denied khi truy cập store trong sandbox. Chạy lại ngoài sandbox thành công; đây là lỗi quyền môi trường, không phải lỗi mã. Không chạy pnpm install: package manifest và lockfile không đổi.

| Lệnh | Kết quả thật | Ghi chú |
|---|---|---|
| pnpm typecheck | Đạt — $ tsc --noEmit, exit 0 | Chạy ngoài sandbox. |
| pnpm lint | Đạt — $ eslint ., exit 0 | Chạy ngoài sandbox. |
| pnpm test | Đạt — 33 files, 245 tests | Lần chạy đầu có 6 lỗi validator vì fixture test vẫn gửi khóa prompt cũ; cập nhật fixture sang hợp đồng khóa ngắn và chạy lại: 33/33 files, 245/245 tests passed. Có stderr Window.scrollTo() từ test wizard. |
| pnpm build | Đạt — Vite 6.4.1, 356 modules | Có 2 cảnh báo Rollup annotation trong Zod; build exit 0. |
| pnpm smoke:api | 6 PASS, 0 lỗi, 1 SKIP | meta: 10 tags/3 start points; places: 60 published; map: 60; nearby: 5 và không tự tham chiếu; slug thiếu 404. Draft check SKIP vì không có draft. |
| pnpm exec vitest run server/itinerary/pipeline.test.ts server/routes/generateTrip.test.ts server/routes/regenerateDay.test.ts server/itinerary/prompt.test.ts | 4 files, 46 tests passed | Fake LLM, không gọi mạng thật. |
| pnpm eval:itinerary -- --llm | Thành công, 12/12 calls | Đọc 60 địa điểm published và start point qua anon client; không ghi generation_events, không chạy migration, không thay LLM_ENABLED. Đầu ra thật ở docs/eval/2026-10-29-llm-vs-fallback.md. |

Đầu ra rút gọn eval (thời gian ms; token input/output/thinking):

| Kịch bản | Kết quả pipeline | Thời gian | Token input/output/thinking |
|---|---|---:|---:|
| v1 | fallback | 3612 | 4292/721/0 |
| v2 | llm | 3133 | 1898/366/0 |
| v3 | llm | 6890 | 3929/863/0 |
| v4 | fallback | 5962 | 7636/1407/0 |
| v5 | llm | 4216 | 2310/289/0 |
| v6 | fallback | 6119 | 6204/1067/0 |
| v7 | fallback | 2926 | 2744/547/0 |
| v8 | fallback | 5087 | 2726/709/0 |
| v9 | fallback | 8137 | 5833/724/0 |
| v10 | llm | 3612 | 6219/986/0 |
| adversarial-1 | fallback | 3196 | 4312/564/0 |
| adversarial-2 | llm | 2766 | 1951/354/0 |

## 5. Cổng kiểm tra cuối phase

- [ ] LLM ngang hoặc hơn fallback theo chấm của chủ dự án; chưa chấm.
- [x] Validator chỉ chấp nhận placeId thuộc candidate pool được gửi, và pipeline hydrate từ published records.
- [x] LLM_ENABLED=false vẫn chạy bằng fallback; có test API.

## 6. Khác biệt so với tài liệu

- Prompt rút gọn thành khóa ngắn, bỏ trường rỗng, giới hạn summary 120 ký tự, tọa độ 4 chữ số; PROMPT_VERSION=hue-itinerary-v2-compact.
- Đo từ eval: 50,054 input tokens / 351 ứng viên gửi = 142.6 input tokens/ứng viên trung bình, gồm cả prompt cố định. Mốc trước là khoảng 236 token/ứng viên (9,444/40); hai phép đo đều tính prompt cố định nên chỉ để so sánh gần đúng.
- HTTP thành công ở cả 12 lần; validator/fallback chấp nhận kết quả LLM ở 5 trường hợp. 7 kết quả fallback do coverage thấp hoặc vi phạm bộ quy tắc; chi tiết từng trường hợp ở eval.
- Migration 5 hiện chỉ có input_tokens, output_tokens, duration_ms, error_code; không có thinking_tokens hoặc cột metadata pipeline. Vì không được migration, thinking token/metadata chỉ có trong telemetry ứng dụng tổng hợp an toàn. T-032 chưa tick.
- T-020 được bỏ qua theo yêu cầu mới nhất, không sửa và vẫn [ ].

## 7. Điểm nghi ngờ, rủi ro, nợ kỹ thuật

- 7/12 lần dùng fallback (58.3%); chưa thể kết luận chất lượng cho tới khi chủ dự án chấm. Một số lý do tự nhiên nhưng chưa được kiểm chứng độc lập về dữ kiện; eval có heuristic sơ bộ, không thay thế người duyệt.
- Input 50,054; output 8,597; thinking 0; tổng 58,651 token trong lượt đánh giá. Trung bình mỗi call: 4,171 input, 716 output, 0 thinking token.
- p50 3,612 ms; p90 6,890 ms trên 12 pipeline calls. Eval dùng một call mỗi tình huống, không repair/retry.
- Từ phase trước có 3 calls thật (2 thành công, một timeout không có usage). Cộng lượt này là 15 calls thật; usage đã biết là 68,823 tokens. Usage của timeout cũ không được nhà cung cấp trả về.
- Không ước tính chi phí vì không đối chiếu bảng giá Google hiện hành trong lượt này.
- generation_events chưa lưu riêng thinking token và metadata; cần migration được chủ dự án cho phép hoặc chấp nhận giữ chúng trong application telemetry.
- Smoke API SKIP kiểm tra slug draft vì DB không có draft phù hợp.

## 8. Cần chủ dự án

- Chấm các bảng trong docs/eval/2026-10-29-llm-vs-fallback.md, rồi chọn chính sách mặc định LLM hay fallback.
- Quyết định sau này có cho phép migration bổ sung cột telemetry cho generation_events hay giữ telemetry đó ở log ứng dụng.
- T-020 vẫn cần được xử lý/duyệt riêng; lượt này cố ý không làm lại.

## 9. Cách chạy thử

Các lệnh:

- pnpm typecheck
- pnpm lint
- pnpm test
- pnpm build
- pnpm smoke:api
- pnpm eval:itinerary -- --llm

eval:itinerary --llm gọi Gemini thật (tối đa 12 calls), chỉ đọc dữ liệu địa điểm và cần khóa/model cùng cấu hình Supabase. Không in secret. LLM_ENABLED trong .env.local vẫn false.
