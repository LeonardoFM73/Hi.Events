# Xendit Integration - Docker All-in-One Deployment Guide

## 📦 Prerequisites

- Docker & Docker Compose installed
- Xendit account with API credentials
- Git repository cloned

## 🚀 Quick Deploy Steps

### Step 1: Prepare Environment File

```bash
# Navigate to docker all-in-one directory
cd docker/all-in-one

# Copy environment template
cp .env.example .env

# Edit .env file
nano .env
```

### Step 2: Configure Xendit Credentials

Edit `docker/all-in-one/.env` dan isi:

```env
# Xendit settings
XENDIT_API_KEY=xnd_development_xxxxx
XENDIT_WEBHOOK_TOKEN=webhook_token_xxxxx
```

**Dapatkan credentials dari:**
1. Login ke https://dashboard.xendit.co
2. Settings → API Keys → Copy Secret API Key
3. Settings → Webhooks → Copy Webhook Token

### Step 3: Configure Other Required Variables

Pastikan juga isi variables penting di `.env`:

```env
# Application
APP_KEY=base64:xxxxx  # Generate dengan: php artisan key:generate
JWT_SECRET=xxxxx      # Generate dengan: php artisan jwt:secret

# Frontend URLs
VITE_FRONTEND_URL=http://localhost:8123
VITE_API_URL_CLIENT=http://localhost:8123/api
VITE_API_URL_SERVER=http://localhost:80/api

# Database (default sudah OK)
POSTGRES_DB=hi-events
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secret

# Stripe (optional, untuk testing)
STRIPE_PUBLIC_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### Step 4: Start Docker Containers

```bash
# From docker/all-in-one directory
docker-compose up -d

# Check status
docker-compose ps
```

Expected output:
```
NAME                COMMAND             STATUS
all-in-one          /startup.sh         Up (healthy)
postgres            postgres            Up (healthy)
redis               redis-server        Up (healthy)
```

### Step 5: Run Database Migrations

```bash
# Run migrations
docker-compose exec all-in-one php artisan migrate

# Seed data (optional)
docker-compose exec all-in-one php artisan db:seed
```

### Step 6: Verify Setup

```bash
# Check if application is running
curl http://localhost:8123

# Check API endpoint
curl http://localhost:8123/api/health

# Check database
docker-compose exec postgres psql -U postgres -d hi-events -c "SELECT * FROM xendit_payments;"
```

## 🔧 Configuration Details

### Environment Variables Passed to Container

```yaml
# From docker-compose.yml
environment:
  - XENDIT_API_KEY=${XENDIT_API_KEY}
  - XENDIT_WEBHOOK_TOKEN=${XENDIT_WEBHOOK_TOKEN}
  - DATABASE_URL=postgresql://postgres:secret@postgres:5432/hi-events
  - REDIS_HOST=redis
  - STRIPE_PUBLIC_KEY=${STRIPE_PUBLIC_KEY}
  - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
  # ... other variables
```

### Database Schema

Migration akan membuat:
- `xendit_payments` table
- Indexes untuk performance
- Foreign keys untuk data integrity

### Redis Configuration

- Host: `redis` (internal Docker network)
- Port: `6379`
- Password: (empty)
- Used for: Cache, queue, sessions

### PostgreSQL Configuration

- Host: `postgres` (internal Docker network)
- Port: `5432`
- Database: `hi-events`
- User: `postgres`
- Password: `secret`

## 🌐 Access Application

### Frontend
```
http://localhost:8123
```

### API
```
http://localhost:8123/api
```

### Webhook Endpoint
```
http://localhost:8123/api/webhooks/xendit
```

## 🔗 Setup Webhook in Xendit Dashboard

1. Login ke https://dashboard.xendit.co
2. Settings → Webhooks → Add Webhook
3. Configure:
   - **URL**: `https://your-domain.com/api/webhooks/xendit`
   - **Events**: 
     - ✅ invoice.paid
     - ✅ invoice.expired
     - ✅ invoice.failed
   - **Token**: Paste your XENDIT_WEBHOOK_TOKEN
4. Save

**For Local Testing:**
- Use ngrok atau similar untuk expose localhost ke internet
- Example: `ngrok http 8123`
- Update webhook URL dengan ngrok URL

## 🧪 Test Payment Flow

### 1. Create Test Event

```bash
# Access frontend
http://localhost:8123

# Create event through UI
# Or via API:
curl -X POST http://localhost:8123/api/events \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Event",
    "description": "Test Xendit Payment",
    "start_date": "2025-12-15",
    "end_date": "2025-12-16"
  }'
```

