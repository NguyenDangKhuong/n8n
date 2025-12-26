#!/bin/bash

# Setup ngrok tunnel cho Postiz
# Yêu cầu: đã cài ngrok và auth token

set -e

echo "🌐 Setting up ngrok tunnel for Postiz..."
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok chưa được cài đặt!"
    echo ""
    echo "Cài đặt ngrok:"
    echo "1. Truy cập https://ngrok.com và tạo account miễn phí"
    echo "2. Download ngrok:"
    echo "   wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz"
    echo "   tar xvzf ngrok-v3-stable-linux-amd64.tgz"
    echo "   sudo mv ngrok /usr/local/bin/"
    echo "3. Setup auth token:"
    echo "   ngrok authtoken YOUR_TOKEN"
    echo ""
    exit 1
fi

echo "✅ ngrok đã cài đặt"
echo ""
echo "🚀 Starting ngrok tunnel on port 4200..."
echo ""
echo "QUAN TRỌNG:"
echo "1. Copy HTTPS URL từ ngrok (dạng https://abc123.ngrok-free.app)"
echo "2. Update file .env:"
echo "   POSTIZ_FRONTEND_URL=https://abc123.ngrok-free.app"
echo "   POSTIZ_BACKEND_URL=https://abc123.ngrok-free.app"
echo "3. Restart Postiz: docker compose restart postiz"
echo "4. Dùng URL này để setup TikTok Developer App redirect URI"
echo ""
echo "Press Ctrl+C to stop ngrok tunnel"
echo ""

# Start ngrok
ngrok http 4200
