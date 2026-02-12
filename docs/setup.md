# ⚙️ Setup & Deployment

## Yêu cầu

- Docker & Docker Compose
- Domain: `n8n.thetaphoa.store` (trỏ về server)
- Reverse proxy (Nginx/Caddy) cho HTTPS

## Cài đặt nhanh

### 1. Clone repo

```bash
git clone <repo-url>
cd n8n
```

### 2. Tạo volume (lần đầu)

```bash
docker volume create n8n_data
```

### 3. Build & Start

```bash
# Build custom image (n8n + FFmpeg)
docker compose build

# Start
docker compose up -d

# Kiểm tra
docker compose ps
```

### 4. Truy cập

```
Local:  http://localhost:5678
Public: https://n8n.thetaphoa.store
```

> **Note:** Hệ thống hiện cấu hình `N8N_SKIP_WEBHOOK_AUTHENTICATION=true` — không cần đăng nhập.

## Cập nhật n8n

```bash
# Pull image mới
docker compose build --pull --no-cache

# Restart
docker compose down && docker compose up -d
```

Database tự động migrate khi cập nhật version.

## Cấu hình Domain & HTTPS

n8n chạy sau reverse proxy. Cấu hình Nginx mẫu:

```nginx
server {
    listen 443 ssl;
    server_name n8n.thetaphoa.store;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        chunked_transfer_encoding off;
        proxy_buffering off;
        proxy_cache off;
    }
}
```

Các biến môi trường quan trọng cho reverse proxy:

```yaml
N8N_PROTOCOL: https
N8N_HOST: n8n.thetaphoa.store
N8N_PROXY_HOPS: 1  # Số lượng proxy trước n8n
WEBHOOK_URL: https://n8n.thetaphoa.store/
```

## Backup & Restore

### Export workflows (CLI)

```bash
# Export tất cả workflows thành file riêng
docker exec n8n n8n export:workflow --backup --output=/home/n8n/workflows/

# Copy ra host
docker cp n8n:/home/n8n/workflows/ ./workflows/
```

### Backup volume data

```bash
sudo tar -czf n8n-backup-$(date +%Y%m%d).tar.gz \
  /var/lib/docker/volumes/n8n_data/_data
```

### Restore workflows

```bash
# Import từ file
docker cp ./workflows/ n8n:/home/n8n/workflows/
docker exec n8n n8n import:workflow --input=/home/n8n/workflows/
```

Hoặc import qua n8n UI: **Settings → Import/Export → Import from File**.
