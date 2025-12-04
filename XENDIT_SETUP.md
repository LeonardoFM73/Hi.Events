# Xendit Payment Gateway Integration - Hi.Events

## Overview

Xendit integration untuk hi.events memungkinkan event organizer di Indonesia untuk menerima pembayaran melalui berbagai metode pembayaran populer di Indonesia, termasuk:

- Bank Transfer (Virtual Account)
- E-wallet (GoPay, OVO, Dana, LinkAja)
- QRIS
- Kartu Kredit

## Architecture

### Backend Structure

```
app/
├── DomainObjects/
│   ├── XenditPaymentDomainObject.php
│   └── Generated/XenditPaymentDomainObjectAbstract.php
├── Models/
│   └── XenditPayment.php
├── Repository/
│   ├── Eloquent/XenditPaymentsRepository.php
│   └── Interfaces/XenditPaymentsRepositoryInterface.php
├── Services/
│   ├── Domain/Payment/Xendit/
│   │   ├── XenditInvoiceCreationService.php
│   │   ├── DTOs/
│   │   │   ├── CreateInvoiceRequestDTO.php
│   │   │   ├── CreateInvoiceResponseDTO.php
│   │   │   └── XenditWebhookDTO.php
│   │   └── EventHandlers/
│   │       └── InvoicePaidHandler.php
│   └── Application/Handlers/Order/Payment/Xendit/
│       ├── CreateInvoiceHandler.php
│       └── IncomingWebhookHandler.php
├── Http/Actions/
│   ├── Orders/Payment/Xendit/CreateInvoiceActionPublic.php
│   └── Common/Webhooks/XenditIncomingWebhookAction.php
└── Exceptions/Xendit/
    └── CreateInvoiceFailedException.php
```

### Frontend Structure

```
src/
├── components/routes/product-widget/Payment/
│   ├── PaymentMethods/Xendit/index.tsx
│   └── index.tsx (updated)
├── queries/
│   └── useCreateXenditInvoice.ts
└── api/
    └── order.client.ts (updated)
```

## Setup Instructions

### 1. Environment Configuration

Update `.env` file dengan Xendit credentials:

```bash
XENDIT_API_KEY=your_xendit_api_key
XENDIT_WEBHOOK_TOKEN=your_xendit_webhook_token
```

