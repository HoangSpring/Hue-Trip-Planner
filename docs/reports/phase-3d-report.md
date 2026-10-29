# Báo cáo Phase 3D — telemetry và eval V3

> Ngày: 2026-10-29. Nhánh: `fix/T-020-032-day-scoped-validation`. Không push. Không in/sửa `.env.local`; `LLM_ENABLED` được giữ false.

## 1. Tóm tắt

- Migration `20261029000009` đã hiện diện ở cả local và remote; `pnpm db:types` sinh kiểu từ schema remote thành công.
- Eval V3 bắt đầu sau sửa V9 theo ngày. Đã phát 11 lời gọi LLM; dừng khi tỷ lệ fallback vượt ngưỡng 10% (3/11 = 27,3%). Không gọi đối kháng thứ hai, không retry.
- 8/11 kết quả được chấp nhận là LLM. Input/output/thinking tokens: 48.103/8.166/0; p50/p90: 3.542/4.289 ms.
- Một service fake request và một request thật qua `app.request` đều trả 200 fallback; request thật ghi đúng một hàng telemetry và không xóa hàng nào.
- T-033 chưa đạt; chủ dự án chưa chấm và eval V3 chưa đủ 12 trường hợp.

## 2. Task

| Task | Trạng thái | Ghi chú |
|---|---|---|
| T-032 | Đạt | Migration telemetry đã được áp dụng remote theo xác nhận và `migration list`; DB types được sinh lại; request thật xác nhận cột mới. |
| T-033 | Một phần | V3 dừng ở 11/12 theo điều kiện fallback ≥10%; chưa có diagnostics V3 đầy đủ và chưa có đánh giá của chủ dự án. |

## 3. Migration và kiểu Supabase

`pnpm exec supabase migration list` trả các migration `20261024000001`–`20261024000008` và `20261029000009`, với local và remote giống nhau. CLI báo `Migrations listed`.

`pnpm db:types` exit 0, gọi `supabase gen types typescript --linked --schema public > src/types/supabase.ts`. Kiểu DB sinh ra có sáu cột telemetry nullable trong `Row`, `Insert`, `Update`: `prompt_version`, `pool_size`, `repairs`, `coverage`, `fallback_reason`, `thinking_tokens`. So với bản sửa tay, không có chênh lệch schema/cột; diff chỉ sắp xếp lại thứ tự và thụt lề trong các kiểu.

## 4. Eval LLM V3

Lệnh chạy đúng một lần: `pnpm eval:itinerary -- --llm`. Stdout thật theo từng request:

```text
v1: llm; 3540ms; HTTP/error=success; tokens=4292/728/0
v2: llm; 2432ms; HTTP/error=success; tokens=1898/349/0
v3: llm; 3686ms; HTTP/error=success; tokens=3929/850/0
v4: fallback; 5065ms; HTTP/error=success; tokens=7636/1409/0
v5: llm; 2320ms; HTTP/error=success; tokens=2310/289/0
v6: fallback; 4138ms; HTTP/error=success; tokens=6204/997/0
v7: llm; 3542ms; HTTP/error=success; tokens=2744/580/0
v8: llm; 3128ms; HTTP/error=success; tokens=2726/566/0
v9: fallback; 3218ms; HTTP/error=success; tokens=5833/715/0
v10: llm; 3914ms; HTTP/error=success; tokens=6219/993/0
adversarial-1: llm; 4289ms; HTTP/error=success; tokens=4312/690/0
```

Đã gọi 11 lần, tổng token 56.269 (input 48.103, output 8.166, thinking 0). Fallback 3/11 = 27,3%; được chấp nhận 8/11; p50 3.542 ms, p90 4.289 ms. V3 không tương đương bộ 12: đối kháng 2 chưa chạy.

So sánh V2 → V3 (V3 là mẫu một phần): tỷ lệ fallback 58,3% → 27,3%; accepted 5/12 → 8/11; p50/p90 3.838/5.713 → 3.542/4.289 ms; token trung bình input/output/thinking 4.171/708/0 → 4.373/742/0. V3 không có số đo đáng tin về ngày thay, repairs hay coverage.

### Chẩn đoán các case fallback

V4, V6 và V9 là ba case fallback theo stdout. Process bị dừng trước khi script ghi diagnostics cuối; stdout chỉ có nhãn fallback, thời gian và token. Vì vậy coverage, mã V1–V10, ngày bị thay, ID địa điểm, giờ và quãng đường **không được lưu cho V3**. Không gán nguyên nhân V2 cho lần chạy mới.

| Case V3 | Phân loại bằng chứng | Ghi chú / hướng xử lý |
|---|---|---|
| V4 | Chưa xác định được giữa lỗi LLM, validate, dữ liệu hay mã | V2 cùng case có V5 (bổ sung mục), V3 (ID trùng) và V9 (không xếp giờ), nhưng đó là dữ liệu lịch sử, không chứng minh V3. Chưa nới kiểm tra ID hoặc reason; cần rerun chỉ khi được cấp ngân sách và cải thiện ghi diagnostics. |
| V6 | Chưa xác định được | V2 cùng case có V9 ở ngày 2 và 3; chưa thể xác nhận V3 có cùng nguyên nhân. Kiểm tra giờ/closed_days và khoảng cách theo từng ID trước khi đổi scheduler. |
| V9 | Chưa xác định được | V2 cùng case có V5 và V10 ở ngày 2. Dữ liệu lịch sử có 53/60 place thiếu open hoặc close time; đây là rủi ro chất lượng dữ liệu, không đủ để kết luận nguyên nhân V3. |

