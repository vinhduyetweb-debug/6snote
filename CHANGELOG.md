# CHANGELOG

## V1.3.0 — Public Learning Library Pro

Ngày: 2026-06-28

### Thay đổi chính

- Nâng app từ Learning Pro cá nhân thành **Public Learning Library Pro**.
- Thêm cơ chế tự động đồng bộ kho tri thức public từ `data/wisdom-public.json` khi mở app.
- Tách dữ liệu thành:
  - `public`: kho chung chỉ đọc, ai mở link app cũng thấy;
  - `local`: kho riêng của từng người dùng, lưu trên thiết bị.
- Chuyển kho dữ liệu chính sang **IndexedDB** để hỗ trợ lượng tri thức lớn hơn localStorage.
- Giữ key legacy `wisdom_notebook_records_v1` để migrate dữ liệu cũ V1.0/V1.1/V1.2.
- Thêm dashboard ngày giờ:
  - dương lịch;
  - giờ hiện tại;
  - âm lịch Việt Nam;
  - can chi năm âm.
- Thêm slogan của Lão theo bối cảnh note gần nhất.
- Thêm random gợi ý note mỗi lần mở app, không lặp lại trong cùng ngày.
- Thêm Public Seed Library 36 bài học chất lượng cao với 6 lộ trình học.
- Thêm tab Đồng bộ, log sync, trạng thái `SYNCED / SYNC_ERROR / OFFLINE / LOCAL_ONLY`.
- Thêm Knowledge Map theo tag, phân tách public/local.
- Cải tiến UI: hero mới, card layout, sidebar Learning OS, reader room chuyên nghiệp hơn.

### File đã thêm/sửa

- `index.html`
- `style.css`
- `app.js`
- `manifest.json`
- `service-worker.js`
- `icon.svg`
- `README.md`
- `CHANGELOG.md`
- `package.json`
- `data/wisdom-public.json`
- `tools/validate-app.js`

### Test đã chạy

```bash
npm run check
npm run validate
```

Kết quả mong muốn: PASS.

### Tương thích dữ liệu

- Không phá key cũ:

```text
wisdom_notebook_records_v1
wisdom_notebook_settings_v1
wisdom_notebook_draft_v1
```

- Dữ liệu cũ trong localStorage sẽ được migrate sang IndexedDB lần đầu mở app.
- Kho public cập nhật không ghi đè kho riêng.
- Export JSON V1.3 chứa cả public cache, private records, settings và publicMeta.

### Ghi chú vận hành

- GitHub/Vercel nên là nguồn public JSON chính.
- Google Drive nên dùng để lưu ZIP/JSON backup cá nhân.
- Không bật public edit trực tiếp khi chưa có backend/phân quyền.
