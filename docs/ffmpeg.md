# 🎬 FFmpeg Integration

## Tổng quan

n8n sử dụng custom Docker image có tích hợp **FFmpeg 6.1.2** để xử lý video trực tiếp trong workflows.

### Cách FFmpeg được cài đặt

FFmpeg được cài bằng phương pháp **isolated library** — tất cả shared libraries nằm trong `/opt/ffmpeg-libs/`, không overwrite system libs của n8n:

```
/usr/bin/ffmpeg      → wrapper script (set LD_LIBRARY_PATH trước khi chạy)
/usr/bin/ffmpeg.bin  → binary thật
/opt/ffmpeg-libs/    → tất cả shared libraries (libavcodec, libx264, etc.)
```

> **Tại sao không copy lib thẳng vào /usr/lib?**
> n8n dùng hardened Alpine — nếu overwrite system libs sẽ phá Node.js → n8n crash với lỗi `Invalid URL`.

## Kiểm tra FFmpeg

```bash
# Kiểm tra version
docker exec n8n-mcp ffmpeg -version

# Kiểm tra ffprobe
docker exec n8n-mcp ffprobe -version

# Test encode (tạo video test)
docker exec n8n-mcp ffmpeg -f lavfi -i testsrc=duration=2:size=320x240:rate=24 \
  -c:v libx264 -c:a aac -y /tmp/test.mp4
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

### Ghép video (concat)

**Cách 1: Concat demuxer (khuyên dùng, cùng codec)**
```bash
# Tạo file list
echo "file '/files/video1.mp4'" > /files/filelist.txt
echo "file '/files/video2.mp4'" >> /files/filelist.txt

# Ghép
ffmpeg -f concat -safe 0 -i /files/filelist.txt -c copy /files/merged.mp4
```

**Cách 2: Re-encode (khác codec/resolution)**
```bash
ffmpeg -i /files/video1.mp4 -i /files/video2.mp4 \
  -filter_complex "[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1" \
  /files/output.mp4
```

### Ghép nhạc vào video

```bash
# Thêm nhạc nền (giữ video gốc, encode audio)
ffmpeg -i /files/video.mp4 -i /files/music.mp3 \
  -c:v copy -c:a aac -shortest /files/output.mp4

# Thay thế audio hoàn toàn
ffmpeg -i /files/video.mp4 -i /files/music.mp3 \
  -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 -shortest /files/output.mp4
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

## Troubleshooting FFmpeg

### "Error loading shared library..."

FFmpeg cần các lib trong `/opt/ffmpeg-libs/`. Rebuild image:
```bash
docker compose build --no-cache
docker compose up -d
```

### "No such file or directory"

File phải nằm trong `/files/` — tương ứng `./local-files/` trên host:
```bash
# Trên host
ls ./local-files/

# Trong container
docker exec n8n-mcp ls /files/
```

### "Permission denied"

Container chạy `user: root` (đã cấu hình). Nếu gặp lỗi, kiểm tra quyền thư mục `./local-files`.
