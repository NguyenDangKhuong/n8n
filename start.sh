#!/bin/bash

# Setup Postiz với n8n stack
# Script này sẽ:
# 1. Start tất cả services
# 2. Đợi Postiz khởi động
# 3. Show URLs để access

set -e

echo "🚀 Starting n8n + Postiz stack..."
echo ""

# Start all services
docker compose up -d

echo ""
echo "⏳ Đợi services khởi động (30 giây)..."
sleep 30

echo ""
echo "✅ Services đã start!"
echo ""
echo "📍 Access URLs:"
echo "   - n8n:      http://localhost:5678"
echo "   - Postiz:   http://localhost:4200"
echo ""
echo "🔐 n8n Login:"
echo "   - User:     admin"
echo "   - Password: changeme123"
echo ""
echo "💡 Next Steps:"
echo "   1. Truy cập Postiz tại http://localhost:4200"
echo "   2. Tạo account Postiz"
echo "   3. Chạy './setup-ngrok.sh' để expose Postiz ra internet"
echo "   4. Tạo TikTok Developer App"
echo "   5. Connect TikTok trong Postiz"
echo ""
echo "📊 Xem logs:"
echo "   docker compose logs -f"
echo ""
echo "🛑 Stop services:"
echo "   docker compose down"
echo ""
