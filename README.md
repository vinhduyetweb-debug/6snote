# Sổ Thông Thái Knowledge OS V1.1.0

**Sổ Thông Thái Knowledge OS** là mini app PWA offline-first giúp lưu tri thức cá nhân và biến ghi chú thô thành:

- ý chính
- bài học
- hành động cần làm
- flashcard ôn tập
- bản đồ tag tri thức

App chạy tĩnh bằng HTML/CSS/JavaScript thuần, không backend, không đăng nhập, không private API, không tracking.

## Điểm khác Note thường

Bản V1.1.0 không chỉ lưu ghi chú. App có **Distill Engine offline** để chưng cất nội dung ngay trên thiết bị:

1. Ghi hoặc dán nội dung thô.
2. Bấm `Lưu & chưng cất`.
3. App tự tạo ý chính, bài học, hành động, flashcard và tag gợi ý.
4. Mỗi ngày vào tab `Ôn tập` và `Hành động` để dùng lại tri thức.

Distill Engine là thuật toán local đơn giản, không gọi AI thật. Khi cần AI thật có thể nâng cấp ở V2.

## Chức năng chính

- Ghi nhanh tri thức.
- Chỉ lưu hoặc lưu kèm chưng cất.
- Tự giữ nháp bằng localStorage.
- Tìm kiếm toàn văn.
- Lọc theo loại, tag, yêu thích, lưu trữ.
- Dashboard: tổng tri thức, mục cần ôn, hành động mở, flashcard.
- Tab Hôm nay.
- Tab Kho tri thức.
- Tab Ôn tập theo cấp độ nhớ.
- Tab Flashcard.
- Tab Hành động.
- Tab Bản đồ tag.
- Copy nhanh ghi chú hoặc hành động.
- Export/import JSON.
- Reset dữ liệu có xác nhận 2 lần.
- PWA offline sau lần mở đầu tiên.

## Cấu trúc file

```text
/
  index.html
  style.css
  app.js
  manifest.json
  service-worker.js
  icon.svg
  README.md
  CHANGELOG.md
  package.json
  tools/
    validate-app.js
```

## Cách chạy local

Cách đơn giản:

```bash
python -m http.server 8080
```

Sau đó mở:

```text
http://localhost:8080
```

Hoặc dùng bất kỳ static server nào.

## Cách test

```bash
npm run check
npm run validate
```

Trong đó:

- `check`: kiểm tra cú pháp JavaScript.
- `validate`: kiểm tra file bắt buộc, manifest, service worker, localStorage key, export/import và release sạch.

## Deploy Vercel

```bash
npm run check
npm run validate
git add .
git commit -m "Release V1.1.0 Knowledge OS"
git push origin main
npx vercel --prod
```

## Backup / Restore

### Backup

Bấm `Xuất JSON` để tải file backup.

### Restore

Mở `Sao lưu & phục hồi` → bấm `Nhập JSON` → chọn file backup.

Import sẽ hợp nhất theo ID. App không tự xóa dữ liệu cũ.

## Lưu trữ dữ liệu

Dữ liệu chính nằm trong localStorage key:

```text
wisdom_notebook_records_v1
wisdom_notebook_settings_v1
wisdom_notebook_draft_v1
wisdom_notebook_last_backup_v1
```

Key records vẫn giữ hậu tố `_v1` để không phá dữ liệu của bản V1.0.0. Khi mở V1.1.0, app tự normalize/migration bản ghi cũ sang schema mới trong localStorage.

## Giới hạn V1.1.0

- Chưa có AI thật.
- Chưa đồng bộ đa thiết bị.
- Chưa lưu file nặng như PDF, ảnh, voice.
- Distill Engine chỉ là thuật toán offline rule-based.
- Dữ liệu phụ thuộc vào trình duyệt hiện tại, nên cần export JSON định kỳ.

## Version hiện tại

**V1.1.0 — Knowledge OS**

Slogan: **Biết mà dùng được, tri thức mới sống.**
