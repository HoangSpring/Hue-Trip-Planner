# Đánh giá Gemini so với dự phòng — V3 (dừng sớm)

- Ngày: 2026-10-29; model: `gemini-3.5-flash-lite`; prompt: `hue-itinerary-v2-compact`.
- Chạy sau sửa validator V9 theo ngày. Lệnh đã chạy đúng một lần: `pnpm eval:itinerary -- --llm`.
- Eval chỉ đọc dữ liệu địa điểm qua Supabase anon, không ghi `generation_events`.
- Đã gửi 11 calls; dừng sau khi thấy 3/9 kịch bản đầu toàn fallback (33,3%), vượt ngưỡng 10%. `V10` và đối kháng 1 hoàn thành trước lúc interrupt được xử lý; đối kháng 2 chưa gửi. Không retry.

## Đầu ra thật từng call

| Kịch bản | Kết quả | Thời gian | Input / output / thinking token |
|---|---|---:|---:|
| V1 | LLM | 3.540 ms | 4.292 / 728 / 0 |
| V2 | LLM | 2.432 ms | 1.898 / 349 / 0 |
| V3 | LLM | 3.686 ms | 3.929 / 850 / 0 |
| V4 | Toàn fallback | 5.065 ms | 7.636 / 1.409 / 0 |
| V5 | LLM | 2.320 ms | 2.310 / 289 / 0 |
| V6 | Toàn fallback | 4.138 ms | 6.204 / 997 / 0 |
| V7 | LLM | 3.542 ms | 2.744 / 580 / 0 |
| V8 | LLM | 3.128 ms | 2.726 / 566 / 0 |
| V9 | Toàn fallback | 3.218 ms | 5.833 / 715 / 0 |
| V10 | LLM | 3.914 ms | 6.219 / 993 / 0 |
| Đối kháng 1 | LLM | 4.289 ms | 4.312 / 690 / 0 |
| Đối kháng 2 | Chưa chạy | — | — |

11 calls; input 48.103, output 8.166, thinking 0; tổng 56.269 token. Trên 11 call đã chạy, p50 3.542 ms, p90 4.289 ms, LLM được chấp nhận 8/11, toàn fallback 3/11 (27,3%).

## So sánh V2 → V3

| Chỉ số | V2 | V3 (11/12; dừng sớm) |
|---|---:|---:|
| Tỷ lệ toàn fallback | 58,3% (7/12) | 27,3% (3/11) |
| Số kịch bản LLM được chấp nhận | 5/12 | 8/11 |
| Số ngày bị thay bằng fallback | 11 bị validator đánh dấu; 1 ngày thay trong kết quả được chấp nhận | Chưa ghi được do eval bị interrupt trước khi ghi diagnostics |
| Repairs | 1 theo tổng `repairs` ở từng case V2 | Chưa ghi được |
| Coverage | 1,0 trên các case V2 | Chưa ghi được |
| p50 / p90 | 3.838 / 5.713 ms | 3.542 / 4.289 ms |
| Token trung bình/call input/output/thinking | 4.171 / 708 / 0 | 4.373 / 742 / 0 |

Tỷ lệ V3 là số đo **một phần** và không bao gồm đối kháng 2; không xem là kết quả cuối của bộ 12. Không gọi thêm vì đã vượt ngưỡng fallback 10% như điều kiện dừng.

## Các case toàn fallback và chẩn đoán

| Case | Bằng chứng hiện có | Phân loại | Hướng xử lý |
|---|---|---|---|
| V4 | Console chỉ ghi `fallback`, 5.065 ms, token 7.636/1.409/0. Bản eval V3 chưa lưu `validationIssues`, coverage, placeId hoặc giờ do process bị dừng trước bước ghi file. | Chưa thể phân loại chắc giữa (a), (b), (c), (d). V2 từng ghi V9/`unschedulable` ở V4 nhưng đó là lần chạy khác. | Không nới validate. Lấy diagnostics cụ thể trước khi quyết định; nếu V9 do giờ/closed_days thiếu thì cải thiện dữ liệu, nếu do scheduler bug thì sửa lỗi mã. |
| V6 | Console chỉ ghi `fallback`, 4.138 ms, token 6.204/997/0; cùng hạn chế mất diagnostics như V4. | Chưa thể phân loại chắc. V2 đã có V9 ở một số case, nhưng không thể gán nguyên nhân V2 sang V3. | Giữ chặn placeId ngoài pool và kiểm tra reason; chẩn đoán từng mục bị loại rồi mới đổi quy tắc an toàn. |
| V9 | Console chỉ ghi `fallback`, 3.218 ms, token 5.833/715/0; không có coverage/issue list trong stdout đã thu. | Chưa thể phân loại chắc. Dữ liệu trước đây có 53/60 nơi thiếu ít nhất một giờ mở/đóng; đây là yếu tố dữ liệu cần kiểm tra, không chứng minh nguyên nhân của V9 lần này. | Bổ sung/kiểm chứng giờ và ngày nghỉ từ nguồn có phép; không tự điền dữ liệu địa điểm. |

Không có bằng chứng stdout V3 về ID ngoài pool, thiếu ngày, thiếu trưa, URL/HTML trong reason, giờ cụ thể hoặc quãng đường cụ thể; không thể kết luận LLM vi phạm hay validation quá chặt chỉ từ nhãn `fallback`. An toàn `placeId` và reason vẫn phải giữ nguyên. Nhóm lỗi mã duy nhất xác định được trong lượt này là eval harness trước đó chỉ ghi file sau khi hoàn tất, nên interrupt làm mất diagnostics; script đã được chỉnh để checkpoint sau mỗi case trong lần chạy tương lai.

## Ghi chú

- Kịch bản eval được dừng có chủ đích ở điều kiện fallback ≥10%; chưa đủ 12/12 và không có output chi tiết V3. Không có thao tác retry.
- Không sửa quy tắc validate để làm lỏng an toàn. `LLM_ENABLED` giữ `false`; không dùng generation eval để ghi DB.
- Bảng chấm thủ công chưa được chủ dự án chấm; T-033 vẫn chưa đạt.
