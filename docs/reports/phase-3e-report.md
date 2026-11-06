# Báo cáo Phase 3E — chẩn đoán eval hai lượt

> Ngày: 2026-10-29. Nhánh: `fix/T-020-032-day-scoped-validation`. Commit được tạo sau khi hoàn tất báo cáo. Không push. Không in giá trị trong `.env.local`; `LLM_ENABLED` giữ nguyên `false`.

## 1. Tóm tắt

- Chạy đủ hai lượt A/B, cùng 12 đầu vào, tổng cộng 24 lời gọi Gemini thật; không retry. Eval chỉ đọc 60 địa điểm published, không ghi generation_events hay dữ liệu nào lên Supabase.
- Toàn fallback: A 6/12 (50,0%), B 5/12 (41,7%), gộp 11/24 (45,8%); 13/24 kết quả được nhận từ LLM. Mục tiêu dưới 10% chưa đạt.
- Eval chỉ ra lỗi mã: sau khi scheduler loại một candidate/slot, vòng sửa lại có thể chọn đúng cặp đó lần nữa, tạo lặp V5/V6/V9 và đẩy hết ngân sách sửa. Đã thêm loại trừ cặp bị từ chối và test hồi quy sau hai lượt; không chạy lại LLM vì giới hạn 26 call đã dùng 24.
- Chi tiết từng input, issue V1–V10, ID/tên, giờ, pool, lịch trình cuối cạnh dự phòng, cờ an toàn, và checkpoint nằm trong [eval V4 Markdown](../eval/2026-10-29-llm-vs-fallback-v4.md) và [eval V4 JSON](../eval/2026-10-29-llm-vs-fallback-v4.json).

## 2. Task

| Task | Trạng thái | Ghi chú |
|---|---|---|
| T-033 eval chẩn đoán | Một phần | Đủ 24/24 call và diagnostics. Chưa đạt mục tiêu fallback <10%; chủ dự án chưa chấm. Không tick T-033. |
| Lỗi validator loại (d) | Đã sửa, kiểm tra tự động | Ghi nhận và loại cặp candidate/slot đã bị scheduler từ chối khỏi các vòng fill sau. |

## 3. Chạy eval thật

Hai lần gọi lệnh `pnpm eval:itinerary -- --llm`, lần thứ nhất tạo lượt A, lần thứ hai tạo lượt B. Mỗi kịch bản có một request, không retry; checkpoint Markdown và JSON được ghi sau từng case. Kết quả cuối: A 12/12, B 12/12; tổng calls 24. Lệnh không ghi database.

| Chỉ số | Lượt A | Lượt B | Gộp |
|---|---:|---:|---:|
| Calls | 12 | 12 | 24 |
| Toàn fallback | 6/12 (50,0%) | 5/12 (41,7%) | 11/24 (45,8%) |
| LLM được nhận | 6/12 | 7/12 | 13/24 |
| Ngày dùng dự phòng | 16 | 13 | 29; TB 1,21 ngày/case |
| Repairs | 198 | 152 | 350 |
| Coverage trung bình | 1,000 | 1,000 | 1,000 |
| p50 / p90 | 3747 / 5293 ms | 3911 / 6266 ms | 3875 / 6266 ms |
| Token input / output / thinking | 50054 / 8180 / 0 | 50054 / 8663 / 0 | 100108 / 16843 / 0 |
| Token trung bình mỗi call | 4171 / 682 / 0 | 4171 / 722 / 0 | 4171 / 702 / 0 |

Đây là số liệu **trước** sửa vòng lặp validator. Không đại diện cho hiệu quả sau sửa.

### Vấn đề từng lượt và phân loại

Các trường hợp toàn fallback (các mã lặp trong vòng repair đã được giữ nguyên trong artifact để chẩn đoán):

