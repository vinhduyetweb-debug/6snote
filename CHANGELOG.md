# CHANGELOG

## V1.1.0 — 2026-06-28 — Knowledge OS

### Thay đổi chính

- Nâng cấp từ app ghi chú gọn thành Knowledge OS.
- Thêm Distill Engine offline:
  - rút ý chính
  - sinh bài học
  - sinh hành động
  - sinh flashcard
  - gợi ý tag
- Thêm tab Hôm nay.
- Thêm tab Kho tri thức.
- Thêm tab Ôn tập.
- Thêm tab Flashcard.
- Thêm tab Hành động.
- Thêm tab Bản đồ tag.
- Thêm lịch ôn tập nhẹ theo cấp độ nhớ.
- Thêm dashboard mới: tri thức, cần ôn, việc mở, flashcard.
- Giữ localStorage key cũ để tương thích dữ liệu V1.0.0.
- Cập nhật giao diện gọn hơn theo dạng workbench.
- Cập nhật README, manifest, service worker, validator.

### File đã sửa

- `index.html`
- `style.css`
- `app.js`
- `manifest.json`
- `service-worker.js`
- `icon.svg`
- `README.md`
- `CHANGELOG.md`
- `package.json`
- `tools/validate-app.js`

### Test đã chạy

```bash
npm run check
npm run validate
```

Kết quả: PASS.

### Tương thích dữ liệu

- Giữ key `wisdom_notebook_records_v1`.
- Bản ghi cũ được normalize sang schemaVersion 2 khi app load.
- Import JSON hỗ trợ cả `records` và `notes`.

## V1.0.0 — 2026-06-28 — Offline Core

### Thay đổi chính

- Bản đầu tiên chỉ tập trung Sổ Thông Thái.
- Ghi nhanh, tìm kiếm, lọc, yêu thích, lưu trữ.
- Export/import JSON.
- PWA offline.
