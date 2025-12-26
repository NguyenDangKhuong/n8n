# 🚀 Quick Start: n8n + Postiz

## Đã Setup Xong ✅

Mình đã thêm Postiz vào docker-compose hiện tại của bạn!

### Services Bao Gồm:
- **n8n** - Port 5678 (như cũ)
- **Postiz** - Port 4200 (UI) & 3000 (API)
- **PostgreSQL** - Database cho Postiz
- **Redis** - Cache cho Postiz

---

## 🎯 Cách Sử Dụng

### Bước 1: Start Services

```bash
cd /home/khuong/Downloads/Source/n8n

# Cách 1: Dùng script (khuyến nghị)
chmod +x start.sh
./start.sh

# Cách 2: Thủ công
docker compose up -d
```

### Bước 2: Truy Cập

- **n8n**: http://localhost:5678
  - User: `admin`
  - Pass: `changeme123`

- **Postiz**: http://localhost:4200
  - Tạo account mới lần đầu

### Bước 3: Setup Ngrok (Để Connect TikTok)

```bash
# Install ngrok nếu chưa có
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar xvzf ngrok-v3-stable-linux-amd64.tgz
sudo mv ngrok /usr/local/bin/

# Lấy auth token từ ngrok.com (free)
ngrok authtoken YOUR_TOKEN_HERE

# Start tunnel
chmod +x setup-ngrok.sh
./setup-ngrok.sh
```

### Bước 4: Update .env với Ngrok URL

Sau khi chạy ngrok, copy HTTPS URL (vd: `https://abc123.ngrok-free.app`) và update trong `.env`:

```bash
POSTIZ_FRONTEND_URL=https://abc123.ngrok-free.app
POSTIZ_BACKEND_URL=https://abc123.ngrok-free.app
```

Restart Postiz:
```bash
docker compose restart postiz
```

### Bước 5: Setup TikTok Developer App

1. Truy cập https://developers.tiktok.com
2. Tạo app mới
3. Add scopes:
   - `user.info.basic`
   - `user.info.profile`
   - `video.create`
   - `video.publish`
   - `video.upload`
4. Redirect URI: `https://YOUR-NGROK-URL/integrations/social/tiktok`
5. Copy Client ID & Secret vào `.env`:
   ```bash
   TIKTOK_CLIENT_ID=your_client_id
   TIKTOK_CLIENT_SECRET=your_client_secret
   ```
6. Restart: `docker compose restart postiz`

### Bước 6: Connect TikTok trong Postiz

1. Login Postiz → Add Channel → TikTok
2. Authorize với TikTok account

### Bước 7: Setup n8n Integration

1. Trong n8n: Settings → Community Nodes
2. Install: `n8n-nodes-postiz`
3. Lấy API key từ Postiz: Settings → Public API
4. Add credential trong n8n với Postiz API key

---

## 📝 Useful Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# View logs của service cụ thể
docker compose logs -f postiz

# Restart 1 service
docker compose restart postiz

# Restart tất cả
docker compose restart

# Xóa tất cả (bao gồm data)
docker compose down -v
```

---

## 🔧 File Structure

```
/home/khuong/Downloads/Source/n8n/
├── docker-compose.yml    # Main compose file (đã update)
├── .env                  # Environment variables (đã update)
├── start.sh              # Helper script để start
├── setup-ngrok.sh        # Helper script cho ngrok
└── n8n-test-flow.json    # n8n workflow của bạn
```

---

## ⚠️ Important Notes

1. **Ngrok Free URL thay đổi mỗi 2h** - Phải update .env và TikTok app redirect URI
2. **Production**: Nên dùng domain thật hoặc Cloudflare Tunnel
3. **Security**: Đổi passwords trong .env trước khi production
4. **Data**: Volumes được persist, stop/start không mất data

---

## 🆘 Troubleshooting

**Postiz không start:**
```bash
docker compose logs postiz
```

**Database connection error:**
```bash
# Check postgres đã chạy chưa
docker compose ps postgres

# Restart postgres
docker compose restart postgres postiz
```

**Port conflict:**
- n8n port 5678
- Postiz ports 4200, 3000
- Postgres port 5432 (internal)
- Redis port 6379 (internal)

Nếu port bị conflict, đổi trong docker-compose.yml

---

## 📚 Next Steps

1. ✅ Start services
2. ✅ Setup ngrok
3. ✅ Tạo TikTok app
4. ✅ Connect TikTok
5. ✅ Install n8n-nodes-postiz
6. 🎯 Tạo workflow trong n8n!

---

Xem hướng dẫn đầy đủ tại: `postiz-n8n-tiktok-setup.md`
