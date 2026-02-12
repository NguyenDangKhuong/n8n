# 📋 Workflows

Danh sách 16 workflows đã export (folder `/workflows/`).

## Workflows Active (đang chạy)

### 1. Post Facebook (`Post_Facebook.json`)
- **Trigger:** Schedule (cron) + Manual
- **Chức năng:** Tự động đăng bài lên Facebook
- **Nodes chính:** Schedule Trigger → HTTP Request → Split Out → Facebook Graph API
- **Flow:** Lấy nội dung → Chia batch → Đăng lên Facebook page

### 2. Zalo Bot (`Zalo_bot.json`)
- **Trigger:** Webhook
- **Chức năng:** Chatbot Zalo OA tích hợp AI
- **Nodes chính:** Webhook → HTTP Request → AI Agent (OpenAI)
- **Flow:** Nhận tin nhắn từ Zalo OA → Xử lý bằng AI Agent → Trả lời

---

## Workflows TikTok

### 3. Tiktok Post (`Tiktok_post.json`)
- **Trigger:** TikTok Trigger (community node)
- **Chức năng:** Đăng video lên TikTok
- **Nodes chính:** TikTok Trigger → Google Drive → TikTok Upload → TikTok Send
- **Community node:** `n8n-nodes-social-tiktok`

### 4. Tiktok menamine2 - sạc rtt (`Tiktok_menamine2_-_sc_rtt.json`)
- **Trigger:** Manual
- **Chức năng:** Tạo và đăng video TikTok cho sản phẩm "sạc rtt"
- **Nodes chính:** HTTP Request → If conditions → Wait → Split In Batches → Read/Write File

### 5. Tiktok menamine2 - khẩu trang 9a (`Tiktok_menamine2_-_khu_trang_9a.json`)
- **Trigger:** Manual
- **Chức năng:** Tạo và đăng video TikTok cho sản phẩm "khẩu trang 9a"
- **Flow tương tự:** workflow sạc rtt

### 6. Tiktok menamine2 - đèn hoàng hôn (`Tiktok_menamine2_-_n_hong_hn.json`)
- **Trigger:** Manual
- **Chức năng:** Tạo và đăng video TikTok cho sản phẩm "đèn hoàng hôn"
- **Flow tương tự:** workflow sạc rtt

---

## Workflows AI Video Generation

### 7. Generate AI Viral Videos with VEO 3 and Upload to TikTok (`_Generate_AI_Viral_Videos_with_VEO_3_and_Upload_to_TikTok_.json`)
- **Trigger:** Schedule
- **Chức năng:** Tự động tạo video AI bằng VEO 3, upload lên TikTok
- **Nodes chính:** Schedule → AI Agent (OpenAI) → Google Sheets → HTTP Requests
- **AI:** Sử dụng OpenAI để generate nội dung, VEO 3 để tạo video

### 8. Generate AI viral videos with NanoBanana & VEO3 (`_Generate_AI_viral_videos_with_NanoBanana__VEO3_shared_on_socials_via_Blotato_-_vide.json`)
- **Trigger:** Không rõ (template workflow)
- **Chức năng:** Tạo video AI bằng NanoBanana + VEO3, share lên mạng xã hội via Blotato
- **Nodes chính:** Google Sheets → Blotato nodes → Merge

### 9. nanoai.pics pass captcha text to video 3.1 (`nanoaipics_pass_captcha_text_to_video_31_update_2612.json`)
- **Trigger:** Manual
- **Chức năng:** Tạo video bằng nanoai.pics API, xử lý captcha
- **Nodes chính:** HTTP Request → Wait → Set → Merge → HTTP Request
- **Cập nhật:** 26/12/2025

---

## Workflows Utility

### 10. Download video TikTok no watermark (`Download_video_tiktok_no_watermark_-_Share_Free.json`)
- **Chức năng:** Tải video TikTok không watermark
- **Nodes chính:** HTTP Request → Code → Google Drive
- **Flow:** Nhận URL → Gọi API download → Lưu vào Google Drive

### 11. Zalo Bot (v1) (`Zalo_bot_1.json`)
- **Chức năng:** Phiên bản cũ của Zalo Bot
- **Ghi chú:** Backup version

---

## Workflows Test / Development

### 12. Khuong (`Khuong.json`)
- **Trigger:** Webhook
- **Chức năng:** Workflow chính đang phát triển
- **Nodes chính:** Webhook → HTTP Requests → AI Agent (Gemini + OpenAI)

### 13. Khuong test (`Khuong_test.json`)
- **Trigger:** Manual + Webhook
- **Chức năng:** Workflow test tính năng mới

### 14. My workflow 2 (`My_workflow_2.json`)
- **Trigger:** Form Trigger
- **Chức năng:** Workflow test với Form và LLM Chain

### 15. My workflow 1288 (`My_workflow_1288.json`)
- **Trigger:** Zalo Login QR
- **Chức năng:** Workflow liên quan Zalo + Google Drive + Postgres
- **Nodes đặc biệt:** `n8n-nodes-zalos-user.zaloLoginByQr`

### 16. Demo: My first AI Agent in n8n (`Demo_My_first_AI_Agent_in_n8n.json`)
- **Trigger:** Chat Trigger
- **Chức năng:** Demo AI Agent cơ bản
- **Nodes chính:** Chat Trigger → OpenAI Chat Model → AI Agent

---

## Import Workflow

Để import workflow vào n8n:

**Cách 1 - Qua UI:**
1. Mở n8n → **Workflows** → **Import from File**
2. Chọn file JSON từ folder `workflows/`

**Cách 2 - Qua CLI:**
```bash
docker exec n8n n8n import:workflow --input=/path/to/workflow.json
```

**Cách 3 - Import tất cả:**
```bash
docker cp ./workflows/ n8n:/home/n8n/workflows/
docker exec n8n n8n import:workflow --input=/home/n8n/workflows/ --separate
```