Dapatkan credentials dari [Xendit Dashboard](https://dashboard.xendit.co):
1. Login ke Xendit Dashboard
2. Navigasi ke Settings > API Keys
3. Copy Secret API Key dan Webhook Token

### 2. Database Migration

Jalankan migration untuk membuat `xendit_payments` table:

```bash
php artisan migrate
```

Migration akan membuat tabel dengan struktur:
- `id` - Primary key
- `order_id` - Foreign key ke orders table
- `invoice_id` - Xendit invoice ID
- `external_id` - Unique identifier untuk idempotency
- `status` - Payment status (PENDING, PAID, EXPIRED, FAILED)
- `amount` - Payment amount dalam minor unit
- `currency` - Currency code (default: IDR)
- `payment_method` - Payment method type
- `payment_channel` - Specific payment channel
- `payer_email` - Customer email
- `description` - Invoice description
- `payment_details` - JSON payload dari Xendit
- `last_error` - Error details jika ada
- `paid_at` - Timestamp ketika payment berhasil
- `timestamps` - created_at, updated_at
- `soft_deletes` - deleted_at

### 3. Enable Xendit Payment Provider

Di event settings, tambahkan `XENDIT` ke payment providers:

```php
// Event settings configuration
$eventSettings->payment_providers = ['STRIPE', 'XENDIT', 'OFFLINE'];
```

### 4. Webhook Configuration

Setup webhook di Xendit Dashboard:

1. Login ke Xendit Dashboard
2. Navigasi ke Settings > Webhooks
3. Tambahkan webhook endpoint:
   - **URL**: `https://your-domain.com/api/webhooks/xendit`
   - **Events**: Pilih `invoice.paid`, `invoice.expired`, `invoice.failed`
   - **Token**: Gunakan `XENDIT_WEBHOOK_TOKEN` dari .env

### 5. API Endpoints

#### Create Invoice
```
POST /api/events/{event_id}/order/{order_short_id}/xendit/invoice
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

#### Webhook Handler
```
POST /api/webhooks/xendit
```

Xendit akan mengirim webhook ke endpoint ini untuk notifikasi payment status.

## Payment Flow

### 1. Customer Initiates Payment
```
Customer selects Xendit payment method
↓
Frontend calls POST /api/events/{event_id}/order/{order_short_id}/xendit/invoice
↓
Backend creates XenditPayment record dengan status PENDING
↓
Returns invoice_url ke frontend
```

### 2. Customer Completes Payment
```
Customer redirected ke Xendit payment page
↓
Customer memilih payment method (bank transfer, e-wallet, dll)
↓
Customer completes payment
↓
Xendit sends webhook notification ke /api/webhooks/xendit
```

### 3. Payment Confirmation
```
Backend receives webhook dengan status PAID
↓
InvoicePaidHandler processes payment
↓
Order status updated to COMPLETED
↓
Payment status updated to PAYMENT_RECEIVED
↓
Attendees status updated to ACTIVE
↓
Email confirmation sent to customer
```

## Key Features

### 1. Idempotency
- Setiap payment request menggunakan unique `external_id`
- Prevents duplicate payments jika request diretry

### 2. Webhook Validation
- Signature validation untuk memastikan webhook dari Xendit
- Cache-based deduplication untuk prevent double processing

### 3. Error Handling
- Comprehensive error logging
- Graceful fallback untuk payment failures
- User-friendly error messages

### 4. Database Transactions
- Atomic operations untuk payment processing
- Rollback jika ada error
- Maintains data consistency

### 5. Multi-Currency Support
- Support untuk berbagai mata uang
- Automatic currency conversion
- Tax calculation per region

## Testing

### Local Testing dengan Xendit Sandbox

1. Setup Xendit Sandbox account di [Xendit Sandbox](https://dashboard.xendit.co/sandbox)

2. Update .env dengan sandbox credentials:
```bash
XENDIT_API_KEY=xnd_development_xxx
XENDIT_WEBHOOK_TOKEN=webhook_token_xxx
```

3. Test payment flow:
```bash
# Create order
POST /api/events/1/order
{
  "products": [{"product_id": 1, "quantities": [{"price_id": 1, "quantity": 1}]}],
  "promo_code": null
}

# Create Xendit invoice
POST /api/events/1/order/{order_short_id}/xendit/invoice

# Simulate webhook
POST /api/webhooks/xendit
{
  "event_type": "invoice.paid",
  "data": {
    "id": "invoice_id",
    "external_id": "order_xxx_timestamp",
    "status": "PAID",
    "amount": 100000,
    "paid_at": "2025-12-02T10:00:00Z"
  }
}
```

## Docker All-in-One Deployment

### Build Docker Image

```bash
docker build -f Dockerfile.all-in-one -t hi-events:latest .
```

### Run Container

```bash
docker run -d \
  -p 80:80 \
  -e APP_ENV=local \
  -e APP_KEY=base64:xxx \
  -e DB_HOST=pgsql \
  -e DB_DATABASE=backend \
  -e DB_USERNAME=username \
  -e DB_PASSWORD=password \
  -e XENDIT_API_KEY=xnd_development_xxx \
  -e XENDIT_WEBHOOK_TOKEN=webhook_token_xxx \
  hi-events:latest
```

### Database Setup

```bash
# Run migrations
docker exec hi-events php artisan migrate

# Seed data (optional)
docker exec hi-events php artisan db:seed
```

## Troubleshooting

### 1. Webhook Not Received
- Verify webhook URL di Xendit Dashboard
- Check firewall/network settings
- Enable webhook logging di Xendit Dashboard

### 2. Payment Status Not Updated
- Check database xendit_payments table
- Verify webhook signature validation
- Check application logs untuk errors

### 3. Invoice Creation Failed
- Verify XENDIT_API_KEY di .env
- Check order status (harus RESERVED)
- Verify order belum expired

### 4. Duplicate Payments
- Check external_id uniqueness
- Verify idempotency key handling
- Check database constraints

## Security Considerations

### 1. API Key Management
- Store API keys di environment variables
- Never commit .env ke git
- Rotate keys regularly

### 2. Webhook Validation
- Implement signature verification
- Validate webhook token
- Use HTTPS untuk webhook endpoint

### 3. Data Protection
- Encrypt sensitive payment data
- Implement PCI DSS compliance
- Regular security audits

### 4. Rate Limiting
- Implement rate limiting untuk API endpoints
- Prevent brute force attacks
- Monitor suspicious activities

## Future Enhancements

1. **Installment Payments**: Support cicilan untuk tiket high-value
2. **Recurring Payments**: Automatic billing untuk subscription events
3. **Split Payments**: Revenue sharing untuk multi-organizer events
4. **Advanced Analytics**: Payment analytics dashboard
5. **Refund Management**: Automated refund processing
6. **Multi-Currency**: Real-time currency conversion

## Support

Untuk bantuan:
- Xendit Documentation: https://xendit.io/docs
- Hi.Events GitHub: https://github.com/HiEventsDev/hi.events
- Community Forum: https://github.com/HiEventsDev/hi.events/discussions

## References

- [Xendit API Documentation](https://xendit.io/docs)
- [Xendit Invoice API](https://xendit.io/docs/api-reference#create-invoice)
- [Xendit Webhook Documentation](https://xendit.io/docs/webhooks)
