# CHANGELOG

## V1.0.0 — 2026-06-28 — Offline Core

### Thay đổi chính

- Tạo app mới chỉ tập trung vào **Sổ Thông Thái**.
- Loại bỏ cấu trúc 6 sổ để giao diện gọn hơn.
- Dùng `localStorage` thay cho IndexedDB để giảm rủi ro lỗi lưu ở bản đầu.
- Thêm autosave draft khi đang gõ.
- Thêm dashboard tối giản.
- Thêm tìm kiếm, lọc loại tri thức, lọc yêu thích/lưu trữ, lọc tag.
- Thêm favorite, copy, sửa, lưu trữ, xóa.
- Thêm export/import JSON.
- Thêm PWA manifest, service worker và icon SVG.
- Thêm validator package.

### File đã tạo

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

### Ghi chú tương thích dữ liệu

- Schema localStorage V1 dùng key `wisdom_notebook_records_v1`.
- Import JSON hợp nhất theo ID, không tự xóa dữ liệu cũ.
- Reset dữ liệu yêu cầu xác nhận bằng chữ `XOA`.
