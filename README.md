# n8n + Postiz Stack

Stack automation với n8n và Postiz để schedule posts lên TikTok và các social media platforms khác.

## 🚀 Features

- **n8n** - Workflow automation platform
- **Postiz** - Open-source social media management (schedule TikTok, Instagram, Facebook, etc.)
- **PostgreSQL** - Database cho Postiz
- **Redis** - Cache cho Postiz
- **Docker Compose** - Tất cả services trong 1 stack

## 📋 Requirements

- Docker & Docker Compose
- Ngrok account (free) - Để expose Postiz ra internet cho TikTok OAuth
- TikTok Developer Account (free)

## 🎯 Quick Start

### 1. Clone & Setup

```bash
git clone https://github.com/YOUR_USERNAME/n8n-postiz-stack.git
cd n8n-postiz-stack

# Copy .env.example thành .env
cp .env.example .env

# Edit .env và điền credentials
nano .env
```

### 2. Start Services

```bash
# Dùng helper script
chmod +x start.sh
./start.sh

# Hoặc manual
docker compose up -d
```

### 3. Access Services

- **n8n**: http://localhost:5678
  - Default user: `admin`
  - Default password: `changeme123` (đổi trong .env)
  
- **Postiz**: http://localhost:4200
  - Tạo account mới lần đầu

### 4. Setup Ngrok (Cho TikTok Integration)

```bash
# Install ngrok
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar xvzf ngrok-v3-stable-linux-amd64.tgz
sudo mv ngrok /usr/local/bin/

# Auth với ngrok (lấy token từ ngrok.com)
ngrok authtoken YOUR_TOKEN

# Start tunnel
./setup-ngrok.sh
```

### 5. Configure TikTok

Xem hướng dẫn chi tiết trong [README-POSTIZ.md](README-POSTIZ.md)

## 📚 Documentation

- [README-POSTIZ.md](README-POSTIZ.md) - Hướng dẫn chi tiết setup Postiz
- [postiz-n8n-tiktok-setup.md](.gemini/antigravity/brain/.../postiz-n8n-tiktok-setup.md) - Full documentation

## 🔧 Useful Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# Restart specific service
docker compose restart postiz
```

## ⚠️ Security Notes

- **KHÔNG** commit file `.env` lên GitHub (đã add vào .gitignore)
- File `.env.example` là template, không chứa credentials thật
- Đổi default passwords trước khi deploy production
- JWT_SECRET cần random string tối thiểu 32 ký tự

## 📂 Project Structure

```
.
├── docker-compose.yml       # Main compose file
├── .env                     # Environment variables (KHÔNG commit)
├── .env.example            # Template cho .env
├── start.sh                # Helper script start services
├── setup-ngrok.sh          # Helper script ngrok tunnel
├── README.md               # This file
├── README-POSTIZ.md        # Postiz setup guide
└── n8n-test-flow.json      # Example n8n workflow
```

## 🆘 Troubleshooting

### Services không start:
```bash
docker compose logs [service-name]
```

### Reset tất cả:
```bash
docker compose down -v  # ⚠️ Xóa hết data
docker compose up -d
```

### Port conflicts:
Đổi ports trong `docker-compose.yml` nếu có conflict

## 📝 License

MIT

## 🤝 Contributing

Feel free to open issues or PRs!

## 📧 Contact

Your Name - your.email@example.com
