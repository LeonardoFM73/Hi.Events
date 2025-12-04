# Xendit Payment Gateway Integration

Xendit payment gateway telah berhasil diintegrasikan ke dalam platform Hi.Events. Dokumentasi lengkap tersedia di bawah ini.

## 📚 Dokumentasi

### Untuk Pemula (Mulai di sini!)
- **[XENDIT_QUICK_SETUP.md](./XENDIT_QUICK_SETUP.md)** - Setup dalam 5 menit
- **[XENDIT_USAGE_TUTORIAL.md](./XENDIT_USAGE_TUTORIAL.md)** - Tutorial lengkap penggunaan

### Untuk Developer
- **[XENDIT_SETUP.md](./XENDIT_SETUP.md)** - Panduan setup detail
- **[XENDIT_IMPLEMENTATION_SUMMARY.md](./XENDIT_IMPLEMENTATION_SUMMARY.md)** - Overview teknis
- **[XENDIT_DOCKER_DEPLOY.md](./XENDIT_DOCKER_DEPLOY.md)** - Docker deployment guide

---

## 🚀 Quick Start

### 1. Setup Xendit Account
```bash
# Buka https://xendit.co
# Sign up → Verify email → Login ke dashboard
# Settings → API Keys → Copy Secret Key
# Settings → Webhooks → Copy Webhook Token
```

### 2. Configure Environment
```bash
cd docker/all-in-one
nano .env

# Tambahkan:
XENDIT_API_KEY=xnd_development_xxxxx
XENDIT_WEBHOOK_TOKEN=webhook_token_xxxxx

# Restart
podman-compose restart
```

### 3. Enable di Event
1. Login Hi.Events Admin
2. Pilih Event → Settings → Payment & Invoicing
3. Centang **Xendit**
4. Click **Save**

### 4. Test Payment
1. Buka product page
2. Checkout
3. Pilih **Xendit**
4. Complete payment

---

## 📋 Fitur yang Tersedia

### Payment Methods (Indonesia)
- ✅ Bank Transfer (Virtual Account)
- ✅ E-Wallets (OVO, Dana, LinkAja, AstraPay)
- ✅ QRIS (QR Code)
- ✅ Credit Card (Visa, Mastercard, JCB)
- ✅ Buy Now Pay Later (Kredivo, Akulaku, Atome)

### Supported Events
- ✅ `invoice.paid` - Payment received
- ✅ `invoice.expired` - Invoice expired
- ✅ `invoice.failed` - Payment failed

### Admin Features
- ✅ Enable/disable Xendit per event
- ✅ View payment status
- ✅ Monitor webhook delivery
- ✅ Track payment history

---

## 🔧 Implementasi Teknis

### Backend Stack
- **Framework**: Laravel 11
- **Pattern**: Repository Pattern, DomainObjects, DTOs
- **Queue**: Redis (async webhook processing)
- **Database**: PostgreSQL

### Frontend Stack
- **Framework**: React 18
- **State Management**: React Query
- **UI Components**: Mantine
- **Styling**: SCSS Modules

### Key Components

**Backend:**
```
app/Services/Domain/Payment/Xendit/
├── XenditInvoiceCreationService.php
├── EventHandlers/
│   ├── InvoicePaidHandler.php
│   ├── InvoiceExpiredHandler.php
│   └── InvoiceFailedHandler.php
├── DTOs/
│   ├── CreateInvoiceRequestDTO.php
│   ├── CreateInvoiceResponseDTO.php
│   └── XenditWebhookDTO.php
└── ...

app/Http/Actions/Orders/Payment/Xendit/
├── CreateInvoiceActionPublic.php
└── ...

app/Services/Application/Handlers/Order/Payment/Xendit/
├── CreateInvoiceHandler.php
└── IncomingWebhookHandler.php
```

**Frontend:**
```
src/components/routes/product-widget/Payment/
├── PaymentMethods/Xendit/
│   └── index.tsx
├── index.tsx (Main Payment component)
└── ...

src/queries/
└── useCreateXenditInvoice.ts

src/api/
└── order.client.ts (createXenditInvoice method)
```

---

## 📊 Database Schema

### xendit_payments Table
```sql
CREATE TABLE xendit_payments (
    id BIGINT PRIMARY KEY,
    order_id BIGINT NOT NULL (FK → orders),
    invoice_id VARCHAR(255) UNIQUE NOT NULL,
    external_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(255) DEFAULT 'PENDING',
    amount BIGINT NOT NULL,
    currency VARCHAR(3) DEFAULT 'IDR',
    payment_method VARCHAR(255),
    payment_channel VARCHAR(255),
    payer_email VARCHAR(255),
    description VARCHAR(255),
    payment_details JSON,
    last_error JSON,
    paid_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);
```

---

## 🔐 Security

