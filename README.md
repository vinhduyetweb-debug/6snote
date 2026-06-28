# Sổ Thông Thái V1.2.0 — Learning Pro

**Sổ Thông Thái Learning Pro** là một mini app PWA offline-first để phục vụ nhu cầu học kiến thức mới hằng ngày. Bản V1.2.0 không còn là một app note đơn thuần. App được thiết kế như một **bàn học cá nhân offline**: ghi kiến thức, chưng cất ý chính, tạo flashcard, ôn tập, làm quiz và biến bài học thành hành động.

## Triết lý sản phẩm

Mỗi kiến thức đi qua 4 bước:

1. **Capture** — ghi lại kiến thức thô.
2. **Distill** — rút ý chính, bài học, khái niệm, câu hỏi.
3. **Practice** — ôn tập bằng flashcard và quiz.
4. **Apply** — biến tri thức thành hành động thật.

Mục tiêu: người dùng mở app lần sau vẫn muốn quay lại vì luôn thấy rõ hôm nay cần học gì, ôn gì và làm gì.

## Tính năng chính

- Giao diện Learning OS chuyên nghiệp, mobile-first, dark/light mode.
- Dashboard học tập: tổng tri thức, thẻ cần ôn, hành động mở, streak, mastery.
- Mission hôm nay: app tự gợi ý việc nên làm tiếp theo.
- Ghi kiến thức mới theo chế độ: học sâu, ghi nhanh, ứng dụng dự án, ôn thi.
- Distill Engine offline: tự tạo ý chính, bài học, khái niệm, câu hỏi và hành động.
- Flashcard tự sinh từ nội dung.
- Spaced Review: thẻ đến hạn, nút Quên/Nhớ/Rất chắc.
- Quiz nhanh từ flashcard.
- Apply Board: gom các hành động sinh ra từ tri thức.
- Learning Paths: tự tạo lộ trình học từ tag.
- Knowledge Map: bản đồ tag, mastery, việc mở và khoảng trống học tập.
- Reading Room: đọc lại ghi chú và bản chưng cất trong modal riêng.
- Tìm kiếm, lọc theo loại, tag, trạng thái, ưu tiên.
- Export/import JSON để backup và chuyển thiết bị.
- Reset dữ liệu có xác nhận kép.
- PWA offline cache shell app sau lần mở đầu tiên.

## Công nghệ

- HTML/CSS/JavaScript thuần.
- Không framework.
- Không backend.
- Không login.
- Không private API.
- Không tracking.
- Dữ liệu lưu bằng `localStorage`.
- Service worker cache app shell.

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

Có thể mở trực tiếp `index.html`, nhưng để test PWA/service worker ổn hơn nên chạy bằng local server:

```bash
python -m http.server 8080
```

Sau đó mở:

```text
http://localhost:8080
```

## Cách test

```bash
npm run check
npm run validate
```

`npm run check` kiểm tra cú pháp JavaScript.

`npm run validate` kiểm tra file bắt buộc, manifest, service worker, cache version, root container, storage key và placeholder nội bộ.

## Cách dùng app

1. Mở app.
2. Chọn **Ghi kiến thức mới**.
3. Nhập tiêu đề, nội dung, tag, nguồn và hành động muốn áp dụng.
4. Bấm **Lưu & tạo bài học**.
5. Vào **Distill Studio** để xem ý chính, bài học, câu hỏi và flashcard.
6. Vào **Ôn tập** để review thẻ đến hạn.
7. Vào **Quiz** để kiểm tra nhanh.
8. Vào **Hành động** để biến bài học thành việc thật.
9. Dùng **Xuất JSON** định kỳ để backup.

## Backup / Restore

### Backup

Bấm **Xuất JSON**. App sẽ tải file dạng:

```text
wisdom-notebook-backup-YYYY-MM-DD.json
```

### Restore

Bấm **Nhập JSON**, chọn file backup. App sẽ nhập dữ liệu và gộp theo `id`, không xóa dữ liệu hiện có.

## Tương thích dữ liệu

Bản V1.2.0 tiếp tục dùng key chính:

```text
wisdom_notebook_records_v1
wisdom_notebook_settings_v1
wisdom_notebook_draft_v1
wisdom_notebook_last_backup_v1
```

Mục tiêu là không phá dữ liệu cũ từ V1.0.0 và V1.1.0. Các record cũ sẽ được normalize khi load.

## Deploy Vercel

```bash
npm run check
npm run validate
git add .
git commit -m "Release V1.2.0 Learning Pro"
git push origin main
npx vercel --prod
```

## Deploy GitHub Pages

Đẩy toàn bộ source lên branch chính, bật GitHub Pages trỏ về root folder.

## Giới hạn hiện tại

- Distill Engine là thuật toán offline, không phải AI cloud thật.
- Không đồng bộ đa thiết bị tự động.
- Không lưu file PDF/ảnh/voice trực tiếp để giữ app nhẹ.
- localStorage phụ thuộc trình duyệt; nên export JSON định kỳ.
- Chưa test thủ công trên toàn bộ thiết bị thật.

## Version

**V1.2.0 — Learning Pro**

Slogan: **Biết mà ôn được, làm được, mới là tri thức sống.**
