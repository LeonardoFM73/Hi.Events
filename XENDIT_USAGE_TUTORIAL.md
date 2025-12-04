# Tutorial Penggunaan Xendit Payment Gateway

## 📋 Daftar Isi
1. [Setup Awal](#setup-awal)
2. [Konfigurasi Event](#konfigurasi-event)
3. [Testing Payment Flow](#testing-payment-flow)
4. [Monitoring & Troubleshooting](#monitoring--troubleshooting)

---

## Setup Awal

### 1. Buat Akun Xendit

1. Kunjungi https://xendit.co
2. Klik "Sign Up" dan buat akun
3. Verifikasi email Anda
4. Lengkapi data bisnis/organisasi

### 2. Dapatkan API Keys

1. Login ke Xendit Dashboard: https://dashboard.xendit.co
2. Navigasi ke **Settings → API Keys**
3. Copy **Secret API Key** (dimulai dengan `xnd_development_` atau `xnd_live_`)
4. Simpan di tempat aman

### 3. Setup Webhook Token

1. Di Xendit Dashboard, navigasi ke **Settings → Webhooks**
2. Copy **Webhook Token** atau buat token baru
3. Simpan token ini untuk konfigurasi

### 4. Konfigurasi Environment

Edit file `.env` di folder `docker/all-in-one/`:

```bash
# Xendit settings
XENDIT_API_KEY=xnd_development_xxxxx
XENDIT_WEBHOOK_TOKEN=webhook_token_xxxxx
```

Restart container:
```bash
podman-compose restart
```

---

## Konfigurasi Event

### Step 1: Enable Xendit di Event Settings

1. Login ke Hi.Events Admin Panel
2. Pilih event yang ingin menggunakan Xendit
3. Navigasi ke **Settings → Payment & Invoicing**
4. Di bagian **Payment Methods**, centang **Xendit**
5. Klik **Save**

![Payment Methods](./docs/xendit-payment-methods.png)

### Step 2: Konfigurasi Offline Payment (Optional)

Jika ingin menambahkan instruksi pembayaran offline:

1. Centang **Offline Payments** (opsional)
2. Isi **Offline Payment Instructions** dengan detail pembayaran alternatif
3. Klik **Save**

### Step 3: Setup Webhook di Xendit Dashboard

1. Login ke https://dashboard.xendit.co
2. Navigasi ke **Settings → Webhooks**
3. Klik **Add Webhook** atau **Edit** webhook yang ada
4. Isi konfigurasi:
   - **URL**: `https://your-domain.com/api/webhooks/xendit`
   - **Events**: Pilih:
     - ✅ `invoice.paid`
     - ✅ `invoice.expired`
     - ✅ `invoice.failed`
   - **Token**: Paste XENDIT_WEBHOOK_TOKEN
5. Klik **Save**

**Untuk Local Testing:**
- Gunakan ngrok untuk expose localhost: `ngrok http 8123`
- Update webhook URL dengan ngrok URL: `https://xxxxx.ngrok.io/api/webhooks/xendit`
- Test webhook dengan tombol "Test Webhook" di dashboard Xendit

---

## Testing Payment Flow

### Scenario 1: Test di Local Environment

#### 1. Buat Test Event

```bash
# Akses frontend
http://localhost:8123

# Login ke admin panel
# Buat event baru atau gunakan event yang sudah ada
```

#### 2. Buat Product/Ticket

1. Di event settings, navigasi ke **Tickets & Products**
2. Buat product baru dengan harga (contoh: IDR 100,000)
3. Simpan

#### 3. Create Test Order

1. Buka product page (public link)
2. Pilih ticket dan quantity
3. Klik **Continue to Checkout**
4. Isi data attendee
5. Di halaman **Payment**, pilih **Xendit**
6. Klik **Pay with Xendit**

#### 4. Simulasi Webhook (untuk local testing)

Karena local environment tidak bisa menerima webhook dari Xendit, simulasikan dengan:

```bash
# Simulasi invoice.paid webhook
curl -X POST http://localhost:8123/api/webhooks/xendit \
  -H "Content-Type: application/json" \
  -H "X-Xendit-Webhook-Token: webhook_token_xxxxx" \
  -d '{
    "event": "invoice.paid",
    "created": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "data": {
      "id": "inv_test_123",
      "external_id": "order_test_123",
      "user_id": "user_123",
      "status": "PAID",
      "merchant_name": "Hi Events",
      "merchant_profile_picture_url": null,
      "amount": 100000,
      "payer_email": "test@example.com",
      "description": "Test Invoice",
      "expiry_date": "'$(date -u -d '+1 day' +%Y-%m-%dT%H:%M:%SZ)'",
      "invoice_url": "https://xendit.co/web/invoices/inv_test_123",
      "paid_at": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
      "payment_method": "BANK_TRANSFER",
      "payment_channel": "BCA",
      "payment_details": {
        "bank_account_number": "1234567890",
        "bank_code": "BCA",
        "reference_id": "REF123"
      },
      "fees": {
        "xendit_fee": 5000,
        "value_added_tax": 500,
        "total": 5500
      },
      "currency": "IDR",
      "items": []
    }
  }'
```

#### 5. Verify Order Status

```bash
# Check order status
curl http://localhost:8123/api/events/1/order/ORDER_SHORT_ID

# Expected response:
# {
#   "status": "COMPLETED",
#   "payment_status": "PAYMENT_RECEIVED",
#   ...
# }
```

### Scenario 2: Test di Production

#### 1. Setup Production Keys

1. Login ke Xendit Dashboard
2. Switch ke **Live Mode** (bukan Development)
3. Copy **Live Secret API Key** (dimulai dengan `xnd_live_`)
4. Update `.env`:
   ```bash
   XENDIT_API_KEY=xnd_live_xxxxx
   XENDIT_WEBHOOK_TOKEN=live_webhook_token_xxxxx
   ```

#### 2. Setup Production Webhook

1. Di Xendit Dashboard, navigasi ke **Settings → Webhooks**
2. Konfigurasi webhook untuk production domain:
   - **URL**: `https://yourdomain.com/api/webhooks/xendit`
   - **Events**: invoice.paid, invoice.expired, invoice.failed
   - **Token**: Live webhook token

#### 3. Test dengan Real Payment

1. Buat order di production
2. Pilih Xendit sebagai payment method
3. Klik **Pay with Xendit**
4. Akan redirect ke Xendit invoice page
5. Pilih payment method (Bank Transfer, E-wallet, QRIS, Credit Card)
6. Lakukan pembayaran
7. Setelah pembayaran sukses, akan redirect kembali ke order confirmation page

---

## Monitoring & Troubleshooting

### 1. Check Payment Status

#### Via Admin Panel

1. Login ke Hi.Events Admin
2. Navigasi ke **Orders**
3. Cari order yang menggunakan Xendit
4. Lihat status payment di detail order

#### Via Database

```bash
# Connect ke database
podman exec all-in-one_postgres_1 psql -U postgres -d hi-events

# Query xendit_payments
SELECT * FROM xendit_payments WHERE order_id = 123;

# Query orders
SELECT id, status, payment_status FROM orders WHERE id = 123;

# Query attendees
SELECT id, status FROM attendees WHERE order_id = 123;
```

### 2. Check Webhook Logs

```bash
# View container logs
podman-compose logs -f all-in-one | grep -i xendit

# View webhook logs in database
podman exec all-in-one_postgres_1 psql -U postgres -d hi-events -c \
  "SELECT * FROM webhook_logs WHERE event_type LIKE '%xendit%' ORDER BY created_at DESC LIMIT 10;"
```

### 3. Verify Xendit Dashboard

1. Login ke https://dashboard.xendit.co
2. Navigasi ke **Invoices**
3. Cari invoice dengan external_id yang sesuai dengan order
4. Lihat status dan detail pembayaran

### 4. Common Issues & Solutions

#### Issue: "Invoice creation failed"

**Cause**: API key tidak valid atau tidak ada koneksi ke Xendit

**Solution**:
```bash
# Verify API key di .env
cat docker/all-in-one/.env | grep XENDIT_API_KEY

# Test API key dengan curl
curl -X GET https://api.xendit.co/invoices \
  -H "Authorization: Basic $(echo -n 'xnd_development_xxxxx:' | base64)"

# Restart container
podman-compose restart
```

#### Issue: "Webhook not received"

**Cause**: Webhook URL tidak accessible atau token tidak match

**Solution**:
```bash
# Verify webhook endpoint
curl -v http://localhost:8123/api/webhooks/xendit

# Check webhook token di .env
cat docker/all-in-one/.env | grep XENDIT_WEBHOOK_TOKEN

# Test webhook manually
curl -X POST http://localhost:8123/api/webhooks/xendit \
  -H "Content-Type: application/json" \
  -H "X-Xendit-Webhook-Token: your_token" \
  -d '{"event": "invoice.paid", "data": {...}}'

# Check logs
podman-compose logs all-in-one | grep webhook
```

#### Issue: "Order status not updated after payment"

**Cause**: Webhook tidak diproses atau event handler error

**Solution**:
```bash
# Check webhook logs
podman exec all-in-one_postgres_1 psql -U postgres -d hi-events -c \
  "SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 5;"

# Check application logs
podman-compose logs all-in-one | tail -100

# Manually trigger webhook (for testing)
curl -X POST http://localhost:8123/api/webhooks/xendit \
  -H "Content-Type: application/json" \
  -H "X-Xendit-Webhook-Token: your_token" \
  -d '{
    "event": "invoice.paid",
    "data": {
      "id": "inv_xxx",
      "external_id": "order_xxx",
      "status": "PAID",
      "amount": 100000
    }
  }'
```

#### Issue: "Payment method tidak muncul di checkout"

**Cause**: Xendit belum di-enable di event settings

**Solution**:
1. Login ke admin panel
2. Pilih event
3. Navigasi ke **Settings → Payment & Invoicing**
4. Centang **Xendit**
5. Klik **Save**
6. Refresh checkout page

---

## Payment Methods Supported by Xendit

### Indonesia Payment Methods:

1. **Bank Transfer** (Virtual Account)
   - BCA, BNI, Mandiri, Permata, CIMB Niaga, DBS, Maybank, OCBC NISP

2. **E-Wallets**
   - OVO, Dana, LinkAja, AstraPay

3. **QRIS** (QR Code)
   - Semua bank dan e-wallet yang support QRIS

4. **Credit Card**
   - Visa, Mastercard, JCB

5. **Buy Now Pay Later (BNPL)**
   - Kredivo, Akulaku, Atome

---

## Best Practices

### 1. Security

- ✅ Gunakan live keys di production
- ✅ Jangan share API keys
- ✅ Validate webhook signature (sudah implemented)
- ✅ Use HTTPS untuk webhook URL

### 2. Testing

- ✅ Test dengan development keys dulu
- ✅ Simulasikan semua payment scenarios
- ✅ Test webhook delivery
- ✅ Verify order status updates

### 3. Monitoring

- ✅ Monitor webhook delivery
- ✅ Check payment success rate
- ✅ Alert untuk failed payments
- ✅ Regular backup database

### 4. User Experience

- ✅ Provide clear payment instructions
- ✅ Show payment status clearly
- ✅ Send confirmation emails
- ✅ Allow payment retry

---

## Support & Resources

- **Xendit Documentation**: https://xendit.io/docs
- **Xendit API Reference**: https://xendit.io/api-reference
- **Hi.Events Documentation**: https://hi.events/docs
- **Xendit Support**: https://xendit.co/contact

---

## Checklist untuk Go Live

- [ ] Xendit account created dan verified
- [ ] Live API keys obtained
- [ ] Webhook configured di Xendit Dashboard
- [ ] Environment variables updated
- [ ] Event settings configured dengan Xendit enabled
- [ ] Test payment flow completed
- [ ] Webhook delivery verified
- [ ] Order status updates working
- [ ] Email notifications working
- [ ] Database backups configured
- [ ] Monitoring alerts setup
- [ ] Support contact information available

---

**Status**: ✅ Ready for Production!

**Last Updated**: 2025-12-02