Không có bằng chứng từ stdout V3 cho ID ngoài pool, thiếu ngày, thiếu bữa trưa, reason có URL/HTML, giờ cụ thể hay quãng đường cụ thể. Không sửa validate để nới an toàn. Đề xuất theo nhóm: (a) prompt/LLM chỉ khi diagnostics cho thấy vi phạm cụ thể; (b) không nới V2/V8, xem xét V9 chỉ sau khi biết candidate và điều kiện bị loại; (c) chủ dự án xác minh giờ/closed_days/meal_type từ nguồn được phép; (d) sửa lỗi harness đã phát hiện: trước đây eval chỉ ghi file khi kết thúc bình thường. Harness hiện checkpoint sau mỗi case; chưa rerun.

Tệp [eval V3](../eval/2026-10-29-llm-vs-fallback-v3.md) ghi rõ đây là kết quả một phần và các giới hạn diagnostics.

## 5. Kiểm tra generation_events

Đã xác nhận trước khi chạy request thật rằng cờ runtime là `LLM_ENABLED=false`, `TELEMETRY_COLUMNS=true` (không in giá trị từ `.env.local`).

- Request bằng `app.request` với service giả: PASS, HTTP 200, `generated_by=fallback`, fake store thu 1 event.
- Request bằng `app.request` tới app thật: PASS, HTTP 200, `generated_by=fallback`, `fallback_reason=llm_disabled`.
- DB telemetry mới: `prompt_version=hue-itinerary-v2-compact`, `pool_size=12`, `repairs=0`, `coverage=null`, `thinking_tokens=0`.
- Đã ghi đúng **1 hàng generation_events** cho request thật; không xóa hàng nào. Coverage null là giá trị pipeline không tính khi tắt LLM. Không ghi notes.
- Lần chạy đầu của helper dừng trước request thật vì module env được import trước khi helper nạp `.env.local`; không có DB write ở lần đó. Sửa thứ tự import và chạy thành công một lần. Helper tạm thời đã được xóa.

## 6. Kết quả lệnh thật

Các lệnh pnpm ban đầu bị sandbox chặn bởi `ERR_PNPM_STORE_DIR_OPEN_OPERATION_LOCK`/Access denied. Chạy lại ngoài sandbox theo `AGENTS.md`; đây là lỗi quyền môi trường, không phải lỗi mã. Không chạy install vì manifest/lockfile không đổi.

| Lệnh | Kết quả |
|---|---|
| `pnpm exec supabase migration list` | Exit 0; local/remote đều có migration 1–9, gồm `20261029000009`. |
| `pnpm db:types` | Exit 0; sinh `src/types/supabase.ts` từ linked remote schema. |
| `pnpm typecheck` | Exit 0 — `$ tsc --noEmit`. |
| `pnpm lint` | Exit 0 — `$ eslint .`. |
| `pnpm test` | Exit 0 — 34 test files, 250 tests passed. Có stderr `Window.scrollTo()` chưa được implement trong wizard tests. |
| `pnpm build` | Exit 0 — Vite 6.4.1; 356 modules. Hai cảnh báo annotation `@__PURE__` từ Zod; build hoàn tất. |
| `pnpm smoke:api` | Exit 0 — 6 PASS, 0 lỗi, 1 SKIP (không có slug draft trong DB). Có 60 published, nearby 5. |
| `pnpm eval:itinerary -- --llm` | Bị interrupt có chủ đích sau 11 calls vì fallback 3/11 ≥10%; không phải lỗi API hoặc lỗi mã của itinerary. Không có summary cuối từ script cũ. |
| `app.request` service fake | PASS — HTTP 200, một event trong fake store. |
| `app.request` thật | PASS — HTTP 200; một hàng telemetry được chèn, không có LLM call. |

## 7. Khác biệt và điểm còn lại

- V3 đo được tỷ lệ fallback thấp hơn V2 nhưng vẫn là 27,3%, trên ngưỡng dừng. Chỉ 11/12 case; không gọi thêm.
- Eval harness đã được sửa để checkpoint sau mỗi case, nhưng hiện tại không có diagnostics chi tiết cho V3 vì lần chạy bị dừng trước khi sửa harness này.
- Không thay đổi quy tắc validator, không migration mới, không bật LLM, không thay đổi dữ liệu địa điểm.
- `src/types/supabase.ts` là output `db:types`; khác biệt so với bản sửa tay chỉ là thứ tự/format.
- T-033 chưa đạt; chủ dự án cần quyết định có cấp thêm lượt eval sau khi xem dữ liệu và chấm bảng hay không.

## 8. Cần chủ dự án

1. Xem `docs/eval/2026-10-29-llm-vs-fallback-v3.md`; các chi tiết V1–V10 cho ba case fallback V3 không còn trong output, không thể suy đoán an toàn.
2. Chấm bảng thủ công và quyết định có cấp ngân sách mới để chạy eval đầy đủ với checkpoint hay không.
3. Xác minh dữ liệu giờ mở/đóng, ngày nghỉ và meal_type nếu các diagnostics lần sau quy nguyên nhân cho dữ liệu.

## 9. Cách kiểm tra lại

```powershell
pnpm exec supabase migration list
pnpm db:types
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm smoke:api
```

Không chạy lại `pnpm eval:itinerary -- --llm` trong lượt này; sẽ phát sinh thêm LLM calls.
