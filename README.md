# n8n - Workflow Automation

Workflow automation platform for connecting apps and services.

## Quick Start

```bash
# Start n8n
docker compose up -d

# Stop n8n
docker compose down

# View logs
docker compose logs -f n8n

# Restart
docker compose restart n8n
```

## Access

**Web UI:**
```
Local:  http://localhost:5678
Public: https://n8n.thetaphoa.store
```

**No authentication** - Direct access

---

## Features

- **Workflow automation** - Connect 400+ apps
- **Webhooks** - Production webhooks always listening
- **AI Agents** - LLM integrations
- **Self-hosted** - Full data control
- **S3 Integration** - MinIO storage available

---

## Environment Variables

Current configuration:

```yaml
GENERIC_TIMEZONE: Asia/Ho_Chi_Minh
WEBHOOK_URL: https://n8n.thetaphoa.store/
N8N_PROTOCOL: https
N8N_HOST: n8n.thetaphoa.store
N8N_PROXY_HOPS: 1
N8N_SKIP_WEBHOOK_AUTHENTICATION: true
N8N_RUNNERS_ENABLED: true
N8N_DISABLE_PRODUCTION_MAIN_PROCESS: true
N8N_SKIP_WEBHOOK_DEREGISTRATION_SHUTDOWN: true
```

---

## Webhooks

### **Production Webhooks**

**Always listening when workflow is active.**

**URL Format:**
```
https://n8n.thetaphoa.store/webhook/your-path
```

**Setup:**
1. Create workflow
2. Add Webhook node
3. Set path (e.g., `telegram`)
4. Response Mode: **Immediately** (recommended)
5. Activate workflow (toggle ON)

**Test:**
```bash
curl -X POST https://n8n.thetaphoa.store/webhook/your-path \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}'
```

### **Test Webhooks**

**Only listen when "Listen for Test Event" is clicked.**

**URL Format:**
```
https://n8n.thetaphoa.store/webhook-test/your-path
```

---

## Integrations

### **Telegram Bot**

1. Create bot with @BotFather
2. Get bot token
3. n8n: Add Telegram Trigger node
4. Set webhook URL
5. Activate workflow

**Webhook auto-registers on activation.**

### **Zalo OA**

1. Create Zalo Official Account
2. Get app credentials
3. n8n: Add Webhook node
4. Configure Zalo webhook URL
5. Activate workflow

### **MinIO S3 Storage**

**Upload files to MinIO:**

```
HTTP Request node:
  Method: PUT
  URL: https://s3.thetaphoa.store/bucket/file.jpg
  Authentication: AWS S3
  Access Key: admin
  Secret Key: changeme123
```

**Download files:**
```
HTTP Request node:
  Method: GET
  URL: https://s3.thetaphoa.store/bucket/file.jpg
```

---

## Backup Workflows

**Export all workflows:**

n8n UI → Settings → Import/Export → Export all workflows

**Backup database:**
```bash
# Data location
docker volume inspect n8n_n8n_data

# Backup
sudo tar -czf n8n-backup-$(date +%Y%m%d).tar.gz \
  /var/lib/docker/volumes/n8n_n8n_data/_data
```

---

## Troubleshooting

### **Webhook not responding:**

1. **Check workflow active:**
   - Toggle must be ON (green)

2. **Check webhook mode:**
   - Must be **Production** (not Test)

3. **Deactivate/Activate:**
   - Toggle OFF → Save → Toggle ON
   - This re-registers webhooks

4. **Check logs:**
   ```bash
   docker compose logs n8n --tail 50
   ```

### **AI Agent timeout:**

AI Agents can take time. Webhook timeout is handled by:
- Response Mode: **Immediately** (returns 200 OK right away)
- Workflow continues in background
- Reply via API (e.g., Telegram sendMessage)

### **Container not starting:**

```bash
# Check status
docker compose ps

# View logs
docker compose logs n8n

# Restart
docker compose restart n8n
```

---

## Advanced

### **Custom Functions**

Use Code node (JavaScript):
```javascript
// Access webhook data
const data = $input.all();

// Process
const result = data.map(item => ({
  name: item.json.name,
  processed: true
}));

return result;
```

### **Environment Variables**

Edit `docker-compose.yml` to add:
```yaml
environment:
  - YOUR_VAR=value
```

Restart after changes:
```bash
docker compose down && docker compose up -d
```

---

## Resources

- **Docs:** https://docs.n8n.io/
- **Workflows:** https://n8n.io/workflows/
- **Community:** https://community.n8n.io/
- **GitHub:** https://github.com/n8n-io/n8n

---

## Related Services

**Running on same VM:**
- **MinIO S3:** https://minio.thetaphoa.store (file storage)

**Other services:**
- **NAS:** https://nas.thetaphoa.store
- **ESXi:** https://server.thetaphoa.store

---

## Version

**Current:** n8n latest (v2.1.4+)

**Update:**
```bash
docker compose pull
docker compose up -d
```

**Note:** Database auto-migrates on update.
