# Xendit Integration - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Get Xendit Credentials
1. Go to https://dashboard.xendit.co
2. Sign up or login
3. Navigate to **Settings → API Keys**
4. Copy your **Secret API Key**
5. Navigate to **Settings → Webhooks**
6. Copy your **Webhook Token**

### Step 2: Configure Environment
```bash
# Edit .env file
XENDIT_API_KEY=xnd_development_xxxxx
XENDIT_WEBHOOK_TOKEN=webhook_token_xxxxx
```

### Step 3: Run Migrations
```bash
php artisan migrate
```

### Step 4: Setup Webhook
1. In Xendit Dashboard, go to **Settings → Webhooks**
2. Click **Add Webhook**
3. Enter URL: `https://your-domain.com/api/webhooks/xendit`
4. Select Events:
   - ✅ invoice.paid
   - ✅ invoice.expired
   - ✅ invoice.failed
5. Click **Save**

### Step 5: Enable in Event
```php
// In event settings
$event->settings->payment_providers = ['STRIPE', 'XENDIT', 'OFFLINE'];
```

## ✅ Verification Checklist

- [ ] XENDIT_API_KEY set in .env
- [ ] XENDIT_WEBHOOK_TOKEN set in .env
- [ ] Database migrations ran successfully
- [ ] Webhook configured in Xendit Dashboard
- [ ] Event has XENDIT in payment_providers
- [ ] Frontend shows Xendit payment option

## 🧪 Test Payment Flow

### 1. Create Test Order
```bash
curl -X POST http://localhost/api/events/1/order \
  -H "Content-Type: application/json" \
  -d '{
    "products": [{"product_id": 1, "quantities": [{"price_id": 1, "quantity": 1}]}],
    "promo_code": null
  }'
```

### 2. Create Xendit Invoice
```bash
curl -X POST http://localhost/api/events/1/order/{order_short_id}/xendit/invoice
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

### 3. Simulate Payment Webhook (for testing)
```bash
curl -X POST http://localhost/api/webhooks/xendit \
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

### 4. Verify Order Status
```bash
curl http://localhost/api/events/1/order/{order_short_id}
```

Expected: `"status": "COMPLETED"`, `"payment_status": "PAYMENT_RECEIVED"`

## 🐳 Docker Deployment

### Build
```bash
docker build -f Dockerfile.all-in-one -t hi-events:xendit .
```

### Run
```bash
docker run -d \
  -p 80:80 \
  -e XENDIT_API_KEY=xnd_development_xxxxx \
  -e XENDIT_WEBHOOK_TOKEN=webhook_token_xxxxx \
  -e DB_HOST=pgsql \
  -e DB_DATABASE=backend \
  -e DB_USERNAME=username \
  -e DB_PASSWORD=password \
  hi-events:xendit
```

### Migrate
```bash
docker exec <container_id> php artisan migrate
```

## 📱 Frontend Integration

The frontend automatically detects Xendit when enabled:

1. **Payment Method Selection**: Xendit appears in payment method tabs
2. **Invoice Creation**: Clicking "Pay" creates Xendit invoice
3. **Redirect**: User redirected to Xendit payment page
4. **Confirmation**: After payment, webhook updates order status

## 🔍 Debugging

### Check Logs
```bash
# Backend logs
tail -f storage/logs/laravel.log

# Webhook logs
grep "xendit" storage/logs/laravel.log
```

### Database Check
```bash
# Check xendit_payments table
SELECT * FROM xendit_payments;

# Check order status
SELECT id, status, payment_status FROM orders WHERE id = ?;
```

### Webhook Test
```bash
# In Xendit Dashboard
Settings → Webhooks → Your Webhook → Test Webhook
```

## 🆘 Common Issues

### Issue: "XENDIT_API_KEY not set"
**Solution**: Add to .env and restart application
```bash
XENDIT_API_KEY=your_key_here
```

### Issue: Webhook not received
**Solution**: 
1. Verify webhook URL in Xendit Dashboard
2. Check firewall allows incoming requests
3. Verify webhook token matches
4. Check application logs for errors

### Issue: Payment status not updating
**Solution**:
1. Check xendit_payments table for record
2. Verify webhook was received (check logs)
3. Check order status in database
4. Verify attendees table updated

### Issue: Duplicate payments
**Solution**:
1. Check external_id uniqueness
2. Verify idempotency handling
3. Check database constraints

## 📊 Monitoring

### Key Metrics
- Invoice creation success rate
- Payment confirmation time
- Webhook delivery success rate
- Error rate

### Queries
```sql
-- Payment success rate
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END) as paid,
  ROUND(100.0 * SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM xendit_payments;

-- Recent payments
SELECT * FROM xendit_payments ORDER BY created_at DESC LIMIT 10;

-- Failed payments
SELECT * FROM xendit_payments WHERE status IN ('EXPIRED', 'FAILED');
```

## 🔐 Security Checklist

- [ ] API key stored in .env (not in code)
- [ ] Webhook token stored in .env
- [ ] HTTPS enabled for webhook endpoint
- [ ] Database credentials secured
- [ ] Logs don't contain sensitive data
- [ ] Regular backups configured
- [ ] Access logs monitored

## 📚 Resources

- **Full Setup Guide**: See `XENDIT_SETUP.md`
- **Implementation Details**: See `XENDIT_IMPLEMENTATION_SUMMARY.md`
- **Xendit API Docs**: https://xendit.io/docs
- **GitHub Issues**: https://github.com/HiEventsDev/hi.events/issues

## 🎯 Next Steps

1. ✅ Setup credentials
2. ✅ Configure webhook
3. ✅ Run migrations
4. ✅ Test payment flow
5. ⏭️ Deploy to production
6. ⏭️ Monitor payments
7. ⏭️ Optimize based on metrics

## 💡 Tips

- Use Xendit Sandbox for testing
- Test all payment methods (bank, e-wallet, QRIS)
- Monitor webhook delivery in Xendit Dashboard
- Set up alerts for payment failures
- Regular backup of xendit_payments table
- Document any customizations

## 🆘 Support

- **Xendit Support**: support@xendit.co
- **Hi.Events Issues**: https://github.com/HiEventsDev/hi.events/issues
- **Community**: https://github.com/HiEventsDev/hi.events/discussions

---

**Ready to go!** 🚀

For detailed information, see `XENDIT_SETUP.md`
