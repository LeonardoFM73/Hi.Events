# 🚀 Xendit Mock API - Quick Reference

## ⚡ Quick Commands

### Start Mockoon (All-in-One)
```bash
cd docker/all-in-one
docker-compose up -d
```

### Start Mockoon (Standalone)
```bash
cd mockoon
docker-compose up -d
```

### Stop Mockoon
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f mockoon
```

### Restart Mockoon
```bash
docker-compose restart mockoon
```

### Test API
```bash
# Windows
.\test-api.ps1

# Linux/Mac
./test-api.sh
```

## 🔧 Environment Variables

```env
XENDIT_API_KEY=test_api_key
XENDIT_WEBHOOK_TOKEN=test_webhook_token
XENDIT_BASE_URL=http://mockoon:3000
```

## 📡 Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v2/invoices` | Create invoice |
| GET | `/v2/invoices/:id` | Get invoice |
| POST | `/invoices/:id/expire` | Expire invoice |
| GET | `/mock-payment/:id` | Payment page |

## 🧪 cURL Examples

### Create Invoice
```bash
curl -X POST http://localhost:3000/v2/invoices \
  -H "Content-Type: application/json" \
  -u test_api_key: \
  -d '{
    "external_id": "order_123",
    "amount": 100000,
    "payer_email": "test@example.com",
    "description": "Test payment",
    "currency": "IDR",
    "items": [{"name": "Ticket", "quantity": 1, "price": 100000}],
    "customer": {"given_names": "John Doe", "email": "test@example.com"}
  }'
```

### Get Invoice
```bash
curl http://localhost:3000/v2/invoices/{invoice_id} \
  -u test_api_key:
```

### Expire Invoice
```bash
curl -X POST http://localhost:3000/invoices/{invoice_id}/expire \
  -u test_api_key:
```

## 🌐 URLs

| Service | URL |
|---------|-----|
| Mockoon API | http://localhost:3000 |
| Payment Page | http://localhost:3000/mock-payment/{id} |
| Hi.Events | http://localhost:8123 |

## 🐛 Troubleshooting

### Cannot connect from backend
```env
# Use service name, not localhost
XENDIT_BASE_URL=http://mockoon:3000
```

### Port already in use
```yaml
# Change in docker-compose.yml
ports:
  - "3001:3000"
```

### Check health
```bash
curl http://localhost:3000/v2/invoices
docker inspect xendit-mockoon | grep Health
```

## 📝 File Locations

```
mockoon/
├── xendit-mock.json       # Config
├── docker-compose.yml     # Compose
├── test-api.sh           # Test (Bash)
└── test-api.ps1          # Test (PS)

docker/all-in-one/
└── docker-compose.yml     # Main compose

backend/config/
└── services.php          # Config
```

## 🎯 Common Tasks

### Switch to Production
```env
XENDIT_BASE_URL=https://api.xendit.co
XENDIT_API_KEY=your_real_api_key
```

### Change Port
```yaml
# docker-compose.yml
mockoon:
  ports:
    - "3001:3000"
```

### View All Containers
```bash
docker-compose ps
```

### Clean Up
```bash
docker-compose down -v
```

## 💡 Tips

- Use `test-api` scripts for quick testing
- Monitor logs with `docker-compose logs -f mockoon`
- Payment page URL: `http://localhost:3000/mock-payment/{id}`
- Mock accepts any API key

## 📚 Docs

- [README.md](README.md) - Full documentation
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Setup guide
- [SUMMARY.md](SUMMARY.md) - Complete summary

---

**Quick Help:** `docker-compose logs mockoon`
