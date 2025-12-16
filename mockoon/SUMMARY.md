# 📦 Xendit Mock API - Summary

## ✅ Yang Sudah Dibuat

### 1. Konfigurasi Mockoon
- ✅ `mockoon/xendit-mock.json` - Konfigurasi lengkap Mockoon dengan 4 endpoints
- ✅ `mockoon/Dockerfile` - Dockerfile untuk custom Mockoon image
- ✅ `mockoon/docker-compose.yml` - Standalone docker-compose untuk Mockoon

### 2. Dokumentasi
- ✅ `mockoon/README.md` - Dokumentasi utama dengan usage dan examples
- ✅ `mockoon/SETUP_GUIDE.md` - Panduan setup lengkap dengan troubleshooting
- ✅ `mockoon/.env.example` - Contoh environment variables

### 3. Testing Scripts
- ✅ `mockoon/test-api.sh` - Bash script untuk testing (Linux/Mac)
- ✅ `mockoon/test-api.ps1` - PowerShell script untuk testing (Windows)

### 4. Integrasi Docker
- ✅ Updated `docker/all-in-one/docker-compose.yml` - Menambahkan service Mockoon
- ✅ Updated `backend/config/services.php` - Menambahkan base_url config
- ✅ Updated `XenditInvoiceCreationService.php` - Menggunakan configurable base URL

## 🎯 Endpoints yang Tersedia

### 1. POST /v2/invoices
Membuat invoice baru dengan response yang sesuai dengan Xendit API.

**Features:**
- Dynamic invoice ID generation
- Support untuk items, customer, dan fees
- Response lengkap dengan payment methods (banks, e-wallets, retail outlets)
- Invoice URL mengarah ke mock payment page

### 2. GET /v2/invoices/:invoice_id
Mendapatkan detail invoice berdasarkan ID.

### 3. POST /invoices/:invoice_id/expire
Expire invoice yang sudah dibuat.

### 4. GET /mock-payment/:payment_id
Halaman HTML interaktif untuk simulasi pembayaran.

**Features:**
- UI yang menarik dengan gradient background
- Tombol untuk simulate successful payment
- Tombol untuk simulate failed payment
- Real-time status update

## 🚀 Cara Menggunakan

### Quick Start (Recommended)

```bash
# 1. Set environment variables di .env
XENDIT_BASE_URL=http://mockoon:3000
XENDIT_API_KEY=test_api_key
XENDIT_WEBHOOK_TOKEN=test_webhook_token

# 2. Jalankan dengan docker-compose
cd docker/all-in-one
docker-compose up -d

# 3. Test API
cd ../../mockoon
./test-api.sh  # Linux/Mac
# atau
.\test-api.ps1  # Windows
```

### Standalone Mockoon

```bash
cd mockoon
docker-compose up -d
```

## 🔧 Konfigurasi

### Environment Variables

```env
# Required
XENDIT_API_KEY=test_api_key
XENDIT_WEBHOOK_TOKEN=test_webhook_token

# Base URL
XENDIT_BASE_URL=http://mockoon:3000  # Docker
# atau
XENDIT_BASE_URL=http://localhost:3000  # Local
# atau
XENDIT_BASE_URL=https://api.xendit.co  # Production
```

### Port Configuration

Default: `3000`

Untuk mengubah port, edit `docker-compose.yml`:
```yaml
mockoon:
  ports:
    - "3001:3000"  # host:container
```

## 📊 Response Examples

### Create Invoice Success Response

```json
{
  "id": "generated-uuid",
  "external_id": "order_123_test",
  "status": "PENDING",
  "merchant_name": "Hi.Events",
  "amount": 100000,
  "payer_email": "customer@example.com",
  "description": "Event: Test Event - Order: ABC123",
  "invoice_url": "http://localhost:3000/mock-payment/generated-uuid",
  "available_banks": [
    {
      "bank_code": "BCA",
      "collection_type": "POOL",
      "transfer_amount": 100000
    },
    {
      "bank_code": "BNI",
      "collection_type": "POOL",
      "transfer_amount": 100000
    },
    {
      "bank_code": "MANDIRI",
      "collection_type": "POOL",
      "transfer_amount": 100000
    }
  ],
  "available_ewallets": [
    {"ewallet_type": "OVO"},
    {"ewallet_type": "DANA"},
    {"ewallet_type": "LINKAJA"},
    {"ewallet_type": "SHOPEEPAY"}
  ],
  "available_retail_outlets": [
    {"retail_outlet_name": "ALFAMART"},
    {"retail_outlet_name": "INDOMARET"}
  ],
  "available_qr_codes": [
    {"qr_code_type": "QRIS"}
  ],
  "currency": "IDR",
  "created": "2025-12-16T09:51:51.000Z",
  "updated": "2025-12-16T09:51:51.000Z"
}
```

