# Báo cáo Phase 3C — T-020, T-032, T-033 eval

> Ngày: 2026-10-29. Nhánh: `fix/T-020-032-day-scoped-validation`. Không push. `.env.local` không được in hoặc sửa; `LLM_ENABLED` giữ nguyên `false`.

## 1. Tóm tắt

- Đã khôi phục T-020 sau eval đọc thật: 0/10 kịch bản thiếu trưa, 0 ngày dưới sàn; `TOO_FAR` warning 0. Bữa trưa được khóa ở slot noon, đặt trước và giữ riêng theo ngày; có bước cứu R1 sau các slot khác.
- T-032 đã chuyển validator sang sửa theo ngày, giữ các ngày lành, thay ngày lỗi bằng thuật toán dự phòng, đo số ngày thay và trả thông tin repairs trong response. Có test Fake cho ngày thiếu và ngày không xếp được.
- Đã tạo migration telemetry nhưng **chưa áp dụng**. Cột mới chỉ được gửi khi `TELEMETRY_COLUMNS=true`; giá trị mặc định false giữ tương thích với schema DB hiện tại.
- Đã chạy đúng 12 calls LLM thật, không retry. Lần đo ghi 7/12 toàn fallback (58,3%); cao hơn mục tiêu dưới 10%. Không gọi thêm vì đã hết ngân sách cho eval LLM trong lượt này.
- T-033 vẫn `[ ]`, chờ chủ dự án chấm chất lượng và chọn mặc định.

## 2. Task

| Task | Trạng thái | Bằng chứng / lý do |
|---|---|---|
| T-020 | Đạt `[x]` | Eval fallback thật V2: 0 ngày thiếu trưa và 0 ngày dưới sàn; 47 test itinerary và property tests qua. |
| T-032 | Đạt `[x]` | Sửa theo ngày, test invariant Fake, response có `repairs`/`replacedDayIndexes`; telemetry schema cũ/mới được test độc lập. Migration mới chưa áp dụng và cờ vẫn false. |
| T-033 | Chưa đạt `[ ]` | Eval V2 có 12 calls thật và bảng chấm, nhưng chủ dự án chưa chấm/chọn mặc định; 58,3% toàn fallback chưa đạt mục tiêu <10%. |

## 3. Thay đổi

- `server/itinerary/fallback.ts`, `scheduler.ts`: khóa request bữa trưa ở `noon`; fallback thử từng food chưa dùng và cho phép R1 vượt giới hạn R6 khi cứu trưa; chẩn đoán từng quán food theo từng ngày trong `--explain`.
- `server/itinerary/validate.ts`, `pipeline.ts`: sửa lịch theo ngày, điền/trim và sửa slot/giờ/quãng đường trong ngày; thay riêng ngày không sửa được; giữ các ngày tốt; chỉ toàn fallback nếu coverage <0.7 hoặc số ngày không sửa được đạt ngưỡng ít nhất một nửa chuyến đi. ID ngoài nhóm đã gửi luôn bị loại.
- `shared/schemas/trip.ts`: response generate có `repairs`, `replacedDayIndexes` (mặc định tương thích với response cũ khi parse).
- `server/itinerary/generationStore.ts`, `server/lib/env.ts`, `.env.example`: cờ tương thích telemetry. Thêm `generationStore.test.ts` cho schema legacy và schema mở rộng.
- Migration mới: `supabase/migrations/20261029000009_generation_events_telemetry.sql`; chỉ chứa sáu cột nullable yêu cầu. Cập nhật bảng `generation_events` ở `docs/05-data-model.md` và kiểu `src/types/supabase.ts` thủ công; **không chạy `db:types`** vì migration chưa áp dụng.
- `scripts/evalItinerary.ts`, `scripts/evalItineraryLlm.ts`: diagnostics từng quán lunch; bảng lỗi V1–V10, coverage, số ngày lỗi/thay, p50/p90, token và bảng so sánh. Eval LLM không ghi DB.
- `docs/eval/2026-10-29-fallback-v2.md`, `docs/eval/2026-10-29-llm-vs-fallback-v2.md`, roadmap và báo cáo này.

## 4. Kết quả lệnh thật

Các lệnh pnpm ban đầu bị chặn bởi `ERR_PNPM_STORE_DIR_OPEN_OPERATION_LOCK` / Access denied ở pnpm store. Chạy lại ngoài sandbox thành công theo hướng dẫn mục “Lỗi môi trường” trong `AGENTS.md`; đây là lỗi quyền môi trường, không phải lỗi mã. Không chạy `pnpm install` vì package manifest và lockfile không đổi.

| Lệnh | Kết quả thật |
|---|---|
| `pnpm typecheck` | Exit 0 — `$ tsc --noEmit` |
| `pnpm lint` | Exit 0 — `$ eslint .` |
| `pnpm test` | Exit 0 — 34 test files passed, 250 tests passed. Test tự động chỉ dùng Fake/HTTP giả; không gọi LLM thật. Có stderr test môi trường `Window.scrollTo()` chưa triển khai trong một số wizard test. |
| `pnpm build` | Exit 0 — Vite 6.4.1, 356 modules transformed. Có 2 cảnh báo annotation `@__PURE__` từ dependency Zod; build hoàn tất. |
| `pnpm smoke:api` | Exit 0 — 6 PASS, 0 lỗi, 1 SKIP. Meta 10 tags/3 startPoints; 60 published; map 60; nearby 5; lỗi category 400; slug không tồn tại 404. Draft slug SKIP vì DB không có draft. |
| `pnpm eval:itinerary -- --explain` | Exit 0; đọc 60 published qua Supabase anon, không ghi DB. `Dữ liệu: 60 published, 60 đủ điều kiện, 0 bị loại vì dữ liệu bắt buộc.` `So sánh V1 → V2: thiếu trưa 11 → 0; dưới sàn 12 → 0; cảnh báo 80 → 86.` 17 food lunch-eligible; 53 địa điểm thiếu một trong open/close time (không bị loại). |
| `pnpm eval:itinerary -- --llm` | Exit 0; 12/12 calls, không retry; 10 mẫu + 2 đối kháng; chỉ đọc Supabase. Token input 50,054, output 8,496, thinking 0, tổng 58,550. p50 3,838 ms; p90 5,713 ms; accepted LLM 5/12; full fallback 7/12 (58.3%). Chi tiết thật ở eval V2. |

