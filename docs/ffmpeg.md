# 🎬 FFmpeg Integration

## Tổng quan

n8n sử dụng custom Docker image có tích hợp FFmpeg để xử lý video trực tiếp trong workflows.

Image được build bằng multi-stage Dockerfile:
- **Stage 1:** Cài FFmpeg trong Alpine
- **Stage 2:** Copy binary FFmpeg vào n8n image

## Kiểm tra FFmpeg

```bash
# Kiểm tra version
docker exec n8n ffmpeg -version

# Kiểm tra ffprobe
docker exec n8n ffprobe -version
```

## Sử dụng trong n8n

### Cách 1: Execute Command Node

Sử dụng node **Execute Command** để chạy FFmpeg trực tiếp:

```bash
# Chuyển đổi format
ffmpeg -i /files/input.mp4 -c:v libx264 /files/output.mp4

# Resize video
ffmpeg -i /files/input.mp4 -vf scale=1080:1920 /files/output.mp4

# Cắt video (từ giây 10, lấy 30 giây)
ffmpeg -i /files/input.mp4 -ss 10 -t 30 -c copy /files/output.mp4
```

> **Lưu ý:** File phải nằm trong `/files/` (mapped từ `./local-files` trên host).

### Cách 2: Code Node (JavaScript)

```javascript
const { execSync } = require('child_process');

const inputFile = '/files/input.mp4';
const outputFile = '/files/output.mp4';

const result = execSync(
  `ffmpeg -i ${inputFile} -c:v libx264 -preset fast ${outputFile} -y`
);

return [{ json: { success: true, output: outputFile } }];
```

## Các lệnh FFmpeg thường dùng

### Merge video (nối video)

**Cách 1: Concat protocol (cùng codec)**
```bash
ffmpeg -i "concat:video1.ts|video2.ts" -c copy output.mp4
```

**Cách 2: Concat demuxer (khuyên dùng)**
```bash
# Tạo file list
echo "file '/files/video1.mp4'" > /files/filelist.txt
echo "file '/files/video2.mp4'" >> /files/filelist.txt

# Merge
ffmpeg -f concat -safe 0 -i /files/filelist.txt -c copy /files/merged.mp4
```

**Cách 3: Re-encode (khác codec/resolution)**
```bash
ffmpeg -i /files/video1.mp4 -i /files/video2.mp4 \
  -filter_complex "[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1" \
  /files/output.mp4
```

### Thêm nhạc nền vào video

```bash
ffmpeg -i /files/video.mp4 -i /files/music.mp3 \
  -c:v copy -c:a aac -shortest /files/output.mp4
```

### Tạo thumbnail

```bash
ffmpeg -i /files/video.mp4 -ss 00:00:05 -frames:v 1 /files/thumb.jpg
```

### Thông tin video

```bash
ffprobe -v error -show_format -show_streams -print_format json /files/video.mp4
```

### Chuyển video cho TikTok (1080x1920, 9:16)

```bash
ffmpeg -i /files/input.mp4 \
  -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" \
  -c:v libx264 -preset fast -crf 23 \
  -c:a aac -b:a 128k \
  /files/tiktok_ready.mp4
```

## Troubleshooting

### FFmpeg không tìm thấy
```bash
# Kiểm tra binary tồn tại
docker exec n8n which ffmpeg
docker exec n8n which ffprobe
```

Nếu không có, rebuild image:
```bash
docker compose build --no-cache
docker compose up -d
```

### Permission denied
Đảm bảo container chạy với `user: root` trong docker-compose.yml (đã cấu hình sẵn).

### File không tìm thấy
File phải nằm trong `/files/` — tương ứng `./local-files/` trên host. Kiểm tra `N8N_RESTRICT_FILE_ACCESS_TO=/files/`.
