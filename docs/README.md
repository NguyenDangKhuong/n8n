# 📚 N8N Documentation

Tài liệu dự án n8n - Workflow Automation tại `n8n.thetaphoa.store`.

## Mục lục

| Tài liệu | Mô tả |
|---|---|
| [Setup & Deployment](setup.md) | Hướng dẫn cài đặt, build Docker, deploy |
| [Docker & Infrastructure](docker.md) | Chi tiết Dockerfile, docker-compose, volumes, networks |
| [Workflows](workflows.md) | Danh sách và mô tả 16 workflows hiện tại |
| [FFmpeg Integration](ffmpeg.md) | Hướng dẫn sử dụng FFmpeg trong n8n |
| [TikTok Integration](tiktok.md) | Cài đặt community node TikTok, posting workflows |
| [Troubleshooting](troubleshooting.md) | Xử lý lỗi thường gặp |

## Tổng quan hệ thống

```
┌─────────────────────────────────────────────┐
│              n8n.thetaphoa.store             │
│              (Reverse Proxy)                │
├─────────────────────────────────────────────┤
│                                             │
│   n8n (port 5678)                           │
│   ├── Custom Docker Image (n8n + FFmpeg)    │
│   ├── Community Nodes: TikTok, Zalo         │
│   ├── Volume: n8n_data                      │
│   └── Local files: ./local-files → /files   │
│                                             │
│   MinIO S3 (port 9000/9001)                 │
│   └── s3.thetaphoa.store                    │
│                                             │
│   OpenClaw Gateway (port 18789-18790)       │
│   CLI Proxy API (multi-port)                │
│                                             │
└─────────────────────────────────────────────┘
```