### Đánh giá fallback theo 10 kịch bản

| Kịch bản | Ngày | Thiếu trưa | Dưới sàn | Cảnh báo TOO_FAR |
|---|---:|---:|---:|---:|
| V1 — Cặp đôi, 2 ngày | 2 | 0 | 0 | 0 |
| V2 — Gia đình có trẻ nhỏ, 1 ngày | 1 | 0 | 0 | 0 |
| V3 — Người lớn tuổi, 3 ngày | 3 | 0 | 0 | 0 |
| V4 — Nhóm bạn, 4 ngày | 4 | 0 | 0 | 0 |
| V5 — Một mình, 1 ngày | 1 | 0 | 0 | 0 |
| V6 — Cặp đôi, 3 ngày | 3 | 0 | 0 | 0 |
| V7 — Gia đình, 2 ngày | 2 | 0 | 0 | 0 |
| V8 — Người lớn tuổi, 2 ngày | 2 | 0 | 0 | 0 |
| V9 — Nhóm bạn, 2 ngày | 2 | 0 | 0 | 0 |
| V10 — Một mình, 3 ngày | 3 | 0 | 0 | 0 |
| **Tổng** | **23** | **0** | **0** | **0** |

Root cause T-020: scheduler được phép đổi slot của quán khỏi `noon` do `best_time`; quá trình gán trưa cho ngày bị ràng buộc thêm bởi khoảng cách R6 và route. Bản sửa khóa slot lunch và cho phép cứu R1 vượt R6, sau đó chạy lại 10 kịch bản: V4 ngày 4 có Quán Hến Bà Cam ở noon; không còn `LUNCH_MISSING`. `--explain` hiện nêu từng quán food chưa dùng, phân biệt đã dùng ngày trước, đóng ngày, ngoài bán kính, hoặc scheduler loại.

Eval LLM V2 phát hiện `V9 unschedulable` là nguyên nhân thường kích hoạt whole fallback; thao tác `V5 filled/trimmed` có số lần xuất hiện theo từng mục cao nhất. Tuy nhiên, lượt eval thật chạy **trước** vòng sửa V9 theo ngày cuối cùng, do giới hạn 12 calls đã dùng hết. Vì vậy số liệu 58.3%/p50/p90/token là benchmark thật của bản chạy trước lần sửa cuối V9, không được xem là đo hiệu quả bản vá cuối. Bảng theo case và các mã kích hoạt có trong `docs/eval/2026-10-29-llm-vs-fallback-v2.md`.

## 5. Trạng thái migration và telemetry

- File migration được tạo nhưng chưa áp dụng; không chạy migration, không ghi hoặc xóa dữ liệu địa điểm.
- `TELEMETRY_COLUMNS` mặc định `false`. Khi false, INSERT chỉ dùng các cột legacy hiện có. Khi chủ dự án áp dụng migration, có thể đặt `TELEMETRY_COLUMNS=true` để ghi `prompt_version`, `pool_size`, `repairs`, `coverage`, `fallback_reason`, `thinking_tokens`.
- Kiểu Supabase được sửa tay theo yêu cầu; không khẳng định đây là kết quả `db:types`.

## 6. Khác biệt, điểm còn lại

- Mục tiêu eval LLM toàn fallback dưới 10% chưa đạt: đo thật còn 58.3%. Không tiếp tục gọi LLM vì đã chạm 12 calls được phép; code validator V9 cuối chưa có benchmark thật mới.
- Các thao tác V5/V8 có thể sinh nhiều issue trên một ngày; số issue không đồng nghĩa số kịch bản bị từ chối. 7/12 là tỷ lệ whole fallback.
- Smoke không kiểm tra được slug draft do không có draft trong DB.
- Migration chỉ được tạo để chủ dự án xem; không đặt `TELEMETRY_COLUMNS=true` trước khi migration được áp dụng.
- `docs/eval/2026-10-29-llm-vs-fallback-v2.md` chưa được chủ dự án chấm. T-033 chưa tick.
- Không làm T-034 trở đi; không bật `LLM_ENABLED`; không thay đổi `.env.local`.

## 7. Cần chủ dự án

1. Xem xét file migration `20261029000009_generation_events_telemetry.sql`; tự quyết định thời điểm áp dụng.
2. Chấm bảng trong eval LLM V2, chọn mặc định LLM hay fallback, và quyết định có cần eval LLM mới sau vòng sửa V9 không.
3. Chỉ bật `TELEMETRY_COLUMNS=true` sau khi migration telemetry đã áp dụng. Giữ `LLM_ENABLED=false` như hiện tại.

## 8. Kiểm tra lại

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm smoke:api
pnpm eval:itinerary -- --explain
```

`pnpm eval:itinerary -- --llm` gọi API thật và cần ngân sách/phê duyệt riêng; lượt này đã dùng đủ 12 calls nên không chạy lại.
