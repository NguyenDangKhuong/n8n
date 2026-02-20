# ⚙️ Setup & Deployment

## Yêu cầu

- Docker & Docker Compose
- Domain: `n8n.thetaphoa.store` (trỏ về server)
- Reverse proxy (Nginx/Caddy) cho HTTPS
- Project `n8n-custom-mcp` clone cùng thư mục cha

## Cấu trúc thư mục

```
Source/
├── n8n/                    # Project chính (git repo)
│   ├── .env                # Biến môi trường (secrets) — KHÔNG commit
│   ├── docker-compose.yml
│   ├── Dockerfile          # Custom n8n + FFmpeg
│   ├── n8n-custom-mcp/     # MCP Server source code
│   ├── docs/
│   ├── workflows/          # Backup workflow JSON files
│   ├── local-files/        # File chia sẻ với container (/files)
│   ├── n8n_data/           # n8n data — KHÔNG commit
│   ├── db_data/            # PostgreSQL data — KHÔNG commit
│   └── redis_data/         # Redis data — KHÔNG commit
└── openclaw_data/          # OpenClaw config + skills
```

## Cài đặt

### 1. Clone repo

```bash
git clone https://github.com/NguyenDangKhuong/n8n.git
cd n8n
# n8n-custom-mcp/ đã nằm bên trong repo
```

### 2. Tạo file `.env`

```env
POSTGRES_USER=n8n
POSTGRES_PASSWORD=<your-password>
POSTGRES_DB=n8n
N8N_ENCRYPTION_KEY=<random-key>
N8N_HOST=n8n.thetaphoa.store
WEBHOOK_URL=https://n8n.thetaphoa.store
N8N_API_KEY=<n8n-api-key>
```

> **Lấy N8N_API_KEY:** Sau khi n8n chạy, vào Settings → API → Create API Key.

### 3. Build & Start

```bash
# Build custom image (n8n + FFmpeg) và start tất cả services
docker compose up -d --build

# Kiểm tra
docker compose ps
```

### 4. Truy cập

```
n8n UI:   http://localhost:5678
MCP API:  http://localhost:3002/mcp
Public:   https://n8n.thetaphoa.store (nếu có reverse proxy)
```

### 5. Cấu hình MCP cho OpenClaw

MCP server chạy trên port **3002** với SSE/hybrid transport. OpenClaw gọi qua:

```
POST http://172.17.0.1:3002/mcp
Content-Type: application/json
Accept: application/json, text/event-stream
```

SKILL file OpenClaw: `openclaw_data/skills/n8n-mcp/SKILL.md`

**Lưu ý quan trọng:**
- MCP connect n8n bằng Docker internal hostname: `http://n8n:5678`
- Nếu đổi API key → phải restart MCP: `docker compose up -d --force-recreate n8n-mcp`
- n8n Public API KHÔNG hỗ trợ execute workflow → dùng `trigger_webhook` hoặc `activate_workflow`

## Cập nhật n8n

```bash
# Pull image mới + rebuild
docker compose build --pull --no-cache

# Restart
docker compose down && docker compose up -d
```

Database PostgreSQL tự động migrate khi cập nhật version.

## Cấu hình Domain & HTTPS

n8n chạy sau reverse proxy (HTTP nội bộ). Cấu hình Nginx mẫu:

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

> **Quan trọng:** KHÔNG set `N8N_PROTOCOL=https` trong docker-compose. n8n phải chạy HTTP nội bộ, HTTPS do reverse proxy xử lý. Nếu set `N8N_PROTOCOL=https`, n8n sẽ reject API calls với lỗi `Invalid URL`.

## Backup & Restore

### Export workflows (CLI — khuyến nghị)

```bash
# Export TẤT CẢ workflows — CLI luôn hoạt động, không bị ảnh hưởng bởi lỗi API
docker exec n8n n8n export:workflow --all --output=/home/node/.n8n/backup.json
docker cp n8n:/home/node/.n8n/backup.json ./workflows-backup.json
```

### Export workflows (API)

```bash
curl -s http://localhost:5678/api/v1/workflows \
  -H "X-N8N-API-KEY: $N8N_API_KEY" | python3 -m json.tool > workflows-backup.json
```

### Import workflows (CLI)

```bash
docker cp ./workflows-backup.json n8n:/home/node/.n8n/backup.json
docker exec n8n n8n import:workflow --input=/home/node/.n8n/backup.json
```

### Backup thư mục data

```bash
tar -czf n8n-backup-$(date +%Y%m%d).tar.gz n8n_data/ db_data/ redis_data/
```

Hoặc import qua n8n UI: **Settings → Import/Export → Import from File**.