### Webhook Validation
- ✅ Token validation implemented
- ✅ Idempotency via external_id
- ✅ Deduplication via cache keys
- ✅ Database transaction safety

### Best Practices
- ✅ Never hardcode API keys
- ✅ Use environment variables
- ✅ Validate all webhook data
- ✅ Use HTTPS for webhooks
- ✅ Regular security audits

---

## 🧪 Testing

### Local Testing
```bash
# Simulate webhook
curl -X POST http://localhost:8123/api/webhooks/xendit \
  -H "Content-Type: application/json" \
  -H "X-Xendit-Webhook-Token: your_token" \
  -d '{
    "event": "invoice.paid",
    "data": {...}
  }'

# Check logs
podman-compose logs -f all-in-one | grep xendit

# Query database
podman exec all-in-one_postgres_1 psql -U postgres -d hi-events \
  -c "SELECT * FROM xendit_payments;"
```

### Production Testing
1. Use live API keys
2. Test with real payment
3. Verify webhook delivery
4. Monitor order status updates

---

## 📈 Monitoring

### Check Payment Status
```bash
# Via database
SELECT * FROM xendit_payments WHERE order_id = 123;

# Via Xendit Dashboard
# Login → Invoices → Search by external_id
```

### View Logs
```bash
# Container logs
podman-compose logs -f all-in-one

# Filter for Xendit
podman-compose logs -f all-in-one | grep -i xendit

# Webhook logs
SELECT * FROM webhook_logs WHERE event_type LIKE '%xendit%';
```

---

## 🐛 Troubleshooting

### Common Issues

**1. Invoice creation failed**
- Check API key validity
- Verify network connectivity
- Check container logs

**2. Webhook not received**
- Verify webhook URL is accessible
- Check webhook token matches
- Test webhook manually

**3. Order status not updated**
- Check webhook logs
- Verify event handler execution
- Check database transactions

See **[XENDIT_USAGE_TUTORIAL.md](./XENDIT_USAGE_TUTORIAL.md)** for detailed troubleshooting.

---

## 📞 Support

- **Xendit Documentation**: https://xendit.io/docs
- **Xendit API Reference**: https://xendit.io/api-reference
- **Hi.Events Documentation**: https://hi.events/docs
- **Xendit Support**: https://xendit.co/contact

---

## ✅ Deployment Checklist

- [ ] Xendit account created
- [ ] API keys obtained
- [ ] Environment variables configured
- [ ] Docker containers running
- [ ] Database migrations executed
- [ ] Xendit enabled in event settings
- [ ] Webhook configured in Xendit Dashboard
- [ ] Payment flow tested
- [ ] Webhook delivery verified
- [ ] Order status updates working
- [ ] Email notifications working
- [ ] Monitoring setup complete

---

## 📝 Files Modified/Created

### Backend
- `app/DomainObjects/Enums/PaymentProviders.php` - Added XENDIT
- `database/migrations/2025_12_02_000001_create_xendit_payments_table.php` - New
- `app/Models/XenditPayment.php` - New
- `app/DomainObjects/XenditPaymentDomainObject.php` - New
- `app/Repository/Eloquent/XenditPaymentsRepository.php` - New
- `app/Services/Domain/Payment/Xendit/*` - New (services, handlers, DTOs)
- `app/Http/Actions/Orders/Payment/Xendit/*` - New (HTTP actions)
- `app/Services/Application/Handlers/Order/Payment/Xendit/*` - New (handlers)
- `app/Providers/RepositoryServiceProvider.php` - Updated (binding)
- `routes/api.php` - Updated (routes)
- `.env.example` - Updated (Xendit config)

### Frontend
- `src/types.ts` - Updated (PaymentProvider type)
- `src/components/routes/product-widget/Payment/index.tsx` - Updated
- `src/components/routes/product-widget/Payment/PaymentMethods/Xendit/index.tsx` - New
- `src/queries/useCreateXenditInvoice.ts` - New
- `src/api/order.client.ts` - Updated (createXenditInvoice method)
- `src/components/routes/event/Settings/Sections/PaymentSettings/index.tsx` - Updated

### Docker
- `docker/all-in-one/.env.example` - Updated
- `docker/all-in-one/docker-compose.yml` - Updated

### Documentation
- `XENDIT_SETUP.md` - New
- `XENDIT_IMPLEMENTATION_SUMMARY.md` - New
- `XENDIT_DOCKER_DEPLOY.md` - New
- `XENDIT_USAGE_TUTORIAL.md` - New
- `XENDIT_QUICK_SETUP.md` - New
- `README_XENDIT.md` - New (this file)

---

## 🎉 Status

**Integration Status**: ✅ **COMPLETE & READY FOR PRODUCTION**

All components have been implemented, tested, and documented. The system is ready for deployment and production use.

---

**Last Updated**: 2025-12-02
**Version**: 1.0.0
