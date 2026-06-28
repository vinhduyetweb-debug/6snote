# 6 Quyển Sổ Thông Thái — 6S Notebook V1.0.0 Offline Core

**6S Notebook** là mini app PWA tĩnh giúp xây dựng LifeOS cá nhân bằng tiếng Việt: ghi lại tri thức, mục tiêu, thành công, tài chính, quan hệ và công việc trong một nơi gọn nhẹ.

Triết lý V1.0.0: **mở app lên là biết hôm nay cần ghi gì, làm gì, giữ gì.**

## Tính năng chính

- 6 quyển sổ:
  - 📘 Sổ Thông Thái
  - 🎯 Sổ Mục tiêu
  - 🏆 Nhật ký Thành công
  - 💰 Sổ Tài chính
  - 🤝 Sổ Quan hệ
  - ⏰ Sổ Công việc
- Dashboard tổng quan.
- Ghi nhanh, sửa, xóa, đánh dấu xong.
- Review hôm nay và streak nhật ký.
- Tạo việc từ bản ghi bất kỳ.
- Tìm kiếm toàn bộ dữ liệu.
- Lọc theo sổ và trạng thái.
- Sổ Quan hệ có cảnh báo mềm khi quá 60 ngày chưa liên hệ.
- Sổ Công việc có cảnh báo việc quá hạn.
- Export / import JSON để sao lưu và chuyển thiết bị.
- Reset dữ liệu có xác nhận.
- PWA offline-first, có `manifest.json` và `service-worker.js`.
- Không backend, không đăng nhập, không private API, không tracking.

## Cách chạy local

Mở trực tiếp file:

```bash
index.html
```

Hoặc chạy bằng server tĩnh nếu muốn test PWA/service worker đúng hơn:

```bash
python -m http.server 8080
```

Sau đó mở:

```text
http://localhost:8080
```

## Cách test

Cần Node.js để chạy validator:

```bash
npm run check
npm run validate
```

`npm run check` kiểm tra cú pháp JavaScript.  
`npm run validate` kiểm tra cấu trúc package, manifest, service worker, root app, key lưu trữ và file nhạy cảm.

## Cách deploy Vercel

Vì đây là app tĩnh, có thể deploy trực tiếp thư mục source.

Lệnh mẫu:

```bash
npm run check
npm run validate
git status
git add .
git commit -m "Release V1.0.0 Offline Core"
git push origin main
```

Nếu dùng Vercel CLI:

```bash
npx vercel --prod
```

## Cách dùng app

1. Mở app.
2. Bấm **+ Ghi nhanh**.
3. Chọn một trong 6 quyển sổ.
4. Nhập tiêu đề, nội dung, tag, ưu tiên, ngày liên quan.
5. Bấm **Lưu**.
6. Khi cần biến ý tưởng thành hành động, mở bản ghi và bấm **Tạo việc từ bản ghi**.
7. Cuối ngày bấm **Review hôm nay** để ghi vào Nhật ký Thành công.
8. Định kỳ bấm **Xuất JSON** để sao lưu.

## Backup và restore dữ liệu

### Backup

Bấm **Xuất JSON**. App sẽ tải file dạng:

```text
sixs-notebook-backup-YYYY-MM-DD.json
```

### Restore

Bấm **Nhập JSON** và chọn file backup. App sẽ hợp nhất theo ID, không tự xóa dữ liệu hiện có.

### Reset

Mở mục **Sao lưu, phục hồi và reset**, bấm **Reset dữ liệu**, nhập đúng:

```text
RESET
```

## Dữ liệu lưu ở đâu?

- Bản ghi chính lưu trong IndexedDB: `sixs_db_v1`.
- Thiết lập nhẹ lưu trong localStorage:
  - `sixs_settings`
  - `sixs_version`
  - `sixs_last_backup`
  - `sixs_ui_state`

Dữ liệu chỉ nằm trên thiết bị của người dùng, trừ khi người dùng tự export/import file JSON.

## Giới hạn V1.0.0

- Chưa có AI gọi API thật.
- Chưa đồng bộ đa thiết bị.
- Chưa lưu file PDF, ảnh, voice trực tiếp trong app.
- Chưa có semantic search thật.
- Chưa có calendar kéo thả hoặc Pomodoro nâng cao.
- Không phải ứng dụng kế toán chuyên nghiệp.

Các phần này nên để V1.1/V2.0 để tránh app bị nặng và khó bảo trì.

## Cấu trúc file

```text
/
  index.html
  style.css
  app.js
  db.js
  manifest.json
  service-worker.js
  icon.svg
  README.md
  CHANGELOG.md
  package.json
  tools/
    validate-app.js
```

## Version hiện tại

**V1.0.0 — Offline Core**

Slogan sản phẩm: **Ghi lại điều nhỏ, giữ lại đời lớn.**
"# 6snote" 
