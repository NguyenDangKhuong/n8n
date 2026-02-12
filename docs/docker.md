# 🐳 Docker & Infrastructure

## Dockerfile

Custom image dựa trên `n8nio/n8n:latest`, thêm FFmpeg để xử lý video:

```dockerfile
# Stage 1: Build FFmpeg trong Alpine
FROM alpine:latest AS ffmpeg-builder
RUN apk add --no-cache ffmpeg

# Stage 2: Copy FFmpeg vào n8n
FROM n8nio/n8n:latest
USER root
COPY --from=ffmpeg-builder /usr/bin/ffmpeg /usr/bin/ffmpeg
COPY --from=ffmpeg-builder /usr/bin/ffprobe /usr/bin/ffprobe
COPY --from=ffmpeg-builder /lib /lib
COPY --from=ffmpeg-builder /usr/lib /usr/lib
USER node
```

**Tại sao cần multi-stage build?**
- n8n base image dựa trên Alpine nhưng không có FFmpeg
- Stage 1: cài FFmpeg trong Alpine sạch
- Stage 2: chỉ copy binary FFmpeg sang n8n → image nhỏ hơn

## docker-compose.yml

```yaml
version: '3.8'

services:
  n8n:
    build:
      context: .
      dockerfile: Dockerfile
    image: n8n-with-ffmpeg:latest
    container_name: n8n
    user: root
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_USER_FOLDER=/home/node
      - GENERIC_TIMEZONE=Asia/Ho_Chi_Minh
      - WEBHOOK_URL=https://n8n.thetaphoa.store/
      - N8N_PROTOCOL=https
      - N8N_HOST=n8n.thetaphoa.store
      - N8N_PROXY_HOPS=1
      - N8N_SKIP_WEBHOOK_AUTHENTICATION=true
      - N8N_RUNNERS_ENABLED=true
      - N8N_DISABLE_PRODUCTION_MAIN_PROCESS=true
      - N8N_SKIP_WEBHOOK_DEREGISTRATION_SHUTDOWN=true
      - NODES_EXCLUDE=[]
      - N8N_RESTRICT_FILE_ACCESS_TO=/files/
    volumes:
      - n8n_data:/home/node/.n8n
      - ./local-files:/files
    networks:
      - n8n_network

networks:
  n8n_network:
    driver: bridge

volumes:
  n8n_data:
    external: true
    name: n8n_data
```

## Giải thích Environment Variables

| Biến | Giá trị | Mô tả |
|---|---|---|
| `GENERIC_TIMEZONE` | `Asia/Ho_Chi_Minh` | Timezone cho cron/schedule |
| `WEBHOOK_URL` | `https://n8n.thetaphoa.store/` | URL gốc cho webhooks |
| `N8N_PROTOCOL` | `https` | Protocol khi chạy sau proxy |
| `N8N_HOST` | `n8n.thetaphoa.store` | Hostname |
| `N8N_PROXY_HOPS` | `1` | Số proxy hops (cho trust X-Forwarded headers) |
| `N8N_SKIP_WEBHOOK_AUTHENTICATION` | `true` | Bỏ xác thực webhook |
| `N8N_RUNNERS_ENABLED` | `true` | Bật task runner cho Code nodes |
| `N8N_DISABLE_PRODUCTION_MAIN_PROCESS` | `true` | Webhook chạy riêng khỏi main |
| `N8N_SKIP_WEBHOOK_DEREGISTRATION_SHUTDOWN` | `true` | Giữ webhook khi restart |
| `N8N_RESTRICT_FILE_ACCESS_TO` | `/files/` | Giới hạn truy cập file system |

## Volumes

| Volume | Mount Point | Mô tả |
|---|---|---|
| `n8n_data` | `/home/node/.n8n` | Database SQLite, credentials, workflows |
| `./local-files` | `/files` | Thư mục chia sẻ file giữa host và container |

> **Quan trọng:** Volume `n8n_data` là `external: true` — phải tạo trước bằng `docker volume create n8n_data`.

## Quản lý Docker

```bash
# Start
docker compose up -d

# Stop
docker compose down

# Restart
docker compose restart n8n

# Logs (follow)
docker compose logs -f n8n

# Logs (last 50 lines)
docker compose logs n8n --tail 50

# Rebuild image
docker compose build --no-cache

# Exec vào container
docker exec -it n8n sh

# Kiểm tra FFmpeg
docker exec n8n ffmpeg -version
```

## Các services khác trên cùng server

| Service | Container | Port | Mô tả |
|---|---|---|---|
| MinIO S3 | `minio` | 9000 (API), 9001 (Console) | Object storage |
| Nginx S3 | `nginx-s3` | 9002 | Proxy cho MinIO |
| OpenClaw | `openclaw-gateway` | 18789-18790 | OpenClaw gateway |
| CLI Proxy | `cli-proxy-api` | 1455, 8085, 8317... | CLI proxy API |
