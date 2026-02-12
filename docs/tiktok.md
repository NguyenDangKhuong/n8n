# 🎵 TikTok Integration

## Tổng quan

Hệ thống sử dụng **community node** để tương tác với TikTok API, bao gồm:
- Upload video lên TikTok
- Đăng bài tự động
- Tạo video AI (VEO 3) và upload

## Community Nodes

### n8n-nodes-social-tiktok

Node chính cho TikTok, nằm tại:
```
community-nodes/n8n-nodes-social-tiktok/
```

#### Các node có sẵn:
| Node | Chức năng |
|---|---|
| `tikTokSend` | Gửi/đăng bài TikTok |
| `tikTokUpload` | Upload video lên TikTok |
| `tiktokTrigger` | Trigger khi có sự kiện TikTok |

### @dlir2404/n8n-nodes-tiktok

Node TikTok bổ sung, nằm tại:
```
community-nodes/@dlir2404/n8n-nodes-tiktok/
```

## Cài đặt Community Node

Community nodes đã được cài sẵn trong `node_modules`. Nếu cần cài lại:

```bash
# Vào container
docker exec -it n8n sh

# Cài node
cd /home/node/.n8n
npm install n8n-nodes-social-tiktok
```

Hoặc mount folder `community-nodes` vào container.

## Workflow mẫu: Upload video TikTok

### Flow cơ bản:
```
Google Drive → Download video → TikTok Upload → TikTok Send
```

### Các bước:
1. **Google Drive node:** Lấy video từ Drive
2. **Set node:** Chuẩn bị metadata (title, description, tags)
3. **TikTok Upload:** Upload video lên TikTok (trả về upload_id)
4. **TikTok Send:** Publish video với metadata

## Workflow mẫu: Auto-generate AI Video + TikTok

### Flow:
```
Schedule Trigger → AI Agent (tạo script) → VEO 3 (tạo video)
→ Download video → FFmpeg (resize 9:16) → TikTok Upload
```

### Các bước:
1. **Schedule Trigger:** Chạy theo lịch
2. **Google Sheets:** Lấy danh sách topics
3. **AI Agent + OpenAI:** Generate video script/prompt
4. **HTTP Request (VEO 3):** Gọi API tạo video AI
5. **Wait:** Đợi video render xong
6. **Download:** Tải video về `/files/`
7. **FFmpeg:** Chuyển đổi format cho TikTok (1080x1920)
8. **TikTok Upload + Send:** Đăng lên TikTok

## TikTok API Notes

### Rate Limits
- TikTok có rate limit cho video upload
- Nên dùng **Wait node** giữa các lần upload
- Khuyên dùng **Split In Batches** cho nhiều video

### Video Requirements
- **Format:** MP4, WebM
- **Resolution:** 1080x1920 (9:16) cho best result
- **Duration:** 3 giây - 10 phút
- **Size:** < 4GB

### Credentials
TikTok credentials được cấu hình trong n8n UI:
1. **Settings → Credentials → Add Credential**
2. Chọn **TikTok API**
3. Nhập Client ID, Client Secret
4. Authorize qua OAuth
