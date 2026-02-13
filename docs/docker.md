# 🐳 Docker & Infrastructure

## 5 Services

| Service | Image | Port | Mô tả |
|---|---|---|---|
| `postgres` | postgres:16 | internal | Database chính |
| `redis` | redis:alpine | internal | Queue manager (Bull) |
| `n8n` | n8n-with-ffmpeg:latest | 5678 | n8n chính + FFmpeg |
| `n8n-worker` | n8n-with-ffmpeg:latest | - | Worker xử lý queue |
| `n8n-mcp` | n8n-custom-mcp | 3001 | MCP Server cho AI agents |

## Dockerfile (n8n + FFmpeg)

Custom image dựa trên `n8nio/n8n:latest`, thêm FFmpeg 6.1.2 với **isolated library approach**:

```dockerfile
# Stage 1: Get FFmpeg + dependencies từ Alpine
FROM alpine:3.22 AS ffmpeg-builder
RUN apk add --no-cache ffmpeg pulseaudio-dev alsa-lib-dev

# Stage 2: Copy FFmpeg vào n8n
FROM n8nio/n8n:latest
USER root

# Copy binaries
COPY --from=ffmpeg-builder /usr/bin/ffmpeg /usr/bin/ffmpeg
COPY --from=ffmpeg-builder /usr/bin/ffprobe /usr/bin/ffprobe

# Copy ALL shared libs vào thư mục riêng (KHÔNG overwrite system libs)
COPY --from=ffmpeg-builder /usr/lib/ /opt/ffmpeg-libs/

# Wrapper scripts với LD_LIBRARY_PATH
RUN mv /usr/bin/ffmpeg /usr/bin/ffmpeg.bin && \
    mv /usr/bin/ffprobe /usr/bin/ffprobe.bin && \
    printf '#!/bin/sh\nLD_LIBRARY_PATH=/opt/ffmpeg-libs:/opt/ffmpeg-libs/pulseaudio \
exec /usr/bin/ffmpeg.bin "$@"\n' > /usr/bin/ffmpeg && \
    chmod +x /usr/bin/ffmpeg && \
    printf '#!/bin/sh\nLD_LIBRARY_PATH=/opt/ffmpeg-libs:/opt/ffmpeg-libs/pulseaudio \
exec /usr/bin/ffprobe.bin "$@"\n' > /usr/bin/ffprobe && \
    chmod +x /usr/bin/ffprobe

USER node
```

### Tại sao dùng isolated library approach?

- n8n base image dùng **hardened Alpine** — không có `apk`, không thể cài package trực tiếp
- Copy `/usr/lib/` thẳng vào sẽ **overwrite Node.js system libs** → n8n crash với `Invalid URL`
- Giải pháp: copy tất cả lib vào `/opt/ffmpeg-libs/`, dùng `LD_LIBRARY_PATH` wrapper → FFmpeg tìm được lib mà không ảnh hưởng n8n

## docker-compose.yml

Xem file [docker-compose.yml](../docker-compose.yml) đầy đủ. Các điểm quan trọng:

### Execution mode: Queue

```yaml
- EXECUTIONS_MODE=queue
- QUEUE_BULL_REDIS_HOST=redis
```

- n8n main nhận webhook + UI
- n8n-worker xử lý workflow execution
- Redis làm message queue (Bull)

### Biến môi trường (từ .env)

| Biến | Mô tả |
|---|---|
| `POSTGRES_USER/PASSWORD/DB` | PostgreSQL credentials |
| `N8N_ENCRYPTION_KEY` | Mã hóa credentials trong DB |
| `WEBHOOK_URL` | URL gốc cho webhooks |
| `N8N_HOST` | Hostname hiển thị |
| `N8N_API_KEY` | API key cho MCP server |

### Biến môi trường (hardcoded)

| Biến | Giá trị | Mô tả |
|---|---|---|
| `GENERIC_TIMEZONE` | `Asia/Ho_Chi_Minh` | Timezone cho cron/schedule |
| `N8N_PROXY_HOPS` | `1` | Proxy hops (trust X-Forwarded) |
| `N8N_SKIP_WEBHOOK_AUTHENTICATION` | `true` | Bỏ xác thực webhook |
| `N8N_RUNNERS_ENABLED` | `true` | Bật task runner cho Code nodes |
| `N8N_DISABLE_PRODUCTION_MAIN_PROCESS` | `true` | Webhook chạy riêng |
| `N8N_SKIP_WEBHOOK_DEREGISTRATION_SHUTDOWN` | `true` | Giữ webhook khi restart |
| `N8N_RESTRICT_FILE_ACCESS_TO` | `/files/` | Giới hạn file access |
| `N8N_PUBLIC_API_DISABLED` | `false` | Bật public API |
| `N8N_SECURE_COOKIE` | `false` | Tắt secure cookie (HTTP nội bộ) |

## Volumes

| Thư mục host | Mount Point | Mô tả |
|---|---|---|
| `./n8n_data` | `/home/node/.n8n` | n8n settings, credentials |
| `./local-files` | `/files` | File chia sẻ host ↔ container |
| `./db_data` | `/var/lib/postgresql/data` | PostgreSQL data |
| `./redis_data` | `/data` | Redis data |

## Network

Tất cả services dùng network `n8n_mcp_net` (bridge):
- n8n → postgres:5432
- n8n → redis:6379
- n8n-mcp → n8n:5678 (internal)
- n8n-worker → postgres, redis

## Quản lý Docker

```bash
# Start tất cả
docker compose up -d

# Stop tất cả
docker compose down

# Restart n8n chính
docker compose restart n8n

# Logs
docker compose logs -f n8n          # Follow
docker compose logs n8n --tail 50   # Last 50

# Rebuild FFmpeg image
docker compose build --no-cache

# Exec vào container
docker exec -it n8n-mcp sh

# Kiểm tra FFmpeg
docker exec n8n-mcp ffmpeg -version
```
