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

## Webhook không hoạt động

### Triệu chứng: Gửi request nhưng không nhận được response

**1. Kiểm tra workflow đã active:**
- Vào n8n UI → Workflow → Toggle phải **ON** (xanh lá)

**2. Kiểm tra webhook mode:**
- Production webhook: `https://n8n.thetaphoa.store/webhook/path`
- Test webhook: `https://n8n.thetaphoa.store/webhook-test/path` (chỉ hoạt động khi click "Listen for Test Event")

**3. Re-register webhook:**
```
Toggle OFF → Save → Toggle ON
```
Việc này sẽ đăng ký lại webhook.

**4. Kiểm tra reverse proxy:**
```bash
# Test trực tiếp (bypass proxy)
curl -X POST http://localhost:5678/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}'
```

**5. Kiểm tra biến môi trường:**
```yaml
WEBHOOK_URL: https://n8n.thetaphoa.store/  # Phải đúng domain
N8N_PROXY_HOPS: 1                          # Phải > 0 nếu có proxy
```

## AI Agent timeout

### Triệu chứng: Webhook trả về timeout khi dùng AI Agent

**Giải pháp:** Webhook Response Mode = **"Immediately"**

Workflow sẽ:
1. Nhận webhook → Trả 200 OK ngay lập tức
2. Tiếp tục xử lý AI Agent ở background
3. Trả kết quả qua API riêng (ví dụ: Telegram sendMessage, Zalo send reply)

```
Webhook (Respond Immediately) → AI Agent → HTTP Request (gửi reply)
```

## FFmpeg lỗi

### "ffmpeg: not found"
```bash
# Kiểm tra
docker exec n8n ffmpeg -version

# Nếu không có, rebuild image
docker compose build --no-cache
docker compose up -d
```

### "Permission denied"
Container phải chạy `user: root` (đã cấu hình trong docker-compose.yml).

### "No such file or directory"
File phải nằm trong `/files/`:
```bash
# Trên host
ls ./local-files/

# Trong container
docker exec n8n ls /files/
```

## Volume data bị mất

### Kiểm tra volume tồn tại:
```bash
docker volume ls | grep n8n
docker volume inspect n8n_data
```

### Nếu volume mất:
```bash
# Tạo lại
docker volume create n8n_data

# Restore từ backup (nếu có)
sudo tar -xzf n8n-backup-YYYYMMDD.tar.gz -C /
```

### Import lại workflows:
```bash
docker cp ./workflows/ n8n:/home/n8n/workflows/
docker exec n8n n8n import:workflow --input=/home/n8n/workflows/ --separate
```

## Community node không load

### Triệu chứng: TikTok node không hiện trong node list

```bash
# Vào container kiểm tra
docker exec -it n8n sh
ls /home/node/.n8n/node_modules/

# Cài lại
cd /home/node/.n8n
npm install n8n-nodes-social-tiktok
```

Restart n8n sau khi cài:
```bash
docker compose restart n8n
```

## n8n chạy chậm / high memory

```bash
# Kiểm tra resource usage
docker stats n8n

# Kiểm tra database size
docker exec n8n ls -lh /home/node/.n8n/database.sqlite
```

**Giải pháp:**
- Xóa execution history cũ: Settings → Executions → Prune
- Tắt workflow không dùng
- Tăng memory limit trong docker-compose:
```yaml
deploy:
  resources:
    limits:
      memory: 2G
```

## Logs hữu ích

```bash
# Tất cả logs
docker compose logs n8n

# Follow real-time
docker compose logs -f n8n

# Chỉ errors
docker compose logs n8n 2>&1 | grep -i error

# Last 100 lines
docker compose logs n8n --tail 100
```
