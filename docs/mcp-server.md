# 🤖 MCP Server (n8n-custom-mcp)

## Tổng quan

MCP (Model Context Protocol) server cho phép AI agents quản lý n8n workflows qua giao thức chuẩn. Hỗ trợ các AI platforms: OpenClaw, Claude Desktop, và bất kỳ client nào hỗ trợ MCP.

**URL:** `http://localhost:3002/mcp`
**Transport:** SSE/Hybrid (Streamable HTTP)
**Tools:** 31 tools

## Tools (31 tools)

### Workflow Management
| Tool | Mô tả |
|---|---|
| `list_workflows` | Liệt kê tất cả workflows |
| `get_workflow` | Lấy chi tiết 1 workflow |
| `create_workflow` | Tạo workflow mới |
| `update_workflow` | Cập nhật workflow |
| `delete_workflow` | Xoá workflow |
| `activate_workflow` | Bật/tắt workflow |
| `execute_workflow` | ⚠️ **Không hỗ trợ** — n8n Public API không cho phép execute trực tiếp |
| `trigger_webhook` | Kích hoạt workflow qua webhook (thay thế execute) |

### Executions
| Tool | Mô tả |
|---|---|
| `list_executions` | Xem lịch sử chạy |
| `get_execution` | Chi tiết 1 lần chạy |

### Credentials
| Tool | Mô tả |
|---|---|
| `list_credentials` | Liệt kê credentials |
| `create_credential` | Tạo credential mới |
| `update_credential` | Cập nhật credential |
| `delete_credential` | Xóa credential |
| `test_credential` | Test credential |
| `get_credential_schema` | Lấy schema của credential type |

### Validation
| Tool | Mô tả |
|---|---|
| `validate_workflow_structure` | Kiểm tra cấu trúc workflow |
| `validate_workflow_credentials` | Kiểm tra credentials hợp lệ |
| `validate_workflow_expressions` | Kiểm tra expressions |
| `lint_workflow` | Lint workflow |
| `suggest_workflow_improvements` | Gợi ý cải thiện |

### Templates & Backups
| Tool | Mô tả |
|---|---|
| `search_templates` | Tìm templates |
| `get_template_details` | Chi tiết template |
| `import_template` | Import template |
| `export_workflow_as_template` | Export workflow thành template |
| `backup_workflow` | Backup workflow |
| `list_workflow_backups` | Liệt kê backups |
| `restore_workflow` | Restore từ backup |
| `diff_workflow_versions` | So sánh versions |

### Nodes
| Tool | Mô tả |
|---|---|
| `list_node_types` | Liệt kê node types |
| `get_node_schema` | Lấy schema của node type |

## Cấu hình trong docker-compose

```yaml
n8n-mcp:
  build:
    context: ./n8n-custom-mcp    # MCP source nằm trong repo
  ports:
    - "3002:3000"
  environment:
    - N8N_HOST=http://n8n:5678    # Docker internal network
    - N8N_API_KEY=${N8N_API_KEY}  # Từ .env
    - MCP_TRANSPORT=sse           # SSE transport (không dùng supergateway)
```

> **Quan trọng:** KHÔNG dùng `command:` block với supergateway — image không cài supergateway. Để Dockerfile's `CMD ["node", "dist/index.js"]` tự chạy.

## Test MCP Server

```bash
# Kiểm tra server status
curl -s http://localhost:3002/
# → {"status":"running","transport":"sse/hybrid","tools_count":31,...}

# List tools (hybrid endpoint — không cần session)
curl -X POST http://localhost:3002/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

# List workflows
curl -X POST http://localhost:3002/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call",
       "params":{"name":"list_workflows","arguments":{}}}'

# Create workflow (LƯU Ý: phải có "settings": {})
curl -X POST http://localhost:3002/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call",
       "params":{"name":"create_workflow","arguments":{
         "name":"Test Workflow",
         "nodes":[{"name":"Manual Trigger","type":"n8n-nodes-base.manualTrigger",
                   "typeVersion":1,"position":[250,300]}],
         "connections":{},
         "settings":{}
       }}}'
```

## Tích hợp OpenClaw

OpenClaw kết nối MCP server qua **Skill system** bằng `curl` commands.

### Skill file

Đường dẫn: `openclaw_data/skills/n8n-mcp/SKILL.md`

Skill dạy AI agent cách:
1. Gọi POST `/mcp` với JSON-RPC body
2. Parse Server-Sent Events (SSE) responses (prefix `data:`)
3. Luôn thêm `"settings": {}` khi tạo/sửa workflow

### Bật skill

Trong OpenClaw config (`openclaw_data/openclaw.json`):
```json
{
  "skills": {
    "entries": {
      "n8n-mcp": { "enabled": true }
    }
  }
}
```

### Ví dụ sử dụng

Hỏi OpenClaw AI:
- "Liệt kê tất cả workflows trong n8n"
- "Tạo workflow mới gửi email hàng ngày"
- "Bật workflow Post Facebook"

## Troubleshooting

### MCP server crash loop — "node: bad option: --stdio"
Xóa `command:` block trong docker-compose. Xem [troubleshooting.md](./troubleshooting.md).

### MCP "unauthorized"
API key không khớp. Tạo key mới trong n8n Settings → API, update `.env`, restart MCP.

### MCP server không connect n8n

```bash
# Kiểm tra n8n API từ trong MCP container
docker exec n8n-n8n-mcp-1 sh -c 'curl -s http://n8n:5678/api/v1/workflows \
  -H "X-N8N-API-KEY: $N8N_API_KEY" | head -c 100'
```

### tools/call trả về 501 Not Implemented
Hybrid handler cần xử lý `tools/call`. Xem [troubleshooting.md](./troubleshooting.md).

### execute_workflow trả về "POST method not allowed"
n8n Public API không hỗ trợ execute. Dùng `trigger_webhook` hoặc `activate_workflow` thay thế.
