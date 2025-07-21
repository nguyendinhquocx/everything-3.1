# Everything Explorer - Chrome Extension

Một Chrome Extension giúp tìm kiếm file nhanh chóng thông qua Everything Search Engine ngay trong sidebar của trình duyệt.

## Tính năng

- 🔍 Tìm kiếm file nhanh chóng qua Everything
- 📁 Bộ lọc theo loại file (Ảnh, Tài liệu, Media, Thư mục)
- 📅 Lọc theo thời gian (Hôm nay, Tuần này)
- ⚙️ Cài đặt port và ổ đĩa tùy chỉnh
- 🎯 Giao diện sidebar tiện lợi
- 💾 Lưu cài đặt tự động

## Yêu cầu

1. **Everything Search Engine** đã được cài đặt và chạy
2. **Everything HTTP Server** đã được bật:
   - Mở Everything → Tools → Options → HTTP Server
   - Tick "Enable HTTP Server"
   - Đặt port (mặc định: 8080)
   - Click "OK"

## Cài đặt Extension

### Bước 1: Tạo icon
1. Mở file `create_icon.html` trong trình duyệt
2. Click "Download Icon" để tải icon.png
3. Đặt file icon.png vào thư mục extension

### Bước 2: Load Extension
1. Mở Chrome và vào `chrome://extensions/`
2. Bật "Developer mode" ở góc trên bên phải
3. Click "Load unpacked"
4. Chọn thư mục chứa extension này
5. Extension sẽ xuất hiện trong danh sách

### Bước 3: Sử dụng
1. Click vào icon Extension trên thanh công cụ
2. Sidebar sẽ mở ra bên cạnh
3. Nhập từ khóa tìm kiếm và nhấn Enter
4. Kết quả sẽ hiển thị trong iframe

## Cấu hình

### Cài đặt Everything HTTP Server
- Port mặc định: 8080
- Có thể thay đổi trong phần Settings của extension

### Cài đặt Extension
- **Port**: Cổng HTTP của Everything (mặc định: 8080)
- **Default Drive**: Ổ đĩa mặc định để tìm kiếm (D: hoặc C:)
- **Tìm kiếm trên C:**: Bật/tắt tìm kiếm trên ổ C:

## Cấu trúc File

```
everything-extension/
├── manifest.json          # Cấu hình extension
├── background.js          # Service worker
├── sidepanel.html         # Giao diện chính
├── sidepanel.css          # Styles
├── sidepanel.js           # Logic chính
├── icon.png              # Icon extension
├── create_icon.html       # Tool tạo icon
└── README.md             # Hướng dẫn này
```

## Tính năng nâng cao

### Bộ lọc nhanh
- **Ảnh**: jpg, jpeg, png, gif, bmp, svg, webp, ico
- **Tài liệu**: pdf, doc, docx, txt, rtf, odt, xls, xlsx, ppt, pptx
- **Media**: mp4, avi, mkv, mov, wmv, flv, mp3, wav, flac, aac
- **Thư mục**: Chỉ hiển thị các thư mục

### Lọc theo thời gian
- **Tất cả**: Không giới hạn thời gian
- **Hôm nay**: File được sửa đổi hôm nay
- **Tuần này**: File được sửa đổi trong 7 ngày qua

## Khắc phục sự cố

### Extension không hoạt động
1. Kiểm tra Everything đã chạy chưa
2. Kiểm tra HTTP Server đã bật chưa
3. Kiểm tra port có đúng không
4. Thử reload extension

### Không tìm thấy file
1. Kiểm tra Everything đã index ổ đĩa chưa
2. Kiểm tra cài đặt ổ đĩa trong extension
3. Thử tìm kiếm trực tiếp trong Everything

### Lỗi kết nối
1. Kiểm tra port có bị chặn không
2. Kiểm tra firewall
3. Thử port khác (8081, 8082...)

## Phát triển

### Chạy trong Development Mode
1. Load extension như hướng dẫn trên
2. Mở Developer Tools cho extension
3. Thay đổi code và reload extension

### Đóng gói Extension
1. Vào `chrome://extensions/`
2. Click "Pack extension"
3. Chọn thư mục extension
4. Tạo file .crx để phân phối

## Giấy phép

MIT License - Sử dụng tự do cho mục đích cá nhân và thương mại.

## Đóng góp

Mọi đóng góp và báo lỗi đều được hoan nghênh!