## 🧪 Testing

### Automated Testing

```bash
# Windows
cd mockoon
.\test-api.ps1

# Linux/Mac
cd mockoon
chmod +x test-api.sh
./test-api.sh
```

### Manual Testing

```bash
# Create Invoice
curl -X POST http://localhost:3000/v2/invoices \
  -H "Content-Type: application/json" \
  -u test_api_key: \
  -d '{
    "external_id": "order_test_123",
    "amount": 100000,
    "payer_email": "test@example.com",
    "description": "Test payment",
    "currency": "IDR",
    "items": [{"name": "Ticket", "quantity": 1, "price": 100000}],
    "customer": {"given_names": "John Doe", "email": "test@example.com"}
  }'

# Get Invoice
curl http://localhost:3000/v2/invoices/{invoice_id} \
  -u test_api_key:

# Expire Invoice
curl -X POST http://localhost:3000/invoices/{invoice_id}/expire \
  -u test_api_key:

# Payment Page (Browser)
http://localhost:3000/mock-payment/{payment_id}
```

## 🔄 Integration Flow

```
Hi.Events Backend → Mockoon API
       ↓                  ↓
Create Invoice    Return invoice_url
       ↓                  ↓
Redirect User → Mock Payment Page
       ↓                  ↓
User Clicks   → Simulate Payment
```

## 🐛 Common Issues & Solutions

### Issue: Cannot connect to Mockoon from backend

**Solution:** Use service name in Docker network
```env
XENDIT_BASE_URL=http://mockoon:3000  # ✅
XENDIT_BASE_URL=http://localhost:3000  # ❌
```

### Issue: Port 3000 already in use

**Solution:** Change host port in docker-compose.yml
```yaml
ports:
  - "3001:3000"
```

### Issue: Mock API not responding

**Solution:** Check logs and restart
```bash
docker-compose logs mockoon
docker-compose restart mockoon
```

## 📝 Files Structure

```
mockoon/
├── xendit-mock.json          # Mockoon configuration
├── Dockerfile                # Custom Mockoon image
├── docker-compose.yml        # Standalone compose file
├── README.md                 # Main documentation
├── SETUP_GUIDE.md           # Setup guide
├── SUMMARY.md               # This file
├── .env.example             # Environment variables example
├── test-api.sh              # Bash test script
└── test-api.ps1             # PowerShell test script
```

## 🎯 Next Steps

### Planned Enhancements

1. **Webhook Simulation**
   - Auto-trigger webhook ke backend setelah payment simulation
   - Support untuk berbagai payment status

2. **More Payment Methods**
   - Virtual Account details
   - E-wallet redirect URLs
   - QR Code generation

3. **Data Persistence**
   - Mockoon databucket untuk menyimpan invoices
   - Query invoices by external_id

4. **Advanced Features**
   - Payment expiration simulation
   - Partial payment support
   - Refund simulation

## 🔐 Security Notes

**⚠️ PENTING:**
- Mock API ini HANYA untuk development/testing
- JANGAN gunakan di production
- Pastikan `XENDIT_BASE_URL` di-set ke `https://api.xendit.co` untuk production
- Mock API menerima semua API key (tidak ada validasi)

## 📚 Resources

- [Mockoon Documentation](https://mockoon.com/docs/latest/about/)
- [Mockoon CLI](https://mockoon.com/cli/)
- [Xendit API Reference](https://developers.xendit.co/api-reference/)
- [Xendit Invoice API](https://developers.xendit.co/api-reference/#create-invoice)

## 💡 Tips

1. **Use test scripts** untuk quick testing
2. **Monitor logs** untuk debugging
3. **Use payment page** untuk visual testing
4. **Keep mock config updated** sesuai dengan Xendit API changes

## 🤝 Contributing

Untuk menambahkan fitur atau fix bugs:
1. Update `xendit-mock.json`
2. Update dokumentasi
3. Test dengan test scripts
4. Create pull request

---

**Created by:** Antigravity AI
**Date:** 2025-12-16
**Version:** 1.0.0

**Happy Testing! 🎉**
