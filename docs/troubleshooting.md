# 🔧 Troubleshooting

## Container không khởi động

```bash
# Kiểm tra status
docker compose ps

# Xem logs
docker compose logs n8n

# Restart
docker compose restart n8n

# Nếu vẫn lỗi, rebuild
docker compose down
docker compose build --no-cache
docker compose up -d
```

## n8n API trả về "Invalid URL"

### Nguyên nhân
**Duy nhất do networking giữa các container.** n8n và MCP server chạy ở **2 container/docker-compose khác nhau** (khác Docker network). MCP container dùng `N8N_HOST=http://n8n:5678` nhưng hostname `n8n` chỉ resolve được trong cùng Docker network → MCP không tìm được n8n → "Invalid URL".

> [!IMPORTANT]
> Lỗi này **không liên quan** đến các issue khác như MCP crash (`--stdio`), lỗi 501, hay permission denied. Chỉ cần trỏ đúng IP/hostname của container n8n là fix được.

### Giải pháp

**Cách 1 (khuyên dùng): Đưa n8n và MCP chung 1 docker-compose** — cùng network, dùng hostname:

```yaml
# docker-compose.yml — n8n và n8n-mcp cùng file, cùng network
services:
  n8n:
    image: n8nio/n8n:latest
    ports:
      - "5678:5678"
    networks:
      - n8n_net

  n8n-mcp:
    build: ./n8n-custom-mcp
    environment:
      - N8N_HOST=http://n8n:5678   # ✅ resolve được vì cùng network
      - N8N_API_KEY=${N8N_API_KEY}
    networks:
      - n8n_net

networks:
  n8n_net:
    driver: bridge
```

**Cách 2: Nếu bắt buộc tách docker-compose** → trỏ đúng IP của container n8n:

```bash
# Tìm IP của container n8n
docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' <n8n-container-name>
```

```yaml
# MCP ở docker-compose khác — dùng IP container hoặc IP host
environment:
  - N8N_HOST=http://<n8n-container-ip>:5678   # IP lấy từ docker inspect
  # hoặc
  - N8N_HOST=http://172.17.0.1:5678           # Docker bridge gateway IP
  # hoặc
  - N8N_HOST=http://192.168.1.38:5678         # IP LAN của host
```

### Test nhanh
```bash
# Từ host
curl -s http://localhost:5678/api/v1/workflows \
  -H "X-N8N-API-KEY: $N8N_API_KEY"

# Từ trong MCP container (kiểm tra có gọi được n8n không)
docker exec <mcp-container> curl -s http://<n8n-ip>:5678/api/v1/workflows \
  -H "X-N8N-API-KEY: <api-key>"
# Kết quả mong đợi: {"data": [...], "nextCursor": null}
```

## MCP Server crash — "node: bad option: --stdio"

### Nguyên nhân
`docker-compose.yml` có `command: --stdio "node dist/index.js" ...` (supergateway syntax) nhưng image không cài supergateway.

### Giải pháp
**Xóa `command` block** — để Dockerfile's `CMD ["node", "dist/index.js"]` tự chạy. Thêm `MCP_TRANSPORT=sse`:

```yaml
# ❌ SAI — supergateway không được cài
command: >
  --stdio "node dist/index.js"
  --port 3000
  --outputTransport streamableHttp

# ✅ ĐÚNG — xóa command, thêm transport env
environment:
  - MCP_TRANSPORT=sse
```

## n8n-worker crash — "EACCES permission denied"

### Nguyên nhân
Worker cần quyền root để đọc shared `/home/node/.n8n`.

### Giải pháp
Thêm `user: root`:

```yaml
n8n-worker:
  image: n8nio/n8n:latest
  user: root           # ← thêm dòng này
  command: worker
```

## MCP "tools/call" trả về 501 Not Implemented

### Nguyên nhân
Hybrid POST `/mcp` handler chỉ xử lý `tools/list` và `initialize`, trả 501 cho `tools/call`.

### Giải pháp ✅ (ĐÃ FIX)
Đã rewrite handler trong `n8n-custom-mcp/src/index.ts` để route `tools/call` qua tất cả tool handlers (workflow, credential, validation, template, backup, node).

## execute_workflow — n8n không hỗ trợ execute trực tiếp

### Nguyên nhân
n8n Public API **không hỗ trợ** `POST /workflows/{id}/execute` — trả 405 trong mọi version. Đây là **thiết kế có chủ đích** của n8n (workflows chạy qua trigger, không phải API call).

### Giải pháp ✅ (ĐÃ FIX)
`executeWorkflow` đã được rewrite với **smart fallback** trong `n8n-api-service.ts`:

1. **Workflow có Webhook node** → tự activate + trigger webhook → chạy ngay lập tức
2. **Workflow không có Webhook** → activate workflow → chạy khi trigger fire (schedule, event...)

```bash
# Test execute — workflow có webhook → chạy ngay
curl -s -X POST http://localhost:3002/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call",
       "params":{"name":"execute_workflow","arguments":{"id":"<workflow-id>"}}}'
# Response: {"executionMethod":"webhook-trigger","result":{"status":200,"data":{"message":"Workflow was started"}}}

# Workflow không có webhook → activated
# Response: {"executionMethod":"activated","message":"Workflow activated. It will run when its trigger fires."}
```
```

## MCP "Authentication failed: unauthorized"

### Nguyên nhân
API key trong `.env` không khớp với n8n database (thường sau khi tạo database mới hoặc migrate).

### Giải pháp
1. Vào `http://localhost:5678` → Settings → API → Create API Key
2. Update `.env`:
   ```env
   N8N_API_KEY=<new-api-key>
   ```
