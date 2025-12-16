# 🚀 Setup Guide: Integrasi Xendit Mock API dengan Hi.Events

Panduan lengkap untuk mengintegrasikan Xendit Mock API dengan aplikasi Hi.Events.

## 📋 Prerequisites

- Docker dan Docker Compose terinstall
- Hi.Events sudah ter-setup (backend & frontend)
- Port 3000 tersedia untuk Mockoon

## 🔧 Step-by-Step Setup

### 1. Setup Environment Variables

Edit file `.env` di root project Hi.Events:

```env
# Xendit Configuration
XENDIT_API_KEY=test_api_key
XENDIT_WEBHOOK_TOKEN=test_webhook_token
XENDIT_BASE_URL=http://mockoon:3000
```

**Catatan:**
- Untuk testing lokal tanpa Docker, gunakan `http://localhost:3000`
- Untuk production, gunakan `https://api.xendit.co`

### 2. Jalankan Mockoon dengan All-in-One

```bash
cd docker/all-in-one
docker-compose up -d
```

Ini akan menjalankan:
- ✅ PostgreSQL
- ✅ Redis
- ✅ Hi.Events (Backend + Frontend)
- ✅ Mockoon (Xendit Mock API)

### 3. Verifikasi Mockoon Berjalan

```bash
# Cek status container
docker-compose ps

# Cek logs Mockoon
docker-compose logs mockoon

# Test endpoint
curl http://localhost:3000/v2/invoices
```

### 4. Test dari Hi.Events Backend

Buat order dan coba create invoice melalui API Hi.Events:

```bash
# Contoh request ke Hi.Events untuk create invoice
curl -X POST http://localhost:8123/api/events/{event_id}/order/{order_short_id}/xendit/invoice \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 100000,
    "currency": "IDR"
  }'
```

### 5. Test Payment Flow

1. **Create Invoice** - Hi.Events akan call Mockoon API
2. **Get Invoice URL** - Response akan berisi `invoice_url`
3. **Open Payment Page** - Buka URL di browser
4. **Simulate Payment** - Klik tombol "Simulate Successful Payment"

## 🧪 Testing

### Automated Testing

**Windows:**
```powershell
cd mockoon
.\test-api.ps1
```

**Linux/Mac:**
```bash
cd mockoon
chmod +x test-api.sh
./test-api.sh
```

### Manual Testing

1. **Test Create Invoice:**
```bash
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
```

2. **Test Payment Page:**
```
http://localhost:3000/mock-payment/test-payment-id
```

## 🔄 Workflow Integration

### Payment Flow dengan Mock API

```
User → Hi.Events Frontend → Hi.Events Backend → Mockoon API
                                                      ↓
                                            Create Invoice Response
                                                      ↓
                                              invoice_url returned
                                                      ↓
User redirected to → http://localhost:3000/mock-payment/{id}
                                                      ↓
                                    User clicks "Simulate Payment"
                                                      ↓
                              (In production: Webhook sent to backend)
```

### Webhook Simulation (Future Enhancement)

Untuk mensimulasikan webhook callback:

```bash
curl -X POST http://localhost:8123/api/webhooks/xendit \
  -H "Content-Type: application/json" \
  -d '{
    "id": "invoice_id_here",
    "external_id": "order_123",
    "status": "PAID",
    "amount": 100000,
    "paid_amount": 100000,
    "currency": "IDR",
    "payment_channel": "BCA",
    "payment_method": "BANK_TRANSFER"
  }'
```

## 🐛 Troubleshooting

### Issue: Mockoon tidak bisa diakses dari backend

**Solusi:**
Pastikan menggunakan nama service Docker, bukan localhost:
```env
XENDIT_BASE_URL=http://mockoon:3000  # ✅ Correct
XENDIT_BASE_URL=http://localhost:3000  # ❌ Wrong (dalam Docker network)
```

### Issue: Port 3000 sudah digunakan

**Solusi:**
Edit `docker/all-in-one/docker-compose.yml`:
```yaml
mockoon:
  ports:
    - "3001:3000"  # Ubah port host ke 3001
```

Kemudian update `.env`:
```env
XENDIT_BASE_URL=http://mockoon:3000  # Port container tetap 3000
```

### Issue: Invoice creation failed

**Cek logs:**
```bash
# Cek logs backend
docker-compose logs all-in-one

# Cek logs mockoon
docker-compose logs mockoon
```

**Verifikasi konfigurasi:**
```bash
# Masuk ke container backend
docker-compose exec all-in-one sh

# Cek environment variable
env | grep XENDIT
```

### Issue: Mock API tidak merespons

**Restart Mockoon:**
```bash
docker-compose restart mockoon
```

**Rebuild jika perlu:**
```bash
docker-compose down
docker-compose up -d --build
```

## 📊 Monitoring

### Check Mockoon Health

```bash
# Health check
curl http://localhost:3000/v2/invoices

# Docker health status
docker inspect xendit-mockoon | grep -A 10 Health
```

### View Logs

```bash
# Real-time logs
docker-compose logs -f mockoon

# Last 100 lines
docker-compose logs --tail=100 mockoon
```

## 🔐 Security Notes

**⚠️ PENTING:**
- Mock API ini HANYA untuk development/testing
- JANGAN gunakan di production
- Pastikan `XENDIT_BASE_URL` di-set ke `https://api.xendit.co` untuk production

## 🎯 Next Steps

1. ✅ Setup Mockoon - **DONE**
2. ✅ Test basic endpoints - **DONE**
3. ⏳ Implement webhook simulation
4. ⏳ Add more payment methods (VA, E-wallet, etc.)
5. ⏳ Add data persistence with Mockoon databucket

## 📚 Resources

- [Mockoon Documentation](https://mockoon.com/docs/latest/about/)
- [Xendit API Reference](https://developers.xendit.co/api-reference/)
- [Hi.Events Documentation](../README.md)

## 💡 Tips

1. **Gunakan test scripts** untuk automated testing
2. **Monitor logs** untuk debugging
3. **Gunakan payment page** untuk visual testing
4. **Simpan response** untuk reference

## 🤝 Contributing

Jika menemukan bug atau ingin menambahkan fitur:
1. Buat issue di GitHub
2. Fork repository
3. Buat pull request

---

**Happy Testing! 🎉**