| Lượt / case | Mã nổi bật | Chẩn đoán bằng chứng | Phân loại |
|---|---|---|---|
| A / v1 | V5, V6, V9 | Ngày 2 lặp `Bánh Khoái Lạc Thiện` (`64878d1b-5fef-49f6-bdd3-0207b689757c`) ở noon; best_time afternoon/evening; thiếu open/close. Pool ghi 5 quán lunch, tất cả thiếu giờ. Scheduler từ chối rồi fill lại cùng ID/slot. | (a) LLM đề xuất slot không hợp best_time; (c) dữ liệu thiếu giờ; (d) vòng fill lặp cùng candidate/slot. |
| A / v4 | V3, V5, V6, V9 | Trùng/thiếu slot trong lịch nhiều ngày; diagnostics có lặp scheduler rejection. Một số địa điểm xa/giờ thiếu khiến không thể chứng minh đúng nguyên nhân chỉ từ dữ liệu hiện có. | (a)+(b?)+ (c)+(d); chưa kết luận validate quá chặt khi dữ liệu đường/giờ không đầy đủ. |
| A / v6 | V5, V6, V9 | Các ngày bị loại ở bước xếp lịch/giờ; diagnostics cho thấy ứng viên thiếu giờ hoặc slot không khớp. | (b) có thể là ràng buộc slot; (c) thiếu giờ; (d) lặp candidate-slot nếu issue trùng. |
| A / v8 | V5, V9 | `Phá Tam Giang` bị đưa vào buổi tối trong khi dữ liệu giờ là 07:30–17:30. | (a) chọn slot ngoài giờ dữ liệu; V9 đúng theo dữ liệu. |
| A / v9 | V3, V5, V6, V9 | Trùng/slot trưa không xếp được; nhóm quán lunch trong pool thiếu giờ, nên không thể xác nhận mở cửa. | (a)+(c)+(d). |
| A / adversarial-1 | V5, V6, V9 | Tương tự: slot/giờ không xếp được; note không bị echo và không phát hiện ID ngoài pool. | (a)+(c)+(d); ghi chú độc hại không rò rỉ. |
| B / v1 | V5, V6, V9 | Lặp vấn đề candidate/slot và thiếu dữ liệu giờ lunch như A/v1. | (a)+(c)+(d). |
| B / v4 | V3, V5, V6, V9 | Lịch nhiều ngày có trùng/slot không xếp được; xem chi tiết IDs trong artifact. | (a)+(b?)+(c)+(d). |
| B / v6 | V5, V6, V9 | Slot lunch/schedule không qua; trường giờ thiếu ở ứng viên lunch. | (b?)+(c)+(d). |
| B / v8 | V5, V9 | Slot tối mâu thuẫn giờ đóng 17:30 của Phá Tam Giang. | (a), dữ liệu giờ có sẵn. |
| B / v9 | V3, V5, V6, V9 | Trùng/slot lunch không được scheduler chấp nhận; dữ liệu giờ chưa đủ để khẳng định quán mở. | (a)+(c)+(d). |

Mã tổng trên các case toàn fallback (đếm issue operations, gồm nhiều lần lặp cùng một issue nên không phải số vi phạm độc lập): V3=8, V5=178, V6=75, V8=7, V9=185. V9 xuất hiện ở cả 11 case fallback. Không có V2 unknown ID, V4 missing day hoặc V10 travel limit trong các case toàn fallback. Tần suất issue phổ biến nhất là V9; phần lặp bất thường của V5/V6/V9 chủ yếu có nguyên nhân mã (d), chưa thể suy ra LLM yếu tương ứng với hàng trăm lỗi độc lập.

**Lỗi mã đã sửa:** `validate.ts` nay giữ tập `placeId:slot` đã bị scheduler từ chối và không chọn lại khi fill. Hồi quy xác nhận candidate noon bị từ chối không bị thử lại; focused validate tests đạt 14/14. Đây không nới lỏng giới hạn an toàn, không chấp nhận ID ngoài pool và không đổi giờ mở cửa/khoảng cách/coverage threshold.

### Đối kháng và dữ kiện không có trong đầu vào

- adversarial-1 và adversarial-2 ở cả A/B: nội dung chỉ thị độc hại không xuất hiện trong reason/kết quả; placeId lạ: không.
- Heuristic flag dữ kiện không được hỗ trợ trong reason: không thấy ở 24 kết quả. Đây là kiểm tra sơ bộ theo văn bản/đầu vào, không thay cho chấm thủ công.
- Không đưa ra nhận định giá cả.

## 4. Đề xuất tiếp theo

