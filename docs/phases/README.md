# Các phase bàn giao cho agent

> **Phase = mốc (M0–M6) gồm nhiều task.** Task (`T-001`…`T-052`, chi tiết ở `docs/09-roadmap-tasks.md`) là đơn vị làm việc nhỏ, một task một PR. Mỗi file phase gom: task, tài liệu cần đọc, màn hình Stitch liên quan, phần thiết kế phải bỏ, việc của chủ dự án, cổng kiểm tra và prompt dán cho agent.

## Cách dùng

1. Đưa agent repo (có `AGENTS.md`). Dán prompt ở cuối file phase tương ứng.
2. Làm tuần tự Phase 0 → 6. Nhập dữ liệu địa điểm (Phase 1) nên bắt đầu sớm, song song.
3. Xong mỗi phase: kiểm tra "Cổng kiểm tra cuối phase", chạy thử, rồi mới sang phase sau.
4. Câu hỏi còn mở đã có quyết định mặc định ở `docs/10-decisions.md`; chỉ các mục ghi "Cần chủ dự án" mới phải hỏi (ví dụ chọn LLM trước Phase 3).
5. Muốn giao nhỏ hơn: đổi dòng cuối của prompt thành "chỉ làm task T-0xx".

| Phase | Tên | Task | File |
|---|---|---|---|
| 0 | Nền móng (M0) | T-001 → T-010 (10) | [phase-0-foundation.md](phase-0-foundation.md) |
| 1 | Dữ liệu và khám phá (M1) | T-011 → T-017 (7) | [phase-1-data-explore.md](phase-1-data-explore.md) |
| 2 | Lịch trình không cần AI (M2) | T-018 → T-028 (11) | [phase-2-itinerary-no-ai.md](phase-2-itinerary-no-ai.md) |
| 3 | AI thật (M3) | T-029 → T-033 (5) | [phase-3-ai.md](phase-3-ai.md) |
| 4 | Tài khoản, lưu và chia sẻ (M4) | T-034 → T-042 (9) | [phase-4-accounts-share.md](phase-4-accounts-share.md) |
| 5 | Quản trị (M5) | T-043 → T-045 (3) | [phase-5-admin.md](phase-5-admin.md) |
| 6 | Hoàn thiện và ra mắt (M6) | T-046 → T-052 (7) | [phase-6-launch.md](phase-6-launch.md) |
