# Sổ Thông Thái V1.0.0 — Offline Core

**Sổ Thông Thái** là mini app PWA tĩnh để lưu tri thức cá nhân bằng tiếng Việt: ý tưởng, bài học, prompt AI, trích dẫn, checklist, link/video và tài liệu cần dùng lại.

Bản này tách riêng khỏi ý tưởng 6 quyển sổ để giao diện gọn hơn và tránh lỗi lưu phức tạp. Mục tiêu V1.0.0 là: mở app lên, ghi nhanh, lưu chắc, tìm lại dễ.

## Chức năng chính

- Ghi nhanh tri thức với tiêu đề, nội dung, loại, tag, nguồn/link.
- Lưu bằng `localStorage`, đơn giản và ổn định.
- Tự giữ nháp khi đang gõ để hạn chế mất nội dung.
- Danh sách ghi chú dạng thẻ, dễ đọc trên điện thoại.
- Tìm kiếm theo tiêu đề, nội dung, tag và nguồn.
- Lọc theo loại tri thức, yêu thích, lưu trữ.
- Đánh dấu yêu thích, copy nhanh, sửa, ẩn/lưu trữ, xóa.
- Dashboard: tổng ghi chú, ghi hôm nay, yêu thích, số tag.
- Focus Mode để chỉ còn vùng ghi chính.
- Export/import JSON để sao lưu và chuyển thiết bị.
- PWA cài đặt được, chạy offline sau lần mở đầu tiên.

## Cách chạy local

Mở trực tiếp `index.html` bằng trình duyệt hoặc chạy một static server bất kỳ.

Ví dụ với Python:

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

## Cách deploy Vercel

```bash
npm run check
npm run validate
git add .
git commit -m "Release V1.0.0 Wisdom Notebook Offline Core"
git push origin main
npx vercel --prod
```

## Cách dùng app

1. Bấm **+ Ghi tri thức** hoặc nhập ngay ở khung đầu tiên.
2. Điền tiêu đề và nội dung.
3. Chọn loại tri thức: ý tưởng, bài học, prompt, quote, checklist, link, sách hoặc khác.
4. Thêm tag ngắn như `ai, tài chính, học tập`.
5. Bấm **Lưu tri thức**.
6. Dùng tìm kiếm, tag hoặc bộ lọc để tìm lại.
7. Dùng ⭐ cho ghi chú cần dùng lại nhiều.
8. Dùng **Xuất JSON** định kỳ để sao lưu.

## Backup / Restore

- **Xuất JSON:** tải toàn bộ dữ liệu thành file backup.
- **Nhập JSON:** hợp nhất dữ liệu theo ID, không tự xóa dữ liệu cũ.
- **Reset dữ liệu:** yêu cầu nhập `XOA` để tránh bấm nhầm.

## Dữ liệu lưu ở đâu?

Dữ liệu lưu trong trình duyệt hiện tại bằng các key:

```text
wisdom_notebook_records_v1
wisdom_notebook_settings_v1
wisdom_notebook_draft_v1
wisdom_notebook_last_backup_v1
```

Không có backend, không đăng nhập, không private API, không tracking.

## Giới hạn V1.0.0

- Chưa có AI thật.
- Chưa đồng bộ đa thiết bị.
- Chưa lưu file ảnh, voice hoặc PDF trực tiếp.
- Nếu đổi trình duyệt hoặc xóa dữ liệu web, cần restore từ JSON backup.

## Version

- Current: `1.0.0`
- Cache: `wisdom-notebook-cache-v1.0.0`

Slogan: **Ghi ít nhưng đúng, nhớ lâu và dùng được.**