### 2. Create Test Product

```bash
curl -X POST http://localhost:8123/api/events/{event_id}/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Ticket",
    "description": "Test ticket for Xendit",
    "price": 100000,
    "quantity": 100
  }'
```

### 3. Create Order

```bash
curl -X POST http://localhost:8123/api/events/{event_id}/order \
  -H "Content-Type: application/json" \
  -d '{
    "products": [{"product_id": 1, "quantities": [{"price_id": 1, "quantity": 1}]}],
    "promo_code": null
  }'
```

### 4. Create Xendit Invoice

```bash
curl -X POST http://localhost:8123/api/events/{event_id}/order/{order_short_id}/xendit/invoice \
  -H "Content-Type: application/json"
```

Response:
```json
{
  "invoice_id": "xendit_invoice_id",
  "external_id": "order_xxx_timestamp",
  "invoice_url": "https://xendit.co/web/...",
  "amount": 100000
}
```

### 5. Simulate Webhook (for local testing)

```bash
curl -X POST http://localhost:8123/api/webhooks/xendit \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "invoice.paid",
    "data": {
      "id": "xendit_invoice_id",
      "external_id": "order_xxx_timestamp",
      "status": "PAID",
      "amount": 100000,
      "paid_at": "2025-12-02T10:00:00Z"
    }
  }'
```

### 6. Verify Order Status

```bash
curl http://localhost:8123/api/events/{event_id}/order/{order_short_id}
```

Expected: `"status": "COMPLETED"`, `"payment_status": "PAYMENT_RECEIVED"`

## 📊 Monitoring

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f all-in-one

# Filter for Xendit
docker-compose logs -f all-in-one | grep -i xendit
```

### Database Queries

```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d hi-events

# Check xendit_payments
SELECT * FROM xendit_payments;

# Check orders
SELECT id, status, payment_status FROM orders;

# Check attendees
SELECT id, status FROM attendees;
```

### Redis Monitoring

```bash
# Connect to Redis
docker-compose exec redis redis-cli

# Check keys
KEYS *

# Check cache
GET xendit_payment_handled_*
```

## 🛑 Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs all-in-one

# Check if port is in use
lsof -i :8123

# Rebuild image
docker-compose build --no-cache
```

### Database connection error

```bash
# Check database is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Verify connection
docker-compose exec postgres psql -U postgres -d hi-events -c "SELECT 1"
```

### Migrations failed

```bash
# Check migration status
docker-compose exec all-in-one php artisan migrate:status

# Rollback and retry
docker-compose exec all-in-one php artisan migrate:rollback
docker-compose exec all-in-one php artisan migrate
```

### Webhook not received

```bash
# Check webhook logs
docker-compose logs all-in-one | grep webhook

# Check if endpoint is accessible
curl -v http://localhost:8123/api/webhooks/xendit

# Verify Xendit Dashboard webhook configuration
# Settings → Webhooks → Test Webhook
```

## 🧹 Cleanup

### Stop containers

```bash
docker-compose down
```

### Remove volumes (WARNING: deletes data)

```bash
docker-compose down -v
```

### Remove images

```bash
docker-compose down --rmi all
```

## 📈 Production Deployment

For production, update:

1. **Environment Variables**
   - Use production Xendit keys
   - Set `APP_ENV=production`
   - Use strong database passwords
   - Configure proper email settings

2. **Security**
   - Enable HTTPS
   - Use environment-specific secrets
   - Configure firewall rules
   - Enable webhook signature validation

3. **Monitoring**
   - Setup logging aggregation
   - Configure alerts
   - Monitor payment success rates
   - Track webhook delivery

4. **Backup**
   - Configure database backups
   - Backup configuration files
   - Test restore procedures

## 📚 Additional Resources

- Docker Compose Docs: https://docs.docker.com/compose/
- Xendit API: https://xendit.io/docs
- Hi.Events Docs: https://hi.events/docs
- PostgreSQL: https://www.postgresql.org/docs/
- Redis: https://redis.io/documentation

## ✅ Deployment Checklist

- [ ] Xendit credentials obtained
- [ ] `.env` file configured
- [ ] Docker & Docker Compose installed
- [ ] Containers started successfully
- [ ] Migrations ran without errors
- [ ] Application accessible at http://localhost:8123
- [ ] Webhook configured in Xendit Dashboard
- [ ] Test payment flow completed
- [ ] Logs checked for errors
- [ ] Database verified

---

**Status**: Ready for deployment! 🚀

**Last Updated**: 2025-12-02
