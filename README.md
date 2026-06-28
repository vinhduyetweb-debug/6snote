# Sổ Thông Thái V1.3.0 — Public Learning Library Pro

**Sổ Thông Thái** là mini app PWA học tập tiếng Việt theo hướng **Public Learning Library + Private Learning Desk**.

Bản V1.3.0 giải quyết đúng nhu cầu mới: người dùng bất kỳ biết đường link app có thể mở và thấy **kho tri thức public hiện tại**. Kho public được lưu dạng file tĩnh `data/wisdom-public.json`, phù hợp để đặt trên GitHub cùng source app. Khi mở app, hệ thống tự tải file này, import/cache vào IndexedDB và hiển thị trong thư viện.

## Triết lý sản phẩm

Không chỉ ghi note.

App biến tri thức thành chu trình:

```text
Capture → Distill → Practice → Apply
```

Tức là:

1. Ghi hoặc đọc kiến thức.
2. Rút ý chính, bài học, mô hình tư duy.
3. Tạo flashcard và quiz để ôn.
4. Biến thành hành động áp dụng.

## Điểm nâng cấp lớn V1.3.0

- **Public Library Sync**: tự động đồng bộ `data/wisdom-public.json` khi mở app.
- **Kho chung / Kho riêng tách bạch**:
  - Kho chung: dữ liệu public do chủ app cập nhật trên GitHub.
  - Kho riêng: dữ liệu cá nhân của từng người, lưu trên thiết bị họ.
- **IndexedDB làm kho chính** để hỗ trợ lượng tri thức lớn hơn localStorage.
- **Migration an toàn** từ key cũ `wisdom_notebook_records_v1`.
- **Slogan của Lão theo bối cảnh note gần nhất**.
- **Gợi ý lại một note bất kỳ mỗi lần mở app**, không lặp trong cùng một ngày.
- **Ngày giờ dương lịch và âm lịch Việt Nam** hiển thị ngay trên Home.
- **Public Seed Library 36 bài học chất lượng cao** gồm 6 lộ trình:
  - Tự học thông minh
  - Prompt AI thực chiến
  - Tư duy phản biện
  - Kỷ luật cá nhân
  - Tài chính cá nhân thực dụng
  - Mini App & PWA
- **Flashcard, quiz, review, action board, knowledge map**.
- **Export/import JSON** để backup/restore.
- **PWA offline-first**: cache app shell và file public JSON.

## Quy tắc dữ liệu

### Kho chung

File:

```text
data/wisdom-public.json
```

Người dùng mở app sẽ tự tải file này nếu online. Nếu offline, app dùng bản đã cache trong IndexedDB/service worker.

Kho chung **chỉ đọc trong app**. Không cho người dùng sửa trực tiếp để tránh phá JSON.

### Kho riêng

Người dùng ghi note riêng trên thiết bị của họ. Dữ liệu lưu trong IndexedDB.

Kho riêng không bị ghi đè khi public library cập nhật.

## Vì sao dùng GitHub cho file public?

File JSON public là dữ liệu tĩnh. GitHub/Vercel/GitHub Pages phù hợp với mô hình static PWA: dễ version hóa, dễ rollback, dễ deploy, URL ổn định.

Google Drive nên dùng để giữ ZIP/JSON backup cá nhân, không nên làm database public cho app tĩnh.

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
  data/
    wisdom-public.json
  tools/
    validate-app.js
```

## Cách chạy local

Khuyến nghị chạy bằng local server để service worker và fetch JSON hoạt động đúng:

```bash
python -m http.server 8080
```

Mở:

```text
http://localhost:8080
```

## Cách test

```bash
npm run check
npm run validate
```

`npm run check` kiểm tra cú pháp JavaScript.

`npm run validate` kiểm tra:

- file bắt buộc tồn tại;
- manifest hợp lệ;
- service worker có cache version `v1.3.0`;
- app dùng IndexedDB;
- giữ key cũ để migration;
- có lịch âm/dương;
- có daily random note không lặp;
- có public sync;
- public JSON hợp lệ, không trùng ID;
- release không chứa `.env.local`, `.vercel`, `node_modules`.

## Cách deploy Vercel

```bash
npm run check
npm run validate
git add .
git commit -m "Release V1.3.0 Public Learning Library Pro"
git push origin main
npx vercel --prod
```

## Cách deploy GitHub Pages

1. Đẩy toàn bộ source lên GitHub.
2. Bật GitHub Pages trỏ về root folder.
3. Đảm bảo `data/wisdom-public.json` nằm cùng repo.
4. Mỗi lần sửa dữ liệu public, cập nhật `publicDataVersion` trong JSON rồi commit/push.

## Cách cập nhật kho chung

Sửa file:

```text
data/wisdom-public.json
```

Tăng version:

```json
"publicDataVersion": "2026.06.28-v2"
```

Sau đó:

```bash
git add data/wisdom-public.json
git commit -m "Update public wisdom data"
git push origin main
```

Người dùng mở app lại sẽ tự sync.

## Backup / Restore

### Backup

Bấm **Xuất JSON**. App tải file:

```text
wisdom-notebook-v1.3-backup-YYYY-MM-DD.json
```

File này nên lưu vào Google Drive cá nhân.

### Restore

Bấm **Nhập JSON**, chọn file backup. App sẽ gộp theo `id`, không xóa dữ liệu hiện có.

## Giới hạn hiện tại

- Public library là file JSON tĩnh, không phải database nhiều người cùng sửa.
- App không cho public edit trực tiếp vì chưa có backend/phân quyền.
- Âm lịch dùng thuật toán offline trong JS, phù hợp hiển thị lịch Việt Nam phổ thông nhưng không thay thế lịch pháp chính thức.
- Nếu mở trực tiếp bằng `file://`, fetch JSON/service worker có thể không hoạt động đúng. Nên chạy local server hoặc deploy.
- Không lưu file PDF/ảnh/voice trực tiếp để giữ app nhẹ.

## Version

**V1.3.0 — Public Learning Library Pro**

Slogan: **Kho chung để mở đường, kho riêng để giữ mình.**