3. Restart MCP:
   ```bash
   docker compose up -d --force-recreate n8n-mcp
   ```

## FFmpeg "Error loading shared library"

### Nguyên nhân
FFmpeg cần nhiều shared libraries. Nếu copy `/usr/lib/` vào n8n image, sẽ overwrite Node.js system libs → n8n crash.

### Giải pháp hiện tại
FFmpeg libs được isolate tại `/opt/ffmpeg-libs/`, wrapper scripts tự set `LD_LIBRARY_PATH`:

```bash
# Kiểm tra FFmpeg
docker exec n8n-mcp ffmpeg -version

# Nếu lỗi, rebuild
docker compose build --no-cache
docker compose up -d
```

## FFmpeg "No such file or directory" cho input file

File phải nằm trong `/files/`:
```bash
# Trên host
ls ./local-files/

# Trong container
docker exec n8n-mcp ls /files/
```

## Webhook không hoạt động

### 1. Kiểm tra workflow active
Vào n8n UI → Workflow → Toggle phải **ON** (xanh lá)

### 2. Test trực tiếp
```bash
curl -X POST http://localhost:5678/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}'
```

### 3. Re-register webhook
```
Toggle OFF → Save → Toggle ON
```

### 4. Kiểm tra biến môi trường
```yaml
WEBHOOK_URL: https://n8n.thetaphoa.store/  # Phải đúng domain
N8N_PROXY_HOPS: 1                          # > 0 nếu có proxy (nhưng sẽ ảnh hưởng API!)
```

## AI Agent timeout

### Triệu chứng
Webhook trả về timeout khi dùng AI Agent.

### Giải pháp
Webhook Response Mode = **"Immediately"**:

```
Webhook (Respond Immediately) → AI Agent → HTTP Request (gửi reply)
```

## PostgreSQL connection error

```bash
# Kiểm tra postgres running
docker compose ps postgres

# Kiểm tra .env
cat .env | grep POSTGRES

# Kiểm tra kết nối
docker exec n8n-postgres-1 pg_isready
```

## Wrong password khi login

### Nguyên nhân
Database mới (PostgreSQL) — không có user cũ.

### Reset password
```bash
# Hash password mới
HASH=$(docker exec n8n-mcp node -e "
const bcrypt = require('/usr/local/lib/node_modules/n8n/node_modules/.pnpm/bcryptjs@2.4.3/node_modules/bcryptjs');
console.log(bcrypt.hashSync('new-password', 10));
")

# Update trong DB
docker exec n8n-postgres-1 psql -U n8n -d n8n \
  -c "UPDATE \"user\" SET password = '$HASH' WHERE email = 'your@email.com';"
```

## Copy user/password từ n8n cũ sang mới

```bash
# Lấy password hash từ n8n cũ
docker exec <old-postgres> psql -U <user> -d <db> \
  -c "SELECT email, password FROM \"user\";"

# Update vào n8n mới
docker exec <new-postgres> psql -U <user> -d <db> \
  -c "UPDATE \"user\" SET email='email@example.com', password='<hash>' WHERE id='<user-id>';"
```

## Migration: Export/Import toàn bộ workflows

```bash
# Export từ n8n cũ (dùng CLI — không bị ảnh hưởng bởi lỗi Invalid URL)
docker exec <container> n8n export:workflow --all --output=/home/node/.n8n/backup.json

# Copy ra host
docker cp <container>:/home/node/.n8n/backup.json ./workflows-backup.json

# Import vào n8n mới
docker cp ./workflows-backup.json <new-container>:/home/node/.n8n/backup.json
docker exec <new-container> n8n import:workflow --input=/home/node/.n8n/backup.json
```

> **Tip:** Dùng `n8n export:workflow` CLI thay vì API vì CLI luôn hoạt động kể cả khi Public API bị lỗi.

## Copy data directories giữa các instance

```bash
# Cần root permission vì db_data thuộc postgres user
sudo cp -a /path/to/old/db_data /path/to/new/db_data
sudo cp -a /path/to/old/n8n_data /path/to/new/n8n_data
sudo cp -a /path/to/old/redis_data /path/to/new/redis_data

# Hoặc dùng Docker container tạm (không cần sudo)
docker run --rm \
  -v /path/to/old/db_data:/src \
  -v /path/to/new/db_data:/dst \
  alpine sh -c "cp -a /src/* /dst/"
```

> **Lưu ý:** Sau khi copy data, nếu n8n vẫn hiện "Setup owner" → kiểm tra `.env` có đúng `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` khớp với database hay không.

## Logs hữu ích

```bash
# Tất cả services
docker compose logs

# Follow real-time
docker compose logs -f n8n

# Chỉ errors
docker compose logs n8n 2>&1 | grep -i error

# Last 100 lines
docker compose logs n8n --tail 100

# MCP server logs
docker compose logs n8n-mcp --tail 50
```