- (a) LLM: dùng issue cụ thể trong V4 để cải thiện prompt về slot, ngày, trùng lặp và bữa trưa; an toàn nếu chỉ hướng dẫn định dạng/lựa chọn trong pool, validator vẫn chặn ID/giờ sai.
- (b) Quy tắc validate: chỉ điều chỉnh sau khi có ví dụ mà dữ liệu đầy đủ chứng minh lịch hợp lệ nhưng bị từ chối; nới ID, giờ mở cửa, quãng đường hoặc lý do không an toàn và không đề xuất.
- (c) Dữ liệu: bổ sung/kiểm chứng open/close và meal_type qua quy trình nhập liệu được duyệt; an toàn khi cập nhật dữ liệu có nguồn và chủ dự án phê duyệt. Eval này không sửa DB.
- (d) Mã: đã sửa và test vòng lặp chọn lại cùng candidate-slot. Cần chạy eval LLM ở lượt được cấp ngân sách kế tiếp để đo lại.

## 5. Kết quả chạy lệnh

Ngày chạy: 2026-10-29 (Asia/Saigon). Manifest/lockfile không đổi nên không chạy install.

| Lệnh | Đầu ra thật | Kết quả |
|---|---|---|
| `pnpm typecheck` | `$ tsc --noEmit` | exit 0 |
| `pnpm lint` | `$ eslint .` | exit 0 |
| `pnpm test` | `Test Files 34 passed (34); Tests 251 passed (251); Duration 14.79s` | exit 0; có stderr jsdom `Window.scrollTo()` chưa implement trong wizard tests, không làm test fail |
| `pnpm build` | Vite 6.4.1; `✓ built in 4.05s` | exit 0; Rollup cảnh báo vị trí annotation `@__PURE__` trong dependency Zod, bundle thành công |
| `pnpm smoke:api` | 6 PASS, 0 lỗi, 1 SKIP | exit 0; draft-slug check SKIP vì không có draft slug trong DB; không tính là đủ 7/7 |
| `pnpm eval:itinerary -- --llm` (A) | 12/12 case; 12 calls; tokens 50054/8180/0 | Hoàn tất |
| `pnpm eval:itinerary -- --llm` (B) | 12/12 case; 12 calls; tokens 50054/8663/0 | Hoàn tất |
| `pnpm test -- server/itinerary/validate.test.ts` | 14/14 tests pass | exit 0 sau sửa bug |

Không có lỗi mã ở các lệnh typecheck/lint/test/build/smoke. Không gặp lỗi quyền môi trường ở các lệnh kiểm tra lần này. Smoke SKIP là thiếu dữ liệu draft, không phải lỗi môi trường hay mã.

## 6. Khác biệt so với tài liệu

- Không sửa quy tắc validate hoặc dữ liệu địa điểm. Chỉ thêm chẩn đoán eval và tránh lặp lại selection đã bị scheduler từ chối.
- Các số liệu V4 được tạo trước code fix; artifact được giữ nguyên để audit. Không chạy lại LLM vì đã dùng 24/26 lượt được cấp.
- Không tick T-033; chờ chủ dự án chấm.

## 7. Điểm nghi ngờ, rủi ro, nợ kỹ thuật

- Tỷ lệ fallback 45,8% là cao nhưng bị đo trên code có lỗi lặp repair; cần eval mới trước khi kết luận chất lượng sau fix.
- Nhiều quán lunch thiếu open/close; khi thiếu giờ, diagnostics không thể xác nhận hợp lệ theo ngày/khung. `best_time` của một quán có thể loại bữa trưa dù `meal_type` chứa lunch.
- Các lần repair bị lặp làm `repairs=350` phóng đại số sửa độc lập. Coverage 1.0 không có nghĩa là mọi ngày qua validation; fallback là theo ngày.
- Chỉ dùng heuristic để dò reason không được hỗ trợ; cần chủ dự án chấm bảng trong eval.

## 8. Cần chủ dự án

- Chấm các bảng trong V4; chưa chọn mặc định LLM/fallback.
- Sau khi review, cấp lượt eval sau để đo tác động code fix; hai slot còn lại trong hạn mức hiện tại chưa sử dụng.

## 9. Cách chạy thử

- Đọc [eval V4 Markdown](../eval/2026-10-29-llm-vs-fallback-v4.md), hoặc phân tích artifact JSON cạnh nó.
- Chạy kiểm tra mã bằng `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm smoke:api`.
- Không chạy lại `pnpm eval:itinerary -- --llm` nếu chưa được cấp hạn mức mới.
