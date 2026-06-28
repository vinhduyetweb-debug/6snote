# CHANGELOG

## V1.2.0 — Learning Pro

Ngày: 2026-06-28

### Mục tiêu

Nâng cấp Sổ Thông Thái từ note app thành một **Learning OS offline-first** chuyên nghiệp hơn, đẹp hơn, có lý do để người dùng mở lại hằng ngày và phục vụ tốt hơn nhu cầu học kiến thức mới.

### Thay đổi chính

- Thiết kế lại giao diện theo phong cách Learning OS:
  - Hero chuyên nghiệp.
  - Command Center hôm nay.
  - Sidebar điều hướng rõ ràng.
  - Dashboard học tập.
  - Dark/light mode.
  - Card UI đẹp hơn, responsive mobile/desktop.
- Thêm pipeline học tập:
  - Capture.
  - Distill.
  - Practice.
  - Apply.
- Nâng cấp Distill Engine offline:
  - Rút ý chính.
  - Sinh bài học.
  - Sinh khái niệm trọng tâm.
  - Sinh câu hỏi tự học.
  - Sinh hành động áp dụng.
  - Sinh flashcard.
- Thêm Spaced Review:
  - Thẻ đến hạn.
  - Chấm Quên / Nhớ / Rất chắc.
  - Cập nhật lịch ôn theo level.
- Thêm Quiz Mode:
  - Tạo quiz nhanh từ flashcard.
  - Kiểm tra đáp án ngay trong app.
- Thêm Apply Board:
  - Gom toàn bộ hành động mở từ tri thức.
  - Đánh dấu xong.
- Thêm Learning Paths:
  - Tự tạo lộ trình học theo tag.
  - Hiển thị số ghi chú, card, việc mở, tiến độ.
- Thêm Knowledge Map:
  - Bản đồ tag.
  - Mastery theo mảng học.
  - Gợi ý khoảng trống học tập.
- Thêm Reading Room:
  - Đọc lại nội dung gốc.
  - Xem bản chưng cất trong modal riêng.
- Thêm bộ mẫu học tập starter pack tùy chọn.
- Cải thiện export/import JSON:
  - Có schema/version.
  - Gộp theo id khi import.
  - Giữ dữ liệu hiện có.
- Giữ localStorage key cũ để tránh phá dữ liệu V1.0/V1.1.

### File đã sửa / thêm

- `index.html`
- `style.css`
- `app.js`
- `manifest.json`
- `service-worker.js`
- `README.md`
- `CHANGELOG.md`
- `package.json`
- `tools/validate-app.js`

### Test đã chạy

```bash
npm run check
npm run validate
```

Kỳ vọng: PASS.

### Ghi chú tương thích dữ liệu

Vẫn giữ các key:

```text
wisdom_notebook_records_v1
wisdom_notebook_settings_v1
wisdom_notebook_draft_v1
wisdom_notebook_last_backup_v1
```

Record cũ được normalize khi load để bổ sung các trường mới như `mode`, `target`, `cards`, `generatedActions`, `distill`.

### Chưa test được

- Chưa test thủ công trên điện thoại thật.
- Chưa test với dữ liệu cực lớn hàng nghìn ghi chú.
- Chưa có đồng bộ đa thiết bị.
